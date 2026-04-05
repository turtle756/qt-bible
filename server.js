require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Railway runs behind a reverse proxy
app.set('trust proxy', 1);

// ============================================================
// Security
// ============================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "*.googleusercontent.com"],
      connectSrc: ["'self'", "bolls.life"],
      frameSrc: ["accounts.google.com"],
    },
  },
}));

// API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15분
  max: 200,                   // IP당 200 요청
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Auth rate limiting (더 엄격)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
});
app.use('/auth/', authLimiter);

// ============================================================
// PostgreSQL
// ============================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      google_id VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255),
      name VARCHAR(255),
      avatar VARCHAR(500),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      book_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      note_date DATE NOT NULL,
      content TEXT,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, book_id, chapter, note_date)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS highlights (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      book_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      color VARCHAR(20) DEFAULT 'yellow',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, book_id, chapter, verse)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qt_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      log_date DATE NOT NULL,
      book_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, log_date)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reading_plans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plan_type VARCHAR(50) NOT NULL,
      start_date DATE NOT NULL,
      current_day INTEGER DEFAULT 1,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, plan_type)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reading_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plan_type VARCHAR(50) NOT NULL,
      day_num INTEGER NOT NULL,
      completed_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, plan_type, day_num)
    );
  `);
  // Community / Groups
  await pool.query(`
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      invite_code VARCHAR(20) UNIQUE NOT NULL,
      owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS group_members (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(group_id, user_id)
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shared_notes (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      book_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      content TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS note_reactions (
      id SERIAL PRIMARY KEY,
      note_id INTEGER REFERENCES shared_notes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      emoji VARCHAR(10) DEFAULT 'pray',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(note_id, user_id)
    );
  `);
  // Onboarding profiles
  await pool.query(`
    CREATE TABLE IF NOT EXISTS onboarding_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      maturity_level VARCHAR(20) NOT NULL,
      total_score INTEGER NOT NULL,
      motivation VARCHAR(50),
      selected_topics TEXT[],
      daily_amount VARCHAR(20) DEFAULT 'one_chapter',
      parallel_reading BOOLEAN DEFAULT TRUE,
      completed_at TIMESTAMP DEFAULT NOW()
    );
  `);
  // V2 Onboarding profiles
  await pool.query(`
    CREATE TABLE IF NOT EXISTS onboarding_v2 (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      nickname VARCHAR(50) NOT NULL,
      maturity_level VARCHAR(20) NOT NULL DEFAULT 'exploring',
      age_group VARCHAR(10),
      marriage_status VARCHAR(20),
      has_children BOOLEAN,
      job_status VARCHAR(20),
      attends_church BOOLEAN,
      temperament_completed BOOLEAN DEFAULT FALSE,
      completed_at TIMESTAMP DEFAULT NOW()
    );
  `);
  // Custom QT plans
  await pool.query(`
    CREATE TABLE IF NOT EXISTS custom_plans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plan_name VARCHAR(200) NOT NULL,
      topic VARCHAR(100) NOT NULL,
      duration INTEGER NOT NULL,
      plan_data JSONB NOT NULL,
      current_day INTEGER DEFAULT 1,
      started_at TIMESTAMP DEFAULT NOW(),
      completed BOOLEAN DEFAULT FALSE
    );
  `);
  // Topic progress tracking
  await pool.query(`
    CREATE TABLE IF NOT EXISTS topic_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      plan_id INTEGER REFERENCES custom_plans(id) ON DELETE CASCADE,
      day_num INTEGER NOT NULL,
      completed_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, plan_id, day_num)
    );
  `);
  // Anonymous sharing feed
  await pool.query(`
    CREATE TABLE IF NOT EXISTS shared_feed (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL DEFAULT 'devotion',
      content TEXT NOT NULL,
      passage VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS feed_reactions (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES shared_feed(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) DEFAULT 'pray',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(post_id, user_id)
    );
  `);
  // ========== V2: 개인화 스코어링 테이블 ==========
  // 사용자 영적 프로필 (63개 소프트 태그 JSONB)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_spiritual_profile (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      maturity_level VARCHAR(20) NOT NULL DEFAULT 'exploring',
      temperament JSONB NOT NULL DEFAULT '{}',
      emotion JSONB NOT NULL DEFAULT '{}',
      pressure JSONB NOT NULL DEFAULT '{}',
      theme_interest JSONB NOT NULL DEFAULT '{}',
      mood_pref JSONB NOT NULL DEFAULT '{}',
      has_crisis BOOLEAN DEFAULT FALSE,
      total_qt_days INTEGER DEFAULT 0,
      streak_current INTEGER DEFAULT 0,
      streak_best INTEGER DEFAULT 0,
      last_qt_date DATE,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  // QT 히스토리 (매일 조립된 QT 구성 + 사용자 반응)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qt_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      qt_date DATE NOT NULL,
      passage_ref VARCHAR(100),
      topic_id INTEGER,
      commentary_day INTEGER,
      maturity_used VARCHAR(20),
      time_spent_seconds INTEGER,
      note_written BOOLEAN DEFAULT FALSE,
      note_length INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      mood_checkin JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, qt_date)
    );
  `);
  // 최근 노출 추적 (반복 방지 하드 필터)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recently_shown (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      block_type VARCHAR(20) NOT NULL,
      passage_ref VARCHAR(100) NOT NULL,
      topic_id INTEGER,
      shown_date DATE NOT NULL
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_recently_shown_user_date
    ON recently_shown(user_id, shown_date);
  `);
  // 성경 페리코페 메타 (본문 태깅)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bible_passages (
      id SERIAL PRIMARY KEY,
      passage_ref VARCHAR(100) NOT NULL UNIQUE,
      book_name VARCHAR(20) NOT NULL,
      book_id INTEGER NOT NULL,
      chapter INTEGER NOT NULL,
      verse_start INTEGER NOT NULL,
      verse_end INTEGER,
      testament VARCHAR(2) NOT NULL,
      genre VARCHAR(10) NOT NULL,
      soft_tags JSONB NOT NULL DEFAULT '{}',
      source_topics INTEGER[]
    );
  `);
  // 질문 카드 노출 히스토리
  await pool.query(`
    CREATE TABLE IF NOT EXISTS card_shown_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      card_id VARCHAR(20) NOT NULL,
      shown_date DATE NOT NULL,
      selected BOOLEAN DEFAULT FALSE,
      UNIQUE(user_id, card_id, shown_date)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_card_shown_user_date
    ON card_shown_history(user_id, shown_date);
  `);
  console.log('DB tables ready (V1 + V2)');
}

// ============================================================
// Session
// ============================================================
app.use(session({
  secret: process.env.SESSION_SECRET || (() => { console.warn('WARNING: Using default session secret. Set SESSION_SECRET env var!'); return 'qt-bible-secret-change-me'; })(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
}));

// ============================================================
// Passport - Google OAuth
// ============================================================
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL || '/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const result = await pool.query(
        `INSERT INTO users (google_id, email, name, avatar)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (google_id)
         DO UPDATE SET email = $2, name = $3, avatar = $4
         RETURNING *`,
        [profile.id, profile.emails?.[0]?.value, profile.displayName, profile.photos?.[0]?.value]
      );
      done(null, result.rows[0]);
    } catch (err) {
      done(err, null);
    }
  }));
}

// ============================================================
// Middleware
// ============================================================
app.use(express.json({ limit: '100kb' }));

// Static files (login page accessible without auth)
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// Auth Routes
// ============================================================
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html?error=auth_failed' }),
  (req, res) => res.redirect('/')
);

// Debug: check env on startup
console.log('GOOGLE_CLIENT_ID set:', !!process.env.GOOGLE_CLIENT_ID);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('CALLBACK_URL:', process.env.CALLBACK_URL);

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/login.html');
  });
});

app.get('/api/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      loggedIn: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
      },
    });
  } else {
    res.json({ loggedIn: false });
  }
});

// ============================================================
// Auth middleware for all /api routes below
// ============================================================
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Login required' });
}

// ============================================================
// Account deletion
// ============================================================
app.delete('/api/account', requireAuth, async (req, res) => {
  try {
    // CASCADE will delete notes, highlights, qt_log
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    req.logout(() => {
      res.json({ success: true });
    });
  } catch (err) {
    console.error('Account delete error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ============================================================
// Notes API
// ============================================================
app.post('/api/notes', requireAuth, async (req, res) => {
  const { bookId, chapter, date, content } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO notes (user_id, book_id, chapter, note_date, content, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, book_id, chapter, note_date)
       DO UPDATE SET content = $5, updated_at = NOW()
       RETURNING *`,
      [req.user.id, bookId, chapter, date, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Save note error:', err);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

app.get('/api/notes/:bookId/:chapter/:date', requireAuth, async (req, res) => {
  const { bookId, chapter, date } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 AND book_id = $2 AND chapter = $3 AND note_date = $4',
      [req.user.id, bookId, chapter, date]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get note' });
  }
});

app.get('/api/notes', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 ORDER BY note_date DESC, updated_at DESC LIMIT 100',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list notes' });
  }
});

// ============================================================
// Highlights API
// ============================================================
app.post('/api/highlights', requireAuth, async (req, res) => {
  const { bookId, chapter, verse, color } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO highlights (user_id, book_id, chapter, verse, color)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, book_id, chapter, verse)
       DO UPDATE SET color = $5
       RETURNING *`,
      [req.user.id, bookId, chapter, verse, color || 'yellow']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save highlight' });
  }
});

app.delete('/api/highlights/:bookId/:chapter/:verse', requireAuth, async (req, res) => {
  const { bookId, chapter, verse } = req.params;
  try {
    await pool.query(
      'DELETE FROM highlights WHERE user_id = $1 AND book_id = $2 AND chapter = $3 AND verse = $4',
      [req.user.id, bookId, chapter, verse]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove highlight' });
  }
});

app.get('/api/highlights/:bookId/:chapter', requireAuth, async (req, res) => {
  const { bookId, chapter } = req.params;
  try {
    const result = await pool.query(
      'SELECT verse, color FROM highlights WHERE user_id = $1 AND book_id = $2 AND chapter = $3',
      [req.user.id, bookId, chapter]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get highlights' });
  }
});

// ============================================================
// QT Calendar / Log API
// ============================================================
app.post('/api/qt-log', requireAuth, async (req, res) => {
  const { date, bookId, chapter } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO qt_log (user_id, log_date, book_id, chapter)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, log_date)
       DO UPDATE SET book_id = $3, chapter = $4
       RETURNING *`,
      [req.user.id, date, bookId, chapter]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log QT' });
  }
});

app.get('/api/qt-log', requireAuth, async (req, res) => {
  const { year, month } = req.query;
  try {
    const result = await pool.query(
      `SELECT log_date, book_id, chapter FROM qt_log
       WHERE user_id = $1 AND EXTRACT(YEAR FROM log_date) = $2 AND EXTRACT(MONTH FROM log_date) = $3
       ORDER BY log_date`,
      [req.user.id, year || new Date().getFullYear(), month || new Date().getMonth() + 1]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get QT log' });
  }
});

// ============================================================
// Reading Plans API
// ============================================================

// Start or get a reading plan
app.post('/api/plans', requireAuth, async (req, res) => {
  const { planType } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO reading_plans (user_id, plan_type, start_date)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, plan_type) DO NOTHING
       RETURNING *`,
      [req.user.id, planType]
    );
    if (result.rows.length === 0) {
      const existing = await pool.query(
        'SELECT * FROM reading_plans WHERE user_id = $1 AND plan_type = $2',
        [req.user.id, planType]
      );
      res.json(existing.rows[0]);
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to start plan' });
  }
});

// Get user's active plans
app.get('/api/plans', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reading_plans WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

// Mark a day as completed
app.post('/api/plans/progress', requireAuth, async (req, res) => {
  const { planType, dayNum } = req.body;
  try {
    await pool.query(
      `INSERT INTO reading_progress (user_id, plan_type, day_num)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, plan_type, day_num) DO NOTHING`,
      [req.user.id, planType, dayNum]
    );
    // Update current_day in plan
    await pool.query(
      `UPDATE reading_plans SET current_day = GREATEST(current_day, $3 + 1)
       WHERE user_id = $1 AND plan_type = $2`,
      [req.user.id, planType, dayNum]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Get progress for a plan
app.get('/api/plans/progress/:planType', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT day_num FROM reading_progress WHERE user_id = $1 AND plan_type = $2 ORDER BY day_num',
      [req.user.id, req.params.planType]
    );
    res.json(result.rows.map(r => r.day_num));
  } catch (err) {
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Delete a plan
app.delete('/api/plans/:planType', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM reading_progress WHERE user_id = $1 AND plan_type = $2', [req.user.id, req.params.planType]);
    await pool.query('DELETE FROM reading_plans WHERE user_id = $1 AND plan_type = $2', [req.user.id, req.params.planType]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// ============================================================
// Community / Groups API
// ============================================================

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create group
app.post('/api/groups', requireAuth, async (req, res) => {
  const { name } = req.body;
  const code = generateCode();
  try {
    const result = await pool.query(
      'INSERT INTO groups (name, invite_code, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, code, req.user.id]
    );
    const group = result.rows[0];
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, req.user.id]
    );
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Join group by invite code
app.post('/api/groups/join', requireAuth, async (req, res) => {
  const { code } = req.body;
  try {
    const g = await pool.query('SELECT * FROM groups WHERE invite_code = $1', [code.toUpperCase()]);
    if (g.rows.length === 0) return res.status(404).json({ error: 'Group not found' });
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [g.rows[0].id, req.user.id]
    );
    res.json(g.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// My groups
app.get('/api/groups', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT g.*, (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups g JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1 ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get groups' });
  }
});

// Share note to group
app.post('/api/groups/:groupId/share', requireAuth, async (req, res) => {
  const { bookId, chapter, content } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO shared_notes (group_id, user_id, book_id, chapter, content) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.params.groupId, req.user.id, bookId, chapter, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to share note' });
  }
});

// Get group feed
app.get('/api/groups/:groupId/feed', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sn.*, u.name as user_name, u.avatar as user_avatar,
        (SELECT COUNT(*) FROM note_reactions WHERE note_id = sn.id) as reaction_count,
        (SELECT emoji FROM note_reactions WHERE note_id = sn.id AND user_id = $2) as my_reaction
       FROM shared_notes sn JOIN users u ON sn.user_id = u.id
       WHERE sn.group_id = $1
       ORDER BY sn.created_at DESC LIMIT 50`,
      [req.params.groupId, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// React to a shared note
app.post('/api/reactions/:noteId', requireAuth, async (req, res) => {
  const { emoji } = req.body;
  try {
    await pool.query(
      `INSERT INTO note_reactions (note_id, user_id, emoji) VALUES ($1, $2, $3)
       ON CONFLICT (note_id, user_id) DO UPDATE SET emoji = $3`,
      [req.params.noteId, req.user.id, emoji || 'pray']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to react' });
  }
});

// Leave group
app.delete('/api/groups/:groupId/leave', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [req.params.groupId, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

// ============================================================
// Onboarding & Personalized QT API
// ============================================================

// Save onboarding result
app.post('/api/onboarding', requireAuth, async (req, res) => {
  const { maturityLevel, totalScore, motivation, selectedTopics, dailyAmount, parallelReading } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO onboarding_profiles (user_id, maturity_level, total_score, motivation, selected_topics, daily_amount, parallel_reading)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id)
       DO UPDATE SET maturity_level = $2, total_score = $3, motivation = $4, selected_topics = $5, daily_amount = $6, parallel_reading = $7, completed_at = NOW()
       RETURNING *`,
      [req.user.id, maturityLevel, totalScore, motivation, selectedTopics || [], dailyAmount || 'one_chapter', parallelReading !== false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Onboarding save error:', err);
    res.status(500).json({ error: 'Failed to save onboarding' });
  }
});

// Get onboarding profile
app.get('/api/onboarding', requireAuth, async (req, res) => {
  try {
    // V2 온보딩 우선 확인
    const v2 = await pool.query(
      'SELECT * FROM onboarding_v2 WHERE user_id = $1', [req.user.id]
    );
    if (v2.rows[0]) return res.json(v2.rows[0]);

    // V1 폴백
    const result = await pool.query(
      'SELECT * FROM onboarding_profiles WHERE user_id = $1', [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get onboarding' });
  }
});

// Create a custom QT plan from topic
app.post('/api/custom-plans', requireAuth, async (req, res) => {
  const { planName, topic, duration, planData } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO custom_plans (user_id, plan_name, topic, duration, plan_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, planName, topic, duration, JSON.stringify(planData)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create plan error:', err);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Get user's custom plans
app.get('/api/custom-plans', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cp.*,
        (SELECT COUNT(*) FROM topic_progress WHERE plan_id = cp.id) as completed_days
       FROM custom_plans cp WHERE cp.user_id = $1 ORDER BY cp.started_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

// Mark a day completed in custom plan
app.post('/api/custom-plans/:planId/progress', requireAuth, async (req, res) => {
  const { dayNum } = req.body;
  try {
    await pool.query(
      `INSERT INTO topic_progress (user_id, plan_id, day_num)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, plan_id, day_num) DO NOTHING`,
      [req.user.id, req.params.planId, dayNum]
    );
    await pool.query(
      `UPDATE custom_plans SET current_day = GREATEST(current_day, $2 + 1)
       WHERE id = $1 AND user_id = $3`,
      [req.params.planId, dayNum, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Mark plan as completed
app.post('/api/custom-plans/:planId/complete', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE custom_plans SET completed = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.planId, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete plan' });
  }
});

// Get progress for a custom plan
app.get('/api/custom-plans/:planId/progress', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT day_num FROM topic_progress WHERE user_id = $1 AND plan_id = $2 ORDER BY day_num',
      [req.user.id, req.params.planId]
    );
    res.json(result.rows.map(r => r.day_num));
  } catch (err) {
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// Get today's QT based on active plan
app.get('/api/today-qt', requireAuth, async (req, res) => {
  try {
    const profile = await pool.query(
      'SELECT * FROM onboarding_profiles WHERE user_id = $1',
      [req.user.id]
    );
    const activePlan = await pool.query(
      `SELECT cp.*,
        (SELECT COUNT(*) FROM topic_progress WHERE plan_id = cp.id) as completed_days
       FROM custom_plans cp
       WHERE cp.user_id = $1 AND cp.completed = FALSE
       ORDER BY cp.started_at DESC LIMIT 1`,
      [req.user.id]
    );
    res.json({
      profile: profile.rows[0] || null,
      activePlan: activePlan.rows[0] || null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get today QT' });
  }
});

// (AI Devotional Helper removed — using pre-generated QT guide data instead)

// ============================================================
// ============================================================
// Sharing Feed API (anonymous)
// ============================================================

// Create post (devotion or prayer)
app.post('/api/feed', requireAuth, async (req, res) => {
  const { type, content, passage } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });
  if (!['devotion', 'prayer'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
  try {
    const result = await pool.query(
      'INSERT INTO shared_feed (user_id, type, content, passage) VALUES ($1, $2, $3, $4) RETURNING id, type, content, passage, created_at',
      [req.user.id, type, content.trim(), passage || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Feed post error:', err);
    res.status(500).json({ error: 'Failed to post' });
  }
});

// Get feed (anonymous - no user info returned)
app.get('/api/feed', requireAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  try {
    const result = await pool.query(
      `SELECT sf.id, sf.type, sf.content, sf.passage, sf.created_at,
        (sf.user_id = $1) as is_mine,
        (SELECT COUNT(*) FROM feed_reactions WHERE post_id = sf.id) as reaction_count,
        (SELECT type FROM feed_reactions WHERE post_id = sf.id AND user_id = $1) as my_reaction
       FROM shared_feed sf
       ORDER BY sf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// React to post (pray)
app.post('/api/feed/:postId/react', requireAuth, async (req, res) => {
  try {
    const existing = await pool.query(
      'SELECT id FROM feed_reactions WHERE post_id = $1 AND user_id = $2',
      [req.params.postId, req.user.id]
    );
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM feed_reactions WHERE post_id = $1 AND user_id = $2',
        [req.params.postId, req.user.id]);
    } else {
      await pool.query(
        'INSERT INTO feed_reactions (post_id, user_id, type) VALUES ($1, $2, $3)',
        [req.params.postId, req.user.id, 'pray']
      );
    }
    const count = await pool.query(
      'SELECT COUNT(*) as cnt FROM feed_reactions WHERE post_id = $1',
      [req.params.postId]
    );
    const myReaction = await pool.query(
      'SELECT type FROM feed_reactions WHERE post_id = $1 AND user_id = $2',
      [req.params.postId, req.user.id]
    );
    res.json({ count: parseInt(count.rows[0].cnt), reacted: myReaction.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to react' });
  }
});

// Delete own post
app.delete('/api/feed/:postId', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM shared_feed WHERE id = $1 AND user_id = $2',
      [req.params.postId, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ============================================================
// V2: 교회력 API
app.get('/api/v2/liturgical/today', (req, res) => {
  const today = new Date();
  const season = liturgical.getLiturgicalSeason(today);
  res.json({ date: today.toISOString().split('T')[0], ...season });
});

// V2: 온보딩 API
// Step 1~3: 개인정보 저장
app.post('/api/v2/onboarding', requireAuth, async (req, res) => {
  const { nickname, maturity_level, age_group, marriage_status, has_children, job_status, attends_church } = req.body;
  if (!nickname || !maturity_level) {
    return res.status(400).json({ error: 'nickname and maturity_level are required' });
  }
  try {
    // 온보딩 프로필 저장
    await pool.query(
      `INSERT INTO onboarding_v2 (user_id, nickname, maturity_level, age_group, marriage_status, has_children, job_status, attends_church)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         nickname = $2, maturity_level = $3, age_group = $4, marriage_status = $5,
         has_children = $6, job_status = $7, attends_church = $8, completed_at = NOW()`,
      [req.user.id, nickname, maturity_level, age_group || null, marriage_status || null,
       has_children ?? null, job_status || null, attends_church ?? null]
    );

    // user_spiritual_profile도 동시에 생성/업데이트
    const situationTags = {};
    if (marriage_status === 'married') situationTags.S01 = true;
    if (marriage_status === 'single') situationTags.S02 = true;
    if (marriage_status === 'dating') situationTags.S03 = true;
    if (marriage_status === 'divorced') situationTags.S04 = true;
    if (has_children) situationTags.S05 = true;
    if (job_status === 'employed') situationTags.S09 = true;
    if (job_status === 'student') situationTags.S10 = true;
    if (job_status === 'job_seeking') situationTags.S12 = true;
    if (job_status === 'retired') situationTags.S14 = true;
    if (job_status === 'self_employed') situationTags.S16 = true;

    await pool.query(
      `INSERT INTO user_spiritual_profile (user_id, maturity_level)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET maturity_level = $2, updated_at = NOW()`,
      [req.user.id, maturity_level]
    );

    res.json({ success: true, situation_tags: situationTags });
  } catch (err) {
    console.error('onboarding error:', err);
    res.status(500).json({ error: 'Failed to save onboarding' });
  }
});

// Step 4: 기질 검사 결과 저장
app.post('/api/v2/onboarding/temperament', requireAuth, async (req, res) => {
  const { answers } = req.body; // [{question_id: 1, score: 3}, ...]
  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'answers array required' });
  }
  try {
    const quizData = require('./public/data/temperament-quiz.json');

    // 기질별 합산
    const rawScores = {};
    for (const ans of answers) {
      const question = quizData.questions.find(q => q.id === ans.question_id);
      if (!question) continue;
      const pathway = question.pathway;
      rawScores[pathway] = (rawScores[pathway] || 0) + (ans.score || 0);
    }

    // 0~12 → 0~100 정규화
    const temperament = {};
    for (const key of ['T01','T02','T03','T04','T05','T06','T07','T08','T09']) {
      temperament[key] = Math.round(((rawScores[key] || 0) / 12) * 100);
    }

    const mood_pref = scoring.temperamentToMoodPref(temperament);

    await pool.query(
      `UPDATE user_spiritual_profile
       SET temperament = $1, mood_pref = $2, updated_at = NOW()
       WHERE user_id = $3`,
      [JSON.stringify(temperament), JSON.stringify(mood_pref), req.user.id]
    );

    await pool.query(
      `UPDATE onboarding_v2 SET temperament_completed = TRUE WHERE user_id = $1`,
      [req.user.id]
    );

    // 결과 반환 (상위 2개 기질)
    const sorted = Object.entries(temperament).sort((a,b) => b[1] - a[1]);
    const top2 = sorted.slice(0, 2).map(([key, val]) => ({
      tag: key,
      ...quizData.pathway_map[key],
      score: val
    }));

    res.json({ success: true, temperament, top_pathways: top2 });
  } catch (err) {
    console.error('temperament error:', err);
    res.status(500).json({ error: 'Failed to save temperament' });
  }
});

// 온보딩 상태 조회
app.get('/api/v2/onboarding', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM onboarding_v2 WHERE user_id = $1', [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.json({ completed: false });
    }
    res.json({ completed: true, ...result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get onboarding status' });
  }
});

// V2: 개인화 스코어링 API
// ============================================================
const scoring = require('./lib/scoring');
const liturgical = require('./lib/liturgical');

// 사용자 영적 프로필 조회/생성
app.get('/api/v2/profile', requireAuth, async (req, res) => {
  try {
    let result = await pool.query(
      'SELECT * FROM user_spiritual_profile WHERE user_id = $1', [req.user.id]
    );
    if (result.rows.length === 0) {
      // 프로필 없으면 기본값으로 생성
      result = await pool.query(
        `INSERT INTO user_spiritual_profile (user_id) VALUES ($1) RETURNING *`,
        [req.user.id]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// 프로필 업데이트 (온보딩/기질검사 완료 시)
app.post('/api/v2/profile', requireAuth, async (req, res) => {
  const { maturity_level, temperament, pressure } = req.body;
  try {
    const mood_pref = temperament ? scoring.temperamentToMoodPref(temperament) : {};
    const result = await pool.query(
      `INSERT INTO user_spiritual_profile (user_id, maturity_level, temperament, mood_pref, pressure, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         maturity_level = COALESCE($2, user_spiritual_profile.maturity_level),
         temperament = CASE WHEN $3::jsonb = '{}'::jsonb THEN user_spiritual_profile.temperament ELSE $3 END,
         mood_pref = CASE WHEN $4::jsonb = '{}'::jsonb THEN user_spiritual_profile.mood_pref ELSE $4 END,
         pressure = CASE WHEN $5::jsonb = '{}'::jsonb THEN user_spiritual_profile.pressure ELSE $5 END,
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, maturity_level || 'exploring',
       JSON.stringify(temperament || {}), JSON.stringify(mood_pref),
       JSON.stringify(pressure || {})]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 감정 체크인
app.post('/api/v2/mood-checkin', requireAuth, async (req, res) => {
  const { tags } = req.body; // {"E01": 90, "E07": 60}
  if (!tags || typeof tags !== 'object') {
    return res.status(400).json({ error: 'tags object required' });
  }
  try {
    const profile = await pool.query(
      'SELECT * FROM user_spiritual_profile WHERE user_id = $1', [req.user.id]
    );
    if (profile.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found. Complete onboarding first.' });
    }
    const current = profile.rows[0];
    const newEmotion = scoring.processMoodCheckin(current.emotion || {}, tags);
    await pool.query(
      'UPDATE user_spiritual_profile SET emotion = $1, updated_at = NOW() WHERE user_id = $2',
      [JSON.stringify(newEmotion), req.user.id]
    );
    res.json({ emotion: newEmotion });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process mood checkin' });
  }
});

// 오늘의 QT 조립 (핵심 API) — 독립 풀 기반 모듈형 조립
// 풀 로드 (서버 시작 시 1회, 메모리에 캐시)
const _pools = {};
function getPools() {
  if (_pools.loaded) return _pools;
  const fs = require('fs');
  const poolDir = path.join(__dirname, 'public', 'data', 'pools');
  _pools.commentary = JSON.parse(fs.readFileSync(path.join(poolDir, 'commentary-pool.json'), 'utf8'));
  _pools.question = JSON.parse(fs.readFileSync(path.join(poolDir, 'question-pool.json'), 'utf8'));
  _pools.prayer = JSON.parse(fs.readFileSync(path.join(poolDir, 'prayer-pool.json'), 'utf8'));
  _pools.keyword = JSON.parse(fs.readFileSync(path.join(poolDir, 'keyword-pool.json'), 'utf8'));
  // 본문 목록 (passage-seed)
  _pools.passages = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'data', 'bible-passages-seed.json'), 'utf8'));
  _pools.loaded = true;
  console.log(`Pools loaded: ${_pools.commentary.length} commentary, ${_pools.question.length} questions, ${_pools.prayer.length} prayers, ${_pools.keyword.length} keywords, ${_pools.passages.length} passages`);
  return _pools;
}

app.get('/api/v2/daily-qt', requireAuth, async (req, res) => {
  try {
    // 1. 프로필 로드 + 시간 감쇠
    let profileResult = await pool.query(
      'SELECT * FROM user_spiritual_profile WHERE user_id = $1', [req.user.id]
    );
    if (profileResult.rows.length === 0) {
      await pool.query('INSERT INTO user_spiritual_profile (user_id) VALUES ($1)', [req.user.id]);
      profileResult = await pool.query(
        'SELECT * FROM user_spiritual_profile WHERE user_id = $1', [req.user.id]
      );
    }
    const profile = profileResult.rows[0];
    const maturity = profile.maturity_level || 'exploring';

    const daysSince = profile.updated_at
      ? Math.floor((Date.now() - new Date(profile.updated_at).getTime()) / 86400000) : 0;
    if (daysSince >= 1) {
      profile.emotion = scoring.applyDecay(profile.emotion || {}, 0.7, daysSince);
      profile.pressure = scoring.applyDecay(profile.pressure || {}, 0.85, daysSince);
      profile.theme_interest = scoring.applyDecay(profile.theme_interest || {}, 0.95, daysSince);
      await pool.query(
        `UPDATE user_spiritual_profile SET emotion = $1, pressure = $2, theme_interest = $3, updated_at = NOW() WHERE user_id = $4`,
        [JSON.stringify(profile.emotion), JSON.stringify(profile.pressure),
         JSON.stringify(profile.theme_interest), req.user.id]
      );
    }

    // 2. 최근 노출 제외
    const recentResult = await pool.query(
      `SELECT passage_ref, block_type FROM recently_shown
       WHERE user_id = $1 AND shown_date > CURRENT_DATE - INTERVAL '7 days'`,
      [req.user.id]
    );
    const recentPassages = new Set(recentResult.rows.filter(r => r.block_type === 'passage').map(r => r.passage_ref));

    // 3. 풀 로드
    const pools = getPools();

    // 4. 본문 선택 (사용자 프로필 스코어링)
    const passageCandidates = pools.passages
      .filter(p => !recentPassages.has(p.passage_ref))
      .map(p => ({ ...p, score: scoring.scoreBlock(profile, p.soft_tags) }));

    const selectedPassage = scoring.selectFromCandidates(passageCandidates);
    if (!selectedPassage) {
      return res.status(404).json({ error: 'No suitable passage found' });
    }

    // 선택된 본문의 주요 TH 태그 추출 (주제 일관성 필터)
    const passageTH = Object.entries(selectedPassage.soft_tags || {})
      .filter(([k, v]) => k.startsWith('TH') && v >= 30)
      .map(([k]) => k);

    // 5. 해설 선택 — 본문 passage 일치 + 성숙도 필터 + 스코어링
    function selectSlot(poolItems, passageRef, passageTHKeys) {
      // 1순위: 같은 passage + 성숙도 허용
      let candidates = poolItems.filter(item =>
        item.passage_ref === passageRef &&
        (!item.allowed_maturity || item.allowed_maturity.includes(maturity))
      );

      // 2순위: 같은 passage (성숙도 무관)
      if (candidates.length === 0) {
        candidates = poolItems.filter(item => item.passage_ref === passageRef);
      }

      // 3순위: TH 태그 1개 이상 겹치는 것 + 성숙도 허용
      if (candidates.length === 0 && passageTHKeys.length > 0) {
        candidates = poolItems.filter(item => {
          if (item.allowed_maturity && !item.allowed_maturity.includes(maturity)) return false;
          const itemTH = Object.entries(item.soft_tags || {})
            .filter(([k, v]) => k.startsWith('TH') && v >= 30)
            .map(([k]) => k);
          return itemTH.some(t => passageTHKeys.includes(t));
        });
      }

      // 스코어링
      const scored = candidates.map(item => ({
        ...item,
        score: scoring.scoreBlock(profile, item.soft_tags)
      }));

      return scoring.selectFromCandidates(scored);
    }

    const selectedCommentary = selectSlot(pools.commentary, selectedPassage.passage_ref, passageTH);
    const selectedQuestion = selectSlot(pools.question, selectedPassage.passage_ref, passageTH);
    const selectedPrayer = selectSlot(pools.prayer, selectedPassage.passage_ref, passageTH);

    // 원어 해설 — 본문 일치만 (스코어링 불필요)
    const keywords = pools.keyword.filter(k => k.passage_ref === selectedPassage.passage_ref);
    const selectedKeyword = keywords.length > 0 ? keywords[0] : null;

    // 6. 노출 기록
    await pool.query(
      `INSERT INTO recently_shown (user_id, block_type, passage_ref, shown_date) VALUES ($1, 'passage', $2, CURRENT_DATE)`,
      [req.user.id, selectedPassage.passage_ref]
    );

    // 7. 오늘 이미 완료했는지 확인
    const todayHistory = await pool.query(
      'SELECT completed FROM qt_history WHERE user_id = $1 AND qt_date = CURRENT_DATE',
      [req.user.id]
    );
    const alreadyCompleted = todayHistory.rows[0]?.completed || false;

    // 8. 조립된 QT 응답
    res.json({
      date: new Date().toISOString().split('T')[0],
      already_completed: alreadyCompleted,
      maturity_level: maturity,
      // 슬롯 1: 본문
      passage: {
        ref: selectedPassage.passage_ref,
        book_name: selectedPassage.book_name,
        testament: selectedPassage.testament,
        genre: selectedPassage.genre,
        chapter: selectedPassage.chapter,
        verse_start: selectedPassage.verse_start,
        verse_end: selectedPassage.verse_end,
        score: selectedPassage.score
      },
      // 슬롯 2: 해설
      commentary: selectedCommentary ? {
        id: selectedCommentary.id,
        content: selectedCommentary.content,
        type: selectedCommentary.type,
        source_topic: selectedCommentary.source_topic,
        source_passage: selectedCommentary.passage_ref,
        score: selectedCommentary.score
      } : null,
      // 슬롯 3: 원어 해설
      keyword: selectedKeyword ? {
        content: selectedKeyword.content,
        source_topic: selectedKeyword.source_topic
      } : null,
      // 슬롯 4: 질문
      question: selectedQuestion ? {
        id: selectedQuestion.id,
        content: selectedQuestion.content,
        source_topic: selectedQuestion.source_topic,
        source_passage: selectedQuestion.passage_ref,
        score: selectedQuestion.score
      } : null,
      // 슬롯 5: 기도
      prayer: selectedPrayer ? {
        id: selectedPrayer.id,
        content: selectedPrayer.content,
        type: selectedPrayer.type,
        source_topic: selectedPrayer.source_topic,
        source_passage: selectedPrayer.passage_ref,
        score: selectedPrayer.score
      } : null
    });
  } catch (err) {
    console.error('daily-qt error:', err);
    res.status(500).json({ error: 'Failed to assemble daily QT' });
  }
});

// 매일 질문 카드 4개 추출
app.get('/api/v2/daily-cards', requireAuth, async (req, res) => {
  try {
    const profile = await pool.query(
      'SELECT * FROM user_spiritual_profile WHERE user_id = $1', [req.user.id]
    );
    if (profile.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // 최근 7일 노출된 카드 ID
    const recentResult = await pool.query(
      `SELECT DISTINCT card_id FROM card_shown_history
       WHERE user_id = $1 AND shown_date > CURRENT_DATE - INTERVAL '7 days'`,
      [req.user.id]
    );
    const recentIds = new Set(recentResult.rows.map(r => r.card_id));

    // 사용자 상황 (온보딩에서 설정된 것) — 간이 매핑
    const onboarding = await pool.query(
      'SELECT * FROM onboarding_profiles WHERE user_id = $1', [req.user.id]
    );
    const userSituation = {};
    // TODO: 실제 상황 태그 테이블로 교체

    const cardsData = require('./public/data/question-cards.json');
    const selected = scoring.selectDailyCards(
      profile.rows[0], cardsData.cards, recentIds, userSituation
    );

    // 노출 기록
    for (const s of selected) {
      await pool.query(
        `INSERT INTO card_shown_history (user_id, card_id, shown_date)
         VALUES ($1, $2, CURRENT_DATE) ON CONFLICT DO NOTHING`,
        [req.user.id, s.card.id]
      );
    }

    res.json(selected.map(s => ({
      id: s.card.id,
      text: s.card.text,
      category: s.card.category,
      fitScore: Math.round(s.fitScore),
      hasYesNo: !!(s.card.payload_yes && s.card.payload_no)
    })));
  } catch (err) {
    console.error('daily-cards error:', err);
    res.status(500).json({ error: 'Failed to get daily cards' });
  }
});

// 카드 선택 시 프로필 업데이트
app.post('/api/v2/card-response', requireAuth, async (req, res) => {
  const { card_id, response } = req.body; // response: "yes" | "no" | "select"
  if (!card_id) return res.status(400).json({ error: 'card_id required' });
  try {
    const cardsData = require('./public/data/question-cards.json');
    const card = cardsData.cards.find(c => c.id === card_id);
    if (!card) return res.status(404).json({ error: 'Card not found' });

    // Payload 결정 (yes/no 분기 또는 단일 payload)
    let payload;
    if (card.payload_yes && card.payload_no) {
      payload = response === 'yes' ? card.payload_yes : card.payload_no;
    } else {
      payload = card.payload;
    }
    if (!payload) return res.status(400).json({ error: 'No payload for this card' });

    const profile = await pool.query(
      'SELECT * FROM user_spiritual_profile WHERE user_id = $1', [req.user.id]
    );
    if (profile.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // 다중 Payload 적용
    const updated = scoring.applyCardPayload(profile.rows[0], payload);

    await pool.query(
      `UPDATE user_spiritual_profile
       SET emotion = $1, pressure = $2, theme_interest = $3, updated_at = NOW()
       WHERE user_id = $4`,
      [JSON.stringify(updated.emotion), JSON.stringify(updated.pressure),
       JSON.stringify(updated.theme_interest), req.user.id]
    );

    // 선택 기록
    await pool.query(
      `UPDATE card_shown_history SET selected = TRUE
       WHERE user_id = $1 AND card_id = $2 AND shown_date = CURRENT_DATE`,
      [req.user.id, card_id]
    );

    res.json({ success: true, updated });
  } catch (err) {
    console.error('card-response error:', err);
    res.status(500).json({ error: 'Failed to process card response' });
  }
});

// QT 완료 기록
app.post('/api/v2/qt-complete', requireAuth, async (req, res) => {
  const { passage_ref, topic_id, time_spent, note_length, mood_checkin } = req.body;
  try {
    await pool.query(
      `INSERT INTO qt_history (user_id, qt_date, passage_ref, topic_id, maturity_used, time_spent_seconds, note_written, note_length, completed, mood_checkin)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, TRUE, $8)
       ON CONFLICT (user_id, qt_date) DO UPDATE SET
         time_spent_seconds = $5, note_written = $6, note_length = $7, completed = TRUE, mood_checkin = $8`,
      [req.user.id, passage_ref, topic_id,
       (await pool.query('SELECT maturity_level FROM user_spiritual_profile WHERE user_id = $1', [req.user.id])).rows[0]?.maturity_level || 'exploring',
       time_spent || 0, (note_length || 0) > 0, note_length || 0,
       mood_checkin ? JSON.stringify(mood_checkin) : null]
    );

    // 주제 관심도 미세 축적
    if (topic_id) {
      const topicEntry = topicsDb?.[topic_id - 1];
      if (topicEntry?.soft_tags) {
        const profile = await pool.query(
          'SELECT theme_interest FROM user_spiritual_profile WHERE user_id = $1', [req.user.id]
        );
        const current = profile.rows[0]?.theme_interest || {};
        for (const [tag, val] of Object.entries(topicEntry.soft_tags)) {
          if (tag.startsWith('TH')) {
            current[tag] = Math.min(100, (current[tag] || 0) + Math.round(val * 0.05));
          }
        }
        await pool.query(
          'UPDATE user_spiritual_profile SET theme_interest = $1, total_qt_days = total_qt_days + 1, streak_current = streak_current + 1, last_qt_date = CURRENT_DATE, updated_at = NOW() WHERE user_id = $2',
          [JSON.stringify(current), req.user.id]
        );
      }
    }

    // 스트릭 최고 기록 갱신
    await pool.query(
      'UPDATE user_spiritual_profile SET streak_best = GREATEST(streak_best, streak_current) WHERE user_id = $1',
      [req.user.id]
    );

    // 스트릭 정보 반환
    const profile = await pool.query(
      'SELECT streak_current, streak_best, total_qt_days FROM user_spiritual_profile WHERE user_id = $1',
      [req.user.id]
    );
    const p = profile.rows[0] || {};
    res.json({
      success: true,
      streak_current: p.streak_current || 1,
      streak_best: p.streak_best || 1,
      total_qt_days: p.total_qt_days || 1,
    });
  } catch (err) {
    console.error('qt-complete error:', err);
    res.status(500).json({ error: 'Failed to record completion' });
  }
});

// ============================================================
// Clean URL routes
// ============================================================
app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'onboarding-v2.html'));
});

// ============================================================
// Fallback - serve index.html for SPA
// ============================================================
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// Start
// ============================================================
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`QT Bible server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('DB init failed:', err);
    app.listen(PORT, () => {
      console.log(`QT Bible server running on port ${PORT} (DB not connected)`);
    });
  });

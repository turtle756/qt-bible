require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Pool } = require('pg');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Railway runs behind a reverse proxy
app.set('trust proxy', 1);

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
  console.log('DB tables ready');
}

// ============================================================
// Session
// ============================================================
app.use(session({
  secret: process.env.SESSION_SECRET || 'qt-bible-secret-change-me',
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
app.use(express.json());

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
    const result = await pool.query(
      'SELECT * FROM onboarding_profiles WHERE user_id = $1',
      [req.user.id]
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

// ============================================================
// AI Devotional Helper
// ============================================================
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.post('/api/ai/devotional', requireAuth, async (req, res) => {
  if (!openai) return res.status(503).json({ error: 'AI not configured' });
  const { bookName, chapter, mode } = req.body;
  // mode: 'background' | 'questions' | 'explain'

  const prompts = {
    background: `성경 "${bookName} ${chapter}장"의 역사적/문화적 배경을 한국어로 간결하게 설명해주세요. 3-4문단으로, QT 묵상에 도움이 되는 핵심 맥락 위주로.`,
    questions: `성경 "${bookName} ${chapter}장"을 읽고 SOAP 묵상을 할 때 도움이 되는 질문 5개를 한국어로 생성해주세요. 관찰(Observation), 적용(Application) 질문을 포함해주세요.`,
    explain: `성경 "${bookName} ${chapter}장"에서 한국어 번역만으로는 이해하기 어려운 원어(히브리어/그리스어)의 뉘앙스나 번역 차이를 한국어로 설명해주세요. 3-4개 핵심 단어/표현을 골라서.`,
  };

  const systemPrompt = '당신은 성경학 전문가이자 QT 묵상 가이드입니다. 정확한 신학적 정보를 바탕으로, 개인 묵상에 도움이 되도록 따뜻하고 명확하게 답변합니다. 한국어로 답변하세요.';

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompts[mode] || prompts.background },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });
    res.json({ content: completion.choices[0].message.content });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'AI request failed' });
  }
});

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
// Clean URL routes
// ============================================================
app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'onboarding.html'));
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

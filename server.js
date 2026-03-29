require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Pool } = require('pg');
const path = require('path');

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

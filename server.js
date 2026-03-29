require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
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
      // Upsert user
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
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// Auth Routes
// ============================================================
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => res.redirect('/')
);

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
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
// Notes API
// ============================================================
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Login required' });
}

// Save/update note
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

// Get note
app.get('/api/notes/:bookId/:chapter/:date', requireAuth, async (req, res) => {
  const { bookId, chapter, date } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 AND book_id = $2 AND chapter = $3 AND note_date = $4',
      [req.user.id, bookId, chapter, date]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error('Get note error:', err);
    res.status(500).json({ error: 'Failed to get note' });
  }
});

// List all notes for user
app.get('/api/notes', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 ORDER BY note_date DESC, updated_at DESC LIMIT 100',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List notes error:', err);
    res.status(500).json({ error: 'Failed to list notes' });
  }
});

// ============================================================
// Fallback - serve index.html for SPA
// ============================================================
app.get('*', (req, res) => {
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
    // Start anyway for static serving
    app.listen(PORT, () => {
      console.log(`QT Bible server running on port ${PORT} (DB not connected)`);
    });
  });

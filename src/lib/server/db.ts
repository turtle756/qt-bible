import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default pool;

export async function initDB() {
  // V1 tables
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL, chapter INTEGER NOT NULL,
    note_date DATE NOT NULL, content TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, book_id, chapter, note_date)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS highlights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL, chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL, color VARCHAR(20) DEFAULT 'yellow',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, book_id, chapter, verse)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS qt_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL, book_id INTEGER NOT NULL, chapter INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, log_date)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS reading_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL, start_date DATE NOT NULL,
    current_day INTEGER DEFAULT 1, completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, plan_type)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS reading_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL, day_num INTEGER NOT NULL,
    completed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, plan_type, day_num)
  )`);
  // Community
  await pool.query(`CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(), UNIQUE(group_id, user_id)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS shared_notes (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL, chapter INTEGER NOT NULL,
    content TEXT, created_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS note_reactions (
    id SERIAL PRIMARY KEY,
    note_id INTEGER REFERENCES shared_notes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'amen',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(note_id, user_id)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS onboarding_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    maturity_level VARCHAR(20) NOT NULL, total_score INTEGER NOT NULL,
    motivation VARCHAR(50), selected_topics TEXT[],
    daily_amount VARCHAR(20) DEFAULT 'one_chapter',
    parallel_reading BOOLEAN DEFAULT TRUE,
    completed_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS onboarding_v2 (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    nickname VARCHAR(50) NOT NULL,
    maturity_level VARCHAR(20) NOT NULL DEFAULT 'exploring',
    age_group VARCHAR(10), marriage_status VARCHAR(20),
    has_children BOOLEAN, job_status VARCHAR(20), attends_church BOOLEAN,
    temperament_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS custom_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(200) NOT NULL, topic VARCHAR(100) NOT NULL,
    duration INTEGER NOT NULL, plan_data JSONB NOT NULL,
    current_day INTEGER DEFAULT 1, started_at TIMESTAMP DEFAULT NOW(),
    completed BOOLEAN DEFAULT FALSE
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS topic_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES custom_plans(id) ON DELETE CASCADE,
    day_num INTEGER NOT NULL, completed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, plan_id, day_num)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS shared_feed (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'devotion',
    content TEXT NOT NULL, passage VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS feed_reactions (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES shared_feed(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'pray',
    created_at TIMESTAMP DEFAULT NOW(), UNIQUE(post_id, user_id)
  )`);
  // V2 tables
  await pool.query(`CREATE TABLE IF NOT EXISTS user_spiritual_profile (
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
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS qt_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    qt_date DATE NOT NULL, passage_ref VARCHAR(100),
    topic_id INTEGER, commentary_day INTEGER,
    maturity_used VARCHAR(20), time_spent_seconds INTEGER,
    note_written BOOLEAN DEFAULT FALSE, note_length INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE, mood_checkin JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, qt_date)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS recently_shown (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    block_type VARCHAR(20) NOT NULL, passage_ref VARCHAR(100) NOT NULL,
    topic_id INTEGER, shown_date DATE NOT NULL
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_recently_shown_user_date ON recently_shown(user_id, shown_date)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS bible_passages (
    id SERIAL PRIMARY KEY,
    passage_ref VARCHAR(100) NOT NULL UNIQUE,
    book_name VARCHAR(20) NOT NULL, book_id INTEGER NOT NULL,
    chapter INTEGER NOT NULL, verse_start INTEGER NOT NULL,
    verse_end INTEGER, testament VARCHAR(2) NOT NULL,
    genre VARCHAR(10) NOT NULL,
    soft_tags JSONB NOT NULL DEFAULT '{}',
    source_topics INTEGER[]
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS card_shown_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    card_id VARCHAR(20) NOT NULL, shown_date DATE NOT NULL,
    selected BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, card_id, shown_date)
  )`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_card_shown_user_date ON card_shown_history(user_id, shown_date)`);

  await pool.query(`CREATE TABLE IF NOT EXISTS qt_daily_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    qt_date DATE NOT NULL,
    assembled_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, qt_date)
  )`);

  console.log('DB tables ready');
}

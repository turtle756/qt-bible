/**
 * bible-passages-seed.json → PostgreSQL bible_passages 테이블 시딩
 * 사용법: DATABASE_URL=... node scripts/seed-passages.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function seed() {
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'public', 'data', 'bible-passages-seed.json'), 'utf8')
  );

  // 테이블 존재 확인
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

  let inserted = 0;
  let skipped = 0;

  for (const p of data) {
    try {
      await pool.query(
        `INSERT INTO bible_passages (passage_ref, book_name, book_id, chapter, verse_start, verse_end, testament, genre, soft_tags, source_topics)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (passage_ref) DO UPDATE SET
           soft_tags = $9, source_topics = $10`,
        [p.passage_ref, p.book_name, p.book_id, p.chapter, p.verse_start,
         p.verse_end, p.testament, p.genre, JSON.stringify(p.soft_tags), p.source_topics]
      );
      inserted++;
    } catch (err) {
      console.error(`Error inserting ${p.passage_ref}:`, err.message);
      skipped++;
    }
  }

  console.log(`\nSeed complete: ${inserted} inserted/updated, ${skipped} skipped`);
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

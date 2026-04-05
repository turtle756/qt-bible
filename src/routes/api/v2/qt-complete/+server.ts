import type { RequestHandler } from './$types';
import pool from '$lib/server/db';
import { readFileSync } from 'fs';
import { join } from 'path';

const topicsDb = JSON.parse(
  readFileSync(join(process.cwd(), 'static', 'data', 'topics-db.json'), 'utf8')
);

export const POST: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const userId = event.locals.user.id;
  const { passage_ref, topic_id, time_spent, note_length, mood_checkin } = await event.request.json();

  try {
    const maturityResult = await pool.query(
      'SELECT maturity_level FROM user_spiritual_profile WHERE user_id = $1', [userId]
    );
    const maturityUsed = maturityResult.rows[0]?.maturity_level || 'exploring';

    await pool.query(
      `INSERT INTO qt_history (user_id, qt_date, passage_ref, topic_id, maturity_used, time_spent_seconds, note_written, note_length, completed, mood_checkin)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, TRUE, $8)
       ON CONFLICT (user_id, qt_date) DO UPDATE SET
         time_spent_seconds = $5, note_written = $6, note_length = $7, completed = TRUE, mood_checkin = $8`,
      [userId, passage_ref, topic_id, maturityUsed,
       time_spent || 0, (note_length || 0) > 0, note_length || 0,
       mood_checkin ? JSON.stringify(mood_checkin) : null]
    );

    // Topic interest accumulation
    if (topic_id) {
      const topicEntry = topicsDb?.[topic_id - 1];
      if (topicEntry?.soft_tags) {
        const profile = await pool.query(
          'SELECT theme_interest FROM user_spiritual_profile WHERE user_id = $1', [userId]
        );
        const current = profile.rows[0]?.theme_interest || {};
        for (const [tag, val] of Object.entries(topicEntry.soft_tags)) {
          if (tag.startsWith('TH')) {
            current[tag] = Math.min(100, (current[tag] || 0) + Math.round((val as number) * 0.05));
          }
        }
        await pool.query(
          'UPDATE user_spiritual_profile SET theme_interest = $1, total_qt_days = total_qt_days + 1, streak_current = streak_current + 1, last_qt_date = CURRENT_DATE, updated_at = NOW() WHERE user_id = $2',
          [JSON.stringify(current), userId]
        );
      }
    }

    // Update best streak
    await pool.query(
      'UPDATE user_spiritual_profile SET streak_best = GREATEST(streak_best, streak_current) WHERE user_id = $1',
      [userId]
    );

    const profile = await pool.query(
      'SELECT streak_current, streak_best, total_qt_days FROM user_spiritual_profile WHERE user_id = $1',
      [userId]
    );
    const p = profile.rows[0] || {};
    return Response.json({
      success: true,
      streak_current: p.streak_current || 1,
      streak_best: p.streak_best || 1,
      total_qt_days: p.total_qt_days || 1
    });
  } catch (err) {
    console.error('qt-complete error:', err);
    return Response.json({ error: 'Failed to record completion' }, { status: 500 });
  }
};

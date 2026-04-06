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
  const body = await event.request.json();
  const passage_ref = body.passage_ref;
  const topic_id = typeof body.topic_id === 'number' ? body.topic_id : null;
  const time_spent = body.time_spent;
  const note_length = body.note_length;
  const mood_checkin = body.mood_checkin;

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

    // 스트릭 계산: 어제 했으면 이어가기, 아니면 1로 리셋
    const lastQtResult = await pool.query(
      'SELECT last_qt_date FROM user_spiritual_profile WHERE user_id = $1', [userId]
    );
    const lastDate = lastQtResult.rows[0]?.last_qt_date;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastStr = lastDate ? new Date(lastDate).toISOString().split('T')[0] : null;

    let streakUpdate = '';
    if (lastStr === today) {
      // 오늘 이미 했으면 스트릭 변경 없음
      streakUpdate = '';
    } else if (lastStr === yesterday) {
      // 어제 했으면 이어가기
      streakUpdate = 'streak_current = streak_current + 1,';
    } else {
      // 어제 안 했으면 1로 리셋
      streakUpdate = 'streak_current = 1,';
    }

    // Topic interest accumulation
    const profileRow = await pool.query(
      'SELECT theme_interest FROM user_spiritual_profile WHERE user_id = $1', [userId]
    );
    const current = profileRow.rows[0]?.theme_interest || {};
    if (topic_id) {
      const topicEntry = topicsDb?.[topic_id - 1];
      if (topicEntry?.soft_tags) {
        for (const [tag, val] of Object.entries(topicEntry.soft_tags)) {
          if (tag.startsWith('TH')) {
            current[tag] = Math.min(100, (current[tag] || 0) + Math.round((val as number) * 0.05));
          }
        }
      }
    }

    // 스트릭 + 통계 업데이트 (topic_id 유무와 무관하게 항상 실행)
    if (lastStr !== today) {
      await pool.query(
        `UPDATE user_spiritual_profile SET
          theme_interest = $1,
          ${streakUpdate}
          total_qt_days = total_qt_days + 1,
          last_qt_date = CURRENT_DATE,
          updated_at = NOW()
        WHERE user_id = $2`,
        [JSON.stringify(current), userId]
      );
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
  } catch (err: any) {
    console.error('qt-complete error:', err?.message || err, err?.stack);
    return Response.json({ error: 'Failed to record completion', detail: err?.message }, { status: 500 });
  }
};

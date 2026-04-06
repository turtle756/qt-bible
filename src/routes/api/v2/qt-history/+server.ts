import type { RequestHandler } from './$types';
import pool from '$lib/server/db';

// GET /api/v2/qt-history?month=2026-04 → 해당 월의 QT 기록 목록
// GET /api/v2/qt-history?date=2026-04-06 → 특정 날짜의 QT 전체 데이터
export const GET: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const userId = event.locals.user.id;

  const date = event.url.searchParams.get('date');
  const month = event.url.searchParams.get('month');

  if (date) {
    // 특정 날짜의 QT 전체 데이터
    const result = await pool.query(
      `SELECT c.assembled_data, h.completed, h.note_length, n.content as note
       FROM qt_daily_cache c
       LEFT JOIN qt_history h ON h.user_id = c.user_id AND h.qt_date = c.qt_date
       LEFT JOIN notes n ON n.user_id = c.user_id AND n.date = c.qt_date::text
       WHERE c.user_id = $1 AND c.qt_date = $2`,
      [userId, date]
    );
    if (result.rows.length === 0) return Response.json(null);
    const row = result.rows[0];
    return Response.json({
      ...row.assembled_data,
      completed: row.completed || false,
      note: row.note || null
    });
  }

  if (month) {
    // 월별 QT 기록 요약 (캘린더용) — qt_daily_cache + qt_history 합산
    const result = await pool.query(
      `SELECT COALESCE(c.qt_date, h.qt_date) as qt_date,
              c.assembled_data->'passage'->>'ref' as passage_ref,
              c.assembled_data->'passage'->>'title' as title,
              COALESCE(h.completed, false) as completed
       FROM qt_history h
       LEFT JOIN qt_daily_cache c ON c.user_id = h.user_id AND c.qt_date = h.qt_date
       WHERE h.user_id = $1 AND to_char(h.qt_date, 'YYYY-MM') = $2
       UNION
       SELECT c.qt_date,
              c.assembled_data->'passage'->>'ref' as passage_ref,
              c.assembled_data->'passage'->>'title' as title,
              COALESCE(h.completed, false) as completed
       FROM qt_daily_cache c
       LEFT JOIN qt_history h ON h.user_id = c.user_id AND h.qt_date = c.qt_date
       WHERE c.user_id = $1 AND to_char(c.qt_date, 'YYYY-MM') = $2
       ORDER BY qt_date`,
      [userId, month]
    );
    return Response.json(result.rows);
  }

  return Response.json([]);
};

import type { RequestHandler } from './$types';
import pool from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const year = event.url.searchParams.get('year') || new Date().getFullYear();
  const month = event.url.searchParams.get('month') || (new Date().getMonth() + 1);
  try {
    const result = await pool.query(
      `SELECT log_date, book_id, chapter FROM qt_log
       WHERE user_id = $1 AND EXTRACT(YEAR FROM log_date) = $2 AND EXTRACT(MONTH FROM log_date) = $3
       ORDER BY log_date`,
      [event.locals.user.id, year, month]
    );
    return Response.json(result.rows);
  } catch (err) {
    return Response.json({ error: 'Failed to get QT log' }, { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const { date, bookId, chapter } = await event.request.json();
  try {
    const result = await pool.query(
      `INSERT INTO qt_log (user_id, log_date, book_id, chapter)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, log_date)
       DO UPDATE SET book_id = $3, chapter = $4
       RETURNING *`,
      [event.locals.user.id, date, bookId, chapter]
    );
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: 'Failed to log QT' }, { status: 500 });
  }
};

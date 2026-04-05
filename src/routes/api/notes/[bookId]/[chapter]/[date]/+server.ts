import type { RequestHandler } from './$types';
import pool from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const { bookId, chapter, date } = event.params;
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 AND book_id = $2 AND chapter = $3 AND note_date = $4',
      [event.locals.user.id, bookId, chapter, date]
    );
    return Response.json(result.rows[0] || null);
  } catch (err) {
    return Response.json({ error: 'Failed to get note' }, { status: 500 });
  }
};

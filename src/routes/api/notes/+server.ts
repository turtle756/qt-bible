import type { RequestHandler } from './$types';
import pool from '$lib/server/db';

export const POST: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const { bookId, chapter, date, content } = await event.request.json();
  try {
    const result = await pool.query(
      `INSERT INTO notes (user_id, book_id, chapter, note_date, content, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, book_id, chapter, note_date)
       DO UPDATE SET content = $5, updated_at = NOW()
       RETURNING *`,
      [event.locals.user.id, bookId, chapter, date, content]
    );
    return Response.json(result.rows[0]);
  } catch (err) {
    console.error('Save note error:', err);
    return Response.json({ error: 'Failed to save note' }, { status: 500 });
  }
};

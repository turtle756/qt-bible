import type { RequestHandler } from './$types';
import pool from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const bookId = event.url.searchParams.get('bookId');
  const chapter = event.url.searchParams.get('chapter');
  if (!bookId || !chapter) {
    return Response.json({ error: 'bookId and chapter required' }, { status: 400 });
  }
  try {
    const result = await pool.query(
      'SELECT verse, color FROM highlights WHERE user_id = $1 AND book_id = $2 AND chapter = $3',
      [event.locals.user.id, bookId, chapter]
    );
    return Response.json(result.rows);
  } catch (err) {
    return Response.json({ error: 'Failed to get highlights' }, { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const { bookId, chapter, verse, color, action } = await event.request.json();
  try {
    if (action === 'delete') {
      await pool.query(
        'DELETE FROM highlights WHERE user_id = $1 AND book_id = $2 AND chapter = $3 AND verse = $4',
        [event.locals.user.id, bookId, chapter, verse]
      );
      return Response.json({ success: true });
    }
    const result = await pool.query(
      `INSERT INTO highlights (user_id, book_id, chapter, verse, color)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, book_id, chapter, verse)
       DO UPDATE SET color = $5
       RETURNING *`,
      [event.locals.user.id, bookId, chapter, verse, color || 'yellow']
    );
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: 'Failed to save highlight' }, { status: 500 });
  }
};

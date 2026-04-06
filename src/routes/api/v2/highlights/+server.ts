import type { RequestHandler } from './$types';
import pool from '$lib/server/db';

// GET: 특정 책+장의 하이라이트 조회
export const GET: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const userId = event.locals.user.id;
  const bookId = event.url.searchParams.get('book');
  const chapter = event.url.searchParams.get('chapter');
  if (!bookId || !chapter) return Response.json([]);

  const result = await pool.query(
    'SELECT verse, color FROM highlights WHERE user_id = $1 AND book_id = $2 AND chapter = $3',
    [userId, bookId, chapter]
  );
  return Response.json(result.rows);
};

// POST: 하이라이트 토글 (있으면 삭제, 없으면 추가)
export const POST: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const userId = event.locals.user.id;
  const { bookId, chapter, verse, color } = await event.request.json();

  if (!bookId || !chapter || !verse) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (!color) {
    // 색상 없으면 삭제
    await pool.query(
      'DELETE FROM highlights WHERE user_id = $1 AND book_id = $2 AND chapter = $3 AND verse = $4',
      [userId, bookId, chapter, verse]
    );
    return Response.json({ action: 'deleted' });
  }

  // upsert
  await pool.query(
    `INSERT INTO highlights (user_id, book_id, chapter, verse, color)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, book_id, chapter, verse)
     DO UPDATE SET color = $5`,
    [userId, bookId, chapter, verse, color]
  );
  return Response.json({ action: 'saved' });
};

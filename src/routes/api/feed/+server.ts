import type { RequestHandler } from './$types';
import pool from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const page = parseInt(event.url.searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;
  try {
    const result = await pool.query(
      `SELECT sf.id, sf.type, sf.content, sf.passage, sf.created_at,
        (sf.user_id = $1) as is_mine,
        (SELECT COUNT(*) FROM feed_reactions WHERE post_id = sf.id) as reaction_count,
        (SELECT type FROM feed_reactions WHERE post_id = sf.id AND user_id = $1) as my_reaction
       FROM shared_feed sf
       ORDER BY sf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [event.locals.user.id, limit, offset]
    );
    return Response.json(result.rows);
  } catch (err) {
    return Response.json({ error: 'Failed to get feed' }, { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const { type, content, passage } = await event.request.json();
  if (!content || !content.trim()) return Response.json({ error: 'Content required' }, { status: 400 });
  if (!['devotion', 'prayer'].includes(type)) return Response.json({ error: 'Invalid type' }, { status: 400 });
  try {
    const result = await pool.query(
      'INSERT INTO shared_feed (user_id, type, content, passage) VALUES ($1, $2, $3, $4) RETURNING id, type, content, passage, created_at',
      [event.locals.user.id, type, content.trim(), passage || null]
    );
    return Response.json(result.rows[0]);
  } catch (err) {
    console.error('Feed post error:', err);
    return Response.json({ error: 'Failed to post' }, { status: 500 });
  }
};

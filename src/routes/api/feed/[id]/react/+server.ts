import type { RequestHandler } from './$types';
import pool from '$lib/server/db';

export const POST: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const postId = event.params.id;
  const userId = event.locals.user.id;

  try {
    const existing = await pool.query(
      'SELECT id FROM feed_reactions WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM feed_reactions WHERE post_id = $1 AND user_id = $2',
        [postId, userId]);
    } else {
      await pool.query(
        'INSERT INTO feed_reactions (post_id, user_id, type) VALUES ($1, $2, $3)',
        [postId, userId, 'pray']
      );
    }
    const count = await pool.query(
      'SELECT COUNT(*) as cnt FROM feed_reactions WHERE post_id = $1', [postId]
    );
    const myReaction = await pool.query(
      'SELECT type FROM feed_reactions WHERE post_id = $1 AND user_id = $2',
      [postId, userId]
    );
    return Response.json({ count: parseInt(count.rows[0].cnt), reacted: myReaction.rows.length > 0 });
  } catch (err) {
    return Response.json({ error: 'Failed to react' }, { status: 500 });
  }
};

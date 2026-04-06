import type { RequestHandler } from './$types';
import pool from '$lib/server/db';

export const DELETE: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const postId = event.params.id;
  try {
    await pool.query(
      'DELETE FROM shared_feed WHERE id = $1 AND user_id = $2',
      [postId, event.locals.user.id]
    );
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Failed to delete' }, { status: 500 });
  }
};

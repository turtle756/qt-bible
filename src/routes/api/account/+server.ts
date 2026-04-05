import type { RequestHandler } from './$types';
import pool from '$lib/server/db';

export const DELETE: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [event.locals.user.id]);
    return Response.json({ success: true });
  } catch (err) {
    console.error('Account delete error:', err);
    return Response.json({ error: 'Failed to delete account' }, { status: 500 });
  }
};

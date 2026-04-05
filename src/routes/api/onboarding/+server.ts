import type { RequestHandler } from './$types';
import pool from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    // V2 onboarding first
    const v2 = await pool.query(
      'SELECT * FROM onboarding_v2 WHERE user_id = $1', [event.locals.user.id]
    );
    if (v2.rows[0]) return Response.json(v2.rows[0]);

    // V1 fallback
    const result = await pool.query(
      'SELECT * FROM onboarding_profiles WHERE user_id = $1', [event.locals.user.id]
    );
    return Response.json(result.rows[0] || null);
  } catch (err) {
    return Response.json({ error: 'Failed to get onboarding' }, { status: 500 });
  }
};

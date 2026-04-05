import type { RequestHandler } from './$types';
import pool from '$lib/server/db';
import scoring from '$lib/server/scoring';

export const GET: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    let result = await pool.query(
      'SELECT * FROM user_spiritual_profile WHERE user_id = $1', [event.locals.user.id]
    );
    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO user_spiritual_profile (user_id) VALUES ($1) RETURNING *',
        [event.locals.user.id]
      );
    }
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: 'Failed to get profile' }, { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const { maturity_level, temperament, pressure } = await event.request.json();
  try {
    const mood_pref = temperament ? scoring.temperamentToMoodPref(temperament) : {};
    const result = await pool.query(
      `INSERT INTO user_spiritual_profile (user_id, maturity_level, temperament, mood_pref, pressure, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         maturity_level = COALESCE($2, user_spiritual_profile.maturity_level),
         temperament = CASE WHEN $3::jsonb = '{}'::jsonb THEN user_spiritual_profile.temperament ELSE $3 END,
         mood_pref = CASE WHEN $4::jsonb = '{}'::jsonb THEN user_spiritual_profile.mood_pref ELSE $4 END,
         pressure = CASE WHEN $5::jsonb = '{}'::jsonb THEN user_spiritual_profile.pressure ELSE $5 END,
         updated_at = NOW()
       RETURNING *`,
      [event.locals.user.id, maturity_level || 'exploring',
       JSON.stringify(temperament || {}), JSON.stringify(mood_pref),
       JSON.stringify(pressure || {})]
    );
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: 'Failed to update profile' }, { status: 500 });
  }
};

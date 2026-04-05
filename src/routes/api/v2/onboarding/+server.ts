import type { RequestHandler } from './$types';
import pool from '$lib/server/db';

export const GET: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  try {
    const result = await pool.query(
      'SELECT * FROM onboarding_v2 WHERE user_id = $1', [event.locals.user.id]
    );
    if (result.rows.length === 0) {
      return Response.json({ completed: false });
    }
    return Response.json({ completed: true, ...result.rows[0] });
  } catch (err) {
    console.error('onboarding GET error:', err);
    return Response.json({ error: 'Failed to get onboarding status' }, { status: 500 });
  }
};

export const POST: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const { nickname, maturity_level, age_group, marriage_status, has_children, job_status, attends_church } = await event.request.json();
  if (!nickname || !maturity_level) {
    return Response.json({ error: 'nickname and maturity_level are required' }, { status: 400 });
  }
  try {
    await pool.query(
      `INSERT INTO onboarding_v2 (user_id, nickname, maturity_level, age_group, marriage_status, has_children, job_status, attends_church)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         nickname = $2, maturity_level = $3, age_group = $4, marriage_status = $5,
         has_children = $6, job_status = $7, attends_church = $8, completed_at = NOW()`,
      [event.locals.user.id, nickname, maturity_level, age_group || null, marriage_status || null,
       has_children ?? null, job_status || null, attends_church ?? null]
    );

    const situationTags: Record<string, boolean> = {};
    if (marriage_status === 'married') situationTags.S01 = true;
    if (marriage_status === 'single') situationTags.S02 = true;
    if (marriage_status === 'dating') situationTags.S03 = true;
    if (marriage_status === 'divorced') situationTags.S04 = true;
    if (has_children) situationTags.S05 = true;
    if (job_status === 'employed') situationTags.S09 = true;
    if (job_status === 'student') situationTags.S10 = true;
    if (job_status === 'job_seeking') situationTags.S12 = true;
    if (job_status === 'retired') situationTags.S14 = true;
    if (job_status === 'self_employed') situationTags.S16 = true;

    await pool.query(
      `INSERT INTO user_spiritual_profile (user_id, maturity_level)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET maturity_level = $2, updated_at = NOW()`,
      [event.locals.user.id, maturity_level]
    );

    return Response.json({ success: true, situation_tags: situationTags });
  } catch (err) {
    console.error('onboarding error:', err);
    return Response.json({ error: 'Failed to save onboarding' }, { status: 500 });
  }
};

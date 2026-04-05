import type { RequestHandler } from './$types';
import pool from '$lib/server/db';
import scoring from '$lib/server/scoring';
import { readFileSync } from 'fs';
import { join } from 'path';

const quizData = JSON.parse(
  readFileSync(join(process.cwd(), 'static', 'data', 'temperament-quiz.json'), 'utf8')
);

export const POST: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const { answers } = await event.request.json();
  if (!answers || !Array.isArray(answers)) {
    return Response.json({ error: 'answers array required' }, { status: 400 });
  }
  try {
    const rawScores: Record<string, number> = {};
    for (const ans of answers) {
      const question = quizData.questions.find((q: any) => q.id === ans.question_id);
      if (!question) continue;
      const pathway = question.pathway;
      rawScores[pathway] = (rawScores[pathway] || 0) + (ans.score || 0);
    }

    const temperament: Record<string, number> = {};
    for (const key of ['T01','T02','T03','T04','T05','T06','T07','T08','T09']) {
      temperament[key] = Math.round(((rawScores[key] || 0) / 12) * 100);
    }

    const mood_pref = scoring.temperamentToMoodPref(temperament);

    await pool.query(
      `UPDATE user_spiritual_profile
       SET temperament = $1, mood_pref = $2, updated_at = NOW()
       WHERE user_id = $3`,
      [JSON.stringify(temperament), JSON.stringify(mood_pref), event.locals.user.id]
    );

    await pool.query(
      `UPDATE onboarding_v2 SET temperament_completed = TRUE WHERE user_id = $1`,
      [event.locals.user.id]
    );

    const sorted = Object.entries(temperament).sort((a, b) => b[1] - a[1]);
    const top2 = sorted.slice(0, 2).map(([key, val]) => ({
      tag: key,
      ...quizData.pathway_map[key],
      score: val
    }));

    return Response.json({ success: true, temperament, top_pathways: top2 });
  } catch (err) {
    console.error('temperament error:', err);
    return Response.json({ error: 'Failed to save temperament' }, { status: 500 });
  }
};

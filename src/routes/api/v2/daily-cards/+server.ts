import type { RequestHandler } from './$types';
import pool from '$lib/server/db';
import scoring from '$lib/server/scoring';
import { readFileSync } from 'fs';
import { join } from 'path';

const cardsData = JSON.parse(
  readFileSync(join(process.cwd(), 'static', 'data', 'question-cards.json'), 'utf8')
);

export const GET: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const userId = event.locals.user.id;

  try {
    const profile = await pool.query(
      'SELECT * FROM user_spiritual_profile WHERE user_id = $1', [userId]
    );
    if (profile.rows.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const recentResult = await pool.query(
      `SELECT DISTINCT card_id FROM card_shown_history
       WHERE user_id = $1 AND shown_date > CURRENT_DATE - INTERVAL '7 days'`,
      [userId]
    );
    const recentIds = new Set(recentResult.rows.map((r: any) => r.card_id));

    const userSituation = {};

    const selected = scoring.selectDailyCards(
      profile.rows[0], cardsData.cards, recentIds, userSituation
    );

    for (const s of selected) {
      await pool.query(
        `INSERT INTO card_shown_history (user_id, card_id, shown_date)
         VALUES ($1, $2, CURRENT_DATE) ON CONFLICT DO NOTHING`,
        [userId, s.card.id]
      );
    }

    return Response.json(selected.map((s: any) => ({
      id: s.card.id,
      text: s.card.text,
      category: s.card.category,
      fitScore: Math.round(s.fitScore),
      hasYesNo: !!(s.card.payload_yes && s.card.payload_no)
    })));
  } catch (err) {
    console.error('daily-cards error:', err);
    return Response.json({ error: 'Failed to get daily cards' }, { status: 500 });
  }
};

import type { RequestHandler } from './$types';
import pool from '$lib/server/db';
import scoring from '$lib/server/scoring';
import { readFileSync } from 'fs';
import { join } from 'path';

const cardsData = JSON.parse(
  readFileSync(join(process.cwd(), 'static', 'data', 'question-cards.json'), 'utf8')
);

export const POST: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const userId = event.locals.user.id;
  const { card_id, response } = await event.request.json();

  if (!card_id) return Response.json({ error: 'card_id required' }, { status: 400 });

  try {
    const card = cardsData.cards.find((c: any) => c.id === card_id);
    if (!card) return Response.json({ error: 'Card not found' }, { status: 404 });

    let payload;
    if (card.payload_yes && card.payload_no) {
      payload = response === 'yes' ? card.payload_yes : card.payload_no;
    } else {
      payload = card.payload;
    }
    if (!payload) return Response.json({ error: 'No payload for this card' }, { status: 400 });

    const profile = await pool.query(
      'SELECT * FROM user_spiritual_profile WHERE user_id = $1', [userId]
    );
    if (profile.rows.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const updated = scoring.applyCardPayload(profile.rows[0], payload);

    await pool.query(
      `UPDATE user_spiritual_profile
       SET emotion = $1, pressure = $2, theme_interest = $3, updated_at = NOW()
       WHERE user_id = $4`,
      [JSON.stringify(updated.emotion), JSON.stringify(updated.pressure),
       JSON.stringify(updated.theme_interest), userId]
    );

    await pool.query(
      `UPDATE card_shown_history SET selected = TRUE
       WHERE user_id = $1 AND card_id = $2 AND shown_date = CURRENT_DATE`,
      [userId, card_id]
    );

    return Response.json({ success: true, updated });
  } catch (err) {
    console.error('card-response error:', err);
    return Response.json({ error: 'Failed to process card response' }, { status: 500 });
  }
};

import type { RequestHandler } from './$types';
import pool from '$lib/server/db';
import scoring from '$lib/server/scoring';
import { readFileSync } from 'fs';
import { join } from 'path';

// Pool loading (cached in module scope)
let _pools: any = null;
function getPools() {
  if (_pools) return _pools;
  const dataDir = join(process.cwd(), 'static', 'data');
  const poolDir = join(dataDir, 'pools');
  _pools = {
    commentary: JSON.parse(readFileSync(join(poolDir, 'commentary-pool.json'), 'utf8')),
    question: JSON.parse(readFileSync(join(poolDir, 'question-pool.json'), 'utf8')),
    prayer: JSON.parse(readFileSync(join(poolDir, 'prayer-pool.json'), 'utf8')),
    keyword: JSON.parse(readFileSync(join(poolDir, 'keyword-pool.json'), 'utf8')),
    passages: JSON.parse(readFileSync(join(dataDir, 'bible-passages-seed.json'), 'utf8'))
  };
  console.log(`Pools loaded: ${_pools.commentary.length} commentary, ${_pools.question.length} questions, ${_pools.prayer.length} prayers, ${_pools.keyword.length} keywords, ${_pools.passages.length} passages`);
  return _pools;
}

export const GET: RequestHandler = async (event) => {
  if (!event.locals.user) return new Response('Unauthorized', { status: 401 });
  const userId = event.locals.user.id;

  try {
    // 1. Profile load + time decay
    let profileResult = await pool.query(
      'SELECT * FROM user_spiritual_profile WHERE user_id = $1', [userId]
    );
    if (profileResult.rows.length === 0) {
      await pool.query('INSERT INTO user_spiritual_profile (user_id) VALUES ($1)', [userId]);
      profileResult = await pool.query(
        'SELECT * FROM user_spiritual_profile WHERE user_id = $1', [userId]
      );
    }
    const profile = profileResult.rows[0];
    const maturity = profile.maturity_level || 'exploring';

    const daysSince = profile.updated_at
      ? Math.floor((Date.now() - new Date(profile.updated_at).getTime()) / 86400000) : 0;
    if (daysSince >= 1) {
      profile.emotion = scoring.applyDecay(profile.emotion || {}, 0.7, daysSince);
      profile.pressure = scoring.applyDecay(profile.pressure || {}, 0.85, daysSince);
      profile.theme_interest = scoring.applyDecay(profile.theme_interest || {}, 0.95, daysSince);
      await pool.query(
        `UPDATE user_spiritual_profile SET emotion = $1, pressure = $2, theme_interest = $3, updated_at = NOW() WHERE user_id = $4`,
        [JSON.stringify(profile.emotion), JSON.stringify(profile.pressure),
         JSON.stringify(profile.theme_interest), userId]
      );
    }

    // 2. Recent exclusion
    const recentResult = await pool.query(
      `SELECT passage_ref, block_type FROM recently_shown
       WHERE user_id = $1 AND shown_date > CURRENT_DATE - INTERVAL '7 days'`,
      [userId]
    );
    const recentPassages = new Set(
      recentResult.rows.filter((r: any) => r.block_type === 'passage').map((r: any) => r.passage_ref)
    );

    // 3. Load pools
    const pools = getPools();

    // 4. Passage selection (user profile scoring)
    const passageCandidates = pools.passages
      .filter((p: any) => !recentPassages.has(p.passage_ref))
      .map((p: any) => ({ ...p, score: scoring.scoreBlock(profile, p.soft_tags) }));

    const selectedPassage = scoring.selectFromCandidates(passageCandidates);
    if (!selectedPassage) {
      return Response.json({ error: 'No suitable passage found' }, { status: 404 });
    }

    const passageTH = Object.entries(selectedPassage.soft_tags || {})
      .filter(([k, v]: [string, any]) => k.startsWith('TH') && v >= 30)
      .map(([k]: [string, any]) => k);

    // 5. Slot selection
    function selectSlot(poolItems: any[], passageRef: string, passageTHKeys: string[]) {
      let candidates = poolItems.filter((item: any) =>
        item.passage_ref === passageRef &&
        (!item.allowed_maturity || item.allowed_maturity.includes(maturity))
      );
      if (candidates.length === 0) {
        candidates = poolItems.filter((item: any) => item.passage_ref === passageRef);
      }
      if (candidates.length === 0 && passageTHKeys.length > 0) {
        candidates = poolItems.filter((item: any) => {
          if (item.allowed_maturity && !item.allowed_maturity.includes(maturity)) return false;
          const itemTH = Object.entries(item.soft_tags || {})
            .filter(([k, v]: [string, any]) => k.startsWith('TH') && v >= 30)
            .map(([k]: [string, any]) => k);
          return itemTH.some((t: string) => passageTHKeys.includes(t));
        });
      }
      const scored = candidates.map((item: any) => ({
        ...item,
        score: scoring.scoreBlock(profile, item.soft_tags)
      }));
      return scoring.selectFromCandidates(scored);
    }

    const selectedCommentary = selectSlot(pools.commentary, selectedPassage.passage_ref, passageTH);
    const selectedQuestion = selectSlot(pools.question, selectedPassage.passage_ref, passageTH);
    const selectedPrayer = selectSlot(pools.prayer, selectedPassage.passage_ref, passageTH);

    const keywords = pools.keyword.filter((k: any) => k.passage_ref === selectedPassage.passage_ref);
    const selectedKeyword = keywords.length > 0 ? keywords[0] : null;

    // 6. Record exposure
    await pool.query(
      `INSERT INTO recently_shown (user_id, block_type, passage_ref, shown_date) VALUES ($1, 'passage', $2, CURRENT_DATE)`,
      [userId, selectedPassage.passage_ref]
    );

    // 7. Already completed today?
    const todayHistory = await pool.query(
      'SELECT completed FROM qt_history WHERE user_id = $1 AND qt_date = CURRENT_DATE',
      [userId]
    );
    const alreadyCompleted = todayHistory.rows[0]?.completed || false;

    // 8. Assembled QT response
    return Response.json({
      date: new Date().toISOString().split('T')[0],
      already_completed: alreadyCompleted,
      maturity_level: maturity,
      passage: {
        ref: selectedPassage.passage_ref,
        book_name: selectedPassage.book_name,
        testament: selectedPassage.testament,
        genre: selectedPassage.genre,
        chapter: selectedPassage.chapter,
        verse_start: selectedPassage.verse_start,
        verse_end: selectedPassage.verse_end,
        score: selectedPassage.score
      },
      commentary: selectedCommentary ? {
        id: selectedCommentary.id,
        content: selectedCommentary.content,
        type: selectedCommentary.type,
        source_topic: selectedCommentary.source_topic,
        source_passage: selectedCommentary.passage_ref,
        score: selectedCommentary.score
      } : null,
      keyword: selectedKeyword ? {
        content: selectedKeyword.content,
        source_topic: selectedKeyword.source_topic
      } : null,
      question: selectedQuestion ? {
        id: selectedQuestion.id,
        content: selectedQuestion.content,
        source_topic: selectedQuestion.source_topic,
        source_passage: selectedQuestion.passage_ref,
        score: selectedQuestion.score
      } : null,
      prayer: selectedPrayer ? {
        id: selectedPrayer.id,
        content: selectedPrayer.content,
        type: selectedPrayer.type,
        source_topic: selectedPrayer.source_topic,
        source_passage: selectedPrayer.passage_ref,
        score: selectedPrayer.score
      } : null
    });
  } catch (err) {
    console.error('daily-qt error:', err);
    return Response.json({ error: 'Failed to assemble daily QT' }, { status: 500 });
  }
};

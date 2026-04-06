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
    // 0. 오늘 이미 조립된 QT가 있으면 캐시된 passage 사용
    const todayShown = await pool.query(
      `SELECT passage_ref FROM recently_shown
       WHERE user_id = $1 AND block_type = 'passage' AND shown_date = CURRENT_DATE
       ORDER BY id DESC LIMIT 1`,
      [userId]
    );
    const cachedPassageRef = todayShown.rows[0]?.passage_ref || null;

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

    // 4. Passage selection — 오늘 캐시가 있으면 재사용
    let selectedPassage: any = null;

    if (cachedPassageRef) {
      selectedPassage = pools.passages.find((p: any) => p.passage_ref === cachedPassageRef);
    }

    if (!selectedPassage) {
      const passageCandidates = pools.passages
        .filter((p: any) => !recentPassages.has(p.passage_ref))
        .map((p: any) => ({ ...p, score: scoring.scoreBlock(profile, p.soft_tags) }));
      selectedPassage = scoring.selectFromCandidates(passageCandidates);
    }

    if (!selectedPassage) {
      return Response.json({ error: 'No suitable passage found' }, { status: 404 });
    }

    const passageTH = Object.entries(selectedPassage.soft_tags || {})
      .filter(([k, v]: [string, any]) => k.startsWith('TH') && v >= 30)
      .map(([k]: [string, any]) => k);

    // 5. Slot selection — 절 범위 겹침 매칭
    function refsOverlap(refA: string, refB: string): boolean {
      // "요한복음 14:23-31" vs "요한복음 14:27" 같은 경우 매칭
      const parseR = (r: string) => {
        const m = r.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
        if (!m) return null;
        return { book: m[1], ch: +m[2], vs: +m[3], ve: m[4] ? +m[4] : +m[3] };
      };
      const a = parseR(refA), b = parseR(refB);
      if (!a || !b) return false;
      if (a.book !== b.book || a.ch !== b.ch) return false;
      return a.vs <= b.ve && b.vs <= a.ve; // 범위 겹침
    }

    function selectSlot(poolItems: any[], passageRef: string, passageTHKeys: string[]) {
      // 1순위: 정확 일치 + 성숙도
      let candidates = poolItems.filter((item: any) =>
        item.passage_ref === passageRef &&
        (!item.allowed_maturity || item.allowed_maturity.includes(maturity))
      );
      // 2순위: 절 범위 겹침 + 성숙도
      if (candidates.length === 0) {
        candidates = poolItems.filter((item: any) =>
          refsOverlap(item.passage_ref, passageRef) &&
          (!item.allowed_maturity || item.allowed_maturity.includes(maturity))
        );
      }
      // 3순위: 절 범위 겹침 (성숙도 무관)
      if (candidates.length === 0) {
        candidates = poolItems.filter((item: any) => refsOverlap(item.passage_ref, passageRef));
      }
      // 4순위: TH 태그 겹침
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

    // 원어 — 정확 일치 또는 범위 겹침
    let keywords = pools.keyword.filter((k: any) => k.passage_ref === selectedPassage.passage_ref);
    if (keywords.length === 0) {
      keywords = pools.keyword.filter((k: any) => refsOverlap(k.passage_ref, selectedPassage.passage_ref));
    }
    const selectedKeyword = keywords.length > 0 ? keywords[0] : null;

    // 6. Record exposure (오늘 처음이면만)
    if (!cachedPassageRef) {
      await pool.query(
        `INSERT INTO recently_shown (user_id, block_type, passage_ref, shown_date) VALUES ($1, 'passage', $2, CURRENT_DATE)`,
        [userId, selectedPassage.passage_ref]
      );
    }

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

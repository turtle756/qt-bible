/**
 * DailyQT V2 — 규칙 기반 스코어링 엔진
 * TAG_SYSTEM_V2.md 기준
 *
 * 코사인 유사도 사용하지 않음. 가중치 내적만 사용.
 */

// 태그 키 정의
const TAG_KEYS = {
  temperament: ['T01','T02','T03','T04','T05','T06','T07','T08','T09'],
  emotion:     ['E01','E02','E03','E04','E05','E06','E07','E08','E09','E10',
                'E11','E12','E13','E14','E15'],
  pressure:    ['P01','P02','P03','P04','P05','P06','P07','P08',
                'P09','P10','P11','P12'],
  theme:       ['TH01','TH02','TH03','TH04','TH05','TH06','TH07','TH08','TH09','TH10',
                'TH11','TH12','TH13','TH14','TH15','TH16','TH17','TH18','TH19','TH20'],
  mood:        ['C01','C02','C03','C04'],
  difficulty:  ['D01','D02','D03']
};

// 차원별 가중치 (합계 = 1.00)
const DIM_WEIGHTS = {
  temperament: 0.20,
  emotion:     0.30,
  pressure:    0.10,
  theme:       0.15,
  mood:        0.15,
  difficulty:  0.10
};

// 성숙도별 적정 난이도
const IDEAL_DIFFICULTY = {
  exploring: 25,
  growing: 40,
  close: 60,
  centered: 75
};

/**
 * 두 태그 객체의 차원별 매칭 점수 (0~100)
 */
function dimScore(userTags, blockTags, tagKeys) {
  let dotProduct = 0;
  for (const key of tagKeys) {
    const u = userTags[key] || 0;
    const b = blockTags[key] || 0;
    dotProduct += u * b;
  }
  return (dotProduct / (tagKeys.length * 10000)) * 100;
}

/**
 * 사용자 프로필 vs 콘텐츠 블록의 최종 매칭 점수
 * @param {Object} profile - user_spiritual_profile row
 * @param {Object} blockSoftTags - 블록의 soft_tags JSONB
 * @returns {number} 0~100 범위의 점수
 */
function scoreBlock(profile, blockSoftTags) {
  const userTags = {
    ...profile.temperament,
    ...profile.emotion,
    ...profile.pressure,
    ...profile.theme_interest,
    ...profile.mood_pref
  };

  let total = 0;
  for (const [dim, weight] of Object.entries(DIM_WEIGHTS)) {
    if (dim === 'difficulty') {
      const userIdeal = IDEAL_DIFFICULTY[profile.maturity_level] || 40;
      const blockDiff = blockSoftTags['D01'] || 50;
      const fit = 100 - Math.abs(userIdeal - blockDiff);
      total += fit * weight;
    } else {
      const score = dimScore(userTags, blockSoftTags, TAG_KEYS[dim]);
      total += score * weight;
    }
  }

  return Math.round(total * 100) / 100;
}

/**
 * 시간 감쇠 적용
 * @param {Object} tags - JSONB 태그 객체
 * @param {number} decayRate - 일일 감쇠율 (0.7, 0.85, 0.95)
 * @param {number} daysSince - 마지막 업데이트 이후 경과일
 * @returns {Object} 감쇠 적용된 태그
 */
function applyDecay(tags, decayRate, daysSince) {
  if (daysSince < 1) return tags;
  const factor = Math.pow(decayRate, daysSince);
  const result = {};
  for (const [key, val] of Object.entries(tags)) {
    const decayed = Math.round(val * factor);
    if (decayed >= 5) result[key] = decayed; // 5 미만 소멸
  }
  return result;
}

/**
 * 감정 체크인 처리 — 연동 감정 자동 부여
 * @param {Object} currentEmotion - 현재 감정 태그
 * @param {Object} checkin - 체크인 입력 {"E01": 90}
 * @returns {Object} 병합된 감정 태그
 */
function processMoodCheckin(currentEmotion, checkin) {
  const result = { ...currentEmotion };

  // 새 값 병합 (높은 쪽 우선)
  for (const [tag, value] of Object.entries(checkin)) {
    result[tag] = Math.max(result[tag] || 0, value);
  }

  // 연동 감정
  const LINKS = {
    'E01': { 'E07': 0.6 },   // 불안 → 스트레스
    'E02': { 'E03': 0.5 },   // 슬픔 → 우울
    'E03': { 'E05': 0.4 },   // 우울 → 외로움
    'E05': { 'E03': 0.4 },   // 외로움 → 우울
    'E06': { 'E08': 0.5 },   // 죄책감 → 혼란
    'E07': { 'E01': 0.4 },   // 스트레스 → 불안
    'E09': { 'E05': 0.5 },   // 거절감 → 외로움
  };

  for (const [trigger, links] of Object.entries(LINKS)) {
    if (checkin[trigger]) {
      for (const [linked, ratio] of Object.entries(links)) {
        const linkedVal = Math.round(checkin[trigger] * ratio);
        result[linked] = Math.max(result[linked] || 0, linkedVal);
      }
    }
  }

  return result;
}

/**
 * 기질 → 분위기 선호 자동 매핑
 * T06(돌봄) → C01(위로), T05(행동) → C02(도전)
 * T09(지성) → C03(학문), T08(관상) → C04(관상)
 */
function temperamentToMoodPref(temperament) {
  return {
    C01: Math.max(temperament.T06 || 0, temperament.T07 || 0),
    C02: Math.max(temperament.T05 || 0, temperament.T03 || 0),
    C03: temperament.T09 || 0,
    C04: Math.max(temperament.T08 || 0, temperament.T04 || 0)
  };
}

/**
 * 기질 퀴즈 응답 → 정규화된 프로필 (0~100)
 * @param {Object[]} answers - [{ tags: { T09: 30 } }, { tags: { T08: 25, T04: 15 } }, ...]
 * @returns {Object} { T01: 20, T02: 10, ..., T09: 85 }
 */
function calculateTemperament(answers) {
  const raw = {};
  for (const ans of answers) {
    for (const [tag, val] of Object.entries(ans.tags || {})) {
      raw[tag] = (raw[tag] || 0) + val;
    }
  }
  // 최고값을 100으로 정규화
  const maxVal = Math.max(...Object.values(raw), 1);
  const result = {};
  for (const key of TAG_KEYS.temperament) {
    result[key] = Math.round(((raw[key] || 0) / maxVal) * 100);
  }
  return result;
}

/**
 * 후보 블록 배열에서 최종 선택
 * 상위 5개 중 랜덤 1개
 */
function selectFromCandidates(scoredBlocks) {
  if (scoredBlocks.length === 0) return null;
  const sorted = scoredBlocks.sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, Math.min(5, sorted.length));
  return top[Math.floor(Math.random() * top.length)];
}

// ============================================================
// 질문 카드 시스템 (Weighted Random Sampling)
// ============================================================

/**
 * 질문 카드의 적합도 점수 계산
 * 카드의 weight_target과 사용자 프로필의 일치도
 * @param {Object} profile - user_spiritual_profile
 * @param {Object} card - question card object
 * @returns {number} 0~100 적합도
 */
function cardFitScore(profile, card) {
  const userTags = {
    ...profile.emotion,
    ...profile.pressure,
    ...profile.theme_interest
  };
  const target = card.weight_target || {};
  let score = 0;
  let maxPossible = 0;
  for (const [tag, weight] of Object.entries(target)) {
    score += (userTags[tag] || 0) * weight;
    maxPossible += 100 * weight;
  }
  // 기본 점수 10 (쌩뚱맞은 카드도 최소 10% 확률)
  return maxPossible > 0 ? 10 + (score / maxPossible) * 90 : 10;
}

/**
 * 가중치 기반 랜덤 추출 (Weighted Random Sampling without replacement)
 * @param {Object[]} candidates - { card, fitScore } 배열
 * @param {number} count - 뽑을 수
 * @returns {Object[]} 선택된 카드 배열
 */
function weightedRandomSample(candidates, count) {
  const selected = [];
  const pool = [...candidates];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, c) => sum + c.fitScore, 0);
    let rand = Math.random() * totalWeight;
    let idx = 0;
    for (let j = 0; j < pool.length; j++) {
      rand -= pool[j].fitScore;
      if (rand <= 0) { idx = j; break; }
    }
    selected.push(pool[idx]);
    pool.splice(idx, 1); // 중복 방지
  }

  return selected;
}

/**
 * 매일 4개 질문 카드 추출
 * @param {Object} profile - user_spiritual_profile
 * @param {Object[]} allCards - 전체 카드 풀
 * @param {Set} recentCardIds - 최근 7일 내 보여준 카드 ID
 * @param {Object} userSituation - 사용자 상황 태그 (S01, S05 등)
 * @returns {Object[]} 선택된 4개 카드
 */
function selectDailyCards(profile, allCards, recentCardIds, userSituation) {
  // 1단계: 하드 필터
  const filtered = allCards.filter(card => {
    if (recentCardIds.has(card.id)) return false;
    if (card.condition && card.condition.any_of) {
      const hasMatch = card.condition.any_of.some(s => userSituation[s]);
      if (!hasMatch) return false;
    }
    return true;
  });

  // 2단계: 적합도 점수 계산
  const scored = filtered.map(card => ({
    card,
    fitScore: cardFitScore(profile, card)
  }));

  // 3단계: 가중치 랜덤 4개 추출
  return weightedRandomSample(scored, 4);
}

/**
 * 카드 선택 시 다중 Payload로 프로필 업데이트
 * 기존 값에 0.7 감쇠 후 Payload 추가 (지수 평활법)
 * @param {Object} profile - 현재 프로필 (emotion, pressure, theme_interest)
 * @param {Object} payload - { "E07": 30, "E01": 15, "E12": -20, "P03": 40 }
 * @returns {Object} { emotion, pressure, theme_interest } 업데이트된 값
 */
function applyCardPayload(profile, payload) {
  const emotion = { ...(profile.emotion || {}) };
  const pressure = { ...(profile.pressure || {}) };
  const themeInterest = { ...(profile.theme_interest || {}) };

  for (const [tag, delta] of Object.entries(payload)) {
    let target, decayRate;
    if (tag.startsWith('E')) { target = emotion; decayRate = 0.7; }
    else if (tag.startsWith('P')) { target = pressure; decayRate = 0.85; }
    else if (tag.startsWith('TH')) { target = themeInterest; decayRate = 0.95; }
    else continue;

    const oldVal = target[tag] || 0;
    const newVal = Math.round(oldVal * decayRate) + delta;
    target[tag] = Math.max(0, Math.min(100, newVal));

    // 0 이하면 삭제
    if (target[tag] <= 0) delete target[tag];
  }

  return { emotion, pressure, theme_interest: themeInterest };
}

export {
  TAG_KEYS,
  DIM_WEIGHTS,
  IDEAL_DIFFICULTY,
  dimScore,
  scoreBlock,
  applyDecay,
  processMoodCheckin,
  temperamentToMoodPref,
  calculateTemperament,
  selectFromCandidates,
  cardFitScore,
  weightedRandomSample,
  selectDailyCards,
  applyCardPayload
};

export default {
  TAG_KEYS,
  DIM_WEIGHTS,
  IDEAL_DIFFICULTY,
  dimScore,
  scoreBlock,
  applyDecay,
  processMoodCheckin,
  temperamentToMoodPref,
  calculateTemperament,
  selectFromCandidates,
  cardFitScore,
  weightedRandomSample,
  selectDailyCards,
  applyCardPayload
};

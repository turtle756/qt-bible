# DailyQT v2 — 모듈형 개인화 아키텍처 (규칙 기반 스코어링)

> TAG_SYSTEM_V2.md와 완전히 일치하는 아키텍처.
> 코사인 유사도 사용하지 않음. 하드 필터 + 가중치 내적만 사용.

---

## 0. 핵심 원리

```
정적 플랜: "30일 커리큘럼을 순서대로 보여줌" → 개인화 아님
모듈형 조립: "같은 본문이라도 사용자마다 다른 해설+질문+기도 조합" → 진짜 개인화

모든 매칭은 순수 수학:
  1. 하드 필터(SQL WHERE)로 후보 축소
  2. 소프트 가중치(0~100 정수) 내적으로 순위 결정
  3. 상위 5개 중 랜덤 1개 선택
```

핵심 공식:
```
오늘의 QT = 본문 선택(교회력/하드필터)
          + 해설 블록(기질×분위기 + 감정×주제 매칭)
          + 질문 블록(성숙도 필터 + 감정×상황 매칭)
          + 기도 블록(감정×주제 매칭)
          + 원어 블록(본문 기반 고정)
```

---

## 1. DB 스키마 (PostgreSQL)

### 1-1. 콘텐츠 블록 테이블들

```sql
-- 성경 구절 메타데이터 (본문 자체는 bolls.life API에서 가져옴)
CREATE TABLE bible_passages (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL,           -- 1~66
  book_name VARCHAR(20) NOT NULL,     -- "시편", "마태복음"
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER,
  passage_ref VARCHAR(50) NOT NULL,   -- "시편 23:1-6"

  -- 하드 필터 (A3)
  testament VARCHAR(2) NOT NULL,      -- "OT" | "NT"
  genre VARCHAR(10) NOT NULL,         -- "율법"|"역사"|"시가"|"예언"|"복음"|"서신"|"묵시"

  -- 소프트 태그 (B4 신학주제, B6 본문속성)
  soft_tags JSONB NOT NULL DEFAULT '{}',
  -- 예: {"TH01":80,"TH04":90,"TH17":70,"D01":30,"D02":40,"D03":50}

  UNIQUE(book_id, chapter, verse_start)
);

-- 해설 블록 (같은 구절에 여러 관점의 해설)
CREATE TABLE commentary_blocks (
  id SERIAL PRIMARY KEY,
  passage_id INTEGER REFERENCES bible_passages(id),

  content TEXT NOT NULL,              -- 해설 본문 (3-5문장)
  key_word VARCHAR(200),              -- 원어 정보
  background TEXT,                    -- 역사적 배경 (2-3문장)

  -- 하드 필터
  allowed_maturity TEXT[] NOT NULL,   -- {"exploring","growing"} 등
  season_tags TEXT[] DEFAULT '{}',    -- {"lent","holy_week"} 또는 {} (범용)
  is_crisis BOOLEAN DEFAULT FALSE,

  -- 소프트 태그 (0~100 정수, JSONB)
  soft_tags JSONB NOT NULL DEFAULT '{}',
  -- 예: {"T09":85,"C03":90,"E01":70,"P03":50,"TH02":90,"TH03":70}

  created_at TIMESTAMP DEFAULT NOW()
);

-- 질문 블록
CREATE TABLE question_blocks (
  id SERIAL PRIMARY KEY,
  passage_id INTEGER REFERENCES bible_passages(id),

  question TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL, -- "감정"|"관찰"|"해석"|"적용"|"관상"

  -- 하드 필터
  allowed_maturity TEXT[] NOT NULL,
  is_crisis BOOLEAN DEFAULT FALSE,

  -- 소프트 태그
  soft_tags JSONB NOT NULL DEFAULT '{}',
  -- 예: {"E01":80,"E07":60,"P03":70,"TH09":50,"C01":75}

  created_at TIMESTAMP DEFAULT NOW()
);

-- 기도 블록
CREATE TABLE prayer_blocks (
  id SERIAL PRIMARY KEY,
  passage_id INTEGER REFERENCES bible_passages(id),

  content TEXT NOT NULL,              -- 기도문 (2-4줄)
  prayer_type VARCHAR(20) NOT NULL,   -- "탄식"|"감사"|"중보"|"찬양"|"고백"

  -- 하드 필터
  allowed_maturity TEXT[] NOT NULL,
  is_crisis BOOLEAN DEFAULT FALSE,

  -- 소프트 태그
  soft_tags JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW()
);

-- 교차 참조 블록
CREATE TABLE cross_ref_blocks (
  id SERIAL PRIMARY KEY,
  passage_id INTEGER REFERENCES bible_passages(id),
  ref_passage_id INTEGER REFERENCES bible_passages(id),
  relationship VARCHAR(30),           -- "병행"|"대조"|"예표"|"성취"|"주제연결"
  note TEXT                           -- 연결 설명 (1문장)
);
```

### 1-2. 사용자 프로필

```sql
CREATE TABLE user_spiritual_profile (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- 하드 필터 (A1)
  maturity_level VARCHAR(20) NOT NULL DEFAULT 'exploring',
  -- "exploring" | "growing" | "close" | "centered"

  -- 소프트 태그 (모두 0~100 정수, JSONB)
  -- B1: 영적 기질 (온보딩에서 설정, 반년마다 재측정)
  temperament JSONB NOT NULL DEFAULT '{}',
  -- 예: {"T01":20,"T02":10,...,"T09":85}

  -- B2: 감정 상태 (매일 감쇠, 체크인 시 갱신)
  emotion JSONB NOT NULL DEFAULT '{}',
  -- 예: {"E01":75,"E07":50}

  -- B3: 상황 압박도 (온보딩+체크인, 감쇠 ×0.85/일)
  pressure JSONB NOT NULL DEFAULT '{}',
  -- 예: {"P03":80,"P09":60}

  -- B4: 신학적 주제 관심도 (QT 이력에서 축적)
  theme_interest JSONB NOT NULL DEFAULT '{}',
  -- 예: {"TH02":40,"TH09":30}

  -- B5: 선호 콘텐츠 분위기 (기질에서 파생, 직접 저장)
  mood_pref JSONB NOT NULL DEFAULT '{}',
  -- 예: {"C01":30,"C03":85}  ← T09(85)→C03 자동 매핑

  -- 위기 플래그 (A5)
  has_crisis BOOLEAN DEFAULT FALSE,

  -- 행동 메타
  total_qt_days INTEGER DEFAULT 0,
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  last_qt_date DATE,

  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 1-3. QT 히스토리

```sql
CREATE TABLE qt_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  qt_date DATE NOT NULL,

  -- 오늘 조립된 QT의 구성
  passage_id INTEGER REFERENCES bible_passages(id),
  commentary_id INTEGER REFERENCES commentary_blocks(id),
  question_ids INTEGER[],
  prayer_id INTEGER REFERENCES prayer_blocks(id),

  -- 사용자 반응 (태그 진화 소스)
  time_spent_seconds INTEGER,
  note_written BOOLEAN DEFAULT FALSE,
  note_length INTEGER DEFAULT 0,
  highlighted_verses INTEGER[],
  completed BOOLEAN DEFAULT FALSE,

  -- 감정 체크인 (선택적)
  mood_checkin JSONB,
  -- 예: {"E01":90,"E07":60}  ← 불안 카드 터치 시

  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, qt_date)
);

-- 최근 노출 추적 (A4 하드 필터용)
CREATE TABLE recently_shown (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  block_type VARCHAR(20) NOT NULL,  -- "passage"|"commentary"|"question"|"prayer"
  block_id INTEGER NOT NULL,
  shown_date DATE NOT NULL,
  UNIQUE(user_id, block_type, block_id, shown_date)
);
```

### 1-4. 교회력 테이블

```sql
CREATE TABLE liturgical_calendar (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  cal_date DATE NOT NULL UNIQUE,
  season VARCHAR(20) NOT NULL,        -- "advent"|"christmas"|"epiphany"|"lent"|
                                      -- "holy_week"|"easter"|"pentecost"|"ordinary"
  special_day VARCHAR(50),            -- "성탄일"|"부활주일"|NULL

  -- 이 날짜에 추천되는 본문 (성서일과 기반)
  recommended_passages INTEGER[]      -- bible_passages.id 배열
);
```

---

## 2. 스코어링 엔진 (Assembly Engine)

### 2-1. Step 1: 하드 필터 (SQL WHERE)

```sql
-- 해설 블록 후보 추출 예시
SELECT cb.* FROM commentary_blocks cb
JOIN bible_passages bp ON cb.passage_id = bp.id
WHERE $1 = ANY(cb.allowed_maturity)             -- A1: 성숙도 일치
  AND (cb.season_tags = '{}' 
       OR $2 = ANY(cb.season_tags))             -- A2: 절기 일치 or 범용
  AND cb.id NOT IN (                            -- A4: 최근 노출 제외
    SELECT block_id FROM recently_shown 
    WHERE user_id = $3 AND block_type = 'commentary'
    AND shown_date > CURRENT_DATE - INTERVAL '7 days'
  )
  AND (cb.is_crisis = FALSE OR $4 = TRUE)       -- A5: 위기 차단
  AND cb.passage_id = $5;                        -- 선택된 본문
```

→ 수백 개 → 10~30개로 축소

### 2-2. Step 2: 소프트 스코어링 (가중치 내적)

```
각 차원별 매칭 점수 (0~100):

dim_score(user_tags, block_tags, tag_list) =
  Σ(user_tags[tag] × block_tags[tag]) / (len(tag_list) × 10000) × 100
  
  * user에 없는 태그 = 0, block에 없는 태그 = 0

최종 점수:
SCORE = temperament_match × 0.20    (B1 × B5 기질↔분위기)
      + emotion_match    × 0.30    (B2 감정)
      + pressure_match   × 0.10    (B3 상황)
      + theme_match      × 0.15    (B4 주제)
      + mood_match       × 0.15    (B5 분위기)
      + difficulty_fit   × 0.10    (B6 난이도 적합)
      ─────────────────────
      합계 = 1.00
```

### 2-3. Step 3: 페널티

```
최근 3일 내 동일 TH 최고점 블록 사용됨: -20점
동일 날 같은 C 분위기 블록 중복:        -10점
```

### 2-4. Step 4: 최종 선택

```
후보 → 스코어링 → 상위 5개 → 랜덤 1개 선택
(약간의 무작위성 = "성령의 인도" 느낌)
```

---

## 3. 서버 구현 (Node.js/Express)

### 3-1. 스코어링 함수

```javascript
/**
 * 두 태그 객체의 차원별 매칭 점수 계산 (0~100)
 * @param {Object} userTags  - {"T09": 85, "T08": 60}
 * @param {Object} blockTags - {"T09": 80, "C03": 90}
 * @param {string[]} tagKeys - ["T01","T02",...,"T09"] 해당 차원의 전체 태그 키
 * @returns {number} 0~100
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

// 차원별 가중치
const DIM_WEIGHTS = {
  temperament: 0.20,
  emotion:     0.30,
  pressure:    0.10,
  theme:       0.15,
  mood:        0.15,
  difficulty:  0.10
};

/**
 * 사용자 프로필 vs 콘텐츠 블록의 최종 매칭 점수
 */
function scoreBlock(userProfile, blockSoftTags) {
  // 사용자 전체 태그를 하나의 flat 객체로 합침
  const userTags = {
    ...userProfile.temperament,
    ...userProfile.emotion,
    ...userProfile.pressure,
    ...userProfile.theme_interest,
    ...userProfile.mood_pref
  };

  let total = 0;
  for (const [dim, weight] of Object.entries(DIM_WEIGHTS)) {
    if (dim === 'difficulty') {
      // 난이도는 차이가 적을수록 높은 점수
      const userIdeal = 50; // 성숙도에 따라 조정 가능
      const blockDiff = blockSoftTags['D01'] || 50;
      const fit = (100 - Math.abs(userIdeal - blockDiff));
      total += fit * weight;
    } else {
      const score = dimScore(userTags, blockSoftTags, TAG_KEYS[dim]);
      total += score * weight;
    }
  }

  return total;
}
```

### 3-2. 조립 엔진

```javascript
async function assembleDailyQT(userId) {
  const profile = await getUserProfile(userId);
  const today = new Date();

  // --- 본문 선택 ---
  const season = getLiturgicalSeason(today);
  const passage = await selectPassage(userId, profile, season);

  // --- 블록 후보 추출 (하드 필터) ---
  const commentaries = await getFilteredBlocks('commentary_blocks', {
    passageId: passage.id,
    maturity: profile.maturity_level,
    season: season,
    userId: userId,
    hasCrisis: profile.has_crisis
  });

  const questions = await getFilteredBlocks('question_blocks', {
    passageId: passage.id,
    maturity: profile.maturity_level,
    season: season,
    userId: userId,
    hasCrisis: profile.has_crisis
  });

  const prayers = await getFilteredBlocks('prayer_blocks', {
    passageId: passage.id,
    maturity: profile.maturity_level,
    season: season,
    userId: userId,
    hasCrisis: profile.has_crisis
  });

  // --- 소프트 스코어링 ---
  const scoredCommentaries = commentaries.map(c => ({
    ...c,
    score: scoreBlock(profile, c.soft_tags)
  })).sort((a, b) => b.score - a.score);

  const scoredQuestions = questions.map(q => ({
    ...q,
    score: scoreBlock(profile, q.soft_tags)
  })).sort((a, b) => b.score - a.score);

  const scoredPrayers = prayers.map(p => ({
    ...p,
    score: scoreBlock(profile, p.soft_tags)
  })).sort((a, b) => b.score - a.score);

  // --- 상위 5개 중 랜덤 1개 ---
  const pick = (arr) => {
    const top5 = arr.slice(0, 5);
    return top5[Math.floor(Math.random() * top5.length)];
  };

  const commentary = pick(scoredCommentaries);
  const selectedQuestions = scoredQuestions.slice(0, 2); // 질문 2개
  const prayer = pick(scoredPrayers);

  // --- 노출 기록 ---
  await recordShown(userId, 'commentary', commentary.id);
  await recordShown(userId, 'prayer', prayer.id);

  return {
    date: today,
    passage,
    commentary: {
      content: commentary.content,
      key_word: commentary.key_word,
      background: commentary.background
    },
    questions: selectedQuestions.map(q => q.question),
    prayer: prayer?.content || null,
    cross_references: await getCrossRefs(passage.id),
    maturity_level: profile.maturity_level
  };
}
```

### 3-3. 시간 감쇠 엔진

```javascript
/**
 * 매일 자정 cron으로 실행 (또는 사용자 접속 시 lazy 실행)
 */
async function applyTimeDecay(userId) {
  const profile = await getUserProfile(userId);
  const lastUpdate = new Date(profile.updated_at);
  const daysSince = Math.floor((Date.now() - lastUpdate) / 86400000);

  if (daysSince < 1) return;

  // B2 감정: ×0.7 per day
  const emotionDecay = Math.pow(0.7, daysSince);
  for (const key in profile.emotion) {
    profile.emotion[key] = Math.round(profile.emotion[key] * emotionDecay);
    if (profile.emotion[key] < 5) delete profile.emotion[key]; // 실질 소멸
  }

  // B3 상황 압박도: ×0.85 per day
  const pressureDecay = Math.pow(0.85, daysSince);
  for (const key in profile.pressure) {
    profile.pressure[key] = Math.round(profile.pressure[key] * pressureDecay);
    if (profile.pressure[key] < 5) delete profile.pressure[key];
  }

  // B4 주제 관심도: ×0.95 per day (매우 느린 감쇠)
  const themeDecay = Math.pow(0.95, daysSince);
  for (const key in profile.theme_interest) {
    profile.theme_interest[key] = Math.round(profile.theme_interest[key] * themeDecay);
    if (profile.theme_interest[key] < 5) delete profile.theme_interest[key];
  }

  await saveProfile(profile);
}
```

### 3-4. 감정 체크인 처리

```javascript
/**
 * 사용자가 감정 카드를 터치했을 때
 * @param {string} userId
 * @param {Object} checkin - {"E01": 90, "E07": 60}
 */
async function processMoodCheckin(userId, checkin) {
  const profile = await getUserProfile(userId);

  // 기존 감정에 새 값 병합 (높은 쪽 우선)
  for (const [tag, value] of Object.entries(checkin)) {
    profile.emotion[tag] = Math.max(profile.emotion[tag] || 0, value);
  }

  // 연동 감정 자동 부여 (불안 → 스트레스 연동 등)
  const LINKED_EMOTIONS = {
    'E01': { 'E07': 0.6 },  // 불안 → 스트레스 60%
    'E02': { 'E03': 0.5 },  // 슬픔 → 우울 50%
    'E05': { 'E03': 0.4 },  // 외로움 → 우울 40%
    'E06': { 'E08': 0.5 },  // 죄책감 → 혼란 50%
  };

  for (const [trigger, links] of Object.entries(LINKED_EMOTIONS)) {
    if (checkin[trigger]) {
      for (const [linked, ratio] of Object.entries(links)) {
        const linkedValue = Math.round(checkin[trigger] * ratio);
        profile.emotion[linked] = Math.max(profile.emotion[linked] || 0, linkedValue);
      }
    }
  }

  await saveProfile(profile);
}
```

### 3-5. 성숙도 자동 상승 제안

```javascript
async function checkMaturityProgression(userId) {
  const profile = await getUserProfile(userId);
  const history = await getQtHistory(userId, 90); // 최근 90일

  const completedDays = history.filter(h => h.completed).length;
  const notesWithLength = history.filter(h => h.note_written);
  const avgNoteLength = notesWithLength.length > 0
    ? notesWithLength.reduce((s, h) => s + h.note_length, 0) / notesWithLength.length
    : 0;

  const NEXT = {
    exploring: 'growing',
    growing: 'close',
    close: 'centered',
    centered: null
  };

  if (completedDays >= 60 && avgNoteLength >= 50) {
    const next = NEXT[profile.maturity_level];
    if (next) {
      return {
        suggest: true,
        current: profile.maturity_level,
        next,
        message: '지난 90일간 꾸준히 묵상하셨네요. 더 깊은 단계로 나아가볼까요?'
      };
    }
  }

  return { suggest: false };
}
```

---

## 4. 프론트엔드 슬롯 구조

```
┌─────────────────────────────────────┐
│ [날짜] 2026년 4월 7일 월요일          │
│ "홍길동님, 오늘은 고요한 물가로        │
│  인도하시는 하나님을 만나보세요."       │ ← 동적 조립 문구
├─────────────────────────────────────┤
│ 슬롯 1: 본문                         │
│ 시편 23:1-6                          │
│ 1 여호와는 나의 목자시니...            │ ← bolls.life API
├─────────────────────────────────────┤
│ 슬롯 2: 오늘의 묵상 포인트             │
│ (해설 블록 — 소프트 스코어링 매칭)      │
│ "다윗이 이 시편을 쓸 때..."           │ ← commentary_blocks
├─────────────────────────────────────┤
│ 슬롯 3: 묵상 질문                     │
│ (질문 블록 — 성숙도 필터 + 스코어링)    │
│ "오늘 하루, 어떤 상황에서 목자의        │
│  인도하심이 필요한가요?"               │ ← question_blocks
├─────────────────────────────────────┤
│ 슬롯 4: 기도 가이드                   │
│ (기도 블록 — 감정 매칭)               │
│ "주님, 오늘도 저를 푸른 풀밭으로..."    │ ← prayer_blocks
├─────────────────────────────────────┤
│ 슬롯 5: 나의 묵상 노트                │
│ [자유 텍스트 / SOAP / 귀납적 / 렉시오]  │ ← 성숙도별 양식
├─────────────────────────────────────┤
│ 슬롯 6: 오늘의 감정 체크인             │
│ [불안해요] [슬퍼요] [감사해요] [괜찮아요] │ ← 소프트 태그 갱신
└─────────────────────────────────────┘
```

---

## 5. API 설계

```
# 오늘의 QT 조립 (핵심)
GET /api/v2/daily-qt
  → 서버에서 하드필터 + 소프트스코어링 + 조립
  → 응답: { passage, commentary, questions, prayer, cross_refs }

# 감정 체크인
POST /api/v2/mood-checkin
  → body: { tags: {"E01": 90, "E07": 60} }
  → 감정 태그 갱신 + 연동 감정 자동 부여

# QT 완료 기록
POST /api/v2/qt-complete
  → body: { passage_id, time_spent, note_length, highlighted_verses }
  → 주제 관심도(B4) 미세 축적 + 히스토리 저장

# 사용자 프로필 조회
GET /api/v2/profile
  → 성숙도, 전체 소프트 태그, 통계

# 성숙도 변경
POST /api/v2/maturity
  → body: { level: "growing" }

# 교회력 정보
GET /api/v2/liturgical/today
  → 오늘의 절기, 특별일
```

---

## 6. 데이터 생성 전략

기존 qt-guides-topic1~116.json의 데이터를 **블록으로 분해**:

```
기존: 1개 day 객체 = { passage, common, exploring, growing, close, centered }

분해 후:
  → bible_passages: passage 저장 + 하드필터(testament, genre) + 소프트태그(TH, D)
  → commentary_blocks: common.background + 성숙도별 해설 → 4개 블록
    각 블록에 allowed_maturity + soft_tags(T, C, E, P, TH) 부여
  → question_blocks: exploring.question, growing.observation 등 → 각각 독립 블록
    각 블록에 allowed_maturity + soft_tags 부여
  → prayer_blocks: 성숙도별 prayer_guide → 각각 독립 블록
```

기존 78개 가이드 × 30일 × 4단계 = **~9,360개 블록**으로 분해 가능.

### 소프트 태그 부여 방법

블록 분해 시 각 블록에 0~100 정수 태그를 사전 부여:
- 신학 주제(TH01~TH20): 본문/해설 내용 기반으로 전문가 판단 or 규칙 매핑
- 감정(E01~E15): 해설 톤/주제에서 추론
- 상황(P01~P12): 적용 대상 상황에서 추론
- 분위기(C01~C04): 해설 관점에서 직접 매핑
  - "위로" 관점 → C01=85
  - "도전" 관점 → C02=85
  - "신학" 관점 → C03=85
  - "관상" 관점 → C04=85
- 기질(T01~T09): 분위기와 역매핑
  - C01 높은 블록 → T06(돌봄) 높게
  - C03 높은 블록 → T09(지성) 높게
- 난이도(D01): 성숙도 레벨에서 추론
  - exploring 전용 → D01=20
  - centered 전용 → D01=80

---

## 7. 마이그레이션 계획

```
Phase 1: DB 스키마 생성 + 기존 JSON → 블록 분해 스크립트
Phase 2: 스코어링 엔진 구현 (scoreBlock, dimScore)
Phase 3: 조립 엔진 API 구현 (assembleDailyQT)
Phase 4: 시간 감쇠 + 감정 체크인 구현
Phase 5: 온보딩 → 초기 소프트 태그 연결 (기질 퀴즈)
Phase 6: 프론트엔드 슬롯 UI 구현
Phase 7: 교회력 엔진 구현
Phase 8: 테스트 + 기존 사용자 마이그레이션
```

---

## 8. TAG_SYSTEM_V2.md와의 일치 확인

```
하드 필터:
  A1 maturity_level     → user_spiritual_profile.maturity_level + allowed_maturity[]
  A2 liturgical_season   → liturgical_calendar.season + season_tags[]
  A3 성경 메타           → bible_passages.testament/genre/book_name/chapter/verse
  A4 recently_shown      → recently_shown 테이블
  A5 is_crisis           → is_crisis boolean + has_crisis boolean

소프트 가중치 (63개):
  B1 영적 기질 (9)       → temperament JSONB (T01~T09)
  B2 감정 상태 (15)      → emotion JSONB (E01~E15)
  B3 상황 압박도 (12)    → pressure JSONB (P01~P12)
  B4 신학 주제 (20)      → theme_interest JSONB (TH01~TH20)
  B5 콘텐츠 분위기 (4)   → mood_pref JSONB (C01~C04)
  B6 본문 속성 (3)       → soft_tags 내 D01~D03

스코어링:
  가중치 내적 (코사인 유사도 사용하지 않음)
  차원별 가중치: 기질0.20 감정0.30 상황0.10 주제0.15 분위기0.15 난이도0.10 = 1.00
  시간 감쇠: 감정 ×0.7/일, 상황 ×0.85/일, 주제 ×0.95/일
```

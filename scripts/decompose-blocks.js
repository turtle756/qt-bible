/**
 * 기존 qt-guides 11,650블록 → 독립 풀 4개로 분해
 *
 * 출력:
 *   commentary-pool.json  — 해설 풀 (관찰/해석/배경)
 *   question-pool.json    — 질문 풀
 *   prayer-pool.json      — 기도 풀
 *   keyword-pool.json     — 원어 해설 풀
 *
 * 각 항목은 passage_ref에 연결 + 독립 soft_tags 보유
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'public', 'data');
const guideFiles = fs.readdirSync(dataDir).filter(f => f.match(/^qt-guides-topic\d+\.json$/));

const commentaryPool = [];
const questionPool = [];
const prayerPool = [];
const keywordPool = [];

let cmtId = 1, qId = 1, prId = 1, kwId = 1;

// 성숙도별 C태그 보정
const TONE_BOOST = {
  exploring: { C01: 25, C02: -10, C03: -15, C04: -5 },
  growing:   { C01: 10, C02: 10, C03: 5, C04: 0 },
  close:     { C01: -5, C02: 10, C03: 25, C04: 5 },
  centered:  { C01: 0, C02: -10, C03: 10, C04: 25 }
};

function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }

function makeTags(baseTags, maturity) {
  const tags = { ...baseTags };
  const boost = TONE_BOOST[maturity] || {};
  for (const [k, v] of Object.entries(boost)) {
    tags[k] = clamp((tags[k] || 40) + v);
  }
  return tags;
}

for (const file of guideFiles) {
  const days = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));

  for (const day of days) {
    const passageRef = day.passage;
    const topicName = day.topic;
    const baseTags = day.common?.soft_tags || {};
    const passageMeta = day.passage_meta || {};

    // 원어 해설 (common에서 추출)
    if (day.common?.key_word) {
      keywordPool.push({
        id: `KW_${String(kwId++).padStart(4, '0')}`,
        passage_ref: passageRef,
        content: day.common.key_word,
        source_topic: topicName,
        soft_tags: { ...baseTags }
      });
    }

    // 각 성숙도 블록에서 추출
    for (const maturity of ['exploring', 'growing', 'close', 'centered']) {
      const block = day[maturity];
      if (!block) continue;

      const tags = makeTags(baseTags, maturity);
      const allowedMat = block.allowed_maturity || [maturity];

      // === 해설 추출 ===
      if (maturity === 'exploring') {
        // exploring은 감정 질문이 해설 역할도 함
        if (block.question_1) {
          commentaryPool.push({
            id: `CMT_${String(cmtId++).padStart(4, '0')}`,
            passage_ref: passageRef,
            content: block.question_1,
            type: 'emotional_reflection',
            source_topic: topicName,
            source_maturity: maturity,
            soft_tags: tags,
            allowed_maturity: allowedMat
          });
        }
      } else if (maturity === 'growing') {
        if (block.observation) {
          commentaryPool.push({
            id: `CMT_${String(cmtId++).padStart(4, '0')}`,
            passage_ref: passageRef,
            content: block.observation,
            type: 'observation',
            source_topic: topicName,
            source_maturity: maturity,
            soft_tags: tags,
            allowed_maturity: allowedMat
          });
        }
      } else if (maturity === 'close') {
        // close는 context + observation_deep + interpretation 합산
        const parts = [];
        if (block.context) parts.push(block.context);
        if (block.observation_deep) parts.push(block.observation_deep);
        if (block.interpretation) parts.push(block.interpretation);
        if (parts.length > 0) {
          commentaryPool.push({
            id: `CMT_${String(cmtId++).padStart(4, '0')}`,
            passage_ref: passageRef,
            content: parts.join('\n\n'),
            type: 'deep_analysis',
            source_topic: topicName,
            source_maturity: maturity,
            soft_tags: tags,
            allowed_maturity: allowedMat
          });
        }
      } else if (maturity === 'centered') {
        const parts = [];
        if (block.lectio) parts.push(block.lectio);
        if (block.meditatio) parts.push(block.meditatio);
        if (parts.length > 0) {
          commentaryPool.push({
            id: `CMT_${String(cmtId++).padStart(4, '0')}`,
            passage_ref: passageRef,
            content: parts.join('\n\n'),
            type: 'contemplative',
            source_topic: topicName,
            source_maturity: maturity,
            soft_tags: tags,
            allowed_maturity: allowedMat
          });
        }
      }

      // === 질문 추출 ===
      const questions = [];
      if (maturity === 'exploring') {
        if (block.question_1) questions.push(block.question_1);
        if (block.question_2) questions.push(block.question_2);
      } else if (maturity === 'growing') {
        if (block.observation) questions.push(block.observation);
        if (block.application) questions.push(block.application);
      } else if (maturity === 'close') {
        if (block.observation_deep) questions.push(block.observation_deep);
        if (block.application_deep) questions.push(block.application_deep);
      } else if (maturity === 'centered') {
        if (block.oratio) questions.push(block.oratio);
        if (block.actio) questions.push(block.actio);
      }

      for (const q of questions) {
        questionPool.push({
          id: `Q_${String(qId++).padStart(4, '0')}`,
          passage_ref: passageRef,
          content: q,
          source_topic: topicName,
          source_maturity: maturity,
          soft_tags: tags,
          allowed_maturity: allowedMat
        });
      }

      // === 기도 추출 ===
      const prayerContent = block.prayer_guide || block.contemplatio;
      if (prayerContent) {
        prayerPool.push({
          id: `PR_${String(prId++).padStart(4, '0')}`,
          passage_ref: passageRef,
          content: prayerContent,
          type: block.prayer_guide ? 'guided' : 'contemplative',
          source_topic: topicName,
          source_maturity: maturity,
          soft_tags: tags,
          allowed_maturity: allowedMat
        });
      }
    }

    // common의 background도 해설로 추출 (범용 — 모든 성숙도)
    if (day.common?.background) {
      commentaryPool.push({
        id: `CMT_${String(cmtId++).padStart(4, '0')}`,
        passage_ref: passageRef,
        content: day.common.background,
        type: 'background',
        source_topic: topicName,
        source_maturity: 'all',
        soft_tags: baseTags,
        allowed_maturity: ['exploring', 'growing', 'close', 'centered']
      });
    }
  }
}

// 저장
const outDir = path.join(dataDir, 'pools');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

fs.writeFileSync(path.join(outDir, 'commentary-pool.json'), JSON.stringify(commentaryPool, null, 2));
fs.writeFileSync(path.join(outDir, 'question-pool.json'), JSON.stringify(questionPool, null, 2));
fs.writeFileSync(path.join(outDir, 'prayer-pool.json'), JSON.stringify(prayerPool, null, 2));
fs.writeFileSync(path.join(outDir, 'keyword-pool.json'), JSON.stringify(keywordPool, null, 2));

// 통계
console.log('=== 블록 분해 결과 ===');
console.log(`해설 풀: ${commentaryPool.length}개`);
console.log(`질문 풀: ${questionPool.length}개`);
console.log(`기도 풀: ${prayerPool.length}개`);
console.log(`원어 풀: ${keywordPool.length}개`);
console.log(`총합: ${commentaryPool.length + questionPool.length + prayerPool.length + keywordPool.length}개`);

// 타입별 분포
const cmtTypes = {};
commentaryPool.forEach(c => { cmtTypes[c.type] = (cmtTypes[c.type] || 0) + 1; });
console.log('\n해설 타입 분포:');
Object.entries(cmtTypes).sort((a,b) => b[1]-a[1]).forEach(([t,n]) => console.log(`  ${t}: ${n}`));

// 본문 커버리지
const passages = new Set([...commentaryPool.map(c=>c.passage_ref), ...questionPool.map(q=>q.passage_ref)]);
console.log(`\n본문 커버리지: ${passages.size}개 passage`);

// 파일 크기
const sizes = {
  commentary: (fs.statSync(path.join(outDir, 'commentary-pool.json')).size / 1024 / 1024).toFixed(1),
  question: (fs.statSync(path.join(outDir, 'question-pool.json')).size / 1024 / 1024).toFixed(1),
  prayer: (fs.statSync(path.join(outDir, 'prayer-pool.json')).size / 1024 / 1024).toFixed(1),
  keyword: (fs.statSync(path.join(outDir, 'keyword-pool.json')).size / 1024 / 1024).toFixed(1),
};
console.log('\n파일 크기:');
Object.entries(sizes).forEach(([k,v]) => console.log(`  ${k}: ${v}MB`));

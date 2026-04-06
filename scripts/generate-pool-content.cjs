/**
 * 누락된 passage에 대해 GPT-4o로 콘텐츠 풀(해설/질문/기도/원어) 생성
 * 사용법: node scripts/generate-pool-content.cjs
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const dataDir = path.join(__dirname, '..', 'static', 'data');

const missingPassages = JSON.parse(fs.readFileSync(path.join(dataDir, '_missing-priority.json'), 'utf8'));

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callOpenAI(prompt, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: '성경 QT 콘텐츠 작가입니다. 개역개정 기준. JSON으로만 응답하세요.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (e) {
      if (attempt < retries - 1) await sleep(2000 * (attempt + 1));
      else throw e;
    }
  }
}

function buildPrompt(p) {
  return `성경 본문: ${p.passage_ref} (${p.pericope_title || ''})

이 본문에 대해 아래 4가지를 JSON으로 작성하세요:

{
  "commentary": "(해설 3-5문장. 본문의 역사적 배경과 핵심 메시지를 따뜻하고 깊이 있게 설명)",
  "question": "(묵상 질문 2-3문장. 독자의 삶과 연결하는 질문)",
  "prayer": "(기도문 2-3문장. 1인칭으로 본문에 기반한 기도)",
  "keyword": "(핵심 원어 1개. '원어(원어표기) - 뜻. 설명 2문장' 형식)"
}

중요:
- 한국어로 작성
- 개역개정 성경 기준
- "30일 여정" 같은 프로그램 관련 문구 사용 금지
- 따뜻하고 개인적인 톤으로`;
}

async function main() {
  console.log(`=== 콘텐츠 풀 생성 시작 === ${missingPassages.length}개 passage`);

  // 기존 풀 로드
  const poolDir = path.join(dataDir, 'pools');
  const commentary = JSON.parse(fs.readFileSync(path.join(poolDir, 'commentary-pool.json'), 'utf8'));
  const question = JSON.parse(fs.readFileSync(path.join(poolDir, 'question-pool.json'), 'utf8'));
  const prayer = JSON.parse(fs.readFileSync(path.join(poolDir, 'prayer-pool.json'), 'utf8'));
  const keyword = JSON.parse(fs.readFileSync(path.join(poolDir, 'keyword-pool.json'), 'utf8'));

  let comId = commentary.length + 1;
  let queId = question.length + 1;
  let praId = prayer.length + 1;
  let keyId = keyword.length + 1;

  let done = 0;
  let failed = 0;

  for (const p of missingPassages) {
    try {
      const result = await callOpenAI(buildPrompt(p));

      if (result.commentary) {
        commentary.push({
          id: `CMT_NEW_${String(comId++).padStart(4, '0')}`,
          passage_ref: p.passage_ref,
          content: result.commentary,
          type: 'emotional_reflection',
          source_topic: p.pericope_title || '',
          source_maturity: 'exploring',
          soft_tags: p.soft_tags || {},
          allowed_maturity: ['exploring', 'growing', 'close', 'centered']
        });
      }
      if (result.question) {
        question.push({
          id: `Q_NEW_${String(queId++).padStart(4, '0')}`,
          passage_ref: p.passage_ref,
          content: result.question,
          source_topic: p.pericope_title || '',
          source_maturity: 'exploring',
          soft_tags: p.soft_tags || {},
          allowed_maturity: ['exploring', 'growing', 'close', 'centered']
        });
      }
      if (result.prayer) {
        prayer.push({
          id: `P_NEW_${String(praId++).padStart(4, '0')}`,
          passage_ref: p.passage_ref,
          content: result.prayer,
          type: 'personal',
          source_topic: p.pericope_title || '',
          source_maturity: 'exploring',
          soft_tags: p.soft_tags || {},
          allowed_maturity: ['exploring', 'growing', 'close', 'centered']
        });
      }
      if (result.keyword) {
        keyword.push({
          id: `KW_NEW_${String(keyId++).padStart(4, '0')}`,
          passage_ref: p.passage_ref,
          content: result.keyword,
          source_topic: p.pericope_title || '',
          soft_tags: p.soft_tags || {}
        });
      }

      done++;
      if (done % 10 === 0) {
        process.stdout.write(`${done}/${missingPassages.length} `);
        // 중간 저장 (50개마다)
        if (done % 50 === 0) {
          fs.writeFileSync(path.join(poolDir, 'commentary-pool.json'), JSON.stringify(commentary, null, 2), 'utf8');
          fs.writeFileSync(path.join(poolDir, 'question-pool.json'), JSON.stringify(question, null, 2), 'utf8');
          fs.writeFileSync(path.join(poolDir, 'prayer-pool.json'), JSON.stringify(prayer, null, 2), 'utf8');
          fs.writeFileSync(path.join(poolDir, 'keyword-pool.json'), JSON.stringify(keyword, null, 2), 'utf8');
        }
      }
    } catch (e) {
      console.error(`\n  FAIL ${p.passage_ref}: ${e.message?.slice(0, 60)}`);
      failed++;
    }
    await sleep(400);
  }

  // 최종 저장
  fs.writeFileSync(path.join(poolDir, 'commentary-pool.json'), JSON.stringify(commentary, null, 2), 'utf8');
  fs.writeFileSync(path.join(poolDir, 'question-pool.json'), JSON.stringify(question, null, 2), 'utf8');
  fs.writeFileSync(path.join(poolDir, 'prayer-pool.json'), JSON.stringify(prayer, null, 2), 'utf8');
  fs.writeFileSync(path.join(poolDir, 'keyword-pool.json'), JSON.stringify(keyword, null, 2), 'utf8');

  console.log(`\n=== 완료 === 성공: ${done}, 실패: ${failed}`);
  console.log(`Commentary: ${commentary.length}, Question: ${question.length}, Prayer: ${prayer.length}, Keyword: ${keyword.length}`);
}

main().catch(e => { console.error(e); process.exit(1); });

/**
 * qt-guides-topic*.json 78개 파일의 day별 블록에 soft_tags 자동 부여
 *
 * 전략:
 * 1. 부모 토픽의 soft_tags를 기본값으로 상속
 * 2. 성숙도별 분위기(C) 보정:
 *    - exploring: C01(위로)↑, C02(도전)↓, C03(학문)↓, C04(관상)↓
 *    - growing:   균형
 *    - close:     C03(학문)↑, C02(도전)↑
 *    - centered:  C04(관상)↑, C03(학문)↑
 * 3. 성숙도별 난이도(D01) 보정
 * 4. 하드 필터 (allowed_maturity, is_crisis) 추가
 * 5. passage별 testament/genre 자동 판별
 */

const fs = require('fs');
const path = require('path');
const glob = require('path');

const dataDir = path.join(__dirname, '..', 'public', 'data');
const topicsDb = JSON.parse(fs.readFileSync(path.join(dataDir, 'topics-db.json'), 'utf8'));

// 토픽명 → soft_tags 매핑 (topics-db.json에서)
const topicTagMap = {};
topicsDb.forEach((t, i) => {
  topicTagMap[t.topic] = t.soft_tags || {};
  if (t.curricula_name) {
    topicTagMap[t.curricula_name] = t.soft_tags || {};
  }
});

// 가이드 파일 토픽명 → topics-db 토픽명 수동 매핑 (이름 불일치 해결)
const ALIAS_MAP = {
  "자존감 회복": "수치심",           // topic2: 자존감 = 수치심 계열
  "상실과 슬픔 속 위로": "슬픔",     // topic4
  "리더십과 섬김": "섬김",            // topic9
  "재정과 청지기 의식": "재정과 청지기", // topic10
  "두려움": "불안과 두려움",          // topic11
  "고독/소외": "외로움",              // topic17
  "순결": "순결/거룩",                // topic86
  "직장 생활": "직장과 소명",         // topic30
  "시험/입시": "시험과 입시",         // topic21
  "불안과 두려움 극복": "불안과 두려움", // topic1
  "용서하는 삶": "용서",              // topic6
  "기도의 능력": "기도",              // topic7
  "감사의 삶": "감사",                // topic8
  "분노 다스리기": "분노",            // topic3
  "외로움에서 하나님의 동행 발견": "외로움", // topic5
};
for (const [alias, canonical] of Object.entries(ALIAS_MAP)) {
  if (topicTagMap[canonical]) {
    topicTagMap[alias] = topicTagMap[canonical];
  }
}

// 성경 책 → testament/genre 매핑
const BIBLE_BOOKS = {
  // 구약 - 율법
  "창세기": { testament: "OT", genre: "율법" }, "출애굽기": { testament: "OT", genre: "율법" },
  "레위기": { testament: "OT", genre: "율법" }, "민수기": { testament: "OT", genre: "율법" },
  "신명기": { testament: "OT", genre: "율법" },
  // 구약 - 역사
  "여호수아": { testament: "OT", genre: "역사" }, "사사기": { testament: "OT", genre: "역사" },
  "룻기": { testament: "OT", genre: "역사" }, "사무엘상": { testament: "OT", genre: "역사" },
  "사무엘하": { testament: "OT", genre: "역사" }, "열왕기상": { testament: "OT", genre: "역사" },
  "열왕기하": { testament: "OT", genre: "역사" }, "역대상": { testament: "OT", genre: "역사" },
  "역대하": { testament: "OT", genre: "역사" }, "에스라": { testament: "OT", genre: "역사" },
  "느헤미야": { testament: "OT", genre: "역사" }, "에스더": { testament: "OT", genre: "역사" },
  // 구약 - 시가
  "욥기": { testament: "OT", genre: "시가" }, "시편": { testament: "OT", genre: "시가" },
  "잠언": { testament: "OT", genre: "시가" }, "전도서": { testament: "OT", genre: "시가" },
  "아가": { testament: "OT", genre: "시가" },
  // 구약 - 예언
  "이사야": { testament: "OT", genre: "예언" }, "예레미야": { testament: "OT", genre: "예언" },
  "예레미야애가": { testament: "OT", genre: "예언" }, "에스겔": { testament: "OT", genre: "예언" },
  "다니엘": { testament: "OT", genre: "예언" }, "호세아": { testament: "OT", genre: "예언" },
  "요엘": { testament: "OT", genre: "예언" }, "아모스": { testament: "OT", genre: "예언" },
  "오바댜": { testament: "OT", genre: "예언" }, "요나": { testament: "OT", genre: "예언" },
  "미가": { testament: "OT", genre: "예언" }, "나훔": { testament: "OT", genre: "예언" },
  "하박국": { testament: "OT", genre: "예언" }, "스바냐": { testament: "OT", genre: "예언" },
  "학개": { testament: "OT", genre: "예언" }, "스가랴": { testament: "OT", genre: "예언" },
  "말라기": { testament: "OT", genre: "예언" },
  // 신약 - 복음
  "마태복음": { testament: "NT", genre: "복음" }, "마가복음": { testament: "NT", genre: "복음" },
  "누가복음": { testament: "NT", genre: "복음" }, "요한복음": { testament: "NT", genre: "복음" },
  // 신약 - 역사
  "사도행전": { testament: "NT", genre: "역사" },
  // 신약 - 서신
  "로마서": { testament: "NT", genre: "서신" }, "고린도전서": { testament: "NT", genre: "서신" },
  "고린도후서": { testament: "NT", genre: "서신" }, "갈라디아서": { testament: "NT", genre: "서신" },
  "에베소서": { testament: "NT", genre: "서신" }, "빌립보서": { testament: "NT", genre: "서신" },
  "골로새서": { testament: "NT", genre: "서신" }, "데살로니가전서": { testament: "NT", genre: "서신" },
  "데살로니가후서": { testament: "NT", genre: "서신" }, "디모데전서": { testament: "NT", genre: "서신" },
  "디모데후서": { testament: "NT", genre: "서신" }, "디도서": { testament: "NT", genre: "서신" },
  "빌레몬서": { testament: "NT", genre: "서신" }, "히브리서": { testament: "NT", genre: "서신" },
  "야고보서": { testament: "NT", genre: "서신" }, "베드로전서": { testament: "NT", genre: "서신" },
  "베드로후서": { testament: "NT", genre: "서신" }, "요한일서": { testament: "NT", genre: "서신" },
  "요한이서": { testament: "NT", genre: "서신" }, "요한삼서": { testament: "NT", genre: "서신" },
  "유다서": { testament: "NT", genre: "서신" },
  // 신약 - 묵시
  "요한계시록": { testament: "NT", genre: "묵시" }
};

function parsePassageRef(ref) {
  if (!ref) return null;
  // "요한복음 14:23-31" → { book: "요한복음", chapter: 14, verse_start: 23, verse_end: 31 }
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) {
    // "요한복음 14장" 같은 형태
    const match2 = ref.match(/^(.+?)\s+(\d+)/);
    if (match2) {
      const bookName = match2[1];
      return { book: bookName, ...(BIBLE_BOOKS[bookName] || {}), chapter: parseInt(match2[2]) };
    }
    return null;
  }
  const bookName = match[1];
  return {
    book: bookName,
    ...(BIBLE_BOOKS[bookName] || {}),
    chapter: parseInt(match[2]),
    verse_start: parseInt(match[3]),
    verse_end: match[4] ? parseInt(match[4]) : parseInt(match[3])
  };
}

// 성숙도별 분위기/난이도 보정
const MATURITY_ADJUSTMENTS = {
  exploring: { C01: 15, C02: -10, C03: -20, C04: -10, D01: -15 },
  growing:   { C01: 5,  C02: 5,   C03: 0,   C04: 0,   D01: 0 },
  close:     { C01: -5, C02: 10,  C03: 15,  C04: 5,   D01: 15 },
  centered:  { C01: -5, C02: -5,  C03: 10,  C04: 20,  D01: 20 }
};

function clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }

function makeBlockTags(baseTags, maturityLevel) {
  const adj = MATURITY_ADJUSTMENTS[maturityLevel] || {};
  const tags = { ...baseTags };
  for (const [key, delta] of Object.entries(adj)) {
    if (tags[key] !== undefined) {
      tags[key] = clamp(tags[key] + delta);
    } else if (delta > 0) {
      tags[key] = clamp(delta + 30); // 기본 30에서 보정
    }
  }
  return tags;
}

// ========== 가이드 파일 처리 ==========
const guideFiles = fs.readdirSync(dataDir)
  .filter(f => f.match(/^qt-guides-topic\d+\.json$/))
  .sort((a, b) => {
    const na = parseInt(a.match(/\d+/)[0]);
    const nb = parseInt(b.match(/\d+/)[0]);
    return na - nb;
  });

let totalFiles = 0;
let totalDays = 0;
let totalBlocks = 0;

guideFiles.forEach(file => {
  const filePath = path.join(dataDir, file);
  const days = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(days) || days.length === 0) return;

  const topicName = days[0].topic;
  const baseTags = topicTagMap[topicName] || {};

  if (Object.keys(baseTags).length === 0) {
    console.log(`  [WARN] 토픽 태그 없음: ${topicName} (${file})`);
    return;
  }

  // 해당 토픽의 is_crisis 가져오기
  const topicEntry = topicsDb.find(t => t.topic === topicName || t.curricula_name === topicName);
  const isCrisis = topicEntry ? topicEntry.is_crisis : false;

  days.forEach(day => {
    // passage 메타 파싱
    const passageMeta = parsePassageRef(day.passage);

    // day 레벨에 메타 추가
    day.passage_meta = passageMeta;
    day.is_crisis = isCrisis;

    // 각 성숙도 블록에 태그 부여
    const levels = ['exploring', 'growing', 'close', 'centered'];
    levels.forEach(level => {
      if (day[level]) {
        day[level].soft_tags = makeBlockTags(baseTags, level);
        day[level].allowed_maturity = [level];
        // growing 블록은 exploring도 볼 수 있게
        if (level === 'growing') day[level].allowed_maturity = ['growing', 'exploring'];
        if (level === 'close') day[level].allowed_maturity = ['close', 'growing'];
        totalBlocks++;
      }
    });

    // common 블록 (모든 성숙도 공통)
    if (day.common) {
      day.common.soft_tags = baseTags; // 보정 없이 기본 태그
      day.common.allowed_maturity = ['exploring', 'growing', 'close', 'centered'];
      totalBlocks++;
    }

    totalDays++;
  });

  fs.writeFileSync(filePath, JSON.stringify(days, null, 2), 'utf8');
  totalFiles++;
});

console.log(`\n=== 가이드 파일 태깅 결과 ===`);
console.log(`처리된 파일: ${totalFiles}개`);
console.log(`처리된 일수: ${totalDays}일`);
console.log(`태깅된 블록: ${totalBlocks}개`);
console.log(`\n--- 파일별 현황 ---`);

guideFiles.forEach(file => {
  const filePath = path.join(dataDir, file);
  const days = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const dayCount = days.length;
  const topicName = days[0]?.topic || '?';
  const hasTagged = days[0]?.common?.soft_tags ? 'OK' : 'MISS';
  console.log(`  ${file} — ${topicName} (${dayCount}일) [${hasTagged}]`);
});

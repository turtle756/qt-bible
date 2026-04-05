/**
 * 78개 가이드 파일에서 모든 passage를 추출하여
 * bible_passages 테이블용 seed JSON 생성
 *
 * 중복 passage_ref는 soft_tags를 병합 (최댓값)
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'public', 'data');
const topicsDb = JSON.parse(fs.readFileSync(path.join(dataDir, 'topics-db.json'), 'utf8'));

const BIBLE_BOOKS = {
  "창세기":{id:1,t:"OT",g:"율법"},"출애굽기":{id:2,t:"OT",g:"율법"},
  "레위기":{id:3,t:"OT",g:"율법"},"민수기":{id:4,t:"OT",g:"율법"},
  "신명기":{id:5,t:"OT",g:"율법"},"여호수아":{id:6,t:"OT",g:"역사"},
  "사사기":{id:7,t:"OT",g:"역사"},"룻기":{id:8,t:"OT",g:"역사"},
  "사무엘상":{id:9,t:"OT",g:"역사"},"사무엘하":{id:10,t:"OT",g:"역사"},
  "열왕기상":{id:11,t:"OT",g:"역사"},"열왕기하":{id:12,t:"OT",g:"역사"},
  "역대상":{id:13,t:"OT",g:"역사"},"역대하":{id:14,t:"OT",g:"역사"},
  "에스라":{id:15,t:"OT",g:"역사"},"느헤미야":{id:16,t:"OT",g:"역사"},
  "에스더":{id:17,t:"OT",g:"역사"},"욥기":{id:18,t:"OT",g:"시가"},
  "시편":{id:19,t:"OT",g:"시가"},"잠언":{id:20,t:"OT",g:"시가"},
  "전도서":{id:21,t:"OT",g:"시가"},"아가":{id:22,t:"OT",g:"시가"},
  "이사야":{id:23,t:"OT",g:"예언"},"예레미야":{id:24,t:"OT",g:"예언"},
  "예레미야애가":{id:25,t:"OT",g:"예언"},"에스겔":{id:26,t:"OT",g:"예언"},
  "다니엘":{id:27,t:"OT",g:"예언"},"호세아":{id:28,t:"OT",g:"예언"},
  "요엘":{id:29,t:"OT",g:"예언"},"아모스":{id:30,t:"OT",g:"예언"},
  "오바댜":{id:31,t:"OT",g:"예언"},"요나":{id:32,t:"OT",g:"예언"},
  "미가":{id:33,t:"OT",g:"예언"},"나훔":{id:34,t:"OT",g:"예언"},
  "하박국":{id:35,t:"OT",g:"예언"},"스바냐":{id:36,t:"OT",g:"예언"},
  "학개":{id:37,t:"OT",g:"예언"},"스가랴":{id:38,t:"OT",g:"예언"},
  "말라기":{id:39,t:"OT",g:"예언"},
  "마태복음":{id:40,t:"NT",g:"복음"},"마가복음":{id:41,t:"NT",g:"복음"},
  "누가복음":{id:42,t:"NT",g:"복음"},"요한복음":{id:43,t:"NT",g:"복음"},
  "사도행전":{id:44,t:"NT",g:"역사"},
  "로마서":{id:45,t:"NT",g:"서신"},"고린도전서":{id:46,t:"NT",g:"서신"},
  "고린도후서":{id:47,t:"NT",g:"서신"},"갈라디아서":{id:48,t:"NT",g:"서신"},
  "에베소서":{id:49,t:"NT",g:"서신"},"빌립보서":{id:50,t:"NT",g:"서신"},
  "골로새서":{id:51,t:"NT",g:"서신"},"데살로니가전서":{id:52,t:"NT",g:"서신"},
  "데살로니가후서":{id:53,t:"NT",g:"서신"},"디모데전서":{id:54,t:"NT",g:"서신"},
  "디모데후서":{id:55,t:"NT",g:"서신"},"디도서":{id:56,t:"NT",g:"서신"},
  "빌레몬서":{id:57,t:"NT",g:"서신"},"히브리서":{id:58,t:"NT",g:"서신"},
  "야고보서":{id:59,t:"NT",g:"서신"},"베드로전서":{id:60,t:"NT",g:"서신"},
  "베드로후서":{id:61,t:"NT",g:"서신"},"요한일서":{id:62,t:"NT",g:"서신"},
  "요한이서":{id:63,t:"NT",g:"서신"},"요한삼서":{id:64,t:"NT",g:"서신"},
  "유다서":{id:65,t:"NT",g:"서신"},
  "요한계시록":{id:66,t:"NT",g:"묵시"}
};

function parseRef(ref) {
  if (!ref) return null;
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) {
    const m2 = ref.match(/^(.+?)\s+(\d+)$/);
    if (m2) {
      const bk = BIBLE_BOOKS[m2[1]];
      if (!bk) return null;
      return { ref, book: m2[1], bookId: bk.id, testament: bk.t, genre: bk.g,
               chapter: parseInt(m2[2]), vs: 1, ve: null };
    }
    return null;
  }
  const bk = BIBLE_BOOKS[m[1]];
  if (!bk) return null;
  return { ref, book: m[1], bookId: bk.id, testament: bk.t, genre: bk.g,
           chapter: parseInt(m[2]), vs: parseInt(m[3]), ve: m[4] ? parseInt(m[4]) : parseInt(m[3]) };
}

// topicIndex: topic name → topics-db index (1-based)
const topicIndex = {};
topicsDb.forEach((t, i) => {
  topicIndex[t.topic] = i + 1;
  if (t.curricula_name) topicIndex[t.curricula_name] = i + 1;
});

// 별칭 매핑
const ALIAS = {
  "자존감 회복": "수치심", "상실과 슬픔 속 위로": "슬픔",
  "리더십과 섬김": "섬김", "재정과 청지기 의식": "재정과 청지기",
  "두려움": "불안과 두려움", "고독/소외": "외로움", "순결": "순결/거룩",
  "직장 생활": "직장과 소명", "시험/입시": "시험과 입시",
  "불안과 두려움 극복": "불안과 두려움", "용서하는 삶": "용서",
  "기도의 능력": "기도", "감사의 삶": "감사", "분노 다스리기": "분노",
  "외로움에서 하나님의 동행 발견": "외로움"
};
for (const [a, c] of Object.entries(ALIAS)) {
  if (topicIndex[c]) topicIndex[a] = topicIndex[c];
}

// passage_ref → merged data
const passages = {};

const guideFiles = fs.readdirSync(dataDir)
  .filter(f => f.match(/^qt-guides-topic\d+\.json$/));

guideFiles.forEach(file => {
  const days = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
  const topicName = days[0]?.topic;
  const topicId = topicIndex[topicName] || null;
  const topicEntry = topicsDb.find(t => t.topic === topicName || t.curricula_name === topicName);
  const baseTags = topicEntry?.soft_tags || {};

  days.forEach(day => {
    const parsed = parseRef(day.passage);
    if (!parsed) return;

    const key = parsed.ref;
    if (!passages[key]) {
      passages[key] = {
        passage_ref: key,
        book_name: parsed.book,
        book_id: parsed.bookId,
        chapter: parsed.chapter,
        verse_start: parsed.vs,
        verse_end: parsed.ve,
        testament: parsed.testament,
        genre: parsed.genre,
        soft_tags: { ...baseTags },
        source_topics: [topicId]
      };
    } else {
      // 병합: soft_tags는 최댓값, source_topics는 합집합
      for (const [tag, val] of Object.entries(baseTags)) {
        passages[key].soft_tags[tag] = Math.max(passages[key].soft_tags[tag] || 0, val);
      }
      if (topicId && !passages[key].source_topics.includes(topicId)) {
        passages[key].source_topics.push(topicId);
      }
    }
  });
});

const result = Object.values(passages).sort((a, b) => {
  if (a.book_id !== b.book_id) return a.book_id - b.book_id;
  if (a.chapter !== b.chapter) return a.chapter - b.chapter;
  return a.verse_start - b.verse_start;
});

const outPath = path.join(dataDir, 'bible-passages-seed.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');

// 통계
const books = new Set(result.map(p => p.book_name));
const otCount = result.filter(p => p.testament === 'OT').length;
const ntCount = result.filter(p => p.testament === 'NT').length;

console.log(`\n=== 페리코페 추출 결과 ===`);
console.log(`총 페리코페: ${result.length}개 (중복 제거 후)`);
console.log(`구약: ${otCount}, 신약: ${ntCount}`);
console.log(`사용된 성경 책: ${books.size}권`);
console.log(`저장: ${outPath}`);

// 장르별 분포
const genres = {};
result.forEach(p => { genres[p.genre] = (genres[p.genre] || 0) + 1; });
console.log(`\n장르 분포:`);
Object.entries(genres).sort((a,b) => b[1]-a[1]).forEach(([g, c]) => console.log(`  ${g}: ${c}`));

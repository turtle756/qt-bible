/**
 * 대한성서공회 소제목(페리코페) 수집 스크립트
 * 개역개정 기준 66권 전체
 */

const fs = require('fs');
const path = require('path');

const BOOKS = [
  {code:'gen',name:'창세기',id:1,ch:50},{code:'exo',name:'출애굽기',id:2,ch:40},
  {code:'lev',name:'레위기',id:3,ch:27},{code:'num',name:'민수기',id:4,ch:36},
  {code:'deu',name:'신명기',id:5,ch:34},{code:'jos',name:'여호수아',id:6,ch:24},
  {code:'jdg',name:'사사기',id:7,ch:21},{code:'rut',name:'룻기',id:8,ch:4},
  {code:'1sa',name:'사무엘상',id:9,ch:31},{code:'2sa',name:'사무엘하',id:10,ch:24},
  {code:'1ki',name:'열왕기상',id:11,ch:22},{code:'2ki',name:'열왕기하',id:12,ch:25},
  {code:'1ch',name:'역대상',id:13,ch:29},{code:'2ch',name:'역대하',id:14,ch:36},
  {code:'ezr',name:'에스라',id:15,ch:10},{code:'neh',name:'느헤미야',id:16,ch:13},
  {code:'est',name:'에스더',id:17,ch:10},{code:'job',name:'욥기',id:18,ch:42},
  {code:'psa',name:'시편',id:19,ch:150},{code:'pro',name:'잠언',id:20,ch:31},
  {code:'ecc',name:'전도서',id:21,ch:12},{code:'sol',name:'아가',id:22,ch:8},
  {code:'isa',name:'이사야',id:23,ch:66},{code:'jer',name:'예레미야',id:24,ch:52},
  {code:'lam',name:'애가',id:25,ch:5},{code:'eze',name:'에스겔',id:26,ch:48},
  {code:'dan',name:'다니엘',id:27,ch:12},{code:'hos',name:'호세아',id:28,ch:14},
  {code:'joe',name:'요엘',id:29,ch:3},{code:'amo',name:'아모스',id:30,ch:9},
  {code:'oba',name:'오바댜',id:31,ch:1},{code:'jon',name:'요나',id:32,ch:4},
  {code:'mic',name:'미가',id:33,ch:7},{code:'nah',name:'나훔',id:34,ch:3},
  {code:'hab',name:'하박국',id:35,ch:3},{code:'zep',name:'스바냐',id:36,ch:3},
  {code:'hag',name:'학개',id:37,ch:2},{code:'zec',name:'스가랴',id:38,ch:14},
  {code:'mal',name:'말라기',id:39,ch:4},
  {code:'mat',name:'마태복음',id:40,ch:28},{code:'mar',name:'마가복음',id:41,ch:16},
  {code:'luk',name:'누가복음',id:42,ch:24},{code:'joh',name:'요한복음',id:43,ch:21},
  {code:'act',name:'사도행전',id:44,ch:28},{code:'rom',name:'로마서',id:45,ch:16},
  {code:'1co',name:'고린도전서',id:46,ch:16},{code:'2co',name:'고린도후서',id:47,ch:13},
  {code:'gal',name:'갈라디아서',id:48,ch:6},{code:'eph',name:'에베소서',id:49,ch:6},
  {code:'phi',name:'빌립보서',id:50,ch:4},{code:'col',name:'골로새서',id:51,ch:4},
  {code:'1th',name:'데살로니가전서',id:52,ch:5},{code:'2th',name:'데살로니가후서',id:53,ch:3},
  {code:'1ti',name:'디모데전서',id:54,ch:6},{code:'2ti',name:'디모데후서',id:55,ch:4},
  {code:'tit',name:'디도서',id:56,ch:3},{code:'phm',name:'빌레몬서',id:57,ch:1},
  {code:'heb',name:'히브리서',id:58,ch:13},{code:'jam',name:'야고보서',id:59,ch:5},
  {code:'1pe',name:'베드로전서',id:60,ch:5},{code:'2pe',name:'베드로후서',id:61,ch:3},
  {code:'1jo',name:'요한일서',id:62,ch:5},{code:'2jo',name:'요한이서',id:63,ch:1},
  {code:'3jo',name:'요한삼서',id:64,ch:1},{code:'jud',name:'유다서',id:65,ch:1},
  {code:'rev',name:'요한계시록',id:66,ch:22}
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPage(bookCode, page) {
  const url = `https://www.bskorea.or.kr/bible/korbibStitlelist.php?type=chap&version=GAE&rdoType=2&book=${bookCode}&page=${page}`;
  const res = await fetch(url);
  return await res.text();
}

function parseEntries(html) {
  // 패턴: "1. 천지 창조 [창 1:1]" 또는 번호. 제목 [약어 장:절]
  const entries = [];
  const regex = /(\d+)\.\s+(.+?)\s+\[([^\]]+)\]/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const title = match[2].trim();
    const ref = match[3].trim(); // e.g. "창 1:1"
    entries.push({ title, ref });
  }
  return entries;
}

function parseRef(ref, bookName) {
  // "창 1:1" → { chapter: 1, verse: 1 }
  const m = ref.match(/(\d+):(\d+)/);
  if (!m) return null;
  return { chapter: parseInt(m[1]), verse: parseInt(m[2]) };
}

async function scrapeBook(book) {
  const allEntries = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const html = await fetchPage(book.code, page);
    const entries = parseEntries(html);
    if (entries.length === 0) {
      hasMore = false;
    } else {
      allEntries.push(...entries);
      // 다음 페이지가 있는지 확인
      if (html.includes(`page=${page + 1}`)) {
        page++;
      } else {
        hasMore = false;
      }
    }
    await sleep(300); // rate limit
  }

  return allEntries;
}

async function main() {
  console.log('=== 대한성서공회 소제목 수집 시작 ===\n');
  const result = [];

  for (const book of BOOKS) {
    process.stdout.write(`${book.name} (${book.code})...`);
    const entries = await scrapeBook(book);

    // 각 소제목 → 페리코페 변환 (시작절 ~ 다음 소제목 직전)
    for (let i = 0; i < entries.length; i++) {
      const parsed = parseRef(entries[i].ref, book.name);
      if (!parsed) continue;

      let endChapter = parsed.chapter;
      let endVerse = 999; // 마지막 절까지 (나중에 보정)

      if (i + 1 < entries.length) {
        const nextParsed = parseRef(entries[i + 1].ref, book.name);
        if (nextParsed) {
          if (nextParsed.chapter === parsed.chapter) {
            endVerse = nextParsed.verse - 1;
          } else {
            // 다음 소제목이 다른 장이면 현재 장 끝까지
            endChapter = nextParsed.chapter;
            endVerse = nextParsed.verse - 1;
            if (endVerse <= 0) {
              // 이전 장 끝까지
              endChapter = nextParsed.chapter - 1;
              endVerse = 999;
            }
          }
        }
      }

      result.push({
        title: entries[i].title,
        book_name: book.name,
        book_id: book.id,
        testament: book.id <= 39 ? 'OT' : 'NT',
        chapter: parsed.chapter,
        verse_start: parsed.verse,
        end_chapter: endChapter,
        end_verse: endVerse,
      });
    }

    console.log(` ${entries.length}개`);
    await sleep(200);
  }

  const outPath = path.join(__dirname, '..', 'static', 'data', 'pericopes-raw.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n=== 완료: ${result.length}개 페리코페 → ${outPath} ===`);
}

main().catch(e => { console.error(e); process.exit(1); });

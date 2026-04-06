import type { RequestHandler } from './$types';
import { readFileSync } from 'fs';
import { join } from 'path';

let _hebDict: Record<string, { l: string; p: string; d: string }> | null = null;
let _grkDict: Record<string, { l: string; p: string; d: string }> | null = null;

function loadDicts() {
  if (_hebDict) return;
  const dataDir = join(process.cwd(), 'static', 'data');
  _hebDict = JSON.parse(readFileSync(join(dataDir, 'strongs-hebrew.json'), 'utf8'));
  _grkDict = JSON.parse(readFileSync(join(dataDir, 'strongs-greek.json'), 'utf8'));
}

interface InterlinearWord {
  eng: string;       // 영어 단어
  strongs: string;   // Strong's 번호 (H430, G2316 등)
  lemma: string;     // 원어
  pron: string;      // 발음
  def: string;       // 간단 뜻
}

// KJV 텍스트에서 단어+Strong's 번호 파싱
function parseKjvVerse(text: string, isOT: boolean): InterlinearWord[] {
  const words: InterlinearWord[] = [];
  // <sup> 태그 제거
  const cleaned = text.replace(/<sup>.*?<\/sup>/g, '');
  // 패턴: 단어<S>��호</S>
  const regex = /([^<]*?)<S>(\d+)<\/S>/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    const eng = match[1].trim();
    const num = match[2];
    const prefix = isOT ? 'H' : 'G';
    const key = prefix + num;
    const dict = isOT ? _hebDict : _grkDict;
    const entry = dict?.[key];
    if (eng || entry) {
      words.push({
        eng: eng || '',
        strongs: key,
        lemma: entry?.l || '',
        pron: entry?.p || '',
        def: entry?.d || ''
      });
    }
  }
  return words;
}

// GET /api/v2/interlinear?book=1&chapter=1
export const GET: RequestHandler = async (event) => {
  const bookId = parseInt(event.url.searchParams.get('book') || '0');
  const chapter = parseInt(event.url.searchParams.get('chapter') || '0');
  if (!bookId || !chapter) return Response.json([]);

  const isOT = bookId <= 39;
  loadDicts();

  try {
    const res = await fetch(`https://bolls.life/get-chapter/KJV/${bookId}/${chapter}/`);
    const verses: { pk: number; verse: number; text: string }[] = await res.json();

    const result = verses.map(v => ({
      verse: v.verse,
      words: parseKjvVerse(v.text, isOT)
    }));

    return Response.json(result);
  } catch {
    return Response.json([], { status: 500 });
  }
};

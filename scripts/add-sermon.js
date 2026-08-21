#!/usr/bin/env node
/* ===========================================================
   설교 등록 — sermons.json 에 한 편을 추가한다.
   홈페이지 "설교말씀" 섹션과 아카이브가 이 파일 하나를 함께 읽는다.

   카테고리는 성경 책 이름이며 본문(--scripture)에서 자동으로 정해진다.
   목록은 날짜가 아니라 성경 차례(창세기 → 요한계시록, 장·절 순)로 정렬된다.

   사용 예)
   node scripts/add-sermon.js \
     --scripture "로마서 8:31-39" \
     --title "끊을 수 없는 사랑" \
     --series "로마서 강해" \
     --summary "어떤 것도 우리를 하나님의 사랑에서 끊을 수 없습니다 …" \
     --points "1. 누가 우리를 대적하겠습니까|2. 이미 내어 주신 사랑|3. 넉넉히 이기느니라" \
     --conclusion "맺는 말씀 …" \
     --hymns "찬송가 405장|찬송가 493장"
   =========================================================== */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'sermons.json');

/* 성경 66권 차례 */
const BOOK_ORDER = [
  '창세기','출애굽기','레위기','민수기','신명기','여호수아','사사기','룻기',
  '사무엘상','사무엘하','열왕기상','열왕기하','역대상','역대하','에스라','느헤미야','에스더',
  '욥기','시편','잠언','전도서','아가',
  '이사야','예레미야','예레미야애가','에스겔','다니엘',
  '호세아','요엘','아모스','오바댜','요나','미가','나훔','하박국','스바냐','학개','스가랴','말라기',
  '마태복음','마가복음','누가복음','요한복음','사도행전',
  '로마서','고린도전서','고린도후서','갈라디아서','에베소서','빌립보서','골로새서',
  '데살로니가전서','데살로니가후서','디모데전서','디모데후서','디도서','빌레몬서','히브리서',
  '야고보서','베드로전서','베드로후서','요한일서','요한이서','요한삼서','유다서','요한계시록'
];

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) args[a.slice(2)] = process.argv[++i];
}
function fail(msg) { console.error('오류: ' + msg); process.exit(1); }

/* "로마서 8:31-39" → {book:'로마서', chapter:8, verse:31} */
function parseRef(ref) {
  const m = String(ref || '').match(/^\s*(.+?)\s+(\d+)(?::(\d+))?/);
  if (!m) return null;
  return { book: m[1].trim(), chapter: +m[2], verse: m[3] ? +m[3] : 0 };
}

if (!args.title) fail('--title 이 필요합니다.');
if (!args.scripture) fail('--scripture 가 필요합니다. 예) "로마서 8:31-39"');

const ref = parseRef(args.scripture);
if (!ref) fail('본문 형식을 읽지 못했습니다. 예) "로마서 8:31-39"');
const book = args.book || ref.book;
if (BOOK_ORDER.indexOf(book) < 0) fail(`성경 책 이름을 알 수 없습니다: ${book}`);

const entry = {
  book,
  chapter: ref.chapter,
  verse: ref.verse,
  title: args.title,
  scripture: args.scripture,
  series: args.series || '',
  summary: args.summary || '',
  keyPoints: args.points ? args.points.split('|').map(s => s.trim()).filter(Boolean) : [],
  conclusion: args.conclusion || '',
  hymns: args.hymns ? args.hymns.split('|').map(s => s.trim()).filter(Boolean) : [],
  source: args.source || ''      /* 원본 설교문 파일명 — 중복 등록을 막는 데 쓴다 */
};

const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
db.sermons = (db.sermons || []).filter(x =>
  !(x.book === entry.book && x.scripture === entry.scripture) &&
  !(entry.source && x.source === entry.source));
db.sermons.push(entry);

/* 성경 차례 → 장 → 절 순으로 정렬 */
db.sermons.sort((a, b) =>
  BOOK_ORDER.indexOf(a.book) - BOOK_ORDER.indexOf(b.book) ||
  (a.chapter || 0) - (b.chapter || 0) ||
  (a.verse || 0) - (b.verse || 0));

/* 등록된 책만 카테고리로, 역시 성경 차례대로 */
const books = [...new Set(db.sermons.map(x => x.book))]
  .sort((a, b) => BOOK_ORDER.indexOf(a) - BOOK_ORDER.indexOf(b));
db.categories = books.map(b => ({ key: b, label: b }));
db.updatedAt = new Date().toISOString();

fs.writeFileSync(FILE, JSON.stringify(db, null, 2) + '\n');
console.log(`[설교 등록] ${entry.book} ${entry.chapter}${entry.verse ? ':' + entry.verse : ''} · ${entry.title}`);
console.log(`  카테고리 ${books.length}개 (${books.join(' · ')}) · 전체 ${db.sermons.length}편`);

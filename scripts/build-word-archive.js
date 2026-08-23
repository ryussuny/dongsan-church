#!/usr/bin/env node
/* ===========================================================
   오늘의 말씀 모음 — 지난 말씀 목록 생성기
     · 교회 읽기표(word-data.js) 의 첫날부터 오늘까지 하루씩 만들고,
     · 실제로 올라왔던 말씀(word-history.json)이 있으면 그쪽을 우선한다.
     생성물: word-archive.json  (archive.html 의 "오늘의 말씀" 탭이 읽는다)
   사용법: node scripts/build-word-archive.js [YYYY-MM-DD]
   =========================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const KST = 9 * 60 * 60 * 1000;

/* ---------- 데이터 로드 ---------- */
const BIBLE_DATA = new Function(
  fs.readFileSync(path.join(ROOT, 'dongsan_bible.js'), 'utf8') + '\nreturn BIBLE_DATA;')();
const { WordData, WORD_PLAN } = require(path.join(ROOT, 'word-data.js'));

/* 성경 차례 — 카테고리 정렬에 쓴다 */
const BOOK_ORDER = [
  '창세기', '출애굽기', '레위기', '민수기', '신명기', '여호수아', '사사기', '룻기',
  '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야',
  '에스더', '욥기', '시편', '잠언', '전도서', '아가', '이사야', '예레미야', '예레미야애가',
  '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔',
  '하박국', '스바냐', '학개', '스가랴', '말라기',
  '마태복음', '마가복음', '누가복음', '요한복음', '사도행전', '로마서', '고린도전서',
  '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서',
  '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서', '히브리서',
  '야고보서', '베드로전서', '베드로후서', '요한1서', '요한2서', '요한3서', '유다서', '요한계시록'
];

/* ---------- 유틸 ---------- */
/* 각주 기호만 걷어낸다.
   개역개정 원문의 괄호·대괄호는 본문이므로 절대 지우지 않는다 —
   통째로 지우면 신 3:9·3:11 은 빈 절이 되고 145절이 훼손된다. */
const clean = t => String(t || '')
  .replace(/\([a-z](?:\s[^)]*)?\)/g, '')     // "(a 또는 …)", "(a)" 같은 각주 괄호
  .replace(/(^|\s)[a-z](?=[가-힣])/g, '$1')    // 낱말 앞에 붙은 각주 문자
  .replace(/[a-z]:(?=\d)/g, '')                // "창a:1" → "창1"
  .replace(/\s{2,}/g, ' ').trim();

/* 장을 넘어가는 본문("사무엘상 3:19-4:11")도 읽는다 */
function passageText(passage) {
  const r = WordData.parseRef(passage);
  if (!r) return { text: '', missing: [] };
  const bk = BIBLE_DATA[r.book];
  if (!bk || !bk.data) return { text: '', missing: [] };
  const multi = String(r.chapter) !== String(r.toChapter);
  const parts = [], missing = [];
  WordData.refSpans(r, bk).forEach(sp => {
    const ch = bk.data[sp.chapter];
    for (let v = sp.from; v <= sp.to; v++) {
      if (ch[String(v)]) parts.push(clean(ch[String(v)]));
      else missing.push(multi ? sp.chapter + ':' + v : v);
    }
  });
  return { text: parts.join(' '), missing };
}

/* 본문에서 성경 책 이름과 장·절을 뽑아 정렬 키로 쓴다 */
function refOf(passage) {
  const r = WordData.parseRef(passage);
  if (r) return { book: r.book, chapter: r.chapter, verse: r.from };
  const m = String(passage || '').match(/^(.+?)\s*(\d+)[:장]\s*(\d+)?/);
  return m ? { book: m[1].trim(), chapter: +m[2], verse: +(m[3] || 1) } : { book: '기타', chapter: 0, verse: 0 };
}

function shift(ds, n) {
  const d = new Date(ds + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* ---------- 기간 ---------- */
const arg = process.argv[2];
const today = /^\d{4}-\d{2}-\d{2}$/.test(arg || '')
  ? arg
  : new Date(Date.now() + KST).toISOString().slice(0, 10);

const planDates = Object.keys(WORD_PLAN).sort();
const start = planDates[0];

/* ---------- 1) 읽기표에서 하루씩 만든다 ---------- */
const byDate = {};
for (let d = start; d <= today; d = shift(d, 1)) {
  if (!WORD_PLAN[d]) continue;              // 읽기표에 없는 날은 건너뛴다
  const day = WordData.forDate(d);
  const { text, missing } = passageText(day.passage);
  const ref = refOf(day.passage);
  byDate[d] = {
    date: d,
    weekday: WordData.weekday(d),
    title: day.title,
    passage: day.passage,
    book: ref.book, chapter: ref.chapter, verse: ref.verse,
    theme: day.theme || '',
    scripture: text,
    explain: day.explain || '',
    questions: day.adult.questions,
    prayer: day.adult.prayer,
    kidsSummary: day.kids.summary,
    practice: day.kids.mission ? '어린이 미션 · ' + day.kids.mission : '',
    missingVerses: missing,
    source: 'plan'
  };
}

/* ---------- 2) 실제로 올라왔던 말씀이 우선 ---------- */
let history = [];
try {
  const h = JSON.parse(fs.readFileSync(path.join(ROOT, 'word-history.json'), 'utf8'));
  history = Array.isArray(h.words) ? h.words : [];
} catch (e) { /* 없으면 읽기표만 쓴다 */ }

history.forEach(w => {
  if (!w || !w.date || w.date > today) return;
  const ref = refOf(w.passage);
  const questions = Array.isArray(w.questions) && w.questions.length
    ? w.questions
    : (w.meditation ? [w.meditation] : []);
  byDate[w.date] = {
    date: w.date,
    weekday: WordData.weekday(w.date),
    title: w.title || '오늘의 말씀',
    passage: w.passage || '',
    book: ref.book, chapter: ref.chapter, verse: ref.verse,
    theme: '',
    scripture: w.scripture || '',
    explain: w.explain || '',
    questions,
    prayer: w.prayer || '',
    kidsSummary: '',
    practice: w.practice || '',
    hymnTitle: w.hymnTitle || '',
    missingVerses: [],
    source: 'church'
  };
});

/* ---------- 3) 성경 차례 → 장 → 절 순으로 정렬 ---------- */
const words = Object.keys(byDate).sort().map(d => byDate[d]);
words.sort((a, b) => {
  const ia = BOOK_ORDER.indexOf(a.book), ib = BOOK_ORDER.indexOf(b.book);
  if (ia !== ib) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  if (a.chapter !== b.chapter) return a.chapter - b.chapter;
  if (a.verse !== b.verse) return a.verse - b.verse;
  return a.date < b.date ? -1 : 1;
});

const books = [];
words.forEach(w => { if (books.indexOf(w.book) < 0) books.push(w.book); });

const out = {
  note: '오늘의 말씀 모음. 카테고리는 성경 책 이름이며 목록은 성경 차례(장·절 순)로 정렬한다.',
  categories: books.map(b => ({ key: b, label: b, count: words.filter(w => w.book === b).length })),
  words,
  builtFor: today,
  updatedAt: new Date().toISOString()
};

fs.writeFileSync(path.join(ROOT, 'word-archive.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`[오늘의 말씀 모음] ${start} ~ ${today} · 전체 ${words.length}편`);
out.categories.forEach(c => console.log(`  ${c.key} ${c.count}편`));
console.log('  word-archive.json 생성 완료');

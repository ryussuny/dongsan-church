#!/usr/bin/env node
/* ===========================================================
   설교 본문 성경 구절 뽑기

     sermons.json 의 "본문"(예: 로마서 8:1-11) 을 읽어
     dongsan_bible.js(개역개정) 에서 그 구절을 그대로 뽑아
     sermon-verses.json 을 만든다.

     설교말씀 화면(archive.html)이 이 파일을 읽어
     설교와 함께 성경 본문을 그대로 보여 준다.

     node scripts/build-sermon-verses.js

   4.8MB 나 되는 성경 파일을 홈페이지에서 통째로 받지 않도록,
   필요한 구절만 미리 뽑아 두는 것이다.
   =========================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BIBLE_DATA = new Function(
  fs.readFileSync(path.join(ROOT, 'dongsan_bible.js'), 'utf8') + '\nreturn BIBLE_DATA;')();

/* 각주 기호 정리 — "a태초에 …(a 또는 '…')" 같은 표시를 걷어낸다 */
const clean = t => String(t || '')
  .replace(/\([a-z] [^)]*\)/g, '')
  .replace(/([가-힣,.\s"“”'’]|^)([a-z])(?=[가-힣])/g, '$1')
  .replace(/\s{2,}/g, ' ').trim();

/* "출애굽기 7:14-8:19" · "로마서 8:1-11" · "요한복음 3:16" 모두 받는다 */
function parse(ref) {
  const m = String(ref || '').match(/^\s*(.+?)\s+(\d+)\s*:\s*(\d+)\s*(?:-\s*(?:(\d+)\s*:\s*)?(\d+))?\s*$/);
  if (!m) return null;
  const c1 = +m[2], v1 = +m[3];
  const c2 = m[4] ? +m[4] : c1;
  const v2 = m[5] ? +m[5] : v1;
  return { book: m[1].trim(), c1, v1, c2, v2 };
}

function pull(ref) {
  const r = parse(ref);
  if (!r) return { error: '본문 표기를 읽지 못했습니다' };
  const bk = BIBLE_DATA[r.book];
  if (!bk) return { error: r.book + ' 은(는) 성경 파일에 없습니다' };

  const out = [], missing = [];
  for (let c = r.c1; c <= r.c2; c++) {
    const ch = bk.data[String(c)];
    if (!ch) { missing.push(c + '장'); continue; }
    const last = Math.max(...Object.keys(ch).map(Number));
    const from = c === r.c1 ? r.v1 : 1;
    const to = c === r.c2 ? r.v2 : last;
    for (let v = from; v <= to; v++) {
      if (ch[String(v)]) out.push({ c, v, t: clean(ch[String(v)]) });
      else missing.push(c + ':' + v);
    }
  }
  return { verses: out, missing };
}

/* ---------- 실행 ---------- */
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'sermons.json'), 'utf8'));
const sermons = Array.isArray(raw) ? raw : (raw.sermons || []);

const verses = {};
let done = 0;
const problems = [];

sermons.forEach(s => {
  const ref = String(s.scripture || '').trim();
  if (!ref || verses[ref]) return;
  const got = pull(ref);
  if (got.error || !got.verses.length) {
    problems.push(ref + ' — ' + (got.error || '구절을 찾지 못함'));
    return;
  }
  if (got.missing.length) problems.push(ref + ' — ' + got.missing.join(', ') + ' 없음');
  verses[ref] = got.missing.length
    ? { v: got.verses, missing: got.missing }
    : got.verses;
  done++;
});

fs.writeFileSync(path.join(ROOT, 'sermon-verses.json'), JSON.stringify({
  note: 'sermons.json 의 본문을 dongsan_bible.js 에서 뽑아 둔 것. scripts/build-sermon-verses.js 가 만든다.',
  version: '개역개정',
  source: '대한성서공회',
  verses,
  updatedAt: new Date().toISOString().slice(0, 10),
}, null, 1) + '\n');

const total = Object.values(verses).reduce((n, v) => n + (Array.isArray(v) ? v : v.v).length, 0);
console.log(`✓ 설교 본문 ${done}개 · ${total}절 — sermon-verses.json`);
if (problems.length) {
  console.log('  살펴볼 것:');
  problems.forEach(p => console.log('   · ' + p));
}

#!/usr/bin/env node
/* ===========================================================
   설교 보관함 만들기 — 예전 목회 시스템·홈페이지에 올라와 있던
   지난 설교 기록을 한 파일로 모아 둔다.

     생성물: sermons-archive.json
     읽는 곳: archive.html 의 "설교 보관함" 탭

   지금 진행 중인 강해(sermons.json)와는 따로 둔다.
   한 번 만들어 두면 다시 돌릴 일은 없고, 원본은 git 기록에 남아 있다.
     node scripts/build-sermon-archive.js
   =========================================================== */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'sermons-archive.json');
const BOOK_ORDER = require(path.join(__dirname, 'book-order.js'));

/* 예전 파일에 구워져 있던 배열을 git 기록에서 꺼내 온다 */
function grab(rev, file, varName) {
  try {
    const s = execSync(`git show ${rev}:${file}`, { cwd: ROOT, maxBuffer: 1e9 }).toString();
    const m = s.match(new RegExp('(?:var |window\\.)' + varName + '\\s*=\\s*(\\[[\\s\\S]*?\\]);'));
    return m ? JSON.parse(m[1]) : [];
  } catch (e) {
    console.warn(`  · ${file} (${rev}) 를 읽지 못했습니다: ${e.message}`);
    return [];
  }
}

function refOf(scripture) {
  const s = String(scripture || '').replace(/\(.*?\)/g, ' ');
  for (const b of BOOK_ORDER) {
    const m = s.match(new RegExp(b + '\\s*(\\d+)\\s*[:장]?\\s*(\\d+)?'));
    if (m) return { book: b, chapter: +m[1], verse: m[2] ? +m[2] : 0 };
  }
  return { book: '기타', chapter: 0, verse: 0 };
}

/* 옛 홈페이지 아카이브(말씀의 흐름·맺는 말씀까지 있는 기록) */
const rich = grab('bbbbb3a', 'archive.html', '__SERMONS__');
/* 옛 교인용 앱(제목·본문·예배 종류만 있는 목록) */
const plain = grab('2ef0d9e^', 'deployed.html', 'SERMONS');

const byKey = {};
function put(x, source) {
  if (!x || !x.title) return;
  const key = (x.date || '') + '|' + (x.title || '');
  const ref = refOf(x.scripture);
  const prev = byKey[key];
  const entry = {
    date: x.date || '',
    title: x.title,
    scripture: x.scripture || '',
    book: ref.book, chapter: ref.chapter, verse: ref.verse,
    series: x.series || '',
    type: x.type || '',
    keyPoints: Array.isArray(x.keyPoints) ? x.keyPoints.filter(Boolean) : [],
    conclusion: x.conclusion || '',
    hymns: Array.isArray(x.hymns) ? x.hymns.filter(Boolean) : [],
    from: source
  };
  /* 같은 설교가 두 곳에 있으면 내용이 더 많은 쪽을 남긴다 */
  if (!prev || (entry.keyPoints.length + (entry.conclusion ? 1 : 0)) > (prev.keyPoints.length + (prev.conclusion ? 1 : 0))) {
    byKey[key] = prev ? Object.assign({}, prev, entry, { type: entry.type || prev.type }) : entry;
  } else if (entry.type && !prev.type) {
    prev.type = entry.type;
  }
}

rich.forEach(x => put(x, '홈페이지 아카이브'));
plain.forEach(x => put(x, '교인용 앱'));

const sermons = Object.keys(byKey).map(k => byKey[k]);
/* 보관함은 최근에 전한 말씀이 위로 오도록 날짜 역순 */
sermons.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

const books = [];
sermons.forEach(s => { if (books.indexOf(s.book) < 0) books.push(s.book); });
books.sort((a, b) => {
  const ia = BOOK_ORDER.indexOf(a), ib = BOOK_ORDER.indexOf(b);
  return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
});

const out = {
  note: '설교 보관함 — 예전 목회 시스템과 홈페이지에 올라와 있던 지난 설교 기록. '
      + '지금 진행 중인 강해 목록(sermons.json)과는 따로 둔다.',
  categories: books.map(b => ({ key: b, label: b, count: sermons.filter(s => s.book === b).length })),
  sermons,
  updatedAt: new Date().toISOString()
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(`[설교 보관함] 전체 ${sermons.length}편 (${sermons[sermons.length - 1].date} ~ ${sermons[0].date})`);
out.categories.forEach(c => console.log(`  ${c.key} ${c.count}편`));
console.log('  sermons-archive.json 생성 완료');

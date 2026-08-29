#!/usr/bin/env node
/* ===========================================================
   찬양 목록 만들기

     songs/<갈래>/<노래파일>  →  songs.json

   폴더 이름이 그대로 찬양의 갈래가 된다.
   파일 이름이 곡목이 되고, 이름 앞에 2026-08-30 처럼 날짜가 있으면
   날짜로 따로 뽑아 준다. 곡목 뒤에 ' - 만든이' 를 붙이면 만든이로 나뉜다.

     node scripts/build-songs.js
   =========================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'songs');
const OUT = path.join(ROOT, 'songs.json');

/* 브라우저가 태그 없이도 바로 트는 것들만 받는다 */
const EXT = ['.mp3', '.m4a', '.ogg', '.wav'];

/* 내보이는 차례. 여기 없는 폴더는 뒤에 가나다순으로 붙는다. */
const ORDER = ['자작 찬양', '찬송가', '성가대', '교회학교'];

function isSong(name) {
  return EXT.includes(path.extname(name).toLowerCase());
}

/* 2026-08-30 주의 은혜라 - 류선희.mp3
     → { date:'2026-08-30', title:'주의 은혜라', by:'류선희' } */
function readName(file) {
  const base = file.replace(/\.[^.]+$/, '');
  let rest = base, date = '';
  const m = base.match(/^(\d{4})[-.]?(\d{2})[-.]?(\d{2})[\s_-]*(.*)$/);
  if (m) { date = `${m[1]}-${m[2]}-${m[3]}`; rest = m[4]; }

  let by = '';
  const d = rest.split(/\s+-\s+/);          /* 앞뒤에 빈칸이 있는 - 만 나눔표로 본다 */
  if (d.length > 1) { by = d.pop().trim(); rest = d.join(' - '); }

  return { date, title: rest.replace(/[_]+/g, ' ').trim() || '찬양', by };
}

function mb(bytes) {
  return Math.round(bytes / 1048576 * 10) / 10;
}

if (!fs.existsSync(DIR)) {
  console.error('✗ songs 폴더가 없습니다.');
  process.exit(1);
}

const folders = fs.readdirSync(DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

const categories = [];
let total = 0, bytes = 0;

folders.forEach(folder => {
  const files = fs.readdirSync(path.join(DIR, folder))
    .filter(isSong)
    .sort((a, b) => b.localeCompare(a, 'ko'));   /* 최근 것이 위로 */
  if (!files.length) return;

  categories.push({
    key: folder,
    label: folder.replace(/-/g, ' '),
    songs: files.map(f => {
      const { date, title, by } = readName(f);
      const size = fs.statSync(path.join(DIR, folder, f)).size;
      bytes += size;
      return { src: `songs/${folder}/${f}`, title, by, date, mb: mb(size) };
    }),
  });
  total += files.length;
});

categories.sort((a, b) => {
  const ia = ORDER.indexOf(a.key), ib = ORDER.indexOf(b.key);
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;
  return a.key.localeCompare(b.key, 'ko');
});

fs.writeFileSync(OUT, JSON.stringify({
  note: 'songs 폴더에 노래를 넣으면 scripts/build-songs.js 가 이 파일을 다시 만든다. 폴더 이름이 갈래다.',
  categories,
  updatedAt: new Date().toISOString().slice(0, 10),
}, null, 2) + '\n');

console.log(`✓ 찬양 목록 생성 — 갈래 ${categories.length}개 · 곡 ${total}곡 · ${mb(bytes)}MB`);
categories.forEach(c => console.log(`  ${c.label} ${c.songs.length}곡`));
if (!total) console.log('  (아직 올린 노래가 없습니다. songs 폴더에 넣어 주세요.)');

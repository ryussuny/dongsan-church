#!/usr/bin/env node
/* ===========================================================
   찬양 목록 만들기

     songs/<갈래>/<노래파일>  →  songs.json

   폴더 이름이 그대로 찬양의 갈래가 된다.
   파일 이름이 곡목이 되고, 이름 앞에 2026-08-30 처럼 날짜가 있으면
   날짜로 따로 뽑아 준다. 곡목 뒤에 ' - 만든이' 를 붙이면 만든이로 나뉜다.
   노래 옆에 이름이 같은 .txt 가 있으면 그 글을 가사로 함께 넣는다.
     songs/자작 찬양/모세의 노래.mp3
     songs/자작 찬양/모세의 노래.txt   ← 가사

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
const ORDER = ['자작 찬양', '찬송가', '교회학교'];

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

/* 노래와 이름이 같은 .txt 를 가사로 읽는다. 없거나 비었으면 빈 글 */
function readLyrics(folder, file) {
  const txt = path.join(DIR, folder, file.replace(/\.[^.]+$/, '') + '.txt');
  if (!fs.existsSync(txt)) return '';
  return fs.readFileSync(txt, 'utf8')
    .replace(/^\uFEFF/, '')                 /* 메모장이 붙이는 BOM 은 뗀다 */
    .replace(/\r\n?/g, '\n')                /* 윈도 줄바꿈도 한 가지로 */
    .trim();
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
let total = 0, bytes = 0, withLyrics = 0;

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
      const song = { src: `songs/${folder}/${f}`, title, by, date, mb: mb(size) };
      const lyrics = readLyrics(folder, f);
      if (lyrics) { song.lyrics = lyrics; withLyrics++; }
      return song;
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

/* 유튜브 찬양 — songs/유튜브.txt 에 한 줄씩 「제목 | 재생목록(또는 영상) 주소」.
   # 으로 시작하는 줄과 빈 줄은 건너뛴다. 재생목록은 list=, 영상 하나는 v= 로 알아본다. */
function readYoutube() {
  const file = path.join(DIR, '유튜브.txt');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)
    .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    .map(l => {
      const at = l.lastIndexOf('|');
      const title = (at >= 0 ? l.slice(0, at) : '').trim();
      const url = (at >= 0 ? l.slice(at + 1) : l).trim();
      const list = (url.match(/[?&]list=([\w-]+)/) || [])[1] || '';
      const v = (url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/) || [])[1] || '';
      if (!list && !v) { console.log('  ⚠ 유튜브 주소를 알아보지 못했습니다:', l); return null; }
      return { title: title || '유튜브 찬양', list, v };
    })
    .filter(Boolean);
}
const youtube = readYoutube();

fs.writeFileSync(OUT, JSON.stringify({
  note: 'songs 폴더에 노래를 넣으면 scripts/build-songs.js 가 이 파일을 다시 만든다. 폴더 이름이 갈래다. 유튜브 찬양은 songs/유튜브.txt.',
  categories,
  youtube,
  updatedAt: new Date().toISOString().slice(0, 10),
}, null, 2) + '\n');

console.log(`✓ 찬양 목록 생성 — 갈래 ${categories.length}개 · 곡 ${total}곡 · ${mb(bytes)}MB · 가사 ${withLyrics}곡`);
categories.forEach(c => console.log(`  ${c.label} ${c.songs.length}곡`));
console.log(`  유튜브 찬양 ${youtube.length}개`);
if (!total) console.log('  (아직 올린 노래가 없습니다. songs 폴더에 넣어 주세요.)');

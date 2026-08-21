#!/usr/bin/env node
/* ===========================================================
   사진첩 목록 만들기

     photos/<카테고리>/<사진파일>  →  photos.json

   폴더 이름이 그대로 사진첩의 카테고리가 된다.
   파일 이름이 사진 설명이 되고, 이름 앞에 2026-07-21 처럼 날짜가 있으면
   날짜로 따로 뽑아 준다.

     node scripts/build-photos.js
   =========================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'photos');
const OUT = path.join(ROOT, 'photos.json');

const EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const PASTOR = '담임목사';           // 인사말 사진이 들어가는 폴더
const PASTOR_FILE = '인사말';        // 인사말 사진 파일 이름(확장자 제외)

// 카테고리를 내보이는 차례. 여기 없는 폴더는 뒤에 가나다순으로 붙는다.
const ORDER = ['예배', '교회학교', '2026-보물캠프', '봉사와-나눔', '교회-풍경'];

function isPhoto(name) {
  return EXT.includes(path.extname(name).toLowerCase());
}

// 2026-07-21 여름성경학교.jpg → { date: '2026-07-21', title: '여름성경학교' }
function readName(file) {
  const base = file.replace(/\.[^.]+$/, '');
  const m = base.match(/^(\d{4})[-.]?(\d{2})[-.]?(\d{2})[\s_-]*(.*)$/);
  if (m) {
    const title = m[4].trim();
    return { date: `${m[1]}-${m[2]}-${m[3]}`, title: title || '사진' };
  }
  return { date: '', title: base.replace(/[_]+/g, ' ').trim() || '사진' };
}

if (!fs.existsSync(DIR)) {
  console.error('✗ photos 폴더가 없습니다.');
  process.exit(1);
}

const folders = fs.readdirSync(DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let pastorPhoto = '';
const categories = [];
let total = 0;

folders.forEach(folder => {
  const files = fs.readdirSync(path.join(DIR, folder))
    .filter(isPhoto)
    .sort((a, b) => b.localeCompare(a, 'ko'));   // 최근 것이 위로 오도록

  if (folder === PASTOR) {
    const hit = files.find(f => f.replace(/\.[^.]+$/, '') === PASTOR_FILE) || files[0];
    if (hit) pastorPhoto = `photos/${folder}/${hit}`;
    return;                                       // 인사말 사진은 사진첩에 싣지 않는다
  }
  if (!files.length) return;

  categories.push({
    key: folder,
    label: folder.replace(/-/g, ' '),
    photos: files.map(f => {
      const { date, title } = readName(f);
      return { src: `photos/${folder}/${f}`, title, date };
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
  note: 'photos 폴더에 사진을 넣으면 scripts/build-photos.js 가 이 파일을 다시 만든다. 폴더 이름이 카테고리다.',
  pastorPhoto,
  categories,
  updatedAt: new Date().toISOString().slice(0, 10),
}, null, 2) + '\n');

console.log(`✓ 사진첩 목록 생성 — 카테고리 ${categories.length}개 · 사진 ${total}장`);
categories.forEach(c => console.log(`  ${c.label} ${c.photos.length}장`));
console.log(pastorPhoto ? `  담임목사 인사말 사진: ${pastorPhoto}` : '  담임목사 인사말 사진: 아직 없음');

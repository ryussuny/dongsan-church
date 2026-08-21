#!/usr/bin/env node
/* ===========================================================
   설교 등록 — sermons.json 에 한 편을 추가한다.
   홈페이지 "설교말씀" 섹션과 아카이브가 이 파일 하나를 함께 읽는다.

   사용 예)
   node scripts/add-sermon.js \
     --date 2026-08-23 --cat morning --service "주일오전" \
     --title "여호와께 물을 만한 사람이 없느냐" \
     --scripture "열왕기하 3:1-12" --series "열왕기하 강해" \
     --summary "어려움에 빠진 뒤에야 하나님을 찾은 왕들 …" \
     --points "1. 먼저 묻지 않았습니다|2. 마른 골짜기에서 …|3. 하나님이 채우십니다" \
     --hymns "찬송가 famous|찬송가 …"

   --cat 은 morning(주일오전) 또는 series(강해시리즈)
   같은 날짜·같은 구분의 설교가 있으면 덮어쓴다.
   =========================================================== */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'sermons.json');
const CATS = { morning: '주일오전 설교', series: '강해시리즈' };

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) args[a.slice(2)] = process.argv[++i];
}

function fail(msg) { console.error('오류: ' + msg); process.exit(1); }

if (!args.date || !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) fail('--date YYYY-MM-DD 가 필요합니다.');
if (!args.title) fail('--title 이 필요합니다.');
const cat = args.cat || 'morning';
if (!CATS[cat]) fail('--cat 은 morning(주일오전) 또는 series(강해시리즈) 여야 합니다.');

const entry = {
  date: args.date,
  category: cat,
  service: args.service || (cat === 'morning' ? '주일오전' : ''),
  title: args.title,
  scripture: args.scripture || '',
  series: args.series || '',
  summary: args.summary || '',
  keyPoints: args.points ? args.points.split('|').map(s => s.trim()).filter(Boolean) : [],
  conclusion: args.conclusion || '',
  hymns: args.hymns ? args.hymns.split('|').map(s => s.trim()).filter(Boolean) : []
};

const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
db.sermons = (db.sermons || []).filter(x => !(x.date === entry.date && (x.category || 'morning') === cat));
db.sermons.push(entry);
db.sermons.sort((a, b) => String(b.date).localeCompare(String(a.date)));
db.updatedAt = new Date().toISOString();
fs.writeFileSync(FILE, JSON.stringify(db, null, 2) + '\n');

console.log(`[설교 등록] ${entry.date} · ${CATS[cat]} · ${entry.title}`);
console.log(`  본문 ${entry.scripture || '(미기재)'} · 현재 총 ${db.sermons.length}편`);

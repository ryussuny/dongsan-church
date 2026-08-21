#!/usr/bin/env node
/* 설교 본문(1000자 안팎)을 sermons.json 에 채워 넣는다.
   사용법: node scripts/set-body.js bodies.json
   bodies.json 은 { "출애굽기 1:1-7": "본문 내용 …", … } 꼴 */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'sermons.json');
const src = process.argv[2];
if (!src) { console.error('본문 파일을 지정해 주세요.'); process.exit(1); }

const bodies = JSON.parse(fs.readFileSync(src, 'utf8'));
const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
let done = 0, miss = [];
Object.keys(bodies).forEach(ref => {
  const s = db.sermons.find(x => x.scripture === ref);
  if (!s) { miss.push(ref); return; }
  s.body = String(bodies[ref]).trim();
  done++;
  const n = s.body.length;
  console.log(`  ${ref.padEnd(18)} ${String(n).padStart(4)}자  ${s.title}`);
});
db.updatedAt = new Date().toISOString();
fs.writeFileSync(FILE, JSON.stringify(db, null, 2) + '\n');
const total = db.sermons.length, withBody = db.sermons.filter(x => x.body).length;
console.log(`\n${done}편 기록${miss.length ? ' · 못 찾음: ' + miss.join(', ') : ''} — 전체 ${withBody}/${total}편 완료`);

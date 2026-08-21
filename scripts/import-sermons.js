#!/usr/bin/env node
/* ===========================================================
   설교문 자동 등록 — sermons-src/ 에 올린 설교 원고를 읽어
   요약을 만들고 sermons.json 에 등록한다.

     · 지원 형식 : .docx  .txt  .md
     · 요약 방식 : 원고의 짜임(제목/본문/본론/결론)을 읽는 규칙 기반
                   ANTHROPIC_API_KEY 가 있으면 AI 로 문장을 다듬는다(선택)
     · 이미 등록한 원고는 파일 이름으로 걸러내 다시 올리지 않는다

   사용법
     node scripts/import-sermons.js                 (sermons-src 전체)
     node scripts/import-sermons.js 파일.docx        (한 편만)
     node scripts/import-sermons.js --dry            (등록 없이 결과만 보기)
     node scripts/import-sermons.js --force          (같은 본문이 있어도 새 요약으로 교체)
   =========================================================== */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'sermons-src');
const FILE = path.join(ROOT, 'sermons.json');
const { parse, aiPrompt } = require(path.join(ROOT, 'sermon-summary.js'));

const BOOK_ORDER = require(path.join(__dirname, 'book-order.js'));

/* ---------- .docx 에서 글만 뽑아내기 (외부 패키지 없이) ---------- */
function readZipEntry(buf, wanted) {
  /* 중앙 디렉터리 끝(EOCD) 을 뒤에서부터 찾는다 */
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return null;
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) return null;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const cmtLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    if (name === wanted) {
      const lnLen = buf.readUInt16LE(local + 26);
      const leLen = buf.readUInt16LE(local + 28);
      const start = local + 30 + lnLen + leLen;
      const data = buf.slice(start, start + compSize);
      return method === 0 ? data : zlib.inflateRawSync(data);
    }
    p += 46 + nameLen + extraLen + cmtLen;
  }
  return null;
}

function docxText(file) {
  const xml = readZipEntry(fs.readFileSync(file), 'word/document.xml');
  if (!xml) throw new Error('워드 파일을 열지 못했습니다: ' + path.basename(file));
  return xml.toString('utf8')
    .replace(/<w:tab[^>]*\/>/g, '\t')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, '\n\n');
}

function readManuscript(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.docx') return docxText(file);
  if (ext === '.txt' || ext === '.md') return fs.readFileSync(file, 'utf8');
  return null;
}

/* ---------- AI 다듬기 (키가 있을 때만) ---------- */
async function polishWithAI(text, entry) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
        max_tokens: 1500,
        system: '한국 개신교 설교 요약 편집자. 원고에 있는 내용만 쓰고, 성도 개인 신상·건강 정보는 절대 넣지 않는다.',
        messages: [{ role: 'user', content: aiPrompt(text, entry) }]
      })
    });
    const d = await r.json();
    const out = d && d.content && d.content[0] && d.content[0].text;
    if (!out) return null;
    const m = out.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch (e) {
    console.warn('  · AI 다듬기 실패(규칙 기반 요약을 씁니다):', e.message);
    return null;
  }
}

/* ---------- 등록 ---------- */
function loadDb() {
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}
function saveDb(db) {
  db.sermons.sort((a, b) => {
    const ia = BOOK_ORDER.indexOf(a.book), ib = BOOK_ORDER.indexOf(b.book);
    if (ia !== ib) return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
    return a.verse - b.verse;
  });
  const preset = (db.categories || []).map(c => c.key);
  const books = [];
  db.sermons.forEach(s => { if (books.indexOf(s.book) < 0) books.push(s.book); });
  preset.forEach(b => { if (books.indexOf(b) < 0) books.push(b); });
  books.sort((a, b) => BOOK_ORDER.indexOf(a) - BOOK_ORDER.indexOf(b));
  db.categories = books.map(b => ({ key: b, label: b }));
  db.updatedAt = new Date().toISOString();
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2) + '\n');
}

async function main() {
  const argv = process.argv.slice(2);
  const dry = argv.includes('--dry');
  const force = argv.includes('--force');
  const named = argv.filter(a => !a.startsWith('--'));

  let files;
  if (named.length) {
    files = named.map(f => (path.isAbsolute(f) ? f : path.join(SRC, f)));
  } else {
    if (!fs.existsSync(SRC)) { console.log('sermons-src 폴더가 없습니다.'); return; }
    files = fs.readdirSync(SRC)
      .filter(f => /\.(docx|txt|md)$/i.test(f) && !/^README/i.test(f))
      .map(f => path.join(SRC, f));
  }
  if (!files.length) { console.log('등록할 설교 원고가 없습니다. sermons-src 폴더에 파일을 올려 주세요.'); return; }

  const db = loadDb();
  const already = new Set((db.sermons || []).map(s => s.source).filter(Boolean));
  let added = 0, skipped = 0, failed = 0;

  for (const file of files) {
    const name = path.basename(file);
    if (already.has(name)) { console.log(`· ${name} — 이미 등록된 원고, 건너뜁니다`); skipped++; continue; }

    let text;
    try { text = readManuscript(file); } catch (e) { console.error(`× ${name} — ${e.message}`); failed++; continue; }
    if (text == null) { console.log(`· ${name} — 지원하지 않는 형식, 건너뜁니다`); skipped++; continue; }

    const res = parse(text, { source: name });
    let entry = res.entry;

    const polished = await polishWithAI(text, entry);
    if (polished) {
      entry = Object.assign({}, entry, {
        title: polished.title || entry.title,
        series: polished.series || entry.series,
        summary: polished.summary || entry.summary,
        keyPoints: Array.isArray(polished.keyPoints) && polished.keyPoints.length ? polished.keyPoints : entry.keyPoints,
        conclusion: polished.conclusion || entry.conclusion,
        hymns: Array.isArray(polished.hymns) && polished.hymns.length ? polished.hymns : entry.hymns
      });
      if (polished.scripture) {
        const { normalizeRef } = require(path.join(ROOT, 'sermon-summary.js'));
        const ref = normalizeRef(polished.scripture);
        if (ref) { entry.scripture = ref.ref; entry.book = ref.book; entry.chapter = ref.chapter; entry.verse = ref.verse; }
      }
    }

    if (!entry.title || !entry.scripture || BOOK_ORDER.indexOf(entry.book) < 0) {
      console.error(`× ${name} — ${res.reason || '본문 또는 제목을 읽지 못했습니다'}`);
      console.error('   원고 첫머리에 "제목: …" 과 "본문: 로마서 8:31-39" 를 적어 주시면 자동으로 등록됩니다.');
      failed++; continue;
    }

    console.log(`+ ${name}`);
    console.log(`   ${entry.scripture} · ${entry.title}${polished ? '  (AI 다듬음)' : ''}`);
    const dup = (db.sermons || []).find(x => x.book === entry.book && x.scripture === entry.scripture);
    if (dup && !force) {
      console.log(`   → 같은 본문이 이미 등록되어 있어 그대로 둡니다 (덮어쓰려면 --force)`);
      skipped++; continue;
    }
    if (!dry) {
      db.sermons = (db.sermons || []).filter(x =>
        !(x.book === entry.book && x.scripture === entry.scripture) && x.source !== name);
      db.sermons.push(entry);
      added++;
    }
  }

  if (!dry && added) saveDb(db);
  console.log(`\n등록 ${added}편 · 건너뜀 ${skipped}편 · 실패 ${failed}편 · 전체 ${dry ? loadDb().sermons.length : db.sermons.length}편`);
  if (failed) process.exitCode = 0;   /* 한 편이 실패해도 나머지는 올라가게 둔다 */
}

main();

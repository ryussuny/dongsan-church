/* 묵상집 전용 작은 성경 파일 만들기 — book-bible.js
   묵상집(word-book.html)은 74일 동안 쓰는 본문만 있으면 되는데, 성경 전체(dongsan_bible.js, 4.8MB)를
   내려받으면 휴대폰에서 한참 걸린다. 묵상집을 실제로 그려 보며 쓰인 장(章)만 모아 작은 파일로 만든다.
   만든 뒤에는 작은 파일로 다시 그려, 전체 성경으로 그린 책과 글자가 한 자도 다르지 않은지 확인한다.

   실행:  node scripts/build-book-bible.js        (묵상 글·본문을 고친 뒤, build-book.js 전에)
   CHROME · HTTPS_PROXY · FONT_ROUTE 는 build-book.js 와 같다. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
let chromium;
try { ({ chromium } = require('playwright-core')); } catch (e) {
  try { ({ chromium } = require('/tmp/node_modules/playwright-core')); } catch (e2) {
    console.error('playwright-core 가 없습니다: npm i playwright-core'); process.exit(1);
  }
}
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'book-bible.js');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0].split('#')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(r);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

/* 책을 그리며 WordBible.verses 로 찾은 장을 모두 적어 둔다 */
const HOOK = () => {
  window.__chapters = {};
  document.addEventListener('DOMContentLoaded', () => {
    const v = WordBible.verses;
    WordBible.verses = function (passage) {
      const r = WordData.parseRef(passage);
      if (r) for (let c = +r.chapter; c <= +(r.toChapter || r.chapter); c++) window.__chapters[r.book + '|' + c] = 1;
      return v.apply(this, arguments);
    };
  });
};
const pageTexts = () => Array.from(document.querySelectorAll('#stage .slot')).map(s => s.innerText);

(async () => {
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port + '/';
  const opt = { args: ['--no-sandbox'] };
  if (process.env.CHROME) opt.executablePath = process.env.CHROME;
  if (process.env.HTTPS_PROXY) opt.proxy = { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' };
  const browser = await chromium.launch(opt);
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  if (process.env.FONT_ROUTE) await require(process.env.FONT_ROUTE)(ctx);
  await ctx.route('**script.google.com/**', r => r.abort());
  await ctx.addInitScript(HOOK);

  const open = async (v, full) => {
    const page = await ctx.newPage();
    page.on('pageerror', e => console.error(v, e.message));
    await page.goto(base + 'word-book.html?print=1&v=' + v + (full ? '&fullbible=1' : ''), { waitUntil: 'load' });
    await page.waitForFunction('window.BOOK_READY===true', null, { timeout: 180000 });
    return page;
  };

  /* 1. 전체 성경으로 그려 쓰인 장과 글자를 모은다 */
  const need = {}, fullText = {};
  for (const v of ['adult', 'kids']) {
    const page = await open(v, true);
    Object.assign(need, await page.evaluate(() => window.__chapters));
    fullText[v] = await page.evaluate(pageTexts);
    await page.close();
  }

  /* 2. 그 장들만 뽑아 쓴다 */
  const box = {};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'dongsan_bible.js'), 'utf8') + ';this.B=BIBLE_DATA;', box);
  const sub = {};
  Object.keys(need).sort().forEach(k => {
    const [book, ch] = k.split('|');
    const bk = box.B[book];
    if (!bk || !bk.data[ch]) return;
    sub[book] = sub[book] || { chapters: bk.chapters, data: {} };
    sub[book].data[ch] = bk.data[ch];
  });
  const tmp = OUT + '.tmp';
  fs.writeFileSync(tmp, '/* 묵상집 전용 성경 — scripts/build-book-bible.js 가 dongsan_bible.js 에서 묵상집에 쓰는 장만 뽑아 만든 파일. 손으로 고치지 않는다. */\n' +
    'var BIBLE_DATA=' + JSON.stringify(sub) + ';\n');
  fs.renameSync(tmp, OUT);

  /* 3. 작은 파일로 다시 그려 한 자도 다르지 않은지 본다 */
  let bad = 0;
  for (const v of ['adult', 'kids']) {
    const page = await open(v, false);
    const used = await page.evaluate(() => Object.keys(BIBLE_DATA).length);
    const t = await page.evaluate(pageTexts);
    const diff = t.map((x, i) => x === fullText[v][i] ? null : i + 1).filter(Boolean);
    if (t.length !== fullText[v].length || diff.length) { bad++; console.error(v, '다른 쪽:', diff.slice(0, 10), t.length, fullText[v].length); }
    else console.log(v, t.length + '쪽 같음 (작은 성경 ' + used + '권)');
    await page.close();
  }
  await browser.close(); srv.close();
  if (bad) { fs.unlinkSync(OUT); console.error('book-bible.js 를 지웠습니다 — 묵상집은 전체 성경을 씁니다.'); process.exit(1); }
  const kb = n => Math.round(n / 1024) + 'KB';
  console.log('book-bible.js', Object.keys(need).length + '장', kb(fs.statSync(OUT).size),
    '(전체 성경 ' + kb(fs.statSync(path.join(ROOT, 'dongsan_bible.js')).size) + ')');
})();

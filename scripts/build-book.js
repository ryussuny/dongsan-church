/* 묵상집 PDF 만들기 — word-book.html 을 크롬으로 열어 A5 PDF 두 권(어른·어린이)을 book/ 에 저장한다.
   word-data.js 의 묵상 글을 고친 뒤 다시 돌리면 책도 같이 바뀐다.

   준비:  npm i playwright-core   (크롬은 이미 깔린 것을 쓴다)
   실행:  CHROME=/path/to/chrome node scripts/build-book.js
          (CHROME 을 비우면 playwright 기본 크롬을 찾는다)
   인쇄소용 파일은 만든 뒤 꼭  python3 scripts/finish-print.py  로 쪽 크기·재단 크기를 mm 단위로 맞춘다.
   FONT_ROUTE=모듈경로 를 주면 그 모듈이 글꼴 요청을 대신 내준다(프록시가 불안정한 환경용). */
const http = require('http');
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright-core')); } catch (e) {
  try { ({ chromium } = require('/tmp/node_modules/playwright-core')); } catch (e2) {
    console.error('playwright-core 가 없습니다: npm i playwright-core'); process.exit(1);
  }
}
const ROOT = path.join(__dirname, '..');
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
  fs.mkdirSync(path.join(ROOT, 'book'), { recursive: true });
  for (const v of ['adult', 'kids']) {
    const page = await ctx.newPage();
    page.on('pageerror', e => console.error(v, e.message));
    await page.goto(base + 'word-book.html?print=1&v=' + v, { waitUntil: 'load' });
    await page.waitForFunction('window.BOOK_READY===true', null, { timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);
    const n = await page.evaluate(() => pages.length);
    const out = path.join(ROOT, 'book', 'first-faith-' + v + '.pdf');
    await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
    console.log(v, n + '쪽 →', path.relative(ROOT, out), Math.round(fs.statSync(out).size / 1024) + 'KB');
    await page.close();
  }
  /* 인쇄소에 넘기는 파일: 내지(사방 3mm 도련 154×216mm)와 표지 펼침면(뒷표지+책등+앞표지).
     책등 두께는 인쇄소가 쪽수·종이로 계산해 주는 값이라, 흔한 두께마다 미리 만들어 둔다.
     다른 두께가 필요하면 SPINE_ADULT=11.2 SPINE_KIDS=5.3 처럼 주고 다시 돌린다. */
  const list = v => (process.env['SPINE_' + v.toUpperCase()] ? [parseFloat(process.env['SPINE_' + v.toUpperCase()])]
                     : (v === 'adult' ? [9, 9.5, 10, 10.5, 11, 11.5, 12] : [4.5, 5, 5.5, 6]));
  const PRINT = path.join(ROOT, 'book', 'print');
  fs.mkdirSync(path.join(PRINT, 'cover'), { recursive: true });
  const ready = async page => { await page.waitForFunction('window.BOOK_READY===true', null, { timeout: 120000 }); await page.evaluate(() => document.fonts.ready); };
  for (const v of ['adult', 'kids']) {
    const page = await ctx.newPage();
    await page.goto(base + 'word-book.html?print=1&press=1&v=' + v, { waitUntil: 'load' });
    await ready(page);
    const n = await page.evaluate(() => pages.length);
    const inner = path.join(PRINT, 'first-faith-' + v + '-inner.pdf');
    await page.pdf({ path: inner, printBackground: true, preferCSSPageSize: true });
    console.log(v, '내지', n + '쪽 154×216mm →', path.relative(ROOT, inner));
    for (const sp of list(v)) {
      const W = +(3 + 148 + sp + 148 + 3).toFixed(1);
      const tag = String(sp).replace('.', '_');
      await page.goto(base + 'word-book.html?print=1&cover=1&spine=' + sp + '&v=' + v, { waitUntil: 'load' });
      await ready(page);
      const out = path.join(PRINT, 'cover', 'first-faith-' + v + '-cover-spine' + tag + 'mm.pdf');
      await page.pdf({ path: out, printBackground: true, preferCSSPageSize: true });
      await page.goto(base + 'word-book.html?print=1&cover=1&guide=1&spine=' + sp + '&v=' + v, { waitUntil: 'load' });
      await ready(page);
      await page.pdf({ path: out.replace('.pdf', '-확인용.pdf'), printBackground: true, preferCSSPageSize: true });
      console.log(v, '표지 책등', sp + 'mm', W + '×216mm');
    }
    await page.close();
  }
  await browser.close();
  srv.close();
})();

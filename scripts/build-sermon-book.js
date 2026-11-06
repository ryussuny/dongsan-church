/* 설교 묵상집 PDF 만들기 — sermon-book.html 을 크롬으로 열어 책마다 PDF 를 만든다.
     book/sermon-<책>.pdf                              화면·내려받기용 A5 (148×210mm)
     book/print/sermon-<책>-inner.pdf                  인쇄소 내지 (사방 3mm 도련 154×216mm, 1쪽은 속표지)
     book/print/cover/sermon-<책>-cover-spine○mm.pdf   표지 펼침면 (뒷표지·책등·앞표지) — 흔한 책등 두께마다
     ...-확인용.pdf                                     재단선·책등선·안전선을 그린 확인용 (인쇄하지 않음)
   묵상 글(sermon-book-data.js)을 고치면  node scripts/build-sermon-book-bible.js  다음에 이것을 돌린다.

   준비:  npm i playwright-core   (크롬은 이미 깔린 것을 쓴다)
   실행:  CHROME=/path/to/chrome node scripts/build-sermon-book.js [책 ...]   (책: romans philippians ephesians, 비우면 모두)
   그다음 python3 scripts/finish-print.py  →  python3 scripts/build-sermon-complete-pdf.py
   책등 두께를 따로 주려면  SPINE_ROMANS=8.2 처럼.  FONT_ROUTE=모듈경로 는 글꼴 요청을 대신 내주는 모듈(프록시가 불안정한 환경용). */
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
  '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
const BOOKS = ['romans', 'philippians', 'ephesians'];

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
/* 책등 두께 후보 — 쪽수 × (모조 80g 약 0.05mm ~ 100g 약 0.062mm), 0.5mm 단위. 80쪽 이하는 중철(책등 0)도 */
function spines(bk, n) {
  const env = process.env['SPINE_' + bk.toUpperCase()];
  if (env) return env.split(',').map(parseFloat);
  const lo = Math.floor(n * 0.048 * 2) / 2, hi = Math.ceil(n * 0.064 * 2) / 2, out = n <= 80 ? [0] : [];
  for (let s = Math.max(2.5, lo); s <= hi + 1e-9; s += 0.5) out.push(+s.toFixed(1));
  return out;
}

const NAME = { romans: '로마서', philippians: '빌립보서', ephesians: '에베소서' };
/* 인쇄 사양서 (A4) — 쪽수·책등은 방금 만든 책에서 */
function specHtml(d) {
  const B = BOOKS, mm = (n, g) => (n * g).toFixed(1);
  const bind = b => d[b].n <= 80 ? '무선제본 또는 중철(스테이플) — 얇은 책이라 중철도 좋습니다' : '무선제본 (왼쪽 제본)';
  const row = (h, f) => '<tr><td>' + h + '</td>' + B.map(b => '<td>' + f(b) + '</td>').join('') + '</tr>';
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>인쇄 사양서 — 설교 묵상집 (로마서·빌립보서·에베소서)</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&family=Gowun+Batang:wght@700&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:14mm}
body{font-family:'Noto Sans KR',sans-serif;color:#2f2a26;font-size:9.4pt;line-height:1.6;word-break:keep-all;max-width:182mm;margin:0 auto}
h1{font-family:'Gowun Batang',serif;color:#8f4531;font-size:19pt;margin:0 0 1mm}
.sub{color:#6b5a45;border-bottom:1.5pt solid #8f4531;padding-bottom:3mm;margin-bottom:4mm}
h2{font-size:11pt;color:#8f4531;margin:5mm 0 2mm}
table{width:100%;border-collapse:collapse;font-size:8.8pt}
th,td{border:.5pt solid #d9c7a8;padding:1.5mm 2mm;text-align:left;vertical-align:top}
th{background:#fbf3e7}
code{font-size:8pt;background:#f4ede2;padding:0 1mm;border-radius:1mm}
.box{border:1pt dashed #c99a3f;border-radius:3mm;padding:3mm 4mm;margin-top:4mm;background:#fffaf0}
.sw{display:inline-block;width:3.2mm;height:3.2mm;border-radius:.8mm;vertical-align:-.4mm;margin-right:1mm}
</style></head><body>
<h1>인쇄 사양서</h1>
<div class="sub">동산감리교회 설교 묵상집 세 권 — 로마서 · 빌립보서 · 에베소서 · 인쇄소 전달용</div>
<h2>1. 제작 사양</h2>
<table>
<tr><th style="width:24mm"></th>${B.map(b => '<th>' + NAME[b] + '</th>').join('')}</tr>
${row('책 제목', b => '「' + d[b].title + '」')}
${row('표지 색', b => '<span class="sw" style="background:' + ({ romans: '#22336b', philippians: '#1f6f62', ephesians: '#56296b' })[b] + '"></span>' + ({ romans: '깊은 남색·금빛', philippians: '짙은 청록·새싹빛', ephesians: '왕실 자줏빛·금빛' })[b])}
${row('완성 크기', () => 'A5 148×210mm')}
${row('쪽수', b => d[b].n + '쪽 (' + d[b].n / 2 + '장)')}
${row('제본', bind)}
<tr><td>내지</td><td colspan="3">양면 컬러 권장(제목·상자에 색이 있습니다) · 흑백도 읽기에는 문제없습니다 · 미색모조 80g 또는 100g</td></tr>
<tr><td>표지</td><td colspan="3">컬러 단면 · 아트지/스노우지 250g · 무광 코팅</td></tr>
</table>
<h2>2. 파일 (book/print/)</h2>
<table>
<tr><th>파일</th><th>크기 (재단 여백 포함)</th><th>내용</th></tr>
${B.map(b => '<tr><td><code>sermon-' + b + '-inner.pdf</code></td><td>154×216mm · ' + d[b].n + '쪽</td><td>' + NAME[b] + ' 내지 (1쪽 속표지)</td></tr>').join('')}
${B.map(b => '<tr><td><code>cover/sermon-' + b + '-cover-spine○mm.pdf</code></td><td>(3+148+책등+148+3)×216mm</td><td>' + NAME[b] + ' 표지 펼침면 (뒷표지·책등·앞표지)</td></tr>').join('')}
</table>
<p>· 모든 파일은 사방 <b>3mm 도련</b>을 포함하며, PDF 안에 재단 크기(TrimBox)가 지정되어 있습니다. 재단선 표시는 넣지 않았습니다.<br>
· 글꼴은 모두 PDF에 포함되어 있고, 글자·도형은 벡터입니다. 색상은 RGB입니다(인쇄소 출력 시 변환).<br>
· 중요한 글자는 재단선에서 5mm 이상 안쪽에 있습니다. 쪽수는 모두 4의 배수입니다.<br>
· <code>-확인용.pdf</code>는 재단선(빨강)·책등선(파랑)·안전선(초록)을 표시한 확인용이므로 <b>인쇄하지 않습니다</b>.<br>
· 한 권으로 넘겨 보는 <code>완성본/○○_설교묵상집_완성본_표지포함.pdf</code>는 교정 확인용입니다.</p>
<h2>3. 표지 책등 두께 고르기</h2>
<p>인쇄소가 쪽수와 용지로 계산해 준 책등 두께와 <b>같은 이름의 표지 파일</b>을 보내 주세요.</p>
<table>
<tr><th style="width:24mm"></th>${B.map(b => '<th>' + NAME[b] + ' (' + d[b].n + '쪽)</th>').join('')}</tr>
${row('준비된 책등', b => d[b].sp.map(x => x ? x + 'mm' : '0mm(중철)').join(' · '))}
${row('대략 (모조 80g)', b => '약 ' + mm(d[b].n, 0.05) + 'mm')}
${row('대략 (모조 100g)', b => '약 ' + mm(d[b].n, 0.062) + 'mm')}
</table>
<p>표에 없는 두께(예: 7.8mm)가 필요하면 그 값으로 새 표지를 만들어 드립니다. 책등이 6mm 이상이면 책등에 제목이, 4mm 이상이면 짧은 이름이 들어갑니다.</p>
<div class="box"><b>인쇄소에 이렇게 말씀하세요</b><br>
“A5 책자 세 종입니다. ${B.map(b => NAME[b] + ' ' + d[b].n + '쪽 ○부').join(', ')}입니다. 내지는 154×216mm(도련 3mm 포함) PDF이고, 표지는 책등을 포함한 펼침면 PDF입니다. 책등 두께를 알려 주시면 그에 맞는 표지 파일을 드리겠습니다.”</div>
</body></html>`;
}

(async () => {
  const want = process.argv.slice(2).filter(b => BOOKS.includes(b));
  const list = want.length ? want : BOOKS;
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port + '/';
  const opt = { args: ['--no-sandbox'] };
  if (process.env.CHROME) opt.executablePath = process.env.CHROME;
  if (process.env.HTTPS_PROXY && !process.env.FONT_ROUTE) opt.proxy = { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' };
  const browser = await chromium.launch(opt);
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
  if (process.env.FONT_ROUTE) await require(process.env.FONT_ROUTE)(ctx);
  await ctx.route('**script.google.com/**', r => r.abort());
  const PRINT = path.join(ROOT, 'book', 'print');
  fs.mkdirSync(path.join(PRINT, 'cover'), { recursive: true });
  const open = async (page, q) => {
    await page.goto(base + 'sermon-book.html?print=1&' + q, { waitUntil: 'load' });
    await page.waitForFunction('window.BOOK_READY===true', null, { timeout: 300000 });
    await page.evaluate(() => document.fonts.ready);
  };
  const done = {};
  for (const bk of list) {
    const page = await ctx.newPage();
    page.on('pageerror', e => console.error(bk, e.message));
    /* 1) 화면·내려받기용 */
    await open(page, 'b=' + bk);
    const n = await page.evaluate(() => pages.length);
    const over = await page.evaluate(() => [...document.querySelectorAll('#stage .inner')].filter(e => e.scrollHeight > e.clientHeight + 1).length);
    if (over) console.warn('△', bk, '넘치는 쪽', over);
    const out = path.join(ROOT, 'book', 'sermon-' + bk + '.pdf');
    await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
    console.log(bk, n + '쪽 →', path.relative(ROOT, out), Math.round(fs.statSync(out).size / 1024) + 'KB');
    /* 2) 인쇄소 내지 */
    await open(page, 'press=1&b=' + bk);
    const inner = path.join(PRINT, 'sermon-' + bk + '-inner.pdf');
    await page.pdf({ path: inner, printBackground: true, preferCSSPageSize: true });
    console.log(bk, '내지', n + '쪽 154×216mm →', path.relative(ROOT, inner));
    /* 3) 표지 펼침면 (책등 두께마다) + 확인용 */
    for (const sp of spines(bk, n)) {
      const tag = String(sp).replace('.', '_');
      const cov = path.join(PRINT, 'cover', 'sermon-' + bk + '-cover-spine' + tag + 'mm.pdf');
      await open(page, 'cover=1&spine=' + sp + '&b=' + bk);
      await page.pdf({ path: cov, printBackground: true, preferCSSPageSize: true });
      await open(page, 'cover=1&guide=1&spine=' + sp + '&b=' + bk);
      await page.pdf({ path: cov.replace('.pdf', '-확인용.pdf'), printBackground: true, preferCSSPageSize: true });
      console.log(bk, '표지 책등', sp + 'mm' + (sp ? '' : '(중철)'), +(3 + 148 + sp + 148 + 3).toFixed(1) + '×216mm');
    }
    done[bk] = { n, sp: spines(bk, n), title: await page.evaluate(() => S.title) };
    await page.close();
  }
  /* 4) 인쇄 사양서 — 세 권을 모두 만들었을 때만 */
  if (BOOKS.every(b => done[b])) {
    const html = specHtml(done);
    const sf = path.join(PRINT, 'sermon-print-spec.html');
    fs.writeFileSync(sf, html);
    const page = await ctx.newPage();
    await page.goto(base + 'book/print/sermon-print-spec.html', { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(PRINT, '설교묵상집_인쇄사양서.pdf'), printBackground: true, preferCSSPageSize: true });
    console.log('인쇄 사양서 → book/print/설교묵상집_인쇄사양서.pdf');
    await page.close();
  }
  await browser.close();
  srv.close();
})();

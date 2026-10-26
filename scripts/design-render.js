/* 디자인 조각(HTML) → 완성 HTML + 그림(PNG)
   디자인 스튜디오(design.html)와 같은 디자인 시스템(design-system.js)으로 감싼다.

   node scripts/design-render.js 조각.html --theme harvest --format poster --out designs/추수감사-포스터

   - <out>.html : 브라우저로 열어 인쇄할 수 있는 완성 문서 (로고는 홈페이지 주소에서 불러온다)
   - <out>-1.png … : 장마다 그림 한 장 (playwright 가 있을 때만)
   조각은 <style> + <section class="page">…</section> 꼴 (DESIGN.md 9장). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
function opt(name, d) { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : d; }
const src = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!src) {
  console.error('쓰는 법: node scripts/design-render.js 조각.html [--theme dongsan] [--format poster] [--out designs/이름]');
  process.exit(1);
}

const ds = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'design-system.js'), 'utf8') +
  '\n;Object.assign(out,{DS_CHURCH,DS_THEMES,DS_FORMATS,dsTheme,dsFormat,dsDocument});', { out: ds, URL });

const theme = ds.dsTheme(opt('theme', 'dongsan'));
const format = ds.dsFormat(opt('format', 'poster'));
const out = opt('out', path.join('designs', path.basename(src, path.extname(src))));
let fragment = fs.readFileSync(src, 'utf8');
if (/<script|\son\w+=/i.test(fragment)) { console.error('조각에 <script> 나 on… 속성이 있습니다. 지우고 다시 하세요.'); process.exit(1); }
const dark = (() => { const n = parseInt(theme.c.bg.slice(1), 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 < 0.45; })();
fragment = fragment.replace(/assets\/logo\/dongsan-logo(-white)?\.png/g, 'assets/logo/dongsan-logo' + (dark ? '-white' : '') + '.png');

fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
const html = ds.dsDocument(fragment, theme.id, format.id, { base: ds.DS_CHURCH.site });
fs.writeFileSync(out + '.html', html);
console.log('HTML  ' + out + '.html  (' + format.name + ' · ' + theme.name + ')');

let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  console.log('playwright 가 없어 그림은 건너뜁니다. HTML 을 브라우저로 열어 확인하세요.');
  process.exit(0);
}
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: format.w, height: format.h }, deviceScaleFactor: format.scale });
  /* 로고 같은 교회 파일은 홈페이지 대신 이 저장소에서 바로 준다 */
  await page.route(ds.DS_CHURCH.site + '**', r => {
    const rel = decodeURIComponent(new URL(r.request().url()).pathname.replace(/^\/dongsan-church\//, ''));
    const file = path.join(ROOT, rel);
    if (fs.existsSync(file)) r.fulfill({ path: file }); else r.continue();
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const pages = await page.$$('.page');
  for (let i = 0; i < pages.length; i++) {
    const file = out + '-' + (i + 1) + '.png';
    await pages[i].screenshot({ path: file });
    console.log('PNG   ' + file);
  }
  /* 글자가 장 밖으로 넘친 곳을 알려 준다 */
  const over = await page.evaluate(() => [...document.querySelectorAll('.page')].flatMap((p, i) => {
    const r = p.getBoundingClientRect();
    return [...p.querySelectorAll('*')].filter(el => {
      const b = el.getBoundingClientRect();
      return el.textContent.trim() && b.width && (b.right > r.right + 1 || b.bottom > r.bottom + 1 || b.left < r.left - 1 || b.top < r.top - 1) && getComputedStyle(el).position !== 'absolute';
    }).slice(0, 3).map(el => (i + 1) + '장: ' + el.textContent.trim().slice(0, 30));
  }));
  if (over.length) console.log('⚠️ 장 밖으로 나간 글자\n  ' + over.join('\n  '));
  await browser.close();
})();

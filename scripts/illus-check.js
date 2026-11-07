/* 설교 예화집 점검 — illus-data.js
   1) 책·장·핵심 구절이 성경에 있는지, 장마다 예화가 2편(실화 1 · 만든 이야기 1)인지
   2) 글의 “ ” 인용이 개역개정 원문(dongsan_bible.js)과 글자 그대로인지 (… 로 줄인 곳은 나누어 대조)
   3) 실화에는 출처 주소가 있는지, 만든 이야기는 그렇게 밝혔는지, 곧은 따옴표·제목 겹침·글 길이
   실행:  node scripts/illus-check.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const box = { console };
vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'dongsan_bible.js'), 'utf8') + ';this.B=BIBLE_DATA;', box);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'word-data.js'), 'utf8') + ';this.WD=WordData;', box);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'illus-data.js'), 'utf8') + ';this.IL=ILLUS;', box);
const { B, WD, IL } = box;

const norm = s => s.replace(/[\s.,·?!:;'"‘’“”]/g, '');
const ALL = norm(Object.keys(B).map(b => Object.keys(B[b].data).map(c => Object.keys(B[b].data[c]).map(v => B[b].data[c][v]).join(' ')).join(' ')).join(' '));
const CHAPTERS = { romans: ['로마서', 16], philippians: ['빌립보서', 4], ephesians: ['에베소서', 6] };
let bad = 0, warn = 0;
const err = (...a) => { bad++; console.error('✗', ...a); };
const wrn = (...a) => { warn++; console.warn('△', ...a); };
const titles = {};

function refOk(ref) {
  const r = WD.parseRef(ref);
  if (!r || !B[r.book]) return false;
  let n = 0;
  WD.refSpans(r, B[r.book]).forEach(sp => { for (let v = sp.from; v <= sp.to; v++) if (B[r.book].data[sp.chapter][v]) n++; });
  return n > 0;
}
function quotes(txt, where) {
  (String(txt || '').match(/“[^”]+”/g) || []).forEach(q => {
    q.slice(1, -1).split('…').map(norm).filter(Boolean).forEach(part => {
      if (ALL.indexOf(part) < 0) err('인용이 원문과 다름', where, q);
    });
  });
  if (/["']/.test(txt)) err('곧은 따옴표', where, (String(txt).match(/.{0,12}["'].{0,12}/) || [''])[0]);
}

Object.keys(CHAPTERS).forEach(bk => {
  const [name, count] = CHAPTERS[bk], S = IL[bk];
  if (!S) return err('책이 없음', bk);
  const chs = S.chapters.map(c => c.ch);
  for (let i = 1; i <= count; i++) if (!chs.includes(i)) err('장이 빠짐', name, i + '장');
  S.chapters.forEach(c => {
    const w = name + ' ' + c.ch + '장';
    if (!c.theme) err('장 주제 없음', w);
    quotes(c.theme, w + ' 주제');
    (c.key || []).forEach(k => { if (!refOk(k)) err('핵심 구절 없음', w, k); if (!k.startsWith(name + ' ' + c.ch + ':')) wrn('핵심 구절이 다른 장', w, k); });
    if (!c.key || !c.key.length) err('핵심 구절 없음', w);
    if (!c.items || c.items.length !== 2) err('예화가 2편이 아님', w, c.items && c.items.length);
    const kinds = (c.items || []).map(it => it.kind);
    if (!kinds.includes('실화') || !kinds.some(k => k.includes('만든'))) err('실화 1 · 만든 이야기 1 이 아님', w, kinds.join(','));
    (c.items || []).forEach((it, j) => {
      const iw = w + ' ' + (j + 1) + '편 「' + it.title + '」';
      ['title', 'use', 'story', 'link', 'check'].forEach(f => { if (!it[f]) err('빈 칸', iw, f); });
      ['title', 'use', 'story', 'link', 'check', 'note'].forEach(f => quotes(it[f], iw + ' ' + f));
      const len = String(it.story || '').length;
      if (len < 250 || len > 600) wrn('이야기 길이 ' + len + '자', iw);
      if (it.kind === '실화' && !/https?:\/\//.test(it.check)) err('실화인데 출처 주소가 없음', iw);
      if (it.kind.includes('만든') && !/만든 이야기/.test(it.check)) err('만든 이야기라고 밝히지 않음', iw);
      const t = norm(it.title);
      if (titles[t]) err('제목이 겹침', iw, '↔', titles[t]); else titles[t] = iw;
    });
  });
  console.log(name, S.chapters.length + '장', S.chapters.reduce((n, c) => n + (c.items || []).length, 0) + '편');
});
if (bad) { console.error('고칠 곳 ' + bad + '군데' + (warn ? ', 살펴볼 곳 ' + warn + '군데' : '')); process.exit(1); }
console.log('점검 통과' + (warn ? ' (살펴볼 곳 ' + warn + '군데)' : ''));

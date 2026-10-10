/* 설교 묵상집 점검 + 전용 작은 성경 만들기 — sermon-book.html 이 쓰는 sermon-book-bible.js
   1) sermon-book-data.js 의 모든 본문·암송 구절이 성경에 있는지 본다
   2) 묵상 글의 “ ” 인용이 개역개정 원문(dongsan_bible.js)과 글자 그대로인지 대조한다 (… 로 줄인 곳은 나누어 대조)
   3) 쓰는 장(章)만 뽑아 sermon-book-bible.js 를 만든다

   실행:  node scripts/build-sermon-book-bible.js        (묵상 글·본문을 고친 뒤)
          node scripts/build-sermon-book-bible.js --check (파일은 만들지 않고 점검만) */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const box = { console };
vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'dongsan_bible.js'), 'utf8') + ';this.B=BIBLE_DATA;', box);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'word-data.js'), 'utf8') + ';this.WD=WordData;', box);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'sermon-book-data.js'), 'utf8') + ';this.SB=SERMON_BOOKS;', box);
const { B, WD, SB } = box;

const clean = t => String(t || '').replace(/\([a-z](?:\s[^)]*)?\)/g, '').replace(/(^|\s)[a-z](?=[가-힣])/g, '$1')
  .replace(/[a-z]:(?=\d)/g, '').replace(/\s{2,}/g, ' ').trim();
function verses(ref) {
  const r = WD.parseRef(ref);
  if (!r || !B[r.book]) return null;
  const out = [];
  WD.refSpans(r, B[r.book]).forEach(sp => {
    const ch = B[r.book].data[sp.chapter] || {};
    for (let v = sp.from; v <= sp.to; v++) if (ch[v]) out.push({ book: r.book, ch: sp.chapter, v, t: clean(ch[v]) });
  });
  return out;
}
/* 대조용: 66권 전체를 한 줄로 (절 사이는 띄어쓰기) — 문장부호는 비교에서 뺀다 */
const norm = s => s.replace(/[\s.,·?!:;'"‘’“”]/g, '');
const ALL = norm(Object.keys(B).map(b => Object.keys(B[b].data).map(c => Object.keys(B[b].data[c]).map(v => clean(B[b].data[c][v])).join(' ')).join(' ')).join(' '));

let bad = 0;
const need = {};
const use = (ref, where) => {
  const v = verses(ref);
  if (!v || !v.length) { bad++; console.error('✗ 본문 없음', where, ref); return; }
  v.forEach(x => { need[x.book + '|' + x.ch] = 1; });
  return v;
};
Object.keys(SB).forEach(k => {
  const S = SB[k];
  use(S.key, k + ' 첫 말씀'); use(S.end, k + ' 마침 말씀');
  S.parts.forEach((p, i) => use(p.mv, k + ' ' + (i + 1) + '마당 암송'));
  const lens = [];
  S.days.forEach((d, i) => {
    const w = k + ' ' + (i + 1) + '일';
    use(d.p, w + ' 설교 본문');
    const v = use(d.r || d.p, w + ' 실을 본문');
    if (v) lens.push([(i + 1), v.reduce((n, x) => n + x.t.length, 0)]);
    ['t', 'ex', 'gs', 'mm', 'go', 'pr'].concat(d.qs.map((_, j) => j)).forEach(f => {
      const txt = typeof f === 'number' ? d.qs[f] : d[f];
      if (!txt) { if (f !== 'go') { bad++; console.error('✗ 빈 칸', w, f); } return; }
      (String(txt).match(/“[^”]+”/g) || []).forEach(q => {
        q.slice(1, -1).split('…').map(norm).filter(Boolean).forEach(part => {
          if (ALL.indexOf(part) < 0) { bad++; console.error('✗ 인용이 원문과 다름', w, f, q); }
        });
      });
    });
    const exLen = String(d.ex).length;
    if (exLen > 1100) console.warn('△ 묵상 글이 깁니다', w, exLen + '자');
  });
  const long = lens.filter(x => x[1] > 1150);
  if (long.length) console.warn('△', k, '본문이 길어 글씨가 작아질 날:', long.map(x => x[0] + '일(' + x[1] + '자)').join(', '));
  console.log(k, S.days.length + '일', S.parts.length + '마당');
});
if (bad) { console.error('고칠 곳 ' + bad + '군데'); process.exit(1); }
if (process.argv.includes('--check')) { console.log('점검 통과'); process.exit(0); }
const sub = {};
Object.keys(need).sort().forEach(k => {
  const [book, ch] = k.split('|');
  sub[book] = sub[book] || { chapters: B[book].chapters, data: {} };
  sub[book].data[ch] = B[book].data[ch];
});
const OUT = path.join(ROOT, 'sermon-book-bible.js');
fs.writeFileSync(OUT, '/* 설교 묵상집 전용 성경 — scripts/build-sermon-book-bible.js 가 dongsan_bible.js 에서 묵상집에 쓰는 장만 뽑아 만든 파일. 손으로 고치지 않는다. */\n' +
  'var BIBLE_DATA=' + JSON.stringify(sub) + ';\n');
console.log('sermon-book-bible.js', Object.keys(need).length + '장', Math.round(fs.statSync(OUT).size / 1024) + 'KB');

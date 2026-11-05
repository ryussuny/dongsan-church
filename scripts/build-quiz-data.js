/* 퀴즈 배틀 문제 자료 합치기 — 문제 팩 모듈들(module.exports=[팩…])을 quiz-data.js 하나로
   실행: node scripts/build-quiz-data.js 팩파일1.js 팩파일2.js …
   (처음 한 번 합칠 때 썼다. 이후로는 quiz-data.js 를 바로 고치고 node scripts/quiz-check.js) */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const files = process.argv.slice(2);
if (!files.length) { console.error('팩 파일을 적어 주세요'); process.exit(1); }
const packs = [];
files.forEach(f => require(path.resolve(f)).forEach(p => packs.push(p)));
/* 곧은 따옴표 "…" 정리: 개역개정 원문에 그대로 있는 말(5글자 이상)이면 “ ”, 아니면 풀어 쓴 말 ‘ ’ */
const vm = require('vm'), box = {};
vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'dongsan_bible.js'), 'utf8') + ';this.B=BIBLE_DATA;', box);
const nb = s => String(s).replace(/[\s.,·?!:;'"‘’“”]/g, '');
const ALL = nb(Object.values(box.B).map(b => Object.values(b.data).map(c => Object.values(c).join(' ')).join(' ')).join(' '));
let qq = 0, ss = 0;
const fixQ = s => typeof s !== 'string' ? s : s.replace(/"([^"]+)"/g, (m, x) => { const k = nb(x); if (k.length >= 5 && ALL.indexOf(k) >= 0) { qq++; return '“' + x + '”'; } ss++; return '‘' + x + '’'; });
packs.forEach(p => p.q.forEach(q => { ['q', 'ex', 'a', 'e', 'v'].forEach(k => { q[k] = fixQ(q[k]); }); ['h', 'o', 'items', 'alt'].forEach(k => { if (Array.isArray(q[k])) q[k] = q[k].map(fixQ); }); }));
if (qq + ss) console.log('따옴표 정리: 성경 인용 “ ”', qq, '곳 · 풀어 쓴 말 ‘ ’', ss, '곳');
const KEYS = ['t', 'lv', 'q', 'e', 'v', 'h', 'items', 'o', 'a', 'alt', 'ref', 'ex'];
const line = q => '{' + KEYS.filter(k => q[k] !== undefined && !(Array.isArray(q[k]) && !q[k].length && k === 'alt')).map(k => k + ':' + JSON.stringify(q[k])).join(',') + '}';
let out = '/* ===========================================================\n' +
  '   동산 퀴즈 배틀 — 문제 자료 (quiz.html 이 읽는다)\n\n' +
  '   팩 = { id, name, icon, desc, q:[문제…] }\n' +
  '   문제 공통: t 종류 · lv 1 쉬움(중등) / 2 보통(고등) / 3 도전(청년) · ex 풀이 · ref 성경 장절\n' +
  '     ox    { q, a:true|false }\n' +
  '     mc    { q, o:[보기 4개], a:정답 번호 0~3 }        (화면에서는 보기가 섞여 나온다)\n' +
  '     cho   { q:분류·힌트, a:정답(한글), alt:[같이 인정] }  (초성은 프로그램이 만든다)\n' +
  '     emoji { e:이모지, q, a, alt, o:[보기 4개] }\n' +
  '     hint  { h:[힌트 4개, 어려운 것부터], a, o:[보기 4개] }\n' +
  '     order { q, items:[정답 순서 그대로 4개] }\n' +
  '     blank { ref, v:개역개정 원문 + 빈칸 ___ 하나, a:빈칸 말, o:[보기 4개] }\n' +
  '   “ ” 안 성경 인용과 blank 의 v 는 개역개정 원문 그대로 — 고친 뒤 node scripts/quiz-check.js\n' +
  '   =========================================================== */\n' +
  'var QUIZ_PACKS = [\n';
out += packs.map(p => '{ id:' + JSON.stringify(p.id) + ', name:' + JSON.stringify(p.name) + ', icon:' + JSON.stringify(p.icon) + ', desc:' + JSON.stringify(p.desc) + ', q:[\n' + p.q.map(q => '  ' + line(q)).join(',\n') + '\n]}').join(',\n');
out += '\n];\nif (typeof module !== \'undefined\') module.exports = QUIZ_PACKS;\n';
fs.writeFileSync(path.join(ROOT, 'quiz-data.js'), out);
console.log('quiz-data.js —', packs.length, '팩,', packs.reduce((s, p) => s + p.q.length, 0), '문제');

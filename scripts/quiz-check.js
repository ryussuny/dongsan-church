/* 동산 퀴즈 배틀 점검 — quiz-data.js 를 고친 뒤 꼭 돌린다
   1) 문제 형식 (종류별 칸·보기 수·정답 번호·중복)
   2) 성경: ref 장절이 실제로 있는지, 말씀 빈칸(v + a)과 풀이의 “ ” 인용이 개역개정 원문 그대로인지
   3) 브라우저에서 실제로 끝까지 해 보기 — 팀 대항전(모든 팩·룰렛·베팅·시상식), 혼자 도전, 문제 만들기 줄 형식
   실행: node scripts/quiz-check.js            (전부)
         node scripts/quiz-check.js --data     (1·2 만, 브라우저 없이)
         node scripts/quiz-check.js --shots 폴더 (화면 사진도 남기기) */
const fs = require('fs'), path = require('path'), vm = require('vm'), http = require('http');
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const DATA_ONLY = args.includes('--data');
const SHOTS = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;

let bad = 0, warn = 0;
const err = (...m) => { bad++; console.error('✗', ...m); };
const wrn = (...m) => { warn++; console.warn('△', ...m); };

/* ---------- 1) 형식 ---------- */
const PACKS = require(path.join(ROOT, 'quiz-data.js'));
const T = ['ox', 'mc', 'cho', 'emoji', 'hint', 'order', 'blank', 'open'];
const ids = {}, seenQ = {};
let total = 0;
const hangul = s => /^[가-힣 ]+$/.test(s);
PACKS.forEach(p => {
  if (!/^[a-z][a-z0-9-]*$/.test(p.id || '')) err('팩 id', p.id);
  if (ids[p.id]) err('팩 id 중복', p.id); ids[p.id] = 1;
  ['name', 'icon', 'desc'].forEach(k => { if (!p[k]) err(p.id, k, '없음'); });
  if (!Array.isArray(p.q) || p.q.length < 5) err(p.id, '문제가 5개보다 적음');
  (p.q || []).forEach((q, i) => {
    total++;
    const w = p.id + '#' + (i + 1) + ' ' + (q.q || q.a || '').toString().slice(0, 24);
    if (T.indexOf(q.t) < 0) return err(w, '종류', q.t);
    if ([1, 2, 3].indexOf(q.lv) < 0) err(w, 'lv 는 1~3');
    const key = q.t + '|' + (q.q || '') + '|' + (q.v || '') + '|' + (q.e || '') + '|' + JSON.stringify(q.a);
    if (seenQ[key]) err(w, '같은 문제가 또 있음 (' + seenQ[key] + ')'); seenQ[key] = w;
    const four = (arr, n) => Array.isArray(arr) && arr.length === n && arr.every(x => typeof x === 'string' && x.trim());
    const hasAns = () => q.o.some(o => o === q.a);
    switch (q.t) {
      case 'ox': if (!q.q || typeof q.a !== 'boolean') err(w, 'ox 는 q 와 a(true/false)'); break;
      case 'mc': if (!q.q || !four(q.o, 4) || !(q.a >= 0 && q.a <= 3)) err(w, 'mc 는 q, 보기 4개, a 0~3');
        else if (new Set(q.o).size !== 4) err(w, '보기가 겹침'); break;
      case 'cho': if (!q.q || !q.a || !hangul(q.a) || q.a.replace(/ /g, '').length < 2 || q.a.length > 9) err(w, 'cho 의 a 는 한글 2~8글자'); break;
      case 'emoji': if (!q.e || !q.a || !four(q.o, 4) || !hasAns()) err(w, 'emoji 는 e, a, 보기 4개(정답 포함)'); break;
      case 'hint': if (!q.a || !four(q.h, 4) || !four(q.o, 4) || !hasAns()) err(w, 'hint 는 힌트 4개, 보기 4개(정답 포함)');
        else if (q.h.some(h => h.indexOf(q.a) >= 0)) err(w, '힌트에 정답이 들어 있음'); break;
      case 'order': if (!q.q || !four(q.items, 4) || new Set(q.items).size !== 4) err(w, 'order 는 서로 다른 4개'); break;
      case 'blank': if (!q.v || q.v.split('___').length !== 2 || !q.a || !four(q.o, 4) || !hasAns() || !q.ref) err(w, 'blank 는 ref, ___ 하나, a, 보기 4개(정답 포함)'); break;
      case 'open': if (!q.q || !q.a) err(w, 'open 은 q, a'); break;
    }
    if (q.ex && q.ex.length > 120) wrn(w, '풀이가 김 (' + q.ex.length + '자)');
    [q.q, q.ex, q.a, q.v].concat(q.h || [], q.o || [], q.items || [], q.alt || []).forEach(x => { if (typeof x === 'string' && x.indexOf('"') >= 0) err(w, '곧은 따옴표 " 대신 성경 인용은 “ ”, 풀어 쓴 말은 ‘ ’ :', x); });
  });
});
console.log('문제 팩', PACKS.length, '개 · 문제', total, '개');

/* ---------- 2) 성경 ---------- */
const box = {};
vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'dongsan_bible.js'), 'utf8') + ';this.B=BIBLE_DATA;', box);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'word-data.js'), 'utf8') + ';this.WD=WordData;', box);
const { B, WD } = box;
const clean = t => String(t || '').replace(/\([a-z](?:\s[^)]*)?\)/g, '').replace(/(^|\s)[a-z](?=[가-힣])/g, '$1').replace(/[a-z]:(?=\d)/g, '').replace(/\s{2,}/g, ' ').trim();
const norm = s => String(s).replace(/[\s.,·?!:;'"‘’“”]/g, '');
function verseText(ref) {
  const r = WD.parseRef(ref); if (!r || !B[r.book]) return null;
  const out = [];
  WD.refSpans(r, B[r.book]).forEach(sp => { const ch = B[r.book].data[sp.chapter] || {}; for (let v = sp.from; v <= sp.to; v++) if (ch[v]) out.push(clean(ch[v])); });
  return out.length ? out.join(' ') : null;
}
const ALL = norm(Object.keys(B).map(b => Object.keys(B[b].data).map(c => Object.keys(B[b].data[c]).map(v => clean(B[b].data[c][v])).join(' ')).join(' ')).join(' '));
let refs = 0, quotes = 0;
PACKS.forEach(p => p.q.forEach((q, i) => {
  const w = p.id + '#' + (i + 1);
  if (q.ref) {
    refs++;
    const t = verseText(q.ref);
    if (!t) err(w, 'ref 장절이 성경에 없음:', q.ref);
    else if (q.t === 'blank') {
      const full = q.v.replace('___', q.a);
      if (t.indexOf(full) < 0 && norm(t).indexOf(norm(full)) < 0) err(w, '말씀 빈칸이 개역개정 원문과 다름\n   문제: ' + full + '\n   원문: ' + t);
      else if (t.indexOf(full) < 0) wrn(w, '말씀 빈칸 띄어쓰기·문장부호가 원문과 조금 다름 —', full);
    }
  } else if (q.t === 'blank') err(w, '말씀 빈칸에 ref 가 없음');
  [q.ex, q.q].forEach(s => (String(s || '').match(/“[^”]+”/g) || []).forEach(m => {
    quotes++;
    const inner = m.slice(1, -1).split(/…|\.\.\./).map(x => x.trim()).filter(Boolean);
    inner.forEach(part => { if (ALL.indexOf(norm(part)) < 0) err(w, '“ ” 인용이 개역개정에 없음:', part); });
  }));
}));
console.log('성경 장절', refs, '곳 · “ ” 인용', quotes, '곳 대조');

if (bad) { console.error('\n형식·성경 점검 실패', bad, '건'); process.exit(1); }
if (DATA_ONLY) { console.log('\n✓ 자료 점검 통과' + (warn ? ' (참고 ' + warn + '건)' : '')); process.exit(0); }

/* ---------- 3) 브라우저 ---------- */
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { console.log('\n(playwright 가 없어 브라우저 점검은 건너뜀)\n✓ 자료 점검 통과'); process.exit(0); }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css' };
const srv = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + '.png') }); } };

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port + '/';
  const browser = await chromium.launch();
  const errors = [];
  const watch = page => {
    page.on('pageerror', e => errors.push('페이지 오류: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push('콘솔: ' + m.text()); });
  };
  /* 빔 화면 크기로 팀 대항전: 모든 팩을 라운드마다 3문제씩, 6팀 */
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const page = await ctx.newPage(); watch(page);
  await page.goto(base + 'quiz.html');
  await shot(page, '01-lobby');
  await page.click('[data-act="setup"]');
  await page.click('[data-act="setN"][data-arg="6"]');
  await page.click('[data-act="clearPacks"]');
  for (const p of PACKS) await page.click('[data-act="togglePack"][data-arg="' + p.id + '"]');
  await page.click('[data-act="setPer"][data-arg="3"]');
  await page.click('[data-act="setTimer"][data-arg="0"]');
  await shot(page, '02-setup');
  await page.click('[data-act="start"]');
  const seenTypes = {}, seenPhases = {};
  let steps = 0, firstQ = true, usedSteal = false;
  while (steps++ < 800) {
    const st = await page.evaluate(() => { const s = window.QuizBattle.state().S; const q = s && (s.phase === 'q' || s.phase === 'fq') ? (s.phase === 'fq' ? s.final : s.rounds[s.ri].qs[s.qi]) : null; return { phase: s && s.phase, rev: s && s.rev, t: q && q.t, ev: s && s.ev, ri: s && s.ri }; });
    seenPhases[st.phase] = 1;
    if (st.phase === 'awards') break;
    if (st.phase === 'intro') { await page.keyboard.press('Space'); continue; }
    if (st.phase === 'q' || st.phase === 'fq') {
      seenTypes[st.t] = 1;
      if (!st.rev) {
        if (firstQ && st.phase === 'q') { firstQ = false; const d = await page.$('[data-act="arm"]'); if (d) await d.click(); }
        if (st.t === 'hint' && await page.$('[data-act="nextHint"]')) await page.keyboard.press('h');
        if (!seenTypes['shot-' + st.t]) { seenTypes['shot-' + st.t] = 1; await shot(page, '03-q-' + st.t); }
        await page.keyboard.press('Space');
        if (!seenTypes['shotr-' + st.t]) { seenTypes['shotr-' + st.t] = 1; await page.waitForTimeout(700); await shot(page, '04-rev-' + st.t); }
        continue;
      }
      await page.keyboard.press('1'); if (st.phase === 'fq') await page.keyboard.press('3');
      await page.keyboard.press('Space');
      if (st.phase === 'fq') await page.waitForTimeout(2300);
      continue;
    }
    if (st.phase === 'stand') {
      if (!usedSteal) { const b = await page.$('[data-act="steal"]'); if (b) { usedSteal = true; await b.click(); await page.click('[data-act="stealGo"]'); await page.waitForTimeout(300); } }
      if (!seenPhases.shotStand) { seenPhases.shotStand = 1; await page.waitForTimeout(1500); await shot(page, '05-stand'); }
      await page.keyboard.press('Space'); continue;
    }
    if (st.phase === 'event') {
      if (st.ev && st.ev.res < 0) { await page.keyboard.press('Space'); await page.waitForTimeout(5200); await shot(page, '06-event-' + st.ri); continue; }
      if (st.ev && !st.ev.done) {
        const a = await page.$('[data-act="evAuto"]') || await page.$('[data-act="evDuel"]');
        if (a) { await a.click(); continue; }
        await page.keyboard.press('2'); await page.click('[data-act="evPick"]'); continue;
      }
      await page.keyboard.press('Space'); continue;
    }
    if (st.phase === 'bet') { await page.click('[data-act="bet"][data-arg="0,1"]'); await page.click('[data-act="bet"][data-arg="1,0.5"]'); await shot(page, '07-bet'); await page.keyboard.press('Space'); continue; }
    errors.push('알 수 없는 단계: ' + st.phase); break;
  }
  await page.waitForTimeout(1600);
  await shot(page, '08-awards');
  const fin = await page.evaluate(() => { const s = window.QuizBattle.state().S; return { phase: s.phase, scores: s.teams.map(t => t.score), rounds: s.rounds.length }; });
  if (fin.phase !== 'awards') errors.push('팀 대항전이 시상식까지 가지 못함 (' + fin.phase + ')');
  T.filter(t => t !== 'open').forEach(t => { if (!seenTypes[t]) errors.push('팀 대항전에서 ' + t + ' 문제가 한 번도 안 나옴'); });
  ['intro', 'q', 'stand', 'event', 'bet', 'fq', 'awards'].forEach(p => { if (!seenPhases[p]) errors.push('팀 대항전 단계 빠짐: ' + p); });
  console.log('팀 대항전: 라운드', fin.rounds, '· 점수', fin.scores.join(' / '), '· 단계', steps);
  // 이어 하기 (새로 고침)
  await page.reload(); if (!(await page.$('[data-act="resume"]')) && fin.phase !== 'awards') errors.push('이어 하기 단추 없음');

  /* 휴대폰: 혼자 도전 — 오늘의 도전 끝까지 */
  const ph = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ph.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const sp = await ph.newPage(); watch(sp);
  await sp.goto(base + 'quiz.html?solo=1');
  await shot(sp, '10-solo-home');
  await sp.click('[data-act="soloDaily"]');
  let n = 0, soloTypes = {};
  while (n++ < 40) {
    const s = await sp.evaluate(() => { const o = window.QuizBattle.state().SO; return o ? { over: o.over, rev: o.rev, t: o.qs[o.i].t, ai: o.qs[o.i].ai, a: o.qs[o.i].a, sh: o.qs[o.i].sh, i: o.i } : null; });
    if (!s || s.over) break;
    if (s.rev) { await sp.click('[data-act="soloNext"]'); continue; }
    soloTypes[s.t] = 1;
    if (!soloTypes['shot' + s.t]) { soloTypes['shot' + s.t] = 1; await shot(sp, '11-solo-' + s.t); }
    const right = s.i % 3 !== 2;   // 셋 중 하나는 일부러 틀려 본다
    if (s.t === 'ox') await sp.click('[data-act="soloAns"][data-arg="' + ((s.a ? 0 : 1) ^ (right ? 0 : 1)) + '"]');
    else if (s.t === 'order') { const seq = right ? s.sh.map((_, k) => s.sh.indexOf(k)) : [0, 1, 2, 3].slice(0, s.sh.length).reverse(); for (const pos of seq) await sp.click('[data-act="soloSeq"][data-arg="' + pos + '"]'); }
    else if (await sp.$('#tin')) { await sp.fill('#tin', right ? s.a : '모름'); await sp.press('#tin', 'Enter'); }
    else await sp.click('[data-act="soloAns"][data-arg="' + (right ? s.ai : (s.ai + 1) % 4) + '"]');
    if (!soloTypes['shotr' + s.t]) { soloTypes['shotr' + s.t] = 1; await shot(sp, '12-solo-rev-' + s.t); }
  }
  await sp.waitForTimeout(1500);
  await shot(sp, '13-solo-result');
  const so = await sp.evaluate(() => { const o = window.QuizBattle.state().SO; return o && { over: o.over, score: o.score, ok: o.ok, n: o.qs.length, lives: o.lives }; });
  if (!so || !so.over) errors.push('혼자 도전이 결과까지 가지 못함');
  else console.log('혼자 도전: ' + so.ok + '/' + so.n + ' · ' + so.score + '점 · 목숨 ' + so.lives);

  /* 문제 만들기: 줄 형식 → 저장 → 팀 대항전 팩 목록 */
  const pe = await ph.newPage(); watch(pe);
  await pe.goto(base + 'quiz.html');
  const parsed = await pe.evaluate(() => {
    const QB = window.QuizBattle;
    const r = QB.parseLines('OX | 노아는 방주를 만들었다 | O\n> 창세기 6장\n4지 | 질문 | 보기 | *정답 | 보기2\n초성 | 힌트 | 다윗\n이모지 | 🐋🙏 | 요나 | 노아\n순서 | 순서 | 가 | 나 | 다\n누구 | 삭개오 | 하나 | 둘\n빈칸 | 하나님이 ___ | 사랑하사 | 미워하사 | 요한복음 3:16\n주관식 | 문제 | 답\n틀린줄 | 하나\nOX | 정답칸없음');
    const back = QB.parseLines(r.qs.map(QB.toLine).join('\n'));
    return { n: r.qs.length, errs: r.errs.length, mcA: r.qs[1].a, ex: r.qs[0].ex, blankRef: r.qs[6].ref, blankO: r.qs[6].o, round: back.qs.length === r.qs.length && JSON.stringify(back.qs) === JSON.stringify(r.qs), cho: QB.choseong('존 웨슬리').join('') };
  });
  if (parsed.n !== 8 || parsed.errs !== 2 || parsed.mcA !== 1 || parsed.ex !== '창세기 6장' || parsed.blankRef !== '요한복음 3:16' || !parsed.round || parsed.cho !== 'ㅈ ㅇㅅㄹ') errors.push('줄 형식 읽기가 이상함: ' + JSON.stringify(parsed));
  await pe.click('[data-act="edit"]'); await pe.click('[data-act="editNew"]');
  await pe.fill('#eName', '점검 팩'); await pe.click('[data-act="editSave"]');
  await shot(pe, '14-editor');
  await pe.click('[data-act="home"]'); await pe.click('[data-act="setup"]');
  if (!(await pe.$('.pk .my'))) errors.push('만든 팩이 팀 대항전 목록에 없음');

  await browser.close(); srv.close();
  if (errors.length) { errors.forEach(e => err(e)); console.error('\n브라우저 점검 실패', errors.length, '건'); process.exit(1); }
  console.log('\n✓ 모두 통과' + (warn ? ' (참고 ' + warn + '건)' : '') + (SHOTS ? ' · 화면 사진: ' + SHOTS : ''));
})().catch(e => { console.error(e); srv.close(); process.exit(1); });

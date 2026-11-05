/* 동산 퀴즈 배틀 — 📱 휴대폰 참여 점검
   이 컴퓨터에 시험용 실시간 방송국(MQTT·WebSocket)을 띄우고, 인도자 화면 하나와 휴대폰 셋을
   브라우저로 열어 처음부터 시상식까지 실제로 해 본다.
     - 참여(QR·방 코드) → 팀 고르기 → 모든 팀 문제 휴대폰 답 → 맞힌 팀 저절로 고르기(절반 이상)
     - 먼저 외치기: 버저 → 틀렸어요(그 팀 잠금) → 다른 팀 버저 → 맞았어요
     - 파이널 · 시상식 개인 MVP · 방 닫기
   준비(한 번): 저장소 밖 폴더에서  npm i aedes@0.51.3 websocket-stream@5.5.2 mqtt@5.10.1 qrcode-generator@1.4.4
   실행: QUIZ_LIVE_DEPS=<그 폴더> node scripts/quiz-live-check.js [--shots 폴더] */
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const SHOTS = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
const paths = [process.env.QUIZ_LIVE_DEPS && path.join(process.env.QUIZ_LIVE_DEPS, 'node_modules'), process.env.QUIZ_LIVE_DEPS, path.join(ROOT, 'node_modules')].filter(Boolean);
const dep = n => require(require.resolve(n, { paths }));
const depFile = f => { for (const d of paths) { const x = path.join(d, f); if (fs.existsSync(x)) return fs.readFileSync(x); } throw new Error('없음: ' + f); };
let aedesF, wsStream, MQ, QR;
try { aedesF = dep('aedes'); wsStream = dep('websocket-stream'); MQ = depFile('mqtt/dist/mqtt.min.js'); QR = depFile('qrcode-generator/qrcode.js'); }
catch (e) { console.log('(시험용 방송국 꾸러미가 없어 건너뜀 — 파일 맨 위 「준비」를 보세요)\n', e.message); process.exit(0); }
const { chromium } = require('playwright');

const errors = [];
const fail = m => { errors.push(m); console.error('✗', m); };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png' };
const site = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(ROOT, u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
const aedes = aedesF(), bsrv = http.createServer();
wsStream.createServer({ server: bsrv }, aedes.handle);
const listen = s => new Promise(r => s.listen(0, '127.0.0.1', () => r(s.address().port)));
const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
async function until(fn, ms, what) { const t0 = Date.now(); while (Date.now() - t0 < (ms || 8000)) { if (await fn()) return true; await wait(80); } fail('기다려도 안 됨: ' + what); return false; }

(async () => {
  const sitePort = await listen(site), brokerPort = await listen(bsrv);
  const base = 'http://127.0.0.1:' + sitePort + '/', broker = 'ws://127.0.0.1:' + brokerPort;
  const browser = await chromium.launch();
  const ctx = async (vp, mobile) => {
    const c = await browser.newContext({ viewport: vp, isMobile: !!mobile, hasTouch: !!mobile });
    await c.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await c.route(/cdn\.jsdelivr\.net\/npm\/mqtt@/, r => r.fulfill({ body: MQ, contentType: 'text/javascript' }));
    await c.route(/cdn\.jsdelivr\.net\/npm\/qrcode-generator@/, r => r.fulfill({ body: QR, contentType: 'text/javascript' }));
    const p = await c.newPage();
    p.on('pageerror', e => fail('페이지 오류: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) fail('콘솔: ' + m.text()); });
    return p;
  };
  const H = await ctx({ width: 1280, height: 720 });
  await H.addInitScript(() => { try { sessionStorage.setItem('dongsan_adminOpen', '1'); } catch (e) {} });   // 관리자 앱을 풀고 들어온 인도자
  const st = () => H.evaluate(() => { const x = window.QuizBattle.state(), S = x.S, L = x.LIVE; const q = S && (S.phase === 'q' || S.phase === 'fq') ? (S.phase === 'fq' ? S.final : S.rounds[S.ri].qs[S.qi]) : null; return { phase: S && S.phase, rev: S && S.rev, picked: S && S.picked, q: q && { t: q.t, a: q.a, ai: q.ai, sh: q.sh, n: q.items && q.items.length, style: window.QuizBattle.styleOf(q) }, seq: L.seq, nAns: Object.keys(L.ans).length, buzz: L.buzz, lock: L.lock, players: Object.keys(L.players).length, code: L.code, on: L.on }; });

  // 1) 인도자: 준비 → 휴대폰 참여 켜기
  await H.goto(base + 'quiz.html?broker=' + encodeURIComponent(broker));
  await H.click('[data-act="setup"]');
  await H.click('[data-act="setN"][data-arg="2"]');
  await H.click('[data-act="clearPacks"]');
  for (const id of ['people', 'emoji', 'order']) await H.click('[data-act="togglePack"][data-arg="' + id + '"]');
  await H.click('[data-act="setPer"][data-arg="3"]');
  await H.click('[data-act="toggleCfg"][data-arg="events"]');
  await H.click('[data-act="liveOn"]');
  await until(async () => (await st()).on, 8000, '휴대폰 참여 켜기');
  await until(async () => !!(await H.$('#livePanel.on .lqr svg')), 4000, 'QR 그리기');
  const code = (await st()).code;
  if (!/^[A-Z2-9]{4}$/.test(code)) fail('방 코드 모양: ' + code);
  const url = base + 'quiz.html?join=' + code + '&broker=' + encodeURIComponent(broker);

  // 2) 휴대폰 셋: 참여 → 별명 → 팀
  const phones = [], names = ['번개손', '느림보', '만나왕'], teams = [0, 0, 1];
  for (let i = 0; i < 3; i++) {
    const p = await ctx({ width: 390, height: 844 }, true);
    await p.goto(url);
    await p.waitForSelector('.pteam', { timeout: 8000 });
    if (i === 0) await shot(p, 'p1-team');
    await p.fill('#pname', names[i]);
    await p.click('.pteam[data-arg="' + teams[i] + '"]');
    phones.push(p);
  }
  await until(async () => (await st()).players === 3, 6000, '세 명 참여');
  await H.waitForTimeout(300);
  await shot(H, 'h1-setup-live');
  await shot(phones[0], 'p2-lobby');

  // 3) 게임
  await H.click('[data-act="start"]');
  const seen = {}; let steps = 0, buzzNoTried = false;
  const pst = p => p.evaluate(() => { const J = window.QuizBattle.state().J; return J && J.st ? { ph: J.st.ph, seq: J.st.q && J.st.q.seq, rev: !!J.st.rev, buzz: J.st.buzz } : null; });
  while (steps++ < 80) {
    const s = await st();
    if (s.phase === 'awards') break;
    if (s.phase === 'intro' || s.phase === 'stand') { await H.keyboard.press('Space'); await H.waitForTimeout(200); continue; }
    if (s.phase === 'bet') { await H.click('[data-act="bet"][data-arg="0,0.5"]'); await H.keyboard.press('Space'); continue; }
    if (s.phase === 'q' || s.phase === 'fq') {
      if (s.rev) { await H.keyboard.press('Space'); if (s.phase === 'fq') await H.waitForTimeout(2400); continue; }
      for (const p of phones) await until(async () => { const x = await pst(p); return x && x.seq === s.seq && !x.rev; }, 5000, '휴대폰에 새 문제');
      const q = s.q; seen[q.t + '/' + q.style] = 1;
      if (q.style === 'all' || s.phase === 'fq') {
        for (let i = 0; i < 3; i++) {
          const p = phones[i], right = i !== 1;
          if (q.t === 'ox') await p.click('[data-act="pAns"][data-arg="' + ((q.a ? 0 : 1) ^ (right ? 0 : 1)) + '"]');
          else if (q.t === 'order') { const seq = right ? Array.from({ length: q.n }, (_, k) => q.sh.indexOf(k)) : Array.from({ length: q.n }, (_, k) => q.n - 1 - k); for (const pos of seq) await p.click('[data-act="pSeq"][data-arg="' + pos + '"]'); }
          else if (await p.$('#pans')) { await p.fill('#pans', right ? String(q.a) : '모름'); await p.press('#pans', 'Enter'); }
          else await p.click('[data-act="pAns"][data-arg="' + (right ? q.ai : (q.ai + 1) % 4) + '"]');
        }
        await until(async () => (await st()).nAns === 3, 5000, '휴대폰 답 셋 받기');
        if (!seen['shot-q-' + q.t]) { seen['shot-q-' + q.t] = 1; await shot(H, 'h2-q-' + q.t); await shot(phones[0], 'p3-q-' + q.t); }
        await H.keyboard.press('Space');
        const after = await st();
        const want = q.t === 'ox' && q.a === undefined ? null : [0, 1];   // 0팀 1/2 맞힘(절반 이상), 1팀 1/1
        if (want && JSON.stringify(after.picked.slice().sort()) !== JSON.stringify(want)) fail('맞힌 팀 저절로 고르기가 다름: ' + JSON.stringify(after.picked) + ' (' + q.t + ')');
        await until(async () => !!(await phones[1].$('.gain.miss')) && !!(await phones[0].$('.gain:not(.miss)')), 4000, '휴대폰 결과 (맞음·틀림)');
        if (!seen['shot-r-' + q.t]) { seen['shot-r-' + q.t] = 1; await H.waitForTimeout(500); await shot(H, 'h3-rev-' + q.t); await shot(phones[1], 'p4-rev-' + q.t); }
      } else {
        // 먼저 외치기: 처음 한 번은 0팀이 눌러 틀리고, 1팀이 다시 눌러 맞힌다
        if (!buzzNoTried) {
          buzzNoTried = true;
          await phones[0].click('.buzzer');
          await until(async () => { const x = await st(); return x.buzz && x.buzz.t === 0; }, 4000, '0팀 버저');
          await until(async () => { const x = await pst(phones[2]); return x && x.buzz; }, 4000, '다른 휴대폰에 버저 표시');
          await shot(H, 'h4-buzz'); await shot(phones[0], 'p5-buzz-me'); await shot(phones[2], 'p6-buzz-other');
          await H.click('[data-act="buzzNo"]');
          await until(async () => { const x = await st(); return !x.buzz && x.lock.indexOf(0) >= 0; }, 3000, '틀린 팀 잠그기');
          await until(async () => !!(await phones[1].$('.pbuzzed')), 3000, '잠긴 팀 휴대폰 안내');
          if (await phones[1].$('.buzzer')) fail('잠긴 팀에 버저가 보임');
        }
        await until(async () => !!(await phones[2].$('.buzzer')), 4000, '1팀 버저 단추');
        await phones[2].click('.buzzer');
        await until(async () => { const x = await st(); return x.buzz && x.buzz.t === 1; }, 4000, '1팀 버저');
        await H.click('[data-act="buzzOK"]');
        const after = await st();
        if (JSON.stringify(after.picked) !== '[1]') fail('버저 팀이 골라지지 않음: ' + JSON.stringify(after.picked));
      }
      continue;
    }
    fail('알 수 없는 단계 ' + s.phase); break;
  }
  if ((await st()).phase !== 'awards') fail('시상식까지 가지 못함');
  ['ox/all', 'mc/all', 'emoji/buzz', 'order/all'].forEach(k => { if (!seen[k]) fail('이 종류를 해 보지 못함: ' + k); });
  await H.waitForTimeout(1500);
  await shot(H, 'h5-awards');
  const mvp = await H.evaluate(() => document.body.innerText.indexOf('개인 MVP') >= 0);
  if (!mvp) fail('시상식에 개인 MVP 가 없음');
  await until(async () => (await phones[0].evaluate(() => document.body.innerText)).indexOf('등!') >= 0, 4000, '휴대폰 시상식');
  await shot(phones[0], 'p7-awards');
  const pl = await H.evaluate(() => { const P = window.QuizBattle.state().LIVE.players; return Object.keys(P).map(k => P[k]); });
  const best = pl.slice().sort((a, b) => b.c - a.c)[0];
  if (!best || best.c < 3) fail('개인 기록이 쌓이지 않음: ' + JSON.stringify(pl));
  if (pl.find(p => p.n === '느림보').c > 0) fail('일부러 틀린 사람에게 점수가 들어감');

  // 4) 방 닫기
  await H.click('#liveBadge'); await H.click('[data-act="liveOff"]');
  await until(async () => (await phones[0].evaluate(() => document.body.innerText)).indexOf('방이 닫혔어요') >= 0, 5000, '방 닫힘 안내');

  // 5) 없는 방 코드
  const p4 = await ctx({ width: 390, height: 844 }, true);
  await p4.goto(base + 'quiz.html?join=ZZZZ&broker=' + encodeURIComponent(broker));
  await until(async () => (await p4.evaluate(() => document.body.innerText)).indexOf('방을 찾지 못했어요') >= 0, 9000, '없는 방 안내');

  await browser.close(); site.close(); bsrv.close(); aedes.close();
  console.log('휴대폰 참여: 방 ' + code + ' · 3명 · ' + Object.keys(seen).filter(k => k.indexOf('shot') < 0).join(', ') + ' · MVP ' + (best && best.n) + ' ' + (best && best.c) + '문제');
  if (errors.length) { console.error('\n휴대폰 참여 점검 실패', errors.length, '건'); process.exit(1); }
  console.log('✓ 휴대폰 참여 점검 통과' + (SHOTS ? ' · 화면 사진: ' + SHOTS : ''));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

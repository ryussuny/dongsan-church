/* 함께 자라요 — 자동 검증
 *
 *   node scripts/grow-check.js            → 검사만
 *   node scripts/grow-check.js --shots    → 놀이마다 화면 사진도 찍는다 (scripts/grow-shots/, 커밋하지 않음)
 *
 * 두 가지를 본다.
 *  1) 치료 설계 검사 — 놀이마다 목표·함께 하는 법·근거·화면 밖 놀이·실행기능 표시가 있는지,
 *     여섯 가지 생각 힘(실행기능)이 고르게 덮이는지, 오늘의 놀이 꾸러미가 원칙대로 짜이는지
 *     (기분 묻기로 시작 · 생각 힘 하나 · 15분 넘으면 몸놀이 · 쉬어가기로 끝 · 아이가 고르기),
 *     단계 맞추기(85%↑ 올림 · 50%↓ 내림), 발음이 서툴러도 알아듣는 너그러운 맞춤.
 *  2) 실제로 돌려 보기 — 휴대폰 크기 화면에서 모든 놀이를 모든 단계로 열고, 눌러 보고,
 *     오류가 없는지·가로로 넘치지 않는지 본다. 상 화면·스티커·기록, 부모 화면 탭도 연다.
 *
 * Playwright(크로미움)가 필요하다. 카메라·마이크는 가짜 장치로 대신한다.
 */
var http = require('http'), fs = require('fs'), path = require('path');
var ROOT = path.join(__dirname, '..');
var SHOTS = process.argv.indexOf('--shots') > 0 ? path.join(__dirname, 'grow-shots') : null;
var chromium;
try { chromium = require('playwright').chromium; } catch (e) { console.error('playwright 가 필요합니다: npm i -D playwright'); process.exit(2); }

var TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.mp3': 'audio/mpeg' };
var server = http.createServer(function (q, r) {
  var p = decodeURIComponent(q.url.split('?')[0].split('#')[0]); if (p === '/') p = '/grow.html';
  var f = path.join(ROOT, path.normalize(p).replace(/^(\.\.[\/\\])+/, ''));
  fs.readFile(f, function (e, d) { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
});

var fails = [], warns = [], passes = 0;
function ok(cond, msg, warnOnly) { if (cond) passes++; else (warnOnly ? warns : fails).push(msg); return cond; }

server.listen(0, async function () {
  var base = 'http://localhost:' + server.address().port + '/grow.html';
  var browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  var ctx = await browser.newContext({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 2, hasTouch: true, permissions: ['camera', 'microphone'] });
  var page = await ctx.newPage();
  var errs = [];
  page.on('pageerror', function (e) { errs.push(e.message); });
  page.on('console', function (m) { if (m.type() === 'error' && !/Failed to load resource|favicon|fonts\.g/.test(m.text())) errs.push(m.text()); });
  await page.goto(base);
  await page.waitForTimeout(600);
  ok(!errs.length, '처음 열 때 오류: ' + errs.join(' | ')); errs = [];

  /* ---------- 1) 치료 설계 검사 ---------- */
  var design = await page.evaluate(function () {
    var G = window.G, out = { acts: [], areas: {}, ef: {}, plan: {}, level: {}, sim: {} };
    Object.keys(G.acts).forEach(function (id) {
      var a = G.acts[id];
      out.acts.push({ id: id, area: a.area, tool: !!a.tool, title: a.title, icon: a.icon, desc: a.desc, goal: a.goal, how: a.how, basis: a.basis, offline: a.offline, ef: a.ef || [], levels: a.levels, needs: a.needs });
      if (!a.tool) { out.areas[a.area] = (out.areas[a.area] || 0) + 1; (a.ef || []).forEach(function (k) { out.ef[k] = (out.ef[k] || 0) + 1; }); }
    });
    out.areaKeys = Object.keys(G.AREAS); out.efKeys = Object.keys(G.EF);
    /* 오늘의 놀이 꾸러미 */
    [10, 15, 20].forEach(function (m) {
      G.settings.sessionMin = m;
      var p = G.planToday();
      var flat = function (e) { return typeof e === 'string' ? [e] : e.pick; };
      out.plan[m] = {
        len: p.length, first: p[0], last: p[p.length - 1],
        lastArea: G.acts[p[p.length - 1]] && G.acts[p[p.length - 1]].area,
        hasBrain: p.some(function (e) { return flat(e).some(function (id) { return G.acts[id].area === 'brain'; }); }),
        hasBody: p.some(function (e) { return flat(e).some(function (id) { return G.acts[id].area === 'body'; }); }),
        picks: p.filter(function (e) { return typeof e !== 'string'; }).length,
        dup: (function () { var s = {}, d = false; p.forEach(function (e) { flat(e).forEach(function (id) { if (s[id]) d = true; s[id] = 1; }); }); return d; })()
      };
    });
    G.settings.sessionMin = 15;
    /* 단계 맞추기 */
    var keep = localStorage.getItem('grow_logs');
    function setLogs(arr) { localStorage.setItem('grow_logs', JSON.stringify(arr.map(function (x, i) { return { t: i, d: '2026-01-01', id: 'zz', area: 'mind', lv: x[0], n: 10, ok: x[1], ms: 1000 }; }))); }
    setLogs([[1, 9], [1, 10], [1, 9]]); out.level.up = G.levelFor('zz', 3);
    setLogs([[2, 3], [2, 4], [2, 5]]); out.level.down = G.levelFor('zz', 3);
    setLogs([[2, 7], [2, 7], [2, 7]]); out.level.stay = G.levelFor('zz', 3);
    setLogs([[3, 10], [3, 10], [3, 10]]); out.level.cap = G.levelFor('zz', 3);
    setLogs([]); out.level.first = G.levelFor('zz', 3);
    /* 검토에서 나온 경우: 다른 단계 기록을 섞지 않는다 */
    setLogs([[1, 10], [1, 10], [2, 6]]); out.level.mixUp = G.levelFor('zz', 3);       /* 2단계 한 판(60%) → 2 그대로 (3으로 뛰지 않음) */
    setLogs([[1, 10], [2, 6], [3, 3]]); out.level.mixDown = G.levelFor('zz', 3);     /* 3단계 30% → 2로 내림 */
    var qa = [[1, 9], [1, 9], [1, 9]].map(function (x, i) { return { t: i, d: '2026-01-01', id: 'zz', area: 'mind', lv: x[0], n: 10, ok: x[1], ms: 1000 }; });
    qa.push({ t: 9, d: '2026-01-01', id: 'zz', area: 'mind', lv: 2, n: 1, ok: 0, ms: 500, x: { quit: 1 } });
    localStorage.setItem('grow_logs', JSON.stringify(qa)); out.level.quitIgnored = G.levelFor('zz', 3);   /* 그만둔 판은 무시 → 1단계 세 판 90% → 2 */
    if (G.acts.daynight) { localStorage.setItem('grow_logs', JSON.stringify([{ t: 1, d: '2026-01-01', id: 'daynight', area: 'brain', lv: 1, n: 10, ok: 10, ms: 1000 }])); out.level.warm = G.levelFor('daynight', 3); }
    if (keep) localStorage.setItem('grow_logs', keep); else localStorage.removeItem('grow_logs');
    /* 너그러운 말소리 맞춤 */
    out.sim = { '아과/사과': G.similar('아과', '사과'), '나나/바나나': G.similar('나나', '바나나'), '머머/멍멍': G.similar('머머', '멍멍'),
      '강아지 줘/강아지': G.similar('강아지 줘', '강아지'), '자동차/강아지': G.similar('자동차', '강아지'), '물/우유': G.similar('물', '우유'),
      '무/물': G.similar('무', '물'), '고/코': G.similar('고', '코'),
      '엄마/이': G.similar('엄마', '이'), '배고파/코': G.similar('배고파', '코'), '안녕/눈': G.similar('안녕', '눈'), '안녕/바나나': G.similar('안녕', '바나나'), '아니/이': G.similar('아니', '이') };
    /* 아이 대화 AI 는 부모가 켜기 전엔 꺼져 있어야 한다 */
    var k0 = localStorage.getItem('grow_apiKey'), c0 = localStorage.getItem('grow_aiChild');
    localStorage.setItem('grow_apiKey', JSON.stringify('sk-test')); localStorage.removeItem('grow_aiChild');
    out.aiChildDefault = window.G.ai.childOn();
    localStorage.setItem('dongsan_apiKey', JSON.stringify('sk-church')); localStorage.removeItem('grow_apiKey');
    out.churchKeySilent = window.G.ai.key();
    localStorage.removeItem('dongsan_apiKey');
    if (k0) localStorage.setItem('grow_apiKey', k0); else localStorage.removeItem('grow_apiKey');
    if (c0) localStorage.setItem('grow_aiChild', c0);
    return out;
  });

  var acts = design.acts.filter(function (a) { return !a.tool; });
  ok(acts.length >= 40, '놀이 수가 적음: ' + acts.length + '개 (40개 이상 기대)');
  design.acts.forEach(function (a) {
    var where = a.id + ' (' + a.title + ')';
    ok(a.title && a.icon && a.desc, where + ': 제목·아이콘·설명이 빠짐');
    ok(design.areaKeys.indexOf(a.area) >= 0 || a.area === 'tool', where + ': 알 수 없는 영역 ' + a.area);
    ok(a.goal && a.goal.length >= 6, where + ': 부모용 치료 목표(goal)가 없음');
    ok(a.how && a.how.length >= 20, where + ': 함께 하는 법(how)이 없음');
    if (!a.tool) {
      ok(a.ef.length >= 1, where + ': 실행기능 표시(ef)가 없음');
      ok(a.ef.every(function (k) { return design.efKeys.indexOf(k) >= 0; }), where + ': 잘못된 ef 키 ' + a.ef.join(','));
      ok(!!a.basis, where + ': 근거(basis)가 없음', true);
      ok(!!a.offline, where + ': 화면 밖 놀이(offline)가 없음', true);
    }
  });
  design.areaKeys.forEach(function (k) { ok((design.areas[k] || 0) >= 3, '영역 ' + k + ' 놀이가 3개 미만: ' + (design.areas[k] || 0)); });
  ok((design.areas.brain || 0) >= 6, '생각 힘(실행기능) 놀이가 6개 미만: ' + (design.areas.brain || 0));
  design.efKeys.forEach(function (k) { ok((design.ef[k] || 0) >= 3, '실행기능 ' + k + ' 을(를) 기르는 놀이가 3개 미만: ' + (design.ef[k] || 0)); });
  Object.keys(design.plan).forEach(function (m) {
    var p = design.plan[m];
    ok(p.first === 'checkin', m + '분 꾸러미: 기분 묻기로 시작하지 않음');
    ok(p.lastArea === 'calm', m + '분 꾸러미: 쉬어가기로 끝나지 않음');
    ok(p.hasBrain, m + '분 꾸러미: 생각 힘 놀이가 없음');
    if (+m >= 15) ok(p.hasBody, m + '분 꾸러미: 몸놀이(화면 쉬기)가 없음');
    ok(p.picks >= 2, m + '분 꾸러미: 아이가 고르는 칸이 2개 미만');
    ok(!p.dup, m + '분 꾸러미: 같은 놀이가 두 번 들어감');
    ok(p.len >= 4 && p.len <= 9, m + '분 꾸러미 길이 이상: ' + p.len);
  });
  ok(design.level.first === 1, '처음 단계가 1이 아님');
  ok(design.level.up === 2, '잘하면(90%) 단계가 오르지 않음: ' + design.level.up);
  ok(design.level.down === 1, '어려우면(40%) 단계가 내려가지 않음: ' + design.level.down);
  ok(design.level.stay === 2, '보통(70%)이면 단계 유지해야 함: ' + design.level.stay);
  ok(design.level.cap === 3, '최고 단계를 넘어감: ' + design.level.cap);
  ok(design.sim['아과/사과'] >= 0.5 && design.sim['나나/바나나'] >= 0.5 && design.sim['머머/멍멍'] >= 0.5 && design.sim['강아지 줘/강아지'] === 1, '서툰 발음을 너그럽게 알아듣지 못함: ' + JSON.stringify(design.sim));
  ok(design.sim['자동차/강아지'] < 0.5, '전혀 다른 말을 맞다고 함: ' + JSON.stringify(design.sim));
  ok(design.sim['무/물'] >= 0.5 && design.sim['고/코'] >= 0.5, '아이 발음(받침 빠짐·ㅋ→ㄱ)을 받아 주지 못함: ' + JSON.stringify(design.sim));
  ok(['엄마/이', '배고파/코', '안녕/눈', '안녕/바나나', '아니/이'].every(function (k) { return design.sim[k] < 0.5; }), '엉뚱한 말을 한 글자 낱말로 칭찬함: ' + JSON.stringify(design.sim));
  ok(design.level.mixUp === 2, '다른 단계 기록을 섞어 단계를 건너뜀: ' + design.level.mixUp);
  ok(design.level.mixDown === 2, '새 단계가 너무 어려워도(30%) 내려가지 않음: ' + design.level.mixDown);
  ok(design.level.quitIgnored === 2, '중간에 그만둔 판이 단계 판단에 섞임: ' + design.level.quitIgnored);
  if (design.level.warm !== undefined) ok(design.level.warm === 2, '규칙 익히기(1단계)를 잘해도 진짜 연습 단계로 안 오름: ' + design.level.warm);
  ok(design.aiChildDefault === false, '아이 대화 AI 가 부모 동의 없이 켜져 있음');
  ok(!design.churchKeySilent, '교회 관리자 앱 키를 부모 동의 없이 가져다 씀');

  /* ---------- 2) 모든 놀이를 모든 단계로 돌려 보기 ---------- */
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  var runs = 0;
  for (var i = 0; i < design.acts.length; i++) {
    var a = design.acts[i];
    for (var lv = 1; lv <= (a.levels || 1); lv++) {
      errs = [];
      await page.evaluate(function (x) { window.G.start(x.id, { level: x.lv }); }, { id: a.id, lv: lv });
      await page.waitForTimeout(900);
      /* 무언가 눌러 본다: 그림 단추 → 큰 단추 → 판정 단추 */
      var tapped = await page.evaluate(function () {
        var b = document.querySelector('#stBody .choice:not([disabled])') || document.querySelector('#stBody .judge .yes') || document.querySelector('#stBody button.big');
        if (b) { b.click(); return b.className; } return '';
      });
      await page.waitForTimeout(700);
      var st = await page.evaluate(function () {
        var body = document.getElementById('stBody');
        return { kids: body.children.length, wide: document.documentElement.scrollWidth > innerWidth + 2 || body.scrollWidth > body.clientWidth + 2, alive: !!window.G.cur || !!document.querySelector('.reward') };
      });
      ok(st.kids > 0, a.id + ' ' + lv + '단계: 화면이 비어 있음');
      ok(!st.wide, a.id + ' ' + lv + '단계: 화면이 가로로 넘침', true);
      ok(!errs.length, a.id + ' ' + lv + '단계 오류: ' + errs.join(' | '));
      if (SHOTS && lv === 1) await page.screenshot({ path: path.join(SHOTS, a.area + '-' + a.id + '.png') });
      await page.evaluate(function () { var r = document.querySelector('.reward'); if (r) r.remove(); window.G.home(); });
      runs++;
    }
  }

  /* 상 화면 · 스티커 · 기록 */
  errs = [];
  var fin = await page.evaluate(function () {
    var G = window.G, before = G.logs().length, st0 = G.stickers().count;
    var id = G.acts.listen ? 'listen' : Object.keys(G.acts).filter(function (k) { return !G.acts[k].tool; })[0];
    G.start(id, { level: 1 }); G.cur.trial(true); G.cur.trial(false); G.cur.finish();
    var r = !!document.querySelector('.reward'), after = G.logs(), last = after[after.length - 1];
    var out = { reward: r, logged: after.length === before + 1, n: last && last.n, ok: last && last.ok, sticker: G.stickers().count === st0 + 1, noFailText: !/틀렸|실패|땡|X표/.test(document.querySelector('.reward').textContent) };
    document.querySelector('.reward .home').click();
    return out;
  });
  ok(fin.reward, '놀이를 마쳐도 상 화면이 안 나옴');
  ok(fin.logged && fin.n === 2 && fin.ok === 1, '기록이 바르게 남지 않음: ' + JSON.stringify(fin));
  ok(fin.sticker, '스티커가 주어지지 않음');
  ok(fin.noFailText, '아이 상 화면에 실패를 뜻하는 말이 있음');

  /* 오늘의 놀이: 고르기 화면 */
  var pick = await page.evaluate(function () {
    var G = window.G; G.session = { list: G.planToday(), i: 0, start: Date.now(), done: [] };
    var e = G.session.list.filter(function (x) { return typeof x !== 'string'; })[0]; if (!e) return { none: true };
    G.runSlot(e); var n = document.querySelectorAll('#stBody .choice').length; G.session = null; G.home(); return { n: n };
  });
  ok(pick.n === 2, '아이가 고르는 화면에 놀이 두 개가 나오지 않음: ' + JSON.stringify(pick));

  /* 감각 예민 모드에서도 정답 반짝(힌트)이 보이는가 */
  await page.evaluate(function () { var G = window.G; G.settings.calm = true; G.saveSettings(); G.start('listen', { level: 1 }); });
  await page.waitForSelector('#stBody .choice', { timeout: 15000 });
  var calmHint = await page.evaluate(function () {
    var G = window.G;
    var b = document.querySelector('#stBody .choice'); G.ui.hint(b);
    var cs = getComputedStyle(b), r = { shadow: cs.boxShadow, outline: cs.outlineStyle };
    G.settings.calm = false; G.saveSettings(); G.home(); return r;
  });
  ok((calmHint.shadow && calmHint.shadow !== 'none') || calmHint.outline !== 'none', '감각 예민 모드에서 정답 반짝 힌트가 안 보임: ' + JSON.stringify(calmHint));

  /* 힘든 기분이면 오늘 꾸러미를 줄이고 편한 놀이 + 쉬어가기로 */
  var mood = await page.evaluate(function () {
    var G = window.G, keep = localStorage.getItem('grow_logs');
    G.session = { list: G.planToday(), i: 0, start: Date.now(), done: [] };
    var L = G.logs(); L.push({ t: Date.now(), d: G.today(), id: 'checkin', area: 'feel', lv: 1, n: 0, ok: 0, ms: 1000, x: { emo: 'sad' } }); localStorage.setItem('grow_logs', JSON.stringify(L));
    G.nextInSession();
    var s = G.session, flat = []; (s ? s.list : []).forEach(function (e) { flat = flat.concat(typeof e === 'string' ? [e] : e.pick); });
    var out = { len: s && s.list.length, brain: flat.some(function (id) { return G.acts[id] && G.acts[id].area === 'brain'; }), last: s && G.acts[s.list[s.list.length - 1]] && G.acts[s.list[s.list.length - 1]].area,
      saved: !!G.savedSession() };
    G.session = null; G.store.del('sessionSave'); if (keep) localStorage.setItem('grow_logs', keep); else localStorage.removeItem('grow_logs'); G.home();
    return out;
  });
  ok(mood.len && mood.len <= 3 && !mood.brain && mood.last === 'calm', '슬퍼요를 골라도 꾸러미가 그대로임: ' + JSON.stringify(mood));
  ok(mood.saved, '오늘의 놀이를 이어 할 수 있게 저장되지 않음');

  /* ✕ 는 바로 끝내지 않고 묻는다 · 💬 말하기 띠 */
  var ctl = await page.evaluate(function () {
    var G = window.G; G.start('listen', { level: 1 });
    document.getElementById('stX').click(); var ask = !!document.querySelector('.quit-ask'); var still = !!G.cur;
    var k = document.querySelector('.quit-ask .keep'); if (k) k.click();
    document.getElementById('stTalk').click(); var strip = document.querySelectorAll('.talk-strip button').length;
    var st = document.querySelector('.talk-strip'); if (st) st.remove();
    G.home(); return { ask: ask, still: still, strip: strip };
  });
  ok(ctl.ask && ctl.still, '✕ 를 한 번 누르면 바로 끝나 버림');
  ok(ctl.strip === 4, '💬 그만·도와줘·쉬고 싶어·한 번 더 띠가 없음');

  /* 말판: 자주 쓰는 6낱말 고정 줄 */
  var aac = await page.evaluate(function () { var G = window.G; G.start('talkboard'); var n = document.querySelectorAll('#stBody .tb-core .tb-tile').length; G.home(); return n; });
  ok(aac === 6, '말판에 자주 쓰는 말 고정 줄이 없음: ' + aac);

  /* 부모 화면 탭 */
  for (var t of ['home', 'rec', 'diary', 'coach', 'report', 'set']) {
    errs = [];
    await page.evaluate(function (tab) { window.G.openParent(tab); }, t);
    await page.waitForTimeout(400);
    var pw = await page.evaluate(function () { return document.documentElement.scrollWidth > innerWidth + 2; });
    ok(!errs.length, '부모 화면 ' + t + ' 오류: ' + errs.join(' | '));
    ok(!pw, '부모 화면 ' + t + ' 가로로 넘침', true);
    if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'parent-' + t + '.png'), fullPage: true });
  }

  /* 태블릿 가로 화면도 한 번 */
  await page.setViewportSize({ width: 1024, height: 768 });
  errs = [];
  await page.evaluate(function () { window.G.home(); });
  await page.waitForTimeout(300);
  ok(!errs.length, '태블릿 홈 오류: ' + errs.join(' | '));
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'home-tablet.png') });

  await browser.close(); server.close();

  /* ---------- 결과 ---------- */
  var byArea = {}; acts.forEach(function (a) { byArea[a.area] = (byArea[a.area] || []).concat(a.id); });
  console.log('\n🌱 함께 자라요 — 자동 검증');
  console.log('놀이 ' + acts.length + '개 + 도구 ' + (design.acts.length - acts.length) + '개, 단계까지 ' + runs + '번 실행');
  Object.keys(byArea).forEach(function (k) { console.log('  ' + k.padEnd(7) + byArea[k].length + '개: ' + byArea[k].join(', ')); });
  console.log('실행기능 덮기: ' + design.efKeys.map(function (k) { return k + ' ' + (design.ef[k] || 0); }).join(' · '));
  console.log('통과 ' + passes + ' · 주의 ' + warns.length + ' · 실패 ' + fails.length);
  warns.forEach(function (w) { console.log('  ⚠️  ' + w); });
  fails.forEach(function (f) { console.log('  ❌ ' + f); });
  if (SHOTS) console.log('화면 사진: ' + SHOTS);
  process.exit(fails.length ? 1 : 0);
});

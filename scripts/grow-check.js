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
    if (keep) localStorage.setItem('grow_logs', keep); else localStorage.removeItem('grow_logs');
    /* 너그러운 말소리 맞춤 */
    out.sim = { '아과/사과': G.similar('아과', '사과'), '나나/바나나': G.similar('나나', '바나나'), '머머/멍멍': G.similar('머머', '멍멍'),
      '강아지 줘/강아지': G.similar('강아지 줘', '강아지'), '자동차/강아지': G.similar('자동차', '강아지'), '물/우유': G.similar('물', '우유') };
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

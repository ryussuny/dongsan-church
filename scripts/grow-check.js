/* 함께 자라요 — 자동 검증
 *
 *   node scripts/grow-check.js            → 검사만
 *   node scripts/grow-check.js --shots    → 놀이마다 화면 사진도 찍는다 (scripts/grow-shots/, 커밋하지 않음)
 *   node scripts/grow-check.js --only=words,listen → 모든 놀이 돌려 보기를 이 놀이만
 *
 * 두 가지를 본다.
 *  1) 치료 설계 검사 — 놀이마다 목표·함께 하는 법·근거·화면 밖 놀이·실행기능 표시가 있는지,
 *     여섯 가지 생각 힘(실행기능)이 고르게 덮이는지, 오늘의 놀이 꾸러미가 원칙대로 짜이는지
 *     (기분 묻기로 시작 · 생각 힘 하나 · 15분 넘으면 몸놀이 · 쉬어가기로 끝 · 아이가 고르기),
 *     단계 맞추기(단계마다 세 칸 · 한 판 80%↑ 한 칸 올림 · 40%↓ 한 칸 내림 · ctx.tune 보간), 발음이 서툴러도 알아듣는 너그러운 맞춤.
 *  2) 실제로 돌려 보기 — 휴대폰 크기 화면에서 모든 놀이를 모든 단계(1칸·3칸)로 열고, 눌러 보고,
 *     오류가 없는지·가로로 넘치지 않는지 본다. 상 화면·스티커·기록, 부모 화면 탭도 연다.
 *
 * Playwright(크로미움)가 필요하다. 카메라·마이크는 가짜 장치로 대신한다.
 */
var http = require('http'), fs = require('fs'), path = require('path');
var ROOT = path.join(__dirname, '..');
var SHOTS = process.argv.indexOf('--shots') > 0 ? path.join(__dirname, 'grow-shots') : null;
/* --only=words,listen → '모든 놀이 돌려 보기' 를 이 놀이들만 (고치는 중 빨리 볼 때) */
var ONLY = (process.argv.filter(function (a) { return /^--only=/.test(a); })[0] || '').replace('--only=', '').split(',').filter(Boolean);
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
    function setLogs(arr) { localStorage.setItem('grow_logs', JSON.stringify(arr.map(function (x, i) { return { t: i, d: '2026-01-01', id: 'zz', area: 'mind', lv: x[0], st: x[2], n: 10, ok: x[1], ms: 1000 }; }))); }
    function stg(arr) { setLogs(arr); var g = G.stageFor('zz', 3); return g.lv + '-' + g.st; }
    /* 칸: 한 단계에 세 칸. 칸마다 한 판 잘하면(80%) 한 칸, 단계 넘을 때만 85% */
    out.level.step1 = stg([[1, 9, 1]]);                          /* → 1-2 */
    out.level.step80 = stg([[1, 8, 1]]);                         /* 80% → 1-2 */
    out.level.edge80 = stg([[1, 8, 3]]);                         /* 단계 넘는 칸은 80% 로는 안 됨 → 1-3 */
    out.level.edge90 = stg([[1, 9, 3]]);                         /* → 2-1 */
    out.level.softDown = stg([[2, 3, 2]]);                       /* 30% → 한 칸만 내림 2-1 (단계째 내리지 않음) */
    out.level.okStay = stg([[2, 7, 2]]);                         /* 70% → 2-2 그대로 */
    out.level.top = stg([[3, 10, 3]]);                           /* 끝 칸 3-3 넘지 않음 */
    out.level.oldLog = stg([[2, 9]]);                            /* 칸이 없던 옛 기록은 1칸으로 본다 → 2-2 */
    G.profile.level = { zz: 2 };
    out.level.fixUp = stg([[1, 10, 3]]);                         /* 부모가 2단계로 고정 → 2-1 */
    out.level.fixCap = stg([[2, 10, 3]]);                        /* 고정된 단계 밖(3단계)으로 안 나감 → 2-3 */
    G.profile.level = {};
    out.tune = [G.tune([2200, 1600, 1150], 1, 1), G.tune([2200, 1600, 1150], 1, 2), G.tune([2200, 1600, 1150], 1, 3), G.tune([2200, 1600, 1150], 2, 1), G.tune([2200, 1600, 1150], 3, 3),
      G.tune([3, 5, 8], 1, 2), G.tune([3, 5, 8], 3, 3), G.tune([0.085, 0.068, 0.052], 1, 1), G.tune(['a', 'b', 'c'], 2, 3)];
    setLogs([[1, 9, 1], [1, 10, 2], [1, 9, 3]]); out.level.up = G.levelFor('zz', 3);
    setLogs([[2, 3], [2, 4], [2, 5]]); out.level.down = G.levelFor('zz', 3);
    setLogs([[2, 7], [2, 7], [2, 7]]); out.level.stay = G.levelFor('zz', 3);
    setLogs([[3, 10], [3, 10], [3, 10]]); out.level.cap = G.levelFor('zz', 3);
    setLogs([]); out.level.first = G.levelFor('zz', 3);
    /* 검토에서 나온 경우: 다른 단계 기록을 섞지 않는다 */
    setLogs([[1, 10], [1, 10], [2, 6]]); out.level.mixUp = G.levelFor('zz', 3);       /* 2단계 한 판(60%) → 2 그대로 (3으로 뛰지 않음) */
    setLogs([[1, 10], [2, 6], [3, 3]]); out.level.mixDown = G.levelFor('zz', 3);     /* 3단계 30% → 2로 내림 */
    var qa = [[1, 9, 1], [1, 9, 2], [1, 9, 3]].map(function (x, i) { return { t: i, d: '2026-01-01', id: 'zz', area: 'mind', lv: x[0], st: x[2], n: 10, ok: x[1], ms: 1000 }; });
    qa.push({ t: 9, d: '2026-01-01', id: 'zz', area: 'mind', lv: 2, n: 1, ok: 0, ms: 500, x: { quit: 1 } });
    localStorage.setItem('grow_logs', JSON.stringify(qa)); out.level.quitIgnored = G.levelFor('zz', 3);   /* 그만둔 판은 무시 → 1단계 세 칸을 90% 로 → 2 */
    if (G.acts.daynight) { localStorage.setItem('grow_logs', JSON.stringify([{ t: 1, d: '2026-01-01', id: 'daynight', area: 'brain', lv: 1, n: 10, ok: 10, ms: 1000 }])); out.level.warm = G.levelFor('daynight', 3); }
    if (keep) localStorage.setItem('grow_logs', keep); else localStorage.removeItem('grow_logs');
    /* 너그러운 말소리 맞춤 */
    /* 고운 말·표준말 */
    var K = G.kind, kc = function (t) { var c = K.check(t); return { good: c.good.map(function (g) { return g.g; }), std: c.std.map(function (x) { return x.from; }), rough: c.rough.map(function (x) { return x.key; }), fixed: c.fixed }; };
    out.kind = K ? {
      thanks: kc('고마워'), hello: kc('선생님 안녕하세요'), slang: kc('대박'), gae: kc('이거 개좋아'), name: kc('짱구 보고 싶어'), fool: kc('바보야'),
      noisy: kc('시끄러워'), hit: kc('친구가 때렸어'), dislike: kc('싫어'), bug: kc('벌레가 죽어 있어'), feel: kc('나 속상해'),
      polish: K.polish('우와 대박! 이 로봇 짱이야. 개멋져!'), mask: K.mask('씨발 싫어'),
      foolReply: (K.reply(K.check('바보야')) || {}).say || '', swearReply: (K.reply(K.check('씨발')) || {}).say || '', slangReply: (K.reply(K.check('대박')) || {}).say || ''
    } : null;
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
  ok(design.level.up === 2, '잘하면(90%) 세 칸을 지나 단계가 오르지 않음: ' + design.level.up);
  ok(design.level.step1 === '1-2' && design.level.step80 === '1-2', '한 판 잘해도(80%↑) 한 칸이 오르지 않음: ' + design.level.step1 + ' ' + design.level.step80);
  ok(design.level.edge80 === '1-3' && design.level.edge90 === '2-1', '단계를 넘는 칸은 85% 여야 함: ' + design.level.edge80 + ' ' + design.level.edge90);
  ok(design.level.softDown === '2-1', '힘들면 한 칸만 내려와야 함(단계째 아님): ' + design.level.softDown);
  ok(design.level.okStay === '2-2', '보통(70%)이면 칸 유지: ' + design.level.okStay);
  ok(design.level.top === '3-3', '끝 칸(3-3)을 넘어감: ' + design.level.top);
  ok(design.level.oldLog === '2-2', '칸이 없던 옛 기록을 1칸으로 보지 않음: ' + design.level.oldLog);
  ok(design.level.fixUp === '2-1' && design.level.fixCap === '2-3', '부모가 정한 단계 밖으로 칸이 움직임: ' + design.level.fixUp + ' ' + design.level.fixCap);
  ok(JSON.stringify(design.tune) === JSON.stringify([2200, 2000, 1800, 1600, 1000, 4, 9, 0.085, 'b']), 'ctx.tune 칸 보간이 이상함: ' + JSON.stringify(design.tune));
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
  var KD = design.kind;
  ok(!!KD, '고운 말 엔진(G.kind)이 없음');
  if (KD) {
    ok(KD.thanks.good[0] === 'thanks' && KD.hello.good[0] === 'hello' && KD.feel.good[0] === 'feel', '고운 말(고마워·인사·마음 말하기)을 알아채지 못함: ' + JSON.stringify([KD.thanks, KD.hello, KD.feel]));
    ok(KD.slang.std[0] === '대박' && KD.slang.fixed === '정말 멋지다' && KD.gae.fixed === '이거 정말 좋아', '유행어를 표준말로 바꾸지 못함: ' + JSON.stringify([KD.slang, KD.gae]));
    ok(!KD.name.std.length, '이름(짱구)을 유행어로 잘못 봄');
    ok(KD.fool.rough[0] === '바보' && /나 속상해/.test(KD.foolReply) && !/바보/.test(KD.foolReply), '거친 말에 마음 읽기·대신 쓸 말을 주지 않거나 거친 말을 따라 함: ' + KD.foolReply);
    ok(!KD.noisy.rough.length && !KD.hit.rough.length && !KD.dislike.rough.length && !KD.bug.rough.length, '느낌 말·겪은 일(시끄러워·때렸어·싫어·죽어 있어)을 거친 말로 봄: ' + JSON.stringify([KD.noisy, KD.hit, KD.dislike, KD.bug]));
    ok(!/대박|짱|개멋/.test(KD.polish), '자비스 말에 유행어가 남음: ' + KD.polish);
    ok(KD.mask.indexOf('씨발') < 0 && !/씨발/.test(KD.swearReply), '욕설을 AI 로 보내거나 따라 말함: ' + KD.mask + ' / ' + KD.swearReply);
    ok(/틀렸/.test(KD.slangReply + KD.foolReply + KD.swearReply) === false, '고운 말 대답에 "틀렸어"가 있음');
  }
  ok(!design.churchKeySilent, '교회 관리자 앱 키를 부모 동의 없이 가져다 씀');

  /* ---------- 2) 모든 놀이를 모든 단계로 돌려 보기 ---------- */
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  var runs = 0;
  for (var i = 0; i < design.acts.length; i++) {
    var a = design.acts[i];
    if (ONLY.length && ONLY.indexOf(a.id) < 0) continue;
    /* 단계마다 1칸(그 단계 그대로)과 3칸(다음 단계 쪽으로 가장 다가간 칸)을 돌린다 */
    for (var sv = 0; sv < (a.levels || 1) * ((a.levels || 1) > 1 ? 2 : 1); sv++) {
      var lv = (a.levels || 1) > 1 ? Math.floor(sv / 2) + 1 : 1, stp = (a.levels || 1) > 1 && sv % 2 ? 3 : 1, LB = lv + '-' + stp + '칸';
      errs = [];
      await page.evaluate(function (x) { window.G.start(x.id, { level: x.lv, step: x.st }); }, { id: a.id, lv: lv, st: stp });
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
      ok(st.kids > 0, a.id + ' ' + LB + ': 화면이 비어 있음');
      ok(!st.wide, a.id + ' ' + LB + ': 화면이 가로로 넘침', true);
      ok(!errs.length, a.id + ' ' + LB + ' 오류: ' + errs.join(' | '));
      if (SHOTS && lv === 1 && stp === 1) await page.screenshot({ path: path.join(SHOTS, a.area + '-' + a.id + '.png') });
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

  /* 칸이 오르면 상 화면에 '한 칸 올라갔어' — 내려갈 때는 아무 말 없음(무오류) */
  var upT = await page.evaluate(function () {
    var G = window.G, keep = localStorage.getItem('grow_logs'), id = G.acts.listen ? 'listen' : 'words', out = {};
    localStorage.setItem('grow_logs', '[]');
    G.start(id, { level: 1, step: 1 }); for (var i = 0; i < 9; i++) G.cur.trial(true); G.cur.trial(false); G.cur.finish();
    var u = document.querySelector('.reward .rw-up'); out.up = u ? u.textContent : ''; out.title = '';
    document.querySelector('.reward .home').click();
    G.start(id); out.title = (document.querySelector('#stLv .lv-st') || {}).textContent || ''; out.step = G.cur.step;
    G.cur.trial(false); G.cur.trial(false); G.cur.trial(false); G.cur.finish();
    out.downShown = !!document.querySelector('.reward .rw-up'); out.after = G.stageFor(id).fine;
    document.querySelector('.reward .home').click();
    if (keep) localStorage.setItem('grow_logs', keep); else localStorage.removeItem('grow_logs');
    return out;
  });
  ok(/한 칸 올라갔어/.test(upT.up), '잘한 판 뒤 상 화면에 칸 오름이 안 보임: ' + JSON.stringify(upT));
  ok(upT.step === 2 && upT.title === '●●○', '다음 판이 1-2칸으로 시작하지 않음(머리말 ●●○): ' + JSON.stringify(upT));
  ok(!upT.downShown && upT.after === 1, '힘든 판 뒤 조용히 한 칸 내려가야 함: ' + JSON.stringify(upT));

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

  /* 초등학생(10살) 맞춤: 형 말투·히어로 미션·로봇 부품·남자 목소리 고르기·8살 넘으면 2단계부터 */
  var hero = await page.evaluate(function () {
    var G = window.G, D = window.GD, keep = JSON.stringify(G.profile);
    G.profile.birth = '2016-03'; G.profile.style = 'auto';
    var r = { older: G.older(), praiseHero: D.PRAISE_HERO.every(function (t) { return D.PRAISE.indexOf(t) >= 0; }) && D.PRAISE_SOLDIER.every(function (t) { return D.PRAISE.indexOf(t) >= 0; }) && D.PRAISE.indexOf(D.PRAISE_LITTLE[0]) < 0,
      brother: (function () { var v = G.settings.vstyle; G.settings.vstyle = 'brother'; var ok = D.PRAISE === D.PRAISE_HERO; G.settings.vstyle = v; return ok; })(), vstyle: G.settings.vstyle, pitch: G.settings.pitch, startLv: G.acts.match ? G.levelFor('match', 3) : 2, speechLv: G.acts.words ? G.levelFor('words', 3) : 1 };
    G.profile.birth = '2022-03'; r.youngLittle = !G.older() && D.PRAISE === D.PRAISE_LITTLE;
    G.profile = Object.assign(G.profile, JSON.parse(keep));
    /* 남자 목소리 고르기 */
    var fake = [{ name: 'Google 한국의', lang: 'ko-KR', voiceURI: 'Google 한국의' }, { name: 'ko-kr-x-kod-local', lang: 'ko-KR', voiceURI: 'ko-kr-x-kod-local' }, { name: 'Yuna', lang: 'ko-KR', voiceURI: 'Yuna' }];
    r.maleFirst = fake.slice().sort(function (a, b) { return G.voice.score(b) - G.voice.score(a); })[0].name;
    r.samsungMale = G.voice.isMale({ name: 'ko-KR-SMTm00', voiceURI: 'ko-KR-SMTm00' }) && !G.voice.isMale({ name: 'ko-KR-SMTf00', voiceURI: 'x' });
    /* 그림·로봇 부품 */
    r.ga = !!(window.GA && GA.robot && window.GR && GR.ROBOTS.length >= 12 && GR.ROBOTS.every(function (x) { return x.name && x.type && x.alt && x.parts.length === 6; }));
    r.names = window.GR ? GR.ROBOTS.length : 0;
    /* 계급: 로봇 0대 훈련생, 3대 정예 대원 */
    r.rank0 = window.GR && GR.rank(0).cur.name === '훈련생'; r.rank3 = window.GR && GR.rank(3).cur.name === '정예 대원';
    var p18 = G.rewardPart ? G.rewardPart(18) : null; r.rankUp = !!(p18 && p18.complete && p18.rankUp && p18.rankUp.name === '정예 대원');
    r.jvHero = /<svg|<img[^>]+jarvis/.test(G.jarvisSVG('full'));   /* 실사 자비스(그림) 또는 벡터 */
    var p6 = G.rewardPart ? G.rewardPart(6) : null, p7 = G.rewardPart ? G.rewardPart(7) : null;
    r.part6 = p6 && p6.complete && p6.owned === 6; r.part7 = p7 && !p7.complete && p7.owned === 1 && p7.robot.name !== (p6 && p6.robot.name);
    return r;
  });
  ok(hero.older && hero.praiseHero && hero.brother, '10살 아이에게 군인 대원 말투·히어로 칭찬(형 목소리면 형 말투)이 나오지 않음: ' + JSON.stringify(hero));
  ok(hero.vstyle === 'soldier' && hero.pitch === 0.8, '자비스 기본 목소리가 군인 목소리(낮은 높이 0.8)가 아님: ' + JSON.stringify(hero));
  ok(hero.youngLittle, '어린아이에게는 다정한 말투로 돌아가야 함');
  ok(hero.startLv === 2 && hero.speechLv === 1, '8살 넘은 아이의 처음 단계(말하기 1·나머지 2)가 맞지 않음: ' + JSON.stringify(hero));
  ok(hero.maleFirst === 'ko-kr-x-kod-local' && hero.samsungMale, '남자 목소리를 먼저 고르지 않음: ' + JSON.stringify(hero));
  ok(hero.ga && hero.jvHero, '로봇 군단(이름·종류·변신·부품 6개)이나 자비스 그림을 불러오지 못함: ' + JSON.stringify(hero));
  ok(hero.rank0 && hero.rank3 && hero.rankUp, '계급(훈련생→정예 대원)이나 계급 업 알림이 맞지 않음: ' + JSON.stringify(hero));
  ok(hero.part6 && hero.part7, '로봇 부품 모으기가 맞지 않음(6번째=완성, 7번째=다음 로봇 첫 부품): ' + JSON.stringify(hero));
  var hg = await page.evaluate(function () { document.querySelector('[data-go="book"]').click(); var n = document.querySelectorAll('#hangar .hg-card').length, now = !!document.querySelector('#hangar .hg-now .plist'), rk = !!document.querySelector('#hangar .hg-rank'); window.G.home(); return { n: n, now: now, rk: rk }; });
  ok(hg.n === hero.names && hg.now && hg.rk, '로봇 격납고(계급·조립 중·전체 로봇)가 바르게 나오지 않음: ' + JSON.stringify(hg));
  /* ⚡ 에너지로 부품 만들기 — 놀이를 마치기만 해도 부품이 나오지 않게 */
  var econ = await page.evaluate(function () {
    var G = window.G, R = window.GR, keep = {}, keys = ['grow_logs', 'grow_parts', 'grow_energy', 'grow_stickers', 'grow_settings'];
    keys.forEach(function (k) { keep[k] = localStorage.getItem(k); });
    function reset(parts) { localStorage.setItem('grow_logs', '[]'); localStorage.removeItem('grow_energy'); if (parts == null) localStorage.removeItem('grow_parts'); else localStorage.setItem('grow_parts', JSON.stringify(parts)); }
    function log(id, lv) { var L = G.logs(); L.push({ t: Date.now(), d: G.today(), id: id, area: (G.acts[id] || {}).area, lv: lv || 1, st: 1, n: 10, ok: 9, ms: 30000 }); localStorage.setItem('grow_logs', JSON.stringify(L)); }
    var out = {};
    /* 옛 기록 옮기기: 스티커 80개 → 부품 78개(13대)까지 */
    reset(null); localStorage.setItem('grow_stickers', JSON.stringify({ have: [], count: 80, stars: 0 })); out.migr = R.count();
    /* 처음 로봇: 부품 값 ⚡3 */
    reset(0); log('listen', 2);
    var a = G.earnEnergy({ id: 'listen', n: 10, ok: 9, level: 2, up: '' }); out.a = { gain: a.gain, made: a.made.length, e: R.energy().e, cost: a.next.cost };
    log('listen', 2); var b = G.earnEnergy({ id: 'listen', n: 10, ok: 9, level: 2, up: 'step' }); out.b = { gain: b.gain, made: b.made.length, parts: R.count() };
    log('listen', 2); var c = G.earnEnergy({ id: 'listen', n: 10, ok: 9, level: 2, up: '' }); out.c = { gain: c.gain, same: c.same };
    var en = R.energy(); en.today = 15; localStorage.setItem('grow_energy', JSON.stringify(en));
    log('words', 2); var d = G.earnEnergy({ id: 'words', n: 10, ok: 10, level: 2, up: 'level' }); out.d = { gain: d.gain, capped: d.capped };
    /* 1년 여정 1장의 로봇(피닉스)은 바로 열리고, 2장의 로봇(썬더)은 2장에 가야 열린다 */
    var keepJ = localStorage.getItem('grow_journey'), keepB = localStorage.getItem('grow_badges'), keepU = localStorage.getItem('grow_robotUp');
    localStorage.removeItem('grow_journey');
    reset(78); log('listen', 1);
    var e = G.earnEnergy({ id: 'listen', n: 10, ok: 9, level: 1, up: 'level' }); out.e = { made: e.made.length, locked: !!e.locked, robot: R.ROBOTS[Math.floor(R.count() / 6)].id, cost: e.next.cost };
    reset(90); var en2 = R.energy(); en2.e = 50; localStorage.setItem('grow_energy', JSON.stringify(en2));   /* 피닉스·팰컨(1장) 완성 → 다음은 썬더(2장) */
    log('words', 2); var f = G.earnEnergy({ id: 'words', n: 10, ok: 9, level: 2, up: '' });
    out.f = { locked: !!f.locked, chapter: f.locked && f.locked.chapter, robot: R.nextInfo().robot.id, e: R.energy().e };
    /* 남는 에너지로 강화 ★ (완성한 로봇만) */
    localStorage.setItem('grow_robotUp', '{}');
    var u1 = R.upgrade(0), u2 = R.upgrade(0); out.up = { s1: u1 && u1.stars, s2: u2 && u2.stars, e: R.energy().e, notDone: R.upgrade(15) };
    /* 1년 여정: 미션 날 → 장 넘기기 (날 + 단계 열쇠) */
    localStorage.removeItem('grow_journey'); localStorage.setItem('grow_badges', '[]');
    var JJ = G.journey, j0 = JJ.state();
    out.jr = { ch: j0.ch, need: j0.need, total: JJ.TOTAL_DAYS, chapters: JJ.CHAPTERS.length, imgs: JJ.CHAPTERS.every(function (c) { return /journey\/ch\d+\.jpg$/.test(c.img); }) };
    localStorage.setItem('grow_logs', '[]'); ['listen', 'words', 'sounds'].forEach(function (id) { log(id, 1); });
    var cd = JJ.checkDay(); out.jr.day = cd && cd.day && cd.day.n; out.jr.again = JJ.checkDay();
    var jd = JSON.parse(localStorage.getItem('grow_journey')); jd.days = []; for (var k = 0; k < 30; k++) jd.days.push({ d: '2026-01-' + (k < 9 ? '0' : '') + (k + 1), s: 1 }); localStorage.setItem('grow_journey', JSON.stringify(jd));
    out.jr.noKey = !JJ.tryAdvance() || JJ.state().ch === 1;
    ['listen', 'words', 'sounds', 'follow', 'pop', 'trace', 'dots', 'simon'].forEach(function (id) { log(id, 2); });
    var adv = JJ.tryAdvance(); out.jr.adv = adv && adv.chapter && adv.chapter.n; out.jr.chNow = JJ.state().ch; out.jr.badge = G.badges.has('ch:1');
    out.jr.thunderOpen = R.gateFor(R.ROBOTS.map(function (r) { return r.id; }).indexOf('thunder')).ok;
    /* 내 기록 */
    localStorage.setItem('grow_records', '{}');
    var fake = { id: 'quick', def: G.acts.quick || { title: 'x' }, level: 2, step: 1, extra: { score: 5 } };
    out.rec = { first: G.records.update(fake) };
    fake.extra.score = 9; out.rec.better = G.records.update(fake); fake.extra.score = 3; out.rec.worse = G.records.update(fake);
    /* 5대 인지 영역 */
    var dst = G.domainStats(30); out.dom = Object.keys(dst).length === 5 && Object.keys(G.DOMAINS).every(function (k) { return dst[k].games > 0; });
    out.vids = R.ROBOTS.filter(function (r) { return r.video; }).length;
    /* 🔗 합체: 시즌마다 하나, 시즌 로봇을 다 모으면 열리고, 오메가 카이저는 1·2군단 합체 뒤에 */
    var keepC = localStorage.getItem('grow_combos'); localStorage.setItem('grow_combos', '{}'); localStorage.setItem('grow_badges', '[]');
    out.cb = { n: R.COMBINERS.length, seasons: R.COMBINERS.map(function (c) { return c.season; }).join(','), files: R.COMBINERS.every(function (c) { return c.img && c.team && c.video && c.members.length >= (c.needs ? 1 : 3); }),
      allSeasons: R.SEASONS.every(function (se) { return !!R.comboOf(se.id); }) };
    reset(78);
    out.cb.ready78 = R.readyCombos().map(function (c) { return c.id; }).join(',');
    out.cb.omegaFirst = R.combine('omegakaiser');
    out.cb.g = !!R.combine('grandmax'); out.cb.a = !!R.combine('atlas'); out.cb.again = R.combine('grandmax');
    out.cb.omegaReady = R.comboState(R.comboById('omegakaiser')).ready; var ok3 = R.combine('omegakaiser'); out.cb.o = !!ok3 && ok3.count;
    out.cb.badge = G.badges.has('combo:grandmax') && G.badges.has('combo:omegakaiser');
    out.cb.tempestLocked = !R.comboState(R.comboById('tempest')).ready && R.comboState(R.comboById('tempest')).have === 0;
    reset(96); var rp = G.rewardPart(96); out.cb.reward = rp && rp.complete && rp.combo && rp.combo.id;
    out.cb.ready96 = R.readyCombos().map(function (c) { return c.id; }).join(',');
    if (keepC == null) localStorage.removeItem('grow_combos'); else localStorage.setItem('grow_combos', keepC);
    out.cbFiles = R.COMBINERS.map(function (c) { return [c.img, c.team, c.video]; }).reduce(function (a, b) { return a.concat(b); }, [])
      .concat(R.ROBOTS.map(function (r) { return r.img; }).filter(Boolean)).concat(R.ROBOTS.map(function (r) { return r.video; }).filter(Boolean));
    if (keepJ == null) localStorage.removeItem('grow_journey'); else localStorage.setItem('grow_journey', keepJ);
    if (keepB == null) localStorage.removeItem('grow_badges'); else localStorage.setItem('grow_badges', keepB);
    if (keepU == null) localStorage.removeItem('grow_robotUp'); else localStorage.setItem('grow_robotUp', keepU);
    G.settings.partPace = 'slow'; out.slow = R.costOf(13, 0); G.settings.partPace = 'normal';
    out.robots = R.ROBOTS.length; out.imgs = R.ROBOTS.filter(function (r) { return r.img; }).length;
    out.final = R.ROBOTS[R.ROBOTS.length - 1]; out.final = { id: out.final.id, season: out.final.season, verse: !!out.final.verse, parts: out.final.parts.length };
    out.ranks = R.RANKS[R.RANKS.length - 1].n;
    /* 상 화면: 부품이 없으면 ⚡ 에너지 상자 */
    reset(0); G.start('listen', { level: 1, step: 1 }); G.cur.trial(true); G.cur.trial(false); G.cur.trial(true); G.cur.finish();   /* 67% → 완주 ⚡1 뿐 */
    var rw = document.querySelector('.reward'); out.rw = { en: !!rw.querySelector('.rw-en'), part: !!rw.querySelector('.rw-part'), txt: rw.textContent.replace(/\s+/g, ' ').slice(0, 200) };
    rw.querySelector('.home').click();
    keys.forEach(function (k) { if (keep[k] == null) localStorage.removeItem(k); else localStorage.setItem(k, keep[k]); });
    return out;
  });
  ok(econ.migr === 78, '옛 부품(스티커 수)을 옮기지 못함: ' + econ.migr);
  ok(econ.a.gain === 2 && econ.a.made === 0 && econ.a.e === 2 && econ.a.cost === 3, '한 판(완주+정확)에 부품이 바로 나오면 안 됨(⚡2, 부품 값 3): ' + JSON.stringify(econ.a));
  ok(econ.b.gain === 4 && econ.b.made === 2 && econ.b.parts === 2, '칸 오름 에너지로 부품이 만들어지지 않음: ' + JSON.stringify(econ.b));
  ok(econ.c.gain === 0 && econ.c.same, '같은 놀이 세 번째에도 에너지가 나옴: ' + JSON.stringify(econ.c));
  ok(econ.d.gain === 1 && econ.d.capped, '하루 최대 에너지(16)를 넘음: ' + JSON.stringify(econ.d));
  ok(!econ.e.locked && econ.e.robot === 'phoenix' && econ.e.cost === 6, '1년 여정 1장 로봇(피닉스)이 열리지 않음(부품 값 6): ' + JSON.stringify(econ.e));
  ok(econ.f.locked && econ.f.chapter === 2 && econ.f.robot === 'thunder' && econ.f.e > 6, '2장 로봇(썬더)이 1장에서 열리거나 남는 에너지가 사라짐: ' + JSON.stringify(econ.f));
  ok(econ.up.s1 === 1 && econ.up.s2 === 2 && econ.up.notDone === null, '로봇 강화(★)가 바르게 안 됨: ' + JSON.stringify(econ.up));
  ok(econ.jr.ch === 1 && econ.jr.chapters === 10 && econ.jr.total >= 360 && econ.jr.imgs, '1년 여정(10장·360일·장 그림)이 맞지 않음: ' + JSON.stringify(econ.jr));
  ok(econ.jr.day === 1 && econ.jr.again === null, '놀이 세 가지를 마친 날이 미션 도장 하루로 안 찍히거나 두 번 찍힘: ' + JSON.stringify(econ.jr));
  ok(econ.jr.noKey && econ.jr.adv === 2 && econ.jr.chNow === 2 && econ.jr.badge && econ.jr.thunderOpen, '날 + 단계 열쇠로 다음 장이 열리지 않음(또는 열쇠 없이 열림): ' + JSON.stringify(econ.jr));
  ok(econ.rec.first === null && econ.rec.better && econ.rec.better.score === 9 && econ.rec.worse === null, '내 기록(최고 점수)이 맞지 않음: ' + JSON.stringify(econ.rec));
  ok(econ.dom, '5대 인지 영역에 놀이가 없는 영역이 있음');
  ok(econ.vids === 21, '변신 영상이 시즌 4~10 로봇 21대에 다 붙지 않음: ' + econ.vids);
  ok(econ.cb.n === 10 && econ.cb.seasons === '1,2,3,4,5,6,7,8,9,10' && econ.cb.files && econ.cb.allSeasons, '합체 로봇(시즌마다 하나·그림·팀 사진·영상)이 맞지 않음: ' + JSON.stringify(econ.cb));
  ok(econ.cb.ready78 === 'grandmax,atlas' && econ.cb.omegaFirst === null && econ.cb.g && econ.cb.a && econ.cb.again === null, '시즌 1·2 합체가 열리지 않거나 오메가 카이저가 먼저 열림: ' + JSON.stringify(econ.cb));
  ok(econ.cb.omegaReady && econ.cb.o === 3 && econ.cb.badge && econ.cb.tempestLocked, '오메가 카이저(3단 합체)·합체 상장이 맞지 않음: ' + JSON.stringify(econ.cb));
  ok(econ.cb.reward === 'tempest' && /tempest/.test(econ.cb.ready96), '시즌 4 로봇을 다 모아도 합체 알림이 안 나옴: ' + JSON.stringify(econ.cb));
  var missing = econ.cbFiles.filter(function (f) { return !fs.existsSync(path.join(ROOT, f)); });
  ok(!missing.length, '로봇·합체 그림/영상 파일이 없음: ' + missing.join(', '));
  ok(econ.slow === 9, '부품 속도 「천천히」가 반영되지 않음: ' + econ.slow);
  ok(econ.robots === 34 && econ.imgs === 34 && econ.final.id === 'arclight' && econ.final.season === 10 && econ.final.verse && econ.final.parts === 6 && econ.ranks === 34, '로봇 군단(시즌 10·34대·실사 그림·최종 전설)이 맞지 않음: ' + JSON.stringify(econ));
  ok(econ.rw.en && !econ.rw.part && /⚡/.test(econ.rw.txt), '상 화면에 에너지가 보이지 않거나 부품이 바로 나옴: ' + JSON.stringify(econ.rw));
  /* 🔗 격납고 합체 카드 · 합체 의식(눌러서 합체 → 3·2·1 → 영상 → 합체 로봇) */
  var cer = await page.evaluate(async function () {
    var G = window.G, R = window.GR, keepP = localStorage.getItem('grow_parts'), keepC = localStorage.getItem('grow_combos'), keepB = localStorage.getItem('grow_badges');
    localStorage.setItem('grow_parts', '78'); localStorage.setItem('grow_combos', '{}');
    G.openHangar();
    var out = { cards: document.querySelectorAll('#hangar .hg-combo').length, ready: document.querySelectorAll('#hangar .hg-combo.ready').length, lock: document.querySelectorAll('#hangar .hg-combo.lock').length, ban: !!document.querySelector('#hangar .hg-cbban') };
    G.comboCeremony('grandmax'); out.team = !!document.querySelector('.cb-cer .cb-team'); out.shout = (document.querySelector('.cb-cer .cb-shout') || {}).textContent || '';
    document.querySelector('.cb-cer .cb-tap').click();
    for (var k = 0; k < 60 && !R.combined('grandmax'); k++) await new Promise(function (r) { setTimeout(r, 500); });
    out.done = R.combined('grandmax'); out.img = !!document.querySelector('.cb-cer .cb-stage img.cb-flash');
    var x = document.querySelector('.cb-cer .cb-x'); out.btn = x && x.textContent; if (x) x.click();
    out.after = document.querySelectorAll('#hangar .hg-combo.done').length;
    [['grow_parts', keepP], ['grow_combos', keepC], ['grow_badges', keepB]].forEach(function (kv) { if (kv[1] == null) localStorage.removeItem(kv[0]); else localStorage.setItem(kv[0], kv[1]); });
    G.home(); return out;
  });
  ok(cer.cards === 10 && cer.ready === 2 && cer.lock === 8 && cer.ban, '격납고 합체 카드(10개 · 준비 2 · 잠김 8 · 합체 준비 띠)가 맞지 않음: ' + JSON.stringify(cer));
  ok(cer.team && /그랜드 맥스, 합체!/.test(cer.shout) && cer.done && cer.img && cer.btn === '격납고로' && cer.after === 1, '합체 의식(팀 사진 → 합체 → 합체 로봇)이 끝까지 안 됨: ' + JSON.stringify(cer));


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

  /* ---------- 말소리 연구실: 패턴 분석 · 아이 말소리 사전 ---------- */
  var sl = await page.evaluate(function () {
    var SL = window.G.SL; if (!SL) return { none: true };
    var P = function (t, h) { return SL.analyzePair(t, h).join(','); };
    var r = { stop: P('사과', '다과'), front: P('고기', '도기'), syll: P('바나나', '나나'), fin: P('물', '무'), deasp: P('토끼', '도끼'), liquid: P('라면', '아면'), vowel: P('오리', '우리'), junk: P('자동차', '강아지'), junk2: P('강아지', '아과') };
    var keep = localStorage.getItem('grow_pronDict');
    SL.last = { id: 'x', t: Date.now(), target: '사과', heard: '아가', ok: false }; SL.judge(true);
    r.learned = SL.accepts('사과', ['아가']) && !SL.accepts('사과', ['바나나']);
    if (keep) localStorage.setItem('grow_pronDict', keep); else localStorage.removeItem('grow_pronDict');
    var E = [{ t: Date.now(), d: 'x', act: 'words', target: '사과', heard: '아과', ok: true }, { t: Date.now(), d: 'x', act: 'words', target: '사과', heard: '다과', ok: false },
      { t: Date.now(), d: 'x', act: 'words', target: '사과', heard: '', ok: false }, { t: Date.now(), d: 'x', act: 'chat', target: '', heard: '빨간 자동차 좋아', ok: false }];
    var a = SL.analyze(E, 30); r.mlu = a.mlu; r.ndw = a.ndw; r.hard = a.hard.map(function (h) { return h.w; }).join(',');
    return r;
  });
  ok(!sl.none, '말소리 연구실(speech-lab.js)을 불러오지 못함');
  ok(sl.stop === 'stop' && sl.front === 'front' && sl.syll === 'syll' && sl.fin === 'final' && sl.deasp === 'deasp' && sl.liquid === 'liquid' && sl.vowel === 'vowel' && sl.junk === '' && sl.junk2 === '', '말소리 패턴 분석이 틀림: ' + JSON.stringify(sl));
  ok(sl.learned, '부모가 👍 한 발음을 아이 말소리 사전이 배우지 못함');
  ok(sl.hard === '사과' && sl.ndw >= 4 && sl.mlu > 1, '말소리 요약(어려운 낱말·다른 낱말 수·문장 길이)이 틀림: ' + JSON.stringify(sl));

  /* 자동 녹음: 가짜 음성 인식 + 가짜 마이크로 실제 흐름을 돌려 본다 */
  var p2 = await ctx.newPage(); var errs2 = [];
  p2.on('pageerror', function (e) { errs2.push(e.message); });
  await p2.addInitScript(function () {
    function FakeSR() {}
    FakeSR.prototype.start = function () { var me = this; setTimeout(function () { var res = [{ transcript: '아과' }]; res.isFinal = true; if (me.onresult) me.onresult({ results: [res] }); if (me.onend) me.onend(); }, 700); };
    FakeSR.prototype.abort = function () {}; FakeSR.prototype.stop = function () {};
    window.SpeechRecognition = FakeSR;
  });
  await p2.goto(base); await p2.waitForTimeout(500);
  var rec = await p2.evaluate(function () {
    var G = window.G;
    return G.listen({ expect: ['사과'] }).then(function (r) {
      return new Promise(function (ok) { setTimeout(function () { G.SL.all().then(function (all) { var e = all[all.length - 1] || {}; ok({ heard: r.text, n: all.length, target: e.target, logged: e.heard, audio: !!e.audio, latency: e.latency }); }); }, 1800); });
    });
  });
  ok(rec.n >= 1 && rec.target === '사과' && rec.logged === '아과', '아이가 한 말이 자동으로 기록되지 않음: ' + JSON.stringify(rec));
  ok(rec.audio, '소리 녹음이 함께 저장되지 않음(가짜 마이크 기준): ' + JSON.stringify(rec), true);
  await p2.evaluate(function () { window.G.openParent('speech'); }); await p2.waitForTimeout(800);
  var tabOk = await p2.evaluate(function () { return document.querySelectorAll('#pBody .note[data-sid]').length; });
  ok(tabOk >= 1, '부모 화면 「말소리」 탭에 녹음 목록이 나오지 않음');
  var kwTab = await p2.evaluate(function () {
    var G = window.G; G.kind.note('고마워', []); G.kind.note('대박', []); G.openParent('speech');
    return new Promise(function (ok) { setTimeout(function () { var b = document.getElementById('pBody'); ok({ card: !!document.getElementById('kwAI'), std: /정말 멋지다/.test(b.textContent), good: /고마워요/.test(b.textContent), tips: /고쳐 말해 주기/.test(b.textContent) }); }, 900); });
  });
  ok(kwTab.card && kwTab.std && kwTab.good && kwTab.tips, '부모 화면 「🌷 고운 말·표준말」 카드가 제대로 나오지 않음: ' + JSON.stringify(kwTab));
  var zipBytes = await p2.evaluate(function () { return window.G.SL.exportData().then(function (b) { return b.arrayBuffer(); }).then(function (buf) { return Array.from(new Uint8Array(buf)); }); });
  var zpath = path.join(require('os').tmpdir(), 'grow-speech-check.zip'); fs.writeFileSync(zpath, Buffer.from(zipBytes));
  var zl = '';
  try { zl = require('child_process').execSync('python3 -c "import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;print(\' \'.join(z.namelist()))" ' + zpath).toString(); } catch (e) { zl = 'ERR ' + e.message; }
  ok(/manifest\.jsonl/.test(zl) && /utterances\.csv/.test(zl) && /summary\.json/.test(zl) && /README\.txt/.test(zl), '학습 데이터 ZIP 이 올바르지 않음: ' + zl);
  ok(!errs2.length, '말소리 녹음 흐름 오류: ' + errs2.join(' | '));
  await p2.close();

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

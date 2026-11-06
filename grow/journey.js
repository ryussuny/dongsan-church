/* ===========================================================
   함께 자라요 — 🗺️ 1년 성장 여정 · 🏅 상장 · 🏆 내 기록 · 🧩 5대 인지 영역

   1년 여정: 10장(출발 기지 → 빛의 성), 모두 360 미션 날.
     · 미션 날 = 오늘의 놀이를 끝까지 했거나, 하루에 다른 놀이 세 가지를 끝까지 한 날.
     · 날마다 별 ⭐(했어요) ⭐⭐(정확 75%↑) ⭐⭐⭐(칸·단계가 오른 날).
     · 다음 장으로 가려면: 이 장의 미션 날을 다 채우고 + 단계 열쇠(놀이 N가지를 M단계 이상까지).
       → 날만 채워서는 안 되고 실력이 같이 자라야 한다. 매일 해도 1년, 주 5일이면 1년 반쯤.
     · 장마다 그 장의 로봇이 열린다(robots.js — 로봇의 chapter).
   상장: 놀이가 3·5·7·10단계에 처음 오를 때, 장을 마칠 때, 미션 날 7·30·100·200·300일, 로봇 ★5 강화.
   내 기록: 놀이가 ctx.extra.score 를 주면 최고 점수, 그리고 가장 높이 오른 칸.
   5대 인지 영역: 언어 이해 · 시공간 · 논리 추론 · 기억력(작업기억) · 처리 속도 — 부모 화면 균형 막대.
   모두 기기(localStorage)에만.
   =========================================================== */
(function () {
'use strict';
var G = window.G;
var J = G.journey = {};

J.CHAPTERS = [
  { n: 1, name: '출발 기지', e: '🚀', days: 30, gate: null, robot: 'phoenix', line: '로봇 기지에서 첫 출발!' },
  { n: 2, name: '초록 숲', e: '🌳', days: 33, gate: { lv: 2, games: 8 }, robot: 'thunder', line: '반딧불이 숲길을 지나요' },
  { n: 3, name: '파도 바다', e: '🌊', days: 33, gate: { lv: 3, games: 8 }, robot: 'aurora', line: '등대가 있는 바닷가' },
  { n: 4, name: '모래 사막', e: '🏜️', days: 36, gate: { lv: 4, games: 7 }, robot: 'drill', line: '옛 성터와 오아시스' },
  { n: 5, name: '눈꽃 설원', e: '❄️', days: 36, gate: { lv: 5, games: 7 }, robot: 'gigas', line: '오로라가 춤추는 설산' },
  { n: 6, name: '불꽃 화산', e: '🌋', days: 36, gate: { lv: 6, games: 6 }, robot: 'seraph', line: '용암 강이 흐르는 섬' },
  { n: 7, name: '하늘 도시', e: '☁️', days: 38, gate: { lv: 7, games: 6 }, robot: 'shark', line: '구름 위에 뜬 도시' },
  { n: 8, name: '깊은 바다', e: '🐋', days: 38, gate: { lv: 8, games: 5 }, robot: 'leviathan', line: '빛나는 산호의 바닷속' },
  { n: 9, name: '은하 우주', e: '🌌', days: 40, gate: { lv: 9, games: 5 }, robot: 'cosmos', line: '별들 사이 우주 정거장' },
  { n: 10, name: '빛의 성', e: '✨', days: 40, gate: { lv: 10, games: 4 }, robot: 'arclight', line: '구름 위 빛의 성 — 마지막 장' }
];
J.CHAPTERS.forEach(function (c) { c.img = 'assets/grow/journey/ch' + c.n + '.jpg'; });
J.TOTAL_DAYS = J.CHAPTERS.reduce(function (s, c) { return s + c.days; }, 0);

function data() { return G.store.get('journey', { ch: 1, days: [], hist: [], total: 0, upDay: '' }); }
function save(j) { G.store.set('journey', j); }

/* 놀이마다 끝까지 해 본 가장 높은 단계 */
G.bestLevels = function () {
  var b = {};
  G.logs().forEach(function (l) { var d = G.acts[l.id]; if (!d || d.tool || (l.x && l.x.quit) || (d.levels || 1) < 2) return; b[l.id] = Math.max(b[l.id] || 0, l.lv || 1); });
  return b;
};
/* 단계 열쇠 {lv, games} → {ok, have, need, text} */
J.gateInfo = function (gate) {
  if (!gate) return { ok: true, have: 0, need: 0, text: '' };
  var b = G.bestLevels(), have = Object.keys(b).filter(function (k) { return b[k] >= gate.lv; }).length;
  return { ok: have >= gate.games, have: Math.min(have, gate.games), need: gate.games, text: '놀이 ' + gate.games + '가지를 ' + G.levelName(gate.lv) + ' 이상까지' };
};
J.state = function () {
  var j = data(), c = J.CHAPTERS[j.ch - 1] || J.CHAPTERS[J.CHAPTERS.length - 1], nx = J.CHAPTERS[j.ch] || null;
  var done = j.days.length, gi = nx ? J.gateInfo(nx.gate) : null;
  var past = J.CHAPTERS.slice(0, j.ch - 1).reduce(function (s, x) { return s + x.days; }, 0);
  return { ch: j.ch, chapter: c, next: nx, days: j.days, done: Math.min(done, c.days), need: c.days, full: done >= c.days, gate: gi,
    stars: j.days.reduce(function (s, x) { return s + (x.s || 1); }, 0), total: j.total || 0, journeyDays: past + Math.min(done, c.days), end: !nx && done >= c.days };
};
/* 오늘이 미션 날인지 — 오늘의 놀이를 끝까지 했거나 다른 놀이 세 가지를 끝까지 함 */
function todayStars(j) {
  var t = G.today(), L = G.logs().filter(function (l) { return l.d === t && !(l.x && l.x.quit) && G.acts[l.id] && !G.acts[l.id].tool; });
  var ids = {}; L.forEach(function (l) { ids[l.id] = 1; });
  var sess = (G.store.get('lastSession', {}) || {}).d === t;
  if (!sess && Object.keys(ids).length < 3) return 0;
  var g = L.filter(function (l) { return l.n > 0; }), n = 0, ok = 0; g.forEach(function (l) { n += l.n; ok += l.ok; });
  return 1 + (n >= 5 && ok / n >= 0.75 ? 1 : 0) + (j.upDay === t ? 1 : 0);
}
/* 놀이를 마칠 때마다 — 미션 날 표시, 장 넘기기, 상장·기록. 상 화면에 보일 것을 돌려준다 */
J.onFinish = function (ctx, info) {
  info = info || {};
  var out = { badges: [], record: null, day: null, advanced: null };
  if (!ctx || !ctx.def || ctx.def.tool) return out;
  var j = data();
  if (info.up) j.upDay = G.today();
  save(j);
  out.record = G.records.update(ctx);
  /* 단계 상장: 처음 오른 3·5·7·10단계 */
  if (info.nextLv && [3, 5, 7, 10].indexOf(info.nextLv) >= 0 && info.nextLv > ctx.level) {
    var b = G.badges.award('lv:' + ctx.id + ':' + info.nextLv, ctx.def.icon + ' 「' + ctx.def.title + '」 ' + G.levelName(info.nextLv), G.LEVEL_ICON[info.nextLv] ? G.LEVEL_ICON[info.nextLv][0] : '🎖️');
    if (b) out.badges.push(b);
  }
  var d = J.checkDay(); if (d) { out.day = d.day; out.badges = out.badges.concat(d.badges); out.advanced = d.advanced; }
  return out;
};
J.onSession = function () { return J.checkDay(); };
J.checkDay = function () {
  var j = data(), t = G.today(), s = todayStars(j);
  if (!s) return null;
  var c = J.CHAPTERS[j.ch - 1], last = j.days[j.days.length - 1], res = { day: null, badges: [], advanced: null };
  if (last && last.d === t) { if (s > (last.s || 1)) { last.s = s; save(j); } return null; }
  if (!c || j.days.length >= c.days) {
    /* 이 장의 날은 다 찼고 열쇠를 기다리는 중 — 날은 전체 수에만 센다 */
    if (!j.waitDays || j.waitDays.indexOf(t) < 0) { j.waitDays = (j.waitDays || []).concat([t]).slice(-60); j.total = (j.total || 0) + 1; }
  } else { j.days.push({ d: t, s: s }); j.total = (j.total || 0) + 1; res.day = { n: j.days.length, need: c.days, s: s }; }
  save(j);
  [7, 30, 100, 200, 300].forEach(function (k) { if (j.total >= k) { var b = G.badges.award('days:' + k, '미션 ' + k + '일 달성', k >= 100 ? '🏆' : '📅'); if (b) res.badges.push(b); } });
  var a = J.tryAdvance(); if (a) { res.advanced = a; res.badges = res.badges.concat(a.badges); }
  return res;
};
/* 장 넘기기 — 날을 다 채우고 열쇠가 있으면 */
J.tryAdvance = function () {
  var j = data(), c = J.CHAPTERS[j.ch - 1], nx = J.CHAPTERS[j.ch];
  if (!c || j.days.length < c.days) return null;
  var badges = [], b = G.badges.award('ch:' + c.n, c.n + '장 「' + c.name + '」 완주', c.e); if (b) badges.push(b);
  if (!nx) { save(j); return badges.length ? { done: true, chapter: c, badges: badges } : null; }
  if (!J.gateInfo(nx.gate).ok) return badges.length ? { waiting: true, chapter: c, badges: badges } : null;
  (j.hist = j.hist || []).push({ ch: c.n, to: G.today() });
  j.ch++; j.days = []; j.waitDays = [];
  save(j);
  return { chapter: nx, badges: badges };
};
/* 하루 평균 미션 날로 10장까지 남은 기간 어림 (부모 화면) */
J.forecast = function () {
  var st = J.state(), left = J.TOTAL_DAYS - st.journeyDays;
  var since = new Date(Date.now() - 28 * 864e5).toISOString().slice(0, 10);
  var recent = G.logs().filter(function (l) { return l.d >= since; }).map(function (l) { return l.d; });
  var u = {}; recent.forEach(function (d) { u[d] = 1; });
  var perWeek = Math.max(1, Math.round(Object.keys(u).length / 4));
  var weeks = Math.ceil(left / perWeek);
  var dt = new Date(Date.now() + weeks * 7 * 864e5);
  return { left: left, perWeek: perWeek, weeks: weeks, date: dt.getFullYear() + '년 ' + (dt.getMonth() + 1) + '월' };
};

/* ---------- 🏅 상장 ---------- */
G.badges = {
  all: function () { return G.store.get('badges', []); },
  has: function (id) { return G.badges.all().some(function (b) { return b.id === id; }); },
  award: function (id, name, e) {
    var L = G.badges.all(); if (L.some(function (b) { return b.id === id; })) return null;
    var b = { id: id, name: name, e: e || '🏅', d: G.today() }; L.push(b); G.store.set('badges', L.slice(-500)); return b;
  }
};

/* ---------- 🏆 내 기록 ---------- */
G.records = {
  all: function () { return G.store.get('records', {}); },
  get: function (id) { return G.records.all()[id] || null; },
  /* 점수(ctx.extra.score)가 오르면 새 기록 — {id, score, prev} */
  update: function (ctx) {
    var R = G.records.all(), r = R[ctx.id] || {}, out = null, sc = ctx.extra && typeof ctx.extra.score === 'number' ? ctx.extra.score : null;
    var fine = (ctx.level - 1) * G.STEPS + (ctx.step || 1);
    if (!r.fine || fine > r.fine) { r.fine = fine; r.lv = ctx.level; r.st = ctx.step || 1; }
    if (sc != null && sc > 0 && (r.score == null || sc > r.score)) { out = { id: ctx.id, score: sc, prev: r.score == null ? null : r.score }; r.score = sc; r.sd = G.today(); }
    R[ctx.id] = r; G.store.set('records', R);
    return out && out.prev != null ? out : null;   /* 처음 점수는 '새 기록'이라 하지 않는다 */
  }
};

/* ---------- 🧩 5대 인지 영역 ---------- */
G.DOMAINS = {
  verbal: { name: '언어 이해', e: '🗣️', color: '#ff7f61' },
  spatial: { name: '시공간', e: '🧭', color: '#4fc3a1' },
  reasoning: { name: '논리 추론', e: '🧩', color: '#7c6cf0' },
  memory: { name: '기억력', e: '🧠', color: '#4b8bf5' },
  speed: { name: '처리 속도', e: '⚡', color: '#f5b700' }
};
var DOMAIN_MAP = {
  words: 'verbal', listen: 'verbal', sounds: 'verbal', syllable: 'verbal', kindword: 'verbal', chat: 'verbal', situation: 'verbal', emotion: 'verbal', stories: 'verbal',
  trace: 'spatial', dots: 'spatial', puzzle: 'spatial', tilt: 'spatial', maze: 'spatial', shape: 'spatial', mirror: 'spatial', color: 'spatial',
  same: 'reasoning', odd: 'reasoning', order: 'reasoning', count: 'reasoning', big: 'reasoning', sort: 'reasoning', switch: 'reasoning',
  simon: 'memory', match: 'memory', follow: 'memory', shake: 'memory',
  pop: 'speed', gonogo: 'speed', findall: 'speed'
};
G.domainOf = function (id) { var d = G.acts[id]; return (d && d.domain) || DOMAIN_MAP[id] || null; };
/* 영역마다: 최근 days 일 놀이 횟수, 정답률, 놀이들의 가장 높은 단계 평균 */
G.domainStats = function (days) {
  var since = new Date(Date.now() - (days || 30) * 864e5).toISOString().slice(0, 10), best = G.bestLevels(), out = {};
  Object.keys(G.DOMAINS).forEach(function (k) { out[k] = { n: 0, tr: 0, ok: 0, lv: [], games: 0 }; });
  G.logs().forEach(function (l) { var k = G.domainOf(l.id); if (!k || l.d < since || (l.x && l.x.quit)) return; out[k].n++; out[k].tr += l.n || 0; out[k].ok += l.ok || 0; });
  Object.keys(G.acts).forEach(function (id) { var k = G.domainOf(id); if (!k || G.acts[id].tool) return; out[k].games++; if (best[id]) out[k].lv.push(best[id]); });
  Object.keys(out).forEach(function (k) { var o = out[k]; o.acc = o.tr ? Math.round(o.ok / o.tr * 100) : null; o.avgLv = o.lv.length ? Math.round(o.lv.reduce(function (s, x) { return s + x; }, 0) / o.lv.length * 10) / 10 : 0; });
  return out;
};

/* ---------- 화면 ---------- */
G.css('journey', [
  '.jr{max-width:980px;margin:0 auto;padding:0 14px calc(28px + var(--safe-b))}',
  '.jr-ban{position:relative;border-radius:20px;overflow:hidden;aspect-ratio:16/9;max-height:300px;width:100%;background:#0a1430;box-shadow:0 0 24px rgba(56,189,248,.22)}',
  '.jr-ban img{width:100%;height:100%;object-fit:cover;display:block}',
  '.jr-ban .cap{position:absolute;left:0;right:0;bottom:0;padding:28px 14px 10px;background:linear-gradient(transparent,rgba(5,10,30,.85));color:#fff}',
  '.jr-ban .cap small{color:#9fdcff;font-size:13px}.jr-ban .cap b{display:block;font-family:"Black Han Sans","Jua",sans-serif;font-weight:400;font-size:clamp(22px,6vw,30px)}',
  '.jr-box{background:linear-gradient(135deg,rgba(255,255,255,.09),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:12px 14px;margin:12px 0;color:#eaf2ff}',
  '.jr-box h3{font-family:"Jua",sans-serif;font-weight:400;font-size:18px;margin-bottom:6px;color:#fff}',
  '.jr-box small{color:#a9bde3;font-size:13px}',
  '.jr-bar{height:10px;border-radius:9px;background:rgba(255,255,255,.12);overflow:hidden;margin:6px 0}.jr-bar i{display:block;height:100%;background:linear-gradient(90deg,#7df9ff,#4fc3f7)}',
  '.jr-days{display:grid;grid-template-columns:repeat(auto-fill,minmax(40px,1fr));gap:5px;margin-top:8px}',
  '.jr-days i{font-style:normal;aspect-ratio:1;border-radius:10px;background:rgba(255,255,255,.06);border:1px dashed rgba(255,255,255,.16);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;color:#8ea4cb;line-height:1.1}',
  '.jr-days i.on{background:rgba(255,213,79,.16);border:1px solid rgba(255,213,79,.5);color:#ffe082}',
  '.jr-days i.on b{font-size:11px;letter-spacing:-2px}',
  '.jr-days i.today{outline:2px solid #7df9ff}',
  '.jr-map{display:flex;flex-direction:column;gap:8px}',
  '.jr-ch{display:grid;grid-template-columns:110px 1fr;gap:10px;align-items:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:6px;color:#eaf2ff;text-align:left}',
  '.jr-ch img{width:110px;height:62px;object-fit:cover;border-radius:12px;display:block}',
  '.jr-ch.lock img{filter:grayscale(1) brightness(.55)}.jr-ch.lock{opacity:.85}',
  '.jr-ch.now{border-color:rgba(125,249,255,.7);box-shadow:0 0 16px rgba(125,249,255,.25)}',
  '.jr-ch b{font-family:"Jua",sans-serif;font-weight:400;font-size:16px;display:block}.jr-ch small{color:#a9bde3;font-size:12px;display:block;line-height:1.35}',
  '.jr-badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}',
  '.jr-badges div{background:linear-gradient(160deg,#7a1f2b,#4a1220);border:2px solid #ffd54f;border-radius:14px;padding:8px 6px;text-align:center;color:#ffe9a8;font-size:11.5px;line-height:1.3}',
  '.jr-badges div b{display:block;font-size:28px;line-height:1.1;margin-bottom:2px}',
  '.jr-badges div small{display:block;color:#f5c97b;font-size:10px;margin-top:2px}',
  '.hm-journey{display:flex;align-items:center;gap:10px;width:100%;margin:0 0 14px;padding:8px;border-radius:18px;background:linear-gradient(135deg,rgba(125,249,255,.12),rgba(255,255,255,.03));border:1px solid rgba(125,249,255,.35);color:#eaf2ff;text-align:left}',
  '.hm-journey img{width:96px;height:54px;object-fit:cover;border-radius:12px;flex:none}',
  '.hm-journey b{font-family:"Jua",sans-serif;font-weight:400;font-size:clamp(15px,4.2vw,18px);display:block}',
  '.hm-journey small{color:#a9d8ff;font-size:12.5px;display:block}',
  '.hm-journey .jr-bar{margin:4px 0 0}'
].join('\n'));

function dayTiles(st) {
  var t = G.today(), h = '';
  for (var i = 0; i < st.need; i++) {
    var d = st.days[i];
    h += d ? '<i class="on' + (d.d === t ? ' today' : '') + '"><b>' + '⭐'.repeat(d.s || 1) + '</b>' + d.d.slice(5).replace('-', '/') + '</i>' : '<i>' + (i + 1) + '</i>';
  }
  return '<div class="jr-days">' + h + '</div>';
}
function robotName(id) { var r = window.GR && GR.ROBOTS.filter(function (x) { return x.id === id; })[0]; return r ? r.name : ''; }
/* 그 장에서 열리는 로봇들 (robots.js 의 chapter) */
function chRobots(c) { var l = window.GR ? GR.ROBOTS.filter(function (x) { return x.chapter === c.n; }).map(function (x) { return x.name; }) : []; return l.length ? l.join(' · ') : robotName(c.robot); }

/* 홈 카드 */
J.renderHome = function () {
  var box = G.$('#hmJourney'); if (!box) return;
  var st = J.state(), c = st.chapter;
  box.innerHTML = '<img src="' + c.img + '" alt=""><span style="flex:1;min-width:0"><b>🗺️ 1년 여정 ' + c.n + '장 · ' + G.esc(c.name) + '</b><small>미션 ' + st.done + ' / ' + st.need + '일 · ⭐ ' + st.stars +
    (st.full && st.gate && !st.gate.ok ? ' · 🔒 다음 장: ' + G.esc(st.gate.text) + ' (' + st.gate.have + '/' + st.gate.need + ')' : '') + '</small><span class="jr-bar"><i style="width:' + Math.round(st.done / st.need * 100) + '%"></i></span></span>';
  box.onclick = function () { G.sfx.play('tap'); J.open(); };
};

/* 여정 화면 */
J.open = function () {
  var scr = G.$('#journey'); if (!scr) return;
  var st = J.state(), c = st.chapter, body = G.$('#jrBody', scr);
  var h = '<div class="jr-ban"><img src="' + c.img + '" alt="' + G.esc(c.name) + '"><div class="cap"><small>1년 여정 · ' + c.n + ' / ' + J.CHAPTERS.length + '장</small><b>' + c.e + ' ' + G.esc(c.name) + '</b><small>' + G.esc(c.line) + ' · 이 장의 로봇: ' + G.esc(chRobots(c)) + '</small></div></div>';
  h += '<div class="jr-box"><h3>📅 미션 달력 — ' + st.done + ' / ' + st.need + '일 · ⭐ ' + st.stars + '</h3><small>오늘의 놀이를 끝까지 하거나 놀이 세 가지를 끝까지 하면 하루 도장! ⭐ 했어요 · ⭐⭐ 정확하게 · ⭐⭐⭐ 실력이 오른 날</small>' +
    '<div class="jr-bar"><i style="width:' + Math.round(st.done / st.need * 100) + '%"></i></div>' + dayTiles(st) + '</div>';
  if (st.next) h += '<div class="jr-box"><h3>🔑 다음 장 「' + G.esc(st.next.name) + '」 열쇠</h3><small>미션 ' + st.need + '일 채우기 ' + (st.full ? '✅' : '(' + st.done + '/' + st.need + ')') + ' · ' + G.esc(st.gate.text) + ' ' + (st.gate.ok ? '✅' : '(' + st.gate.have + '/' + st.gate.need + ')') + '</small></div>';
  else h += '<div class="jr-box"><h3>' + (st.end ? '🏆 1년 여정 완주! 정말 대단해!' : '✨ 마지막 장이야! 끝까지 가 보자!') + '</h3></div>';
  h += '<div class="jr-box"><h3>🗺️ 여정 지도</h3><div class="jr-map">' + J.CHAPTERS.map(function (x) {
    var stt = x.n < st.ch ? 'done' : x.n === st.ch ? 'now' : 'lock';
    return '<div class="jr-ch ' + stt + '"><img src="' + x.img + '" alt="" loading="lazy"><div><b>' + (stt === 'done' ? '✅ ' : stt === 'now' ? '📍 ' : '🔒 ') + x.n + '장 · ' + G.esc(x.name) + '</b><small>' + G.esc(x.line) + ' · 미션 ' + x.days + '일' + (x.gate ? ' · 열쇠: ' + G.esc(J.gateInfo(x.gate).text) : '') + '</small><small>🤖 ' + G.esc(chRobots(x)) + '</small></div></div>';
  }).join('') + '</div></div>';
  var bs = G.badges.all().slice().reverse();
  h += '<div class="jr-box"><h3>🏅 상장 진열장 · ' + bs.length + '개</h3>' + (bs.length ? '<div class="jr-badges">' + bs.slice(0, 60).map(function (b) { return '<div><b>' + b.e + '</b>' + G.esc(b.name) + '<small>' + b.d + '</small></div>'; }).join('') + '</div>' : '<small>놀이가 3·5·7·10단계에 오르거나, 장을 마치거나, 미션 7일을 채우면 상장을 받아요!</small>') + '</div>';
  body.innerHTML = h;
  G.showScreen('journey');
  G.say((G.older() ? '1년 여정 ' : '여정 ') + c.n + '장, ' + c.name + '! 미션 ' + st.done + '일 했어. ' + (st.full && st.gate && !st.gate.ok ? '다음 장으로 가려면 ' + st.gate.text + ' 해 보자!' : '오늘도 한 칸 가 보자!'));
};

})();

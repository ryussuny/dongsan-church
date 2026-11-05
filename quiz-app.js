/* ===========================================================
   동산 퀴즈 배틀 — quiz.html 의 엔진

   - 팀 대항전: 인도자가 빔·TV 한 화면으로 진행 (2~6팀).
       모든 팀 동시(OX·4지·빈칸·순서) / 먼저 외치기(초성·이모지·누구일까요·주관식)
       아이템(🔥더블·🦹스틸·🛡️실드), 연속 정답 보너스, 럭키 룰렛, 마지막 라운드 2배,
       파이널 올인 베팅, 시상식.
   - 혼자 도전: quiz.html?solo=1 — 오늘의 도전(날마다 같은 12문제) · 팩 도전.
   - 문제 만들기: 한 줄 형식으로 우리 모임 문제 팩 만들기, 파일로 주고받기, AI 초안.

   기록(게임·최고 점수·만든 문제)은 모두 이 기기(localStorage)에만 둔다.
   이름·연락처는 받지 않는다 (팀 이름만).
   문제 자료: quiz-data.js (QUIZ_PACKS) — 고친 뒤 node scripts/quiz-check.js
   =========================================================== */
(function () {
'use strict';

/* ---------- 작은 도구 ---------- */
const P = 'dongsan_';
const store = {
  get(k, d) { try { const v = localStorage.getItem(P + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(P + k); } catch (e) {} }
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('ko-KR');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const app = $('#app');
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function rngFrom(seed) {
  let a = parseInt(hash(String(seed)), 36) | 0;
  return function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function shuffle(arr, rng) { rng = rng || Math.random; const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
const pick = (arr, rng) => arr[Math.floor((rng || Math.random)() * arr.length)];
const norm = s => String(s == null ? '' : s).toLowerCase().replace(/[\s.,!?~·'"“”‘’()\[\]\-_:;/]/g, '');
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
function choseong(s) { return Array.from(String(s)).map(ch => { const c = ch.charCodeAt(0) - 0xAC00; return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch; }); }
function graphemes(s) {
  if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(s), x => x.segment).filter(x => x.trim());
  return Array.from(s).filter(x => x.trim());
}
function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

/* ---------- 소리 (파일 없이 만든 효과음) ---------- */
const SFX = {
  ctx: null, on: store.get('quiz_sound', true),
  ac() {
    if (!this.on) return null;
    if (!this.ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; try { this.ctx = new A(); } catch (e) { return null; } }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(f, d, type, vol, at, f2) {
    const c = this.ac(); if (!c) return;
    const t = c.currentTime + (at || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.05);
  },
  noise(d, vol, at, fq) {
    const c = this.ac(); if (!c) return;
    const t = c.currentTime + (at || 0), b = c.createBuffer(1, Math.max(1, c.sampleRate * d | 0), c.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; fl.type = 'bandpass'; fl.frequency.setValueAtTime(fq || 1200, t);
    g.gain.setValueAtTime(vol || 0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(c.destination); s.start(t);
  },
  tick() { this.tone(1500, 0.04, 'square', 0.05); },
  beep() { this.tone(880, 0.12, 'square', 0.09); },
  go() { this.tone(523, 0.12, 'triangle', 0.15); this.tone(784, 0.2, 'triangle', 0.15, 0.1); },
  good() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.16, i * 0.07)); },
  bad() { this.tone(220, 0.35, 'sawtooth', 0.11, 0, 110); },
  end() { this.tone(196, 0.55, 'square', 0.12); this.tone(185, 0.55, 'square', 0.09, 0.02); },
  whoosh() { this.noise(0.35, 0.12, 0, 900); },
  coin() { this.tone(988, 0.07, 'square', 0.08); this.tone(1319, 0.24, 'square', 0.08, 0.07); },
  pop() { this.tone(600, 0.09, 'sine', 0.16, 0, 1200); },
  spin() { this.tone(1900, 0.025, 'square', 0.04); },
  steal() { this.tone(800, 0.3, 'sawtooth', 0.08, 0, 200); this.tone(300, 0.2, 'square', 0.06, 0.25, 900); },
  roll(d) { const n = Math.round(d * 18); for (let i = 0; i < n; i++) this.noise(0.06, 0.04 + i / n * 0.1, i / 18, 260); },
  fanfare() {
    [[523, 0], [659, 0.13], [784, 0.26], [1047, 0.39], [784, 0.62], [1047, 0.75]].forEach(([f, t]) => { this.tone(f, 0.3, 'square', 0.07, t); this.tone(f / 2, 0.3, 'triangle', 0.08, t); });
    [523, 659, 784, 1047].forEach(f => this.tone(f, 1.4, 'triangle', 0.06, 0.95));
  }
};

/* ---------- 문제 종류 ---------- */
const TYPE = {
  ox:    { label: '⭕ OX 퀴즈',     style: 'all',  pts: 100, time: 10, solo: 10, how: '모든 팀 동시에! 팔로 O · X' },
  mc:    { label: '🎯 4지선다',     style: 'all',  pts: 200, time: 20, solo: 15, how: '모든 팀 동시에! 손가락 1~4' },
  blank: { label: '✍️ 말씀 빈칸',   style: 'all',  pts: 200, time: 20, solo: 15, how: '모든 팀 동시에! 손가락 1~4' },
  order: { label: '🔢 순서 맞히기', style: 'all',  pts: 300, time: 35, solo: 30, how: '모든 팀 동시에! 종이에 순서 적어 들기 (예: CADB)' },
  cho:   { label: '🔤 초성 퀴즈',   style: 'buzz', pts: 200, time: 20, solo: 25, how: '아는 팀은 먼저 외치기!' },
  emoji: { label: '😀 이모지 퀴즈', style: 'buzz', pts: 200, time: 20, solo: 15, how: '아는 팀은 먼저 외치기!' },
  hint:  { label: '🕵️ 누구일까요?', style: 'buzz', pts: 400, time: 10, solo: 24, how: '힌트가 적을수록 높은 점수! 먼저 외치기' },
  open:  { label: '💬 주관식',      style: 'buzz', pts: 200, time: 20, solo: 25, how: '아는 팀은 먼저 외치기!' }
};
const styleOf = q => (q.t === 'blank' && !q.opts) ? 'buzz' : TYPE[q.t].style;
const LET = 'ABCDE';

/* ---------- 팀 ---------- */
const COLORS = ['#ff5470', '#3d8bff', '#22c977', '#ffb627', '#b86bff', '#ff8a3d'];
const EMOJIS = ['🦁', '🐋', '🔥', '⚡', '🕊️', '🌟', '🐑', '🍞', '🛡️', '🎺', '🚀', '🌈', '🦅', '🐻', '🍇', '⛵', '🎸', '💎', '🪨', '🏹'];
const NAMES = ['불꽃 다윗단', '졸린 유두고', '배고픈 오병이어', '용감한 물맷돌', '무적 방주호', '번개 엘리야', '지혜왕 솔로몬', '열정 바울단',
  '만나 먹방단', '여리고 함성대', '갈렙 체력왕', '사자굴 다니엘', '기드온 300', '빛과 소금', '겨자씨 군단', '물 위의 베드로',
  '나팔 부는 여호수아', '뽕나무 삭개오', '방주 탑승객', '고래 뱃속 요나'];

/* ---------- 문제 팩 ---------- */
const PACK_ORDER = ['people', 'ot', 'jesus', 'acts', 'who', 'order', 'cho', 'emoji', 'blank', 'season', 'dongsan', 'nonsense', 'general'];
function builtin() {
  const ps = (window.QUIZ_PACKS || []).slice();
  ps.sort((a, b) => { const i = PACK_ORDER.indexOf(a.id), j = PACK_ORDER.indexOf(b.id); return (i < 0 ? 99 : i) - (j < 0 ? 99 : j); });
  return ps;
}
function customs() { return store.get('quiz_custom', []); }
function allPacks() { return builtin().concat(customs().map(p => Object.assign({ custom: true }, p))); }
function packById(id) { return allPacks().find(p => p.id === id); }
function qid(p, q) { return p.id + ':' + hash(JSON.stringify([q.t, q.q || '', q.a, q.e || '', q.v || '', (q.items || []).join('|'), (q.h || []).join('|')])); }

/* 화면에 낼 꼴로 다듬기 (보기 섞기·순서 섞기·초성) — 게임에 저장해 두어 새로 고쳐도 같은 모양 */
function prep(q, pack, rng) {
  rng = rng || Math.random;
  const x = JSON.parse(JSON.stringify(q));
  x.id = qid(pack, q); x.pk = pack.id; x.pkName = pack.name; x.pkIcon = pack.icon;
  let opts = null, ans = -1;
  if (x.t === 'mc') { opts = x.o.slice(); ans = x.a; }
  else if (Array.isArray(x.o) && x.o.length >= 2) {
    opts = x.o.slice(); ans = opts.findIndex(o => norm(o) === norm(x.a));
    if (ans < 0) { opts[0] = x.a; ans = 0; }
  }
  if (opts) { const ord = shuffle(opts.map((_, i) => i), rng); x.opts = ord.map(k => opts[k]); x.ai = ord.indexOf(ans); }
  if (x.t === 'order') {
    let sh = shuffle(x.items.map((_, i) => i), rng);
    if (sh.every((v, i) => v === i)) sh = sh.slice(1).concat(sh[0]);
    x.sh = sh;
  }
  if (x.t === 'cho') x.cs = choseong(x.a);
  if (x.t === 'emoji') x.eg = graphemes(x.e || '');
  return x;
}
const seenAll = () => store.get('quiz_seen', {});
function markSeen(id) { const s = seenAll(); s[id] = Date.now(); const ks = Object.keys(s); if (ks.length > 3000) ks.sort((a, b) => s[a] - s[b]).slice(0, 800).forEach(k => delete s[k]); store.set('quiz_seen', s); }

/* 한 팩에서 n 문제: 안 본 것 먼저, 쉬운 것부터 */
function pickFrom(pack, n, used) {
  const seen = seenAll();
  const list = shuffle(pack.q.map(q => ({ q, id: qid(pack, q) })).filter(x => !used[x.id]));
  list.sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0));
  const got = list.slice(0, n);
  got.forEach(x => { used[x.id] = 1; });
  return got.map(x => prep(x.q, pack)).sort((a, b) => (a.lv || 2) - (b.lv || 2));
}

/* ---------- 상태 ---------- */
let UI = { screen: 'lobby' };     // lobby · setup · game · solo · edit · help
let S = null;                      // 팀 대항전 (저장됨)
let SO = null;                     // 혼자 도전
let ACT = { primary: null };
const saveGame = () => { if (S) store.set('quiz_game', S); };

const DEFAULT_CFG = { n: 4, per: 5, timer: 1, items: true, events: true, dbl: true, final: true, packs: [] };
let SET = null;                    // 준비 화면 값

/* ---------- 타이머 ---------- */
const T = { total: 0, left: 0, run: false, last: 0, onEnd: null, lastSec: -1 };
function tStart(sec, onEnd) { T.total = T.left = sec; T.run = true; T.onEnd = onEnd; T.last = performance.now(); T.lastSec = Math.ceil(sec); requestAnimationFrame(tLoop); tDraw(); }
function tStop() { T.run = false; T.onEnd = null; }
function tToggle() { if (T.left <= 0) return; T.run = !T.run; if (T.run) { T.last = performance.now(); requestAnimationFrame(tLoop); } tDraw(); }
function tLoop(ts) {
  if (!T.run) return;
  const dt = Math.min(0.5, (ts - T.last) / 1000); T.last = ts;
  T.left = Math.max(0, T.left - dt);
  const s = Math.ceil(T.left);
  if (s !== T.lastSec) { T.lastSec = s; if (s > 0 && s <= 5) SFX.tick(); }
  tDraw();
  if (T.left <= 0) { T.run = false; const f = T.onEnd; T.onEnd = null; if (f) f(); return; }
  requestAnimationFrame(tLoop);
}
function tDraw() {
  const box = $('#timer'); if (!box) return;
  const bar = $('#tbar'), num = $('#tnum');
  if (bar) bar.style.transform = 'scaleX(' + (T.total ? T.left / T.total : 0) + ')';
  if (num) num.textContent = Math.ceil(T.left);
  box.classList.toggle('warn', T.run && T.left <= 5 && T.left > 0);
  box.classList.toggle('paused', !T.run && T.left > 0);
  box.classList.toggle('up', T.left <= 0);
}
function timerHTML() { return '<div class="timer" id="timer" role="timer"><div class="tbar"><i id="tbar"></i></div><b class="tnum" id="tnum">' + Math.ceil(T.left) + '</b></div>'; }

/* ---------- 알림·창·효과 ---------- */
let toastT = 0;
function toast(msg, ms) {
  let t = $('.toast'); if (t) t.remove();
  t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t);
  clearTimeout(toastT); toastT = setTimeout(() => t.remove(), ms || 2200);
}
function banner(msg) { const b = document.createElement('div'); b.className = 'banner'; b.textContent = msg; document.body.appendChild(b); setTimeout(() => b.remove(), 2300); }
function modal(html) { closeModal(); const o = document.createElement('div'); o.className = 'ov'; o.id = 'ov'; o.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>'; o.addEventListener('click', e => { if (e.target === o) closeModal(); }); document.body.appendChild(o); const f = o.querySelector('input,textarea,button'); if (f) f.focus(); }
function closeModal() { const o = $('#ov'); if (o) o.remove(); }
let askFn = null;
function ask(msg, yes, fn) { askFn = fn; modal('<h2>' + esc(msg) + '</h2><div class="row" style="margin-top:16px"><button class="btn pri" data-act="askYes">' + esc(yes || '네') + '</button><button class="btn" data-act="closeModal">아니요</button></div>'); }
function popAt(i, txt, sub, neg) {
  const el = $('.tm[data-i="' + i + '"]'); if (!el) return;
  const r = el.getBoundingClientRect(), p = document.createElement('div');
  p.className = 'pop' + (neg ? ' neg' : ''); p.innerHTML = esc(txt) + (sub ? '<small>' + esc(sub) + '</small>' : '');
  p.style.left = (r.left + r.width / 2) + 'px'; p.style.top = (r.top - 40) + 'px';
  document.body.appendChild(p); setTimeout(() => p.remove(), 1500);
}
function countUp(el, from, to, ms) {
  if (!el) return; if (REDUCED || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now(); ms = ms || 900;
  (function f(t) { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(f); })(t0);
}
function confetti(ms) {
  if (REDUCED) return;
  const c = document.createElement('canvas'); c.className = 'fx'; document.body.appendChild(c);
  const x = c.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr;
  const cols = ['#ffd23f', '#ff4fa0', '#53b8ff', '#2fe08a', '#b86bff', '#ff8a3d', '#ffffff'];
  const ps = Array.from({ length: 180 }, () => ({ x: Math.random() * W, y: -Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 5 * dpr, vy: (2 + Math.random() * 4) * dpr, r: (5 + Math.random() * 7) * dpr, c: pick(cols), a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3 }));
  const t0 = performance.now(); ms = ms || 4000;
  (function f(t) {
    x.clearRect(0, 0, W, H);
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.04 * dpr; p.vx *= 0.995; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
    if (t - t0 < ms) requestAnimationFrame(f); else c.remove();
  })(t0);
}
function fullscreen() {
  const d = document;
  if (!d.fullscreenElement && !d.webkitFullscreenElement) { const el = d.documentElement; (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el); }
  else (d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d);
}
function soundBtn() { return '<button class="ib" data-act="sound" aria-label="소리 켜고 끄기">' + (SFX.on ? '🔊' : '🔇') + '</button>'; }

/* ===========================================================
   그리기
   =========================================================== */
function render() {
  const v = (VIEWS[UI.screen] || VIEWS.lobby)();
  app.innerHTML = v.html;
  ACT.primary = v.primary || null;
  if (v.after) v.after();
  tDraw();
  const fl = $$('.tile.toflip');
  if (fl.length) requestAnimationFrame(() => requestAnimationFrame(() => fl.forEach(t => t.classList.add('flip'))));
}
function go(screen) { UI.screen = screen; window.scrollTo(0, 0); render(); }

const VIEWS = {};

/* ---------- 첫 화면 ---------- */
VIEWS.lobby = function () {
  const g = store.get('quiz_game', null);
  const live = g && g.phase !== 'awards' && g.teams;
  const n = allPacks().reduce((s, p) => s + p.q.length, 0);
  const dd = store.get('quiz_daily', {});
  const doneToday = dd.date === today();
  let h = '<header class="bar"><a class="ib" href="word-youth.html" aria-label="청년·청소년 말씀으로">←</a><div class="ttl"></div>' + soundBtn() + '<button class="ib" data-act="fs" aria-label="전체 화면">⛶</button></header>';
  h += '<main class="stage"><div class="lobby">';
  h += '<div class="church">동산감리교회 · 중고등부 · 청년부</div>';
  h += '<h1 class="logo disp"><i class="a">⚡</i><span>동산 퀴즈 배틀</span><i class="b">🏆</i></h1>';
  h += '<p class="sub">팀으로 겨루는 말씀 · 상식 · 넌센스 퀴즈 — 룰렛 · 아이템 · 올인 베팅까지</p>';
  if (live) {
    const r = g.rounds[g.ri];
    h += '<div class="resume"><p><b>하던 게임이 있어요</b><br>' + g.teams.length + '팀 · ' + (g.phase === 'bet' || g.phase === 'fq' ? '파이널' : 'ROUND ' + (g.ri + 1) + ' ' + esc(r ? r.name : '')) + '</p><button class="btn pri" data-act="resume">이어 하기 ▶</button><button class="btn sm" data-act="dropGame">지우기</button></div>';
  }
  h += '<div class="mgrid">';
  h += '<button class="mcard hot" data-act="setup"><span class="ic">🏆</span><span><b>팀 대항전</b><small>빔 · TV 한 화면으로 2~6팀이 겨뤄요</small></span></button>';
  h += '<button class="mcard cool" data-act="soloHome">' + (doneToday ? '' : '<span class="tag">NEW</span>') + '<span class="ic">⚡</span><span><b>혼자 도전</b><small>' + (doneToday ? '오늘 ' + fmt(dd.score) + '점 · 기록 깨러 가기' : '오늘의 도전 12문제 · 친구와 점수 겨루기') + '</small></span></button>';
  h += '<button class="mcard" data-act="edit"><span class="ic">✏️</span><span><b>문제 만들기</b><small>우리 모임 문제 · 설교 본문 문제 · AI 초안</small></span></button>';
  h += '<button class="mcard" data-act="help"><span class="ic">📋</span><span><b>진행 방법</b><small>규칙 · 아이템 · 단축키 · 인도 꿀팁</small></span></button>';
  h += '</div>';
  h += '<p class="foot">문제 팩 ' + allPacks().length + '개 · 문제 ' + n + '개 · 기록은 이 기기에만 저장돼요<br><a href="index.html">동산감리교회 홈페이지</a></p>';
  h += '</div></main>';
  return { html: h };
};

/* ---------- 준비 화면 ---------- */
function newSet() {
  const last = store.get('quiz_last', null);
  const cfg = Object.assign({}, DEFAULT_CFG, last && last.cfg || {});
  const avail = allPacks().map(p => p.id);
  cfg.packs = (cfg.packs || []).filter(id => avail.indexOf(id) >= 0);
  if (!cfg.packs.length) cfg.packs = recommend();
  const teams = (last && last.teams || []).slice(0, 6);
  const used = {};
  teams.forEach(t => { used[t.name] = 1; });
  while (teams.length < 6) teams.push({ name: freshName(used), emoji: EMOJIS[teams.length * 3 % EMOJIS.length] });
  return { cfg, teams };
}
function freshName(used) { const left = NAMES.filter(n => !used[n]); const n = pick(left.length ? left : NAMES); used[n] = 1; return n; }
function recommend() {
  const has = id => !!packById(id);
  const A = shuffle(['people', 'ot', 'jesus', 'acts'].filter(has)), B = shuffle(['emoji', 'cho', 'who'].filter(has)), C = shuffle(['nonsense', 'general'].filter(has)), D = shuffle(['blank', 'order', 'season'].filter(has));
  const out = [A[0], B[0], C[0], B[1], D[0], A[1]].filter(Boolean);
  return out.length ? out : allPacks().slice(0, 4).map(p => p.id);
}
function estMin(cfg) {
  const qn = cfg.packs.length * cfg.per;
  return Math.round(qn * 1.1 + cfg.packs.length * 1.5 + (cfg.events ? Math.floor(cfg.packs.length / 2) * 2.5 : 0) + (cfg.final ? 4 : 0) + 2);
}
VIEWS.setup = function () {
  if (!SET) SET = newSet();
  const c = SET.cfg;
  let h = '<header class="bar"><button class="ib" data-act="home" aria-label="처음 화면">←</button><div class="ttl"><b>팀 대항전</b> 준비</div>' + soundBtn() + '<button class="ib" data-act="fs" aria-label="전체 화면">⛶</button></header>';
  h += '<main class="stage"><div class="setup">';
  h += '<h1 class="disp">🏆 팀 대항전 준비</h1><p class="lead">팀을 나누고, 문제 팩을 고르고, 규칙을 정하면 끝!</p>';
  // 팀
  h += '<section class="sec"><h2><em>1</em> 팀 <small>이모지를 누르면 바뀌어요</small></h2><div class="pills">';
  for (let n = 2; n <= 6; n++) h += '<button class="pill' + (c.n === n ? ' on' : '') + '" data-act="setN" data-arg="' + n + '">' + n + '팀</button>';
  h += '<button class="pill" data-act="rollNames">🎲 이름 섞기</button></div><div class="tedit">';
  for (let i = 0; i < c.n; i++) {
    const t = SET.teams[i];
    h += '<div class="te" style="--tc:' + COLORS[i] + '"><button class="te-e" data-act="cycleEmoji" data-arg="' + i + '" aria-label="' + (i + 1) + '팀 이모지 바꾸기">' + t.emoji + '</button><input data-team="' + i + '" value="' + esc(t.name) + '" maxlength="14" aria-label="' + (i + 1) + '팀 이름"><button class="ib" data-act="rollName" data-arg="' + i + '" aria-label="이름 바꾸기">🎲</button></div>';
  }
  h += '</div></section>';
  // 팩
  const ps = allPacks();
  h += '<section class="sec"><h2><em>2</em> 문제 팩 <small>누른 순서대로 라운드가 돼요</small></h2><div class="row" style="margin-bottom:12px"><button class="btn sm" data-act="recommend">🎲 추천 조합</button><button class="btn sm" data-act="clearPacks">모두 빼기</button><span class="sp1"></span><span style="color:var(--ink3);font-size:14px">라운드마다</span><div class="pills">';
  [3, 5, 7, 10].forEach(n => { h += '<button class="pill' + (c.per === n ? ' on' : '') + '" data-act="setPer" data-arg="' + n + '">' + n + '문제</button>'; });
  h += '</div></div><div class="packs">';
  ps.forEach(p => {
    const k = c.packs.indexOf(p.id);
    h += '<button class="pk' + (k >= 0 ? ' on' : '') + '" data-act="togglePack" data-arg="' + esc(p.id) + '"><span class="pi">' + esc(p.icon || '❓') + '</span><span><b>' + esc(p.name) + '</b><small>' + (p.custom ? '<span class="my">⭐ 우리 문제</span> · ' : '') + esc(p.desc || '') + ' · ' + p.q.length + '문제</small></span><span class="pn">' + (k + 1) + '</span></button>';
  });
  h += '</div></section>';
  // 규칙
  h += '<section class="sec"><h2><em>3</em> 규칙</h2><div class="row" style="margin-bottom:12px"><span style="color:var(--ink2);font-weight:700">⏱ 타이머</span><div class="pills">';
  [[0, '끄기'], [1.5, '여유'], [1, '보통'], [0.7, '빠듯']].forEach(([v, l]) => { h += '<button class="pill' + (c.timer === v ? ' on' : '') + '" data-act="setTimer" data-arg="' + v + '">' + l + '</button>'; });
  h += '</div></div><div class="tgl">';
  [['items', '🎁', '아이템 카드', '팀마다 🔥더블 · 🦹스틸 · 🛡️실드 한 장씩'], ['events', '🎡', '럭키 룰렛', '두 라운드마다 룰렛 — 만나 · 희년 · 다윗과 골리앗…'], ['dbl', '🔥', '마지막 라운드 2배', '끝까지 역전 가능!'], ['final', '💰', '파이널 올인 베팅', '점수를 걸고 마지막 한 문제']].forEach(([k, i, b, s]) => {
    h += '<button class="tg' + (c[k] ? ' on' : '') + '" data-act="toggleCfg" data-arg="' + k + '" aria-pressed="' + !!c[k] + '"><span class="ti">' + i + '</span><span><b>' + b + '</b><small>' + s + '</small></span><span class="sw"></span></button>';
  });
  h += '</div></section>';
  h += '</div></main>';
  const ok = c.packs.length > 0;
  h += '<div class="dock"><div class="in"><p><b>' + (ok ? '라운드 ' + c.packs.length + '개 · 문제 ' + (c.packs.length * c.per) + '개' + (c.final ? ' + 파이널' : '') : '문제 팩을 하나 이상 골라 주세요') + '</b><br>' + (ok ? '약 ' + estMin(c) + '분 · ' + c.n + '팀' : '') + '</p><button class="btn pri big" data-act="start"' + (ok ? '' : ' disabled') + '>시작! ▶</button></div></div>';
  return { html: h, primary: ok ? () => doAct('start') : null };
};

/* ---------- 게임 만들기 ---------- */
function startGame() {
  const c = SET.cfg;
  SET.teams.forEach((t, i) => { const inp = $('input[data-team="' + i + '"]'); if (inp) t.name = inp.value.trim() || NAMES[i]; });
  store.set('quiz_last', { cfg: c, teams: SET.teams.slice(0, c.n) });
  const used = {};
  const rounds = c.packs.map(id => packById(id)).filter(Boolean).map(p => ({ id: p.id, name: p.name, icon: p.icon || '❓', desc: p.desc || '', qs: pickFrom(p, c.per, used), mult: 1, ev: 1 })).filter(r => r.qs.length);
  if (!rounds.length) { toast('문제를 찾지 못했어요'); return; }
  if (c.dbl && rounds.length >= 2) rounds[rounds.length - 1].mult = 2;
  S = {
    v: 1, cfg: c, rounds, ri: 0, qi: 0, phase: 'intro',
    teams: SET.teams.slice(0, c.n).map((t, i) => ({ name: t.name, emoji: t.emoji, color: COLORS[i], score: 0, items: c.items ? { double: 1, steal: 1, shield: 1 } : { double: 0, steal: 0, shield: 0 }, streak: 0, best: 0, correct: 0, steals: 0 })),
    rev: false, picked: [], armed: [], hint: 1, open: false, undo: null, prev: null, rank1: null,
    final: c.final ? pickFinal(c.packs, used) : null, bets: null, ev: null, startedAt: Date.now()
  };
  saveGame(); SFX.go(); go('game');
}
function pickFinal(packIds, used) {
  const ok = q => ['mc', 'order', 'open'].indexOf(q.t) >= 0 || (q.t === 'blank' && q.o);
  const find = ids => {
    let c = [];
    ids.forEach(id => { const p = packById(id); if (p) p.q.forEach(q => { if (ok(q) && !used[qid(p, q)]) c.push({ p, q }); }); });
    const hard = c.filter(x => (x.q.lv || 2) >= 3);
    return hard.length ? hard : c.filter(x => (x.q.lv || 2) >= 2).length ? c.filter(x => (x.q.lv || 2) >= 2) : c;
  };
  let c = find(packIds);
  if (!c.length) c = find(builtin().map(p => p.id));
  if (!c.length) return null;
  const x = pick(c); used[qid(x.p, x.q)] = 1;
  return prep(x.q, x.p);
}
const curR = () => S.rounds[S.ri];
const curQ = () => S.phase === 'fq' ? S.final : curR().qs[S.qi];
function qBase(q) {
  let p = TYPE[q.t].pts;
  if (q.t === 'hint') p = 100 * Math.max(1, q.h.length - (S.hint - 1));
  if (S.open && styleOf(q) === 'buzz') p = Math.round(p / 2);
  return p;
}
const qMult = () => S.phase === 'fq' ? 1 : (curR().mult * (curR().ev || 1));
function ranks(teams) {
  const order = teams.map((t, i) => i).sort((a, b) => teams[b].score - teams[a].score);
  const rk = []; order.forEach((ti, k) => { rk[ti] = k > 0 && teams[order[k - 1]].score === teams[ti].score ? rk[order[k - 1]] : k + 1; });
  return rk;
}
const lastTeams = () => { const m = Math.min.apply(null, S.teams.map(t => t.score)); return S.teams.filter(t => t.score === m); };
const firstTeams = () => { const m = Math.max.apply(null, S.teams.map(t => t.score)); return S.teams.filter(t => t.score === m); };

/* ---------- 게임 화면 ---------- */
VIEWS.game = function () {
  if (!S) { UI.screen = 'lobby'; return VIEWS.lobby(); }
  const f = GV[S.phase] || GV.intro;
  return f();
};
const GV = {};
function gbar(label) {
  return '<header class="bar"><button class="ib" data-act="menu" aria-label="진행 메뉴">☰</button><div class="ttl">' + label + '</div>' + soundBtn() + '<button class="ib" data-act="fs" aria-label="전체 화면">⛶</button></header>';
}
function strip(mode) {
  const n = S.teams.length;
  let h = '<footer class="strip" style="--n:' + n + '">';
  S.teams.forEach((t, i) => {
    const on = S.picked.indexOf(i) >= 0, armed = S.armed.indexOf(i) >= 0, click = mode === 'pick1' || mode === 'pickN';
    h += '<div class="tm' + (on ? ' on' : '') + (click ? ' click pickmode' : '') + '" data-i="' + i + '" style="--tc:' + t.color + '"' + (click ? ' role="button" tabindex="0" aria-pressed="' + on + '" data-act="pick" data-arg="' + i + '"' : '') + '>';
    h += '<span class="tk">' + (i + 1) + '</span><span class="te-e">' + t.emoji + '</span><span class="tx"><span class="tn">' + esc(t.name) + '</span><span class="ts" data-score="' + i + '">' + fmt(t.score) + '</span></span>';
    if (t.streak >= 2) h += '<span class="tf">🔥' + t.streak + '연속</span>';
    if (mode === 'arm' && (t.items.double > 0 || armed)) h += '<button class="dbl' + (armed ? ' on' : '') + '" data-act="arm" data-arg="' + i + '" aria-pressed="' + armed + '">' + (armed ? '🔥2배 ON' : '🔥2배') + '</button>';
    if (on) h += '<span class="ok">✓</span>';
    h += '</div>';
  });
  return h + '</footer>';
}

GV.intro = function () {
  const r = curR(), last = S.ri === S.rounds.length - 1;
  const styles = {}; r.qs.forEach(q => { styles[styleOf(q)] = 1; });
  let h = gbar('<b>ROUND ' + (S.ri + 1) + '</b> / ' + S.rounds.length);
  h += '<main class="stage"><div class="intro">';
  h += '<div class="rn disp">ROUND ' + (S.ri + 1) + (last && S.rounds.length > 1 ? ' · 마지막' : '') + '</div><div class="ri">' + esc(r.icon) + '</div><div class="rt disp">' + esc(r.name) + '</div>';
  if (r.desc) h += '<div class="rd">' + esc(r.desc) + '</div>';
  h += '<div class="chips"><span class="chip">📝 ' + r.qs.length + '문제</span>';
  if (styles.all) h += '<span class="chip">🙌 모든 팀 동시</span>';
  if (styles.buzz) h += '<span class="chip">📣 먼저 외치기</span>';
  const m = r.mult * (r.ev || 1);
  if (m > 1) h += '<span class="chip hot">🔥 점수 ' + m + '배!</span>';
  h += '</div><button class="btn pri big" data-act="beginRound">시작 ▶ <kbd>Space</kbd></button>';
  h += '</div></main>' + strip('view');
  return { html: h, primary: () => doAct('beginRound'), after: () => { SFX.whoosh(); } };
};

function qContent(q, o) {
  // o: { rev, solo, chosen, hint, open, seq }
  const rev = o.rev, solo = o.solo;
  let h = '';
  const len = (q.q || '').length, sz = len > 64 ? ' l' : len > 36 ? ' m' : '';
  const optsHTML = () => {
    const show = q.opts && (q.t === 'mc' || q.t === 'blank' || solo || (o.open && !rev));
    if (!show) return '';
    let s = '<div class="opts">';
    q.opts.forEach((t, i) => {
      const st = rev ? (i === q.ai ? ' good' : (o.chosen === i ? ' bad' : ' dim')) : '';
      const inner = '<b class="on">' + (i + 1) + '</b><span>' + esc(t) + '</span>';
      s += solo && !rev ? '<button class="opt c' + i + '" data-act="soloAns" data-arg="' + i + '">' + inner + '</button>' : '<div class="opt c' + i + st + '">' + inner + '</div>';
    });
    return s + '</div>';
  };
  switch (q.t) {
    case 'ox': {
      h += '<div class="qq' + sz + '">' + esc(q.q) + '</div><div class="ox">';
      [true, false].forEach((v, i) => {
        const k = v ? 'o' : 'x', st = rev ? (q.a === v ? ' good' : (o.chosen === i ? ' bad' : ' dim')) : '';
        h += solo && !rev ? '<button class="oxb ' + k + '" data-act="soloAns" data-arg="' + i + '" aria-label="' + (v ? '맞다 O' : '아니다 X') + '">' + (v ? 'O' : 'X') + '</button>' : '<div class="oxb ' + k + st + '">' + (v ? 'O' : 'X') + '</div>';
      });
      h += '</div>'; break;
    }
    case 'mc': h += '<div class="qq' + sz + '">' + esc(q.q) + '</div>' + optsHTML(); break;
    case 'blank': {
      const parts = String(q.v || '').split('___');
      h += '<div class="verse">' + esc(parts[0]) + '<span class="blank' + (rev ? ' fill' : '') + '">' + (rev ? esc(q.a) : '＿＿＿') + '</span>' + esc(parts.slice(1).join('___')) + '</div>';
      if (q.ref) h += '<div class="vref">' + esc(q.ref) + '</div>';
      h += optsHTML(); break;
    }
    case 'cho': {
      h += '<div class="qhint">' + esc(q.q) + '</div><div class="cho">';
      Array.from(q.a).forEach((ch, i) => {
        h += ch === ' ' ? '<i class="gap"></i>' : '<span class="tile' + (rev ? ' toflip' : '') + '" style="--d:' + (i * 90) + 'ms"><b class="f">' + esc(q.cs[i]) + '</b><b class="b">' + esc(ch) + '</b></span>';
      });
      h += '</div>'; break;
    }
    case 'emoji': {
      h += '<div class="emo' + (!solo && (o.open || rev) ? ' sm' : '') + '" aria-label="이모지 문제">' + (q.eg || []).map((e, i) => '<span style="--d:' + (i * 140) + 'ms">' + esc(e) + '</span>').join('') + '</div>';
      h += '<div class="qhint">' + esc(q.q || '어떤 이야기일까요?') + '</div>';
      if (rev && !solo) h += '<div class="ans">' + esc(q.a) + '</div>';
      h += optsHTML(); break;
    }
    case 'hint': {
      const n = q.h.length;
      h += '<div class="hints">';
      q.h.forEach((t, i) => {
        const on = rev || i < o.hint;
        h += '<div class="hc' + (on ? ' on' : '') + (!rev && i === o.hint - 1 ? ' now new' : '') + '"><b>' + (i + 1) + '</b><span>' + (on ? esc(t) : '？') + '</span>' + (!on && !solo ? '<em>' + (100 * (n - i)) + '점</em>' : '') + '</div>';
      });
      h += '</div>';
      if (rev && !solo) h += '<div class="ans">' + esc(q.a) + '</div>';
      h += optsHTML(); break;
    }
    case 'order': {
      h += '<div class="qq m">' + esc(q.q || '순서대로 놓아 보세요') + '</div><div class="ord">';
      if (rev) q.items.forEach((it, k) => { const pos = q.sh.indexOf(k); h += '<div class="oc good" style="--d:' + (k * 160) + 'ms"><i>' + (k + 1) + '</i><b>' + LET[pos] + '</b><span>' + esc(it) + '</span></div>'; });
      else q.sh.forEach((k, pos) => {
        const si = (o.seq || []).indexOf(pos);
        h += solo ? '<button class="oc' + (si >= 0 ? ' sel' : '') + '" data-act="soloSeq" data-arg="' + pos + '">' + (si >= 0 ? '<i>' + (si + 1) + '</i>' : '') + '<b>' + LET[pos] + '</b><span>' + esc(q.items[k]) + '</span></button>' : '<div class="oc"><b>' + LET[pos] + '</b><span>' + esc(q.items[k]) + '</span></div>';
      });
      h += '</div>';
      if (rev) h += '<div class="oseq">' + q.items.map((_, k) => LET[q.sh.indexOf(k)]).join(' → ') + '</div>';
      break;
    }
    case 'open': default: {
      h += '<div class="qq' + sz + '">' + esc(q.q) + '</div>';
      if (rev && !solo) h += '<div class="ans">' + esc(q.a) + '</div>';
    }
  }
  return h;
}
function ansText(q) {
  switch (q.t) {
    case 'ox': return '정답: ' + (q.a ? 'O' : 'X');
    case 'mc': case 'blank': return q.opts ? '정답: ' + (q.ai + 1) + '번 ' + q.opts[q.ai] : '정답: ' + q.a;
    case 'order': return '정답: ' + q.items.map((_, k) => LET[q.sh.indexOf(k)]).join(' → ');
    default: return '정답: ' + q.a;
  }
}
function expHTML(q) {
  return '<div class="exp"><b>💡 ' + esc(ansText(q)) + '</b>' + (q.ex ? '<p>' + esc(q.ex) + '</p>' : '') + (q.ref && q.t !== 'blank' ? '<small>📖 ' + esc(q.ref) + '</small>' : '') + '</div>';
}

GV.q = function () {
  const r = curR(), q = curQ(), st = styleOf(q), fin = S.phase === 'fq';
  const m = qMult();
  const label = fin ? '<b>FINAL</b> 올인 베팅' : '<b>ROUND ' + (S.ri + 1) + '</b> ' + esc(r.icon + ' ' + r.name) + ' · ' + (S.qi + 1) + ' / ' + r.qs.length;
  let h = gbar(label) + '<main class="stage">';
  h += '<div class="qtop"><span class="badge ' + st + '">' + TYPE[q.t].label + ' · ' + (fin ? '모든 팀 종이에 답 쓰기!' : (st === 'buzz' && q.t === 'blank' ? '아는 팀은 먼저 외치기!' : TYPE[q.t].how)) + '</span>';
  if (!fin) {
    const base = qBase(q);
    h += '<span class="pts">' + (S.open && st === 'buzz' ? '<s>' + fmt(base * 2 * m) + '</s>' : '') + fmt(base * m) + '점</span>';
    if (m > 1) h += '<span class="mult">×' + m + '</span>';
  } else h += '<span class="pts">💰 건 만큼 얻거나 잃어요</span>';
  if (S.cfg.timer && !S.rev) h += timerHTML();
  h += '</div>';
  const ck = 'g' + S.ri + '-' + S.qi + '-' + S.phase, still = UI.cardKey === ck; UI.cardKey = ck;
  h += '<section class="card' + (still ? ' still' : '') + '"><span class="qpk">' + esc((q.pkIcon || '') + ' ' + (q.pkName || '')) + (q.lv ? ' · ' + ['', '쉬움', '보통', '도전'][q.lv] : '') + '</span>';
  h += qContent(q, { rev: S.rev, hint: S.hint, open: S.open });
  if (S.rev) h += expHTML(q);
  h += '</section><div class="ctrl">';
  let primary;
  if (!S.rev) {
    if (S.cfg.timer) h += '<button class="btn" data-act="pause">⏯ 타이머 <kbd>P</kbd></button>';
    if (q.t === 'hint' && S.hint < q.h.length) h += '<button class="btn" data-act="nextHint">💡 다음 힌트 <kbd>H</kbd></button>';
    if (st === 'buzz' && q.opts && !S.open && !fin) h += '<button class="btn" data-act="openOpts">👀 보기 열기 (점수 절반) <kbd>O</kbd></button>';
    h += '<button class="btn pri big" data-act="reveal">정답 공개 <kbd>Space</kbd></button>';
    if (!fin && S.cfg.items && S.teams.some(t => t.items.double > 0 || S.armed.length)) h += '<p class="say">🔥 <b>더블 카드</b>를 쓸 팀은 정답 공개 전에 아래 「🔥2배」를 누르세요</p>';
    primary = () => doAct('reveal');
  } else {
    const multi = st === 'all' || fin;
    h += '<p class="say">' + (multi ? '맞힌 팀을 <b>모두</b> 누르세요 (숫자키 1~' + S.teams.length + ')' : '맞힌 팀 <b>하나</b>를 누르세요 (숫자키)') + '</p>';
    if (fin) { h += '<button class="btn pri big" data-act="finalCommit">결과 발표 🥁 <kbd>Space</kbd></button>'; primary = () => doAct('finalCommit'); }
    else {
      h += '<button class="btn" data-act="nobody">아무도 못 맞힘</button><button class="btn pri big" data-act="commit">' + (S.picked.length ? '✓ 점수 주고 다음' : '다음 ▶') + ' <kbd>Space</kbd></button>';
      primary = () => doAct('commit');
    }
  }
  if (fin && S.bets) h += '<p class="say">💰 ' + S.teams.map((t, i) => t.emoji + ' ' + esc(t.name) + ' <b>' + fmt(S.bets[i]) + '</b>').join(' · ') + '</p>';
  h += '</div></main>' + strip(S.rev ? (st === 'all' || fin ? 'pickN' : 'pick1') : (fin ? 'view' : 'arm'));
  return { html: h, primary };
};
GV.fq = GV.q;

function beginQ() {
  S.rev = false; S.picked = []; S.armed = []; S.hint = 1; S.open = false;
  const q = curQ(); if (!q) return;
  if (q.id) markSeen(q.id);
  saveGame(); render(); SFX.pop(); qTimer();
}
function qTimer() {
  const q = curQ(), f = S.cfg.timer;
  if (!f || S.rev) { tStop(); return; }
  if (q.t === 'hint' && S.phase !== 'fq') {
    tStart(Math.round(TYPE.hint.time * f), () => {
      if (S.hint < q.h.length) { S.hint++; SFX.pop(); saveGame(); render(); qTimer(); }
      else timeUp();
    });
  } else tStart(Math.round(TYPE[q.t].time * f * (S.phase === 'fq' ? 1.6 : 1)), timeUp);
}
function timeUp() { SFX.end(); toast('⏰ 시간 끝! 답을 들어 볼까요?'); tDraw(); }

function reveal() {
  if (S.rev) return;
  tStop(); S.rev = true; saveGame(); render();
  const q = curQ();
  SFX.good();
  if (q.t === 'cho' || q.t === 'order') setTimeout(() => SFX.coin(), 300);
}
function commit() {
  const q = curQ(), st = styleOf(q), base = qBase(q), m = qMult();
  S.undo = JSON.stringify({ teams: S.teams, ri: S.ri, qi: S.qi, picked: S.picked, armed: S.armed, hint: S.hint, open: S.open, pb: S.prevBase || null, prb: S.prevRankBase || null, r1: S.rank1 || null });
  const pops = [];
  S.teams.forEach((t, i) => {
    const won = S.picked.indexOf(i) >= 0, dbl = S.armed.indexOf(i) >= 0;
    if (dbl) t.items.double = Math.max(0, t.items.double - 1);
    if (won) {
      const p = base * m * (dbl ? 2 : 1);
      t.streak++; t.correct++; if (t.streak > t.best) t.best = t.streak;
      const bonus = t.streak >= 3 && t.streak % 2 === 1 ? Math.min(300, 50 * (t.streak - 1)) : 0;
      t.score += p + bonus;
      pops.push([i, '+' + fmt(p + bonus), dbl ? '🔥 더블!' : bonus ? '🔥 ' + t.streak + '연속 보너스' : '']);
      if (bonus) setTimeout(() => banner('🔥 ' + t.name + ' ' + t.streak + '연속 정답! +' + bonus), 300);
    } else {
      if (st === 'all') t.streak = 0;
      if (dbl) pops.push([i, '🔥 아깝다!', '더블 카드 소멸', true]);
    }
  });
  const from = JSON.parse(S.undo).teams.map(t => t.score);
  nextQ();
  // 새 화면에서 점수 올라가는 모습
  S.teams.forEach((t, i) => countUp($('[data-score="' + i + '"]'), from[i], t.score));
  pops.forEach(p => popAt(p[0], p[1], p[2], p[3]));
  if (pops.some(p => !p[3])) SFX.coin();
}
function nextQ() {
  if (S.qi < curR().qs.length - 1) { S.qi++; beginQ(); return; }
  endRound();
}
function endRound() {
  tStop();
  S.prev = S.prevBase || S.teams.map(() => 0);
  S.prevRank = S.prevRankBase || null;
  S.prevBase = S.teams.map(t => t.score);
  S.prevRankBase = ranks(S.teams);
  if (S.ri === 0) S.rank1 = ranks(S.teams);
  S.phase = 'stand'; S.picked = []; saveGame(); render();
}
function undo() {
  if (!S || !S.undo) { toast('되돌릴 점수가 없어요'); return; }
  const u = JSON.parse(S.undo);
  S.teams = u.teams; S.ri = u.ri; S.qi = u.qi; S.picked = u.picked; S.armed = u.armed; S.hint = u.hint; S.open = u.open; S.prevBase = u.pb; S.prevRankBase = u.prb; S.rank1 = u.r1;
  S.phase = 'q'; S.rev = true; S.undo = null; tStop(); saveGame(); closeModal(); go('game'); toast('↩ 방금 준 점수를 되돌렸어요');
}

/* ---------- 라운드 끝 순위 ---------- */
GV.stand = function () {
  const rk = ranks(S.teams), order = S.teams.map((t, i) => i).sort((a, b) => rk[a] - rk[b] || a - b);
  const max = Math.max(1, Math.max.apply(null, S.teams.map(t => t.score)));
  const lastRound = S.ri === S.rounds.length - 1;
  const lead = order[0], second = order[1];
  const gap = S.teams[lead].score - (second != null ? S.teams[second].score : 0);
  let say;
  if (gap === 0) say = '😲 공동 1등! 아직 아무도 몰라요';
  else if (gap <= 200) say = '🔥 ' + S.teams[lead].name + ' 선두! 하지만 겨우 ' + fmt(gap) + '점 차';
  else say = '👑 ' + S.teams[lead].name + ' 독주 중! ' + fmt(gap) + '점 차 — 역전할 팀?';
  let h = gbar('<b>ROUND ' + (S.ri + 1) + '</b> 끝 · 순위');
  h += '<main class="stage"><div class="stand"><h1 class="disp">📊 ROUND ' + (S.ri + 1) + ' 결과</h1><p class="say">' + esc(say) + '</p>';
  order.forEach(i => {
    const t = S.teams[i], chg = S.prevRank ? S.prevRank[i] - rk[i] : 0;
    h += '<div class="sr r' + rk[i] + '" style="--tc:' + t.color + '"><span class="rk">' + rk[i] + '</span><span class="te-e" style="background:' + t.color + '">' + t.emoji + '</span><div class="mid"><div class="nm">' + esc(t.name) + (chg > 0 ? '<span class="chg up">▲' + chg + '</span>' : chg < 0 ? '<span class="chg dn">▼' + (-chg) + '</span>' : '') + (t.streak >= 2 ? '<span class="chg up">🔥' + t.streak + '</span>' : '') + '</div><div class="sbar"><i data-w="' + Math.max(2, Math.round(Math.max(0, t.score) / max * 100)) + '" style="width:' + Math.max(2, Math.round(Math.max(0, (S.prev ? S.prev[i] : 0)) / max * 100)) + '%"></i></div></div><span class="sc" data-stand="' + i + '">' + fmt(S.prev ? S.prev[i] : 0) + '</span>';
    if (S.cfg.items) {
      h += '<span class="its">';
      if (t.items.double > 0) h += '<span class="it badge-only" title="더블 카드">🔥×' + t.items.double + '</span>';
      if (t.items.shield > 0) h += '<span class="it badge-only" title="실드">🛡️</span>';
      if (t.items.steal > 0 && S.teams.length > 1) h += '<button class="it steal" data-act="steal" data-arg="' + i + '">🦹 스틸</button>';
      h += '</span>';
    }
    h += '</div>';
  });
  const nextLabel = !lastRound ? (S.cfg.events && hasEventAfter(S.ri) ? '🎡 럭키 룰렛 ▶' : 'ROUND ' + (S.ri + 2) + ' ▶') : (S.final ? '💰 파이널 ▶' : '🏆 시상식 ▶');
  h += '<div class="ctrl">' + (S.undo ? '<button class="btn" data-act="undo">↩ 방금 점수 되돌리기</button>' : '') + '<button class="btn pri big" data-act="afterStand">' + nextLabel + ' <kbd>Space</kbd></button></div>';
  h += '</div></main>';
  return {
    html: h, primary: () => doAct('afterStand'), after: () => {
      requestAnimationFrame(() => requestAnimationFrame(() => $$('.sbar i').forEach(b => { b.style.width = b.dataset.w + '%'; })));
      S.teams.forEach((t, i) => countUp($('[data-stand="' + i + '"]'), S.prev ? S.prev[i] : 0, t.score, 1400));
      SFX.whoosh(); setTimeout(() => SFX.coin(), 900);
      S.prev = S.teams.map(t => t.score);
    }
  };
};
const hasEventAfter = ri => ri < S.rounds.length - 1 && ri % 2 === 1;
function afterStand() {
  if (S.cfg.events && hasEventAfter(S.ri)) { S.phase = 'event'; S.ev = null; saveGame(); render(); return; }
  nextRound();
}
function nextRound() {
  S.undo = null;
  if (S.ri < S.rounds.length - 1) { S.ri++; S.qi = 0; S.phase = 'intro'; saveGame(); render(); return; }
  if (S.final) { S.phase = 'bet'; S.bets = S.teams.map(() => 0); saveGame(); render(); return; }
  S.phase = 'awards'; saveGame(); render();
}
function stealFrom(i) {
  const t = S.teams[i];
  let h = '<h2>🦹 ' + esc(t.name) + '의 스틸!</h2><p>누구의 점수를 200점 훔칠까요? 🛡️실드가 있는 팀은 막아요.</p><div class="mlist">';
  S.teams.forEach((u, j) => { if (j !== i) h += '<button class="btn" data-act="stealGo" data-arg="' + i + ',' + j + '"><span style="font-size:22px">' + u.emoji + '</span> ' + esc(u.name) + ' · ' + fmt(u.score) + '점' + (u.items.shield > 0 ? ' · 🛡️' : '') + '</button>'; });
  h += '<button class="btn" data-act="closeModal">취소</button></div>';
  modal(h);
}
function stealGo(arg) {
  const [i, j] = arg.split(',').map(Number), a = S.teams[i], b = S.teams[j], from = scores();
  closeModal(); a.items.steal = 0;
  if (b.items.shield > 0) { b.items.shield = 0; SFX.bad(); banner('🛡️ ' + b.name + ' 실드로 막았다!'); }
  else { const amt = Math.max(0, Math.min(200, b.score)); b.score -= amt; a.score += amt; a.steals++; SFX.steal(); banner('🦹 ' + a.name + ' → ' + b.name + ' ' + fmt(amt) + '점 스틸!'); }
  S.prev = from; saveGame(); render();
}

/* ---------- 럭키 룰렛 ---------- */
const EVENTS = [
  { id: 'manna', icon: '🍞', name: '만나가 내려요', desc: '하늘에서 만나가 쏟아져요! 모든 팀 +100', kind: 'auto', run() { S.teams.forEach(t => { t.score += 100; }); return '모든 팀 +100점!'; } },
  { id: 'bless', icon: '🙏', name: '축복의 시간', desc: '옆 팀을 바라보며 "축복합니다~" 한 소절! 모든 팀 +100', kind: 'auto', run() { S.teams.forEach(t => { t.score += 100; }); return '서로 축복한 모든 팀 +100점!'; } },
  { id: 'jubilee', icon: '🎺', name: '희년의 나팔', desc: '빚이 사라지는 희년! 꼴찌 팀에게 역전의 기회 +300', kind: 'auto', run() { const ls = lastTeams(); ls.forEach(t => { t.score += 300; }); return ls.map(t => t.name).join(', ') + ' +300점!'; } },
  { id: 'barnabas', icon: '🤝', name: '바나바의 나눔', desc: '1등 팀이 꼴찌 팀에게 150점을 나눠 줘요 (🛡️실드로 지킬 수 있어요)', kind: 'auto', run() {
    const f = firstTeams()[0], l = lastTeams()[0];
    if (f === l) return '모두 같은 점수라 나눌 게 없어요 😅';
    if (f.items.shield > 0) { f.items.shield = 0; return '🛡️ ' + f.name + ' 실드로 지켰어요!'; }
    const amt = Math.min(150, Math.max(0, f.score)); f.score -= amt; l.score += amt; return f.name + ' → ' + l.name + ' ' + amt + '점 나눔 💛';
  } },
  { id: 'joseph', icon: '🌈', name: '요셉의 꿈', desc: '다음 라운드는 모든 점수 2배!', kind: 'auto', run() { const r = S.rounds[S.ri + 1]; if (r) r.ev = 2; return '다음 라운드 점수 2배!'; } },
  { id: 'box', icon: '🎁', name: '아이템 상자', desc: '모든 팀에게 🔥더블 카드 1장 선물!', kind: 'auto', items: true, run() { S.teams.forEach(t => { t.items.double++; }); return '모든 팀 🔥더블 +1장!'; } },
  { id: 'jericho', icon: '📣', name: '여리고 함성', desc: '5초 동안 팀 이름을 가장 크게 외친 팀 +200', kind: 'pick1', pts: 200, sec: 5 },
  { id: 'silence', icon: '🤫', name: '광야의 침묵', desc: '15초 동안 웃거나 말하면 탈락! 끝까지 버틴 팀 모두 +150', kind: 'pickN', pts: 150, sec: 15 },
  { id: 'salt', icon: '🧂', name: '소금 기둥', desc: '얼음! 10초 동안 소금 기둥처럼 꼼짝 마! 버틴 팀 모두 +150', kind: 'pickN', pts: 150, sec: 10 },
  { id: 'praise', icon: '🎤', name: '찬양 한 소절', desc: '팀마다 찬양 한 소절! 가장 은혜로운 팀 +200 (인도자 마음대로 💛)', kind: 'pick1', pts: 200 },
  { id: 'david', icon: '🪨', name: '다윗과 골리앗', desc: '꼴찌 팀 대표 vs 1등 팀 대표, 가위바위보 한 판! 꼴찌가 이기면 +300, 1등이 이기면 +100', kind: 'duel' },
  { id: 'flash', icon: '⚡', name: '번개 초성', desc: '초성 한 문제! 먼저 외쳐 맞힌 팀 +200', kind: 'flash', pts: 200 }
];
const SEG = ['#ff5470', '#3d8bff', '#ffb627', '#22c977', '#b86bff', '#ff8a3d', '#22b8c9', '#ff4fa0'];
function wheelSVG(evs) {
  const n = evs.length, R = 96, cx = 100, cy = 100;
  let s = '<svg viewBox="0 0 200 200" aria-hidden="true"><g id="wh">';
  evs.forEach((e, k) => {
    const a0 = k * 360 / n, a1 = (k + 1) * 360 / n, rad = a => (a - 90) * Math.PI / 180;
    const x0 = cx + R * Math.cos(rad(a0)), y0 = cy + R * Math.sin(rad(a0)), x1 = cx + R * Math.cos(rad(a1)), y1 = cy + R * Math.sin(rad(a1));
    s += '<path d="M' + cx + ',' + cy + ' L' + x0.toFixed(2) + ',' + y0.toFixed(2) + ' A' + R + ',' + R + ' 0 0,1 ' + x1.toFixed(2) + ',' + y1.toFixed(2) + ' Z" fill="' + SEG[k % SEG.length] + '" stroke="#090d22" stroke-width="1.5"/>';
    const am = rad((a0 + a1) / 2), tx = cx + R * 0.68 * Math.cos(am), ty = cy + R * 0.68 * Math.sin(am);
    s += '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" font-size="19" text-anchor="middle" dominant-baseline="central">' + e.icon + '</text>';
  });
  s += '<circle cx="100" cy="100" r="97" fill="none" stroke="#ffd23f" stroke-width="3"/></g></svg>';
  return s;
}
GV.event = function () {
  if (!S.ev) {
    const pool = EVENTS.filter(e => (!e.items || S.cfg.items) && (e.kind !== 'flash' || choPool().length));
    const evs = shuffle(pool).slice(0, 8);
    S.ev = { ids: evs.map(e => e.id), res: -1, done: false, msg: '', rot: 0 };
    saveGame();
  }
  const evs = S.ev.ids.map(id => EVENTS.find(e => e.id === id));
  let h = gbar('<b>🎡 럭키 룰렛</b>') + '<main class="stage"><div class="evwrap">';
  h += '<div class="wheel"><div class="ptr"></div>' + wheelSVG(evs) + '<div class="hub">🎡</div></div><div class="evside" id="evside">';
  let primary;
  if (S.ev.res < 0) {
    h += '<h1 class="disp">럭키 룰렛!</h1><p style="color:var(--ink2);font-size:clamp(15px,1.8vw,22px)">무엇이 나올까요? 꼴찌 팀에게 기회가 올 수도…!</p><button class="btn pri big" data-act="spin">🎡 돌리기 <kbd>Space</kbd></button>';
    primary = () => doAct('spin');
  } else {
    h += evPanel(evs[S.ev.res]);
    primary = S.ev.done ? () => doAct('nextRound') : null;
  }
  h += '</div></div></main>' + strip(S.ev.res >= 0 && !S.ev.done ? evMode(evs[S.ev.res]) : 'view');
  return { html: h, primary, after: () => { const g = $('#wh'); if (g) { g.style.transformOrigin = '100px 100px'; g.style.transform = 'rotate(' + S.ev.rot + 'deg)'; } } };
};
function evMode(e) { return e.kind === 'pick1' || e.kind === 'flash' ? 'pick1' : e.kind === 'pickN' ? 'pickN' : 'view'; }
function evPanel(e) {
  let h = '<div class="evcard"><div class="ei">' + e.icon + '</div><b>' + esc(e.name) + '</b><p>' + esc(e.desc) + '</p>';
  if (S.ev.done) h += '<div class="res">' + esc(S.ev.msg) + '</div>';
  h += '</div>';
  if (S.ev.done) return h + '<button class="btn pri big" data-act="nextRound">다음 라운드 ▶ <kbd>Space</kbd></button>';
  if (e.kind === 'auto') return h + '<button class="btn pri big" data-act="evAuto">받기! 🎉</button>';
  if (e.kind === 'duel') {
    const f = firstTeams()[0], l = lastTeams()[0];
    if (f === l) return h + '<p style="color:var(--ink2)">모두 같은 점수예요 — 모든 팀 +100!</p><button class="btn pri big" data-act="evDuel" data-arg="tie">받기 🎉</button>';
    return h + '<p style="color:var(--ink2)">' + l.emoji + ' ' + esc(l.name) + ' (꼴찌) vs ' + f.emoji + ' ' + esc(f.name) + ' (1등)</p><div class="row c"><button class="btn big" data-act="evDuel" data-arg="low">🪨 ' + esc(l.name) + ' 승리!</button><button class="btn big" data-act="evDuel" data-arg="top">🛡️ ' + esc(f.name) + ' 승리</button></div>';
  }
  if (e.kind === 'flash') {
    const q = S.ev.q;
    h = '<div class="evcard"><div class="ei">⚡</div><b>번개 초성</b><p>' + esc(q.q) + '</p><div class="cho" style="margin-top:10px">' + Array.from(q.a).map((ch, i) => ch === ' ' ? '<i class="gap"></i>' : '<span class="tile' + (S.ev.show ? ' toflip' : '') + '" style="--d:' + (i * 90) + 'ms;width:clamp(48px,7vw,84px)"><b class="f" style="font-size:clamp(28px,4.4vw,56px)">' + esc(q.cs[i]) + '</b><b class="b" style="font-size:clamp(28px,4.4vw,56px)">' + esc(ch) + '</b></span>').join('') + '</div></div>';
    h += '<div class="row c">' + (S.ev.show ? '' : '<button class="btn" data-act="evShow">정답 보기</button>') + '<button class="btn pri big" data-act="evPick">✓ 맞힌 팀 +' + e.pts + '</button></div><p style="color:var(--ink3)">맞힌 팀을 아래에서 누르세요</p>';
    return h;
  }
  if (e.sec) h += '<div class="bigtime" id="evtime">' + e.sec + '</div><button class="btn" data-act="evTimer" data-arg="' + e.sec + '">⏱ ' + e.sec + '초 시작</button>';
  h += '<p style="color:var(--ink3)">' + (e.kind === 'pick1' ? '이긴 팀 하나를 아래에서 누르세요' : '성공한 팀을 모두 아래에서 누르세요') + '</p><button class="btn pri big" data-act="evPick">✓ +' + e.pts + ' 주기</button>';
  return h;
}
function choPool() { const p = builtin().find(x => x.id === 'cho'); return p ? p.q.filter(q => q.t === 'cho') : []; }
function spin() {
  if (S.ev.res >= 0 || S.ev.spinning) return;
  const n = S.ev.ids.length, k = Math.floor(Math.random() * n), seg = 360 / n;
  const target = 360 * 6 + (360 - (k * seg + seg / 2)) + (Math.random() - 0.5) * seg * 0.6;
  const g = $('#wh'), btn = $('[data-act="spin"]'); if (btn) btn.disabled = true;
  S.ev.spinning = true;
  const from = S.ev.rot % 360, dur = REDUCED ? 300 : 4600, t0 = performance.now();
  let lastSeg = -1;
  (function f(t) {
    const x = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - x, 4), rot = from + (target - from) * e;
    if (g) g.style.transform = 'rotate(' + rot + 'deg)';
    const sg = Math.floor(rot / seg); if (sg !== lastSeg) { lastSeg = sg; SFX.spin(); }
    if (x < 1) requestAnimationFrame(f);
    else {
      S.ev.rot = target; S.ev.res = k; S.ev.spinning = false;
      const ev = EVENTS.find(e2 => e2.id === S.ev.ids[k]);
      if (ev.kind === 'flash') { const q = pick(choPool()); S.ev.q = prep(q, builtin().find(p => p.id === 'cho')); }
      S.picked = []; saveGame(); SFX.fanfare(); render();
    }
  })(t0);
}
function evFinish(msg, from) {
  S.ev.done = true; S.ev.msg = msg; S.picked = []; saveGame(); render();
  S.teams.forEach((t, i) => { if (from[i] !== t.score) { countUp($('[data-score="' + i + '"]'), from[i], t.score); popAt(i, (t.score > from[i] ? '+' : '') + fmt(t.score - from[i]), '', t.score < from[i]); } });
  SFX.coin();
}
const scores = () => S.teams.map(t => t.score);

/* ---------- 파이널 베팅 ---------- */
const maxBet = t => Math.max(200, t.score);
GV.bet = function () {
  let h = gbar('<b>💰 FINAL</b> 올인 베팅') + '<main class="stage"><div class="stand"><h1 class="disp">💰 파이널 올인 베팅</h1><p class="say">마지막 한 문제! 맞히면 건 만큼 얻고, 틀리면 건 만큼 잃어요 · 점수가 적은 팀도 200점까지</p><div class="bets">';
  S.teams.forEach((t, i) => {
    const b = S.bets[i];
    h += '<div class="br" style="--tc:' + t.color + '"><span class="te-e" style="background:' + t.color + ';width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px">' + t.emoji + '</span><span class="nm">' + esc(t.name) + '<small>지금 ' + fmt(t.score) + '점 · 최대 ' + fmt(maxBet(t)) + '</small></span><span class="bt">';
    [['0', 0], ['¼', 0.25], ['½', 0.5], ['올인', 1]].forEach(([l, k]) => { h += '<button class="btn sm' + (b === Math.round(maxBet(t) * k / 10) * 10 ? ' pri' : '') + '" data-act="bet" data-arg="' + i + ',' + k + '">' + l + '</button>'; });
    h += '<button class="btn sm" data-act="betStep" data-arg="' + i + ',-50">−50</button><button class="btn sm" data-act="betStep" data-arg="' + i + ',50">+50</button></span><span class="bv">' + fmt(b) + '</span></div>';
  });
  h += '</div><div class="ctrl"><button class="btn pri big" data-act="betDone">베팅 확정 → 문제 보기 ▶ <kbd>Space</kbd></button></div></div></main>';
  return { html: h, primary: () => doAct('betDone') };
};
function finalCommit() {
  if (S.finDone) return; S.finDone = 1;
  const from = scores();
  SFX.roll(1.8);
  const ok = S.picked.slice();
  setTimeout(() => {
    S.teams.forEach((t, i) => { const b = S.bets[i]; if (ok.indexOf(i) >= 0) { t.score += b; t.correct++; } else t.score -= b; });
    S.fromFinal = from; S.phase = 'awards'; S.picked = []; saveGame(); render();
  }, REDUCED ? 0 : 1900);
  toast('🥁 두구두구두구…', 1900);
}

/* ---------- 시상식 ---------- */
GV.awards = function () {
  const rk = ranks(S.teams), order = S.teams.map((t, i) => i).sort((a, b) => rk[a] - rk[b] || a - b);
  const top = order.slice(0, 3), rest = order.slice(3);
  let h = gbar('<b>🏆 시상식</b>') + '<main class="stage"><div class="aw"><h1 class="disp">🏆 ' + esc(S.teams[order[0]].name) + ' 우승!</h1>';
  h += '<div class="podium">';
  [top[1], top[0], top[2]].forEach(i => {
    if (i == null) return;
    const t = S.teams[i], r = rk[i];
    h += '<div class="pod p' + r + '" style="--tc:' + t.color + '"><span class="pe">' + (r === 1 ? '👑' : '') + t.emoji + '</span><span class="pn">' + esc(t.name) + '</span><span class="ps">' + fmt(t.score) + '</span><div class="blk">' + r + '</div></div>';
  });
  h += '</div>';
  if (rest.length) h += '<div class="others">' + rest.map(i => '<span class="chip">' + rk[i] + '등 ' + S.teams[i].emoji + ' ' + esc(S.teams[i].name) + ' · ' + fmt(S.teams[i].score) + '</span>').join('') + '</div>';
  // 특별상
  const aw = [];
  const best = Math.max.apply(null, S.teams.map(t => t.best));
  if (best >= 3) aw.push(['🔥 콤보왕', S.teams.filter(t => t.best === best).map(t => t.name).join(', '), best + '연속 정답']);
  const cor = Math.max.apply(null, S.teams.map(t => t.correct));
  if (cor > 0) aw.push(['🎯 정답왕', S.teams.filter(t => t.correct === cor).map(t => t.name).join(', '), cor + '문제 맞힘']);
  if (S.rank1) { let bi = -1, bv = 0; S.teams.forEach((t, i) => { const d = S.rank1[i] - rk[i]; if (d > bv) { bv = d; bi = i; } }); if (bi >= 0) aw.push(['🚀 대역전상', S.teams[bi].name, '첫 라운드 ' + S.rank1[bi] + '등 → ' + rk[bi] + '등']); }
  const st = Math.max.apply(null, S.teams.map(t => t.steals));
  if (st > 0) aw.push(['🦹 대도상', S.teams.filter(t => t.steals === st).map(t => t.name).join(', '), '스틸 성공']);
  if (aw.length) h += '<div class="awl">' + aw.map(a => '<div class="awi"><b>' + a[0] + ' · ' + esc(a[1]) + '</b><small>' + esc(a[2]) + '</small></div>').join('') + '</div>';
  h += '<div class="ctrl"><button class="btn" data-act="home">처음 화면</button><button class="btn pri big" data-act="again">🔁 같은 팀으로 한 판 더</button></div></div></main>';
  return { html: h, after: () => { tStop(); SFX.fanfare(); setTimeout(() => confetti(5000), 1200); } };
};

/* ---------- 진행 메뉴 ---------- */
function gameMenu() {
  let h = '<h2>☰ 진행 메뉴</h2><div class="mlist">';
  h += '<button class="btn" data-act="editScores">✏️ 점수 고치기</button>';
  if (S.undo) h += '<button class="btn" data-act="undo">↩ 방금 준 점수 되돌리기</button>';
  if (S.phase === 'q') h += '<button class="btn" data-act="skipQ">⏭ 이 문제 건너뛰기</button><button class="btn" data-act="endRoundNow">⏩ 이 라운드 바로 끝내기</button>';
  if (S.phase !== 'awards') h += '<button class="btn" data-act="toAwards">🏁 바로 시상식으로</button>';
  h += '<button class="btn" data-act="help">📋 진행 방법 보기</button><button class="btn" data-act="home">🏠 처음 화면 (게임은 저장돼요)</button><button class="btn" data-act="closeModal">닫기</button></div>';
  modal(h);
}
function editScores() {
  let h = '<h2>✏️ 점수 고치기</h2><div class="mlist">';
  S.teams.forEach((t, i) => {
    h += '<div class="row" style="background:rgba(255,255,255,.05);border-radius:14px;padding:8px 10px"><span style="font-size:24px">' + t.emoji + '</span><b style="flex:1;min-width:0">' + esc(t.name) + '</b><b class="disp" style="font-size:24px;min-width:3em;text-align:right" id="es' + i + '">' + fmt(t.score) + '</b>';
    [-100, -10, 10, 100].forEach(d => { h += '<button class="btn sm" data-act="adj" data-arg="' + i + ',' + d + '">' + (d > 0 ? '+' : '−') + Math.abs(d) + '</button>'; });
    h += '</div>';
  });
  h += '<button class="btn pri" data-act="closeRender">다 고쳤어요</button></div>';
  modal(h);
}

/* ===========================================================
   혼자 도전
   =========================================================== */
const SOLO_TYPES = ['ox', 'mc', 'blank', 'emoji', 'hint', 'order', 'cho', 'open'];
function soloOK(q) { if (SOLO_TYPES.indexOf(q.t) < 0) return false; if (q.t === 'blank') return !!(q.o && q.o.length >= 2); return true; }
VIEWS.solo = function () {
  if (!SO) return soloHome();
  if (SO.over) return soloResult();
  const q = SO.qs[SO.i];
  let h = '<header class="bar"><button class="ib" data-act="soloQuit" aria-label="그만하기">✕</button><div class="ttl"><b>' + esc(SO.title) + '</b></div>' + soundBtn() + '</header><main class="stage"><div class="solo">';
  h += '<div class="shud"><span class="lv" aria-label="남은 목숨 ' + SO.lives + '">' + '❤️'.repeat(SO.lives) + '<span style="opacity:.25">' + '🤍'.repeat(3 - SO.lives) + '</span></span><span class="pg">' + (SO.i + 1) + ' / ' + SO.qs.length + '</span>' + (SO.combo >= 2 ? '<span class="cb">🔥 ' + SO.combo + '콤보</span>' : '') + '<span class="sc" id="ssc">' + fmt(SO.score) + '</span></div>';
  if (!SO.rev) h += timerHTML();
  const ck = 's' + SO.i + '-' + q.id, still = UI.cardKey === ck; UI.cardKey = ck;
  h += '<section class="card' + (still ? ' still' : '') + '" style="margin-top:10px">' + qContent(q, { rev: SO.rev, solo: true, chosen: SO.chosen, hint: SO.hint, seq: SO.seq });
  if (!SO.rev && (q.t === 'cho' || q.t === 'open' || (q.t === 'emoji' && !q.opts) || (q.t === 'hint' && !q.opts))) h += '<form class="typein" data-form="soloType"><input id="tin" autocomplete="off" placeholder="정답 입력" aria-label="정답 입력" enterkeyhint="done"><button class="btn pri" type="submit">확인</button></form><div class="row c"><button class="btn sm" data-act="soloPass">모르겠어요 😅</button></div>';
  if (!SO.rev && q.t === 'order') h += '<div class="row c"><button class="btn sm" data-act="soloSeqClear">다시 고르기</button><span style="color:var(--ink3);font-size:14px">맨 처음 것부터 차례로 누르세요</span></div>';
  if (SO.rev) {
    h += SO.gain > 0 ? '<div class="gain">+' + fmt(SO.gain) + '<small>' + esc(SO.gainNote || '') + '</small></div>' : '<div class="gain miss">' + (SO.timeout ? '⏰ 시간 끝!' : '💔 아쉬워요') + '<small>' + esc(ansText(q)) + '</small></div>';
    if (q.ex) h += '<p style="text-align:center;color:var(--ink2)">' + esc(q.ex) + (q.ref && q.t !== 'blank' ? ' <span style="color:var(--ink3)">(' + esc(q.ref) + ')</span>' : '') + '</p>';
    h += '<div class="row c"><button class="btn pri big" data-act="soloNext">' + (SO.lives <= 0 || SO.i >= SO.qs.length - 1 ? '결과 보기 ▶' : '다음 ▶') + '</button></div>';
  }
  h += '</section></div></main>';
  return { html: h, primary: SO.rev ? () => doAct('soloNext') : null, after: () => { const i = $('#tin'); if (i) i.focus(); } };
};
function soloHome() {
  const dd = store.get('quiz_daily', {}), best = store.get('quiz_best', {});
  let h = '<header class="bar"><button class="ib" data-act="home" aria-label="처음 화면">←</button><div class="ttl"><b>⚡ 혼자 도전</b></div>' + soundBtn() + '</header><main class="stage"><div class="setup" style="padding-bottom:30px">';
  h += '<h1 class="disp">⚡ 혼자 도전</h1><p class="lead">목숨 ❤️ 3개 · 빨리 맞힐수록, 연속으로 맞힐수록 점수가 커져요</p>';
  h += '<button class="mcard hot" data-act="soloDaily" style="width:100%;margin-top:14px"><span class="ic">📅</span><span><b>오늘의 도전 · ' + today().slice(5).replace('-', '월 ') + '일</b><small>오늘은 모두 같은 12문제! 친구와 점수를 겨뤄 보세요' + (dd.date === today() ? ' · 내 기록 ' + fmt(dd.score) + '점' : '') + '</small></span></button>';
  h += '<section class="sec"><h2>📚 팩 골라 도전 <small>10문제</small></h2><div class="slist">';
  allPacks().forEach(p => { const n = p.q.filter(soloOK).length; if (n < 3) return; h += '<button class="pk" data-act="soloPack" data-arg="' + esc(p.id) + '"><span class="pi">' + esc(p.icon || '❓') + '</span><span><b>' + esc(p.name) + '</b><small>' + (best[p.id] ? '최고 ' + fmt(best[p.id]) + '점' : n + '문제') + '</small></span></button>'; });
  h += '</div></section></div></main>';
  return { html: h };
}
function soloStart(kind, packId) {
  let qs = [], title;
  if (kind === 'daily') {
    const rng = rngFrom('daily:' + today()), per = {}, need = { 1: 4, 2: 5, 3: 3 };
    const pool = [];
    builtin().forEach(p => p.q.forEach(q => { if (soloOK(q)) pool.push({ p, q }); }));
    shuffle(pool, rng).forEach(x => {
      const lv = x.q.lv || 2;
      if (qs.length >= 12 || !need[lv] || (per[x.p.id] || 0) >= 2) return;
      need[lv]--; per[x.p.id] = (per[x.p.id] || 0) + 1; qs.push(prep(x.q, x.p, rng));
    });
    qs.sort((a, b) => (a.lv || 2) - (b.lv || 2));
    title = '오늘의 도전';
  } else {
    const p = packById(packId); if (!p) return;
    qs = shuffle(p.q.filter(soloOK)).slice(0, 10).map(q => prep(q, p)).sort((a, b) => (a.lv || 2) - (b.lv || 2));
    title = (p.icon || '') + ' ' + p.name;
  }
  if (!qs.length) { toast('문제가 없어요'); return; }
  SO = { kind, pack: packId || null, title, qs, i: 0, score: 0, lives: 3, combo: 0, max: 0, ok: 0, rev: false, over: false };
  UI.screen = 'solo'; soloQ(); SFX.go();
}
function soloQ() {
  SO.rev = false; SO.chosen = null; SO.seq = []; SO.hint = 1; SO.gain = 0; SO.timeout = false;
  const q = SO.qs[SO.i];
  render();
  const sec = TYPE[q.t].solo;
  if (q.t === 'hint') {
    const step = sec / q.h.length;
    tStart(sec, () => soloAnswer(false, true));
    const iv = SO.hintT = setInterval(() => {
      if (!SO || SO.rev || UI.screen !== 'solo') { clearInterval(iv); return; }
      if (!T.run) return;
      const want = Math.min(q.h.length, 1 + Math.floor((T.total - T.left) / step));
      if (want > SO.hint) { const tin = $('#tin'), tv = tin ? tin.value : ''; SO.hint = want; SFX.pop(); render(); if (tin && $('#tin')) $('#tin').value = tv; }
    }, 250);
  } else tStart(sec, () => soloAnswer(false, true));
}
function soloAnswer(correct, timeout) {
  if (SO.rev) return;
  clearInterval(SO.hintT); tStop();
  const q = SO.qs[SO.i];
  SO.rev = true; SO.timeout = !!timeout;
  if (correct) {
    SO.combo++; SO.ok++; if (SO.combo > SO.max) SO.max = SO.combo;
    const base = q.t === 'hint' ? 50 * (q.h.length + 1 - SO.hint) + 50 : 100;
    const mult = Math.min(2.5, 1 + 0.25 * Math.floor((SO.combo - 1) / 2));
    const tb = Math.round(T.left * 8);
    SO.gain = Math.round((base + tb) * mult);
    SO.gainNote = '정답! 시간 보너스 +' + tb + (mult > 1 ? ' · 🔥' + SO.combo + '콤보 ×' + mult : '');
    SO.score += SO.gain; SFX.good();
  } else { SO.combo = 0; SO.lives--; SFX.bad(); }
  render();
  if (correct) SO.autoT = setTimeout(() => { if (SO && SO.rev && UI.screen === 'solo') soloNext(); }, 2600);
}
function soloNext() {
  clearTimeout(SO.autoT);
  if (SO.lives <= 0 || SO.i >= SO.qs.length - 1) { soloEnd(); return; }
  SO.i++; soloQ();
}
function soloEnd() {
  SO.over = true; tStop();
  const best = store.get('quiz_best', {});
  SO.record = false;
  if (SO.kind === 'daily') { const dd = store.get('quiz_daily', {}); if (dd.date !== today() || SO.score > dd.score) { SO.record = dd.date === today(); store.set('quiz_daily', { date: today(), score: SO.score }); } }
  else if (SO.pack) { if (!best[SO.pack] || SO.score > best[SO.pack]) { SO.record = !!best[SO.pack]; best[SO.pack] = SO.score; store.set('quiz_best', best); } }
  render(); SFX.fanfare(); if (SO.ok / SO.qs.length >= 0.7) confetti(3500);
}
function soloRank() {
  const r = SO.ok / SO.qs.length;
  if (r >= 1) return ['👑', '말씀 마스터'];
  if (r >= 0.9) return ['🦅', '말씀 고수'];
  if (r >= 0.7) return ['⚔️', '말씀 용사'];
  if (r >= 0.4) return ['🧭', '말씀 탐험가'];
  return ['🌱', '말씀 새싹'];
}
function soloResult() {
  const [ic, title] = soloRank();
  let h = '<header class="bar"><button class="ib" data-act="soloHomeBtn" aria-label="혼자 도전 처음">←</button><div class="ttl"><b>' + esc(SO.title) + '</b> 결과</div>' + soundBtn() + '</header><main class="stage"><div class="res">';
  h += '<div class="rank">' + ic + '</div><h1 class="disp">' + title + '</h1><div class="score" id="sbig">0</div>';
  if (SO.record) h += '<div class="rec">🎉 내 최고 기록 경신!</div>';
  h += '<div class="stats"><div><b>' + SO.ok + '/' + SO.qs.length + '</b><small>맞힌 문제</small></div><div><b>🔥' + SO.max + '</b><small>최대 콤보</small></div><div><b>' + '❤️'.repeat(Math.max(0, SO.lives)) + (SO.lives <= 0 ? '💔' : '') + '</b><small>남은 목숨</small></div></div>';
  h += '<div class="row c"><button class="btn pri big" data-act="soloShare">📤 친구에게 자랑하기</button></div><div class="row c"><button class="btn" data-act="soloAgain">🔁 다시 도전</button><button class="btn" data-act="soloHomeBtn">다른 도전</button><button class="btn" data-act="home">처음 화면</button></div>';
  h += '</div></main>';
  return { html: h, after: () => countUp($('#sbig'), 0, SO.score, 1400) };
}
function soloShare() {
  const [ic, title] = soloRank();
  const url = /github\.io$/.test(location.hostname) ? location.origin + location.pathname + '?solo=1' : 'https://ryussuny.github.io/dongsan-church/quiz.html?solo=1';
  const text = '⚡ 동산 퀴즈 배틀 ' + SO.title + '\n' + ic + ' ' + title + ' · ' + fmt(SO.score) + '점 (' + SO.qs.length + '문제 중 ' + SO.ok + '개, 최대 ' + SO.max + '콤보)\n너도 도전해 봐! 👉 ' + url;
  const copy = () => { if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => toast('복사했어요! 카톡에 붙여 넣으세요 📋'), () => toast(text, 6000)); else toast(text, 6000); };
  if (navigator.share) navigator.share({ title: '동산 퀴즈 배틀', text }).catch(e => { if (!e || e.name !== 'AbortError') copy(); });
  else copy();
}
function soloCheckTyped(v) {
  const q = SO.qs[SO.i], n = norm(v);
  if (!n) return;
  const ok = [q.a].concat(q.alt || []).some(a => norm(a) === n);
  soloAnswer(ok);
}

/* ===========================================================
   문제 만들기 (한 줄 형식)
   =========================================================== */
const KIND = { 'ox': 'ox', 'o/x': 'ox', '4지': 'mc', '사지': 'mc', '객관식': 'mc', 'mc': 'mc', '초성': 'cho', '이모지': 'emoji', 'emoji': 'emoji', '순서': 'order', '누구': 'hint', '힌트': 'hint', '누구일까요': 'hint', '빈칸': 'blank', '주관식': 'open', '단답': 'open' };
const isRef = s => /^[가-힣]+\s*\d+\s*:\s*\d+/.test(s || '');
function parseLines(text) {
  const qs = [], errs = [];
  let last = null;
  String(text || '').split(/\r?\n/).forEach((raw, n) => {
    const s = raw.trim(), ln = n + 1;
    if (!s || s[0] === '#') return;
    if (s[0] === '>') { if (last) { const t = s.slice(1).trim(); const m = t.match(/\(([가-힣]+\s*\d+\s*:\s*\d+(?:\s*-\s*\d+)?)\)\s*$/); last.ex = t; if (m && !last.ref) last.ref = m[1]; } else errs.push([ln, '풀이(>) 앞에 문제가 있어야 해요']); return; }
    const f = s.split('|').map(x => x.trim());
    const k = KIND[f[0].toLowerCase().replace(/\s/g, '')];
    const bad = msg => { errs.push([ln, msg]); last = null; };
    if (!k) return bad('맨 앞에 OX · 4지 · 초성 · 이모지 · 순서 · 누구 · 빈칸 · 주관식 중 하나를 써 주세요');
    let q = null;
    if (k === 'ox') {
      if (!f[1] || !f[2]) return bad('OX | 문장 | O 또는 X');
      const a = f[2].toUpperCase(); if (['O', 'X', '맞다', '틀리다', '○', '×'].indexOf(a) < 0) return bad('정답 칸에 O 또는 X');
      q = { t: 'ox', q: f[1], a: a === 'O' || a === '맞다' || a === '○' };
    } else if (k === 'mc') {
      const o = f.slice(2).filter(Boolean); if (!f[1] || o.length < 2 || o.length > 4) return bad('4지 | 질문 | *정답 | 오답 | 오답 | 오답  (보기 2~4개)');
      let a = o.findIndex(x => x[0] === '*'); if (a < 0) a = 0;
      q = { t: 'mc', q: f[1], o: o.map(x => x.replace(/^\*/, '').trim()), a };
    } else if (k === 'cho') {
      if (!f[1] || !f[2] || !/^[가-힣 ]+$/.test(f[2])) return bad('초성 | 힌트 | 정답(한글)');
      q = { t: 'cho', q: f[1], a: f[2] };
    } else if (k === 'emoji') {
      if (!f[1] || !f[2]) return bad('이모지 | 🐋🙏 | 정답 | (오답 | 오답 | 오답)');
      q = { t: 'emoji', e: f[1], q: '어떤 이야기일까요?', a: f[2] };
      const w = f.slice(3).filter(Boolean); if (w.length >= 1) q.o = [f[2]].concat(w.slice(0, 3));
    } else if (k === 'order') {
      const it = f.slice(2).filter(Boolean); if (!f[1] || it.length < 3 || it.length > 5) return bad('순서 | 질문 | 첫째 | 둘째 | 셋째 | (넷째)  (3~5개)');
      q = { t: 'order', q: f[1], items: it };
    } else if (k === 'hint') {
      const hs = f.slice(2).filter(Boolean); if (!f[1] || hs.length < 2 || hs.length > 5) return bad('누구 | 정답 | 힌트1 | 힌트2 | 힌트3 | 힌트4  (힌트 2~5개)');
      q = { t: 'hint', a: f[1], h: hs };
    } else if (k === 'blank') {
      if (!f[1] || f[1].indexOf('___') < 0 || !f[2]) return bad('빈칸 | 문장(빈칸 자리에 ___) | 정답 | (오답 | 오답 | 오답) | (장절)');
      let rest = f.slice(3).filter(Boolean), ref = '';
      if (rest.length && isRef(rest[rest.length - 1])) ref = rest.pop();
      q = { t: 'blank', v: f[1], a: f[2] }; if (ref) q.ref = ref;
      if (rest.length >= 1) q.o = [f[2]].concat(rest.slice(0, 3));
    } else if (k === 'open') {
      if (!f[1] || !f[2]) return bad('주관식 | 질문 | 정답');
      q = { t: 'open', q: f[1], a: f[2] };
    }
    qs.push(q); last = q;
  });
  return { qs, errs };
}
function toLine(q) {
  const ex = q.ex ? '\n> ' + q.ex : '';
  switch (q.t) {
    case 'ox': return 'OX | ' + q.q + ' | ' + (q.a ? 'O' : 'X') + ex;
    case 'mc': return '4지 | ' + q.q + ' | ' + q.o.map((o, i) => (i === q.a ? '*' : '') + o).join(' | ') + ex;
    case 'cho': return '초성 | ' + q.q + ' | ' + q.a + ex;
    case 'emoji': return '이모지 | ' + q.e + ' | ' + q.a + (q.o ? ' | ' + q.o.filter(o => norm(o) !== norm(q.a)).join(' | ') : '') + ex;
    case 'order': return '순서 | ' + q.q + ' | ' + q.items.join(' | ') + ex;
    case 'hint': return '누구 | ' + q.a + ' | ' + q.h.join(' | ') + ex;
    case 'blank': return '빈칸 | ' + q.v + ' | ' + q.a + (q.o ? ' | ' + q.o.filter(o => norm(o) !== norm(q.a)).join(' | ') : '') + (q.ref ? ' | ' + q.ref : '') + ex;
    default: return '주관식 | ' + q.q + ' | ' + q.a + ex;
  }
}
const SAMPLE = '# 한 줄에 한 문제 · 칸은 | 로 나눠요 · # 으로 시작하면 메모\n# 문제 다음 줄에 > 로 풀이를 달 수 있어요\nOX | 요나는 큰 물고기 뱃속에 사흘 밤낮 있었다 | O\n> 요나 1:17 — 밤낮 삼 일!\n4지 | 예수님이 첫 번째 표적을 행하신 곳은? | *가나의 혼인 잔치 | 베데스다 연못 | 갈릴리 바다 | 여리고 성\n초성 | 구약 인물 · 물맷돌로 골리앗을 이김 | 다윗\n이모지 | 🐋🙏🏙️ | 요나 | 노아 | 모세 | 다니엘\n순서 | 일어난 순서대로! | 노아의 방주 | 바벨탑 | 아브라함의 부르심 | 요셉이 애굽 총리가 됨\n누구 | 삭개오 | 여리고에 살았어요 | 세리장이었어요 | 키가 작았어요 | 뽕나무에 올라갔어요\n주관식 | 우리 교회 청년부 수련회 주제는? | 빛과 소금\n';
VIEWS.edit = function () {
  const cs = customs();
  const e = UI.edit;
  let h = '<header class="bar"><button class="ib" data-act="' + (e ? 'editList' : 'home') + '" aria-label="뒤로">←</button><div class="ttl"><b>✏️ 문제 만들기</b></div></header><main class="stage"><div class="ed">';
  if (!e) {
    h += '<h1 class="disp">✏️ 우리 모임 문제</h1><p class="lead">설교 본문, 수련회 주제, 우리끼리만 아는 이야기로 문제 팩을 만들어요. 이 기기에만 저장되고, 파일로 다른 인도자와 주고받을 수 있어요.</p>';
    h += '<div class="row" style="margin-top:14px"><button class="btn pri" data-act="editNew">＋ 새 문제 팩</button><button class="btn" data-act="editImport">📂 파일 불러오기</button><input type="file" id="impf" accept=".json,application/json" hidden></div>';
    if (!cs.length) h += '<p class="emsg" style="margin-top:18px">아직 만든 팩이 없어요. 「＋ 새 문제 팩」을 눌러 보세요.</p>';
    cs.forEach(p => { h += '<div class="eitem"><span class="pi">' + esc(p.icon || '⭐') + '</span><div><b>' + esc(p.name) + '</b><small>' + p.q.length + '문제' + (p.desc ? ' · ' + esc(p.desc) : '') + '</small></div><button class="btn sm" data-act="editOpen" data-arg="' + esc(p.id) + '">고치기</button><button class="btn sm" data-act="editExport" data-arg="' + esc(p.id) + '">💾 파일</button><button class="btn sm" data-act="editDel" data-arg="' + esc(p.id) + '">지우기</button></div>'; });
  } else {
    h += '<h1 class="disp">' + (e.id ? '팩 고치기' : '새 문제 팩') + '</h1>';
    h += '<section class="sec"><div class="fld"><label>아이콘<input class="inp" id="eIcon" value="' + esc(e.icon) + '" maxlength="4" style="width:80px;text-align:center;font-size:24px"></label><label style="flex:1;min-width:200px">팩 이름<input class="inp" id="eName" value="' + esc(e.name) + '" maxlength="20" placeholder="예: 요나서 설교 퀴즈"></label><label style="flex:2;min-width:220px">한 줄 설명<input class="inp" id="eDesc" value="' + esc(e.desc) + '" maxlength="30" placeholder="예: 11월 둘째 주 설교"></label></div></section>';
    h += '<section class="sec"><h2>문제 <small><button class="btn sm" data-act="aiOpen">🤖 AI로 초안 만들기</button></small></h2><textarea class="src" id="eSrc" spellcheck="false" aria-label="문제 입력">' + esc(e.src) + '</textarea><div class="emsg" id="eMsg"></div></section>';
    h += '<section class="sec"><h2>📐 쓰는 법</h2><div class="fmt"><code>OX | 문장 | O</code> · <code>4지 | 질문 | *정답 | 오답 | 오답 | 오답</code> (정답 앞에 *, 보기는 섞여 나와요)<br><code>초성 | 힌트 | 정답</code> · <code>이모지 | 🐋🙏 | 정답 | 오답 | 오답 | 오답</code> (오답은 빼도 돼요)<br><code>순서 | 질문 | 첫째 | 둘째 | 셋째 | 넷째</code> · <code>누구 | 정답 | 어려운 힌트 | … | 쉬운 힌트</code><br><code>빈칸 | 문장(빈칸은 ___) | 정답 | 오답 | 오답 | 오답 | 장절</code> · <code>주관식 | 질문 | 정답</code><br>문제 다음 줄 <code>&gt; 풀이</code> · <code># 메모</code></div></section>';
    h += '<div class="row"><button class="btn pri big" data-act="editSave">💾 저장</button><button class="btn" data-act="editTry">▶ 혼자 풀어 보기</button><button class="btn" data-act="editList">취소</button></div>';
  }
  h += '</div></main>';
  return { html: h, after: () => { const s = $('#eSrc'); if (s) { s.addEventListener('input', editCheck); editCheck(); } const f = $('#impf'); if (f) f.addEventListener('change', editImportFile); } };
};
function editCheck() {
  const r = parseLines($('#eSrc').value), m = $('#eMsg'); if (!m) return;
  const cnt = {}; r.qs.forEach(q => { cnt[q.t] = (cnt[q.t] || 0) + 1; });
  let s = '✓ <b>' + r.qs.length + '문제</b>' + (r.qs.length ? ' (' + Object.keys(cnt).map(k => TYPE[k].label.replace(/^\S+\s/, '') + ' ' + cnt[k]).join(' · ') + ')' : '');
  if (r.errs.length) s += '<br>' + r.errs.slice(0, 6).map(e => '<span class="er">✗ ' + e[0] + '번째 줄: ' + esc(e[1]) + '</span>').join('<br>') + (r.errs.length > 6 ? '<br><span class="er">… 외 ' + (r.errs.length - 6) + '줄</span>' : '');
  m.innerHTML = s;
}
function editRead() { const e = UI.edit; e.icon = ($('#eIcon').value || '⭐').trim(); e.name = $('#eName').value.trim(); e.desc = $('#eDesc').value.trim(); e.src = $('#eSrc').value; return e; }
function editSave(silent) {
  const e = editRead(), r = parseLines(e.src);
  if (!e.name) { toast('팩 이름을 적어 주세요'); $('#eName').focus(); return null; }
  if (!r.qs.length) { toast('문제가 하나도 없어요'); return null; }
  const cs = customs(), id = e.id || ('my-' + Date.now().toString(36));
  const pack = { id, name: e.name, icon: e.icon || '⭐', desc: e.desc, q: r.qs, src: e.src };
  const k = cs.findIndex(p => p.id === id); if (k >= 0) cs[k] = pack; else cs.push(pack);
  if (!store.set('quiz_custom', cs)) { toast('저장 공간이 부족해요'); return null; }
  e.id = id;
  if (!silent) { toast('💾 저장했어요 — 팀 대항전 「문제 팩」에 ⭐로 나와요'); UI.edit = null; render(); }
  return pack;
}
function editImportFile(ev) {
  const f = ev.target.files && ev.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      let d = JSON.parse(rd.result); if (!Array.isArray(d)) d = d.packs || [d];
      const cs = customs(); let n = 0;
      d.forEach(p => {
        if (!p || !p.name || !Array.isArray(p.q)) return;
        const src = p.src || p.q.map(toLine).join('\n'), r = parseLines(src);
        if (!r.qs.length) return;
        cs.push({ id: 'my-' + Date.now().toString(36) + n, name: String(p.name).slice(0, 20), icon: String(p.icon || '⭐').slice(0, 4), desc: String(p.desc || '').slice(0, 30), q: r.qs, src }); n++;
      });
      store.set('quiz_custom', cs); toast(n ? '📂 ' + n + '개 팩을 불러왔어요' : '불러올 문제가 없어요'); render();
    } catch (e) { toast('파일을 읽지 못했어요 (퀴즈 배틀 파일인지 확인해 주세요)'); }
  };
  rd.readAsText(f);
}
function editExport(id) {
  const p = customs().find(x => x.id === id); if (!p) return;
  const blob = new Blob([JSON.stringify({ app: 'dongsan-quiz', v: 1, packs: [{ name: p.name, icon: p.icon, desc: p.desc, src: p.src, q: p.q }] }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '퀴즈배틀-' + p.name.replace(/[\\/:*?"<>|\s]+/g, '_') + '.json';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* ---------- AI 초안 (교회 관리자 앱과 같은 키 — 이 기기에만) ---------- */
const AI_MODEL = 'claude-opus-5-5';
const aiKey = () => { try { return String(JSON.parse(localStorage.getItem(P + 'apiKey') || '""') || '').trim(); } catch (e) { return ''; } };
const AI_RULES = '너는 교회 중고등부·청년부 퀴즈 작가다. 아래 줄 형식으로만 답한다. 머리말·번호·빈 설명 없이 문제 줄과 풀이 줄만 쓴다.\n' +
  '형식 (칸은 | 로 나눔):\nOX | 문장 | O 또는 X\n4지 | 질문 | *정답 | 오답 | 오답 | 오답   (정답 앞에 * 하나)\n초성 | 분류 · 짧은 힌트 | 정답(한글만, 2~8글자)\n이모지 | 이모지 3~6개 | 정답 | 오답 | 오답 | 오답\n순서 | 무엇을 순서대로? | 첫째 | 둘째 | 셋째 | 넷째\n누구 | 정답 | 아주 어려운 힌트 | 힌트 | 쉬운 힌트 | 거의 정답인 힌트\n' +
  '각 문제 바로 다음 줄에 "> 한 문장 풀이 (근거가 성경이면 끝에 (책이름 장:절))".\n' +
  '규칙: 성경 이름·지명·용어는 개역개정 표기. 확실한 사실만 쓴다. 성경 구절을 따옴표로 인용하지 않고, 빈칸 문제는 쓰지 않는다. 말투는 가볍고 재치 있게, 청소년이 "아!" 할 문제로. 쉬운 것부터 어려운 것 순서. 논쟁적 교리·정치·실존 연예인·브랜드는 쓰지 않는다. 사람 이름(교인)은 넣지 않는다.';
function aiOpen() {
  const has = !!aiKey();
  let h = '<h2>🤖 AI로 문제 초안 만들기</h2><p>주제를 적으면 AI 가 문제 초안을 써서 아래 칸에 붙여 줘요. <b>진행 전에 꼭 한 번 읽고 고쳐 주세요.</b></p><div class="mlist">';
  if (!has) h += '<label style="font-size:13px;color:var(--ink3);font-weight:700">Claude API 키 (교회 관리자 앱과 같은 키 · 이 기기에만 저장)<input class="inp" id="aiKey" placeholder="sk-ant-..." style="width:100%;margin-top:4px"></label>';
  h += '<label style="font-size:13px;color:var(--ink3);font-weight:700">주제<input class="inp" id="aiTopic" placeholder="예: 요나서 1~4장 / 수련회 주제 「빛과 소금」 / 다윗의 생애" style="width:100%;margin-top:4px"></label>';
  h += '<div class="row"><select class="inp" id="aiWho"><option>중고등부</option><option>청년부</option><option>중고등부·청년부 섞어서</option></select><select class="inp" id="aiN"><option value="10">10문제</option><option value="15" selected>15문제</option><option value="20">20문제</option></select></div>';
  h += '<div class="row"><button class="btn pri" data-act="aiGo">만들기 ✨</button><button class="btn" data-act="closeModal">닫기</button></div><p class="emsg" id="aiMsg"></p></div>';
  modal(h);
}
async function aiGo() {
  const kIn = $('#aiKey');
  if (kIn) { const v = kIn.value.trim(); if (!/^sk-/.test(v)) { toast('sk- 로 시작하는 키를 넣어 주세요'); return; } store.set('apiKey', v); }
  const topic = $('#aiTopic').value.trim(); if (!topic) { toast('주제를 적어 주세요'); return; }
  const who = $('#aiWho').value, n = $('#aiN').value, msg = $('#aiMsg'), btn = $('[data-act="aiGo"]');
  btn.disabled = true; msg.textContent = '✨ 문제를 쓰는 중… (30초~1분)';
  const user = '주제: ' + topic + '\n대상: ' + who + '\n문제 수: ' + n + '개. OX·4지·초성·이모지·순서·누구를 골고루 섞되 4지와 OX 를 가장 많이.';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': aiKey(), 'anthropic-version': '2023-06-01', 'anthropic-beta': 'server-side-fallback-2026-07-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: AI_MODEL, max_tokens: 8000, stream: true, system: AI_RULES, messages: [{ role: 'user', content: user }], output_config: { effort: 'medium' }, fallbacks: 'default' })
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      throw new Error(r.status === 401 ? 'API 키가 맞지 않아요' : r.status === 429 || r.status === 529 ? 'AI 가 지금 붐벼요. 잠시 뒤 다시 눌러 주세요' : (d.error && d.error.message) || ('AI 연결 오류 (' + r.status + ')'));
    }
    const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '', text = '';
    for (;;) {
      const { value, done } = await rd.read(); if (done) break;
      buf += dec.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
        const data = chunk.split('\n').filter(l => l.indexOf('data:') === 0).map(l => l.slice(5).trim()).join('');
        if (!data) continue;
        let ev; try { ev = JSON.parse(data); } catch (e) { continue; }
        if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') { text += ev.delta.text; msg.textContent = '✨ ' + text.split('\n').filter(l => l.indexOf('|') > 0).length + '문제째 쓰는 중…'; }
        else if (ev.type === 'error') throw new Error((ev.error && ev.error.message) || 'AI 오류');
      }
    }
    const lines = text.split('\n').map(l => l.trim()).filter(l => l && (l.indexOf('|') > 0 || l[0] === '>'));
    const src = $('#eSrc');
    src.value = (src.value.trim() ? src.value.replace(/\s+$/, '') + '\n\n' : '') + '# 🤖 AI 초안: ' + topic + ' — 진행 전에 꼭 읽고 고쳐 주세요\n' + lines.join('\n') + '\n';
    if (!$('#eName').value.trim()) $('#eName').value = topic.slice(0, 20);
    editCheck(); closeModal(); toast('✨ 초안을 붙였어요. 한 번 읽어 보고 저장하세요');
  } catch (e) { msg.textContent = '😢 ' + e.message; btn.disabled = false; }
}

/* ---------- 진행 방법 ---------- */
VIEWS.help = function () {
  let h = '<header class="bar"><button class="ib" data-act="' + (S && S.phase !== 'awards' && UI.back === 'game' ? 'resume' : 'home') + '" aria-label="뒤로">←</button><div class="ttl"><b>📋 진행 방법</b></div></header><main class="stage"><div class="help">';
  h += '<h1 class="disp">📋 진행 방법</h1><p>인도자 한 사람이 노트북·태블릿을 빔이나 TV 에 연결해 진행해요. 참가자는 팀으로 앉아 말·손·종이로 답해요. 서버도 로그인도 필요 없어요.</p>';
  h += '<h2>🙌 두 가지 답하기</h2><ul><li><b>모든 팀 동시</b> (OX · 4지선다 · 말씀 빈칸 · 순서): 시간이 끝나면 "하나 둘 셋!" 하고 모든 팀이 동시에 답을 들어요. OX 는 팔로 ⭕·❌, 4지는 손가락 1~4, 순서는 종이에 「CADB」처럼. 맞힌 팀을 <b>모두</b> 눌러요.</li><li><b>먼저 외치기</b> (초성 · 이모지 · 누구일까요): 아는 팀이 손을 들고 외쳐요. 인도자가 ⏯ 로 타이머를 멈추고, 맞으면 정답 공개 후 그 팀을 눌러요. 틀리면 다시 ⏯ — 그 팀은 이번 문제 기회 끝! 「👀 보기 열기」를 누르면 쉬워지는 대신 점수가 절반.</li><li><b>누구일까요?</b>: 힌트가 하나씩 열려요. 첫 힌트에 맞히면 400점, 마지막 힌트면 100점.</li></ul>';
  h += '<h2>🎁 아이템 · 보너스</h2><ul><li>🔥 <b>더블</b>: 정답 공개 전에 누르면 그 문제 점수 2배. 틀려도 점수는 안 깎이지만 카드는 사라져요.</li><li>🦹 <b>스틸</b>: 라운드 결과 화면에서, 다른 팀 점수 200점을 가져와요.</li><li>🛡️ <b>실드</b>: 스틸이나 「바나바의 나눔」을 한 번 막아 줘요.</li><li>🔥 <b>연속 정답</b>: 3·5·7연속이면 보너스 +100·+200·+300 (그 뒤로도 홀수 연속마다 +300).</li><li>🎡 <b>럭키 룰렛</b>: 두 라운드마다. 꼴찌 팀 역전 기회가 숨어 있어요.</li><li>💰 <b>파이널 올인 베팅</b>: 마지막 한 문제에 점수를 걸어요. 꼴찌도 200점까지 걸 수 있어요.</li></ul>';
  h += '<h2>⌨️ 단축키 (노트북·발표용 리모컨)</h2><ul><li><kbd>Space</kbd> <kbd>Enter</kbd> <kbd>→</kbd> <kbd>PageDown</kbd>: 다음 (정답 공개 · 점수 주기)</li><li><kbd>1</kbd>~<kbd>6</kbd>: 정답 공개 후 맞힌 팀 고르기</li><li><kbd>P</kbd> 타이머 멈춤 · <kbd>H</kbd> 다음 힌트 · <kbd>O</kbd> 보기 열기 · <kbd>Z</kbd> 방금 점수 되돌리기 · <kbd>F</kbd> 전체 화면 · <kbd>M</kbd> 소리</li></ul>';
  h += '<h2>💡 인도 꿀팁</h2><ul><li>팀은 4~6명이 좋아요. 학년을 섞으면 중1도 고3도 함께 웃어요.</li><li>순서 문제용으로 팀마다 A4 종이와 매직을 하나씩.</li><li>정답 뒤 풀이를 한 줄 읽어 주면 퀴즈가 말씀 공부가 돼요.</li><li>틀린 팀에게도 박수! 꼴찌 팀은 룰렛·베팅으로 언제든 역전할 수 있어요.</li><li>게임은 자동 저장돼요. 창을 닫아도 「이어 하기」로 계속할 수 있어요.</li><li>휴대폰 하나로 「혼자 도전」을 하면 집에서도 연습할 수 있어요. 「오늘의 도전」은 날마다 모두 같은 문제예요.</li></ul>';
  h += '</div></main>';
  return { html: h };
};

/* ===========================================================
   동작
   =========================================================== */
const A = {
  home() { closeModal(); tStop(); SO = null; UI.edit = null; go('lobby'); },
  fs: fullscreen,
  sound() { SFX.on = !SFX.on; store.set('quiz_sound', SFX.on); $$('[data-act="sound"]').forEach(b => { b.textContent = SFX.on ? '🔊' : '🔇'; }); if (SFX.on) SFX.pop(); },
  help() { closeModal(); UI.back = UI.screen; tStop(); go('help'); },
  setup() { SET = newSet(); go('setup'); },
  resume() { S = store.get('quiz_game', null); if (!S) return go('lobby'); closeModal(); go('game'); if (S.phase === 'q' || S.phase === 'fq') { if (!S.rev) qTimer(); } },
  dropGame() { ask('하던 게임을 지울까요?', '지우기', () => { store.del('quiz_game'); S = null; render(); }); },
  askYes() { const f = askFn; askFn = null; closeModal(); if (f) f(); },
  setN(n) { readTeams(); SET.cfg.n = +n; render(); },
  setPer(n) { readTeams(); SET.cfg.per = +n; render(); },
  setTimer(v) { readTeams(); SET.cfg.timer = +v; render(); },
  toggleCfg(k) { readTeams(); SET.cfg[k] = !SET.cfg[k]; render(); },
  togglePack(id) { readTeams(); const p = SET.cfg.packs, k = p.indexOf(id); if (k >= 0) p.splice(k, 1); else p.push(id); render(); },
  recommend() { readTeams(); SET.cfg.packs = recommend(); render(); SFX.pop(); },
  clearPacks() { readTeams(); SET.cfg.packs = []; render(); },
  cycleEmoji(i) { readTeams(); const t = SET.teams[+i]; t.emoji = EMOJIS[(EMOJIS.indexOf(t.emoji) + 1) % EMOJIS.length]; render(); SFX.pop(); },
  rollName(i) { readTeams(); const used = {}; SET.teams.forEach(t => { used[t.name] = 1; }); SET.teams[+i].name = freshName(used); render(); SFX.pop(); },
  rollNames() { const used = {}; SET.teams.forEach(t => { t.name = freshName(used); }); render(); SFX.pop(); },
  start() { readTeams(); startGame(); },
  menu() { gameMenu(); },
  closeModal,
  closeRender() { closeModal(); saveGame(); render(); },
  beginRound() { S.phase = 'q'; S.qi = 0; beginQ(); },
  reveal,
  pause() { tToggle(); },
  nextHint() { const q = curQ(); if (q.t !== 'hint' || S.rev || S.hint >= q.h.length) return; S.hint++; SFX.pop(); saveGame(); render(); qTimer(); },
  openOpts() { const q = curQ(); if (S.rev || !q.opts || styleOf(q) !== 'buzz') return; S.open = true; SFX.pop(); saveGame(); render(); },
  arm(i) { i = +i; const k = S.armed.indexOf(i); if (k >= 0) S.armed.splice(k, 1); else if (S.teams[i].items.double > 0) { S.armed.push(i); SFX.pop(); } saveGame(); refreshStrip('arm'); },
  pick(i) {
    i = +i; if (i >= S.teams.length) return;
    let mode;
    if (S.phase === 'event') { const ev = EVENTS.find(e => e.id === S.ev.ids[S.ev.res]); mode = evMode(ev); }
    else mode = styleOf(curQ()) === 'all' || S.phase === 'fq' ? 'pickN' : 'pick1';
    const k = S.picked.indexOf(i);
    if (k >= 0) S.picked.splice(k, 1); else { if (mode === 'pick1') S.picked = []; S.picked.push(i); SFX.pop(); }
    saveGame(); refreshStrip(mode);
    const b = $('[data-act="commit"]'); if (b) b.innerHTML = (S.picked.length ? '✓ 점수 주고 다음' : '다음 ▶') + ' <kbd>Space</kbd>';
  },
  nobody() { S.picked = []; commit(); },
  commit,
  undo,
  afterStand,
  nextRound,
  steal(i) { stealFrom(+i); },
  stealGo,
  spin,
  evAuto() { const from = scores(), ev = EVENTS.find(e => e.id === S.ev.ids[S.ev.res]); evFinish(ev.run(), from); },
  evDuel(w) {
    const from = scores(), f = firstTeams()[0], l = lastTeams()[0];
    let msg;
    if (w === 'tie') { S.teams.forEach(t => { t.score += 100; }); msg = '모든 팀 +100점!'; }
    else if (w === 'low') { l.score += 300; msg = '🪨 다윗의 승리! ' + l.name + ' +300점'; }
    else { f.score += 100; msg = '🛡️ ' + f.name + ' +100점'; }
    evFinish(msg, from);
  },
  evPick() {
    const ev = EVENTS.find(e => e.id === S.ev.ids[S.ev.res]);
    if (!S.picked.length) { toast('점수 받을 팀을 아래에서 눌러 주세요'); return; }
    const from = scores(); S.picked.forEach(i => { S.teams[i].score += ev.pts; });
    evFinish(S.picked.map(i => S.teams[i].name).join(', ') + ' +' + ev.pts + '점!', from);
  },
  evShow() { S.ev.show = true; saveGame(); render(); SFX.good(); },
  evTimer(sec) {
    let left = +sec; const el = $('#evtime'), b = $('[data-act="evTimer"]'); if (b) b.disabled = true;
    SFX.go();
    const iv = setInterval(() => { left--; if (el) el.textContent = left; if (left > 0) SFX.tick(); if (left <= 0) { clearInterval(iv); SFX.end(); if (el) el.textContent = '끝!'; } }, 1000);
  },
  bet(arg) { const [i, k] = arg.split(',').map(Number); S.bets[i] = Math.round(maxBet(S.teams[i]) * k / 10) * 10; SFX.pop(); saveGame(); render(); },
  betStep(arg) { const [i, d] = arg.split(',').map(Number); S.bets[i] = clamp(S.bets[i] + d, 0, maxBet(S.teams[i])); saveGame(); render(); },
  betDone() { if (!S.final) { S.phase = 'awards'; saveGame(); render(); return; } S.phase = 'fq'; banner('💰 FINAL QUESTION'); beginQ(); },
  finalCommit,
  again() { const keep = S.teams.map(t => ({ name: t.name, emoji: t.emoji })); SET = newSet(); keep.forEach((t, i) => { SET.teams[i] = t; }); SET.cfg.n = keep.length; startGame(); },
  editScores,
  adj(arg) { const [i, d] = arg.split(',').map(Number); S.teams[i].score += d; const e = $('#es' + i); if (e) e.textContent = fmt(S.teams[i].score); saveGame(); },
  skipQ() { closeModal(); tStop(); nextQ(); },
  endRoundNow() { closeModal(); endRound(); },
  toAwards() { ask('지금 바로 시상식으로 갈까요?', '시상식으로', () => { tStop(); S.phase = 'awards'; saveGame(); render(); }); },
  // 혼자 도전
  soloHome() { SO = null; go('solo'); },
  soloHomeBtn() { SO = null; tStop(); go('solo'); },
  soloDaily() { soloStart('daily'); },
  soloPack(id) { soloStart('pack', id); },
  soloAgain() { const k = SO.kind, p = SO.pack; soloStart(k, p); },
  soloQuit() {
    const quit = () => { if (!SO) return; clearInterval(SO.hintT); clearTimeout(SO.autoT); tStop(); SO = null; go('solo'); };
    if (SO.over) quit(); else ask('그만할까요? 지금까지 점수는 저장되지 않아요', '그만하기', quit);
  },
  soloAns(i) { const q = SO.qs[SO.i]; i = +i; SO.chosen = i; soloAnswer(q.t === 'ox' ? (i === 0) === q.a : i === q.ai); },
  soloSeq(pos) {
    pos = +pos; if (SO.seq.indexOf(pos) >= 0) return;
    SO.seq.push(pos); SFX.pop();
    const q = SO.qs[SO.i];
    if (SO.seq.length === q.items.length) { const ok = SO.seq.every((p, k) => q.sh[p] === k); soloAnswer(ok); }
    else render();
  },
  soloSeqClear() { SO.seq = []; render(); },
  soloPass() { soloAnswer(false); },
  soloNext,
  soloShare,
  // 문제 만들기
  edit() { UI.edit = null; go('edit'); },
  editList() { UI.edit = null; render(); },
  editNew() { UI.edit = { id: null, icon: '⭐', name: '', desc: '', src: SAMPLE }; render(); },
  editOpen(id) { const p = customs().find(x => x.id === id); if (!p) return; UI.edit = { id: p.id, icon: p.icon, name: p.name, desc: p.desc || '', src: p.src || p.q.map(toLine).join('\n') }; render(); },
  editDel(id) { const p = customs().find(x => x.id === id); if (!p) return; ask('「' + p.name + '」 팩을 지울까요?', '지우기', () => { store.set('quiz_custom', customs().filter(x => x.id !== id)); render(); }); },
  editSave() { editSave(false); },
  editTry() { const p = editSave(true); if (!p) return; UI.edit = null; soloStart('pack', p.id); },
  editExport,
  editImport() { const f = $('#impf'); if (f) f.click(); },
  aiOpen,
  aiGo
};
function doAct(name, arg, el) { const f = A[name]; if (f) f(arg, el); }
function readTeams() { if (!SET) return; $$('input[data-team]').forEach(inp => { const i = +inp.dataset.team; if (SET.teams[i]) SET.teams[i].name = inp.value; }); }
function refreshStrip(mode) {
  const old = $('.strip'); if (!old) return;
  const tmp = document.createElement('div'); tmp.innerHTML = strip(mode); old.replaceWith(tmp.firstChild);
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  if (b.tagName === 'A') return;
  e.preventDefault(); SFX.ac();
  doAct(b.dataset.act, b.dataset.arg, b);
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  if (f.dataset.form === 'soloType') soloCheckTyped($('#tin').value);
});
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (e.key === 'Escape') { closeModal(); return; }
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.metaKey || e.ctrlKey || e.altKey) return;
  if ($('#ov')) return;
  const k = e.key;
  if (k === 'Enter' && e.target.closest && e.target.closest('[data-act]') && e.target.closest('[data-act]').tagName !== 'BUTTON') { e.preventDefault(); e.target.closest('[data-act]').click(); return; }
  if (k === ' ' || k === 'Enter' || k === 'ArrowRight' || k === 'PageDown') {
    if ((k === 'Enter' || k === ' ') && tag === 'button') return;   // 버튼에 초점이 있으면 그 버튼이 눌린다
    if (ACT.primary) { e.preventDefault(); SFX.ac(); ACT.primary(); }
    return;
  }
  if (k === 'f' || k === 'F') { fullscreen(); return; }
  if (k === 'm' || k === 'M') { A.sound(); return; }
  if (UI.screen !== 'game' || !S) return;
  if (/^[1-6]$/.test(k)) {
    const i = +k - 1;
    if (((S.phase === 'q' || S.phase === 'fq') && S.rev) || (S.phase === 'event' && S.ev && S.ev.res >= 0 && !S.ev.done)) A.pick(i);
    return;
  }
  if ((k === 'p' || k === 'P') && (S.phase === 'q' || S.phase === 'fq') && !S.rev) A.pause();
  if ((k === 'h' || k === 'H') && S.phase === 'q') A.nextHint();
  if ((k === 'o' || k === 'O') && S.phase === 'q') A.openOpts();
  if ((k === 'z' || k === 'Z') && S.undo) A.undo();
});
window.addEventListener('beforeunload', saveGame);

/* ---------- 시작 ---------- */
(function boot() {
  const qs = new URLSearchParams(location.search);
  S = store.get('quiz_game', null);
  if (S && (!S.teams || !S.rounds)) S = null;
  if (qs.get('solo') === '1' || location.hash === '#solo') {
    const p = qs.get('pack');
    if (p && packById(p)) { soloStart('pack', p); return; }
    UI.screen = 'solo'; render(); return;
  }
  render();
})();

/* 점검 스크립트(scripts/quiz-check.js)가 쓰는 창 */
window.QuizBattle = { parseLines, toLine, choseong, prep, TYPE, styleOf, soloOK, state: () => ({ S, SO, UI }) };
})();

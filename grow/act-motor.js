/* ===========================================================
   함께 자라요 — 손놀이 (작업치료: 소근육·시각-운동 통합·눈손 협응·양손 협응)

     trace    선 따라 그리기   시각-운동 통합   (선 긋기 발달 순서 세로→가로→원→+→네모→세모)
     dots     점 잇기         눈손 협응·차례로 훑어보기
     pop      풍선 터뜨리기    움직이는 목표 겨냥 (3단계는 Go/No-Go 참기, 4·5단계는 규칙 바꾸기)
     sort     색깔 나누기      누른 채 끌어 옮기기 · 색 → 범주 분류
     tilt     공 굴리기        두 손으로 기기 잡고 기울기 조절 (양측 협응·힘 조절)
     scratch  쓱쓱 지우기      손가락 끝으로 꾹 눌러 오래 문지르기
     puzzle   모양 맞추기      형태 지각·끌어 맞추기 (모양 맞추기 상자)

   ▸ 아이 화면에는 실패가 없다 — 길을 벗어나도 그림이 지워지지 않고, 어긋난 조각은
     제자리로 돌아가며 맞는 자리가 반짝인다. 오래 힘들면 자비스가 "같이 하자" 하고 마저 해 준다.
   ▸ 맞고 틀림·도움 받은 횟수는 ctx.trial / ctx.extra 로 부모 화면에만 남는다.
   ▸ 4단계(도전)·5단계(마스터)는 3단계를 다 익힌 아이를 위해 한 가지씩만 더 어렵게 한다
     (더 가는 길·점이 더 많은 그림·벽 하나 더·규칙 바꾸기·돌아간 조각 …). 칸(2·3칸)은 다음 단계를 미리 섞는다.
   ▸ 6~10단계(1년 사다리)도 단계마다 한 가지씩 — 초등 1~2학년(6·7) → 3학년 쪽(8·9) → 3학년이 애쓰면 하는 만큼(10).
     글자 쓰기·뛰어 세기·가나다·두 가지 규칙·차례 기억·별 모으기·문·공 두 개·창 순서·거울 모양·칠교 그림.
   ▸ 화면은 '손가락 하나로 짚고 끌기'까지. 연필 잡기·가위질 같은 손 힘은
     how·offline 에 적은 화면 밖 놀이(소금 쟁반, 집게, 스크래치 종이)로 이어 간다.
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;
if (!G || !D) return;

/* ---------- 함께 쓰는 작은 도구 ---------- */
var NUM = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열', '열하나', '열둘', '열셋', '열넷', '열다섯', '열여섯'];
var EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
var CRAYON = ['#ef5350', '#42a5f5', '#ab47bc', '#ff9800', '#26a69a', '#ec407a'];
var HELPER = '#5aa9ff';   /* 자비스가 같이 그려 줄 때의 색 */
function calm() { return !!G.settings.calm; }
function pace(ms) { return Math.round(ms * (calm() ? 1.35 : 1)); }
function hexA(hex, a) {
  var h = String(hex || '#1fb38f').replace('#', '');
  if (h.length === 3) h = h.replace(/./g, '$&$&');
  var n = parseInt(h, 16);
  return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
}
/* 이 놀이의 끝 단계 (지금은 10) — 끝 단계 2·3칸만 '살짝 더', 그 아래 단계 2·3칸은 다음 단계 미리 보기 */
function topLv(ctx) { return ctx.def.levels || 10; }
function areaHex(ctx) { return (G.AREAS[ctx.def.area] || {}).color || '#1fb38f'; }
function colorOf(id) { return D.COLORS.filter(function (c) { return c.id === id; })[0]; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
/* 화면 가운데 고정(translate -50%)인 것도 흔들 수 있게 rotate 로 흔든다 */
function wig(el) { if (!el) return; el.classList.remove('mt-wig'); void el.offsetWidth; el.classList.add('mt-wig'); }
function popEl(el) { if (!el) return; el.classList.remove('mt-pop'); void el.offsetWidth; el.classList.add('mt-pop'); }
/* 반짝 — 다 끝나면 class 를 떼어 원래 움직임(두근두근)으로 돌아가게 */
function hintEl(ctx, el) { if (!el) return; G.ui.hint(el); ctx.timeout(function () { el.classList.remove('hint'); }, 3100); }
/* 놀이 칸 위로 떠오르는 짧은 글 */
function floatText(box, text, x, y) {
  var f = G.el('<span class="mt-float"></span>'); f.textContent = text;
  var r = box.getBoundingClientRect();
  f.style.left = G.clamp(x - r.left, 60, Math.max(60, r.width - 60)) + 'px'; f.style.top = (y - r.top) + 'px';
  box.appendChild(f); setTimeout(function () { f.remove(); }, 1300);
}
/* 자비스 손가락(👆)이 길을 따라 보여 준다 — pts: 상자 안 좌표 [{x,y}] */
function ghost(ctx, box, pts, secs) {
  if (!pts.length) return;
  var g = G.el('<span class="mt-ghost" aria-hidden="true">👆</span>'); box.appendChild(g);
  var n = pts.length;
  g.style.left = pts[0].x + 'px'; g.style.top = pts[0].y + 'px';
  ctx.loop(function (dt, t) {
    if (!g.isConnected) return false;
    var k = G.clamp(t / secs, 0, 1), p = pts[Math.min(n - 1, Math.floor(k * (n - 1)))];   /* 첫 장면 시각이 시작보다 살짝 앞설 수 있어 0 밑은 0 으로 */
    g.style.left = p.x + 'px'; g.style.top = p.y + 'px';
    if (k >= 1) { g.remove(); return false; }
  });
}
/* 한동안 손이 안 움직이면 fn — 놀이 하나에 하나만 만들고, fn 은 바꿔 끼운다 */
function idler(ctx, ms, fn) {
  var api = {
    last: Date.now(), on: true, fn: fn, ms: ms,
    poke: function () { api.last = Date.now(); },
    stop: function () { api.on = false; },
    go: function () { api.on = true; api.last = Date.now(); }
  };
  ctx.interval(function () { if (api.on && api.fn && Date.now() - api.last > api.ms) { api.last = Date.now(); api.fn(); } }, 400);
  return api;
}
/* 끌어 옮기기 — 손을 떼면 o.drop(x,y) 가 true 면 그대로, 아니면 통 튀며 제자리로.
   살짝 눌렀다 떼면 o.tap() — 끌기가 어려운 아이는 '그림 누르고 → 자리 누르기'로도 할 수 있다. */
function liftDrag(ctx, el, o) {
  var on = false, pid = null, sx = 0, sy = 0, moved = false;
  el.style.touchAction = 'none';
  ctx.on(el, 'pointerdown', function (e) {
    if (on || el._placed || (o.can && !o.can())) return;
    e.preventDefault();
    on = true; pid = e.pointerId; moved = false; sx = e.clientX; sy = e.clientY;
    try { el.setPointerCapture(pid); } catch (er) {}
    el.classList.add('mt-lift'); G.sfx.play('tap'); G.buzz(8);
    if (o.start) o.start();
  });
  ctx.on(el, 'pointermove', function (e) {
    if (!on || e.pointerId !== pid) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (!moved && dx * dx + dy * dy > 64) moved = true;
    if (moved) { el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(1.1)'; if (o.move) o.move(e.clientX, e.clientY); }
  });
  function up(e) {
    if (!on || e.pointerId !== pid) return;
    on = false; el.classList.remove('mt-lift');
    var keep = false;
    if (moved) keep = !!o.drop(e.clientX, e.clientY);
    else if (o.tap) o.tap();
    if (!keep) {
      el.style.transition = 'transform .3s cubic-bezier(.3,1.5,.6,1)'; el.style.transform = '';
      setTimeout(function () { el.style.transition = ''; }, 320);
    }
  }
  ctx.on(el, 'pointerup', up); ctx.on(el, 'pointercancel', up);
}
/* 지금 보이는 자리에서 새 상자로 쓱 날아 들어가기 (FLIP) */
function flyInto(el, box, cls) {
  var a = el.getBoundingClientRect();
  el.style.transition = 'none'; el.style.transform = '';
  box.appendChild(el); if (cls) el.classList.add(cls);
  el._placed = true;
  var b = el.getBoundingClientRect();
  el.style.transformOrigin = '0 0';
  el.style.transform = 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' + (a.width / (b.width || 1)) + ',' + (a.height / (b.height || 1)) + ')';
  void el.offsetWidth;
  el.style.transition = 'transform .34s cubic-bezier(.3,1.25,.6,1)';
  el.style.transform = '';
  setTimeout(function () { el.style.transition = ''; el.style.transformOrigin = ''; }, 380);
}
/* 규칙이 바뀔 때 크게 알려 주기 */
function announce(ctx, box, e, t, s) {
  var a = G.el('<div class="mt-announce"><div class="ma-e">' + e + '</div><div class="ma-t">' + G.esc(t) + '</div>' + (s ? '<div class="ma-s">' + G.esc(s) + '</div>' : '') + '</div>');
  box.appendChild(a); G.sfx.play('up');
  return ctx.say(t + (s ? ' ' + s : '')).then(function () { return ctx.wait(pace(500)); }).then(function () { a.remove(); });
}

G.css('motor', `
.mt-wrap{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;position:relative}
.mt-board{position:relative;flex:1;min-height:260px;width:100%;border-radius:26px;background:var(--surface);box-shadow:var(--shadow);overflow:hidden;touch-action:none}
.mt-board .gcv,.sc-card .gcv,.tl-board .gcv{position:absolute;left:0;top:0;border-radius:0}
.mt-top{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;width:100%}
.mt-pill{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:4px 16px;border-radius:999px;background:var(--surface);box-shadow:var(--shadow);
  font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,22px);line-height:1.2}
.mt-pill b{font-weight:400;color:var(--area);font-size:1.15em}
.mt-float{position:absolute;z-index:20;pointer-events:none;transform:translate(-50%,-50%);font-family:Jua,sans-serif;font-size:clamp(18px,5vw,26px);
  color:var(--ink);background:var(--surface);padding:4px 12px;border-radius:999px;box-shadow:var(--shadow);white-space:nowrap;animation:mtUp 1.3s ease-out forwards}
@keyframes mtUp{0%{opacity:0;transform:translate(-50%,-30%) scale(.8)}15%{opacity:1;transform:translate(-50%,-60%) scale(1)}100%{opacity:0;transform:translate(-50%,-160%)}}
.mt-ghost{position:absolute;z-index:8;pointer-events:none;font-size:clamp(40px,11vw,56px);line-height:1;transform:translate(-38%,-6%);filter:drop-shadow(0 6px 6px rgba(0,0,0,.25));opacity:.92}
.mt-lift{z-index:40!important;filter:drop-shadow(0 14px 14px rgba(0,0,0,.25))}
.mt-wig{animation:mtWig .5s}
@keyframes mtWig{20%{rotate:-12deg}40%{rotate:12deg}60%{rotate:-7deg}80%{rotate:5deg}}
.mt-pop{animation:mtPop .55s}
@keyframes mtPop{40%{scale:1.35}}
.mt-announce{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:16px;
  background:color-mix(in srgb,var(--bg) 90%,transparent);border-radius:26px;animation:fade .3s}
.mt-announce .ma-e{font-size:clamp(70px,20vw,130px);line-height:1.1;animation:pop .6s}
.mt-announce .ma-t{font-family:Jua,sans-serif;font-size:clamp(24px,7vw,40px);line-height:1.3}
.mt-announce .ma-s{color:var(--soft);font-size:clamp(15px,4vw,19px)}
.mt-bar{height:10px;width:min(100%,560px);border-radius:9px;background:var(--line);overflow:hidden;flex:none}
.mt-bar b{display:block;height:100%;width:0;background:var(--area);border-radius:9px;transition:width .3s linear}

/* ── trace ── */
.tr-char,.tr-goal,.tr-num{position:absolute;left:-200px;top:-200px;transform:translate(-50%,-50%);pointer-events:none;line-height:1;z-index:3}
.tr-char{font-size:var(--cs,52px);transition:left .12s linear,top .12s linear;filter:drop-shadow(0 4px 4px rgba(0,0,0,.18));z-index:4}
.tr-char.jump{transition:none}
.tr-goal{font-size:var(--cs,52px);animation:trBob 1.8s ease-in-out infinite}
.tr-goal.mt-pop{animation:mtPop .55s}
@keyframes trBob{50%{translate:0 -10%}}
.tr-num{width:30px;height:30px;border-radius:50%;background:var(--area);color:#fff;font-family:Jua,sans-serif;font-size:18px;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow)}
.tr-num.past{opacity:.3;transition:opacity .3s}
.tr-name{position:absolute;left:14px;top:8px;z-index:2;pointer-events:none;font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,22px);color:var(--soft)}
.tr-name b{font-weight:400;font-size:2em;line-height:1;color:var(--area);vertical-align:middle;margin-right:4px}

/* ── dots ── */
.dt-dot{position:absolute;width:var(--d,52px);height:var(--d,52px);margin:calc(var(--d,52px) / -2) 0 0 calc(var(--d,52px) / -2);border-radius:50%;z-index:2;pointer-events:none;
  background:var(--surface);border:4px solid color-mix(in srgb,var(--area) 55%,var(--line));color:var(--ink);display:flex;align-items:center;justify-content:center;
  font-family:Jua,sans-serif;font-size:calc(var(--d,52px) * .46);line-height:1;box-shadow:var(--shadow);transition:background .2s,border-color .2s,opacity .5s}
.dt-dot.on{background:color-mix(in srgb,var(--area) 22%,var(--surface));border-color:var(--area)}
.dt-dot.next{background:var(--area);border-color:var(--area);color:#fff;animation:dtPulse 1.1s ease-in-out infinite}
.dt-dot.hint{animation:glow 1s ease-in-out 3}
.dt-board.calm-next .dt-dot.next{animation:none}
.dt-board.soft-next .dt-dot.next{animation:none;background:var(--surface);color:var(--ink);border-color:var(--area);box-shadow:0 0 0 3px color-mix(in srgb,var(--area) 30%,transparent),var(--shadow)}
.dt-board .dt-dot.next.hint{animation:glow 1s ease-in-out 3}
.dt-dot.mt-wig{animation:mtWig .5s}
@keyframes dtPulse{0%,100%{scale:1;box-shadow:0 0 0 0 color-mix(in srgb,var(--area) 60%,transparent)}50%{scale:1.16;box-shadow:0 0 0 12px color-mix(in srgb,var(--area) 0%,transparent)}}
.dt-board.done .dt-dot{opacity:0}
.dt-reveal{position:absolute;z-index:4;line-height:1;pointer-events:none;transform:translate(-50%,-50%) scale(.2);opacity:0;
  transition:transform .55s cubic-bezier(.3,1.6,.6,1),opacity .35s;filter:drop-shadow(0 8px 10px rgba(0,0,0,.18))}
.dt-reveal.on{transform:translate(-50%,-50%) scale(1);opacity:1}

/* ── pop ── */
.pp-sky{position:relative;flex:1;min-height:280px;width:100%;border-radius:28px;overflow:hidden;touch-action:none;box-shadow:var(--shadow);
  background:linear-gradient(180deg,#a9dcff 0%,#d9f0ff 62%,#fff4dc 100%)}
.pp-cloud{position:absolute;width:120px;height:38px;border-radius:40px;background:rgba(255,255,255,.8);pointer-events:none;animation:ppDrift 18s ease-in-out infinite alternate}
.pp-cloud::before,.pp-cloud::after{content:'';position:absolute;border-radius:50%;background:inherit}
.pp-cloud::before{width:56px;height:56px;left:16px;top:-26px}
.pp-cloud::after{width:42px;height:42px;left:58px;top:-18px}
.pp-cloud.c1{left:6%;top:12%} .pp-cloud.c2{right:4%;top:34%;transform:scale(.8);animation-duration:23s} .pp-cloud.c3{left:30%;top:64%;transform:scale(.6);animation-duration:27s}
@keyframes ppDrift{to{translate:40px 0}}
.pp-b{position:absolute;left:0;top:0;width:var(--w);height:calc(var(--w) * 1.43);will-change:transform;cursor:pointer;touch-action:none}
.pp-b svg,.pp-rule svg{display:block;width:100%;height:100%;overflow:visible}
.pp-b svg{filter:drop-shadow(0 6px 6px rgba(0,0,0,.14))}
.pp-b .bd,.pp-rule .bd,.pp-b .kn,.pp-rule .kn{fill:var(--c)}
.pp-b .sh,.pp-rule .sh{fill:#fff;opacity:.4}
.pp-b .st,.pp-rule .st{fill:none;stroke:color-mix(in srgb,var(--ink) 45%,transparent);stroke-width:1.6}
.pp-b.no svg{animation:wig .45s}
.pp-rule{--c:#ef5350}
.pp-rule svg{width:22px;height:31px}
.pp-rule.mt-pop{animation:mtPop .55s 3}
.pp-rule .pp-ic{display:inline-block;width:22px;height:31px;flex:none;transition:transform .2s}
.pp-rule .pp-ic svg{width:100%;height:100%}
.pp-rule .pp-ic.now{transform:scale(1.3);filter:drop-shadow(0 0 4px var(--c))}
.pp-rule .pp-ar{color:var(--soft);font-size:.8em}
.pp-rule .pp-no{font-size:.9em}
.pp-bit{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:var(--c);pointer-events:none;animation:ppBit .55s ease-out forwards}
@keyframes ppBit{to{transform:translate(var(--dx),var(--dy)) scale(.3);opacity:0}}
.pp-gift{position:absolute;z-index:5;font-size:clamp(34px,9vw,54px);line-height:1;pointer-events:none;animation:ppGift 1.7s ease-out forwards}
@keyframes ppGift{0%{transform:translate(-50%,-50%) scale(.3)}25%{transform:translate(-50%,-90%) scale(1.15)}100%{transform:translate(-50%,60%) scale(1);opacity:0}}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .pp-sky{background:linear-gradient(180deg,#183257 0%,#244a73 62%,#3b4a5e 100%)}
  :root:not([data-theme="light"]) .pp-cloud{background:rgba(255,255,255,.14)}}
:root[data-theme="dark"] .pp-sky{background:linear-gradient(180deg,#183257 0%,#244a73 62%,#3b4a5e 100%)}
:root[data-theme="dark"] .pp-cloud{background:rgba(255,255,255,.14)}

/* ── sort ── */
.so-tray{position:relative;flex:1;min-height:200px;width:100%}
.so-it{position:absolute;width:var(--s,80px);height:var(--s,80px);margin:calc(var(--s,80px) / -2) 0 0 calc(var(--s,80px) / -2);border-radius:50%;
  background:var(--surface);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;font-size:calc(var(--s,80px) * .6);line-height:1;
  cursor:grab;touch-action:none;transition:box-shadow .2s;animation:soIn .4s backwards}
@keyframes soIn{from{scale:.3;opacity:0}}
.so-it.sel{box-shadow:0 0 0 5px var(--area),0 0 24px var(--area)}
.so-it.in{position:static;margin:0;width:auto;height:auto;background:none;box-shadow:none;font-size:clamp(22px,6vw,34px);cursor:default;animation:none}
.so-baskets{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:clamp(8px,2vw,14px);width:100%;flex:none}
.so-bk{position:relative;min-height:clamp(118px,19vh,176px);border-radius:24px;border:5px solid var(--c);background:color-mix(in srgb,var(--c) 16%,var(--surface));
  display:flex;flex-direction:column;align-items:center;padding:6px 4px 8px;transition:transform .15s,box-shadow .2s;min-width:0}
.so-bk .bh{display:flex;align-items:center;gap:6px;font-family:Jua,sans-serif;font-size:clamp(15px,4.2vw,22px);line-height:1.3;white-space:nowrap}
.so-bk .bh i{width:22px;height:22px;border-radius:50%;background:var(--c);display:inline-block;flex:none;box-shadow:inset 0 -3px 0 rgba(0,0,0,.15)}
.so-bk .bh .ce{font-size:1.3em}
.so-bk .bin{flex:1;display:flex;flex-wrap:wrap;align-content:flex-start;justify-content:center;gap:2px;width:100%;padding-top:4px}
.so-bk .bwv{position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:clamp(26px,7vw,40px);opacity:.22;pointer-events:none;line-height:1}
.so-bk.over{transform:scale(1.05);box-shadow:0 0 0 6px color-mix(in srgb,var(--c) 45%,transparent)}
.so-bk.got{animation:pop .4s}
.so-baskets.so-cat4 .bh{flex-direction:column;gap:0;font-size:clamp(14px,3.8vw,20px);line-height:1.15}   /* 범주 바구니 넷: 그림 위·이름 아래 (휴대폰 폭에 맞게) */
.so-bk .bh .bi2{display:inline-flex;align-items:center;gap:4px}

/* ── tilt ── */
.act-tilt{--tl-felt:#a9dd8a;--tl-dot:rgba(255,255,255,.28);--tl-wall:#c98b4f;--tl-wall2:#e2ad73;--tl-hole:#26331f;--tl-rim:#7cb85a}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .act-tilt{--tl-felt:#3e6b34;--tl-dot:rgba(255,255,255,.08);--tl-wall:#8a5a2e;--tl-wall2:#a8743f;--tl-hole:#0c120a;--tl-rim:#2f5328}}
:root[data-theme="dark"] .act-tilt{--tl-felt:#3e6b34;--tl-dot:rgba(255,255,255,.08);--tl-wall:#8a5a2e;--tl-wall2:#a8743f;--tl-hole:#0c120a;--tl-rim:#2f5328}
.tl-board{position:relative;flex:1;min-height:260px;width:100%;border-radius:26px;overflow:hidden;box-shadow:var(--shadow);touch-action:none;background:var(--tl-felt)}
.tl-start{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:16px;
  background:color-mix(in srgb,var(--surface) 82%,transparent)}
.tl-start .te{font-size:clamp(70px,20vw,120px);line-height:1;animation:trBob 1.8s ease-in-out infinite}
.tl-start .tt{font-family:Jua,sans-serif;font-size:clamp(18px,5vw,24px);line-height:1.45}
.tl-start .tt b{font-weight:400;color:var(--area)}
.tl-start .btn.big{min-width:210px;font-size:26px}

/* ── scratch ── */
.sc-card{position:relative;width:min(100%,calc(100vh - 260px),560px);width:min(100%,calc(100dvh - 260px),560px);min-width:220px;aspect-ratio:1;margin:auto 0;
  border-radius:30px;overflow:hidden;box-shadow:var(--shadow);background:var(--surface);touch-action:none;container-type:inline-size}
.sc-pic{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,var(--surface) 35%,color-mix(in srgb,var(--area) 20%,var(--surface)))}
.sc-pic span{font-size:clamp(90px,26vw,300px);font-size:58cqw;line-height:1;transition:transform .55s cubic-bezier(.3,1.6,.6,1)}
.sc-pic.show span{transform:scale(1.1)}
.sc-card .gcv{transition:opacity .6s}
.sc-card.open .gcv{opacity:0}
.sc-wins{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none;overflow:visible;transition:opacity .5s}
.sc-wins.off{opacity:0}
.sc-wins .sw{transform-box:fill-box;transform-origin:center;transition:opacity .4s}
.sc-wins .sw path{fill:none;stroke:rgba(255,255,255,.92);stroke-width:3;stroke-dasharray:9 7;stroke-linejoin:round}
.sc-wins .sw circle{fill:rgba(255,255,255,.9)}
.sc-wins .sw text{fill:#5b4b80;font-family:Jua,sans-serif;text-anchor:middle}
.sc-wins .sw.now path{stroke:#fff;stroke-width:6;stroke-dasharray:none;animation:scGlow 1.3s ease-in-out infinite}
.sc-wins .sw.now circle{fill:var(--area)}
.sc-wins .sw.now text{fill:#fff}
.sc-wins .sw.done{opacity:0}
@keyframes scGlow{50%{stroke-opacity:.4}}

/* ── puzzle ── */
.pz-wrap{gap:6px}
.pz-area{flex:1;min-height:0;width:100%;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:clamp(10px,3vw,22px);padding:10px;border-radius:26px}
.pz-holes{background:color-mix(in srgb,var(--area) 9%,var(--surface));box-shadow:var(--shadow)}
.pz-tip{flex:none;font-size:22px;line-height:1;opacity:.5}
.pz-hole{position:relative;width:var(--s,110px);height:var(--s,110px);border-radius:20px;transition:transform .2s}
.pz-hole svg,.pz-pc svg{width:100%;height:100%;display:block;overflow:visible}
.pz-hole .sil{fill:var(--hc,color-mix(in srgb,var(--ink) 10%,transparent));stroke:var(--hs,color-mix(in srgb,var(--ink) 45%,transparent));stroke-width:3;stroke-dasharray:7 6;stroke-linejoin:round;transition:opacity .3s}
.pz-hole.over{transform:scale(1.07)}
.pz-hole.over .sil{stroke-width:5}
.pz-hole.done .sil{opacity:0}
.pz-pc{position:relative;width:var(--s,110px);height:var(--s,110px);cursor:grab;touch-action:none}
.pz-pc .pc{stroke:rgba(0,0,0,.22);stroke-width:3;stroke-linejoin:round}
.pz-pc svg{filter:drop-shadow(0 5px 5px rgba(0,0,0,.18));transition:transform .4s cubic-bezier(.3,1.4,.6,1)}
.pz-pc.sel svg{filter:drop-shadow(0 0 6px var(--area)) drop-shadow(0 0 12px var(--area))}
.pz-pc.in{position:absolute;left:0;top:0;cursor:default}
.pz-fig{position:relative;flex:none}
.pz-sil{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.pz-sil .so polygon{fill:none;stroke:color-mix(in srgb,var(--ink) 45%,transparent);stroke-width:7;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.pz-sil .sf polygon{fill:color-mix(in srgb,var(--ink) 9%,var(--surface));stroke:none}
.pz-slot{position:absolute;border-radius:12px}
.pz-slot svg{width:100%;height:100%;display:block;overflow:visible}
.pz-slot .sl{fill:none;stroke:color-mix(in srgb,var(--ink) 42%,transparent);stroke-width:2.5;stroke-dasharray:7 6;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.pz-slot.over svg{filter:drop-shadow(0 0 6px var(--area))}
.pz-fpc .pc{stroke-width:2.5;vector-effect:non-scaling-stroke}
`);

/* ===========================================================
   1. 선 따라 그리기 — 시각-운동 통합
   길은 '키 1인 네모' 좌표(가로 ar)로 적는다. 화면 크기가 바뀌어도 모양이 그대로 커지고 작아진다.
   =========================================================== */
var TR_SHAPES = (function () {
  function arc(cx, cy, rx, ry, a0, a1, n) {
    var p = [];
    for (var i = 0; i <= n; i++) { var a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return p;
  }
  function wave() { var p = []; for (var i = 0; i <= 48; i++) { var X = i / 24; p.push([X, 0.5 - 0.32 * Math.sin(1.5 * Math.PI * X)]); } return p; }
  function star() { var p = []; for (var k = 0; k < 10; k++) { var a = (-90 + 36 * k) * Math.PI / 180, r = k % 2 ? 0.19 : 0.47; p.push([0.5 + r * Math.cos(a), 0.53 + r * Math.sin(a)]); } return p; }
  /* 4·5단계 곡선 — 키를 h 로 맞추고 왼쪽 위에 붙여 { s, ar } 로 돌려준다 */
  function fit(p, h) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    p.forEach(function (q) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
    var k = h / (y1 - y0), m = (1 - h) / 2;
    return { s: [p.map(function (q) { return [m + (q[0] - x0) * k, m + (q[1] - y0) * k]; })], ar: (x1 - x0) * k + 2 * m };
  }
  /* 달팽이 — 바깥에서 안으로 두 바퀴 (한 바퀴마다 반지름이 0.17 씩 줄어 길이 겹치지 않는다) */
  function spiral() { var p = []; for (var i = 0; i <= 120; i++) { var t = i / 120, a = (-90 + 720 * t) * Math.PI / 180, r = 0.46 - 0.34 * t; p.push([0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a)]); } return p; }
  /* 하트 — 위 가운데 오목한 곳에서 왼쪽으로 내려가 뾰족, 오른쪽으로 올라온다 */
  function heart() { var p = []; for (var i = 0; i <= 64; i++) { var t = i / 64 * (2 * Math.PI - 0.7); p.push([-16 * Math.pow(Math.sin(t), 3), -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } return fit(p, 0.9); }
  /* 누운 8자 — 가운데에서 왼쪽 위로 한 바퀴, 가운데를 건너 오른쪽 한 바퀴 (몸 가운데 넘기) */
  function eight() { var p = []; for (var i = 0; i <= 96; i++) { var t = i / 96 * (2 * Math.PI - 0.4); p.push([-Math.sin(t), -0.9 * Math.sin(t) * Math.cos(t)]); } return fit(p, 0.84); }
  /* 용수철 고리 둘 — 아래에서 올라가 위에서 동그랗게 돌아 내려온다 */
  function loops() { var p = []; for (var i = 0; i <= 100; i++) { var t = Math.PI + i / 100 * 4 * Math.PI; p.push([t - 3.2 * Math.sin(t), 1 - 3.2 * Math.cos(t)]); } return fit(p, 0.86); }
  var HE = heart(), EI = eight(), LO = loops();
  return {
    v:        { ar: 0.5, say: '위에서 아래로 쭉!', s: [[[0.25, 0], [0.25, 1]]] },
    h:        { ar: 2, say: '왼쪽에서 오른쪽으로 쭉!', s: [[[0, 0.5], [2, 0.5]]] },
    arch:     { ar: 1.8, say: '무지개처럼 둥글게!', s: [arc(0.9, 0.95, 0.85, 0.85, 180, 360, 40)] },
    wave:     { ar: 2, say: '물결처럼 출렁출렁!', s: [wave()] },
    circle:   { ar: 1, say: '동글동글 한 바퀴!', s: [arc(0.5, 0.5, 0.46, 0.46, -90, 240, 60)] },
    cross:    { ar: 1, say: '먼저 세로로 쭉, 그다음 가로로 쭉!', s: [[[0.5, 0.04], [0.5, 0.96]], [[0.04, 0.5], [0.96, 0.5]]] },
    zigzag:   { ar: 2, say: '산처럼 뾰족뾰족!', s: [[[0, 0.82], [0.5, 0.18], [1, 0.82], [1.5, 0.18], [2, 0.82]]] },
    square:   { ar: 1, say: '네모 길이에요!', s: [[[0.06, 0.06], [0.94, 0.06], [0.94, 0.94], [0.06, 0.94], [0.06, 0.28]]] },
    triangle: { ar: 1.1, say: '세모 길이에요!', s: [[[0.55, 0.04], [1.06, 0.96], [0.04, 0.96], [0.44, 0.24]]] },
    star:     { ar: 1, say: '반짝반짝 별 길이에요!', s: [star()] },
    g:        { ar: 0.9, k: 'ㄱ', n: '기역', say: '기역 길이에요!', s: [[[0.06, 0.08], [0.82, 0.08], [0.82, 0.96]]] },
    n:        { ar: 0.9, k: 'ㄴ', n: '니은', say: '니은 길이에요!', s: [[[0.08, 0.04], [0.08, 0.92], [0.84, 0.92]]] },
    d:        { ar: 0.9, k: 'ㄷ', n: '디귿', say: '디귿 길이에요! 1번 길부터 차례로.', s: [[[0.08, 0.06], [0.84, 0.06]], [[0.08, 0.06], [0.08, 0.92], [0.86, 0.92]]] },
    m:        { ar: 1, k: 'ㅁ', n: '미음', say: '미음 길이에요! 1번, 2번, 3번 차례로.', s: [[[0.08, 0.06], [0.08, 0.94]], [[0.08, 0.06], [0.92, 0.06], [0.92, 0.94]], [[0.08, 0.94], [0.92, 0.94]]] },
    o:        { ar: 1, k: 'ㅇ', n: '이응', say: '이응 길이에요! 위에서 시작해서 동그랗게.', s: [arc(0.5, 0.5, 0.44, 0.46, -90, -420, 60)] },
    /* 4단계(도전) — 사선·꺾임이 많은 길, 곡선이 조금씩 작아지는 길 */
    diamond:  { ar: 0.8, say: '마름모 길이에요! 뾰족한 곳에서 방향을 바꿔요.', s: [[[0.4, 0.04], [0.76, 0.5], [0.4, 0.96], [0.04, 0.5], [0.27, 0.2]]] },
    s:        { ar: 1, k: 'ㅅ', n: '시옷', say: '시옷 길이에요! 1번은 왼쪽 아래로, 2번은 오른쪽 아래로.', s: [[[0.5, 0.06], [0.08, 0.94]], [[0.32, 0.44], [0.92, 0.94]]] },
    heart:    { ar: HE.ar, say: '하트 길이에요! 둥글게 내려가서 뾰족, 다시 둥글게!', s: HE.s },
    r:        { ar: 0.9, k: 'ㄹ', n: '리을', say: '리을 길이에요! 1번, 2번, 3번 차례로.', s: [[[0.08, 0.06], [0.82, 0.06], [0.82, 0.5]], [[0.08, 0.5], [0.82, 0.5]], [[0.08, 0.5], [0.08, 0.94], [0.86, 0.94]]] },
    spiral:   { ar: 1, say: '달팽이 집처럼 빙글빙글 안으로!', s: [spiral()] },
    /* 5단계(마스터) — 획이 넷인 글자, 길이 서로 건너는 길, 고리 */
    house:    { ar: 1, say: '집 길이에요! 1번 네모를 그리고, 2번 지붕을 그려요.', s: [[[0.14, 0.44], [0.86, 0.44], [0.86, 0.96], [0.14, 0.96], [0.14, 0.6]], [[0.04, 0.46], [0.5, 0.04], [0.96, 0.46]]] },
    b:        { ar: 0.9, k: 'ㅂ', n: '비읍', say: '비읍 길이에요! 1번부터 4번까지 차례로.', s: [[[0.1, 0.06], [0.1, 0.94]], [[0.8, 0.06], [0.8, 0.94]], [[0.1, 0.5], [0.8, 0.5]], [[0.1, 0.94], [0.8, 0.94]]] },
    p:        { ar: 0.92, k: 'ㅍ', n: '피읖', say: '피읖 길이에요! 1번부터 4번까지 차례로.', s: [[[0.08, 0.08], [0.84, 0.08]], [[0.28, 0.08], [0.28, 0.9]], [[0.64, 0.08], [0.64, 0.9]], [[0.04, 0.9], [0.88, 0.9]]] },
    hh:       { ar: 0.9, k: 'ㅎ', n: '히읗', say: '히읗 길이에요! 1번 꼭지, 2번 가로, 3번 동그라미.', s: [[[0.3, 0.06], [0.6, 0.06]], [[0.08, 0.26], [0.82, 0.26]], arc(0.45, 0.65, 0.28, 0.29, -90, -420, 50)] },   /* (가로줄 h 와 이름이 겹치지 않게 hh) */
    eight:    { ar: EI.ar, say: '누운 8자 길이에요! 가운데에서 왼쪽으로 한 바퀴, 오른쪽으로 한 바퀴!', s: EI.s },
    loops:    { ar: LO.ar, say: '용수철처럼 동글동글 고리를 이어 그려요!', s: LO.s }
  };
})();
/* 6~10단계 — 한글 쓰기로 이어 간다 (획은 바른 쓰는 순서대로 적는다).
   6: 남은 자음 ㅈ ㅊ ㅋ ㅌ·기본 모음 ㅏ ㅓ ㅗ ㅜ  7: 받침 없는 글자(옆 모음 가·너·미…)  8: 받침 없는 글자(아래 모음 고·누·드…)
   9: 가운데 점선 길잡이 없이  10: 두 글자 낱말(나무·기차…) — 글자가 작아지는 만큼 길도 좁아진다 */
var TR_POOL = {};
(function () {
  function arc(cx, cy, rx, ry, a0, a1, n) {
    var p = [];
    for (var i = 0; i <= n; i++) { var a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
    return p;
  }
  /* 자음 획 — 0~1 네모 안. side 는 옆 모음과 쓸 때 꼬리가 비스듬한 꼴(가·카) */
  var CON = {
    g:  { k: 'ㄱ', n: '기역', s: [[[0, 0], [1, 0], [1, 1]]], side: [[[0, 0], [0.95, 0], [0.6, 1]]] },
    n:  { k: 'ㄴ', n: '니은', s: [[[0, 0], [0, 1], [1, 1]]] },
    d:  { k: 'ㄷ', n: '디귿', s: [[[0, 0], [1, 0]], [[0, 0], [0, 1], [1, 1]]] },
    r:  { k: 'ㄹ', n: '리을', s: [[[0, 0], [1, 0], [1, 0.5]], [[0, 0.5], [1, 0.5]], [[0, 0.5], [0, 1], [1, 1]]] },
    m:  { k: 'ㅁ', n: '미음', s: [[[0, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 1], [1, 1]]] },
    b:  { k: 'ㅂ', n: '비읍', s: [[[0, 0], [0, 1]], [[1, 0], [1, 1]], [[0, 0.5], [1, 0.5]], [[0, 1], [1, 1]]] },
    s:  { k: 'ㅅ', n: '시옷', s: [[[0.5, 0], [0, 1]], [[0.28, 0.44], [1, 1]]] },
    o:  { k: 'ㅇ', n: '이응', s: [arc(0.5, 0.5, 0.5, 0.5, -90, -420, 36)] },
    j:  { k: 'ㅈ', n: '지읒', s: [[[0, 0], [0.9, 0], [0.05, 1]], [[0.475, 0.5], [1, 1]]] },
    ch: { k: 'ㅊ', n: '치읓', s: [[[0.42, 0], [0.52, 0.18]], [[0, 0.32], [0.9, 0.32], [0.05, 1]], [[0.475, 0.66], [1, 1]]] },
    k:  { k: 'ㅋ', n: '키읔', s: [[[0, 0], [1, 0], [1, 1]], [[0, 0.5], [1, 0.5]]], side: [[[0, 0], [0.95, 0], [0.6, 1]], [[0, 0.5], [0.78, 0.5]]] },
    t:  { k: 'ㅌ', n: '티읕', s: [[[0, 0], [1, 0]], [[0, 0.5], [1, 0.5]], [[0, 0], [0, 1], [1, 1]]] },
    p:  { k: 'ㅍ', n: '피읖', s: [[[0, 0], [1, 0]], [[0.28, 0], [0.28, 1]], [[0.72, 0], [0.72, 1]], [[0, 1], [1, 1]]] },
    h:  { k: 'ㅎ', n: '히읗', s: [[[0.32, 0], [0.68, 0]], [[0, 0.24], [1, 0.24]], arc(0.5, 0.68, 0.34, 0.31, -90, -420, 32)] }
  };
  /* 모음 — 글자 칸(0~1) 안 자리. box 는 자음이 들어갈 자리 [x0, y0, x1, y1], ji 는 한글 조합 번호 */
  var VOW = {
    a:  { k: 'ㅏ', n: '아', ji: 0, side: true, box: [0.04, 0.14, 0.6, 0.86], s: [[[0.78, 0.02], [0.78, 0.98]], [[0.78, 0.5], [0.97, 0.5]]] },
    eo: { k: 'ㅓ', n: '어', ji: 4, side: true, box: [0.02, 0.14, 0.46, 0.86], s: [[[0.6, 0.5], [0.82, 0.5]], [[0.82, 0.02], [0.82, 0.98]]] },
    i:  { k: 'ㅣ', n: '이', ji: 20, side: true, box: [0.04, 0.12, 0.6, 0.88], s: [[[0.8, 0.02], [0.8, 0.98]]] },
    o:  { k: 'ㅗ', n: '오', ji: 8, box: [0.16, 0.02, 0.84, 0.46], s: [[[0.5, 0.6], [0.5, 0.8]], [[0.03, 0.82], [0.97, 0.82]]] },
    u:  { k: 'ㅜ', n: '우', ji: 13, box: [0.16, 0.02, 0.84, 0.46], s: [[[0.03, 0.62], [0.97, 0.62]], [[0.5, 0.62], [0.5, 0.98]]] },
    eu: { k: 'ㅡ', n: '으', ji: 18, box: [0.16, 0.04, 0.84, 0.56], s: [[[0.03, 0.76], [0.97, 0.76]]] }
  };
  var CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  function into(st, b, dx) { return st.map(function (q) { return [dx + b[0] + q[0] * (b[2] - b[0]), b[1] + q[1] * (b[3] - b[1])]; }); }
  function sylStrokes(c, v, dx) {
    var C = CON[c], V = VOW[v];
    return ((V.side && C.side) || C.s).map(function (st) { return into(st, V.box, dx); })
      .concat(V.s.map(function (st) { return st.map(function (q) { return [dx + q[0], q[1]]; }); }));
  }
  function sylChar(c, v) { return String.fromCharCode(0xAC00 + (CHO.indexOf(CON[c].k) * 21 + VOW[v].ji) * 28); }
  /* 6단계 낱자 */
  ['j', 'ch', 'k', 't'].forEach(function (c) {
    TR_SHAPES[c] = { ar: 0.9, k: CON[c].k, n: CON[c].n, s: CON[c].s.map(function (st) { return into(st, [0.06, 0.06, 0.84, 0.94], 0); }) };
  });
  TR_SHAPES.j.say = '지읒 길이에요! 1번은 옆으로 가다 왼쪽 아래로, 2번은 오른쪽 아래로.';
  TR_SHAPES.ch.say = '치읓 길이에요! 1번 꼭지, 2번, 3번 차례로.';
  TR_SHAPES.k.say = '키읔 길이에요! 1번 기역, 2번 가운데 가로.';
  TR_SHAPES.t.say = '티읕 길이에요! 1번 위 가로, 2번 가운데 가로, 3번은 내려가서 옆으로.';
  TR_SHAPES.va = { ar: 0.7, k: 'ㅏ', n: '아', say: '아 길이에요! 1번 위에서 아래로, 2번 오른쪽으로 짧게.', s: [[[0.2, 0.04], [0.2, 0.96]], [[0.2, 0.48], [0.6, 0.48]]] };
  TR_SHAPES.veo = { ar: 0.7, k: 'ㅓ', n: '어', say: '어 길이에요! 1번 오른쪽으로 짧게, 2번 위에서 아래로.', s: [[[0.1, 0.48], [0.5, 0.48]], [[0.5, 0.04], [0.5, 0.96]]] };
  TR_SHAPES.vo = { ar: 1, k: 'ㅗ', n: '오', say: '오 길이에요! 1번 짧게 아래로, 2번 왼쪽에서 오른쪽으로.', s: [[[0.5, 0.3], [0.5, 0.66]], [[0.04, 0.68], [0.96, 0.68]]] };
  TR_SHAPES.vu = { ar: 1, k: 'ㅜ', n: '우', say: '우 길이에요! 1번 왼쪽에서 오른쪽으로, 2번 짧게 아래로.', s: [[[0.04, 0.32], [0.96, 0.32]], [[0.5, 0.32], [0.5, 0.72]]] };
  TR_POOL.c6 = ['j', 'ch', 'k', 't']; TR_POOL.v6 = ['va', 'veo', 'vo', 'vu'];
  /* 7·8단계 받침 없는 글자 — 자음 먼저, 그다음 모음 */
  TR_POOL.s7 = []; TR_POOL.s8 = [];
  Object.keys(CON).forEach(function (c) {
    Object.keys(VOW).forEach(function (v) {
      var ch = sylChar(c, v), key = 'sy' + ch;
      TR_SHAPES[key] = { ar: 1, k: ch, n: '', say: ch + ' 글자예요! ' + CON[c].n + ' 먼저 쓰고, 그다음 ' + VOW[v].n + '. 1번부터 차례로.', s: sylStrokes(c, v, 0) };
      TR_POOL[VOW[v].side ? 's7' : 's8'].push(key);
    });
  });
  TR_POOL.s9 = TR_POOL.s7.concat(TR_POOL.s8);
  /* 10단계 두 글자 낱말 (획 9개 이하) — 앞 글자를 다 쓰고 뒤 글자 */
  TR_POOL.w = [];
  [['아기', '👶', 'o', 'a', 'g', 'i'], ['오이', '🥒', 'o', 'o', 'o', 'i'], ['가지', '🍆', 'g', 'a', 'j', 'i'], ['기차', '🚂', 'g', 'i', 'ch', 'a'],
    ['오리', '🦆', 'o', 'o', 'r', 'i'], ['구두', '👞', 'g', 'u', 'd', 'u'], ['나무', '🌳', 'n', 'a', 'm', 'u'], ['사자', '🦁', 's', 'a', 'j', 'a'],
    ['나비', '🦋', 'n', 'a', 'b', 'i'], ['모자', '👒', 'm', 'o', 'j', 'a'], ['버스', '🚌', 'b', 'eo', 's', 'eu'], ['치마', '👗', 'ch', 'i', 'm', 'a']
  ].forEach(function (w) {
    TR_SHAPES['wd' + w[0]] = { ar: 2.12, k: w[0], n: w[1], say: w[0] + '! 한 글자씩, 1번부터 차례로 써 봐요.', s: sylStrokes(w[2], w[3], 0).concat(sylStrokes(w[4], w[5], 1.12)) };
    TR_POOL.w.push('wd' + w[0]);
  });
})();
/* 발달 순서: 세로·가로(2~3세) → 둥근 선·원·+(3~4세) → 사선·네모·세모(4~5세) → 별·글자
   → 4단계: 마름모(6~7세)·사선 글자·달팽이 → 5단계: 획 넷인 글자·누운 8자·고리
   → 6~10단계: 낱자 → 받침 없는 글자 → 길잡이 없이 → 두 글자 낱말 ('@이름' 은 TR_POOL 에서 겹치지 않게 고른다) */
var TR_LEVEL = { 1: ['v', 'h', 'v', 'h', 'v'], 2: ['arch', 'wave', 'circle', 'cross', 'zigzag'], 3: ['square', 'triangle', 'gn', 'dmo', 'star'],
  4: ['diamond', 's', 'heart', 'r', 'spiral'], 5: ['house', 'bp', 'hh', 'eight', 'loops'],
  6: ['@c6', '@c6', '@c6', '@v6', '@v6'], 7: ['@s7', '@s7', '@s7', '@s7', '@s7'], 8: ['@s8', '@s8', '@s8', '@s8', '@s8'],
  9: ['@s9', '@s9', '@s9', '@s9', '@s9'], 10: ['@w', '@w', '@w', '@w', '@w'] };
/* 칸이 오르면 다음 단계 길을 끝에 하나씩 섞는다 (2칸: 1개, 3칸: 2개). 끝 단계(10)는 길 폭이 조금 좁아지고 화살표가 옅어진다 */
var TR_STEP = {
  1: { 2: ['v', 'h', 'v', 'h', 'arch'], 3: ['v', 'h', 'v', 'arch', 'wave'] },
  2: { 2: ['arch', 'circle', 'cross', 'zigzag', 'square'], 3: ['arch', 'circle', 'cross', 'square', 'triangle'] },
  3: { 2: ['square', 'triangle', 'gn', 'dmo', 'diamond'], 3: ['square', 'triangle', 'gn', 'diamond', 's'] },
  4: { 2: ['diamond', 's', 'heart', 'r', 'house'], 3: ['diamond', 's', 'heart', 'house', 'bp'] },
  5: { 2: ['house', 'bp', 'hh', 'eight', '@c6'], 3: ['house', 'bp', 'hh', '@c6', '@v6'] },
  6: { 2: ['@c6', '@c6', '@c6', '@v6', '@s7'], 3: ['@c6', '@c6', '@v6', '@s7', '@s7'] },
  7: { 2: ['@s7', '@s7', '@s7', '@s7', '@s8'], 3: ['@s7', '@s7', '@s7', '@s8', '@s8'] },
  8: { 2: ['@s8', '@s8', '@s8', '@s8', '@s9'], 3: ['@s8', '@s8', '@s8', '@s9', '@s9'] },
  9: { 2: ['@s9', '@s9', '@s9', '@s9', '@w'], 3: ['@s9', '@s9', '@s9', '@w', '@w'] }
};
var TR_STORY = [
  { c: '🐛', cn: '애벌레', g: '🍎', gn: '사과', go: '애벌레가 사과까지 가요', yum: '냠냠! 사과 맛있다!' },
  { c: '🚗', cn: '자동차', g: '🏠', gn: '집', go: '자동차가 집까지 가요', yum: '부릉부릉, 집에 도착!' },
  { c: '🐰', cn: '토끼', g: '🥕', gn: '당근', go: '토끼가 당근까지 깡충깡충 가요', yum: '아삭아삭! 당근 맛있다!' },
  { c: '🐝', cn: '꿀벌', g: '🌷', gn: '꽃', go: '꿀벌이 꽃까지 날아가요', yum: '붕붕! 꽃에 도착했어!' },
  { c: '🐭', cn: '생쥐', g: '🧀', gn: '치즈', go: '생쥐가 치즈까지 가요', yum: '찍찍! 치즈 냠냠!' },
  { c: '🐶', cn: '강아지', g: '🦴', gn: '뼈다귀', go: '강아지가 뼈다귀까지 가요', yum: '멍멍! 신난다!' },
  { c: '🐻', cn: '곰돌이', g: '🍯', gn: '꿀단지', go: '곰돌이가 꿀단지까지 가요', yum: '음~ 꿀이 달콤해!' },
  { c: '🐥', cn: '병아리', g: '🌽', gn: '옥수수', go: '병아리가 옥수수까지 가요', yum: '삐약삐약, 냠냠!' },
  { c: '🐢', cn: '거북이', g: '🍓', gn: '딸기', go: '거북이가 딸기까지 엉금엉금 가요', yum: '딸기 냠냠! 해냈다!' }
];
var TR_GOOD = ['길을 따라 끝까지 잘 갔어!', '손가락이 길을 척척 따라갔어!', '와, 선을 정말 잘 그렸다!', '끝까지 해냈어! 멋져!', '반듯반듯 최고야!'];
function trResample(strokes) {
  var pts = [], sid = [], starts = [], STEP = 0.02;
  strokes.forEach(function (s, si) {
    starts.push(pts.length);
    pts.push([s[0][0], s[0][1]]); sid.push(si);
    var carry = 0;
    for (var k = 1; k < s.length; k++) {
      var ax = s[k - 1][0], ay = s[k - 1][1], bx = s[k][0], by = s[k][1], L = Math.hypot(bx - ax, by - ay), d = STEP - carry;
      while (d <= L) { pts.push([ax + (bx - ax) * d / L, ay + (by - ay) * d / L]); sid.push(si); d += STEP; }
      carry = L - (d - STEP);
    }
    var e = s[s.length - 1], lp = pts[pts.length - 1];
    if (Math.hypot(e[0] - lp[0], e[1] - lp[1]) > 0.005) { pts.push([e[0], e[1]]); sid.push(si); }
  });
  return { pts: pts, sid: sid, starts: starts };
}

G.act({
  id: 'trace', area: 'motor', title: '선 따라 그리기', icon: '✏️', order: 10, levels: 10, mins: 3, needs: [],
  ef: ['attend', 'plan', 'inhibit'],
  desc: '애벌레 길을 따라 쭉 그려요',
  goal: '시각-운동 통합 — 눈으로 길을 보며 손가락을 원하는 쪽으로 움직이기. 글씨 쓰기 전 선 긋기(세로·가로·원·+·네모·세모·한글 자음)',
  how: '검지 하나만 펴고 나머지 손가락은 살짝 접게 도와주세요(연필 잡기 전 단계). 팔꿈치와 손목을 바닥에 대고 손가락·손목으로 그리게 하면 더 정확해요. 길을 조금 벗어나도 "애벌레가 사과까지 갔네!" 하고 끝까지 간 것을 칭찬해 주세요.',
  basis: '시각-운동 통합(VMI) — Beery 선 긋기 발달 순서(세로→가로→원→+→네모→세모→마름모), 넓은 길에서 좁은 길로 정확도 요구를 조금씩 높임. 4단계(도전)는 마름모·사선 글자·달팽이, 5단계(마스터)는 획이 넷인 글자·누운 8자·고리 길. 6~10단계는 초등 1~3학년 쓰기로 이어 감 — 남은 자음·모음 → 받침 없는 글자(쓰는 순서) → 점선 길잡이 없이 → 두 글자 낱말',
  offline: '쟁반에 소금이나 밀가루를 얇게 깔고 손가락 하나로 세로줄·동그라미를 그린 뒤, 굵은 크레용으로 종이 위 같은 길을 따라 그려 보세요.',
  run: async function (ctx) {
    var lv = ctx.level, B = ctx.body, AREA = areaHex(ctx);
    /* 칸이 오르면 길 폭이 조금 좁아지고(TOLF), 자비스가 도와주기 전 기다림이 조금 길어진다(AUTO).
       (길 폭은 손가락 굵기를 생각해 휴대폰에서 반폭 16px 밑으로는 좁히지 않는다) */
    var TOLF = ctx.tune([0.085, 0.068, 0.052, 0.044, 0.038, 0.036, 0.034, 0.032, 0.03, 0.028]), AUTO = ctx.tune([30000, 40000, 50000, 55000, 60000, 65000, 70000, 75000, 80000, 90000]);
    /* 가운데 점선 길잡이 — 8단계 2·3칸에서 옅어지고 9단계부터는 없다 (넓은 길은 그대로).
       끝 단계(10) 2·3칸은 가는 쪽 화살표도 옅어진다 — 번호를 보고 쓰는 순서를 스스로 떠올리기 */
    var DOTA = lv >= 9 ? 0 : lv === 8 && ctx.step > 1 ? (ctx.step === 2 ? 0.4 : 0.28) : 0.55;
    var ARRA = lv >= topLv(ctx) && ctx.step > 1 ? (ctx.step === 2 ? 0.35 : 0) : 0.6;
    B.innerHTML = '<div class="mt-wrap"><div class="mt-board tr-board"><div class="tr-name"></div></div></div>';
    var board = G.$('.tr-board', B), nameEl = G.$('.tr-name', board);
    var K = ctx.canvas(board, { onResize: layout });
    var goalEl = G.el('<span class="tr-goal" aria-hidden="true"></span>'), charEl = G.el('<span class="tr-char" aria-hidden="true"></span>');
    board.appendChild(goalEl); board.appendChild(charEl);
    var used = {};
    function fromPool(name) { var pool = TR_POOL[name], left = pool.filter(function (k) { return !used[k]; }), k = G.pick(left.length ? left : pool); used[k] = 1; return k; }
    var list = ((TR_STEP[lv] || {})[ctx.step] || TR_LEVEL[lv]).map(function (k) { return k.charAt(0) === '@' ? fromPool(k.slice(1)) : k === 'gn' ? G.pick(['g', 'n']) : k === 'dmo' ? G.pick(['d', 'm', 'o']) : k === 'bp' ? G.pick(['b', 'p']) : k; });
    var stories = TR_STORY.slice(0, 2).concat(G.shuffle(TR_STORY.slice(2)));
    var P = null, pid = null, helped = 0, accSum = 0, accN = 0;
    var idle = idler(ctx, pace(8000), nudge);
    board._probe = function () { return P ? P.pts.map(px) : []; };   /* 자동 검사용 — 길의 화면 좌표 */
    board._cov = function () { return P ? { n: P.covN, N: P.N, front: P.front, done: P.done, tol: P.tol, miss: Array.prototype.map.call(P.cov, function (v, i) { return v ? -1 : i; }).filter(function (i) { return i >= 0; }).join(','), R: P.R } : null; };

    function px(p) { return { x: P.R.x + p[0] * P.R.h, y: P.R.y + p[1] * P.R.h }; }
    function layout() {
      if (!K.w || !P) return;
      var W = K.w, H = K.h, S = Math.min(W, H);
      P.tol = G.clamp(S * TOLF, 16, 46);
      var cs = G.clamp(S * 0.13, 40, 70), pad = Math.max(P.tol, cs * 0.55) + 8;
      var hp = Math.max(40, Math.min(H - 2 * pad, (W - 2 * pad) / P.def.ar));
      P.R = { x: (W - hp * P.def.ar) / 2, y: (H - hp) / 2, h: hp };
      board.style.setProperty('--cs', cs + 'px');
      drawAll();
      var b = px(P.pts[P.N - 1]);
      goalEl.style.left = b.x + 'px'; goalEl.style.top = b.y + 'px';
      placeChar(P.front, true);
      P.nums.forEach(function (n, si) {
        var i = P.starts[si], a = px(P.pts[i]), c = px(P.pts[Math.min(P.N - 1, i + 1)]), L = Math.hypot(c.x - a.x, c.y - a.y) || 1, off = P.tol + 16;
        n.style.left = G.clamp(a.x - (c.x - a.x) / L * off, 16, W - 16) + 'px';
        n.style.top = G.clamp(a.y - (c.y - a.y) / L * off, 16, H - 16) + 'px';
      });
    }
    function strokePath(c, s) { c.beginPath(); s.forEach(function (p, k) { var q = px(p); if (k) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); }); }
    function drawAll() {
      var c = K.c; K.clear();
      c.lineCap = 'round'; c.lineJoin = 'round';
      /* 넓은 길 */
      P.def.s.forEach(function (s) { strokePath(c, s); c.strokeStyle = hexA(AREA, 0.17); c.lineWidth = P.tol * 2; c.stroke(); });
      /* 가운데 점선 */
      if (DOTA) {
        c.setLineDash([1, 15]);
        P.def.s.forEach(function (s) { strokePath(c, s); c.strokeStyle = hexA(AREA, DOTA); c.lineWidth = 7; c.stroke(); });
        c.setLineDash([]);
      }
      /* 가는 쪽 화살표 */
      c.strokeStyle = hexA(AREA, ARRA); c.lineWidth = 4;
      if (ARRA) P.starts.forEach(function (st, si) {
        var en = si + 1 < P.starts.length ? P.starts[si + 1] - 1 : P.N - 1, len = en - st;
        if (len < 8) return;
        (len > 60 ? [0.25, 0.55, 0.85] : len > 25 ? [0.35, 0.75] : [0.5]).forEach(function (f) {
          var i = st + Math.round(f * len), a = px(P.pts[Math.max(st, i - 1)]), b = px(P.pts[Math.min(en, i + 1)]), m = px(P.pts[i]);
          var ang = Math.atan2(b.y - a.y, b.x - a.x), s = Math.max(7, P.tol * 0.38);
          c.beginPath();
          c.moveTo(m.x - Math.cos(ang - 0.6) * s, m.y - Math.sin(ang - 0.6) * s); c.lineTo(m.x, m.y);
          c.lineTo(m.x - Math.cos(ang + 0.6) * s, m.y - Math.sin(ang + 0.6) * s); c.stroke();
        });
      });
      /* 출발 자리 · 도착 자리 */
      var a = px(P.pts[0]), e = px(P.pts[P.N - 1]);
      c.fillStyle = hexA(AREA, 0.22); c.beginPath(); c.arc(a.x, a.y, P.tol * 1.05, 0, 7); c.fill();
      c.strokeStyle = hexA(AREA, 0.5); c.lineWidth = 4; c.setLineDash([6, 6]); c.beginPath(); c.arc(e.x, e.y, P.tol * 1.1, 0, 7); c.stroke(); c.setLineDash([]);
      P.ink.forEach(drawInk);
    }
    function drawInk(s) {
      var c = K.c; c.strokeStyle = s.col; c.fillStyle = s.col; c.lineCap = 'round'; c.lineJoin = 'round';
      for (var k = 0; k < s.pts.length; k++) {
        var q = px(s.pts[k]), w = s.pts[k][2] * P.tol;
        if (!k) { c.beginPath(); c.arc(q.x, q.y, w / 2, 0, 7); c.fill(); continue; }
        var p0 = px(s.pts[k - 1]); c.lineWidth = w; c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(q.x, q.y); c.stroke();
      }
    }
    function placeChar(i, instant) {
      var q = px(P.pts[Math.max(0, i)]);
      if (instant) { charEl.classList.add('jump'); void charEl.offsetWidth; }
      charEl.style.left = q.x + 'px'; charEl.style.top = q.y + 'px';
      if (instant) { void charEl.offsetWidth; charEl.classList.remove('jump'); }
    }
    /* 손가락이 지나간 곳 근처의 길 점을 '지나감'으로 */
    function cover(X, Y) {
      var tolM = P.tol / P.R.h, t2 = tolM * tolM, near = Infinity;
      for (var i = 0; i < P.N; i++) {
        var dx = P.pts[i][0] - X, dy = P.pts[i][1] - Y, d2 = dx * dx + dy * dy;
        if (d2 < near) near = d2;
        if (d2 <= t2 && !P.cov[i]) { P.cov[i] = 1; P.covN++; }
      }
      return near <= t2 * 2.25;
    }
    function addPoint(x, y, p) {
      var X = (x - P.R.x) / P.R.h, Y = (y - P.R.y) / P.R.h, w = (0.55 + 0.9 * p) * 0.56;
      var prev = P.cur.pts[P.cur.pts.length - 1], c = K.c;
      P.cur.pts.push([X, Y, w]);
      c.strokeStyle = P.cur.col; c.fillStyle = P.cur.col; c.lineCap = 'round';
      var q = px([X, Y]);
      if (prev) { var p0 = px(prev); c.lineWidth = w * P.tol; c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(q.x, q.y); c.stroke(); }
      else { c.beginPath(); c.arc(q.x, q.y, w * P.tol / 2, 0, 7); c.fill(); }
      var from = prev || [X, Y], L = Math.hypot(X - from[0], Y - from[1]), n = Math.max(1, Math.ceil(L / (P.tol / P.R.h * 0.35)));
      for (var k = 1; k <= n; k++) { if (cover(from[0] + (X - from[0]) * k / n, from[1] + (Y - from[1]) * k / n)) P.onRoad += L / n; }
      P.drawn += L;
    }
    function frontier() {
      var cnt = 0, f = -1;
      for (var i = 0; i < P.N; i++) if (P.cov[i]) { cnt++; if (cnt >= 0.6 * (i + 1)) f = i; }
      return f;
    }
    function afterInput(isUp) {
      if (!P || P.done) return;
      var f = frontier(), now = performance.now();
      if (f > P.front) {
        P.front = f; placeChar(f);
        if (now - P.lastTone > 80) { P.lastTone = now; G.sfx.tone(392 * Math.pow(2, (f + 1) / P.N), 0.09, 'triangle', 0.13); }
        /* 6단계부터(획이 많은 글자): 다 쓴 획 번호는 흐리게 — 다음 번호가 잘 보이게 */
        if (lv >= 6) P.nums.forEach(function (n, si) { n.classList.toggle('past', si + 1 < P.starts.length && P.front >= P.starts[si + 1]); });
      }
      var cv = P.covN / P.N, end = P.cov[P.N - 1] || P.cov[P.N - 2];
      if (cv >= 0.8 && end) { finishPath(true); return; }
      if (!P.near && cv >= 0.6) { P.near = true; ctx.bubble(G.pick(['거의 다 왔어! ', '조금만 더! ']) + P.story.gn + '까지!'); }
      if (isUp && cv >= 0.8 && !end && !P.saidEnd) { P.saidEnd = true; ctx.bubble(P.story.gn + '까지 쭉 가 볼까?'); }
    }
    function pres(e) { return e.pointerType === 'pen' && e.pressure ? e.pressure : 0.5; }
    ctx.on(board, 'pointerdown', function (e) {
      if (!P || P.done || P.auto || pid !== null || !K.w) return;
      e.preventDefault(); pid = e.pointerId;
      try { board.setPointerCapture(pid); } catch (er) {}
      idle.poke();
      P.rect = board.getBoundingClientRect();
      P.cur = { col: P.col, pts: [] }; P.ink.push(P.cur);
      addPoint(e.clientX - P.rect.left, e.clientY - P.rect.top, pres(e));
      afterInput();
    });
    ctx.on(board, 'pointermove', function (e) {
      if (e.pointerId !== pid || !P || !P.cur || P.done) return;
      idle.poke();
      var evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
      if (!evs.length) evs = [e];
      evs.forEach(function (ev) { addPoint(ev.clientX - P.rect.left, ev.clientY - P.rect.top, pres(ev)); });
      afterInput();
    });
    function up(e) { if (e.pointerId !== pid) return; pid = null; if (P) { P.cur = null; afterInput(true); } }
    ctx.on(board, 'pointerup', up); ctx.on(board, 'pointercancel', up);

    function nudge() {
      if (!P || P.done || P.auto) return;
      var pts = [];
      for (var i = Math.max(0, P.front); i < P.N; i += 2) pts.push(px(P.pts[i]));
      ghost(ctx, board, pts, 1.8);
      wig(charEl);
      ctx.bubble(G.pick(['손가락으로 길을 따라 쭉~', G.josa(P.story.cn, '을', '를') + ' ' + P.story.gn + '까지 데려다줘!', '반짝이는 손가락을 따라 해 봐!']));
    }
    /* 오래 힘들면 — 자비스가 남은 길을 같이 그려 주고, 아이에게는 똑같이 성공으로 끝난다 */
    function autoComplete() {
      if (!P || P.done || P.auto) return;
      P.auto = true; pid = null; P.cur = null;
      ctx.say(G.pick(['자비스가 같이 그려 줄게! 쭉~', '같이 해 보자! 쭉~']), { repeat: false });
      var i = 0; while (i < P.N && P.cov[i]) i++;
      var ink = null, c = K.c, rate = P.N / 1.4;
      ctx.loop(function (dt) {
        if (!P || P.done) return false;
        var steps = Math.max(1, Math.round(rate * dt));
        for (var k = 0; k < steps && i < P.N; k++, i++) {
          if (!ink || P.sid[i] !== ink.sid) { ink = { col: HELPER, sid: P.sid[i], pts: [] }; P.ink.push(ink); }
          var w = 0.56; ink.pts.push([P.pts[i][0], P.pts[i][1], w]);
          if (ink.pts.length > 1) {
            var a = px(ink.pts[ink.pts.length - 2]), b = px(P.pts[i]);
            c.strokeStyle = HELPER; c.lineCap = 'round'; c.lineWidth = w * P.tol; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
          }
          if (!P.cov[i]) { P.cov[i] = 1; P.covN++; }
          P.front = i;
        }
        placeChar(P.front);
        if (i >= P.N) { finishPath(false); return false; }
      });
    }
    function finishPath(ok) {
      if (P.done) return;
      P.done = true; pid = null; P.cur = null;
      clearTimeout(P.autoH); clearTimeout(P.helpH);
      ctx.trial(ok); if (!ok) helped++;
      if (P.drawn > 0) { accSum += Math.min(1, P.onRoad / P.drawn); accN++; }
      var from = Math.max(0, P.front), to = P.N - 1, cur = P;
      ctx.loop(function (dt, t) {
        var k = Math.min(1, t / 0.6);
        placeChar(Math.round(from + (to - from) * k));
        if (k < 1) return;
        popEl(goalEl); G.sfx.play('up');
        ctx.cheer(cur.story.yum + ' ' + G.pick(TR_GOOD), goalEl).then(function () { return ctx.wait(450); }).then(cur.resolve);
        return false;
      });
    }
    function setPath(i) {
      return new Promise(function (resolve) {
        var def = TR_SHAPES[list[i]], story = stories[i % stories.length], r = trResample(def.s);
        G.$$('.tr-num', board).forEach(function (n) { n.remove(); });
        P = { def: def, story: story, col: CRAYON[i % CRAYON.length], pts: r.pts, sid: r.sid, starts: r.starts, N: r.pts.length,
          cov: new Uint8Array(r.pts.length), covN: 0, front: -1, ink: [], cur: null, nums: [], done: false, auto: false, near: false, saidEnd: false,
          drawn: 0, onRoad: 0, lastTone: 0, tol: 20, R: { x: 0, y: 0, h: 1 }, resolve: resolve };
        if (def.s.length > 1) def.s.forEach(function (_, si) { var n = G.el('<span class="tr-num">' + (si + 1) + '</span>'); board.appendChild(n); P.nums.push(n); });
        charEl.textContent = story.c; goalEl.textContent = story.g; goalEl.classList.remove('mt-pop');
        nameEl.innerHTML = def.k ? '<b>' + def.k + '</b>' + def.n : '';
        layout();
        idle.go();
        P.helpH = ctx.timeout(function () { if (!P.done && !P.auto && P.covN / P.N < 0.5) nudge(); }, pace(AUTO / 2));
        P.autoH = ctx.timeout(autoComplete, pace(AUTO));
        ctx.say((i === 0 ? '손가락으로 길을 따라 그려 봐! ' : '') + story.go + '. ' + def.say);
      });
    }

    for (var i = 0; i < list.length; i++) { ctx.progress(i, list.length); await setPath(i); }
    ctx.progress(list.length, list.length);
    ctx.extra.helped = helped;
    if (accN) ctx.extra.onRoad = Math.round(accSum / accN * 100);
    ctx.finish({ msg: G.pick(['길을 끝까지 따라갔어! 손가락이 척척!', '선 긋기 대장이야! 정말 멋졌어!']) });
  }
});

/* ===========================================================
   2. 점 잇기 — 눈손 협응·차례로 훑어보기
   점은 0~100 네모 좌표. c 는 다 이었을 때 그림이 나올 자리.
   =========================================================== */
function dtStar() { var p = []; for (var k = 0; k < 10; k++) { var a = (-90 + 36 * k) * Math.PI / 180, r = k % 2 ? 19 : 47; p.push([50 + r * Math.cos(a), 53 + r * Math.sin(a)]); } return p; }
var DT_PICS = {
  1: [
    { e: '🪁', w: '연', p: [[50, 6], [90, 46], [50, 94], [10, 46]] },
    { e: '🎁', w: '선물', p: [[14, 20], [86, 20], [86, 88], [14, 88]] },
    { e: '🚪', w: '문', p: [[26, 6], [74, 6], [74, 94], [26, 94]] },
    { e: '📺', w: '텔레비전', p: [[6, 20], [94, 20], [94, 80], [6, 80]] },
    { e: '🛶', w: '배', p: [[4, 36], [96, 36], [80, 76], [20, 76]], c: [50, 54] }
  ],
  2: [
    { e: '🏠', w: '집', p: [[16, 92], [16, 46], [50, 8], [84, 46], [84, 92], [50, 92]], c: [50, 60] },
    { e: '🐟', w: '물고기', p: [[6, 50], [40, 18], [94, 22], [72, 50], [94, 78], [40, 82]], c: [44, 50] },
    { e: '⛵', w: '돛단배', p: [[50, 4], [78, 56], [96, 66], [78, 92], [22, 92], [4, 66]], c: [50, 62] },
    { e: '🍦', w: '아이스크림', p: [[50, 96], [82, 44], [72, 14], [50, 4], [28, 14], [18, 44]], c: [50, 40] },
    { e: '🐝', w: '꿀벌 집', p: [[50, 4], [92, 27], [92, 73], [50, 96], [8, 73], [8, 27]] }
  ],
  3: [
    { e: '⭐', w: '별', p: dtStar(), c: [50, 55] },
    { e: '❤️', w: '하트', p: [[50, 92], [16, 60], [5, 34], [14, 12], [33, 6], [50, 22], [67, 6], [86, 12], [95, 34], [84, 60]], c: [50, 44] },
    { e: '🚀', w: '로켓', p: [[50, 3], [66, 26], [66, 66], [84, 92], [60, 82], [50, 97], [40, 82], [16, 92], [34, 66], [34, 26]], c: [50, 50] },
    { e: '🐱', w: '고양이', p: [[18, 6], [40, 28], [60, 28], [82, 6], [90, 46], [84, 74], [64, 92], [36, 92], [16, 74], [10, 46]], c: [50, 58] },
    { e: '🐠', w: '물고기', p: [[2, 44], [26, 22], [54, 18], [76, 40], [96, 20], [96, 80], [76, 60], [54, 82], [26, 78], [12, 62]], c: [44, 50] }
  ],
  /* 4단계(도전): 점 11~13개 — 점 사이가 가까워 더 정확히 짚어야 한다 (가장 가까운 두 점도 16 이상 떨어지게) */
  4: [
    { e: '👑', w: '왕관', p: [[6, 88], [6, 14], [17, 46], [28, 14], [39, 46], [50, 14], [61, 46], [72, 14], [83, 46], [94, 14], [94, 88], [50, 88]], c: [50, 64] },
    { e: '🌲', w: '나무', p: [[50, 4], [76, 36], [60, 36], [90, 70], [58, 70], [58, 96], [42, 96], [42, 70], [10, 70], [40, 36], [24, 36]], c: [50, 50] },
    { e: '🏰', w: '성', p: [[6, 94], [6, 10], [26, 10], [26, 38], [42, 38], [42, 20], [58, 20], [58, 38], [74, 38], [74, 10], [94, 10], [94, 94]], c: [50, 64] },
    { e: '🍄', w: '버섯', p: [[4, 52], [10, 30], [26, 12], [50, 6], [74, 12], [90, 30], [96, 52], [62, 52], [64, 90], [36, 90], [38, 52]], c: [50, 40] },
    { e: '🏡', w: '굴뚝 집', p: [[8, 94], [8, 48], [50, 8], [64, 21], [64, 5], [80, 5], [80, 37], [92, 48], [92, 94], [60, 94], [60, 66], [40, 66], [40, 94]], c: [50, 52] }
  ],
  /* 5단계(마스터): 점 14~15개 */
  5: [
    { e: '✈️', w: '비행기', p: [[50, 4], [58, 26], [58, 42], [96, 54], [96, 70], [58, 62], [58, 80], [72, 94], [28, 94], [42, 80], [42, 62], [4, 70], [4, 54], [42, 42], [42, 26]], c: [50, 56] },
    { e: '🍎', w: '사과', p: [[50, 26], [61, 14], [77, 11], [90, 24], [95, 46], [88, 72], [70, 92], [50, 86], [30, 92], [12, 72], [5, 46], [10, 24], [23, 11], [39, 14]], c: [50, 54] },
    { e: '🦋', w: '나비', p: [[50, 34], [68, 8], [92, 12], [90, 40], [68, 52], [88, 78], [64, 92], [50, 68], [36, 92], [12, 78], [32, 52], [10, 40], [8, 12], [32, 8]], c: [50, 50] },
    { e: '🏆', w: '트로피', p: [[22, 6], [78, 6], [94, 14], [88, 36], [70, 46], [58, 60], [58, 76], [74, 94], [26, 94], [42, 76], [42, 60], [30, 46], [12, 36], [6, 14]], c: [50, 34] },
    { e: '🎄', w: '크리스마스 나무', p: [[50, 2], [74, 26], [58, 26], [84, 48], [66, 48], [94, 74], [58, 74], [58, 96], [42, 96], [42, 74], [6, 74], [34, 48], [16, 48], [42, 26], [26, 26]], c: [50, 54] }
  ],
  /* 6단계(전문가): 점 16개 — 둥근 그림 (가장 가까운 두 점도 14 이상) */
  6: [
    { e: '🍀', w: '네잎클로버', p: [[12, 38], [17, 17], [38, 12], [50, 33], [62, 12], [83, 17], [88, 38], [67, 50], [88, 62], [83, 83], [62, 88], [50, 67], [38, 88], [17, 83], [12, 62], [33, 50]], c: [50, 50] },
    { e: '⛄', w: '눈사람', p: [[64, 43], [71, 28], [65, 12], [50, 6], [35, 12], [29, 28], [36, 43], [25, 53], [21, 68], [25, 82], [35, 93], [50, 97], [65, 93], [75, 82], [79, 68], [75, 53]], c: [50, 56] },
    { e: '🎈', w: '풍선', p: [[39, 69], [26, 60], [18, 47], [18, 31], [24, 17], [35, 7], [50, 3], [65, 7], [76, 17], [82, 31], [82, 47], [74, 60], [61, 69], [60, 84], [50, 97], [40, 84]], c: [50, 42] },
    { e: '🌙', w: '달', p: [[93, 62], [84, 80], [66, 92], [46, 95], [27, 88], [12, 73], [5, 54], [8, 34], [18, 18], [34, 7], [54, 4], [42, 20], [37, 38], [42, 56], [56, 68], [73, 70]], c: [40, 56] },
    { e: '🚗', w: '자동차', p: [[2, 74], [2, 52], [16, 46], [30, 24], [68, 24], [82, 46], [98, 52], [98, 74], [82, 74], [78, 60], [64, 60], [60, 74], [40, 74], [36, 60], [22, 60], [18, 74]], c: [50, 50] }
  ]
};
var DT_NOTE = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5, 1568, 1760];
/* 7~10단계 — 점에 적힌 것이 '1, 2, 3' 이 아니다: 2씩(7) · 5씩·10씩(8) 뛰어 세기(2학년 곱셈 구구의 기초),
   가나다 차례(9, 3학년 국어사전 찾기의 기초), 숫자와 글자 번갈아 1→가→2→나(10, 길 만들기 검사 B 처럼 두 차례를 오가기) */
var DT_GA = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하'];
var DT_MODE = {
  n2: { by: 2, say: '2씩 뛰어 세기! 2, 4, 6… 차례로 이어 봐! 2부터 시작!' },
  n5: { by: 5, say: '5씩 뛰어 세기! 5, 10, 15… 차례로 이어 봐! 5부터 시작!' },
  n10: { by: 10, say: '10씩 뛰어 세기! 10, 20, 30… 차례로 이어 봐! 10부터 시작!' },
  ga: { say: '이번엔 가나다 차례! 가, 나, 다… 가부터 시작!' },
  alt: { say: '숫자와 글자를 번갈아 이어요! 1, 가, 2, 나… 1부터 시작!' }
};
function dtLab(mode, k) {
  if (mode === 'ga') return DT_GA[k];
  if (mode === 'alt') return k % 2 ? DT_GA[(k - 1) / 2] : String(k / 2 + 1);
  return String((k + 1) * ((DT_MODE[mode] || {}).by || 1));
}
/* 단계마다 그림 묶음과 이름표 — 7단계부터는 4~6단계 그림을 새 이름표로 (가나다·번갈아는 점 14개까지) */
function dtSpec(L) {
  if (L <= 6) return { pics: DT_PICS[L], mode: function () { return 'n1'; } };
  var mid = DT_PICS[4].concat(DT_PICS[5]), le14 = mid.filter(function (q) { return q.p.length <= 14; });
  if (L === 7) return { pics: mid, mode: function () { return 'n2'; } };
  if (L === 8) return { pics: mid.concat(DT_PICS[6]), mode: function (q) { return q.p.length <= 15 && Math.random() < 0.5 ? 'n10' : 'n5'; } };
  return { pics: le14, mode: function () { return L === 9 ? 'ga' : 'alt'; } };
}

G.act({
  id: 'dots', area: 'motor', title: '점 잇기', icon: '⭐', order: 20, levels: 10, mins: 3, needs: [],
  ef: ['plan', 'attend'],
  desc: '숫자 점을 이으면 그림이 짠!',
  goal: '눈손 협응·시각 주사 — 다음 점을 눈으로 찾아 손가락으로 정확히 짚고 이어 가기, 수 순서(1→10)',
  how: '처음엔 부모가 "하나, 둘…" 같이 세며 다음 점을 손가락으로 가리켜 주세요. 손가락을 떼지 않고 쭉 끌어 이어도 되고 점을 하나씩 눌러도 돼요. 다 이으면 "무엇이 나왔지?" 하고 그림 이름을 말해 보게 해요.',
  basis: '시각-운동 협응·시각 주사(차례로 훑어보기) + 수 순서 — 점선·점 잇기는 글씨 쓰기 전 단계 활동. 4단계(도전)는 점 11~13개, 5단계(마스터)는 점 14~15개로 길게 이어 간다. 6~10단계는 점 16개 → 2씩·5씩·10씩 뛰어 세기 → 가나다 차례 → 숫자·글자 번갈아(길 만들기 검사 B), 7단계부터 다음 점 표시는 조금 기다렸다 나온다(시간 지연 촉구)',
  offline: '종이에 큰 점 4~6개를 찍고 번호를 써서 굵은 크레용으로 이어 보고, 바닥에 숫자 종이를 놓고 1→2→3 순서로 밟아 보세요.',
  run: async function (ctx) {
    var lv = ctx.level, B = ctx.body, AREA = areaHex(ctx), NP = lv >= 3 ? 3 : 4, TOP = topLv(ctx);
    B.innerHTML = '<div class="mt-wrap"><div class="mt-board dt-board"></div></div>';
    var board = G.$('.dt-board', B);
    var K = ctx.canvas(board, { onResize: layout });
    /* 칸이 오르면 마지막 그림 1~2개를 다음 단계 그림(점이 더 많은·새 이름표)으로 — 끝 단계(10)는 점이 조금 작아지고,
       다음 점 표시가 옅어진다 (2칸: 두근두근 멈춤, 3칸: 테두리만 — 이름표를 보고 찾기) */
    var NX = lv < TOP ? ctx.step - 1 : 0, own = dtSpec(lv), nxt = NX ? dtSpec(lv + 1) : null;
    var ownPics = G.sample(own.pics, NP - NX), nxPics = NX ? G.sample(nxt.pics.filter(function (q) { return ownPics.indexOf(q) < 0; }), NX) : [];
    var pics = ownPics.map(function (q) { return { pic: q, mode: own.mode(q) }; }).concat(nxPics.map(function (q) { return { pic: q, mode: nxt.mode(q) }; }));
    var P = null, pid = null, finger = null, missAll = 0, autoN = 0, lastMode = 'n1';
    var DOTR = ctx.tune([0.085, 0.072, 0.06, 0.054, 0.05, 0.048, 0.048, 0.048, 0.047, 0.046]);   /* 점 크기 — 칸이 오르면 조금씩 작게 (휴대폰에서는 지름 40px 밑으로 안 작아진다) */
    /* 7단계부터: 다음 점 표시(두근두근)는 조금 기다렸다 나온다 — 그 사이에 이름표를 보고 스스로 찾기 (시간 지연 촉구) */
    var CUE = ctx.tune([0, 0, 0, 0, 0, 0, 2500, 3500, 4500, 6000]);
    if (lv >= TOP && ctx.step > 1) board.classList.add(ctx.step === 2 ? 'calm-next' : 'soft-next');
    var idle = idler(ctx, pace(7000), nudge);

    function layout() {
      if (!K.w || !P) return;
      var W = K.w, H = K.h, S = Math.min(W, H);
      var r = G.clamp(S * DOTR, 20, 34);
      P.r = r; P.hit = Math.max(r * 1.55, 28);
      var Q = S - 2 * (r + 10), ox = (W - Q) / 2, oy = (H - Q) / 2;
      P.pos = P.pic.p.map(function (p) { return { x: ox + p[0] / 100 * Q, y: oy + p[1] / 100 * Q }; });
      board.style.setProperty('--d', (2 * r) + 'px');
      P.dots.forEach(function (d, k) { d.style.left = P.pos[k].x + 'px'; d.style.top = P.pos[k].y + 'px'; });
      var cc = P.pic.c || [P.pic.p.reduce(function (s, p) { return s + p[0]; }, 0) / P.n, P.pic.p.reduce(function (s, p) { return s + p[1]; }, 0) / P.n];
      P.reveal.style.left = (ox + cc[0] / 100 * Q) + 'px'; P.reveal.style.top = (oy + cc[1] / 100 * Q) + 'px';
      P.reveal.style.fontSize = Math.round(Q * 0.34) + 'px';
      draw();
    }
    function draw() {
      var c = K.c; K.clear();
      if (!P || !P.pos.length) return;
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (P.filled) {
        c.beginPath(); P.pos.forEach(function (p, k) { if (k) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.closePath();
        c.fillStyle = hexA(P.col, 0.22); c.fill();
      }
      /* 1단계: 다음 점까지 흐린 점선 길잡이 */
      if (lv === 1 && P.cur >= 0 && P.next < P.n && !P.locked) {
        var a = P.pos[P.cur], b = P.pos[P.next];
        c.setLineDash([2, 14]); c.strokeStyle = hexA(AREA, 0.45); c.lineWidth = 6;
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.setLineDash([]);
      }
      if (P.cur > 0 || P.closing > 0) {
        c.strokeStyle = P.col; c.lineWidth = Math.max(8, P.r * 0.45);
        c.beginPath();
        for (var k = 0; k <= P.cur; k++) { if (k) c.lineTo(P.pos[k].x, P.pos[k].y); else c.moveTo(P.pos[k].x, P.pos[k].y); }
        if (P.closing > 0) {
          var l = P.pos[P.n - 1], f = P.pos[0];
          c.lineTo(l.x + (f.x - l.x) * P.closing, l.y + (f.y - l.y) * P.closing);
        }
        c.stroke();
      }
      /* 손가락을 따라오는 고무줄 */
      if (finger && P.cur >= 0 && !P.locked) {
        var s = P.pos[P.cur];
        c.setLineDash([10, 10]); c.strokeStyle = hexA(P.col, 0.55); c.lineWidth = 6;
        c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(finger.x, finger.y); c.stroke(); c.setLineDash([]);
      }
    }
    function hitDot(q) {
      var best = -1, bd = Infinity;
      P.pos.forEach(function (p, k) { var d = dist(p, q); if (d <= P.hit && d < bd) { bd = d; best = k; } });
      return best;
    }
    function connect(k) {
      var d = P.dots[k];
      d.classList.remove('next', 'hint'); d.classList.add('on');
      if (k > 0) ctx.trial(!P.flagged);
      P.flagged = false; P.miss = 0; P.idleN = 0;
      P.cur = k; P.next = k + 1;
      G.sfx.tone(DT_NOTE[k % DT_NOTE.length], 0.16, 'triangle', 0.24); G.buzz(10);
      ctx.say(sayLab(k), { repeat: false, rate: 1 });
      if (P.next < P.n) {
        if (CUE) { var cur = P, nx = P.next; ctx.timeout(function () { if (P === cur && P.next === nx && !P.locked) P.dots[nx].classList.add('next'); }, pace(CUE)); }
        else P.dots[P.next].classList.add('next');
      }
      else closeShape();
      draw();
    }
    /* 이름표 — 1씩은 예전 그대로 숫자, 7단계부터는 뛰어 세기·가나다·번갈아 */
    function lab(k) { return P.mode === 'n1' ? String(k + 1) : dtLab(P.mode, k); }
    function sayLab(k) {
      if (P.mode === 'n1') return NUM[k + 1] || String(k + 1);
      if (P.mode === 'alt' && k % 2 === 0) return NUM[k / 2 + 1] || lab(k);
      return lab(k);
    }
    function wrong(k) {
      P.flagged = true; P.miss++; missAll++;
      G.sfx.play('oops'); wig(P.dots[k]);
      if (P.mode === 'n1') {
        if (P.miss >= 2) { hintEl(ctx, P.dots[P.next]); ctx.say('다음은 ' + (P.next + 1) + '번! 반짝이는 점을 눌러 봐.', { repeat: false }); }
        else ctx.bubble(G.pick(['음~ 그다음 숫자는 뭘까?', (P.next + 1) + '번은 어디 있을까?']));
        return;
      }
      if (P.miss >= 2) { hintEl(ctx, P.dots[P.next]); ctx.say('다음은 ' + sayLab(P.next) + '! 반짝이는 점을 눌러 봐.', { repeat: false }); return; }
      var by = (DT_MODE[P.mode] || {}).by;
      ctx.bubble(P.cur < 0 ? '처음은 ' + lab(0) + '부터!' : by ? '음~ ' + lab(P.cur) + ' 다음은 뭘까? ' + by + '씩 뛰어 세어 봐!' :
        P.mode === 'ga' ? '음~ ' + lab(P.cur) + ' 다음 글자는 뭘까?' : '숫자 다음엔 글자, 글자 다음엔 숫자!');
    }
    function nudge() {
      if (!P || P.locked) return;
      P.idleN++;
      if (P.idleN >= 3) {   /* 오래 멈춰 있으면 자비스가 한 칸 이어 준다 */
        P.flagged = true; autoN++;
        ctx.bubble('자비스가 하나 이어 줄게!');
        connect(P.next); return;
      }
      hintEl(ctx, P.dots[P.next]);
      if (P.mode === 'n1') ctx.bubble((P.cur < 0 ? '하나부터 시작해 볼까? ' : '') + '반짝반짝 ' + (P.next + 1) + '번을 눌러 봐!');
      else ctx.bubble((P.cur < 0 ? lab(0) + '부터 시작해 볼까? ' : '') + '반짝이는 ' + lab(P.next) + ' 점을 눌러 봐!');
    }
    function closeShape() {
      P.locked = true; finger = null; pid = null;
      G.sfx.play('up');
      var cur = P;
      ctx.loop(function (dt, t) {
        cur.closing = Math.min(1, t / 0.45); draw();
        if (cur.closing < 1) return;
        cur.filled = true; draw(); board.classList.add('done');
        G.sfx.play('sparkle');
        ctx.timeout(function () {
          cur.reveal.classList.add('on');
          ctx.cheer('짠! ' + cur.pic.w + '!', cur.reveal).then(function () { return ctx.wait(800); }).then(cur.resolve);
        }, 350);
        return false;
      });
    }
    function pointAt(e) { return { x: e.clientX - P.rect.left, y: e.clientY - P.rect.top }; }
    ctx.on(board, 'pointerdown', function (e) {
      if (!P || P.locked || pid !== null || !K.w) return;
      e.preventDefault(); pid = e.pointerId;
      try { board.setPointerCapture(pid); } catch (er) {}
      P.rect = board.getBoundingClientRect(); idle.poke();
      var q = pointAt(e), k = hitDot(q);
      if (k === P.next) connect(k);
      else if (k > P.next) wrong(k);
      if (!P.locked && P.cur >= 0) { finger = q; draw(); }
    });
    ctx.on(board, 'pointermove', function (e) {
      if (e.pointerId !== pid || !P || P.locked) return;
      var q = pointAt(e); idle.poke();
      if (P.next < P.n && dist(q, P.pos[P.next]) <= P.hit) connect(P.next);
      if (!P.locked && P.cur >= 0) { finger = q; draw(); }
    });
    function up(e) { if (e.pointerId !== pid) return; pid = null; finger = null; if (P) draw(); }
    ctx.on(board, 'pointerup', up); ctx.on(board, 'pointercancel', up);

    function onePic(pic, i, mode) {
      return new Promise(function (resolve) {
        board.classList.remove('done');
        G.$$('.dt-dot,.dt-reveal', board).forEach(function (x) { x.remove(); });
        P = { pic: pic, mode: mode, col: CRAYON[(i + 1) % CRAYON.length], n: pic.p.length, dots: [], pos: [], cur: -1, next: 0, miss: 0, flagged: false, idleN: 0,
          closing: 0, locked: false, filled: false, r: 24, hit: 36, resolve: resolve };
        pic.p.forEach(function (_, k) { var d = G.el('<span class="dt-dot">' + lab(k) + '</span>'); board.appendChild(d); P.dots.push(d); });
        P.reveal = G.el('<span class="dt-reveal" aria-hidden="true">' + pic.e + '</span>'); board.appendChild(P.reveal);
        P.dots[0].classList.add('next');
        layout();
        idle.go();
        if (mode === 'n1') ctx.say(i === 0 ? '숫자 점을 차례로 이어 봐! 하나부터 시작!' : G.pick(['이번엔 뭐가 나올까? 하나부터!', '또 이어 볼까? 하나부터 차례로!', '숫자를 따라가면 그림이 나와요!']));
        else ctx.say(mode !== lastMode ? DT_MODE[mode].say : G.pick(['이번엔 뭐가 나올까? ' + lab(0) + '부터!', '또 이어 볼까? ' + lab(0) + '부터 차례로!']));
        lastMode = mode;
      });
    }
    for (var i = 0; i < NP; i++) { ctx.progress(i, NP); await onePic(pics[i].pic, i, pics[i].mode); }
    ctx.progress(NP, NP);
    ctx.extra.wrong = missAll; ctx.extra.helped = autoN;
    ctx.finish({ msg: '점을 모두 이어서 그림을 찾았어! 최고야!' });
  }
});

/* ===========================================================
   3. 풍선 터뜨리기 — 움직이는 목표 겨냥 (3단계: 빨간 풍선만 — 참기,
      4단계: 중간에 한 번 '이번엔 파란 풍선만!' 규칙 바꾸기, 5단계: 규칙이 두 번 바뀐다)
   =========================================================== */
var PP_GIFT = [['🐥', '병아리'], ['⭐', '별'], ['🍬', '사탕'], ['🐰', '토끼'], ['🦋', '나비'], ['🌸', '꽃'], ['🐻', '곰돌이'], ['🍓', '딸기']];
var PP_CHEER = ['펑! 펑! 신난다!', '손가락이 정말 빨라!', '풍선 대장이다!', '우와, 또 터뜨렸어!', '콕콕 잘 누른다!'];
function ppSVG() {
  return '<svg viewBox="0 0 60 86" aria-hidden="true"><path class="st" d="M30 65 q-7 9 0 20"/><path class="kn" d="M25.5 61 L34.5 61 L30 66 Z"/>' +
    '<ellipse class="bd" cx="30" cy="31" rx="26" ry="30"/><ellipse class="sh" cx="20" cy="19" rx="6" ry="10" transform="rotate(-20 20 19)"/></svg>';
}
/* 6~10단계 규칙 판 — go: 누를 색(하나·둘), not: 이 색만 빼고 모두(반대로), seq: 이 차례대로 번갈아. w 는 판 길이 비율.
   6: 5단계 규칙 그대로 더 빠르고 작게  7: 두 가지 색  8: 반대로 규칙  9: 두 색 차례  10: 세 색 차례 */
var PP_PLAN = {
  6: [[{ go: ['red'] }, { go: ['blue'] }, { go: ['yellow'] }],
    [{ go: ['red'] }, { go: ['blue'] }, { go: ['yellow', 'green'] }],
    [{ go: ['red'] }, { go: ['blue', 'yellow'] }, { go: ['red', 'green'] }]],
  7: [[{ go: ['red', 'yellow'] }, { go: ['blue', 'green'] }, { go: ['red', 'blue'] }],
    [{ go: ['red', 'yellow'] }, { go: ['blue', 'green'] }, { not: 'red' }],
    [{ go: ['red', 'yellow'] }, { not: 'red' }, { go: ['blue', 'green'] }]],
  8: [[{ go: ['red'] }, { not: 'red' }, { go: ['blue', 'yellow'] }],
    [{ go: ['red'] }, { not: 'red' }, { seq: ['red', 'blue'] }],
    [{ go: ['red'] }, { seq: ['red', 'blue'] }]],
  9: [[{ seq: ['red', 'blue'] }],
    [{ seq: ['red', 'blue'], w: 2 }, { seq: ['red', 'yellow', 'blue'] }],
    [{ seq: ['red', 'blue'] }, { seq: ['red', 'yellow', 'blue'] }]],
  10: [[{ seq: ['red', 'yellow', 'blue'] }], [{ seq: ['red', 'yellow', 'blue'] }], [{ seq: ['red', 'yellow', 'blue'] }]]
};
function ppPlan(lv, st) {
  var L = PP_PLAN[lv][st - 1].map(function (r) {
    return { go: r.go && r.go.map(colorOf), not: r.not && colorOf(r.not), seq: r.seq && r.seq.map(colorOf), w: r.w || 1 };
  });
  var tot = L.reduce(function (a, r) { return a + r.w; }, 0), at = 0;
  L.forEach(function (r) { r.at = at / tot; at += r.w; });
  return L;
}
/* 규칙을 말로 */
function ppSay(r) {
  if (r.seq) return r.seq.map(function (c) { return c.name; }).join(', ') + (r.seq.length > 2 ? '! 차례로 돌아가며 콕!' : '! 차례로 번갈아 콕!');
  if (r.not) return '반대로, ' + r.not.adj + ' 풍선만 빼고 모두 콕!';
  return r.go.map(function (c) { return c.adj + ' 풍선'; }).join('이랑 ') + '만 콕!';
}

G.act({
  id: 'pop', area: 'motor', title: '풍선 터뜨리기', icon: '🎈', order: 30, levels: 10, mins: 1, needs: [],
  ef: ['attend', 'inhibit'],
  desc: '날아오는 풍선을 콕! 펑!',
  goal: '눈-손 협응·시각 추적 — 움직이는 목표를 눈으로 따라가며 검지 하나로 정확히 짚기 (3단계: 정해진 색만 누르고 나머지는 참기)',
  how: '검지 하나로 콕 누르게 해 주세요 — 손바닥으로 치면 "손가락 총!" 하고 모양을 보여 줘요. 풍선을 눈으로 따라가는 것도 연습이에요. 3단계에서 다른 색 풍선을 참으면 "참았네!" 하고 크게 칭찬해 주세요. 4·5단계는 중간에 누를 색이 바뀌어요 — "이번엔 무슨 색?" 하고 같이 말해 주세요.',
  basis: '눈-손 협응·움직이는 목표 겨냥(시각 추적) — 3단계는 Go/No-Go(반응 억제) 규칙, 4·5단계(도전·마스터)는 규칙 바꾸기(인지 유연성)를 더함. 6~10단계는 더 빠르고 작은 풍선 → 두 가지 색 → 반대로 규칙 → 두 색·세 색 차례(작업 기억 갱신)',
  offline: '비눗방울을 불어 주고 검지 하나로 콕 터뜨려 보세요. 익숙해지면 "높이 있는 방울만!", "큰 방울만!" 규칙을 붙여요.',
  run: function (ctx) {
    var lv = ctx.level, B = ctx.body;
    /* 칸이 오르면 풍선이 조금 더 자주·빨리 오고, 조금 작아진다 (다음 단계 쪽으로 1/3씩) */
    /* 4·5단계 숫자는 3단계에서 조금만 더 (풍선 너비는 손가락 크기를 생각해 46px 밑으로 내리지 않는다) */
    /* 6~10단계: 6단계에서 한 번 더 빠르고 작게(풍선은 44px 밑으로 작아지지 않는다), 그 뒤로는 규칙이 어려워지는 만큼 빠르기는 그대로 */
    var DUR = ctx.tune([30, 38, 45, 48, 50, 50, 52, 54, 56, 58]), SPAWN = pace(ctx.tune([1450, 1050, 850, 750, 680, 620, 620, 640, 660, 640])) / 1000,
      RISE = ctx.tune([8.5, 6.2, 4.8, 4.1, 3.8, 3.5, 3.5, 3.6, 3.8, 3.7]) * (calm() ? 1.35 : 1), MAXON = ctx.tune([4, 6, 7, 7, 8, 9, 9, 9, 8, 9]);
    var WF = ctx.tune([0.27, 0.21, 0.165, 0.1425, 0.13, 0.12, 0.12, 0.12, 0.125, 0.12]), WMIN = ctx.tune([84, 66, 54, 48, 46, 44, 44, 44, 44, 44]), WMAX = ctx.tune([130, 104, 86, 77, 72, 66, 66, 66, 68, 66]);
    var COLS = ['red', 'yellow', 'blue', 'green', 'orange', 'purple', 'pink'].map(colorOf);
    /* 3단계부터 정해진 색만 (Go/No-Go). 4단계는 중간에 한 번, 5단계는 두 번 누를 색이 바뀐다 */
    var GN = lv >= 3, RULES = lv >= 5 ? ['red', 'blue', 'yellow'] : lv === 4 ? ['red', 'blue'] : ['red'];
    RULES = RULES.map(colorOf);
    var target = RULES[0], OTHERS = COLS.filter(function (c) { return c !== target; }), rule = 0, sinceRule = 0, hold = 0;
    /* 6단계부터는 규칙 판(PH)으로 — 누를지 말지는 누르는 그 순간의 규칙으로 정한다 (차례 규칙은 누를 때마다 바뀐다) */
    var NEW = lv >= 6, PH = NEW ? ppPlan(lv, ctx.step) : null, ph = NEW ? PH[0] : null, seqI = 0;
    B.innerHTML = '<div class="mt-wrap"><div class="mt-top"><span class="mt-pill pp-count">🎈 <b>0</b></span>' +
      (NEW ? '<span class="mt-pill pp-rule">' + ruleHTML() + '</span>' : GN ? '<span class="mt-pill pp-rule">' + ppSVG() + ' <span class="pp-rt">빨간 풍선만 콕!</span></span>' : '') + '</div>' +
      '<div class="mt-bar pp-time"><b style="width:100%"></b></div><div class="pp-sky"><i class="pp-cloud c1"></i><i class="pp-cloud c2"></i><i class="pp-cloud c3"></i></div></div>';
    var sky = G.$('.pp-sky', B), cntEl = G.$('.pp-count b', B), tbar = G.$('.pp-time b', B), ruleEl = G.$('.pp-rule', B);
    var balloons = [], running = false, ended = false, el = 0, acc = SPAWN, spawned = 0, lastPi = -1, gifts = 0;
    sky._go = function (node) { var b = balloons.filter(function (o) { return o.el === node; })[0]; return !!b && !b.old && !b.dead && (NEW ? goNow(b.col) : b.go); };   /* 자동 검사용 */
    var st = { popped: 0, escaped: 0, wrong: 0, missedRed: 0 };

    function place(b) { b.el.style.transform = 'translate3d(' + (b.x - b.w / 2 + Math.sin(el * b.fr * 6.28 + b.ph) * b.amp) + 'px,' + b.y + 'px,0)'; }
    /* 6단계부터: 지금 규칙에서 이 색을 누르면 되나 */
    function goNow(col) {
      if (ph.seq) return col === ph.seq[seqI];
      if (ph.not) return col !== ph.not;
      return ph.go.indexOf(col) >= 0;
    }
    function ic(c, cls) { return '<i class="pp-ic' + (cls ? ' ' + cls : '') + '" style="--c:' + c.hex + '">' + ppSVG() + '</i>'; }
    function ruleHTML() {
      if (ph.seq) return ph.seq.map(function (c, i) { return ic(c, i === seqI ? 'now' : ''); }).join('<span class="pp-ar">→</span>') + ' <span class="pp-rt">차례로 콕!</span>';
      if (ph.not) return '<span class="pp-no">✋</span>' + ic(ph.not) + ' <span class="pp-rt">' + ph.not.adj + ' 풍선만 빼고 모두 콕!</span>';
      return ph.go.map(function (c) { return ic(c); }).join('') + ' <span class="pp-rt">' + ph.go.map(function (c) { return c.adj; }).join('·') + ' 풍선만 콕!</span>';
    }
    function newColor() {
      if (ph.seq) {
        var need = ph.seq[seqI], has = balloons.some(function (o) { return !o.old && !o.dead && o.col === need; }), r = Math.random();
        return !has || r < 0.4 ? need : r < 0.75 ? G.pick(ph.seq.filter(function (c) { return c !== need; })) : G.pick(COLS.filter(function (c) { return ph.seq.indexOf(c) < 0; }));
      }
      if (ph.not) return sinceRule >= 2 && Math.random() < 0.32 ? ph.not : G.pick(COLS.filter(function (c) { return c !== ph.not; }));
      return sinceRule < 2 || Math.random() < 0.5 ? G.pick(ph.go) : G.pick(COLS.filter(function (c) { return ph.go.indexOf(c) < 0; }));
    }
    function spawn() {
      var W = sky.clientWidth, H = sky.clientHeight; if (!W || !H) return;
      var w = G.clamp(W * WF, WMIN, WMAX), h = w * 1.43;
      var col = NEW ? newColor() : GN ? (sinceRule < 2 || Math.random() < 0.45 ? target : G.pick(OTHERS)) : G.pick(COLS);
      var x, tries = 0;
      do { x = w / 2 + Math.random() * Math.max(1, W - w); }
      while (tries++ < 8 && balloons.some(function (o) { return Math.abs(o.x - x) < w * 0.85 && o.y > H - h * 1.3; }));
      var go = NEW ? (ph.seq ? ph.seq.indexOf(col) >= 0 : goNow(col)) : !GN || col === target;
      var b = { x: x, y: H + 8, w: w, h: h, vy: (H + h * 1.5) / RISE, ph: Math.random() * 6.28, fr: 0.25 + Math.random() * 0.25, amp: w * 0.12, col: col,
        go: go, gift: go && Math.random() < 0.3 ? G.pick(PP_GIFT) : null, dead: false, no: false, old: false };
      b.el = G.el('<div class="pp-b" role="button" aria-label="' + col.name + ' 풍선" style="--c:' + col.hex + ';--w:' + Math.round(w) + 'px">' + ppSVG() + '</div>');
      b.el.addEventListener('pointerdown', function (e) { e.preventDefault(); tap(b); });
      sky.appendChild(b.el); balloons.push(b); spawned++; sinceRule++; place(b);
    }
    function bits(b, x, y) {
      for (var i = 0, n = calm() ? 4 : 8; i < n; i++) {
        var a = i / n * 6.28, r = b.w * (0.45 + Math.random() * 0.3);
        var s = G.el('<i class="pp-bit" style="--c:' + b.col.hex + ';left:' + x + 'px;top:' + y + 'px;--dx:' + Math.cos(a) * r + 'px;--dy:' + Math.sin(a) * r + 'px"></i>');
        sky.appendChild(s); setTimeout(function (n) { n.remove(); }.bind(null, s), 600);
      }
    }
    function tap(b) {
      if (b.dead || !running || b.old) return;   /* 규칙이 바뀌기 전 풍선은 날아가는 중 — 누르지 않는다 */
      var sr = sky.getBoundingClientRect(), r = b.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.width * 0.52;
      if (NEW ? !goNow(b.col) : !b.go) {
        if (!b.no) { b.no = true; st.wrong++; ctx.trial(false); b.vy *= 1.3; }
        G.sfx.play('oops'); b.el.classList.remove('no'); void b.el.offsetWidth; b.el.classList.add('no');
        floatText(sky, !NEW ? G.pick([target.adj + ' 풍선만!', '이건 그냥 보내 줘요~', '쉿, 참아요!']) : ph.seq ? '이번엔 ' + ph.seq[seqI].adj + ' 풍선 차례!' :
          ph.not ? '쉿, ' + ph.not.adj + ' 풍선은 참아요!' : G.pick([ph.go.map(function (c) { return c.adj; }).join('·') + ' 풍선만!', '이건 그냥 보내 줘요~', '쉿, 참아요!']), cx, cy - 30);
        return;
      }
      b.dead = true; st.popped++; ctx.trial(true); cntEl.textContent = st.popped;
      if (NEW && ph.seq) { seqI = (seqI + 1) % ph.seq.length; ruleEl.innerHTML = ruleHTML(); }
      bits(b, cx - sr.left, cy - sr.top); G.sfx.play('pop'); G.buzz(15);
      b.el.remove(); balloons.splice(balloons.indexOf(b), 1);
      if (b.gift) {
        var g = G.el('<span class="pp-gift" style="left:' + (cx - sr.left) + 'px;top:' + (cy - sr.top) + 'px">' + b.gift[0] + '</span>');
        sky.appendChild(g); setTimeout(function () { g.remove(); }, 1800);
        if (gifts++ % 3 === 0) ctx.bubble('풍선에서 ' + G.josa(b.gift[1], '이', '가') + ' 나왔어!');
      }
      if (st.popped % 5 === 0) { var line = G.pick(PP_CHEER); if (st.popped % 10 === 0) ctx.say(line, { repeat: false }); else ctx.bubble(line); }
    }
    function escape(b) {
      if (el >= DUR || b.old) return;   /* 끝난 뒤·규칙이 바뀌며 날아간 풍선은 세지 않는다 */
      if (!GN) { st.escaped++; ctx.trial(false); }
      else if (NEW ? !ph.seq && goNow(b.col) : b.go) st.missedRed++;
    }
    /* 규칙 바꾸기 (4·5단계) — 떠 있는 풍선은 흐려져 빨리 날아가고, 잠깐 쉬었다가 새 색 풍선부터 온다 */
    function switchRule() {
      rule++; sinceRule = 0; hold = pace(2600) / 1000;
      balloons.forEach(function (b) { b.old = true; b.el.style.opacity = '.45'; b.el.style.pointerEvents = 'none'; });
      G.sfx.play('up'); st.switches = rule;
      if (NEW) {
        ph = PH[rule]; seqI = 0;
        ruleEl.innerHTML = ruleHTML(); popEl(ruleEl);
        ctx.say('규칙이 바뀌었어! 이번엔 ' + ppSay(ph), { repeat: false });
        return;
      }
      target = RULES[rule]; OTHERS = COLS.filter(function (c) { return c !== target; });
      if (ruleEl) { ruleEl.style.setProperty('--c', target.hex); G.$('.pp-rt', ruleEl).textContent = target.adj + ' 풍선만 콕!'; popEl(ruleEl); }
      ctx.say('규칙이 바뀌었어! 이번엔 ' + target.adj + ' 풍선만 콕!', { repeat: false });
    }
    function end() {
      if (ended) return; ended = true; running = false;
      Object.assign(ctx.extra, st); ctx.extra.score = st.popped;
      ctx.progress(5, 5);
      ctx.finish({ msg: !st.popped ? '풍선이랑 신나게 놀았어! 다음엔 콕 눌러 보자!' : NEW && PH.some(function (r) { return r.seq; }) ? '풍선을 ' + st.popped + '개나 터뜨렸어! 차례를 기억하며 척척! 최고야!' : lv >= 4 ? '풍선을 ' + st.popped + '개나 터뜨렸어! 규칙이 바뀌어도 척척, 다른 색은 꾹 참았지? 최고야!' : lv === 3 ? '빨간 풍선을 ' + st.popped + '개나 터뜨렸어! 다른 색은 꾹 참았지? 최고야!' : '풍선 ' + st.popped + '개를 펑펑! 손가락 대장이야!' });
    }
    ctx.loop(function (dt) {
      if (!running) return;
      el += dt; acc += dt;
      if (NEW ? rule + 1 < PH.length && el >= DUR * PH[rule + 1].at : rule + 1 < RULES.length && el >= DUR * (rule + 1) / RULES.length) switchRule();
      if (hold > 0) { hold -= dt; acc = 0; }
      if (el < DUR && hold <= 0 && acc >= SPAWN && balloons.length < MAXON) { acc = 0; spawn(); }
      for (var i = balloons.length - 1; i >= 0; i--) {
        var b = balloons[i];
        b.y -= b.vy * dt * (el >= DUR || b.old ? 1.8 : 1); place(b);
        if (b.y < -b.h * 1.05) { balloons.splice(i, 1); b.el.remove(); if (!b.dead) escape(b); }
      }
      tbar.style.width = Math.max(0, 100 - el / DUR * 100) + '%';
      var pi = Math.min(4, Math.floor(el / DUR * 5)); if (pi !== lastPi) { lastPi = pi; ctx.progress(pi, 5); }
      if (el >= DUR && (!balloons.length || el > DUR + 4)) { end(); return false; }
    });
    ctx.progress(0, 5);
    if (ruleEl) popEl(ruleEl);
    ctx.say(NEW ? (lv === 6 ? '풍선이 더 빨라졌어! ' : '풍선이 날아와요! ') + (PH.length > 1 ? '먼저 ' : '') + ppSay(PH[0]) + (PH.length > 1 ? ' 중간에 규칙이 ' + (PH.length > 2 ? '두 번' : '한 번') + ' 바뀌니까 자비스 말을 잘 들어 봐!' : '') :
      lv >= 4 ? '풍선이 날아와요! 먼저 빨간 풍선만 콕! 중간에 규칙이 ' + (lv >= 5 ? '두 번' : '한 번') + ' 바뀌니까 자비스 말을 잘 들어 봐!' :
      lv === 3 ? '풍선이 날아와요! 빨간 풍선만 손가락으로 콕! 다른 색은 그냥 보내 줘요.' : '풍선이 둥둥 날아와요! 손가락 하나로 콕 눌러서 펑 터뜨려 봐!')
      .then(function () { return ctx.say('준비, 시작!', { repeat: false }); })
      .then(function () { running = true; G.sfx.play('up'); });
  }
});

/* ===========================================================
   4. 색깔 나누기 — 누른 채 끌어 옮기기 · 분류 (3단계 끝판은 범주로 규칙 바꾸기,
      4단계: 범주 바구니가 넷(옷 더하기), 5단계: 범주 판 뒤에 '다시 색깔로' 한 번 더 바꾸기)
   =========================================================== */
var SO_ITEMS = {
  red:    [['🍎', '사과'], ['🍓', '딸기'], ['🍅', '토마토'], ['🚒', '소방차'], ['❤️', '하트'], ['🌹', '장미']],
  yellow: [['🍌', '바나나'], ['🌽', '옥수수'], ['🐥', '병아리'], ['⭐', '별'], ['🌻', '해바라기'], ['💛', '하트'], ['🍋', '레몬']],
  blue:   [['🐳', '고래'], ['💙', '하트'], ['💧', '물방울'], ['🧢', '모자'], ['🦋', '나비']],
  green:  [['🐸', '개구리'], ['🥦', '브로콜리'], ['🍀', '네잎클로버'], ['🌲', '나무'], ['🥒', '오이'], ['💚', '하트'], ['🐢', '거북이']],
  orange: [['🍊', '귤'], ['🥕', '당근'], ['🦊', '여우'], ['🏀', '농구공'], ['🧡', '하트'], ['🎃', '호박']],
  purple: [['🍇', '포도'], ['🍆', '가지'], ['💜', '하트'], ['🔮', '구슬']]
};
var SO_CATS = { food: '#ef6c57', animal: '#e0a000', vehicle: '#3b9cf0', clothes: '#a066d3' };   /* 앞에서부터 k 개 (옷은 4단계부터) */
function soWords(cat) {
  var seen = {}, icon = (D.CATS[cat] || {}).e;
  return D.WORDS.filter(function (w) { if (w.c !== cat || w.e === icon || seen[w.e]) return false; seen[w.e] = 1; return true; })
    .map(function (w) { return { e: w.e, n: w.w }; });
}
/* 6단계부터 — 첫소리 바구니 (같은 그림이 두 바구니에 나오지 않게 골랐다) */
var SO_SOUND = {
  'ㄱ': { n: '기역', w: [['🚂', '기차'], ['🐳', '고래'], ['🐢', '거북이'], ['🎒', '가방'], ['🐱', '고양이'], ['🦒', '기린']] },
  'ㄴ': { n: '니은', w: [['🦋', '나비'], ['🌳', '나무'], ['⛄', '눈사람'], ['🐫', '낙타'], ['🍃', '나뭇잎'], ['👔', '넥타이']] },
  'ㄷ': { n: '디귿', w: [['🐷', '돼지'], ['🥕', '당근'], ['🌙', '달'], ['🍩', '도넛'], ['🐿️', '다람쥐'], ['🐬', '돌고래']] },
  'ㅁ': { n: '미음', w: [['👒', '모자'], ['🐴', '말'], ['🚪', '문'], ['🐟', '물고기'], ['🌈', '무지개'], ['🐙', '문어']] },
  'ㅂ': { n: '비읍', w: [['🍌', '바나나'], ['🚌', '버스'], ['⭐', '별'], ['✈️', '비행기'], ['👖', '바지'], ['🐝', '벌']] },
  'ㅅ': { n: '시옷', w: [['🍎', '사과'], ['🦁', '사자'], ['🍉', '수박'], ['⏰', '시계'], ['🐮', '소'], ['👟', '신발']] },
  'ㅇ': { n: '이응', w: [['🥛', '우유'], ['🦆', '오리'], ['🐒', '원숭이'], ['🥒', '오이'], ['✏️', '연필'], ['☂️', '우산']] },
  'ㅈ': { n: '지읒', w: [['🚗', '자동차'], ['🚲', '자전거'], ['🧤', '장갑'], ['🔔', '종'], ['🏠', '집'], ['🧃', '주스']] },
  'ㅊ': { n: '치읓', w: [['🧀', '치즈'], ['📖', '책'], ['🍒', '체리'], ['🍫', '초콜릿'], ['🛏️', '침대']] },
  'ㅋ': { n: '키읔', w: [['🐘', '코끼리'], ['🎂', '케이크'], ['📷', '카메라'], ['🍪', '쿠키'], ['🥝', '키위'], ['🦘', '캥거루']] },
  'ㅌ': { n: '티읕', w: [['🐰', '토끼'], ['🍅', '토마토'], ['🚚', '트럭'], ['🚕', '택시'], ['⛺', '텐트'], ['🌷', '튤립']] },
  'ㅍ': { n: '피읖', w: [['🍇', '포도'], ['🍕', '피자'], ['🐧', '펭귄'], ['🎈', '풍선'], ['🍍', '파인애플'], ['🎹', '피아노']] },
  'ㅎ': { n: '히읗', w: [['🦛', '하마'], ['🐯', '호랑이'], ['🍔', '햄버거'], ['☀️', '해'], ['❤️', '하트'], ['🎃', '호박']] }
};
var SO_SND_EASY = ['ㄱ', 'ㄴ', 'ㄷ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅎ'];   /* 거센소리(ㅊ ㅋ ㅌ ㅍ)는 10단계부터 — 기/키처럼 헷갈리는 짝 */
var SO_TINT = ['#ef6c57', '#e0a000', '#3b9cf0', '#a066d3'];
/* 색깔과 종류가 둘 다 있는 그림 — 같은 그림을 색깔로도, 종류로도 나눈다(7단계), 두 기준을 한꺼번에(9단계) */
var SO_CROSS = {
  red:    { food: [['🍎', '사과'], ['🍓', '딸기'], ['🍅', '토마토'], ['🍒', '체리']], animal: [['🐞', '무당벌레'], ['🦀', '게']] },
  green:  { food: [['🥦', '브로콜리'], ['🥒', '오이'], ['🍏', '풋사과']], animal: [['🐸', '개구리'], ['🐢', '거북이'], ['🐛', '애벌레']] },
  yellow: { food: [['🍌', '바나나'], ['🌽', '옥수수'], ['🍋', '레몬']], animal: [['🐥', '병아리'], ['🐝', '꿀벌']] },
  orange: { food: [['🍊', '귤'], ['🥕', '당근'], ['🎃', '호박']], animal: [['🦊', '여우'], ['🐯', '호랑이']] }
};
/* 말로만 듣는 규칙(8단계)의 바구니 표시 — 그림 자체와 헷갈리지 않는 모양 */
var SO_MARK = [['🔺', '세모'], ['🟦', '네모'], ['🟢', '동그라미'], ['🔶', '마름모']];
/* 6~10단계 판 — 6: 색 → 종류 → 첫소리(세 기준)  7: 같은 그림을 색깔로, 다시 종류로  8: 말로만 들은 규칙
   9: 두 기준 한꺼번에(빨간 먹을 것·빨간 동물…)  10: 시간 안에 (시간이 지나도 끝까지 하고, 시간 안에 넣은 수만 점수) */
function soPlan(lv, st) {
  function b(m, k, n, x) { var o = { m: m, k: k, n: n }; for (var q in x || {}) o[q] = x[q]; return o; }
  var C = b('color', 4, 8), K = b('cat', 4, 8), S3 = b('sound', 3, 9), S4 = b('sound', 4, 8), BC = b('bi', 2, 8, { by: 'color' }), BK = b('bi', 2, 8, { by: 'cat' }),
    VK = b('cat', 3, 9, { verbal: true }), VS = b('sound', 3, 9, { verbal: true }), M = b('mx', 4, 8);
  function t(o, sec) { return b(o.m, o.k, o.n, { by: o.by, verbal: o.verbal, sec: sec }); }
  var P = {
    6: [[C, K, S3], [C, K, S4], [BC, BK, S3]],
    7: [[BC, BK, S4], [BC, BK, VS], [BC, VK, VS]],
    8: [[C, VK, VS], [C, VK, M], [VK, M, M]],
    9: [[K, M, M], [K, M, t(M, 6.5)], [t(C, 6.5), M, t(M, 6.5)]],
    10: [[t(C, 6), t(S4, 6), t(M, 6)], [t(C, 5.5), t(S4, 5.5), t(M, 5.5)], [t(C, 5), t(S4, 5), t(M, 5)]]
  };
  return P[lv][st - 1].map(function (o) { return b(o.m, o.k, o.n, { by: o.by, verbal: o.verbal, sec: o.sec }); });
}

G.act({
  id: 'sort', area: 'motor', title: '색깔 나누기', icon: '🧺', order: 40, levels: 10, mins: 3, needs: [],
  ef: ['shift', 'attend'],
  desc: '같은 색끼리 바구니에 쏙',
  goal: '끌어 옮기기 조절 — 손가락으로 누른 채 원하는 곳까지 옮기고 놓기, 색·범주(먹을 것·동물·탈것) 분류',
  how: '손가락으로 꾹 누른 채 바구니까지 끌고 가는 것이 목표예요(누르고·옮기고·놓기). 끌기가 어려우면 그림을 한 번 누르고 바구니를 눌러도 돼요. 넣을 때마다 "빨간 사과!"처럼 색 이름을 같이 말해 주세요. 6단계부터는 첫소리(기역·비읍…), 같은 그림을 색깔↔종류로 바꿔 나누기, 말로만 듣는 규칙(🔊 로 다시 듣기), 두 기준 한꺼번에, 시간 안에(시간이 지나도 끝까지 해요) 나누기가 차례로 나와요.',
  basis: '지속적으로 누르며 끌기(잡기-옮기기-놓기)와 분류 — 색 → 범주 규칙 바꾸기(카드 나누기 DCCS의 기초). 4단계(도전)는 범주 바구니 넷, 5단계(마스터)는 색 → 범주 → 다시 색으로 두 번 바꾸기. 6~10단계: 세 번째 기준(첫소리, 음운 인식) → 같은 그림 두 기준(DCCS) → 말로만 주는 규칙(청각 작업 기억) → 두 기준 한꺼번에(2학년 수학 분류하기·다중 분류) → 너그러운 시간 제한',
  offline: '빨래 갤 때 "양말은 여기, 수건은 저기" 나누고, 색 블록을 집게로 집어 같은 색 컵에 옮겨 보세요.',
  run: async function (ctx) {
    var lv = ctx.level;
    var plan = lv === 1 ? [{ m: 'color', k: 2, n: 6 }, { m: 'color', k: 2, n: 6 }]
      : lv === 2 ? [{ m: 'color', k: 3, n: 6 }, { m: 'color', k: 3, n: 6 }]
      : lv === 3 ? [{ m: 'color', k: 4, n: 8 }, { m: 'cat', k: 3, n: 6 }]
      : lv === 4 ? [{ m: 'color', k: 4, n: 8 }, { m: 'cat', k: 4, n: 8 }]
      : lv === 5 ? [{ m: 'color', k: 4, n: 8 }, { m: 'cat', k: 4, n: 8 }, { m: 'color', k: 4, n: 8, back: true }]
      : soPlan(lv, ctx.step);
    /* 칸이 오르면 끝판만 조금 어렵게 — 2칸: 그림이 조금 더 많이, 3칸: 다음 단계처럼(바구니 하나 더 · 다시 바꾸는 판).
       5단계 2·3칸은 6단계의 첫소리 바구니를 한 판 미리 해 본다. 6단계부터는 soPlan 표에 칸마다 적어 두었다 */
    var last = plan[plan.length - 1], st = ctx.step;
    if (lv === 1) { if (st === 2) last.n = 8; else if (st === 3) last.k = 3; }
    else if (lv === 2) { if (st === 2) last.n = 9; else if (st === 3) { last.k = 4; last.n = 8; } }
    else if (lv === 3) { if (st === 2) last.n = 9; else if (st === 3) { last.k = 4; last.n = 8; } }
    else if (lv === 4) { if (st === 2) last.n = 12; else if (st === 3) plan.push({ m: 'color', k: 3, n: 6, back: true }); }
    else if (lv === 5 && st > 1) plan.push({ m: 'sound', k: st === 2 ? 2 : 3, n: 6 });
    var pool = lv === 1 ? ['red', 'yellow', 'blue', 'green'] : ['red', 'yellow', 'blue', 'green', 'orange', 'purple'];
    var used = [], misses = 0, acc = { score: 0, timed: false }, sndUsed = [], mxUsed = [], biSet = null;
    var idle = idler(ctx, pace(12000), null);
    for (var b = 0; b < plan.length; b++) {
      ctx.progress(b, plan.length);
      var sp = plan[b], ids;
      if (sp.m === 'sound') {   /* 첫소리 — 앞 판과 다른 소리부터 */
        var sp0 = lv >= 10 ? Object.keys(SO_SOUND) : SO_SND_EASY, fr = sp0.filter(function (c) { return sndUsed.indexOf(c) < 0; });
        ids = G.sample(fr.length >= sp.k ? fr : sp0, sp.k); sndUsed = sndUsed.concat(ids);
      } else if (sp.m === 'bi') {   /* 같은 그림 여덟 개를 두 판에 같이 쓴다 */
        if (!biSet) biSet = soBiSet();
        ids = sp.by === 'color' ? biSet.cols : ['food', 'animal']; sp.items = biSet.items;
      } else if (sp.m === 'mx') {
        var cs0 = Object.keys(SO_CROSS), cf = cs0.filter(function (c) { return mxUsed.indexOf(c) < 0; }), cs = G.sample(cf.length >= 2 ? cf : cs0, 2);
        mxUsed = mxUsed.concat(cs);
        ids = [{ c: cs[0], k: 'food' }, { c: cs[0], k: 'animal' }, { c: cs[1], k: 'food' }, { c: cs[1], k: 'animal' }];
      } else {
        var fresh = pool.filter(function (id) { return used.indexOf(id) < 0; });
        ids = sp.m === 'color' ? (fresh.length >= sp.k ? G.sample(fresh, sp.k) : G.sample(pool, sp.k)) : Object.keys(SO_CATS).slice(0, sp.k);
        used = used.concat(ids);
      }
      if (sp.sec) { sp.time = pace(sp.n * sp.sec * 1000 + 4000) / 1000; acc.timed = true; }
      misses += await sortBoard(ctx, sp, b, ids, idle, acc);
    }
    ctx.progress(plan.length, plan.length);
    ctx.extra.misses = misses;
    if (acc.timed) ctx.extra.score = acc.score;   /* 시간 안에 넣은 그림 수 */
    ctx.finish({ msg: '같은 것끼리 척척 나눴어! 정리 대장이야!' });
  }
});

/* 같은 그림 두 기준(7단계) — 색 둘 × 먹을 것·동물 × 두 개씩 */
function soBiSet() {
  var cols = G.sample(Object.keys(SO_CROSS), 2), items = [];
  cols.forEach(function (c) { ['food', 'animal'].forEach(function (k) { G.sample(SO_CROSS[c][k], 2).forEach(function (x) { items.push({ e: x[0], n: x[1], c: c, k: k }); }); }); });
  return { cols: cols, items: items };
}

function sortBoard(ctx, spec, bi, ids, idle, acc) {
  return new Promise(function (resolve) {
    var B = ctx.body, m = spec.m, color = m === 'color' || (m === 'bi' && spec.by === 'color');
    acc = acc || { score: 0 };
    B.innerHTML = '';
    var groups = ids.map(function (id, gi) {
      if (color) { var c = colorOf(id); return { id: id, hex: c.hex, name: c.name, adj: c.adj, label: '<i></i>' + c.name }; }
      if (m === 'sound') { var sd = SO_SOUND[id], ro = sd.n === '리을' ? '리을로' : sd.n + '으로'; return { id: id, hex: SO_TINT[gi % SO_TINT.length], name: ro + ' 시작하는 말', ro: ro, label: '<span class="ce">' + id + '</span>' + sd.n }; }
      if (m === 'mx') { var cc = colorOf(id.c), ct = D.CATS[id.k]; return { id: id.c + '-' + id.k, c: id.c, k: id.k, hex: cc.hex, name: cc.adj + ' ' + ct.name, label: '<span class="bi2"><i></i><span class="ce">' + ct.e + '</span></span>' + ct.name }; }
      var cat = D.CATS[id]; return { id: id, hex: SO_CATS[id], name: cat.name, label: '<span class="ce">' + cat.e + '</span>' + cat.name };
    });
    /* 말로만 듣는 규칙 — 바구니에는 모양 표시만, 무엇을 넣을지는 자비스 말로 */
    if (spec.verbal) G.shuffle(SO_MARK).slice(0, groups.length).forEach(function (mk, i) { var g = groups[i]; g.mk = mk; g.hex = '#8a94a6'; g.label = '<span class="ce">' + mk[0] + '</span>' + mk[1]; });
    var per = spec.n / groups.length, items = [];
    if (spec.items) items = spec.items.map(function (x) { return { e: x.e, n: x.n, g: groups.filter(function (g) { return g.id === (color ? x.c : x.k); })[0] }; });
    else groups.forEach(function (g) {
      var src = color ? SO_ITEMS[g.id].map(function (x) { return { e: x[0], n: x[1] }; })
        : m === 'sound' ? SO_SOUND[g.id].w.map(function (x) { return { e: x[0], n: x[1] }; })
        : m === 'mx' ? SO_CROSS[g.c][g.k].map(function (x) { return { e: x[0], n: x[1] }; }) : soWords(g.id);
      G.sample(src, per).forEach(function (it) { it.g = g; items.push(it); });
    });
    items = G.shuffle(items);
    var wrap = G.el('<div class="mt-wrap">' + (spec.time ? '<div class="mt-bar so-time"><b style="width:100%"></b></div>' : '') + '<div class="so-tray"></div><div class="so-baskets" style="--n:' + groups.length + '"></div></div>');
    B.appendChild(wrap);
    var tray = G.$('.so-tray', wrap), bks = G.$('.so-baskets', wrap), sel = null, placed = 0, bmiss = 0, busy = false, timeUp = false, clockOn = false;
    if (!color && groups.length >= 4) bks.classList.add('so-cat4');
    var baskets = groups.map(function (g) {
      var el = G.el('<div class="so-bk" style="--c:' + g.hex + '"><div class="bh">' + g.label + '</div><div class="bin"></div><div class="bwv" aria-hidden="true">🧺</div></div>');
      bks.appendChild(el);
      var bk = { g: g, el: el, bin: G.$('.bin', el) };
      ctx.on(el, 'click', function () { if (sel && !busy) { var s = sel; select(null); put(s, bk); } });
      return bk;
    });
    items.forEach(function (it, k) {
      it.el = G.el('<div class="so-it" role="button" aria-label="' + G.esc(it.n) + '" style="animation-delay:' + (k * 0.06) + 's">' + it.e + '</div>');
      it.cell = k; it.jx = (Math.random() - 0.5) * 0.24; it.jy = (Math.random() - 0.5) * 0.24; it.el._gi = groups.indexOf(it.g);   /* (_gi: 자동 검사용) */
      tray.appendChild(it.el);
      liftDrag(ctx, it.el, {
        can: function () { return !it.done && !busy; },
        start: function () { select(null); idle.poke(); },
        move: function (x, y) { baskets.forEach(function (b) { b.el.classList.toggle('over', G.ui.inside(x, y, b.el, 14)); }); },
        drop: function (x, y) {
          baskets.forEach(function (b) { b.el.classList.remove('over'); });
          var bk = baskets.filter(function (b) { return G.ui.inside(x, y, b.el, 14); })[0];
          return bk ? put(it, bk) : false;
        },
        tap: function () { select(sel === it ? null : it); idle.poke(); }
      });
    });
    function select(it) { if (sel) sel.el.classList.remove('sel'); sel = it; if (it) it.el.classList.add('sel'); }
    function layoutItems() {
      var r = tray.getBoundingClientRect(); if (!r.width || !r.height) return;
      var cols = items.length > 6 ? 4 : 3, rows = Math.ceil(items.length / cols);
      tray.style.setProperty('--s', G.clamp(Math.min(r.width / cols, r.height / rows) * 0.72, 54, 104) + 'px');
      items.forEach(function (it) {
        if (it.done) return;
        var c = it.cell % cols, rr = Math.floor(it.cell / cols);
        it.el.style.left = ((c + 0.5 + it.jx) / cols * 100) + '%'; it.el.style.top = ((rr + 0.5 + it.jy) / rows * 100) + '%';
      });
    }
    function put(it, bk) {
      idle.poke();
      if (bk.g === it.g) {
        it.done = true; placed++;
        if (!it.missed) ctx.trial(true);
        if (spec.time && !timeUp) acc.score++;
        flyInto(it.el, bk.bin, 'in');
        bk.el.classList.remove('got'); void bk.el.offsetWidth; bk.el.classList.add('got');
        G.sfx.play('pop'); G.buzz(12);
        var c = G.fx.center(bk.el); G.fx.burst(c[0], c[1]);
        var line = color ? it.g.adj + ' ' + it.n + '!' : m === 'sound' ? G.josa(it.n, '은', '는') + ' ' + it.g.ro + ' 시작해요!' : G.josa(it.n, '은', '는') + ' ' + it.g.name + '!';
        if (placed < items.length) ctx.say(G.pick(['딩동! ', '쏙! ', '맞아! ', '']) + line, { repeat: false });
        else {
          busy = true; idle.stop(); clockOn = false;
          ctx.say(line, { repeat: false }).then(function () {
            return ctx.cheer(G.pick(m === 'sound' ? ['첫소리 박사네! 다 나눴어!', '소리를 잘 듣고 척척! 최고야!'] : m === 'mx' ? ['색깔도 종류도 척척! 분류 박사네!', '두 가지를 한꺼번에 척척! 최고야!'] :
              spec.verbal ? ['말로 들은 규칙도 척척! 최고야!', '잘 듣고 기억했네! 멋져!'] :
              color ? (spec.back ? ['다시 색깔로도 척척! 규칙 바꾸기 대장!', '규칙이 바뀌어도 척척! 최고야!'] : ['다 나눴다! 같은 색끼리 척척!', '색깔 박사네! 최고야!']) : [groups.map(function (g) { return g.name; }).join(', ') + '! 다 나눴어!', '규칙이 바뀌어도 척척! 최고야!']));
          }).then(function () { return ctx.wait(400); }).then(function () { resolve(bmiss); });
        }
        return true;
      }
      if (!it.missed) { it.missed = true; bmiss++; ctx.trial(false); }
      G.sfx.play('oops'); G.ui.wiggle(bk.el);
      var right = baskets.filter(function (b) { return b.g === it.g; })[0];
      hintEl(ctx, right.el);
      if (spec.verbal) ctx.say('음~ ' + G.josa(it.n, '은', '는') + ' ' + it.g.name + '! ' + G.josa(it.g.name, '은', '는') + ' ' + it.g.mk[1] + ' 바구니야.', { repeat: false });
      else ctx.say('음~ ' + G.josa(it.n, '은', '는') + ' ' + G.josa(it.g.name, '이야', '야') + '. 반짝이는 바구니에 쏙!', { repeat: false });
      return false;
    }
    /* 너그러운 시계 — 시간이 다 돼도 끝나지 않는다. 시간 안에 넣은 그림 수만 점수(acc.score)로 */
    function startClock() {
      if (!spec.time || clockOn || timeUp) return;
      clockOn = true;
      var bar = G.$('.so-time b', wrap);
      ctx.loop(function (dt, t) {
        if (!clockOn) return false;
        bar.style.width = Math.max(0, 100 - t / spec.time * 100) + '%';
        if (t < spec.time) return;
        timeUp = true; clockOn = false;
        ctx.say('시간이 다 됐어도 괜찮아! 끝까지 넣어 보자!', { repeat: false });
        return false;
      });
    }
    function rule() { return groups.map(function (g) { return G.josa(g.name, '은', '는') + ' ' + g.mk[1] + ' 바구니'; }).join(', ') + '!'; }
    idle.fn = function () {
      var it = items.filter(function (x) { return !x.done; })[0]; if (!it || busy) return;
      wig(it.el); hintEl(ctx, baskets.filter(function (b) { return b.g === it.g; })[0].el);
      ctx.bubble(G.josa(it.n, '은', '는') + ' 어느 바구니에 들어갈까?');
    };
    ctx.on(window, 'resize', layoutItems);
    requestAnimationFrame(layoutItems);
    var names = groups.map(function (g) { return g.name; }).join(', ');
    var anno = spec.verbal ? announce(ctx, wrap, '👂', '잘 듣고 기억해요!', '바구니에는 모양만 있어요').then(function () { return ctx.say(rule()); })
      : m === 'sound' ? announce(ctx, wrap, '🔤', '이번엔 첫소리로 나눠요!', groups.map(function (g) { return SO_SOUND[g.id].n; }).join(', ') + ' — 처음 소리가 같은 말끼리!')
      : m === 'mx' ? announce(ctx, wrap, '🧩', '두 가지를 한꺼번에 봐요!', '색깔도 보고 종류도 보고 나눠 줘!')
      : m === 'bi' ? announce(ctx, wrap, color ? '🎨' : '🔄', color ? '같은 그림, 먼저 색깔로!' : '같은 그림을 이번엔 종류로!', names + '끼리 나눠 줘!')
      : !color || spec.back ? (spec.back ? announce(ctx, wrap, '🎨', '이번엔 다시 색깔이에요!', '같은 색끼리 나눠 줘!')
        : announce(ctx, wrap, '🔄', '이번엔 규칙이 바뀌어요!', names + '끼리 나눠 줘!')) : null;
    if (anno) {
      busy = true; idle.stop();
      anno.then(function () { busy = false; idle.go(); if (spec.time) ctx.say('시간 안에 쏙쏙! 시작!', { repeat: false }); startClock(); });
    } else {
      idle.go();
      ctx.say(spec.time ? '시간 안에 같은 색끼리 쏙쏙! 시간이 지나도 괜찮아. 시작!' : bi === 0 ? '같은 색깔끼리 바구니에 넣어 줘! 손가락으로 꾹 눌러서 끌고 가 봐.' : G.pick(['이번엔 다른 색깔이야! 같은 색끼리 쏙!', '또 나눠 볼까? 같은 색끼리!']));
      startClock();
    }
  });
}

/* ===========================================================
   5. 공 굴리기 — 두 손으로 기기를 잡고 기울이기 (양측 협응·힘 조절)
   기울기 센서가 없거나 허락하지 않으면 손가락으로 공을 끈다.
   길은 '진행 방향 a · 가로 b' 좌표로 만들고, 화면이 세로면 돌리고 무작위로 뒤집는다.
   =========================================================== */
var TL_BALLS = ['#ff7043', '#42a5f5', '#ab47bc', '#ec407a'];   /* 펠트 위에서 잘 보이는 공 색 */
var TL_GOOD = ['쏙! 들어갔다!', '골인! 잘했어!', '살살 기울여서 해냈네!', '구멍에 쏙! 최고야!', '와, 공이 쏙 들어갔어!'];
/* 6~10단계 — 4단계(벽 셋)·5단계(벽 넷) 길 위에 한 가지씩 얹는다.
   6: 별 둘 모으기(다 모으면 구멍 뚜껑이 열린다)  7: + 열렸다 닫혔다 하는 문(때 맞추기)  8: 벽 넷 + 문 + 별
   9: 공 두 개 + 문  10: 공 두 개 + 벽 넷 + 문 + 별 */
var TL_MORE = { 6: { walls: 4, stars: 2 }, 7: { walls: 4, stars: 2, gate: 1 }, 8: { walls: 5, stars: 2, gate: 1 }, 9: { walls: 4, gate: 1, two: 1 }, 10: { walls: 5, gate: 1, two: 1, stars: 2 } };
/* 별 자리 — 길에서 조금 비켜난 구석 (벽 길마다) */
var TL_POCKET = {
  4: [{ a: 0.08, b: 0.92 }, { a: 0.4, b: 0.07 }, { a: 0.6, b: 0.93 }, { a: 0.93, b: 0.9 }],
  5: [{ a: 0.06, b: 0.93 }, { a: 0.335, b: 0.06 }, { a: 0.505, b: 0.94 }, { a: 0.675, b: 0.06 }, { a: 0.94, b: 0.1 }]
};
var TL_NEW_SAY = {
  6: '이번엔 별이 있어! 별을 다 모으면 구멍 뚜껑이 열려!',
  7: '이번엔 열렸다 닫혔다 하는 문이 있어! 문이 열릴 때 지나가 봐!',
  8: '이번엔 나무 벽이 네 개에 문도 있어! 별을 모으고 천천히!',
  9: '이번엔 공이 두 개야! 두 공을 모두 구멍에 넣어 줘!',
  10: '공 두 개에 별도 있어! 별을 모으고 두 공을 모두 쏙!'
};
function tlLayout(lv) {
  var L = { walls: [], way: [] }, r = function (a, b) { return a + Math.random() * (b - a); };
  if (lv >= 6) {
    var X = TL_MORE[lv];
    L = tlLayout(X.walls);
    if (X.stars) L.stars = G.sample(TL_POCKET[X.walls], X.stars).sort(function (p, q) { return p.a - q.a; }).map(function (p) { return { a: p.a, b: p.b, got: false }; });
    if (X.gate) L.gate = X.walls === 4 ? 1 : 2;   /* 가운데 벽 틈에 문 */
    L.two = !!X.two;
    return L;
  }
  if (lv === 1) { L.start = { a: 0.14, b: r(0.25, 0.75) }; L.hole = { a: 0.86, b: r(0.2, 0.8) }; }
  else if (lv === 2) { L.walls.push({ a: 0.5, b0: 0, b1: 0.62 }); L.way.push({ a: 0.5, b: 0.82 }); L.start = { a: 0.14, b: 0.26 }; L.hole = { a: 0.86, b: 0.26 }; }
  else if (lv === 3) {
    L.walls.push({ a: 0.36, b0: 0, b1: 0.64 }, { a: 0.66, b0: 0.36, b1: 1 });
    L.way.push({ a: 0.36, b: 0.83 }, { a: 0.66, b: 0.17 });
    L.start = { a: 0.12, b: 0.24 }; L.hole = { a: 0.88, b: 0.76 };
  }
  else if (lv === 4) {   /* 도전: 벽 셋 — 지그재그로 세 번 돌아간다 */
    L.walls.push({ a: 0.3, b0: 0, b1: 0.66 }, { a: 0.5, b0: 0.34, b1: 1 }, { a: 0.7, b0: 0, b1: 0.66 });
    L.way.push({ a: 0.3, b: 0.83 }, { a: 0.5, b: 0.17 }, { a: 0.7, b: 0.83 });
    L.start = { a: 0.12, b: 0.24 }; L.hole = { a: 0.88, b: 0.24 };
  }
  else {                 /* 마스터: 벽 넷 — 벽 사이 길이 조금 좁아진다 (공 지름의 1.5배쯤은 남는다) */
    L.walls.push({ a: 0.25, b0: 0, b1: 0.66 }, { a: 0.42, b0: 0.34, b1: 1 }, { a: 0.59, b0: 0, b1: 0.66 }, { a: 0.76, b0: 0.34, b1: 1 });
    L.way.push({ a: 0.25, b: 0.83 }, { a: 0.42, b: 0.17 }, { a: 0.59, b: 0.83 }, { a: 0.76, b: 0.17 });
    L.start = { a: 0.09, b: 0.24 }; L.hole = { a: 0.91, b: 0.76 };
  }
  L.way.push(L.hole);
  L.flip = Math.random() < 0.5; L.mir = Math.random() < 0.5;
  return L;
}

G.act({
  id: 'tilt', area: 'motor', title: '공 굴리기', icon: '⛳', order: 50, levels: 10, mins: 3, needs: ['motion'],
  ef: ['plan', 'attend'],
  desc: '살살 기울여 공을 구멍에 쏙',
  goal: '양측 협응·힘 조절 — 두 손으로 기기를 잡고 조금씩 기울여 공의 움직임을 조절하기, 벽을 돌아가는 운동 계획',
  how: '기기 양옆을 두 손으로 잡고 아주 살살 기울이게 해 주세요 — 양손을 같이 쓰는 연습이에요. 너무 세게 기울이면 "거북이처럼 천천히~" 하고 말해 줘요. 기울기가 안 되는 기기는 손가락으로 공을 끌어도 돼요. 6단계부터는 별을 먼저 모으고, 열렸다 닫혔다 하는 문을 기다렸다 지나가고, 공 두 개를 함께 다뤄요 — "문이 열릴 때까지 기다려 볼까?" 하고 같이 세어 주세요.',
  basis: '양손으로 잡고 기울이기(양측 협응)·고유수용 감각 — 조금씩 조절하는 힘 조절(graded control)과 운동 계획. 4단계(도전)는 나무 벽 셋, 5단계(마스터)는 벽 넷과 조금 작은 구멍. 6~10단계는 별 모으기(순서 계획) → 열렸다 닫히는 문(때 맞추기·기다리기) → 벽 넷 → 공 두 개(두 물체를 함께 조절)',
  offline: '쟁반에 구슬이나 탁구공을 올리고 두 손으로 기울여 종이컵 안에 넣어 보세요.',
  run: function (ctx) {
    var lv = ctx.level, B = ctx.body, GOALS = lv >= 8 ? 3 : 4;
    /* 칸이 오르면 마지막 판(2칸: 1판, 3칸: 2판)을 다음 단계 길(나무 벽 하나 더·별·문·공 하나 더)로 미리 해 본다.
       구멍은 조금씩 작아지고, 구멍이 커지기·자비스 도움 전 기다림은 조금 길어진다 (끝 단계는 숫자만).
       8단계부터는 한 판이 길어져서 판을 셋으로 */
    var PRE = lv < topLv(ctx) ? ctx.step - 1 : 0, HOLE = ctx.tune([1.9, 1.6, 1.4, 1.3, 1.2, 1.2, 1.2, 1.15, 1.25, 1.2]),
      GROW = ctx.tune([15000, 20000, 25000, 27500, 30000, 32000, 34000, 36000, 38000, 40000]), HELP = ctx.tune([40000, 50000, 60000, 65000, 70000, 72000, 76000, 80000, 85000, 90000]);
    function goalLv(i) { return i >= GOALS - PRE ? lv + 1 : lv; }
    B.innerHTML = '<div class="mt-wrap"><div class="mt-top"><span class="mt-pill tl-count">⛳ <b>0</b> / ' + GOALS + '</span><span class="mt-pill tl-star" hidden>⭐ <b>0</b> / <i>2</i></span><button class="btn sm soft tl-mode" type="button" hidden></button></div>' +
      '<div class="tl-board"><div class="tl-start"><div class="te">⛳</div><div class="tt">기기를 <b>두 손</b>으로 꼭 잡고<br>살살 기울여서 공을 구멍에 쏙!</div>' +
      '<button class="btn big tl-go" type="button">▶ 시작</button><button class="btn soft tl-finger" type="button">👆 손가락으로 할래요</button></div></div></div>';
    var board = G.$('.tl-board', B), modeBtn = G.$('.tl-mode', B), cntEl = G.$('.tl-count b', B), startEl = G.$('.tl-start', B), starPill = G.$('.tl-star', B);
    var K = ctx.canvas(board, { onResize: onResize });
    var mode = null, oriOn = false, gotOri = false, base = null, tx = 0, ty = 0, drag = null, pid = null;
    var k = 0, L = null, walls = [], hole = null, holeR0 = 20, holeR = 20, balls = [], running = false, t0 = 0, guide = null, helping = false;
    var gate = null, locked = false, saidLock = false;
    var helped = 0, lastBump = 0, COL = {}, bg = null, prevW = 0, prevH = 0, r = 20, FR = 8;
    function live(b) { return !b.hide && !b.sink; }
    board._probe = function () {   /* 자동 검사용 */
      var b0 = balls.filter(live)[0] || balls[0];
      return b0 && hole && L ? { ball: { x: b0.x, y: b0.y }, hole: { x: hole.x, y: hole.y }, r: r, mode: mode, k: k, sunk: balls.every(function (b) { return !live(b); }),
        balls: balls.map(function (b) { return { x: b.x, y: b.y, sunk: !live(b) }; }), locked: locked,
        stars: (L.stars || []).filter(function (s) { return !s.got; }).map(function (s) { return { x: s.x, y: s.y }; }),
        gate: gate ? { solid: gate.solid, x: gate.x + gate.w / 2, y: gate.y + gate.h / 2 } : null,
        way: L.way.map(function (w) { return w === L.hole ? { x: hole.x, y: hole.y } : toXY(w.a, w.b); }) } : null;
    };

    function readCols() {
      var s = getComputedStyle(B);
      ['felt', 'dot', 'wall', 'wall2', 'hole', 'rim'].forEach(function (n) { COL[n] = s.getPropertyValue('--tl-' + n).trim() || '#888'; });
    }
    /* (a,b) → 화면 비율 좌표 */
    function toXY(a, b) {
      if (L.flip) a = 1 - a; if (L.mir) b = 1 - b;
      var tall = K.h > K.w * 1.12;
      return tall ? { x: b * K.w, y: a * K.h } : { x: a * K.w, y: b * K.h };
    }
    function build() {
      var W = K.w, H = K.h, S = Math.min(W, H), tall = H > W * 1.12;
      r = G.clamp(S * 0.055, 16, 30); FR = Math.max(6, r * 0.35);
      holeR0 = r * HOLE;
      var T = r * 1.1;
      function rect(w) {
        var a = L.flip ? 1 - w.a : w.a, b0 = L.mir ? 1 - w.b1 : w.b0, b1 = L.mir ? 1 - w.b0 : w.b1;
        return tall ? { x: b0 * W, y: a * H - T / 2, w: (b1 - b0) * W, h: T } : { x: a * W - T / 2, y: b0 * H, w: T, h: (b1 - b0) * H };
      }
      walls = L.walls.map(rect);
      hole = toXY(L.hole.a, L.hole.b);
      hole.x = G.clamp(hole.x, FR + holeR0 * 1.2, W - FR - holeR0 * 1.2); hole.y = G.clamp(hole.y, FR + holeR0 * 1.2, H - FR - holeR0 * 1.2);
      (L.stars || []).forEach(function (s) { var q = toXY(s.a, s.b); s.x = G.clamp(q.x, FR + r, W - FR - r); s.y = G.clamp(q.y, FR + r, H - FR - r); });
      /* 문 — 가운데 벽의 틈을 막았다 열었다 한다. 벽 쪽 끝(att)에서 미끄러져 나온다 */
      if (L.gate != null) {
        var gw = L.walls[L.gate], R = rect(gw.b0 > 0 ? { a: gw.a, b0: 0, b1: gw.b0 } : { a: gw.a, b0: gw.b1, b1: 1 }), wr = walls[L.gate];
        R.att = tall ? (wr.x + wr.w / 2 < R.x + R.w / 2 ? 'l' : 'r') : (wr.y + wr.h / 2 < R.y + R.h / 2 ? 't' : 'b');
        gate = gate && gate.L === L ? Object.assign(gate, R) : Object.assign({ L: L, k: 0, t: 0, want: false, solid: false }, R);
      } else gate = null;
      /* 바탕(펠트·나무 테두리·벽)은 한 번만 그려 둔다 */
      var dpr = K.dpr; bg = document.createElement('canvas'); bg.width = W * dpr; bg.height = H * dpr;
      var c = bg.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = COL.felt; c.fillRect(0, 0, W, H);
      c.fillStyle = COL.dot;
      for (var y = 14; y < H; y += 26) for (var x = (y / 26 % 2) * 13 + 10; x < W; x += 26) { c.beginPath(); c.arc(x, y, 1.8, 0, 7); c.fill(); }
      c.strokeStyle = COL.wall; c.lineWidth = FR * 2; c.strokeRect(0, 0, W, H);
      walls.forEach(function (w) { wood(c, w); });
    }
    function wood(c, w) {
      c.fillStyle = COL.wall; roundRect(c, w.x, w.y, w.w, w.h, Math.min(w.w, w.h) / 2); c.fill();
      c.fillStyle = COL.wall2;   /* 긴 쪽을 따라 밝은 결 */
      if (w.h > w.w) roundRect(c, w.x + w.w * 0.22, w.y + 5, w.w * 0.22, Math.max(2, w.h - 10), 3); else roundRect(c, w.x + 5, w.y + w.h * 0.22, Math.max(2, w.w - 10), w.h * 0.22, 3);
      c.fill();
    }
    function roundRect(c, x, y, w, h, rr) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, rr); else c.rect(x, y, w, h); }
    function onResize() {
      if (!L) { prevW = K.w; prevH = K.h; draw(); return; }
      readCols();
      var ow = prevW || K.w, oh = prevH || K.h;
      build();
      balls.forEach(function (b) { b.x = b.x * K.w / ow; b.y = b.y * K.h / oh; });
      prevW = K.w; prevH = K.h;
      draw();
    }
    function nextGoal() {
      readCols();
      var glv = goalLv(k);
      L = tlLayout(glv); gate = null; build(); prevW = K.w; prevH = K.h;
      var s = toXY(L.start.a, L.start.b);
      balls = [{ x: G.clamp(s.x, FR + r, K.w - FR - r), y: G.clamp(s.y, FR + r, K.h - FR - r), vx: 0, vy: 0, rot: 0, e: TL_BALLS[k % TL_BALLS.length], hide: false, sink: null }];
      if (L.two) {   /* 두 번째 공은 출발 자리 옆에 */
        var s2 = toXY(L.start.a, L.start.b + 0.22);
        balls.push({ x: G.clamp(s2.x, FR + r, K.w - FR - r), y: G.clamp(s2.y, FR + r, K.h - FR - r), vx: 0, vy: 0, rot: 0, e: TL_BALLS[(k + 1) % TL_BALLS.length], hide: false, sink: null });
      }
      holeR = holeR0; guide = null; helping = false; t0 = performance.now();
      locked = !!(L.stars && L.stars.length); saidLock = false;
      starPill.hidden = !locked;
      if (locked) { G.$('b', starPill).textContent = '0'; G.$('i', starPill).textContent = L.stars.length; }
      if (k > 0 && glv > lv && goalLv(k - 1) === lv) ctx.say(glv >= 6 ? TL_NEW_SAY[glv] : glv === 2 ? '이번엔 나무 벽이 생겼어! 벽을 돌아서 가 봐!' : glv === 3 ? '이번엔 나무 벽이 두 개야! 천천히 돌아서 가 봐!' : '이번엔 나무 벽이 ' + (glv === 4 ? '세' : '네') + ' 개야! 지그재그로 천천히 가 봐!');   /* 처음 보는 길은 미리 알려 준다 */
      else if (k > 0) ctx.say(glv === 1 ? G.pick(['이번엔 저쪽 구멍이야!', '또 해 볼까? 살살~']) : glv >= 6 ? G.pick(L.two ? ['두 공을 모두 구멍까지!', '공 두 개, 천천히 살살~'] : ['별을 모으고 구멍까지!', '별 먼저, 그다음 구멍!'])
        : G.pick(['나무 벽을 돌아서 가 봐!', '벽을 피해서 구멍까지!', '어느 쪽으로 돌아갈까?']));
    }
    function tiltAcc(deg) { var d = Math.abs(deg) < 1.5 ? 0 : deg - (deg > 0 ? 1.5 : -1.5); return Math.sin(G.clamp(d, -30, 30) * Math.PI / 180); }
    function bump(v) {
      var S = Math.min(K.w, K.h), now = performance.now();
      if (v > S * 0.35 && now - lastBump > 120) { lastBump = now; if (!calm()) G.sfx.play('tick'); if (v > S) G.buzz(8); }
    }
    function collide(ball) {
      var lo = FR + r, hx = K.w - FR - r, hy = K.h - FR - r;
      if (ball.x < lo) { ball.x = lo; bump(-ball.vx); ball.vx = Math.abs(ball.vx) * 0.45; }
      if (ball.x > hx) { ball.x = hx; bump(ball.vx); ball.vx = -Math.abs(ball.vx) * 0.45; }
      if (ball.y < lo) { ball.y = lo; bump(-ball.vy); ball.vy = Math.abs(ball.vy) * 0.45; }
      if (ball.y > hy) { ball.y = hy; bump(ball.vy); ball.vy = -Math.abs(ball.vy) * 0.45; }
      (gate && gate.solid ? walls.concat([gate]) : walls).forEach(function (w) {
        var cx = G.clamp(ball.x, w.x, w.x + w.w), cy = G.clamp(ball.y, w.y, w.y + w.h), dx = ball.x - cx, dy = ball.y - cy, d2 = dx * dx + dy * dy, nx, ny;
        if (d2 >= r * r) return;
        if (d2 < 1e-6) {
          var l = ball.x - w.x, rt = w.x + w.w - ball.x, t = ball.y - w.y, bt = w.y + w.h - ball.y, m = Math.min(l, rt, t, bt);
          if (m === l) { nx = -1; ny = 0; ball.x = w.x - r; } else if (m === rt) { nx = 1; ny = 0; ball.x = w.x + w.w + r; }
          else if (m === t) { nx = 0; ny = -1; ball.y = w.y - r; } else { nx = 0; ny = 1; ball.y = w.y + w.h + r; }
        } else { var d = Math.sqrt(d2); nx = dx / d; ny = dy / d; ball.x = cx + nx * r; ball.y = cy + ny * r; }
        var vn = ball.vx * nx + ball.vy * ny;
        if (vn < 0) { bump(-vn); ball.vx -= 1.45 * vn * nx; ball.vy -= 1.45 * vn * ny; }
      });
    }
    function physics(ball, dt) {
      var S = Math.min(K.w, K.h);
      if (guide && guide.b === ball) {   /* 자비스가 길을 따라 살살 밀어 준다 */
        var tp = guide[0], dx = tp.x - ball.x, dy = tp.y - ball.y, d = Math.hypot(dx, dy), sp = S * 0.7;
        if (d < 6 && guide.length > 1) guide.shift();
        else if (d > 1) { ball.vx = dx / d * sp; ball.vy = dy / d * sp; ball.x += ball.vx * Math.min(dt, d / sp); ball.y += ball.vy * Math.min(dt, d / sp); }
        ball.rot += ball.vx * dt / r; return;
      }
      var ax = 0, ay = 0;
      if (drag && drag.b === ball) { ax = (drag.x - ball.x) * 30 - ball.vx * 10; ay = (drag.y - ball.y) * 30 - ball.vy * 10; }
      else if (mode === 'tilt') { ax = tiltAcc(tx) * S * 2.8; ay = tiltAcc(ty) * S * 2.8; }
      ball.vx += ax * dt; ball.vy += ay * dt;
      if (!(drag && drag.b === ball)) { var f = Math.pow(mode === 'tilt' ? 0.45 : 0.2, dt); ball.vx *= f; ball.vy *= f; }
      var sp2 = Math.hypot(ball.vx, ball.vy), vmax = S * 1.5;
      if (sp2 > vmax) { ball.vx *= vmax / sp2; ball.vy *= vmax / sp2; sp2 = vmax; }
      var n = Math.max(1, Math.ceil(sp2 * dt / (r * 0.4)));
      for (var i = 0; i < n; i++) { ball.x += ball.vx * dt / n; ball.y += ball.vy * dt / n; collide(ball); }
      ball.rot += ball.vx * dt / r;
    }
    /* 공 두 개 — 부딪히면 살짝 밀어낸다 */
    function pairBump() {
      var a = balls[0], b = balls[1];
      if (!b || !live(a) || !live(b)) return;
      var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01;
      if (d >= 2 * r) return;
      var nx = dx / d, ny = dy / d, o = (2 * r - d) / 2;
      a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
      var vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (vn < 0) { a.vx += vn * nx * 0.9; a.vy += vn * ny * 0.9; b.vx -= vn * nx * 0.9; b.vy -= vn * ny * 0.9; }
      collide(a); collide(b);
    }
    function guideBall(b) {
      var tall = K.h > K.w * 1.12, a = tall ? b.y / K.h : b.x / K.w;
      if (L.flip) a = 1 - a;
      guide = L.way.filter(function (w, i) { return i === L.way.length - 1 || w.a > a + 0.02; }).map(function (w) { return w === L.hole ? { x: hole.x, y: hole.y } : toXY(w.a, w.b); });
      guide.b = b;
      if (drag && drag.b === b) drag = null;
    }
    function startGuide() {
      helping = true; drag = null;
      if (locked) { L.stars.forEach(function (s) { s.got = true; }); unlock(); }   /* 남은 별은 자비스가 모아 주고 */
      if (gate) { gate.want = false; gate.t = 0; }                                 /* 문은 열어 둔다 */
      var b = balls.filter(live)[0]; if (b) guideBall(b);
      ctx.say(G.pick(['자비스가 살짝 밀어 줄게!', '같이 해 보자! 데굴데굴~']), { repeat: false });
    }
    function unlock() {
      locked = false; G.$('b', starPill).textContent = L.stars.length;
      G.sfx.play('up'); ctx.bubble('구멍 뚜껑이 열렸어! 이제 구멍으로 쏙!');
    }
    /* 별 줍기 */
    function grab(ball) {
      if (!locked) return;
      L.stars.forEach(function (s) {
        if (s.got || Math.hypot(ball.x - s.x, ball.y - s.y) > r * 1.6) return;
        s.got = true; G.sfx.play('ding'); G.buzz(12);
        var br = board.getBoundingClientRect(); G.fx.burst(br.left + s.x, br.top + s.y, ['⭐', '✨']);
        var got = L.stars.filter(function (q) { return q.got; }).length;
        G.$('b', starPill).textContent = got; popEl(starPill);
        if (got === L.stars.length) unlock();
      });
    }
    /* 문 — 열림(2.6초)·닫힘(2초)을 되풀이. 닫힐 때 문 자리에 공이 있으면 기다렸다 닫는다 */
    function inDoor(pad) {
      return balls.some(function (b) {
        if (!live(b)) return false;
        var cx = G.clamp(b.x, gate.x, gate.x + gate.w), cy = G.clamp(b.y, gate.y, gate.y + gate.h);
        return Math.hypot(b.x - cx, b.y - cy) < r + pad;
      });
    }
    function gateTick(dt) {
      if (!gate) return;
      if (!helping) {
        var busy = gate.want && gate.k === 0 && inDoor(4);
        if (!busy) gate.t += dt;
        if (gate.t >= pace(gate.want ? 2000 : 2600) / 1000) { gate.t = 0; gate.want = !gate.want; }
      }
      if (gate.want) {
        if (gate.k === 0 && inDoor(4)) return;
        gate.k = Math.min(1, gate.k + dt / 0.35);
        if (gate.k >= 1 && !gate.solid) { if (inDoor(1)) { gate.want = false; gate.t = 0; } else { gate.solid = true; if (!calm()) G.sfx.play('tick'); } }
      } else { gate.solid = false; gate.k = Math.max(0, gate.k - dt / 0.25); }
    }
    function drawGate(c) {
      var g = gate, horiz = g.w > g.h;
      c.save(); c.setLineDash([6, 6]); c.strokeStyle = COL.wall; c.globalAlpha = 0.45; c.lineWidth = 2;
      c.strokeRect(g.x + 1, g.y + 1, g.w - 2, g.h - 2); c.restore();
      if (g.k <= 0) return;
      var R = { x: g.x, y: g.y, w: g.w, h: g.h };
      if (horiz) { R.w = g.w * g.k; if (g.att === 'r') R.x = g.x + g.w - R.w; } else { R.h = g.h * g.k; if (g.att === 'b') R.y = g.y + g.h - R.h; }
      c.save(); c.globalAlpha = g.solid ? 1 : 0.8; wood(c, R); c.restore();
    }
    function draw() {
      var c = K.c, W = K.w, H = K.h; if (!W) return;
      if (!bg || !L) { c.fillStyle = COL.felt || '#a9dd8a'; c.fillRect(0, 0, W, H); return; }
      c.drawImage(bg, 0, 0, W, H);
      if (gate) drawGate(c);
      /* 구멍 */
      c.fillStyle = COL.rim; c.beginPath(); c.arc(hole.x, hole.y + 2, holeR * 1.18, 0, 7); c.fill();
      c.fillStyle = COL.hole; c.beginPath(); c.arc(hole.x, hole.y, holeR, 0, 7); c.fill();
      if (locked) {   /* 별을 다 모을 때까지 나무 뚜껑 */
        c.fillStyle = COL.wall2; c.beginPath(); c.arc(hole.x, hole.y, holeR * 1.05, 0, 7); c.fill();
        c.strokeStyle = COL.wall; c.lineWidth = 3; c.stroke();
        c.font = Math.round(holeR * 0.9) + 'px ' + EMOJI; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('⭐', hole.x, hole.y + 1);
      }
      c.font = Math.round(r * 1.7) + 'px ' + EMOJI; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillText('🚩', hole.x + holeR * 0.55, hole.y - holeR * 0.35);
      if (L.stars) {
        c.font = Math.round(r * 1.5) + 'px ' + EMOJI; c.textBaseline = 'middle';
        L.stars.forEach(function (s) { if (!s.got) c.fillText('⭐', s.x, s.y + 1); });
        c.textBaseline = 'alphabetic';
      }
      balls.forEach(function (ball) {
        if (ball.hide) return;
        var sc = ball.sink ? Math.max(0.15, 1 - ball.sink.t / 0.4 * 0.85) : 1;
        c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(ball.x + r * 0.15, ball.y + r * 0.8 * sc, r * 0.9 * sc, r * 0.35 * sc, 0, 0, 7); c.fill();
        c.save(); c.translate(ball.x, ball.y); c.scale(sc, sc);
        c.fillStyle = ball.e; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
        c.save(); c.beginPath(); c.arc(0, 0, r, 0, 7); c.clip(); c.rotate(ball.rot);   /* 굴러가는 줄무늬 */
        c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(-r, -r * 0.2, r * 2, r * 0.4); c.restore();
        c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r - 1, 0, 7); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(-r * 0.35, -r * 0.38, r * 0.26, 0, 7); c.fill();
        c.restore();
      });
    }
    function goalDone() {
      var ok = !helping && holeR <= holeR0 * 1.05;
      ctx.trial(ok); if (!ok) helped++;
      k++; cntEl.textContent = k; ctx.progress(k, GOALS);
      guide = null; drag = null;
      var br = board.getBoundingClientRect(); G.fx.burst(br.left + hole.x, br.top + hole.y, ['⭐', '✨', '🌟']);
      ctx.cheer(G.pick(TL_GOOD)).then(function () {
        if (k >= GOALS) {
          running = false;
          ctx.extra.mode = mode; ctx.extra.helped = helped;
          ctx.finish({ msg: mode === 'tilt' ? '공을 구멍에 쏙쏙! 두 손으로 정말 잘했어!' : '공을 구멍에 쏙쏙! 손가락으로 정말 잘했어!' });
        } else nextGoal();
      });
    }
    ctx.loop(function (dt) {
      if (!running || !L || !K.w) { draw(); return; }
      if (!balls.some(function (b) { return !b.hide; })) { draw(); return; }
      var sinking = false;
      balls.forEach(function (ball) {
        if (!ball.sink) return;
        sinking = true;
        ball.sink.t += dt;
        var q = Math.min(1, ball.sink.t / 0.25);
        ball.x = ball.sink.x + (hole.x - ball.sink.x) * q; ball.y = ball.sink.y + (hole.y - ball.sink.y) * q;
        if (ball.sink.t >= 0.4) {
          ball.hide = true; ball.sink = null;
          if (balls.every(function (b) { return b.hide; })) goalDone();
          else if (helping) { var nb = balls.filter(live)[0]; if (nb) guideBall(nb); }   /* 남은 공도 이어서 */
        }
      });
      if (!balls.some(live)) { draw(); return; }
      /* 한 공이 빠지는 동안 다른 공은 계속 굴러간다 (공이 하나면 예전처럼 잠깐 멈춤) */
      if (sinking && balls.length === 1) { draw(); return; }
      balls.forEach(function (ball) { if (live(ball)) physics(ball, dt); });
      pairBump();
      gateTick(dt);
      balls.forEach(function (ball) { if (live(ball)) grab(ball); });
      var el = (performance.now() - t0) / 1000, H0 = pace(GROW) / 1000, AUTO = pace(HELP) / 1000;
      if (el > H0) holeR = holeR0 * (1 + 0.8 * Math.min(1, (el - H0) / 25));   /* 오래 걸리면 구멍이 살살 커진다 */
      if (el > AUTO && !helping) startGuide();
      balls.forEach(function (ball) {
        if (!live(ball)) return;
        var d = Math.hypot(ball.x - hole.x, ball.y - hole.y);
        if (d < holeR * 0.8 && !locked) {
          ball.sink = { t: 0, x: ball.x, y: ball.y }; G.sfx.play('ding'); G.buzz([20, 30, 20]);
          if (drag && drag.b === ball) drag = null;
        } else if (locked && d < holeR && !saidLock) { saidLock = true; ctx.bubble('별을 먼저 모아 볼까? ⭐'); }
      });
      draw();
    });

    /* 기울기 */
    function onOri(e) {
      if (e.beta == null || e.gamma == null) return;
      gotOri = true;
      var ang = screen.orientation && typeof screen.orientation.angle === 'number' ? screen.orientation.angle : (window.orientation || 0);
      var b = e.beta, g = e.gamma, x, y;
      if (ang === 90) { x = b; y = -g; } else if (ang === 270 || ang === -90) { x = -b; y = g; } else if (ang === 180) { x = -g; y = -b; } else { x = g; y = b; }
      if (!base) base = { x: x, y: y };
      tx = G.clamp(x - base.x, -40, 40); ty = G.clamp(y - base.y, -40, 40);
    }
    function wantTilt(cb) {
      var DOE = window.DeviceOrientationEvent, answered = false, waitH = null;
      function then(ok) { if (answered) return; answered = true; clearTimeout(waitH); cb(ok); }
      function listen() {
        if (!oriOn) { oriOn = true; ctx.on(window, 'deviceorientation', onOri); }
        base = null; gotOri = false;
        ctx.timeout(function () { then(gotOri); }, 800);
      }
      if (!G.has.motion || !DOE) { then(false); return; }
      /* 허락 창에 아무도 답하지 않으면 기다리지 않고 손가락 놀이로 시작한다 */
      waitH = ctx.timeout(function () { then(false); }, 6000);
      if (typeof DOE.requestPermission === 'function') {   /* 아이폰 — 손가락으로 누른 그 순간에 물어야 한다 */
        try { DOE.requestPermission().then(function (s) { if (s === 'granted') listen(); else then(false); }, function () { then(false); }); }
        catch (e) { then(false); }
      } else listen();
    }
    function setMode(m) {
      mode = m;
      modeBtn.hidden = !G.has.motion;
      modeBtn.textContent = m === 'tilt' ? '👆 손가락으로' : '📱 기울이기';
    }
    function begin(m, fellBack) {
      setMode(m);
      if (startEl.isConnected) startEl.remove();
      if (!running) { running = true; nextGoal(); }
      ctx.say((lv >= 6 ? TL_NEW_SAY[lv] + ' ' : '') + (m === 'tilt' ? '살살 기울여서 공을 구멍에 넣어 봐! 천천히~' : (fellBack ? '손가락으로 해 보자! ' : '') + '공을 손가락으로 끌어서 구멍에 쏙 넣어 봐!'));
    }
    G.$('.tl-go', B).addEventListener('click', function () {
      G.sfx.play('tap');
      startEl.querySelector('.tt').textContent = '기울기를 살펴보는 중…';
      wantTilt(function (ok) { begin(ok ? 'tilt' : 'drag', !ok); });
    });
    G.$('.tl-finger', B).addEventListener('click', function () { G.sfx.play('tap'); begin('drag'); });
    modeBtn.addEventListener('click', function () {
      G.sfx.play('tap');
      if (mode === 'tilt') { setMode('drag'); ctx.say('손가락으로 공을 끌어 봐!', { repeat: false }); return; }
      wantTilt(function (ok) {
        if (ok) { setMode('tilt'); ctx.say('이제 살살 기울여 봐!', { repeat: false }); }
        else ctx.say('이 기기는 기울기를 못 읽어요. 손가락으로 해요!', { repeat: false });
      });
    });
    /* 손가락으로 끌기 (기울이기 중에도 된다) — 공이 둘이면 손가락에서 가까운 공 */
    ctx.on(board, 'pointerdown', function (e) {
      if (!running || !balls.length || helping || pid !== null) return;
      var rr = board.getBoundingClientRect(), x = e.clientX - rr.left, y = e.clientY - rr.top, pick = null, bd = Infinity;
      balls.forEach(function (b) { var d = Math.hypot(b.x - x, b.y - y); if (live(b) && d < bd) { bd = d; pick = b; } });
      if (!pick) return;
      e.preventDefault(); pid = e.pointerId;
      try { board.setPointerCapture(pid); } catch (er) {}
      drag = { x: x, y: y, rect: rr, b: pick };
    });
    ctx.on(board, 'pointermove', function (e) { if (e.pointerId !== pid || !drag) return; drag.x = e.clientX - drag.rect.left; drag.y = e.clientY - drag.rect.top; });
    function up(e) { if (e.pointerId !== pid) return; pid = null; drag = null; }
    ctx.on(board, 'pointerup', up); ctx.on(board, 'pointercancel', up);
    readCols();
    ctx.progress(0, GOALS);
    ctx.say('공을 굴려서 구멍에 쏙 넣어 보자! 시작을 눌러 줘.');
  }
});

/* ===========================================================
   6. 쓱쓱 지우기 — 손가락 끝으로 꾹 눌러 오래 문지르기
   얼마나 지웠는지는 20×20 칸으로 센다 (그림 픽셀을 읽지 않아 가볍다).
   =========================================================== */
var SC_COAT = [['#ffc1d6', '#ff8fb3'], ['#b3dcff', '#7cbcf5'], ['#d2c4ff', '#a990ff'], ['#ffe199', '#ffc24d'], ['#a8ead0', '#5fcf9f']];
function scWords(lv, n) {
  var seen = {}, max = lv === 1 ? 1 : lv === 2 ? 2 : 3;
  var pool = D.WORDS.filter(function (w) {
    if (['animal', 'food', 'vehicle', 'nature', 'home'].indexOf(w.c) < 0 || w.lv > max || seen[w.e] || w.e === '🪥') return false;
    seen[w.e] = 1; return true;
  });
  return G.sample(pool, n);
}
/* 6~10단계 — 정해진 창 안만 지워진다(창 밖은 단단한 덮개: 문질러도 그대로). 창은 번호 차례로 열린다.
   6: 큰 모양 창 하나  7: 창 둘  8: 창 셋  9: 창 넷(붓이 더 작게)  10: 창 넷 — 번호가 뒤섞여 있어 다음 번호를 찾아야 한다 */
var SC_WIN = { 6: { n: 1 }, 7: { n: 2 }, 8: { n: 3 }, 9: { n: 4 }, 10: { n: 4, mix: true } };
var SC_SPOT = { 1: [[0.5, 0.5, 0.62]], 2: [[0.3, 0.31, 0.4], [0.7, 0.69, 0.4]], 3: [[0.27, 0.27, 0.36], [0.73, 0.38, 0.36], [0.4, 0.76, 0.36]],
  4: [[0.27, 0.27, 0.36], [0.73, 0.27, 0.36], [0.27, 0.73, 0.36], [0.73, 0.73, 0.36]] };
/* 창 모양의 SVG 길 (상자 px 좌표) — 캔버스 Path2D 로도 같이 쓴다 */
function scWinD(shape, cx, cy, s) {
  var h = s / 2, f = function (v) { return Math.round(v * 10) / 10; };
  if (shape === 'circle') return 'M' + f(cx - h) + ' ' + f(cy) + 'A' + f(h) + ' ' + f(h) + ' 0 1 0 ' + f(cx + h) + ' ' + f(cy) + 'A' + f(h) + ' ' + f(h) + ' 0 1 0 ' + f(cx - h) + ' ' + f(cy) + 'Z';
  if (shape === 'square') {
    var q = s * 0.42, rr = s * 0.12, x0 = cx - q, x1 = cx + q, y0 = cy - q, y1 = cy + q, A = 'A' + f(rr) + ' ' + f(rr) + ' 0 0 1 ';
    return 'M' + f(x0 + rr) + ' ' + f(y0) + 'H' + f(x1 - rr) + A + f(x1) + ' ' + f(y0 + rr) + 'V' + f(y1 - rr) + A + f(x1 - rr) + ' ' + f(y1) +
      'H' + f(x0 + rr) + A + f(x0) + ' ' + f(y1 - rr) + 'V' + f(y0 + rr) + A + f(x0 + rr) + ' ' + f(y0) + 'Z';
  }
  if (shape === 'heart') {
    var k = s / 88, P = function (x, y) { return f(cx + (x - 50) * k) + ' ' + f(cy + (y - 48) * k); };
    return 'M' + P(50, 88) + 'C' + P(20, 66) + ' ' + P(6, 50) + ' ' + P(6, 32) + 'C' + P(6, 18) + ' ' + P(17, 8) + ' ' + P(30, 8) + 'C' + P(40, 8) + ' ' + P(46, 14) + ' ' + P(50, 22) +
      'C' + P(54, 14) + ' ' + P(60, 8) + ' ' + P(70, 8) + 'C' + P(83, 8) + ' ' + P(94, 18) + ' ' + P(94, 32) + 'C' + P(94, 50) + ' ' + P(80, 66) + ' ' + P(50, 88) + 'Z';
  }
  var d = '';   /* 별 — 끝이 너무 가늘지 않게 안쪽 반지름을 크게 */
  for (var i = 0; i < 10; i++) { var a = (-90 + 36 * i) * Math.PI / 180, rad = i % 2 ? h * 0.5 : h; d += (i ? 'L' : 'M') + f(cx + rad * Math.cos(a)) + ' ' + f(cy + 0.06 * s + rad * Math.sin(a)); }
  return d + 'Z';
}

G.act({
  id: 'scratch', area: 'motor', title: '쓱쓱 지우기', icon: '✨', order: 60, levels: 10, mins: 2, needs: [],
  ef: ['attend'],
  desc: '쓱쓱 문지르면 뭐가 나올까?',
  goal: '손가락 힘·분리 운동 — 검지 끝으로 꾹 누르며 오래 문지르기(지속 동작), 끝까지 하는 주의 집중',
  how: '검지 끝으로 꾹 누르며 문지르게 해 주세요 — 손가락 힘과 오래 하기를 기르는 놀이예요. 반쯤 보이면 "뭘까?" 하고 맞혀 보게 하면 말하기 연습도 돼요. 3단계는 붓이 작아서 더 꼼꼼히 문질러야 해요. 4단계(도전)는 붓이 더 작고, 5단계(마스터)는 거의 다 지워야 그림이 나와요 — 구석까지 차례로 문지르게 도와주세요. 6단계부터는 정해진 창 안만 지워지고, 창이 여러 개면 1번, 2번… 번호 차례로 열어요 — "선 밖으로 안 나가게 살살!" 하고 말해 주세요.',
  basis: '손가락 분리 운동·지속적으로 눌러 문지르기(힘 조절) — 감각 되먹임이 큰 반복 동작. 6~10단계는 정해진 영역 안에서만 문지르기(정밀·경계 지키기) → 창 2·3·4개를 번호 차례로(순서 계획) → 작은 붓 → 뒤섞인 번호 찾기(시각 주사)',
  offline: '김 서린 창문·거울에 손가락으로 그림을 그리고, 크레용을 칠한 종이 위를 검게 덮은 뒤 이쑤시개로 긁어 숨은 색을 찾아보세요(스크래치 아트).',
  run: async function (ctx) {
    var lv = ctx.level, B = ctx.body, NP = lv <= 5 ? 5 : lv <= 8 ? 4 : 3, GN = 20;
    B.innerHTML = '<div class="mt-wrap"><div class="sc-card"><div class="sc-pic" style="visibility:hidden"><span></span></div></div><div class="mt-bar sc-bar"><b></b></div></div>';
    var card = G.$('.sc-card', B), pic = G.$('.sc-pic', B), picE = G.$('.sc-pic span', B), bar = G.$('.sc-bar b', B);
    var K = ctx.canvas(card, { onResize: function () { if (cur && !cur.done) coat(); } });
    var grid = new Uint8Array(GN * GN), cleared = 0, cur = null, pid = null, last = null, lastSnd = 0, helped = 0;
    var words = scWords(lv, NP), idle = idler(ctx, pace(9000), nudge);
    /* 칸이 오르면 붓이 조금씩 작아진다 (자비스가 같이 해 주기 전 기다림은 그만큼 조금 길게).
       5단계는 붓은 4단계 그대로, 그림이 나오려면 더 많이(62% → 72%) 지워야 한다 — 끝까지 꼼꼼히.
       5단계 2·3칸부터는 마지막 그림 1~2장을 다음 단계(창) 그림으로 미리 해 본다 */
    var BRUSH = ctx.tune([0.1, 0.07, 0.048, 0.037, 0.037, 0.036, 0.035, 0.034, 0.032, 0.03]), HELP = ctx.tune([45000, 55000, 65000, 70000, 80000, 75000, 80000, 85000, 90000, 90000]);
    var OPEN = ctx.tune([0.62, 0.62, 0.62, 0.62, 0.72, 0.72, 0.72, 0.72, 0.72, 0.72]);
    var OPENW_T = [0.72, 0.72, 0.72, 0.72, 0.72, 0.75, 0.72, 0.72, 0.74, 0.78], OPENW = ctx.tune(OPENW_T);   /* 창 하나를 얼마나 지우면 열리나 (6단계부터) */
    var PRE = lv < topLv(ctx) ? ctx.step - 1 : 0;
    function picLv(i) { return i >= NP - PRE ? lv + 1 : lv; }
    var hitC = document.createElement('canvas').getContext('2d');   /* 칸이 창 안인지 재는 데만 쓴다 */

    function star4(c, x, y, s) {
      c.beginPath(); c.moveTo(x, y - s); c.quadraticCurveTo(x, y, x + s, y); c.quadraticCurveTo(x, y, x, y + s);
      c.quadraticCurveTo(x, y, x - s, y); c.quadraticCurveTo(x, y, x, y - s); c.fill();
    }
    function coat() {
      if (!K.w || !cur) return;
      var c = K.c, w = K.w, h = K.h, seed = 11 + cur.i * 7;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      c.globalCompositeOperation = 'source-over';
      var g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, cur.col[0]); g.addColorStop(1, cur.col[1]);
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,255,255,.45)';
      for (var i = 0; i < 26; i++) star4(c, rnd() * w, rnd() * h, 4 + rnd() * 9);
      if (!cur.win) { c.font = Math.round(w * 0.42) + 'px Jua, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('?', w / 2, h / 2 + w * 0.02); }
      grid.fill(0); cleared = 0; bar.style.width = '0%';
      pic.style.visibility = '';
      cur.br = w * BRUSH;
      if (cur.win) makeWins(w);
    }
    /* 창 — 자리·모양·번호. 칸(20×20) 가운데가 창 안이면 그 창의 칸 */
    function makeWins(w) {
      var cs = w / GN, wins = cur.win.spots.map(function (sp, i) {
        var d = scWinD(cur.win.shapes[i], sp[0] * w, sp[1] * w, sp[2] * w), p2 = new Path2D(d), mask = new Uint8Array(GN * GN), n = 0;
        for (var j = 0; j < GN; j++) for (var q = 0; q < GN; q++) if (hitC.isPointInPath(p2, (q + 0.5) * cs, (j + 0.5) * cs)) { mask[j * GN + q] = 1; n++; }
        return { d: d, p2: p2, mask: mask, cells: Math.max(1, n), got: 0, done: false, x: sp[0] * w, y: sp[1] * w, s: sp[2] * w, no: cur.win.order[i] + 1 };
      });
      cur.wins = wins.sort(function (a, b) { return a.no - b.no; }); cur.wi = 0;
      if (cur.svg) cur.svg.remove();
      var br = Math.max(15, w * 0.045);
      cur.svg = G.el('<svg class="sc-wins" viewBox="0 0 ' + w + ' ' + w + '" aria-hidden="true">' + cur.wins.map(function (v) {
        return '<g class="sw"><path d="' + v.d + '"/><circle cx="' + v.x + '" cy="' + v.y + '" r="' + br + '"/><text x="' + v.x + '" y="' + (v.y + br * 0.38) + '" font-size="' + Math.round(br * 1.15) + '">' + v.no + '</text></g>';
      }).join('') + '</svg>');
      card.appendChild(cur.svg);
      winMarks();
    }
    function winMarks() { G.$$('.sw', cur.svg).forEach(function (g, i) { g.classList.toggle('now', i === cur.wi); g.classList.toggle('done', cur.wins[i].done); }); }
    function mark(x, y, br) {
      var cs = K.w / GN, i0 = Math.max(0, Math.floor((x - br) / cs)), i1 = Math.min(GN - 1, Math.floor((x + br) / cs)),
        j0 = Math.max(0, Math.floor((y - br) / cs)), j1 = Math.min(GN - 1, Math.floor((y + br) / cs)), W0 = cur.win ? cur.wins[cur.wi] : null;
      for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
        var cx = (i + 0.5) * cs, cy = (j + 0.5) * cs, id = j * GN + i;
        if ((cx - x) * (cx - x) + (cy - y) * (cy - y) <= br * br && !grid[id] && (!W0 || W0.mask[id])) { grid[id] = 1; cleared++; if (W0) W0.got++; }
      }
    }
    function rub(x, y, br) {
      var c = K.c, W0 = cur.win ? cur.wins[cur.wi] : null;
      if (W0) { c.save(); c.clip(W0.p2); }   /* 창 밖은 단단한 덮개 — 지워지지 않는다 */
      c.globalCompositeOperation = 'destination-out'; c.strokeStyle = '#000'; c.fillStyle = '#000'; c.lineCap = 'round'; c.lineWidth = br * 2;
      if (last) { c.beginPath(); c.moveTo(last.x, last.y); c.lineTo(x, y); c.stroke(); }
      else { c.beginPath(); c.arc(x, y, br, 0, 7); c.fill(); }
      c.globalCompositeOperation = 'source-over';
      if (W0) c.restore();
      var from = last || { x: x, y: y }, Ld = Math.hypot(x - from.x, y - from.y), n = Math.max(1, Math.ceil(Ld / (br * 0.5)));
      for (var k = 0; k <= n; k++) mark(from.x + (x - from.x) * k / n, from.y + (y - from.y) * k / n, br);
      last = { x: x, y: y };
      /* 창 밖을 오래 문지르면 지금 열 창을 알려 준다 */
      if (W0 && !hitC.isPointInPath(W0.p2, x, y) && ++cur.out > 45) { cur.out = 0; popEl(G.$$('.sw', cur.svg)[cur.wi]); ctx.bubble('반짝이는 ' + W0.no + '번 창 안을 문질러 봐!'); }
    }
    function check() {
      if (cur.win) {
        var W0 = cur.wins[cur.wi], pw = W0.got / W0.cells;
        bar.style.width = Math.min(100, (cur.wi + Math.min(1, pw / cur.win.open)) / cur.wins.length * 100) + '%';
        if (pw >= cur.win.open) winDone();
        return;
      }
      var pct = cleared / (GN * GN);
      bar.style.width = Math.min(100, pct / OPEN * 100) + '%';
      if (pct >= OPEN) { reveal(true); return; }
      if (pct >= 0.3 && !cur.said) { cur.said = true; ctx.bubble(G.pick(['뭘까? 조금 더 쓱쓱!', '뭐가 보이니? 더 문질러 봐!', '거의 보인다! 쓱쓱!'])); }
    }
    /* 창 하나가 열렸다 — 창 안을 마저 걷어 내고 다음 번호로 */
    function winDone() {
      var W0 = cur.wins[cur.wi], c = K.c;
      W0.done = true; last = null;
      c.save(); c.globalCompositeOperation = 'destination-out'; c.fill(W0.p2); c.restore();
      cur.wi++; winMarks();
      if (cur.wi >= cur.wins.length) { reveal(!cur.auto); return; }
      G.sfx.play('ding'); G.buzz(10);
      if (!cur.auto) ctx.bubble(G.pick([W0.no + '번 창이 열렸어! 이제 ' + cur.wins[cur.wi].no + '번!', '좋아! 다음은 ' + cur.wins[cur.wi].no + '번 창!']));
    }
    function reveal(ok) {
      if (!cur || cur.done) return;
      cur.done = true; pid = null; last = null;
      clearTimeout(cur.autoH);
      ctx.trial(ok); if (!ok) helped++;
      card.classList.add('open'); pic.classList.add('show'); bar.style.width = '100%';
      if (cur.svg) cur.svg.classList.add('off');
      G.sfx.play('sparkle');
      var w = cur.w, done = cur.resolve;
      ctx.cheer('짠! ' + w.w + '!' + (w.s ? ' ' + w.s + '!' : ''), picE).then(function () { return ctx.wait(900); }).then(done);
    }
    function zigzag(rows) {
      var pts = [], s = K.w;
      for (var j = 0; j < rows; j++) {
        var y = (j + 0.5) / rows * s;
        for (var t = 0; t <= 12; t++) { var x = (j % 2 ? 1 - t / 12 : t / 12) * s; pts.push({ x: x, y: y + Math.sin(t) * s * 0.03 }); }
      }
      return pts;
    }
    function nudge() {
      if (!cur || cur.done || cur.auto) return;
      var s = K.w, pts = [];
      if (cur.win) {
        var W0 = cur.wins[cur.wi];
        for (var u = 0; u <= 24; u++) pts.push({ x: W0.x + W0.s * (u % 2 ? 0.2 : -0.2), y: W0.y + W0.s * (-0.15 + u * 0.0125) });
        popEl(G.$$('.sw', cur.svg)[cur.wi]);
        ghost(ctx, card, pts, 2);
        ctx.bubble(G.pick(['반짝이는 ' + W0.no + '번 창을 쓱쓱!', W0.no + '번 창 안을 꾹 누르고 쓱쓱~']));
        return;
      }
      for (var t = 0; t <= 24; t++) pts.push({ x: s * (0.3 + 0.4 * (t % 2)), y: s * (0.38 + t * 0.01) });
      ghost(ctx, card, pts, 2);
      ctx.bubble(G.pick(['손가락으로 쓱쓱 문질러 봐!', '꾹 누르고 쓱쓱~', '뭐가 숨었는지 궁금하지? 쓱쓱!']));
    }
    function autoReveal() {
      if (!cur || cur.done || cur.auto) return;
      cur.auto = true; pid = null; last = null;
      ctx.say('자비스가 같이 쓱쓱 해 줄게!', { repeat: false });
      if (cur.win) {   /* 남은 창을 하나씩 열어 준다 */
        var one = cur;
        (function step() { if (cur !== one || cur.done) return; winDone(); if (!cur.done) ctx.timeout(step, 450); })();
        return;
      }
      var pts = zigzag(6), i = 0, br = Math.max(cur.br, K.w * 0.09);
      ctx.loop(function (dt) {
        if (!cur || cur.done) return false;
        var steps = Math.max(1, Math.round(pts.length * dt / 1.3));
        for (var k = 0; k < steps && i < pts.length; k++, i++) { if (i % 13 === 0) last = null; rub(pts[i].x, pts[i].y, br); }
        bar.style.width = Math.min(100, cleared / (GN * GN) / OPEN * 100) + '%';
        if (i >= pts.length) { reveal(false); return false; }
      });
    }
    function at(e) { return { x: e.clientX - cur.rect.left, y: e.clientY - cur.rect.top }; }
    function sound() { var now = performance.now(); if (now - lastSnd > 110 && !calm()) { lastSnd = now; G.sfx.noise(0.07, 0.05, 3500); } }
    ctx.on(card, 'pointerdown', function (e) {
      if (!cur || cur.done || cur.auto || pid !== null || !K.w) return;
      e.preventDefault(); pid = e.pointerId;
      try { card.setPointerCapture(pid); } catch (er) {}
      cur.rect = card.getBoundingClientRect(); last = null; idle.poke();
      var q = at(e); rub(q.x, q.y, cur.br); sound(); check();
    });
    ctx.on(card, 'pointermove', function (e) {
      if (e.pointerId !== pid || !cur || cur.done) return;
      idle.poke();
      var evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
      if (!evs.length) evs = [e];
      evs.forEach(function (ev) { if (!cur.done) { var q = at(ev); rub(q.x, q.y, cur.br); } });
      sound(); if (!cur.done) check();
    });
    function up(e) { if (e.pointerId !== pid) return; pid = null; last = null; }
    ctx.on(card, 'pointerup', up); ctx.on(card, 'pointercancel', up);

    function onePic(w, i) {
      return new Promise(function (resolve) {
        if (cur && cur.svg) cur.svg.remove();
        var pl = picLv(i), wc = SC_WIN[pl], win = null;
        if (wc) {
          var spots = SC_SPOT[wc.n], order = spots.map(function (_, k) { return k; });
          win = { spots: spots, order: wc.mix ? G.shuffle(order) : order, mix: !!wc.mix, open: pl === lv ? OPENW : G.tune(OPENW_T, pl, 1),
            shapes: spots.map(function () { return G.pick(wc.n === 1 ? ['circle', 'heart', 'star', 'square'] : ['circle', 'square', 'heart']); }) };
        }
        cur = { w: w, i: i, col: SC_COAT[i % SC_COAT.length], done: false, auto: false, said: false, br: 30, win: win, out: 0, resolve: resolve };
        /* 덮개를 먼저 다시 씌운 다음에 그림을 바꾼다 (다음 그림이 비쳐 보이지 않게) */
        K.cv.style.transition = 'none'; card.classList.remove('open'); pic.classList.remove('show');
        coat(); void K.cv.offsetWidth; K.cv.style.transition = '';
        picE.textContent = w.e;
        idle.go();
        cur.autoH = ctx.timeout(autoReveal, pace(HELP));
        if (win) ctx.say(win.spots.length === 1 ? '이번엔 모양 창 안만 지워져요! 선 밖으로 안 나가게 쓱쓱!' : '창이 ' + ['', '한', '두', '세', '네'][win.spots.length] + ' 개! ' + (win.mix ? '번호가 섞여 있어! 1번 창을 찾아서 차례로 열어 봐!' : '1번 창부터 차례로 쓱쓱 열어 봐!'));
        else ctx.say(i === 0 ? '무언가 숨어 있어요! 손가락으로 쓱쓱 문질러 봐!' : G.pick(['이번엔 뭐가 숨었을까? 쓱쓱!', '쓱쓱 지우면 뭐가 나올까?', '또 숨었어! 쓱쓱 찾아보자!']));
      });
    }
    for (var i = 0; i < words.length; i++) { ctx.progress(i, words.length); await onePic(words[i], i); }
    ctx.progress(words.length, words.length);
    ctx.extra.helped = helped;
    ctx.finish({ msg: '숨은 그림을 모두 찾았어! 쓱쓱 손가락 대장!' });
  }
});

/* ===========================================================
   7. 모양 맞추기 — 형태 지각·끌어 맞추기 (모양 맞추기 상자)
   1·2단계는 자리에 같은 색이 비쳐 보인다(색 단서). 3단계는 모양만 보고 찾는다.
   4단계(도전): 조각 반쯤이 빙글 돌아가 있다(형태 항상성). 5단계(마스터): 오각형·육각형처럼 비슷한 모양이 섞인다.
   6단계: 거울에 비친 짝(왼쪽·오른쪽 장화…)을 가려낸다. 7단계: 그 짝이 돌아가 있다(돌리기 + 거울).
   8단계: 조각을 모아 그림 만들기(칠교처럼, 점선 자리 있음). 9단계: 점선 없이 그림자만. 10단계: 조각 넷 + 돌아간 조각.
   =========================================================== */
var PZ_COL = ['#ef5350', '#42a5f5', '#ffca28', '#66bb6a', '#ab47bc', '#ffa726'];
/* 5단계에만 나오는 모양 (2학년 수학의 오각형·육각형 + 비슷해서 헷갈리기 쉬운 모양) */
var PZ_MORE = [
  { id: 'pentagon', name: '오각형', svg: '<polygon points="50,6 93,37 77,90 23,90 7,37"/>' },
  { id: 'hexagon', name: '육각형', svg: '<polygon points="27,10 73,10 95,50 73,90 27,90 5,50"/>' },
  { id: 'half', name: '반원', svg: '<path d="M6 72 A44 44 0 0 1 94 72 Z"/>' },
  { id: 'cross', name: '십자', svg: '<polygon points="36,6 64,6 64,36 94,36 94,64 64,64 64,94 36,94 36,64 6,64 6,36 36,36"/>' },
  { id: 'oval', name: '타원', svg: '<ellipse cx="50" cy="50" rx="44" ry="27"/>' },
  { id: 'rect', name: '긴 네모', svg: '<rect x="6" y="27" width="88" height="46" rx="4"/>' }
];
/* 6·7단계 거울 짝 — 뒤집으면 같고 돌리면 같지 않은 모양 (오른쪽 = 끝이 오른쪽을 향함) */
var PZ_MIR = (function () {
  var base = { boot: ['장화', [[30, 6], [58, 6], [58, 58], [92, 58], [92, 92], [30, 92]]], flag: ['깃발', [[16, 4], [28, 4], [28, 10], [88, 28], [28, 46], [28, 96], [16, 96]]],
    slide: ['미끄럼틀', [[8, 8], [24, 8], [94, 80], [94, 94], [80, 94], [24, 38], [24, 94], [8, 94]]] }, out = [];
  Object.keys(base).forEach(function (k) {
    var nm = base[k][0], pt = base[k][1], pts = function (L) { return '<polygon points="' + L.map(function (q) { return q.join(','); }).join(' ') + '"/>'; };
    out.push({ id: k + '-r', name: '오른쪽 ' + nm, svg: pts(pt) }, { id: k + '-l', name: '왼쪽 ' + nm, svg: pts(pt.map(function (q) { return [100 - q[0], q[1]]; })) });
  });
  return out;
})();
var PZ_PAIRS = ['boot', 'flag', 'slide'];
function pzShape(id) { return D.SHAPES.concat(PZ_MORE, PZ_MIR).filter(function (s) { return s.id === id; })[0]; }
/* 8~10단계 그림 — 조각은 그림 좌표(fw×fh) 안의 다각형. 맞닿은 조각은 변을 같이 쓴다 */
var PZ_FIG = (function () {
  function arc(cx, cy, rx, ry, a0, a1, n) { var p = []; for (var i = 0; i <= n; i++) { var a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; p.push([Math.round((cx + rx * Math.cos(a)) * 10) / 10, Math.round((cy + ry * Math.sin(a)) * 10) / 10]); } return p; }
  function ring(cx, cy, rr) { return arc(cx, cy, rr, rr, 0, 337.5, 15); }
  return [
    { e: '🐟', w: '물고기', fw: 100, fh: 70, p: [[[0, 35], [35, 0], [70, 35], [35, 70]], [[70, 35], [100, 8], [100, 62]]] },
    { e: '🍦', w: '아이스크림', fw: 64, fh: 100, p: [arc(32, 42, 28, 28, 180, 360, 12), [[4, 42], [60, 42], [32, 100]]] },
    { e: '🍄', w: '버섯', fw: 100, fh: 90, p: [arc(50, 50, 48, 46, 180, 360, 14), [[33, 50], [67, 50], [67, 90], [33, 90]]] },
    { e: '🏠', w: '집', fw: 100, fh: 100, p: [[[0, 44], [50, 4], [100, 44]], [[12, 44], [88, 44], [88, 100], [12, 100]]] },
    { e: '🌲', w: '나무', fw: 100, fh: 100, p: [[[50, 0], [80, 32], [20, 32]], [[20, 32], [80, 32], [100, 68], [0, 68]], [[40, 68], [60, 68], [60, 100], [40, 100]]] },
    { e: '⛵', w: '돛단배', fw: 100, fh: 92, p: [[[48, 0], [48, 62], [8, 62]], [[54, 12], [88, 62], [54, 62]], [[0, 62], [100, 62], [82, 92], [18, 92]]] },
    { e: '🍬', w: '사탕', fw: 100, fh: 60, norot: true, p: [[[0, 0], [30, 30], [0, 60]], [[30, 8], [70, 8], [70, 52], [30, 52]], [[100, 0], [70, 30], [100, 60]]] },
    { e: '🏡', w: '굴뚝 집', fw: 100, fh: 100, p: [[[0, 46], [50, 6], [100, 46]], [[12, 46], [88, 46], [88, 100], [12, 100]], [[66, 0], [80, 0], [80, 30], [66, 18.8]]] },
    { e: '🚀', w: '로켓', fw: 80, fh: 100, p: [[[20, 32], [40, 0], [60, 32]], [[20, 32], [60, 32], [60, 92], [20, 92]], [[20, 58], [20, 100], [0, 100]], [[60, 58], [80, 100], [60, 100]]] },
    { e: '🚗', w: '자동차', fw: 100, fh: 78, p: [[[24, 0], [72, 0], [86, 26], [10, 26]], [[0, 26], [100, 26], [100, 56], [0, 56]], ring(24, 64, 14), ring(76, 64, 14)] },
    { e: '🎄', w: '크리스마스 나무', fw: 100, fh: 100, p: [[[50, 0], [72, 24], [28, 24]], [[28, 24], [72, 24], [88, 50], [12, 50]], [[12, 50], [88, 50], [100, 78], [0, 78]], [[40, 78], [60, 78], [60, 100], [40, 100]]] },
    { e: '🤖', w: '로봇', fw: 100, fh: 100, p: [[[30, 0], [70, 0], [70, 28], [30, 28]], [[22, 28], [78, 28], [78, 78], [22, 78]], [[2, 32], [22, 32], [22, 68], [2, 68]], [[78, 32], [98, 32], [98, 68], [78, 68]]] }
  ];
})();
/* 6~10단계 판 — n: 조각 수, np: 거울 짝 수, pr: 돌아간 짝 조각 수 / f: 그림 조각 수, nl: 점선 없이, rot: 돌아간 조각(1 반쯤, 2 모두) */
var PZ_PLAN = {
  6: [[{ n: 6, np: 2 }, { n: 7, np: 2 }], [{ n: 6, np: 2, pr: 1 }, { n: 7, np: 2, pr: 1 }], [{ n: 6, np: 2, pr: 2 }, { n: 7, np: 2, pr: 2 }]],
  7: [[{ n: 6, np: 2, pr: 4 }, { n: 7, np: 2, pr: 4 }], [{ n: 6, np: 2, pr: 4 }, { f: 2 }], [{ n: 7, np: 2, pr: 4 }, { f: 2 }, { f: 3 }]],
  8: [[{ f: 2 }, { f: 3 }, { f: 3 }], [{ f: 2 }, { f: 3 }, { f: 3, nl: 1 }], [{ f: 2 }, { f: 3, nl: 1 }, { f: 3, nl: 1 }]],
  9: [[{ f: 3, nl: 1 }, { f: 3, nl: 1 }, { f: 3, nl: 1 }], [{ f: 3, nl: 1 }, { f: 3, nl: 1 }, { f: 4, nl: 1, rot: 1 }], [{ f: 3, nl: 1 }, { f: 4, nl: 1, rot: 1 }, { f: 4, nl: 1, rot: 1 }]],
  10: [[{ f: 3, nl: 1, rot: 1 }, { f: 4, nl: 1, rot: 1 }, { f: 4, nl: 1, rot: 1 }], [{ f: 4, nl: 1, rot: 1 }, { f: 4, nl: 1, rot: 1 }, { f: 4, nl: 1, rot: 2 }],
    [{ f: 4, nl: 1, rot: 2 }, { f: 4, nl: 1, rot: 2 }, { f: 4, nl: 1, rot: 2 }]]
};
/* 돌렸을 때 달라 보이는 각도 — 동그라미·네모·마름모·십자는 돌려도 같아 보여 돌리지 않는다 */
var PZ_TURN = { circle: [], square: [], diamond: [], cross: [], hexagon: [90, 270], rect: [90, 270], oval: [90, 270] };
function pzTurns(id) { return PZ_TURN[id] || [90, 180, 270]; }

G.act({
  id: 'puzzle', area: 'motor', title: '모양 맞추기', icon: '🧩', order: 70, levels: 10, mins: 3, needs: [],
  ef: ['plan', 'attend'],
  desc: '모양 친구의 집을 찾아 줘요',
  goal: '형태 지각·공간 관계 — 모양을 비교해 같은 자리를 찾고, 끌어다 정확히 맞춰 넣기',
  how: '"동그라미 집은 어디 있지?" 하고 모양 이름을 같이 말해 주세요. 끌기가 어려우면 조각을 한 번 누르고 자리를 눌러도 돼요. 3단계는 색 단서 없이 모양만 보고 찾아야 해서 어려워요 — 손가락으로 테두리를 같이 따라 그려 보세요. 4단계(도전)는 조각이 돌아가 있어 "머릿속으로 돌려 볼까?" 하고, 5단계(마스터)는 오각형·육각형처럼 비슷한 모양의 변(곧은 줄)을 같이 세어 보세요. 6단계부터는 왼쪽·오른쪽 거울 짝, 돌아간 거울 짝, 조각을 모아 그림 만들기(칠교)로 이어져요 — "장화 코가 어느 쪽이지?", "지붕은 어디 갈까?" 하고 물어봐 주세요.',
  basis: '형태 지각·공간 관계 — 모양 맞추기 상자(형태판) 과제, 색 단서 → 모양만 보기로 단서를 줄여 감. 4단계는 돌아간 조각(형태 항상성), 5단계는 비슷한 모양 가려내기(형태 변별). 6~10단계는 거울 모양(좌우 변별, b/d 같은 글자 뒤집힘의 기초) → 돌리기+거울(마음속 회전) → 칠교처럼 조각 모아 그림 만들기(부분-전체, 시각 구성) → 점선 없이 → 돌아간 조각',
  offline: '그릇과 뚜껑 짝 맞추기, 모양 맞추기 상자 놀이, 종이에 블록 테두리를 그려 두고 그 위에 같은 블록 올리기를 해 보세요.',
  run: async function (ctx) {
    /* 칸이 오르면 조각이 하나씩 늘어난다 (모양은 여섯 가지뿐이라 3단계는 늘리지 않고 맞춰 넣는 자리만 조금 정확하게).
       칸이 오르면 다음 단계를 조금 섞는다 — 3단계: 돌아간 조각 1·2개, 4단계: 5단계 모양 1·2개 */
    /* 5단계 2·3칸은 6단계 거울 짝을 한 쌍씩 미리 섞는다 (2칸: 끝 판, 3칸: 두 판 모두). 6단계부터는 PZ_PLAN 표 */
    var lv = ctx.level, st = ctx.step, plan = lv >= 6 ? PZ_PLAN[lv][st - 1] : ({ 1: [[2, 2, 2], [2, 2, 3], [2, 3, 3]], 2: [[3, 4], [3, 5], [4, 5]], 3: [[5, 6], [5, 6], [5, 6]],
      4: [[5, 6], [6, 6], [6, 7]], 5: [[6, 7], [6, 8], [7, 8]] })[lv][st - 1].map(function (n, b) { return { n: n, np: lv === 5 && (st === 3 || (st === 2 && b === 1)) ? 1 : 0 }; });
    var ROT = function (n) { return lv >= 4 ? Math.ceil(n / 2) : lv === 3 ? st - 1 : 0; };                  /* 판마다 돌아간 조각 수 */
    var MORE = function (n) { return lv >= 5 ? Math.ceil(n / 2) : lv === 4 ? st - 1 : 0; };                 /* 판마다 5단계 모양 수 */
    var easy = ['circle', 'square', 'triangle', 'heart', 'star'], all = D.SHAPES.map(function (s) { return s.id; }), more = PZ_MORE.map(function (s) { return s.id; }), last = '', misses = 0, figUsed = [];
    var idle = idler(ctx, pace(12000), null);
    for (var b = 0; b < plan.length; b++) {
      ctx.progress(b, plan.length);
      var e = plan[b];
      if (e.f) {   /* 조각 모아 그림 만들기 */
        var figs = PZ_FIG.filter(function (f) { return f.p.length === e.f && !(e.rot && f.norot); }), fr = figs.filter(function (f) { return figUsed.indexOf(f) < 0; }), fig = G.pick(fr.length ? fr : figs);
        figUsed.push(fig);
        misses += await pzFigure(ctx, fig, b, idle, e);
        continue;
      }
      var n = e.n, ids, mn = MORE(n), opt = null;
      if (e.np) {   /* 거울 짝 — 짝 두 조각을 같이 넣고 나머지는 섞는다 */
        var pairIds = [];
        G.sample(PZ_PAIRS, e.np).forEach(function (k) { pairIds.push(k + '-r', k + '-l'); });
        var others = n - pairIds.length, om = lv >= 6 ? Math.ceil(others / 2) : Math.min(mn, others);
        ids = G.shuffle(pairIds.concat(G.sample(all, others - om), G.sample(more, om)));
        opt = { pairs: pairIds, pairRot: e.pr || 0 };
      }
      else if (lv === 1 && b === 0) ids = ['circle', 'square'];
      else { var tries = 0; do { ids = mn ? G.shuffle(G.sample(all, n - mn).concat(G.sample(more, mn))) : G.sample(lv === 1 ? easy : all, n); } while (ids.slice().sort().join() === last && tries++ < 10); }
      last = ids.slice().sort().join();
      misses += await pzBoard(ctx, ids.map(pzShape), b, idle, opt ? Math.ceil((n - opt.pairs.length) / 2) : ROT(n), opt);
    }
    ctx.progress(plan.length, plan.length);
    ctx.extra.misses = misses;
    ctx.finish({ msg: '모양 친구들이 모두 집을 찾았어! 고마워!' });
  }
});

function pzBoard(ctx, shapes, bi, idle, rot, opt) {
  return new Promise(function (resolve) {
    var B = ctx.body, lv = ctx.level, cue = lv < 3;
    /* 3단계는 칸이 오르면 조금 더 가까이 가져가야 쏙. 4단계는 3단계 끝 그대로, 5단계는 2·3칸에서 조금 더, 6·7단계는 5단계 끝 그대로 */
    var SNAP = lv === 3 ? [0.75, 0.68, 0.62][ctx.step - 1] : lv === 4 ? 0.62 : lv >= 6 ? 0.54 : lv >= 5 ? [0.62, 0.58, 0.54][ctx.step - 1] : 0.75;
    var isPair = function (p) { return !!opt && opt.pairs.indexOf(p.s.id) >= 0; };
    B.innerHTML = '<div class="mt-wrap pz-wrap"><div class="pz-area pz-holes"></div><div class="pz-tip" aria-hidden="true">⬆️</div><div class="pz-area pz-tray"></div></div>';
    var wrap = G.$('.pz-wrap', B), holesBox = G.$('.pz-holes', B), tray = G.$('.pz-tray', B);
    var cols = G.shuffle(PZ_COL), sel = null, placed = 0, bmiss = 0, busy = false;
    var parts = shapes.map(function (s, k) { return { s: s, hex: cols[k % cols.length], hints: 0, deg: 0 }; });
    /* 돌아간 조각 — 90°·180°·270° (45° 는 네모가 마름모처럼 보여 쓰지 않는다). 돌려도 똑같아 보이는 모양은 빼고 고른다 */
    if (rot) G.sample(parts.filter(function (p) { return pzTurns(p.s.id).length && !isPair(p); }), rot).forEach(function (p) { p.deg = G.pick(pzTurns(p.s.id)); });
    if (opt && opt.pairRot) G.sample(parts.filter(isPair), opt.pairRot).forEach(function (p) { p.deg = G.pick(pzTurns(p.s.id)); });   /* 7단계: 거울 짝도 돌아가 있다 */
    G.shuffle(parts).forEach(function (p) {
      var h = G.el('<div class="pz-hole" aria-label="' + p.s.name + ' 자리"><svg viewBox="0 0 100 100" aria-hidden="true"><g class="sil">' + p.s.svg + '</g></svg></div>');
      if (cue) { h.style.setProperty('--hc', hexA(p.hex, 0.26)); h.style.setProperty('--hs', p.hex); }
      holesBox.appendChild(h); p.hole = h;
      ctx.on(h, 'click', function () { if (sel && !busy && !p.done) { var s = sel; select(null); put(s, p); } });
    });
    G.shuffle(parts).forEach(function (p) {
      p.el = G.el('<div class="pz-pc" role="button" aria-label="' + p.s.name + '"><svg viewBox="0 0 100 100" aria-hidden="true"' + (p.deg ? ' style="transform:rotate(' + p.deg + 'deg)"' : '') + '><g class="pc" style="fill:' + p.hex + '">' + p.s.svg + '</g></svg></div>');
      tray.appendChild(p.el);
      liftDrag(ctx, p.el, {
        can: function () { return !p.done && !busy; },
        start: function () { select(null); idle.poke(); },
        move: function () { var q = nearest(p); parts.forEach(function (o) { o.hole.classList.toggle('over', !!q && o === q.p); }); },
        drop: function () {
          parts.forEach(function (o) { o.hole.classList.remove('over'); });
          var q = nearest(p);
          return q ? put(p, q.p) : false;
        },
        tap: function () { select(sel === p ? null : p); idle.poke(); }
      });
    });
    /* 조각 가운데에서 가장 가까운 빈자리 (조각 크기의 0.75배 안) */
    function nearest(p) {
      var r = p.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, best = null, bd = Infinity;
      parts.forEach(function (o) {
        if (o.done) return;
        var hr = o.hole.getBoundingClientRect(), d = Math.hypot(hr.left + hr.width / 2 - cx, hr.top + hr.height / 2 - cy);
        if (d < bd) { bd = d; best = o; }
      });
      return best && bd < r.width / 1.1 * SNAP ? { p: best, d: bd } : null;
    }
    function select(p) { if (sel) sel.el.classList.remove('sel'); sel = p; if (p) p.el.classList.add('sel'); }
    function size() {
      var r = wrap.getBoundingClientRect(); if (!r.width) return;
      var n = parts.length, wide = r.width > r.height * 1.1, perRow = Math.min(n, wide ? 6 : 3), rows = Math.ceil(n / perRow);
      var s = Math.min((r.width - 40) / perRow - 14, (r.height - 70) / (rows * 2) - 28);
      wrap.style.setProperty('--s', G.clamp(s, 60, 150) + 'px');
    }
    function put(p, q) {
      idle.poke();
      if (q === p) {
        p.done = true; placed++;
        if (!p.missed) ctx.trial(true);
        flyInto(p.el, p.hole, 'in'); p.hole.classList.add('done');
        if (p.deg) { var sv = G.$('svg', p.el); ctx.timeout(function () { sv.style.transform = 'rotate(0deg)'; }, 60); }   /* 돌아간 조각은 자리에 들어가며 똑바로 돌아간다 */
        G.sfx.play('pop'); G.buzz(12);
        var c = G.fx.center(p.hole); G.fx.burst(c[0], c[1]);
        if (placed < parts.length) ctx.say(G.pick(['', '딩동! ', '쏙! ']) + p.s.name + ' 쏙!', { repeat: false });
        else {
          busy = true; idle.stop();
          ctx.timeout(function () {
            ctx.cheer(G.pick(['모양 집이 다 찼어! 최고야!', '모두 쏙쏙! 모양 박사네!', '딱 맞게 넣었어! 멋지다!'])).then(function () { return ctx.wait(450); }).then(function () { resolve(bmiss); });
          }, 350);
        }
        return true;
      }
      if (!p.missed) { p.missed = true; bmiss++; ctx.trial(false); }
      G.sfx.play('oops'); G.ui.wiggle(q.hole); hintEl(ctx, p.hole);
      ctx.say('음~ 거긴 ' + q.s.name + ' 자리야. ' + G.josa(p.s.name, '은', '는') + ' 반짝이는 곳에!', { repeat: false });
      return false;
    }
    idle.fn = function () {
      var p = parts.filter(function (x) { return !x.done; })[0]; if (!p || busy) return;
      p.hints++;
      if (p.hints >= 3) {   /* 아주 오래 멈추면 자비스가 하나 넣어 준다 */
        if (!p.missed) { p.missed = true; bmiss++; ctx.trial(false); }
        ctx.bubble('자비스가 하나 넣어 줄게!'); put(p, p); return;
      }
      G.ui.wiggle(p.el); hintEl(ctx, p.hole);
      ctx.bubble(G.josa(p.s.name, '은', '는') + ' 어디에 들어갈까? 반짝이는 곳을 봐!');
    };
    ctx.on(window, 'resize', size);
    size(); requestAnimationFrame(size);
    idle.go();
    ctx.say(bi === 0 ? (opt && lv >= 6 ? (opt.pairRot ? '거울 짝이 빙글 돌아가 있어! 머릿속으로 돌려 보고, 왼쪽 오른쪽도 잘 봐!' : '거울에 비친 것처럼 닮은 짝이 있어! 왼쪽, 오른쪽을 잘 보고 쏙!') :
      lv >= 5 ? '비슷한 모양 친구들이 많아! 곧은 줄이 몇 개인지 잘 보고 끌어다 쏙!' : lv === 4 ? '이번엔 조각이 빙글 돌아가 있어! 머릿속으로 돌려 보고 같은 모양 자리에 쏙!' :
      lv === 3 ? '모양 친구들이 집을 찾아요. 이번엔 색깔 힌트가 없어! 모양만 잘 보고 끌어다 쏙!' : '모양 친구들이 자기 집을 찾아요. 같은 모양 자리에 끌어다 쏙 넣어 줘!')
      : opt && lv === 5 ? '이번엔 왼쪽, 오른쪽 짝꿍 모양도 있어! 잘 보고 쏙!' : G.pick(['이번엔 모양 친구가 더 많아!', '또 집을 찾아 줄까? 같은 모양끼리!']));
  });
}

/* 칠교처럼 조각 모아 그림 만들기 (8~10단계) — 조각 자리는 그림 좌표, 1 단위 = sc px.
   조각·자리 상자는 44px 밑으로 작아지지 않게 둘레를 넉넉히 잡는다. 똑같은 조각(바퀴·팔)은 어느 자리든 맞다 */
function pzNorm(pts) {
  var x0 = Math.min.apply(null, pts.map(function (q) { return q[0]; })), y0 = Math.min.apply(null, pts.map(function (q) { return q[1]; }));
  return pts.map(function (q) { return Math.round((q[0] - x0) * 10) / 10 + ',' + Math.round((q[1] - y0) * 10) / 10; }).sort().join(' ');
}
function pzSpin(pts, deg) { return pts.map(function (q) { return deg === 90 ? [-q[1], q[0]] : deg === 180 ? [-q[0], -q[1]] : deg === 270 ? [q[1], -q[0]] : q; }); }
function pzFigure(ctx, fig, bi, idle, e) {
  return new Promise(function (resolve) {
    var B = ctx.body, lv = ctx.level, lines = !e.nl;
    var SNAPF = lv >= 10 ? [0.5, 0.48, 0.45][ctx.step - 1] : lv === 9 ? 0.55 : 0.6;
    B.innerHTML = '<div class="mt-wrap pz-wrap"><div class="pz-area pz-holes"><div class="pz-fig"><svg class="pz-sil" aria-hidden="true"></svg></div></div><div class="pz-tip" aria-hidden="true">⬆️</div><div class="pz-area pz-tray"></div></div>';
    var holesBox = G.$('.pz-holes', B), figEl = G.$('.pz-fig', B), sil = G.$('.pz-sil', B), tray = G.$('.pz-tray', B);
    var cols = G.shuffle(PZ_COL), sel = null, placed = 0, bmiss = 0, busy = false, sc = 2;
    function P2(pts) { return pts.map(function (q) { return q[0] + ',' + q[1]; }).join(' '); }
    var parts = fig.p.map(function (pts, k) {
      var xs = pts.map(function (q) { return q[0]; }), ys = pts.map(function (q) { return q[1]; });
      var bx = Math.min.apply(null, xs), by = Math.min.apply(null, ys), bw = Math.max.apply(null, xs) - bx, bh = Math.max.apply(null, ys) - by;
      return { pts: pts, bx: bx, by: by, bw: bw, bh: bh, cx: bx + bw / 2, cy: by + bh / 2, key: pzNorm(pts), hex: cols[k % cols.length], deg: 0, hints: 0 };
    });
    sil.setAttribute('viewBox', '0 0 ' + fig.fw + ' ' + fig.fh);
    var polys = parts.map(function (p) { return '<polygon points="' + P2(p.pts) + '"/>'; }).join('');
    sil.innerHTML = '<g class="so">' + polys + '</g><g class="sf">' + polys + '</g>';   /* 테두리를 먼저, 채우기를 위에 — 조각 사이 선은 가려지고 바깥 테두리만 남는다 */
    parts.forEach(function (p) {
      p.slot = G.el('<div class="pz-slot" aria-label="조각 자리"><svg aria-hidden="true">' + (lines ? '<polygon class="sl" points="' + P2(p.pts) + '"/>' : '') + '</svg></div>');
      figEl.appendChild(p.slot); p.slot._part = p;   /* (_part: 자동 검사용) */
      ctx.on(p.slot, 'click', function () { if (sel && !busy && !p.filled) { var s = sel; select(null); put(s, p); } });
    });
    /* 돌아간 조각 — 돌렸을 때 달라 보이는 각도만 */
    function turnsOf(p) { return [90, 180, 270].filter(function (d) { return pzNorm(pzSpin(p.pts, d)) !== p.key; }); }
    if (e.rot) { var cand = parts.filter(function (p) { return turnsOf(p).length; }); G.sample(cand, e.rot === 2 ? cand.length : Math.ceil(parts.length / 2)).forEach(function (p) { p.deg = G.pick(turnsOf(p)); }); }
    G.shuffle(parts).forEach(function (p) {
      p.el = G.el('<div class="pz-pc pz-fpc" role="button" aria-label="조각"><svg aria-hidden="true"' + (p.deg ? ' style="transform:rotate(' + p.deg + 'deg)"' : '') + '><polygon class="pc" style="fill:' + p.hex + '" points="' + P2(p.pts) + '"/></svg></div>');
      tray.appendChild(p.el); p.el._part = p;
      liftDrag(ctx, p.el, {
        can: function () { return !p.done && !busy; },
        start: function () { select(null); idle.poke(); },
        move: function () { var q = nearest(p); parts.forEach(function (o) { o.slot.classList.toggle('over', !!q && o === q); }); },
        drop: function () {
          parts.forEach(function (o) { o.slot.classList.remove('over'); });
          var q = nearest(p);
          return q ? put(p, q) : false;
        },
        tap: function () { select(sel === p ? null : p); idle.poke(); }
      });
    });
    /* 상자(그림 좌표) — 44px 보다 작으면 둘레를 넓힌다. 돌아간 조각은 정사각형 상자(돌려도 상자 밖으로 덜 나가게) */
    function box(p, sq, s) {
      s = s || sc;
      var m = 44 / s, w = Math.max(p.bw, m), h = Math.max(p.bh, m);
      if (sq) w = h = Math.max(w, h);
      return { x: p.cx - w / 2, y: p.cy - h / 2, w: w, h: h };
    }
    function setBox(el, b) { el.style.width = b.w * sc + 'px'; el.style.height = b.h * sc + 'px'; G.$('svg', el).setAttribute('viewBox', b.x + ' ' + b.y + ' ' + b.w + ' ' + b.h); }
    function apply() {
      figEl.style.width = fig.fw * sc + 'px'; figEl.style.height = fig.fh * sc + 'px';
      parts.forEach(function (p) {
        var sb = box(p, false);
        p.slot.style.left = sb.x * sc + 'px'; p.slot.style.top = sb.y * sc + 'px'; setBox(p.slot, sb);
        setBox(p.el, p.done ? box(p.at, false) : box(p, !!p.deg));
      });
    }
    /* 받침 칸에 조각이 다 들어가는 가장 큰 배율 */
    function fits(s, tr) {
      var x = 0, y = 0, rowH = 0, gap = 18, W = tr.width - 24, ok = true;
      parts.forEach(function (p) {
        if (p.done) return;
        var b = box(p, !!p.deg, s), w = b.w * s, h = b.h * s;
        if (w > W) ok = false;
        if (x > 0 && x + w > W) { y += rowH + gap; x = 0; rowH = 0; }
        x += w + gap; rowH = Math.max(rowH, h);
      });
      return ok && y + rowH <= tr.height - 20;
    }
    function size() {
      var hr = holesBox.getBoundingClientRect(), tr = tray.getBoundingClientRect(); if (!hr.width || !tr.width) return;
      var s = Math.min((hr.width - 28) / fig.fw, (hr.height - 28) / fig.fh);
      for (var i = 0; i < 40 && !fits(s, tr); i++) s *= 0.93;
      sc = Math.max(0.5, s); apply();
    }
    function nearest(p) {
      var r = p.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, best = null, bd = Infinity;
      parts.forEach(function (o) {
        if (o.filled) return;
        var hr = o.slot.getBoundingClientRect(), d = Math.hypot(hr.left + hr.width / 2 - cx, hr.top + hr.height / 2 - cy);
        if (d < bd) { bd = d; best = o; }
      });
      if (!best) return null;
      var br = best.slot.getBoundingClientRect();
      return bd < Math.max(30, Math.min(br.width, br.height) * SNAPF) ? best : null;
    }
    function select(p) { if (sel) sel.el.classList.remove('sel'); sel = p; if (p) p.el.classList.add('sel'); }
    function home(p) { return parts.filter(function (o) { return !o.filled && o.key === p.key; })[0]; }
    function put(p, q) {
      idle.poke();
      if (q && q.key === p.key && !q.filled) {
        p.done = true; q.filled = true; p.at = q; placed++;
        if (!p.missed) ctx.trial(true);
        var sv = G.$('svg', p.el);
        G.$('polygon', sv).setAttribute('points', P2(q.pts));   /* 똑같은 조각이 다른 자리에 가도 그 자리 그대로 */
        setBox(p.el, box(q, false));
        flyInto(p.el, q.slot, 'in');
        if (p.deg) ctx.timeout(function () { sv.style.transform = 'rotate(0deg)'; }, 60);   /* 돌아간 조각은 자리에 들어가며 똑바로 */
        G.sfx.play('pop'); G.buzz(12);
        var c = G.fx.center(q.slot); G.fx.burst(c[0], c[1]);
        if (placed < parts.length) ctx.say(G.pick(['딩동! ', '쏙! ', '']) + G.pick(['딱 맞아!', '제자리에 쏙!', '그림이 되어 가요!']), { repeat: false });
        else {
          busy = true; idle.stop();
          var rv = G.el('<span class="dt-reveal" aria-hidden="true" style="left:50%;top:50%;font-size:' + Math.round(Math.min(fig.fw, fig.fh) * sc * 0.6) + 'px">' + fig.e + '</span>');
          figEl.appendChild(rv);
          ctx.timeout(function () {
            rv.classList.add('on'); G.sfx.play('sparkle');
            ctx.cheer('짠! ' + fig.w + ' 완성!', rv).then(function () { return ctx.wait(600); }).then(function () { resolve(bmiss); });
          }, 350);
        }
        return true;
      }
      if (!p.missed) { p.missed = true; bmiss++; ctx.trial(false); }
      G.sfx.play('oops'); if (q) G.ui.wiggle(q.slot);
      var right = home(p); if (right) hintEl(ctx, right.slot);
      ctx.say('음~ 그 조각은 다른 자리야. 반짝이는 곳에 넣어 볼까?', { repeat: false });
      return false;
    }
    idle.fn = function () {
      var p = parts.filter(function (x) { return !x.done; })[0]; if (!p || busy) return;
      var q = home(p); if (!q) return;
      p.hints++;
      if (p.hints >= 3) {   /* 아주 오래 멈추면 자비스가 하나 넣어 준다 */
        if (!p.missed) { p.missed = true; bmiss++; ctx.trial(false); }
        ctx.bubble('자비스가 하나 넣어 줄게!'); put(p, q); return;
      }
      G.ui.wiggle(p.el); hintEl(ctx, q.slot);
      ctx.bubble('이 조각은 어디에 들어갈까? 반짝이는 곳을 봐!');
    };
    ctx.on(window, 'resize', size);
    size(); requestAnimationFrame(size);
    idle.go();
    ctx.say(bi === 0 || (e.nl && lv === 8) || (e.rot && lv === 9) ? (e.rot ? '조각이 빙글 돌아가 있어! 머릿속으로 돌려서 그림자를 채워 봐!' : e.nl ? '이번엔 점선이 없어! 그림자 모양을 보고 조각이 들어갈 곳을 찾아 봐!' : '조각을 모아 그림을 만들어요! 점선 자리에 맞는 조각을 끌어다 쏙!')
      : G.pick(['이번엔 무슨 그림일까? 조각을 모아 봐!', '또 만들어 볼까? 그림자를 잘 봐!']));
  });
}
})();

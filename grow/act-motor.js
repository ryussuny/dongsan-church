/* ===========================================================
   함께 자라요 — 손놀이 (작업치료: 소근육·시각-운동 통합·눈손 협응·양손 협응)

     trace    선 따라 그리기   시각-운동 통합   (선 긋기 발달 순서 세로→가로→원→+→네모→세모)
     dots     점 잇기         눈손 협응·차례로 훑어보기
     pop      풍선 터뜨리기    움직이는 목표 겨냥 (3단계는 Go/No-Go 참기)
     sort     색깔 나누기      누른 채 끌어 옮기기 · 색 → 범주 분류
     tilt     공 굴리기        두 손으로 기기 잡고 기울기 조절 (양측 협응·힘 조절)
     scratch  쓱쓱 지우기      손가락 끝으로 꾹 눌러 오래 문지르기
     puzzle   모양 맞추기      형태 지각·끌어 맞추기 (모양 맞추기 상자)

   ▸ 아이 화면에는 실패가 없다 — 길을 벗어나도 그림이 지워지지 않고, 어긋난 조각은
     제자리로 돌아가며 맞는 자리가 반짝인다. 오래 힘들면 자비스가 "같이 하자" 하고 마저 해 준다.
   ▸ 맞고 틀림·도움 받은 횟수는 ctx.trial / ctx.extra 로 부모 화면에만 남는다.
   ▸ 화면은 '손가락 하나로 짚고 끌기'까지. 연필 잡기·가위질 같은 손 힘은
     how·offline 에 적은 화면 밖 놀이(소금 쟁반, 집게, 스크래치 종이)로 이어 간다.
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;
if (!G || !D) return;

/* ---------- 함께 쓰는 작은 도구 ---------- */
var NUM = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
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
    var k = Math.min(1, t / secs), p = pts[Math.min(n - 1, Math.floor(k * (n - 1)))];
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
.tr-name{position:absolute;left:14px;top:8px;z-index:2;pointer-events:none;font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,22px);color:var(--soft)}
.tr-name b{font-weight:400;font-size:2em;line-height:1;color:var(--area);vertical-align:middle;margin-right:4px}

/* ── dots ── */
.dt-dot{position:absolute;width:var(--d,52px);height:var(--d,52px);margin:calc(var(--d,52px) / -2) 0 0 calc(var(--d,52px) / -2);border-radius:50%;z-index:2;pointer-events:none;
  background:var(--surface);border:4px solid color-mix(in srgb,var(--area) 55%,var(--line));color:var(--ink);display:flex;align-items:center;justify-content:center;
  font-family:Jua,sans-serif;font-size:calc(var(--d,52px) * .46);line-height:1;box-shadow:var(--shadow);transition:background .2s,border-color .2s,opacity .5s}
.dt-dot.on{background:color-mix(in srgb,var(--area) 22%,var(--surface));border-color:var(--area)}
.dt-dot.next{background:var(--area);border-color:var(--area);color:#fff;animation:dtPulse 1.1s ease-in-out infinite}
.dt-dot.hint{animation:glow 1s ease-in-out 3}
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
.pz-pc svg{filter:drop-shadow(0 5px 5px rgba(0,0,0,.18))}
.pz-pc.sel svg{filter:drop-shadow(0 0 6px var(--area)) drop-shadow(0 0 12px var(--area))}
.pz-pc.in{position:absolute;left:0;top:0;cursor:default}
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
    o:        { ar: 1, k: 'ㅇ', n: '이응', say: '이응 길이에요! 위에서 시작해서 동그랗게.', s: [arc(0.5, 0.5, 0.44, 0.46, -90, -420, 60)] }
  };
})();
/* 발달 순서: 세로·가로(2~3세) → 둥근 선·원·+(3~4세) → 사선·네모·세모(4~5세) → 별·글자 */
var TR_LEVEL = { 1: ['v', 'h', 'v', 'h', 'v'], 2: ['arch', 'wave', 'circle', 'cross', 'zigzag'], 3: ['square', 'triangle', 'gn', 'dmo', 'star'] };
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
  id: 'trace', area: 'motor', title: '선 따라 그리기', icon: '✏️', order: 10, levels: 3, mins: 3, needs: [],
  ef: ['attend', 'plan', 'inhibit'],
  desc: '애벌레 길을 따라 쭉 그려요',
  goal: '시각-운동 통합 — 눈으로 길을 보며 손가락을 원하는 쪽으로 움직이기. 글씨 쓰기 전 선 긋기(세로·가로·원·+·네모·세모·한글 자음)',
  how: '검지 하나만 펴고 나머지 손가락은 살짝 접게 도와주세요(연필 잡기 전 단계). 팔꿈치와 손목을 바닥에 대고 손가락·손목으로 그리게 하면 더 정확해요. 길을 조금 벗어나도 "애벌레가 사과까지 갔네!" 하고 끝까지 간 것을 칭찬해 주세요.',
  basis: '시각-운동 통합(VMI) — Beery 선 긋기 발달 순서(세로→가로→원→+→네모→세모), 넓은 길에서 좁은 길로 정확도 요구를 조금씩 높임',
  offline: '쟁반에 소금이나 밀가루를 얇게 깔고 손가락 하나로 세로줄·동그라미를 그린 뒤, 굵은 크레용으로 종이 위 같은 길을 따라 그려 보세요.',
  run: async function (ctx) {
    var lv = ctx.level, B = ctx.body, AREA = areaHex(ctx);
    var TOLF = [0.085, 0.068, 0.052][lv - 1], AUTO = [30000, 40000, 50000][lv - 1];
    B.innerHTML = '<div class="mt-wrap"><div class="mt-board tr-board"><div class="tr-name"></div></div></div>';
    var board = G.$('.tr-board', B), nameEl = G.$('.tr-name', board);
    var K = ctx.canvas(board, { onResize: layout });
    var goalEl = G.el('<span class="tr-goal" aria-hidden="true"></span>'), charEl = G.el('<span class="tr-char" aria-hidden="true"></span>');
    board.appendChild(goalEl); board.appendChild(charEl);
    var list = TR_LEVEL[lv].map(function (k) { return k === 'gn' ? G.pick(['g', 'n']) : k === 'dmo' ? G.pick(['d', 'm', 'o']) : k; });
    var stories = TR_STORY.slice(0, 2).concat(G.shuffle(TR_STORY.slice(2)));
    var P = null, pid = null, helped = 0, accSum = 0, accN = 0;
    var idle = idler(ctx, pace(8000), nudge);
    board._probe = function () { return P ? P.pts.map(px) : []; };   /* 자동 검사용 — 길의 화면 좌표 */

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
      c.setLineDash([1, 15]);
      P.def.s.forEach(function (s) { strokePath(c, s); c.strokeStyle = hexA(AREA, 0.55); c.lineWidth = 7; c.stroke(); });
      c.setLineDash([]);
      /* 가는 쪽 화살표 */
      c.strokeStyle = hexA(AREA, 0.6); c.lineWidth = 4;
      P.starts.forEach(function (st, si) {
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
  ]
};
var DT_NOTE = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5, 1568, 1760];

G.act({
  id: 'dots', area: 'motor', title: '점 잇기', icon: '⭐', order: 20, levels: 3, mins: 3, needs: [],
  ef: ['plan', 'attend'],
  desc: '숫자 점을 이으면 그림이 짠!',
  goal: '눈손 협응·시각 주사 — 다음 점을 눈으로 찾아 손가락으로 정확히 짚고 이어 가기, 수 순서(1→10)',
  how: '처음엔 부모가 "하나, 둘…" 같이 세며 다음 점을 손가락으로 가리켜 주세요. 손가락을 떼지 않고 쭉 끌어 이어도 되고 점을 하나씩 눌러도 돼요. 다 이으면 "무엇이 나왔지?" 하고 그림 이름을 말해 보게 해요.',
  basis: '시각-운동 협응·시각 주사(차례로 훑어보기) + 수 순서 — 점선·점 잇기는 글씨 쓰기 전 단계 활동',
  offline: '종이에 큰 점 4~6개를 찍고 번호를 써서 굵은 크레용으로 이어 보고, 바닥에 숫자 종이를 놓고 1→2→3 순서로 밟아 보세요.',
  run: async function (ctx) {
    var lv = ctx.level, B = ctx.body, AREA = areaHex(ctx), NP = lv === 3 ? 3 : 4;
    B.innerHTML = '<div class="mt-wrap"><div class="mt-board dt-board"></div></div>';
    var board = G.$('.dt-board', B);
    var K = ctx.canvas(board, { onResize: layout });
    var pics = G.sample(DT_PICS[lv], NP), P = null, pid = null, finger = null, missAll = 0, autoN = 0;
    var idle = idler(ctx, pace(7000), nudge);

    function layout() {
      if (!K.w || !P) return;
      var W = K.w, H = K.h, S = Math.min(W, H);
      var r = G.clamp(S * [0.085, 0.072, 0.06][lv - 1], 20, 34);
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
      ctx.say(NUM[k + 1] || String(k + 1), { repeat: false, rate: 1 });
      if (P.next < P.n) P.dots[P.next].classList.add('next');
      else closeShape();
      draw();
    }
    function wrong(k) {
      P.flagged = true; P.miss++; missAll++;
      G.sfx.play('oops'); wig(P.dots[k]);
      if (P.miss >= 2) { hintEl(ctx, P.dots[P.next]); ctx.say('다음은 ' + (P.next + 1) + '번! 반짝이는 점을 눌러 봐.', { repeat: false }); }
      else ctx.bubble(G.pick(['음~ 그다음 숫자는 뭘까?', (P.next + 1) + '번은 어디 있을까?']));
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
      ctx.bubble((P.cur < 0 ? '하나부터 시작해 볼까? ' : '') + '반짝반짝 ' + (P.next + 1) + '번을 눌러 봐!');
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

    function onePic(pic, i) {
      return new Promise(function (resolve) {
        board.classList.remove('done');
        G.$$('.dt-dot,.dt-reveal', board).forEach(function (x) { x.remove(); });
        P = { pic: pic, col: CRAYON[(i + 1) % CRAYON.length], n: pic.p.length, dots: [], pos: [], cur: -1, next: 0, miss: 0, flagged: false, idleN: 0,
          closing: 0, locked: false, filled: false, r: 24, hit: 36, resolve: resolve };
        pic.p.forEach(function (_, k) { var d = G.el('<span class="dt-dot">' + (k + 1) + '</span>'); board.appendChild(d); P.dots.push(d); });
        P.reveal = G.el('<span class="dt-reveal" aria-hidden="true">' + pic.e + '</span>'); board.appendChild(P.reveal);
        P.dots[0].classList.add('next');
        layout();
        idle.go();
        ctx.say(i === 0 ? '숫자 점을 차례로 이어 봐! 하나부터 시작!' : G.pick(['이번엔 뭐가 나올까? 하나부터!', '또 이어 볼까? 하나부터 차례로!', '숫자를 따라가면 그림이 나와요!']));
      });
    }
    for (var i = 0; i < NP; i++) { ctx.progress(i, NP); await onePic(pics[i], i); }
    ctx.progress(NP, NP);
    ctx.extra.wrong = missAll; ctx.extra.helped = autoN;
    ctx.finish({ msg: '점을 모두 이어서 그림을 찾았어! 최고야!' });
  }
});

/* ===========================================================
   3. 풍선 터뜨리기 — 움직이는 목표 겨냥 (3단계: 빨간 풍선만 — 참기)
   =========================================================== */
var PP_GIFT = [['🐥', '병아리'], ['⭐', '별'], ['🍬', '사탕'], ['🐰', '토끼'], ['🦋', '나비'], ['🌸', '꽃'], ['🐻', '곰돌이'], ['🍓', '딸기']];
var PP_CHEER = ['펑! 펑! 신난다!', '손가락이 정말 빨라!', '풍선 대장이다!', '우와, 또 터뜨렸어!', '콕콕 잘 누른다!'];
function ppSVG() {
  return '<svg viewBox="0 0 60 86" aria-hidden="true"><path class="st" d="M30 65 q-7 9 0 20"/><path class="kn" d="M25.5 61 L34.5 61 L30 66 Z"/>' +
    '<ellipse class="bd" cx="30" cy="31" rx="26" ry="30"/><ellipse class="sh" cx="20" cy="19" rx="6" ry="10" transform="rotate(-20 20 19)"/></svg>';
}

G.act({
  id: 'pop', area: 'motor', title: '풍선 터뜨리기', icon: '🎈', order: 30, levels: 3, mins: 1, needs: [],
  ef: ['attend', 'inhibit'],
  desc: '날아오는 풍선을 콕! 펑!',
  goal: '눈-손 협응·시각 추적 — 움직이는 목표를 눈으로 따라가며 검지 하나로 정확히 짚기 (3단계: 정해진 색만 누르고 나머지는 참기)',
  how: '검지 하나로 콕 누르게 해 주세요 — 손바닥으로 치면 "손가락 총!" 하고 모양을 보여 줘요. 풍선을 눈으로 따라가는 것도 연습이에요. 3단계에서 다른 색 풍선을 참으면 "참았네!" 하고 크게 칭찬해 주세요.',
  basis: '눈-손 협응·움직이는 목표 겨냥(시각 추적) — 3단계는 Go/No-Go(반응 억제) 규칙',
  offline: '비눗방울을 불어 주고 검지 하나로 콕 터뜨려 보세요. 익숙해지면 "높이 있는 방울만!", "큰 방울만!" 규칙을 붙여요.',
  run: function (ctx) {
    var lv = ctx.level, B = ctx.body;
    var DUR = [30, 38, 45][lv - 1], SPAWN = pace([1450, 1050, 850][lv - 1]) / 1000, RISE = [8.5, 6.2, 4.8][lv - 1] * (calm() ? 1.35 : 1), MAXON = [4, 6, 7][lv - 1];
    var RED = colorOf('red'), COLS = ['red', 'yellow', 'blue', 'green', 'orange', 'purple', 'pink'].map(colorOf), OTHERS = COLS.filter(function (c) { return c !== RED; });
    B.innerHTML = '<div class="mt-wrap"><div class="mt-top"><span class="mt-pill pp-count">🎈 <b>0</b></span>' +
      (lv === 3 ? '<span class="mt-pill pp-rule">' + ppSVG() + ' 빨간 풍선만 콕!</span>' : '') + '</div>' +
      '<div class="mt-bar pp-time"><b style="width:100%"></b></div><div class="pp-sky"><i class="pp-cloud c1"></i><i class="pp-cloud c2"></i><i class="pp-cloud c3"></i></div></div>';
    var sky = G.$('.pp-sky', B), cntEl = G.$('.pp-count b', B), tbar = G.$('.pp-time b', B), ruleEl = G.$('.pp-rule', B);
    var balloons = [], running = false, ended = false, el = 0, acc = SPAWN, spawned = 0, lastPi = -1, gifts = 0;
    var st = { popped: 0, escaped: 0, wrong: 0, missedRed: 0 };

    function place(b) { b.el.style.transform = 'translate3d(' + (b.x - b.w / 2 + Math.sin(el * b.fr * 6.28 + b.ph) * b.amp) + 'px,' + b.y + 'px,0)'; }
    function spawn() {
      var W = sky.clientWidth, H = sky.clientHeight; if (!W || !H) return;
      var w = G.clamp(W * [0.27, 0.21, 0.165][lv - 1], [84, 66, 54][lv - 1], [130, 104, 86][lv - 1]), h = w * 1.43;
      var col = lv === 3 ? (spawned < 2 || Math.random() < 0.45 ? RED : G.pick(OTHERS)) : G.pick(COLS);
      var x, tries = 0;
      do { x = w / 2 + Math.random() * Math.max(1, W - w); }
      while (tries++ < 8 && balloons.some(function (o) { return Math.abs(o.x - x) < w * 0.85 && o.y > H - h * 1.3; }));
      var b = { x: x, y: H + 8, w: w, h: h, vy: (H + h * 1.5) / RISE, ph: Math.random() * 6.28, fr: 0.25 + Math.random() * 0.25, amp: w * 0.12, col: col,
        gift: (lv < 3 || col === RED) && Math.random() < 0.3 ? G.pick(PP_GIFT) : null, dead: false, no: false };
      b.el = G.el('<div class="pp-b" role="button" aria-label="' + col.name + ' 풍선" style="--c:' + col.hex + ';--w:' + Math.round(w) + 'px">' + ppSVG() + '</div>');
      b.el.addEventListener('pointerdown', function (e) { e.preventDefault(); tap(b); });
      sky.appendChild(b.el); balloons.push(b); spawned++; place(b);
    }
    function bits(b, x, y) {
      for (var i = 0, n = calm() ? 4 : 8; i < n; i++) {
        var a = i / n * 6.28, r = b.w * (0.45 + Math.random() * 0.3);
        var s = G.el('<i class="pp-bit" style="--c:' + b.col.hex + ';left:' + x + 'px;top:' + y + 'px;--dx:' + Math.cos(a) * r + 'px;--dy:' + Math.sin(a) * r + 'px"></i>');
        sky.appendChild(s); setTimeout(function (n) { n.remove(); }.bind(null, s), 600);
      }
    }
    function tap(b) {
      if (b.dead || !running) return;
      var sr = sky.getBoundingClientRect(), r = b.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.width * 0.52;
      if (lv === 3 && b.col !== RED) {
        if (!b.no) { b.no = true; st.wrong++; ctx.trial(false); b.vy *= 1.3; }
        G.sfx.play('oops'); b.el.classList.remove('no'); void b.el.offsetWidth; b.el.classList.add('no');
        floatText(sky, G.pick(['빨간 풍선만!', '이건 그냥 보내 줘요~', '쉿, 참아요!']), cx, cy - 30);
        return;
      }
      b.dead = true; st.popped++; ctx.trial(true); cntEl.textContent = st.popped;
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
      if (el >= DUR) return;            /* 끝난 뒤 날아간 풍선은 세지 않는다 */
      if (lv < 3) { st.escaped++; ctx.trial(false); }
      else if (b.col === RED) st.missedRed++;
    }
    function end() {
      if (ended) return; ended = true; running = false;
      Object.assign(ctx.extra, st);
      ctx.progress(5, 5);
      ctx.finish({ msg: !st.popped ? '풍선이랑 신나게 놀았어! 다음엔 콕 눌러 보자!' : lv === 3 ? '빨간 풍선을 ' + st.popped + '개나 터뜨렸어! 다른 색은 꾹 참았지? 최고야!' : '풍선 ' + st.popped + '개를 펑펑! 손가락 대장이야!' });
    }
    ctx.loop(function (dt) {
      if (!running) return;
      el += dt; acc += dt;
      if (el < DUR && acc >= SPAWN && balloons.length < MAXON) { acc = 0; spawn(); }
      for (var i = balloons.length - 1; i >= 0; i--) {
        var b = balloons[i];
        b.y -= b.vy * dt * (el >= DUR ? 1.8 : 1); place(b);
        if (b.y < -b.h * 1.05) { balloons.splice(i, 1); b.el.remove(); if (!b.dead) escape(b); }
      }
      tbar.style.width = Math.max(0, 100 - el / DUR * 100) + '%';
      var pi = Math.min(4, Math.floor(el / DUR * 5)); if (pi !== lastPi) { lastPi = pi; ctx.progress(pi, 5); }
      if (el >= DUR && (!balloons.length || el > DUR + 4)) { end(); return false; }
    });
    ctx.progress(0, 5);
    if (ruleEl) popEl(ruleEl);
    ctx.say(lv === 3 ? '풍선이 날아와요! 빨간 풍선만 손가락으로 콕! 다른 색은 그냥 보내 줘요.' : '풍선이 둥둥 날아와요! 손가락 하나로 콕 눌러서 펑 터뜨려 봐!')
      .then(function () { return ctx.say('준비, 시작!', { repeat: false }); })
      .then(function () { running = true; G.sfx.play('up'); });
  }
});

/* ===========================================================
   4. 색깔 나누기 — 누른 채 끌어 옮기기 · 분류 (3단계 끝판은 범주로 규칙 바꾸기)
   =========================================================== */
var SO_ITEMS = {
  red:    [['🍎', '사과'], ['🍓', '딸기'], ['🍅', '토마토'], ['🚒', '소방차'], ['❤️', '하트'], ['🌹', '장미']],
  yellow: [['🍌', '바나나'], ['🌽', '옥수수'], ['🐥', '병아리'], ['⭐', '별'], ['🌻', '해바라기'], ['💛', '하트'], ['🍋', '레몬']],
  blue:   [['🐳', '고래'], ['💙', '하트'], ['💧', '물방울'], ['🧢', '모자'], ['🦋', '나비']],
  green:  [['🐸', '개구리'], ['🥦', '브로콜리'], ['🍀', '네잎클로버'], ['🌲', '나무'], ['🥒', '오이'], ['💚', '하트'], ['🐢', '거북이']],
  orange: [['🍊', '귤'], ['🥕', '당근'], ['🦊', '여우'], ['🏀', '농구공'], ['🧡', '하트'], ['🎃', '호박']],
  purple: [['🍇', '포도'], ['🍆', '가지'], ['💜', '하트'], ['🔮', '구슬']]
};
var SO_CATS = { food: '#ef6c57', animal: '#e0a000', vehicle: '#3b9cf0' };
function soWords(cat) {
  var seen = {}, icon = (D.CATS[cat] || {}).e;
  return D.WORDS.filter(function (w) { if (w.c !== cat || w.e === icon || seen[w.e]) return false; seen[w.e] = 1; return true; })
    .map(function (w) { return { e: w.e, n: w.w }; });
}

G.act({
  id: 'sort', area: 'motor', title: '색깔 나누기', icon: '🧺', order: 40, levels: 3, mins: 3, needs: [],
  ef: ['shift', 'attend'],
  desc: '같은 색끼리 바구니에 쏙',
  goal: '끌어 옮기기 조절 — 손가락으로 누른 채 원하는 곳까지 옮기고 놓기, 색·범주(먹을 것·동물·탈것) 분류',
  how: '손가락으로 꾹 누른 채 바구니까지 끌고 가는 것이 목표예요(누르고·옮기고·놓기). 끌기가 어려우면 그림을 한 번 누르고 바구니를 눌러도 돼요. 넣을 때마다 "빨간 사과!"처럼 색 이름을 같이 말해 주세요.',
  basis: '지속적으로 누르며 끌기(잡기-옮기기-놓기)와 분류 — 색 → 범주 규칙 바꾸기(카드 나누기 DCCS의 기초)',
  offline: '빨래 갤 때 "양말은 여기, 수건은 저기" 나누고, 색 블록을 집게로 집어 같은 색 컵에 옮겨 보세요.',
  run: async function (ctx) {
    var lv = ctx.level;
    var plan = lv === 1 ? [{ m: 'color', k: 2, n: 6 }, { m: 'color', k: 2, n: 6 }]
      : lv === 2 ? [{ m: 'color', k: 3, n: 6 }, { m: 'color', k: 3, n: 6 }]
      : [{ m: 'color', k: 4, n: 8 }, { m: 'cat', k: 3, n: 6 }];
    var pool = lv === 1 ? ['red', 'yellow', 'blue', 'green'] : ['red', 'yellow', 'blue', 'green', 'orange', 'purple'];
    var used = [], misses = 0;
    var idle = idler(ctx, pace(12000), null);
    for (var b = 0; b < plan.length; b++) {
      ctx.progress(b, plan.length);
      var fresh = pool.filter(function (id) { return used.indexOf(id) < 0; });
      var ids = plan[b].m === 'color' ? (fresh.length >= plan[b].k ? G.sample(fresh, plan[b].k) : G.sample(pool, plan[b].k)) : Object.keys(SO_CATS);
      used = used.concat(ids);
      misses += await sortBoard(ctx, plan[b], b, ids, idle);
    }
    ctx.progress(plan.length, plan.length);
    ctx.extra.misses = misses;
    ctx.finish({ msg: '같은 것끼리 척척 나눴어! 정리 대장이야!' });
  }
});

function sortBoard(ctx, spec, bi, ids, idle) {
  return new Promise(function (resolve) {
    var B = ctx.body, color = spec.m === 'color';
    B.innerHTML = '';
    var groups = ids.map(function (id) {
      if (color) { var c = colorOf(id); return { id: id, hex: c.hex, name: c.name, adj: c.adj, label: '<i></i>' + c.name }; }
      var cat = D.CATS[id]; return { id: id, hex: SO_CATS[id], name: cat.name, label: '<span class="ce">' + cat.e + '</span>' + cat.name };
    });
    var per = spec.n / groups.length, items = [];
    groups.forEach(function (g) {
      var src = color ? SO_ITEMS[g.id].map(function (x) { return { e: x[0], n: x[1] }; }) : soWords(g.id);
      G.sample(src, per).forEach(function (it) { it.g = g; items.push(it); });
    });
    items = G.shuffle(items);
    var wrap = G.el('<div class="mt-wrap"><div class="so-tray"></div><div class="so-baskets" style="--n:' + groups.length + '"></div></div>');
    B.appendChild(wrap);
    var tray = G.$('.so-tray', wrap), bks = G.$('.so-baskets', wrap), sel = null, placed = 0, bmiss = 0, busy = false;
    var baskets = groups.map(function (g) {
      var el = G.el('<div class="so-bk" style="--c:' + g.hex + '"><div class="bh">' + g.label + '</div><div class="bin"></div><div class="bwv" aria-hidden="true">🧺</div></div>');
      bks.appendChild(el);
      var bk = { g: g, el: el, bin: G.$('.bin', el) };
      ctx.on(el, 'click', function () { if (sel && !busy) { var s = sel; select(null); put(s, bk); } });
      return bk;
    });
    items.forEach(function (it, k) {
      it.el = G.el('<div class="so-it" role="button" aria-label="' + G.esc(it.n) + '" style="animation-delay:' + (k * 0.06) + 's">' + it.e + '</div>');
      it.cell = k; it.jx = (Math.random() - 0.5) * 0.24; it.jy = (Math.random() - 0.5) * 0.24;
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
        flyInto(it.el, bk.bin, 'in');
        bk.el.classList.remove('got'); void bk.el.offsetWidth; bk.el.classList.add('got');
        G.sfx.play('pop'); G.buzz(12);
        var c = G.fx.center(bk.el); G.fx.burst(c[0], c[1]);
        var line = color ? it.g.adj + ' ' + it.n + '!' : G.josa(it.n, '은', '는') + ' ' + it.g.name + '!';
        if (placed < items.length) ctx.say(G.pick(['딩동! ', '쏙! ', '맞아! ', '']) + line, { repeat: false });
        else {
          busy = true; idle.stop();
          ctx.say(line, { repeat: false }).then(function () {
            return ctx.cheer(G.pick(color ? ['다 나눴다! 같은 색끼리 척척!', '색깔 박사네! 최고야!'] : ['먹을 것, 동물, 탈것! 다 나눴어!', '규칙이 바뀌어도 척척! 최고야!']));
          }).then(function () { return ctx.wait(400); }).then(function () { resolve(bmiss); });
        }
        return true;
      }
      if (!it.missed) { it.missed = true; bmiss++; ctx.trial(false); }
      G.sfx.play('oops'); G.ui.wiggle(bk.el);
      var right = baskets.filter(function (b) { return b.g === it.g; })[0];
      hintEl(ctx, right.el);
      ctx.say('음~ ' + G.josa(it.n, '은', '는') + ' ' + G.josa(it.g.name, '이야', '야') + '. 반짝이는 바구니에 쏙!', { repeat: false });
      return false;
    }
    idle.fn = function () {
      var it = items.filter(function (x) { return !x.done; })[0]; if (!it || busy) return;
      wig(it.el); hintEl(ctx, baskets.filter(function (b) { return b.g === it.g; })[0].el);
      ctx.bubble(G.josa(it.n, '은', '는') + ' 어느 바구니에 들어갈까?');
    };
    ctx.on(window, 'resize', layoutItems);
    requestAnimationFrame(layoutItems);
    if (!color) {
      busy = true; idle.stop();
      announce(ctx, wrap, '🔄', '이번엔 규칙이 바뀌어요!', '먹을 것, 동물, 탈것끼리 나눠 줘!').then(function () { busy = false; idle.go(); });
    } else {
      idle.go();
      ctx.say(bi === 0 ? '같은 색깔끼리 바구니에 넣어 줘! 손가락으로 꾹 눌러서 끌고 가 봐.' : G.pick(['이번엔 다른 색깔이야! 같은 색끼리 쏙!', '또 나눠 볼까? 같은 색끼리!']));
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
function tlLayout(lv) {
  var L = { walls: [], way: [] }, r = function (a, b) { return a + Math.random() * (b - a); };
  if (lv === 1) { L.start = { a: 0.14, b: r(0.25, 0.75) }; L.hole = { a: 0.86, b: r(0.2, 0.8) }; }
  else if (lv === 2) { L.walls.push({ a: 0.5, b0: 0, b1: 0.62 }); L.way.push({ a: 0.5, b: 0.82 }); L.start = { a: 0.14, b: 0.26 }; L.hole = { a: 0.86, b: 0.26 }; }
  else {
    L.walls.push({ a: 0.36, b0: 0, b1: 0.64 }, { a: 0.66, b0: 0.36, b1: 1 });
    L.way.push({ a: 0.36, b: 0.83 }, { a: 0.66, b: 0.17 });
    L.start = { a: 0.12, b: 0.24 }; L.hole = { a: 0.88, b: 0.76 };
  }
  L.way.push(L.hole);
  L.flip = Math.random() < 0.5; L.mir = Math.random() < 0.5;
  return L;
}

G.act({
  id: 'tilt', area: 'motor', title: '공 굴리기', icon: '⛳', order: 50, levels: 3, mins: 3, needs: ['motion'],
  ef: ['plan', 'attend'],
  desc: '살살 기울여 공을 구멍에 쏙',
  goal: '양측 협응·힘 조절 — 두 손으로 기기를 잡고 조금씩 기울여 공의 움직임을 조절하기, 벽을 돌아가는 운동 계획',
  how: '기기 양옆을 두 손으로 잡고 아주 살살 기울이게 해 주세요 — 양손을 같이 쓰는 연습이에요. 너무 세게 기울이면 "거북이처럼 천천히~" 하고 말해 줘요. 기울기가 안 되는 기기는 손가락으로 공을 끌어도 돼요.',
  basis: '양손으로 잡고 기울이기(양측 협응)·고유수용 감각 — 조금씩 조절하는 힘 조절(graded control)과 운동 계획',
  offline: '쟁반에 구슬이나 탁구공을 올리고 두 손으로 기울여 종이컵 안에 넣어 보세요.',
  run: function (ctx) {
    var lv = ctx.level, B = ctx.body, GOALS = 4;
    B.innerHTML = '<div class="mt-wrap"><div class="mt-top"><span class="mt-pill tl-count">⛳ <b>0</b> / ' + GOALS + '</span><button class="btn sm soft tl-mode" type="button" hidden></button></div>' +
      '<div class="tl-board"><div class="tl-start"><div class="te">⛳</div><div class="tt">기기를 <b>두 손</b>으로 꼭 잡고<br>살살 기울여서 공을 구멍에 쏙!</div>' +
      '<button class="btn big tl-go" type="button">▶ 시작</button><button class="btn sm ghost tl-finger" type="button">👆 손가락으로 할래요</button></div></div></div>';
    var board = G.$('.tl-board', B), modeBtn = G.$('.tl-mode', B), cntEl = G.$('.tl-count b', B), startEl = G.$('.tl-start', B);
    var K = ctx.canvas(board, { onResize: onResize });
    var mode = null, oriOn = false, gotOri = false, base = null, tx = 0, ty = 0, drag = null, pid = null;
    var k = 0, L = null, walls = [], hole = null, holeR0 = 20, holeR = 20, ball = null, running = false, t0 = 0, guide = null, sink = null;
    var helped = 0, lastBump = 0, COL = {}, bg = null, prevW = 0, prevH = 0, r = 20, FR = 8;
    board._probe = function () {   /* 자동 검사용 */
      return ball && hole && L ? { ball: { x: ball.x, y: ball.y }, hole: { x: hole.x, y: hole.y }, r: r, mode: mode, k: k, sunk: !!sink || ball.hide,
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
      holeR0 = r * [1.9, 1.6, 1.4][lv - 1];
      var T = r * 1.1;
      walls = L.walls.map(function (w) {
        var a = L.flip ? 1 - w.a : w.a, b0 = L.mir ? 1 - w.b1 : w.b0, b1 = L.mir ? 1 - w.b0 : w.b1;
        return tall ? { x: b0 * W, y: a * H - T / 2, w: (b1 - b0) * W, h: T } : { x: a * W - T / 2, y: b0 * H, w: T, h: (b1 - b0) * H };
      });
      hole = toXY(L.hole.a, L.hole.b);
      hole.x = G.clamp(hole.x, FR + holeR0 * 1.2, W - FR - holeR0 * 1.2); hole.y = G.clamp(hole.y, FR + holeR0 * 1.2, H - FR - holeR0 * 1.2);
      /* 바탕(펠트·나무 테두리·벽)은 한 번만 그려 둔다 */
      var dpr = K.dpr; bg = document.createElement('canvas'); bg.width = W * dpr; bg.height = H * dpr;
      var c = bg.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = COL.felt; c.fillRect(0, 0, W, H);
      c.fillStyle = COL.dot;
      for (var y = 14; y < H; y += 26) for (var x = (y / 26 % 2) * 13 + 10; x < W; x += 26) { c.beginPath(); c.arc(x, y, 1.8, 0, 7); c.fill(); }
      c.strokeStyle = COL.wall; c.lineWidth = FR * 2; c.strokeRect(0, 0, W, H);
      walls.forEach(function (w) {
        c.fillStyle = COL.wall; roundRect(c, w.x, w.y, w.w, w.h, Math.min(w.w, w.h) / 2); c.fill();
        c.fillStyle = COL.wall2; roundRect(c, w.x + 3, w.y + 3, Math.max(2, w.w - 6), Math.max(2, Math.min(w.h - 6, 6)), 3); c.fill();
      });
    }
    function roundRect(c, x, y, w, h, rr) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, rr); else c.rect(x, y, w, h); }
    function onResize() {
      if (!L) { prevW = K.w; prevH = K.h; draw(); return; }
      readCols();
      var ow = prevW || K.w, oh = prevH || K.h;
      build();
      if (ball) { ball.x = ball.x * K.w / ow; ball.y = ball.y * K.h / oh; }
      prevW = K.w; prevH = K.h;
      draw();
    }
    function nextGoal() {
      readCols();
      L = tlLayout(lv); build(); prevW = K.w; prevH = K.h;
      var s = toXY(L.start.a, L.start.b);
      ball = { x: G.clamp(s.x, FR + r, K.w - FR - r), y: G.clamp(s.y, FR + r, K.h - FR - r), vx: 0, vy: 0, rot: 0, e: TL_BALLS[k % TL_BALLS.length], hide: false };
      holeR = holeR0; guide = null; sink = null; t0 = performance.now();
      if (k > 0) ctx.say(lv === 1 ? G.pick(['이번엔 저쪽 구멍이야!', '또 해 볼까? 살살~']) : G.pick(['나무 벽을 돌아서 가 봐!', '벽을 피해서 구멍까지!', '어느 쪽으로 돌아갈까?']));
    }
    function tiltAcc(deg) { var d = Math.abs(deg) < 1.5 ? 0 : deg - (deg > 0 ? 1.5 : -1.5); return Math.sin(G.clamp(d, -30, 30) * Math.PI / 180); }
    function bump(v) {
      var S = Math.min(K.w, K.h), now = performance.now();
      if (v > S * 0.35 && now - lastBump > 120) { lastBump = now; if (!calm()) G.sfx.play('tick'); if (v > S) G.buzz(8); }
    }
    function collide() {
      var lo = FR + r, hx = K.w - FR - r, hy = K.h - FR - r;
      if (ball.x < lo) { ball.x = lo; bump(-ball.vx); ball.vx = Math.abs(ball.vx) * 0.45; }
      if (ball.x > hx) { ball.x = hx; bump(ball.vx); ball.vx = -Math.abs(ball.vx) * 0.45; }
      if (ball.y < lo) { ball.y = lo; bump(-ball.vy); ball.vy = Math.abs(ball.vy) * 0.45; }
      if (ball.y > hy) { ball.y = hy; bump(ball.vy); ball.vy = -Math.abs(ball.vy) * 0.45; }
      walls.forEach(function (w) {
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
    function physics(dt) {
      var S = Math.min(K.w, K.h);
      if (guide) {   /* 자비스가 길을 따라 살살 밀어 준다 */
        var tp = guide[0], dx = tp.x - ball.x, dy = tp.y - ball.y, d = Math.hypot(dx, dy), sp = S * 0.7;
        if (d < 6 && guide.length > 1) guide.shift();
        else if (d > 1) { ball.vx = dx / d * sp; ball.vy = dy / d * sp; ball.x += ball.vx * Math.min(dt, d / sp); ball.y += ball.vy * Math.min(dt, d / sp); }
        ball.rot += ball.vx * dt / r; return;
      }
      var ax = 0, ay = 0;
      if (drag) { ax = (drag.x - ball.x) * 30 - ball.vx * 10; ay = (drag.y - ball.y) * 30 - ball.vy * 10; }
      else if (mode === 'tilt') { ax = tiltAcc(tx) * S * 2.8; ay = tiltAcc(ty) * S * 2.8; }
      ball.vx += ax * dt; ball.vy += ay * dt;
      if (!drag) { var f = Math.pow(mode === 'tilt' ? 0.45 : 0.2, dt); ball.vx *= f; ball.vy *= f; }
      var sp2 = Math.hypot(ball.vx, ball.vy), vmax = S * 1.5;
      if (sp2 > vmax) { ball.vx *= vmax / sp2; ball.vy *= vmax / sp2; sp2 = vmax; }
      var n = Math.max(1, Math.ceil(sp2 * dt / (r * 0.4)));
      for (var i = 0; i < n; i++) { ball.x += ball.vx * dt / n; ball.y += ball.vy * dt / n; collide(); }
      ball.rot += ball.vx * dt / r;
    }
    function startGuide() {
      var tall = K.h > K.w * 1.12, a = tall ? ball.y / K.h : ball.x / K.w;
      if (L.flip) a = 1 - a;
      guide = L.way.filter(function (w, i) { return i === L.way.length - 1 || w.a > a + 0.02; }).map(function (w) { return w === L.hole ? { x: hole.x, y: hole.y } : toXY(w.a, w.b); });
      drag = null;
      ctx.say(G.pick(['자비스가 살짝 밀어 줄게!', '같이 해 보자! 데굴데굴~']), { repeat: false });
    }
    function draw() {
      var c = K.c, W = K.w, H = K.h; if (!W) return;
      if (!bg || !L) { c.fillStyle = COL.felt || '#a9dd8a'; c.fillRect(0, 0, W, H); return; }
      c.drawImage(bg, 0, 0, W, H);
      /* 구멍 */
      c.fillStyle = COL.rim; c.beginPath(); c.arc(hole.x, hole.y + 2, holeR * 1.18, 0, 7); c.fill();
      c.fillStyle = COL.hole; c.beginPath(); c.arc(hole.x, hole.y, holeR, 0, 7); c.fill();
      c.font = Math.round(r * 1.7) + 'px ' + EMOJI; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillText('🚩', hole.x + holeR * 0.55, hole.y - holeR * 0.35);
      if (!ball || ball.hide) return;
      var sc = sink ? Math.max(0.15, 1 - sink.t / 0.4 * 0.85) : 1;
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(ball.x + r * 0.15, ball.y + r * 0.8 * sc, r * 0.9 * sc, r * 0.35 * sc, 0, 0, 7); c.fill();
      c.save(); c.translate(ball.x, ball.y); c.scale(sc, sc);
      c.fillStyle = ball.e; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
      c.save(); c.beginPath(); c.arc(0, 0, r, 0, 7); c.clip(); c.rotate(ball.rot);   /* 굴러가는 줄무늬 */
      c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(-r, -r * 0.2, r * 2, r * 0.4); c.restore();
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r - 1, 0, 7); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(-r * 0.35, -r * 0.38, r * 0.26, 0, 7); c.fill();
      c.restore();
    }
    function goalDone() {
      var ok = !guide && holeR <= holeR0 * 1.05;
      ctx.trial(ok); if (!ok) helped++;
      k++; cntEl.textContent = k; ctx.progress(k, GOALS);
      ball.hide = true; guide = null; drag = null;
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
      if (sink) {
        sink.t += dt;
        var q = Math.min(1, sink.t / 0.25);
        ball.x = sink.x + (hole.x - sink.x) * q; ball.y = sink.y + (hole.y - sink.y) * q;
        draw();
        if (sink.t >= 0.4 && !sink.fired) { sink.fired = true; goalDone(); }
        return;
      }
      if (ball.hide) { draw(); return; }
      physics(dt);
      var el = (performance.now() - t0) / 1000, H0 = pace([15000, 20000, 25000][lv - 1]) / 1000, AUTO = pace([40000, 50000, 60000][lv - 1]) / 1000;
      if (el > H0) holeR = holeR0 * (1 + 0.8 * Math.min(1, (el - H0) / 25));   /* 오래 걸리면 구멍이 살살 커진다 */
      if (el > AUTO && !guide) startGuide();
      if (Math.hypot(ball.x - hole.x, ball.y - hole.y) < holeR * 0.8) {
        sink = { t: 0, x: ball.x, y: ball.y }; G.sfx.play('ding'); G.buzz([20, 30, 20]);
      }
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
    function wantTilt(then) {
      var DOE = window.DeviceOrientationEvent;
      function listen() {
        if (!oriOn) { oriOn = true; ctx.on(window, 'deviceorientation', onOri); }
        base = null; gotOri = false;
        ctx.timeout(function () { then(gotOri); }, 800);
      }
      if (!G.has.motion || !DOE) { then(false); return; }
      if (typeof DOE.requestPermission === 'function') {   /* 아이폰 — 손가락으로 누른 그 순간에 물어야 한다 */
        DOE.requestPermission().then(function (s) { if (s === 'granted') listen(); else then(false); }).catch(function () { then(false); });
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
      ctx.say(m === 'tilt' ? '살살 기울여서 공을 구멍에 넣어 봐! 천천히~' : (fellBack ? '손가락으로 해 보자! ' : '') + '공을 손가락으로 끌어서 구멍에 쏙 넣어 봐!');
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
    /* 손가락으로 끌기 (기울이기 중에도 된다) */
    ctx.on(board, 'pointerdown', function (e) {
      if (!running || !ball || ball.hide || sink || guide || pid !== null) return;
      e.preventDefault(); pid = e.pointerId;
      try { board.setPointerCapture(pid); } catch (er) {}
      var rr = board.getBoundingClientRect(); drag = { x: e.clientX - rr.left, y: e.clientY - rr.top, rect: rr };
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

G.act({
  id: 'scratch', area: 'motor', title: '쓱쓱 지우기', icon: '✨', order: 60, levels: 3, mins: 2, needs: [],
  ef: ['attend'],
  desc: '쓱쓱 문지르면 뭐가 나올까?',
  goal: '손가락 힘·분리 운동 — 검지 끝으로 꾹 누르며 오래 문지르기(지속 동작), 끝까지 하는 주의 집중',
  how: '검지 끝으로 꾹 누르며 문지르게 해 주세요 — 손가락 힘과 오래 하기를 기르는 놀이예요. 반쯤 보이면 "뭘까?" 하고 맞혀 보게 하면 말하기 연습도 돼요. 3단계는 붓이 작아서 더 꼼꼼히 문질러야 해요.',
  basis: '손가락 분리 운동·지속적으로 눌러 문지르기(힘 조절) — 감각 되먹임이 큰 반복 동작',
  offline: '김 서린 창문·거울에 손가락으로 그림을 그리고, 크레용을 칠한 종이 위를 검게 덮은 뒤 이쑤시개로 긁어 숨은 색을 찾아보세요(스크래치 아트).',
  run: async function (ctx) {
    var lv = ctx.level, B = ctx.body, NP = 5, GN = 20;
    B.innerHTML = '<div class="mt-wrap"><div class="sc-card"><div class="sc-pic" style="visibility:hidden"><span></span></div></div><div class="mt-bar sc-bar"><b></b></div></div>';
    var card = G.$('.sc-card', B), pic = G.$('.sc-pic', B), picE = G.$('.sc-pic span', B), bar = G.$('.sc-bar b', B);
    var K = ctx.canvas(card, { onResize: function () { if (cur && !cur.done) coat(); } });
    var grid = new Uint8Array(GN * GN), cleared = 0, cur = null, pid = null, last = null, lastSnd = 0, helped = 0;
    var words = scWords(lv, NP), idle = idler(ctx, pace(9000), nudge);

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
      c.font = Math.round(w * 0.42) + 'px Jua, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(255,255,255,.6)'; c.fillText('?', w / 2, h / 2 + w * 0.02);
      grid.fill(0); cleared = 0; bar.style.width = '0%';
      pic.style.visibility = '';
      cur.br = w * [0.1, 0.07, 0.048][lv - 1];
    }
    function mark(x, y, br) {
      var cs = K.w / GN, i0 = Math.max(0, Math.floor((x - br) / cs)), i1 = Math.min(GN - 1, Math.floor((x + br) / cs)),
        j0 = Math.max(0, Math.floor((y - br) / cs)), j1 = Math.min(GN - 1, Math.floor((y + br) / cs));
      for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) {
        var cx = (i + 0.5) * cs, cy = (j + 0.5) * cs;
        if ((cx - x) * (cx - x) + (cy - y) * (cy - y) <= br * br && !grid[j * GN + i]) { grid[j * GN + i] = 1; cleared++; }
      }
    }
    function rub(x, y, br) {
      var c = K.c;
      c.globalCompositeOperation = 'destination-out'; c.strokeStyle = '#000'; c.fillStyle = '#000'; c.lineCap = 'round'; c.lineWidth = br * 2;
      if (last) { c.beginPath(); c.moveTo(last.x, last.y); c.lineTo(x, y); c.stroke(); }
      else { c.beginPath(); c.arc(x, y, br, 0, 7); c.fill(); }
      c.globalCompositeOperation = 'source-over';
      var from = last || { x: x, y: y }, Ld = Math.hypot(x - from.x, y - from.y), n = Math.max(1, Math.ceil(Ld / (br * 0.5)));
      for (var k = 0; k <= n; k++) mark(from.x + (x - from.x) * k / n, from.y + (y - from.y) * k / n, br);
      last = { x: x, y: y };
    }
    function check() {
      var pct = cleared / (GN * GN);
      bar.style.width = Math.min(100, pct / 0.62 * 100) + '%';
      if (pct >= 0.62) { reveal(true); return; }
      if (pct >= 0.3 && !cur.said) { cur.said = true; ctx.bubble(G.pick(['뭘까? 조금 더 쓱쓱!', '뭐가 보이니? 더 문질러 봐!', '거의 보인다! 쓱쓱!'])); }
    }
    function reveal(ok) {
      if (!cur || cur.done) return;
      cur.done = true; pid = null; last = null;
      clearTimeout(cur.autoH);
      ctx.trial(ok); if (!ok) helped++;
      card.classList.add('open'); pic.classList.add('show'); bar.style.width = '100%';
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
      for (var t = 0; t <= 24; t++) pts.push({ x: s * (0.3 + 0.4 * (t % 2)), y: s * (0.38 + t * 0.01) });
      ghost(ctx, card, pts, 2);
      ctx.bubble(G.pick(['손가락으로 쓱쓱 문질러 봐!', '꾹 누르고 쓱쓱~', '뭐가 숨었는지 궁금하지? 쓱쓱!']));
    }
    function autoReveal() {
      if (!cur || cur.done || cur.auto) return;
      cur.auto = true; pid = null; last = null;
      ctx.say('자비스가 같이 쓱쓱 해 줄게!', { repeat: false });
      var pts = zigzag(6), i = 0, br = Math.max(cur.br, K.w * 0.09);
      ctx.loop(function (dt) {
        if (!cur || cur.done) return false;
        var steps = Math.max(1, Math.round(pts.length * dt / 1.3));
        for (var k = 0; k < steps && i < pts.length; k++, i++) { if (i % 13 === 0) last = null; rub(pts[i].x, pts[i].y, br); }
        bar.style.width = Math.min(100, cleared / (GN * GN) / 0.62 * 100) + '%';
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
      evs.forEach(function (ev) { var q = at(ev); rub(q.x, q.y, cur.br); });
      sound(); check();
    });
    function up(e) { if (e.pointerId !== pid) return; pid = null; last = null; }
    ctx.on(card, 'pointerup', up); ctx.on(card, 'pointercancel', up);

    function onePic(w, i) {
      return new Promise(function (resolve) {
        cur = { w: w, i: i, col: SC_COAT[i % SC_COAT.length], done: false, auto: false, said: false, br: 30, resolve: resolve };
        /* 덮개를 먼저 다시 씌운 다음에 그림을 바꾼다 (다음 그림이 비쳐 보이지 않게) */
        K.cv.style.transition = 'none'; card.classList.remove('open'); pic.classList.remove('show');
        coat(); void K.cv.offsetWidth; K.cv.style.transition = '';
        picE.textContent = w.e;
        idle.go();
        cur.autoH = ctx.timeout(autoReveal, pace([45000, 55000, 65000][lv - 1]));
        ctx.say(i === 0 ? '무언가 숨어 있어요! 손가락으로 쓱쓱 문질러 봐!' : G.pick(['이번엔 뭐가 숨었을까? 쓱쓱!', '쓱쓱 지우면 뭐가 나올까?', '또 숨었어! 쓱쓱 찾아보자!']));
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
   =========================================================== */
var PZ_COL = ['#ef5350', '#42a5f5', '#ffca28', '#66bb6a', '#ab47bc', '#ffa726'];
function pzShape(id) { return D.SHAPES.filter(function (s) { return s.id === id; })[0]; }

G.act({
  id: 'puzzle', area: 'motor', title: '모양 맞추기', icon: '🧩', order: 70, levels: 3, mins: 3, needs: [],
  ef: ['plan', 'attend'],
  desc: '모양 친구의 집을 찾아 줘요',
  goal: '형태 지각·공간 관계 — 모양을 비교해 같은 자리를 찾고, 끌어다 정확히 맞춰 넣기',
  how: '"동그라미 집은 어디 있지?" 하고 모양 이름을 같이 말해 주세요. 끌기가 어려우면 조각을 한 번 누르고 자리를 눌러도 돼요. 3단계는 색 단서 없이 모양만 보고 찾아야 해서 어려워요 — 손가락으로 테두리를 같이 따라 그려 보세요.',
  basis: '형태 지각·공간 관계 — 모양 맞추기 상자(형태판) 과제, 색 단서 → 모양만 보기로 단서를 줄여 감',
  offline: '그릇과 뚜껑 짝 맞추기, 모양 맞추기 상자 놀이, 종이에 블록 테두리를 그려 두고 그 위에 같은 블록 올리기를 해 보세요.',
  run: async function (ctx) {
    var lv = ctx.level, plan = lv === 1 ? [2, 2, 2] : lv === 2 ? [3, 4] : [5, 6];
    var easy = ['circle', 'square', 'triangle', 'heart', 'star'], all = D.SHAPES.map(function (s) { return s.id; }), last = '', misses = 0;
    var idle = idler(ctx, pace(12000), null);
    for (var b = 0; b < plan.length; b++) {
      ctx.progress(b, plan.length);
      var ids;
      if (lv === 1 && b === 0) ids = ['circle', 'square'];
      else { var tries = 0; do { ids = G.sample(lv === 1 ? easy : all, plan[b]); } while (ids.slice().sort().join() === last && tries++ < 10); }
      last = ids.slice().sort().join();
      misses += await pzBoard(ctx, ids.map(pzShape), b, idle);
    }
    ctx.progress(plan.length, plan.length);
    ctx.extra.misses = misses;
    ctx.finish({ msg: '모양 친구들이 모두 집을 찾았어! 고마워!' });
  }
});

function pzBoard(ctx, shapes, bi, idle) {
  return new Promise(function (resolve) {
    var B = ctx.body, lv = ctx.level, cue = lv < 3;
    B.innerHTML = '<div class="mt-wrap pz-wrap"><div class="pz-area pz-holes"></div><div class="pz-tip" aria-hidden="true">⬆️</div><div class="pz-area pz-tray"></div></div>';
    var wrap = G.$('.pz-wrap', B), holesBox = G.$('.pz-holes', B), tray = G.$('.pz-tray', B);
    var cols = G.shuffle(PZ_COL), sel = null, placed = 0, bmiss = 0, busy = false;
    var parts = shapes.map(function (s, k) { return { s: s, hex: cols[k % cols.length], hints: 0 }; });
    G.shuffle(parts).forEach(function (p) {
      var h = G.el('<div class="pz-hole" aria-label="' + p.s.name + ' 자리"><svg viewBox="0 0 100 100" aria-hidden="true"><g class="sil">' + p.s.svg + '</g></svg></div>');
      if (cue) { h.style.setProperty('--hc', hexA(p.hex, 0.26)); h.style.setProperty('--hs', p.hex); }
      holesBox.appendChild(h); p.hole = h;
      ctx.on(h, 'click', function () { if (sel && !busy && !p.done) { var s = sel; select(null); put(s, p); } });
    });
    G.shuffle(parts).forEach(function (p) {
      p.el = G.el('<div class="pz-pc" role="button" aria-label="' + p.s.name + '"><svg viewBox="0 0 100 100" aria-hidden="true"><g class="pc" style="fill:' + p.hex + '">' + p.s.svg + '</g></svg></div>');
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
      return best && bd < r.width / 1.1 * 0.75 ? { p: best, d: bd } : null;
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
    ctx.say(bi === 0 ? (lv === 3 ? '모양 친구들이 집을 찾아요. 이번엔 색깔 힌트가 없어! 모양만 잘 보고 끌어다 쏙!' : '모양 친구들이 자기 집을 찾아요. 같은 모양 자리에 끌어다 쏙 넣어 줘!')
      : G.pick(['이번엔 모양 친구가 더 많아!', '또 집을 찾아 줄까? 같은 모양끼리!']));
  });
}
})();

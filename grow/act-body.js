/* ===========================================================
   함께 자라요 — 몸놀이 (감각통합·대근육) · 쉬어가기 (자기조절) · 도구

   몸놀이
     move      따라 움직이기      동작 모방·운동 계획     (부모 판정)
     freeze    멈춰 놀이          억제 조절               (얼음 놀이 — 부모 판정)
     shake     흔들흔들 마라카스  리듬 따라 하기          (기기 흔들기, 안 되면 누르기)
   쉬어가기
     breathe   숨쉬기             느린 복식 호흡
     blow      촛불 끄기          호흡 조절·입술 근육     (마이크 바람 소리, 안 되면 부모 판정)
     bubbles   물방울 놀이        감각 진정
   도구 (홈의 📅 ⏳ 단추 — 스티커·기록 없음, ✕ 로 나간다)
     schedule  오늘 할 일         시각 일정표 + 먼저-다음 판
     timer     기다리기 타이머    시각 타이머

   ▸ 몸놀이는 아이가 화면에서 떨어져 움직이므로 그림을 크게 그리고, 말은 자비스가 읽는다.
   ▸ 아이에게는 틀림이 보이지 않는다. 맞고 틀림은 부모 판정이나 기기 판정(리듬 수·바람)이
     있는 곳에서만 ctx.trial 로 남긴다. 숨쉬기·물방울은 기록 없이 시간만 남는다.
   ▸ 감각 예민 모드(G.settings.calm): 소리를 줄이고, 반짝임·음표를 끄고, 박자를 늦춘다.
     숨쉬기 공·타이머 원판·남은 시간 고리처럼 '움직임이 곧 정보'인 것은 CSS 전환이 아니라
     JS 로 그려서 예민 모드(전환을 끈다)에서도 부드럽게 보인다.
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;
if (!G || !D) return;

/* ---------- 함께 쓰는 작은 도구 ---------- */
var NUM = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
var CNT = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];   /* 한 번, 두 번 … */
var SPARK = ['#ff7f61', '#ffd54f', '#4fc3a1', '#64b5f6', '#b388ff', '#f48fb1'];
function calm() { return !!G.settings.calm; }
function pace(ms) { return Math.round(ms * (calm() ? 1.25 : 1)); }
function ease(p) { p = G.clamp(p, 0, 1); return 0.5 - 0.5 * Math.cos(Math.PI * p); }
function now() { return performance.now(); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function q(sel, root) { return root.querySelector(sel); }

/* 놀이 칸 위로 떠오르는 짧은 글 ("꽁꽁! 잘 멈췄어!") */
function floatText(box, text, x, y) {
  var f = document.createElement('span'); f.className = 'bd-float'; f.textContent = text;
  var r = box.getBoundingClientRect();
  f.style.left = (x - r.left) + 'px'; f.style.top = (y - r.top) + 'px';
  if (calm()) f.style.animation = 'none';
  box.appendChild(f); setTimeout(function () { f.remove(); }, 1400);
}
/* 색 점 불꽃 — 감각 예민 모드에서는 끈다 */
function sparks(box, x, y, n, size) {
  if (calm()) return;
  var r = box.getBoundingClientRect();
  for (var i = 0; i < n; i++) {
    var s = document.createElement('i'), ang = Math.random() * Math.PI * 2, d = rnd(50, 120);
    s.className = 'bd-spark';
    s.style.left = (x - r.left) + 'px'; s.style.top = (y - r.top) + 'px';
    s.style.setProperty('--c', G.pick(SPARK)); s.style.setProperty('--s', Math.round(rnd(9, size || 20)) + 'px');
    s.style.setProperty('--dx', Math.round(Math.cos(ang) * d) + 'px'); s.style.setProperty('--dy', Math.round(Math.sin(ang) * d) + 'px');
    box.appendChild(s); setTimeout(function (el) { el.remove(); }.bind(null, s), 900);
  }
}
function restartAnim(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

/* 짧은 노래를 한 음씩 울린다. stop() 하면 곧바로 조용해진다.
   (G.sfx.melody 는 한 바퀴를 미리 예약해 두어서 멈춰도 그 바퀴 끝까지 소리가 남는다 — 멈춰 놀이에는 맞지 않다)
   o: {vol, type, bass(박마다 낮은 소리), once(한 번만)} */
function tune(ctx, notes, bpm, o) {
  o = o || {};
  var i = 0, pos = 0, h = null, stopped = false, beat = 60 / bpm;
  function step() {
    if (stopped || !ctx.alive) return;
    if (o.once && i >= notes.length) { stopped = true; return; }
    var n = notes[i % notes.length], f = n[0] ? (G.sfx.N[n[0]] || n[0]) : 0, d = n[1] * beat;
    if (f) G.sfx.tone(f, Math.max(0.08, d * 0.85), o.type || 'triangle', o.vol || 0.15);
    if (o.bass && !calm() && Math.abs(pos - Math.round(pos)) < 0.01) G.sfx.tone(Math.round(pos) % 2 ? 196 : 130.8, 0.16, 'sine', 0.13);
    i++; pos += n[1];
    h = setTimeout(step, d * 1000);
  }
  step();
  function stop() { stopped = true; clearTimeout(h); }
  ctx.cleanup(stop);
  return stop;
}

/* 일과 그림 고르기 (먼저-다음 판 · 타이머 '다 되면') — cb(item | null) */
function pickRoutine(ctx, title, cb, noneLabel) {
  var ov = G.el('<div class="modal bd-pick" role="dialog"><div class="md-card"><h3></h3><div class="bd-pgrid"></div>' +
    '<div class="bd-pbtns">' + (noneLabel ? '<button class="btn soft bd-none"></button>' : '') + '<button class="btn soft md-x">닫기</button></div></div></div>');
  q('h3', ov).textContent = title;
  var grid = q('.bd-pgrid', ov);
  D.ROUTINE.forEach(function (it) {
    var b = G.el('<button type="button"><span>' + it.e + '</span>' + G.esc(it.w) + '</button>');
    b.onclick = function () { G.sfx.play('tap'); close(); cb(it); };
    grid.appendChild(b);
  });
  function close() { ov.remove(); }
  if (noneLabel) { var nb = q('.bd-none', ov); nb.textContent = noneLabel; nb.onclick = function () { G.sfx.play('tap'); close(); cb(null); }; }
  q('.md-x', ov).onclick = function () { G.sfx.play('tap'); close(); };
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  document.body.appendChild(ov);
  ctx.cleanup(close);
}

G.css('body', `
/* ── 함께 ── */
.st-body .bd{flex:1;display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;min-height:0;position:relative;overflow-x:clip}
.bd-cap{font-family:Jua,sans-serif;font-size:clamp(19px,5vw,28px);line-height:1.4;text-align:center;max-width:680px;padding:0 6px}
.bd-chip{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--surface);border-radius:999px;padding:6px 16px;box-shadow:var(--shadow);
  font-family:Jua,sans-serif;font-size:clamp(15px,4vw,19px);max-width:100%;text-align:center;line-height:1.35}
.bd-help{color:var(--soft);font-size:clamp(12.5px,3.4vw,14px);text-align:center;line-height:1.4}
.bd-float{position:absolute;z-index:20;pointer-events:none;transform:translate(-50%,-50%);font-family:Jua,sans-serif;font-size:clamp(18px,5vw,26px);color:var(--ink);
  background:var(--surface);padding:4px 14px;border-radius:999px;box-shadow:var(--shadow);white-space:nowrap;animation:bdUp 1.4s ease-out forwards}
@keyframes bdUp{0%{opacity:0;transform:translate(-50%,-30%) scale(.8)}15%{opacity:1;transform:translate(-50%,-60%) scale(1)}100%{opacity:0;transform:translate(-50%,-170%)}}
.bd-spark{position:absolute;z-index:15;pointer-events:none;width:var(--s,14px);height:var(--s,14px);border-radius:50%;background:var(--c);transform:translate(-50%,-50%);animation:bdSpark .85s ease-out forwards}
@keyframes bdSpark{to{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.2);opacity:0}}
.bd-start{position:absolute;inset:0;z-index:25;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:16px;
  background:color-mix(in srgb,var(--bg) 84%,transparent);border-radius:26px}
.bd-start .btn{min-width:min(78vw,320px);min-height:88px;font-size:clamp(24px,6.4vw,32px)}
.bd-start small{color:var(--soft);font-size:clamp(14px,3.8vw,17px);max-width:420px;line-height:1.5}
.bd-pick .md-card{width:min(640px,100%);max-height:calc(100vh - 36px);max-height:calc(100dvh - 36px);overflow:auto}
.bd-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:8px;margin-top:10px}
.bd-pgrid button{background:var(--bg);border-radius:16px;padding:8px 2px 6px;display:flex;flex-direction:column;align-items:center;font-size:13px;line-height:1.25;font-weight:700}
.bd-pgrid button span{font-size:34px;line-height:1.2}
.bd-pbtns{display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap}

/* ── move 따라 움직이기 ── */
.act-move .mv-ring{position:relative;flex:none;width:min(84vw,48vh,460px);width:min(84vw,48dvh,460px);aspect-ratio:1;margin-top:auto;display:flex;align-items:center;justify-content:center}
.act-move .mv-ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.act-move .mv-trk{fill:none;stroke:var(--line);stroke-width:5}
.act-move .mv-arc{fill:none;stroke:var(--area);stroke-width:5;stroke-linecap:round}
.act-move .mv-disc{position:absolute;inset:8%;border-radius:50%;background:radial-gradient(circle at 50% 40%,var(--surface) 0 56%,color-mix(in srgb,var(--area) 16%,var(--surface)));box-shadow:var(--shadow)}
.act-move .mv-e{position:relative;font-size:min(38vw,23vh,220px);font-size:min(38vw,23dvh,220px);line-height:1;filter:drop-shadow(0 8px 10px rgba(0,0,0,.14))}
.act-move .mv-sec{position:absolute;right:1%;top:1%;width:23%;aspect-ratio:1;border-radius:50%;background:var(--area);color:#fff;font-family:Jua,sans-serif;
  font-size:min(9vw,5vh,48px);line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px color-mix(in srgb,var(--area) 40%,transparent)}
.act-move .mv-sec.tk{animation:pop .35s}
.act-move .mv-foot{min-height:84px;width:100%;display:flex;flex-direction:column;align-items:center;margin-bottom:auto}
.act-move .mv-foot .judge{margin:4px 0;width:100%}
.act-move .a-clap{animation:mvClap .45s ease-in-out infinite alternate}
.act-move .a-up{animation:mvUp 1.4s ease-in-out infinite}
.act-move .a-jump{animation:mvJump .7s cubic-bezier(.3,0,.5,1) infinite}
.act-move .a-sway{animation:mvSway 1.6s ease-in-out infinite}
.act-move .a-still{animation:mvStill 2.4s ease-in-out infinite}
.act-move .a-walk{animation:mvWalk 1.2s ease-in-out infinite}
.act-move .a-slow{animation:mvWalk 3s ease-in-out infinite}
.act-move .a-side{animation:mvSide 1.6s ease-in-out infinite}
@keyframes mvClap{from{transform:scale(.92)}to{transform:scale(1.08)}}
@keyframes mvUp{0%,100%{transform:translateY(6%)}50%{transform:translateY(-8%) scale(1.05)}}
@keyframes mvJump{0%,100%{transform:translateY(0) scaleY(.94)}45%{transform:translateY(-18%) scaleY(1.04)}}
@keyframes mvSway{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}
@keyframes mvStill{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@keyframes mvWalk{0%,100%{transform:translateX(-10%) rotate(-5deg)}50%{transform:translateX(10%) rotate(5deg)}}
@keyframes mvSide{0%,100%{transform:translateX(-16%)}50%{transform:translateX(16%)}}

/* ── freeze 멈춰 놀이 ── */
.act-freeze .fz-stars{min-height:38px;font-size:clamp(22px,6vw,30px);letter-spacing:1px;text-align:center;line-height:1.25;max-width:100%}
.act-freeze .fz-stage{position:relative;flex:1;min-height:260px;width:min(100%,660px);border-radius:32px;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  box-shadow:var(--shadow);transition:background .4s;
  background:linear-gradient(160deg,color-mix(in srgb,#ff8fb8 30%,var(--surface)),color-mix(in srgb,#ffd54f 26%,var(--surface)) 50%,color-mix(in srgb,#6fe0b0 28%,var(--surface)))}
.act-freeze .fz-stage.stop{background:linear-gradient(160deg,color-mix(in srgb,#9fd4ff 34%,var(--surface)),color-mix(in srgb,#cfe8ff 30%,var(--surface)))}
.act-freeze .fz-dancer{position:relative;z-index:1;font-size:min(36vw,22vh,200px);font-size:min(36vw,22dvh,200px);line-height:1.08;transform-origin:50% 90%;animation:fzDance var(--spd,.7s) ease-in-out infinite alternate}
@keyframes fzDance{0%{transform:rotate(-14deg)}50%{transform:rotate(0) translateY(-9%)}100%{transform:rotate(14deg)}}
.act-freeze .fz-stage.stop .fz-dancer{animation:none;filter:saturate(.35) brightness(1.06) drop-shadow(0 0 16px #8ccfff)}
.act-freeze .fz-word{position:relative;z-index:1;font-family:Jua,sans-serif;font-size:clamp(34px,10vw,60px);line-height:1.15}
.act-freeze .fz-sub{position:relative;z-index:1;color:var(--soft);font-size:clamp(15px,4vw,20px);min-height:1.5em;text-align:center;padding:0 10px}
.act-freeze .fz-hand{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:min(62vw,40vh,330px);opacity:0;pointer-events:none;transform:scale(.6);transition:opacity .2s,transform .2s}
.act-freeze .fz-stage.stop .fz-hand{opacity:.18;transform:scale(1)}
.act-freeze .fz-note{position:absolute;bottom:6%;font-size:clamp(24px,6vw,36px);pointer-events:none;animation:fzNote 2.2s ease-out forwards}
@keyframes fzNote{to{transform:translate(var(--dx,0),-240px) rotate(20deg);opacity:0}}
.act-freeze .fz-light{position:absolute;top:12px;right:12px;display:flex;flex-direction:column;gap:8px;background:#2b3442;padding:8px;border-radius:24px;box-shadow:var(--shadow);z-index:2}
.act-freeze .fz-light i{width:clamp(38px,10vw,58px);aspect-ratio:1;border-radius:50%;background:#4a5262;transition:background .2s,box-shadow .2s}
.act-freeze .fz-light i.r.on{background:#ff4d4d;box-shadow:0 0 24px #ff4d4d}
.act-freeze .fz-light i.g.on{background:#2fd16a;box-shadow:0 0 24px #2fd16a}
.act-freeze .fz-foot{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%}
.act-freeze .fz-ok{min-width:min(84vw,360px);min-height:74px;font-size:clamp(22px,6vw,28px)}
.act-freeze .fz-ok:disabled{opacity:.35}
.act-freeze .fz-ok.got{background:var(--good);opacity:1}

/* ── shake 흔들흔들 마라카스 ── */
.act-shake .sk-top{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:52px;width:100%}
.act-shake .sk-bar{width:min(100%,520px);height:22px;border-radius:999px;background:var(--line);overflow:hidden;box-shadow:inset 0 2px 4px rgba(0,0,0,.08)}
.act-shake .sk-bar b{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#ff7f61,#ffd54f,#4fc3a1,#64b5f6,#b388ff);transition:width .2s}
.act-shake .sk-dots{display:flex;gap:clamp(10px,3vw,18px);justify-content:center;flex-wrap:wrap}
.act-shake .sk-dots i{width:clamp(34px,9vw,48px);aspect-ratio:1;border-radius:50%;background:var(--surface);border:4px dashed var(--line);transition:background .15s,transform .15s,opacity .2s}
.act-shake .sk-dots i.jv{background:#ffd54f;border:4px solid #f5b700;transform:scale(1.1)}
.act-shake .sk-dots i.on{background:var(--area);border:4px solid var(--area);transform:scale(1.12)}
.act-shake .sk-dots.hide i:not(.on){opacity:0}
.act-shake .sk-turn{font-family:Jua,sans-serif;font-size:clamp(18px,5vw,24px);color:var(--soft);min-height:34px;text-align:center}
.act-shake .sk-stage{position:relative;flex:1;min-height:250px;width:min(100%,640px);display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:30px;
  background:radial-gradient(circle at 50% 50%,color-mix(in srgb,#ffd54f 26%,transparent) 0 26%,color-mix(in srgb,#ff7f61 10%,transparent) 44%,transparent 66%)}
.act-shake .sk-mar{width:min(46vw,28vh,240px);width:min(46vw,28dvh,240px);aspect-ratio:120/220;padding:0;border-radius:40%;touch-action:manipulation}
.act-shake .sk-mar svg{display:block;width:100%;height:100%;transform-origin:50% 92%;overflow:visible}
.act-shake .sk-mar.hit svg{animation:skHit .28s ease-out}
@keyframes skHit{0%{transform:rotate(0)}30%{transform:rotate(-16deg) scale(1.05)}65%{transform:rotate(12deg)}100%{transform:rotate(0)}}
.act-shake .sk-tip{margin-bottom:4px}

/* ── breathe 숨쉬기 ── */
.act-breathe .br-scene{position:relative;flex:1;min-height:250px;width:100%;display:flex;align-items:center;justify-content:center}
.act-breathe .br-ball{position:relative;width:min(80vw,46vh,420px);width:min(80vw,46dvh,420px);aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;will-change:transform;
  background:radial-gradient(circle at 50% 42%,color-mix(in srgb,#ffe3ef 75%,var(--surface)) 0 32%,color-mix(in srgb,#a8ecc8 60%,var(--surface)) 64%,color-mix(in srgb,#4caf6e 50%,var(--surface)) 100%);
  box-shadow:0 0 0 14px color-mix(in srgb,var(--area) 10%,transparent),0 0 60px color-mix(in srgb,var(--area) 32%,transparent)}
.act-breathe .br-e{font-size:min(30vw,17vh,160px);font-size:min(30vw,17dvh,160px);line-height:1}
.act-breathe .br-cand{display:inline-block;transform-origin:50% 100%;animation:brFlick .6s ease-in-out infinite alternate}
@keyframes brFlick{from{transform:rotate(-3deg)}to{transform:rotate(3deg) scaleY(1.04)}}
.act-breathe .br-word{font-family:Jua,sans-serif;font-size:clamp(38px,11vw,64px);line-height:1.1;text-align:center;min-height:1.1em}
.act-breathe .br-sub{color:var(--soft);font-size:clamp(16px,4.4vw,21px);text-align:center;min-height:1.6em}
.act-breathe .br-secs{display:flex;gap:10px;justify-content:center;min-height:18px;margin-bottom:6px}
.act-breathe .br-secs i{width:16px;height:16px;border-radius:50%;background:var(--line);transition:background .3s}
.act-breathe .br-secs i.on{background:var(--area)}
.act-breathe .br-petal{position:absolute;left:50%;top:50%;font-size:clamp(20px,5vw,30px);pointer-events:none;opacity:0;animation:brPetal 2.8s ease-out both}
@keyframes brPetal{0%{opacity:0;transform:translate(-50%,-50%)}15%{opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(160deg);opacity:0}}

/* ── blow 촛불 끄기 ── */
.act-blow .bl-meter{display:flex;align-items:center;gap:10px;width:min(100%,460px);min-height:40px}
.act-blow .bl-meter span{font-size:28px;line-height:1}
.act-blow .bl-meter div{flex:1;height:18px;border-radius:999px;background:var(--line);overflow:hidden}
.act-blow .bl-meter b{display:block;height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#9be7ff,#4fc3f7,#7c6cff)}
.act-blow .bl-meter.off{opacity:.35}
.act-blow .bl-scene{position:relative;flex:1;min-height:270px;width:min(100%,640px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:30px}
.act-blow .bl-candles{position:relative;z-index:2;display:flex;align-items:flex-end;justify-content:center;gap:var(--gap,28px)}
.act-blow .bl-cnd{position:relative;width:var(--cw,40px);height:var(--ch,150px);border-radius:10px 10px 6px 6px;padding:0;touch-action:manipulation;
  background:repeating-linear-gradient(135deg,var(--c1) 0 12px,#fffaf0 12px 22px);box-shadow:inset -6px 0 0 rgba(0,0,0,.08)}
.act-blow .bl-cnd::before{content:'';position:absolute;left:50%;top:-11px;width:3px;height:13px;background:#5d4037;transform:translateX(-50%);border-radius:2px}
.act-blow .bl-flame{position:absolute;left:50%;bottom:calc(100% + 6px);width:calc(var(--cw) * 1.05);height:calc(var(--cw) * 1.7);transform-origin:50% 100%;
  transform:translateX(-50%) skewX(var(--lean,0deg)) scale(var(--sz,1));transition:opacity .25s;animation:blIn .5s ease-out;pointer-events:none}
.act-blow .bl-flame i{position:absolute;inset:0;border-radius:50% 50% 50% 50% / 62% 62% 38% 38%;transform-origin:50% 100%;
  background:radial-gradient(ellipse at 50% 72%,#fff8c8 0 22%,#ffd54f 42%,#ff9800 72%,rgba(255,87,34,0) 100%);box-shadow:0 0 26px 8px rgba(255,190,60,.42);
  animation:blFlick .18s ease-in-out infinite alternate}
@keyframes blFlick{from{transform:scaleY(1) rotate(-2deg)}to{transform:scaleY(1.08) rotate(2deg)}}
@keyframes blIn{from{opacity:0}}
.act-blow .bl-cnd.out .bl-flame{opacity:0}
.act-blow .bl-smoke{position:absolute;left:50%;bottom:calc(100% + 6px);font-size:calc(var(--cw) * 1.1);transform:translateX(-50%);pointer-events:none;opacity:.75;animation:blSmoke 1.6s ease-out forwards}
@keyframes blSmoke{to{transform:translate(-20%,-110px) scale(1.6);opacity:0}}
.act-blow .bl-cake{position:relative;width:var(--kw,320px);height:var(--kh,120px);margin-top:-6px;border-radius:24px 24px 18px 18px;box-shadow:var(--shadow);
  background:linear-gradient(180deg,#fff 0 20%,#f8bbd0 20% 30%,#ffe0b2 30% 60%,#f48fb1 60% 69%,#ffe0b2 69%)}
.act-blow .bl-cake::before{content:'';position:absolute;left:4px;right:4px;top:16%;height:20px;background:radial-gradient(circle at 12px 0,#fff 0 11px,transparent 12px) 0 0/30px 20px repeat-x}
.act-blow .bl-cake::after{content:'';position:absolute;left:-7%;right:-7%;bottom:-13px;height:20px;border-radius:50%;background:color-mix(in srgb,var(--ink) 12%,var(--surface));z-index:-1}
.act-blow .bl-holder{position:relative;width:calc(var(--cw) * 2.8);height:calc(var(--cw) * .55);margin-top:-10px;border-radius:50%;
  background:radial-gradient(ellipse at 50% 35%,#ffe0b2,#ffb74d);box-shadow:var(--shadow)}
.act-blow .bl-foot{min-height:74px;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px}
.act-blow .bl-foot .judge{margin:0;width:100%}

/* ── bubbles 물방울 놀이 ── */
.act-bubbles .bb-pond{position:relative;flex:1;min-height:280px;width:100%;border-radius:28px;overflow:hidden;background:#0d2236;box-shadow:var(--shadow);touch-action:none}
.act-bubbles .bb-pond .gcv{position:absolute;left:0;top:0;border-radius:28px}
.act-bubbles .bb-hint{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:rgba(220,240,255,.82);font-family:Jua,sans-serif;font-size:clamp(20px,5.4vw,28px);
  pointer-events:none;text-align:center;transition:opacity 1.2s;white-space:nowrap}
.act-bubbles .bb-hint.off{opacity:0}
.act-bubbles .bb-time{height:5px;width:min(100%,640px);border-radius:9px;background:var(--line);overflow:hidden;opacity:.7;flex:none}
.act-bubbles .bb-time b{display:block;height:100%;width:100%;background:color-mix(in srgb,var(--area) 70%,transparent)}

/* ── schedule 오늘 할 일 ── */
.act-schedule .bd{flex:1 0 auto;gap:12px}
.act-schedule .sc-top{display:flex;align-items:center;gap:8px;width:100%}
.act-schedule .sc-seg{display:flex;flex:1;min-width:0;background:var(--surface);border-radius:18px;padding:4px;box-shadow:var(--shadow)}
.act-schedule .sc-seg button{flex:1;min-width:0;min-height:46px;border-radius:14px;font-family:Jua,sans-serif;font-size:clamp(15px,4vw,19px);color:var(--soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 6px}
.act-schedule .sc-seg button.on{background:var(--area);color:#fff}
.act-schedule .sc-edit{flex:none;min-height:46px}
.act-schedule .sc-now{display:flex;align-items:stretch;gap:10px;width:100%}
.act-schedule .sc-cur{flex:1.7;min-width:0;display:flex;align-items:center;gap:12px;background:var(--surface);border-radius:26px;padding:12px 14px;box-shadow:0 0 0 5px color-mix(in srgb,var(--area) 22%,transparent),var(--shadow);
  border:4px solid var(--area);text-align:left}
.act-schedule .sc-cur:active{transform:scale(.98)}
.act-schedule .sc-cur .ce{font-size:clamp(56px,16vw,96px);line-height:1;flex:none}
.act-schedule .sc-cur .ct{min-width:0}
.act-schedule .sc-cur b{display:block;font-family:Jua,sans-serif;font-weight:400;font-size:clamp(22px,6vw,34px);line-height:1.2}
.act-schedule .sc-cur small{display:block;color:var(--soft);font-size:clamp(12.5px,3.4vw,15px)}
.act-schedule .sc-tag{display:inline-block;font-family:Jua,sans-serif;font-size:clamp(13px,3.4vw,16px);background:var(--area);color:#fff;border-radius:999px;padding:1px 10px;line-height:1.5}
.act-schedule .sc-tag.soft{background:var(--line);color:var(--ink)}
.act-schedule .sc-nxt{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:var(--surface);border-radius:22px;padding:8px 6px;border:3px dashed var(--line);text-align:center}
.act-schedule .sc-nxt .ce{font-size:clamp(38px,10vw,60px);line-height:1.1}
.act-schedule .sc-nxt .cl{font-family:Jua,sans-serif;font-size:clamp(14px,3.8vw,19px);line-height:1.2}
.act-schedule .sc-all{flex:1;display:flex;align-items:center;justify-content:center;gap:14px;background:var(--surface);border-radius:26px;padding:16px;box-shadow:var(--shadow);border:4px solid var(--good)}
.act-schedule .sc-all .ce{font-size:clamp(50px,14vw,80px);line-height:1}
.act-schedule .sc-all b{font-family:Jua,sans-serif;font-weight:400;font-size:clamp(22px,6vw,32px)}
.act-schedule .sc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(98px,26vw,150px),1fr));gap:10px;width:100%}
.act-schedule .sc-card{position:relative;background:var(--surface);border-radius:20px;padding:12px 4px 8px;box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:center;gap:2px;border:3px solid transparent;min-width:0;transition:transform .12s}
.act-schedule .sc-card:active{transform:scale(.95)}
.act-schedule .sc-card .ce{font-size:clamp(36px,10vw,58px);line-height:1.1}
.act-schedule .sc-card .cl{font-family:Jua,sans-serif;font-size:clamp(14px,3.8vw,18px);line-height:1.2;text-align:center;word-break:keep-all}
.act-schedule .sc-card .n{position:absolute;left:8px;top:4px;font-family:Jua,sans-serif;font-size:13px;color:var(--soft)}
.act-schedule .sc-card.now{border-color:var(--area);box-shadow:0 0 0 4px color-mix(in srgb,var(--area) 22%,transparent),var(--shadow)}
.act-schedule .sc-card.next{border-color:var(--line);border-style:dashed}
.act-schedule .sc-card.done .ce,.act-schedule .sc-card.done .cl{opacity:.38}
.act-schedule .sc-card.done::after,.act-schedule .ft-card.done::after{content:'';position:absolute;left:50%;top:44%;width:52%;max-width:96px;aspect-ratio:1;transform:translate(-50%,-50%);
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='46' fill='%2322b07d'/%3E%3Cpath d='M29 52 L44 67 L72 37' fill='none' stroke='white' stroke-width='11' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat;filter:drop-shadow(0 3px 6px rgba(0,0,0,.18))}
.act-schedule .ft-card.done::after{max-width:150px}
.act-schedule .ft-board{display:flex;align-items:center;justify-content:center;gap:clamp(6px,2vw,18px);width:100%;margin-top:auto}
.act-schedule .ft-slot{flex:1;max-width:340px;min-width:0;display:flex;flex-direction:column;align-items:center;gap:8px}
.act-schedule .ft-lab{font-family:Jua,sans-serif;font-size:clamp(24px,6.6vw,36px);line-height:1.1}
.act-schedule .ft-card{position:relative;width:100%;aspect-ratio:1/1.12;border-radius:30px;background:var(--surface);box-shadow:var(--shadow);border:5px solid var(--line);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px;transition:transform .12s}
.act-schedule .ft-card:active{transform:scale(.96)}
.act-schedule .ft-card .ce{font-size:clamp(70px,20vw,150px);line-height:1}
.act-schedule .ft-card .cl{font-family:Jua,sans-serif;font-size:clamp(18px,5vw,28px);text-align:center;line-height:1.2}
.act-schedule .ft-card small{color:var(--soft);font-size:12px}
.act-schedule .ft-card.now{border-color:var(--area);box-shadow:0 0 0 6px color-mix(in srgb,var(--area) 22%,transparent),var(--shadow)}
.act-schedule .ft-card.done .ce,.act-schedule .ft-card.done .cl{opacity:.35}
.act-schedule .ft-arrow{font-size:clamp(28px,8vw,56px);color:var(--soft);flex:none;margin-top:clamp(30px,8vw,44px)}
.act-schedule .ft-ctl{display:flex;justify-content:center;width:100%;margin-bottom:auto}
.act-schedule .ft-ctl .btn{min-width:min(86vw,360px)}
.act-schedule .ed-wrap{width:100%;max-width:720px;display:flex;flex-direction:column;gap:10px}
.act-schedule .ed-h{font-family:Jua,sans-serif;font-size:clamp(20px,5.4vw,24px)}
.act-schedule .ed-h small{font-family:'Gowun Dodum',sans-serif;font-size:13px;color:var(--soft);margin-left:6px}
.act-schedule .ed-list{display:flex;flex-direction:column;gap:6px}
.act-schedule .ed-row{display:flex;align-items:center;gap:6px;background:var(--surface);border-radius:16px;padding:6px 8px;box-shadow:var(--shadow)}
.act-schedule .ed-row .n{width:22px;text-align:center;color:var(--soft);font-family:Jua,sans-serif;flex:none}
.act-schedule .ed-row .e{font-size:30px;line-height:1;flex:none}
.act-schedule .ed-row .w{flex:1;min-width:0;font-family:Jua,sans-serif;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.act-schedule .ed-row button{width:44px;height:44px;border-radius:12px;background:var(--bg);font-size:17px;flex:none}
.act-schedule .ed-row button:disabled{opacity:.3}
.act-schedule .ed-empty{color:var(--soft);text-align:center;padding:14px;border:2px dashed var(--line);border-radius:16px}
.act-schedule .ed-sub{font-weight:700;font-size:14.5px;color:var(--soft);margin-top:4px}
.act-schedule .ed-add{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:6px}
.act-schedule .ed-add button{background:var(--surface);border-radius:14px;padding:6px 2px;box-shadow:var(--shadow);display:flex;flex-direction:column;align-items:center;font-size:12.5px;line-height:1.25;font-weight:700}
.act-schedule .ed-add button span{font-size:28px;line-height:1.2}
.act-schedule .ed-btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:6px 0 10px}

/* ── timer 기다리기 타이머 ── */
.act-timer{--tc:#ff6b5e}
.act-timer .bd{flex:1 0 auto}
.act-timer .tm-wrap{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;width:100%}
.act-timer .tm-col{display:flex;flex-direction:column;align-items:center;gap:4px}
.act-timer .tm-dial{position:relative;width:min(80vw,42vh,440px);width:min(80vw,42dvh,440px);aspect-ratio:1;flex:none}
.act-timer .tm-face{position:absolute;inset:0;border-radius:50%;background:var(--surface);box-shadow:var(--shadow),inset 0 0 0 7px var(--line)}
.act-timer .tm-ticks{position:absolute;inset:0;width:100%;height:100%}
.act-timer .tm-ticks line{stroke:var(--soft);stroke-width:1.6;stroke-linecap:round;opacity:.5}
.act-timer .tm-pie{position:absolute;inset:10%;border-radius:50%;background:var(--tc)}
.act-timer .tm-knob{position:absolute;inset:35%;border-radius:50%;background:var(--surface);
  box-shadow:0 4px 14px rgba(0,0,0,.16);display:flex;align-items:center;justify-content:center;font-size:min(13vw,7vh,72px);line-height:1}
.act-timer .tm-dial.fin .tm-knob{animation:pop .6s;box-shadow:0 0 0 8px color-mix(in srgb,var(--good) 35%,transparent),0 4px 14px rgba(0,0,0,.16)}
.act-timer .tm-left{font-family:Jua,sans-serif;font-size:clamp(26px,7vw,40px);line-height:1.2;font-variant-numeric:tabular-nums}
.act-timer .tm-ctl{display:flex;flex-direction:column;align-items:center;gap:10px;width:min(100%,460px)}
.act-timer .tm-then{display:inline-flex;align-items:center;gap:10px;background:var(--surface);border-radius:18px;padding:6px 16px;box-shadow:var(--shadow);border:3px dashed var(--line);
  font-family:Jua,sans-serif;font-size:clamp(16px,4.4vw,20px);min-height:52px;max-width:100%}
.act-timer .tm-then .te{font-size:30px;line-height:1}
.act-timer .tm-pre{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.act-timer .tm-pre button{min-width:62px;min-height:52px;padding:0 6px;border-radius:16px;background:var(--surface);box-shadow:var(--shadow);font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,21px);border:3px solid transparent}
.act-timer .tm-pre button.on{border-color:var(--tc)}
.act-timer .tm-adj{display:flex;align-items:center;gap:14px}
.act-timer .tm-adj button{width:58px;height:58px;border-radius:50%;background:var(--surface);box-shadow:var(--shadow);font-size:30px;font-weight:700;line-height:1}
.act-timer .tm-adj b{font-family:Jua,sans-serif;font-weight:400;font-size:clamp(24px,6.4vw,32px);min-width:4em;text-align:center}
.act-timer .tm-go{display:flex;gap:10px;width:100%;justify-content:center}
.act-timer .tm-go .btn{flex:1;max-width:240px}
.act-timer .tm-go .tm-start{background:var(--tc)}
.act-timer .bd.running .tm-pre,.act-timer .bd.running .tm-adj,.act-timer .bd.running .tm-then{opacity:.35;pointer-events:none}
@media (orientation:landscape) and (min-width:700px){
  .act-timer .tm-wrap{flex-direction:row;gap:clamp(24px,5vw,56px)}
  .act-timer .tm-dial{width:min(46vw,64vh,480px);width:min(46vw,64dvh,480px)}
}
`);

/* =================================================================
   1. 따라 움직이기 — 동작 모방·운동 계획
   ================================================================= */
var MV_ANIM = { '👏': 'clap', '🥁': 'clap', '🙌': 'up', '🙆': 'up', '🦘': 'jump', '🐸': 'jump', '✈️': 'sway', '🤸': 'sway',
  '🌳': 'still', '🦩': 'still', '🧘': 'still', '🐻': 'walk', '🦆': 'walk', '🐢': 'slow', '🦀': 'side', '🐍': 'side' };
var MV_GO = ['잘한다! 계속!', '좋아, 조금만 더!', '그렇지! 멋져!', '우와, 몸이 척척!', '힘내! 거의 다 왔어!'];
var MV_PRAISE = ['우와, 정말 멋지게 했어!', '짝짝짝! 몸이 척척!', '튼튼 대장이다!', '자비스도 따라 하고 싶어!', '최고야! 힘이 세구나!', '와, 똑같이 했네!'];
var MV_NEXT = ['다음은 이거야! ', '이번엔? ', '자, 다음! ', '이것도 할 수 있지? '];

G.act({
  id: 'move', area: 'body', title: '따라 움직이기', icon: '🤸', order: 10, levels: 3, mins: 3, needs: [],
  ef: ['plan', 'wm', 'attend'],
  desc: '자비스 따라 몸을 움직여요',
  goal: '운동 계획(실행)·동작 모방 — 듣고 본 동작을 순서대로 몸으로 옮기는 힘, 균형과 대근육 조절',
  how: '부모가 먼저 같이 해 보이면 아이가 훨씬 잘 따라 해요. 화면에서 두세 걸음 떨어진 넓은 자리에서 하고, 동작이 서툴러도 해 보려 했다면 👍 를 눌러 주세요. 한 발 서기·게걸음이 어려우면 손을 잡아 주어도 괜찮아요.',
  basis: '운동 계획(praxis)·동작 모방 — 감각통합 치료의 대근육 활동',
  offline: '"곰처럼 엉금엉금 소파까지, 개구리처럼 폴짝 문까지!" 동물 흉내로 집 안을 이동해 보세요.',
  run: async function (ctx) {
    var B = ctx.body, lv = ctx.level, N = 5, C = 2 * Math.PI * 46;
    var pool = D.MOVES.filter(function (m) { return (m.lv || 1) <= lv; });
    var list;
    if (lv === 1) list = G.sample(pool, N);
    else {
      /* 쉬운 동작으로 몸을 풀고, 이 단계의 새 동작을 사이사이에 */
      var top = G.sample(pool.filter(function (m) { return (m.lv || 1) === lv; }), 3), low = G.sample(pool.filter(function (m) { return (m.lv || 1) < lv; }), N - 3);
      list = [low[0], top[0], low[1], top[1], top[2]].filter(Boolean);
    }
    B.innerHTML = '<div class="bd"><div class="mv-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="mv-trk" cx="50" cy="50" r="46"/><circle class="mv-arc" cx="50" cy="50" r="46"/></svg>' +
      '<div class="mv-disc"></div><div class="mv-e a-up">🙋</div><div class="mv-sec">🤸</div></div><div class="bd-cap mv-cap"></div><div class="mv-foot"></div></div>';
    var arc = q('.mv-arc', B), emo = q('.mv-e', B), sec = q('.mv-sec', B), cap = q('.mv-cap', B), foot = q('.mv-foot', B);
    arc.style.strokeDasharray = C.toFixed(1); arc.style.strokeDashoffset = '0';

    function tick() {
      if (calm()) G.sfx.tone(880, 0.05, 'sine', 0.05); else G.sfx.play('tick');
      restartAnim(sec, 'tk');
    }
    /* 남은 시간 고리 — 빙 둘러 줄어든다 (JS 로 그려 예민 모드에서도 보인다) */
    function countdown(s) {
      return new Promise(function (res) {
        var t0 = now(), last = s, half = false;
        sec.textContent = s;
        ctx.loop(function () {
          var el = (now() - t0) / 1000, p = Math.min(1, el / s);
          arc.style.strokeDashoffset = (C * p).toFixed(1);
          var left = Math.ceil(s - el);
          if (left < last && left > 0) { last = left; sec.textContent = left; tick(); }
          if (!half && p >= 0.5 && s >= 6) { half = true; ctx.say(G.pick(MV_GO), { repeat: false }); }
          if (p >= 1) { res(); return false; }
        });
      });
    }

    cap.textContent = '일어나서 같이 움직여요!';
    ctx.progress(0, list.length);
    await ctx.say('일어나서 자비스랑 같이 움직여 볼까? 화면에서 두 걸음 떨어져도 괜찮아!');
    for (var i = 0; i < list.length; i++) {
      ctx.progress(i, list.length);
      var m = list[i], tries = 0, done = false;
      while (!done) {
        var s = m.sec + (tries ? 2 : 0);
        emo.className = 'mv-e a-' + (MV_ANIM[m.e] || 'jump'); emo.textContent = m.e;
        cap.textContent = m.say; sec.textContent = s; arc.style.strokeDashoffset = '0';
        G.sfx.play('whoosh');
        await ctx.say((tries ? '한 번 더! ' : i === 0 ? '' : G.pick(MV_NEXT)) + m.say);
        G.sfx.play('up');
        await countdown(s);
        sec.textContent = '⭐'; G.sfx.play('sparkle');
        ctx.bubble('잘 따라 했으면 👍 를 눌러 주세요');
        var ok = await ctx.parentJudge(foot, ['👍 했어요', '🔁 다시']);
        if (ok) {
          if (!tries) ctx.trial(true);
          await ctx.cheer(G.pick(MV_PRAISE), emo);
          done = true;
        } else if (!tries) {
          ctx.trial(false); tries = 1;
          await ctx.say(G.pick(['괜찮아, 같이 한 번 더 해 보자!', '천천히 다시 해 볼까? 엄마 아빠도 같이!']), { repeat: false });
        } else {
          await ctx.say('괜찮아, 해 보려고 한 게 정말 멋져! 다음 거 해 보자.', { repeat: false });
          done = true;
        }
      }
    }
    ctx.progress(list.length, list.length);
    ctx.finish({ msg: '몸으로 ' + CNT[list.length] + ' 가지나 했어! 튼튼 대장이야!' });
  }
});

/* =================================================================
   2. 멈춰 놀이 — 억제 조절 (얼음 놀이)
   ================================================================= */
var FZ_SONGS = [
  /* 반짝반짝 작은 별 */
  [['C5', .5], ['C5', .5], ['G5', .5], ['G5', .5], ['A5', .5], ['A5', .5], ['G5', 1], ['F5', .5], ['F5', .5], ['E5', .5], ['E5', .5], ['D5', .5], ['D5', .5], ['C5', 1]],
  /* 곰 세 마리 */
  [['C5', .5], ['C5', .5], ['C5', .5], ['C5', .5], ['C5', 1], ['E5', .5], ['G5', .5], ['G5', .5], ['E5', .5], ['C5', 1], ['G5', .5], ['G5', .5], ['E5', .5], ['G5', .5], ['G5', .5], ['E5', .5], ['C5', .5], ['C5', .5], ['C5', 1]],
  /* 신나는 행진 */
  [['G4', .5], ['C5', .5], ['E5', .5], ['C5', .5], ['G4', .5], ['C5', .5], ['E5', 1], ['F5', .5], ['E5', .5], ['D5', .5], ['C5', .5], ['D5', .5], ['E5', .5], ['C5', 1]]
];
var FZ_DANCERS = ['💃', '🕺', '🐧', '🐻', '🐰', '🐥', '🐸', '🦄', '🐼'];

G.act({
  id: 'freeze', area: 'body', title: '멈춰 놀이', icon: '🧊', order: 20, levels: 3, mins: 2, needs: [],
  ef: ['inhibit', 'attend', 'regulate'],
  desc: '음악이 멈추면 꽁꽁 얼음!',
  goal: '억제 조절 — 신나게 움직이다가도 신호에 맞춰 몸을 멈추고, 노래 빠르기에 맞춰 움직임을 조절하는 힘',
  how: '아이와 같이 일어나 춤추다가 "멈춰!" 하면 같이 꽁꽁 얼어 주세요. 아이가 멈췄으면 큰 👍 단추를 눌러 주세요 — 별이 하나씩 모여요. 2단계는 빠른 노래엔 빨리, 느린 노래엔 천천히 춤추고, 3단계는 신호등(초록불 춤·빨간불 멈춤)을 보고 움직여요.',
  basis: '억제 조절 — 얼음 놀이(Tools of the Mind의 Freeze Game)·빨간불 초록불 놀이',
  offline: '노래를 틀고 춤추다가 엄마가 노래를 끄면 "얼음!" 빠른 노래엔 빠르게, 느린 노래엔 천천히 춤춰 보세요.',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level;
    var ROUNDS = [5, 6, 8][lv - 1];
    B.innerHTML = '<div class="bd"><div class="fz-stars"></div><div class="fz-stage">' +
      (lv >= 3 ? '<div class="fz-light" aria-hidden="true"><i class="r"></i><i class="g"></i></div>' : '<div class="fz-hand" aria-hidden="true">✋</div>') +
      '<div class="fz-dancer"></div><div class="fz-word">준비!</div><div class="fz-sub"></div></div>' +
      '<div class="fz-foot"><button class="btn big fz-ok" disabled>👍 멈췄어요!</button><div class="bd-help">아이가 꽁꽁 멈추면 어른이 눌러 주세요</div></div></div>';
    var stage = q('.fz-stage', B), dancer = q('.fz-dancer', B), word = q('.fz-word', B), sub = q('.fz-sub', B),
      stars = q('.fz-stars', B), okBtn = q('.fz-ok', B), lamps = lv >= 3 ? G.$$('.fz-light i', B) : null;
    var round = 0, phase = 'intro', stopTune = null, tapped = false, got = 0, marks = [], noteH = null, lastSpeed = '', run2 = 0;
    var T = {
      fast: { bpm: 150, spd: '.36s', w: '빨리빨리 춤춰요!', e: '🐇', say: ['빨리빨리!', '빠르게 춤춰요!'] },
      slow: { bpm: 76, spd: '1.3s', w: '천천히 춤춰요~', e: '🐢', say: ['천천히~', '느릿느릿 춤춰요~'] },
      mid: { bpm: 116, spd: '.7s', w: '춤춰요!', e: '🎵', say: ['춤춰요!', '신나게 춤춰요!', '흔들흔들!'] }
    };
    dancer.textContent = G.pick(FZ_DANCERS);
    sub.textContent = lv >= 3 ? '🟢 초록불 춤춰 · 🔴 빨간불 멈춰' : lv === 2 ? '🐇 빠른 노래 · 🐢 느린 노래 · ✋ 멈춰' : '🎵 음악이 나오면 춤 · ✋ 멈추면 꽁꽁';

    function setLight(c) { if (!lamps) return; lamps[0].classList.toggle('on', c === 'r'); lamps[1].classList.toggle('on', c === 'g'); }
    function pickSpeed() {
      if (lv === 1 || round === 0) return 'mid';
      var s; do { s = G.pick(['fast', 'slow', 'mid']); } while (s === lastSpeed && run2 >= 1);
      run2 = s === lastSpeed ? run2 + 1 : 0; lastSpeed = s;
      return s;
    }
    function notes() {
      clearInterval(noteH); if (calm()) return;
      noteH = ctx.interval(function () {
        if (phase !== 'dance') return;
        var n = G.el('<span class="fz-note">' + G.pick(['🎵', '🎶', '✨']) + '</span>');
        n.style.left = rnd(6, 88) + '%'; n.style.setProperty('--dx', Math.round(rnd(-40, 40)) + 'px');
        stage.appendChild(n); setTimeout(function () { n.remove(); }, 2300);
      }, 650);
    }
    function dance() {
      if (!ctx.alive) return;
      phase = 'dance'; tapped = false;
      okBtn.disabled = true; okBtn.classList.remove('got'); okBtn.textContent = '🎵 춤추는 중…';
      stage.classList.remove('stop');
      var d; do { d = G.pick(FZ_DANCERS); } while (d === dancer.textContent);
      dancer.textContent = d;
      var sp = pickSpeed(), t = T[sp];
      dancer.style.setProperty('--spd', t.spd);
      if (lv >= 3) { setLight('g'); word.textContent = '초록불!'; sub.textContent = t.e + ' ' + t.w; ctx.say('초록불! ' + (sp === 'mid' ? '' : t.say[0]), { repeat: false }); }
      else { word.textContent = t.w; sub.textContent = sp === 'mid' ? '🎵 신나게 흔들흔들' : t.e + ' ' + (sp === 'fast' ? '빠른 노래' : '느린 노래'); ctx.say(G.pick(t.say), { repeat: false }); }
      stopTune = tune(ctx, G.pick(FZ_SONGS), t.bpm * (calm() ? 0.85 : 1), { bass: true, vol: 0.15 });
      notes();
      var dur = lv === 1 ? 7000 : lv === 2 ? rnd(4000, 7000) : rnd(2500, 5500);
      ctx.timeout(freeze, pace(dur));
    }
    function freeze() {
      if (!ctx.alive) return;
      phase = 'stop'; if (stopTune) { stopTune(); stopTune = null; }
      stage.classList.add('stop');
      G.sfx.tone(G.sfx.N.E5, 0.3, 'sine', 0.22); G.buzz(40);
      if (lv >= 3) { setLight('r'); word.textContent = '빨간불!'; sub.textContent = '🧊 꽁꽁 멈춰요'; ctx.say('빨간불!', { repeat: false }); }
      else { word.textContent = '멈춰!'; sub.textContent = '🧊 꽁꽁 얼음~'; ctx.say(G.pick(['멈춰!', '얼음!', '멈춰! 꽁꽁!']), { repeat: false }); }
      okBtn.disabled = false; okBtn.textContent = '👍 멈췄어요!';
      var dur = lv === 1 ? 4000 : lv === 2 ? rnd(3000, 4000) : rnd(2500, 3500);
      ctx.timeout(function () {
        marks.push(tapped);
        round++; ctx.progress(round, ROUNDS);
        if (round >= ROUNDS) end(); else dance();
      }, pace(dur));
    }
    okBtn.addEventListener('click', function () {
      if (phase !== 'stop' || tapped) return;
      tapped = true; got++;
      okBtn.classList.add('got'); okBtn.textContent = '⭐ 꽁꽁! 잘 멈췄어!';
      G.sfx.play('sparkle'); G.buzz(15);
      stars.textContent = '⭐'.repeat(got);
      var c = G.fx.center(dancer);
      floatText(stage, G.pick(['❄️ 꽁꽁!', '🧊 얼음 성공!', '✋ 딱 멈췄다!']), c[0], c[1] - 50);
      sparks(stage, c[0], c[1], 6, 18);
      ctx.say(G.pick(['꽁꽁! 잘 멈췄어!', '와, 딱 멈췄다!', '얼음 대장이야!', '움직이고 싶은데 꾹 참았네!']), { repeat: false });
    });
    function end() {
      phase = 'end'; if (stopTune) stopTune();
      /* 부모가 한 번도 안 눌렀으면(같이 춤추느라 못 봤을 수 있다) 기록하지 않는다 */
      if (got > 0) marks.forEach(function (m) { ctx.trial(m); });
      ctx.extra.froze = got; ctx.extra.stops = ROUNDS;
      ctx.finish({ msg: got ? '별을 ' + got + '개나 모았어! 멈춰! 할 때 꽁꽁, 참는 힘이 쑥쑥!' : '신나게 춤추고 꽁꽁 멈췄어! 정말 멋져!' });
    }

    ctx.progress(0, ROUNDS);
    var intro = lv === 1 ? '음악이 나오면 신나게 춤추고, 멈춰! 하면 꽁꽁 얼음처럼 멈춰요.' :
      lv === 2 ? '빠른 노래엔 빨리빨리, 느린 노래엔 천천히 춤춰요. 멈춰! 하면 꽁꽁 얼음!' :
        '신호등 놀이! 초록불이면 춤추고, 빨간불이면 꽁꽁 멈춰요. 잘 보고 해요!';
    ctx.say(intro).then(function () { return ctx.say('준비, 시작!', { repeat: false }); }).then(dance);
  }
});

/* =================================================================
   3. 흔들흔들 마라카스 — 리듬 따라 하기
   ================================================================= */
var MARACA = '<svg viewBox="0 0 120 220" aria-hidden="true">' +
  '<rect x="52" y="118" width="16" height="96" rx="8" fill="#a1887f"/><rect x="49" y="114" width="22" height="16" rx="6" fill="#8d6e63"/>' +
  '<ellipse cx="60" cy="66" rx="50" ry="60" fill="#ff7f61"/>' +
  '<path d="M12 56 Q60 78 108 56 L108 76 Q60 98 12 76 Z" fill="#ffd54f"/>' +
  '<polyline points="16,68 26,61 36,70 46,63 56,72 66,64 76,72 86,63 96,70 104,62" fill="none" stroke="#4fc3a1" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>' +
  '<circle cx="40" cy="34" r="5" fill="#fff" opacity=".85"/><circle cx="62" cy="24" r="5" fill="#64b5f6"/><circle cx="82" cy="36" r="5" fill="#fff" opacity=".85"/>' +
  '<circle cx="44" cy="102" r="5" fill="#b388ff"/><circle cx="76" cy="102" r="5" fill="#64b5f6"/>' +
  '<ellipse cx="38" cy="42" rx="10" ry="16" fill="#fff" opacity=".28"/></svg>';
var SK_SONG = [['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1], ['F5', 1], ['A5', 1], ['G5', 2], ['E5', 1], ['G5', 1], ['C6', 1], ['G5', 1], ['F5', 1], ['D5', 1], ['C5', 2]];

G.act({
  id: 'shake', area: 'body', title: '흔들흔들 마라카스', icon: '🎵', order: 30, levels: 3, mins: 2, needs: ['motion'],
  ef: ['attend', 'wm', 'inhibit'],
  desc: '흔들면 찰찰 소리가 나요',
  goal: '리듬 따라 하기 — 소리 수를 듣고 기억해 똑같이 흔드는 청각 작업기억·타이밍, 팔 흔들기로 전정·고유수용 감각 깨우기',
  how: '기기를 아이 손에 쥐여 주고 떨어뜨리지 않게 부모 손을 살짝 받쳐 주세요. 흔들어도 소리가 안 나는 기기는 화면의 마라카스를 톡톡 누르면 돼요. 2·3단계는 자비스가 흔든 만큼 똑같이 — 부모가 "하나, 둘" 같이 세어 주면 좋아요. 자비스 차례에는 "쉿, 들어 보자" 하고 기다리게 해 주세요.',
  basis: '리듬 모방 — 청각 작업기억·타이밍, 전정·고유수용 감각 자극(감각통합)',
  offline: '쌀을 넣은 페트병 마라카스로 엄마가 "찰찰찰" 세 번 흔들면 아이가 똑같이 따라 흔들기.',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level;
    B.innerHTML = '<div class="bd"><div class="sk-top"></div><div class="sk-turn"></div>' +
      '<div class="sk-stage"><button class="sk-mar" type="button" aria-label="마라카스">' + MARACA + '</button></div>' +
      '<div class="bd-chip sk-tip" hidden>👆 마라카스를 톡톡 눌러도 돼요</div>' +
      '<div class="bd-start"><button class="btn big sk-go">🎵 흔들 준비!</button><small>기기를 손에 꼭 쥐고 흔들어요.<br>흔들어도 소리가 안 나면 마라카스를 눌러요.</small></div></div>';
    var top = q('.sk-top', B), turn = q('.sk-turn', B), stage = q('.sk-stage', B), mar = q('.sk-mar', B), tip = q('.sk-tip', B), startBox = q('.bd-start', B);
    var lastHit = 0, gotMotion = false, listen = false, onHit = null, TH = 7;   /* m/s² — 살짝 흔들어도 된다 */

    function hit(s, src) {
      var t = now(); if (t - lastHit < (src === 'tap' ? 140 : 280)) return;   /* 한 번 흔들기(왔다 갔다)를 한 번으로 */
      lastHit = t;
      if (!listen) return;   /* 자비스 차례에는 소리 내지 않고 듣는다 */
      G.sfx.noise(0.08 + s * 0.07, (0.14 + s * 0.2) * (calm() ? 0.7 : 1), 3200 + Math.random() * 1800);
      G.buzz(8);
      restartAnim(mar, 'hit');
      var r = mar.getBoundingClientRect(); sparks(stage, r.left + r.width / 2, r.top + r.height * 0.3, 6, 22);
      if (onHit) onHit();
    }
    function onMotion(e) {
      var a = e.acceleration, m = null;
      if (a && a.x != null) m = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      else { var g = e.accelerationIncludingGravity; if (g && g.x != null) m = Math.abs(Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z) - 9.81); }
      if (m == null) return;
      gotMotion = true;
      if (m > TH) hit(G.clamp((m - TH) / 20 + 0.3, 0, 1), 'motion');
    }
    mar.addEventListener('pointerdown', function (e) { e.preventDefault(); hit(0.7, 'tap'); });

    q('.sk-go', B).addEventListener('click', function () {
      /* 아이폰은 단추를 누른 그 순간에 움직임 센서 허락을 받아야 한다 */
      var DM = window.DeviceMotionEvent, ask = Promise.resolve('granted');
      if (DM && typeof DM.requestPermission === 'function') { try { ask = DM.requestPermission(); } catch (er) { ask = Promise.resolve('denied'); } }
      startBox.remove(); G.sfx.play('pop');
      Promise.resolve(ask).catch(function () { return 'denied'; }).then(function (st) {
        if (!ctx.alive) return;
        /* 허락 답과 상관없이 듣는다 — 값이 안 오면(거절·센서 없음) 1.5초 뒤 '누르기' 안내가 뜬다 */
        if ('DeviceMotionEvent' in window) ctx.on(window, 'devicemotion', onMotion);
        ctx.extra.motion = st === 'granted' ? 1 : 0;
        ctx.timeout(function () { if (!gotMotion) tip.hidden = false; }, 1500);
        if (lv === 1) freePlay(); else rhythm();
      });
    });
    ctx.say(lv === 1 ? '마라카스 놀이! 흔들흔들 하면 찰찰 소리가 나. 준비 단추를 눌러 줘.' : '마라카스 리듬 놀이! 자비스가 흔드는 만큼 똑같이 흔들어 봐. 준비 단추를 눌러 줘.');

    /* ---- 1단계: 노래에 맞춰 마음껏 흔들기 ---- */
    function freePlay() {
      var GOAL = calm() ? 18 : 24, n = 0, said1 = false, said2 = false, idleH = null, fin = false;
      top.innerHTML = '<div class="sk-bar"><b></b></div>';
      var bar = q('b', top);
      turn.textContent = '🎵 흔들흔들! 찰찰찰!';
      listen = true;
      var stopSong = calm() ? null : tune(ctx, SK_SONG, 104, { vol: 0.08 });
      ctx.progress(0, 3);
      ctx.say(G.callName() + ', 마라카스를 흔들흔들! 신나게 흔들어 봐!');
      function idle() {
        clearTimeout(idleH);
        idleH = ctx.timeout(function () {
          ctx.say(G.pick(['흔들흔들! 마라카스를 흔들어 볼까?', '찰찰찰! 자비스랑 같이 흔들자!']), { repeat: false });
          if (!gotMotion) G.ui.hint(mar);
          idle();
        }, 9000);
      }
      idle();
      onHit = function () {
        n++; idle();
        bar.style.width = Math.min(100, n / GOAL * 100) + '%';
        ctx.progress(Math.min(3, Math.floor(n / GOAL * 3)), 3);
        if (!said1 && n >= GOAL / 3) { said1 = true; ctx.say(G.pick(['우와, 소리가 신난다!', '찰찰찰! 멋진 소리야!']), { repeat: false }); }
        else if (!said2 && n >= GOAL * 2 / 3) { said2 = true; ctx.say('조금만 더 흔들흔들!', { repeat: false }); }
        if (n >= GOAL) done();
      };
      ctx.timeout(done, 45000);
      function done() {
        if (fin) return; fin = true;
        onHit = null; listen = false; clearTimeout(idleH); if (stopSong) stopSong();
        ctx.extra.shakes = n; ctx.progress(3, 3);
        ctx.finish({ msg: n >= GOAL ? '마라카스 연주 끝! 정말 신나는 소리였어!' : '흔들흔들 정말 잘했어! 멋진 연주였어!' });
      }
    }

    /* ---- 2·3단계: 자비스 리듬 따라 하기 ---- */
    function rhythm() {
      var plan = lv === 2 ? [2].concat(G.shuffle([2, 3, 3, 3])) : [2].concat(G.shuffle([3, 3, 4, 4, 2]));
      var R = plan.length;
      top.innerHTML = '<div class="sk-dots"></div>';
      var dots = q('.sk-dots', top);
      function drawDots(n) { dots.innerHTML = G.range(n).map(function () { return '<i></i>'; }).join(''); }
      function model(N, counting) {
        return new Promise(function (res) {
          listen = false; dots.classList.remove('hide'); drawDots(N);
          turn.textContent = '👂 쉿, 자비스 차례 — 잘 들어 봐!';
          var k = 0, gap = counting ? pace(950) : pace(640);
          function beat() {
            if (k >= N) { ctx.timeout(res, 450); return; }
            k++;
            G.sfx.noise(0.13, calm() ? 0.18 : 0.3, 3800);
            restartAnim(mar, 'hit');
            dots.children[k - 1].classList.add('jv');
            if (counting) ctx.say(NUM[k], { repeat: false, rate: 1 });
            ctx.timeout(beat, gap);
          }
          ctx.timeout(beat, 350);
        });
      }
      function childTurn(N) {
        return new Promise(function (res) {
          var c = 0, quietH = null, startH = null, ended = false, prompted = false;
          drawDots(N); dots.classList.toggle('hide', lv >= 3);   /* 3단계는 몇 번이었는지 머리로 기억 */
          turn.textContent = '🙌 이제 네 차례!';
          listen = true;
          function end(v) { if (ended) return; ended = true; listen = false; onHit = null; clearTimeout(quietH); clearTimeout(startH); res(v); }
          function waitStart() {
            startH = ctx.timeout(function () {
              if (!prompted) { prompted = true; ctx.say('흔들흔들! 네 차례야.', { repeat: false }); if (!gotMotion) G.ui.hint(mar); waitStart(); }
              else end(null);
            }, 7000);
          }
          waitStart();
          onHit = function () {
            c++; clearTimeout(startH);
            var d = dots.children[c - 1]; if (d) d.classList.add('on');
            clearTimeout(quietH);
            quietH = ctx.timeout(function () { end(c); }, c >= N ? 900 : 1700);
          };
        });
      }
      async function play() {
        ctx.progress(0, R);
        turn.textContent = '🎵 먼저 마음껏 흔들어 봐!';
        listen = true;
        await new Promise(function (res) {
          var w = 0, fin = false;
          function go() { if (fin) return; fin = true; onHit = null; res(); }
          onHit = function () { w++; if (w >= 6) ctx.timeout(go, 500); };
          ctx.say('먼저 마라카스를 마음껏 흔들어 봐!').then(function () { ctx.timeout(go, 6000); });
        });
        listen = false;
        for (var r = 0; r < R; r++) {
          ctx.progress(r, R);
          var N = plan[r], tries = 0, fin = false;
          while (!fin) {
            await ctx.say(r === 0 && !tries ? '이제 자비스 차례! 자비스가 흔드는 만큼 똑같이 흔들어 줘. 잘 들어 봐!' :
              tries ? '같이 다시 들어 보자. 하나씩 세어 볼게!' : G.pick(['잘 들어 봐!', '이번엔 몇 번일까?', '귀를 쫑긋!', '쉿, 들어 봐!']));
            await model(N, tries > 0);
            ctx.say('이제 네 차례!', { repeat: false });
            var c = await childTurn(N);
            if (c === null) {   /* 흔들지 않았다 — 기록 없이 넘어간다 */
              await ctx.say('괜찮아, 다음 리듬도 들어 볼까?', { repeat: false });
              fin = true;
            } else if (c === N) {
              if (!tries) ctx.trial(true);
              G.$$('i', dots).forEach(function (d) { d.classList.add('on'); });
              await ctx.cheer(G.pick(['똑같이 ' + CNT[N] + ' 번! 딩동댕!', '와, 리듬이 똑같아!', '귀가 정말 밝구나! ' + CNT[N] + ' 번!', '척척! 똑같이 흔들었어!']));
              fin = true;
            } else if (!tries) {
              ctx.trial(false); tries = 1;
              dots.classList.remove('hide');
              await ctx.say('음~ 자비스는 ' + CNT[N] + ' 번 흔들었어.', { repeat: false });
            } else {
              await ctx.say('좋아! ' + CNT[N] + ' 번이었어. 다음 리듬!', { repeat: false });
              fin = true;
            }
          }
        }
        ctx.progress(R, R);
        ctx.finish({ msg: '자비스 리듬을 척척 따라 했어! 귀가 정말 밝구나!' });
      }
      play();
    }
  }
});

/* =================================================================
   4. 숨쉬기 — 느린 복식 호흡
   ================================================================= */
var BR_FLOWERS = ['🌸', '🌷', '🌼', '🌻', '🌺'];
var BR_IN = ['꽃 냄새 맡아요. 흡~', '코로 천천히, 흡~', '배가 볼록, 흡~', '한 번 더, 흡~', '마지막이야. 흡~'];
var BR_OUT = ['촛불 불어요. 후~', '입으로 길게, 후~', '배가 쏙, 후~', '천천히, 후~', '후~ 길게~'];

G.act({
  id: 'breathe', area: 'calm', title: '숨쉬기', icon: '🌸', order: 10, levels: 3, mins: 1, needs: [],
  ef: ['regulate', 'attend'],
  desc: '꽃 냄새 흡~ 촛불 후~',
  goal: '자기조절 — 천천히 들이쉬고 길게 내쉬며 몸과 마음을 스스로 가라앉히는 방법 익히기',
  how: '아이 옆에 앉아 같이 숨을 쉬어 주세요. 한 손을 아이 배에 살짝 대고 "배가 볼록, 쏙" 하고 말해 주면 배로 쉬는 느낌을 알아요. 화가 나거나 울음이 날 때 쓰려면 기분 좋을 때 자주 연습해 두는 것이 좋아요.',
  basis: '느린 복식 호흡(꽃 냄새·촛불 비유) — 내쉬는 숨을 길게 하면 몸이 가라앉는다(감정 조절 교육의 기본 전략)',
  offline: '잠자기 전 누워서 배 위에 인형을 올리고, 숨 쉴 때 인형이 올라갔다 내려가는 것을 같이 보기.',
  run: async function (ctx) {
    var B = ctx.body, lv = ctx.level, N = 5;
    var IN = [3000, 4000, 4000][lv - 1], OUT = [3000, 5000, 6000][lv - 1];
    B.innerHTML = '<div class="bd"><div class="br-scene"><div class="br-ball"><span class="br-e">🌸</span></div></div>' +
      '<div class="br-word">🌿</div><div class="br-sub">자비스랑 같이 숨 쉬어요</div><div class="br-secs"></div></div>';
    var scene = q('.br-scene', B), ball = q('.br-ball', B), emo = q('.br-e', B), word = q('.br-word', B), sub = q('.br-sub', B), secs = q('.br-secs', B);
    var LOW = 0.56, scale = LOW;
    function setScale(s) { scale = s; ball.style.transform = 'scale(' + s.toFixed(3) + ')'; }
    setScale(0.72);
    function inSound(ms) {
      var n = G.sfx.N, v = calm() ? 0.05 : 0.08;
      [n.C5, n.E5, n.G5].forEach(function (f, i) { G.sfx.tone(f, 1.4, 'sine', v, i * ms / 3000); });
    }
    function outSound(ms) {
      G.sfx.noise(ms / 1000 * 0.8, calm() ? 0.025 : 0.045, 500);
      var n = G.sfx.N, v = calm() ? 0.04 : 0.06;
      [n.G4, n.E4, n.C4].forEach(function (f, i) { G.sfx.tone(f, 1.6, 'sine', v, i * ms / 3000); });
    }
    function petals() {
      if (calm()) return;
      for (var k = 0; k < 6; k++) {
        var p = G.el('<span class="br-petal">' + G.pick(['🌸', '✨', '🍃']) + '</span>'), a = Math.random() * Math.PI * 2, d = rnd(120, 220);
        p.style.setProperty('--dx', Math.round(Math.cos(a) * d) + 'px'); p.style.setProperty('--dy', Math.round(Math.sin(a) * d) + 'px');
        p.style.animationDelay = (k * 0.25) + 's';
        scene.appendChild(p); setTimeout(function (el) { el.remove(); }.bind(null, p), 4500);
      }
    }
    /* 한 숨 — 공이 커지거나 작아진다. JS 로 그려 예민 모드에서도 부드럽다 */
    function phase(kind, ms, k) {
      return new Promise(function (res) {
        var from = scale, to = kind === 'in' ? 1 : LOW, t0 = now(), n = Math.max(1, Math.round(ms / 1000));
        secs.innerHTML = G.range(n).map(function () { return '<i></i>'; }).join('');
        var dots = G.$$('i', secs);
        if (kind === 'in') { emo.textContent = BR_FLOWERS[k % BR_FLOWERS.length]; word.textContent = '흡~'; sub.textContent = '코로 꽃 냄새를 맡아요'; inSound(ms); }
        else { emo.innerHTML = '<span class="br-cand">🕯️</span>'; word.textContent = '후~'; sub.textContent = '입으로 촛불을 불어요'; outSound(ms); petals(); }
        ctx.loop(function () {
          var el = now() - t0, p = Math.min(1, el / ms);
          setScale(from + (to - from) * ease(p));
          var lit = Math.min(n, Math.floor(el / 1000) + 1);
          dots.forEach(function (d, j) { d.classList.toggle('on', j < lit); });
          if (p >= 1) { res(); return false; }
        });
      });
    }

    ctx.progress(0, N);
    await ctx.say('자비스랑 숨쉬기 놀이 하자. 꽃이 커지면 코로 흡~ 꽃 냄새를 맡고, 작아지면 입으로 후~ 촛불을 불어요.');
    await ctx.wait(400);
    for (var k = 0; k < N; k++) {
      ctx.progress(k, N);
      ctx.say(BR_IN[k], { repeat: false, rate: 0.85 });
      await phase('in', IN, k);
      ctx.say(BR_OUT[k], { repeat: false, rate: 0.85 });
      await phase('out', OUT, k);
      await ctx.wait(500);
    }
    ctx.progress(N, N);
    secs.innerHTML = ''; emo.textContent = '🌸'; word.textContent = '😌'; sub.textContent = '몸이 말랑말랑해졌어요';
    G.sfx.play('sparkle');
    await ctx.say('잘했어. 몸이 말랑말랑, 마음이 편안해졌어.', { repeat: false, rate: 0.85 });
    ctx.finish({ msg: '숨을 다섯 번이나 천천히 쉬었어. 마음이 편안해졌지?' });
  }
});

/* =================================================================
   5. 촛불 끄기 — 호흡 조절·입술 근육
   ================================================================= */
var HAPPY_BIRTHDAY = [['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2], ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2]];

G.act({
  id: 'blow', area: 'calm', title: '촛불 끄기', icon: '🕯️', order: 20, levels: 3, mins: 2, needs: ['mic'],
  ef: ['regulate', 'inhibit'],
  desc: '후~ 불어서 촛불을 꺼요',
  goal: '호흡 조절·입술 근육 — 입을 동그랗게 모아 길고 세게 내쉬는 힘(말소리의 바탕), 숨으로 몸 가라앉히기',
  how: '부모가 먼저 "후~" 하고 입 모양을 크게 보여 주세요. 기기 마이크(보통 아래쪽)에서 한 뼘쯤 떨어져 불면 잘 돼요 — 목소리("아~")보다 바람 소리에 반응해요. 마이크를 쓸 수 없으면 아이가 후~ 불면서 촛불을 누르고, 다 끈 뒤 부모가 👍 로 알려 주면 돼요.',
  basis: '호흡 조절·입술 오므리기 — 언어치료 불기 활동(구강 운동), 바람을 눈으로 보여 주는 바이오피드백',
  offline: '빨대로 탁구공이나 휴지 조각 불어 굴리기, 비눗방울 천천히 불기, 생일 초 불기 연습.',
  run: async function (ctx) {
    var B = ctx.body, lv = ctx.level;
    var PER = [1, 3, 5][lv - 1], ROUNDS = [3, 2, 2][lv - 1], TOTAL = PER * ROUNDS;
    function prog(outN) { if (TOTAL > 6) ctx.progress(outN, PER); else ctx.progress(round * PER + outN, TOTAL); }   /* 점이 너무 많으면 제목이 가려져 이번 판 촛불만 */
    var TH = [0.08, 0.11, 0.14][lv - 1];     /* 이보다 센 바람부터 불꽃이 줄어든다 */
    var NEED = [0.55, 0.7, 0.8][lv - 1];     /* 촛불 하나 끄는 데 드는 바람 양 */
    var CFG = [
      { cw: 'clamp(52px,14vw,78px)', ch: 'clamp(140px,26vh,230px)', gap: '0px' },
      { cw: 'clamp(38px,10vw,56px)', ch: 'clamp(110px,20vh,180px)', gap: 'clamp(24px,7vw,46px)', kw: 'clamp(260px,74vw,420px)', kh: 'clamp(90px,14vh,130px)' },
      { cw: 'clamp(30px,8vw,46px)', ch: 'clamp(90px,16vh,150px)', gap: 'clamp(16px,4.6vw,30px)', kw: 'clamp(300px,86vw,480px)', kh: 'clamp(100px,16vh,150px)' }
    ][lv - 1];
    B.innerHTML = '<div class="bd"><div class="bl-meter"><span>🌬️</span><div><b></b></div></div><div class="bl-scene"></div><div class="bl-foot"></div></div>';
    var scene = q('.bl-scene', B), meter = q('.bl-meter', B), meterB = q('.bl-meter b', B), foot = q('.bl-foot', B);
    ['cw', 'ch', 'gap', 'kw', 'kh'].forEach(function (k) { if (CFG[k]) scene.style.setProperty('--' + k, CFG[k]); });
    var mic = null, mode = 'mic', cands = [], round = 0, wind = 0, active = false, helped = false, helpShown = false, hinted = false,
      lastProgress = now(), tapSaid = false, tries = 0;

    function build() {
      scene.innerHTML = '';
      var row = G.el('<div class="bl-candles"></div>');
      cands = G.range(PER).map(function (k) {
        var el = G.el('<button class="bl-cnd" type="button" aria-label="촛불"><span class="bl-flame"><i></i></span></button>');
        el.style.setProperty('--c1', SPARK[(k + round * 2) % SPARK.length]);
        if (PER > 1 && k % 2) el.style.height = 'calc(var(--ch) * .86)';
        row.appendChild(el);
        var c = { el: el, fl: q('.bl-flame', el), hp: 1, out: false };
        el.addEventListener('click', function () { tapCandle(c); });
        return c;
      });
      scene.appendChild(row);
      scene.appendChild(G.el(lv === 1 ? '<div class="bl-holder"></div>' : '<div class="bl-cake"></div>'));
    }
    function lit() { return cands.filter(function (c) { return !c.out; }); }
    function blowOut(c) {
      if (c.out) return;
      c.out = true; c.el.classList.add('out');
      var smoke = G.el('<span class="bl-smoke">💨</span>'); c.el.appendChild(smoke); setTimeout(function () { smoke.remove(); }, 1700);
      var outN = PER - lit().length;
      /* 마이크 놀이 중에는 바람 같은 소리(잡음)를 내지 않는다 — 다음 촛불을 스스로 꺼 버리지 않게 */
      if (mode === 'tap') G.sfx.play('whoosh');
      G.sfx.tone(G.sfx.N.E5 * Math.pow(1.12, outN), 0.28, 'triangle', 0.2);
      G.buzz(15);
      var r = c.el.getBoundingClientRect(); sparks(scene, r.left + r.width / 2, r.top, 6, 16);
      prog(outN);
      lastProgress = now();
      if (!lit().length) roundDone();
    }
    function tapCandle(c) {
      if (c.out) return;
      if (mode === 'tap') { if (active) blowOut(c); else G.ui.wiggle(c.el); return; }
      G.ui.wiggle(c.el);
      if (!tapSaid) { tapSaid = true; ctx.say('이번엔 후~ 바람으로 꺼 보자!', { repeat: false }); }
    }
    function hint() {
      var t = lit()[0]; if (t) G.ui.hint(t.el);
      ctx.say(G.pick(['입을 동그랗게 모으고, 후~ 불어 봐!', '촛불한테 후~ 바람을 보내 볼까?', '숨을 크게 쉬고, 후~!']), { repeat: false });
    }
    function showHelp() {
      helpShown = true;
      var b = G.el('<button class="btn soft bl-help">👆 어른이 도와주기</button>');
      b.onclick = function () { var t = lit()[0]; if (!t || !active) return; helped = true; G.sfx.play('tap'); blowOut(t); };
      foot.innerHTML = ''; foot.appendChild(b);
      foot.appendChild(G.el('<div class="bd-help">아이가 후~ 불 때 같이 눌러 주세요</div>'));
    }

    /* 바람 듣기: 소리 크기 × 바람다움(스펙트럼 평탄도). 목소리는 평탄도가 낮아 거의 안 센다.
       (흉내 신호로 재 보니 목소리 0.2~0.4, 후~ 바람 0.6~1.0) */
    function micLoop() {
      ctx.loop(function (dt) {
        var lvl = mic.level(), fl = mic.flat();
        var raw = lvl * G.clamp((fl - 0.45) / 0.3, 0, 1);
        raw = Math.max(raw, lvl * 0.1);               /* 목소리만으로는 불꽃이 살짝 흔들릴 정도 */
        if (G.voice.speaking) raw = 0;                /* 자비스 말소리는 세지 않는다 */
        wind = wind * 0.75 + raw * 0.25;
        meterB.style.width = Math.round(G.clamp(wind / 0.55, 0, 1) * 100) + '%';
        var tgt = lit()[0];
        cands.forEach(function (c) {
          if (c.out) return;
          var lean = G.clamp(wind * 90, 0, 38) * (c === tgt ? 1 : 0.5);
          c.fl.style.setProperty('--lean', (-lean).toFixed(1) + 'deg');
          c.fl.style.setProperty('--sz', (0.4 + 0.6 * c.hp).toFixed(2));
        });
        if (!active || !tgt) return;
        if (wind > TH) { tgt.hp -= dt * (wind - TH) * 4 / NEED; if (tgt.hp <= 0) blowOut(tgt); }
        else tgt.hp = Math.min(1, tgt.hp + dt * 0.25);
        var idle = now() - lastProgress;
        if (idle > 6000 && !hinted) { hinted = true; hint(); }
        if (idle > 12000 && !helpShown) showHelp();
      });
    }

    async function startRound(again) {
      active = false; helped = false; hinted = false; helpShown = false; foot.innerHTML = '';
      build(); G.sfx.play('sparkle'); prog(0);
      var line = again ? '괜찮아, 입을 동그랗게 하고 후~ 다시 해 보자!' :
        round === 0 ? (lv === 3 ? '생일 케이크다! 촛불 다섯 개를 후~ 불어서 꺼 볼까?' : lv === 2 ? '촛불이 세 개! 후~ 불어서 꺼 볼까?' : '촛불에 후~ 바람을 불어 봐!') :
          G.pick(['짠! 다시 불을 켰어. 후~ 불어 봐!', '촛불이 또 켜졌어! 후~', '한 번 더! 후~ 바람을 보내 줘.']);
      if (mode === 'tap' && round === 0 && !again) line += ' 후~ 불면서 촛불을 톡 눌러 봐!';
      await ctx.say(line);
      active = true; lastProgress = now();
    }
    async function roundDone() {
      active = false; foot.innerHTML = '';
      if (mode === 'mic') ctx.trial(!helped);
      else {
        ctx.bubble('아이가 입으로 후~ 불었나요?');
        var ok = await ctx.parentJudge(foot, ['👍 후~ 불었어요', '🔁 한 번 더']);
        if (!ok && !tries) { ctx.trial(false); tries = 1; startRound(true); return; }
        if (!tries) ctx.trial(true);
        if (!ok) { await ctx.say('괜찮아! 다음 촛불도 같이 해 보자.', { repeat: false }); tries = 0; next(); return; }
        tries = 0;
      }
      var stopSong = lv === 3 ? tune(ctx, HAPPY_BIRTHDAY, 120, { once: true, vol: calm() ? 0.08 : 0.12 }) : null;
      await ctx.cheer(lv === 3 ? '후~ 촛불을 다 껐다! 생일 축하해!' : PER > 1 ? '촛불을 다 껐어! 바람이 정말 세다!' : G.pick(['후~ 꺼졌다! 최고야!', '와, 촛불이 꺼졌어! 바람 대장!', '후~ 정말 잘 불었어!']));
      if (stopSong) await ctx.wait(2500);
      next();
    }
    function next() {
      round++;
      if (round >= ROUNDS) {
        ctx.extra.mic = mode === 'mic' ? 1 : 0;
        ctx.finish({ msg: lv === 3 ? '생일 케이크 촛불을 모두 껐어! 바람 대장, 생일 축하해!' : '촛불을 ' + TOTAL + '개나 껐어! 후~ 바람이 정말 멋져!' });
      } else startRound();
    }

    prog(0);
    build();
    await ctx.say(lv === 3 ? '오늘은 생일 파티! 자비스가 케이크를 준비했어.' : '촛불 끄기 놀이 하자!');
    try { mic = await ctx.mic(); } catch (e) { mic = null; }
    if (mic) {
      mode = 'mic';
      /* 처음 0.6초는 방 소리를 잰다 — 그동안 자비스도 조용히 */
      micLoop();
      foot.innerHTML = '<div class="bd-chip">🎤 귀 기울이는 중…</div>';
      await ctx.wait(900);
      foot.innerHTML = '';
    } else {
      mode = 'tap'; meter.classList.add('off');
      ctx.bubble('마이크를 쓸 수 없어요 — 아이가 후~ 불며 촛불을 누르게 해 주세요');
      cands.forEach(function (c) { c.fl.style.setProperty('--sz', '1'); });
      await ctx.wait(1600);
    }
    startRound();
  }
});

/* =================================================================
   6. 물방울 놀이 — 감각 진정 (맞고 틀림 없음)
   ================================================================= */
var PENTA = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5];   /* 도레미솔라 — 어떻게 눌러도 어울린다 */
var BB_LINES = ['천천히, 살살~ 예쁜 소리가 나.', '숨도 천천히 쉬어 볼까? 흡~ 후~', '물방울이 둥실둥실 올라가.', '반짝반짝, 마음이 편안해져.'];

G.act({
  id: 'bubbles', area: 'calm', title: '물방울 놀이', icon: '💧', order: 30, levels: 1, mins: 2, needs: [],
  ef: ['regulate'],
  desc: '톡 누르면 물방울이 동글동글',
  goal: '감각 진정·자기조절 — 부드러운 빛과 소리를 천천히 만지며 흥분된 몸과 마음을 가라앉히기',
  how: '불을 조금 어둡게 하고 아이 옆에서 조용히 함께 보세요. 빨리 두드리기보다 손가락으로 천천히 쓸어 보게 이끌어 주세요("살살~"). 맞고 틀림이 없는 놀이라 기록에는 시간만 남아요. 끝나면 자연스럽게 다음 일과로 넘어가요.',
  basis: '감각 조절(감각통합) — 예측 가능하고 부드러운 시청각 자극으로 각성 낮추기',
  offline: '어두운 방에서 손전등 빛을 천천히 움직여 따라 보기, 욕조에서 비눗방울 천천히 불기.',
  run: function (ctx) {
    var B = ctx.body, soft = calm(), DUR = soft ? 90 : 75;
    B.innerHTML = '<div class="bd"><div class="bb-pond"><div class="bb-hint">👆 살살 만져 봐요</div></div><div class="bb-time"><b></b></div></div>';
    var pond = q('.bb-pond', B), hintEl = q('.bb-hint', B), tbar = q('.bb-time b', B);
    var motes = [], rips = [], bubs = [], bg = null, lastTone = 0, lastTouch = now(), lastAuto = 0, winding = false, fadeAt = 0, touched = false;
    var cv = ctx.canvas(pond, { onResize: function () { paintBg(); if (!motes.length) makeMotes(); } });
    var c = cv.c;
    pond.appendChild(hintEl);   /* 그림판 위에 */
    function makeMotes() {
      motes = G.range(soft ? 20 : 38).map(function () {
        return { x: Math.random() * cv.w, y: Math.random() * cv.h, r: rnd(1.2, 3.2), vy: -rnd(4, 12), ph: Math.random() * 6.28, a: rnd(0.25, 0.6) };
      });
    }
    function paintBg() {
      var g = c.createLinearGradient(0, 0, 0, cv.h);
      g.addColorStop(0, soft ? '#0b1828' : '#10233d'); g.addColorStop(1, soft ? '#0a2730' : '#0d3a48');
      bg = g;
    }
    function touch(x, y, big, quiet) {
      var fx = G.clamp(x / Math.max(1, cv.w), 0, 0.999), hue = 175 + fx * 110;
      rips.push({ x: x, y: y, life: 0, dur: 1.8, max: rnd(70, 130) * (soft ? 0.8 : 1), hue: hue });
      if (big || bubs.length < 24) bubs.push({ x: x, y: y, r: rnd(14, 34), vy: -rnd(16, 32), ph: Math.random() * 6.28, hue: hue, life: 0, max: rnd(6, 9) });
      if (bubs.length > 28) bubs.shift();
      if (rips.length > 24) rips.shift();
      var t = now();
      if (t - lastTone > 130) {
        lastTone = t;
        var f = PENTA[Math.floor(fx * PENTA.length)], v = (soft ? 0.05 : 0.085) * (quiet ? 0.5 : 1);
        G.sfx.tone(f, 1.6, 'sine', v);
        if (!soft && !quiet && Math.random() < 0.4) G.sfx.tone(f * 1.5, 1.2, 'sine', 0.025, 0.08);
      }
    }
    var downs = {};
    ctx.on(cv.cv, 'pointerdown', function (e) {
      e.preventDefault(); if (winding) return;
      var p = cv.pos(e); downs[e.pointerId] = { x: p.x, y: p.y, t: now() };
      touch(p.x, p.y, true); lastTouch = now();
      if (!touched) { touched = true; hintEl.classList.add('off'); }
    });
    ctx.on(cv.cv, 'pointermove', function (e) {
      var d = downs[e.pointerId]; if (!d || winding) return;
      var p = cv.pos(e), dist = Math.hypot(p.x - d.x, p.y - d.y);
      if (dist > 46 || (now() - d.t > 260 && dist > 10)) { d.x = p.x; d.y = p.y; d.t = now(); touch(p.x, p.y, false); lastTouch = now(); }
    });
    function up(e) { delete downs[e.pointerId]; }
    ctx.on(cv.cv, 'pointerup', up); ctx.on(cv.cv, 'pointercancel', up); ctx.on(cv.cv, 'pointerleave', up);

    ctx.loop(function (dt, el) {
      if (!cv.w || !bg) return;
      var W = cv.w, H = cv.h, fade = winding ? G.clamp(1 - (now() - fadeAt) / 4000, 0.3, 1) : 1, k = soft ? 0.7 : 1;
      c.globalAlpha = 1; c.fillStyle = bg; c.fillRect(0, 0, W, H);
      /* 떠다니는 빛 알갱이 */
      c.fillStyle = '#bfefff';
      motes.forEach(function (m) {
        m.y += m.vy * dt * (winding ? 0.5 : 1); m.ph += dt * 0.8;
        if (m.y < -10) { m.y = H + 10; m.x = Math.random() * W; }
        var x = m.x + Math.sin(m.ph) * 8, a = m.a * (0.6 + 0.4 * Math.sin(m.ph * 1.7)) * fade * k;
        c.globalAlpha = a * 0.18; c.beginPath(); c.arc(x, m.y, m.r * 3.2, 0, 6.283); c.fill();
        c.globalAlpha = a; c.beginPath(); c.arc(x, m.y, m.r, 0, 6.283); c.fill();
      });
      /* 물결 */
      for (var i = rips.length - 1; i >= 0; i--) {
        var r = rips[i]; r.life += dt;
        var p = r.life / r.dur; if (p >= 1) { rips.splice(i, 1); continue; }
        var rad = 6 + (r.max - 6) * (1 - Math.pow(1 - p, 3)), al = (1 - p) * 0.55 * fade * k;
        if (p < 0.6) {   /* 누른 자리의 부드러운 빛 */
          var gl = c.createRadialGradient(r.x, r.y, 0, r.x, r.y, rad * 0.9);
          gl.addColorStop(0, 'hsla(' + r.hue + ',80%,78%,' + ((1 - p / 0.6) * 0.22 * fade * k).toFixed(3) + ')'); gl.addColorStop(1, 'hsla(' + r.hue + ',80%,70%,0)');
          c.globalAlpha = 1; c.fillStyle = gl; c.beginPath(); c.arc(r.x, r.y, rad * 0.9, 0, 6.283); c.fill();
        }
        c.globalAlpha = 1; c.lineWidth = 2.5 * (1 - p) + 0.6;
        c.strokeStyle = 'hsla(' + r.hue + ',70%,75%,' + al.toFixed(3) + ')';
        c.beginPath(); c.arc(r.x, r.y, rad, 0, 6.283); c.stroke();
        c.strokeStyle = 'hsla(' + r.hue + ',70%,80%,' + (al * 0.5).toFixed(3) + ')';
        c.beginPath(); c.arc(r.x, r.y, rad * 0.6, 0, 6.283); c.stroke();
      }
      /* 물방울 */
      for (var j = bubs.length - 1; j >= 0; j--) {
        var b = bubs[j]; b.life += dt; b.y += b.vy * dt; b.ph += dt * 1.6;
        if (b.y < -b.r - 10 || b.life > b.max) { bubs.splice(j, 1); continue; }
        var bx = b.x + Math.sin(b.ph) * 10, ba = Math.min(1, b.life / 0.4) * (1 - Math.max(0, (b.life - (b.max - 1.5)) / 1.5)) * fade * k;
        var g = c.createRadialGradient(bx - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1, bx, b.y, b.r);
        g.addColorStop(0, 'hsla(' + b.hue + ',60%,82%,' + (0.12 * ba).toFixed(3) + ')');
        g.addColorStop(1, 'hsla(' + b.hue + ',70%,72%,' + (0.36 * ba).toFixed(3) + ')');
        c.globalAlpha = 1; c.fillStyle = g; c.beginPath(); c.arc(bx, b.y, b.r, 0, 6.283); c.fill();
        c.lineWidth = 1.5; c.strokeStyle = 'hsla(' + b.hue + ',80%,86%,' + (0.55 * ba).toFixed(3) + ')'; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,' + (0.5 * ba).toFixed(3) + ')'; c.lineWidth = 2;
        c.beginPath(); c.arc(bx, b.y, b.r * 0.65, 3.6, 4.4); c.stroke();
      }
      c.globalAlpha = 1;
      /* 한동안 손이 없으면 물방울이 하나씩 피어나 부른다 */
      if (!winding && now() - lastTouch > 7000 && now() - lastAuto > 4500) { lastAuto = now(); touch(rnd(0.2, 0.8) * W, rnd(0.45, 0.8) * H, true, true); }
      tbar.style.width = Math.max(0, 100 - el / DUR * 100).toFixed(1) + '%';
      if (!winding && el >= DUR) windDown();
    });
    BB_LINES.slice(0, soft ? 4 : 3).forEach(function (t, i) {
      ctx.timeout(function () { if (!winding) ctx.say(t, { repeat: false, rate: 0.8 }); }, (i + 1) * 20000);
    });
    function windDown() {
      winding = true; fadeAt = now();
      G.sfx.tone(G.sfx.N.C5, 2, 'sine', soft ? 0.04 : 0.07);
      ctx.say('이제 쉬었어요. 몸도 마음도 편안해.', { rate: 0.8 }).then(function () { return ctx.wait(1200); })
        .then(function () { ctx.finish({ msg: '이제 쉬었어요. 몸도 마음도 편안해졌어.' }); });
    }
    ctx.say('물방울 놀이야. 손가락으로 물을 살살 만져 봐.', { rate: 0.85 });
  }
});

/* =================================================================
   7. 오늘 할 일 — 시각 일정표 + 먼저-다음 판 (도구)
   ================================================================= */
G.act({
  id: 'schedule', area: 'tool', tool: true, title: '오늘 할 일', icon: '📅', order: 90, levels: 1, mins: 1, needs: [],
  ef: ['plan', 'regulate'],
  desc: '그림으로 보는 오늘 순서',
  goal: '하루 흐름 예측하기 — 다음에 할 일을 미리 알면 불안과 "그만하고 넘어가기"(전환)의 어려움이 줄어요',
  how: '아침에 같이 보며 "지금은 양치, 다음은 밥!" 하고 읽어 주세요. 하나 끝날 때마다 아이가 직접 카드를 눌러 ✔ 하게 하면 해냈다는 느낌이 쌓여요. 하기 싫은 일은 「먼저 · 다음」 판으로 "먼저 양치, 다음 놀이터"처럼 좋아하는 일과 짝지어 주세요. ✏️ 바꾸기는 어른 확인 뒤에 열려요.',
  basis: '시각 일정표·먼저-다음 판 — 예측할 수 있으면 불안과 전환 어려움이 준다(TEACCH 구조화·긍정적 행동 지원)',
  offline: '일과 그림 카드를 냉장고에 붙이고, 끝난 일은 떼어 "끝 상자"에 넣기.',
  run: function (ctx) {
    var B = ctx.body, view = 'list', ftDone = false;
    function loadList() {
      var l = G.store.get('schedule', null);
      if (!Array.isArray(l) || !l.length) l = D.ROUTINE_DEFAULT;
      return l.filter(function (x) { return x && x.e && x.w; }).map(function (x) { return { e: x.e, w: x.w }; });
    }
    var list = loadList();
    if (!list.length) list = D.ROUTINE_DEFAULT.slice();
    var st = G.store.get('scheduleDone', null);
    if (!st || st.d !== G.today() || !Array.isArray(st.done)) st = { d: G.today(), done: [] };
    st.done = st.done.filter(function (i) { return i >= 0 && i < list.length; });
    var ft = G.store.get('firstThen', null);

    function saveDone() { G.store.set('scheduleDone', st); }
    function isDone(i) { return st.done.indexOf(i) >= 0; }
    function nowIdx() { for (var i = 0; i < list.length; i++) if (!isDone(i)) return i; return -1; }
    function nextIdx(k) { for (var i = k + 1; i < list.length; i++) if (!isDone(i)) return i; return -1; }
    function status(pre) {
      var k = nowIdx();
      if (k < 0) return (pre || '') + '오늘 할 일을 다 했어! 정말 멋져!';
      var n = nextIdx(k);
      return (pre || '') + '지금은 ' + list[k].w + '.' + (n >= 0 ? ' 다음은 ' + list[n].w + '.' : ' 이게 마지막이야!');
    }
    function defaultFT() {
      var k = nowIdx(), n = k >= 0 ? nextIdx(k) : -1;
      return { a: k >= 0 ? list[k] : D.ROUTINE[3], b: n >= 0 ? list[n] : D.ROUTINE[14] };
    }
    function speakFT() { ctx.say('먼저 ' + ft.a.w + ', 그다음 ' + ft.b.w + '!'); }

    function render() {
      B.innerHTML = '';
      var w = G.el('<div class="bd"></div>'); B.appendChild(w);
      if (view === 'edit') { editor(w); return; }
      var top = G.el('<div class="sc-top"><div class="sc-seg" role="tablist"><button data-v="list">📋 하루 순서</button><button data-v="ft">👉 먼저 · 다음</button></div>' +
        '<button class="btn soft sm sc-edit">✏️ 바꾸기</button></div>');
      G.$$('.sc-seg button', top).forEach(function (b) {
        b.classList.toggle('on', b.dataset.v === view);
        b.onclick = function () {
          if (view === b.dataset.v) return;
          G.sfx.play('tap'); view = b.dataset.v; render();
          if (view === 'ft') speakFT(); else ctx.say(status());
        };
      });
      q('.sc-edit', top).onclick = function () {
        G.sfx.play('tap');
        G.grownUp().then(function (ok) { if (ok && ctx.alive) { view = 'edit'; G.voice.stop(); render(); } });
      };
      w.appendChild(top);
      if (view === 'ft') boardView(w); else listView(w);
    }

    /* ---- 하루 순서 ---- */
    function listView(w) {
      var k = nowIdx(), n = k >= 0 ? nextIdx(k) : -1;
      var head = G.el('<div class="sc-now"></div>');
      if (k >= 0) {
        head.innerHTML = '<button class="sc-cur" type="button"><span class="ce">' + list[k].e + '</span><span class="ct"><span class="sc-tag">지금</span><b>' + G.esc(list[k].w) + '</b><small>다 하면 눌러요 ✔</small></span></button>' +
          '<div class="sc-nxt"><span class="sc-tag soft">다음</span><span class="ce">' + (n >= 0 ? list[n].e : '🏁') + '</span><span class="cl">' + (n >= 0 ? G.esc(list[n].w) : '끝!') + '</span></div>';
        var cur = q('.sc-cur', head);
        cur.onclick = function () { toggle(k, cur); };
      } else {
        head.innerHTML = '<div class="sc-all"><span class="ce">🎉</span><b>오늘 할 일 끝!</b></div>';
      }
      w.appendChild(head);
      var grid = G.el('<div class="sc-grid"></div>');
      list.forEach(function (it, i) {
        var b = G.el('<button class="sc-card" type="button"><span class="n">' + (i + 1) + '</span><span class="ce">' + it.e + '</span><span class="cl">' + G.esc(it.w) + '</span></button>');
        if (isDone(i)) b.classList.add('done'); else if (i === k) b.classList.add('now'); else if (i === n) b.classList.add('next');
        b.setAttribute('aria-label', (i + 1) + '. ' + it.w + (isDone(i) ? ' — 다 했어요' : ''));
        b.onclick = function () { toggle(i, b); };
        grid.appendChild(b);
      });
      w.appendChild(grid);
    }
    function toggle(i, el) {
      var was = isDone(i);
      if (was) { st.done.splice(st.done.indexOf(i), 1); G.sfx.play('tap'); }
      else {
        st.done.push(i); G.sfx.play('good'); G.buzz([15, 30, 15]);
        if (el) { var c = G.fx.center(el); G.fx.burst(c[0], c[1], ['✔️', '⭐', '✨']); }
      }
      saveDone(); render();
      if (!was && nowIdx() < 0) { G.sfx.play('win'); G.fx.confetti(30); ctx.say(G.callName() + ', 오늘 할 일을 다 했어! 정말 멋져!'); return; }
      ctx.say(was ? status() : status(G.pick(['잘했어! ', '해냈다! ', '좋아! ', '멋져! '])));
    }

    /* ---- 먼저 · 다음 판 ---- */
    function boardView(w) {
      if (!ft || !ft.a || !ft.b) ft = defaultFT();
      function slot(k, lab) {
        var it = ft[k], cls = k === 'a' ? (ftDone ? 'done' : 'now') : (ftDone ? 'now' : '');
        return '<div class="ft-slot"><div class="ft-lab">' + lab + '</div><button class="ft-card ' + cls + '" type="button" data-k="' + k + '">' +
          '<span class="ce">' + it.e + '</span><span class="cl">' + G.esc(it.w) + '</span><small>눌러서 바꾸기</small></button></div>';
      }
      var bd = G.el('<div class="ft-board">' + slot('a', '먼저') + '<div class="ft-arrow" aria-hidden="true">➜</div>' + slot('b', '다음') + '</div>');
      G.$$('.ft-card', bd).forEach(function (b) {
        b.onclick = function () {
          G.sfx.play('tap');
          var k = b.dataset.k;
          pickRoutine(ctx, (k === 'a' ? '먼저' : '다음') + ' 할 일을 골라요', function (it) {
            if (!it) return;
            ft[k] = it; G.store.set('firstThen', ft);
            if (k === 'a') ftDone = false;
            render(); speakFT();
          });
        };
      });
      w.appendChild(bd);
      var ctl = G.el('<div class="ft-ctl"></div>');
      if (!ftDone) {
        ctl.innerHTML = '<button class="btn big green ft-ok">✔ 먼저 할 일 다 했어!</button>';
        q('.ft-ok', ctl).onclick = function () {
          ftDone = true; G.sfx.play('great'); G.buzz([15, 30, 15]);
          render();
          var nb = q('.ft-card[data-k="b"]', B); if (nb) { var c = G.fx.center(nb); G.fx.burst(c[0], c[1]); }
          ctx.say(G.pick(['먼저 할 일 끝! ', '해냈다! ', '잘했어! ']) + '이제 ' + ft.b.w + '!');
        };
      } else {
        ctl.innerHTML = '<button class="btn big soft ft-new">🔄 새로 하기</button>';
        q('.ft-new', ctl).onclick = function () {
          G.sfx.play('tap'); ftDone = false; ft = defaultFT(); G.store.del('firstThen');
          render(); speakFT();
        };
      }
      w.appendChild(ctl);
    }

    /* ---- 바꾸기 (어른) ---- */
    function editor(w) {
      var work = list.map(function (it, i) { return { e: it.e, w: it.w, done: isDone(i) }; });
      w.innerHTML = '<div class="ed-wrap"><div class="ed-h">✏️ 오늘 할 일 바꾸기<small>어른용 · 위아래로 순서를 바꿔요</small></div><div class="ed-list"></div>' +
        '<div class="ed-sub"></div><div class="ed-add"></div>' +
        '<div class="ed-btns"><button class="btn soft ed-reset">↺ 처음 목록</button><button class="btn soft ed-clear">🧹 오늘 ✔ 지우기</button>' +
        '<button class="btn soft ed-cancel">취소</button><button class="btn green ed-save">✔ 저장</button></div></div>';
      var L = q('.ed-list', w), subEl = q('.ed-sub', w), add = q('.ed-add', w);
      function draw() {
        L.innerHTML = '';
        subEl.textContent = '➕ 그림을 눌러 더해요 (지금 ' + work.length + '개 · 16개까지)';
        if (!work.length) L.innerHTML = '<div class="ed-empty">아래 그림을 눌러 할 일을 더해 주세요</div>';
        work.forEach(function (it, i) {
          var r = G.el('<div class="ed-row"><span class="n">' + (i + 1) + '</span><span class="e">' + it.e + '</span><span class="w"></span>' +
            '<button aria-label="위로">▲</button><button aria-label="아래로">▼</button><button aria-label="빼기">✕</button></div>');
          q('.w', r).textContent = it.w + (it.done ? ' ✔' : '');
          var bs = r.querySelectorAll('button');
          bs[0].disabled = i === 0; bs[1].disabled = i === work.length - 1;
          bs[0].onclick = function () { swap(i, i - 1); };
          bs[1].onclick = function () { swap(i, i + 1); };
          bs[2].onclick = function () { work.splice(i, 1); G.sfx.play('tap'); draw(); };
          L.appendChild(r);
        });
      }
      function swap(a, b) { if (b < 0 || b >= work.length) return; var t = work[a]; work[a] = work[b]; work[b] = t; G.sfx.play('tap'); draw(); }
      D.ROUTINE.forEach(function (it) {
        var b = G.el('<button type="button"><span>' + it.e + '</span>' + G.esc(it.w) + '</button>');
        b.onclick = function () {
          if (work.length >= 16) { G.toast('16개까지 넣을 수 있어요'); return; }
          work.push({ e: it.e, w: it.w, done: false }); G.sfx.play('pop'); draw();
          G.toast(it.e + ' ' + it.w + ' — ' + work.length + '번째에 더했어요', 1400);
        };
        add.appendChild(b);
      });
      q('.ed-reset', w).onclick = function () {
        work = D.ROUTINE_DEFAULT.map(function (it) { return { e: it.e, w: it.w, done: false }; });
        G.sfx.play('tap'); draw(); G.toast('처음 목록으로 바꿨어요 — ✔ 저장을 눌러야 적용돼요');
      };
      q('.ed-clear', w).onclick = function () { work.forEach(function (x) { x.done = false; }); G.sfx.play('tap'); draw(); };
      q('.ed-cancel', w).onclick = function () { G.sfx.play('tap'); view = 'list'; render(); };
      q('.ed-save', w).onclick = function () {
        if (!work.length) { G.toast('할 일을 하나 이상 넣어 주세요'); return; }
        list = work.map(function (x) { return { e: x.e, w: x.w }; });
        G.store.set('schedule', list);
        st = { d: G.today(), done: work.map(function (x, i) { return x.done ? i : -1; }).filter(function (i) { return i >= 0; }) };
        saveDone();
        G.sfx.play('good'); G.toast('저장했어요');
        view = 'list'; render(); ctx.say(status());
      };
      draw();
    }

    render();
    ctx.say(nowIdx() < 0 ? '오늘 할 일을 다 했어! 정말 멋져!' : '오늘 할 일이야. ' + status());
  }
});

/* =================================================================
   8. 기다리기 타이머 — 시각 타이머 (도구)
   ================================================================= */
var TM_TICKS = '<svg class="tm-ticks" viewBox="0 0 100 100" aria-hidden="true">' + G.range(12).map(function (k) {
  var a = k * Math.PI / 6, r1 = k % 3 ? 45.5 : 44.5, r2 = 47.6;
  return '<line x1="' + (50 + Math.sin(a) * r1).toFixed(2) + '" y1="' + (50 - Math.cos(a) * r1).toFixed(2) + '" x2="' + (50 + Math.sin(a) * r2).toFixed(2) + '" y2="' + (50 - Math.cos(a) * r2).toFixed(2) + '"/>';
}).join('') + '</svg>';

G.act({
  id: 'timer', area: 'tool', tool: true, title: '기다리기 타이머', icon: '⏳', order: 91, levels: 1, mins: 1, needs: [],
  ef: ['inhibit', 'regulate'],
  desc: '빨간색이 다 없어지면 끝!',
  goal: '기다리기·전환 돕기 — 보이지 않는 시간을 눈에 보이게 해서 "언제 끝나?"의 불안을 줄이고 스스로 기다리는 힘 기르기',
  how: '"빨간 게 다 없어지면 놀이터 가자"처럼 끝나고 할 일을 같이 말해 주세요(✨ 다 되면 칸에 그림을 고를 수 있어요). 처음엔 1~2분으로 짧게 시작해 성공 경험을 쌓고, 기다리는 동안 숨쉬기·노래로 함께 버텨 주세요. 끝나면 꼭 약속을 지켜 주세요.',
  basis: '시각 타이머(Time Timer 방식) — 남은 시간을 넓이로 보여 주면 기다리기와 활동 전환이 쉬워진다',
  offline: '모래시계나 부엌 타이머를 놓고 "이게 다 내려가면 ○○ 하자" 약속하기.',
  run: function (ctx) {
    var B = ctx.body, PRE = [1, 2, 3, 5, 10];
    var mins = G.clamp(Math.round(+G.store.get('timerMin', 2)) || 2, 1, 60), then = G.store.get('timerThen', null);
    if (then && !(then.e && then.w)) then = null;
    var total = mins * 60000, left = total, running = false, endAt = 0, endH = null, half = false, near = false, loopOn = false, done = false;
    B.innerHTML = '<div class="bd"><div class="tm-wrap"><div class="tm-col"><div class="tm-dial"><div class="tm-face"></div>' + TM_TICKS +
      '<div class="tm-pie"></div><div class="tm-knob"></div></div><div class="tm-left" aria-live="off"></div></div>' +
      '<div class="tm-ctl"><button class="tm-then" type="button"></button><div class="tm-pre"></div>' +
      '<div class="tm-adj"><button class="tm-minus" type="button" aria-label="1분 줄이기">−</button><b></b><button class="tm-plus" type="button" aria-label="1분 늘리기">+</button></div>' +
      '<div class="tm-go"><button class="btn big tm-start">▶ 시작</button><button class="btn big soft tm-reset">↺ 처음</button></div></div></div></div>';
    var wrap = q('.bd', B), dial = q('.tm-dial', B), pie = q('.tm-pie', B), knob = q('.tm-knob', B), lab = q('.tm-left', B),
      thenB = q('.tm-then', B), preBox = q('.tm-pre', B), adjB = q('.tm-adj b', B), startB = q('.tm-start', B);
    PRE.forEach(function (m) {
      var b = G.el('<button type="button">' + m + '분</button>'); b.dataset.m = m;
      b.onclick = function () { G.sfx.play('tap'); setMins(m); };
      preBox.appendChild(b);
    });
    q('.tm-minus', B).onclick = function () { G.sfx.play('tap'); setMins(mins - 1); };
    q('.tm-plus', B).onclick = function () { G.sfx.play('tap'); setMins(mins + 1); };
    startB.onclick = function () { if (running) pause(); else start(); };
    q('.tm-reset', B).onclick = function () { G.sfx.play('tap'); reset(); };
    thenB.onclick = function () {
      G.sfx.play('tap');
      pickRoutine(ctx, '다 기다리면 무엇을 할까요?', function (it) {
        then = it; if (it) G.store.set('timerThen', it); else G.store.del('timerThen');
        syncThen();
        if (it) ctx.say('빨간색이 다 없어지면 ' + it.w + '!');
      }, then ? '✕ 그림 없이' : null);
    };

    /* 남은 시간 원판 — 12시에서 시계 방향으로 빨간 부분이 줄어든다 */
    function draw() {
      var r = total ? left / total : 0, a = ((1 - r) * 360).toFixed(2);
      pie.style.background = r >= 1 ? 'var(--tc)' : r <= 0 ? 'transparent' : 'conic-gradient(transparent 0deg ' + a + 'deg, var(--tc) ' + a + 'deg 360deg)';
      var s = Math.ceil(left / 1000);
      lab.textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
    }
    function syncThen() {
      thenB.innerHTML = then ? '<span class="te">' + then.e + '</span><span>다 되면 <b>' + G.esc(then.w) + '</b></span>' : '<span class="te">✨</span><span>다 되면 할 일 고르기</span>';
      if (!done) knob.textContent = then ? then.e : '⏳';
    }
    function syncCtl() {
      G.$$('button', preBox).forEach(function (b) { b.classList.toggle('on', +b.dataset.m === mins); });
      adjB.textContent = mins + '분';
      startB.textContent = running ? '⏸ 잠깐' : (left > 0 && left < total ? '▶ 계속' : '▶ 시작');
      wrap.classList.toggle('running', running);
    }
    function setMins(m) {
      if (running) return;
      mins = G.clamp(m, 1, 60); total = left = mins * 60000;
      done = false; half = near = false; dial.classList.remove('fin');
      G.store.set('timerMin', mins);
      syncThen(); draw(); syncCtl();
    }
    function start() {
      if (done || left <= 0) { left = total; done = false; half = near = false; dial.classList.remove('fin'); syncThen(); }
      var fresh = left === total;
      running = true; endAt = now() + left;
      clearTimeout(endH); endH = ctx.timeout(finishWait, left + 40);   /* 화면이 가려져 그림이 멈춰도 끝은 알린다 */
      G.sfx.play('up');
      ctx.say(fresh ? '시작! 빨간색이 다 없어지면 ' + (then ? then.w + '!' : '끝이야.') : '다시 시작!', { repeat: false });
      loop(); syncCtl();
    }
    function pause() {
      running = false; left = Math.max(0, endAt - now()); clearTimeout(endH);
      G.sfx.play('tap'); draw(); syncCtl();
      ctx.say('잠깐 멈췄어.', { repeat: false });
    }
    function reset() {
      running = false; clearTimeout(endH);
      left = total; done = false; half = near = false; dial.classList.remove('fin');
      syncThen(); draw(); syncCtl();
    }
    function loop() {
      if (loopOn) return; loopOn = true;
      ctx.loop(function () {
        if (!running) { loopOn = false; return false; }
        left = Math.max(0, endAt - now()); draw();
        if (!half && total >= 120000 && left <= total / 2) { half = true; ctx.say('반이나 기다렸어! 잘하고 있어.', { repeat: false }); }
        if (!near && total >= 60000 && left <= 10000 && left > 0) { near = true; ctx.say('조금만 더! 거의 다 됐어.', { repeat: false }); }
        if (left <= 0) { loopOn = false; finishWait(); return false; }
      });
    }
    function finishWait() {
      if (!running) return;
      running = false; left = 0; done = true; clearTimeout(endH);
      draw(); syncCtl();
      G.sfx.play('ding'); ctx.timeout(function () { G.sfx.play('ding'); }, 700); G.buzz([60, 80, 60]);
      knob.textContent = then ? then.e : '🎉';
      restartAnim(dial, 'fin');
      var c = G.fx.center(dial); G.fx.burst(c[0], c[1], ['⭐', '✨', '🌟']);
      ctx.say('다 기다렸어! 정말 잘 참았어.' + (then ? ' 이제 ' + then.w + '!' : ''));
    }

    syncThen(); draw(); syncCtl();
    ctx.say('기다리기 타이머야. 빨간색이 다 없어지면 끝!');
  }
});
})();

/* ===========================================================
   함께 자라요 — 🧠 다섯 가지 생각 영역 채우기

   아동 지능검사(K-WISC)가 보는 다섯 영역(언어 이해·시공간·유동 추론·작업기억·처리 속도) 가운데
   우리 앱에 덜 있던 곳을 채우는 새 놀이 다섯. 다른 앱의 그림·이름은 쓰지 않고 이모지·SVG·CSS 로만 그렸다.
     spotdiff  다른 곳 찾기    시공간      (틀린그림찾기 — 시각 비교·변별)
     nback     방금 본 그림?   기억력      (n-back 작업기억)
     quick     번개 찾기       처리 속도   (Symbol Search·Coding 형식)
     numtower  숫자 탑 쌓기    논리 추론   (수 피라미드·수 패턴)
     parking   주차장 탈출     시공간 계획 (Rush Hour 형식 미끄럼 퍼즐)

   ▸ 모두 10단계(1년 사다리): 1단계는 아주 쉽게, 10단계는 초등 3학년이 애써서 할 만큼.
     숫자는 ctx.tune([...10개]) — 2·3칸은 다음 단계 쪽으로 조금씩. 규칙이 새로 생기는 다음 단계는
     2·3칸에서 마지막 한두 문제로 미리 맛본다.
   ▸ 실패 없는 배움: 아이 화면에 "틀렸어"는 없다. 어긋나면 살짝 흔들리고 정답이 반짝인다.
   ▸ 점수는 ctx.extra.score (클수록 좋다) — 부모 화면 최고 기록.
   =========================================================== */
(function () {
'use strict';
var G = window.G;
if (!G) return;

/* ---------- 함께 쓰는 작은 도구 ---------- */
var FAST = ['좋아!', '정확해!', '바로 그거야!', '굿 잡!', '역시!', '척척!', '완벽해!', '눈이 빠르다!'];
function calm() { return !!G.settings.calm; }
function pace(ms) { return Math.round(ms * (calm() ? 1.35 : 1)); }
function rint(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
/* 진행 점: 7~10개면 점 다섯으로 줄인다 (제목이 가려지지 않게). 10개 넘으면 엔진이 '3/12' 글자로 */
function prog(ctx, i, n) { if (n > 6 && n <= 10) ctx.progress(Math.round(i * 5 / n), 5); else ctx.progress(i, n); }
/* 규칙이 바뀌거나 새 판이 시작될 때 크게 알려 주기 */
function announce(ctx, box, e, t, s, ms) {
  var a = G.el('<div class="rx-ann"><div class="ae"></div><div class="at"></div><div class="as"></div></div>');
  a.querySelector('.ae').textContent = e; a.querySelector('.at').textContent = t; a.querySelector('.as').textContent = s || '';
  box.appendChild(a); G.sfx.play('up');
  return ctx.say(t + ' ' + (s || '')).then(function () { return ctx.wait(ms || 300); }).then(function () { a.remove(); });
}
/* 놀이 칸 위로 떠오르는 짧은 글 */
function floatText(box, text, el) {
  var f = G.el('<span class="rx-float"></span>'); f.textContent = text;
  var r = box.getBoundingClientRect(), c = G.fx.center(el);
  f.style.left = G.clamp(c[0] - r.left, 60, r.width - 60) + 'px'; f.style.top = (c[1] - r.top) + 'px';
  box.appendChild(f); setTimeout(function () { f.remove(); }, 1300);
}

G.css('rx', `
.st-body[class*="act-"] .rx{flex:1;display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;min-height:0;position:relative}
.rx-head{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;background:var(--surface);border-radius:20px;padding:6px 16px;
  box-shadow:var(--shadow);font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,22px);max-width:100%;line-height:1.35;text-align:center}
.rx-head b{color:var(--area);font-weight:400}
.rx-head .dim{color:var(--soft);font-size:.8em}
.rx-ann{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  background:color-mix(in srgb,var(--bg) 92%,transparent);border-radius:26px;text-align:center;padding:16px;animation:fade .3s}
.rx-ann .ae{font-size:clamp(70px,22vw,130px);line-height:1.1;animation:pop .6s}
.rx-ann .at{font-family:Jua,sans-serif;font-size:clamp(24px,7vw,38px);line-height:1.3}
.rx-ann .as{color:var(--soft);font-size:clamp(15px,4vw,19px);line-height:1.5;max-width:520px}
.rx-float{position:absolute;z-index:20;pointer-events:none;transform:translate(-50%,-50%);font-family:Jua,sans-serif;font-size:clamp(17px,4.8vw,24px);
  color:var(--ink);background:var(--surface);padding:4px 12px;border-radius:999px;box-shadow:var(--shadow);white-space:nowrap;animation:rxUp 1.3s ease-out forwards}
@keyframes rxUp{0%{opacity:0;transform:translate(-50%,-30%) scale(.8)}15%{opacity:1;transform:translate(-50%,-60%) scale(1)}100%{opacity:0;transform:translate(-50%,-170%)}}
@keyframes rxPulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,#ffd54f 0%,transparent)}50%{box-shadow:0 0 0 7px color-mix(in srgb,#ffd54f 85%,transparent)}}

/* ── spotdiff ── */
.act-spotdiff .sd-wrap{flex:1;min-height:0;width:100%;max-width:640px;display:flex;flex-direction:column;gap:10px}
@media (min-aspect-ratio:5/4){.act-spotdiff .sd-wrap{flex-direction:row;max-width:960px}}
.act-spotdiff .sd-pane{position:relative;flex:1 1 0;min-height:140px;min-width:0;border-radius:22px;overflow:hidden;box-shadow:var(--shadow);border:4px solid var(--surface);touch-action:manipulation}
.act-spotdiff .sd-tag{position:absolute;left:8px;top:6px;z-index:3;font-family:Jua,sans-serif;font-size:14px;background:rgba(255,255,255,.8);color:#24344a;border-radius:999px;padding:0 9px;pointer-events:none}
.act-spotdiff .sd-slot{position:absolute;cursor:pointer;border-radius:18px}
.act-spotdiff .sd-it{position:absolute;transform:translate(-50%,-50%);font-size:var(--fs,40px);line-height:1;pointer-events:none;transition:transform .2s}
.act-spotdiff .sd-slot.got::after{content:'';position:absolute;inset:5%;border-radius:50%;border:4px solid var(--good);box-shadow:0 0 0 3px rgba(255,255,255,.7);animation:pop .4s}
.act-spotdiff .sd-dots{letter-spacing:2px}

/* ── nback ── */
.act-nback .nb-trail{display:flex;gap:10px;justify-content:center;align-items:flex-end;padding-bottom:18px}
.act-nback .nb-tc{position:relative;width:clamp(46px,min(16vw,10vh),78px);aspect-ratio:3/4;border-radius:14px;background:color-mix(in srgb,var(--area) 22%,var(--surface));
  box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;font-size:clamp(30px,9vw,44px);border:3px solid transparent}
.act-nback .nb-tc span{transition:opacity .3s}
.act-nback .nb-tc small{position:absolute;bottom:-20px;left:0;right:0;text-align:center;font-size:12px;color:var(--soft);font-family:Jua,sans-serif}
.act-nback .nb-tc.key{border-color:color-mix(in srgb,var(--area) 70%,transparent);border-style:dashed}
.act-nback .nb-tc.hint{outline-offset:2px}
.act-nback .nb-card{position:relative;width:min(60vw,260px,26vh);aspect-ratio:3/4;border-radius:30px;background:var(--surface);box-shadow:var(--shadow);display:flex;align-items:center;
  justify-content:center;font-size:clamp(96px,30vw,160px);line-height:1;margin:auto 0 0;border:5px solid color-mix(in srgb,var(--area) 30%,transparent);transition:border-color .2s}
.act-nback .nb-card.show{animation:pop .3s}
.act-nback .nb-card.blank{font-size:0;background:color-mix(in srgb,var(--area) 10%,var(--surface))}
.act-nback .nb-card.yes{border-color:var(--good)}
.act-nback .nb-card.remember::after{content:'기억해!';position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:16px;line-height:1.2;font-family:Jua,sans-serif;color:var(--soft)}
.act-nback .nb-same{width:min(100%,460px);min-height:clamp(64px,11vh,96px);font-size:clamp(26px,7vw,34px);margin:6px 0 auto;border-radius:28px}
.act-nback .nb-same.pulse{animation:rxPulse 1s ease-in-out infinite}
.act-nback .nb-same.ok{background:var(--good)}

/* ── quick ── */
.act-quick .qk-bar{height:12px;border-radius:9px;background:var(--line);width:min(100%,560px);overflow:hidden}
.act-quick .qk-bar b{display:block;height:100%;width:100%;background:linear-gradient(90deg,#ffd54f,#ffb300);border-radius:9px}
.calm .act-quick .qk-bar b{background:#c8d3e3}
.act-quick .qk-tg{display:flex;align-items:center;gap:10px;background:var(--surface);border-radius:24px;padding:8px 18px;box-shadow:var(--shadow);border:4px dashed color-mix(in srgb,var(--area) 50%,transparent)}
.act-quick .qk-tg small{font-family:Jua,sans-serif;color:var(--soft);font-size:clamp(14px,3.8vw,17px);line-height:1.2;text-align:center}
.act-quick .qk-tg .qk-s{width:clamp(64px,18vw,88px)}
.act-quick .qk-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(14px,3.5vw,24px);width:100%;min-height:0;padding-bottom:4vh}
.act-quick .qk-row{display:grid;grid-template-columns:repeat(var(--k),minmax(0,1fr));gap:clamp(6px,2vw,12px);width:min(100%,560px)}
.act-quick .qk-c{aspect-ratio:1;border-radius:20px;background:var(--surface);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;padding:12%;border:4px solid transparent;min-height:52px}
.act-quick button.qk-c:active{transform:scale(.94)}
.act-quick .qk-c.got{border-color:var(--good);animation:pop .4s}
.act-quick .qk-s{display:block;width:100%;height:auto;aspect-ratio:1}
.act-quick .qk-yn{display:flex;gap:clamp(12px,4vw,24px);width:min(100%,560px)}
.act-quick .qk-yn button{flex:1;min-height:clamp(96px,24vw,130px);border-radius:28px;font-family:Jua,sans-serif;font-size:clamp(22px,6vw,30px);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-shadow:0 6px 0 rgba(0,0,0,.14)}
.act-quick .qk-yn button span{font-size:clamp(38px,11vw,54px);line-height:1.05}
.act-quick .qk-yn .yes{background:#d6f5e6;color:#145c40}
.act-quick .qk-yn .no{background:#e6ecf7;color:#2b3a55}
.act-quick .qk-yn button:active{transform:translateY(4px);box-shadow:0 2px 0 rgba(0,0,0,.14)}
.act-quick .qk-yn button.got{outline:6px solid var(--good)}

/* ── numtower ── */
.act-numtower .nt-rule{font-size:clamp(15px,4vw,19px)}
.act-numtower .nt-tower{--bw:min(92px,calc((100vw - 64px) / var(--b)));display:flex;flex-direction:column;align-items:center;gap:6px;margin:auto 0 0}
.act-numtower .nt-row{display:flex;gap:6px;justify-content:center}
.act-numtower .nt-b{position:relative;width:var(--bw);height:calc(var(--bw) * .72);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;
  font-family:Jua,sans-serif;font-size:calc(var(--bw) * .4);line-height:1;color:#2a2f45;background:var(--bc,#ffe08a);box-shadow:0 4px 0 rgba(0,0,0,.16)}
.act-numtower .nt-b i{font-style:normal;font-size:.36em;letter-spacing:1px;color:#5a4a1a;margin-top:3px;max-width:92%;overflow:hidden;white-space:nowrap}
.act-numtower .nt-b.hole{background:color-mix(in srgb,var(--surface) 80%,transparent);color:var(--soft);border:3px dashed var(--line);box-shadow:none}
.act-numtower .nt-b.now{border:3px solid #ffb300;color:var(--ink);animation:rxPulse 1.2s ease-in-out infinite}
.act-numtower .nt-b.fill{animation:pop .45s}
.act-numtower .nt-eq{min-height:40px;font-family:Jua,sans-serif;font-size:clamp(20px,5.6vw,28px);color:var(--area);text-align:center}
.act-numtower .nt-pat{display:flex;align-items:center;justify-content:center;width:min(100%,600px);margin:auto 0 0;padding-top:22px}
.act-numtower .nt-st{flex:1 1 0;min-width:0;max-width:84px;aspect-ratio:1;border-radius:50%;background:#bfe3ff;color:#163a5c;display:flex;align-items:center;justify-content:center;
  font-family:Jua,sans-serif;font-size:clamp(17px,5.4vw,30px);box-shadow:0 4px 0 rgba(0,0,0,.14)}
.act-numtower .nt-st.hole{background:color-mix(in srgb,var(--surface) 80%,transparent);color:var(--soft);border:3px dashed var(--line);box-shadow:none}
.act-numtower .nt-st.now{border:3px solid #ffb300;color:var(--ink);animation:rxPulse 1.2s ease-in-out infinite}
.act-numtower .nt-ar{position:relative;flex:0 0 auto;width:clamp(12px,3.4vw,22px);text-align:center;color:var(--soft);font-size:14px}
.act-numtower .nt-ar em{position:absolute;bottom:100%;left:50%;transform:translate(-50%,-6px);font-style:normal;font-family:Jua,sans-serif;font-size:clamp(13px,3.6vw,17px);
  color:var(--area);white-space:nowrap;opacity:0;transition:opacity .3s}
.act-numtower .nt-pat.show em{opacity:1}
.act-numtower .nt-ch{width:min(100%,560px);margin:0 0 auto}
.act-numtower .nt-ch .choices.c4{grid-template-columns:repeat(4,1fr)}
.act-numtower .nt-ch .choice{min-height:clamp(64px,16vw,96px);padding:6px 2px}
.act-numtower .nt-num{font-family:Jua,sans-serif;font-size:clamp(28px,8vw,44px);line-height:1.1}

/* ── parking ── */
.act-parking .pk-frame{position:relative;width:min(100%,440px);width:min(100%,440px,calc(100dvh - 330px));padding:10px;border-radius:24px;background:#59667a;box-shadow:var(--shadow);margin:auto 0 0}
.act-parking .pk-board{position:relative;width:100%;aspect-ratio:1;border-radius:12px;touch-action:none;
  background-color:#9aa6b6;background-image:linear-gradient(rgba(255,255,255,.28) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.28) 2px,transparent 2px);
  background-size:calc(100% / var(--n)) calc(100% / var(--n));background-position:-1px -1px}
.act-parking .pk-exit{position:absolute;right:0;width:10px;background:#9aa6b6;display:flex;align-items:center;justify-content:center}
.act-parking .pk-exit::after{content:'';position:absolute;left:4px;top:50%;width:0;height:0;border:9px solid transparent;border-left-color:#3ddc84;transform:translateY(-50%)}
.act-parking .pk-car{position:absolute;padding:calc(6% / var(--n));box-sizing:border-box;touch-action:none;cursor:grab;z-index:2}
.act-parking .pk-car.drag{z-index:5;cursor:grabbing}
.act-parking .pk-car.drag .pk-in{box-shadow:0 8px 18px rgba(0,0,0,.35)}
.act-parking .pk-in{position:relative;width:100%;height:100%;border-radius:14px;background:var(--cc);box-shadow:inset 0 -5px 0 rgba(0,0,0,.18),0 3px 6px rgba(0,0,0,.28);
  display:flex;align-items:center;justify-content:center}
.act-parking .pk-in::before,.act-parking .pk-in::after{content:'';position:absolute;background:rgba(220,240,255,.85);border-radius:6px}
.act-parking .pk-car.h .pk-in::before{right:12%;top:18%;bottom:18%;width:13%}
.act-parking .pk-car.h .pk-in::after{left:12%;top:22%;bottom:22%;width:9%}
.act-parking .pk-car.v .pk-in::before{bottom:12%;left:18%;right:18%;height:13%}
.act-parking .pk-car.v .pk-in::after{top:12%;left:22%;right:22%;height:9%}
.act-parking .pk-car.t3 .pk-in{background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.18) 0 8px,transparent 8px 16px)}
.act-parking .pk-car.t3.v .pk-in{background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.18) 0 8px,transparent 8px 16px)}
.act-parking .pk-car.red .pk-in{font-size:calc(min(100vw,440px) / var(--n) * .34);color:#fff}
.act-parking .pk-car.sel .pk-in{outline:4px solid #ffd54f;outline-offset:1px}
.act-parking .pk-car.out{transition:transform .7s ease-in,opacity .7s;opacity:0}
.act-parking .pk-ghost{position:absolute;border:4px dashed #ffd54f;border-radius:14px;z-index:1;pointer-events:none;animation:fade .3s;background:rgba(255,213,79,.18)}
.act-parking .pk-tools{display:flex;gap:10px;justify-content:center;width:min(100%,440px);margin:0 0 auto}
.act-parking .pk-tools .btn{flex:1;min-height:56px;padding:8px 6px;font-size:17px}
.act-parking .pk-tools .btn.big{font-size:19px}
.act-parking .pk-tools .btn.pulse{animation:rxPulse 1s ease-in-out infinite}
`);

/* ===========================================================
   1. 다른 곳 찾기 — 시공간 주의·시각 비교 (틀린그림찾기)
   =========================================================== */
var SD_THEMES = [
  { n: '공원', bg: 'linear-gradient(180deg,#d6f0ff 0%,#d6f0ff 50%,#b4e08f 50%,#9fd57a 100%)', it: '🌳 🌷 🌻 🐕 🐈 🐦 🦋 🐝 ⚽ 🎈 🪁 🚲 🍦 🍎 🐞 🌼 🦆 🍄 🌲 🐌 🛴 🐿️' },
  { n: '바다', bg: 'linear-gradient(180deg,#d9f2ff 0%,#d9f2ff 26%,#7cc8f0 26%,#4aa8e0 82%,#f2dca8 82%)', it: '🐟 🐠 🐙 🦀 🐢 🐳 🐬 ⛵ 🐚 🦑 ⭐ 🦈 🐡 🦞 🌴 ☀️ 🐋 🏝️ 🦐 ⚓' },
  { n: '우주', bg: 'radial-gradient(circle at 75% 20%,#3b4a9a 0,#1c2353 45%,#121735 100%)', it: '🚀 🛸 🌙 ⭐ 🪐 ☄️ 👽 🛰️ 🌍 🌟 🔭 💫 ☀️ 🌕 👾 🤖 🌠 🌈' },
  { n: '부엌', bg: 'linear-gradient(180deg,#fff4e2 0%,#fff4e2 62%,#e6c9a2 62%)', it: '🍎 🍌 🍇 🥕 🍞 🧀 🥛 🍳 🥄 🍓 🥦 🍪 🧁 🍉 🥚 🍯 🍋 🍒 🍩 🍐' },
  { n: '농장', bg: 'linear-gradient(180deg,#d4efff 0%,#d4efff 48%,#cce8a4 48%,#b9dc8c 100%)', it: '🐄 🐖 🐔 🐑 🐴 🐣 🚜 🌽 🥕 🏠 🌻 🐐 🦆 🐇 🍎 🐕 🐈 🌾 🐓 🍄' },
  { n: '놀이방', bg: 'linear-gradient(180deg,#f1ebff 0%,#f1ebff 66%,#dcc8a6 66%)', it: '🧸 🚗 🎨 📚 🧩 🪀 🎲 🚂 🤖 🎸 🥁 🏀 🪁 🎁 ✏️ 🎈 ⚽ 🛴 🚁 🧃' }
];
/* 좌우가 뒤집히면 티가 나는 그림 (8단계 '방향') */
var SD_FLIP = toSet('🐕 🐈 🐦 🦆 🐟 🐠 🐢 🐳 🐬 🦈 🐡 🐋 🐌 🐿️ 🚗 🚜 🚂 🚲 🛴 🚁 🐄 🐖 🐔 🐓 🐐 🐇 🐴 🌙 ⛵ 🚀 ☄️ 🥕 🍌 ✏️ 🦐 🦞 🐣 🎸 🪁 🔭 🛰️');
/* 색을 돌려도 티가 안 나는 그림 (흰색·회색) — 6단계 '색' 에서 뺀다 */
var SD_NOCOLOR = toSet('⚽ ☁️ 🥛 🐄 🐑 🥚 🛰️ 🔭 👽 🤖 🎲 🐚 🍚 🦈 🐋 🐳 🏠 🥄');
/* 닮은 그림으로 바꾸기 (7단계부터 — 더 꼼꼼히 봐야 한다) */
var SD_NEAR = { '🍎': '🍏', '🌷': '🌹', '🌻': '🌼', '🌼': '🌻', '🐟': '🐠', '🐠': '🐟', '🐳': '🐋', '🐋': '🐳', '🚗': '🚙', '🌳': '🌲', '🌲': '🌳', '⭐': '🌟', '🌟': '⭐',
  '🐔': '🐓', '🐓': '🐔', '🐣': '🐥', '🍦': '🍨', '🍪': '🍩', '🍩': '🍪', '🧁': '🍰', '🐕': '🐩', '🐈': '🐆', '🌙': '🌛', '🚂': '🚃', '🍋': '🍊', '🍐': '🍏', '🍒': '🍓', '🍓': '🍒',
  '🐢': '🦎', '🌍': '🌎', '🌕': '🌝', '🦋': '🐛', '🐝': '🐞', '🐞': '🐝', '🥦': '🥬', '🌽': '🌾', '🎈': '🎀', '🏀': '🏐', '🚁': '✈️', '🐴': '🦄', '🐖': '🐗' };
function toSet(s) { var o = {}; s.split(' ').forEach(function (x) { if (x) o[x] = 1; }); return o; }
/* 단계마다 쓸 수 있는 '다른 점' — 1 없어짐·바뀜 · 3 새로 생김 · 4 크기 · 6 색 · 8 방향 */
var SD_NEW = { 3: 'add', 4: 'size', 6: 'color', 8: 'flip' };
function sdKinds(lv) { var k = ['gone', 'swap']; [3, 4, 6, 8].forEach(function (l) { if (lv >= l) k.push(SD_NEW[l]); }); return k; }
var SD_SAY = { gone: '없어졌어!', swap: '다른 그림이야!', add: '새로 생겼어!', size: '크기가 달라!', color: '색이 달라!', flip: '방향이 반대야!' };

/* 두 장면 만들기 — 칸 cols×rows 에 그림 items 개, 다른 점 diffs 곳. force 는 꼭 넣을 종류(다음 단계 맛보기) */
function sdMake(theme, cells, items, diffs, kinds, force, lv) {
  var pool = G.shuffle(theme.it.split(' ').filter(Boolean)), A = [], i;
  for (i = 0; i < cells; i++) A.push(null);
  G.sample(G.range(cells), Math.min(items, cells - 1)).forEach(function (k, n) {
    A[k] = { e: pool[n % pool.length], x: (Math.random() - 0.5) * 0.24, y: (Math.random() - 0.5) * 0.22, s: 1, hue: 0, flip: false };
  });
  var spare = pool.slice(items), Bm = A.map(function (o) { return o ? Object.assign({}, o) : null; });
  var SIZE = lv >= 9 ? 0.7 : lv >= 7 ? 0.62 : 0.55, HUE = lv >= 9 ? 100 : lv >= 8 ? 125 : 160;
  var plan = [];
  while (plan.length < diffs) plan = plan.concat(G.shuffle(kinds));
  plan = plan.slice(0, diffs);
  if (force && plan.indexOf(force) < 0) plan[plan.length - 1] = force;
  plan = G.shuffle(plan);
  var used = {}, out = [];
  function slotFor(kd) {
    var c = G.range(cells).filter(function (k) {
      if (used[k]) return false;
      if (kd === 'add') return !A[k];
      if (!A[k]) return false;
      if (kd === 'color') return !SD_NOCOLOR[A[k].e];
      if (kd === 'flip') return !!SD_FLIP[A[k].e];
      return true;
    });
    return c.length ? G.pick(c) : -1;
  }
  plan.forEach(function (kd) {
    var k = slotFor(kd);
    if (k < 0) { kd = 'swap'; k = slotFor(kd); }
    if (k < 0) return;
    used[k] = 1;
    var b = Bm[k];
    if (kd === 'gone') Bm[k] = null;
    else if (kd === 'add') Bm[k] = { e: spare.length ? spare.shift() : G.pick(pool), x: (Math.random() - 0.5) * 0.24, y: (Math.random() - 0.5) * 0.22, s: 1, hue: 0, flip: false };
    else if (kd === 'swap') {
      var near = lv >= 7 && SD_NEAR[b.e] && Math.random() < 0.75;
      b.e = near ? SD_NEAR[b.e] : spare.length ? spare.shift() : G.pick(pool.filter(function (x) { return x !== b.e; }));
    }
    else if (kd === 'size') b.s = SIZE;
    else if (kd === 'color') b.hue = HUE;
    else if (kd === 'flip') b.flip = true;
    out.push({ k: k, kind: kd, found: false, hinted: false });
  });
  return { A: A, B: Bm, diffs: out };
}

G.act({
  id: 'spotdiff', area: 'mind', title: '다른 곳 찾기', icon: '👀', order: 80, levels: 10, mins: 3, needs: [],
  ef: ['attend', 'wm'], domain: 'spatial',
  desc: '두 그림에서 달라진 곳 찾기',
  goal: '시공간 주의·시각 비교 — 두 장면의 같은 자리를 번갈아 맞대어 보며, 없어진 것·바뀐 것·새로 생긴 것·크기·색·방향의 차이를 알아차리는 힘',
  how: '"위 그림 왼쪽 위, 아래 그림 왼쪽 위" 하고 같은 자리를 손가락으로 짚으며 번갈아 보게 도와주세요. 찾으면 "무엇이 달라졌어?" 하고 말로 설명하게 하면 말하기도 함께 자라요. 1~2단계는 그림 너덧 개 속 두세 곳(없어짐·바뀜), 3단계부터 새로 생긴 것, 4단계 크기, 6단계 색, 8단계 좌우 방향이 더해지고, 10단계는 그림 열여섯 개 속 일곱 곳을 찾아요.',
  basis: '틀린그림찾기(시각 비교·변별) 과제 — 시공간 처리·시각 주의(K-WISC 시공간·지각추론 영역의 시각 변별 요소)',
  offline: '장난감 다섯 개를 줄 세워 두고 아이가 눈을 감은 사이 하나를 빼거나 바꾸기 — "뭐가 달라졌지?" 역할을 바꿔 아이가 바꾸고 부모가 맞혀요. 그림책 두 쪽을 펼쳐 같은 것·다른 것 찾기도 좋아요.',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level, st = G.clamp(ctx.step || 1, 1, 3);
    /* 그림 수·다른 곳 수는 칸마다 다음 단계 쪽으로 (ctx.tune). 새 종류(생김·크기·색·방향)는 2·3칸에서 한 곳씩 맛보기 */
    var ITEMS = ctx.tune([4, 6, 6, 8, 9, 10, 12, 13, 14, 16]);
    var DIFFS = ctx.tune([2, 3, 3, 3, 4, 4, 5, 5, 6, 7]);
    var IDLE = pace(ctx.tune([9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 18000, 20000]));
    var BOARDS = lv >= 8 ? 2 : 3;
    var kinds = sdKinds(lv), force = st >= 2 && lv < 10 ? SD_NEW[lv + 1] || null : null;
    B.innerHTML = '<div class="rx"><div class="rx-head sd-head"></div><div class="sd-wrap"><div class="sd-pane a"></div><div class="sd-pane b"></div></div></div>';
    var wrap = G.$('.rx', B), head = G.$('.sd-head', B), paneA = G.$('.sd-pane.a', B), paneB = G.$('.sd-pane.b', B);
    var themes = G.shuffle(SD_THEMES), bi = 0, data = null, cols = 3, rows = 2, idleH = null, misses = 0, busy = true;
    var clean = 0, foundAll = 0, falseTaps = 0;

    function fitFont() {
      var r = paneA.getBoundingClientRect(), cw = r.width / cols, ch = r.height / rows;
      var fs = Math.max(24, Math.min(72, Math.min(cw, ch) * 0.6));
      paneA.style.setProperty('--fs', fs + 'px'); paneB.style.setProperty('--fs', fs + 'px');
    }
    function render(pane, list, tag) {
      pane.innerHTML = '<span class="sd-tag">' + tag + '</span>';
      for (var k = 0; k < cols * rows; k++) {
        var c = k % cols, r = Math.floor(k / cols), o = list[k];
        var s = G.el('<div class="sd-slot"></div>'); s.dataset.k = k;
        s.style.left = (c / cols * 100) + '%'; s.style.top = (r / rows * 100) + '%';
        s.style.width = (100 / cols) + '%'; s.style.height = (100 / rows) + '%';
        if (o) {
          var it = G.el('<span class="sd-it"></span>'); it.textContent = o.e;
          it.style.left = (50 + o.x * 100) + '%'; it.style.top = (50 + o.y * 100) + '%';
          it.style.transform = 'translate(-50%,-50%) scale(' + (o.flip ? -o.s : o.s) + ',' + o.s + ')';
          if (o.hue) it.style.filter = 'hue-rotate(' + o.hue + 'deg) saturate(1.25)';
          s.appendChild(it);
        }
        s.addEventListener('pointerdown', onTap);
        pane.appendChild(s);
      }
      pane.style.background = themes[bi % themes.length].bg;
    }
    function slots(k) { return [G.$('.sd-slot[data-k="' + k + '"]', paneA), G.$('.sd-slot[data-k="' + k + '"]', paneB)]; }
    function count() {
      var n = data.diffs.length, f = data.diffs.filter(function (d) { return d.found; }).length;
      head.innerHTML = '🔍 다른 곳 <b>' + f + '</b> / ' + n + ' <span class="sd-dots">' + data.diffs.map(function (d) { return d.found ? '🟢' : '⚪'; }).join('') + '</span>';
    }
    function board() {
      var r = paneA.getBoundingClientRect(), want = Math.max(ITEMS + 2, Math.ceil(ITEMS * 1.3));
      cols = G.clamp(Math.round(Math.sqrt(want * r.width / Math.max(r.height, 1))), 2, 7);
      rows = Math.max(2, Math.ceil(want / cols));
      data = sdMake(themes[bi % themes.length], cols * rows, ITEMS, DIFFS, kinds, force, lv);
      var land = r.width > 0 && paneA.offsetTop === paneB.offsetTop;
      render(paneA, data.A, land ? '왼쪽' : '위'); render(paneB, data.B, land ? '오른쪽' : '아래');
      fitFont(); count(); misses = 0;
      var n = data.diffs.length;
      busy = false; idle();
      ctx.say(bi === 0 ? '두 그림을 잘 비교해 봐. 다른 곳 ' + n + '군데를 찾아 줘!' : themes[bi % themes.length].n + ' 그림이야. 다른 곳 ' + n + '군데!');
    }
    function idle() {
      clearTimeout(idleH);
      idleH = ctx.timeout(function () { if (!busy) hint('천천히 같은 자리를 번갈아 봐. 여기 수상한데?'); }, IDLE);
    }
    function hint(line) {
      var left = data.diffs.filter(function (d) { return !d.found; });
      if (!left.length) return;
      var d = left[0]; d.hinted = true;
      slots(d.k).forEach(function (s) { G.ui.hint(s); });
      ctx.bubble(line); idle();
    }
    function onTap(e) {
      e.preventDefault();
      if (busy) return;
      var k = +e.currentTarget.dataset.k, d = data.diffs.filter(function (x) { return x.k === k; })[0];
      idle();
      if (d) {
        if (d.found) return;
        d.found = true; foundAll++;
        var ok = !d.hinted && misses < 2;
        ctx.trial(ok); if (ok) clean++;
        misses = 0;
        var ss = slots(k); ss.forEach(function (s) { s.classList.add('got'); });
        G.sfx.tone(523 * Math.pow(1.12, foundAll % 8), 0.18, 'triangle', 0.26); G.buzz(10);
        var c = G.fx.center(ss[1]); G.fx.burst(c[0], c[1]);
        floatText(wrap, SD_SAY[d.kind] || G.pick(FAST), ss[1]);
        count();
        if (data.diffs.every(function (x) { return x.found; })) { busy = true; clearTimeout(idleH); done(); }
        return;
      }
      /* 같은 곳을 눌렀을 때 — 흔들고 다시 보기 (세지 않는 빈칸은 조용히) */
      var has = data.A[k] || data.B[k];
      if (!has) { G.sfx.play('tap'); return; }
      misses++; falseTaps++;
      G.sfx.play('oops'); slots(k).forEach(function (s) { G.ui.wiggle(s); });
      if (misses >= 2) hint('여기는 두 그림이 똑같아. 반짝이는 곳을 비교해 봐!');
      else ctx.bubble('음~ 거기는 두 그림이 똑같아. 다시 비교해 봐!');
    }
    function done() {
      bi++; prog(ctx, bi, BOARDS);
      ctx.extra.score = clean; ctx.extra.found = foundAll; ctx.extra.falseTaps = falseTaps;
      ctx.cheer(G.pick(['다 찾았다! 눈이 정말 밝은데?', '하나도 안 빠뜨렸어! 관찰력 최고!', '완벽해! 탐정 실력이야!'])).then(function () {
        if (bi >= BOARDS) { ctx.finish({ msg: '다른 곳을 ' + foundAll + '군데나 찾았어! 눈썰미 대장이다!' }); return; }
        requestAnimationFrame(board);
      });
    }
    ctx.on(window, 'resize', function () { if (data) fitFont(); });
    prog(ctx, 0, BOARDS);
    head.innerHTML = '🔍 다른 곳 찾기';
    ctx.say(lv <= 2 ? '두 그림이 거의 똑같아요. 그런데 조금 다른 곳이 있어! 다른 곳을 콕 눌러 줘.' : '탐정 미션! 두 그림에서 달라진 곳을 모두 찾아 줘.').then(function () { requestAnimationFrame(board); });
  }
});

/* ===========================================================
   2. 방금 본 그림? — 작업기억 (n-back)
   =========================================================== */
var NB_PICS = ['🍎', '🐶', '🚗', '⭐', '🎈', '🐟', '🌸', '⚽', '🍌', '🐱', '🚀', '🍩'];
/* 카드 차례 만들기 — len 장, n 장 전과 비교. 같은 카드(target) nT 장, 헷갈리는 카드(바로 전과 같지만 n 장 전과 다름) nL 장 */
function nbSeq(len, n, pics, nT, nL) {
  var pos = G.range(len).slice(n), T = {}, L = {}, k;
  /* 같은 카드는 세 장 연달아 오지 않게 */
  for (var t = 0; t < 50; t++) {
    T = {}; G.sample(pos, nT).forEach(function (i) { T[i] = 1; });
    var run = 0, okRun = true;
    for (k = 0; k < len; k++) { run = T[k] ? run + 1 : 0; if (run > 2) okRun = false; }
    if (okRun) break;
  }
  if (n >= 2 && nL > 0) G.sample(pos.filter(function (i) { return !T[i]; }), nL).forEach(function (i) { L[i] = 1; });
  var seq = [];
  for (k = 0; k < len; k++) {
    var back = k >= n ? seq[k - n].e : null, prev = k >= 1 ? seq[k - 1].e : null, e;
    if (T[k]) e = back;
    else if (L[k] && prev && prev !== back) e = prev;
    else {
      var opts = pics.filter(function (p) { return p !== back && p !== prev && (k < 2 || p !== seq[k - 2].e); });
      if (!opts.length) opts = pics.filter(function (p) { return p !== back && p !== prev; });
      if (!opts.length) opts = pics.filter(function (p) { return p !== back; });
      e = G.pick(opts);
    }
    seq.push({ e: e, t: k >= n && e === back, lure: !!L[k] && e === prev && e !== back });
  }
  return seq;
}
G.act({
  id: 'nback', area: 'brain', title: '방금 본 그림?', icon: '🎴', order: 20, levels: 10, mins: 2, needs: [],
  ef: ['wm', 'attend', 'inhibit'], domain: 'memory',
  desc: '방금 본 그림과 같으면 같아!',
  goal: '작업기억 갱신 — 본 그림을 머릿속에 잠깐 담아 두고, 새 그림이 올 때마다 기억을 바꿔 가며 비교하는 힘(바로 전 그림 → 두 장 전 그림)',
  how: '처음엔 부모가 그림 이름을 작게 같이 말해 주면("사과… 강아지… 강아지!") 기억하기 쉬워요. 놓쳐도 괜찮다고, 다를 때 잘 참고 안 누른 것도 칭찬해 주세요. 1~3단계는 바로 전 그림(1-back), 4단계부터 두 장 전 그림(2-back)과 비교해요. 1·4단계는 지난 그림이 흐리게 보이다가 칸이 오를수록 사라지고, 6단계부터 헷갈리게 하는 그림(바로 전 그림과 같은 것)이 섞이며, 10단계는 그림 여덟 가지가 1.6초씩 지나가요.',
  basis: 'n-back 작업기억 과제(Kirchner, 1958 · 아동용 1-back·2-back) — 기억력(작업기억) 영역',
  offline: '그림 카드를 한 장씩 넘기며 "방금 거랑 같으면 손뼉!" 놀이. 익숙해지면 "두 장 전이랑 같으면 손뼉!" 차 안에서 지나가는 차 색깔로 해도 좋아요.',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level, st = G.clamp(ctx.step || 1, 1, 3);
    /* 그림 가짓수·카드 수·보여 주는 시간·헷갈리는 카드 — 칸마다 다음 단계 쪽으로 */
    var POOL = ctx.tune([3, 4, 5, 4, 5, 6, 6, 7, 8, 8]);
    var LEN = ctx.tune([10, 12, 13, 12, 13, 14, 15, 16, 17, 18]);
    var SHOW = ctx.tune([2400, 2200, 2000, 2600, 2400, 2200, 2000, 1900, 1750, 1600]);
    var GAP = ctx.tune([800, 750, 700, 800, 750, 700, 650, 600, 550, 500]);
    var LURE = ctx.tune([0, 0, 0, 0, 0, 1, 2, 2, 3, 3]);
    /* 2-back 으로 바뀌는 3→4 사이는 시간이 늘어나는 쪽이라 3단계 칸은 3단계 값으로 */
    if (lv === 3) { SHOW = 2000 - (st - 1) * 80; GAP = 700; }
    var N = lv >= 4 ? 2 : 1, FADE = [0.6, 0.38, 0.18][st - 1];
    /* 두 묶음. 3단계 3칸은 둘째 묶음이 두 장 전 비교(4단계 맛보기, 지난 그림이 흐리게 보인다) */
    var blocks = [{ n: N, trail: N === 1 ? (lv === 1 ? FADE : 0) : (lv === 4 ? FADE : 0) }];
    if (lv === 3 && st === 3) blocks.push({ n: 2, trail: 0.6, pool: 4, len: 12, show: 2600, gap: 800, preview: true });
    else blocks.push({ n: N, trail: blocks[0].trail });
    B.innerHTML = '<div class="rx"><div class="rx-head nb-rule"></div><div class="nb-trail"></div><div class="nb-card blank"></div>' +
      '<button class="btn big nb-same" type="button">👯 같아!</button></div>';
    var wrap = G.$('.rx', B), rule = G.$('.nb-rule', B), trailBox = G.$('.nb-trail', B), card = G.$('.nb-card', B), btn = G.$('.nb-same', B);
    var press = null, hits = 0, cr = 0, miss = 0, fa = 0, total = 0, done = 0;
    var cardsAll = blocks.reduce(function (s, b) { return s + (b.len || LEN); }, 0);
    btn.addEventListener('pointerdown', function (e) { e.preventDefault(); if (press) press(); else G.sfx.play('tap'); });

    function setRule(n) {
      rule.innerHTML = n === 1 ? '👀 <b>바로 전</b> 그림과 같으면 「같아!」' : '✌️ <b>두 장 전</b> 그림과 같으면 「같아!」';
    }
    function drawTrail(hist, n, op) {
      /* 지난 카드: 가장 오래된 것이 왼쪽. 비교할 카드(n 장 전)는 점선 테두리 */
      trailBox.innerHTML = '';
      for (var j = n; j >= 1; j--) {
        var e = hist.length >= j ? hist[hist.length - j] : '';
        var c = G.el('<div class="nb-tc' + (j === n ? ' key' : '') + '"><span></span><small>' + (j === 1 ? '방금' : j + '장 전') + '</small></div>');
        var sp = c.querySelector('span'); sp.textContent = e; sp.style.opacity = op;
        trailBox.appendChild(c);
      }
    }
    function showCard(e) { card.className = 'nb-card'; void card.offsetWidth; card.classList.add('show'); card.textContent = e; G.sfx.play('whoosh'); }
    function blankCard() { card.className = 'nb-card blank'; card.textContent = ''; }
    /* 연습: 같은 그림이 나오면 같아! — 누를 때까지(또는 잠시 뒤 자비스가 대신) 기다린다. 세지 않는다 */
    function demo(n, pics) {
      var a = pics[0], b = pics[1], seq = n === 1 ? [b, a, a] : [a, b, a], hist = [];
      return ctx.say(n === 1 ? '연습해 볼까? 바로 전 그림과 똑같은 그림이 나오면 같아를 눌러요.' : '이번엔 두 장 전 그림과 비교해요. 하나 건너 똑같으면 같아!').then(function () {
        var i = 0;
        return new Promise(function (ok) {
          function next() {
            if (i < seq.length - 1) {
              drawTrail(hist, n, 0.6); showCard(seq[i]); hist.push(seq[i]); i++;
              ctx.timeout(function () { blankCard(); ctx.timeout(next, pace(500)); }, pace(1500));
              return;
            }
            drawTrail(hist, n, 0.6); showCard(seq[i]); card.classList.add('yes');
            var key = trailBox.querySelector('.nb-tc.key'); if (key) G.ui.hint(key);
            btn.classList.add('pulse'); ctx.bubble('똑같은 그림이야! 같아!를 눌러 봐.');
            var fin = function (self) {
              if (!press) return; press = null; btn.classList.remove('pulse');
              if (self) { G.sfx.play('good'); btn.classList.add('ok'); } else G.ui.hint(btn);
              ctx.bubble(self ? '그거야! 이렇게 누르면 돼.' : '이렇게 누르면 돼!');
              ctx.timeout(function () { btn.classList.remove('ok'); blankCard(); trailBox.innerHTML = ''; ok(); }, pace(1300));
            };
            press = function () { fin(true); };
            ctx.timeout(function () { fin(false); }, pace(9000));
          }
          next();
        });
      });
    }
    function runBlock(b, bi) {
      var n = b.n, pics = G.sample(NB_PICS, b.pool || POOL), len = b.len || LEN, show = pace(b.show || SHOW), gap = pace(b.gap || GAP);
      var nT = Math.max(2, Math.round((len - n) * 0.33)), seq = nbSeq(len, n, pics, nT, b.preview ? 0 : LURE), hist = [];
      setRule(n);
      var intro = bi === 0 ? null : b.preview ? ['✌️', '새 도전!', '이번엔 두 장 전 그림과 같으면 같아!'] : ['🎴', '한 번 더!', n === 1 ? '바로 전 그림과 같으면 같아!' : '두 장 전 그림과 같으면 같아!'];
      var start = intro ? announce(ctx, wrap, intro[0], intro[1], intro[2]) : Promise.resolve();
      if (b.preview || (bi === 0 && (lv === 1 || lv === 4) && st === 1)) start = start.then(function () { return demo(n, pics); });
      return start.then(function () {
        return new Promise(function (ok) {
          var i = 0;
          function card1() {
            if (i >= len) { press = null; trailBox.innerHTML = ''; ok(); return; }
            var c = seq[i], pressed = false;
            drawTrail(hist, n, b.trail);
            showCard(c.e); if (i < n) card.classList.add('remember');
            press = function () {
              if (pressed) return; pressed = true;
              if (i < n) { ctx.bubble('아직 비교할 그림이 없어. 먼저 기억해 줘!'); return; }
              if (c.t) {
                hits++; total++; ctx.trial(true);
                G.sfx.play('good'); G.buzz(15); btn.classList.add('ok'); card.classList.add('yes');
                var cc = G.fx.center(card); G.fx.burst(cc[0], cc[1]);
                ctx.bubble(G.pick(FAST));
              } else {
                fa++; total++; ctx.trial(false);
                G.sfx.play('oops'); G.ui.wiggle(card);
                ctx.bubble(c.lure ? '앗, 바로 전 그림이랑 같았지? 두 장 전이랑은 달랐어!' : '음~ 이번엔 달랐어. 같을 때만 눌러요!');
              }
            };
            ctx.timeout(function () {
              blankCard();
              ctx.timeout(function () {
                var extra = 0;
                btn.classList.remove('ok');
                if (!pressed && i >= n) {
                  total++;
                  if (c.t) {
                    /* 놓친 같은 카드 — 단추가 반짝이고 무엇과 같았는지 알려 준다 */
                    miss++; ctx.trial(false); extra = 700;
                    G.ui.hint(btn); var key = trailBox.querySelector('.nb-tc.key'); if (key) G.ui.hint(key);
                    ctx.bubble(n === 1 ? '방금 그림이랑 같았어! 다음엔 같아!' : '두 장 전 그림이랑 같았어! 다음엔 같아!');
                  } else { cr++; ctx.trial(true); }
                }
                hist.push(c.e); i++; done++; prog(ctx, done, cardsAll);
                ctx.timeout(card1, extra);
              }, gap);
            }, show);
          }
          card1();
        });
      });
    }
    function finish() {
      ctx.extra.score = hits + cr; ctx.extra.hits = hits; ctx.extra.miss = miss; ctx.extra.fa = fa; ctx.extra.n = N;
      ctx.finish({ msg: '같은 그림을 ' + hits + '번 잡아냈어! 기억 레이더 최고야!' });
    }
    setRule(N); prog(ctx, 0, cardsAll);
    ctx.say(N === 1 ? '그림 카드가 한 장씩 나와요. 바로 전 그림과 똑같으면 같아!를 눌러 줘.' : '기억 미션! 두 장 전 그림과 똑같으면 같아!를 눌러 줘.')
      .then(function () { return runBlock(blocks[0], 0); })
      .then(function () { return runBlock(blocks[1], 1); })
      .then(finish);
  }
});

/* ===========================================================
   3. 번개 찾기 — 처리 속도 (Symbol Search·Coding 형식)
   =========================================================== */
var QK_SH = {
  circle: '<circle cx="50" cy="50" r="38"/>',
  square: '<rect x="15" y="15" width="70" height="70" rx="8"/>',
  tri: '<path d="M50 10 L91 86 H9 Z"/>',
  diamond: '<path d="M50 6 L92 50 L50 94 L8 50 Z"/>',
  star: '<path d="M50 6 L61.8 36.2 L94 38.2 L69 58.8 L77.2 90.2 L50 72.6 L22.8 90.2 L31 58.8 L6 38.2 L38.2 36.2 Z"/>',
  heart: '<path d="M50 90 C18 68 6 50 10 31 C14 13 38 9 50 27 C62 9 86 13 90 31 C94 50 82 68 50 90 Z"/>',
  plus: '<path d="M37 8 H63 V37 H92 V63 H63 V92 H37 V63 H8 V37 H37 Z"/>',
  moon: '<path d="M64 8 A44 44 0 1 0 64 92 A36 36 0 0 1 64 8 Z"/>',
  hex: '<path d="M28 10 H72 L94 50 L72 90 H28 L6 50 Z"/>',
  ring: '<path fill-rule="evenodd" d="M50 10 A40 40 0 1 1 49.9 10 Z M50 30 A20 20 0 1 0 50.1 30 Z"/>',
  arrow: '<path d="M8 36 H54 V14 L94 50 L54 86 V64 H8 Z"/>',
  half: '<path d="M6 68 A44 44 0 0 1 94 68 Z"/>',
  ell: '<path d="M18 8 H44 V64 H84 V92 H18 Z"/>',
  bolt: '<path d="M60 4 L16 56 H44 L36 96 L84 38 H56 Z"/>',
  flag: '<path d="M18 6 H30 V94 H18 Z M30 10 H86 L72 30 L86 50 H30 Z"/>'
};
var QK_COL = { circle: '#ef5350', square: '#42a5f5', tri: '#43a047', diamond: '#26c6da', star: '#ffb300', heart: '#ec407a', plus: '#7e57c2', moon: '#fb8c00',
  hex: '#8d6e63', ring: '#5c6bc0', arrow: '#26a69a', half: '#f4511e', ell: '#7cb342', bolt: '#fdd835', flag: '#ab47bc' };
var QK_BASIC = ['circle', 'square', 'tri', 'star', 'heart', 'plus', 'moon', 'diamond'];
var QK_ALL = QK_BASIC.concat(['hex', 'ring', 'arrow', 'half', 'ell', 'bolt', 'flag']);
/* 뒤집으면 닮은 모양 (8단계부터 섞인다): ~f 좌우 뒤집기, ~r 거꾸로 */
var QK_LURE = { tri: '~r', arrow: '~f', moon: '~f', half: '~r', ell: '~f', bolt: '~f', flag: '~f', heart: '~r' };
function qkSVG(id, mono) {
  var p = id.split('~'), s = p[0], tf = p[1] === 'f' ? ' transform="translate(100 0) scale(-1 1)"' : p[1] === 'r' ? ' transform="rotate(180 50 50)"' : '';
  var col = mono ? 'var(--ink)' : QK_COL[s];
  return '<svg class="qk-s" viewBox="0 0 100 100" aria-hidden="true"><g fill="' + col + '"' + tf + '>' + QK_SH[s] + '</g></svg>';
}
/* 단계 표 — 1~3 줄에서 콕 누르기 · 4~ 있어/없어 · 5~ 색 도움 없음 · 7~ 찾을 모양 둘 · 8~ 뒤집힌 닮은 모양 */
var QK = {
  mode: ['tap', 'tap', 'tap', 'yn', 'yn', 'yn', 'yn', 'yn', 'yn', 'yn'],
  T:    [1, 1, 1, 1, 1, 1, 2, 2, 2, 2],
  K:    [3, 4, 5, 3, 4, 5, 4, 4, 5, 5],
  lure: [0, 0, 0, 0, 0, 0, 0, 1, 1, 2],
  mono: [0, 0, 0, 0, 1, 1, 1, 1, 1, 1],
  pool: [8, 8, 8, 8, 10, 12, 15, 15, 15, 15],
  W:    [6000, 5000, 4500, 5500, 5000, 4500, 5000, 5000, 4500, 4000],
  N:    [10, 12, 14, 14, 16, 16, 16, 18, 18, 20]
};
function qkCfg(L) { var i = L - 1; return { mode: QK.mode[i], T: QK.T[i], K: QK.K[i], lure: QK.lure[i], mono: !!QK.mono[i], pool: QK_ALL.slice(0, QK.pool[i]) }; }
/* 한 문제: 찾을 모양 targets, 줄 row, 답(있음/없음 또는 줄의 자리) */
function qkItem(cf) {
  /* 닮은 모양 단계는 찾을 모양 하나를 뒤집으면 닮는 모양에서 고른다 */
  var tg = cf.lure ? [G.pick(cf.pool.filter(function (s) { return QK_LURE[s]; }))] : [];
  tg = tg.concat(G.sample(cf.pool.filter(function (s) { return tg.indexOf(s) < 0; }), cf.T - tg.length));
  var others = cf.pool.filter(function (s) { return tg.indexOf(s) < 0; });
  var lures = cf.lure ? tg.filter(function (s) { return QK_LURE[s]; }).map(function (s) { return s + QK_LURE[s]; }) : [];
  if (cf.mode === 'tap') {
    var row = G.sample(others, cf.K - 1), at = rint(0, cf.K - 1);
    row.splice(at, 0, tg[0]);
    return { tg: tg, row: row, at: at };
  }
  var yes = Math.random() < 0.5, k = cf.K, rowY = [];
  if (yes) rowY.push(G.pick(tg));
  /* 닮은 모양(뒤집힌 것)을 한두 개 섞는다 — 꼼꼼히 봐야 한다 */
  if (lures.length) G.sample(lures, Math.min(lures.length, cf.lure, k - rowY.length)).forEach(function (l) { if (Math.random() < 0.8) rowY.push(l); });
  rowY = rowY.concat(G.sample(others, k - rowY.length));
  return { tg: tg, row: G.shuffle(rowY), yes: yes };
}
G.act({
  id: 'quick', area: 'brain', title: '번개 찾기', icon: '⚡', order: 22, levels: 10, mins: 2, needs: [],
  ef: ['attend', 'inhibit'], domain: 'speed',
  desc: '같은 모양을 번개처럼 찾기',
  goal: '처리 속도 — 간단한 모양을 빠르고 정확하게 비교해서 찾아내는 힘(정확하게 먼저, 그다음 조금씩 빠르게)',
  how: '빠르기보다 정확하게가 먼저예요. 시간이 지나도 실패가 아니라 "다음 번개!"로 넘어가요. 1~3단계는 줄에서 같은 모양을 콕 누르고, 4단계부터는 줄에 같은 모양이 "있어/없어"를 골라요. 5단계부터 색 도움이 없어지고, 7단계부터 찾을 모양이 두 개, 8단계부터 뒤집힌 닮은 모양이 섞여요. 한 줄에 주는 시간은 1단계 6초에서 10단계 4초까지 조금씩 줄어요.',
  basis: 'Symbol Search(동형 찾기)·Coding 처리속도 과제 형식 — 정해진 시간 안의 정확한 반응 수',
  offline: '광고지나 신문에서 1분 동안 "ㅇ" 자 모두 동그라미 치기, 자동차 번호판에서 7 찾기, 카드 더미에서 하트만 빨리 골라내기. 할 때마다 찾은 개수를 적어 지난번의 나와 비교해요.',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level, st = G.clamp(ctx.step || 1, 1, 3);
    var N = ctx.tune(QK.N), W = ctx.tune(QK.W);
    /* 다음 단계에서 규칙이 바뀌며 시간이 늘어나는 곳(3·6단계)은 이 단계 안에서만 조금씩 줄인다 */
    if (lv < 10 && QK.W[lv] > QK.W[lv - 1]) W = QK.W[lv - 1] - (st - 1) * 200;
    var cur = qkCfg(lv), nxt = lv < 10 ? qkCfg(lv + 1) : null;
    /* 2·3칸: 마지막 2·4문제는 다음 단계 문제(새 규칙 맛보기) */
    var PREV = nxt ? (st - 1) * 2 : 0;
    B.innerHTML = '<div class="rx"><div class="rx-head qk-head"></div><div class="qk-bar"><b></b></div><div class="qk-main"><div class="qk-tg"></div><div class="qk-row"></div><div class="qk-yn" hidden>' +
      '<button class="yes" type="button"><span>🙆</span>있어!</button><button class="no" type="button"><span>🙅</span>없어!</button></div></div></div>';
    var wrap = G.$('.rx', B), head = G.$('.qk-head', B), bar = G.$('.qk-bar b', B), tgBox = G.$('.qk-tg', B), rowBox = G.$('.qk-row', B), yn = G.$('.qk-yn', B);
    var yBtn = G.$('.qk-yn .yes', B), nBtn = G.$('.qk-yn .no', B);
    var i = 0, score = 0, open = false, item = null, cf = cur, t0 = 0, timer = null, rts = [], lastSig = '';
    function sig(c) { return [c.mode, c.T, c.lure, c.mono].join(); }
    function headTxt() { head.innerHTML = '⚡ 번개 <b>' + score + '</b> <span class="dim">· ' + Math.min(i + 1, N) + '/' + N + '</span>'; }
    function runBar(ms) {
      bar.style.transition = 'none'; bar.style.width = '100%'; void bar.offsetWidth;
      bar.style.transition = 'width ' + ms + 'ms linear'; bar.style.width = '0%';
    }
    function stopBar() { var w = bar.getBoundingClientRect().width / Math.max(1, bar.parentNode.getBoundingClientRect().width) * 100; bar.style.transition = 'none'; bar.style.width = w + '%'; }
    function show() {
      if (i >= N) { end(); return; }
      cf = i >= N - PREV ? nxt : cur;
      if (lastSig && sig(cf) !== lastSig) {
        /* 규칙이 바뀌는 문제(다음 단계 맛보기) — 한 번 알려 준다 */
        var was = cur;
        lastSig = sig(cf);
        announce(ctx, wrap, '🆕', '새 번개 규칙!', cf.mode !== was.mode ? '줄에 같은 모양이 있으면 있어, 없으면 없어!' :
          cf.T > was.T ? '이제 찾을 모양이 두 개! 하나라도 있으면 있어!' : cf.lure && !was.lure ? '뒤집힌 닮은 모양은 다른 모양이야!' : '이제 색 도움 없이 모양만 보고 찾아!').then(show);
        return;
      }
      lastSig = sig(cf);
      item = qkItem(cf); headTxt();
      tgBox.innerHTML = '<small>찾을<br>모양</small>' + item.tg.map(function (s) { return qkSVG(s, cf.mono); }).join('');
      rowBox.style.setProperty('--k', item.row.length);
      rowBox.innerHTML = '';
      item.row.forEach(function (s, k) {
        var c = G.el(cf.mode === 'tap' ? '<button class="qk-c" type="button"></button>' : '<div class="qk-c"></div>');
        c.innerHTML = qkSVG(s, cf.mono);
        if (cf.mode === 'tap') c.addEventListener('pointerdown', function (e) { e.preventDefault(); answer(k, c); });
        rowBox.appendChild(c);
      });
      yn.hidden = cf.mode !== 'yn';
      G.$$('.qk-yn button', B).forEach(function (b) { b.classList.remove('got', 'hint'); });
      open = true; t0 = Date.now();
      var w = pace(W) + (cf.T > 1 ? 400 : 0);
      runBar(w);
      timer = ctx.timeout(timeUp, w);
    }
    function rightEl() {
      if (cf.mode === 'tap') return rowBox.children[item.at];
      return item.yes ? yBtn : nBtn;
    }
    function answer(k, el) {
      if (!open) return;
      open = false; clearTimeout(timer); stopBar();
      var ok = cf.mode === 'tap' ? k === item.at : k === item.yes;
      ctx.trial(ok);
      if (ok) {
        score++; rts.push(Date.now() - t0);
        el.classList.add('got'); G.sfx.tone(660 + Math.min(score, 20) * 20, 0.12, 'triangle', 0.25); G.buzz(10);
        var c = G.fx.center(el); G.fx.burst(c[0], c[1], ['⚡', '✨']);
        ctx.bubble(G.pick(FAST));
        headTxt();
        ctx.timeout(next, pace(450));
      } else {
        G.sfx.play('oops'); G.ui.wiggle(el); G.ui.hint(rightEl());
        if (cf.mode === 'tap') ctx.bubble('음~ 반짝이는 게 같은 모양이야!');
        else ctx.bubble(item.yes ? '잘 봐! 줄 안에 같은 모양이 숨어 있었어.' : (cf.lure ? '닮았지만 뒤집힌 모양이야. 이번엔 없어!' : '이번 줄엔 같은 모양이 없었어!'));
        if (item.yes && cf.mode === 'yn') markYes();
        ctx.timeout(next, pace(1500));
      }
    }
    /* 있었는데 놓쳤으면 줄에서 그 모양을 보여 준다 */
    function markYes() {
      G.$$('.qk-c', rowBox).forEach(function (c, k) { if (item.tg.indexOf(item.row[k]) >= 0) c.classList.add('got'); });
    }
    function timeUp() {
      if (!open) return; open = false;
      ctx.trial(false);
      G.ui.hint(rightEl()); if (item.yes && cf.mode === 'yn') markYes();
      ctx.bubble('괜찮아, 다음 번개!');
      ctx.timeout(next, pace(1300));
    }
    function next() { i++; prog(ctx, i, N); show(); }
    function end() {
      ctx.extra.score = score;
      if (rts.length) ctx.extra.ms = Math.round(rts.reduce(function (a, b) { return a + b; }, 0) / rts.length);
      ctx.finish({ msg: '번개 ' + score + '개! 눈이 번개처럼 빨라졌어!' });
    }
    yBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); answer(true, yBtn); });
    nBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); answer(false, nBtn); });
    headTxt(); prog(ctx, 0, N);
    var intro = cur.mode === 'tap' ? '번개 미션! 위의 모양과 똑같은 모양을 줄에서 빨리 콕 눌러 줘.' :
      cur.T > 1 ? '번개 미션! 찾을 모양 두 개 중에 하나라도 줄에 있으면 있어, 하나도 없으면 없어!' : '번개 미션! 줄에 같은 모양이 있으면 있어, 없으면 없어를 눌러 줘.';
    if (cur.lure) intro += ' 뒤집힌 닮은 모양은 다른 모양이야!';
    ctx.say(intro + ' 정확하게, 그리고 빠르게!').then(show);
  }
});

/* ===========================================================
   4. 숫자 탑 쌓기 — 수 추론 (수 피라미드·수 패턴)
   =========================================================== */
/* 탑: 아래층 수 B 개, 빈칸 K 개, 규칙(sum 더하기로만 · any 빼기도 · base 맨 아래 칸도 비운다), 위 수 최대 MAX */
var NT = {
  B:     [2, 2, 2, 3, 3, 3, 3, 4, 4, 4],
  K:     [1, 1, 1, 1, 1, 2, 2, 2, 3, 3],
  rule:  ['sum', 'sum', 'any', 'sum', 'any', 'any', 'any', 'any', 'any', 'base'],
  MAX:   [5, 10, 10, 20, 20, 30, 40, 50, 70, 100],
  opts:  [3, 3, 3, 4, 4, 4, 4, 4, 4, 4],
  items: [5, 6, 6, 6, 6, 5, 6, 6, 5, 5],
  pat:   [0, 0, 0, 0, 0, 0, 2, 2, 2, 2]   /* 7단계부터 수 패턴 문제 */
};
var NT_COL = ['#ffd27a', '#ffc4a8', '#c7e7a8', '#b9dcff', '#e3cdfc'];
function ntRows(B, MAX) {
  var lo = Math.max(B === 2 ? 2 : 6, Math.round(MAX * 0.45)), cap = B === 2 ? MAX - 1 : B === 3 ? Math.floor(MAX / 2.5) : Math.floor(MAX / 5);
  for (var t = 0; t < 600; t++) {
    var base = []; for (var i = 0; i < B; i++) base.push(rint(1, Math.max(1, cap)));
    var rows = [base];
    while (rows[0].length > 1) { var r = rows[0], up = []; for (var j = 0; j < r.length - 1; j++) up.push(r[j] + r[j + 1]); rows.unshift(up); }
    if (rows[0][0] <= MAX && rows[0][0] >= lo) return rows;
  }
  var ones = []; for (var k = 0; k < B; k++) ones.push(1);
  var rr = [ones]; while (rr[0].length > 1) { var a = rr[0], u = []; for (var m = 0; m < a.length - 1; m++) u.push(a[m] + a[m + 1]); rr.unshift(u); }
  return rr;
}
/* 빈칸을 차례대로 풀 수 있는지 — 풀 수 있으면 푸는 차례(어떻게 구하는지 포함)를 돌려준다 */
function ntSolve(rows, holes, sumOnly) {
  var known = rows.map(function (r) { return r.map(function () { return true; }); });
  holes.forEach(function (h) { known[h[0]][h[1]] = false; });
  var left = holes.slice(), order = [];
  while (left.length) {
    var found = -1, info = null;
    for (var k = 0; k < left.length; k++) {
      var r = left[k][0], i = left[k][1];
      if (r + 1 < rows.length && known[r + 1][i] && known[r + 1][i + 1]) { info = { how: 'sum', a: [r + 1, i], b: [r + 1, i + 1] }; found = k; break; }
      if (sumOnly) continue;
      if (r > 0 && i > 0 && known[r - 1][i - 1] && known[r][i - 1]) { info = { how: 'diff', a: [r - 1, i - 1], b: [r, i - 1] }; found = k; break; }
      if (r > 0 && i < r && known[r - 1][i] && known[r][i + 1]) { info = { how: 'diff', a: [r - 1, i], b: [r, i + 1] }; found = k; break; }
    }
    if (found < 0) return null;
    var h = left.splice(found, 1)[0]; known[h[0]][h[1]] = true;
    info.r = h[0]; info.i = h[1]; info.v = rows[h[0]][h[1]]; order.push(info);
  }
  return order;
}
function ntTower(spec) {
  for (var t = 0; t < 60; t++) {
    var rows = ntRows(spec.B, spec.max), cells = [];
    rows.forEach(function (r, ri) { r.forEach(function (v, i) { cells.push([ri, i]); }); });
    var baseRow = rows.length - 1;
    for (var u = 0; u < 120; u++) {
      var pick = G.sample(cells, spec.K);
      if (spec.rule === 'sum' && pick.some(function (c) { return c[0] === baseRow; })) continue;
      if (spec.rule === 'base' && !pick.some(function (c) { return c[0] === baseRow; })) continue;
      var order = ntSolve(rows, pick, spec.rule === 'sum');
      if (order) return { rows: rows, order: order };
    }
  }
  return { rows: [[2], [1, 1]], order: [{ how: 'sum', a: [1, 0], b: [1, 1], r: 0, i: 0, v: 2 }] };
}
/* 수 패턴: 7단계 +1·+2·+5·+10 / 8단계 빼기도·가운데 빈칸 / 9단계 +3·+4·×2 / 10단계 늘어나는 뛰기·번갈아 뛰기 */
function ntPattern(L, max) {
  max = Math.max(max, 30);
  for (var t = 0; t < 200; t++) {
    var len = L >= 9 ? 6 : 5, kind = 'add', d = 0, a = 0, b = 0, seq = [], jumps = [], s, k;
    if (L <= 7) d = G.pick([1, 2, 5, 10]);
    else if (L === 8) d = G.pick([2, 5, 10, -1, -2, -5, -10]);
    else if (L === 9) { kind = G.pick(['add', 'add', 'mul']); d = G.pick([3, 4, -3, 6]); }
    else { kind = G.pick(['grow', 'alt', 'mul', 'add']); d = G.pick([4, 6, 25, -4]); a = G.pick([3, 4, 5]); b = G.pick([1, 2]); }
    if (kind === 'mul') { s = G.pick([1, 2, 3]); for (k = 0; k < len; k++) seq.push(s * Math.pow(2, k)); jumps = seq.slice(1).map(function () { return '×2'; }); }
    else if (kind === 'grow') { s = rint(1, 10); seq.push(s); for (k = 1; k < len; k++) { seq.push(seq[k - 1] + k); jumps.push('+' + k); } }
    else if (kind === 'alt') { s = rint(1, 15); seq.push(s); for (k = 1; k < len; k++) { var j = k % 2 ? a : -b; seq.push(seq[k - 1] + j); jumps.push(j > 0 ? '+' + j : '−' + (-j)); } }
    else {
      s = d > 0 ? rint(d === 25 ? 0 : 1, Math.max(1, Math.min(20, max - d * (len - 1)))) : rint(-d * (len - 1) + 1, Math.min(max, -d * (len - 1) + 30));
      if (d === 25) { s = 0; len = 5; }
      for (k = 0; k < len; k++) seq.push(s + d * k);
      jumps = seq.slice(1).map(function () { return d > 0 ? '+' + d : '−' + (-d); });
    }
    if (seq.some(function (v) { return v < 0 || v > max; })) continue;
    var miss = L <= 7 ? len - 1 : L === 8 ? G.pick([len - 1, len - 2]) : rint(1, len - 1);
    return { seq: seq, miss: miss, jumps: jumps, kind: kind };
  }
  return { seq: [2, 4, 6, 8, 10], miss: 4, jumps: ['+2', '+2', '+2', '+2'], kind: 'add' };
}
/* 숫자 뒤 조사: 끝자리 읽는 소리(영·일·삼·육·칠·팔·십·백은 받침 있음) — numJosa(3,'을','를') → '3을' */
function numJosa(n, a, b) { var d = Math.abs(n) % 10; return n + ('013678'.indexOf(String(d)) >= 0 ? a : b); }
/* 보기 — 정답 둘레의 그럴듯한 수 (흔한 실수: 하나 차이·뛰기 한 번 차이·다른 셈) */
function ntOptions(ans, n, near) {
  var c = [ans + 1, ans - 1, ans + 2, ans - 2].concat(near || []);
  if (ans >= 15) c.push(ans + 10, ans - 10);
  var seen = {}, out = [];
  seen[ans] = 1;
  G.shuffle(near || []).concat(G.shuffle(c)).forEach(function (v) { if (v >= 0 && !seen[v] && out.length < n - 1) { seen[v] = 1; out.push(v); } });
  for (var k = 3; out.length < n - 1; k++) if (!seen[ans + k]) { seen[ans + k] = 1; out.push(ans + k); }
  return G.shuffle(out.concat([ans]));
}
G.act({
  id: 'numtower', area: 'mind', title: '숫자 탑 쌓기', icon: '🧱', order: 85, levels: 10, mins: 3, needs: [],
  ef: ['wm', 'plan'], domain: 'reasoning',
  desc: '아래 두 수를 더하면 위의 수!',
  goal: '수 추론 — "아래 두 블록을 더하면 위 블록"이라는 규칙으로 빈칸을 채우고(덧셈·뺄셈의 관계), 수가 커지는 규칙(패턴)을 찾아 빈 수를 알아내는 힘',
  how: '처음엔 블록이나 바둑돌로 진짜 탑을 쌓아 "3개랑 2개를 합치면?" 하고 세어 보게 해 주세요. 어려워하면 자비스가 식(3 + 2 = ?)을 보여 줘요. 1~2단계 두 블록 더하기(1단계는 점으로 세기), 3단계 아래 칸 비우기(뺄셈), 4~6단계 세 층 탑(20~30까지·빈칸 둘), 7단계부터 수 패턴(2, 4, 6, ?), 8단계 네 층 탑, 9~10단계 빈칸 셋·100까지의 수와 늘어나는 뛰기 패턴이에요.',
  basis: '수 피라미드(덧셈·뺄셈 관계 추론)·수 패턴(수열) 과제 — 양적·유동 추론(K-WISC 유동추론 영역의 양적 추론 요소)',
  offline: '종이컵에 숫자를 써서 진짜 숫자 탑 쌓기(아래 두 컵을 더한 수를 위 컵에). 계단을 오르며 2, 4, 6 뛰어 세기, 동전으로 10, 20, 30 세기.',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level, st = G.clamp(ctx.step || 1, 1, 3);
    /* 수의 크기는 칸마다 다음 단계 쪽으로 (ctx.tune) — 100 을 넘지 않는다 */
    var MAX = Math.min(100, ctx.tune(NT.MAX)), ITEMS = NT.items[lv - 1];
    function towerSpec(L, max) { var i = L - 1; return { kind: 't', B: NT.B[i], K: NT.K[i], rule: NT.rule[i], max: max, opts: NT.opts[i], dots: L === 1 }; }
    /* 이 판의 문제 차례 — 패턴은 셋째와 마지막에 */
    var plan = [];
    for (var q = 0; q < ITEMS; q++) plan.push(towerSpec(lv, MAX));
    if (NT.pat[lv - 1]) { plan[2] = { kind: 'p', L: lv, max: MAX, opts: 4 }; plan[ITEMS - 1] = { kind: 'p', L: lv, max: MAX, opts: 4 }; }
    /* 2·3칸: 마지막 한두 문제는 다음 단계 문제 (7단계 앞은 패턴, 그 밖은 다음 단계 탑). 10단계는 빈칸 하나 더 */
    for (var pv = 0; pv < st - 1; pv++) {
      var at = ITEMS - 1 - pv;
      if (lv === 10) { plan[at] = towerSpec(10, MAX); plan[at].K = 4; }
      else if (lv + 1 === 7) plan[at] = { kind: 'p', L: 7, max: NT.MAX[6], opts: 4 };
      else plan[at] = towerSpec(lv + 1, NT.MAX[lv]);
    }
    B.innerHTML = '<div class="rx"><div class="rx-head nt-rule"></div><div class="nt-stage"></div><div class="nt-eq"></div><div class="nt-ch"></div></div>';
    var rule = G.$('.nt-rule', B), stage = G.$('.nt-stage', B), eq = G.$('.nt-eq', B), chBox = G.$('.nt-ch', B);
    stage.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:100%;margin:auto 0 0';
    var qi = 0, score = 0, blanks = 0;

    /* 빈칸 하나 고르기 — 실패 없는 배움: 처음 어긋나면 식을 보여 주고, 두 번째엔 정답이 반짝 */
    function askBlank(ans, nOpt, near, hint1, sayAns, onRight) {
      return new Promise(function (resolve) {
        chBox.innerHTML = ''; eq.textContent = '';
        var miss = 0, ch = G.ui.choices(chBox, ntOptions(ans, nOpt, near).map(function (v) { return { v: v }; }), {
          cols: nOpt, size: 'md', render: function (it) { return '<span class="nt-num">' + it.v + '</span>'; },
          onPick: function (it, el) {
            if (it.v === ans) {
              if (!miss) { ctx.trial(true); score++; }
              blanks++;
              G.ui.good(el); G.sfx.play('good'); G.buzz(15);
              onRight();
              ctx.bubble(G.pick(FAST));
              ctx.timeout(resolve, pace(700));
              return true;
            }
            miss++; if (miss === 1) ctx.trial(false);
            el.classList.add('dim'); el.disabled = true; G.sfx.play('oops'); G.ui.wiggle(el);
            if (miss === 1) { hint1(); }
            else { var r = ch.buttons.filter(function (b) { return b._item.v === ans; })[0]; G.ui.hint(r); ctx.say(sayAns, { repeat: false }); }
            return false;
          }
        });
      });
    }
    function drawTower(T, dots) {
      var b = T.rows.length;
      stage.innerHTML = '<div class="nt-tower" style="--b:' + b + '"></div>';
      var tw = stage.firstChild, els = [];
      T.rows.forEach(function (r, ri) {
        var row = G.el('<div class="nt-row"></div>'); els.push([]);
        r.forEach(function (v, i) {
          var e = G.el('<div class="nt-b"></div>'); e.style.setProperty('--bc', NT_COL[(b - 1 - ri) % NT_COL.length]);
          e.innerHTML = v + (dots && ri === b - 1 ? '<i>' + '●'.repeat(v) + '</i>' : '');
          row.appendChild(e); els[ri].push(e);
        });
        tw.appendChild(row);
      });
      T.order.forEach(function (o) { var e = els[o.r][o.i]; e.classList.add('hole'); e.textContent = '?'; });
      return els;
    }
    function playTower(spec) {
      var T = ntTower(spec), els = drawTower(T, spec.dots), k = 0;
      rule.innerHTML = '🧱 아래 두 수를 <b>더하면</b> 위의 수!';
      function val(p) { return T.rows[p[0]][p[1]]; }
      function one() {
        if (k >= T.order.length) return Promise.resolve();
        var o = T.order[k], e = els[o.r][o.i];
        e.classList.add('now');
        var x = val(o.a), y = val(o.b), sum = o.how === 'sum';
        var near = sum ? [Math.abs(x - y)] : [x + y];
        var eqTxt = sum ? x + ' + ' + y + ' = ?' : x + ' − ' + y + ' = ?';
        var say = x + (sum ? ' 더하기 ' : ' 빼기 ') + numJosa(y, '은', '는') + ' ' + o.v + '! 반짝이는 수를 눌러 봐.';
        return askBlank(o.v, spec.opts, near, function () {
          eq.textContent = eqTxt;
          ctx.bubble(sum ? '아래 두 블록 ' + numJosa(x, '과', '와') + ' ' + numJosa(y, '을', '를') + ' 더해 봐!' : '위 블록 ' + x + '에서 옆 블록 ' + numJosa(y, '을', '를') + ' 빼 봐!');
          G.ui.hint(els[o.a[0]][o.a[1]]); G.ui.hint(els[o.b[0]][o.b[1]]);
        }, say, function () {
          e.classList.remove('hole', 'now'); e.classList.add('fill'); e.textContent = o.v;
          eq.textContent = sum ? x + ' + ' + y + ' = ' + o.v : x + ' − ' + y + ' = ' + o.v;
        }).then(function () { k++; return one(); });
      }
      var first = qi > 0 && spec.B > NT.B[lv - 1] ? ctx.say('이번엔 더 높은 탑이야! 아래부터 차근차근.') : qi === 0 ? ctx.say(spec.K > 1 ? '숫자 탑 미션! 반짝이는 칸부터 하나씩 채워 줘. 아래 두 수를 더하면 위의 수야.' : '숫자 탑 미션! 아래 두 수를 더하면 위의 수야. 물음표에 들어갈 수는?') : Promise.resolve();
      return first.then(one);
    }
    function playPattern(spec) {
      var P = ntPattern(spec.L, spec.max), n = P.seq.length;
      rule.innerHTML = '🔢 수가 커지는 <b>규칙</b>을 찾아 봐!';
      if (P.jumps.some(function (j) { return /−/.test(j); }) && P.kind === 'add') rule.innerHTML = '🔢 수가 바뀌는 <b>규칙</b>을 찾아 봐!';
      if (P.kind === 'alt') rule.innerHTML = '🔢 수가 바뀌는 <b>규칙</b>을 찾아 봐!';
      var html = '<div class="nt-pat">';
      P.seq.forEach(function (v, k) {
        if (k) html += '<span class="nt-ar">▶<em>' + (k === P.miss || k - 1 === P.miss ? '?' : P.jumps[k - 1]) + '</em></span>';
        html += '<span class="nt-st' + (k === P.miss ? ' hole now' : '') + '">' + (k === P.miss ? '?' : v) + '</span>';
      });
      stage.innerHTML = html + '</div>';
      var pat = stage.firstChild, stone = pat.querySelectorAll('.nt-st')[P.miss], ans = P.seq[P.miss];
      var j0 = P.jumps[0], d = P.kind === 'add' ? P.seq[1] - P.seq[0] : 0;
      var near = d ? [ans + d, ans - d] : P.kind === 'mul' ? [ans + P.seq[0], ans * 2] : [ans + 1];
      var first = ctx.say(qi === 2 || spec.L !== lv ? '이번엔 수 패턴! 어떤 규칙으로 바뀌는지 보고 물음표에 들어갈 수를 찾아 봐.' : '물음표에 들어갈 수는?');
      return first.then(function () {
        return askBlank(ans, spec.opts, near, function () {
          pat.classList.add('show');
          ctx.bubble('화살표 위의 뛰기를 봐! ' + (P.kind === 'mul' ? '두 배씩 커져.' : P.kind === 'grow' ? '뛰는 수가 하나씩 커져.' : P.kind === 'alt' ? '두 가지 뛰기가 번갈아 나와.' : j0 + '씩 바뀌어.'));
        }, '물음표에 들어갈 수는 ' + ans + '! 반짝이는 수를 눌러 봐.', function () {
          stone.classList.remove('hole', 'now'); stone.classList.add('fill'); stone.textContent = ans; pat.classList.add('show');
          G.$$('.nt-ar em', pat).forEach(function (em, k) { em.textContent = P.jumps[k]; });
        });
      });
    }
    function next() {
      if (qi >= plan.length) {
        ctx.extra.score = score; ctx.extra.blanks = blanks;
        ctx.finish({ msg: '숫자 탑을 ' + plan.length + '개나 완성했어! 수 규칙 박사다!' });
        return;
      }
      var spec = plan[qi]; prog(ctx, qi, plan.length);
      (spec.kind === 'p' ? playPattern(spec) : playTower(spec)).then(function () {
        qi++; prog(ctx, qi, plan.length);
        return ctx.cheer(qi >= plan.length ? '마지막 탑까지 완성!' : null);
      }).then(next);
    }
    prog(ctx, 0, plan.length);
    next();
  }
});

/* ===========================================================
   5. 주차장 탈출 — 시공간 계획 (Rush Hour 형식)
   차는 제 방향(가로·세로)으로만 미끄러진다. 빨간 차를 오른쪽 출구로!
   퍼즐은 풀린 모양에서 거꾸로 모든 모양을 넓게 찾아 '최소 몇 번'이 정해진 것만 고른다 — 언제나 풀 수 있다.
   =========================================================== */
var PK = {
  N:     [4, 4, 5, 5, 5, 6, 6, 6, 6, 6],
  cars:  [1, 2, 3, 4, 5, 7, 8, 9, 10, 11],   /* 빨간 차 말고 */
  lo:    [2, 2, 3, 4, 5, 5, 6, 7, 8, 9],      /* 최소로 움직이는 횟수 */
  hi:    [2, 3, 4, 5, 6, 6, 7, 8, 9, 11],
  truck: [0, 0, 0, 0, 0, 0.2, 0.25, 0.25, 0.3, 0.3]
};
var PK_COL = ['#4f8cff', '#22b07d', '#f2a900', '#9a74ff', '#26a69a', '#5c6bc0', '#8d6e63', '#00acc1', '#7cb342', '#ab47bc', '#3949ab', '#ffb300'];
function pkCfg(L, tuned) {
  var i = L - 1, c = { N: PK.N[i], cars: PK.cars[i], lo: PK.lo[i], hi: PK.hi[i], truck: PK.truck[i] };
  if (tuned) { c.cars = Math.min(tuned.cars, c.N === 4 ? 3 : c.N === 5 ? 6 : 12); c.lo = tuned.lo; c.hi = Math.max(tuned.lo, tuned.hi); }
  return c;
}
function pkGrid(N, cars, pos) {
  var g = new Uint8Array(N * N);
  for (var i = 0; i < cars.length; i++) { var c = cars[i], p = pos[i]; for (var k = 0; k < c.len; k++) g[c.h ? c.r * N + p + k : (p + k) * N + c.c] = 1; }
  return g;
}
/* 이 모양에서 할 수 있는 모든 움직임: fn(차 번호, 새 자리) */
function pkEach(N, cars, pos, fn) {
  var g = pkGrid(N, cars, pos);
  for (var i = 0; i < cars.length; i++) {
    var c = cars[i], p = pos[i], q, at = c.h ? (function (r) { return function (x) { return r * N + x; }; })(c.r) : (function (cc) { return function (x) { return x * N + cc; }; })(c.c);
    for (q = p - 1; q >= 0 && !g[at(q)]; q--) fn(i, q);
    for (q = p + c.len; q < N && !g[at(q)]; q++) fn(i, q - c.len + 1);
  }
}
function pkKey(pos) { var k = 0; for (var i = 0; i < pos.length; i++) k = k * 8 + pos[i]; return k; }
/* 이어진 모든 모양을 넓게 찾고, 모양마다 '나가기까지 최소 몇 번'(dist)을 센다 */
function pkExplore(N, cars, pos0, cap) {
  var idx = new Map(), list = [pos0], adj = [];
  idx.set(pkKey(pos0), 0);
  for (var h = 0; h < list.length; h++) {
    var p = list[h], nb = [];
    pkEach(N, cars, p, function (i, q) { var np = p.slice(); np[i] = q; var k = pkKey(np), j = idx.get(k); if (j === undefined) { j = list.length; idx.set(k, j); list.push(np); } nb.push(j); });
    adj.push(nb);
    if (list.length > cap) return null;
  }
  var dist = new Int16Array(list.length).fill(-1), qq = [];
  for (var i = 0; i < list.length; i++) if (list[i][0] === N - 2) { dist[i] = 0; qq.push(i); }
  for (h = 0; h < qq.length; h++) { var a = adj[qq[h]]; for (var t = 0; t < a.length; t++) if (dist[a[t]] < 0) { dist[a[t]] = dist[qq[h]] + 1; qq.push(a[t]); } }
  return { list: list, dist: dist, idx: idx };
}
/* 한 번 시도: 차를 아무렇게나 세우고, 그 모양들 가운데 원하는 횟수(lo~hi)에 가장 긴 것을 고른다 */
function pkTry(cf) {
  var N = cf.N, er = N === 4 ? 1 : 2, cars = [{ h: true, r: er, len: 2 }], pos = [rint(0, Math.max(0, N - 4))];
  var g = pkGrid(N, cars, pos), fails = 0;
  while (cars.length < cf.cars + 1 && fails < 300) {
    var h = Math.random() < 0.45, len = N >= 6 && Math.random() < cf.truck ? 3 : 2, r = rint(0, N - 1), c = rint(0, N - 1), ok = true;
    if ((h && r === er) || (h ? c + len > N : r + len > N)) { fails++; continue; }   /* 출구 줄에는 가로 차를 두지 않는다 (영영 막힘) */
    for (var k = 0; k < len; k++) if (g[(h ? r : r + k) * N + (h ? c + k : c)]) ok = false;
    if (!ok) { fails++; continue; }
    cars.push(h ? { h: true, r: r, len: len } : { h: false, c: c, len: len }); pos.push(h ? c : r); g = pkGrid(N, cars, pos);
  }
  if (cars.length < cf.cars + 1) return null;
  var ex = pkExplore(N, cars, pos, 15000); if (!ex) return null;
  var best = -1, cand = [], md = -1, mi = -1;
  for (var i = 0; i < ex.list.length; i++) {
    var d = ex.dist[i];
    if (d >= cf.lo && d <= cf.hi) { if (d > best) { best = d; cand = []; } if (d === best) cand.push(i); }
    if (d >= 2 && d <= cf.hi && d > md) { md = d; mi = i; }
  }
  var pick = cand.length ? G.pick(cand) : mi;
  if (pick < 0) return null;
  cars.forEach(function (c, n) { c.col = n === 0 ? '#e53935' : PK_COL[(n - 1) % PK_COL.length]; });
  return { N: N, er: er, cars: cars, pos: ex.list[pick].slice(), opt: ex.dist[pick], ex: ex, exact: cand.length > 0 };
}
/* 퍼즐 만들기 — 원하는 횟수를 찾을 때까지 (못 찾으면 그동안 가장 어려운 것). 휴대폰이 멈추지 않게 틈틈이 쉰다 */
function pkMake(cf, budget, wait) {
  var t0 = Date.now(), best = null, lap = Date.now();
  function step() {
    while (Date.now() - t0 < budget) {
      var p = pkTry(cf);
      if (p && p.exact) return Promise.resolve(p);
      if (p && (!best || p.opt > best.opt)) best = p;
      if (wait && Date.now() - lap > 30) { lap = Date.now(); return wait().then(step); }
    }
    for (var t = 0; !best && t < 300; t++) best = pkTry({ N: cf.N, cars: Math.max(1, Math.min(cf.cars, cf.N - 2)), lo: 2, hi: cf.hi, truck: 0 });
    return Promise.resolve(best || pkEasy());
  }
  return step();
}
/* 마지막 비상용: 4칸 주차장, 막는 차 한 대 (최소 2번) */
function pkEasy() {
  var cars = [{ h: true, r: 1, len: 2, col: '#e53935' }, { h: false, c: 2, len: 2, col: PK_COL[0] }], pos = [0, 0], ex = pkExplore(4, cars, pos, 1000);
  return { N: 4, er: 1, cars: cars, pos: pos, opt: ex.dist[0], ex: ex, exact: false };
}
/* 따로 푸는 검사기: 지금 모양에서 나가기까지 최소 횟수 (못 나가면 -1) */
function pkSolve(N, cars, pos) {
  var seen = new Map(), q = [pos.slice()];
  seen.set(pkKey(pos), 0);
  for (var h = 0; h < q.length; h++) {
    var p = q[h], d = seen.get(pkKey(p));
    if (p[0] === N - 2) return d;
    pkEach(N, cars, p, function (i, x) { var np = p.slice(); np[i] = x; var k = pkKey(np); if (!seen.has(k)) { seen.set(k, d + 1); q.push(np); } });
    if (q.length > 200000) return -1;
  }
  return -1;
}
G.act({
  id: 'parking', area: 'brain', title: '주차장 탈출', icon: '🅿️', order: 24, levels: 10, mins: 4, needs: [],
  ef: ['plan', 'shift', 'inhibit'], domain: 'spatial',
  desc: '차를 밀어 빨간 차를 밖으로!',
  goal: '시공간 계획 — 차들이 제 방향으로만 움직인다는 규칙 안에서, 무엇을 먼저 비켜야 길이 열릴지 몇 수 앞을 내다보며 계획하는 힘',
  how: '움직이기 전에 "빨간 차 앞을 누가 막고 있지? 그 차는 어디로 비킬 수 있을까?" 하고 같이 말로 생각해 보세요. 막히면 ↩️ 되돌리기, 💡 도움을 써도 괜찮아요. 차는 끌어서 밀거나, 눌러 고른 뒤 갈 칸을 눌러도 돼요. 1~2단계는 4칸 주차장에 차 한두 대, 3~5단계 5칸, 6단계부터 6칸 주차장에 트럭이 섞이고, 10단계는 차 열한 대 사이를 아홉~열한 번 움직여 나가요.',
  basis: 'Rush Hour형 미끄럼 퍼즐 계획 과제 — 하노이탑처럼 앞을 내다보는 계획·시공간 작업기억',
  offline: '책이나 상자로 바닥에 주차장을 만들고 장난감 자동차를 앞뒤로만 밀어 빼내기. 레고로 막힌 길을 만들고 "먼저 무엇을 비켜야 할까?"를 말로 계획한 뒤 움직여요.',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level, st = G.clamp(ctx.step || 1, 1, 3);
    var tuned = { cars: ctx.tune(PK.cars), lo: ctx.tune(PK.lo), hi: ctx.tune(PK.hi) };
    var COUNT = lv <= 3 ? 4 : 3;
    /* 2·3칸: 마지막 한두 판은 다음 단계 주차장(크기·차 수) 맛보기. 10단계는 칸만큼 조금 더 긴 퍼즐 */
    function cfgFor(i) { return lv < 10 && i >= COUNT - (st - 1) ? pkCfg(lv + 1) : pkCfg(lv, tuned); }
    B.innerHTML = '<div class="rx"><div class="rx-head pk-head"></div><div class="pk-frame"><div class="pk-board"></div><div class="pk-exit"></div></div>' +
      '<div class="pk-tools"><button class="btn soft pk-undo" type="button">↩️ 되돌리기</button><button class="btn big soft pk-hint" type="button">💡 도움</button>' +
      '<button class="btn soft pk-reset" type="button">🔄 처음</button></div></div>';
    var head = G.$('.pk-head', B), board = G.$('.pk-board', B), exitEl = G.$('.pk-exit', B), frame = G.$('.pk-frame', B);
    var hintBtn = G.$('.pk-hint', B), undoBtn = G.$('.pk-undo', B), resetBtn = G.$('.pk-reset', B);
    var P = null, pos = [], els = [], undo = [], moves = 0, total = 0, hints = 0, locked = true, sel = -1, drag = null, idleH = null;
    var pi = 0, stars = 0, made = Promise.resolve(null), log = [];

    function headTxt() { head.innerHTML = '🚗 움직임 <b>' + moves + '</b> <span class="dim">· 최소 ' + P.opt + '번이면 나가요</span>'; }
    function place(i) {
      var c = P.cars[i], p = pos[i], el = els[i], N = P.N;
      el.style.left = (c.h ? p : c.c) / N * 100 + '%'; el.style.top = (c.h ? c.r : p) / N * 100 + '%';
      el.style.width = (c.h ? c.len : 1) / N * 100 + '%'; el.style.height = (c.h ? 1 : c.len) / N * 100 + '%';
    }
    function render() {
      board.innerHTML = ''; els = []; sel = -1;
      board.style.setProperty('--n', P.N); frame.style.setProperty('--n', P.N);
      exitEl.style.top = 'calc(10px + (100% - 20px) * ' + (P.er / P.N) + ')'; exitEl.style.height = 'calc((100% - 20px) / ' + P.N + ')';
      P.cars.forEach(function (c, i) {
        var el = G.el('<div class="pk-car ' + (c.h ? 'h' : 'v') + (c.len === 3 ? ' t3' : '') + (i === 0 ? ' red' : '') + '"><div class="pk-in">' + (i === 0 ? '⚡' : '') + '</div></div>');
        el.style.setProperty('--cc', c.col);
        el.addEventListener('pointerdown', function (e) { down(e, i); });
        el.addEventListener('pointermove', moveEv);
        el.addEventListener('pointerup', upEv);
        el.addEventListener('pointercancel', upEv);
        board.appendChild(el); els.push(el); place(i);
      });
    }
    /* 이 차가 갈 수 있는 자리 범위 */
    function rangeOf(i) {
      var c = P.cars[i], N = P.N, g = pkGrid(N, P.cars.filter(function (x, k) { return k !== i; }), pos.filter(function (x, k) { return k !== i; }));
      var at = function (x) { return c.h ? c.r * N + x : x * N + c.c; }, lo = pos[i], hi = pos[i];
      while (lo - 1 >= 0 && !g[at(lo - 1)]) lo--;
      while (hi + c.len < N && !g[at(hi + c.len)]) hi++;
      return [lo, hi];
    }
    function selectCar(i) {
      els.forEach(function (e) { e.classList.remove('sel'); });
      sel = sel === i ? -1 : i;
      if (sel >= 0) { els[sel].classList.add('sel'); ctx.bubble('어느 칸으로 갈까? 갈 칸을 눌러 봐!'); }
    }
    function down(e, i) {
      e.preventDefault(); e.stopPropagation();
      if (locked) return;
      idle();
      drag = { i: i, x: e.clientX, y: e.clientY, p0: pos[i], np: pos[i], range: rangeOf(i), cell: board.clientWidth / P.N, moved: false, id: e.pointerId };
      try { els[i].setPointerCapture(e.pointerId); } catch (er) {}
      els[i].classList.add('drag'); G.sfx.play('tap');
    }
    function moveEv(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var c = P.cars[drag.i], dpx = c.h ? e.clientX - drag.x : e.clientY - drag.y;
      if (Math.abs(dpx) > 8) drag.moved = true;
      drag.np = G.clamp(drag.p0 + dpx / drag.cell, drag.range[0], drag.range[1]);
      var off = (drag.np - drag.p0) * drag.cell;
      els[drag.i].style.transform = c.h ? 'translateX(' + off + 'px)' : 'translateY(' + off + 'px)';
    }
    function upEv(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      els[d.i].classList.remove('drag'); els[d.i].style.transform = '';
      if (!d.moved) { selectCar(d.i); return; }
      var q = Math.round(d.np);
      if (q !== d.p0) doMove(d.i, q); else place(d.i);
    }
    /* 차를 고른 뒤 빈칸을 누르면 그쪽으로 (막혀 있으면 갈 수 있는 데까지 가지 않고 알려 준다) */
    ctx.on(board, 'pointerdown', function (e) {
      if (locked || e.target.closest('.pk-car')) return;
      e.preventDefault();
      if (sel < 0) { ctx.bubble('움직일 차를 끌어 봐!'); return; }
      var r = board.getBoundingClientRect(), N = P.N, cc = Math.floor((e.clientX - r.left) / r.width * N), rr = Math.floor((e.clientY - r.top) / r.height * N);
      var c = P.cars[sel], p = pos[sel], lineOk = c.h ? rr === c.r : cc === c.c, x = c.h ? cc : rr;
      if (!lineOk) { ctx.bubble(c.h ? '이 차는 옆으로만 움직여!' : '이 차는 위아래로만 움직여!'); G.ui.wiggle(els[sel]); return; }
      var q = x < p ? x : x >= p + c.len ? x - c.len + 1 : p, rg = rangeOf(sel);
      if (q === p) return;
      if (q < rg[0] || q > rg[1]) { ctx.bubble('그쪽은 다른 차가 막고 있어!'); G.ui.wiggle(els[sel]); G.sfx.play('oops'); return; }
      doMove(sel, q);
    });
    function doMove(i, q) {
      undo.push([i, pos[i]]); pos[i] = q; place(i); moves++; total++;
      G.sfx.tone(520 + Math.random() * 160, 0.09, 'sine', 0.2); G.buzz(8);
      els.forEach(function (e) { e.classList.remove('sel'); }); sel = -1;
      headTxt(); idle();
      if (pos[0] === P.N - 2) win();
    }
    function hint() {
      if (locked || !P) return;
      hints++; idle(); hintBtn.classList.remove('pulse');
      /* 지금 모양에서 한 번 줄어드는 움직임 하나 */
      var j = P.ex.idx.get(pkKey(pos)), d = j === undefined ? -1 : P.ex.dist[j], mv = null;
      pkEach(P.N, P.cars, pos, function (i, q) {
        if (mv) return;
        var np = pos.slice(); np[i] = q; var k = P.ex.idx.get(pkKey(np));
        if (k !== undefined && P.ex.dist[k] === d - 1) mv = [i, q];
      });
      if (!mv) return;
      var c = P.cars[mv[0]], N = P.N, gh = G.el('<div class="pk-ghost"></div>');
      gh.style.left = (c.h ? mv[1] : c.c) / N * 100 + '%'; gh.style.top = (c.h ? c.r : mv[1]) / N * 100 + '%';
      gh.style.width = (c.h ? c.len : 1) / N * 100 + '%'; gh.style.height = (c.h ? 1 : c.len) / N * 100 + '%';
      board.appendChild(gh); G.ui.hint(els[mv[0]].firstChild);
      ctx.timeout(function () { gh.remove(); }, 2600);
      ctx.bubble(mv[0] === 0 ? '빨간 차가 나갈 수 있어! 오른쪽으로 쭉!' : '반짝이는 차를 노란 칸으로 옮겨 봐!');
    }
    function idle() {
      clearTimeout(idleH);
      idleH = ctx.timeout(function () { if (!locked) { hintBtn.classList.add('pulse'); ctx.bubble('막히면 💡 도움을 눌러도 돼!'); } }, pace(30000));
    }
    function win() {
      locked = true; clearTimeout(idleH); hintBtn.classList.remove('pulse');
      var red = els[0], cell = board.clientWidth / P.N;
      red.classList.add('out'); red.style.transform = 'translateX(' + cell * 3 + 'px)';
      G.sfx.play('whoosh');
      /* 별: 도움 없이 최소+1 안이면 셋, 두 배+2 안이면 둘, 그 밖은 하나 */
      var s = !hints && total <= P.opt + 1 ? 3 : !hints && total <= P.opt * 2 + 2 ? 2 : 1;
      stars += s;
      ctx.trial(!hints && total <= P.opt * 2 + 2);
      log.push({ n: P.N, cars: P.cars.length - 1, opt: P.opt, mv: total, hint: hints });
      ctx.extra.score = stars; ctx.extra.puzzles = log;
      pi++; prog(ctx, pi, COUNT);
      ctx.timeout(function () {
        ctx.cheer(s === 3 ? '완벽한 계획이야! 최소로 탈출!' : G.pick(['탈출 성공! 길을 찾아냈어!', '빨간 차가 나갔다! 미션 성공!', '멋지게 빠져나왔어!'])).then(function () {
          if (pi >= COUNT) { ctx.finish({ msg: '주차장 ' + COUNT + '곳을 모두 탈출했어! 별 ' + stars + '개, 계획 대장이야!' }); return; }
          start();
        });
      }, 700);
    }
    function start() {
      locked = true; head.innerHTML = '🅿️ 주차장 준비 중…';
      made.then(function (p) {
        P = p || null;
        var ready = P ? Promise.resolve(P) : pkMake(cfgFor(pi), 1500, function () { return ctx.wait(0); });
        return ready;
      }).then(function (p) {
        P = p; pos = P.pos.slice(); undo = []; moves = 0; total = 0; hints = 0;
        render(); headTxt();
        /* 다음 퍼즐은 지금 미리 만들어 둔다 */
        made = pi + 1 < COUNT ? pkMake(cfgFor(pi + 1), 1500, function () { return ctx.wait(0); }) : Promise.resolve(null);
        locked = false; idle();
        if (pi > 0) ctx.say(cfgFor(pi).N !== cfgFor(pi - 1).N ? '더 넓은 주차장이야! 빨간 차를 탈출시켜 줘.' : '다음 주차장! 이번에도 빨간 차를 빼 줘.');
      });
    }
    undoBtn.addEventListener('click', function () {
      if (locked || !undo.length) return;
      var u = undo.pop(); pos[u[0]] = u[1]; place(u[0]); moves = Math.max(0, moves - 1); headTxt(); idle(); G.sfx.play('whoosh');
    });
    resetBtn.addEventListener('click', function () {
      if (locked) return;
      pos = P.pos.slice(); undo = []; moves = 0; P.cars.forEach(function (c, i) { place(i); }); headTxt(); idle();
    });
    hintBtn.addEventListener('click', hint);
    prog(ctx, 0, COUNT);
    head.innerHTML = '🅿️ 주차장 탈출';
    made = pkMake(cfgFor(0), 1500, function () { return ctx.wait(0); });
    ctx.say(lv <= 2 ? '주차장 탈출 미션! 차는 앞뒤로만 움직여요. 막고 있는 차를 비켜서 빨간 차를 오른쪽 출구로 내보내 줘.' :
      '주차장 탈출 미션! 차는 제 방향으로만 미끄러져. 먼저 무엇을 비켜야 할지 생각하고 움직여 봐!').then(start);
  },
  /* 시험용: 퍼즐 만들기·풀기 (scripts·검사에서 씀) */
  lab: { cfg: pkCfg, make: pkMake, solve: pkSolve, tryOnce: pkTry, PK: PK }
});
})();

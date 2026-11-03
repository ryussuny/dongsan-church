/* ===========================================================
   함께 자라요 — 생각 힘 (실행기능 · 전두엽 놀이)

   발달 연구에서 아이의 실행기능을 재는 데 쓰는 과제를
   아이가 즐길 수 있는 짧은 놀이로 바꿨다.
     simon     자비스 따라 하기   작업기억      (Simon·Corsi 따라 하기 폭)
     daynight  낮과 밤            억제          (Day–Night Stroop)
     switch    규칙 바꾸기        인지적 유연성  (DCCS 카드 나누기)
     gonogo    멈춰! 잡아!        억제·주의     (Go/No-Go)
     findall   숨은 친구 찾기     선택적 주의    (시각 탐색·지우기 과제)
     maze      길 찾기            계획          (미로·하노이탑 계획)
     wait      기다려! 쿠키       만족 지연      (마시멜로 과제 변형)
     opposite  반대로 해요        억제·운동     (HTKS 머리-발가락 과제)

   ▸ 아이에게는 틀림이 보이지 않는다 — 틀리면 같이 다시 보고, 두 번째엔 답이 빛난다.
   ▸ 맞고 틀림은 ctx.trial 로 부모 화면에만 남는다.
   ▸ 화면 속 연습은 비슷한 일에만 옮겨 가기 쉽다(Diamond & Ling, 2016).
     그래서 how 마다 '화면 밖에서 하는 같은 놀이'를 하나씩 적어 두었다.
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;

/* ---------- 함께 쓰는 작은 도구 ---------- */
var FAST = ['좋아!', '딩동댕!', '그거야!', '멋져!', '반짝!', '최고!', '척척!', '우와!'];
function calm() { return !!G.settings.calm; }
function pace(ms) { return Math.round(ms * (calm() ? 1.35 : 1)); }
/* 놀이 칸 위로 떠오르는 짧은 글 ("잘 참았어!") */
function floatText(box, text, x, y) {
  var f = G.el('<span class="bf-float"></span>'); f.textContent = text;
  var r = box.getBoundingClientRect();
  f.style.left = (x - r.left) + 'px'; f.style.top = (y - r.top) + 'px';
  box.appendChild(f); setTimeout(function () { f.remove(); }, 1300);
}
function centerOf(el) { return G.fx.center(el); }
/* 진행 점은 10개까지만 (머리줄에 제목이 가려지지 않게) */
function prog(ctx, i, n) { if (n > 10) { i = Math.round(i * 10 / n); n = 10; } ctx.progress(i, n); }

G.css('brain', `
.st-body[class*="act-"] .bw{flex:1;display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;min-height:0;position:relative}
.bw .b-rule{display:inline-block;max-width:100%;text-align:center;line-height:1.5;padding:7px 16px;border-radius:22px;background:var(--surface);box-shadow:var(--shadow);
  font-family:Jua,sans-serif;font-size:clamp(16px,4.4vw,22px);border:3px solid color-mix(in srgb,var(--area) 40%,transparent)}
.bw .b-rule b{font-size:1.2em;font-weight:400;white-space:nowrap;margin:0 3px}
.bw .b-rule .nw{white-space:nowrap}
.bf-float{position:absolute;z-index:20;pointer-events:none;transform:translate(-50%,-50%);font-family:Jua,sans-serif;font-size:clamp(18px,5vw,26px);
  color:var(--ink);background:var(--surface);padding:4px 12px;border-radius:999px;box-shadow:var(--shadow);white-space:nowrap;animation:bfUp 1.3s ease-out forwards}
@keyframes bfUp{0%{opacity:0;transform:translate(-50%,-30%) scale(.8)}15%{opacity:1;transform:translate(-50%,-60%) scale(1)}100%{opacity:0;transform:translate(-50%,-160%)}}
.b-announce{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
  background:color-mix(in srgb,var(--bg) 88%,transparent);border-radius:26px;animation:fade .3s;text-align:center;padding:16px}
.b-announce .ba-e{font-size:clamp(80px,24vw,150px);line-height:1.1;animation:pop .6s}
.b-announce .ba-t{font-family:Jua,sans-serif;font-size:clamp(24px,7vw,40px);line-height:1.3}
.b-announce .ba-s{color:var(--soft);font-size:clamp(15px,4vw,19px)}

/* ── simon ── */
.act-simon .sm-notes{display:flex;gap:8px;min-height:22px;justify-content:center;flex-wrap:wrap}
.act-simon .sm-notes i{width:18px;height:18px;border-radius:50%;background:var(--line);transition:background .2s,transform .2s}
.act-simon .sm-notes i.on{background:var(--area);transform:scale(1.15)}
.act-simon .sm-pads{display:grid;grid-template-columns:1fr 1fr;gap:clamp(12px,3vw,20px);width:min(100%,520px,62vh);aspect-ratio:1;margin:auto 0}
.act-simon .sm-pad{border-radius:30%;background:var(--c);box-shadow:0 8px 0 color-mix(in srgb,var(--c) 70%,#000),inset 0 -10px 20px rgba(0,0,0,.08);
  display:flex;align-items:center;justify-content:center;font-size:clamp(46px,14vw,92px);opacity:.62;filter:saturate(.75);transition:opacity .12s,transform .12s,filter .12s,box-shadow .12s}
.act-simon .sm-pad.lit{opacity:1;filter:saturate(1.2) brightness(1.12);transform:scale(1.05);box-shadow:0 0 0 6px color-mix(in srgb,var(--c) 40%,transparent),0 0 40px var(--c)}
.act-simon .sm-pad:active{transform:scale(.96)}
.act-simon .sm-pads.wait .sm-pad{pointer-events:none}
.act-simon .sm-turn{font-family:Jua,sans-serif;font-size:clamp(18px,5vw,24px);min-height:32px;color:var(--soft)}

/* ── daynight ── */
.act-daynight .dn-card{width:min(78vw,340px,42vh);aspect-ratio:1;border-radius:34px;display:flex;align-items:center;justify-content:center;
  font-size:clamp(110px,32vw,190px);box-shadow:var(--shadow);margin:auto 0 0;position:relative;overflow:hidden;transition:background .3s}
.act-daynight .dn-card.sun{background:radial-gradient(circle at 50% 40%,#fff6c9,#8fd0ff)}
.act-daynight .dn-card.moon{background:radial-gradient(circle at 50% 40%,#3d4f9a,#141c3d)}
.act-daynight .dn-card.moon::before{content:'✦  ·  ✧    ·   ✦\\A   ·   ✧  ·  ✦';white-space:pre;position:absolute;top:10%;left:8%;color:#fff8;font-size:18px;line-height:2.2}
.act-daynight .dn-card.blank{background:var(--surface);font-size:0}
.act-daynight .dn-card.show{animation:pop .35s}
.act-daynight .dn-btns{display:flex;gap:clamp(14px,4vw,28px);width:min(100%,560px);margin:8px 0 auto}
.act-daynight .dn-btn{flex:1;min-height:clamp(110px,24vw,150px);border-radius:28px;box-shadow:0 7px 0 rgba(0,0,0,.15);padding:8px 4px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:transform .1s}
.act-daynight .dn-btn span{font-size:clamp(50px,13vw,76px);line-height:1.05}
.act-daynight .dn-btn small{font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,22px);line-height:1.2}
.act-daynight .dn-btn.sun{background:#ffe9a6;color:#5b4300}
.act-daynight .dn-btn.moon{background:#2c3a78;color:#fff}
.act-daynight .dn-btn:active{transform:translateY(4px);box-shadow:0 3px 0 rgba(0,0,0,.15)}
.act-daynight .dn-btn.ok{outline:6px solid var(--good)}

/* ── switch (DCCS) ── */
.act-switch .sw-boxes{display:flex;gap:clamp(12px,4vw,30px);width:min(100%,600px);margin-top:auto}
.act-switch .sw-box{flex:1;border-radius:26px;background:var(--surface);box-shadow:var(--shadow);padding:10px 8px 14px;display:flex;flex-direction:column;align-items:center;
  border:4px dashed var(--line);min-height:clamp(150px,34vw,210px);position:relative;transition:transform .15s,border-color .2s}
.act-switch .sw-box .sw-house{font-size:clamp(22px,6vw,30px);line-height:1}
.act-switch .sw-box svg{width:clamp(70px,20vw,110px);height:clamp(70px,20vw,110px)}
.act-switch .sw-box .sw-n{font-family:Jua,sans-serif;font-size:clamp(15px,4vw,19px);color:var(--soft)}
.act-switch .sw-box .sw-pile{position:absolute;right:8px;bottom:6px;font-size:13px;color:var(--soft)}
.act-switch .sw-box:active{transform:scale(.97)}
.act-switch .sw-box.drop{border-color:var(--area);transform:scale(1.03)}
.act-switch .sw-card{width:clamp(130px,36vw,190px);aspect-ratio:1;border-radius:26px;background:var(--surface);box-shadow:var(--shadow);display:flex;align-items:center;
  justify-content:center;border:5px solid transparent;margin:auto 0;cursor:grab}
.act-switch .sw-card.gold{border-color:#f5b700;box-shadow:0 0 0 4px #ffe58a,0 0 26px #ffd54f}
.act-switch .sw-card svg{width:78%;height:78%}
.act-switch .sw-card.fly{transition:transform .45s ease-in,opacity .45s;opacity:0}
.act-switch .sw-card.show{animation:pop .35s}

/* ── gonogo ── */
.act-gonogo .gn-top{display:flex;align-items:center;gap:10px;width:min(100%,640px)}
.act-gonogo .gn-net{flex:1;display:flex;align-items:center;gap:6px;background:var(--surface);border-radius:18px;padding:6px 12px;box-shadow:var(--shadow);min-height:48px;overflow:hidden}
.act-gonogo .gn-net b{font-size:26px} .act-gonogo .gn-net span{font-family:Jua,sans-serif;font-size:22px}
.act-gonogo .gn-net em{font-style:normal;font-size:18px;letter-spacing:-3px;white-space:nowrap;overflow:hidden}
.act-gonogo .gn-time{height:10px;border-radius:9px;background:var(--line);width:min(100%,640px);overflow:hidden}
.act-gonogo .gn-time b{display:block;height:100%;background:var(--area);width:100%;transition:width .5s linear}
.act-gonogo .gn-sea{position:relative;flex:1;min-height:300px;width:min(100%,640px);border-radius:30px;overflow:hidden;
  background:linear-gradient(180deg,#bfe9ff 0%,#6cc3f2 45%,#2f8fd6 100%);box-shadow:inset 0 -20px 40px rgba(0,40,90,.25)}
.act-gonogo .gn-hole{position:absolute;width:24%;aspect-ratio:2.2;border-radius:50%;background:rgba(255,255,255,.28);box-shadow:inset 0 4px 10px rgba(0,50,100,.25);transform:translate(-50%,-50%)}
.act-gonogo .gn-mob{position:absolute;transform:translate(-50%,-78%);font-size:clamp(54px,15vw,92px);line-height:1;cursor:pointer;animation:gnUp .3s ease-out;
  filter:drop-shadow(0 6px 6px rgba(0,40,90,.3));touch-action:manipulation;padding:10px}
.act-gonogo .gn-mob.bye{transition:transform .35s,opacity .35s;opacity:0;transform:translate(-50%,-10%) scale(.6)}
.act-gonogo .gn-mob.got{transition:transform .45s ease-in,opacity .45s;opacity:0;transform:translate(-50%,-400%) scale(.5) rotate(20deg)}
@keyframes gnUp{from{transform:translate(-50%,-10%) scale(.5);opacity:0}}
.act-gonogo .gn-demo{display:flex;gap:16px;justify-content:center;align-items:center;margin:auto 0}
.act-gonogo .gn-demo div{background:var(--surface);border-radius:24px;padding:12px 18px;box-shadow:var(--shadow);text-align:center;font-family:Jua,sans-serif;font-size:20px}
.act-gonogo .gn-demo div span{display:block;font-size:clamp(60px,18vw,96px);line-height:1.2}
.act-gonogo .gn-demo.three div span{font-size:clamp(40px,12vw,80px)}

/* ── wait ── */
.act-wait .wt-plate{display:flex;align-items:center;gap:6px;min-height:48px;background:var(--surface);border-radius:18px;padding:6px 14px;box-shadow:var(--shadow);font-size:26px}
.act-wait .wt-plate small{font-size:14px;color:var(--soft);margin-right:4px}
.act-wait .wt-main{flex:1;display:flex;align-items:center;justify-content:center;gap:clamp(18px,6vw,48px);width:100%;flex-wrap:wrap}
.act-wait .wt-cookie{width:clamp(140px,40vw,220px);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#fff 55%,#eef2f8 56%,#dfe6f0);
  display:flex;align-items:center;justify-content:center;font-size:clamp(80px,24vw,130px);box-shadow:var(--shadow);position:relative;transition:transform .2s}
.act-wait .wt-cookie .two{position:absolute;right:6%;top:4%;font-size:.38em;background:var(--surface);border-radius:999px;padding:2px 8px;box-shadow:var(--shadow);font-family:Jua,sans-serif;color:var(--ink)}
.act-wait .wt-cookie.bit{transform:rotate(-12deg)}
.act-wait .wt-jar{position:relative;width:clamp(96px,26vw,140px);height:clamp(150px,40vw,220px);border-radius:28px 28px 36px 36px;border:6px solid color-mix(in srgb,var(--area) 55%,var(--line));
  background:var(--surface);overflow:hidden;box-shadow:var(--shadow)}
.act-wait .wt-fill{position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(180deg,#ffe082,#ffb300);transition:height .25s linear}
.act-wait .wt-stars{position:absolute;inset:0;display:flex;flex-wrap:wrap-reverse;align-content:flex-start;justify-content:center;padding:6px;font-size:18px;gap:2px}
.act-wait .wt-bell{position:absolute;top:-4px;left:50%;transform:translate(-50%,-100%);font-size:40px}
.act-wait .wt-jarbox{position:relative;padding-top:44px}
.act-wait .wt-bell.ring{animation:wtRing .5s 3}
@keyframes wtRing{0%,100%{transform:translate(-50%,-100%) rotate(0)}25%{transform:translate(-50%,-100%) rotate(-22deg)}75%{transform:translate(-50%,-100%) rotate(22deg)}}
.act-wait .wt-help{display:flex;align-items:center;gap:12px;background:var(--surface);border-radius:22px;padding:10px 18px;box-shadow:var(--shadow);margin-bottom:6px;min-height:72px}
.act-wait .wt-help .he{font-size:clamp(36px,10vw,50px);display:inline-block}
.act-wait .wt-help .ht{font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,22px)}
.act-wait .wt-help.breathe .he{animation:wtBreath 7s ease-in-out infinite}
.act-wait .wt-help.song .he{animation:wtBob .8s ease-in-out infinite alternate}
.act-wait .wt-help.hands .he{animation:wtBob 1.6s ease-in-out infinite alternate}
@keyframes wtBreath{0%,100%{transform:scale(.8)}45%{transform:scale(1.3)}}
@keyframes wtBob{from{transform:translateY(0) rotate(-6deg)}to{transform:translateY(-6px) rotate(6deg)}}
.act-wait .wt-fly{position:fixed;z-index:60;font-size:44px;pointer-events:none;transition:transform .8s cubic-bezier(.5,-0.3,.6,1),opacity .8s}

/* ── maze ── */
.act-maze .mz-board{display:grid;gap:0;width:min(100%,560px,62vh);aspect-ratio:1;margin:auto 0;background:#e9f6df;border-radius:22px;padding:8px;
  box-shadow:var(--shadow);touch-action:none;border:6px solid #8bc34a}
.act-maze .mz-cell{position:relative;display:flex;align-items:center;justify-content:center;font-size:var(--fs,40px);line-height:1;
  border:0 solid #5d8a2e;box-sizing:border-box;transition:background .2s}
.act-maze .mz-cell.wn{border-top-width:6px} .act-maze .mz-cell.we{border-right-width:6px}
.act-maze .mz-cell.ws{border-bottom-width:6px} .act-maze .mz-cell.ww{border-left-width:6px}
.act-maze .mz-cell.bush{background:#cfe8b8}
.act-maze .mz-cell.trail{background:#fff3c4}
.act-maze .mz-cell.hint{animation:glow 1s ease-in-out 3;background:#fff9c4}
.act-maze .mz-cell .mz-rab{position:relative;z-index:2;transition:transform .15s}
.act-maze .mz-cell .mz-rab.hop{animation:mzHop .25s}
@keyframes mzHop{50%{transform:translateY(-25%) scale(1.1)}}
.act-maze .mz-look{font-family:Jua,sans-serif;font-size:clamp(18px,5vw,24px);color:var(--soft);min-height:30px}
.act-maze .mz-board.locked{opacity:.85}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .act-maze .mz-board{background:#28402a;border-color:#5f8f35}
  :root:not([data-theme="light"]) .act-maze .mz-cell.bush{background:#35552f} :root:not([data-theme="light"]) .act-maze .mz-cell.trail{background:#5b5330}
  :root:not([data-theme="light"]) .act-maze .mz-cell{border-color:#a5d66a}}
:root[data-theme="dark"] .act-maze .mz-board{background:#28402a;border-color:#5f8f35}
:root[data-theme="dark"] .act-maze .mz-cell.bush{background:#35552f} :root[data-theme="dark"] .act-maze .mz-cell.trail{background:#5b5330}
:root[data-theme="dark"] .act-maze .mz-cell{border-color:#a5d66a}

/* ── findall ── */
.act-findall .fa-head{display:flex;align-items:center;gap:10px;background:var(--surface);border-radius:20px;padding:6px 16px;box-shadow:var(--shadow)}
.act-findall .fa-head .ft{font-size:clamp(40px,11vw,56px);line-height:1}
.act-findall .fa-head .fc{font-family:Jua,sans-serif;font-size:clamp(20px,5.4vw,28px)}
.act-findall .fa-head .fc b{color:var(--area);font-weight:400}
.act-findall .fa-field{position:relative;flex:1;min-height:300px;width:min(100%,760px);border-radius:28px;background:var(--surface);box-shadow:var(--shadow);overflow:hidden}
.act-findall .fa-it{position:absolute;transform:translate(-50%,-50%) rotate(var(--r,0deg));line-height:1;cursor:pointer;padding:4px;touch-action:manipulation;transition:transform .2s}
.act-findall .fa-it.found{transform:translate(-50%,-50%) scale(1.12)}
.act-findall .fa-it.found::after{content:'';position:absolute;inset:-6px;border-radius:50%;border:5px solid var(--good);animation:pop .4s}
.act-findall .fa-it.hint{animation:glow 1s ease-in-out 3;border-radius:50%}
.act-findall .fa-it.wiggle{animation:wig .45s}

/* ── opposite ── */
.act-opposite .op-wrap{flex:1;display:flex;align-items:center;justify-content:center;gap:clamp(10px,4vw,40px);width:100%;flex-wrap:wrap}
.act-opposite .op-fig{width:min(54vw,250px,38vh);height:auto}
.act-opposite .op-part{transition:fill .2s;stroke:rgba(0,0,0,.18);stroke-width:2}
.act-opposite .op-part.on{fill:#ffd54f;animation:opPulse .7s infinite alternate}
.act-opposite .op-part.ans{fill:#66bb6a}
@keyframes opPulse{from{opacity:.65}to{opacity:1}}
.act-opposite .op-say{font-family:Jua,sans-serif;font-size:clamp(46px,14vw,84px);line-height:1.1;text-align:center;min-width:3em}
.act-opposite .op-say small{display:block;font-size:.32em;color:var(--soft)}
.act-opposite .op-arrow{display:block;font-size:.5em;color:var(--good)}
`);

/* ===========================================================
   1. 자비스 따라 하기 — 작업기억
   =========================================================== */
var SM_PADS = [
  { e: '🐸', c: '#4caf6e', f: 330 },
  { e: '🐥', c: '#ffca28', f: 440 },
  { e: '🐳', c: '#42a5f5', f: 554 },
  { e: '🦊', c: '#ff7043', f: 659 }
];
G.act({
  id: 'simon', area: 'brain', title: '자비스 따라 하기', icon: '🎶', order: 1, levels: 5, mins: 3, needs: [],
  ef: ['wm', 'attend'],
  desc: '동물 친구 노래 순서 기억하기',
  goal: '작업기억 — 본 것·들은 순서를 머릿속에 담아 두었다가 그대로 꺼내 쓰는 힘',
  how: '처음엔 부모가 옆에서 "개구리, 병아리!" 하고 이름을 같이 말해 주면 기억하기 쉬워요. 화면 밖에서는 손뼉·발 구르기 순서 따라 하기("짝-쿵-짝"), 심부름 두 가지 기억하기("컵 갖다 놓고 신발 가져와")로 이어 가세요. 길이가 늘어도 한 번에 하나씩만 늘려요. 4·5단계(도전·마스터)는 처음부터 다섯·여섯 마리 순서예요.',
  basis: 'Simon 게임·Corsi 블록 따라 하기 폭 과제(작업기억 폭 측정)',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level;
    B.innerHTML = '<div class="bw"><div class="sm-notes"></div><div class="sm-pads wait"></div><div class="sm-turn"></div></div>';
    var padsBox = G.$('.sm-pads', B), notes = G.$('.sm-notes', B), turn = G.$('.sm-turn', B);
    var pads = SM_PADS.map(function (p, i) {
      var b = G.el('<button class="sm-pad" style="--c:' + p.c + '" aria-label="' + p.e + '">' + p.e + '</button>');
      b.addEventListener('pointerdown', function (e) { e.preventDefault(); onTap(i); });
      padsBox.appendChild(b); return b;
    });
    /* 처음 길이: 1단계 2 · 2단계 3 · 3단계 4 · 4단계(도전) 5 · 5단계(마스터) 6 — 아무리 늘어도 7까지 */
    var ROUNDS = 6, round = 0, span = lv + 1, streak = 0, best = 0, seq = [], pos = 0, accepting = false, misses = 0, idleH = null;
    var LIT = pace(560), GAP = pace(240);
    /* 칸이 오르면 마지막 한 판(2칸)·두 판(3칸)은 하나 더 길게 — 다음 단계 길이를 살짝 맛보기 */
    var LONG_FROM = ROUNDS - ((ctx.step || 1) - 1);
    function lenFor(rd) { return Math.min(7, span + (rd >= LONG_FROM ? 1 : 0)); }

    function light(i, ms) {
      var b = pads[i]; b.classList.add('lit');
      G.sfx.tone(SM_PADS[i].f, (ms || LIT) / 1000, 'triangle', 0.32);
      ctx.timeout(function () { b.classList.remove('lit'); }, ms || LIT);
    }
    function showNotes(done) {
      notes.innerHTML = seq.map(function (_, k) { return '<i class="' + (k < done ? 'on' : '') + '"></i>'; }).join('');
    }
    function makeSeq(n) {
      var s = [];
      for (var k = 0; k < n; k++) {
        var x; do { x = Math.floor(Math.random() * 4); } while (k >= 2 && x === s[k - 1] && x === s[k - 2]);
        s.push(x);
      }
      return s;
    }
    function play() {
      accepting = false; padsBox.classList.add('wait'); clearTimeout(idleH);
      turn.textContent = '👀 잘 보고 들어 봐!';
      showNotes(0);
      var t = 350;
      seq.forEach(function (i) { ctx.timeout(function () { light(i); }, t); t += LIT + GAP; });
      ctx.timeout(function () {
        accepting = true; pos = 0; padsBox.classList.remove('wait');
        turn.textContent = '🙌 이제 네 차례!';
        G.sfx.play('sparkle');
        idle();
      }, t + 150);
    }
    function idle() {
      clearTimeout(idleH);
      idleH = ctx.timeout(function () {
        if (!accepting) return;
        ctx.bubble(pos === 0 ? '누가 먼저 노래했지?' : '그다음은 누구였지?');
        G.ui.hint(pads[seq[pos]]);
      }, 9000);
    }
    var hintH = null;
    function onTap(i) {
      if (!accepting) return;
      light(i, 300); G.buzz(10);
      if (i === seq[pos]) {
        pos++; showNotes(pos); idle();
        if (pos >= seq.length) { accepting = false; padsBox.classList.add('wait'); clearTimeout(idleH); success(); }
        return;
      }
      /* 틀림 — 끝이 아니라 '같이 다시 듣기' */
      accepting = false; padsBox.classList.add('wait'); clearTimeout(idleH);
      misses++;
      if (misses === 1) { ctx.trial(false); streak = 0; }
      G.ui.wiggle(pads[i]);
      var line = misses === 1 ? G.pick(['앗, 같이 다시 들어 보자!', '괜찮아, 한 번 더 들려줄게!', '음~ 다시 잘 들어 봐!']) : '이번엔 자비스가 빛으로 알려 줄게!';
      ctx.oops(line).then(function () {
        play();
        if (misses >= 2) {
          /* 두 번째부터는 누를 차례마다 정답이 반짝 (실패 없는 배움) — 이 판에서만 */
          var myRound = round;
          clearInterval(hintH);
          hintH = ctx.interval(function () {
            if (round !== myRound || round >= ROUNDS) { clearInterval(hintH); hintH = null; return; }
            if (!accepting || pos >= seq.length) return;
            G.ui.hint(pads[seq[pos]]);
          }, 1600);
        }
      });
    }
    function success() {
      clearInterval(hintH); hintH = null;   /* 반짝 도움은 그 판에서 끝 — 다음 판은 스스로 */
      if (misses === 0) {
        ctx.trial(true); best = Math.max(best, seq.length); streak++;
        if (streak >= 2) { span = Math.min(7, span + 1); streak = 0; }
      } else {
        span = Math.max(1, span - 1);
      }
      ctx.extra.span = best;
      var c = centerOf(padsBox); G.fx.burst(c[0], c[1], ['🎵', '🎶', '⭐']);
      var praise = misses ? '끝까지 해냈다! 잘 기억했어!' :
        G.pick(['우와, 순서를 다 기억했어!', '똑같이 불렀다! 최고야!', '머릿속에 쏙 담았구나!', '딩동댕! 노래가 똑같아!']);
      ctx.cheer(praise).then(next);
    }
    function next() {
      round++; ctx.progress(round, ROUNDS);
      if (round >= ROUNDS) {
        ctx.finish({ msg: '동물 친구 노래를 ' + (best || seq.length) + '개까지 기억했어! 기억 대장이다!' });
        return;
      }
      misses = 0; seq = makeSeq(lenFor(round));
      turn.textContent = '';
      ctx.wait(pace(500)).then(play);
    }

    ctx.progress(0, ROUNDS);
    ctx.say('동물 친구들이 노래를 불러요. 잘 듣고 똑같은 순서로 눌러 줘!').then(function () {
      seq = makeSeq(span); play();
    });
  }
});

/* ===========================================================
   2. 낮과 밤 — 억제 (Day–Night Stroop)
   =========================================================== */
G.act({
  id: 'daynight', area: 'brain', title: '낮과 밤', icon: '🌗', order: 2, levels: 5, mins: 2, needs: [],
  ef: ['inhibit', 'wm'],
  desc: '해가 나오면 달! 반대로 누르기',
  goal: '억제(참기) — 눈에 보이는 대로 바로 누르고 싶은 마음을 멈추고 규칙대로 하는 힘',
  how: '반대로 하기는 어른에게도 어려워요. 틀려도 "생각하고 눌렀네!" 하고 멈춘 것을 칭찬해 주세요. 화면 밖에서는 "엄마가 \'크게\' 하면 작게 말하기", "손 올려 하면 내리기"처럼 반대로 하기 놀이를 짧게 해 보세요. 4·5단계(도전·마스터)는 반대로 하다가 "다시 똑같이!"로 규칙이 두세 번 바뀌어요.',
  basis: 'Day–Night Stroop 과제 (Gerstadt, Hong & Diamond, 1994)',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level;
    B.innerHTML = '<div class="bw"><div class="b-rule"></div><div class="dn-card blank"></div>' +
      '<div class="dn-btns"><button class="dn-btn sun" data-k="sun"><span>☀️</span><small>해</small></button><button class="dn-btn moon" data-k="moon"><span>🌙</span><small>달</small></button></div></div>';
    var wrap = G.$('.bw', B), rule = G.$('.b-rule', B), card = G.$('.dn-card', B), btns = G.$$('.dn-btn', B);
    var st = ctx.step || 1;
    /* 칸이 오르면 — 2단계: '똑같이'를 몇 장 하다가 반대로 바뀐다(3단계 맛보기). 2칸은 1장, 3칸은 3장 뒤에 (3단계는 4장)
       3단계: 바뀐 뒤 반대로 하는 카드가 한 장씩 더 */
    var N = 10 + (lv >= 3 ? st - 1 : 0), SWITCH_AT = lv >= 3 ? 4 : lv === 2 && st > 1 ? ctx.tune([0, 0, 4]) : -1;
    /* 4·5단계: 규칙이 여러 번 바뀐다 [카드 수, 바뀌는 자리]. 4단계는 똑같이 → 반대로 → 다시 똑같이(두 번),
       5단계는 세 장마다(세 번). 4단계 2·3칸은 세 번째 바뀜을 맛보기, 5단계 2·3칸은 마지막 카드가 한 장씩 더 */
    var DN_MORE = { 4: [[12, [4, 8]], [13, [4, 8, 11]], [13, [4, 7, 10]]], 5: [[12, [3, 6, 9]], [13, [3, 6, 9]], [14, [3, 6, 9]]] };
    var more = DN_MORE[lv] ? DN_MORE[lv][G.clamp(st, 1, 3) - 1] : null;
    if (more) N = more[0];
    var SW = more ? more[1].slice() : SWITCH_AT >= 0 ? [SWITCH_AT] : [];
    var opposite = lv === 2 && SWITCH_AT < 0, i = 0, cur = null, open = false, timer = null, run3 = 0, deck = [];
    for (var k = 0; k < N; k++) { var x; do { x = Math.random() < 0.5 ? 'sun' : 'moon'; } while (k >= 2 && deck[k - 1] === x && deck[k - 2] === x); deck.push(x); }

    function setRule() {
      rule.innerHTML = opposite ? '🔄 반대로! <b>☀️→🌙</b> <b>🌙→☀️</b>' : '👯 똑같이! <b>☀️→☀️</b> <b>🌙→🌙</b>';
    }
    function answer(k) { return opposite ? (k === 'sun' ? 'moon' : 'sun') : k; }
    function btnOf(k) { return k === 'sun' ? btns[0] : btns[1]; }
    function announce(e, t, s, ms) {
      var a = G.el('<div class="b-announce"><div class="ba-e">' + e + '</div><div class="ba-t"></div><div class="ba-s"></div></div>');
      a.querySelector('.ba-t').textContent = t; a.querySelector('.ba-s').textContent = s || '';
      wrap.appendChild(a); G.sfx.play('up');
      return ctx.say(t + ' ' + (s || '')).then(function () { return ctx.wait(ms || 400); }).then(function () { a.remove(); });
    }
    function show() {
      if (i >= N) { end(); return; }
      if (SW.length && i === SW[0]) {
        SW.shift(); opposite = !opposite; setRule();
        announce(opposite ? '🔄' : '👯', '규칙이 바뀌었어요!', opposite ? '이제 반대로! 해가 나오면 달, 달이 나오면 해!' : '다시 똑같이! 해가 나오면 해, 달이 나오면 달!', 300).then(show);
        return;
      }
      cur = deck[i]; card.className = 'dn-card ' + cur; void card.offsetWidth; card.classList.add('show');
      card.textContent = cur === 'sun' ? '☀️' : '🌙';
      G.sfx.play('whoosh');
      open = true;
      timer = ctx.timeout(function () {
        if (!open) return; open = false;
        ctx.trial(false); run3 = 0;
        ctx.bubble('괜찮아, 다음 카드!');
        gap();
      }, pace(4000));
    }
    function gap() {
      i++; ctx.progress(i, N);
      ctx.timeout(function () { card.className = 'dn-card blank'; card.textContent = ''; ctx.timeout(show, pace(450)); }, pace(650));
    }
    btns.forEach(function (b) {
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (!open) { G.sfx.play('tap'); return; }
        open = false; clearTimeout(timer);
        var ok = b.dataset.k === answer(cur);
        ctx.trial(ok);
        if (ok) {
          run3++; G.sfx.play('good'); G.buzz(15);
          b.classList.add('ok'); ctx.timeout(function () { b.classList.remove('ok'); }, 500);
          var c = centerOf(b); G.fx.burst(c[0], c[1], cur === 'sun' ? ['🌙', '✨'] : ['☀️', '✨']);
          if (opposite && run3 % 3 === 0) floatText(wrap, '✋ 잘 참았어!', c[0], c[1] - 60);
          else ctx.bubble(G.pick(FAST));
        } else {
          run3 = 0; G.sfx.play('oops'); G.ui.wiggle(card);
          ctx.bubble(opposite ? (cur === 'sun' ? '앗, 반대야! 해가 나오면 달!' : '앗, 반대야! 달이 나오면 해!') : '어떤 그림이었지? 똑같은 걸 눌러요!');
          G.ui.hint(btnOf(answer(cur)));
        }
        gap();
      });
    });
    function end() {
      ctx.finish({ msg: more ? '규칙이 몇 번 바뀌어도 척척! 생각하고 누르는 힘이 정말 멋져!' : opposite ? '해와 달을 반대로 척척! 생각하고 누르는 힘이 쑥쑥 자랐어!' : '해는 해, 달은 달! 아주 잘 봤어!' });
    }

    setRule(); ctx.progress(0, N);
    var intro = opposite ?
      '해님과 달님 놀이! 이번엔 반대로 해요. 해가 나오면 달을, 달이 나오면 해를 눌러요.' :
      '해님과 달님 놀이! 해가 나오면 해를, 달이 나오면 달을 눌러요.' + (more ? ' 중간에 규칙이 여러 번 바뀌어요. 바뀔 때마다 자비스가 알려 줄게!' : '');
    ctx.say(intro).then(function () {
      if (!opposite) return null;
      /* 반대 규칙 보여 주기 */
      card.className = 'dn-card sun show'; card.textContent = '☀️'; G.ui.hint(btns[1]);
      return ctx.say('해가 나오면? 달!').then(function () {
        card.className = 'dn-card moon show'; card.textContent = '🌙'; G.ui.hint(btns[0]);
        return ctx.say('달이 나오면? 해!');
      });
    }).then(function () {
      return ctx.say('준비, 시작!');
    }).then(function () { card.className = 'dn-card blank'; card.textContent = ''; ctx.timeout(show, 300); });
  }
});

/* ===========================================================
   3. 규칙 바꾸기 — 인지적 유연성 (DCCS)
   =========================================================== */
function dcSvg(shape, color) {
  var inner = {
    rabbit: '<g fill="' + color + '"><ellipse cx="38" cy="24" rx="8" ry="20"/><ellipse cx="62" cy="24" rx="8" ry="20"/><circle cx="50" cy="52" r="20"/><ellipse cx="50" cy="82" rx="25" ry="15"/></g>' +
      '<circle cx="43" cy="49" r="3.2" fill="#fff"/><circle cx="57" cy="49" r="3.2" fill="#fff"/><ellipse cx="50" cy="58" rx="3" ry="2.2" fill="#fff" opacity=".85"/>',
    boat: '<g fill="' + color + '"><path d="M8 62 H92 L78 86 H22 Z"/><rect x="47" y="12" width="5" height="50" rx="2"/><path d="M53 14 L84 56 H53 Z"/><path d="M45 22 L20 56 H45 Z" opacity=".75"/></g>' +
      '<circle cx="34" cy="73" r="3.4" fill="#fff" opacity=".8"/><circle cx="50" cy="73" r="3.4" fill="#fff" opacity=".8"/><circle cx="66" cy="73" r="3.4" fill="#fff" opacity=".8"/>',
    star: '<g fill="' + color + '"><polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38"/></g>',
    heart: '<g fill="' + color + '"><path d="M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 46 14 50 22 C54 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88Z"/></g>'
  }[shape];
  return '<svg viewBox="0 0 100 100" aria-hidden="true">' + inner + '</svg>';
}
var DC_SETS = [
  { a: 'rabbit', b: 'boat', an: '토끼', bn: '배' },
  { a: 'star', b: 'heart', an: '별', bn: '하트' }
];
var DC_COLS = [
  [{ hex: '#ef5350', adj: '빨간', n: '빨강' }, { hex: '#3f8ef0', adj: '파란', n: '파랑' }],
  [{ hex: '#f5b700', adj: '노란', n: '노랑' }, { hex: '#43a047', adj: '초록', n: '초록' }]
];
G.act({
  id: 'switch', area: 'brain', title: '규칙 바꾸기', icon: '🔄', order: 3, levels: 5, mins: 3, needs: [],
  ef: ['shift', 'inhibit', 'wm'],
  desc: '색깔 게임에서 모양 게임으로!',
  goal: '인지적 유연성 — 규칙이 바뀌면 방금까지 하던 방식을 내려놓고 새 규칙으로 바꿔 생각하는 힘',
  how: '규칙이 바뀌는 순간이 가장 어려워요. 바뀔 때 부모가 "이제 모양 게임!" 하고 한 번 더 말해 주고, 처음 몇 장은 천천히 해도 돼요. 화면 밖에서는 빨래 개기·장난감 정리를 "이번엔 색깔끼리, 이번엔 종류끼리"로 바꿔 가며 해 보세요. 4·5단계(도전·마스터)는 반짝 카드 몇 장 뒤에 규칙 글씨가 숨어서, 규칙을 머릿속에 기억하고 해요(헷갈리면 다시 보여 줘요).',
  basis: 'Dimensional Change Card Sort — DCCS (Zelazo, 2006), 테두리판 포함',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level, st = ctx.step || 1;
    var S = G.pick(DC_SETS), C = G.pick(DC_COLS);
    var T = [{ shape: S.a, col: 0 }, { shape: S.b, col: 1 }];        // 두 집 (기준 카드)
    var CARDS = [{ shape: S.a, col: 1 }, { shape: S.b, col: 0 }];     // 헷갈리게 섞인 카드
    function nameOf(c) { return C[c.col].adj + ' ' + (c.shape === S.a ? S.an : S.bn); }
    function svgOf(c) { return dcSvg(c.shape, C[c.col].hex); }
    /* 놀이 차례 만들기: rule 'color' | 'shape' | 'border'(테두리 = 모양) */
    var plan = [];
    function add(rule, n, border) { for (var k = 0; k < n; k++) plan.push({ rule: rule, card: CARDS[k % 2], gold: !!border }); }
    function shufflePart(from) { var part = G.shuffle(plan.slice(from)); plan = plan.slice(0, from).concat(part); }
    add('color', lv === 1 ? 6 : lv === 2 ? 6 : 4); shufflePart(0);
    var switchAt = -1, mixedAt = -1;
    /* 칸이 오르면 바뀐 규칙으로 하는 카드가 한 장씩 더 (2단계: 모양 카드 6→7→8, 3단계: 반짝 섞인 카드 8→9→10) */
    if (lv >= 2) { switchAt = plan.length; add('shape', lv === 2 ? 6 + st - 1 : 4); shufflePart(switchAt); }
    /* 4·5단계: 반짝 카드 게임이 길어지고(10장, 5단계 2·3칸은 11·12장), 앞의 몇 장(CUED)만 규칙 글씨를 보여 준다.
       4단계는 4→3→2장, 5단계는 첫 장만 — 그 뒤엔 규칙을 머릿속에 들고 한다(헷갈리면 그 카드에서 다시 보여 줌) */
    var MIXN = lv >= 5 ? 10 + st - 1 : lv === 4 ? 10 : 8 + st - 1, CUED = lv >= 5 ? 1 : lv === 4 ? 5 - st : 99, reveal = false;
    if (lv >= 3) {
      mixedAt = plan.length;
      for (var k = 0; k < MIXN; k++) { var gold = k % 2 === 0; plan.push({ rule: gold ? 'shape' : 'color', card: CARDS[(k >> 1) % 2], gold: gold }); }
      shufflePart(mixedAt);
    }

    B.innerHTML = '<div class="bw"><div class="b-rule"></div><div class="sw-card"></div><div class="sw-boxes"></div></div>';
    var wrap = G.$('.bw', B), rule = G.$('.b-rule', B), card = G.$('.sw-card', B), boxWrap = G.$('.sw-boxes', B);
    var piles = [0, 0];
    var boxes = T.map(function (t, i) {
      var b = G.el('<button class="sw-box"><span class="sw-house">🏠</span>' + svgOf(t) + '<span class="sw-n"></span><span class="sw-pile"></span></button>');
      b.querySelector('.sw-n').textContent = nameOf(t) + ' 집';
      b.addEventListener('click', function () { choose(i); });
      boxWrap.appendChild(b); return b;
    });
    var idx = 0, cur = null, open = false, miss = 0, postN = 0, postOk = 0, mode = 'color';

    function ruleText(r) {
      if (lv >= 3 && idx >= mixedAt && mixedAt >= 0) {
        if (idx >= mixedAt + CUED && !reveal) return '<span class="nw">✨ 반짝 카드 게임!</span> <span class="nw">· 🤔 규칙을 기억해요</span>';
        return '<span class="nw">✨ 반짝 테두리 → <b>🔷 모양</b></span> <span class="nw">· 그냥 카드 → <b>🎨 색깔</b></span>';
      }
      return r === 'shape' ? '🔷 모양 게임! <b>' + S.an + '는 ' + S.an + ' 집</b>' : '🎨 색깔 게임! <b>' + C[0].n + '은 ' + C[0].n + ' 집</b>';
    }
    function correctBox(p) { return p.rule === 'color' ? (p.card.col === T[0].col ? 0 : 1) : (p.card.shape === T[0].shape ? 0 : 1); }
    function announce(e, t, s) {
      var a = G.el('<div class="b-announce"><div class="ba-e">' + e + '</div><div class="ba-t"></div><div class="ba-s"></div></div>');
      a.querySelector('.ba-t').textContent = t; a.querySelector('.ba-s').textContent = s || '';
      wrap.appendChild(a); G.sfx.play('up');
      return ctx.say(t + ' ' + (s || '')).then(function () { return ctx.wait(350); }).then(function () { a.remove(); });
    }
    function show() {
      if (idx >= plan.length) { end(); return; }
      var p = plan[idx], step = Promise.resolve();
      if (idx === switchAt) step = announce('🔷', '이제 모양 게임!', S.an + '는 ' + S.an + ' 집, ' + S.bn + '는 ' + S.bn + ' 집! 색깔은 이제 안 봐요.');
      else if (idx === mixedAt) step = announce('✨', '반짝 카드 게임!', '반짝 테두리가 있으면 모양 게임, 없으면 색깔 게임!' + (CUED < 99 ? ' 조금 뒤엔 규칙 글씨가 숨어요. 머릿속에 기억해 둬!' : ''));
      step.then(function () {
        reveal = false;
        mode = p.rule; rule.innerHTML = ruleText(p.rule);
        cur = p; miss = 0;
        card.className = 'sw-card' + (p.gold ? ' gold' : ''); card.style.transform = ''; void card.offsetWidth; card.classList.add('show');
        card.innerHTML = svgOf(p.card);
        open = true;
        /* 처음 카드와 규칙이 바뀐 첫 카드는 이름을 말해 준다 */
        if (idx === 0 || idx === switchAt || idx === mixedAt) ctx.say(nameOf(p.card) + '는 어느 집일까?', { repeat: true });
        else ctx.bubble(nameOf(p.card) + '는 어느 집?');
      });
    }
    function choose(i) {
      if (!open) return;
      var right = correctBox(cur);
      var post = (switchAt >= 0 && idx >= switchAt && (mixedAt < 0 || idx < mixedAt) && lv === 2) || (mixedAt >= 0 && idx >= mixedAt);
      if (i === right) {
        open = false;
        if (miss === 0) { ctx.trial(true); if (post) { postN++; postOk++; } }
        piles[i]++; boxes[i].querySelector('.sw-pile').textContent = '🃏×' + piles[i];
        flyTo(boxes[i]);
        G.sfx.play('good'); G.buzz(15);
        var c = centerOf(boxes[i]); G.fx.burst(c[0], c[1]);
        ctx.bubble(G.pick(FAST));
        idx++; prog(ctx, idx, plan.length);
        ctx.timeout(show, pace(700));
      } else {
        miss++;
        if (miss === 1) { ctx.trial(false); if (post) postN++; }
        G.sfx.play('oops'); G.ui.wiggle(boxes[i]);
        if (!reveal && CUED < 99 && idx >= mixedAt + CUED) { reveal = true; rule.innerHTML = ruleText(mode); }   /* 숨은 규칙 글씨를 다시 보여 준다 */
        var why = mode === 'color' ? '지금은 색깔 게임이야! ' + C[cur.card.col].n + '은 어느 집이지?' : '지금은 모양 게임이야! ' + (cur.card.shape === S.a ? S.an : S.bn) + '는 어느 집이지?';
        if (miss >= 2) { G.ui.hint(boxes[right]); why = '반짝이는 집이야! ' + why.split('!')[0] + '!'; }
        ctx.oops(why);
      }
    }
    function flyTo(box) {
      var a = card.getBoundingClientRect(), b = box.getBoundingClientRect();
      card.classList.add('fly');
      card.style.transform = 'translate(' + (b.left + b.width / 2 - (a.left + a.width / 2)) + 'px,' + (b.top + b.height / 2 - (a.top + a.height / 2)) + 'px) scale(.3)';
    }
    /* 끌어다 놓기도 된다 */
    G.ui.drag(card, {
      onMove: function (x, y) { boxes.forEach(function (b) { b.classList.toggle('drop', G.ui.inside(x, y, b, 10)); }); },
      onDrop: function (x, y) {
        boxes.forEach(function (b) { b.classList.remove('drop'); });
        for (var i = 0; i < 2; i++) if (G.ui.inside(x, y, boxes[i], 10)) {
          var ok = open && i === correctBox(cur);
          choose(i);
          return ok;
        }
        return false;
      }
    });
    function end() {
      if (postN) ctx.extra.switchAcc = Math.round(postOk / postN * 100);
      ctx.finish({ msg: lv >= 2 ? '규칙이 바뀌어도 척척! 생각을 바꾸는 힘이 정말 멋져!' : '색깔 집을 다 찾아 줬어! 잘했어!' });
    }

    prog(ctx, 0, plan.length);
    ctx.say(S.an + ' 친구와 ' + S.bn + ' 친구가 집을 찾아요. 먼저 색깔 게임! 같은 색깔 집에 넣어 줘.').then(show);
  }
});

/* ===========================================================
   4. 멈춰! 잡아! — 억제·주의 (Go/No-Go)
   =========================================================== */
G.act({
  id: 'gonogo', area: 'brain', title: '멈춰! 잡아!', icon: '🐟', order: 4, levels: 5, mins: 2, needs: [],
  ef: ['inhibit', 'attend'],
  desc: '물고기는 콕! 상어는 쉿!',
  goal: '억제·주의 — 계속 누르다가도 "멈춰야 할 때" 손을 멈추는 힘, 끝까지 눈을 떼지 않는 힘',
  how: '상어를 참았을 때 "와, 손이 멈췄네!" 하고 참은 것을 크게 칭찬해 주세요. 화면 밖에서는 "빨간불 멈춰, 초록불 걸어" 놀이, 음악이 멈추면 얼음 놀이, "사과 하면 손뼉, 다른 과일이면 가만히" 놀이로 이어 가세요. 4단계(도전)는 조금 더 빠르고 길게, 5단계(마스터)는 참을 친구(게)가 하나 더 나와요.',
  basis: 'Go/No-Go 과제 — 반응 억제 측정(유아용 동물 버전)',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level;
    /* 칸이 오르면 보이는 시간·사이 시간·마릿수가 다음 단계 쪽으로 1/3씩 (ctx.tune).
       4·5단계 값은 3단계 3칸이 다가가던 값 그대로 이어진다 (보이는 시간 0.93초·0.88초, 24·26마리) */
    var EXPO = pace(ctx.tune([2200, 1600, 1150, 925, 875])), ISI = pace(ctx.tune([850, 700, 600, 550, 525])), COUNT = ctx.tune([14, 18, 22, 24, 26]);
    var NOGO = lv >= 5 ? ['🦈', '🐡', '🦀'] : lv >= 3 ? ['🦈', '🐡'] : ['🦈'];
    var NG_NAME = { '🦈': '상어', '🐡': '복어', '🦀': '게' };
    B.innerHTML = '<div class="bw"><div class="gn-top"><div class="gn-net"><b>🪣</b><span>0</span><em></em></div></div><div class="gn-time"><b></b></div><div class="gn-sea"></div></div>';
    var wrap = G.$('.bw', B), sea = G.$('.gn-sea', B), netN = G.$('.gn-net span', B), netE = G.$('.gn-net em', B), tbar = G.$('.gn-time b', B);
    var HOLES = [[20, 38], [50, 30], [80, 38], [20, 76], [50, 68], [80, 76]];
    HOLES.forEach(function (h) { var d = G.el('<div class="gn-hole"></div>'); d.style.left = h[0] + '%'; d.style.top = h[1] + '%'; sea.appendChild(d); });
    var st = { hit: 0, miss: 0, fa: 0, cr: 0 }, shown = 0, lastHole = -1, crRun = 0;
    /* 순서: 25% 쉿 (처음 3개는 꼭 물고기 — 성공으로 시작) */
    var deck = [];
    for (var k = 0; k < COUNT; k++) deck.push(k >= 3 && Math.random() < 0.27 ? 'no' : 'go');
    if (deck.indexOf('no') < 0) deck[COUNT - 3] = 'no';

    function net() { netN.textContent = st.hit; netE.textContent = '🐟'.repeat(Math.min(st.hit, 14)); }
    function spawn() {
      if (shown >= deck.length) { ctx.timeout(end, 500); return; }
      var kind = deck[shown++];
      tbar.style.width = Math.round((1 - shown / deck.length) * 100) + '%';
      var h; do { h = Math.floor(Math.random() * HOLES.length); } while (h === lastHole); lastHole = h;
      var e = kind === 'go' ? G.pick(['🐟', '🐠']) : G.pick(NOGO);
      var m = G.el('<div class="gn-mob" role="button"></div>'); m.textContent = e;
      m.style.left = HOLES[h][0] + '%'; m.style.top = HOLES[h][1] + '%';
      sea.appendChild(m); G.sfx.play(kind === 'go' ? 'pop' : 'whoosh');
      var done = false;
      m.addEventListener('pointerdown', function (ev) {
        ev.preventDefault(); if (done) return; done = true;
        var c = centerOf(m);
        if (kind === 'go') {
          st.hit++; ctx.trial(true); net();
          G.sfx.play('good'); G.buzz(12); G.fx.burst(c[0], c[1], ['💦', '✨', '🫧']);
          m.classList.add('got');
          if (st.hit % 4 === 0) ctx.bubble(G.pick(['물고기를 또 구했어!', '그물이 가득해!', '척척 잘 잡는다!']));
        } else {
          st.fa++; ctx.trial(false); crRun = 0;
          G.sfx.play('oops'); m.classList.add('bye');
          floatText(wrap, '앗, ' + NG_NAME[e] + '는 쉿! 🤫', c[0], c[1] - 50);
        }
        ctx.timeout(function () { m.remove(); }, 500);
        ctx.timeout(spawn, ISI);
      });
      ctx.timeout(function () {
        if (done) return; done = true;
        var c = centerOf(m);
        if (kind === 'go') { st.miss++; ctx.trial(false); }
        else {
          st.cr++; crRun++; ctx.trial(true);
          G.sfx.play('sparkle');
          floatText(wrap, crRun >= 2 ? '✋ 또 참았다! 최고!' : '✋ 잘 참았어!', c[0], c[1] - 50);
        }
        m.classList.add('bye');
        ctx.timeout(function () { m.remove(); }, 400);
        ctx.timeout(spawn, ISI);
      }, EXPO);
    }
    function end() {
      ctx.extra.hit = st.hit; ctx.extra.miss = st.miss; ctx.extra.fa = st.fa; ctx.extra.cr = st.cr;
      ctx.finish({ msg: '물고기 ' + st.hit + '마리를 구했어! 상어는 꾹 참았지? 정말 멋져!' });
    }
    /* 보여 주며 알려 주기 */
    var demo = G.el('<div class="gn-demo' + (NOGO.length > 2 ? ' three' : '') + '"><div><span>🐟</span>콕!</div><div><span>' + NOGO.join('') + '</span>쉿! 🤫</div></div>');
    sea.appendChild(demo); demo.style.position = 'absolute'; demo.style.inset = '0';
    ctx.say('물고기 친구들을 그물로 구해 줘요! 물고기는 콕! 그런데 ' + (NOGO.length > 2 ? '상어, 복어, 게는' : NOGO.length > 1 ? '상어랑 복어는' : '상어는') + ' 쉿! 손을 멈춰요.').then(function () {
      return ctx.say('준비, 시작!');
    }).then(function () { demo.remove(); net(); ctx.timeout(spawn, 400); });
  }
});

/* ===========================================================
   5. 숨은 친구 찾기 — 선택적 주의 (시각 탐색)
   =========================================================== */
var FA_SETS = [
  { t: '🐞', n: '무당벌레', near: ['🪲', '🕷️', '🐜', '🦗'], mid: ['🐝', '🦋', '🐌', '🐛'] },
  { t: '🐥', n: '병아리', near: ['🐣', '🦆', '🐔', '🐦'], mid: ['🐶', '🐱', '🐰', '🐸'] },
  { t: '🍓', n: '딸기', near: ['🍒', '🍅', '🌶️', '🍎'], mid: ['🍌', '🍇', '🍉', '🍊'] },
  { t: '🚗', n: '자동차', near: ['🚕', '🚙', '🚓', '🏎️'], mid: ['🚌', '🚂', '🚲', '✈️'] },
  { t: '⭐', n: '별', near: ['💫', '✨', '🌙', '🔶'], mid: ['☀️', '❤️', '🔷', '🌈'] },
  { t: '🐳', n: '고래', near: ['🐬', '🦭', '🐟', '🦈'], mid: ['🐙', '🦀', '🐢', '🐠'] }
];
var FA_FAR = ['🍎', '🚗', '⭐', '🌸', '⚽', '🎈', '🧸', '📖', '🍦', '🌳', '☂️', '🎁', '🥕', '👟', '🎨', '🪁'];
G.act({
  id: 'findall', area: 'brain', title: '숨은 친구 찾기', icon: '🔍', order: 5, levels: 5, mins: 3, needs: [],
  ef: ['attend', 'inhibit'],
  desc: '숨어 있는 친구를 모두 찾기',
  goal: '선택적 주의 — 여러 가지가 섞여 있어도 찾는 것에만 눈을 모으고, 비슷한 것에 속지 않는 힘',
  how: '빨리 찾기보다 꼼꼼히 찾기를 칭찬해 주세요("하나도 안 빠뜨렸네!"). 화면 밖에서는 그림책에서 숨은 그림 찾기, 마트에서 "빨간 상자 찾기", 장난감 통에서 "자동차만 꺼내기"로 이어 가세요. 4단계(도전)는 그림이 더 많고, 5단계(마스터)는 아주 닮은 친구들 사이에서 찾아요.',
  basis: '시각 탐색·지우기(cancellation) 과제 — 선택적 주의 측정',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level;
    /* 칸이 오르면 찾을 친구·전체 그림 수가 다음 단계 쪽으로 조금씩 (ctx.tune).
       4단계 찾을 친구 10·그림 35, 5단계 12·40 (휴대폰에서도 그림이 손가락 크기 밑으로 작아지지 않는다) */
    var BOARDS = 3, TARGETS = ctx.tune([3, 5, 8, 10, 12]), TOTAL = ctx.tune([12, 20, 30, 35, 40]);
    B.innerHTML = '<div class="bw"><div class="fa-head"><span class="ft"></span><span class="fc"></span></div><div class="fa-field"></div></div>';
    var field = G.$('.fa-field', B), ft = G.$('.ft', B), fc = G.$('.fc', B);
    var sets = G.sample(FA_SETS, BOARDS), bi = 0, found = 0, cur = null, items = [], idleH = null, falseTaps = 0;

    function fontFit() {
      var r = field.getBoundingClientRect(), cols = Math.ceil(Math.sqrt(TOTAL * r.width / Math.max(r.height, 1))), rows = Math.ceil(TOTAL / cols);
      var cell = Math.min(r.width / cols, r.height / rows);
      items.forEach(function (it) { it.el.style.fontSize = Math.max(26, Math.min(76, cell * 0.6)) + 'px'; });
      return { cols: cols, rows: rows };
    }
    function board() {
      cur = sets[bi]; found = 0; items = []; field.innerHTML = '';
      ft.textContent = cur.t;
      /* 헷갈리게 하는 그림: 1단계 전혀 다른 것 · 2단계 조금 닮은 것 · 3·4단계 닮은 것 · 5단계 아주 닮은 것만 */
      var pool = lv === 1 ? FA_FAR.filter(function (x) { return x !== cur.t; }) : lv === 2 ? cur.mid.concat(G.sample(FA_FAR, 4)) : lv >= 5 ? cur.near.slice() : cur.near.concat(cur.mid.slice(0, 2));
      var list = [];
      for (var k = 0; k < TOTAL; k++) list.push(k < TARGETS ? cur.t : G.pick(pool));
      list = G.shuffle(list);
      var r = field.getBoundingClientRect(), cols = Math.ceil(Math.sqrt(TOTAL * r.width / Math.max(r.height, 1))), rows = Math.ceil(TOTAL / cols);
      var cells = G.shuffle(G.range(cols * rows)).slice(0, TOTAL);
      list.forEach(function (e, k) {
        var c = cells[k] % cols, rr = Math.floor(cells[k] / cols);
        var el = G.el('<span class="fa-it"></span>'); el.textContent = e;
        el.style.left = ((c + 0.5 + (Math.random() - 0.5) * 0.35) / cols * 100) + '%';
        el.style.top = ((rr + 0.5 + (Math.random() - 0.5) * 0.35) / rows * 100) + '%';
        el.style.setProperty('--r', Math.round((Math.random() - 0.5) * (lv >= 3 ? 40 : 20)) + 'deg');
        var it = { el: el, target: e === cur.t, done: false };
        el.addEventListener('pointerdown', function (ev) { ev.preventDefault(); tap(it); });
        field.appendChild(el); items.push(it);
      });
      fontFit(); count(); idle();
      var unit = /🍓|🚗|⭐/.test(cur.t) ? '개' : '마리';
      ctx.say(G.josa(cur.n, '을', '를') + ' ' + TARGETS + unit + ' 모두 찾아 줘!');
    }
    function count() { fc.innerHTML = '<b>' + found + '</b> / ' + TARGETS; }
    function idle() {
      clearTimeout(idleH);
      idleH = ctx.timeout(function () {
        var left = items.filter(function (it) { return it.target && !it.done; });
        if (left.length) { G.ui.hint(left[0].el); ctx.bubble('여기 하나 숨어 있는 것 같아!'); }
        idle();
      }, 18000);
    }
    function tap(it) {
      if (it.done) return;
      if (it.target) {
        it.done = true; found++; ctx.trial(true);
        it.el.classList.add('found');
        G.sfx.tone(523 * Math.pow(1.12, found), 0.18, 'triangle', 0.26); G.buzz(10);
        var c = centerOf(it.el); G.fx.burst(c[0], c[1]);
        count(); idle();
        if (found >= TARGETS) { clearTimeout(idleH); done(); }
        else if (found === Math.ceil(TARGETS / 2)) ctx.bubble('벌써 반이나 찾았어!');
      } else {
        falseTaps++; ctx.trial(false);
        G.sfx.play('oops'); G.ui.wiggle(it.el);
        ctx.bubble('음~ 그건 ' + G.josa(cur.n, '이', '가') + ' 아니야. 다시 잘 봐!');
      }
    }
    function done() {
      ctx.extra.falseTaps = falseTaps;
      bi++; ctx.progress(bi, BOARDS);
      ctx.cheer(G.pick(['다 찾았다! 눈이 정말 밝구나!', '하나도 안 빠뜨렸어! 최고야!', '꼼꼼하게 다 찾았네!'])).then(function () {
        if (bi >= BOARDS) ctx.finish({ msg: '숨은 친구를 모두 찾았어! 집중 대장이야!' });
        else board();
      });
    }
    ctx.on(window, 'resize', function () { if (items.length) fontFit(); });
    ctx.progress(0, BOARDS);
    ctx.say('친구들이 숨바꼭질을 해요. 잘 보고 찾아 줘!').then(function () { requestAnimationFrame(board); });
  }
});

/* ===========================================================
   6. 길 찾기 — 계획
   =========================================================== */
function mazeL1() {
  /* 3×3 — ㄱ자 길 하나 (나머지는 덤불) */
  var N = 3, walk = {}, sc = Math.random() < 0.5 ? 0 : 2, sr = Math.random() < 0.5 ? 0 : 2, gr = 2 - sr, gc = 2 - sc;
  var path = [], rowFirst = Math.random() < 0.5, r = sr, c = sc;
  path.push([r, c]);
  if (rowFirst) { while (c !== gc) { c += gc > c ? 1 : -1; path.push([r, c]); } while (r !== gr) { r += gr > r ? 1 : -1; path.push([r, c]); } }
  else { while (r !== gr) { r += gr > r ? 1 : -1; path.push([r, c]); } while (c !== gc) { c += gc > c ? 1 : -1; path.push([r, c]); } }
  path.forEach(function (p) { walk[p[0] + ',' + p[1]] = 1; });
  return { N: N, start: [sr, sc], goal: [gr, gc], walls: null, walk: walk };
}
function mazeDFS(N) {
  /* 완전 미로(길이 하나뿐): 벽 {n,e,s,w}. 막다른 길이 생긴다 */
  var W = [], seen = {}, r, c;
  for (r = 0; r < N; r++) { W.push([]); for (c = 0; c < N; c++) W[r].push({ n: 1, e: 1, s: 1, w: 1 }); }
  var stack = [[0, 0]]; seen['0,0'] = 1;
  var DIRS = [['n', -1, 0, 's'], ['e', 0, 1, 'w'], ['s', 1, 0, 'n'], ['w', 0, -1, 'e']];
  while (stack.length) {
    var top = stack[stack.length - 1], opts = [];
    DIRS.forEach(function (d) { var nr = top[0] + d[1], nc = top[1] + d[2]; if (nr >= 0 && nc >= 0 && nr < N && nc < N && !seen[nr + ',' + nc]) opts.push(d); });
    if (!opts.length) { stack.pop(); continue; }
    var d = G.pick(opts), nr = top[0] + d[1], nc = top[1] + d[2];
    W[top[0]][top[1]][d[0]] = 0; W[nr][nc][d[3]] = 0; seen[nr + ',' + nc] = 1; stack.push([nr, nc]);
  }
  var corners = [[0, 0], [0, N - 1], [N - 1, 0], [N - 1, N - 1]], s = G.pick(corners);
  return { N: N, start: s, goal: [N - 1 - s[0], N - 1 - s[1]], walls: W, walk: null };
}
/* 같은 크기에서 길이 더 긴 미로 — 몇 개 만들어 보고 출발에서 당근까지 가장 먼 것 */
function mazeLong(N) {
  var best = null, bl = -1;
  for (var t = 0; t < 6; t++) { var m = mazeDFS(N), l = mzPath(m, m.start).length; if (l > bl) { best = m; bl = l; } }
  return best;
}
function mzCan(m, a, b) {
  var dr = b[0] - a[0], dc = b[1] - a[1];
  if (Math.abs(dr) + Math.abs(dc) !== 1) return false;
  if (b[0] < 0 || b[1] < 0 || b[0] >= m.N || b[1] >= m.N) return false;
  if (m.walk) return !!m.walk[b[0] + ',' + b[1]];
  var w = m.walls[a[0]][a[1]];
  return !(dr === -1 ? w.n : dr === 1 ? w.s : dc === 1 ? w.e : w.w);
}
function mzPath(m, from) {
  var key = function (p) { return p[0] + ',' + p[1]; }, q = [from], prev = {}; prev[key(from)] = null;
  while (q.length) {
    var p = q.shift();
    if (p[0] === m.goal[0] && p[1] === m.goal[1]) break;
    [[-1, 0], [1, 0], [0, 1], [0, -1]].forEach(function (d) {
      var n = [p[0] + d[0], p[1] + d[1]];
      if (prev[key(n)] === undefined && mzCan(m, p, n)) { prev[key(n)] = p; q.push(n); }
    });
  }
  var out = [], cur = m.goal;
  while (cur && key(cur) !== key(from)) { out.unshift(cur); cur = prev[key(cur)]; }
  return out;
}
G.act({
  id: 'maze', area: 'brain', title: '길 찾기', icon: '🐰', order: 6, levels: 5, mins: 3, needs: [],
  ef: ['plan', 'attend', 'inhibit'],
  desc: '토끼가 당근까지 가는 길 찾기',
  goal: '계획 — 움직이기 전에 머릿속으로 길을 먼저 그려 보고, 막히면 돌아가 다른 길을 찾는 힘',
  how: '출발 전에 "손가락으로 먼저 길을 따라가 볼까?" 하고 눈으로 먼저 가 보게 해 주세요. 막다른 길에 가도 "돌아가면 돼!" 하고 다시 찾는 것을 칭찬해요. 화면 밖에서는 방석·의자로 거실 미로 만들기, 그림책 미로를 손가락으로 따라가기로 이어 가세요. 4·5단계(도전·마스터)는 6칸·7칸 미로를 먼저 조금 더 오래 보고 출발해요.',
  basis: '미로 계획 과제(Porteus 미로 형식) — 3단계는 먼저 보고 길을 계획한 뒤 출발',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level, st = G.clamp(ctx.step || 1, 1, 3);
    var COUNT = 4, mi = 0, m = null, pos = null, moves = 0, back = 0, bad = 0, visited = {}, locked = true, log = [];
    /* 판마다 미로 크기 (0 = ㄱ자 길). 칸이 오르면 쉬운 판 하나가 한 크기 큰 미로로 바뀐다 — 뒤쪽 판부터.
       4단계 6칸(2·3칸은 7칸 맛보기), 5단계 7칸. 휴대폰 화면에 칸이 손가락보다 작아지지 않게 7칸까지만 */
    var SIZES = lv === 1 ? [[0, 0, 3, 3], [0, 3, 3, 3], [0, 3, 3, 4]] : lv === 2 ? [[4, 4, 4, 4], [4, 4, 4, 5], [4, 4, 5, 5]] : lv === 3 ? [[5, 5, 5, 5], [5, 5, 5, 6], [5, 5, 6, 6]] :
      lv === 4 ? [[6, 6, 6, 6], [6, 6, 6, 7], [6, 6, 7, 7]] : [[7, 7, 7, 7], [7, 7, 7, 7], [7, 7, 7, 7]];
    var plan = SIZES[st - 1];
    /* 5단계 2·3칸: 뒤쪽 한두 판은 길이 더 긴 미로(여러 개 만들어 가장 긴 것)로 — 크기는 그대로 */
    var LONG_FROM = lv >= 5 ? COUNT - (st - 1) : COUNT;
    B.innerHTML = '<div class="bw"><div class="mz-look"></div><div class="mz-board locked"></div></div>';
    var board = G.$('.mz-board', B), look = G.$('.mz-look', B), cells = [];
    function k(p) { return p[0] + ',' + p[1]; }
    function cellAt(p) { return cells[p[0] * m.N + p[1]]; }
    function render() {
      board.innerHTML = ''; cells = [];
      board.style.gridTemplateColumns = 'repeat(' + m.N + ',1fr)';
      /* 4·5단계 큰 미로는 줄 높이도 똑같이 — 그림 있는 줄만 커져 빈 줄이 손가락보다 작아지지 않게 */
      if (lv >= 4) board.style.gridTemplateRows = 'repeat(' + m.N + ',minmax(0,1fr))';
      board.style.setProperty('--fs', 'calc(min(100vw,560px,62vh) / ' + m.N + ' * .52)');
      for (var r = 0; r < m.N; r++) for (var c = 0; c < m.N; c++) {
        var el = G.el('<div class="mz-cell"></div>'); el.dataset.r = r; el.dataset.c = c;
        if (m.walls) { var w = m.walls[r][c]; if (w.n) el.classList.add('wn'); if (w.e) el.classList.add('we'); if (w.s) el.classList.add('ws'); if (w.w) el.classList.add('ww'); }
        else if (!m.walk[r + ',' + c]) { el.classList.add('bush'); el.textContent = G.pick(['🌳', '🌲', '🌿']); }
        board.appendChild(el); cells.push(el);
      }
      cellAt(m.goal).innerHTML = '<span>🥕</span>';
      place();
    }
    function place() {
      var old = G.$('.mz-rab', board); if (old) old.remove();
      var c = cellAt(pos); c.classList.add('trail');
      var r = G.el('<span class="mz-rab hop">🐰</span>');
      if (pos[0] === m.goal[0] && pos[1] === m.goal[1]) c.innerHTML = '';
      c.appendChild(r);
    }
    function tryMove(t) {
      if (locked) return;
      if (t[0] === pos[0] && t[1] === pos[1]) return;
      if (!mzCan(m, pos, t)) {
        var adj = Math.abs(t[0] - pos[0]) + Math.abs(t[1] - pos[1]) === 1;
        bad++; G.ui.wiggle(G.$('.mz-rab', board)); G.sfx.play('oops');
        ctx.bubble(adj ? (m.walls ? '앗, 벽이야! 다른 길로!' : '앗, 덤불이야! 다른 길로!') : '토끼는 한 칸씩 깡충!');
        if (bad >= 3) { var p = mzPath(m, pos); if (p.length) G.ui.hint(cellAt(p[0])); bad = 0; }
        return;
      }
      bad = 0; moves++;
      if (visited[k(t)]) back++;
      visited[k(t)] = 1;
      pos = t; place(); G.sfx.tone(600 + Math.random() * 200, 0.08, 'sine', 0.2); G.buzz(8);
      if (pos[0] === m.goal[0] && pos[1] === m.goal[1]) win();
    }
    function win() {
      locked = true; board.classList.add('locked');
      var opt = mzPath(m, m.start).length;
      log.push({ n: m.N, mv: moves, opt: opt, back: back });
      /* 되돌아온 칸은 미로가 클수록 조금 더 너그럽게 (4칸 미로 2, 5칸 4, 6칸 5, 7칸 6) */
      var ok = m.N === 3 ? true : back <= (m.N >= 7 ? 6 : m.N >= 6 ? 5 : m.N >= 5 ? 4 : 2);
      ctx.trial(ok);
      ctx.extra.mazes = log;
      G.sfx.play('great'); var c = centerOf(cellAt(m.goal)); G.fx.burst(c[0], c[1], ['🥕', '⭐', '✨']);
      ctx.cheer(G.pick(['냠냠! 당근을 찾았다!', '길을 찾았어! 토끼가 신났어!', '깡충깡충 도착! 최고야!'])).then(function () {
        mi++; ctx.progress(mi, COUNT);
        if (mi >= COUNT) ctx.finish({ msg: '토끼 길을 다 찾아 줬어! 생각하고 움직이는 힘이 멋져!' });
        else start();
      });
    }
    function start() {
      m = !plan[mi] ? mazeL1() : mi >= LONG_FROM ? mazeLong(plan[mi]) : mazeDFS(plan[mi]);
      pos = m.start.slice(); moves = 0; back = 0; bad = 0; visited = {}; visited[k(pos)] = 1;
      render();
      if (lv >= 3) {
        locked = true; board.classList.add('locked');
        look.textContent = '👀 먼저 눈으로 길을 찾아봐!';
        /* 먼저 보는 시간: 3단계 2.5초 그대로, 4·5단계는 미로가 큰 만큼 조금 더 (6칸 3초, 7칸 3.5초) */
        var lookMs = lv >= 4 ? 2500 + (m.N - 5) * 500 : 2500;
        ctx.say(mi === 0 ? '먼저 생각하고 출발! 눈으로 당근까지 가는 길을 따라가 봐.' : '눈으로 먼저 길을 찾아봐!').then(function () { return ctx.wait(pace(lookMs)); }).then(function () {
          look.textContent = '🏁 출발!'; G.sfx.play('up'); locked = false; board.classList.remove('locked');
        });
      } else {
        locked = false; board.classList.remove('locked');
        look.textContent = '🐰 → 🥕';
        if (mi === 0) ctx.say('토끼가 배고파요. 당근까지 가는 길을 찾아 줘! 옆 칸을 누르면 깡충 가요.');
      }
    }
    /* 누르기 + 끌기 */
    var dragging = false;
    function cellFrom(e) {
      var t = document.elementFromPoint(e.clientX, e.clientY); t = t && t.closest ? t.closest('.mz-cell') : null;
      return t && board.contains(t) ? [+t.dataset.r, +t.dataset.c] : null;
    }
    ctx.on(board, 'pointerdown', function (e) { e.preventDefault(); dragging = true; var c = cellFrom(e); if (c) tryMove(c); });
    ctx.on(board, 'pointermove', function (e) {
      if (!dragging || locked) return; var c = cellFrom(e);
      if (c && (c[0] !== pos[0] || c[1] !== pos[1]) && Math.abs(c[0] - pos[0]) + Math.abs(c[1] - pos[1]) === 1 && mzCan(m, pos, c)) tryMove(c);
    });
    ctx.on(window, 'pointerup', function () { dragging = false; });
    ctx.progress(0, COUNT);
    start();
  }
});

/* ===========================================================
   7. 기다려! 쿠키 — 만족 지연·자기조절
   =========================================================== */
var WT_HELP = [
  { cls: 'hands', e: '🙌', t: '손을 무릎에 올려요', say: '기다리는 동안 손을 무릎에 살짝 올려 볼까?' },
  { cls: 'breathe', e: '🌬️', t: '흡~ 후~ 숨쉬기', say: '기다리는 동안 꽃 냄새 맡듯 흡~ 촛불 끄듯 후~ 해 볼까?' },
  { cls: 'song', e: '🎵', t: '노래 불러요', say: '기다리는 동안 자비스랑 노래 부르자! 랄라라~' }
];
G.act({
  id: 'wait', area: 'brain', title: '기다려! 쿠키', icon: '🍪', order: 7, levels: 5, mins: 2, needs: [],
  ef: ['inhibit', 'regulate'],
  desc: '종이 울리면 쿠키가 두 개!',
  goal: '만족 지연·자기조절 — 지금 당장 갖고 싶은 마음을 참고 기다리며, 기다리는 방법(손 두기·숨쉬기·노래)을 스스로 쓰는 힘',
  how: '기다리는 동안 자비스가 보여 주는 방법(손 무릎에, 숨쉬기, 노래)을 부모도 같이 해 주세요. 못 기다려도 괜찮아요 — "다음엔 노래하면서 기다려 볼까?"로 끝내요. 화면 밖에서는 간식 앞에서 "모래시계 다 내려가면 먹자", 엘리베이터 기다리며 숫자 세기로 이어 가세요. 4·5단계(도전·마스터)는 한 번에 20~38초쯤 기다려요.',
  basis: '만족 지연(마시멜로) 과제 변형 (Mischel) — 기다리기 전략 모델링 포함',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level;
    /* 칸이 오르면 기다리는 시간이 다음 단계 쪽으로 조금씩 (초, ctx.tune). 4단계 25초 · 5단계 30초 (세 판은 0.8·1·1.2배) */
    var BASE = ctx.tune([5, 10, 20, 25, 30]), ROUNDS = 3, r = 0, total = 0, waitedN = 0, stopMel = null;
    B.innerHTML = '<div class="bw"><div class="wt-plate"><small>내 접시</small><span class="wt-got"></span></div>' +
      '<div class="wt-main"><div class="wt-cookie" role="button" aria-label="쿠키">🍪<span class="two">×2</span></div>' +
      '<div class="wt-jarbox"><span class="wt-bell">🔔</span><div class="wt-jar"><div class="wt-fill"></div><div class="wt-stars"></div></div></div></div>' +
      '<div class="wt-help"><span class="he"></span><span class="ht"></span></div></div>';
    var cookie = G.$('.wt-cookie', B), two = G.$('.two', B), fill = G.$('.wt-fill', B), stars = G.$('.wt-stars', B), bell = G.$('.wt-bell', B),
      help = G.$('.wt-help', B), plate = G.$('.wt-got', B);
    var waiting = false, early = false, t0 = 0, dur = 0;
    ctx.cleanup(function () { if (stopMel) stopMel(); });

    cookie.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (!waiting) { G.sfx.play('tap'); return; }
      if (early) { G.sfx.play('tap'); return; }
      early = true;
      cookie.classList.add('bit'); two.textContent = '×1';
      G.sfx.play('oops');
      ctx.say(G.pick(['괜찮아, 다시 기다려 보자. 땡 할 때까지!', '앗, 쿠키가 기다려 달래. 다시 기다려 볼까?']), { repeat: false });
    });
    function round() {
      var h = WT_HELP[r % WT_HELP.length];
      dur = Math.round(BASE * [0.8, 1, 1.2][r] * 1000);
      early = false; cookie.classList.remove('bit'); two.textContent = '×2';
      fill.style.height = '0'; stars.innerHTML = '';
      help.className = 'wt-help ' + h.cls; help.querySelector('.he').textContent = h.e; help.querySelector('.ht').textContent = h.t;
      var intro = r === 0 ? '쿠키 가게예요! 땡 할 때까지 기다려요. 그럼 쿠키 두 개!' :
        G.pick(['또 기다려 볼까? 땡 하면 두 개!', '이번엔 조금 더 길어요. 할 수 있어!']);
      ctx.say(intro).then(function () { return ctx.say(h.say); }).then(function () {
        waiting = true; t0 = performance.now();
        if (h.cls === 'song' && !calm()) stopMel = G.sfx.melody([['C5', .5], ['E5', .5], ['G5', 1], ['E5', .5], ['C5', .5], ['D5', 1], [null, .5]], 96, true);
        var lastSec = 0, starN = 0;
        ctx.loop(function () {
          var el = performance.now() - t0, p = Math.min(1, el / dur);
          fill.style.height = (p * 100) + '%';
          var want = Math.floor(p * 12);
          while (starN < want) { stars.appendChild(G.el('<span>⭐</span>')); starN++; }
          var sec = Math.floor(el / 1000);
          if (sec > lastSec) { lastSec = sec; if (!calm() && h.cls !== 'song') G.sfx.play('tick'); }
          if (p >= 1) { ring(); return false; }
        });
      });
    }
    function ring() {
      waiting = false; if (stopMel) { stopMel(); stopMel = null; }
      bell.classList.remove('ring'); void bell.offsetWidth; bell.classList.add('ring');
      G.sfx.play('ding'); G.buzz([20, 40, 20]);
      var n = early ? 1 : 2, ok = !early;
      ctx.trial(ok); if (ok) waitedN++;
      total += n;
      /* 쿠키가 접시로 날아간다 */
      var a = cookie.getBoundingClientRect(), b = plate.getBoundingClientRect();
      for (var k = 0; k < n; k++) {
        var f = G.el('<span class="wt-fly">🍪</span>');
        f.style.left = (a.left + a.width / 2 - 22 + k * 20) + 'px'; f.style.top = (a.top + a.height / 2 - 22) + 'px';
        document.body.appendChild(f);
        (function (f) { requestAnimationFrame(function () { f.style.transform = 'translate(' + (b.right - a.left - a.width / 2) + 'px,' + (b.top - a.top - a.height / 2) + 'px) scale(.6)'; f.style.opacity = '.2'; }); setTimeout(function () { f.remove(); }, 900); })(f);
      }
      ctx.timeout(function () { plate.textContent = '🍪'.repeat(total); }, 700);
      var msg = ok ? G.pick(['땡! 기다렸더니 쿠키가 두 개! 정말 잘 참았어!', '와, 끝까지 기다렸어! 쿠키 두 개!', '꾹 참았구나! 기다리는 힘이 쑥쑥!']) :
        '쿠키 하나! 다시 기다린 것도 정말 잘했어. 다음엔 땡 할 때까지 해 보자!';
      (ok ? ctx.cheer(msg, cookie) : ctx.say(msg, { repeat: false })).then(function () {
        r++; ctx.progress(r, ROUNDS);
        if (r >= ROUNDS) { ctx.extra.waited = waitedN; ctx.extra.sec = BASE; ctx.finish({ msg: '쿠키를 ' + total + '개나 모았어! 기다리는 힘이 정말 멋져!' }); }
        else round();
      });
    }
    ctx.progress(0, ROUNDS);
    round();
  }
});

/* ===========================================================
   8. 반대로 해요 — 억제 + 운동 (HTKS)
   =========================================================== */
var OP_NAME = { head: '머리', shoulder: '어깨', knee: '무릎', foot: '발' };
var OP_OPP = { head: 'foot', foot: 'head', shoulder: 'knee', knee: 'shoulder' };
/* 4·5단계 새 짝꿍 (HTKS 3부): 머리 ↔ 무릎, 어깨 ↔ 발 — 익숙한 짝꿍을 참고 새 짝꿍으로 */
var OP_NEW = { head: 'knee', knee: 'head', shoulder: 'foot', foot: 'shoulder' };
function opFigure() {
  return '<svg class="op-fig" viewBox="0 0 200 300" aria-hidden="true">' +
    '<rect x="62" y="84" width="76" height="92" rx="26" fill="#8fb4ff"/>' +
    '<rect x="34" y="90" width="20" height="74" rx="10" fill="#8fb4ff" transform="rotate(14 44 90)"/>' +
    '<rect x="146" y="90" width="20" height="74" rx="10" fill="#8fb4ff" transform="rotate(-14 156 90)"/>' +
    '<rect x="72" y="168" width="22" height="104" rx="11" fill="#5b7fd6"/><rect x="106" y="168" width="22" height="104" rx="11" fill="#5b7fd6"/>' +
    '<circle class="op-part" data-p="head" cx="100" cy="46" r="34" fill="#ffd9b8"/>' +
    '<circle cx="88" cy="42" r="4" fill="#24344a"/><circle cx="112" cy="42" r="4" fill="#24344a"/><path d="M88 58 Q100 68 112 58" stroke="#24344a" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
    '<circle class="op-part" data-p="shoulder" cx="64" cy="94" r="15" fill="#a9c6ff"/><circle class="op-part" data-p="shoulder" cx="136" cy="94" r="15" fill="#a9c6ff"/>' +
    '<circle class="op-part" data-p="knee" cx="83" cy="220" r="14" fill="#7d9be6"/><circle class="op-part" data-p="knee" cx="117" cy="220" r="14" fill="#7d9be6"/>' +
    '<ellipse class="op-part" data-p="foot" cx="78" cy="280" rx="20" ry="11" fill="#ffb74d"/><ellipse class="op-part" data-p="foot" cx="122" cy="280" rx="20" ry="11" fill="#ffb74d"/>' +
    '</svg>';
}
G.act({
  id: 'opposite', area: 'brain', title: '반대로 해요', icon: '🙃', order: 8, levels: 5, mins: 3, needs: [],
  ef: ['inhibit', 'wm', 'attend'],
  desc: '"머리!" 하면 발을 짚어요',
  goal: '억제·작업기억·주의 — 들은 말을 바로 따라 하지 않고, 규칙을 기억해 반대 행동으로 바꾸는 힘(몸으로 하는 실행기능)',
  how: '부모가 옆에서 같이 일어나 함께 해 주세요. 아이가 헷갈리면 천천히 말하고, 맞으면 크게 손뼉! 화면 밖에서는 차 안·목욕 시간에 "머리-발" 반대 놀이, "가라 하면 서기, 서라 하면 가기" 놀이로 짧게 이어 가세요. 4단계(도전)는 익숙한 짝꿍으로 시작했다가 새 짝꿍(머리 ↔ 무릎, 어깨 ↔ 발)으로 바뀌고, 5단계(마스터)는 처음부터 새 짝꿍이에요.',
  basis: '머리-발가락-무릎-어깨 과제 HTKS (Ponitz 외, 2008)',
  run: function (ctx) {
    var B = ctx.body, lv = ctx.level, st = ctx.step || 1;
    /* 칸이 오르면 — 2단계: 어깨·무릎 명령이 한 번(2칸)·두 번(3칸) 섞인다(3단계 맛보기). 3단계: 명령이 하나씩 더 */
    var N = 6 + (lv >= 3 ? st - 1 : 0), parts = lv === 1 ? ['head', 'shoulder', 'knee', 'foot'] : lv === 2 ? ['head', 'foot'] : ['head', 'foot', 'shoulder', 'knee'];
    var opposite = lv >= 2, extra = lv === 2 ? st - 1 : 0;
    /* 4·5단계 — 새 짝꿍(OP_NEW). 4단계는 익숙한 짝꿍 명령(PRE개: 1칸 3 → 2칸 2 → 3칸 1) 뒤에 새 짝꿍으로 바뀐다(모두 7개).
       5단계는 처음부터 새 짝꿍, 명령 7개에 칸마다 하나씩 더 */
    var newRule = lv >= 4, PRE = lv === 4 ? 4 - G.clamp(st, 1, 3) : 0, told = PRE === 0;
    if (lv === 4) N = 7; else if (lv >= 5) N = 7 + st - 1;
    function mapOf(k) { return newRule && k >= PRE ? OP_NEW : OP_OPP; }
    var RULE_OLD = '🔄 반대로! <b>머리 ↔ 발</b> · <b>어깨 ↔ 무릎</b>', RULE_NEW = '🔀 새 짝꿍! <b>머리 ↔ 무릎</b> · <b>어깨 ↔ 발</b>';
    B.innerHTML = '<div class="bw"><div class="b-rule"></div><div class="op-wrap">' + opFigure() + '<div class="op-say"></div></div></div>';
    var rule = G.$('.b-rule', B), say = G.$('.op-say', B), svg = G.$('.op-fig', B);
    rule.innerHTML = !opposite ? '👯 똑같이 짚어요!' : lv === 2 && !extra ? '🔄 반대로! <b>머리 ↔ 발</b>' : newRule && PRE === 0 ? RULE_NEW : RULE_OLD;
    var deck = [];
    for (var k = 0; k < N; k++) { var p; do { p = G.pick(parts); } while (k > 0 && deck[k - 1] === p); deck.push(p); }
    /* 첫 명령은 늘 머리·발 — 어깨·무릎은 그 뒤 아무 자리에 (둘이면 어깨 하나, 무릎 하나) */
    if (extra) { var sk = G.shuffle(['shoulder', 'knee']); G.sample(G.range(N).slice(1), extra).forEach(function (j, n) { deck[j] = sk[n]; }); }
    var i = 0;
    function mark(p, cls) { G.$$('.op-part', svg).forEach(function (el) { el.classList.toggle(cls, el.dataset.p === p); }); }
    function clear() { G.$$('.op-part', svg).forEach(function (el) { el.classList.remove('on', 'ans'); }); }
    function step(tries) {
      if (i >= N) { ctx.finish({ msg: newRule ? '새 짝꿍도 척척! 헷갈리지 않고 바꾸는 힘이 정말 멋져!' : opposite ? '반대로 척척! 몸으로 생각하는 힘이 정말 멋져!' : '머리, 어깨, 무릎, 발! 다 짚었어!' }); return; }
      /* 4단계: 새 짝꿍으로 바뀌는 자리에서 한 번 알려 준다 */
      if (!told && i === PRE) {
        told = true; clear(); rule.innerHTML = RULE_NEW; G.sfx.play('up');
        say.innerHTML = '🔀<small>새 짝꿍!</small>';
        ctx.say('규칙이 바뀌었어요! 새 짝꿍! 머리 하면 무릎, 무릎 하면 머리. 어깨 하면 발, 발 하면 어깨!').then(function () { return ctx.wait(pace(500)); }).then(function () { step(0); });
        return;
      }
      var cmd = deck[i], target = opposite ? mapOf(i)[cmd] : cmd;
      clear(); mark(cmd, 'on');
      say.innerHTML = OP_NAME[cmd] + '!<small>' + (opposite ? '반대는 어디?' : '여기를 짚어요') + '</small>';
      if (tries >= 1) { mark(target, 'ans'); say.innerHTML = OP_NAME[cmd] + '!<span class="op-arrow">→ ' + OP_NAME[target] + '</span>'; }
      G.sfx.play('drum');
      var line = OP_NAME[cmd] + '!';
      if (tries >= 1) line = OP_NAME[cmd] + ' 하면, ' + OP_NAME[target] + '! 같이 해 보자. ' + OP_NAME[cmd] + '!';
      ctx.say(line).then(function () { return ctx.wait(pace(1500)); }).then(function () {
        return ctx.parentJudge(G.$('.bw', B), opposite ? ['👍 반대로 했어요', '🔁 다시'] : ['👍 짚었어요', '🔁 다시']);
      }).then(function (ok) {
        if (ok) {
          if (tries === 0) ctx.trial(true);
          mark(target, 'ans');
          ctx.cheer(G.pick(opposite ? ['반대로 했다! 최고야!', '머리가 척척! 멋져!', '헷갈리지 않았어! 짝짝짝!'] : ['맞아, 거기야!', '잘 짚었어!', '좋았어!'])).then(function () {
            i++; ctx.progress(i, N); step(0);
          });
        } else {
          if (tries === 0) ctx.trial(false);
          if (tries >= 1) { i++; ctx.progress(i, N); ctx.say('괜찮아, 다음 거 해 보자!').then(function () { step(0); }); return; }
          ctx.oops(opposite ? '괜찮아, 천천히! 자비스가 알려 줄게.' : '괜찮아, 다시 해 보자!').then(function () { step(1); });
        }
      });
    }
    ctx.progress(0, N);
    var intro = !opposite ? '자비스가 말하는 곳을 짚어 볼까? 일어나서 같이 해요!' :
      lv === 2 ? '반대로 놀이! 자비스가 "머리!" 하면 발을, "발!" 하면 머리를 짚어요. 헷갈리지 않게!' + (extra ? ' 가끔은 어깨 하면 무릎, 무릎 하면 어깨!' : '') :
        newRule && PRE === 0 ? '새 짝꿍 반대 놀이! 머리 하면 무릎, 무릎 하면 머리. 어깨 하면 발, 발 하면 어깨! 천천히 생각하고 짚어요.' :
          '반대로 놀이! 머리 하면 발, 발 하면 머리. 어깨 하면 무릎, 무릎 하면 어깨! ' + (newRule ? '조금 뒤에 새 짝꿍 규칙으로 바뀌어요. 잘 들어 봐!' : '할 수 있어!');
    ctx.say(intro).then(function () { step(0); });
  }
});
})();

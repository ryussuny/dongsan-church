/* ===========================================================
   함께 자라요 — 그리기 (미술치료: 표현·창작)

     draw      자유 그리기   색 10가지·무지개 붓·도장·지우개·되돌리기·펜 압력
     mirror    거울 그림     한쪽에 그리면 2·4·8 방향으로 (대칭·만다라)
     color     색칠하기      칸을 콕 누르면 색이 쏙 — 단계마다 칸이 늘어난다
     feeldraw  기분 그림     오늘 마음을 고르고, 그 마음을 색으로
     gallery   그림첩(도구)  저장한 그림 모아 보기·받기·지우기(어른 확인)

   ▸ 미술치료는 결과보다 과정이다. 맞고 틀림이 없으니 ctx.trial 을 쓰지 않는다.
     자비스는 "이건 뭐야?" 대신 "이야기해 줄래?" 하고, 한 일을 그대로 말해 준다.
   ▸ 그림은 이 기기(IndexedDB 'art')에만 둔다 — {id, t, img(jpeg), kind, emo}
   ▸ 종이는 어두운 화면에서도 언제나 하얗다.
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;
if (!G || !D) return;

/* ---------- 함께 쓰는 것 ---------- */
var STAMPS = ['⭐', '🌸', '❤️', '🐶', '🚗', '☀️', '🐱', '🌈', '🦋', '🍎', '🎈', '🐟'];
var SIZES = [5, 12, 24];            // 붓 굵기(px)
var DOTS = [9, 16, 25];             // 굵기 단추에 보이는 점
var STAMP_PX = [40, 62, 96];        // 도장 크기(px)
var EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
var WHITE = '#ffffff', INK = '#3a3a48';
var ADJ = { happy: '기쁜', sad: '슬픈', angry: '화난', scared: '무서운', surprised: '놀란', sleepy: '졸린', calm: '편안한', hurt: '아픈', love: '사랑하는', shy: '부끄러운' };
var HARD = { sad: 1, angry: 1, scared: 1, hurt: 1 };
var NATIVE = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];
var KIND = { draw: '🖍️', mirror: '🪞', color: '🎨', feel: '💗' };

var FIRST = ['우와, 쓱쓱! 멋진 선이다!', '좋아, 마음대로 그려 봐!', '손이 춤을 추네!', '와, 예쁜 색이 나왔다!'];
var ASK = ['무엇을 그리고 있어? 엄마 아빠한테 이야기해 줄래?', '이 그림에는 어떤 이야기가 있을까? 들려줄래?', '어떤 이야기가 숨어 있을까? 자비스도 궁금해!'];
var BLANK = ['아직 하얀 종이야! 쓱 한 번 그려 볼까?', '먼저 콕 하고 점 하나 찍어 볼까?'];

function emoOf(id) { return D.EMOTIONS.filter(function (e) { return e.id === id; })[0]; }
function countWord(n) { return n <= 10 ? NATIVE[n] : String(n); }
/* 진행 점은 10개까지만 */
function prog(ctx, i, n, max) { max = max || 10; if (n > max) { i = Math.round(i * max / n); n = max; } ctx.progress(i, n); }

/* ---------- 모양 ---------- */
var BOARD = ':is(.act-draw,.act-mirror,.act-feeldraw)';
G.css('art', `
/* ── 그림판 (draw · mirror · feeldraw 가 함께 씀) ── */
.st-body${BOARD}{padding-bottom:calc(8px + var(--safe-b))}
${BOARD} .ab{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;width:100%}
${BOARD} .ab-paper{position:relative;flex:1;min-height:0;min-width:0;background:#fff;border-radius:22px;overflow:hidden;touch-action:none;
  box-shadow:var(--shadow),inset 0 0 0 2px rgba(36,52,74,.07)}
${BOARD} .ab-paper .gcv{position:absolute;left:0;top:0;border-radius:0;cursor:crosshair}
${BOARD} .ab-paper.fly{transition:transform .6s cubic-bezier(.5,-.25,.7,1),opacity .6s;transform:translate(30%,-45%) scale(.12) rotate(10deg);opacity:0}
${BOARD} .ab-guide{position:absolute;inset:0;pointer-events:none;z-index:1;display:none}
${BOARD} .ab-guide i{position:absolute;border:0 dashed rgba(154,116,255,.38)}
${BOARD} .ab-guide .v{left:50%;top:0;bottom:0;border-left-width:2px;margin-left:-1px}
${BOARD} .ab-guide .h{top:50%;left:0;right:0;border-top-width:2px;margin-top:-1px}
${BOARD} .ab-guide .d1,${BOARD} .ab-guide .d2{left:50%;top:50%;width:300vmax;height:0;border-top-width:2px;transform:translate(-50%,-50%) rotate(45deg)}
${BOARD} .ab-guide .d2{transform:translate(-50%,-50%) rotate(-45deg)}
${BOARD} .ab-guide.s2,${BOARD} .ab-guide.s4,${BOARD} .ab-guide.s8{display:block}
${BOARD} .ab-guide.s2 .h,${BOARD} .ab-guide.s2 .d1,${BOARD} .ab-guide.s2 .d2,${BOARD} .ab-guide.s4 .d1,${BOARD} .ab-guide.s4 .d2{display:none}
${BOARD} .ab-guide b{position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:rgba(154,116,255,.35)}
${BOARD} .ab-badge{position:absolute;left:10px;top:10px;z-index:2;pointer-events:none;background:rgba(255,255,255,.92);color:#24344a;border-radius:999px;
  padding:2px 14px 2px 6px;font-family:Jua,sans-serif;font-size:clamp(15px,4vw,19px);box-shadow:0 2px 10px rgba(36,52,74,.12);display:flex;align-items:center;gap:4px}
${BOARD} .ab-badge span{font-size:1.6em;line-height:1.2}
${BOARD} .ab-ask{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.72);animation:fade .2s;padding:12px}
${BOARD} .ab-ask-c{background:var(--surface);color:var(--ink);border-radius:26px;padding:16px 18px;box-shadow:0 14px 40px rgba(0,0,0,.2);text-align:center;animation:pop .35s;max-width:420px}
${BOARD} .ab-ask-c b{display:block;font-family:Jua,sans-serif;font-size:clamp(22px,6vw,28px);font-weight:400;margin-bottom:10px}
${BOARD} .ab-ask-c div{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
${BOARD} .ab-ask-c .btn{flex:1;min-width:120px;padding:12px 14px;white-space:nowrap}
${BOARD} .ab-tools{display:flex;flex-direction:column;gap:6px;flex:none}
${BOARD} .ab-pal{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
${BOARD} .ab-sw{height:clamp(46px,10vw,54px);border-radius:999px;background:var(--sw);border:3px solid transparent;font-size:clamp(20px,5.4vw,26px);line-height:1;
  box-shadow:inset 0 -5px 0 rgba(0,0,0,.14);transition:transform .12s,box-shadow .12s}
${BOARD} .ab-sw.wh{border-color:var(--line)}
${BOARD} .ab-sw.rb{background:conic-gradient(from 90deg,#ef5350,#ffa726,#ffca28,#66bb6a,#42a5f5,#ab47bc,#ef5350)}
${BOARD} .ab-sw.wide{grid-column:span 2}
${BOARD} .ab-sw.on{box-shadow:0 0 0 3px var(--surface),0 0 0 6px var(--ink);transform:scale(1.06)}
${BOARD} .ab-sw:active{transform:scale(.94)}
${BOARD} .ab-st{height:clamp(38px,10vw,50px);border-radius:16px;background:var(--surface);box-shadow:var(--shadow);font-size:clamp(22px,6vw,30px);line-height:1;border:3px solid transparent}
${BOARD} .ab-st.on{border-color:var(--area);background:color-mix(in srgb,var(--area) 16%,var(--surface));transform:scale(1.06)}
${BOARD} .ab-row{display:grid;grid-template-columns:repeat(8,1fr);gap:6px}
${BOARD} .ab-tb{position:relative;height:clamp(46px,12vw,58px);border-radius:16px;background:var(--surface);box-shadow:var(--shadow);border:3px solid transparent;
  font-size:clamp(20px,5.6vw,27px);line-height:1;display:flex;align-items:center;justify-content:center;transition:transform .1s}
${BOARD} .ab-tb:active{transform:scale(.93)}
${BOARD} .ab-tb.on{border-color:var(--area);background:color-mix(in srgb,var(--area) 16%,var(--surface))}
${BOARD} .ab-tb:disabled{opacity:.35}
${BOARD} .ab-tb.save{background:var(--good);color:#fff;box-shadow:0 4px 0 color-mix(in srgb,var(--good) 70%,#000)}
${BOARD} .ab-tb i{display:block;border-radius:50%;background:var(--dot);font-style:normal;line-height:1}
${BOARD} .ab-tb i.rb{background:conic-gradient(#ef5350,#ffca28,#66bb6a,#42a5f5,#ab47bc,#ef5350)}
${BOARD} .ab-tb i.er{background:#fff;border:2px dashed var(--soft)}
${BOARD} .ab-tb i.st{background:none;border-radius:0}
${BOARD} .ab-tb i.wh{border:2px solid var(--line)}
${BOARD} .ab-tb b{position:absolute;right:4px;bottom:2px;font-family:Jua,sans-serif;font-weight:400;font-size:14px;color:var(--area)}
@media (orientation:landscape) and (min-width:700px){
  ${BOARD} .ab{flex-direction:row}
  ${BOARD} .ab-tools{width:clamp(204px,23vw,264px);overflow-y:auto;justify-content:center;padding:8px}
  ${BOARD} .ab-pal,${BOARD} .ab-row{grid-template-columns:repeat(3,1fr)}
  ${BOARD} .ab-tb.save{grid-column:span 2}
  ${BOARD} .ab-sw,${BOARD} .ab-st{height:46px}
  ${BOARD} .ab-tb{height:56px;font-size:26px}
}
@media (orientation:landscape) and (min-width:700px) and (max-height:520px){
  ${BOARD} .ab-tools{width:244px}
  ${BOARD} .ab-pal,${BOARD} .ab-row{grid-template-columns:repeat(4,1fr);gap:5px}
  ${BOARD} .ab-tb.save{grid-column:auto}
  ${BOARD} .ab-sw,${BOARD} .ab-st{height:44px;font-size:20px}
  ${BOARD} .ab-tb{height:42px;font-size:21px}
  #stage:has(> .st-body${BOARD}) .st-top{padding-top:calc(4px + var(--safe-t));padding-bottom:2px}
  #stage:has(> .st-body${BOARD}) .st-jv{min-height:0;padding:0 12px 3px}
  #stage:has(> .st-body${BOARD}) .st-jv .jvm{width:36px;height:36px}
  #stage:has(> .st-body${BOARD}) .st-bubble{font-size:14px;padding:4px 12px}
}

/* ── 색칠하기 ── */
.act-color .cp-thumb svg{width:clamp(96px,28vw,170px);height:auto;display:block;background:#fff;border-radius:18px}
.act-color .cp{flex:1;min-height:0;width:100%;display:flex;flex-direction:column;gap:10px}
.act-color .cp-pic{position:relative;flex:1;min-height:0;min-width:0;background:#fff;border-radius:24px;box-shadow:var(--shadow)}
.act-color .cp-pic svg{position:absolute;left:8px;top:8px;width:calc(100% - 16px);height:calc(100% - 16px);display:block;touch-action:manipulation}
.act-color .cp-pic [data-i]{cursor:pointer;transition:fill .25s}
.act-color .cp-pic [data-i].pop{animation:cpPop .4s ease-out;transform-box:fill-box;transform-origin:center}
@keyframes cpPop{40%{transform:scale(1.05)}}
.act-color .cp-pic.fly{transition:transform .6s cubic-bezier(.5,-.25,.7,1),opacity .6s;transform:translate(30%,-45%) scale(.12) rotate(10deg);opacity:0}
.act-color .cp-side{display:flex;flex-direction:column;gap:8px;flex:none}
.act-color .cp-pal{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.act-color .cp-sw{height:clamp(42px,11vw,56px);border-radius:18px;background:var(--sw);border:3px solid transparent;box-shadow:inset 0 -5px 0 rgba(0,0,0,.15);transition:transform .12s}
.act-color .cp-sw.wh{border-color:var(--line)}
.act-color .cp-sw.on{box-shadow:0 0 0 3px var(--surface),0 0 0 7px var(--ink);transform:scale(1.06)}
.act-color .cp-sw:active{transform:scale(.94)}
.act-color .cp-row{display:flex;gap:8px}
.act-color .cp-undo{flex:none;width:clamp(58px,16vw,74px);border-radius:20px;background:var(--surface);box-shadow:var(--shadow);font-size:26px}
.act-color .cp-undo:disabled{opacity:.35}
.act-color .cp-done{flex:1}
@media (orientation:landscape) and (min-width:700px){
  .act-color .cp{flex-direction:row}
  .act-color .cp-side{width:clamp(210px,26vw,280px);justify-content:center;padding:6px}
  .act-color .cp-pal{grid-template-columns:repeat(2,1fr)}
  .act-color .cp-sw{height:52px}
}
@media (orientation:landscape) and (min-width:700px) and (max-height:520px){
  .act-color .cp-side{width:272px}
  .act-color .cp-pal{grid-template-columns:repeat(5,1fr);gap:6px}
  .act-color .cp-sw{height:40px}
  .act-color .cp-row .btn.big{min-height:52px;font-size:19px;padding:8px 12px}
}

/* ── 기분 그림: 기분 고르기 ── */
.act-feeldraw .choice .cl{font-size:clamp(15px,4vw,22px)}
@media (orientation:landscape) and (max-height:520px){
  .act-feeldraw .choices{grid-template-columns:repeat(4,1fr);max-width:none}
  .act-feeldraw .choice{min-height:0;padding:6px 4px}
  .st-body.act-feeldraw .choices .choice .ce{font-size:44px}
  .act-color .choices{grid-template-columns:repeat(4,1fr);max-width:none}
  .act-color .choice{min-height:0;padding:6px 4px}
  .act-color .cp-thumb svg{width:min(26vh,130px)}
}

/* ── 그림첩 ── */
.act-gallery .gl{width:100%;display:flex;flex-direction:column;gap:12px;flex:1}
.act-gallery .gl-head{font-family:Jua,sans-serif;font-size:clamp(20px,5.4vw,26px);text-align:center}
.act-gallery .gl-head em{font-style:normal;color:var(--area)}
.act-gallery .gl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.act-gallery .gl-card{position:relative;background:var(--surface);border-radius:22px;padding:8px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:4px;
  text-align:left;transition:transform .12s;animation:pop .4s backwards}
.act-gallery .gl-card:active{transform:scale(.96)}
.act-gallery .gl-card img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:16px;background:#fff;display:block}
.act-gallery .gl-card small{color:var(--soft);font-size:13.5px;padding:0 4px}
.act-gallery .gl-tag{position:absolute;right:13px;top:13px;background:rgba(255,255,255,.94);border-radius:999px;padding:1px 8px;font-size:20px;line-height:1.3;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.act-gallery .gl-empty{margin:auto 0;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:10px}
.act-gallery .gl-empty .ge{font-size:clamp(96px,28vw,160px);line-height:1.1;animation:pop .6s}
.act-gallery .gl-empty b{font-family:Jua,sans-serif;font-weight:400;font-size:clamp(24px,6.4vw,32px)}
.act-gallery .gl-empty p{color:var(--soft);font-size:clamp(15px,4vw,18px)}
.act-gallery .gl-empty .btn{margin-top:8px}
.act-gallery .gl-view{position:fixed;inset:0;z-index:40;max-width:none;width:auto;background:rgba(18,26,38,.8);display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:12px;padding:calc(14px + var(--safe-t)) 14px calc(14px + var(--safe-b));animation:fade .2s}
.act-gallery .gl-big{max-width:100%;max-height:calc(100vh - 270px);max-height:calc(100dvh - 270px);border-radius:20px;background:#fff;box-shadow:0 20px 50px rgba(0,0,0,.35);
  object-fit:contain;animation:pop .35s;touch-action:pan-y}
.act-gallery .gl-say{display:flex;align-items:flex-end;gap:8px;max-width:min(100%,640px)}
.act-gallery .gl-say .jvm{width:48px;height:48px;flex:none}
.act-gallery .gl-say p{background:var(--surface);color:var(--ink);border-radius:18px 18px 18px 6px;padding:7px 14px;font-size:clamp(15px,4vw,18px);line-height:1.45;box-shadow:var(--shadow)}
.act-gallery .gl-cap{color:#fff;font-family:Jua,sans-serif;font-size:clamp(16px,4.4vw,20px);text-align:center;line-height:1.4}
.act-gallery .gl-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.act-gallery .gl-b{width:clamp(56px,15vw,68px);height:clamp(56px,15vw,68px);border-radius:50%;background:var(--surface);color:var(--ink);font-size:clamp(22px,6vw,28px);box-shadow:0 4px 14px rgba(0,0,0,.25)}
.act-gallery .gl-b:disabled{opacity:.3}
.act-gallery .gl-b.x{background:var(--area);color:#fff}
.act-gallery .gl-b:active{transform:scale(.92)}
`);

/* ===========================================================
   그림판 — draw · mirror · feeldraw 가 함께 쓴다
   o: {kind, sym(1·2·4·8), symToggle, stamps, rainbow, color, emoSwatch(감정), badge, emo,
       saveMsg, firstLine, askLine}
   =========================================================== */
function board(ctx, o) {
  o = o || {};
  var wrap = G.el('<div class="ab"><div class="ab-paper"><div class="ab-guide"><i class="v"></i><i class="h"></i><i class="d1"></i><i class="d2"></i><b></b></div></div>' +
    '<div class="ab-tools"><div class="ab-pal"></div><div class="ab-row"></div></div></div>');
  ctx.body.appendChild(wrap);
  var paper = G.$('.ab-paper', wrap), guide = G.$('.ab-guide', wrap), pal = G.$('.ab-pal', wrap), row = G.$('.ab-row', wrap);
  if (o.badge) { var bd = G.el('<div class="ab-badge"></div>'); bd.innerHTML = o.badge; paper.appendChild(bd); }
  var st = {
    col: o.color || (o.emoSwatch ? o.emoSwatch.col : D.COLORS[2].hex), rainbow: !!o.rainbow,
    size: 1, mode: 'pen', stamp: STAMPS[0], sym: o.sym || 1, hue: Math.floor(Math.random() * 360)
  };
  var cvs = ctx.canvas(paper, { keep: true }), cv = cvs.cv, c = cvs.c;
  var undo = [], active = null, last = null, strokes = 0, asked = false, saving = false, t0 = Date.now();

  /* 색 고르기 단추 — 감정 색(있으면) + 10가지 색 + 무지개 */
  var swatches = [];
  if (o.emoSwatch) swatches.push({ hex: o.emoSwatch.col, face: o.emoSwatch.e, name: (ADJ[o.emoSwatch.id] || '') + ' 마음 색' });
  D.COLORS.forEach(function (k) { swatches.push({ hex: k.hex, name: k.name, id: k.id }); });
  swatches.push({ rainbow: true, name: '무지개' });

  function drawPal() {
    pal.innerHTML = '';
    if (st.mode === 'stamp') {
      STAMPS.forEach(function (s) {
        var b = G.el('<button type="button" class="ab-st' + (s === st.stamp ? ' on' : '') + '" aria-label="도장 ' + s + '">' + s + '</button>');
        b.onclick = function () { st.stamp = s; G.sfx.play('pop'); G.buzz(8); drawPal(); drawRow(); };
        pal.appendChild(b);
      });
      return;
    }
    swatches.forEach(function (w) {
      var on = st.mode === 'pen' && (w.rainbow ? st.rainbow : !st.rainbow && st.col === w.hex);
      var b = G.el('<button type="button" class="ab-sw' + (w.rainbow ? ' rb' : '') + (w.id === 'white' ? ' wh' : '') + (on ? ' on' : '') + '"></button>');
      b.setAttribute('aria-label', w.name);
      if (!w.rainbow) b.style.setProperty('--sw', w.hex);
      if (w.face) b.textContent = w.face;
      if (w.rainbow && !o.emoSwatch) b.classList.add('wide');
      b.onclick = function () { pickColor(w); };
      pal.appendChild(b);
    });
  }
  function pickColor(w) {
    st.mode = 'pen'; st.rainbow = !!w.rainbow; if (!w.rainbow) st.col = w.hex;
    G.sfx.play('tap'); G.buzz(8);
    drawPal(); drawRow();
    ctx.say(w.rainbow ? G.pick(['무지개 붓이다!', '알록달록 무지개!']) : w.name + '!', { repeat: false });
  }

  /* 도구 단추 — 굵기 셋 · 도장/거울 · 지우개 · 되돌리기 · 다 지우기 · 저장 */
  function tool(html, label, on, fn, cls) {
    var b = G.el('<button type="button" class="ab-tb' + (on ? ' on' : '') + (cls ? ' ' + cls : '') + '"></button>');
    b.innerHTML = html; b.setAttribute('aria-label', label);
    b.onclick = function () { if (!saving) fn(b); };
    row.appendChild(b); return b;
  }
  function drawRow() {
    row.innerHTML = '';
    SIZES.forEach(function (px, i) {
      var b = tool('<i></i>', '굵기 ' + (i + 1), st.size === i, function () {
        st.size = i; G.sfx.play('tap'); G.buzz(8); drawRow();
        ctx.bubble(['가늘게!', '보통으로!', '굵게!'][i]);
      });
      var dot = b.querySelector('i');
      if (st.mode === 'stamp') { dot.className = 'st'; dot.textContent = st.stamp; dot.style.fontSize = [15, 21, 29][i] + 'px'; return; }
      dot.style.width = dot.style.height = DOTS[i] + 'px';
      if (st.mode === 'erase') dot.className = 'er';
      else if (st.rainbow) dot.className = 'rb';
      else { dot.style.setProperty('--dot', st.col); if (st.col.toLowerCase() === '#fafafa') dot.className = 'wh'; }
    });
    if (o.stamps) tool(st.mode === 'stamp' ? '🖍️' : '⭐', st.mode === 'stamp' ? '그리기로' : '도장', st.mode === 'stamp', toggleStamp);
    if (o.symToggle) tool('🪞<b>' + st.sym + '</b>', '거울 수 바꾸기', false, cycleSym);
    tool('🧽', '지우개', st.mode === 'erase', toggleErase);
    var u = tool('↩️', '되돌리기', false, doUndo, 'undo'); u.disabled = !undo.length;
    tool('🗑️', '다 지우기', false, askClear);
    tool('💾', '저장', false, save, 'save');
  }
  function toggleStamp() {
    st.mode = st.mode === 'stamp' ? 'pen' : 'stamp';
    G.sfx.play('pop'); drawPal(); drawRow();
    ctx.say(st.mode === 'stamp' ? G.pick(['도장 놀이! 콕콕 찍어 봐.', '도장이다! 어디에 찍을까?']) : '다시 쓱쓱 그리기!', { repeat: false });
  }
  function toggleErase() {
    st.mode = st.mode === 'erase' ? 'pen' : 'erase';
    G.sfx.play('tap'); drawPal(); drawRow();
    ctx.say(st.mode === 'erase' ? '지우개! 쓱쓱 지워 봐.' : '다시 그리기!', { repeat: false });
  }
  var SYM_WORD = { 2: '둘', 4: '넷', 8: '여덟' };
  function cycleSym() {
    st.sym = st.sym === 2 ? 4 : st.sym === 4 ? 8 : 2;
    guide.className = 'ab-guide s' + st.sym;
    G.sfx.play('sparkle'); drawRow();
    ctx.say('거울 ' + SYM_WORD[st.sym] + '!', { repeat: false });
  }
  guide.className = 'ab-guide' + (st.sym > 1 ? ' s' + st.sym : '');

  /* ---- 그리기 ---- */
  function copies(x, y) {
    var cx = cvs.w / 2, cy = cvs.h / 2, dx = x - cx, dy = y - cy;
    if (st.sym === 2) return [[x, y], [cx - dx, y]];
    if (st.sym === 4) return [[x, y], [cx - dx, y], [x, cy - dy], [cx - dx, cy - dy]];
    if (st.sym === 8) return [[cx + dx, cy + dy], [cx - dy, cy + dx], [cx - dx, cy - dy], [cx + dy, cy - dx],
      [cx + dx, cy - dy], [cx + dy, cy + dx], [cx - dx, cy + dy], [cx - dy, cy - dx]];
    return [[x, y]];
  }
  function point(e) {
    var p = cvs.pos(e), pen = e.pointerType === 'pen';
    var base = SIZES[st.size] * (st.mode === 'erase' ? 2.4 : 1);
    p.w = pen ? base * (0.35 + (e.pressure || 0.5) * 1.3) : base;
    return p;
  }
  function paint() {
    if (st.mode === 'erase') return '#000';
    return st.rainbow ? 'hsl(' + Math.round(st.hue) + ',88%,57%)' : st.col;
  }
  function ink(fn) {
    c.save();
    c.globalCompositeOperation = st.mode === 'erase' ? 'destination-out' : 'source-over';
    fn(); c.restore();
  }
  function dot(p) {
    ink(function () {
      c.fillStyle = paint();
      c.beginPath();
      copies(p.x, p.y).forEach(function (q) { c.moveTo(q[0] + p.w / 2, q[1]); c.arc(q[0], q[1], p.w / 2, 0, Math.PI * 2); });
      c.fill();
    });
  }
  function seg(a, b) {
    var dist = Math.hypot(b.x - a.x, b.y - a.y); if (dist < 0.4) return false;
    if (st.rainbow) st.hue = (st.hue + dist * 0.7) % 360;
    var A = copies(a.x, a.y), B = copies(b.x, b.y);
    ink(function () {
      c.strokeStyle = paint(); c.lineWidth = (a.w + b.w) / 2; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath();
      for (var k = 0; k < A.length; k++) { c.moveTo(A[k][0], A[k][1]); c.lineTo(B[k][0], B[k][1]); }
      c.stroke();
    });
    return true;
  }
  function stamp(p) {
    var px = STAMP_PX[st.size];
    ink(function () {
      c.font = px + 'px ' + EMOJI_FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
      copies(p.x, p.y).forEach(function (q) { c.fillText(st.stamp, q[0], q[1]); });
    });
    G.sfx.play('pop'); G.buzz(10);
  }
  function onStroke() {
    strokes++;
    if (strokes === 1) ctx.say(o.firstLine || G.pick(FIRST), { repeat: false });
    else if (!asked && strokes >= 12 && Date.now() - t0 > 25000) { asked = true; ctx.say(o.askLine || G.pick(ASK), { repeat: false }); }
  }
  ctx.on(cv, 'pointerdown', function (e) {
    if (active !== null || saving || !cvs.w) return;
    e.preventDefault();
    pushUndo();
    var p = point(e);
    if (st.mode === 'stamp') { stamp(p); onStroke(); return; }
    active = e.pointerId; try { cv.setPointerCapture(active); } catch (er) {}
    last = p; dot(p); onStroke();
  });
  ctx.on(cv, 'pointermove', function (e) {
    if (e.pointerId !== active || !last) return;
    var list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    if (!list || !list.length) list = [e];
    for (var k = 0; k < list.length; k++) { var p = point(list[k]); if (seg(last, p)) last = p; }
  });
  function up(e) { if (e.pointerId !== active) return; active = null; last = null; }
  ctx.on(cv, 'pointerup', up); ctx.on(cv, 'pointercancel', up);
  ctx.on(cv, 'contextmenu', function (e) { e.preventDefault(); });

  /* ---- 되돌리기 (그림 사진을 15장까지 — 큰 화면에서는 기기 메모리에 맞춰 줄인다) ---- */
  function maxUndo() { return G.clamp(Math.floor(9e7 / Math.max(1, cv.width * cv.height * 4)), 5, 15); }
  function setUndoBtn() { var u = G.$('.ab-tb.undo', row); if (u) u.disabled = !undo.length; }
  function pushUndo() {
    try { undo.push(c.getImageData(0, 0, cv.width, cv.height)); } catch (e) { return; }
    while (undo.length > maxUndo()) undo.shift();
    setUndoBtn();
  }
  function wipe() { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.restore(); }
  function doUndo() {
    var im = undo.pop(); if (!im) return;
    wipe(); c.putImageData(im, 0, 0);
    G.sfx.play('whoosh'); setUndoBtn();
    ctx.bubble('↩️ 되돌렸어!');
  }
  function askClear() {
    if (G.$('.ab-ask', paper)) return;
    var a = G.el('<div class="ab-ask"><div class="ab-ask-c"><b>🗑️ 다 지울까?</b><div><button type="button" class="btn big yes">네, 지워요</button><button type="button" class="btn big soft no">아니요</button></div></div></div>');
    paper.appendChild(a); G.sfx.play('tap');
    ctx.say('다 지우고 새 종이로 할까?', { repeat: false });
    a.querySelector('.yes').onclick = function () {
      pushUndo(); wipe(); a.remove(); G.sfx.play('whoosh');
      ctx.say('새 종이가 생겼어! 다시 쓱쓱 그려 봐.', { repeat: false });
    };
    a.querySelector('.no').onclick = function () { G.sfx.play('tap'); a.remove(); ctx.say('좋아, 계속 그리자!', { repeat: false }); };
  }

  /* ---- 저장 ---- */
  function isBlank() {
    try {
      var t = document.createElement('canvas'); t.width = 128; t.height = 128;
      var x = t.getContext('2d'); x.drawImage(cv, 0, 0, 128, 128);
      var d = x.getImageData(0, 0, 128, 128).data;
      for (var i = 3; i < d.length; i += 4) if (d[i] > 6) return false;
      return true;
    } catch (e) { return false; }
  }
  function save(btn) {
    if (saving) return;
    if (isBlank()) { G.ui.wiggle(btn); ctx.say(G.pick(BLANK), { repeat: false }); return; }
    saving = true;
    var s = Math.min(1, 1200 / Math.max(cv.width, cv.height)), out = document.createElement('canvas');
    out.width = Math.round(cv.width * s); out.height = Math.round(cv.height * s);
    var oc = out.getContext('2d'); oc.fillStyle = WHITE; oc.fillRect(0, 0, out.width, out.height); oc.drawImage(cv, 0, 0, out.width, out.height);
    var rec = { id: G.uid(), t: Date.now(), img: out.toDataURL('image/jpeg', 0.82), kind: o.kind || 'draw' };
    if (o.emo) rec.emo = o.emo;
    G.sfx.play('sparkle');
    paper.classList.add('fly');
    var put = G.db.put('art', rec).catch(function () { G.toast('그림을 저장하지 못했어요. 기기 저장 공간을 확인해 주세요.'); });
    Promise.all([put, ctx.wait(G.settings.calm ? 150 : 650)]).then(function () {
      ctx.finish({ msg: o.saveMsg || '멋진 그림이 그림첩에 들어갔어!' });
    });
  }

  /* 오래 그리면 저장을 살짝 알려 준다 */
  ctx.timeout(function () {
    if (saving || !strokes) return;
    ctx.say('다 그렸으면 초록 저장 단추를 눌러 그림첩에 넣자!', { repeat: false });
    G.ui.hint(G.$('.ab-tb.save', row));
  }, 180000);

  drawPal(); drawRow();
  return { st: st };
}

/* =================================================================
   1. 자유 그리기
   ================================================================= */
G.act({
  id: 'draw', area: 'art', title: '자유 그리기', icon: '🖍️', order: 10, levels: 1, needs: [], mins: 4,
  ef: ['plan', 'regulate'],
  desc: '마음대로 쓱쓱 그려요',
  goal: '자유로운 자기표현과 마음 가라앉히기, 쥐기·긋기(소근육), 색 이름 익히기',
  how: '"이건 뭐야?" 대신 "이야기해 줄래?" 하고 물어 주세요. 잘 그렸는지보다 "빨강으로 길게 쓱 그었네!"처럼 아이가 한 것을 그대로 말해 주면 충분해요. 다 그리면 💾 를 눌러 그림첩에 모으고 미술치료 선생님께 보여 드리세요.',
  basis: '미술치료 — 과정 중심 자유 표현(결과보다 그리는 경험과 선택)',
  offline: '큰 종이를 바닥에 깔고 크레파스로 함께 그리며 "이야기해 줄래?" 하고 묻기.',
  run: function (ctx) {
    board(ctx, { kind: 'draw', stamps: true, saveMsg: '멋진 그림이 그림첩에 들어갔어!' });
    ctx.say(G.pick(['하얀 종이가 생겼어! 마음대로 그려 봐.', '무엇이든 그려도 돼. 쓱쓱 그려 볼까?', '오늘은 어떤 그림을 그릴까? 마음대로 해 봐!']));
  }
});

/* =================================================================
   2. 거울 그림 — 대칭·만다라
   ================================================================= */
G.act({
  id: 'mirror', area: 'art', title: '거울 그림', icon: '🪞', order: 20, levels: 3, needs: [], mins: 3,
  ef: ['regulate', 'attend'],
  desc: '한쪽에 그리면 거울처럼!',
  goal: '대칭 보기와 주의 모으기, 천천히 반복해 그리며 마음 가라앉히기, 손 움직임과 결과 잇기(인과)',
  how: '한쪽에 그리면 다른 쪽에도 똑같이 생겨요. "와, 여기도 생겼네!" 하고 함께 놀라 주세요. 빨리 그리기보다 천천히 빙글빙글 돌리면 만다라처럼 차분해져요. 🪞 단추로 거울 수(둘·넷·여덟)를 아이가 바꿔 볼 수 있어요.',
  basis: '양측 협응·대칭 지각, 만다라 그리기의 진정 효과(미술치료)',
  offline: '데칼코마니 — 종이 반쪽에 물감을 짜고 반으로 접었다 펼쳐 보기.',
  run: function (ctx) {
    var sym = [2, 4, 8][ctx.level - 1] || 2;
    board(ctx, {
      kind: 'mirror', sym: sym, symToggle: true, rainbow: true,
      saveMsg: '반짝반짝 거울 그림이 그림첩에 들어갔어!',
      firstLine: G.pick(['와, 거울처럼 똑같이 생겼다!', '우와, 마법 같다! 저기에도 생겼어!']),
      askLine: G.pick(['빙글빙글 천천히 그리면 꽃처럼 돼. 해 볼까?', '무슨 모양이 됐어? 이야기해 줄래?'])
    });
    ctx.say(sym === 2 ? '한쪽에 그리면 반대쪽에도 똑같이 생겨요! 그려 볼까?' :
      sym === 4 ? '한 번 그리면 네 군데에 생겨요! 마법 같지?' : '한 번 그리면 여덟 군데에! 빙글빙글 꽃처럼 그려 봐.');
  }
});

/* =================================================================
   3. 색칠하기 — 칸을 눌러 색 채우기
   그림은 viewBox 0 0 200 200. 칸마다 [모양, 나오는 단계, 마지막 단계].
   1단계 3~4칸 · 2단계 6~7칸 · 3단계 10칸 이상
   sw: 앞 단계 칸을 쪼개 바꿔 끼우는 칸(나비 날개·꽃잎·교회 탑·무지개 띠) — 칸 맛보기(picRegs)에 미리 넣지 않는다
   ================================================================= */
function R(s, lv, max, sw) { return { s: s, lv: lv || 1, max: max || 3, sw: !!sw }; }
function f1(n) { return Math.round(n * 10) / 10; }
function petals(n, cx, cy, d, rx, ry) {
  var out = [];
  for (var i = 0; i < n; i++) out.push('<ellipse cx="' + cx + '" cy="' + (cy - d) + '" rx="' + rx + '" ry="' + ry + '" transform="rotate(' + (i * 360 / n) + ' ' + cx + ' ' + cy + ')"/>');
  return out;
}
function sun(cx, cy, r) {
  var d = '';
  for (var i = 0; i < 8; i++) {
    var a = i * Math.PI / 4, co = Math.cos(a), si = Math.sin(a);
    d += 'M' + f1(cx + co * (r + 5)) + ' ' + f1(cy + si * (r + 5)) + ' L' + f1(cx + co * (r + 12)) + ' ' + f1(cy + si * (r + 12)) + ' ';
  }
  return '<g><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/><path d="' + d + '"/></g>';
}
function cloud(x, y, s) {
  s = s || 1;
  function p(dx, dy) { return f1(x + dx * s) + ' ' + f1(y + dy * s); }
  return '<path d="M' + p(-26, 10) + ' Q' + p(-36, 10) + ' ' + p(-34, 0) + ' Q' + p(-32, -9) + ' ' + p(-22, -8) + ' Q' + p(-20, -22) + ' ' + p(-5, -21) +
    ' Q' + p(6, -28) + ' ' + p(14, -15) + ' Q' + p(28, -17) + ' ' + p(30, -3) + ' Q' + p(38, 2) + ' ' + p(32, 10) + ' Z"/>';
}
function band(cx, cy, ro, ri) {
  return '<path d="M' + f1(cx - ro) + ' ' + cy + ' A' + f1(ro) + ' ' + f1(ro) + ' 0 0 1 ' + f1(cx + ro) + ' ' + cy + ' L' + f1(cx + ri) + ' ' + cy +
    ' A' + f1(ri) + ' ' + f1(ri) + ' 0 0 0 ' + f1(cx - ri) + ' ' + cy + ' Z"/>';
}
var FL_PET = petals(5, 100, 62, 24, 14, 21);
var BF = {
  ul: '<path d="M96 92 Q60 28 26 50 Q12 82 50 100 Q80 106 96 100 Z"/>',
  ll: '<path d="M96 104 Q60 102 44 128 Q40 162 70 158 Q92 152 97 116 Z"/>',
  ur: '<path d="M104 92 Q140 28 174 50 Q188 82 150 100 Q120 106 104 100 Z"/>',
  lr: '<path d="M104 104 Q140 102 156 128 Q160 162 130 158 Q108 152 103 116 Z"/>'
};
function rainbowParts() {
  var out = [];
  [[1, 2], [2, 4], [3, 7]].forEach(function (cfg) {
    var lv = cfg[0], n = cfg[1], ro = 92, ri = 40, w = (ro - ri) / n;
    for (var k = 0; k < n; k++) out.push(R(band(100, 150, ro - k * w, ro - (k + 1) * w), lv, lv, 1));
  });
  out.push(R(sun(160, 38, 14), 3));
  out.push(R(cloud(40, 150, 1), 1));
  out.push(R(cloud(160, 150, 1), 1));
  return out;
}
var PICS = [
  { id: 'house', name: '우리 집', e: '🏠', parts: [
    R('<path d="M-4 170 Q100 154 204 170 V204 H-4 Z"/>', 1),
    R('<path d="M88 176 H112 L124 204 H76 Z"/>', 3),
    R('<rect x="126" y="44" width="20" height="44"/>', 2),
    R('<rect x="44" y="96" width="112" height="80"/>', 1),
    R('<path d="M28 102 L100 38 L172 102 Z"/>', 1),
    R('<circle cx="100" cy="76" r="10"/>', 3),
    R('<rect x="85" y="126" width="30" height="50" rx="5"/>', 1),
    R('<rect x="55" y="110" width="22" height="22" rx="3"/>', 2),
    R('<rect x="123" y="110" width="22" height="22" rx="3"/>', 2),
    R(sun(166, 30, 14), 3),
    R(cloud(42, 34, 0.9), 3)
  ], deco: [R('<circle cx="108" cy="153" r="2.8"/>')] },
  { id: 'fish', name: '물고기', e: '🐟', parts: [
    R('<path d="M-4 186 Q50 176 100 186 T204 184 V204 H-4 Z"/>', 3),
    R('<path d="M18 204 Q8 178 22 164 Q36 150 26 132 Q46 150 36 168 Q26 182 34 204 Z"/>', 3),
    R('<path d="M162 204 Q152 178 166 164 Q180 150 170 132 Q190 150 180 168 Q170 182 178 204 Z"/>', 3),
    R('<path d="M66 64 Q92 22 126 66 Z"/>', 1),
    R('<path d="M84 136 Q100 164 118 134 Z"/>', 2),
    R('<path d="M146 100 L186 64 Q174 100 186 136 Z"/>', 1),
    R('<ellipse cx="95" cy="100" rx="62" ry="42"/>', 1),
    R('<path d="M95 58.5 Q85 100 95 141.5 L108 141 Q98 100 108 59 Z"/>', 2),
    R('<path d="M120 62 Q110 100 120 138 L133 133 Q124 100 133 67 Z"/>', 2),
    R('<circle cx="60" cy="90" r="11"/>', 1),
    R('<circle cx="30" cy="46" r="9"/>', 3),
    R('<circle cx="46" cy="22" r="7"/>', 3)
  ], deco: [R('<circle cx="57" cy="90" r="4.5"/>'), R('<path d="M36 110 Q44 115 52 110" fill="none"/>')] },
  { id: 'flower', name: '꽃', e: '🌷', parts: [
    R('<path d="M94 74 Q88 116 94 150 H106 Q100 116 106 74 Z"/>', 1),
    R('<path d="M96 132 Q70 108 56 118 Q70 142 96 136 Z"/>', 2),
    R('<path d="M104 122 Q130 98 144 108 Q130 132 104 126 Z"/>', 2),
    R('<path d="M70 150 H130 L121 196 H79 Z"/>', 1),
    R('<rect x="63" y="142" width="74" height="15" rx="5"/>', 2),
    R('<g>' + FL_PET.join('') + '</g>', 1, 2)
  ].concat(FL_PET.map(function (p) { return R(p, 3, 3, 1); })).concat([
    R('<circle cx="100" cy="62" r="15"/>', 1)
  ]) },
  { id: 'car', name: '자동차', e: '🚗', parts: [
    R('<rect x="-4" y="168" width="208" height="36"/>', 3),
    R(sun(30, 34, 14), 3),
    R(cloud(150, 40, 0.9), 3),
    R('<path d="M50 110 L72 72 H132 L156 110 Z"/>', 1),
    R('<path d="M64 106 L80 78 H99 V106 Z"/>', 2),
    R('<path d="M105 106 V78 H128 L144 106 Z"/>', 2),
    R('<path d="M18 132 Q18 110 40 110 H162 Q184 110 184 134 V150 H18 Z"/>', 1),
    R('<circle cx="173" cy="126" r="7"/>', 2),
    R('<circle cx="58" cy="152" r="20"/>', 1),
    R('<circle cx="144" cy="152" r="20"/>', 1),
    R('<circle cx="58" cy="152" r="8"/>', 3),
    R('<circle cx="144" cy="152" r="8"/>', 3)
  ], deco: [R('<path d="M102 114 V146 M86 124 H96" fill="none"/>')] },
  { id: 'butterfly', name: '나비', e: '🦋', parts: [
    R('<g>' + BF.ul + BF.ll + '</g>', 1, 1),
    R('<g>' + BF.ur + BF.lr + '</g>', 1, 1),
    R(BF.ul, 2, 3, 1), R(BF.ll, 2, 3, 1), R(BF.ur, 2, 3, 1), R(BF.lr, 2, 3, 1),
    R('<circle cx="55" cy="68" r="11"/>', 3),
    R('<circle cx="145" cy="68" r="11"/>', 3),
    R('<circle cx="68" cy="134" r="9"/>', 3),
    R('<circle cx="132" cy="134" r="9"/>', 3),
    R('<ellipse cx="100" cy="112" rx="9" ry="40"/>', 1),
    R('<circle cx="100" cy="66" r="12"/>', 1),
    R('<circle cx="74" cy="28" r="7"/>', 3),
    R('<circle cx="126" cy="28" r="7"/>', 3)
  ], deco: [R('<path d="M95 56 Q86 38 78 34 M105 56 Q114 38 122 34" fill="none"/>')] },
  { id: 'church', name: '교회', e: '⛪', parts: [
    R('<path d="M-4 178 Q100 164 204 178 V204 H-4 Z"/>', 3),
    R(cloud(40, 44, 0.85), 3),
    R('<rect x="38" y="112" width="124" height="70"/>', 1),
    R('<path d="M28 116 L100 80 L172 116 Z"/>', 1),
    R('<path d="M78 182 V68 L100 28 L122 68 V182 Z"/>', 1, 1),
    R('<rect x="78" y="68" width="44" height="114"/>', 2, 3, 1),
    R('<path d="M74 70 L100 28 L126 70 Z"/>', 2, 3, 1),
    R('<path d="M96 2 h8 v7 h7 v8 h-7 v11 h-8 v-11 h-7 v-8 h7 Z"/>', 2),
    R('<circle cx="100" cy="94" r="10"/>', 2),
    R('<path d="M100 140 C88 132 86 124 92 120 C96 118 99 120 100 123 C101 120 104 118 108 120 C114 124 112 132 100 140 Z"/>', 3),
    R('<path d="M86 182 V156 A14 14 0 0 1 114 156 V182 Z"/>', 1),
    R('<path d="M50 152 V134 A9 9 0 0 1 68 134 V152 Z"/>', 3),
    R('<path d="M132 152 V134 A9 9 0 0 1 150 134 V152 Z"/>', 3)
  ], deco: [R('<path d="M96 2 h8 v7 h7 v8 h-7 v11 h-8 v-11 h-7 v-8 h7 Z" fill="none"/>', 1, 1)] },
  { id: 'rainbow', name: '무지개', e: '🌈', parts: rainbowParts() }
];

/* 칠할 칸 고르기 — 칸(st)이 오르면 다음 단계에서 새로 생기는 칸을 몇 개 미리 더한다.
   칸 수는 G.tune 처럼 다음 단계 쪽으로 1/3·2/3 (그림 순서대로, 바꿔 끼우는 칸 sw 은 빼고).
   3단계는 더 생길 칸이 없어 그대로 */
function picRegs(pic, lv, st) {
  function at(l) { return pic.parts.filter(function (p) { return l >= p.lv && l <= p.max; }); }
  var regs = at(lv);
  if (lv >= 3 || !(st > 1)) return regs;
  var add = G.tune([at(1).length, at(2).length, at(3).length], lv, st) - regs.length;
  var more = pic.parts.filter(function (p) { return p.lv === lv + 1 && !p.sw; }).slice(0, Math.max(0, add));
  return pic.parts.filter(function (p) { return regs.indexOf(p) >= 0 || more.indexOf(p) >= 0; });
}
/* 그림 SVG — 칸에는 data-i, 칠하지 않는 선(눈·입)은 손이 닿지 않게 */
function picSVG(pic, lv, fills, st) {
  var regs = picRegs(pic, lv, st);
  var deco = (pic.deco || []).filter(function (p) { return lv >= p.lv && lv <= p.max; });
  var h = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" aria-hidden="true">' +
    '<g stroke="' + INK + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">';
  regs.forEach(function (p, k) { h += p.s.replace(/^<(\w+)/, '<$1 data-i="' + k + '" fill="' + ((fills && fills[k]) || WHITE) + '"'); });
  h += '<g fill="' + INK + '" pointer-events="none">' + deco.map(function (p) { return p.s; }).join('') + '</g></g></svg>';
  return { html: h, n: regs.length };
}
function svgToJpeg(svg) {
  return new Promise(function (ok, no) {
    var cl = svg.cloneNode(true); cl.setAttribute('width', '800'); cl.setAttribute('height', '800');
    var img = new Image();
    img.onload = function () {
      try {
        var cv = document.createElement('canvas'); cv.width = cv.height = 800;
        var x = cv.getContext('2d'); x.fillStyle = WHITE; x.fillRect(0, 0, 800, 800);
        x.drawImage(img, 32, 32, 736, 736);
        ok(cv.toDataURL('image/jpeg', 0.82));
      } catch (e) { no(e); }
    };
    img.onerror = no;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(cl));
  });
}

G.act({
  id: 'color', area: 'art', title: '색칠하기', icon: '🎨', order: 30, levels: 3, needs: [], mins: 4,
  ef: ['attend', 'plan'],
  desc: '예쁜 색으로 콕콕 칠해요',
  goal: '눈-손 협응으로 원하는 칸 골라 누르기, 색 이름(듣고 알기·말하기), 끝까지 해내는 힘',
  how: '"무슨 색으로 칠할까?" 하고 아이가 고르게 해 주세요. 하늘을 분홍으로 칠해도 괜찮아요 — 고른 색을 그대로 인정해 주세요. 칠할 때마다 색 이름을 같이 말해 주고, 다 하면 ✔ 를 눌러 그림첩에 넣어요.',
  basis: '소근육·시지각(전경-배경 구분), 색 개념 — 스스로 고르는 경험',
  offline: '색칠 공부 책을 굵은 크레파스로 큰 칸부터 칠하기.',
  run: function (ctx) {
    var lv = ctx.level, st = ctx.step;   /* 칸이 오르면 칠할 칸이 한두 개씩 늘어난다(picRegs) */
    ctx.say(G.pick(['무엇을 색칠할까? 하나 골라 봐!', '오늘은 어떤 그림을 칠해 볼까?']));
    ctx.choices(G.sample(PICS, 4), {
      cols: 2, size: 'md',
      render: function (p) { return '<span class="cp-thumb">' + picSVG(p, lv, null, st).html + '</span><span class="cl">' + p.e + ' ' + G.esc(p.name) + '</span>'; },
      onPick: function (p) { G.voice.stop(); ctx.timeout(function () { paintPic(ctx, p, lv, st); }, 250); return true; }
    });
  }
});

function paintPic(ctx, pic, lv, st) {
  ctx.body.innerHTML = '';
  var P = picSVG(pic, lv, null, st), fills = G.range(P.n).map(function () { return WHITE; });
  var wrap = G.el('<div class="cp"><div class="cp-pic">' + P.html + '</div><div class="cp-side"><div class="cp-pal"></div>' +
    '<div class="cp-row"><button type="button" class="cp-undo" aria-label="되돌리기" disabled>↩️</button><button type="button" class="btn big green cp-done">✔ 다 했어요</button></div></div></div>');
  ctx.body.appendChild(wrap);
  var picBox = G.$('.cp-pic', wrap), svg = G.$('svg', wrap), pal = G.$('.cp-pal', wrap), undoBtn = G.$('.cp-undo', wrap), doneBtn = G.$('.cp-done', wrap);
  var regs = G.$$('[data-i]', svg), cur = D.COLORS[0], hist = [], said = {}, saving = false;

  D.COLORS.forEach(function (k) {
    var b = G.el('<button type="button" class="cp-sw' + (k.id === 'white' ? ' wh' : '') + (k === cur ? ' on' : '') + '"></button>');
    b.style.setProperty('--sw', k.hex); b.setAttribute('aria-label', k.name);
    b.onclick = function () {
      cur = k; G.sfx.play('tap'); G.buzz(8);
      G.$$('.cp-sw', pal).forEach(function (x) { x.classList.toggle('on', x === b); });
      ctx.say(k.id === 'white' ? '하양! 하얗게 돌려놓을 수 있어.' : k.name + '!', { repeat: false });
    };
    pal.appendChild(b);
  });
  function colored() { return fills.filter(function (f) { return f !== WHITE && f !== '#fafafa'; }).length; }
  function setFill(i, hex) {
    fills[i] = hex; var r = regs[i]; r.setAttribute('fill', hex);
    r.classList.remove('pop'); requestAnimationFrame(function () { r.classList.add('pop'); });
  }
  function after() {
    var n = colored(); prog(ctx, n, regs.length, 6);
    undoBtn.disabled = !hist.length;
    if (n === 1 && !said.one) { said.one = 1; ctx.say(G.pick(['쏙! 예쁘다!', '와, 색이 쏙 들어갔어!', '좋아! 다음은 어디를 칠할까?']), { repeat: false }); }
    else if (regs.length >= 6 && n === Math.ceil(regs.length / 2) && !said.half) { said.half = 1; ctx.say('벌써 반이나 칠했어! 멋지다!', { repeat: false }); }
    if (n === regs.length && !said.all) {
      said.all = 1; G.sfx.play('great');
      var c = G.fx.center(svg); G.fx.burst(c[0], c[1], ['🎨', '✨', '🌈']);
      ctx.say(G.pick(['와, 다 칠했다! 알록달록 정말 예쁘다!', '우와, 끝까지 다 칠했어!']) + ' 다 됐으면 다 했어요를 눌러 줘.', { repeat: false });
      G.ui.hint(doneBtn);
    }
  }
  svg.addEventListener('pointerdown', function (e) {
    if (saving || !ctx.alive) return;
    var r = e.target && e.target.closest ? e.target.closest('[data-i]') : null; if (!r) return;
    e.preventDefault();
    var i = +r.getAttribute('data-i'); if (fills[i] === cur.hex) return;
    hist.push({ i: i, f: fills[i] });
    setFill(i, cur.hex); G.sfx.play('pop'); G.buzz(8);
    after();
  });
  undoBtn.onclick = function () {
    var h = hist.pop(); if (!h) return;
    setFill(h.i, h.f); G.sfx.play('whoosh'); after();
  };
  doneBtn.onclick = function () {
    if (saving) return;
    if (!colored()) { ctx.say('색을 하나 골라서 그림 속 칸을 콕 눌러 볼까?', { repeat: false }); G.ui.hint(regs[0]); return; }
    saving = true; G.sfx.play('sparkle');
    var put = svgToJpeg(svg).then(function (img) { return G.db.put('art', { id: G.uid(), t: Date.now(), img: img, kind: 'color' }); })
      .catch(function () { G.toast('그림을 저장하지 못했어요. 기기 저장 공간을 확인해 주세요.'); });
    picBox.classList.add('fly');
    Promise.all([put, ctx.wait(G.settings.calm ? 150 : 650)]).then(function () {
      prog(ctx, regs.length, regs.length, 6);
      ctx.finish({ msg: G.pick(['알록달록 예쁜 그림이 그림첩에 들어갔어!', '정성껏 칠한 그림, 그림첩에 쏙 넣었어!']) });
    });
  };
  prog(ctx, 0, regs.length, 6);
  ctx.say(G.josa(pic.name, '을', '를') + ' 칠해 보자! 아래에서 색을 고르고 칸을 콕 눌러 봐.');
}

/* =================================================================
   4. 기분 그림 — 오늘 마음을 색으로
   ================================================================= */
G.act({
  id: 'feeldraw', area: 'art', title: '기분 그림', icon: '🌈', order: 40, levels: 1, needs: [], mins: 3,
  ef: ['regulate'],
  desc: '오늘 마음을 색으로 그려요',
  goal: '감정 알아차리기와 이름 붙이기, 마음을 색·선으로 안전하게 꺼내 놓기(정서 표현)',
  how: '그림을 해석하거나 고치지 말고 "이 색은 어떤 마음이야? 이야기해 줄래?" 하고 들어 주세요. 슬프거나 화난 마음을 그려도 "그런 마음이 들었구나" 하고 받아 주면 감정이 가라앉아요. 고른 기분은 그림과 함께 그림첩에 남아요.',
  basis: '정서 표현 미술 — 감정에 이름 붙이기(affect labeling)가 감정을 가라앉힌다',
  offline: '"오늘 마음은 무슨 색?" 색종이를 하나 고르고 그 색으로 함께 끄적이기.',
  run: function (ctx) {
    var list = D.EMOTIONS.filter(function (e) { return e.lv <= 2 || e.id === 'calm' || e.id === 'love'; });
    ctx.say(G.pick(['오늘 마음은 어때? 마음 얼굴을 하나 골라 봐.', G.callName() + ', 지금 마음은 어떤 얼굴이야?']));
    ctx.choices(list, {
      cols: 4, size: 'md', color: function (e) { return e.col; },
      onPick: function (e) {
        ctx.extra.emo = e.id; G.voice.stop();
        ctx.timeout(function () { start(e); }, 300);
        return true;
      }
    });
    function start(e) {
      ctx.body.innerHTML = '';
      var adj = ADJ[e.id] || '';
      board(ctx, {
        kind: 'feel', emo: e.id, emoSwatch: e, stamps: true,
        badge: '<span>' + e.e + '</span>' + G.esc(adj + ' 마음'),
        saveMsg: adj + ' 마음을 멋지게 그렸어! 그림첩에 넣어 둘게.',
        firstLine: G.pick(['좋아, 마음이 색으로 나온다!', '쓱쓱, 마음을 꺼내 보자!']),
        askLine: G.pick(['이 색은 어떤 마음이야? 이야기해 줄래?', '그림 속 마음 이야기를 들려줄래?'])
      });
      var open = HARD[e.id] ? adj + ' 마음이구나. 그런 마음이 들 수 있어. 그 마음을 색으로 꺼내 볼까?'
        : adj + ' 마음이구나! 오늘 마음을 색으로 그려 볼까? 어떤 색이 어울릴까?';
      ctx.say(open);
    }
  }
});

/* =================================================================
   5. 그림첩 (도구) — 저장한 그림 모아 보기
   ================================================================= */
var PRAISE_ART = ['정말 멋진 그림이야! 이 그림 이야기해 줄래?', '열심히 그린 게 다 보여! 고마워.', '여기 이 부분이 참 좋다. 어떻게 그렸어?',
  '이 그림을 그릴 때 어떤 기분이었어?', '선을 힘차게 그었네! 손에 힘이 쑥쑥 자랐어.', '색이 참 예쁘다. 어떤 색을 제일 좋아해?'];
function praiseFor(a) {
  if (a.kind === 'feel' && a.emo && ADJ[a.emo]) return G.pick([ADJ[a.emo] + ' 마음을 이렇게 그렸구나. 이야기해 줄래?', ADJ[a.emo] + ' 마음이 그림에 담겼네. 마음을 보여 줘서 고마워.']);
  if (a.kind === 'mirror') return G.pick(['양쪽이 똑같아! 마법 같은 거울 그림이야.', '빙글빙글 반짝반짝, 꽃 같은 거울 그림이다!']);
  if (a.kind === 'color') return G.pick(['꼼꼼하게 색칠했구나! 알록달록 예쁘다.', '어떤 색을 골랐는지 이야기해 줄래?']);
  return G.pick(PRAISE_ART);
}
function dateLabel(t) {
  var d = new Date(t), today = G.today(), y = new Date(); y.setDate(y.getDate() - 1);
  if (G.today(d) === today) return '오늘';
  if (G.today(d) === G.today(y)) return '어제';
  return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
}
function tagFor(a) { return (KIND[a.kind] || '🖍️') + (a.emo && emoOf(a.emo) ? emoOf(a.emo).e : ''); }

G.act({
  id: 'gallery', area: 'art', title: '그림첩', icon: '🖼️', order: 99, levels: 1, needs: [], mins: 2, tool: true,
  ef: ['regulate'],
  desc: '내가 그린 그림 보기',
  goal: '자기 작품을 다시 보며 성취감·자기 효능감 느끼기, 그림으로 이야기 나누기',
  how: '그림을 하나 골라 "이 그림 이야기해 줄래?" 하고 물어 주세요. 날짜별로 모인 그림을 미술치료 선생님께 보여 드리면 아이 마음의 흐름을 함께 볼 수 있어요. ⬇️ 로 기기에 받을 수 있고, 지우기는 어른 확인 뒤에만 돼요.',
  basis: '작품 돌아보기 — 자기 효능감·이야기 나누기(미술치료 마무리 과정)',
  offline: '그림을 냉장고에 붙이고 가족에게 "이 그림 이야기해 줄래?" 하고 설명할 기회 주기.',
  run: function (ctx) {
    var B = ctx.body, list = [], cur = -1, view = null;
    B.innerHTML = '<div class="gl"><div class="gl-head"></div><div class="gl-grid"></div></div>';
    var head = G.$('.gl-head', B), grid = G.$('.gl-grid', B);
    G.db.all('art').then(function (arts) {
      if (!ctx.alive) return;
      list = (arts || []).filter(function (a) { return a && a.img; }).sort(function (a, b) { return b.t - a.t; });
      render(true);
    });
    function render(first) {
      grid.innerHTML = '';
      var oldEmpty = G.$('.gl-empty', B); if (oldEmpty) oldEmpty.remove();
      if (!list.length) { empty(first); return; }
      grid.hidden = false;
      head.innerHTML = '🖼️ 내 그림 <em>' + list.length + '</em>장';
      list.forEach(function (a, i) {
        var b = G.el('<button type="button" class="gl-card"><img alt="내 그림"><span class="gl-tag"></span><small></small></button>');
        b.querySelector('img').src = a.img;
        b.querySelector('.gl-tag').textContent = tagFor(a);
        b.querySelector('small').textContent = dateLabel(a.t);
        b.style.animationDelay = Math.min(i, 12) * 40 + 'ms';
        b.onclick = function () { G.sfx.play('tap'); open(i); };
        grid.appendChild(b);
      });
      if (first) ctx.say(list.length === 1 ? '그림첩에 그림이 한 장 있어! 눌러서 크게 봐.' : '와, 그림이 ' + countWord(list.length) + ' 장이나 있네! 보고 싶은 그림을 눌러 봐.');
    }
    function empty(first) {
      head.innerHTML = ''; grid.hidden = true;
      var e = G.el('<div class="gl-empty"><div class="ge">🖼️</div><b>아직 그림이 없어요</b><p>그림을 그리고 💾 를 누르면 여기에 모여요.</p>' +
        '<button type="button" class="btn big">🖍️ 그리러 가기</button></div>');
      e.querySelector('.btn').onclick = function () { G.sfx.play('tap'); G.start('draw'); };
      G.$('.gl', B).appendChild(e);
      ctx.say(first ? '아직 그림첩이 비어 있어. 같이 그림 그리러 갈까?' : '그림첩이 비었어. 새 그림을 그려 볼까?');
    }
    function close() { if (view) { view.remove(); view = null; } }
    function open(i) {
      close(); cur = i; var a = list[i]; if (!a) return;
      view = G.el('<div class="gl-view" role="dialog" aria-label="그림 크게 보기"><div class="gl-say"><div class="jvm">' + G.jarvisSVG() + '</div><p></p></div><img class="gl-big" alt="내 그림"><div class="gl-cap"></div>' +
        '<div class="gl-btns"><button type="button" class="gl-b prev" aria-label="앞 그림">◀</button><button type="button" class="gl-b dl" aria-label="기기에 받기">⬇️</button>' +
        '<button type="button" class="gl-b del" aria-label="지우기">🗑️</button><button type="button" class="gl-b x" aria-label="닫기">✕</button>' +
        '<button type="button" class="gl-b next" aria-label="다음 그림">▶</button></div></div>');
      var big = view.querySelector('.gl-big');
      big.src = a.img;
      var em = a.emo && emoOf(a.emo);
      view.querySelector('.gl-cap').textContent = dateLabel(a.t) + ' · ' + tagFor(a) + (em ? ' ' + em.name : '') + '  (' + (i + 1) + ' / ' + list.length + ')';
      view.querySelector('.prev').disabled = i <= 0;
      view.querySelector('.next').disabled = i >= list.length - 1;
      view.querySelector('.prev').onclick = function () { G.sfx.play('tap'); open(cur - 1); };
      view.querySelector('.next').onclick = function () { G.sfx.play('tap'); open(cur + 1); };
      view.querySelector('.x').onclick = function () { G.sfx.play('tap'); G.voice.stop(); close(); };
      view.querySelector('.dl').onclick = function () {
        G.sfx.play('tap');
        var l = document.createElement('a'); l.href = a.img; l.download = '그림-' + G.today(new Date(a.t)) + '-' + a.id.slice(-4) + '.jpg';
        document.body.appendChild(l); l.click(); setTimeout(function () { l.remove(); }, 500);
        G.toast('그림을 기기에 받았어요');
      };
      view.querySelector('.del').onclick = function () {
        G.sfx.play('tap');
        G.grownUp('그림을 지우려면 답을 눌러 주세요.').then(function (ok) {
          if (!ok || !ctx.alive) return;
          G.db.del('art', a.id).then(function () {
            list = list.filter(function (x) { return x.id !== a.id; });
            G.toast('그림을 지웠어요'); close(); render(false);
          }).catch(function () { G.toast('지우지 못했어요'); });
        });
      };
      view.addEventListener('click', function (ev) { if (ev.target === view) { G.voice.stop(); close(); } });
      /* 옆으로 밀어 넘기기 */
      var sx = null;
      big.addEventListener('pointerdown', function (ev) { sx = ev.clientX; });
      big.addEventListener('pointerup', function (ev) {
        if (sx == null) return; var dx = ev.clientX - sx; sx = null;
        if (dx < -50 && cur < list.length - 1) open(cur + 1); else if (dx > 50 && cur > 0) open(cur - 1);
      });
      var line = praiseFor(a);
      view.querySelector('.gl-say p').textContent = line;
      B.appendChild(view);
      G.sfx.play('sparkle');
      ctx.say(line);
    }
    ctx.cleanup(close);
  }
});
})();

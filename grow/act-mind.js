/* ===========================================================
   함께 자라요 — 생각놀이 (인지: 주의·기억·짝짓기·순서·수·개념)

   match 짝 맞추기 · same 같은 그림 찾기 · order 순서 맞추기 · count 숫자 세기
   shape 모양과 색 · odd 다른 하나 찾기 · big 크다 작다

   모든 놀이는 '실패 없는 배움'으로 짰다.
   틀린 그림은 흐려지고, 두 번 틀리면 정답이 빛나며 자비스가 답을 말해 준다.
   기록은 한 문제에 한 번 — 처음에 맞히면 맞음, 처음 틀리면 틀림.

   단계: 1~3 기초 · 4 도전 · 5 마스터 · 6~10 한 해 동안 오르는 사다리
   (6·7단계 초등 1~2학년 쪽으로, 8·9단계 3학년 쪽으로, 10단계는 3학년이 애써서 하는 만큼).
   칸(1~3칸)이 오르면 몇 문제만 다음 단계 문제로 미리 맛본다(stepMix).
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;
if (!G || !D) return;

var NUM = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
  '열하나', '열둘', '열셋', '열넷', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스물'];   /* 11~20 은 숫자 세기 4·5단계 */
var DET = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];   /* '두 개씩 네 묶음' */

/* ---------- 모양 ---------- */
G.css('mind', [
  /* 공통 */
  '.mind-q{display:flex;flex-direction:column;align-items:center;margin:auto 0 6px}',
  '.mind-target{background:var(--surface);border-radius:28px;padding:10px 26px;box-shadow:var(--shadow);border:4px dashed color-mix(in srgb,var(--area) 55%,transparent);text-align:center}',
  '.mind-target .tg{font-size:clamp(76px,22vw,150px);line-height:1.15;display:block}',
  '.mind-target small{display:block;color:var(--soft);font-size:clamp(13px,3.4vw,16px)}',
  '.mind-num{font-family:"Jua",sans-serif;font-size:clamp(54px,15vw,100px);line-height:1;color:var(--area)}',
  '.mind-auto{margin:6px auto 0;display:flex}',
  '.btn.sm.mind-auto{min-height:44px}',
  /* 6~10단계 문제 그림 묶음 — 화면 가운데에 */
  '.mind-box{margin:auto 0;display:flex;flex-direction:column;align-items:center;width:100%}',
  '.mind-box > .mind-eq{margin:0 0 8px}',
  '.act-count .mind-box > .cfield{margin:0 0 4px}',

  /* 짝 맞추기 — 뒤집는 카드 */
  '.act-match .mgrid{display:grid;grid-template-columns:repeat(var(--cols),1fr);gap:clamp(8px,2vw,14px);margin:auto;',
  '  width:min(100%,calc((100vh - 215px) / var(--rows) * var(--cols) * .74));width:min(100%,calc((100dvh - 215px) / var(--rows) * var(--cols) * .74))}',
  '.act-match .mc{aspect-ratio:4/5;perspective:900px;padding:0;border-radius:20px;container-type:inline-size}',
  '.act-match .mc-in{position:relative;width:100%;height:100%;transition:transform .45s;transform-style:preserve-3d}',
  '.act-match .mc.up .mc-in{transform:rotateY(180deg)}',
  '.act-match .mc-back,.act-match .mc-face{position:absolute;inset:0;border-radius:20px;display:flex;align-items:center;justify-content:center;',
  '  backface-visibility:hidden;-webkit-backface-visibility:hidden;box-shadow:var(--shadow)}',
  '.act-match .mc-back{background:var(--area);color:rgba(255,255,255,.9);font-family:"Jua",sans-serif;font-size:clamp(28px,8vw,54px);font-size:38cqw;',
  '  background-image:radial-gradient(circle at 20% 20%,rgba(255,255,255,.25) 0 12%,transparent 13%),radial-gradient(circle at 80% 75%,rgba(255,255,255,.18) 0 16%,transparent 17%)}',
  '.act-match .mc-face{background:var(--surface);transform:rotateY(180deg);font-size:clamp(34px,10vw,80px);font-size:58cqw;line-height:1}',
  '.act-match .mc.got .mc-face{box-shadow:0 0 0 4px var(--good),var(--shadow)}',
  '.act-match .mc.got{animation:pop .5s}',

  /* 순서 맞추기 */
  '.act-order .otitle{font-family:"Jua",sans-serif;font-size:clamp(22px,6vw,32px);text-align:center;margin:auto 0 8px}',
  '.act-order .oslots{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:clamp(6px,2vw,14px);width:100%;max-width:760px;margin:0 auto 14px}',
  '.act-order .oslot{position:relative;aspect-ratio:1;border-radius:22px;border:4px dashed var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;background:color-mix(in srgb,var(--surface) 55%,transparent)}',
  '.act-order .oslot b{position:absolute;left:6px;top:4px;width:30px;height:30px;border-radius:50%;background:var(--area);color:#fff;font-family:"Jua",sans-serif;font-size:18px;display:flex;align-items:center;justify-content:center}',
  '.act-order .oslot.fill{border-style:solid;border-color:var(--area);background:var(--surface);animation:pop .45s}',
  '.act-order .oslot .se{font-size:clamp(34px,10vw,72px);line-height:1.1}',
  '.act-order .oslot .sw{font-size:clamp(12px,3.3vw,17px);font-family:"Jua",sans-serif}',
  '.act-order .oslot.now{border-color:color-mix(in srgb,var(--area) 70%,transparent)}',
  '.act-order .choice.gone{visibility:hidden}',
  '.act-order .choices{margin:0 auto auto}',
  /* 다섯·여섯 칸 순서(4·5단계)는 좁은 화면에서 세 칸씩 두 줄로 */
  '@media (max-width:620px){.act-order .oslots.wrap{grid-template-columns:repeat(3,1fr)}}',
  /* 일곱·여덟 칸(7단계~)은 네 칸씩 두 줄, 카드도 조금 작게 */
  '@media (max-width:620px){.act-order .oslots.wrap4{grid-template-columns:repeat(4,1fr)}}',
  '.act-order.olong .oslot{border-radius:16px}',
  '.act-order.olong .oslot b{width:24px;height:24px;font-size:15px;left:3px;top:2px}',
  '.act-order.olong .oslot .se{font-size:clamp(26px,7.4vw,56px)}',
  '.act-order.olong .oslot .sw{font-size:clamp(10.5px,2.9vw,15px);line-height:1.15;text-align:center;padding:0 2px}',
  '.act-order.olong .choices{gap:8px}',
  '.act-order.olong .choice{padding:6px 4px;min-height:clamp(64px,17vw,110px)}',
  '.act-order.olong .choice .ce{font-size:clamp(28px,8vw,56px)}',
  '.act-order.olong .choice .cl{font-size:clamp(13px,3.6vw,20px);line-height:1.15}',
  '.act-order .oslot.now.rev{border-color:#ffb300}',
  /* 카드가 일곱 장 넘으면(끼어든 카드 포함) 칸을 조금 납작하게 — 한 화면에 다 보이게 */
  '.act-order.olong .oslot{aspect-ratio:1.18}',
  '.act-order.olong .oslots{margin-bottom:10px}',
  '.act-order.olong .otitle{margin-bottom:6px}',

  /* 숫자 세기 */
  '.act-count .cfield{display:flex;flex-wrap:wrap;justify-content:center;align-content:center;gap:clamp(6px,2vw,14px);margin:auto 0 8px;max-width:640px}',
  '.act-count .ci{position:relative;font-size:clamp(46px,12vw,80px);line-height:1.15;width:1.35em;height:1.35em;border-radius:22px;background:var(--surface);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;transition:transform .15s}',
  '.act-count .ci.counted{background:color-mix(in srgb,var(--area) 22%,var(--surface));transform:scale(.92)}',
  '.act-count .ci i{position:absolute;right:-6px;top:-8px;min-width:30px;height:30px;border-radius:15px;background:var(--area);color:#fff;font-style:normal;font-family:"Jua",sans-serif;font-size:18px;line-height:30px;text-align:center;animation:pop .35s}',
  '.act-count .cfield.small .ci{font-size:clamp(34px,9vw,58px)}',
  '.act-count .numc{font-family:"Jua",sans-serif;font-size:clamp(50px,14vw,96px);line-height:1;color:var(--area)}',
  '.act-count .grp,.act-big .grp{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;font-size:clamp(26px,7vw,44px);line-height:1.15;max-width:100%}',
  /* 6~10단계: 더하기·빼기·뛰어 세기·동전 */
  '.mind-eq{font-family:"Jua",sans-serif;font-size:clamp(38px,10.5vw,70px);line-height:1.1;color:var(--area);text-align:center;margin:auto 0 6px}',
  '.mnum{font-family:"Jua",sans-serif;font-size:clamp(34px,9.4vw,64px);line-height:1;color:var(--area)}',
  '.act-count .cgrps{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px 12px;margin:0 0 8px}',
  '.act-count .cgrp{display:grid;grid-template-columns:repeat(var(--c),auto);gap:6px;padding:6px;border-radius:18px;background:color-mix(in srgb,var(--area) 8%,transparent)}',
  '.act-count .cgrp .ci{font-size:clamp(33px,8.6vw,50px);border-radius:16px}',
  '.act-count .cgrp .ci i{min-width:24px;height:24px;line-height:24px;font-size:15px;right:-5px;top:-6px}',
  '.act-count .ci.out{opacity:.25;filter:grayscale(1);transform:scale(.8);pointer-events:none;transition:opacity .5s,transform .5s,filter .5s}',
  '.act-count .cplus{font-family:"Jua",sans-serif;font-size:clamp(34px,9vw,56px);color:var(--area)}',
  '.act-count .cfield.skip{gap:10px}',
  '.act-count .cbox{position:relative;display:grid;grid-template-columns:repeat(var(--c),auto);gap:1px 2px;padding:8px 10px;min-width:48px;min-height:48px;border-radius:16px;background:var(--surface);box-shadow:var(--shadow);border:3px solid transparent;font-size:clamp(18px,5vw,28px);line-height:1.15;align-content:center;justify-content:center}',
  '.act-count .cbox.counted{border-color:var(--area);background:color-mix(in srgb,var(--area) 16%,var(--surface))}',
  '.act-count .cbox i,.act-count .coin i{position:absolute;right:-8px;top:-10px;min-width:32px;height:28px;padding:0 4px;border-radius:14px;background:var(--area);color:#fff;font-style:normal;font-family:"Jua",sans-serif;font-size:16px;line-height:28px;text-align:center;animation:pop .35s}',
  '.act-count .coin{position:relative;width:clamp(56px,15vw,80px);height:clamp(56px,15vw,80px);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:"Jua",sans-serif;font-size:clamp(17px,4.6vw,24px);box-shadow:inset 0 0 0 4px rgba(0,0,0,.12),var(--shadow)}',
  '.act-count .coin.c100{background:radial-gradient(circle at 35% 30%,#fafafa,#b0bec5);color:#37474f}',
  '.act-count .coin.c10{background:radial-gradient(circle at 35% 30%,#ffd7a8,#c98a4b);color:#5d3a1a}',
  '.act-count .coin.counted{box-shadow:inset 0 0 0 4px rgba(0,0,0,.12),0 0 0 4px var(--area)}',

  /* 모양과 색 */
  '.act-shape .shp{width:clamp(76px,22vw,150px);height:clamp(76px,22vw,150px);display:block}',
  '.act-shape .choice{min-height:clamp(120px,30vw,200px)}',
  /* 6~10단계: 입체 모양 · 규칙 찾기 · 돌린 모양 */
  '.act-shape .mind-target .shp{width:clamp(90px,26vw,160px);height:clamp(90px,26vw,160px);margin:0 auto}',
  '.act-shape .patrow{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:4px;background:var(--surface);border-radius:22px;box-shadow:var(--shadow);padding:10px 8px;width:100%;max-width:640px}',
  '.act-shape .patrow svg,.act-shape .patrow .pq{width:clamp(38px,10.4vw,64px);height:clamp(38px,10.4vw,64px);display:block}',
  '.act-shape .patrow .pq{border:3px dashed var(--area);border-radius:12px;font-family:"Jua",sans-serif;font-size:clamp(26px,7vw,42px);color:var(--area);display:flex;align-items:center;justify-content:center;box-sizing:border-box}',
  '.act-shape .patrow .pq.fill{border-style:solid}',
  '.act-shape .patrow .pq svg{width:100%;height:100%}',
  '.act-shape svg.poly{transition:transform .9s ease}',
  '.act-shape .choices.c3 .cl{font-size:clamp(13px,3.6vw,20px);line-height:1.15}',

  /* 다른 하나 찾기 6~10단계 */
  '.mind-rule{font-family:"Jua",sans-serif;font-size:clamp(20px,5.6vw,30px);color:var(--area);margin-top:2px;text-align:center}',
  '.act-odd .orest{display:flex;justify-content:center;gap:6px;font-size:clamp(30px,8vw,48px);margin-top:4px}',
  '.act-odd .why{font-family:"Jua",sans-serif;font-size:clamp(19px,5.2vw,28px);line-height:1.2}',
  '.act-odd .mind-target .tg{font-size:clamp(64px,18vw,120px)}',

  /* 같은 그림 찾기 9~10단계 — 짝 관계(유추) */
  '.act-same .an{display:flex;align-items:center;justify-content:center;gap:4px;font-size:clamp(44px,12vw,84px);line-height:1.2}',
  '.act-same .an i{font-style:normal;font-size:.5em;color:var(--soft);padding:0 4px}',
  '.act-same .an b{font-family:"Jua",sans-serif;color:var(--area);width:1.15em;height:1.15em;font-size:.85em;display:inline-flex;align-items:center;justify-content:center;border:3px dashed var(--area);border-radius:14px}',
  '.act-same .an + .an{border-top:2px dashed var(--line);margin-top:2px;padding-top:2px}',

  /* 크다 작다 */
  '.act-big .choice{min-height:clamp(150px,36vw,240px)}',
  '.act-big .choice .ce{line-height:1}',
  '.act-big .train{font-size:clamp(24px,6.6vw,46px);white-space:nowrap;line-height:1.2;letter-spacing:-2px}',
  '.act-big .choices.c1 .choice{min-height:clamp(90px,20vw,140px)}',
  /* 6~10단계: 차례로 놓기 · 시소 · 물컵 · 몇 개 더 · 자로 재기 */
  '.act-big .choice{position:relative}',
  '.act-big .choices.ser .choice{min-height:clamp(84px,22vw,150px)}',
  '.act-big .choices.ser.c1 .choice{min-height:clamp(56px,13vw,90px);padding:6px}',
  '.act-big .choice .sb{position:absolute;left:8px;top:6px;width:32px;height:32px;border-radius:50%;background:var(--area);color:#fff;font-family:"Jua",sans-serif;font-size:19px;display:flex;align-items:center;justify-content:center;animation:pop .35s}',
  '.act-big .choice.sdone{border-color:var(--area)}',
  '.act-big .seesaw{position:relative;width:min(92vw,420px);height:clamp(120px,34vw,190px);margin:0 auto}',
  '.act-big .seesaw .plank{position:absolute;left:4%;right:4%;bottom:38%;height:12px;border-radius:6px;background:#8d6e63;transform-origin:50% 50%}',
  '.act-big .seesaw .plank span{position:absolute;bottom:8px;font-size:clamp(46px,13vw,80px);line-height:1}',
  '.act-big .seesaw .sl{left:1%}',
  '.act-big .seesaw .sr{right:1%}',
  '.act-big .seesaw .pivot{position:absolute;left:50%;bottom:0;width:20%;height:38%;transform:translateX(-50%);background:#a1887f;clip-path:polygon(50% 0,100% 100%,0 100%)}',
  '.act-big svg.cup{width:clamp(62px,17vw,104px);height:auto;display:block}',
  '.act-big .mrows{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:6px 3px;width:100%;max-width:560px;margin:0 auto 8px;background:var(--surface);border-radius:22px;box-shadow:var(--shadow);padding:10px 8px;box-sizing:border-box}',
  '.act-big .mrows span{font-size:clamp(24px,6.6vw,42px);line-height:1.2;text-align:center;border-radius:10px;transition:background .3s}',
  '.act-big .mrows span.xtra.on{background:color-mix(in srgb,#ffd54f 60%,transparent);box-shadow:0 0 0 3px #ffd54f}',
  '.act-big .mrows .rl{grid-column:1/-1;height:0;border-top:2px dashed var(--line)}',
  '.act-big svg.ruler{width:100%;max-width:560px;height:auto;display:block;margin:0 auto 8px}',
  '.act-big svg.ruler .rk{opacity:0;transition:opacity .4s}',
  '.act-big svg.ruler.show .rk{opacity:1}',
  '.act-big .rulerbox{width:100%;background:var(--surface);border-radius:22px;box-shadow:var(--shadow);padding:8px 6px 4px;box-sizing:border-box;margin:auto 0 8px}'
].join('\n'));

/* ---------- 도우미 ---------- */
/* 낱말 고르기 (동작 낱말 빼고, 같은 그림 겹치지 않게) */
function wordPool(maxLv, cats) {
  var seen = {};
  return D.WORDS.filter(function (w) {
    if (w.c === 'action' || w.lv > maxLv) return false;
    if (cats && cats.indexOf(w.c) < 0) return false;
    if (seen[w.e]) return false;
    seen[w.e] = 1; return true;
  });
}
function ordWord(k, n) { return k === 0 ? '먼저' : k === n - 1 ? '마지막에' : '그다음'; }
function acc(w) { return G.josa(w, '을', '를'); }
function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
/* 숫자 뒤 조사 — 1·3·6·7·8·0(십·백)으로 끝나면 받침이 있다 ('3은', '2는') */
function numJosa(n, a, b) { return n + ([0, 1, 3, 6, 7, 8].indexOf(Math.abs(n) % 10) >= 0 ? a : b); }

/* 그림 고르기 한 문제 — 실패 없는 배움
   o: {items, isRight(it), render, cols, size, praise(str|fn), answer(str), after(it, el)→Promise,
       missSay(it)→첫 실수 때 해 줄 말(없으면 보통 격려), reveal()→답을 보여 줄 때 그림으로도 짚어 주기} */
function pickItem(ctx, o) {
  return new Promise(function (resolve) {
    var miss = 0, ch = null;
    ch = ctx.choices(o.items, {
      cols: o.cols, size: o.size, render: o.render, label: o.label, color: o.color,
      onPick: function (it, el) {
        if (o.isRight(it)) {
          if (!miss) ctx.trial(true);
          var p = typeof o.praise === 'function' ? o.praise(it) : o.praise;
          ctx.cheer(p, el).then(function () { return o.after ? o.after(it, el) : null; })
            .then(function () { return ctx.wait(450); }).then(function () { resolve(miss === 0); });
          return true;
        }
        miss++;
        if (miss === 1) ctx.trial(false);
        el.classList.add('dim'); el.disabled = true;
        var right = ch.buttons.filter(function (b) { return o.isRight(b._item); })[0];
        var left = ch.buttons.filter(function (b) { return !b.disabled; }).length;
        if (miss >= 2 || left <= 1) {
          G.sfx.play('oops'); G.ui.wiggle(el); G.ui.hint(right);
          if (o.reveal) o.reveal();
          ctx.say(o.answer, { repeat: false });
        } else {
          ctx.oops(o.missSay ? o.missSay(it) : null, el);
        }
        return false;
      }
    });
  });
}
function clear(ctx) { ctx.body.innerHTML = ''; }
/* 칸 맞추기 — 칸이 오르면 몇 문제만 다음 단계 문제로: 2칸은 하나, 3칸은 둘.
   첫 문제는 늘 지금 단계라 쉽게 시작한다. 돌려주는 것: 문제마다 true(다음 단계 문제) / false */
function stepMix(ctx, N) {
  var out = G.range(N).map(function () { return false; });
  G.sample(G.range(N).slice(1), Math.max(0, (ctx.step || 1) - 1)).forEach(function (i) { out[i] = true; });
  return out;
}
/* 숫자 고르기 — n 이 정답, opts 는 보기(정답 포함). unit: '개'·'원'·'cm' (없으면 20 까지는 '하나·둘' 이름) */
function numPick(ctx, n, opts, o) {
  return pickItem(ctx, {
    items: G.shuffle(opts).map(function (v) { return { v: v }; }), cols: opts.length, size: 'md',
    render: function (it) { return '<span class="mnum">' + it.v + '</span>' + (o.unit ? '<span class="cl">' + o.unit + '</span>' : it.v <= 20 ? '<span class="cl">' + NUM[it.v] + '</span>' : ''); },
    isRight: function (it) { return it.v === n; },
    praise: o.praise, answer: o.answer, after: o.after, missSay: o.missSay, reveal: o.reveal
  });
}
/* 정답 둘레 보기 수 고르기 — 정답 n, 차이 d 들 가운데 범위 안에서 겹치지 않게 */
function nearOpts(n, ds, lo, hi, k) {
  var out = [n];
  G.shuffle(ds).forEach(function (d) { var v = n + d; if (out.length < k && v >= lo && v <= hi && out.indexOf(v) < 0) out.push(v); });
  return out;
}

/* =================================================================
   1. 짝 맞추기 (기억)
   ================================================================= */
/* 판마다 짝 수 (단계별) — 6~9단계 12쌍, 10단계 14쌍 */
var MATCH_P = [2, 3, 6, 8, 10, 12, 12, 12, 12, 14];
/* 8단계~ '짝꿍 물건' — 똑같은 그림이 아니라 함께 쓰는 것끼리 짝. 그림이 겹치지 않게 골랐다 */
var MATCH_REL = [
  [['🦷', '이'], ['🪥', '칫솔']], [['🔒', '자물쇠'], ['🔑', '열쇠']], [['📒', '공책'], ['✏️', '연필']],
  [['🌧️', '비'], ['☂️', '우산']], [['🐶', '강아지'], ['🦴', '뼈다귀']], [['🐰', '토끼'], ['🥕', '당근']],
  [['🐝', '벌'], ['🍯', '꿀']], [['🐵', '원숭이'], ['🍌', '바나나']], [['🐮', '소'], ['🥛', '우유']],
  [['🐔', '닭'], ['🥚', '달걀']], [['🧦', '양말'], ['👟', '운동화']], [['✋', '손'], ['🧤', '장갑']],
  [['👀', '눈'], ['👓', '안경']], [['🎂', '케이크'], ['🕯️', '초']], [['⚽', '공'], ['🥅', '골대']],
  [['🫖', '주전자'], ['☕', '찻잔']], [['🐟', '물고기'], ['🎣', '낚싯대']], [['🍜', '국수'], ['🥢', '젓가락']],
  [['🔦', '손전등'], ['🔋', '건전지']], [['🎨', '물감'], ['🖌️', '붓']], [['👂', '귀'], ['🎧', '헤드폰']]
];

G.act({
  id: 'match', area: 'mind', title: '짝 맞추기', icon: '🃏', order: 10,
  desc: '같은 그림 두 장을 찾아요',
  goal: '시각 기억·작업 기억, 차례로 살펴보는 주의력, 그림 이름(어휘)',
  how: '카드를 뒤집을 때마다 그림 이름을 아이와 같이 소리 내어 말해 주세요. 못 찾고 헤매면 "아까 강아지가 어디 있었지?" 하고 위치를 함께 떠올려 주세요. 1단계는 그림을 먼저 2초쯤 보여 주고, 칸이 오를수록 조금씩 짧아집니다. 4·5단계(도전·마스터)는 짝이 8쌍·10쌍으로 늘어요. 6~10단계는 12쌍·14쌍으로 늘고, 비슷한 그림(같은 무리)에 이어 "칫솔–이"처럼 함께 쓰는 짝꿍 물건을 찾아요.',
  levels: 10, needs: [], mins: 3,
  run: async function (ctx) {
    var lv = ctx.level;
    /* 칸이 오르면 — 1단계: 미리 보는 시간이 2단계 쪽으로 조금씩 짧아진다. 2·3단계: 마지막 판 짝이 하나씩 는다 (ctx.tune).
       4단계 8쌍(→9), 5단계 10쌍(→11), 6~9단계 12쌍(9단계 →13), 10단계 14쌍(→15) */
    var plan = lv === 1 ? [{ p: 2, pre: ctx.tune([2000, 1200, 0]) }, { p: 2, pre: ctx.tune([2000, 0, 0]) }] :
      lv === 2 ? [{ p: 3, pre: 1200 }, { p: ctx.tune(MATCH_P), pre: 0 }] : [{ p: ctx.tune(MATCH_P), pre: 0 }];
    var pool = G.shuffle(wordPool(lv === 1 ? 1 : lv === 2 ? 2 : 3));
    for (var b = 0; b < plan.length; b++) {
      ctx.progress(b, plan.length);
      await board(ctx, lv >= 6 ? hardPairs(ctx, plan[b].p) : pool.splice(0, plan[b].p).map(samePair), plan[b].pre);
      if (b < plan.length - 1) { await ctx.say('하나 더 해 볼까?', { repeat: false }); }
    }
    ctx.progress(plan.length, plan.length);
    ctx.finish();
  }
});

function samePair(w) { return [{ e: w.e, w: w.w, k: w }, { e: w.e, w: w.w, k: w }]; }
/* 6단계~ 판 만들기.
   sim: 똑같은 짝 가운데 한 무리(동물이나 먹을 것)에서 뽑는 몫 — 비슷한 그림끼리라 헷갈린다 (6단계 0 → 7단계~ 모두)
   rel: 짝꿍 물건 몫 (7단계 0 → 8단계 절반 → 9·10단계 모두) */
function hardPairs(ctx, p) {
  var sim = ctx.tune([0, 0, 0, 0, 0, 0, 1, 1, 1, 1]), rel = ctx.tune([0, 0, 0, 0, 0, 0, 0, 0.5, 1, 1]);
  var nRel = Math.min(MATCH_REL.length, Math.round(rel * p)), nSame = p - nRel;
  var relE = {}; MATCH_REL.forEach(function (r) { relE[r[0][0]] = relE[r[1][0]] = 1; });
  var pool = wordPool(3).filter(function (w) { return !relE[w.e]; });   /* 짝꿍 물건 그림과 겹치지 않게 */
  var cat = G.pick(['animal', 'food']), nSim = Math.round(sim * nSame);
  var inCat = G.sample(pool.filter(function (w) { return w.c === cat; }), nSim);
  var rest = G.sample(pool.filter(function (w) { return inCat.indexOf(w) < 0 && (!nSim || w.c !== cat); }), nSame - inCat.length);
  var pairs = inCat.concat(rest).map(samePair);
  G.sample(MATCH_REL, nRel).forEach(function (r) {
    pairs.push([{ e: r[0][0], w: r[0][1], k: r }, { e: r[1][0], w: r[1][1], k: r }]);
  });
  return pairs;
}

function board(ctx, pairs, preview) {
  clear(ctx);
  var n = pairs.length * 2, land = innerWidth > innerHeight * 1.1;
  var rel = pairs.filter(function (p) { return p[0].e !== p[1].e; });
  /* 카드 16장 넘으면(4·5단계) 세로 화면 네 줄·가로 화면 여섯 줄 — 카드가 너무 작아지지 않게. 28장 넘으면 세로 화면 다섯 줄 */
  var cols = n === 4 ? 2 : n === 6 ? (land ? 3 : 2) : n >= 28 ? (land ? 6 : 5) : n >= 16 ? (land ? 6 : 4) : (land ? 4 : 3);
  var rows = Math.ceil(n / cols);
  var grid = G.el('<div class="mgrid" style="--cols:' + cols + ';--rows:' + rows + '"></div>');
  var cards = G.shuffle([].concat.apply([], pairs)).map(function (it) {
    var c = G.el('<button class="mc" type="button" aria-label="카드"><div class="mc-in"><div class="mc-back">?</div><div class="mc-face">' + it.e + '</div></div></button>');
    c._w = it; grid.appendChild(c); return c;
  });
  ctx.body.appendChild(grid);

  return (async function () {
    if (preview) {
      cards.forEach(function (c) { c.classList.add('up'); });
      await ctx.say('그림을 잘 봐! 어디에 있는지 기억해.');
      await ctx.wait(preview);
      cards.forEach(function (c) { c.classList.remove('up'); });
      G.sfx.play('whoosh');
      await ctx.wait(500);
    }
    if (rel.length) {
      /* 짝꿍 물건 보기 하나 — 이 판에 없는 짝으로 */
      var ex = G.pick(MATCH_REL.filter(function (r) { return rel.every(function (p) { return p[0].k !== r; }); }));
      var exs = ex ? ' ' + G.josa(ex[1][1], '은', '는') + ' ' + G.josa(ex[0][1], '이랑', '랑') + ' 짝꿍이야.' : '';
      ctx.say((rel.length === pairs.length ? '함께 쓰는 짝꿍 두 장을 찾아봐!' : '똑같은 그림도 찾고, 함께 쓰는 짝꿍도 찾아봐!') + exs);
    } else ctx.say('같은 그림 두 장을 찾아봐!');
    return new Promise(function (resolve) {
      var first = null, busy = false, found = 0, missRun = 0;
      cards.forEach(function (c) {
        c.addEventListener('click', function () {
          if (busy || !ctx.alive || c.classList.contains('up')) return;
          G.sfx.play('tap'); G.buzz(10);
          c.classList.add('up');
          if (!first) {
            first = c;
            ctx.say(c._w.w + '!', { repeat: false });
            /* 계속 못 찾으면 짝꿍 카드를 살짝 빛나게 */
            if (missRun >= 2) { var mate = cards.filter(function (x) { return x !== c && x._w.k === c._w.k; })[0]; G.ui.hint(mate); }
            return;
          }
          var a = first; first = null; busy = true;
          if (a._w.k === c._w.k) {
            ctx.trial(true); missRun = 0; found++;
            a.classList.add('got'); c.classList.add('got');
            ctx.cheer('짝꿍 찾았다! ' + (a._w.e === c._w.e ? c._w.w : G.josa(a._w.w, '이랑', '랑') + ' ' + c._w.w) + '!', c).then(function () {
              busy = false;
              if (found === pairs.length) ctx.wait(300).then(resolve);
            });
          } else {
            ctx.trial(false); missRun++;
            ctx.say(c._w.w + '!', { repeat: false });
            ctx.timeout(function () {
              a.classList.remove('up'); c.classList.remove('up');
              G.sfx.play('oops'); busy = false;
              if (missRun === 2) ctx.say('괜찮아, 천천히 다시 찾아보자.', { repeat: false });
            }, 1300);
          }
        });
      });
    });
  })();
}

/* =================================================================
   2. 같은 그림 찾기 (시각 짝짓기)
   ================================================================= */
/* 7단계 — 모습은 달라도 같은 것 [얼굴(앞모습) 그림, 온몸(옆모습) 그림, 이름]. g: 보기를 같은 무리에서 고른다 */
var SAME_KIND = [
  ['🐶', '🐕', '강아지', 'a'], ['🐱', '🐈', '고양이', 'a'], ['🐰', '🐇', '토끼', 'a'], ['🐭', '🐁', '쥐', 'a'], ['🐷', '🐖', '돼지', 'a'],
  ['🐮', '🐄', '소', 'a'], ['🐵', '🐒', '원숭이', 'a'], ['🐴', '🐎', '말', 'a'], ['🐯', '🐅', '호랑이', 'a'], ['🐔', '🐓', '닭', 'a'], ['🐳', '🐋', '고래', 'a'],
  ['🚗', '🚘', '자동차', 't'], ['🚌', '🚍', '버스', 't'], ['🚓', '🚔', '경찰차', 't'], ['🚕', '🚖', '택시', 't'],
  ['📱', '☎️', '전화기', 't'], ['🍎', '🍏', '사과', 't'], ['⏰', '🕰️', '시계', 't']
];
/* 8단계 — 같은 일을 하는 물건 */
var SAME_USE = [
  { is: '글씨를 쓰는 거', w: [['✏️', '연필'], ['🖊️', '볼펜'], ['🖍️', '크레파스']] },
  { is: '음식을 먹을 때 쓰는 거', w: [['🥄', '숟가락'], ['🥢', '젓가락'], ['🍴', '포크']] },
  { is: '시간을 알려 주는 거', w: [['⏰', '자명종'], ['⌚', '손목시계'], ['🕰️', '탁상시계']] },
  { is: '어두울 때 밝혀 주는 거', w: [['💡', '전구'], ['🔦', '손전등'], ['🕯️', '초']] },
  { is: '앉을 때 쓰는 거', w: [['🪑', '의자'], ['🛋️', '소파']] },
  { is: '멀리 있는 사람과 이야기하는 거', w: [['📱', '휴대폰'], ['☎️', '전화기']] },
  { is: '음악을 연주하는 악기', w: [['🥁', '북'], ['🎸', '기타'], ['🎹', '피아노'], ['🎺', '나팔']] },
  { is: '물건을 담아 들고 다니는 거', w: [['🎒', '가방'], ['👜', '손가방'], ['🧺', '바구니']] },
  { is: '발에 신는 거', w: [['👟', '운동화'], ['👞', '구두'], ['👢', '장화']] },
  { is: '더 잘 보이게 해 주는 거', w: [['👓', '안경'], ['🔍', '돋보기'], ['🔭', '망원경']] }
];
/* 9·10단계 — 짝 관계(유추): "강아지는 뼈다귀! 그럼 토끼는?" [그림, 이름, 짝 그림, 짝 이름, 관계 말] */
var SAME_REL = [
  [['🐶', '강아지', '🦴', '뼈다귀', '강아지는 뼈다귀를 좋아해'], ['🐰', '토끼', '🥕', '당근', '토끼는 당근을 좋아해'], ['🐵', '원숭이', '🍌', '바나나', '원숭이는 바나나를 좋아해'],
    ['🐭', '쥐', '🧀', '치즈', '쥐는 치즈를 좋아해'], ['🐱', '고양이', '🐟', '생선', '고양이는 생선을 좋아해']],
  [['🐔', '닭', '🥚', '달걀', '닭은 달걀을 낳아'], ['🐮', '소', '🥛', '우유', '소는 우유를 줘'], ['🐝', '벌', '🍯', '꿀', '벌은 꿀을 모아'], ['🐑', '양', '🧶', '털실', '양털로 털실을 만들어']],
  [['✋', '손', '🧤', '장갑', '손에는 장갑을 껴'], ['🦶', '발', '🧦', '양말', '발에는 양말을 신어'], ['👀', '눈', '👓', '안경', '눈에는 안경을 써']],
  [['🌧️', '비', '☂️', '우산', '비가 오면 우산을 써'], ['☀️', '해', '🕶️', '선글라스', '해가 쨍쨍하면 선글라스를 써'], ['❄️', '눈', '🧣', '목도리', '눈이 오면 목도리를 해']],
  [['🚗', '자동차', '🛣️', '도로', '자동차는 도로로 다녀'], ['⛵', '배', '🌊', '바다', '배는 바다로 다녀'], ['✈️', '비행기', '☁️', '하늘', '비행기는 하늘로 다녀'], ['🚂', '기차', '🛤️', '철길', '기차는 철길로 다녀']],
  [['🧑‍⚕️', '의사', '🩺', '청진기', '의사 선생님은 청진기를 써'], ['🧑‍🍳', '요리사', '🍳', '프라이팬', '요리사는 프라이팬으로 요리해'], ['🧑‍🚒', '소방관', '🚒', '소방차', '소방관은 소방차를 타'], ['🧑‍🌾', '농부', '🚜', '트랙터', '농부는 트랙터를 몰아']],
  [['🪥', '칫솔', '🦷', '이', '칫솔로 이를 닦아'], ['✂️', '가위', '📄', '종이', '가위로 종이를 잘라'], ['🔑', '열쇠', '🔒', '자물쇠', '열쇠로 자물쇠를 열어'], ['🧹', '빗자루', '🍂', '낙엽', '빗자루로 낙엽을 쓸어']]
];

G.act({
  id: 'same', area: 'mind', title: '같은 그림 찾기', icon: '🔍', order: 20,
  desc: '똑같은 그림을 찾아요',
  goal: '시각 변별·짝짓기 (그림 인지의 첫걸음), 눈으로 비교하며 찾는 힘',
  how: '위 그림을 손가락으로 가리키며 "이거랑 똑같은 거 어디 있지?" 하고 물어 주세요. 3단계는 비슷한 그림(같은 무리)이 섞여 나와 더 꼼꼼히 봐야 합니다. 찾으면 그림 이름도 같이 말해 주세요. 4·5단계(도전·마스터)는 같은 무리 그림이 넷·다섯으로 늘어요. 6~10단계는 여섯 그림 속에서 찾기, 모습이 다른 같은 것(강아지 얼굴–강아지), 같은 일을 하는 물건(연필–볼펜), "강아지는 뼈다귀, 그럼 토끼는?" 같은 짝 관계(유추)로 이어져요.',
  levels: 10, needs: [], mins: 2,
  run: async function (ctx) {
    var lv = ctx.level, N = 6;
    var pool = wordPool(lv === 1 ? 2 : 3);
    var targets = G.sample(pool, N);
    /* 칸이 오르면 한두 문제는 다음 단계 문제로 — 3단계는 그 문제에 비슷한 그림이 하나 더.
       정답 말고 고를 그림 수 = 단계 수 (1 · 2 · 3 · 4 · 5 · 6), 3단계부터는 같은 무리 그림.
       7단계 모습이 다른 같은 것 · 8단계 같은 일을 하는 물건 · 9단계 짝 관계 · 10단계 짝 관계 + 헷갈리는 보기 */
    var mix = stepMix(ctx, N), used = { kind: [], use: [], rel: [] };
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      var tl = mix[i] ? lv + 1 : lv, k = tl;
      if (tl >= 7) { await sameHard(ctx, tl, i === 0, used); continue; }
      var t = targets[i], others;
      if (tl === 1) others = G.sample(pool.filter(function (w) { return w.c !== t.c; }), k);
      else if (tl >= 3) {
        var same = pool.filter(function (w) { return w.c === t.c && w !== t; });
        others = G.sample(same, Math.min(k, same.length));
        if (others.length < k) others = others.concat(G.sample(pool.filter(function (w) { return w !== t && others.indexOf(w) < 0; }), k - others.length));
      } else others = G.sample(pool.filter(function (w) { return w !== t; }), k);
      clear(ctx);
      ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-target"><span class="tg">' + t.e + '</span><small>이거랑 똑같은 거!</small></div></div>'));
      ctx.say(i === 0 ? '위에 있는 그림이랑 똑같은 그림을 찾아봐!' : '똑같은 그림은 어디 있을까?');
      await pickItem(ctx, {
        items: G.shuffle([t].concat(others)), label: false, cols: k + 1 > 3 ? 4 : k + 1, size: k >= 3 ? 'md' : 'lg',
        isRight: function (it) { return it === t; },
        praise: function () { return '맞아! 똑같은 ' + t.w + '!'; },
        answer: '여기 있어! 똑같은 ' + t.w + '!'
      });
    }
    ctx.progress(N, N);
    ctx.finish();
  }
});

/* 한 번 쓴 것은 한 판에 다시 나오지 않게 고르기 */
function freshPick(list, used) {
  var left = list.filter(function (x) { return used.indexOf(x) < 0; });
  var one = G.pick(left.length ? left : list); used.push(one); return one;
}

/* 7~10단계 같은 그림 찾기 */
function sameHard(ctx, tl, first, used) {
  clear(ctx);
  if (tl === 7) {
    /* 모습은 달라도 같은 것 — 보기는 모두 같은 모습(얼굴이면 모두 얼굴)이라 모양새로는 못 고른다 */
    var K = freshPick(SAME_KIND, used.kind), flip = Math.random() < 0.5;
    var near = SAME_KIND.filter(function (x) { return x !== K && x[3] === K[3]; });
    var opts = [K].concat(G.sample(near, 3)).map(function (x) { return { e: flip ? x[0] : x[1], w: x[2], ok: x === K }; });
    ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-target"><span class="tg">' + (flip ? K[1] : K[0]) + '</span><small>모습은 달라도 같은 거!</small></div></div>'));
    ctx.say(first ? '위 그림이랑 같은 걸 찾아봐! 모습은 조금 달라.' : '모습은 달라도 같은 건 어디 있을까?');
    var nm = G.josa(K[2], '이야', '야');
    return pickItem(ctx, {
      items: G.shuffle(opts), label: false, cols: 4, size: 'md',
      isRight: function (it) { return it.ok; },
      praise: '맞아! 둘 다 ' + nm + '!',
      answer: '여기 있어! 이것도 ' + nm + '.'
    });
  }
  if (tl === 8) {
    /* 같은 일을 하는 물건 — 정답은 같은 무리의 다른 물건, 나머지는 하는 일이 다른 물건 */
    var U = freshPick(SAME_USE, used.use), two = G.sample(U.w, 2);
    var tg = { e: two[0][0], w: two[0][1] }, rt = { e: two[1][0], w: two[1][1] };
    var wr = G.sample(SAME_USE.filter(function (x) { return x !== U; }), 3).map(function (x) { var y = G.pick(x.w); return { e: y[0], w: y[1] }; });
    var why = G.josa(tg.w, '이랑', '랑') + ' ' + G.josa(rt.w, '은', '는') + ' 둘 다 ' + U.is + '야!';
    ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-target"><span class="tg">' + tg.e + '</span><small>' + G.esc(tg.w) + ' — 같은 일을 하는 거!</small></div></div>'));
    ctx.say(first ? G.josa(tg.w, '이랑', '랑') + ' 같은 일을 하는 물건을 찾아봐!' : G.josa(tg.w, '이랑', '랑') + ' 같은 일을 하는 건 뭘까?');
    return pickItem(ctx, {
      items: G.shuffle([rt].concat(wr)), cols: 4, size: 'md',
      isRight: function (it) { return it === rt; },
      praise: '맞아!', after: function () { return ctx.say(why, { repeat: false }); },
      answer: '여기 있어! ' + why
    });
  }
  /* 9·10단계 짝 관계(유추). 9단계: 다른 관계의 짝 그림 셋이 보기.
     10단계: 헷갈리는 보기 — 위 짝(뼈다귀)과 같은 관계의 다른 짝(바나나)이 섞인다. 10단계 2·3칸은 보기 하나 더 */
  var R = freshPick(SAME_REL, used.rel), ab = G.sample(R, 2), A = ab[0], C = ab[1];
  var mk = function (p) { return { e: p[2], w: p[3] }; }, right = mk(C), opts = [right];
  var otherB = function () { return G.shuffle(SAME_REL.filter(function (x) { return x !== R; })).map(function (x) { return mk(G.pick(x)); }); };
  if (tl >= 10) {
    opts.push(mk(A));
    G.sample(R.filter(function (p) { return p !== A && p !== C; }), tl >= 11 ? 2 : 1).forEach(function (p) { opts.push(mk(p)); });
  }
  otherB().forEach(function (x) { if (opts.length < (tl >= 11 ? 5 : 4) && opts.every(function (o) { return o.e !== x.e; })) opts.push(x); });
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-target"><div class="an">' + A[0] + '<i>➜</i>' + A[2] + '</div><div class="an">' + C[0] + '<i>➜</i><b>?</b></div><small>짝이 되는 걸 찾아봐!</small></div></div>'));
  var q = G.josa(A[1], '은', '는') + ' ' + A[3] + '! 그럼 ' + G.josa(C[1], '은', '는') + '?';
  ctx.say(first ? q + ' 같은 짝을 찾아봐!' : q);
  return pickItem(ctx, {
    items: G.shuffle(opts), cols: opts.length > 4 ? 3 : 4, size: 'md',
    isRight: function (it) { return it === right; },
    praise: '맞아!', after: function () { return ctx.say(A[4] + '. ' + C[4] + '!', { repeat: false }); },
    missSay: function (it) { return it.e === A[2] ? '그건 ' + A[1] + '의 짝이야. ' + C[1] + '의 짝을 찾아봐!' : null; },
    answer: '여기 있어! ' + A[4] + '. ' + C[4] + '!'
  });
}

/* =================================================================
   3. 순서 맞추기 (차례·인과)
   ================================================================= */
/* 4·5단계 순서 — 다섯 칸(4단계)·여섯 칸(5단계). 순서가 하나로만 정해지는 일(원인→결과)만 골랐다.
   k: 같은 이야기(다섯 칸·여섯 칸)가 한 판에 두 번 나오지 않게 */
var SEQ5 = [
  { k: 'seed', t: '씨앗 심기', steps: [{ e: '🕳️', w: '구멍 파기' }, { e: '🌰', w: '씨앗 넣기' }, { e: '💧', w: '물 주기' }, { e: '🌱', w: '싹이 나요' }, { e: '🌻', w: '꽃이 펴요' }] },
  { k: 'letter', t: '편지 보내기', steps: [{ e: '✏️', w: '편지 쓰기' }, { e: '✉️', w: '봉투에 넣기' }, { e: '📮', w: '우체통에 넣기' }, { e: '🚚', w: '배달해요' }, { e: '📬', w: '편지가 왔어요' }] },
  { k: 'butterfly', t: '나비가 되어요', steps: [{ e: '🥚', w: '알' }, { e: '🐛', w: '애벌레' }, { e: '🍃', w: '잎을 먹어요' }, { e: '🛌', w: '번데기' }, { e: '🦋', w: '나비' }] },
  { k: 'snow', t: '눈사람', steps: [{ e: '❄️', w: '눈이 와요' }, { e: '🤲', w: '눈 뭉치기' }, { e: '⛄', w: '눈사람' }, { e: '☀️', w: '해가 떠요' }, { e: '💧', w: '녹아요' }] },
  { k: 'back', t: '거꾸로 세기', steps: [{ e: '5️⃣', w: '다섯' }, { e: '4️⃣', w: '넷' }, { e: '3️⃣', w: '셋' }, { e: '2️⃣', w: '둘' }, { e: '1️⃣', w: '하나' }] },
  { k: 'cake', t: '생일 파티', steps: [{ e: '🎂', w: '케이크 놓기' }, { e: '🕯️', w: '초 꽂기' }, { e: '🔥', w: '촛불 켜기' }, { e: '🎵', w: '노래 부르기' }, { e: '🌬️', w: '후~ 불기' }] },
  { k: 'apple', t: '사과가 열려요', steps: [{ e: '🌱', w: '새싹' }, { e: '🌳', w: '나무' }, { e: '🌸', w: '꽃' }, { e: '🍏', w: '초록 사과' }, { e: '🍎', w: '빨간 사과' }] }
];
var SEQ6 = [
  { k: 'seed', t: '씨앗 심기', steps: [{ e: '🕳️', w: '구멍 파기' }, { e: '🌰', w: '씨앗 넣기' }, { e: '🟫', w: '흙 덮기' }, { e: '💧', w: '물 주기' }, { e: '🌱', w: '싹이 나요' }, { e: '🌻', w: '꽃이 펴요' }] },
  { k: 'letter', t: '편지 보내기', steps: [{ e: '✏️', w: '편지 쓰기' }, { e: '✉️', w: '봉투에 넣기' }, { e: '📮', w: '우체통에 넣기' }, { e: '🚚', w: '배달해요' }, { e: '📬', w: '편지가 왔어요' }, { e: '😊', w: '읽고 기뻐요' }] },
  { k: 'snow', t: '눈사람', steps: [{ e: '❄️', w: '눈이 와요' }, { e: '🤲', w: '눈 뭉치기' }, { e: '⚪', w: '굴려서 크게' }, { e: '⛄', w: '눈사람' }, { e: '☀️', w: '해가 떠요' }, { e: '💧', w: '녹아요' }] },
  { k: 'back', t: '거꾸로 세기', steps: [{ e: '6️⃣', w: '여섯' }, { e: '5️⃣', w: '다섯' }, { e: '4️⃣', w: '넷' }, { e: '3️⃣', w: '셋' }, { e: '2️⃣', w: '둘' }, { e: '1️⃣', w: '하나' }] },
  { k: 'cake', t: '생일 파티', steps: [{ e: '🎂', w: '케이크 놓기' }, { e: '🕯️', w: '초 꽂기' }, { e: '🔥', w: '촛불 켜기' }, { e: '🎵', w: '노래 부르기' }, { e: '🌬️', w: '후~ 불기' }, { e: '🍰', w: '나눠 먹기' }] },
  { k: 'apple', t: '사과가 열려요', steps: [{ e: '🌰', w: '씨앗' }, { e: '🌱', w: '새싹' }, { e: '🌳', w: '나무' }, { e: '🌸', w: '꽃' }, { e: '🍏', w: '초록 사과' }, { e: '🍎', w: '빨간 사과' }] }
];
/* 7단계~ 일곱 칸 — 하루 시간 순서·자라는 순서·만드는 순서. d: 이 이야기에 어울리지 않는 '끼어든 카드' (없으면 SEQ_DECOY) */
var DECOY_FAR = [{ e: '🐙', w: '문어' }, { e: '🚀', w: '로켓' }, { e: '🦒', w: '기린' }];
var SEQ7 = [
  { k: 'seed', t: '씨앗 심기', steps: [{ e: '🕳️', w: '구멍 파기' }, { e: '🌰', w: '씨앗 넣기' }, { e: '🟫', w: '흙 덮기' }, { e: '💧', w: '물 주기' }, { e: '🌱', w: '싹이 나요' }, { e: '🌿', w: '잎이 자라요' }, { e: '🌻', w: '꽃이 펴요' }] },
  { k: 'letter', t: '편지 보내기', steps: [{ e: '✏️', w: '편지 쓰기' }, { e: '✉️', w: '봉투에 넣기' }, { e: '📮', w: '우체통에 넣기' }, { e: '🏤', w: '우체국에 모여요' }, { e: '🚚', w: '배달해요' }, { e: '📬', w: '편지가 왔어요' }, { e: '😊', w: '읽고 기뻐요' }] },
  { k: 'snow', t: '눈사람', steps: [{ e: '❄️', w: '눈이 와요' }, { e: '🤲', w: '눈 뭉치기' }, { e: '⚪', w: '굴려서 크게' }, { e: '⛄', w: '눈사람 완성' }, { e: '📸', w: '사진 찍기' }, { e: '☀️', w: '해가 떠요' }, { e: '💧', w: '녹아요' }] },
  { k: 'apple', t: '사과가 열려요', steps: [{ e: '🌰', w: '씨앗' }, { e: '🌱', w: '새싹' }, { e: '🌳', w: '나무' }, { e: '🌸', w: '꽃' }, { e: '🍏', w: '초록 사과' }, { e: '🍎', w: '빨간 사과' }, { e: '🧺', w: '사과 따기' }] },
  { k: 'back', t: '거꾸로 세기', steps: [{ e: '7️⃣', w: '일곱' }, { e: '6️⃣', w: '여섯' }, { e: '5️⃣', w: '다섯' }, { e: '4️⃣', w: '넷' }, { e: '3️⃣', w: '셋' }, { e: '2️⃣', w: '둘' }, { e: '1️⃣', w: '하나' }] },
  { k: 'chick', t: '병아리가 자라요', steps: [{ e: '🐔', w: '닭이 알을 낳아요' }, { e: '🥚', w: '따뜻하게 품어요' }, { e: '🐣', w: '알이 깨져요' }, { e: '🐥', w: '병아리가 나와요' }, { e: '🌾', w: '모이를 먹어요' }, { e: '🐤', w: '쑥쑥 자라요' }, { e: '🐓', w: '닭이 돼요' }] },
  { k: 'day', t: '나의 하루', d: DECOY_FAR, steps: [{ e: '🌅', w: '해가 떠요' }, { e: '🍳', w: '아침밥' }, { e: '🏫', w: '학교에서 공부' }, { e: '🍱', w: '점심밥' }, { e: '🏠', w: '집에 와요' }, { e: '🍲', w: '저녁밥' }, { e: '🌙', w: '잠자리에 들어요' }] },
  { k: 'cookie', t: '쿠키 굽기', steps: [{ e: '🛒', w: '재료 사 오기' }, { e: '🥚', w: '달걀 깨기' }, { e: '🥣', w: '반죽 섞기' }, { e: '⭐', w: '모양 찍기' }, { e: '♨️', w: '오븐에 굽기' }, { e: '🍪', w: '쿠키 완성' }, { e: '😋', w: '맛있게 먹기' }] },
  { k: 'rain', t: '비 오는 소풍날', d: [{ e: '🐙', w: '문어' }, { e: '🚀', w: '로켓' }, { e: '🪥', w: '이 닦기' }], steps: [{ e: '🧺', w: '소풍을 가요' }, { e: '☁️', w: '먹구름이 와요' }, { e: '🌧️', w: '비가 와요' }, { e: '☂️', w: '우산을 써요' }, { e: '🌤️', w: '비가 그쳐요' }, { e: '🌈', w: '무지개가 떠요' }, { e: '😊', w: '다시 신나게 놀아요' }] }
];
/* 8단계~ 여덟 칸 이야기 */
var SEQ8 = [
  { k: 'seed', t: '씨앗 심기', steps: [{ e: '🕳️', w: '구멍 파기' }, { e: '🌰', w: '씨앗 넣기' }, { e: '🟫', w: '흙 덮기' }, { e: '💧', w: '물 주기' }, { e: '🌱', w: '싹이 나요' }, { e: '🌿', w: '잎이 자라요' }, { e: '🌻', w: '꽃이 펴요' }, { e: '🐝', w: '벌이 날아와요' }] },
  { k: 'letter', t: '편지 보내기', steps: [{ e: '✏️', w: '편지 쓰기' }, { e: '✉️', w: '봉투에 넣기' }, { e: '📮', w: '우체통에 넣기' }, { e: '🏤', w: '우체국에 모여요' }, { e: '🚚', w: '배달해요' }, { e: '📬', w: '편지가 왔어요' }, { e: '😊', w: '읽고 기뻐요' }, { e: '✍️', w: '답장을 써요' }] },
  { k: 'apple', t: '사과가 열려요', steps: [{ e: '🌰', w: '씨앗' }, { e: '🌱', w: '새싹' }, { e: '🌳', w: '나무' }, { e: '🌸', w: '꽃' }, { e: '🍏', w: '초록 사과' }, { e: '🍎', w: '빨간 사과' }, { e: '🧺', w: '사과 따기' }, { e: '😋', w: '맛있게 먹기' }] },
  { k: 'back', t: '거꾸로 세기', steps: [{ e: '8️⃣', w: '여덟' }, { e: '7️⃣', w: '일곱' }, { e: '6️⃣', w: '여섯' }, { e: '5️⃣', w: '다섯' }, { e: '4️⃣', w: '넷' }, { e: '3️⃣', w: '셋' }, { e: '2️⃣', w: '둘' }, { e: '1️⃣', w: '하나' }] },
  { k: 'dog', t: '강아지 목욕', d: [{ e: '🚲', w: '자전거' }, { e: '🎨', w: '그림 그리기' }, { e: '🚀', w: '로켓' }], steps: [{ e: '🐾', w: '진흙에서 놀았어요' }, { e: '🛁', w: '욕조에 들어가요' }, { e: '🚿', w: '물을 뿌려요' }, { e: '🧼', w: '비누칠해요' }, { e: '💦', w: '깨끗이 헹궈요' }, { e: '🌬️', w: '바람으로 말려요' }, { e: '🐶', w: '보송보송해요' }, { e: '🦴', w: '간식을 줘요' }] },
  { k: 'day', t: '나의 하루', d: DECOY_FAR, steps: [{ e: '🌅', w: '해가 떠요' }, { e: '🍳', w: '아침밥' }, { e: '🏫', w: '학교에서 공부' }, { e: '🍱', w: '점심밥' }, { e: '🏠', w: '집에 와요' }, { e: '🍲', w: '저녁밥' }, { e: '🪥', w: '자기 전에 이 닦기' }, { e: '🛌', w: '잠을 자요' }] },
  { k: 'cookie', t: '쿠키 선물', steps: [{ e: '🛒', w: '재료 사 오기' }, { e: '🥚', w: '달걀 깨기' }, { e: '🥣', w: '반죽 섞기' }, { e: '⭐', w: '모양 찍기' }, { e: '♨️', w: '오븐에 굽기' }, { e: '🍪', w: '쿠키 완성' }, { e: '🎁', w: '예쁘게 포장하기' }, { e: '🤝', w: '친구에게 선물하기' }] }
];
/* 5단계 2·3칸·6단계~ 에 끼워 넣는 '이 순서에 없는 카드' — 순서와 상관없는 그림 */
var SEQ_DECOY = [{ e: '⚽', w: '공차기' }, { e: '🎈', w: '풍선' }, { e: '🧸', w: '곰인형' }, { e: '🚲', w: '자전거' }, { e: '🎨', w: '그림 그리기' }];
/* 4단계~ 판 짜기: n 칸 수 · d 끼어든 카드 수 · rev 거꾸로(마지막 장면부터).
   칸이 오르면 셋 가운데 한두 개가 다음 단계 짜임으로 (5단계 2·3칸 = 6단계 맛보기: 끼어든 카드) */
var SEQ_LV = { 4: { n: 5 }, 5: { n: 6 }, 6: { n: 6, d: 1 }, 7: { n: 7, d: 1 }, 8: { n: 8, d: 1 },
  9: { n: 7, d: 1, rev: true }, 10: { n: 8, d: 1, rev: true }, 11: { n: 8, d: 2, rev: true } };
var SEQ_N = { 5: SEQ5, 6: SEQ6, 7: SEQ7, 8: SEQ8 };

G.act({
  id: 'order', area: 'mind', title: '순서 맞추기', icon: '🔢', order: 30,
  desc: '무엇이 먼저일까요?',
  goal: '순서·인과 이해, 일상 절차(손 씻기·이 닦기) 익히기, "먼저-그다음" 말 이해',
  how: '"먼저 뭐 하지? 그다음은?" 하고 순서 말을 또박또박 써 주세요. 다 맞추면 실제로 손 씻기·이 닦기를 할 때 같은 말로 다시 해 보면 효과가 큽니다. 틀려도 괜찮아요 — 두 번째에는 정답 카드가 빛납니다. 4·5단계(도전·마스터)는 다섯 칸·여섯 칸으로 길어져요. 6~10단계는 순서에 없는 카드 가려내기, 일곱·여덟 칸 하루 일과와 이야기, 마지막 장면부터 거꾸로 놓기(⏪)로 이어져요.',
  levels: 10, needs: [], mins: 3,
  run: async function (ctx) {
    var lv = ctx.level;
    if (lv >= 4) { await longSeqs(ctx, lv); return; }
    var pool = D.SEQUENCES.filter(function (s) { return (s.lv || 1) <= lv; });
    var pick = G.sample(pool, 3);
    /* 칸이 오르면 한두 개는 다음 단계 묶음에서 뽑는다 (3단계는 가장 어려운 묶음에서). 첫 번째는 늘 지금 단계 */
    stepMix(ctx, pick.length).forEach(function (m, j) {
      if (!m) return;
      var more = D.SEQUENCES.filter(function (s) {
        var sl = s.lv || 1;
        return (lv < 3 ? sl <= lv + 1 : sl >= 3) && (pick.indexOf(s) < 0 || s === pick[j]);
      });
      if (more.length) pick[j] = G.pick(more);
    });
    for (var i = 0; i < pick.length; i++) {
      ctx.progress(i, pick.length);
      await oneSeq(ctx, pick[i], i === 0);
    }
    ctx.progress(pick.length, pick.length);
    ctx.finish();
  }
});

/* 4단계: 다섯 칸 셋 — 칸이 오르면 한두 개는 여섯 칸(5단계 맛보기).
   5단계: 여섯 칸 셋 — 칸이 오르면 한두 개에 '이 순서에 없는 카드'가 하나 섞인다(6단계 맛보기).
   6단계 여섯 칸+끼어든 카드 · 7단계 일곱 칸 · 8단계 여덟 칸 · 9단계 일곱 칸 거꾸로 · 10단계 여덟 칸 거꾸로 */
async function longSeqs(ctx, lv) {
  var mix = stepMix(ctx, 3), pick = [], cfg = [];
  mix.forEach(function (m) {
    var cf = SEQ_LV[m ? lv + 1 : lv];
    var src = SEQ_N[cf.n].filter(function (s) { return pick.every(function (p) { return p.k !== s.k; }); });
    pick.push(G.pick(src)); cfg.push(cf);
  });
  for (var i = 0; i < pick.length; i++) {
    ctx.progress(i, pick.length);
    var dec = cfg[i].d ? G.sample(pick[i].d || SEQ_DECOY, cfg[i].d) : null;
    await oneSeq(ctx, pick[i], i === 0, dec, cfg[i].rev);
  }
  ctx.progress(pick.length, pick.length);
  ctx.finish();
}

/* rev: 거꾸로 — 마지막 장면부터 첫 장면까지 놓는다 (되감기 ⏪) */
function oneSeq(ctx, seq, first, decoy, rev) {
  clear(ctx);
  var N = seq.steps.length, decs = decoy ? [].concat(decoy) : [];
  var steps = seq.steps.map(function (s, k) { return { e: s.e, w: s.w, k: k }; });
  ctx.body.classList.toggle('olong', N + decs.length >= 7);
  ctx.body.appendChild(G.el('<div class="otitle">' + G.esc(seq.t) + (rev ? ' ⏪' : '') + '</div>'));
  var slots = G.el('<div class="oslots' + (N >= 7 ? ' wrap4' : N >= 5 ? ' wrap' : '') + '" style="--n:' + N + '"></div>');
  var start = rev ? N - 1 : 0, dir = rev ? -1 : 1;
  var slotEls = steps.map(function (s, k) { var e = G.el('<div class="oslot' + (k === start ? ' now' + (rev ? ' rev' : '') : '') + '"><b>' + (k + 1) + '</b></div>'); slots.appendChild(e); return e; });
  ctx.body.appendChild(slots);
  var hid = decs.length ? ' 이 순서에 없는 카드도 ' + (decs.length > 1 ? '두 장' : '하나') + ' 숨어 있어!' : '';
  if (rev) ctx.say('거꾸로 놓기! 마지막 장면부터 골라 봐.' + hid);
  else ctx.say((first ? '순서대로 눌러 봐. ' : '') + G.josa(seq.t, '은', '는') + ' 무엇이 먼저일까?' + hid);
  var cards = G.shuffle(steps.concat(decs.map(function (d) { return { e: d.e, w: d.w, k: -1 }; })));
  return new Promise(function (resolve) {
    var next = start, done = 0, miss = 0, ch = null;
    ch = ctx.choices(cards, {
      cols: N >= 5 ? 3 : N > 3 ? 4 : N, size: 'md',
      onPick: function (it, el) {
        if (it.k < 0) {
          /* 순서에 없는 카드 — 흐리게 두고 다시 고르기 */
          miss++;
          if (miss === 1) ctx.trial(false);
          el.classList.add('dim'); el.disabled = true; G.ui.wiggle(el);
          var rt = ch.buttons.filter(function (b) { return b._item.k === next; })[0];
          if (miss >= 2) G.ui.hint(rt);
          ctx.say('이건 ' + seq.t + ' 순서에 없는 카드야. ' + (miss >= 2 ? '반짝이는 걸 눌러 봐.' : '다른 걸 골라 봐!'), { repeat: false });
          G.sfx.play('oops');
          return false;
        }
        if (it.k === next) {
          var lastOne = done === N - 1;
          if (!miss && !lastOne) ctx.trial(true);
          miss = 0;
          el.classList.add('gone'); el.disabled = true;
          var sl = slotEls[next];
          sl.classList.remove('now', 'rev'); sl.classList.add('fill');
          sl.insertAdjacentHTML('beforeend', '<span class="se">' + it.e + '</span><span class="sw">' + G.esc(it.w) + '</span>');
          G.sfx.play('pop');
          next += dir; done++;
          if (done < N) { slotEls[next].classList.add('now'); if (rev) slotEls[next].classList.add('rev'); ctx.say(it.w + '!', { repeat: false }); return false; }
          /* 다 놓았다 — 이야기로 다시 들려주기 (거꾸로 놓았어도 이야기는 처음부터) */
          var story = steps.map(function (s, k) { return ordWord(k, N) + ' ' + s.w; }).join(', ') + '!';
          ctx.cheer(rev ? '거꾸로도 척척 놓았어!' : '순서대로 잘 놓았어!').then(function () {
            slotEls.forEach(function (s) { s.classList.add('right'); });
            return ctx.say(story, { repeat: false });
          }).then(function () { return ctx.wait(500); }).then(resolve);
          return true;
        }
        miss++;
        if (miss === 1) ctx.trial(false);
        var right = ch.buttons.filter(function (b) { return b._item.k === next; })[0];
        if (miss >= 2) {
          G.sfx.play('oops'); G.ui.wiggle(el); G.ui.hint(right);
          if (rev) ctx.say((next === N - 1 ? '맨 마지막은 ' : next === 0 ? '제일 처음은 ' : '그 앞은 ') + steps[next].w + '! 반짝이는 걸 눌러 봐.', { repeat: false });
          else ctx.say((next === 0 ? '제일 먼저는 ' : next === N - 1 ? '마지막은 ' : '그다음은 ') + steps[next].w + '! 반짝이는 걸 눌러 봐.', { repeat: false });
        } else if (rev) {
          ctx.oops(next === N - 1 ? '음, 이게 맨 마지막 장면일까? 다시 골라 봐.' : '그 바로 앞에는 무슨 일이 있었을까? 다시 골라 봐.', el);
        } else {
          ctx.oops(next === 0 ? '음, 이게 제일 먼저일까? 다시 골라 봐.' : '그다음은 뭘까? 다시 골라 봐.', el);
        }
        return false;
      }
    });
  });
}

/* =================================================================
   4. 숫자 세기
   ================================================================= */
var COUNT_THINGS = ['🍎', '🍌', '🍓', '🐶', '🐱', '🐥', '⚽', '🎈', '⭐', '🌷', '🚗', '🐟', '🍪', '🧸', '🦆'];
function countWord(e) { var w = D.WORDS.filter(function (x) { return x.e === e; })[0]; return w ? w.w : '그림'; }
/* 세는 말 — 동물은 '마리' (6단계~ 새 문제에서) */
function unitOf(e) { return ['🐶', '🐱', '🐥', '🐟', '🦆'].indexOf(e) >= 0 ? '마리' : '개'; }
/* 6~10단계 — 단계마다 다섯 문제의 종류. 칸이 오르면 한두 문제가 다음 단계 대표 문제(COUNT_SIG)로.
   add 10까지 더하기 · sub 10까지 빼기 · add2/sub2 20까지(10 넘기) · skip 2·5·10씩 뛰어 세기 · money 100원·10원 동전 */
var COUNT_KINDS = {
  6: ['add', 'add', 'add', 'n', 'cmp'],
  7: ['sub', 'sub', 'sub', 'add', 'add'],
  8: ['add2', 'add2', 'sub2', 'sub2', 'add2'],
  9: ['skip', 'skip', 'skip', 'add2', 'sub2'],
  10: ['money', 'money', 'money', 'skip', 'sub2']
};
var COUNT_SIG = { 6: 'add', 7: 'sub', 8: 'add2', 9: 'skip', 10: 'money', 11: 'money2' };
/* 빼기 그림 — 무엇이 어떻게 사라지나 */
var SUB_THINGS = [{ e: '🍎', v: '개를 먹었어' }, { e: '🍪', v: '개를 먹었어' }, { e: '🍓', v: '개를 먹었어' }, { e: '🎈', v: '개가 하늘로 날아갔어' },
  { e: '🐥', v: '마리가 엄마한테 갔어' }, { e: '🦆', v: '마리가 헤엄쳐 갔어' }, { e: '🐟', v: '마리가 헤엄쳐 갔어' }];

G.act({
  id: 'count', area: 'mind', title: '숫자 세기', icon: '🍎', order: 40,
  desc: '하나씩 눌러서 세어요',
  goal: '일대일 대응(하나에 한 번씩 세기), 수 이름(하나·둘·셋), 마지막 수가 전체 개수라는 개념(기수)',
  how: '아이 손을 잡고 하나씩 짚으며 같이 "하나, 둘, 셋" 소리 내어 세어 주세요. 손으로 누르기 어려우면 "자비스가 세어 줄게" 단추를 눌러 보여 주세요. 3단계에는 "어느 쪽이 더 많아?" 문제가 섞입니다. 4·5단계(도전·마스터)는 열다섯·스물까지 세어요. 6~10단계는 그림을 보며 10까지·20까지 더하기와 빼기, 2·5·10씩 뛰어 세기, 100원·10원 동전 세기로 이어져요 — 그림을 하나씩 눌러 세어도 괜찮아요.',
  levels: 10, needs: [], mins: 3,
  run: async function (ctx) {
    /* 칸이 오르면 세는 수의 끝이 다음 단계 쪽으로 커진다 (1단계 3→4→4, 2단계 5→7→8, 10 까지).
       3단계는 끝이 10 그대로, 대신 아주 작은 수가 덜 나온다 (가장 작은 수 1→3→4).
       4단계 끝 15→17→18 (가장 작은 수 5→6→7), 5단계 끝 20 그대로 (가장 작은 수 8→10→12).
       5단계부터는 칸이 오르면 한두 문제가 다음 단계 문제(5단계 2·3칸 → 더하기) */
    var lv = ctx.level, st = G.clamp(ctx.step || 1, 1, 3), N = 5;
    var max = Math.min(lv >= 4 ? 20 : 10, ctx.tune([3, 5, 10, 15, 20, 20, 20, 20, 20, 20]));
    var LO = { 3: [1, 3, 4], 4: [5, 6, 7], 5: [8, 10, 12] }, lo = LO[lv] ? LO[lv][st - 1] : lv >= 6 ? 10 : 1;
    var kinds = lv >= 6 ? G.shuffle(COUNT_KINDS[lv]) : lv >= 3 ? G.shuffle(['n', 'n', 'n', 'cmp', 'cmp']) : ['n', 'n', 'n', 'n', 'n'];
    if (lv >= 5) stepMix(ctx, N).forEach(function (m, j) { if (m) kinds[j] = COUNT_SIG[lv + 1]; });
    var lastN = 0;
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      if (kinds[i] === 'cmp') { await compareItem(ctx, max); continue; }
      if (kinds[i] !== 'n') { await mathItem(ctx, kinds[i], i === 0); continue; }
      var n; do { n = lo + Math.floor(Math.random() * (max - lo + 1)); } while (n === lastN && max > lo);
      lastN = n;
      await countItem(ctx, n, max, i === 0);
    }
    ctx.progress(N, N);
    ctx.finish();
  }
});

async function countItem(ctx, n, max, first) {
  clear(ctx);
  var e = G.pick(COUNT_THINGS), w = countWord(e);
  var field = G.el('<div class="cfield' + (n > 6 ? ' small' : '') + '"></div>');
  var items = G.range(n).map(function () { var b = G.el('<button class="ci" type="button">' + e + '</button>'); field.appendChild(b); return b; });
  ctx.body.appendChild(field);
  var auto = G.el('<button class="btn sm soft mind-auto" type="button">🤖 자비스가 세어 줄게</button>');
  ctx.body.appendChild(auto);
  ctx.say(G.josa(w, '이', '가') + ' 몇 개일까? ' + (first ? '하나씩 눌러서 세어 보자!' : '하나씩 세어 보자!'));
  await new Promise(function (res) {
    var c = 0, autoOn = false;
    function tap(b) {
      if (b._done || !ctx.alive) return;
      b._done = true; c++;
      b.classList.add('counted');
      b.insertAdjacentHTML('beforeend', '<i>' + c + '</i>');
      G.sfx.play('pop'); G.buzz(10);
      ctx.say(NUM[c], { repeat: false, rate: 0.95 });
      if (c === n) { auto.remove(); ctx.wait(800).then(res); }
    }
    items.forEach(function (b) { b.addEventListener('click', function () { tap(b); }); });
    auto.addEventListener('click', function () {
      if (autoOn) return; autoOn = true; G.sfx.play('tap');
      var left = items.filter(function (b) { return !b._done; }), k = 0;
      function step() { if (!ctx.alive || k >= left.length) return; tap(left[k++]); ctx.timeout(step, 850); }
      step();
    });
  });
  ctx.say('모두 몇 개야?');
  var opts = [n], tries = 0;
  var want = ctx.level === 1 ? 2 : 3;   /* 고를 수는 단계마다 그대로 (1단계 둘, 2·3단계 셋) — 칸은 세는 수만 바꾼다 */
  while (opts.length < want && tries++ < 50) {
    var v = n + (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 2));
    if (v >= 1 && v <= Math.max(max, 3) && opts.indexOf(v) < 0) opts.push(v);
  }
  await pickItem(ctx, {
    items: G.shuffle(opts).map(function (v) { return { v: v }; }), cols: opts.length, size: 'md',
    render: function (it) { return '<span class="numc">' + it.v + '</span><span class="cl">' + NUM[it.v] + '</span>'; },
    isRight: function (it) { return it.v === n; },
    praise: '맞아! 모두 ' + NUM[n] + '!',
    answer: '모두 ' + NUM[n] + '! ' + G.josa(w, '이', '가') + ' ' + n + '개야.'
  });
}

async function compareItem(ctx, max) {
  clear(ctx);
  /* 비교하는 수: 3단계 8 까지, 4단계~ 12 까지 */
  var e = G.pick(COUNT_THINGS), a, b, top = Math.min(max, ctx.level >= 4 ? 12 : 8);
  do { a = 1 + Math.floor(Math.random() * top); b = 1 + Math.floor(Math.random() * top); } while (Math.abs(a - b) < 2);
  var big = Math.max(a, b);
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-num">⚖️</div></div>'));
  ctx.say('어느 쪽이 더 많을까?');
  await pickItem(ctx, {
    items: [{ n: a }, { n: b }], cols: 2, size: 'md',
    render: function (it) { return '<span class="grp">' + G.range(it.n).map(function () { return '<span>' + e + '</span>'; }).join('') + '</span>'; },
    isRight: function (it) { return it.n === big; },
    praise: function () { return '맞아! 이쪽이 더 많아. ' + big + '개야!'; },
    answer: '이쪽이 더 많아! ' + big + '개야.'
  });
}

function mathItem(ctx, kind, first) {
  if (kind === 'skip') return skipItem(ctx, first);
  if (kind === 'money' || kind === 'money2') return moneyItem(ctx, kind === 'money2', first);
  return addSubItem(ctx, kind, first);
}

/* 더하기·빼기 — 그림을 눌러 세어도 되고(모두 세기), 바로 골라도 된다 */
async function addSubItem(ctx, kind, first) {
  clear(ctx);
  var sub = kind === 'sub' || kind === 'sub2', big = kind === 'add2' || kind === 'sub2', a, b;
  if (!sub && !big) { do { a = ri(1, 7); b = ri(1, 6); } while (a + b < 4 || a + b > 10); }
  else if (!sub) { do { a = ri(3, 9); b = ri(3, 9); } while (a + b < 11 || a + b > 18); }   /* 10 을 넘는 더하기 */
  else if (!big) { a = ri(5, 10); b = ri(1, a - 1); }
  else { a = ri(11, 18); b = ri(a - 9, 9); }   /* 10 을 넘어 빼기 — 답은 2~9 */
  var n = sub ? a - b : a + b, th = sub ? G.pick(SUB_THINGS) : null, e = th ? th.e : G.pick(COUNT_THINGS), w = countWord(e), u = unitOf(e);
  var box = G.el('<div class="mind-box"><div class="mind-eq">' + a + (sub ? ' − ' : ' + ') + b + ' = ?</div></div>');
  var grps = G.el('<div class="cgrps"></div>'), all = [];
  function grp(k) {
    var g = G.el('<div class="cgrp" style="--c:' + Math.min(k, 5) + '"></div>');
    G.range(k).forEach(function () { var c = G.el('<button class="ci" type="button">' + e + '</button>'); g.appendChild(c); all.push(c); });
    grps.appendChild(g);
  }
  grp(a);
  if (!sub) { grps.appendChild(G.el('<b class="cplus">+</b>')); grp(b); }
  box.appendChild(grps);
  ctx.body.appendChild(box);
  /* 눌러 세기 — 남은 그림만 하나·둘·셋 */
  var c = 0;
  all.forEach(function (it) {
    it.addEventListener('click', function () {
      if (it._done || it.classList.contains('out') || !ctx.alive) return;
      it._done = true; c++; it.classList.add('counted'); it.insertAdjacentHTML('beforeend', '<i>' + c + '</i>');
      G.sfx.play('pop'); G.buzz(10); ctx.say(c <= 20 ? NUM[c] : String(c), { repeat: false, rate: 0.95 });
    });
  });
  var help = first ? ' 그림을 하나씩 눌러서 세어 봐도 좋아.' : '';
  if (sub) {
    await ctx.say(G.josa(w, '이', '가') + ' ' + a + u + ' 있었어.');
    all.slice(a - b).forEach(function (it, k) { ctx.timeout(function () { it.classList.add('out'); G.sfx.play('whoosh'); }, k * 180); });
    await ctx.wait(b * 180 + 350);
    ctx.say(b + th.v + '. 남은 건 몇 ' + u + '일까?' + help);
  } else ctx.say(w + ' ' + a + u + '하고 ' + b + u + '를 합치면 모두 몇 ' + u + '일까?' + help);
  var eq = a + (sub ? ' 빼기 ' : ' 더하기 ') + numJosa(b, '은', '는') + ' ' + n;
  await numPick(ctx, n, nearOpts(n, [-2, -1, 1, 2], sub ? 1 : 2, 20, 3), {
    praise: '맞아! ' + eq + '!',
    answer: (sub ? '남은 건 ' : '모두 ') + n + u + '야. ' + eq + '.'
  });
}

/* 뛰어 세기 — 묶음을 누를 때마다 2·4·6… / 5·10·15… / 10·20·30… */
async function skipItem(ctx, first) {
  clear(ctx);
  var s = G.pick([2, 5, 10]), g = s === 2 ? ri(3, 8) : s === 5 ? ri(2, 6) : ri(2, 5), n = s * g, e = G.pick(COUNT_THINGS), w = countWord(e), u = unitOf(e);
  var wrap = G.el('<div class="mind-box"></div>'), field = G.el('<div class="cfield skip"></div>');
  var boxes = G.range(g).map(function () { var b = G.el('<button class="cbox" type="button" style="--c:' + Math.min(s, 5) + '">' + G.range(s).map(function () { return '<span>' + e + '</span>'; }).join('') + '</button>'); field.appendChild(b); return b; });
  wrap.appendChild(field);
  var auto = G.el('<button class="btn sm soft mind-auto" type="button">🤖 자비스가 세어 줄게</button>');
  wrap.appendChild(auto);
  ctx.body.appendChild(wrap);
  var ex = [s, s * 2, s * 3].join(', ');
  ctx.say(G.josa(w, '이', '가') + ' ' + DET[s] + ' ' + u + '씩 묶여 있어. 묶음을 누르면서 ' + ex + ' 하고 뛰어 세어 보자!');
  await new Promise(function (res) {
    var c = 0, autoOn = false;
    function tap(b) {
      if (b._done || !ctx.alive) return;
      b._done = true; c += s;
      b.classList.add('counted'); b.insertAdjacentHTML('beforeend', '<i>' + c + '</i>');
      G.sfx.play('pop'); G.buzz(10); ctx.say(String(c), { repeat: false, rate: 0.95 });
      if (c === n) { auto.remove(); ctx.wait(800).then(res); }
    }
    boxes.forEach(function (b) { b.addEventListener('click', function () { tap(b); }); });
    auto.addEventListener('click', function () {
      if (autoOn) return; autoOn = true; G.sfx.play('tap');
      var left = boxes.filter(function (b) { return !b._done; }), k = 0;
      function step() { if (!ctx.alive || k >= left.length) return; tap(left[k++]); ctx.timeout(step, 900); }
      step();
    });
  });
  ctx.say('모두 몇 ' + u + '야?');
  var line = G.range(g).map(function (k) { return (k + 1) * s; }).join(', ');
  await numPick(ctx, n, nearOpts(n, [-s, s, s * 2, -s * 2], 1, 200, 3), {
    unit: u,
    praise: '맞아! ' + DET[s] + ' ' + u + '씩 ' + DET[g] + ' 묶음, 모두 ' + n + u + '!',
    answer: line + '! 모두 ' + n + u + '야.'
  });
}

/* 동전 세기 — 100원을 먼저, 그다음 10원. money2(10단계 2·3칸)는 동전이 많고 섞여 있다 */
async function moneyItem(ctx, more, first) {
  clear(ctx);
  var h = more ? ri(2, 5) : ri(1, 3), t = more ? ri(3, 8) : ri(1, 5), n = h * 100 + t * 10;
  var vals = G.range(h).map(function () { return 100; }).concat(G.range(t).map(function () { return 10; }));
  if (more) vals = G.shuffle(vals);
  var wrap = G.el('<div class="mind-box"><div class="mind-eq">0원</div></div>'), tot = wrap.firstChild;
  var field = G.el('<div class="cfield"></div>');
  var coins = vals.map(function (v) { var b = G.el('<button class="coin c' + v + '" type="button" aria-label="' + v + '원">' + v + '</button>'); b._v = v; field.appendChild(b); return b; });
  wrap.appendChild(field);
  var auto = G.el('<button class="btn sm soft mind-auto" type="button">🤖 자비스가 세어 줄게</button>');
  wrap.appendChild(auto);
  ctx.body.appendChild(wrap);
  ctx.say(more ? '동전이 섞여 있어. 100원짜리를 먼저 찾아서 누르고, 그다음 10원짜리를 눌러 세어 보자!' : (first ? '동전이 모두 얼마일까? 100원부터 하나씩 눌러서 세어 보자!' : '동전이 모두 얼마일까? 눌러서 세어 보자!'));
  await new Promise(function (res) {
    var c = 0, cnt = 0, autoOn = false;
    function tap(b) {
      if (b._done || !ctx.alive) return;
      b._done = true; c += b._v; cnt++;
      b.classList.add('counted'); b.insertAdjacentHTML('beforeend', '<i>' + c + '</i>');
      tot.textContent = c + '원';
      G.sfx.play('pop'); G.buzz(10); ctx.say(c + '원', { repeat: false, rate: 0.95 });
      if (cnt === coins.length) { auto.remove(); ctx.wait(900).then(res); }
    }
    coins.forEach(function (b) { b.addEventListener('click', function () { tap(b); }); });
    auto.addEventListener('click', function () {
      if (autoOn) return; autoOn = true; G.sfx.play('tap');
      var left = coins.filter(function (b) { return !b._done; }).sort(function (x, y) { return y._v - x._v; }), k = 0;
      function step() { if (!ctx.alive || k >= left.length) return; tap(left[k++]); ctx.timeout(step, 900); }
      step();
    });
  });
  ctx.say('모두 얼마야?');
  var opts = [n], swap = t * 100 + h * 10;
  if (swap !== n && t <= 9) opts.push(swap);
  nearOpts(n, [10, -10, 100, -100], 10, 990, 4).slice(1).forEach(function (v) { if (opts.length < 3 && opts.indexOf(v) < 0) opts.push(v); });
  await numPick(ctx, n, opts, {
    unit: '원',
    praise: '맞아! 모두 ' + n + '원!',
    answer: '100원이 ' + h + '개면 ' + h * 100 + '원, 10원이 ' + t + '개면 ' + t * 10 + '원. 모두 ' + n + '원이야.'
  });
}

/* =================================================================
   5. 모양과 색
   ================================================================= */
var SHAPE_COLORS = ['red', 'yellow', 'blue', 'green', 'orange', 'purple', 'pink'];
function colorsUsed() { return D.COLORS.filter(function (c) { return SHAPE_COLORS.indexOf(c.id) >= 0; }); }
function shapeSVG(s, hex, cls) { return '<svg class="' + (cls || 'shp') + '" viewBox="0 0 100 100" aria-hidden="true"><g fill="' + hex + '" stroke="rgba(0,0,0,.2)" stroke-width="3" stroke-linejoin="round">' + s.svg + '</g></svg>'; }
/* 7단계 입체 모양 (초등 1학년 '여러 가지 모양') — 그림 물건 + 성질 */
var SOLIDS = [
  { id: 'box', name: '상자 모양', tip: '평평한 면이 있어서 차곡차곡 잘 쌓여', w: [['📦', '상자'], ['🎁', '선물 상자'], ['🎲', '주사위'], ['🧊', '얼음'], ['🧱', '벽돌']],
    svg: '<g stroke="rgba(0,0,0,.25)" stroke-width="2.5" stroke-linejoin="round"><polygon points="50,12 88,30 50,48 12,30" fill="#90caf9"/><polygon points="12,30 50,48 50,90 12,72" fill="#42a5f5"/><polygon points="50,48 88,30 88,72 50,90" fill="#1e88e5"/></g>' },
  { id: 'can', name: '둥근기둥 모양', tip: '눕히면 데굴데굴 구르고, 세우면 쌓을 수 있어', w: [['🥫', '통조림'], ['🥁', '북'], ['🧻', '두루마리 휴지'], ['🕯️', '초'], ['🔋', '건전지']],
    svg: '<g stroke="rgba(0,0,0,.25)" stroke-width="2.5" stroke-linejoin="round"><path d="M22 26 V76 A28 10 0 0 0 78 76 V26 Z" fill="#66bb6a"/><ellipse cx="50" cy="26" rx="28" ry="10" fill="#a5d6a7"/></g>' },
  { id: 'ball', name: '공 모양', tip: '어느 쪽으로 굴려도 데굴데굴 잘 굴러가', w: [['⚽', '축구공'], ['🏀', '농구공'], ['🎾', '테니스공'], ['⚾', '야구공'], ['🌍', '지구']],
    svg: '<circle cx="50" cy="52" r="38" fill="#ffb300" stroke="rgba(0,0,0,.25)" stroke-width="2.5"/><ellipse cx="37" cy="38" rx="11" ry="7" fill="#fff" opacity=".55" transform="rotate(-30 37 38)"/>' }
];
function solidSVG(S) { return '<svg class="shp" viewBox="0 0 100 100" aria-hidden="true">' + S.svg + '</svg>'; }
/* 8·9단계 규칙 찾기 — 잘 구별되는 다섯 색 */
var PAT_COLORS = ['red', 'yellow', 'blue', 'green', 'purple'];
/* 10단계 돌린 모양 — 네 칸·다섯 칸 조각. 서로 뒤집은 모양(거울 모양)은 넣지 않았다 */
var POLY = {
  4: { L: [[0, 0], [0, 1], [0, 2], [1, 2]], T: [[0, 0], [1, 0], [2, 0], [1, 1]], S: [[1, 0], [2, 0], [0, 1], [1, 1]], I: [[0, 0], [0, 1], [0, 2], [0, 3]], O: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  5: { F: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]], L: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]], P: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]], N: [[1, 0], [1, 1], [0, 2], [1, 2], [0, 3]],
    T: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]], U: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]], V: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], W: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]], Y: [[1, 0], [0, 1], [1, 1], [1, 2], [1, 3]] }
};
var POLY_T = { 4: ['L', 'T', 'S'], 5: ['F', 'L', 'P', 'N', 'Y'] };   /* 정답 그림 — 돌리면 모습이 바뀌는 것만 */
/* 조각 그림 — 정사각형 틀 안 가운데, 돌림은 CSS 로 (맞히면 제자리로 돌아오는 것을 보여 준다) */
function polySVG(cells, hex, deg, cls) {
  var w = 0, h = 0; cells.forEach(function (c) { w = Math.max(w, c[0] + 1); h = Math.max(h, c[1] + 1); });
  var m = Math.max(w, h), ox = (m - w) * 10 + 4, oy = (m - h) * 10 + 4, side = m * 20 + 8;
  return '<svg class="' + (cls || 'shp') + ' poly" viewBox="0 0 ' + side + ' ' + side + '" style="transform:rotate(' + deg + 'deg)" aria-hidden="true"><g fill="' + hex + '" stroke="rgba(0,0,0,.28)" stroke-width="1.6">' +
    cells.map(function (c) { return '<rect x="' + (ox + c[0] * 20 + 1) + '" y="' + (oy + c[1] * 20 + 1) + '" width="18" height="18" rx="3"/>'; }).join('') + '</g></svg>';
}
function polyKey(cells, q) {
  var cs = cells.map(function (c) { var x = c[0], y = c[1]; for (var i = 0; i < q; i++) { var t = x; x = -y; y = t; } return [x, y]; });
  var mx = Math.min.apply(null, cs.map(function (c) { return c[0]; })), my = Math.min.apply(null, cs.map(function (c) { return c[1]; }));
  return cs.map(function (c) { return (c[0] - mx) + ',' + (c[1] - my); }).sort().join(' ');
}

G.act({
  id: 'shape', area: 'mind', title: '모양과 색', icon: '🔺', order: 50,
  desc: '동그라미·세모·빨강을 찾아요',
  goal: '모양·색 이름 이해(수용 언어), 두 가지 특징을 함께 보기(3단계 "파란 세모")',
  how: '집에 있는 물건으로도 이어서 해 보세요 — "동그란 거 찾아볼까? 접시!" 3단계 "파란 세모"는 색과 모양을 함께 기억해야 해서 어려워요. 처음엔 손가락으로 색부터 짚어 주세요. 4·5단계(도전·마스터)는 색이나 모양만 같은 헷갈리는 그림이 하나·둘 더 나와요. 6~10단계는 헷갈리는 그림 셋, 상자·둥근기둥·공 모양(입체), 규칙 찾기("빨강, 파랑, 빨강…" 소리 내어 읽기), 빙글 돌린 모양 찾기로 이어져요.',
  levels: 10, needs: [], mins: 2,
  run: async function (ctx) {
    var lv = ctx.level, N = 6, cols = colorsUsed(), shapes = D.SHAPES;
    /* 칸이 오르면 한두 문제는 다음 단계 문제로 — 3단계는 그 문제에 같은 색 다른 모양이 하나 더.
       3단계부터는 '파란 세모' 문제에 헷갈리는 그림(색만 같거나 모양만 같은 것)이 단계마다 하나씩 더:
       3단계 0 · 4단계 1 · 5단계 2 · 6단계 3 (칸이 오르면 다음 단계 수).
       7단계 입체 모양 · 8단계 규칙 찾기 · 9단계 어려운 규칙 · 10단계 돌린 모양(10단계 2·3칸은 다섯 칸 조각) */
    var LURE = [[2, 0], [0, 2], [3, 0]];   /* [모양, 색] 번호 — 같은 색 다른 모양, 같은 모양 다른 색, 같은 색 다른 모양 */
    var mix = stepMix(ctx, N);
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      var tl = mix[i] ? lv + 1 : lv, lures = Math.max(0, tl - 3);
      if (tl >= 7) { await shapeHard(ctx, tl, i === 0); continue; }
      var kind = tl === 1 ? 'shape' : tl === 2 ? (i % 2 ? 'color' : 'shape') : 'both';
      var items, target, name;
      if (kind === 'shape') {
        var col = G.pick(cols), ss = G.sample(shapes, tl === 1 ? 2 : 3);
        items = ss.map(function (s) { return { s: s, c: col }; });
        target = items[0]; name = target.s.name;
      } else if (kind === 'color') {
        var sh = G.pick(shapes), cc = G.sample(cols, 3);
        items = cc.map(function (c) { return { s: sh, c: c }; });
        target = items[0]; name = target.c.name;
      } else {
        var S = G.sample(shapes, lures >= 3 ? 4 : 3), C = G.sample(cols, 3);
        target = { s: S[0], c: C[0] };
        items = [target, { s: S[0], c: C[1] }, { s: S[1], c: C[0] }, { s: S[2], c: C[2] }];
        for (var q = 0; q < lures; q++) items.push({ s: S[LURE[q][0]], c: C[LURE[q][1]] });
        name = target.c.adj + ' ' + target.s.name;
      }
      ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-num">' + (kind === 'color' ? '🎨' : kind === 'shape' ? '🔷' : '🔍') + '</div></div>'));
      ctx.say(acc(name) + ' 찾아봐!');
      await pickItem(ctx, {
        items: G.shuffle(items), cols: items.length > 3 ? 4 : items.length, size: 'md', label: false,
        render: function (it) { return shapeSVG(it.s, it.c.hex); },
        isRight: function (it) { return it === target; },
        praise: function () { return '맞아! ' + name + '!'; },
        answer: '여기 있어! ' + name + '!'
      });
    }
    ctx.progress(N, N);
    ctx.finish();
  }
});

function shapeHard(ctx, tl, first) {
  if (tl === 7) return solidItem(ctx);
  if (tl <= 9) return patternItem(ctx, tl === 9, first);
  return turnItem(ctx, tl >= 11, first);
}

/* 입체 모양 — 반은 '공 모양을 찾아봐!'(모양 → 물건), 반은 '주사위는 어떤 모양?'(물건 → 모양) */
var lastSolid = null;
function solidItem(ctx) {
  var S = G.pick(SOLIDS.filter(function (x) { return x !== lastSolid; })), oth = G.shuffle(SOLIDS.filter(function (x) { return x !== S; }));
  lastSolid = S;
  function said(o) { return G.josa(o.w, '은', '는') + ' ' + S.name + '이야. ' + S.tip + '!'; }
  if (Math.random() < 0.5) {
    var r = G.pick(S.w), right = { e: r[0], w: r[1] };
    var wrong = G.sample(oth[0].w, 2).concat(G.sample(oth[1].w, 1)).map(function (x) { return { e: x[0], w: x[1] }; });
    ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-target">' + solidSVG(S) + '<small>' + S.name + '</small></div></div>'));
    ctx.say(acc(S.name) + ' 찾아봐!');
    return pickItem(ctx, {
      items: G.shuffle([right].concat(wrong)), cols: 4, size: 'md',
      isRight: function (it) { return it === right; },
      praise: function () { return '맞아! ' + said(right); },
      answer: '여기 있어! ' + said(right)
    });
  }
  var o = G.pick(S.w), obj = { e: o[0], w: o[1] };
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-target"><span class="tg">' + obj.e + '</span><small>' + G.esc(obj.w) + '</small></div></div>'));
  ctx.say(G.josa(obj.w, '은', '는') + ' 어떤 모양일까?');
  return pickItem(ctx, {
    items: G.shuffle(SOLIDS.slice()), cols: 3, size: 'md',
    render: function (it) { return solidSVG(it) + '<span class="cl">' + it.name + '</span>'; },
    isRight: function (it) { return it === S; },
    praise: function () { return '맞아! ' + said(obj); },
    answer: '여기 있어! ' + said(obj)
  });
}

/* 규칙 찾기 — 8단계: AB·AAB·ABB·ABC 다음에 올 것 (보기 셋).
   9단계: AABB, 모양과 색이 따로 바뀌는 규칙, 물음표가 가운데 있는 규칙 (보기 넷).
   줄은 규칙의 아무 자리에서나 시작한다 — 답이 늘 첫 그림과 같지 않게 */
function patternItem(ctx, hard, first) {
  var cs = colorsUsed().filter(function (c) { return PAT_COLORS.indexOf(c.id) >= 0; });
  var nm = function (x) { return x.c.adj + ' ' + x.s.name; };
  var type = hard ? G.pick(['aabb', 'two', 'mid']) : G.pick(['ab', 'aab', 'abb', 'abc']);
  var seq, q, ans, opts, rule;
  if (type === 'two') {
    /* 모양은 셋이 차례로, 색은 둘이 번갈아 */
    var o3 = ri(0, 2), o2 = ri(0, 1), S0 = G.sample(D.SHAPES, 3), C0 = G.sample(cs, 2);
    var S3 = G.range(3).map(function (j) { return S0[(j + o3) % 3]; }), C2 = G.range(2).map(function (j) { return C0[(j + o2) % 2]; });
    seq = G.range(8).map(function (j) { return { s: S3[j % 3], c: C2[j % 2] }; });
    q = 7; ans = seq[7];
    var oS = S3.filter(function (x) { return x !== ans.s; })[0], oC = C2.filter(function (x) { return x !== ans.c; })[0];
    opts = [ans, { s: ans.s, c: oC }, { s: oS, c: ans.c }, { s: oS, c: oC }];
    rule = '모양은 ' + S3.map(function (x) { return x.name; }).join(', ') + ' 차례로, 색은 ' + C2.map(function (x) { return x.name; }).join(', ') + ' 번갈아 나와!';
  } else {
    var base = type === 'mid' ? G.pick(['ab', 'aab', 'abc']) : type;
    var unit0 = { ab: [0, 1], aab: [0, 0, 1], abb: [0, 1, 1], abc: [0, 1, 2], aabb: [0, 0, 1, 1] }[base];
    var off = ri(0, unit0.length - 1), unit = unit0.slice(off).concat(unit0.slice(0, off));
    var k = Math.max.apply(null, unit) + 1, S = G.sample(D.SHAPES, k), C = G.sample(cs, k);
    var els = G.range(k).map(function (j) { return { s: S[j], c: C[j] }; });
    /* 그림 칸 수(물음표 포함): 규칙이 두 번은 다 보이게, 휴대폰 한 줄(여덟 칸) 안에서 */
    var T = type === 'mid' ? (base === 'ab' ? 8 : 6) : base === 'aabb' ? 8 : base === 'ab' ? ri(7, 8) : 7;
    seq = G.range(T).map(function (j) { return els[unit[j % unit.length]]; });
    q = type === 'mid' ? ri(unit.length, T - 2) : T - 1;
    ans = seq[q];
    opts = els.slice();
    var want = hard ? 4 : 3, tries = 0;
    while (opts.length < want && tries++ < 40) {
      var x = { s: G.pick(D.SHAPES), c: G.pick(cs) };
      if (opts.every(function (o) { return o.s !== x.s || o.c !== x.c; })) opts.push(x);
    }
    var un = unit.map(function (u) { return nm(els[u]); }), last = un[un.length - 1];
    rule = un.join(', ') + G.josa(last, '이', '가').slice(last.length) + ' 계속 되풀이돼!';
  }
  var row = G.el('<div class="patrow"></div>'), qEl = null;
  seq.forEach(function (x, j) {
    if (j === q) { qEl = G.el('<span class="pq">?</span>'); row.appendChild(qEl); }
    else row.insertAdjacentHTML('beforeend', shapeSVG(x.s, x.c.hex, 'pat'));
  });
  var head = G.el('<div class="mind-q"><div class="mind-rule">🔁 규칙 찾기</div></div>');
  head.appendChild(row);
  ctx.body.appendChild(head);
  ctx.say(first ? '규칙을 찾아봐! 물음표에는 무엇이 올까?' : '물음표에는 무엇이 올까?');
  return pickItem(ctx, {
    items: G.shuffle(opts), cols: opts.length > 3 ? 4 : opts.length, size: 'md', label: false,
    render: function (it) { return shapeSVG(it.s, it.c.hex); },
    isRight: function (it) { return it === ans; },
    praise: function () { return '맞아! ' + nm(ans) + '!'; },
    after: function () { qEl.classList.add('fill'); qEl.textContent = ''; qEl.insertAdjacentHTML('beforeend', shapeSVG(ans.s, ans.c.hex, 'pat')); return ctx.say(rule, { repeat: false }); },
    answer: '여기 있어! ' + rule + ' 그래서 ' + nm(ans) + '!'
  });
}

/* 돌린 모양 찾기 — 보기 넷 가운데 위 조각을 빙글 돌린 것 하나. 맞히면 그 그림이 제자리로 돌아와 똑같아지는 걸 보여 준다 */
function turnItem(ctx, five, first) {
  var P = POLY[five ? 5 : 4], id = G.pick(POLY_T[five ? 5 : 4]), col = G.pick(colorsUsed());
  var k0 = polyKey(P[id], 0), qs = [1, 2, 3].filter(function (q) { return polyKey(P[id], q) !== k0; });
  var right = { id: id, deg: G.pick(qs) * 90 };
  var items = [right].concat(G.sample(Object.keys(P).filter(function (x) { return x !== id; }), 3).map(function (x) { return { id: x, deg: G.pick([0, 90, 180, 270]) }; }));
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-target">' + polySVG(P[id], col.hex, 0) + '<small>빙글 돌려도 같은 모양!</small></div></div>'));
  ctx.say(first ? '위 조각을 빙글 돌린 그림을 찾아봐! 뒤집지 않고 돌리기만 했어.' : '빙글 돌려도 같은 모양은 어느 거야?');
  return pickItem(ctx, {
    items: G.shuffle(items), cols: 4, size: 'md', label: false,
    render: function (it) { return polySVG(P[it.id], col.hex, it.deg); },
    isRight: function (it) { return it === right; },
    praise: '맞아! 빙글 돌리면 똑같아!',
    after: function (it, el) { var sv = el && el.querySelector('svg'); if (sv) sv.style.transform = 'rotate(0deg)'; return ctx.wait(1000); },
    answer: '이거야! 돌려 보면 똑같은 모양이야.'
  });
}

/* =================================================================
   6. 다른 하나 찾기 (분류)
   ================================================================= */
var CAT_IS = { food: '먹는 거야', animal: '동물이야', vehicle: '타는 거야', body: '우리 몸이야', home: '집에서 쓰는 물건이야',
  clothes: '몸에 걸치는 옷이나 신발이야', nature: '자연에 있는 거야', people: '사람이야' };
var CAT_NOT = { food: '먹을 수 없어', animal: '동물이 아니야', vehicle: '탈 수 없어', body: '우리 몸이 아니야', home: '집에서 쓰는 물건이 아니야',
  clothes: '옷이 아니야', nature: '자연에 있는 게 아니야', people: '사람이 아니야' };
var FAR = { food: ['vehicle', 'clothes', 'body'], animal: ['vehicle', 'home', 'clothes'], vehicle: ['food', 'animal', 'body'] };
var NEAR = { food: ['nature'], vehicle: ['home'], clothes: ['home', 'body'], home: ['clothes'], nature: ['food'], body: ['clothes'], animal: ['nature'] };
var CAT_ALL = ['food', 'animal', 'vehicle', 'body', 'home', 'clothes', 'nature', 'people'];
/* 4·5단계 — 더 촘촘한 무리. is/not 은 자비스가 이유를 말할 때 ("당근은 과일이 아니야. 채소야!") */
var FINE = {
  fruit: { is: '과일이야', not: '과일이 아니야', w: [['🍎', '사과'], ['🍌', '바나나'], ['🍓', '딸기'], ['🍇', '포도'], ['🍉', '수박'], ['🍊', '귤'], ['🍑', '복숭아'], ['🍒', '체리'], ['🍍', '파인애플'], ['🥝', '키위']] },
  veg: { is: '채소야', not: '채소가 아니야', w: [['🥕', '당근'], ['🥦', '브로콜리'], ['🥒', '오이'], ['🍆', '가지'], ['🥔', '감자'], ['🌶️', '고추']] },
  car: { is: '땅 위를 달리는 탈것이야', not: '땅 위를 달리지 않아', w: [['🚗', '자동차'], ['🚌', '버스'], ['🚂', '기차'], ['🚲', '자전거'], ['🚒', '소방차'], ['🚚', '트럭'], ['🚕', '택시']] },
  sky: { is: '하늘을 나는 탈것이야', not: '하늘을 날지 않아', w: [['✈️', '비행기'], ['🚁', '헬리콥터'], ['🚀', '로켓'], ['🛩️', '작은 비행기']] },
  boat: { is: '물 위로 다니는 탈것이야', not: '물 위로 다니지 않아', w: [['⛵', '돛단배'], ['🚤', '보트'], ['🛳️', '유람선'], ['⛴️', '여객선'], ['🛶', '카누']] },
  sea: { is: '바다에 사는 동물이야', not: '바다에 살지 않아', w: [['🐟', '물고기'], ['🐙', '문어'], ['🐬', '돌고래'], ['🐳', '고래'], ['🐠', '열대어'], ['🦑', '오징어']] },
  land: { is: '땅 위에 사는 동물이야', not: '땅 위에 살지 않아', w: [['🐶', '강아지'], ['🐱', '고양이'], ['🐰', '토끼'], ['🐻', '곰'], ['🦁', '사자'], ['🐘', '코끼리'], ['🐴', '말'], ['🐷', '돼지']] },
  kitchen: { is: '부엌에서 쓰는 물건이야', not: '부엌에서 쓰는 물건이 아니야', w: [['🥄', '숟가락'], ['🥢', '젓가락'], ['🍳', '프라이팬'], ['🥣', '그릇']] },
  bath: { is: '욕실에서 쓰는 물건이야', not: '욕실에서 쓰는 물건이 아니야', w: [['🪥', '칫솔'], ['🧼', '비누'], ['🛁', '욕조'], ['🚿', '샤워기'], ['🧴', '로션']] },
  school: { is: '공부할 때 쓰는 학용품이야', not: '학용품이 아니야', w: [['✏️', '연필'], ['🖊️', '볼펜'], ['✂️', '가위'], ['📒', '공책'], ['🖍️', '크레파스'], ['📐', '삼각자']] },
  toy: { is: '가지고 노는 장난감이야', not: '장난감이 아니야', w: [['🧸', '곰인형'], ['🪀', '요요'], ['🪁', '연'], ['🧩', '퍼즐'], ['🎮', '게임기']] },
  wear: { is: '몸에 입는 옷이야', not: '몸에 입는 옷이 아니야', w: [['👕', '티셔츠'], ['👖', '바지'], ['👗', '원피스'], ['🧥', '외투'], ['👔', '셔츠']] },
  shoes: { is: '발에 신는 신발이야', not: '신발이 아니야', w: [['👟', '운동화'], ['👞', '구두'], ['👢', '장화'], ['🥾', '등산화'], ['👡', '샌들']] },
  bird: { is: '새야', not: '새가 아니야', w: [['🐦', '작은 새'], ['🦉', '부엉이'], ['🦆', '오리'], ['🐧', '펭귄'], ['🐔', '닭'], ['🦅', '독수리'], ['🦜', '앵무새']] },
  bug: { is: '곤충이야', not: '곤충이 아니야', w: [['🐝', '벌'], ['🦋', '나비'], ['🐞', '무당벌레'], ['🐜', '개미'], ['🦗', '귀뚜라미']] },
  summer: { is: '더운 여름에 어울리는 거야', not: '여름에 어울리는 게 아니야', w: [['🍉', '수박'], ['🍦', '아이스크림'], ['🕶️', '선글라스'], ['🌻', '해바라기'], ['🏖️', '해수욕장'], ['🩳', '반바지']] },
  winter: { is: '추운 겨울에 어울리는 거야', not: '겨울에 어울리는 게 아니야', w: [['⛄', '눈사람'], ['🧣', '목도리'], ['🧤', '장갑'], ['🎿', '스키'], ['🧥', '외투'], ['❄️', '눈송이']] },
  redfruit: { is: '과일이야', not: '과일이 아니야', w: [['🍎', '사과'], ['🍓', '딸기'], ['🍒', '체리'], ['🍉', '수박']] },
  redveg: { is: '채소야', not: '채소가 아니야', w: [['🌶️', '고추'], ['🥕', '당근']] }
};
/* [모아 놓은 무리, 다른 하나] — 4단계: 촘촘한 이웃 무리, 5단계: 더 닮은 무리(날개가 있어도 새·곤충, 빨간 과일 속 빨간 채소) */
var FINE_PAIRS = {
  4: [['fruit', 'veg'], ['veg', 'fruit'], ['car', 'sky'], ['sky', 'car'], ['sea', 'land'], ['land', 'sea'], ['kitchen', 'bath'], ['bath', 'kitchen'], ['school', 'toy'], ['toy', 'school'], ['wear', 'shoes'], ['shoes', 'wear']],
  5: [['bird', 'bug'], ['bug', 'bird'], ['sky', 'boat'], ['boat', 'sky'], ['summer', 'winter'], ['winter', 'summer'], ['redfruit', 'redveg']]
};
function buildFine(lv, more) {
  var pr = G.pick(FINE_PAIRS[lv >= 5 ? 5 : 4]), B = FINE[pr[0]], O = FINE[pr[1]], n = 3 + (more ? 1 : 0);
  var items = G.sample(B.w, Math.min(n, B.w.length)).map(function (x) { return { e: x[0], w: x[1] }; });
  var o = G.pick(O.w.filter(function (x) { return items.every(function (it) { return it.e !== x[0]; }); }));
  var odd = { e: o[0], w: o[1] };
  return { odd: odd, items: items.concat([odd]), why: G.josa(odd.w, '은', '는') + ' ' + B.not + '. ' + O.is + '!' };
}
/* 7단계~ — 색과 종류가 엇갈리는 그림 [그림, 이름, 색, 종류]. 색은 어느 기기에서나 같게 보이는 빨강·노랑·초록만.
   plant 는 '꽃이나 나무' — 채소·과일도 식물이라 '식물'이라고 하면 이유가 헷갈린다. 사람이 먹기도 하는 동물(게 등)은 뺐다 */
var TINT = [
  ['🍎', '사과', 'red', 'food'], ['🍓', '딸기', 'red', 'food'], ['🍒', '체리', 'red', 'food'], ['🍅', '토마토', 'red', 'food'], ['🌶️', '고추', 'red', 'food'],
  ['🚒', '소방차', 'red', 'vehicle'], ['🐞', '무당벌레', 'red', 'animal'], ['🌹', '장미', 'red', 'plant'],
  ['🍌', '바나나', 'yellow', 'food'], ['🌽', '옥수수', 'yellow', 'food'], ['🍋', '레몬', 'yellow', 'food'], ['🧀', '치즈', 'yellow', 'food'],
  ['🐥', '병아리', 'yellow', 'animal'], ['🚕', '택시', 'yellow', 'vehicle'], ['🌻', '해바라기', 'yellow', 'plant'], ['🌼', '들꽃', 'yellow', 'plant'],
  ['🥦', '브로콜리', 'green', 'food'], ['🥒', '오이', 'green', 'food'], ['🍏', '초록 사과', 'green', 'food'], ['🥬', '배추', 'green', 'food'],
  ['🐸', '개구리', 'green', 'animal'], ['🐢', '거북', 'green', 'animal'], ['🌲', '소나무', 'green', 'plant'], ['🌳', '나무', 'green', 'plant'], ['🌴', '야자나무', 'green', 'plant']
];
var HUE = { red: '빨간색', yellow: '노란색', green: '초록색' };
var KIND = {
  food: { is: '먹는 거야', not: '먹는 게 아니야', why: '먹는 거라서' },
  animal: { is: '동물이야', not: '동물이 아니야', why: '동물이라서' },
  vehicle: { is: '타는 거야', not: '타는 게 아니야', why: '타는 거라서' },
  plant: { is: '꽃이나 나무야', not: '꽃이나 나무가 아니야', why: '꽃이나 나무라서' }
};
function tint(h, k) { return TINT.filter(function (t) { return t[2] === h && t[3] === k; }).map(function (t) { return { e: t[0], w: t[1], h: t[2], k: t[3] }; }); }
/* 규칙 놀이 그림 넷 — (P,X) 둘 · (Q,X) 하나(종류가 다름) · (P,Y) 하나(색이 다름). 규칙에 따라 답이 바뀐다 */
function buildRule() {
  var H = Object.keys(HUE), K = Object.keys(KIND);
  for (var t = 0; t < 80; t++) {
    var X = G.pick(H), Y = G.pick(H.filter(function (h) { return h !== X; })), P = G.pick(K), Q = G.pick(K.filter(function (k) { return k !== P; }));
    var px = tint(X, P), qx = tint(X, Q), py = tint(Y, P);
    if (px.length >= 2 && qx.length && py.length) {
      var kOdd = G.pick(qx), hOdd = G.pick(py);
      return { items: G.sample(px, 2).concat([kOdd, hOdd]), kOdd: kOdd, hOdd: hOdd, X: X, P: P };
    }
  }
  return null;
}
/* 이유 고르기 그림 — 한 가지만 다른 그림(색이 다르거나 종류가 다르거나) + 맞는 이유 · 틀린 이유들 */
function buildWhy(nBase) {
  var H = Object.keys(HUE), K = Object.keys(KIND);
  for (var t = 0; t < 120; t++) {
    var byHue = Math.random() < 0.5, X = G.pick(H), P = G.pick(K), px = tint(X, P);
    if (px.length < nBase) continue;
    var cand = byHue ? [].concat.apply([], H.filter(function (h) { return h !== X; }).map(function (h) { return tint(h, P); }))
      : [].concat.apply([], K.filter(function (k) { return k !== P; }).map(function (k) { return tint(X, k); }));
    if (!cand.length) continue;
    var odd = G.pick(cand);
    return {
      items: G.sample(px, nBase).concat([odd]), odd: odd,
      right: byHue ? HUE[odd.h] + '이라서' : KIND[odd.k].why,
      wrongs: [byHue ? KIND[G.pick(K.filter(function (k) { return k !== P; }))].why : HUE[G.pick(H.filter(function (h) { return h !== X; }))] + '이라서',
        byHue ? HUE[X] + '이라서' : KIND[P].why],
      say: byHue ? odd.w + '만 ' + HUE[odd.h] + '이야. 나머지는 모두 ' + HUE[X] + '이야!' : G.josa(odd.w, '은', '는') + ' ' + KIND[P].not + '. ' + KIND[odd.k].is + '!'
    };
  }
  return null;
}

G.act({
  id: 'odd', area: 'mind', title: '다른 하나 찾기', icon: '🙃', order: 60,
  desc: '하나만 달라요! 어떤 걸까?',
  goal: '범주화(먹는 것·동물·탈것), 같고 다름 비교, "왜냐하면" 설명 이해',
  how: '답을 맞히면 "왜 달라?" 하고 한 번 물어봐 주세요. 말로 못 해도 괜찮아요 — 자비스가 이유를 말해 줍니다. 장 볼 때 "먹는 거? 아니면 쓰는 거?" 하고 물건을 나눠 보면 좋아요. 4·5단계(도전·마스터)는 과일·채소, 새·곤충처럼 더 촘촘한 무리로 나눠요. 6~10단계는 그림이 다섯으로 늘고, "색으로!" "종류로!" 규칙을 바꿔 가며 찾은 뒤, 왜 다른지 이유(노란색이라서·타는 거라서)도 골라요.',
  levels: 10, needs: [], mins: 2,
  run: async function (ctx) {
    var lv = ctx.level, N = lv === 8 ? 6 : 5;
    /* 칸이 오르면 한두 문제는 다음 단계 문제로 — 3단계는 그 문제에 같은 무리 그림이 하나 더.
       4단계 2·3칸은 5단계 무리 맛보기, 5단계 2·3칸은 같은 무리 그림이 하나 더(= 6단계).
       7단계 규칙 듣고 찾기(색·종류) · 8단계 같은 그림에서 규칙 바꾸기 · 9단계 이유 고르기(둘 중) · 10단계 그림 다섯·이유 셋 중 */
    var mix = stepMix(ctx, N), prev = null;
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      var tl = mix[i] ? (lv === 3 ? 3 : lv + 1) : lv;
      if (tl >= 9) { await whyOdd(ctx, tl, i === 0); prev = null; continue; }
      if (tl >= 7) {
        /* 8단계: 바로 앞 문제의 그림 그대로, 규칙만 바꿔서 한 번 더 */
        var again = !!(tl === 8 && prev && !prev.again);
        var set = again ? prev.set : buildRule(), rule = prev ? (prev.rule === 'hue' ? 'kind' : 'hue') : G.pick(['hue', 'kind']);
        await ruleOdd(ctx, set, rule, again);
        prev = { set: set, rule: rule, again: again };
        continue;
      }
      var set5 = buildOdd(Math.min(5, tl), ((lv === 3 || lv >= 5) && mix[i]) || tl === 6);
      ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-num">🤔</div></div>'));
      ctx.say(i === 0 ? '하나만 달라! 다른 하나는 뭘까?' : '다른 하나는 뭘까?');
      var why = set5.why || G.josa(set5.odd.w, '은', '는') + ' ' + CAT_NOT[set5.base] + '. ' + CAT_IS[set5.odd.c] + '!';
      await pickItem(ctx, {
        items: G.shuffle(set5.items), cols: set5.items.length > 3 ? 4 : 3, size: set5.items.length > 3 ? 'md' : 'lg',
        isRight: function (it) { return it === set5.odd; },
        praise: '맞아!',
        after: function () { return ctx.say(why, { repeat: false }); },
        answer: '이게 달라! ' + why
      });
    }
    ctx.progress(N, N);
    ctx.finish();
  }
});

function buildOdd(lv, more) {
  if (lv >= 4) return buildFine(lv, more);
  var maxLv = lv === 1 ? 2 : 3, base, oddCat, nBase = (lv === 3 ? 3 : 2) + (more ? 1 : 0);
  for (var tries = 0; tries < 30; tries++) {
    if (lv === 1) { base = G.pick(Object.keys(FAR)); oddCat = G.pick(FAR[base]); }
    else if (lv === 3) { base = G.pick(Object.keys(NEAR)); oddCat = G.pick(NEAR[base]); }
    else { base = G.pick(['food', 'animal', 'vehicle', 'clothes', 'home', 'nature']); oddCat = G.pick(CAT_ALL.filter(function (c) { return c !== base && (NEAR[base] || []).indexOf(c) < 0; })); }
    var bw = wordPool(maxLv, [base]), ow = wordPool(maxLv, [oddCat]);
    if (bw.length >= nBase && ow.length) {
      var items = G.sample(bw, nBase), odd = G.pick(ow.filter(function (w) { return items.every(function (x) { return x.e !== w.e; }); }));
      if (odd) return { base: base, odd: odd, items: items.concat([odd]) };
    }
  }
  var f = wordPool(3, ['food']), v = wordPool(3, ['vehicle']);
  return { base: 'food', odd: v[0], items: [f[0], f[1], v[0]] };
}

/* 규칙 듣고 찾기 — 같은 그림이라도 '색으로'면 바나나, '종류로'면 소방차.
   헷갈리는 쪽(다른 규칙의 답)을 고르면 그 까닭을 짚어 준다 */
function ruleOdd(ctx, set, rule, again) {
  var hue = rule === 'hue', odd = hue ? set.hOdd : set.kOdd, lure = hue ? set.kOdd : set.hOdd;
  var why = hue ? odd.w + '만 ' + HUE[odd.h] + '이야. 나머지는 모두 ' + HUE[set.X] + '이야!' : G.josa(odd.w, '은', '는') + ' ' + KIND[set.P].not + '. ' + KIND[odd.k].is + '!';
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-num">' + (hue ? '🎨' : '🗂️') + '</div><div class="mind-rule">' + (hue ? '색이 다른 하나!' : '종류가 다른 하나!') + '</div></div>'));
  ctx.say((again ? '같은 그림이야. 이번엔 규칙이 바뀌었어! ' : '') + (hue ? '이번엔 색으로! 색이 다른 하나는 뭘까?' : '이번엔 종류로! 종류가 다른 하나는 뭘까?'));
  return pickItem(ctx, {
    items: G.shuffle(set.items), cols: 4, size: 'md',
    isRight: function (it) { return it === odd; },
    praise: '맞아!',
    after: function () { return ctx.say(why, { repeat: false }); },
    missSay: function (it) { return it === lure ? (hue ? it.w + '도 ' + HUE[set.X] + '이야. 색이 다른 걸 찾아봐!' : it.w + '도 ' + KIND[set.P].is + '. 종류가 다른 걸 찾아봐!') : null; },
    answer: '이게 달라! ' + why
  });
}

/* 다른 하나 찾고 이유 고르기 — 9단계: 그림 넷·이유 둘 중, 10단계: 그림 다섯·이유 셋 중 (2·3칸은 그림 여섯) */
async function whyOdd(ctx, tl, first) {
  var set = buildWhy(tl >= 11 ? 5 : tl >= 10 ? 4 : 3);
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-num">🤔</div></div>'));
  ctx.say(first ? '하나만 달라! 다른 하나를 찾고, 왜 다른지도 골라 봐.' : '다른 하나는 뭘까?');
  await pickItem(ctx, {
    items: G.shuffle(set.items), cols: 4, size: 'md',
    isRight: function (it) { return it === set.odd; },
    praise: '맞아! 이게 달라.',
    answer: '이게 달라! ' + G.josa(set.odd.w, '이야', '야') + '.'
  });
  clear(ctx);
  var rest = set.items.filter(function (it) { return it !== set.odd; });
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-target"><span class="tg">' + set.odd.e + '</span><small>' + G.esc(set.odd.w) + '</small></div><div class="orest">' + rest.map(function (it) { return '<span>' + it.e + '</span>'; }).join('') + '</div></div>'));
  var opts = G.shuffle([set.right].concat(set.wrongs.slice(0, tl >= 10 ? 2 : 1)));
  ctx.say(G.josa(set.odd.w, '은', '는') + ' 왜 다를까? ' + opts.join('? ') + '?');
  await pickItem(ctx, {
    items: opts.map(function (t) { return { t: t }; }), cols: 1, size: 'md',
    render: function (it) { return '<span class="why">' + G.esc(it.t) + '</span>'; },
    isRight: function (it) { return it.t === set.right; },
    praise: '맞아!',
    after: function () { return ctx.say(set.say, { repeat: false }); },
    answer: '이거야! ' + set.say
  });
}

/* =================================================================
   7. 크다 작다 (개념: 크기·길이·양)
   ================================================================= */
var BIG_THINGS = ['🐻', '🐶', '🐱', '🐘', '⚽', '🎈', '🍎', '🌳', '🚗', '⭐', '🐸', '🐟'];
var SZ = { big: 'clamp(84px,24vw,160px)', mid: 'clamp(54px,15vw,100px)', small: 'clamp(30px,8.5vw,58px)' };
/* 6~10단계 — 단계마다 여섯 문제의 종류. 칸이 오르면 한두 문제가 다음 단계 대표 문제(BIG_SIG)로.
   ser 차례로 놓기 · heavy 시소(무게) · cup 물컵(들이) · more 몇 개 더 많은지 · ruler0 자로 재기(0부터) · ruler 자로 재기(0이 아닌 데서부터) */
var BIG_KINDS = {
  6: ['bs', 'three', 'long', 'long', 'many', 'many'],
  7: ['ser', 'ser', 'ser', 'three', 'long', 'many'],
  8: ['heavy', 'heavy', 'cup', 'cup', 'ser', 'ser'],
  9: ['more', 'more', 'more', 'heavy', 'cup', 'ser'],
  10: ['ruler0', 'ruler', 'ruler', 'more', 'more', 'ser']
};
var BIG_SIG = { 7: 'ser', 8: 'heavy', 9: 'more', 10: 'ruler0', 11: 'ruler' };
var SEESAW = ['🐶', '🐱', '🐰', '🐷', '🐵', '🦊', '🐼', '🐨'];
var SEESAW_W = { '🐶': '강아지', '🐱': '고양이', '🐰': '토끼', '🐷': '돼지', '🐵': '원숭이', '🦊': '여우', '🐼': '판다', '🐨': '코알라' };
var SER_SZ = {
  4: ['clamp(28px,7.6vw,50px)', 'clamp(44px,12vw,78px)', 'clamp(62px,16.5vw,106px)', 'clamp(82px,22vw,140px)'],
  5: ['clamp(24px,6.5vw,42px)', 'clamp(36px,9.8vw,62px)', 'clamp(50px,13.4vw,84px)', 'clamp(64px,17.2vw,108px)', 'clamp(80px,21.5vw,134px)']
};

G.act({
  id: 'big', area: 'mind', title: '크다 작다', icon: '🐘', order: 70,
  desc: '큰 것, 작은 것을 찾아요',
  goal: '크기·길이·양 개념어(크다/작다, 길다/짧다, 많다/적다) 이해와 비교',
  how: '찾고 나면 손을 크게 벌리며 "커~다란 곰!", 작게 오므리며 "쪼끄만 곰!" 하고 몸짓을 함께 해 주세요. 간식 시간에 "많이 줄까, 조금 줄까?" 하고 같은 말을 써 보면 개념이 단단해집니다. 4·5단계(도전·마스터)는 길이·양의 차이가 점점 작아져 더 꼼꼼히 비교해요. 6~10단계는 셋 중 "가장", 작은 것부터 차례로 놓기, 시소(무게)·물컵(들이), 몇 개 더 많은지, 자로 길이(cm) 재기로 이어져요.',
  levels: 10, needs: [], mins: 2,
  run: async function (ctx) {
    var lv = ctx.level, N = 6;
    if (lv >= 6) { await bigHigh(ctx, lv); return; }
    var kinds = lv === 1 ? ['bs', 'bs', 'bs', 'bs', 'bs', 'bs'] : lv === 2 ? G.shuffle(['bs', 'bs', 'bs', 'three', 'three', 'three'])
      : G.shuffle(['bs', 'three', 'long', 'long', 'many', 'many']);
    /* 칸이 오르면 한두 문제는 다음 단계 문제로 (1단계 → 셋 중에서, 2단계 → 길다·많다).
       3단계는 길이·양 문제 한두 개가 조금 더 비슷해진다.
       비슷한 정도(close): 0 보통 · 1 비슷(기차 2칸·과자 3개 차이) · 2 아주 비슷(1칸·2개) · 3 아주 비슷한 것 셋 중에서.
       4단계는 길이·양 문제가 모두 1, 칸이 오르면 한두 개가 2 / 5단계는 모두 2, 칸이 오르면 한두 개가 3(= 6단계) */
    var close = {}, cBase = lv >= 5 ? 2 : lv === 4 ? 1 : 0;
    if (lv < 3) stepMix(ctx, N).forEach(function (m, j) { if (m) kinds[j] = lv === 1 ? 'three' : G.pick(['long', 'many']); });
    else {
      var lm = G.range(N).filter(function (j) { return kinds[j] === 'long' || kinds[j] === 'many'; });
      lm.forEach(function (j) { close[j] = cBase; });
      G.sample(lm, Math.max(0, (ctx.step || 1) - 1)).forEach(function (j) { close[j] = cBase + 1; });
    }
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      await bigItem(ctx, kinds[i], close[i] || 0);
    }
    ctx.progress(N, N);
    ctx.finish();
  }
});

/* 6단계 길이·양은 모두 셋 중 '가장' · 7단계 차례로 넷 · 8단계 시소·물컵 · 9단계 몇 개 더 많은지(차례로 다섯) · 10단계 자로 재기 */
async function bigHigh(ctx, lv) {
  var N = 6, kinds = G.shuffle(BIG_KINDS[lv]);
  stepMix(ctx, N).forEach(function (m, j) { if (m) kinds[j] = BIG_SIG[lv + 1] === 'heavy' ? (j % 2 ? 'cup' : 'heavy') : BIG_SIG[lv + 1]; });
  for (var i = 0; i < N; i++) {
    ctx.progress(i, N);
    clear(ctx);
    var k = kinds[i];
    if (k === 'ser') await serItem(ctx, lv >= 9 ? 5 : 4, i === 0);
    else if (k === 'heavy') await heavyItem(ctx);
    else if (k === 'cup') await cupItem(ctx, lv >= 9);
    else if (k === 'more') await moreItem(ctx);
    else if (k === 'ruler0' || k === 'ruler') await rulerItem(ctx, k === 'ruler');
    else await bigItem(ctx, k, k === 'long' || k === 'many' ? 3 : 0);
  }
  ctx.progress(N, N);
  ctx.finish();
}

/* close: 길이·양이 조금 더 비슷하게 — 1: 기차 칸 차이 2·과자 차이 3, 2: 1·2, 3: 2 와 같고 셋 중에서 '가장' 고르기 */
function bigItem(ctx, kind, close) {
  var e = G.pick(BIG_THINGS), w = countWord(e), wantBig = Math.random() < 0.5, items, target, phrase, answer, cols = 2, render;
  if (kind === 'bs' || kind === 'three') {
    var sizes = kind === 'bs' ? ['big', 'small'] : ['big', 'mid', 'small'];
    items = sizes.map(function (s) { return { s: s }; });
    target = items.filter(function (x) { return x.s === (wantBig ? 'big' : 'small'); })[0];
    var adj = kind === 'three' ? (wantBig ? '가장 큰' : '가장 작은') : (wantBig ? '큰' : '작은');
    phrase = adj + ' ' + w; cols = items.length;
    answer = '여기! 이게 ' + phrase + G.josa(w, '이야', '야').slice(w.length) + '.';
    render = function (it) { return '<span class="ce" style="font-size:' + SZ[it.s] + '">' + e + '</span>'; };
  } else if (kind === 'long') {
    var long = 4 + Math.floor(Math.random() * 2), short = close >= 2 ? long - 1 : close ? long - 2 : 1 + Math.floor(Math.random() * 2);
    items = [{ n: long, s: 'big' }, { n: short, s: 'small' }];
    if (close >= 3) { long++; items = [{ n: long, s: 'big' }, { n: long - 1, s: 'mid' }, { n: long - 2, s: 'small' }]; }   /* 셋: 5~6·4~5·3~4칸 */
    target = wantBig ? items[0] : items[items.length - 1];
    phrase = (close >= 3 ? '가장 ' : '') + (wantBig ? '긴 기차' : '짧은 기차'); cols = 1;
    answer = '여기! 이게 ' + phrase + '야.';
    render = function (it) { return '<span class="train">🚂' + '🚃'.repeat(it.n) + '</span>'; };
  } else {
    var food = G.pick(['🍪', '🍓', '🍬', '🍇', '🧁']), many = 6 + Math.floor(Math.random() * 3), few = close >= 2 ? many - 2 : close ? many - 3 : 1 + Math.floor(Math.random() * 2);
    items = [{ n: many, s: 'big' }, { n: few, s: 'small' }];
    if (close >= 3) items = [{ n: many, s: 'big' }, { n: many - 2, s: 'mid' }, { n: many - 4, s: 'small' }];   /* 셋: 6~8·4~6·2~4개 */
    target = wantBig ? items[0] : items[items.length - 1];
    phrase = (close >= 3 ? '가장 ' : '') + (wantBig ? '많은 쪽' : '적은 쪽'); cols = items.length;
    answer = '여기! 이게 ' + phrase + '이야.';
    render = function (it) { return '<span class="grp">' + G.range(it.n).map(function () { return '<span>' + food + '</span>'; }).join('') + '</span>'; };
  }
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-num">' + (kind === 'long' ? '📏' : kind === 'many' ? '🧺' : wantBig ? '🐘' : '🐭') + '</div></div>'));
  ctx.say(acc(phrase) + ' 찾아봐!');
  return pickItem(ctx, {
    items: G.shuffle(items), cols: cols, size: 'lg', render: render,
    isRight: function (it) { return it === target; },
    praise: function () { return '맞아! ' + phrase + '!'; },
    answer: answer
  });
}

/* 차례로 놓기 (서열) — 크기·길이·양을 작은 것부터(또는 큰 것부터) 차례로 누른다. 누른 것에 1·2·3 번호가 붙는다 */
function serItem(ctx, n, first) {
  var dim = G.pick(['size', 'long', 'many']), asc = Math.random() < 0.5, e = G.pick(BIG_THINGS), w = countWord(e);
  var food = G.pick(['🍪', '🍓', '🍬', '🍇', '🧁']), cnt = n === 4 ? [1, 3, 5, 7] : [1, 3, 5, 7, 9];
  var items = G.range(n).map(function (r) { return { r: r }; }), render, cols, ph, one;
  if (dim === 'size') {
    render = function (it) { return '<span class="ce" style="font-size:' + SER_SZ[n][it.r] + '">' + e + '</span>'; };
    cols = n === 4 ? 2 : 3; ph = asc ? '작은 것부터 큰 것까지' : '큰 것부터 작은 것까지'; one = (asc ? '가장 작은 ' : '가장 큰 ') + w;
  } else if (dim === 'long') {
    render = function (it) { return '<span class="train">🚂' + '🚃'.repeat(it.r + 1) + '</span>'; };
    cols = 1; ph = asc ? '짧은 기차부터 긴 기차까지' : '긴 기차부터 짧은 기차까지'; one = asc ? '가장 짧은 기차' : '가장 긴 기차';
  } else {
    render = function (it) { return '<span class="grp">' + G.range(cnt[it.r]).map(function () { return '<span>' + food + '</span>'; }).join('') + '</span>'; };
    cols = n === 4 ? 2 : 3; ph = asc ? '적은 쪽부터 많은 쪽까지' : '많은 쪽부터 적은 쪽까지'; one = asc ? '가장 적은 쪽' : '가장 많은 쪽';
  }
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-num">' + (dim === 'long' ? '📏' : dim === 'many' ? '🧺' : '🐘') + '</div><div class="mind-rule">' + G.esc(ph.replace(/부터 /, ' → ').replace(/까지$/, '')) + '</div></div>'));
  ctx.say((first ? '이번엔 차례대로 놓기! ' : '') + ph + ' 차례대로 눌러 봐!');
  return new Promise(function (resolve) {
    var k = 0, miss = 0, ch = null;
    ch = ctx.choices(G.shuffle(items), {
      cols: cols, size: 'lg', render: render,
      onPick: function (it, el) {
        var want = asc ? k : n - 1 - k;
        if (it.r === want) {
          if (!miss && k < n - 1) ctx.trial(true);
          miss = 0; el.disabled = true; el.classList.add('sdone');
          el.insertAdjacentHTML('beforeend', '<i class="sb">' + (k + 1) + '</i>');
          G.sfx.play('pop'); k++;
          if (k < n) { ctx.say(k === 1 ? one + '!' : '그다음!', { repeat: false }); return false; }
          ctx.cheer('차례대로 잘 놓았어!').then(function () { return ctx.say(ph + ' 차례대로!', { repeat: false }); })
            .then(function () { return ctx.wait(450); }).then(resolve);
          return true;
        }
        miss++;
        if (miss === 1) ctx.trial(false);
        var right = ch.buttons.filter(function (b) { return b._item.r === want; })[0];
        if (miss >= 2) { G.sfx.play('oops'); G.ui.wiggle(el); G.ui.hint(right); ctx.say((k === 0 ? G.josa(one, '은', '는') + ' 이거야!' : '그다음은 이거야!') + ' 반짝이는 걸 눌러 봐.', { repeat: false }); }
        else ctx.oops(k === 0 ? acc(one) + ' 찾아봐!' : '남은 것 가운데 ' + (asc ? (dim === 'many' ? '가장 적은 쪽' : dim === 'long' ? '가장 짧은 것' : '가장 작은 것') : (dim === 'many' ? '가장 많은 쪽' : dim === 'long' ? '가장 긴 것' : '가장 큰 것')) + '은 뭘까?', el);
        return false;
      }
    });
    ch.el.classList.add('ser');
  });
}

/* 시소 — 무거운 쪽이 아래로 내려간다 */
function heavyItem(ctx) {
  var two = G.sample(SEESAW, 2), left = Math.random() < 0.5, wantHeavy = Math.random() < 0.6;
  var heavy = left ? two[0] : two[1], light = left ? two[1] : two[0], tgt = wantHeavy ? heavy : light;
  var hn = SEESAW_W[heavy], ln = SEESAW_W[light];
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="seesaw"><div class="plank" style="transform:rotate(' + (left ? -12 : 12) + 'deg)"><span class="sl">' + two[0] + '</span><span class="sr">' + two[1] + '</span></div><div class="pivot"></div></div></div>'));
  ctx.say('시소를 봐! 더 ' + (wantHeavy ? '무거운' : '가벼운') + ' 친구는 누구일까?');
  var why = wantHeavy ? '아래로 내려간 ' + G.josa(hn, '이', '가') + ' 더 무거워!' : '위로 올라간 ' + G.josa(ln, '이', '가') + ' 더 가벼워!';
  return pickItem(ctx, {
    items: two.map(function (x) { return { e: x, w: SEESAW_W[x] }; }), cols: 2, size: 'md',
    isRight: function (it) { return it.e === tgt; },
    praise: '맞아! ' + why,
    missSay: function () { return '시소는 무거운 쪽이 아래로 내려가. 다시 봐!'; },
    answer: '시소는 무거운 쪽이 아래로 내려가. ' + why
  });
}

/* 물컵 — 같은 컵이면 물 높이가 높을수록 물이 많다. close(9단계~): 높이 차이가 작다 */
function cupSVG(f) {
  var y = 92 - 74 * f, xl = 12 + (y - 14) * 0.1, xr = 68 - (y - 14) * 0.1;
  return '<svg class="cup" viewBox="0 0 80 100" aria-hidden="true"><polygon points="' + xl + ',' + y + ' ' + xr + ',' + y + ' 60,94 20,94" fill="#4fc3f7"/>' +
    '<path d="M12 14 L20 94 H60 L68 14" fill="none" stroke="#78909c" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/></svg>';
}
function cupItem(ctx, close) {
  var lv = close ? [0.42, 0.58, 0.74] : [0.25, 0.52, 0.82], most = Math.random() < 0.5;
  var items = lv.map(function (f, r) { return { f: f, r: r }; }), tgt = most ? items[2] : items[0];
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-num">🥛</div><div class="mind-rule">똑같은 컵 세 개</div></div>'));
  ctx.say('물이 가장 ' + (most ? '많이' : '적게') + ' 든 컵은 어느 거야?');
  var why = '물 높이가 가장 ' + (most ? '높으니까 물이 가장 많아!' : '낮으니까 물이 가장 적어!');
  return pickItem(ctx, {
    items: G.shuffle(items), cols: 3, size: 'lg',
    render: function (it) { return cupSVG(it.f); },
    isRight: function (it) { return it === tgt; },
    praise: '맞아! ' + why,
    missSay: function () { return '똑같은 컵이면 물 높이를 보면 돼. 다시 봐!'; },
    answer: '여기! ' + why
  });
}

/* 몇 개 더 많을까 — 위·아래 줄을 하나씩 짝지어 남는 것을 센다 */
function moreItem(ctx) {
  var a, b; do { a = ri(4, 9); b = ri(1, a - 1); } while (a - b > 5);
  var d = a - b, e = G.pick(['🍓', '🍪', '🍬', '🐟', '⭐', '🎈']);
  var box = G.el('<div class="mrows" style="--n:' + a + '"></div>'), xs = [];
  G.range(a).forEach(function (k) { var s = G.el('<span>' + e + '</span>'); if (k >= b) { s.classList.add('xtra'); xs.push(s); } box.appendChild(s); });
  box.appendChild(G.el('<i class="rl"></i>'));
  G.range(a).forEach(function (k) { box.appendChild(G.el('<span>' + (k < b ? e : '') + '</span>')); });
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-rule">🔢 몇 개 더 많을까?</div></div>'));
  ctx.body.appendChild(box);
  ctx.say('위 줄이 아래 줄보다 몇 개 더 많을까?');
  var why = '하나씩 짝을 지으면 위에 ' + d + '개가 남아. ' + d + '개 더 많아!';
  function show() { xs.forEach(function (s) { s.classList.add('on'); }); }
  return numPick(ctx, d, nearOpts(d, [-1, 1, 2], 1, 9, 3), {
    unit: '개',
    praise: '맞아! ' + why,
    after: function () { show(); return ctx.wait(700); },
    missSay: function () { return '위와 아래를 하나씩 짝지어 봐. 짝이 없는 건 몇 개야?'; },
    reveal: show,
    answer: why
  });
}

/* 자로 재기 — 연필이 몇 cm 인지. off: 0 이 아닌 곳에서 시작해 칸을 세어야 한다 */
function rulerSVG(s, e, hex) {
  var U = 30, X0 = 15, x1 = X0 + s * U, x2 = X0 + e * U, out = '<svg class="ruler" viewBox="0 0 330 112" aria-hidden="true">';
  out += '<line x1="' + x1 + '" y1="40" x2="' + x1 + '" y2="52" stroke="#90a4ae" stroke-width="1.5" stroke-dasharray="3 2"/><line x1="' + x2 + '" y1="40" x2="' + x2 + '" y2="52" stroke="#90a4ae" stroke-width="1.5" stroke-dasharray="3 2"/>';
  out += '<rect x="' + x1 + '" y="17" width="' + (x2 - x1 - 16) + '" height="20" rx="3" fill="' + hex + '" stroke="rgba(0,0,0,.25)"/>';
  out += '<polygon points="' + (x2 - 16) + ',17 ' + x2 + ',27 ' + (x2 - 16) + ',37" fill="#ffcc80" stroke="rgba(0,0,0,.25)"/><polygon points="' + (x2 - 5) + ',23.9 ' + x2 + ',27 ' + (x2 - 5) + ',30.1" fill="#424242"/>';
  out += '<rect x="2" y="52" width="326" height="56" rx="6" fill="#fff59d" stroke="#c9a400" stroke-width="1.5"/>';
  for (var i = 0; i <= 20; i++) {
    var x = X0 + i * U / 2, big = i % 2 === 0;
    out += '<line x1="' + x + '" y1="52" x2="' + x + '" y2="' + (big ? 70 : 62) + '" stroke="#5d4037" stroke-width="' + (big ? 2 : 1.2) + '"/>';
    if (big) out += '<text x="' + x + '" y="92" text-anchor="middle" font-size="17" font-family="Jua, sans-serif" fill="#5d4037">' + (i / 2) + '</text>';
  }
  out += '<text x="318" y="104" text-anchor="end" font-size="11" fill="#5d4037">cm</text><g class="rk">';
  for (var k = 0; k < e - s; k++) out += '<text x="' + (x1 + (k + 0.5) * U) + '" y="12" text-anchor="middle" font-size="12" font-family="Jua, sans-serif" fill="#e65100">' + (k + 1) + '</text>';
  return out + '</g></svg>';
}
function rulerItem(ctx, off) {
  var s = off ? ri(1, 3) : 0, L = off ? ri(3, 6) : ri(3, 9), e = s + L, col = G.pick(colorsUsed().filter(function (c) { return c.id !== 'yellow'; }));
  var box = G.el('<div class="rulerbox">' + rulerSVG(s, e, col.hex) + '</div>'), sv = box.firstChild;
  ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-rule">✏️ 연필의 길이는?</div></div>'));
  ctx.body.appendChild(box);
  ctx.say(off ? '연필이 0에서 시작하지 않았어! 연필의 길이는 몇 센티미터일까?' : '연필의 길이는 몇 센티미터일까? 자의 눈금을 잘 봐!');
  var opts = [L];
  if (off) opts.push(e);
  nearOpts(L, [-1, 1], 1, 12, 3).slice(1).forEach(function (v) { if (opts.length < 3 && opts.indexOf(v) < 0) opts.push(v); });
  var why = s + '에서 ' + e + '까지 한 칸씩 세면 ' + L + '칸, ' + L + '센티미터야!';
  return numPick(ctx, L, opts, {
    unit: 'cm',
    praise: '맞아! ' + L + '센티미터!',
    after: function () { sv.classList.add('show'); return ctx.say(why, { repeat: false }); },
    missSay: function (it) { return off && it.v === e ? '연필 끝은 ' + e + '에 있지만, ' + s + '에서 시작했어. 한 칸씩 세어 봐!' : '연필 처음부터 끝까지 눈금 칸을 세어 봐!'; },
    reveal: function () { sv.classList.add('show'); },
    answer: why
  });
}
})();

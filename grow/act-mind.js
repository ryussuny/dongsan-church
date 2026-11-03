/* ===========================================================
   함께 자라요 — 생각놀이 (인지: 주의·기억·짝짓기·순서·수·개념)

   match 짝 맞추기 · same 같은 그림 찾기 · order 순서 맞추기 · count 숫자 세기
   shape 모양과 색 · odd 다른 하나 찾기 · big 크다 작다

   모든 놀이는 '실패 없는 배움'으로 짰다.
   틀린 그림은 흐려지고, 두 번 틀리면 정답이 빛나며 자비스가 답을 말해 준다.
   기록은 한 문제에 한 번 — 처음에 맞히면 맞음, 처음 틀리면 틀림.
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;
if (!G || !D) return;

var NUM = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
  '열하나', '열둘', '열셋', '열넷', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스물'];   /* 11~20 은 숫자 세기 4·5단계 */

/* ---------- 모양 ---------- */
G.css('mind', [
  /* 공통 */
  '.mind-q{display:flex;flex-direction:column;align-items:center;margin:auto 0 6px}',
  '.mind-target{background:var(--surface);border-radius:28px;padding:10px 26px;box-shadow:var(--shadow);border:4px dashed color-mix(in srgb,var(--area) 55%,transparent);text-align:center}',
  '.mind-target .tg{font-size:clamp(76px,22vw,150px);line-height:1.15;display:block}',
  '.mind-target small{display:block;color:var(--soft);font-size:clamp(13px,3.4vw,16px)}',
  '.mind-num{font-family:"Jua",sans-serif;font-size:clamp(54px,15vw,100px);line-height:1;color:var(--area)}',
  '.mind-auto{margin:6px auto 0;display:flex}',

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

  /* 숫자 세기 */
  '.act-count .cfield{display:flex;flex-wrap:wrap;justify-content:center;align-content:center;gap:clamp(6px,2vw,14px);margin:auto 0 8px;max-width:640px}',
  '.act-count .ci{position:relative;font-size:clamp(46px,12vw,80px);line-height:1.15;width:1.35em;height:1.35em;border-radius:22px;background:var(--surface);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;transition:transform .15s}',
  '.act-count .ci.counted{background:color-mix(in srgb,var(--area) 22%,var(--surface));transform:scale(.92)}',
  '.act-count .ci i{position:absolute;right:-6px;top:-8px;min-width:30px;height:30px;border-radius:15px;background:var(--area);color:#fff;font-style:normal;font-family:"Jua",sans-serif;font-size:18px;line-height:30px;text-align:center;animation:pop .35s}',
  '.act-count .cfield.small .ci{font-size:clamp(34px,9vw,58px)}',
  '.act-count .numc{font-family:"Jua",sans-serif;font-size:clamp(50px,14vw,96px);line-height:1;color:var(--area)}',
  '.act-count .grp,.act-big .grp{display:flex;flex-wrap:wrap;justify-content:center;gap:4px;font-size:clamp(26px,7vw,44px);line-height:1.15;max-width:100%}',

  /* 모양과 색 */
  '.act-shape .shp{width:clamp(76px,22vw,150px);height:clamp(76px,22vw,150px);display:block}',
  '.act-shape .choice{min-height:clamp(120px,30vw,200px)}',

  /* 크다 작다 */
  '.act-big .choice{min-height:clamp(150px,36vw,240px)}',
  '.act-big .choice .ce{line-height:1}',
  '.act-big .train{font-size:clamp(24px,6.6vw,46px);white-space:nowrap;line-height:1.2;letter-spacing:-2px}',
  '.act-big .choices.c1 .choice{min-height:clamp(90px,20vw,140px)}'
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

/* 그림 고르기 한 문제 — 실패 없는 배움
   o: {items, isRight(it), render, cols, size, praise(str|fn), answer(str), after(it)→Promise} */
function pickItem(ctx, o) {
  return new Promise(function (resolve) {
    var miss = 0, ch = null;
    ch = ctx.choices(o.items, {
      cols: o.cols, size: o.size, render: o.render, label: o.label, color: o.color,
      onPick: function (it, el) {
        if (o.isRight(it)) {
          if (!miss) ctx.trial(true);
          var p = typeof o.praise === 'function' ? o.praise(it) : o.praise;
          ctx.cheer(p, el).then(function () { return o.after ? o.after(it) : null; })
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
          ctx.say(o.answer, { repeat: false });
        } else {
          ctx.oops(null, el);
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

/* =================================================================
   1. 짝 맞추기 (기억)
   ================================================================= */
G.act({
  id: 'match', area: 'mind', title: '짝 맞추기', icon: '🃏', order: 10,
  desc: '같은 그림 두 장을 찾아요',
  goal: '시각 기억·작업 기억, 차례로 살펴보는 주의력, 그림 이름(어휘)',
  how: '카드를 뒤집을 때마다 그림 이름을 아이와 같이 소리 내어 말해 주세요. 못 찾고 헤매면 "아까 강아지가 어디 있었지?" 하고 위치를 함께 떠올려 주세요. 1단계는 그림을 먼저 2초쯤 보여 주고, 칸이 오를수록 조금씩 짧아집니다. 4·5단계(도전·마스터)는 짝이 8쌍·10쌍으로 늘어요.',
  levels: 5, needs: [], mins: 3,
  run: async function (ctx) {
    var lv = ctx.level;
    /* 칸이 오르면 — 1단계: 미리 보는 시간이 2단계 쪽으로 조금씩 짧아진다. 2·3단계: 마지막 판 짝이 하나씩 는다 (ctx.tune).
       4단계 8쌍(→9), 5단계 10쌍(→11) */
    var plan = lv === 1 ? [{ p: 2, pre: ctx.tune([2000, 1200, 0]) }, { p: 2, pre: ctx.tune([2000, 0, 0]) }] :
      lv === 2 ? [{ p: 3, pre: 1200 }, { p: ctx.tune([2, 3, 6, 8, 10]), pre: 0 }] : [{ p: ctx.tune([2, 3, 6, 8, 10]), pre: 0 }];
    var pool = G.shuffle(wordPool(lv === 1 ? 1 : lv === 2 ? 2 : 3));
    for (var b = 0; b < plan.length; b++) {
      ctx.progress(b, plan.length);
      await board(ctx, pool.splice(0, plan[b].p), plan[b].pre);
      if (b < plan.length - 1) { await ctx.say('하나 더 해 볼까?', { repeat: false }); }
    }
    ctx.progress(plan.length, plan.length);
    ctx.finish();
  }
});

function board(ctx, words, preview) {
  clear(ctx);
  var n = words.length * 2, land = innerWidth > innerHeight * 1.1;
  /* 카드 16장 넘으면(4·5단계) 세로 화면 네 줄·가로 화면 여섯 줄 — 카드가 너무 작아지지 않게 */
  var cols = n === 4 ? 2 : n === 6 ? (land ? 3 : 2) : n >= 16 ? (land ? 6 : 4) : (land ? 4 : 3);
  var rows = Math.ceil(n / cols);
  var grid = G.el('<div class="mgrid" style="--cols:' + cols + ';--rows:' + rows + '"></div>');
  var cards = G.shuffle(words.concat(words)).map(function (w) {
    var c = G.el('<button class="mc" type="button" aria-label="카드"><div class="mc-in"><div class="mc-back">?</div><div class="mc-face">' + w.e + '</div></div></button>');
    c._w = w; grid.appendChild(c); return c;
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
    ctx.say('같은 그림 두 장을 찾아봐!');
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
            if (missRun >= 2) { var mate = cards.filter(function (x) { return x !== c && x._w === c._w; })[0]; G.ui.hint(mate); }
            return;
          }
          var a = first; first = null; busy = true;
          if (a._w === c._w) {
            ctx.trial(true); missRun = 0; found++;
            a.classList.add('got'); c.classList.add('got');
            ctx.cheer('짝꿍 찾았다! ' + c._w.w + '!', c).then(function () {
              busy = false;
              if (found === words.length) ctx.wait(300).then(resolve);
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
G.act({
  id: 'same', area: 'mind', title: '같은 그림 찾기', icon: '🔍', order: 20,
  desc: '똑같은 그림을 찾아요',
  goal: '시각 변별·짝짓기 (그림 인지의 첫걸음), 눈으로 비교하며 찾는 힘',
  how: '위 그림을 손가락으로 가리키며 "이거랑 똑같은 거 어디 있지?" 하고 물어 주세요. 3단계는 비슷한 그림(같은 무리)이 섞여 나와 더 꼼꼼히 봐야 합니다. 찾으면 그림 이름도 같이 말해 주세요. 4·5단계(도전·마스터)는 같은 무리 그림이 넷·다섯으로 늘어요.',
  levels: 5, needs: [], mins: 2,
  run: async function (ctx) {
    var lv = ctx.level, N = 6;
    var pool = wordPool(lv === 1 ? 2 : 3);
    var targets = G.sample(pool, N);
    /* 칸이 오르면 한두 문제는 다음 단계 문제로 — 3단계는 그 문제에 비슷한 그림이 하나 더.
       정답 말고 고를 그림 수 = 단계 수 (1 · 2 · 3 · 4 · 5), 3단계부터는 같은 무리 그림. 5단계 2·3칸은 6 */
    var mix = stepMix(ctx, N);
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      var tl = mix[i] ? lv + 1 : lv, k = tl;
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
/* 5단계 2·3칸에 끼워 넣는 '이 순서에 없는 카드' — 순서와 상관없는 그림 */
var SEQ_DECOY = [{ e: '⚽', w: '공차기' }, { e: '🎈', w: '풍선' }, { e: '🧸', w: '곰인형' }, { e: '🚲', w: '자전거' }, { e: '🎨', w: '그림 그리기' }];

G.act({
  id: 'order', area: 'mind', title: '순서 맞추기', icon: '🔢', order: 30,
  desc: '무엇이 먼저일까요?',
  goal: '순서·인과 이해, 일상 절차(손 씻기·이 닦기) 익히기, "먼저-그다음" 말 이해',
  how: '"먼저 뭐 하지? 그다음은?" 하고 순서 말을 또박또박 써 주세요. 다 맞추면 실제로 손 씻기·이 닦기를 할 때 같은 말로 다시 해 보면 효과가 큽니다. 틀려도 괜찮아요 — 두 번째에는 정답 카드가 빛납니다. 4·5단계(도전·마스터)는 다섯 칸·여섯 칸으로 길어져요.',
  levels: 5, needs: [], mins: 3,
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
   5단계: 여섯 칸 셋 — 칸이 오르면 한두 개에 '이 순서에 없는 카드'가 하나 섞인다 */
async function longSeqs(ctx, lv) {
  var base = lv >= 5 ? SEQ6 : SEQ5, pick = G.sample(base, 3), mix = stepMix(ctx, 3), decoy = [false, false, false];
  mix.forEach(function (m, j) {
    if (!m) return;
    if (lv >= 5) { decoy[j] = true; return; }
    var more = SEQ6.filter(function (s) { return pick.every(function (p, q) { return q === j || p.k !== s.k; }); });
    if (more.length) pick[j] = G.pick(more);
  });
  for (var i = 0; i < pick.length; i++) {
    ctx.progress(i, pick.length);
    await oneSeq(ctx, pick[i], i === 0, decoy[i] ? G.pick(SEQ_DECOY) : null);
  }
  ctx.progress(pick.length, pick.length);
  ctx.finish();
}

function oneSeq(ctx, seq, first, decoy) {
  clear(ctx);
  var N = seq.steps.length;
  var steps = seq.steps.map(function (s, k) { return { e: s.e, w: s.w, k: k }; });
  ctx.body.appendChild(G.el('<div class="otitle">' + G.esc(seq.t) + '</div>'));
  var slots = G.el('<div class="oslots' + (N >= 5 ? ' wrap' : '') + '" style="--n:' + N + '"></div>');
  var slotEls = steps.map(function (s, k) { var e = G.el('<div class="oslot' + (k === 0 ? ' now' : '') + '"><b>' + (k + 1) + '</b></div>'); slots.appendChild(e); return e; });
  ctx.body.appendChild(slots);
  ctx.say((first ? '순서대로 눌러 봐. ' : '') + G.josa(seq.t, '은', '는') + ' 무엇이 먼저일까?' + (decoy ? ' 이 순서에 없는 카드도 하나 숨어 있어!' : ''));
  var cards = G.shuffle(decoy ? steps.concat([{ e: decoy.e, w: decoy.w, k: -1 }]) : steps);
  return new Promise(function (resolve) {
    var next = 0, miss = 0, ch = null;
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
          var lastOne = next === N - 1;
          if (!miss && !lastOne) ctx.trial(true);
          miss = 0;
          el.classList.add('gone'); el.disabled = true;
          var sl = slotEls[next];
          sl.classList.remove('now'); sl.classList.add('fill');
          sl.insertAdjacentHTML('beforeend', '<span class="se">' + it.e + '</span><span class="sw">' + G.esc(it.w) + '</span>');
          G.sfx.play('pop');
          next++;
          if (next < N) { slotEls[next].classList.add('now'); ctx.say(it.w + '!', { repeat: false }); return false; }
          /* 다 놓았다 — 이야기로 다시 들려주기 */
          var story = steps.map(function (s, k) { return ordWord(k, N) + ' ' + s.w; }).join(', ') + '!';
          ctx.cheer('순서대로 잘 놓았어!').then(function () {
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
          ctx.say((next === 0 ? '제일 먼저는 ' : next === N - 1 ? '마지막은 ' : '그다음은 ') + steps[next].w + '! 반짝이는 걸 눌러 봐.', { repeat: false });
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

G.act({
  id: 'count', area: 'mind', title: '숫자 세기', icon: '🍎', order: 40,
  desc: '하나씩 눌러서 세어요',
  goal: '일대일 대응(하나에 한 번씩 세기), 수 이름(하나·둘·셋), 마지막 수가 전체 개수라는 개념(기수)',
  how: '아이 손을 잡고 하나씩 짚으며 같이 "하나, 둘, 셋" 소리 내어 세어 주세요. 손으로 누르기 어려우면 "자비스가 세어 줄게" 단추를 눌러 보여 주세요. 3단계에는 "어느 쪽이 더 많아?" 문제가 섞입니다. 4·5단계(도전·마스터)는 열다섯·스물까지 세어요.',
  levels: 5, needs: [], mins: 3,
  run: async function (ctx) {
    /* 칸이 오르면 세는 수의 끝이 다음 단계 쪽으로 커진다 (1단계 3→4→4, 2단계 5→7→8, 10 까지).
       3단계는 끝이 10 그대로, 대신 아주 작은 수가 덜 나온다 (가장 작은 수 1→3→4).
       4단계 끝 15→17→18 (가장 작은 수 5→6→7), 5단계 끝 20 그대로 (가장 작은 수 8→10→12) */
    var lv = ctx.level, st = G.clamp(ctx.step || 1, 1, 3), N = 5;
    var max = Math.min(lv >= 4 ? 20 : 10, ctx.tune([3, 5, 10, 15, 20]));
    var LO = { 3: [1, 3, 4], 4: [5, 6, 7], 5: [8, 10, 12] }, lo = LO[lv] ? LO[lv][st - 1] : 1;
    var kinds = lv >= 3 ? G.shuffle(['n', 'n', 'n', 'cmp', 'cmp']) : ['n', 'n', 'n', 'n', 'n'];
    var lastN = 0;
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      if (kinds[i] === 'cmp') { await compareItem(ctx, max); continue; }
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
  /* 비교하는 수: 3단계 8 까지, 4·5단계 12 까지 */
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

/* =================================================================
   5. 모양과 색
   ================================================================= */
var SHAPE_COLORS = ['red', 'yellow', 'blue', 'green', 'orange', 'purple', 'pink'];
function colorsUsed() { return D.COLORS.filter(function (c) { return SHAPE_COLORS.indexOf(c.id) >= 0; }); }
function shapeSVG(s, hex) { return '<svg class="shp" viewBox="0 0 100 100" aria-hidden="true"><g fill="' + hex + '" stroke="rgba(0,0,0,.2)" stroke-width="3" stroke-linejoin="round">' + s.svg + '</g></svg>'; }

G.act({
  id: 'shape', area: 'mind', title: '모양과 색', icon: '🔺', order: 50,
  desc: '동그라미·세모·빨강을 찾아요',
  goal: '모양·색 이름 이해(수용 언어), 두 가지 특징을 함께 보기(3단계 "파란 세모")',
  how: '집에 있는 물건으로도 이어서 해 보세요 — "동그란 거 찾아볼까? 접시!" 3단계 "파란 세모"는 색과 모양을 함께 기억해야 해서 어려워요. 처음엔 손가락으로 색부터 짚어 주세요. 4·5단계(도전·마스터)는 색이나 모양만 같은 헷갈리는 그림이 하나·둘 더 나와요.',
  levels: 5, needs: [], mins: 2,
  run: async function (ctx) {
    var lv = ctx.level, N = 6, cols = colorsUsed(), shapes = D.SHAPES;
    /* 칸이 오르면 한두 문제는 다음 단계 문제로 — 3단계는 그 문제에 같은 색 다른 모양이 하나 더.
       3단계부터는 '파란 세모' 문제에 헷갈리는 그림(색만 같거나 모양만 같은 것)이 단계마다 하나씩 더:
       3단계 0 · 4단계 1 · 5단계 2 (칸이 오르면 다음 단계 수, 5단계 2·3칸은 3) */
    var LURE = [[2, 0], [0, 2], [3, 0]];   /* [모양, 색] 번호 — 같은 색 다른 모양, 같은 모양 다른 색, 같은 색 다른 모양 */
    var mix = stepMix(ctx, N);
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      var tl = mix[i] ? lv + 1 : lv, lures = Math.max(0, tl - 3);
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

G.act({
  id: 'odd', area: 'mind', title: '다른 하나 찾기', icon: '🙃', order: 60,
  desc: '하나만 달라요! 어떤 걸까?',
  goal: '범주화(먹는 것·동물·탈것), 같고 다름 비교, "왜냐하면" 설명 이해',
  how: '답을 맞히면 "왜 달라?" 하고 한 번 물어봐 주세요. 말로 못 해도 괜찮아요 — 자비스가 이유를 말해 줍니다. 장 볼 때 "먹는 거? 아니면 쓰는 거?" 하고 물건을 나눠 보면 좋아요. 4·5단계(도전·마스터)는 과일·채소, 새·곤충처럼 더 촘촘한 무리로 나눠요.',
  levels: 5, needs: [], mins: 2,
  run: async function (ctx) {
    var lv = ctx.level, N = 5;
    /* 칸이 오르면 한두 문제는 다음 단계 문제로 — 3단계는 그 문제에 같은 무리 그림이 하나 더.
       4단계 2·3칸은 5단계 무리 맛보기, 5단계 2·3칸은 같은 무리 그림이 하나 더 */
    var mix = stepMix(ctx, N);
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      var set = buildOdd(mix[i] ? (lv === 3 ? 3 : Math.min(5, lv + 1)) : lv, (lv === 3 || lv >= 5) && mix[i]);
      ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-num">🤔</div></div>'));
      ctx.say(i === 0 ? '하나만 달라! 다른 하나는 뭘까?' : '다른 하나는 뭘까?');
      var why = set.why || G.josa(set.odd.w, '은', '는') + ' ' + CAT_NOT[set.base] + '. ' + CAT_IS[set.odd.c] + '!';
      await pickItem(ctx, {
        items: G.shuffle(set.items), cols: set.items.length > 3 ? 4 : 3, size: set.items.length > 3 ? 'md' : 'lg',
        isRight: function (it) { return it === set.odd; },
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

/* =================================================================
   7. 크다 작다 (개념: 크기·길이·양)
   ================================================================= */
var BIG_THINGS = ['🐻', '🐶', '🐱', '🐘', '⚽', '🎈', '🍎', '🌳', '🚗', '⭐', '🐸', '🐟'];
var SZ = { big: 'clamp(84px,24vw,160px)', mid: 'clamp(54px,15vw,100px)', small: 'clamp(30px,8.5vw,58px)' };

G.act({
  id: 'big', area: 'mind', title: '크다 작다', icon: '🐘', order: 70,
  desc: '큰 것, 작은 것을 찾아요',
  goal: '크기·길이·양 개념어(크다/작다, 길다/짧다, 많다/적다) 이해와 비교',
  how: '찾고 나면 손을 크게 벌리며 "커~다란 곰!", 작게 오므리며 "쪼끄만 곰!" 하고 몸짓을 함께 해 주세요. 간식 시간에 "많이 줄까, 조금 줄까?" 하고 같은 말을 써 보면 개념이 단단해집니다. 4·5단계(도전·마스터)는 길이·양의 차이가 점점 작아져 더 꼼꼼히 비교해요.',
  levels: 5, needs: [], mins: 2,
  run: async function (ctx) {
    var lv = ctx.level, N = 6;
    var kinds = lv === 1 ? ['bs', 'bs', 'bs', 'bs', 'bs', 'bs'] : lv === 2 ? G.shuffle(['bs', 'bs', 'bs', 'three', 'three', 'three'])
      : G.shuffle(['bs', 'three', 'long', 'long', 'many', 'many']);
    /* 칸이 오르면 한두 문제는 다음 단계 문제로 (1단계 → 셋 중에서, 2단계 → 길다·많다).
       3단계는 길이·양 문제 한두 개가 조금 더 비슷해진다.
       비슷한 정도(close): 0 보통 · 1 비슷(기차 2칸·과자 3개 차이) · 2 아주 비슷(1칸·2개) · 3 아주 비슷한 것 셋 중에서.
       4단계는 길이·양 문제가 모두 1, 칸이 오르면 한두 개가 2 / 5단계는 모두 2, 칸이 오르면 한두 개가 3 */
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
})();

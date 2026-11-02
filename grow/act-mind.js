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

var NUM = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'];

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
  how: '카드를 뒤집을 때마다 그림 이름을 아이와 같이 소리 내어 말해 주세요. 못 찾고 헤매면 "아까 강아지가 어디 있었지?" 하고 위치를 함께 떠올려 주세요. 1단계는 그림을 먼저 2초쯤 보여 주고, 칸이 오를수록 조금씩 짧아집니다.',
  levels: 3, needs: [], mins: 3,
  run: async function (ctx) {
    var lv = ctx.level;
    /* 칸이 오르면 — 1단계: 미리 보는 시간이 2단계 쪽으로 조금씩 짧아진다. 2·3단계: 마지막 판 짝이 하나씩 는다 (ctx.tune) */
    var plan = lv === 1 ? [{ p: 2, pre: ctx.tune([2000, 1200, 0]) }, { p: 2, pre: ctx.tune([2000, 0, 0]) }] :
      lv === 2 ? [{ p: 3, pre: 1200 }, { p: ctx.tune([2, 3, 6]), pre: 0 }] : [{ p: ctx.tune([2, 3, 6]), pre: 0 }];
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
  var cols = n === 4 ? 2 : n === 6 ? (land ? 3 : 2) : (land ? 4 : 3);
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
  how: '위 그림을 손가락으로 가리키며 "이거랑 똑같은 거 어디 있지?" 하고 물어 주세요. 3단계는 비슷한 그림(같은 무리)이 섞여 나와 더 꼼꼼히 봐야 합니다. 찾으면 그림 이름도 같이 말해 주세요.',
  levels: 3, needs: [], mins: 2,
  run: async function (ctx) {
    var lv = ctx.level, N = 6;
    var pool = wordPool(lv === 1 ? 2 : 3);
    var targets = G.sample(pool, N);
    /* 칸이 오르면 한두 문제는 다음 단계 문제로 — 3단계는 그 문제에 비슷한 그림이 하나 더 */
    var mix = stepMix(ctx, N);
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      var tl = mix[i] ? Math.min(3, lv + 1) : lv, k = tl === 1 ? 1 : tl === 2 ? 2 : lv === 3 && mix[i] ? 4 : 3;
      var t = targets[i], others;
      if (tl === 1) others = G.sample(pool.filter(function (w) { return w.c !== t.c; }), k);
      else if (tl === 3) {
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
G.act({
  id: 'order', area: 'mind', title: '순서 맞추기', icon: '🔢', order: 30,
  desc: '무엇이 먼저일까요?',
  goal: '순서·인과 이해, 일상 절차(손 씻기·이 닦기) 익히기, "먼저-그다음" 말 이해',
  how: '"먼저 뭐 하지? 그다음은?" 하고 순서 말을 또박또박 써 주세요. 다 맞추면 실제로 손 씻기·이 닦기를 할 때 같은 말로 다시 해 보면 효과가 큽니다. 틀려도 괜찮아요 — 두 번째에는 정답 카드가 빛납니다.',
  levels: 3, needs: [], mins: 3,
  run: async function (ctx) {
    var lv = ctx.level;
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

function oneSeq(ctx, seq, first) {
  clear(ctx);
  var N = seq.steps.length;
  var steps = seq.steps.map(function (s, k) { return { e: s.e, w: s.w, k: k }; });
  ctx.body.appendChild(G.el('<div class="otitle">' + G.esc(seq.t) + '</div>'));
  var slots = G.el('<div class="oslots" style="--n:' + N + '"></div>');
  var slotEls = steps.map(function (s, k) { var e = G.el('<div class="oslot' + (k === 0 ? ' now' : '') + '"><b>' + (k + 1) + '</b></div>'); slots.appendChild(e); return e; });
  ctx.body.appendChild(slots);
  ctx.say((first ? '순서대로 눌러 봐. ' : '') + G.josa(seq.t, '은', '는') + ' 무엇이 먼저일까?');
  return new Promise(function (resolve) {
    var next = 0, miss = 0, ch = null;
    ch = ctx.choices(G.shuffle(steps), {
      cols: N > 3 ? 4 : N, size: 'md',
      onPick: function (it, el) {
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
  how: '아이 손을 잡고 하나씩 짚으며 같이 "하나, 둘, 셋" 소리 내어 세어 주세요. 손으로 누르기 어려우면 "자비스가 세어 줄게" 단추를 눌러 보여 주세요. 3단계에는 "어느 쪽이 더 많아?" 문제가 섞입니다.',
  levels: 3, needs: [], mins: 3,
  run: async function (ctx) {
    /* 칸이 오르면 세는 수의 끝이 다음 단계 쪽으로 커진다 (1단계 3→4→4, 2단계 5→7→8, 10 까지).
       3단계는 끝이 10 그대로, 대신 아주 작은 수가 덜 나온다 (가장 작은 수 1→3→4) */
    var lv = ctx.level, max = Math.min(10, ctx.tune([3, 5, 10])), lo = lv === 3 ? [1, 3, 4][G.clamp(ctx.step || 1, 1, 3) - 1] : 1, N = 5;
    var kinds = lv === 3 ? G.shuffle(['n', 'n', 'n', 'cmp', 'cmp']) : ['n', 'n', 'n', 'n', 'n'];
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
  var e = G.pick(COUNT_THINGS), a, b;
  do { a = 1 + Math.floor(Math.random() * Math.min(max, 8)); b = 1 + Math.floor(Math.random() * Math.min(max, 8)); } while (Math.abs(a - b) < 2);
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
  how: '집에 있는 물건으로도 이어서 해 보세요 — "동그란 거 찾아볼까? 접시!" 3단계 "파란 세모"는 색과 모양을 함께 기억해야 해서 어려워요. 처음엔 손가락으로 색부터 짚어 주세요.',
  levels: 3, needs: [], mins: 2,
  run: async function (ctx) {
    var lv = ctx.level, N = 6, cols = colorsUsed(), shapes = D.SHAPES;
    /* 칸이 오르면 한두 문제는 다음 단계 문제로 — 3단계는 그 문제에 같은 색 다른 모양이 하나 더 */
    var mix = stepMix(ctx, N);
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      var tl = mix[i] ? Math.min(3, lv + 1) : lv;
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
        var S = G.sample(shapes, 3), C = G.sample(cols, 3);
        target = { s: S[0], c: C[0] };
        items = [target, { s: S[0], c: C[1] }, { s: S[1], c: C[0] }, { s: S[2], c: C[2] }];
        if (lv === 3 && mix[i]) items.push({ s: S[2], c: C[0] });
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

G.act({
  id: 'odd', area: 'mind', title: '다른 하나 찾기', icon: '🙃', order: 60,
  desc: '하나만 달라요! 어떤 걸까?',
  goal: '범주화(먹는 것·동물·탈것), 같고 다름 비교, "왜냐하면" 설명 이해',
  how: '답을 맞히면 "왜 달라?" 하고 한 번 물어봐 주세요. 말로 못 해도 괜찮아요 — 자비스가 이유를 말해 줍니다. 장 볼 때 "먹는 거? 아니면 쓰는 거?" 하고 물건을 나눠 보면 좋아요.',
  levels: 3, needs: [], mins: 2,
  run: async function (ctx) {
    var lv = ctx.level, N = 5;
    /* 칸이 오르면 한두 문제는 다음 단계 문제로 — 3단계는 그 문제에 같은 무리 그림이 하나 더 */
    var mix = stepMix(ctx, N);
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      var set = buildOdd(mix[i] ? Math.min(3, lv + 1) : lv, lv === 3 && mix[i]);
      ctx.body.appendChild(G.el('<div class="mind-q"><div class="mind-num">🤔</div></div>'));
      ctx.say(i === 0 ? '하나만 달라! 다른 하나는 뭘까?' : '다른 하나는 뭘까?');
      var why = G.josa(set.odd.w, '은', '는') + ' ' + CAT_NOT[set.base] + '. ' + CAT_IS[set.odd.c] + '!';
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
  how: '찾고 나면 손을 크게 벌리며 "커~다란 곰!", 작게 오므리며 "쪼끄만 곰!" 하고 몸짓을 함께 해 주세요. 간식 시간에 "많이 줄까, 조금 줄까?" 하고 같은 말을 써 보면 개념이 단단해집니다.',
  levels: 3, needs: [], mins: 2,
  run: async function (ctx) {
    var lv = ctx.level, N = 6;
    var kinds = lv === 1 ? ['bs', 'bs', 'bs', 'bs', 'bs', 'bs'] : lv === 2 ? G.shuffle(['bs', 'bs', 'bs', 'three', 'three', 'three'])
      : G.shuffle(['bs', 'three', 'long', 'long', 'many', 'many']);
    /* 칸이 오르면 한두 문제는 다음 단계 문제로 (1단계 → 셋 중에서, 2단계 → 길다·많다).
       3단계는 길이·양 문제 한두 개가 조금 더 비슷해진다 */
    var close = {};
    if (lv < 3) stepMix(ctx, N).forEach(function (m, j) { if (m) kinds[j] = lv === 1 ? 'three' : G.pick(['long', 'many']); });
    else G.sample(G.range(N).filter(function (j) { return kinds[j] === 'long' || kinds[j] === 'many'; }), Math.max(0, (ctx.step || 1) - 1)).forEach(function (j) { close[j] = true; });
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      await bigItem(ctx, kinds[i], !!close[i]);
    }
    ctx.progress(N, N);
    ctx.finish();
  }
});

/* close: 길이·양이 조금 더 비슷하게 (기차 칸 차이 2, 과자 차이 3) */
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
    var long = 4 + Math.floor(Math.random() * 2), short = close ? long - 2 : 1 + Math.floor(Math.random() * 2);
    items = [{ n: long, s: 'big' }, { n: short, s: 'small' }];
    target = wantBig ? items[0] : items[1];
    phrase = wantBig ? '긴 기차' : '짧은 기차'; cols = 1;
    answer = '여기! 이게 ' + phrase + '야.';
    render = function (it) { return '<span class="train">🚂' + '🚃'.repeat(it.n) + '</span>'; };
  } else {
    var food = G.pick(['🍪', '🍓', '🍬', '🍇', '🧁']), many = 6 + Math.floor(Math.random() * 3), few = close ? many - 3 : 1 + Math.floor(Math.random() * 2);
    items = [{ n: many, s: 'big' }, { n: few, s: 'small' }];
    target = wantBig ? items[0] : items[1];
    phrase = wantBig ? '많은 쪽' : '적은 쪽'; cols = 2;
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

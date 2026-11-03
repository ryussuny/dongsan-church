/* ===========================================================
   함께 자라요 — 🌷 고운 말 놀이 (말하기 · 화용 언어)

   1단계  친구·가족에게 — 상황에 맞는 고운 말 고르기 (고마워 · 미안해 · 안녕 · 같이 하자 · 괜찮아?)
          고른 뒤 자비스가 또박또박 들려주고 "같이 말해 볼까?" (말하지 않아도 괜찮다)
   2단계  어른께 — 높임말 인사·감사·부탁 (안녕하세요 · 감사합니다 · 잘 먹겠습니다 · 다녀오겠습니다 · 물 좀 주세요)
          먼저 말해 보고, 어려우면 보기가 나온다(도움 → 성공)
   3단계  바꿔 말하기 — 거친 말·유행어 대신 고운 말·표준말 (바보야 → 나 속상해 · 대박 → 정말 멋지다)
          자비스는 거친 말을 소리 내어 읽지 않는다(화면에 지운 줄로만 보인다).
   4단계  도전 — 마음 + 부탁을 한 문장으로 (나-전달법: "나 먼저 왔어. 차례를 지켜 줄래?")
   5단계  마스터 — 어른께 높임말 문장으로 부탁·질문하기 ("선생님, 화장실에 다녀와도 될까요?")
   칸이 오르면 (칸-1)개를 다음 단계 상황으로 미리 맛보고, 보기·판 수가 조금씩 는다(ctx.tune).
   아이 화면에 "틀렸어"는 없다 — 덜 고운 말을 누르면 "이렇게 말하면 더 따뜻해져" 하고 고운 말이 반짝인다.
   =========================================================== */
(function () {
'use strict';
var G = window.G;

/* 상황 — good: 맞다고 볼 말(첫째가 카드에 보인다), no: 섞을 덜 고운 말(욕·거친 말은 보기로 내지 않는다)
   3단계 from: 바꾸기 전 말(화면에만, 지운 줄), slang: 유행어라 자비스가 소리 내어 말해도 되는 것 */
var SITS = [
  { lv: 1, e: '🧸', t: '친구가 장난감을 빌려줬어요', good: ['고마워', '고마워요', '고맙습니다'], no: ['흥', '내 거야'] },
  { lv: 1, e: '🦶', t: '친구 발을 모르고 밟았어요', good: ['미안해', '미안해요', '괜찮아'], no: ['몰라', '흥'] },
  { lv: 1, e: '👋', t: '아침에 친구를 만났어요', good: ['안녕', '안녕 반가워', '반가워'], no: ['몰라', '왜'] },
  { lv: 1, e: '🎨', t: '친구가 그림을 멋지게 그렸어요', good: ['멋지다', '잘 그렸다', '멋져'], no: ['별로야', '몰라'] },
  { lv: 1, e: '🤕', t: '친구가 넘어졌어요', good: ['괜찮아', '도와줄게', '괜찮니'], no: ['하하', '몰라'] },
  { lv: 1, e: '🧱', t: '친구랑 블록 놀이를 하고 싶어요', good: ['같이 놀자', '같이 하자'], no: ['내 거야', '비켜'] },
  { lv: 1, e: '🍪', t: '동생에게 과자를 나눠 줄 거예요', good: ['나눠 줄게', '같이 먹자'], no: ['내 거야', '안 줘'] },
  { lv: 2, e: '🧑‍🏫', t: '학교에서 선생님을 만났어요', good: ['안녕하세요'], no: ['안녕', '왔어'] },
  { lv: 2, e: '🎁', t: '할머니가 선물을 주셨어요', good: ['감사합니다', '고맙습니다'], no: ['고마워', '줘'] },
  { lv: 2, e: '🍚', t: '할아버지와 밥을 먹기 전이에요', good: ['잘 먹겠습니다'], no: ['배고파', '빨리 줘'] },
  { lv: 2, e: '🚪', t: '학교에 가려고 집을 나서요', good: ['다녀오겠습니다', '다녀올게요'], no: ['간다', '나 가'] },
  { lv: 2, e: '💧', t: '식당에서 물이 더 마시고 싶어요', good: ['물 좀 주세요', '물 주세요'], no: ['물', '물 줘'] },
  { lv: 2, e: '🙇', t: '할아버지 발을 모르고 밟았어요', good: ['죄송합니다', '죄송해요'], no: ['미안', '몰라'] },
  { lv: 2, e: '🏠', t: '학교에서 집에 돌아왔어요', good: ['다녀왔습니다'], no: ['왔어', '배고파'] },
  { lv: 2, e: '🌙', t: '잠자기 전에 엄마 아빠께 인사해요', good: ['안녕히 주무세요', '안녕히 주무십시오'], no: ['잘 자', '몰라'] },
  { lv: 3, e: '🧱', t: '친구가 내 블록을 무너뜨렸어요', from: '바보야!', good: ['나 속상해', '속상해', '하지 마 속상해'], no: ['흥', '몰라'] },
  { lv: 3, e: '🔊', t: '동생이 너무 시끄러워요', from: '시끄러!', good: ['조금만 조용히 해 줄래', '조용히 해 줄래', '조용히 해 주세요'], no: ['흥', '몰라'] },
  { lv: 3, e: '🎮', t: '게임에서 졌어요', from: '짜증 나!', good: ['아쉽다', '아쉬워', '다시 해 볼래'], no: ['안 해', '흥'] },
  { lv: 3, e: '😠', t: '화가 많이 났어요', from: '저리 가!', good: ['나 지금 화났어', '화났어', '혼자 있고 싶어'], no: ['몰라', '흥'] },
  { lv: 3, e: '🙋', t: '친구 장난감을 쓰고 싶어요', from: '내놔!', good: ['빌려줄래', '나도 해도 돼', '같이 하자'], no: ['내 거야', '빨리'] },
  { lv: 3, e: '🤖', t: '멋진 로봇을 봤어요', from: '대박!', slang: true, good: ['정말 멋지다', '정말 멋져', '멋지다'], no: ['짱', '몰라'] },
  { lv: 3, e: '😲', t: '깜짝 놀랐어요', from: '헐!', slang: true, good: ['깜짝이야', '깜짝 놀랐어', '놀랐어'], no: ['몰라', '왜'] },
  { lv: 3, e: '🍦', t: '아이스크림이 정말 맛있어요', from: '개맛있어!', slang: true, good: ['정말 맛있어', '아주 맛있어', '맛있어'], no: ['짱', '몰라'] },
  /* 4단계 · 도전 — 마음과 부탁을 함께 (나-전달법) */
  { lv: 4, e: '🚶', t: '친구가 내 앞으로 새치기를 했어요', good: ['나 먼저 왔어 차례를 지켜 줄래', '차례를 지켜 줄래'], no: ['비켜', '야 저리 가'] },
  { lv: 4, e: '🖍️', t: '동생이 내 그림에 낙서를 했어요', good: ['속상해 내 그림은 건드리지 말아 줘', '내 그림은 건드리지 말아 줘'], no: ['하지 마', '흥'] },
  { lv: 4, e: '⚽', t: '친구들이 놀이에 끼워 주지 않아요', good: ['나도 같이 하고 싶어 끼워 줄래', '나도 같이 하고 싶어'], no: ['안 놀아', '흥'] },
  { lv: 4, e: '🧸', t: '친구가 장난감을 망가뜨리고 사과했어요', good: ['괜찮아 다음엔 조심해 줘', '괜찮아'], no: ['몰라', '물어내'] },
  { lv: 4, e: '📚', t: '친구가 숙제를 도와줬어요', good: ['도와줘서 고마워 너 덕분이야', '도와줘서 고마워'], no: ['됐어', '몰라'] },
  { lv: 4, e: '😢', t: '내가 친구 마음을 아프게 했어요', good: ['미안해 다음부터는 안 그럴게', '미안해'], no: ['몰라', '내 잘못 아니야'] },
  /* 5단계 · 마스터 — 어른께 높임말 문장으로 */
  { lv: 5, e: '🚻', t: '수업 시간에 화장실에 가고 싶어요', good: ['선생님 화장실에 다녀와도 될까요', '화장실에 다녀와도 될까요'], no: ['화장실', '나 갈래'] },
  { lv: 5, e: '🥄', t: '식당에서 숟가락이 없어요', good: ['숟가락 하나 더 주시겠어요', '숟가락 하나 주세요'], no: ['숟가락', '숟가락 줘'] },
  { lv: 5, e: '🗺️', t: '길을 몰라서 어른께 여쭤봐요', good: ['실례합니다 화장실이 어디예요', '실례합니다'], no: ['어디야', '야'] },
  { lv: 5, e: '🏅', t: '선생님께서 칭찬해 주셨어요', good: ['감사합니다 더 열심히 할게요', '감사합니다'], no: ['응', '알아'] },
  { lv: 5, e: '📞', t: '할머니께서 전화하셨어요', good: ['할머니 안녕하세요 잘 지내셨어요', '안녕하세요'], no: ['여보세요 왜', '응'] },
  { lv: 5, e: '🎒', t: '선생님께 준비물을 빌리고 싶어요', good: ['선생님 가위 좀 빌려주시겠어요', '가위 좀 빌려주세요'], no: ['가위', '가위 줘'] }
];
var FLOWERS = ['🌷', '🌸', '🌼', '🌻', '🌺', '💐'];

function css() {
  G.css('kindword', [
    '.act-kindword{gap:10px}',
    '.act-kindword .kw-garden{display:flex;gap:4px;justify-content:center;min-height:34px;font-size:clamp(24px,7vw,32px)}',
    '.act-kindword .kw-garden span{animation:kwGrow .6s cubic-bezier(.3,1.6,.5,1) both}',
    '@keyframes kwGrow{from{transform:scale(0) translateY(10px);opacity:0}to{transform:none;opacity:1}}',
    '.act-kindword .kw-scene{width:100%;max-width:560px;background:var(--surface);border-radius:24px;box-shadow:var(--shadow);padding:14px 16px;text-align:center}',
    '.act-kindword .kw-e{font-size:clamp(64px,20vw,110px);line-height:1.1}',
    '.act-kindword .kw-t{font-family:Jua,sans-serif;font-size:clamp(19px,5.2vw,25px);margin-top:4px}',
    '.act-kindword .kw-from{margin-top:8px;font-size:clamp(17px,4.6vw,21px);color:var(--soft)}',
    '.act-kindword .kw-from s{color:#d9534f;text-decoration-thickness:3px}',
    '.act-kindword .kw-from b{color:var(--area);font-family:Jua,sans-serif}',
    '.act-kindword .kw-ch{width:100%;max-width:560px}',
    '.act-kindword .kw-ch .choice{min-height:84px}',
    '.act-kindword .kw-w{font-family:Jua,sans-serif;font-size:clamp(19px,5vw,24px)}',
    '.act-kindword .kw-say{font-family:Jua,sans-serif;font-size:clamp(24px,7vw,34px);color:var(--area);background:var(--surface);border-radius:999px;padding:10px 22px;box-shadow:var(--shadow);animation:kwGrow .5s both}',
    '.act-kindword .heard{min-height:24px;color:var(--soft)}'
  ].join('\n'));
}

G.act({
  id: 'kindword', area: 'speech', title: '고운 말 놀이', icon: '🌷', order: 75, levels: 5, mins: 3, needs: [],
  ef: ['inhibit', 'regulate'],
  desc: '이럴 땐 어떤 고운 말을 할까?',
  goal: '상황에 맞는 고운 말(고마워·미안해·인사·부탁·칭찬) 고르고 소리 내어 말하기, 어른께 높임말 쓰기, 거친 말·유행어를 고운 말·표준말로 바꿔 말하기, 4단계 마음+부탁을 한 문장으로(나-전달법), 5단계 어른께 높임말 문장으로 부탁·질문하기 (화용 언어)',
  how: '아이가 고른 뒤 부모도 같은 말을 한 번 더 또박또박 들려주세요. 놀이에서 나온 말("감사합니다", "다녀오겠습니다")을 오늘 생활에서 쓸 기회를 만들고, 쓰면 바로 콕 집어 칭찬해 주세요. 평소에 유행어를 써도 "틀렸어" 대신 표준말로 다시 들려주세요("대박!" → "그렇지, 정말 멋지다!").',
  basis: '화용 언어(상황에 맞는 말) 중재 — 모델링·고쳐 말해 주기(recast), 거친 말 대신 감정을 말로 나타내는 대체 행동 가르치기(긍정적 행동 지원), 높임말 사용',
  offline: '냉장고에 「고운 말 꽃밭」 종이를 붙이고, 가족 누구든 고운 말을 쓰면 꽃 스티커 하나. 밥 먹기 전 "잘 먹겠습니다", 나갈 때 "다녀오겠습니다"를 온 가족이 함께 말하기.',
  run: async function (ctx) {
    css();
    var B = ctx.body, lv = ctx.level;
    /* 칸이 오르면: 판이 조금 늘고(5→7), 보기가 하나 늘고(2→3), 말할 시간이 조금 짧아진다 */
    /* 4·5단계는 문장이 길어 말할 시간을 넉넉히, 보기는 셋 */
    var N = ctx.tune([5, 6, 7, 7, 8]), K = ctx.tune([2, 3, 3, 3, 3]), MS = ctx.tune([7000, 6500, 6000, 8000, 8500]);
    var talk = G.has.stt;
    /* 칸이 오르면 (칸-1)개를 다음 단계 상황으로 — 앞쪽은 익숙한 것, 뒤쪽에 새 것 */
    var cur = G.shuffle(SITS.filter(function (s) { return s.lv === lv; }));
    var top = ctx.def.levels || 5;
    var nxt = lv < top ? G.shuffle(SITS.filter(function (s) { return s.lv === lv + 1; })) : [];
    var nNext = lv < top ? Math.min(nxt.length, ctx.step - 1) : 0;
    var list = cur.slice(0, Math.max(0, N - nNext)).concat(nxt.slice(0, nNext));
    if (list.length < N) list = list.concat(G.shuffle(SITS.filter(function (s) { return s.lv < lv && list.indexOf(s) < 0; })).slice(0, N - list.length));
    N = list.length;
    var garden = G.el('<div class="kw-garden" aria-label="고운 말 꽃밭"></div>');
    var nice = 0;

    function flower() { var f = G.el('<span>' + FLOWERS[nice % FLOWERS.length] + '</span>'); garden.appendChild(f); nice++; }
    function clear() { B.innerHTML = ''; B.appendChild(garden); }
    function ask(s) {
      if (s.lv === 5) return s.t + '. 어른께 높임말 문장으로 말씀드려 볼까?';
      if (s.lv === 4) return s.t + '. 내 마음과 부탁을 고운 말로 함께 말해 볼까?';
      if (s.lv === 3) return s.t + '. ' + (s.slang ? '"' + s.from.replace(/!$/, '') + '" 말고, 표준말로 하면 뭐라고 할까?' : '속상해도 고운 말로 말해 볼까?');
      if (s.lv === 2) return s.t + '. 어른께는 뭐라고 말씀드릴까?';
      return s.t + '. 뭐라고 말하면 좋을까?';
    }
    function miss(s) {
      var w = s.good[0];
      if (s.lv === 5) return '어른께는 "' + w + '"처럼 높임말로 말씀드리면 더 예의 바르게 들려. 반짝이는 말을 눌러 봐.';
      if (s.lv === 4) return '"' + w + '"처럼 마음과 부탁을 함께 말하면 친구가 잘 알아들어. 반짝이는 말을 눌러 봐.';
      if (s.lv === 3) return '"' + w + '"라고 하면 더 고운 말이 돼. 반짝이는 말을 눌러 봐.';
      if (s.lv === 2) return '어른께는 "' + w + '"라고 하면 더 예의 바르게 들려. 반짝이는 말을 눌러 봐.';
      return '"' + w + '"라고 하면 마음이 더 따뜻해질 거야. 반짝이는 말을 눌러 봐.';
    }
    /* 보기 고르기 — 덜 고운 말을 누르면 고운 말이 반짝(무오류). 처음에 바로 골랐는지 돌려준다 */
    function choose(s) {
      var opts = [{ w: s.good[0], ok: true }].concat(G.sample(s.no, Math.max(1, Math.min(s.no.length, K - 1))).map(function (w) { return { w: w }; }));
      opts = G.shuffle(opts);
      return new Promise(function (done) {
        var first = true, box = G.el('<div class="kw-ch"></div>'); B.appendChild(box);
        var grid = G.ui.choices(box, opts, { cols: s.lv >= 4 ? 1 : opts.length, size: 'md', render: function (o) { return '<span class="cl kw-w">' + G.esc(o.w) + '</span>'; },
          onPick: function (o, el) {
            if (o.ok) { var f = first; first = false; G.ui.good(el); done(f); return true; }
            first = false; el.disabled = true;
            var right = grid.buttons.filter(function (b) { return b._item && b._item.ok; })[0];
            ctx.oops(miss(s), el).then(function () { G.ui.hint(right); });
          } });
      });
    }
    /* 말해 보기 — 들으면 G.kind 가 고운 말을 센다(부모 화면). 말 못 해도 괜찮다 */
    async function trySay(s, ms) {
      if (!talk) return null;
      var heard = G.el('<div class="heard">🎤 듣고 있어요…</div>'); B.appendChild(heard);
      var res = await ctx.listen({ expect: s.good, ms: ms });
      heard.remove();
      if (res.denied || res.unsupported) { talk = false; return null; }
      return res;
    }
    function showSay(w) { var el = G.el('<div class="kw-say">🌷 ' + G.esc(w) + '</div>'); B.appendChild(el); return el; }

    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear();
      var s = list[i];
      var sc = G.el('<div class="kw-scene"><div class="kw-e">' + s.e + '</div><div class="kw-t"></div>' + (s.from ? '<div class="kw-from"><s></s> ➜ <b>🌷 ?</b></div>' : '') + '</div>');
      sc.querySelector('.kw-t').textContent = s.t;
      if (s.from) sc.querySelector('.kw-from s').textContent = s.from;
      B.appendChild(sc);
      await ctx.say(ask(s));
      var w = s.good[0];
      if (s.lv >= 2 && talk) {
        /* 먼저 말해 보기 → 어려우면 보기(도움) */
        var r = await trySay(s, MS);
        if (r && r.ok) {
          ctx.trial(true); flower();
          showSay(r.text && G.similar(r.text, w) >= 0.5 ? w : (r.text || w));
          await ctx.cheer(G.pick(['정말 예쁘게 말했어!', '높임말도 척척! 멋지다!', '고운 말 최고야!']));
          continue;
        }
        if (r && r.heard) await ctx.say('좋아! 이 중에서 골라 볼까?', { repeat: false });
        else await ctx.say('여기 있는 말 중에서 골라 볼까?', { repeat: false });
        await choose(s);
        ctx.trial(false); flower();
        showSay(w);
        await ctx.say('"' + w + '!" 맞아, 이렇게 말하는 거야.', { repeat: false });
        continue;
      }
      /* 1단계(또는 말하기가 안 될 때): 고르기 → 자비스가 또박또박 → 같이 말해 보기(말 안 해도 괜찮다) */
      var ok1 = await choose(s);
      ctx.trial(ok1); flower();
      showSay(w);
      if (talk) {
        await ctx.say('"' + w + '!" 같이 말해 볼까?', { repeat: false });
        var r2 = await trySay(s, 5000);
        if (r2 && r2.ok) await ctx.cheer(G.pick(['또박또박 예쁘게 말했어!', '목소리도 고와!', '정말 잘 말했어!']));
        else await ctx.say('좋아! 다음에 또 같이 말해 보자.', { repeat: false });
      } else {
        await ctx.cheer('"' + w + '!" ' + G.pick(['고운 말이야!', '정말 예쁜 말이야!']));
      }
    }
    ctx.progress(N, N);
    ctx.extra.flowers = nice;
    ctx.finish({ msg: G.pick(['고운 말 꽃밭이 활짝 피었어! 오늘 배운 말을 집에서도 써 보자!', '고운 말을 이렇게 많이 알다니! 정말 멋져!']) });
  }
});

})();

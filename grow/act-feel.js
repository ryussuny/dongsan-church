/* ===========================================================
   함께 자라요 — 마음 (사회·정서: 감정·관계·이야기)

     checkin     오늘 기분        오늘의 놀이 첫 칸 — 기분 고르기, 힘든 마음엔 진정 방법 고르기
     emotion     감정 찾기        "기쁜 얼굴을 찾아봐" — 표정 읽기 + 몸 신호
     situation   이럴 땐 어떤 기분? 상황 → 감정, 그리고 마음을 말로 하는 법
     facemirror  표정 따라 하기   앞 카메라 거울 + 부모 판정 (카메라 없어도 된다)
     stories     사회 이야기      병원·미용실·차례 기다리기… 미리 보면 덜 불안하다

   ▸ 아이가 고른 기분은 고치지 않는다 — "그랬구나" 하고 받아 준다.
   ▸ 맞고 틀림이 있는 놀이(emotion·situation·facemirror)만 ctx.trial 을 쓴다.
     처음 틀리면 한 번만 기록하고, 두 번째에는 정답이 빛난다(실패 없는 배움).
   ▸ checkin 은 ctx.extra.emo 에 기분을 남긴다 → 부모 화면 「기분 체크」.
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;
if (!G || !D) return;

/* ---------- 마음 낱말 ---------- */
var ADJ = { happy: '기쁜', sad: '슬픈', angry: '화난', scared: '무서운', surprised: '놀란', sleepy: '졸린', calm: '편안한', hurt: '아픈', love: '사랑하는', shy: '부끄러운' };
var WHEN = { happy: '기쁠 땐', sad: '슬플 땐', angry: '화날 땐', scared: '무서울 땐', surprised: '놀랄 땐', sleepy: '졸릴 땐', calm: '편안할 땐', hurt: '아플 땐', love: '사랑할 땐', shy: '부끄러울 땐' };
var HARD = { sad: 1, angry: 1, scared: 1, hurt: 1 };
/* 마음을 말로 — 이럴 땐 이렇게 해요 */
var COPE = {
  happy: '기쁠 땐 활짝 웃고 "좋아요!" 하고 말해요.',
  sad: '슬플 땐 엄마한테 "슬퍼요" 하고 말해요. 꼭 안아 줄 거예요.',
  angry: '화날 땐 멈추고 후~ 숨을 쉬어요. 그리고 "화났어요" 하고 말해요.',
  scared: '무서울 땐 엄마 손을 꼭 잡아요. "무서워요" 하고 말해도 돼요.',
  surprised: '깜짝 놀랐을 땐 숨을 한 번 쉬고 "깜짝이야!" 하고 말해요.',
  sleepy: '졸릴 땐 "졸려요" 하고 말하고 코~ 쉬어요.',
  calm: '편안할 땐 몸이 말랑말랑해요. 이 기분을 기억해요.',
  hurt: '아플 땐 "아파요" 하고 말하고 아픈 곳을 손으로 알려 줘요.',
  love: '사랑할 땐 "사랑해요" 하고 말하고 꼭 안아 줘요.',
  shy: '부끄러울 땐 엄마 뒤에 잠깐 숨어도 괜찮아요. 준비되면 "안녕" 해요.'
};
/* 헷갈리기 쉬운 기분끼리는 같은 문제에 내지 않는다 */
var CLOSE = { angry: ['sad'], sad: ['angry', 'hurt'], scared: ['surprised'], surprised: ['scared', 'happy'], happy: ['love', 'surprised', 'calm'],
  love: ['happy', 'calm'], calm: ['happy', 'love', 'sleepy'], hurt: ['sad'], sleepy: ['calm'], shy: [] };

function emoOf(id) { return D.EMOTIONS.filter(function (e) { return e.id === id; })[0]; }
function calm() { return !!G.settings.calm; }
function clear(ctx) { ctx.body.innerHTML = ''; }
/* 같은 것이 연달아 나오지 않게 n 개 뽑기 */
function deck(pool, n) {
  var out = [], bag = [];
  while (out.length < n) {
    if (!bag.length) bag = G.shuffle(pool);
    var x = bag.shift();
    if (out.length && out[out.length - 1] === x && pool.length > 1) { bag.push(x); continue; }
    out.push(x);
  }
  return out;
}
function faceHTML(e, showName) {
  return '<span class="ce">' + e.e + '</span><span class="cl fe-name' + (showName ? ' on' : '') + '">' + G.esc(e.name) + '</span>';
}

/* 하나 고르기 — 실패 없는 배움
   o: {items, isRight(it), render, cols, size, color, praise(it), miss1(it), answer, after(it)→Promise} */
function pickOne(ctx, o) {
  return new Promise(function (resolve) {
    var miss = 0, ch = null;
    ch = ctx.choices(o.items, {
      cols: o.cols, size: o.size, render: o.render, label: o.label, color: o.color,
      onPick: function (it, el) {
        if (o.isRight(it)) {
          if (!miss) ctx.trial(true);
          var nm = el.querySelector('.fe-name'); if (nm) nm.classList.add('on');
          ctx.cheer(o.praise(it), el).then(function () { return o.after ? o.after(it) : null; })
            .then(function () { return ctx.wait(450); }).then(function () { resolve(miss === 0); });
          return true;
        }
        miss++;
        if (miss === 1) ctx.trial(false);
        el.classList.add('dim'); el.disabled = true;
        var nm2 = el.querySelector('.fe-name'); if (nm2) nm2.classList.add('on');
        var right = ch.buttons.filter(function (b) { return o.isRight(b._item); })[0];
        var left = ch.buttons.filter(function (b) { return !b.disabled; }).length;
        if (miss >= 2 || left <= 1) {
          G.sfx.play('oops'); G.ui.wiggle(el); G.ui.hint(right);
          ctx.say(o.answer, { repeat: false });
        } else {
          ctx.oops(o.miss1(it), el);
        }
        return false;
      }
    });
  });
}

/* ---------- 모양 ---------- */
G.css('feel', `
/* 공통 — 감정 얼굴 이름은 맞힌 뒤에 보인다 */
.act-emotion .fe-name{visibility:hidden}
.act-emotion .fe-name.on{visibility:visible}

/* ── checkin ── */
.act-checkin .choice{border-bottom-width:8px}
.act-checkin .ck{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%}
.act-checkin .ck-halo{width:clamp(170px,48vw,270px);aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle,color-mix(in srgb,var(--fc) 70%,transparent) 0%,color-mix(in srgb,var(--fc) 28%,transparent) 55%,transparent 72%);
  font-size:clamp(104px,30vw,170px);line-height:1;animation:pop .6s;transition:width .4s}
.act-checkin .ck-halo span{filter:drop-shadow(0 8px 12px rgba(0,0,0,.14))}
.act-checkin .ck-name{font-family:Jua,sans-serif;font-size:clamp(28px,8vw,42px);line-height:1.2}
.act-checkin .ck.small .ck-halo{width:clamp(110px,28vw,150px);font-size:clamp(64px,17vw,92px)}
.act-checkin .ck.small .ck-name{font-size:clamp(20px,5.6vw,28px)}
.act-checkin .ck-more{width:100%;max-width:640px;display:flex;flex-direction:column;align-items:center;gap:10px}
.act-checkin .ck-more .choices{margin:6px 0}
.act-checkin .ck-act{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.act-checkin .ck-act .big{font-size:clamp(90px,26vw,150px);line-height:1.1;display:inline-block;animation:ckHug 1.6s ease-in-out infinite}
.act-checkin .ck-act b{font-family:Jua,sans-serif;font-weight:400;font-size:clamp(22px,6vw,30px)}
@keyframes ckHug{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
.act-checkin .ck-breath{display:flex;flex-direction:column;align-items:center;gap:10px}
.act-checkin .ck-ball{width:clamp(150px,42vw,240px);aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:clamp(46px,13vw,74px);
  background:radial-gradient(circle at 40% 35%,#e3f4ff,#90cdf8 55%,#5aa9ff);box-shadow:0 10px 30px rgba(90,169,255,.35);
  transform:scale(.62);transition:transform 3.8s ease-in-out}
.act-checkin .ck-ball.in{transform:scale(1);transition-duration:3.2s}
.calm .act-checkin .ck-ball{transition-property:transform!important;transition-duration:4.8s!important}
.calm .act-checkin .ck-ball.in{transition-duration:4s!important}
.act-checkin .ck-bt{font-family:Jua,sans-serif;font-weight:400;font-size:clamp(24px,6.6vw,34px)}
.act-checkin .ck-cnt{display:flex;gap:8px}
.act-checkin .ck-cnt i{width:16px;height:16px;border-radius:50%;background:var(--line)}
.act-checkin .ck-cnt i.on{background:var(--area)}
@media (max-height:560px){
  .act-checkin .ck-halo{width:120px;font-size:72px}
  .act-checkin .ck.small .ck-halo{width:84px;font-size:52px}
  .act-checkin .ck-ball{width:130px}
}

/* ── emotion ── */
.act-emotion .fe-q{width:auto;max-width:100%;margin:auto 0 8px;display:flex;align-items:center;gap:10px;background:var(--surface);border-radius:999px;padding:8px 22px 8px 14px;box-shadow:var(--shadow);
  font-family:Jua,sans-serif;font-size:clamp(22px,6vw,32px);border:3px dashed color-mix(in srgb,var(--area) 50%,transparent)}
.act-emotion .fe-q span{font-size:1.3em}
.act-emotion .fe-q b{font-weight:400;color:var(--area)}
.act-emotion .choices{margin:0 auto auto}
.act-emotion .choice{min-height:clamp(130px,32vw,220px)}
.act-emotion .fe-clue{margin:10px auto 0;max-width:560px;text-align:center;background:color-mix(in srgb,var(--area) 12%,var(--surface));border-radius:20px;padding:10px 18px;
  font-family:Jua,sans-serif;font-size:clamp(18px,4.8vw,24px);animation:pop .4s}

/* ── situation ── */
.act-situation .sit-scene{margin:auto 0 10px;display:flex;flex-direction:column;align-items:center;background:var(--surface);border-radius:30px;padding:10px 22px 14px;
  box-shadow:var(--shadow);max-width:600px;animation:pop .45s}
.act-situation .sit-e{font-size:clamp(84px,24vw,150px);line-height:1.15}
.act-situation .sit-t{font-family:Jua,sans-serif;font-size:clamp(21px,5.6vw,30px);text-align:center;line-height:1.35}
.act-situation .sit-q{color:var(--soft);font-size:clamp(14px,3.8vw,17px)}
.act-situation .choices{margin:0 auto auto}
.act-situation .sit-cope{margin:0 auto auto;max-width:600px;display:flex;align-items:center;gap:12px;background:color-mix(in srgb,var(--area) 13%,var(--surface));border-radius:24px;
  padding:12px 18px;box-shadow:var(--shadow);animation:pop .45s}
.act-situation .sit-cope .ce{font-size:clamp(54px,15vw,84px);line-height:1}
.act-situation .sit-cope p{font-family:Jua,sans-serif;font-size:clamp(18px,4.8vw,24px);line-height:1.45}

/* ── facemirror ── */
.act-facemirror .fm{flex:1;min-height:0;width:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto;grid-template-areas:"t" "c" "j";gap:10px;justify-items:center}
.act-facemirror .fm-target{grid-area:t;display:flex;align-items:center;gap:12px;background:var(--surface);border-radius:26px;padding:6px 20px 6px 12px;box-shadow:var(--shadow);
  border:4px solid var(--fc,var(--area));max-width:100%}
.act-facemirror .fm-target.show{animation:pop .45s}
.act-facemirror .fm-e{font-size:clamp(58px,16vw,96px);line-height:1.1}
.act-facemirror .fm-tt b{display:block;font-family:Jua,sans-serif;font-weight:400;font-size:clamp(22px,6vw,32px);line-height:1.2}
.act-facemirror .fm-tt small{display:block;color:var(--soft);font-size:clamp(14px,3.8vw,17px);line-height:1.4}
.act-facemirror .fm-cam{grid-area:c;position:relative;width:min(100%,640px);height:100%;min-height:160px;border-radius:30px;overflow:hidden;
  background:radial-gradient(circle at 50% 40%,#3a4a63,#1b2433);box-shadow:var(--shadow);transition:box-shadow .3s}
.act-facemirror .fm-cam video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.act-facemirror .fm-cam::before{content:'📷';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:48px;opacity:.35}
.act-facemirror .fm-cam.yay{box-shadow:0 0 0 7px var(--good),0 0 40px color-mix(in srgb,var(--good) 60%,transparent)}
.act-facemirror .fm-mini{position:absolute;right:10px;top:10px;z-index:2;width:clamp(60px,16vw,86px);aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.92);
  display:flex;align-items:center;justify-content:center;font-size:clamp(38px,10vw,56px);box-shadow:0 4px 14px rgba(0,0,0,.25)}
.act-facemirror .fm-no{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;color:#fff;padding:16px;
  background:radial-gradient(circle at 50% 40%,#dff1ff,#a9d6ff 60%,#7fb8f2)}
.act-facemirror .fm-no span{font-size:clamp(70px,20vw,120px);line-height:1.1}
.act-facemirror .fm-no b{font-family:Jua,sans-serif;font-weight:400;font-size:clamp(18px,4.8vw,24px);color:#24344a}
.act-facemirror .fm-j{grid-area:j;width:100%;min-height:76px}
.act-facemirror .fm-j .judge{margin:0}
@media (orientation:landscape) and (min-width:700px){
  .act-facemirror .fm{grid-template-columns:minmax(0,1fr) minmax(230px,330px);grid-template-rows:1fr auto;grid-template-areas:"c t" "c j";align-items:center}
  .act-facemirror .fm-target{flex-direction:column;text-align:center;padding:10px 14px}
  .act-facemirror .fm-j .judge{flex-direction:column}
  .act-facemirror .fm-j .judge .btn{max-width:none}
}
@media (orientation:landscape) and (max-height:520px){
  .act-facemirror .fm-target{padding:4px 12px}
  .act-facemirror .fm-e{font-size:48px}
  .act-facemirror .fm-j .judge{flex-direction:row}
  .act-facemirror .fm-j .judge .btn.big{min-height:52px;font-size:18px;padding:8px 10px}
}

/* ── stories ── */
.act-stories .choice .cl{font-size:clamp(14px,3.9vw,21px);line-height:1.3}
.act-stories .sy{flex:1;min-height:0;width:100%;display:flex;flex-direction:column;align-items:center;gap:10px}
.act-stories .sy-title{font-family:Jua,sans-serif;font-size:clamp(18px,5vw,24px);color:var(--soft)}
.act-stories .sy-page{flex:1;min-height:0;width:min(100%,760px);background:var(--surface);border-radius:32px;box-shadow:var(--shadow);display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:12px;padding:16px 20px;overflow:hidden;touch-action:pan-y;border-bottom:8px solid color-mix(in srgb,var(--area) 35%,transparent)}
.act-stories .sy-page.in-r{animation:syR .4s ease-out}
.act-stories .sy-page.in-l{animation:syL .4s ease-out}
@keyframes syR{from{transform:translateX(40px);opacity:0}}
@keyframes syL{from{transform:translateX(-40px);opacity:0}}
.act-stories .sy-e{font-size:clamp(84px,min(42vw,26vh),220px);line-height:1.1;cursor:pointer;filter:drop-shadow(0 8px 14px rgba(0,0,0,.12));animation:pop .6s}
.act-stories .sy-t{font-family:Jua,sans-serif;font-size:clamp(20px,5.6vw,32px);line-height:1.5;text-align:center;max-width:640px}
.act-stories .sy-nav{display:flex;align-items:center;gap:12px;width:min(100%,760px)}
.act-stories .sy-btn{flex:1;min-height:clamp(64px,16vw,80px);border-radius:24px;background:var(--surface);box-shadow:var(--shadow);font-size:clamp(28px,8vw,38px);
  font-family:Jua,sans-serif;transition:transform .1s}
.act-stories .sy-btn:active{transform:scale(.95)}
.act-stories .sy-btn:disabled{opacity:.3}
.act-stories .sy-btn.next{background:var(--area);color:#fff;box-shadow:0 5px 0 color-mix(in srgb,var(--area) 70%,#000)}
.act-stories .sy-btn.next.end{background:var(--good);box-shadow:0 5px 0 color-mix(in srgb,var(--good) 70%,#000);font-size:clamp(22px,6vw,30px)}
.act-stories .sy-n{flex:none;min-width:64px;text-align:center;font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,21px);color:var(--soft)}
/* ── 낮고 넓은 화면(휴대폰 가로) — 스크롤 없이 한눈에 ── */
@media (orientation:landscape) and (max-height:520px){
  .st-body:is(.act-checkin,.act-emotion,.act-situation,.act-stories) .choice{min-height:0;padding:6px 4px}
  .act-checkin .choices{grid-template-columns:repeat(auto-fit,minmax(110px,1fr));max-width:none}
  .st-body.act-checkin .choices .choice .ce{font-size:min(22vh,92px)}
  .st-body.act-checkin .choices.md .choice .ce{font-size:min(11vh,46px)}
  .st-body.act-checkin .choices.md .choice .cl{font-size:17px;line-height:1.3}
  .act-checkin .ck.small .ck-halo{display:none}
  .st-body.act-checkin .ck-more .choices .choice .ce{font-size:40px}
  .act-checkin .ck-act .big{font-size:72px}
  .act-emotion .fe-q{margin:0 0 6px;padding:4px 18px 4px 10px;font-size:22px}
  .st-body.act-emotion .choices .choice .ce{font-size:min(19vh,80px)}
  .act-emotion .choices{max-width:720px}
  .act-situation .sit-scene{flex-direction:row;gap:14px;padding:4px 18px;margin:0 0 6px}
  .act-situation .sit-e{font-size:64px}
  .st-body.act-situation .choices .choice .ce{font-size:min(15vh,58px)}
  .act-situation .choices{max-width:760px}
  .act-situation .sit-cope{margin:0 auto}
  .act-stories .choices{grid-template-columns:repeat(5,1fr);max-width:none}
  .st-body.act-stories .choices .choice .ce{font-size:38px}
  .st-body.act-stories .choices .choice .cl{font-size:15px}
}
@media (orientation:landscape) and (max-height:520px){
  .act-stories .sy-page{flex-direction:row;gap:18px}
  .act-stories .sy-e{font-size:96px}
  .act-stories .sy-t{text-align:left}
  .act-stories .sy-btn{min-height:54px}
}
`);

/* =================================================================
   1. 오늘 기분 — 하루 꾸러미의 첫 칸 (1분 안에)
   ================================================================= */
var REFLECT = {
  happy: ['기쁘구나! 좋은 일이 있었나 봐.', '와, 기쁘구나! 자비스도 같이 기뻐.'],
  surprised: ['깜짝 놀랐구나! 무슨 일이 있었을까?', '우와, 놀랐구나! 엄마 아빠한테 이야기해 줄래?'],
  sleepy: ['졸리구나. 오늘은 천천히, 살살 놀자.', '하암~ 졸리구나. 조금만 놀고 푹 쉬자.'],
  calm: ['편안하구나. 몸이 말랑말랑하지?', '마음이 편안하구나. 참 좋다.'],
  love: ['사랑하는 마음이구나! 자비스 마음도 따뜻해져.', '사랑해요 마음이구나! 꼭 안아 주고 싶다.'],
  shy: ['부끄럽구나. 괜찮아, 천천히 해도 돼.', '조금 부끄럽구나. 자비스가 기다려 줄게.'],
  sad: ['슬프구나. 슬플 수도 있어. 자비스가 옆에 있을게.', '마음이 슬프구나. 말해 줘서 고마워.'],
  angry: ['화가 났구나. 화날 수도 있어. 괜찮아.', '화가 났구나. 그런 마음이 들 수 있어.'],
  scared: ['무서웠구나. 괜찮아, 자비스가 같이 있을게.', '무서운 마음이구나. 이제 괜찮아.'],
  hurt: ['아프구나. 어디가 아픈지 엄마 아빠한테 알려 주자.', '아프구나. 엄마 아빠가 살펴 줄 거야.']
};
var COMFORT = [
  { id: 'hug', e: '🤗', name: '안아 줘요' },
  { id: 'breathe', e: '🌬️', name: '숨 쉬기' },
  { id: 'water', e: '💧', name: '물 마시기' },
  { id: 'ok', e: '👌', name: '괜찮아요' }
];

G.act({
  id: 'checkin', area: 'feel', title: '오늘 기분', icon: '😊', order: 1, levels: 3, needs: [], mins: 1,
  ef: ['regulate'],
  desc: '오늘 기분은 어때?',
  goal: '감정 알아차리기와 이름 붙이기(정서 어휘), 힘든 마음일 때 스스로 진정하는 방법 고르기',
  how: '아이가 고른 기분을 고치지 말고 "그랬구나" 하고 그대로 받아 주세요. 슬프거나 화난 날은 안아 주기·숨쉬기·물 마시기 중 아이가 고른 것을 실제로 함께 해 주세요. 매일 고른 기분은 부모 화면 「기분 체크」에 모여요.',
  basis: '감정 알아차리기 — 감정에 이름을 붙이면 가라앉는다(affect labeling), 스스로 진정 방법 고르기',
  offline: '저녁 식탁에서 감정 얼굴 카드로 "오늘 기분"을 하나씩 고르고 엄마 아빠 기분도 말해 주기.',
  run: function (ctx) {
    var lv = ctx.level, list = lv === 1 ? D.EMOTIONS.slice(0, 4) : lv === 2 ? D.EMOTIONS.slice(0, 6) : D.EMOTIONS.slice();
    var cols = list.length === 4 ? 2 : list.length === 6 ? 3 : 4;
    ctx.say(G.pick(['오늘 기분이 어때?', G.callName() + ', 오늘 기분이 어때?', '지금 마음은 어떤 얼굴이야?']) + ' 하나 골라 봐.');
    var ch = ctx.choices(list, {
      cols: cols, size: list.length > 6 ? 'md' : list.length > 4 ? 'lg' : 'xl', color: function (e) { return e.col; },
      onPick: function (e) {
        ctx.extra.emo = e.id;
        G.voice.stop();
        ctx.timeout(function () { reflect(e); }, 350);
        return true;
      }
    });
    if (list.length > 6 && innerWidth >= 700) ch.el.style.gridTemplateColumns = 'repeat(5,1fr)';

    function reflect(e) {
      clear(ctx);
      var v = G.el('<div class="ck"><div class="ck-halo"><span>' + e.e + '</span></div><div class="ck-name">' + G.esc(e.name) + '</div><div class="ck-more"></div></div>');
      v.querySelector('.ck-halo').style.setProperty('--fc', e.col);
      ctx.body.appendChild(v);
      var more = v.querySelector('.ck-more');
      if (HARD[e.id]) G.sfx.play('ding');
      else { G.sfx.play('good'); var c = G.fx.center(v.querySelector('.ck-halo')); G.fx.burst(c[0], c[1], ['💗', '✨', '⭐']); }
      ctx.say(G.pick(REFLECT[e.id] || ['그렇구나. 말해 줘서 고마워.'])).then(function () {
        if (!HARD[e.id]) { return ctx.wait(350).then(function () { ctx.finish({ msg: (ADJ[e.id] || '오늘') + ' 마음을 알려 줘서 고마워!' }); }); }
        v.classList.add('small');
        ctx.say('안아 줄까? 숨 쉬어 볼까? 물 마실까?');
        G.ui.choices(more, COMFORT, {
          cols: 4, size: 'md',
          onPick: function (k) { G.voice.stop(); ctx.timeout(function () { comfort(k, more); }, 250); return true; }
        });
      });
    }
    function comfort(k, box) {
      box.innerHTML = '';
      ctx.extra.comfort = k.id;
      var step;
      if (k.id === 'hug') step = waitBtn(box, '<div class="ck-act"><span class="big">🤗</span><b>꼬옥~</b></div>', '💗 꼭 안았어요', '엄마 아빠, 꼭 안아 주세요! 꼬옥~', 12000);
      else if (k.id === 'water') step = waitBtn(box, '<div class="ck-act"><span class="big">🥤</span><b>꿀꺽꿀꺽</b></div>', '💧 마셨어요', '물 한 모금 마시고 올까? 꿀꺽꿀꺽!', 15000);
      else if (k.id === 'breathe') step = breathe(box);
      else step = ctx.say('그래, 괜찮구나. 힘들면 언제든지 말해 줘.', { repeat: false });
      step.then(function () {
        return ctx.say(G.pick(['조금 나아졌어? 언제든지 마음을 말해 줘.', '잘했어. 마음을 돌보는 법을 알았네!', '마음이 조금 편안해졌지? 자비스가 늘 들어 줄게.']), { repeat: false });
      }).then(function () { ctx.finish({ msg: '마음을 말해 줘서 고마워. 정말 용감해!' }); });
    }
    /* 부모가 누르거나, 시간이 지나면 다음으로 */
    function waitBtn(box, html, label, line, ms) {
      return new Promise(function (done) {
        box.insertAdjacentHTML('beforeend', html);
        var b = G.el('<button type="button" class="btn big"></button>'); b.textContent = label; box.appendChild(b);
        var fin = false; function go() { if (fin) return; fin = true; G.sfx.play('good'); done(); }
        b.onclick = function () { G.sfx.play('tap'); go(); };
        ctx.say(line); ctx.timeout(go, ms);
      });
    }
    /* 꽃 냄새 흡~, 촛불 후~ 세 번 */
    function breathe(box) {
      return new Promise(function (done) {
        box.innerHTML = '<div class="ck-breath"><div class="ck-ball">🌸</div><b class="ck-bt">준비~</b><div class="ck-cnt"><i></i><i></i><i></i></div></div>';
        var ball = box.querySelector('.ck-ball'), label = box.querySelector('.ck-bt'), dots = G.$$('.ck-cnt i', box);
        var IN = calm() ? 4000 : 3200, OUT = calm() ? 4800 : 3800, k = 0;
        function cycle() {
          if (k >= 3) { label.textContent = '잘했어! 🌿'; done(); return; }
          ball.textContent = '🌸'; label.textContent = '코로 흡~'; ball.classList.add('in');
          ctx.say('코로 흡~', { repeat: false });
          ctx.timeout(function () {
            ball.textContent = '🕯️'; label.textContent = '입으로 후~'; ball.classList.remove('in');
            ctx.say('입으로 후~', { repeat: false });
            dots[k].classList.add('on'); k++;
            ctx.timeout(cycle, OUT);
          }, IN);
        }
        ctx.say('꽃 냄새를 맡듯 코로 흡~, 촛불을 끄듯 입으로 후~. 세 번 같이 해 보자.').then(cycle);
      });
    }
  }
});

/* =================================================================
   2. 감정 찾기 — 표정 읽기
   ================================================================= */
G.act({
  id: 'emotion', area: 'feel', title: '감정 찾기', icon: '🎭', order: 10, levels: 3, needs: [], mins: 2,
  ef: ['attend', 'wm'],
  desc: '기쁜 얼굴, 슬픈 얼굴 찾기',
  goal: '얼굴 표정 읽기(정서 인식), 감정 낱말 이해, 표정과 몸 신호 잇기',
  how: '찾고 나면 거울 앞에서 같은 얼굴을 함께 지어 보세요. "입꼬리가 올라갔네!"처럼 얼굴 어디가 달라지는지 짚어 주면 표정 읽기가 쉬워져요. 틀려도 괜찮아요 — 자비스가 그 얼굴 이름을 알려 주고, 두 번째에는 정답이 반짝여요.',
  basis: '얼굴 표정 재인 — 사회 인지·마음 읽기의 첫걸음',
  offline: '그림책 속 인물 얼굴을 보며 "이 친구 기분은 어때?" 하고 묻기.',
  run: async function (ctx) {
    var lv = ctx.level, N = 6, k = lv + 1;
    var pool = D.EMOTIONS.filter(function (e) { return e.lv <= lv; });
    var targets = deck(pool, N);
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      var t = targets[i];
      var others = G.sample(pool.filter(function (e) { return e !== t && (CLOSE[t.id] || []).indexOf(e.id) < 0; }), k - 1);
      if (others.length < k - 1) others = others.concat(G.sample(pool.filter(function (e) { return e !== t && others.indexOf(e) < 0; }), k - 1 - others.length));
      var q = G.el('<div class="fe-q"><span>🔍</span><span><b></b> 얼굴은 어디?</span></div>');
      q.querySelector('b').textContent = ADJ[t.id];
      ctx.body.appendChild(q);
      ctx.say(i === 0 ? ADJ[t.id] + ' 얼굴을 찾아봐!' : G.pick([ADJ[t.id] + ' 얼굴은 어디 있을까?', ADJ[t.id] + ' 얼굴을 찾아 줘!', '이번엔 ' + ADJ[t.id] + ' 얼굴!']));
      await pickOne(ctx, (function (t) {
        return {
          items: G.shuffle([t].concat(others)), cols: k > 3 ? 4 : k, size: k > 3 ? 'md' : 'lg',
          render: function (e) { return faceHTML(e, false); },
          isRight: function (e) { return e === t; },
          praise: function () { return G.pick(['맞아! ' + ADJ[t.id] + ' 얼굴!', '딩동댕! ' + ADJ[t.id] + ' 얼굴이야!', '찾았다! ' + ADJ[t.id] + ' 얼굴!']); },
          miss1: function (e) { return '이건 ' + ADJ[e.id] + ' 얼굴이야. ' + ADJ[t.id] + ' 얼굴은 어디 있을까?'; },
          answer: '여기 있어! 반짝이는 얼굴이 ' + ADJ[t.id] + ' 얼굴이야.',
          after: function () {
            var clue = WHEN[t.id] + ' ' + t.body + '.';
            var c = G.el('<div class="fe-clue"></div>'); c.textContent = t.e + ' ' + clue;
            ctx.body.appendChild(c);
            return ctx.say(clue, { repeat: false });
          }
        };
      })(t));
    }
    ctx.progress(N, N);
    ctx.finish({ msg: G.pick(['마음 얼굴을 척척 찾았어! 표정 박사다!', '얼굴만 봐도 마음을 아는구나! 정말 멋져!']) });
  }
});

/* =================================================================
   3. 이럴 땐 어떤 기분? — 상황과 감정 잇기, 마음을 말로
   ================================================================= */
G.act({
  id: 'situation', area: 'feel', title: '이럴 땐 어떤 기분?', icon: '🤔', order: 20, levels: 3, needs: [], mins: 3,
  ef: ['regulate', 'shift'],
  desc: '이럴 땐 어떤 기분일까?',
  goal: '상황과 감정 잇기(마음 읽기의 기초), 감정을 말로 표현하고 도움 청하는 말 배우기',
  how: '"너라면 어떤 기분일 것 같아?" 하고 물어 주세요. 아이가 다른 기분을 골라도 "그럴 수도 있겠다" 하고 받아 준 뒤 이야기를 나눠요. 자비스가 알려 주는 말("슬퍼요", "화났어요")을 같이 따라 말해 보세요.',
  basis: '상황-감정 이해와 대처 말 연습 — 사회정서학습(SEL)·마음 이론의 기초',
  offline: '오늘 있었던 일을 이야기하며 "그때 어떤 기분이었어?" 묻고 기분 이름을 말해 주기.',
  run: async function (ctx) {
    var lv = ctx.level, N = 5, k = lv + 1;
    var maxEmo = lv;
    var emos = D.EMOTIONS.filter(function (e) { return e.lv <= maxEmo; });
    var pool = D.SITUATIONS.filter(function (s) { var e = emoOf(s.a); return e && (s.lv || 1) <= lv && e.lv <= maxEmo; });
    var items = G.sample(pool, Math.min(N, pool.length));
    N = items.length;
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      var s = items[i], ans = emoOf(s.a);
      var far = emos.filter(function (e) { return e !== ans && (CLOSE[ans.id] || []).indexOf(e.id) < 0; });
      var opts = [ans].concat(G.sample(far, k - 1));
      var scene = G.el('<div class="sit-scene"><div class="sit-e">' + s.e + '</div><div class="sit-t"></div><div class="sit-q">어떤 기분일까?</div></div>');
      scene.querySelector('.sit-t').textContent = s.t;
      ctx.body.appendChild(scene);
      ctx.say(s.t + '. ' + (i === 0 ? '이럴 땐 어떤 기분일까?' : G.pick(['어떤 기분일까?', '이럴 땐 마음이 어떨까?'])));
      await pickOne(ctx, (function (ans) {
        return {
          items: G.shuffle(opts), cols: opts.length > 3 ? 4 : opts.length, size: opts.length > 3 ? 'md' : 'lg',
          color: function (e) { return e.col; },
          render: function (e) { return faceHTML(e, true); },
          isRight: function (e) { return e === ans; },
          praise: function () { return G.pick(['맞아, ' + ans.name + '!', '그렇지! ' + ans.name + '!', '마음을 잘 알아주는구나!']); },
          miss1: function () { return G.pick(['음, 그럴 수도 있겠다. 다른 얼굴도 볼까?', '그런 마음이 들 수도 있어. 또 어떤 마음일까?']); },
          answer: '이럴 땐 ' + ADJ[ans.id] + ' 마음이 들어. 반짝이는 얼굴을 눌러 봐.',
          after: function () {
            var ch = G.$('.choices', ctx.body); if (ch) ch.remove();
            var c = G.el('<div class="sit-cope"><span class="ce">' + ans.e + '</span><p></p></div>');
            c.querySelector('p').textContent = COPE[ans.id];
            ctx.body.appendChild(c);
            return ctx.say(COPE[ans.id], { repeat: false }).then(function () { return ctx.wait(400); });
          }
        };
      })(ans));
    }
    ctx.progress(N, N);
    ctx.finish({ msg: G.pick(['친구 마음을 잘 알아주었어! 마음 박사다!', '마음을 말로 하는 법도 배웠네! 정말 멋져!']) });
  }
});

/* =================================================================
   4. 표정 따라 하기 — 앞 카메라 거울
   ================================================================= */
G.act({
  id: 'facemirror', area: 'feel', title: '표정 따라 하기', icon: '🤳', order: 30, levels: 1, needs: ['cam'], mins: 2,
  ef: ['attend', 'regulate'],
  desc: '거울 보고 표정 따라 하기',
  goal: '표정 모방(얼굴 근육 조절), 감정과 표정 잇기, 거울 속 나를 보며 자기 인식',
  how: '부모도 아이 옆에서 같은 표정을 크게 지어 보여 주세요. 비슷하기만 해도 "👍 했어요"를 눌러 주세요 — 따라 하려고 한 것이 중요해요. 카메라 화면은 저장되지도, 어디로 보내지지도 않아요.',
  basis: '표정 모방 — 거울 놀이, 모방은 사회적 의사소통의 기초',
  offline: '거울 앞에서 엄마와 번갈아 표정을 짓고 "무슨 기분일까?" 맞히기.',
  run: function (ctx) {
    var B = ctx.body;
    B.innerHTML = '<div class="fm"><div class="fm-target"></div><div class="fm-cam"><video playsinline muted autoplay></video><div class="fm-mini"></div></div><div class="fm-j"></div></div>';
    var video = G.$('video', B), cam = G.$('.fm-cam', B), tg = G.$('.fm-target', B), mini = G.$('.fm-mini', B), jbox = G.$('.fm-j', B);
    function noCam() {
      if (G.$('.fm-no', cam)) return;
      video.remove();
      cam.insertAdjacentHTML('afterbegin', '<div class="fm-no"><span>🪞</span><b>엄마 아빠 얼굴을 보며 같이 해 봐요!</b></div>');
    }
    if (G.has.cam) ctx.camera(video).catch(noCam); else noCam();
    var list = [emoOf('happy')].concat(G.sample(['sad', 'angry', 'surprised', 'scared', 'sleepy', 'love'], 4).map(emoOf));
    var N = list.length;

    function show(e) {
      tg.style.setProperty('--fc', e.col);
      tg.innerHTML = '<span class="fm-e">' + e.e + '</span><span class="fm-tt"><b></b><small></small></span>';
      tg.querySelector('b').textContent = ADJ[e.id] + ' 얼굴';
      tg.querySelector('small').textContent = e.body;
      mini.textContent = e.e;
      tg.classList.remove('show'); void tg.offsetWidth; tg.classList.add('show');
      G.sfx.play('pop');
    }
    function yay(e) {
      cam.classList.add('yay');
      return ctx.cheer(G.pick(['와, ' + ADJ[e.id] + ' 얼굴이다! 똑같아!', '우와, 진짜 ' + ADJ[e.id] + ' 얼굴 같아!', '표정 배우 같아! 최고야!'])).then(function () { cam.classList.remove('yay'); });
    }
    (async function () {
      for (var i = 0; i < N; i++) {
        var e = list[i];
        ctx.progress(i, N);
        show(e);
        await ctx.say((i === 0 ? '거울을 봐! 자비스랑 표정 놀이 하자. ' : '') + ADJ[e.id] + ' 얼굴 해 볼까? ' + e.body + '!');
        var ok = await ctx.parentJudge(jbox, ['👍 했어요', '🔁 다시']);
        if (ok) { ctx.trial(true); await yay(e); continue; }
        ctx.trial(false);
        await ctx.say(G.pick(['같이 해 보자! ', '한 번 더! ']) + e.body + '. 하나, 둘, 셋!');
        ok = await ctx.parentJudge(jbox, ['👍 했어요', '⏭️ 다음']);
        if (ok) await yay(e);
        else await ctx.say('괜찮아! 다음 얼굴도 재미있어.', { repeat: false });
      }
      ctx.progress(N, N);
      ctx.finish({ msg: '표정을 ' + ['', '한', '두', '세', '네', '다섯'][N] + ' 가지나 따라 했어! 거울 놀이 최고!' });
    })();
  }
});

/* =================================================================
   5. 사회 이야기 — 미리 보면 덜 불안해요
   ================================================================= */
G.act({
  id: 'stories', area: 'feel', title: '사회 이야기', icon: '📖', order: 40, levels: 1, needs: [], mins: 3,
  ef: ['plan', 'regulate'],
  desc: '그림 이야기 듣기',
  goal: '처음 가는 곳·힘든 상황을 미리 보고 덜 불안해하기, 상황에 맞는 행동과 순서 알기',
  how: '병원·미용실처럼 처음 가는 곳은 가기 전날과 당일 아침에 함께 읽어 주세요. 한 장씩 천천히 넘기며 아이가 그림을 가리키면 기다려 주세요. 실제로 해낸 뒤 "이야기처럼 해냈네!" 하고 다시 읽으면 자신감이 생겨요.',
  basis: '사회 이야기(Social Stories, Carol Gray) — 미리 알면 불안이 줄어든다',
  offline: '병원·미용실 가기 전날 이야기를 다시 읽고 인형으로 역할 놀이하기.',
  run: function (ctx) {
    ctx.say(G.pick(['어떤 이야기를 볼까? 하나 골라 봐!', '오늘은 무슨 이야기를 들어 볼까?']));
    ctx.choices(D.STORIES, {
      cols: 3, size: 'md',
      render: function (s) { return '<span class="ce">' + s.e + '</span><span class="cl">' + G.esc(s.title) + '</span>'; },
      onPick: function (s) { G.voice.stop(); ctx.timeout(function () { read(s); }, 250); return true; }
    });

    function read(s) {
      clear(ctx);
      ctx.body.innerHTML = '<div class="sy"><div class="sy-title"></div><div class="sy-page"></div>' +
        '<div class="sy-nav"><button type="button" class="sy-btn prev" aria-label="앞 장">◀</button><span class="sy-n"></span><button type="button" class="sy-btn next" aria-label="다음 장">▶</button></div></div>';
      var title = G.$('.sy-title', ctx.body), page = G.$('.sy-page', ctx.body), num = G.$('.sy-n', ctx.body);
      var prev = G.$('.prev', ctx.body), next = G.$('.next', ctx.body);
      var i = 0, N = s.pages.length, token = 0, ending = false;
      title.textContent = s.e + ' ' + s.title;

      function show(dir) {
        var p = s.pages[i], my = ++token;
        ctx.progress(i, N);
        page.className = 'sy-page ' + (dir < 0 ? 'in-l' : 'in-r');
        page.innerHTML = '<div class="sy-e">' + p.e + '</div><p class="sy-t"></p>';
        page.querySelector('.sy-t').textContent = p.t;
        page.querySelector('.sy-e').onclick = function () { G.sfx.play('tap'); ctx.say(p.t); };
        num.textContent = (i + 1) + ' / ' + N;
        prev.disabled = i === 0;
        var last = i === N - 1;
        next.textContent = last ? '✔ 끝!' : '▶';
        next.classList.toggle('end', last);
        next.setAttribute('aria-label', last ? '이야기 끝' : '다음 장');
        G.sfx.play(last ? 'sparkle' : 'tap');
        ctx.say(p.t).then(function () { if (my === token) G.ui.hint(next); });
      }
      function go(d) {
        if (ending) return;
        if (d > 0 && i === N - 1) { end(); return; }
        var ni = G.clamp(i + d, 0, N - 1); if (ni === i) return;
        i = ni; show(d);
      }
      function end() {
        ending = true;
        ctx.progress(N, N);
        ctx.cheer(G.pick(['이야기 끝! 끝까지 잘 들었어!', '와, 마지막 장까지 다 봤다!'])).then(function () {
          ctx.finish({ msg: '「' + s.title + '」 이야기를 끝까지 들었어! 정말 멋져!' });
        });
      }
      prev.onclick = function () { G.sfx.play('tap'); go(-1); };
      next.onclick = function () { G.sfx.play('tap'); go(1); };
      /* 옆으로 밀어 넘기기 */
      var sx = null;
      page.addEventListener('pointerdown', function (e) { sx = e.clientX; });
      page.addEventListener('pointerup', function (e) {
        if (sx == null) return; var dx = e.clientX - sx; sx = null;
        if (dx < -60) go(1); else if (dx > 60) go(-1);
      });
      show(1);
    }
  }
});
})();

/* ===========================================================
   함께 자라요 — 말하기 (언어치료: 말·듣기·입 운동)

     words     낱말 카드        표현 어휘 — 보고 따라 말하기, 3단계는 두 낱말 잇기
     listen    듣고 찾기        수용 어휘 — 이름을 듣고 그림 고르기
     sounds    누구 소리일까?   소리흉내말 — 듣고 찾기, 3단계는 직접 흉내 내기
     voice     소리 내기        발성·호흡 — 목소리를 길게 내면 로켓이 날아간다
     mouth     입 운동 거울     구강 운동 모방 — 거울(앞 카메라)로 보며 따라 하기
     follow    지시 따르기      1단계 지시 → 꾸밈말+이름 → 두 단계 지시
     syllable  말소리 북치기    음운 인식 — 한 소리에 북 한 번
     talkboard 말판 (도구)      보완대체의사소통(AAC) — 그림을 눌러 말하기

   ▸ '말해야 넘어가는' 놀이가 아니다. 소리만 내도 칭찬하고, 음성 인식이 없거나
     못 알아들으면 부모가 「말했어요」를 눌러 준다. 아이 화면에는 틀림이 없다.
   ▸ 아이가 말하면 자비스가 한 낱말 더해 넓혀 들려준다(확장하기: "사과" → "빨간 사과!").
   ▸ 알아들은 말은 G.noteSaid 로 부모 화면 「말한 낱말」에 쌓인다(기기에만).
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;
if (!G || !D) return;

/* ---------- 작은 도구 ---------- */
function calm() { return !!G.settings.calm; }
function pace(ms) { return Math.round(ms * (calm() ? 1.3 : 1)); }
function acc(w) { return G.josa(w, '을', '를'); }
function subj(w) { return G.josa(w, '이', '가'); }
function topic(w) { return G.josa(w, '은', '는'); }
function isYa(w) { return G.josa(w, '이야', '야'); }
function clear(ctx) { ctx.body.innerHTML = ''; }
function hangul(w) { return String(w || '').replace(/[^가-힣]/g, ''); }
function wrapEl(ctx, html) { var w = G.el('<div class="sp">' + (html || '') + '</div>'); ctx.body.appendChild(w); return w; }

/* 낱말 고르기 — 동작 낱말은 빼고, 같은 그림은 한 번만 */
function wordPool(maxLv, o) {
  o = o || {};
  var seen = {};
  return D.WORDS.filter(function (w) {
    if (w.c === 'action' || w.lv > maxLv) return false;
    if (o.cats && o.cats.indexOf(w.c) < 0) return false;
    if (o.sound && !w.s) return false;
    if (seen[w.e]) return false;
    seen[w.e] = 1; return true;
  });
}
/* 따라 말하기 쉽게 나누기: '사과' → ['사','과'], '아기가 자요' → ['아기가','자요'] */
function chunksOf(w) {
  w = String(w || '').trim();
  var h = hangul(w);
  if (/\s/.test(w) || h.length > 4 || h.length !== w.length) return w.split(/\s+/).filter(Boolean);
  return h.split('');
}
/* 확장하기 — 아이가 말한 낱말에 한 낱말 더해 돌려준다 */
var COL_FULL = { '보라': '보라색', '초록': '초록색', '주황': '주황색', '분홍': '분홍색' };
function expand(w) {
  if (!w || !w.w) return '';
  var col = w.col ? (COL_FULL[w.col] || w.col) : '', moving = w.c === 'animal' || w.c === 'vehicle';
  if (w.s && moving) return (col ? col + ' ' : '') + subj(w.w) + ' ' + w.s + '!';
  if (w.s && col) return col + ' ' + w.w + '! ' + w.s + '!';
  if (w.s) return w.s + ' ' + w.w + '!';
  if (col) return col + ' ' + w.w + '!';
  return '';
}

/* ---------- 말하기 한 차례 ----------
   들어 보고 → 못 들었으면 자비스가 다시 들려주고, 부모 단추를 보여 주며 한 번 더 듣는다.
   음성 인식이 없거나 막혔으면 바로 부모 단추.
   o: {box, expect:[낱말], lenient(소리만 내도 맞음), again()→Promise, labels}
   → Promise<{ok, heard, said, judged}> */
var sttOff = false;      // 이 기기에서 음성 인식이 안 되면, 다시 열 때까지 부모 단추로
function sttReady() { return G.has.stt && !sttOff; }

function speakTurn(ctx, o) {
  var box = o.box;
  var row = G.el('<div class="sp-talk"><button class="mic-btn sp-mic" type="button" aria-label="다시 말하기">🎤</button><div class="heard"></div></div>');
  box.appendChild(row);
  var mic = row.querySelector('.sp-mic'), heard = row.querySelector('.heard');
  var done = false, judgeEl = null, token = 0;
  return new Promise(function (resolve) {
    function finish(r) {
      if (done) return; done = true; token++;
      G.stopListen();
      if (judgeEl) { judgeEl.remove(); judgeEl = null; }
      mic.disabled = true; row.classList.add('done');
      resolve(r);
    }
    function judge() {
      if (done || judgeEl) return;
      ctx.parentJudge(box, o.labels || ['👍 말했어요(소리만 내도)', '➡️ 다음에']).then(function (yes) {
        judgeEl = null; finish({ ok: yes, judged: true, heard: false, said: '' });
      });
      judgeEl = box.lastElementChild;
    }
    function off() { sttOff = true; mic.hidden = true; heard.textContent = ''; }
    function listenOnce() {
      if (!sttReady() || done) return Promise.resolve(null);
      var my = ++token;
      heard.textContent = '듣고 있어요… 👂';
      return ctx.listen({ expect: o.expect, onInterim: function (t) { if (my === token && t) heard.textContent = '“' + t + '”'; } }).then(function (res) {
        if (my !== token || done) return null;
        if (res.denied || res.unsupported || /network|audio-capture|not-allowed|service|language|start/.test(res.error || '')) { off(); return null; }
        if (!res.heard) { heard.textContent = ''; return null; }
        heard.textContent = '“' + res.text + '”';
        ctx.extra.spoken = (ctx.extra.spoken || 0) + 1;
        if (G.noteSaid) try { G.noteSaid(res.text, (o.expect || [])[0]); } catch (e) {}
        return res;
      });
    }
    function handle(res, n) {
      var match = !!(res.ok || o.lenient);
      if (match || n >= 2) { finish({ ok: match, heard: true, said: res.text, score: res.score }); return; }
      second();
    }
    /* 두 번째: 다시 들려주고 → 부모 단추를 띄운 채 한 번 더 듣기 */
    function second() {
      if (done) return;
      Promise.resolve(o.again && sttReady() ? o.again() : null).then(function () {
        if (done) return;
        judge();
        listenOnce().then(function (res) { if (res) handle(res, 2); });
      });
    }
    mic.onclick = function () {
      if (done) return;
      G.sfx.play('tap'); G.voice.stop();
      listenOnce().then(function (res) { if (res) handle(res, 2); });
    };
    if (!sttReady()) { mic.hidden = true; judge(); return; }
    listenOnce().then(function (res) {
      if (done) return;
      if (res) handle(res, 1);
      else if (!sttReady()) judge();
      else second();
    });
  });
}

/* ---------- 그림 고르기 한 문제 — 실패 없는 배움 ----------
   틀리면 살짝 흔들리고 흐려진다. 두 번째에는 정답이 빛나고 자비스가 답을 말한다.
   기록은 한 문제에 한 번(처음 틀릴 때만 trial(false)).
   o: {box, items, isRight, render, label, cols, size, praise, retry(it), answer, onRight(it,el), after(it,el), idle} */
function pickOne(ctx, o) {
  return new Promise(function (resolve) {
    var miss = 0, ch = null, idleN = 0, idleH = null, done = false;
    function val(v, it) { return typeof v === 'function' ? v(it) : v; }
    function rightBtn() { return ch.buttons.filter(function (b) { return o.isRight(b._item); })[0]; }
    function idle() {
      clearTimeout(idleH);
      if (!o.idle) return;
      idleH = ctx.timeout(function () {
        if (done) return;
        idleN++;
        if (idleN >= 2) G.ui.hint(rightBtn());
        ctx.say(val(o.idle), { repeat: false });
        idle();
      }, pace(11000));
    }
    ch = G.ui.choices(o.box || ctx.body, o.items, {
      cols: o.cols, size: o.size, render: o.render, label: o.label, color: o.color,
      onPick: function (it, el) {
        if (done) return true;
        idle();
        if (o.isRight(it)) {
          done = true; clearTimeout(idleH);
          if (!miss) ctx.trial(true);
          if (o.onRight) o.onRight(it, el);
          ctx.cheer(val(o.praise, it), el)
            .then(function () { return o.after ? o.after(it, el) : null; })
            .then(function () { return ctx.wait(pace(400)); })
            .then(function () { resolve(miss === 0); });
          return true;
        }
        miss++;
        if (miss === 1) ctx.trial(false);
        el.classList.add('dim'); el.disabled = true;
        var left = ch.buttons.filter(function (b) { return !b.disabled; }).length;
        if (miss >= 2 || left <= 1) {
          G.sfx.play('oops'); G.ui.wiggle(el); G.ui.hint(rightBtn());
          ctx.say(val(o.answer, it), { repeat: false });
        } else {
          ctx.oops(val(o.retry, it), el);
        }
        return false;
      }
    });
    idle();
  });
}

/* ---------- 모양 ---------- */
G.css('speech', `
:is(.act-words,.act-listen,.act-sounds,.act-voice,.act-mouth,.act-follow,.act-syllable) .sp{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:clamp(6px,1.6vh,14px);width:100%;min-height:0}
:is(.act-words,.act-listen,.act-sounds,.act-voice,.act-mouth,.act-follow,.act-syllable) .judge{width:100%;margin:4px 0 0}
:is(.act-words,.act-listen,.act-sounds,.act-voice,.act-mouth,.act-follow,.act-syllable) .judge .btn{font-size:clamp(16px,4.3vw,21px);padding:12px 14px;line-height:1.25}
:is(.act-words,.act-listen,.act-sounds,.act-follow) .choices{margin:0}
@keyframes spIn{from{transform:scale(.6) rotate(-6deg);opacity:0}}
@keyframes spBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes spJump{0%,100%{transform:translateY(0)}35%{transform:translateY(-22px) scale(1.08)}65%{transform:translateY(0) scale(.96)}}

/* 말하기 차례 — 마이크·들은 말 */
.sp-talk{display:flex;flex-direction:column;align-items:center;gap:2px}
.sp-talk .mic-btn{width:clamp(70px,min(20vw,12vh),108px);height:clamp(70px,min(20vw,12vh),108px);font-size:clamp(30px,min(9vw,6vh),48px);margin:4px auto 6px}
.sp-talk.done .mic-btn{opacity:.3;animation:none}
.sp-talk .heard{font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,22px);min-height:30px;color:var(--soft);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* ── words ── */
.act-words .wd-card{position:relative;background:var(--surface);border-radius:32px;box-shadow:var(--shadow);padding:8px clamp(18px,5vw,34px) 12px;display:flex;flex-direction:column;
  align-items:center;max-width:min(100%,560px);animation:spIn .45s;transition:box-shadow .3s}
.act-words .wd-card.right{box-shadow:0 0 0 6px var(--good),var(--shadow)}
.act-words .wd-pic{font-size:clamp(100px,min(42vw,25vh),220px);line-height:1.15;filter:drop-shadow(0 8px 12px rgba(0,0,0,.12))}
.act-words .wd-pic.two{font-size:clamp(76px,min(30vw,19vh),170px);line-height:1.25;letter-spacing:4px;white-space:nowrap}
.act-words .wd-photo{width:clamp(150px,min(54vw,30vh),290px);aspect-ratio:1;object-fit:cover;border-radius:24px;margin-top:6px;display:block}
.act-words .wd-word{font-family:Jua,sans-serif;font-size:clamp(32px,9vw,58px);line-height:1.3;display:flex;gap:2px 10px;flex-wrap:wrap;justify-content:center;letter-spacing:1px}
.act-words .wd-word.syl{gap:2px}
.act-words .wd-word span{display:inline-block;border-radius:14px;padding:0 4px;transition:transform .15s,color .15s,background .15s}
.act-words .wd-word span.on{color:var(--area);background:color-mix(in srgb,var(--area) 14%,transparent);transform:scale(1.15)}
.act-words .wd-tag{position:absolute;top:-10px;right:-6px;background:var(--area);color:#fff;border-radius:999px;padding:2px 10px;font-size:13px;font-family:Jua,sans-serif}

/* ── listen ── */
.act-listen .ls-ear,.act-follow .fo-ear{display:flex;align-items:center;gap:8px;background:var(--surface);border-radius:999px;box-shadow:var(--shadow);padding:6px 18px 6px 10px;
  font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,22px)}
.act-listen .ls-ear span,.act-follow .fo-ear span{font-size:clamp(34px,9vw,48px);line-height:1;display:inline-block}
.act-listen .ls-ear.talk span,.act-follow .fo-ear.talk span{animation:spBob .7s ease-in-out infinite}
.act-listen .choices,.act-sounds .choices,.act-follow .choices{max-width:min(100%,720px)}
.act-listen .choices.c2,.act-sounds .choices.c2,.act-follow .choices.c2{max-width:min(100%,560px)}
.act-listen .choice,.act-sounds .choice,.act-follow .choice{min-height:clamp(120px,min(34vw,21vh),200px)}
.act-listen .choice .ce,.act-sounds .choice .ce,.act-follow .choice .ce{font-size:clamp(56px,min(17vw,13vh),112px);line-height:1.1}
.act-listen .choice.jump,.act-follow .choice.jump{animation:spJump .6s}

/* ── sounds ── */
.act-sounds .sd-box{position:relative;width:clamp(150px,min(46vw,28vh),240px);aspect-ratio:1;border-radius:36px;background:var(--surface);box-shadow:var(--shadow);
  display:flex;align-items:center;justify-content:center;border:5px dashed color-mix(in srgb,var(--area) 50%,transparent);transition:border-color .3s}
.act-sounds .sd-q{font-size:clamp(70px,min(22vw,14vh),120px);line-height:1;transition:transform .3s}
.act-sounds .sd-box.open{border-style:solid;border-color:var(--good)}
.act-sounds .sd-box.open .sd-q{animation:spIn .45s}
.act-sounds .sd-w{position:absolute;right:-6px;top:50%;transform:translateY(-50%);width:36px;height:70px;pointer-events:none}
.act-sounds .sd-w i{position:absolute;top:50%;left:0;border:4px solid var(--area);border-color:transparent var(--area) transparent transparent;border-radius:50%;opacity:0;transform:translateY(-50%)}
.act-sounds .sd-w i:nth-child(1){width:24px;height:24px}
.act-sounds .sd-w i:nth-child(2){width:44px;height:44px;left:-10px}
.act-sounds .sd-w i:nth-child(3){width:64px;height:64px;left:-20px}
.act-sounds .sd-box.play .sd-w i{animation:sdWave 1s ease-out infinite}
.act-sounds .sd-box.play .sd-w i:nth-child(2){animation-delay:.18s}
.act-sounds .sd-box.play .sd-w i:nth-child(3){animation-delay:.36s}
@keyframes sdWave{0%{opacity:0}30%{opacity:1}100%{opacity:0}}
.act-sounds .sd-name{font-family:Jua,sans-serif;font-size:clamp(26px,7vw,40px)}

/* ── voice ── */
.act-voice .vo-sky{position:relative;flex:1;min-height:240px;width:min(100%,560px);border-radius:32px;overflow:hidden;box-shadow:var(--shadow);
  background:linear-gradient(180deg,#a9dcff 0%,#d7efff 55%,#f2faff 100%)}
.act-voice .vo-cloud{position:absolute;font-size:clamp(34px,9vw,56px);opacity:.85;pointer-events:none}
.act-voice .vo-cloud.c1{left:8%;top:34%} .act-voice .vo-cloud.c2{right:16%;top:58%;font-size:clamp(26px,7vw,42px)}
.act-voice .vo-goal{position:absolute;top:12px;left:50%;transform:translateX(-50%);font-size:clamp(50px,13vw,84px);line-height:1;transition:transform .3s}
.act-voice .vo-goal.got{animation:pop .6s;transform:translateX(-50%) scale(1.15)}
.act-voice .vo-who{position:absolute;left:50%;bottom:calc(var(--p,0) * (100% - clamp(150px,34vw,200px)) + 14px);transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;
  transition:bottom .15s linear}
.act-voice .vo-e{font-size:clamp(60px,16vw,100px);line-height:1;display:block}
.act-voice .vo-e.rot{transform:rotate(-45deg)}
.act-voice .vo-fire{font-size:clamp(24px,6vw,36px);line-height:1;opacity:0;transform:scale(.4);transition:opacity .15s,transform .15s}
.act-voice .vo-who.on .vo-fire{opacity:1;transform:scale(1)}
.act-voice .vo-fire.down{rotate:180deg}
.act-voice .vo-who.on .vo-e{animation:voShake .18s infinite alternate}
@keyframes voShake{from{translate:-1px 0}to{translate:1px 0}}
.act-voice .vo-who.fly{bottom:115%!important;transition:bottom 1s ease-in}
.act-voice .vo-meter{position:absolute;right:12px;top:18px;bottom:18px;width:14px;border-radius:9px;background:rgba(255,255,255,.55);overflow:hidden}
.act-voice .vo-meter b{position:absolute;left:0;right:0;bottom:0;height:0;border-radius:9px;background:linear-gradient(0deg,#4fc3a1,#ffd54f,#ff7f61);transition:height .08s}
.act-voice .vo-bot{display:flex;align-items:center;justify-content:center;gap:clamp(12px,4vw,26px);flex-wrap:wrap}
.act-voice .vo-mouth{display:flex;flex-direction:column;align-items:center;font-size:clamp(44px,12vw,64px);line-height:1}
.act-voice .vo-mouth small{font-size:13px;color:var(--soft);margin-top:4px}
.act-voice .vo-ring{position:relative;width:clamp(92px,24vw,124px);aspect-ratio:1}
.act-voice .vo-ring svg{width:100%;height:100%;transform:rotate(-90deg)}
.act-voice .vo-ring circle{fill:none;stroke-width:10}
.act-voice .vo-ring .bg{stroke:var(--line)}
.act-voice .vo-ring .fg{stroke:var(--area);stroke-linecap:round;stroke-dasharray:263.9;stroke-dashoffset:263.9;transition:stroke-dashoffset .12s linear}
.act-voice .vo-ring b{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Jua,sans-serif;font-weight:400;font-size:clamp(26px,7vw,36px);line-height:1}
.act-voice .vo-ring b small{font-family:'Gowun Dodum',sans-serif;font-size:13px;color:var(--soft);margin-top:4px}
.act-voice .vo-hold{touch-action:none;min-width:200px}
.act-voice .vo-hold.on{transform:scale(.96);background:var(--good)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .act-voice .vo-sky{background:linear-gradient(180deg,#1b2a52 0%,#2c3f6f 60%,#3b5186 100%)}
  :root:not([data-theme="light"]) .act-voice .vo-meter{background:rgba(255,255,255,.18)}}
:root[data-theme="dark"] .act-voice .vo-sky{background:linear-gradient(180deg,#1b2a52 0%,#2c3f6f 60%,#3b5186 100%)}
:root[data-theme="dark"] .act-voice .vo-meter{background:rgba(255,255,255,.18)}

/* ── mouth ── */
.act-mouth .mo-pair{display:grid;grid-template-columns:1fr 1fr;gap:clamp(10px,3vw,22px);width:min(100%,860px);flex:1;min-height:200px;max-height:min(58vh,540px)}
.act-mouth .mo-model,.act-mouth .mo-mirror{position:relative;border-radius:30px;box-shadow:var(--shadow);overflow:hidden;min-height:0}
.act-mouth .mo-model{background:var(--surface);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;gap:4px}
.act-mouth .mo-e{font-size:clamp(80px,min(34vw,19vh),170px);line-height:1.15;display:inline-block;margin-bottom:6px}
.act-mouth .mo-e.pulse{animation:moPulse 1.4s ease-in-out infinite}
.act-mouth .mo-e.tick{animation:moTick 1s ease-in-out infinite}
.act-mouth .mo-e.bounce{animation:moBounce .5s ease-in-out infinite}
@keyframes moPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes moTick{0%,100%{transform:translateX(-14%) rotate(-6deg)}50%{transform:translateX(14%) rotate(6deg)}}
@keyframes moBounce{0%,100%{transform:scale(1)}50%{transform:scale(.88,1.08)}}
.act-mouth .mo-n{font-family:Jua,sans-serif;font-size:clamp(18px,5vw,28px);text-align:center;line-height:1.25}
.act-mouth .mo-mirror{background:#ffe9a6;border:7px solid #ffc94d}
.act-mouth .mo-mirror video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none}
.act-mouth .mo-mirror.live video{display:block}
.act-mouth .mo-nocam{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10px;color:#5b4300;gap:6px}
.act-mouth .mo-nocam span{font-size:clamp(60px,17vw,110px);line-height:1}
.act-mouth .mo-nocam small{font-size:clamp(13px,3.5vw,16px);line-height:1.4}
.act-mouth .mo-mirror.live .mo-nocam{display:none}
.act-mouth .mo-tag{position:absolute;left:8px;top:8px;background:rgba(255,255,255,.85);color:#24344a;border-radius:999px;padding:1px 10px;font-family:Jua,sans-serif;font-size:14px;z-index:2}
.act-mouth .mo-model .mo-tag{background:var(--area);color:#fff}
.act-mouth .mo-count{display:flex;gap:12px;min-height:28px}
.act-mouth .mo-count i{width:24px;height:24px;border-radius:50%;background:var(--line);transition:background .2s,transform .2s}
.act-mouth .mo-count i.on{background:var(--area);transform:scale(1.2)}

/* ── follow ── */
.act-follow .fo-svg{width:clamp(70px,min(22vw,15vh),130px);height:clamp(70px,min(22vw,15vh),130px);display:block}
.act-follow .fo-steps{display:flex;align-items:center;gap:8px;background:var(--surface);border-radius:20px;box-shadow:var(--shadow);padding:6px 14px;font-size:clamp(26px,7vw,36px);line-height:1.2}
.act-follow .fo-steps b{width:26px;height:26px;border-radius:50%;background:var(--area);color:#fff;font-family:Jua,sans-serif;font-weight:400;font-size:16px;display:flex;align-items:center;justify-content:center}
.act-follow .fo-zone{position:relative;width:clamp(160px,min(50vw,28vh),240px);aspect-ratio:1;border-radius:34px;border:5px dashed color-mix(in srgb,var(--area) 55%,transparent);
  background:color-mix(in srgb,var(--surface) 70%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;transition:transform .15s,border-color .2s,background .2s}
.act-follow .fo-zone.drop{transform:scale(1.06);border-color:var(--area);background:color-mix(in srgb,var(--area) 14%,var(--surface))}
.act-follow .fo-zone.full{border-style:solid;border-color:var(--good)}
.act-follow .fz-e{font-size:clamp(70px,min(20vw,13vh),120px);line-height:1}
.act-follow .fz-w{font-family:Jua,sans-serif;font-size:clamp(15px,4vw,19px);color:var(--soft)}
.act-follow .fz-in{position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;padding-top:6%;pointer-events:none}
.act-follow .fo-items{display:flex;gap:clamp(12px,4vw,30px);justify-content:center;flex-wrap:wrap;min-height:clamp(100px,24vw,140px)}
.act-follow .fo-it{width:clamp(96px,26vw,134px);aspect-ratio:1;border-radius:26px;background:var(--surface);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;
  font-size:clamp(54px,14vw,80px);line-height:1;cursor:grab;user-select:none;-webkit-user-select:none}
.act-follow .fo-it.dim{opacity:.4}
.act-follow .fz-in .fo-it{width:auto;background:none;box-shadow:none;font-size:clamp(44px,12vw,64px);animation:pop .4s}

/* ── syllable ── */
.act-syllable .sy-card{display:flex;flex-direction:column;align-items:center;background:var(--surface);border-radius:30px;box-shadow:var(--shadow);padding:6px 24px 10px;animation:spIn .45s;max-width:100%}
.act-syllable .sy-e{font-size:clamp(80px,min(26vw,16vh),150px);line-height:1.15}
.act-syllable .sy-word{display:flex;gap:4px;justify-content:center;flex-wrap:wrap;min-height:1.3em;font-family:Jua,sans-serif;font-size:clamp(32px,9vw,56px);line-height:1.3}
.act-syllable .sy-word span{display:inline-block;padding:0 8px;border-radius:14px;transition:transform .15s,background .15s,color .15s}
.act-syllable .sy-word span.on{background:color-mix(in srgb,var(--area) 22%,transparent);color:var(--area);transform:scale(1.15)}
.act-syllable .sy-word.hide span{display:none}
.act-syllable .sy-word.hide::before{content:'👂 귀로 들어 봐';font-family:'Gowun Dodum',sans-serif;font-size:clamp(15px,4vw,18px);color:var(--soft);align-self:center}
.act-syllable .sy-dots{display:flex;gap:14px;min-height:30px;align-items:center}
.act-syllable .sy-dots i{width:28px;height:28px;border-radius:50%;border:4px solid var(--line);background:var(--surface);transition:background .15s,border-color .15s}
.act-syllable .sy-dots i.on{background:var(--area);border-color:var(--area);animation:pop .3s}
.act-syllable .sy-dots.hide{visibility:hidden}
.act-syllable .sy-drum{position:relative;width:clamp(150px,min(46vw,28vh),250px);aspect-ratio:1;border-radius:50%;margin-bottom:12px;
  background:radial-gradient(circle at 50% 44%,#fffaf0 0 52%,#f6e4bd 53% 100%);border:clamp(10px,2.6vw,14px) solid #e85d4a;
  box-shadow:0 12px 0 #b8402f,0 18px 30px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;touch-action:manipulation}
.act-syllable .sy-drum .dr-e{font-size:clamp(46px,13vw,76px);line-height:1;opacity:.9}
.act-syllable .sy-drum.hit{animation:syHit .2s}
@keyframes syHit{45%{transform:translateY(8px) scale(.94);box-shadow:0 4px 0 #b8402f,0 8px 16px rgba(0,0,0,.18)}}
.act-syllable .sy-drum.wait{filter:saturate(.6);opacity:.85}
.act-syllable .sy-boom{position:absolute;left:50%;top:6%;transform:translateX(-50%);font-family:Jua,sans-serif;font-size:clamp(22px,6vw,32px);color:#e85d4a;pointer-events:none;
  animation:syBoom .6s ease-out forwards;white-space:nowrap}
@keyframes syBoom{from{opacity:1;transform:translate(-50%,0) scale(.8)}to{opacity:0;transform:translate(-50%,-60px) scale(1.2)}}

/* ── talkboard (말판) ── */
.act-talkboard{padding-top:2px}
.act-talkboard .tb{flex:1;display:flex;flex-direction:column;gap:8px;width:100%;min-height:0}
.act-talkboard .tb-strip{display:flex;gap:6px;align-items:stretch;background:var(--surface);border-radius:20px;box-shadow:var(--shadow);padding:6px;min-height:72px}
.act-talkboard .tb-sent{flex:1;min-width:0;display:flex;gap:4px;align-items:center;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:0 4px;border-radius:14px;transition:background .3s}
.act-talkboard .tb-sent::-webkit-scrollbar{display:none}
.act-talkboard .tb-sent.say{background:color-mix(in srgb,var(--area) 16%,transparent)}
.act-talkboard .tb-sent:empty::before{content:'그림을 눌러 말해요 👇';color:var(--soft);font-size:clamp(13px,3.5vw,16px);white-space:nowrap}
.act-talkboard .tb-chip{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:52px;height:58px;padding:2px 6px;border-radius:12px;background:var(--tc,#fff);color:#24344a;
  font-family:Jua,sans-serif;font-size:13px;line-height:1.1;animation:pop .3s}
.act-talkboard .tb-chip i{font-style:normal;font-size:26px;line-height:1.15}
.act-talkboard .tb-chip img{width:30px;height:30px;object-fit:cover;border-radius:8px}
.act-talkboard .tb-btn{flex:none;width:46px;border-radius:14px;background:var(--bg);font-size:20px;display:flex;align-items:center;justify-content:center}
.act-talkboard .tb-del{font-size:28px;font-family:system-ui,sans-serif}
.act-talkboard .tb-say{width:auto;min-width:64px;padding:0 10px;background:var(--area);color:#fff;flex-direction:column;gap:0}
.act-talkboard .tb-say b{font-size:22px;line-height:1.1;font-weight:400} .act-talkboard .tb-say small{font-family:Jua,sans-serif;font-size:13px;line-height:1.1}
.act-talkboard .tb-btn:active{transform:scale(.94)}
.act-talkboard .tb-tabs{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}
.act-talkboard .tb-tab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:4px 2px;border-radius:14px;background:var(--surface);box-shadow:var(--shadow);min-height:54px}
.act-talkboard .tb-tab span{font-size:clamp(20px,5.6vw,26px);line-height:1.15}
.act-talkboard .tb-tab small{font-size:clamp(10px,2.7vw,13px);font-weight:700;line-height:1.15;color:var(--soft);text-align:center}
.act-talkboard .tb-tab.on{background:var(--area);box-shadow:none}
.act-talkboard .tb-tab.on small{color:#fff}
/* 칸 수·줄 수를 고정 — 어느 탭이든 그림 크기와 자리가 같아야 손이 기억한다 */
.act-talkboard .tb-grid{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,minmax(clamp(78px,12vh,150px),1fr));
  grid-auto-rows:minmax(clamp(78px,12vh,150px),1fr);gap:clamp(6px,1.6vw,10px);padding:2px 2px 8px}
@media (min-width:700px){.act-talkboard .tb-grid{grid-template-columns:repeat(6,1fr);grid-template-rows:repeat(3,minmax(clamp(78px,12vh,170px),1fr))}}
.act-talkboard .tb-tile{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:18px;background:var(--tc,#fff);color:#24344a;
  box-shadow:0 3px 0 rgba(0,0,0,.1);padding:6px 2px;min-width:0;transition:transform .1s}
.act-talkboard .tb-tile:active{transform:scale(.94)}
.act-talkboard .tb-tile.tap{animation:pop .35s}
.act-talkboard .tb-tile .te{font-size:clamp(34px,min(10vw,7.5vh),64px);line-height:1.1}
.act-talkboard .tb-tile .tl{font-family:Jua,sans-serif;font-size:clamp(14px,3.8vw,20px);line-height:1.15;text-align:center;word-break:keep-all;overflow-wrap:anywhere}
.act-talkboard .tb-tile img{width:72%;max-width:120px;aspect-ratio:1;object-fit:cover;border-radius:12px}
.act-talkboard .tb-note{grid-column:1/-1;grid-row:1/3;align-self:start;background:var(--surface);border-radius:20px;padding:20px;text-align:center;color:var(--soft);font-size:15px;line-height:1.7}
.act-talkboard .tb-note b{display:block;font-size:40px;line-height:1.2}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .act-talkboard .tb-tile,:root:not([data-theme="light"]) .act-talkboard .tb-chip{background:color-mix(in srgb,var(--tc,#fff) 80%,#1b2534)}}
:root[data-theme="dark"] .act-talkboard .tb-tile,:root[data-theme="dark"] .act-talkboard .tb-chip{background:color-mix(in srgb,var(--tc,#fff) 80%,#1b2534)}
`);

/* =================================================================
   1. 낱말 카드 (표현 어휘)
   ================================================================= */
G.act({
  id: 'words', area: 'speech', title: '낱말 카드', icon: '🍎', order: 10, levels: 3, mins: 3, needs: [],
  ef: ['attend', 'wm'],
  desc: '그림 보고 이름 말하기',
  goal: '표현 어휘 늘리기 — 그림·우리 집 사진을 보고 이름을 소리 내어 말하기(따라 말하기 → 스스로 이름 대기), 3단계는 두 낱말 잇기("아기가 자요")',
  how: '자비스가 말한 뒤에는 아이가 입을 뗄 때까지 5초쯤 조용히 기다려 주세요(기다려 주기). "아과"처럼 서툴러도, 소리만 내도 웃으며 "그래, 사과!" 하고 바른 말을 한 번 더 들려주면 충분해요. 아이가 한 낱말을 말하면 "빨간 사과!"처럼 한 낱말을 더해 돌려주세요(확장하기).',
  basis: '모방·명명 훈련 + 부모 언어 자극(Hanen: 기다리기·확장하기), 한 낱말 → 두 낱말 표현 발달 단계',
  offline: '밥 먹을 때 숟가락을 들고 "숟가락!" 하고 3초 기다리기. 아이가 소리만 내도 따라 말해 주고 "큰 숟가락!"처럼 한 낱말 더해 주기.',
  run: async function (ctx) {
    var lv = ctx.level, N = 6;
    var items = lv === 3 ? G.sample(D.PHRASES, N).map(function (p) { return { w: p.t, e: p.e, phrase: true }; })
      : G.sample(wordPool(lv), N).map(function (w) { return { w: w.w, e: w.e, src: w }; });
    ctx.progress(0, N);
    /* 우리 집 사진 카드를 두 장까지 섞는다 — 진짜 사진은 그림보다 잘 배운다 */
    var pics = (await G.db.all('pics')).filter(function (p) { return p && p.img && p.w && String(p.w).trim(); });
    if (!ctx.alive) return;
    if (pics.length) {
      var ps = G.sample(pics, Math.min(2, pics.length)), at = G.sample(G.range(N - 1), ps.length);
      ps.forEach(function (p, k) { items[at[k] + 1] = { w: String(p.w).trim(), img: p.img, photo: true }; });
    }
    await ctx.say(G.pick(['자비스 그림 상자를 열어 볼까? 나오는 그림 이름을 같이 말해 보자!', '그림 카드 놀이! 자비스가 먼저 말하면 따라 해 줘.']));
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      await wordCard(ctx, items[i], lv);
    }
    ctx.progress(N, N);
    ctx.finish({ msg: G.pick(['낱말 카드를 끝까지 함께했어! 목소리가 정말 멋져!', '그림 이름을 같이 말했어! 말하는 힘이 쑥쑥!']) });
  }
});

async function wordCard(ctx, it, lv) {
  clear(ctx);
  var chunks = chunksOf(it.w), syl = !it.phrase && chunks.length > 1 && chunks.join('') === it.w;
  var wrap = wrapEl(ctx);
  var card = G.el('<div class="wd-card">' + (it.photo ? '<span class="wd-tag">📷 우리 집</span><img class="wd-photo" alt="">' : '<div class="wd-pic' + (it.phrase ? ' two' : '') + '">' + it.e + '</div>') +
    '<div class="wd-word' + (syl ? ' syl' : '') + '">' + chunks.map(function (c) { return '<span>' + G.esc(c) + '</span>'; }).join('') + '</div></div>');
  if (it.photo) card.querySelector('img').src = it.img;
  wrap.appendChild(card);
  var spans = G.$$('.wd-word span', card);
  G.sfx.play('pop');
  function lightSeq(gap) {
    spans.forEach(function (s, k) {
      ctx.timeout(function () { spans.forEach(function (x) { x.classList.remove('on'); }); s.classList.add('on'); }, k * gap);
    });
    ctx.timeout(function () { spans.forEach(function (x) { x.classList.remove('on'); }); }, spans.length * gap + 200);
  }
  var w = it.w, sayChunks = chunks.join(', ');
  var open = it.photo ? G.pick(['어, 우리 집 사진이다! ', '누구일까? 짠! ']) : G.pick(['짠! ', '뭐가 나왔을까? ', '어디 보자~ ']);
  var name = it.phrase ? w + '.' : G.pick(['이건 ' + isYa(w) + '.', '와, ' + G.josa(w, '이다', '다') + '!', w + '!']);
  var ask = G.pick(['따라 해 볼까?', '너도 말해 봐!', '자비스처럼 말해 볼까?', '같이 말해 보자!']);
  await ctx.say(open + name, { repeat: false });
  if (chunks.length > 1) lightSeq(pace(it.phrase ? 700 : 520));
  await ctx.say((chunks.length > 1 ? sayChunks + '. ' : '') + ask);
  var r = await speakTurn(ctx, {
    box: wrap, expect: [w], lenient: lv === 1 || !!it.photo,
    again: function () {
      if (chunks.length > 1) lightSeq(pace(it.phrase ? 700 : 520));
      return ctx.say(G.pick(['천천히 같이 해 보자. ', '자비스가 한 번 더 말해 줄게. ']) + (chunks.length > 1 ? sayChunks + '. ' : '') + w + '!', { repeat: false });
    }
  });
  ctx.trial(r.ok);
  if (!r.heard && r.judged && r.ok) ctx.extra.judged = (ctx.extra.judged || 0) + 1;
  if (r.ok) {
    await ctx.cheer(r.heard ? G.pick(['잘 말했어!', w + '! 똑같이 말했네!', '와, 목소리 멋지다!', '또박또박 잘 말했어!']) : G.pick(['잘 말했어!', '소리 냈구나! 멋져!', '말해 줘서 고마워!']), card);
    var ex = expand(it.src);
    if (ex) await ctx.say(ex, { repeat: false });
  } else if (r.heard) {
    /* 말은 했는데 다르게 들렸다 — 그래도 칭찬하고 바른 말을 들려준다 */
    await ctx.cheer(G.pick(['말해 줘서 고마워!', '목소리 좋다!', '용감하게 말했네!']) + ' ' + w + '!', card);
  } else {
    await ctx.say(G.pick(['괜찮아! ', '좋아, ']) + w + '! ' + G.pick(['다음에 같이 해 보자.', '다음에 또 만나자!']), { repeat: false });
  }
  await ctx.wait(pace(350));
}

/* =================================================================
   2. 듣고 찾기 (수용 어휘)
   ================================================================= */
G.act({
  id: 'listen', area: 'speech', title: '듣고 찾기', icon: '👂', order: 20, levels: 3, mins: 2, needs: [],
  ef: ['attend', 'wm'],
  desc: '이름을 듣고 그림을 찾아요',
  goal: '수용 어휘 — 낱말을 듣고 뜻(그림)과 잇기. 말로 표현하기 전에 먼저 알아듣는 말을 늘려요',
  how: '아이가 고르기 전에 정답을 손가락으로 가리키지 말고 기다려 주세요. 찾으면 "맞아, 강아지! 멍멍!" 하고 이름을 한 번 더 들려주세요. 틀리게 고르면 "이건 고양이야" 하고 그 그림 이름도 알려 주면 두 낱말을 함께 배워요.',
  basis: '수용 어휘 과제(그림 어휘력 검사 형식) + 무오류 학습(두 번째엔 정답 표시)',
  offline: '장난감 두세 개를 바닥에 놓고 "공 어디 있어?" 찾기. 찾으면 "공 굴려!"처럼 이어서 놀기.',
  run: async function (ctx) {
    var lv = ctx.level, N = 6, k = lv + 1;
    var pool = wordPool(lv === 1 ? 1 : lv === 2 ? 2 : 3);
    var targets = G.sample(pool, N);
    ctx.progress(0, N);
    await ctx.say(G.pick(['숨바꼭질 놀이! 자비스가 부르는 친구를 찾아 줘. 귀를 쫑긋!', '자비스가 이름을 부르면 콕 찾아 줘! 잘 들어 봐.']));
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      var t = targets[i];
      var others = lv === 1 ? G.sample(pool.filter(function (w) { return w.c !== t.c; }), k - 1)
        : lv === 3 ? (function () {
          var same = G.sample(pool.filter(function (w) { return w.c === t.c && w !== t; }), 1);
          return same.concat(G.sample(pool.filter(function (w) { return w !== t && same.indexOf(w) < 0; }), k - 1 - same.length));
        })()
          : G.sample(pool.filter(function (w) { return w !== t; }), k - 1);
      await listenItem(ctx, t, others, k);
    }
    ctx.progress(N, N);
    ctx.finish({ msg: G.pick(['귀가 정말 밝구나! 다 찾았어!', '잘 듣고 찾았어! 듣는 힘이 쑥쑥!']) });
  }
});

function listenItem(ctx, t, others, k) {
  var wrap = wrapEl(ctx, '<button class="ls-ear" type="button" aria-label="다시 듣기"><span>👂</span>잘 들어 봐!</button>');
  var ear = wrap.querySelector('.ls-ear');
  var q = G.pick([acc(t.w) + ' 찾아 줘!', t.w + ' 어디 있어?', topic(t.w) + ' 어디 숨었을까?', acc(t.w) + ' 콕 눌러 봐!']);
  function ask(text) { ear.classList.add('talk'); return ctx.say(text || q).then(function () { ear.classList.remove('talk'); }); }
  ear.onclick = function () { G.sfx.play('tap'); ask(); };
  ask();
  return pickOne(ctx, {
    box: wrap, items: G.shuffle([t].concat(others)), label: false, cols: k, size: k >= 4 ? 'md' : 'lg',
    isRight: function (it) { return it === t; },
    onRight: function (it, el) { el.classList.add('jump'); },
    praise: function () { return G.pick(['맞아! ', '찾았다! ', '딩동댕! ', '우와, 잘 들었구나! ']) + t.w + '!'; },
    after: function () { var ex = expand(t); return ex ? ctx.say(ex, { repeat: false }) : null; },
    retry: function (it) { return '이건 ' + isYa(it.w) + '. ' + acc(t.w) + ' 찾아볼까?'; },
    answer: function (it) { return '이건 ' + isYa(it.w) + '. ' + topic(t.w) + ' 여기 있어! 반짝반짝!'; },
    idle: q
  });
}

/* =================================================================
   3. 누구 소리일까? (소리흉내말)
   ================================================================= */
G.act({
  id: 'sounds', area: 'speech', title: '누구 소리일까?', icon: '🐶', order: 30, levels: 3, mins: 3, needs: [],
  ef: ['attend', 'wm'],
  desc: '멍멍! 누구 소리인지 찾아요',
  goal: '소리흉내말(멍멍·부릉부릉) 이해와 표현 — 첫 낱말이 나오기 쉬운 소리부터. 3단계는 그림을 보고 직접 소리 흉내 내기',
  how: '소리흉내말은 아이가 가장 먼저 따라 하기 쉬운 말이에요. 자비스가 소리를 내면 부모도 몸짓과 함께 크게 따라 해 주세요("멍멍!" 하며 강아지 손). 아이가 소리를 내면 "강아지가 멍멍!"처럼 이름을 붙여 넓혀 주세요.',
  basis: '의성어·의태어 — 초기 표현 어휘의 디딤돌(소리 모방 → 낱말), 청각 변별',
  offline: '동물 그림책을 보며 엄마가 "멍멍!" 하고 아이 차례를 기다리기. 산책길 자동차엔 "빵빵!", 비 오는 날엔 "주룩주룩!"',
  run: async function (ctx) {
    var lv = ctx.level, N = 6, k = lv + 1;
    var pool = wordPool(lv, { cats: ['animal', 'vehicle'], sound: true });
    var kinds = lv === 3 ? ['pick', 'pick', 'say', 'pick', 'pick', 'say'] : ['pick', 'pick', 'pick', 'pick', 'pick', 'pick'];
    var easy = pool.filter(function (w) { return w.c === 'animal' && hangul(w.s).length <= 4; });
    var used = {}, list = [];
    kinds.forEach(function (kind) {
      var src = (kind === 'say' ? easy : pool).filter(function (w) { return !used[w.w]; });
      if (!src.length) src = pool.filter(function (w) { return !used[w.w]; });
      var w = G.pick(src); used[w.w] = 1; list.push(w);
    });
    ctx.progress(0, N);
    await ctx.say(G.pick(['소리 상자에 누가 숨었을까? 소리를 잘 듣고 찾아 줘!', '쉿, 무슨 소리가 들려! 누구 소리인지 찾아볼까?']));
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      if (kinds[i] === 'say') await soundSay(ctx, list[i]);
      else await soundPick(ctx, list[i], pool, k);
    }
    ctx.progress(N, N);
    ctx.finish({ msg: G.pick(['소리 박사가 다 찾았어! 멍멍, 부릉부릉!', '귀도 입도 정말 잘했어! 소리 흉내 대장!']) });
  }
});

function soundPick(ctx, t, pool, k) {
  clear(ctx);
  var wrap = wrapEl(ctx, '<button class="sd-box" type="button" aria-label="소리 다시 듣기"><span class="sd-q">❓</span><span class="sd-w"><i></i><i></i><i></i></span></button>');
  var box = wrap.querySelector('.sd-box'), q = box.querySelector('.sd-q');
  /* 같은 소리를 내는 친구(소방차·구급차)는 같이 나오지 않게 */
  var sounds = {}, others = [];
  sounds[t.s] = 1;
  G.shuffle(pool).forEach(function (w) { if (others.length < k - 1 && w !== t && !sounds[w.s]) { sounds[w.s] = 1; others.push(w); } });
  var line = t.s + '! ' + t.s + '! ' + G.pick(['누구 소리일까?', '누가 이렇게 소리 낼까?', '이건 누구일까?']);
  function play() { box.classList.add('play'); return ctx.say(line).then(function () { box.classList.remove('play'); }); }
  box.onclick = function () { G.sfx.play('tap'); play(); };
  play();
  return pickOne(ctx, {
    box: wrap, items: G.shuffle([t].concat(others)), label: false, cols: others.length + 1, size: k >= 4 ? 'md' : 'lg',
    isRight: function (it) { return it === t; },
    onRight: function () { q.textContent = t.e; box.classList.remove('play'); box.classList.add('open'); },
    praise: function () { return G.pick(['맞아! ', '딩동댕! ', '찾았다! ']) + subj(t.w) + ' ' + t.s + '!'; },
    retry: function (it) { return topic(it.w) + ' ' + it.s + '! ' + t.s + ' 소리는 누구일까?'; },
    answer: function () { return '여기 있어! ' + subj(t.w) + ' ' + t.s + '!'; },
    idle: line
  });
}

async function soundSay(ctx, t) {
  clear(ctx);
  var wrap = wrapEl(ctx, '<div class="sd-box open"><span class="sd-q">' + t.e + '</span></div><div class="sd-name">' + G.esc(t.w) + '</div>');
  var box = wrap.querySelector('.sd-box');
  G.sfx.play('pop');
  var ask = topic(t.w) + ' 뭐라고 소리 낼까?';
  var model = t.s + '! ' + t.s + '! ' + G.pick(['같이 해 보자.', '너도 해 볼까?']);
  /* 음성 인식이 없으면 먼저 들려주고 부모 단추로 */
  await ctx.say(sttReady() ? G.pick(['이번엔 네가 소리 내 줘! ', t.w + '! ']) + ask : ask + ' ' + model);
  var r = await speakTurn(ctx, {
    box: wrap, expect: [t.s], lenient: false, labels: ['👍 소리 냈어요', '➡️ 다음에'],
    again: function () { return ctx.say(model, { repeat: false }); }
  });
  ctx.trial(r.ok);
  if (r.ok) await ctx.cheer(G.pick(['소리가 똑같다!', '와, ' + t.s + '! 진짜 ' + t.w + ' 같아!', '흉내 대장이다!']), box);
  else if (r.heard) await ctx.cheer('멋진 소리야! ' + subj(t.w) + ' ' + t.s + '!', box);
  else await ctx.say('괜찮아! ' + subj(t.w) + ' ' + t.s + '! 다음에 같이 해 보자.', { repeat: false });
  await ctx.wait(pace(350));
}

/* =================================================================
   4. 소리 내기 (발성·호흡 지지)
   ================================================================= */
var VO_THEMES = [
  { who: '🚀', goal: '🌙', name: '로켓', place: '달', rot: true, trail: '🔥' },
  { who: '🎈', goal: '☀️', name: '풍선', place: '해님', trail: '💨' },
  { who: '🐝', goal: '🌻', name: '꿀벌', place: '해바라기', trail: '🎵' },
  { who: '🛸', goal: '⭐', name: '비행접시', place: '별', trail: '✨' },
  { who: '🐦', goal: '🌈', name: '아기 새', place: '무지개', trail: '🎶' }
];
var VO_VOWELS = [{ v: '아', e: '😮' }, { v: '오', e: '😯' }, { v: '우', e: '😗' }, { v: '이', e: '😁' }, { v: '음', e: '🙂' }];

G.act({
  id: 'voice', area: 'speech', title: '소리 내기', icon: '🚀', order: 40, levels: 3, mins: 2, needs: ['mic'],
  ef: ['regulate', 'attend'],
  desc: '아~ 길게! 목소리로 로켓 띄우기',
  goal: '발성 시작·길게 소리 내기(호흡 지지) — 목소리를 눈으로 보며 크기와 길이를 스스로 조절하기. 1단계 1초 → 3단계 3초',
  how: '부모가 먼저 "아~" 하고 길게 소리 내 보여 주고, 아이와 함께 소리 내도 괜찮아요(로켓은 함께 낸 소리에도 날아가요). 소리가 작아도 "소리 났다!" 하고 바로 칭찬해 주세요. 마이크가 안 되면 아이가 단추를 꾹 누르며 "아~" 하게 하고, 부모가 소리를 냈는지 눌러 주세요.',
  basis: '발성 유도·호흡 지지 — 소리를 눈으로 보여 주는 시각적 바이오피드백, 모음 연장 발성',
  offline: '휴지 조각을 손바닥에 놓고 "아~" 길게 소리 내며 누가 더 오래 하나 놀이. 엘리베이터에서 "우~" 하며 위로 올라가기.',
  run: function (ctx) {
    var lv = ctx.level, GOAL = [1, 2, 3][lv - 1], ROUNDS = 5, TH = 0.1;
    var B = ctx.body;
    B.innerHTML = '<div class="sp"><div class="vo-sky"><span class="vo-cloud c1">☁️</span><span class="vo-cloud c2">☁️</span><span class="vo-goal"></span>' +
      '<span class="vo-who"><span class="vo-e"></span><span class="vo-fire">🔥</span></span><div class="vo-meter"><b></b></div></div>' +
      '<div class="vo-bot"><div class="vo-mouth"><span></span><small>입 모양</small></div>' +
      '<div class="vo-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="bg" cx="50" cy="50" r="42"/><circle class="fg" cx="50" cy="50" r="42"/></svg><b><span></span><small>' + GOAL + '초 길게</small></b></div>' +
      '<button class="btn big vo-hold" type="button" hidden>🗣️ 꾹 누르고 아~</button></div></div>';
    var wrap = G.$('.sp', B), who = G.$('.vo-who', B), whoE = G.$('.vo-e', B), goal = G.$('.vo-goal', B), meter = G.$('.vo-meter b', B),
      fire = G.$('.vo-fire', B), ring = G.$('.vo-ring .fg', B), ringT = G.$('.vo-ring b span', B), mouth = G.$('.vo-mouth span', B), hold = G.$('.vo-hold', B);
    var mic = null, fallback = false, holding = false, r = 0, best = 0, judgeEl = null;
    var C = 263.9;

    function holdOn(e) { e.preventDefault(); holding = true; hold.classList.add('on'); }
    function holdOff() { holding = false; hold.classList.remove('on'); }
    hold.addEventListener('pointerdown', holdOn);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { hold.addEventListener(ev, holdOff); });
    hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    function setP(p, lvl, on) {
      who.style.setProperty('--p', p.toFixed(3));
      ring.style.strokeDashoffset = (C * (1 - p)).toFixed(1);
      meter.style.height = Math.round(Math.min(1, lvl) * 100) + '%';
      who.classList.toggle('on', !!on);
    }
    function dropJudge() { if (judgeEl) { judgeEl.remove(); judgeEl = null; } }
    function round() {
      var th = VO_THEMES[r % VO_THEMES.length], vw = VO_VOWELS[r % VO_VOWELS.length];
      whoE.textContent = th.who; whoE.classList.toggle('rot', !!th.rot);
      fire.textContent = th.trail; fire.classList.toggle('down', th.trail === '🔥');
      goal.textContent = th.goal; goal.classList.remove('got');
      who.classList.remove('fly', 'on');
      mouth.textContent = vw.e; ringT.textContent = vw.v + '~';
      hold.textContent = '🗣️ 꾹 누르고 ' + vw.v + '~';
      setP(0, 0, false);
      var line = r === 0 ? '목소리로 ' + acc(th.name) + ' 띄워 보자! ' + vw.v + '~ 하고 길게 소리 내면 ' + subj(th.name) + ' ' + th.place + '까지 날아가!' :
        G.pick([th.name + '야, ' + th.place + '까지 가자! ' + vw.v + '~ 길게!', '이번엔 ' + vw.v + '~ 소리! ' + subj(th.name) + ' 기다리고 있어.', vw.v + '~ 하고 길게 불러 볼까? ' + th.place + '까지 슝!']);
      if (fallback && r === 0) line += ' 단추를 꾹 누르면서 소리 내 봐!';
      ctx.say(line).then(function () { fly(th, vw); });
    }
    function fly(th, vw) {
      var held = 0, cont = 0, quiet = 9, t0 = performance.now(), over = false, nudged = false;
      var judgeH = fallback ? null : ctx.timeout(function () {
        if (over) return;
        /* 오래 걸리면 부모가 대신 판단할 수 있게 (마이크가 작게 잡는 기기) */
        ctx.parentJudge(wrap, ['👍 소리 냈어요', '➡️ 다음']).then(function (yes) { judgeEl = null; if (over) return; over = true; done(th, vw, yes, true); });
        judgeEl = wrap.lastElementChild;
      }, pace(15000));
      ctx.loop(function (dt) {
        if (over) return false;
        var lvl = 0, on = false;
        if (mic) { lvl = G.voice.speaking ? 0 : mic.level(); on = lvl > TH; }
        else { on = holding; lvl = holding ? 0.55 + Math.random() * 0.25 : 0; }
        if (on) quiet = 0; else quiet += dt;
        var voiced = on || (quiet < 0.22 && cont > 0);   // 아주 짧게 끊겨도 이어진 소리로
        if (voiced) { held += dt; cont += dt; }
        else { held = Math.max(0, held - dt * 0.7); if (quiet > 0.35) cont = 0; }
        if (cont > best) best = cont;
        var p = Math.min(1, held / GOAL);
        setP(p, lvl, voiced);
        if (mic && !nudged && performance.now() - t0 > pace(8000) && p < 0.3) {
          nudged = true;
          ctx.say(G.pick(['자비스랑 같이! ' + vw.v + '~', '작은 소리도 좋아. ' + vw.v + '~ 해 볼까?', '엄마랑 같이 ' + vw.v + '~ 해도 돼!']), { repeat: false });
        }
        if (p >= 1) { over = true; clearTimeout(judgeH); done(th, vw, true, false); return false; }
      });
    }
    function done(th, vw, ok, judged) {
      dropJudge(); holdOff();
      var after;
      if (ok) {
        who.classList.remove('on'); who.classList.add('fly'); G.sfx.play('up');
        ctx.timeout(function () { goal.classList.add('got'); var c = G.fx.center(goal); G.fx.burst(c[0], c[1], ['⭐', '✨', th.goal]); G.sfx.play('sparkle'); }, 800);
      }
      if (fallback) {
        /* 마이크 없이 — 날아간 뒤 부모가 소리를 냈는지 눌러 준다 */
        after = ctx.wait(900).then(function () { return ctx.parentJudge(wrap, ['👍 소리 냈어요', '➡️ 다음']); });
      } else after = Promise.resolve(ok);
      after.then(function (yes) {
        ctx.trial(!!yes);
        if (yes) return ctx.cheer(G.pick([th.place + '에 도착! 목소리가 정말 길다!', '슝! ' + subj(th.name) + ' 날아갔어! 최고야!', '와, 길게 소리 냈어! 목소리 힘이 세다!', vw.v + '~ 소리 멋지다!']));
        return ctx.say(G.pick(['괜찮아! 다음엔 같이 소리 내 보자.', '좋아, 다음 친구한테 가 보자!']), { repeat: false });
      }).then(function () {
        r++; ctx.progress(r, ROUNDS);
        ctx.extra.best = Math.round(best * 10) / 10;
        if (r >= ROUNDS) { ctx.finish({ msg: '목소리로 ' + ROUNDS + '번이나 날아갔어! 목소리 힘이 쑥쑥!' }); return; }
        ctx.wait(pace(500)).then(round);
      });
    }
    function begin() { ctx.progress(0, ROUNDS); round(); }

    ctx.progress(0, ROUNDS);
    ctx.bubble('마이크를 켜고 있어요… 🎤');
    if (!G.has.mic) { fallback = true; hold.hidden = false; begin(); return; }
    ctx.mic({ range: 0.16 }).then(function (m) { mic = m; begin(); }, function () {
      if (!ctx.alive) return;
      fallback = true; hold.hidden = false; begin();
    });
  }
});

/* =================================================================
   5. 입 운동 거울 (구강 운동 모방)
   ================================================================= */
var MO_SETS = {
  1: ['입 크게', '이~ 웃기', '뽀뽀 입', '혀 내밀기', '볼 빵빵'],
  2: ['뽀뽀 입', '볼 빵빵', '혀 위로', '빠빠빠', '후~ 불기', '똑딱 혀'],
  3: ['혀 위로', '똑딱 혀', '말발굽', '아에이오우', '휘파람 입', '빠빠빠']
};
var MO_ANIM = { '똑딱 혀': 'tick', '빠빠빠': 'bounce', '말발굽': 'bounce', '아에이오우': 'bounce' };

G.act({
  id: 'mouth', area: 'speech', title: '입 운동 거울', icon: '👄', order: 50, levels: 3, mins: 3, needs: ['cam'],
  ef: ['attend', 'plan'],
  desc: '거울 보며 입 모양 따라 하기',
  goal: '입술·혀·볼 근육 움직이기와 모방 — 또렷한 발음의 바탕. 거울로 자기 입을 보며 움직임을 스스로 맞춰 가기',
  how: '부모도 아이 옆에서 같이 거울을 보며 과장되게 따라 해 주세요 — 아이는 화면보다 엄마 얼굴을 더 잘 따라 해요. 셋을 세는 동안 자세를 유지하면 최고! 비슷하게만 해도 「따라 했어요」를 눌러 주세요. 카메라가 없어도 할 수 있어요.',
  basis: '구강 운동 모방(입술·혀·볼) — 언어치료 입 근육 놀이, 거울 시각 피드백',
  offline: '양치 전 욕실 거울 앞에서 엄마와 "메롱·뽀뽀·볼 빵빵" 따라 하기. 빨대로 물 마시기, 비눗방울 불기.',
  run: async function (ctx) {
    var lv = ctx.level;
    var list = MO_SETS[lv].map(function (n) { return D.MOUTH.filter(function (m) { return m.name === n; })[0]; }).filter(Boolean);
    var N = list.length;
    var wrap = wrapEl(ctx, '<div class="mo-pair"><div class="mo-model"><span class="mo-tag">자비스</span><span class="mo-e"></span><b class="mo-n"></b></div>' +
      '<div class="mo-mirror"><span class="mo-tag">나</span><video playsinline muted autoplay></video><div class="mo-nocam"><span>🪞</span><small>엄마 아빠 얼굴을 보며<br>같이 따라 해요</small></div></div></div>' +
      '<div class="mo-count"><i></i><i></i><i></i></div>');
    var model = G.$('.mo-model', wrap), moE = G.$('.mo-e', wrap), moN = G.$('.mo-n', wrap), mirror = G.$('.mo-mirror', wrap), video = G.$('video', wrap), dots = G.$$('.mo-count i', wrap);
    if (G.has.cam) ctx.camera(video).then(function () { mirror.classList.add('live'); }).catch(function () { mirror.classList.add('off'); });
    ctx.progress(0, N);
    await ctx.say(G.pick(['거울 놀이! 자비스 얼굴을 보고 똑같이 따라 해 봐.', '입 체조 시간! 거울 속 내 얼굴을 보면서 따라 해 볼까?']));
    for (var i = 0; i < N; i++) {
      var m = list[i];
      ctx.progress(i, N);
      moE.textContent = m.e; moE.className = 'mo-e ' + (MO_ANIM[m.name] || 'pulse');
      moN.textContent = m.name;
      moE.style.animation = 'none'; void moE.offsetWidth; moE.style.animation = '';
      G.sfx.play('pop');
      var tries = 0;
      while (true) {
        dots.forEach(function (d) { d.classList.remove('on'); });
        await ctx.say(m.say);
        await count3(ctx, dots);
        var yes = await ctx.parentJudge(wrap, ['👍 따라 했어요', '🔁 한 번 더']);
        if (yes) {
          if (tries === 0) ctx.trial(true);
          await ctx.cheer(G.pick(['멋진 ' + m.name + '!', '거울 속 친구도 잘했대!', '입 근육이 튼튼해져!', '똑같이 했어! 최고야!']), model);
          break;
        }
        if (tries === 0) ctx.trial(false);
        tries++;
        if (tries >= 2) { await ctx.say(G.pick(['괜찮아! 다음 거 해 보자.', '좋아, 다음 입 체조!']), { repeat: false }); break; }
        await ctx.say(G.pick(['좋아, 한 번 더 같이 해 보자!', '천천히 다시! 자비스를 봐.']), { repeat: false });
      }
      await ctx.wait(pace(300));
    }
    ctx.progress(N, N);
    ctx.finish({ msg: G.pick(['입 체조 끝! 입이 튼튼해져서 말도 쑥쑥!', '거울 놀이 최고! 입 모양 대장이야!']) });
  }
});

/* 하나, 둘, 셋 — 자세를 잠깐 유지 */
function count3(ctx, dots) {
  ctx.say('하나, 둘, 셋!', { repeat: false, rate: 0.75 });
  return new Promise(function (ok) {
    var k = 0;
    function step() {
      if (k >= dots.length) { ctx.wait(pace(300)).then(ok); return; }
      dots[k].classList.add('on'); G.sfx.play('tick'); k++;
      ctx.timeout(step, pace(750));
    }
    ctx.timeout(step, 250);
  });
}

/* =================================================================
   6. 지시 따르기 (1단계 → 꾸밈말+이름 → 두 단계)
   ================================================================= */
var FO_VERBS = ['눌러 줘', '콕 눌러 줘', '톡 건드려 줘', '꾹 눌러 줘'];
var FO_OBJ = {
  ball: { n: '공', svg: function (c) { return '<circle cx="50" cy="50" r="38" fill="' + c + '"/><path d="M14 46 Q50 66 86 46" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="5"/><path d="M50 12 Q36 50 50 88" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="4"/><circle cx="36" cy="32" r="7" fill="#fff" opacity=".5"/>'; } },
  balloon: { n: '풍선', svg: function (c) { return '<path d="M50 82 C44 88 56 92 50 99" fill="none" stroke="#9aa5b4" stroke-width="2.5"/><ellipse cx="50" cy="42" rx="28" ry="34" fill="' + c + '"/><path d="M45 75 h10 l-5 8z" fill="' + c + '"/><ellipse cx="40" cy="30" rx="6" ry="10" fill="#fff" opacity=".45"/>'; } },
  star: { n: '별', svg: function (c) { return '<polygon points="50,8 61,38 94,38 67,58 77,90 50,71 23,90 33,58 6,38 39,38" fill="' + c + '"/>'; } },
  heart: { n: '하트', svg: function (c) { return '<path d="M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 46 14 50 22 C54 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88Z" fill="' + c + '"/>'; } },
  car: { n: '자동차', svg: function (c) { return '<path d="M10 62 L18 42 Q22 34 32 34 L64 34 Q74 34 80 44 L88 56 Q93 58 93 64 L93 70 L7 70 L7 65 Q7 62 10 62Z" fill="' + c + '"/><rect x="27" y="40" width="19" height="14" rx="3" fill="#dff3ff"/><rect x="52" y="40" width="19" height="14" rx="3" fill="#dff3ff"/><circle cx="28" cy="72" r="10" fill="#37474f"/><circle cx="72" cy="72" r="10" fill="#37474f"/><circle cx="28" cy="72" r="4" fill="#cfd8dc"/><circle cx="72" cy="72" r="4" fill="#cfd8dc"/>'; } },
  cup: { n: '컵', svg: function (c) { return '<path d="M70 36 Q88 36 86 54 Q84 68 66 68" fill="none" stroke="' + c + '" stroke-width="8"/><path d="M20 22 H72 L65 86 Q64 91 58 91 H34 Q28 91 27 86Z" fill="' + c + '"/><rect x="20" y="18" width="52" height="8" rx="4" fill="rgba(255,255,255,.45)"/>'; } }
};
var FO_COLS = ['red', 'yellow', 'blue', 'green', 'purple'];
function foColors() { return D.COLORS.filter(function (c) { return FO_COLS.indexOf(c.id) >= 0; }); }
function foSvg(it) { return '<svg class="fo-svg" viewBox="0 0 100 100" aria-hidden="true"><g stroke="rgba(0,0,0,.18)" stroke-width="2.5" stroke-linejoin="round">' + FO_OBJ[it.o].svg(it.c.hex) + '</g></svg>'; }
function foName(it) { return (COL_FULL[it.c.adj] || it.c.adj) + ' ' + FO_OBJ[it.o].n; }
var FO_PUT = [
  { e: '🍎', w: '사과', to: '🧺', tw: '바구니', v: '넣고' },
  { e: '🧸', w: '곰인형', to: '🛏️', tw: '침대', v: '눕히고' },
  { e: '⚽', w: '공', to: '📦', tw: '상자', v: '넣고' },
  { e: '🐟', w: '물고기', to: '🪣', tw: '물통', v: '넣고' },
  { e: '🍪', w: '과자', to: '🍽️', tw: '접시', v: '올리고' },
  { e: '📖', w: '책', to: '🎒', tw: '가방', v: '넣고' },
  { e: '🐶', w: '강아지', to: '🏠', tw: '집', v: '보내고' },
  { e: '🚗', w: '자동차', to: '🅿️', tw: '주차장', v: '세우고' }
];
var FO_ACT = [
  { e: '👏', t: '박수 쳐 줘' }, { e: '👋', t: '손 흔들어 줘' }, { e: '🙌', t: '만세 해 줘' }, { e: '🦶', t: '발을 쿵쿵 굴러 줘' },
  { e: '👃', t: '코를 짚어 줘' }, { e: '😘', t: '뽀뽀를 보내 줘' }, { e: '🙆', t: '머리에 손을 올려 줘' }
];

G.act({
  id: 'follow', area: 'speech', title: '지시 따르기', icon: '🧺', order: 60, levels: 3, mins: 3, needs: [],
  ef: ['wm', 'attend', 'plan'],
  desc: '자비스 말대로 해 봐요',
  goal: '말 알아듣고 행동하기 — 1단계 지시("강아지 눌러") → 꾸밈말+이름("빨간 공") → 두 단계 지시("사과를 바구니에 넣고, 박수 쳐")',
  how: '지시는 한 번 말한 뒤 기다려 주세요. 손짓·눈짓으로 답을 알려 주지 않는 것이 연습이에요. 3단계는 두 가지를 기억해야 해서 어려워요 — 아이가 첫 번째만 하면 "그다음은?" 하고 물어봐 주고, 그래도 어려우면 자비스가 다시 알려 줘요.',
  basis: '지시 따르기 단계(1단계 → 속성 → 2단계 지시) — 수용 언어·청각 작업기억',
  offline: '정리 시간에 "블록을 상자에 넣고, 손뼉 쳐!" 두 단계 심부름. 옷 입을 때 "파란 양말 가져와!"처럼 색을 붙여 말하기.',
  run: async function (ctx) {
    var lv = ctx.level, N = 5;
    ctx.progress(0, N);
    await ctx.say(lv === 3 ? '자비스 심부름 놀이! 자비스 말을 끝까지 잘 듣고, 두 가지를 해 줘.' :
      G.pick(['자비스 말 잘 듣기 놀이! 자비스가 말하는 대로 해 줘.', '귀를 쫑긋! 자비스가 부탁하는 걸 찾아 줘.']));
    var pool = wordPool(1), targets = G.sample(pool, N);
    var kinds = G.shuffle(['c3', 'c3', 'g4', 'g4']); kinds.unshift('c3');
    var puts = G.sample(FO_PUT, N), acts = G.sample(FO_ACT, N);
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      if (lv === 1) await followTap(ctx, targets[i], pool);
      else if (lv === 2) await followColor(ctx, kinds[i]);
      else await followPut(ctx, puts[i], acts[i], i === 0);
    }
    ctx.progress(N, N);
    ctx.finish({ msg: lv === 3 ? '심부름을 척척! 두 가지를 다 기억했어!' : G.pick(['자비스 말을 정말 잘 들었어!', '귀 대장! 말한 대로 척척 했어!']) });
  }
});

function followTap(ctx, t, pool) {
  var others = G.sample(pool.filter(function (w) { return w.c !== t.c; }), 2);
  var wrap = wrapEl(ctx, '<button class="fo-ear" type="button" aria-label="다시 듣기"><span>🤖</span>자비스 부탁!</button>');
  var ear = wrap.querySelector('.fo-ear');
  var q = acc(t.w) + ' ' + G.pick(FO_VERBS) + '!';
  function ask() { ear.classList.add('talk'); return ctx.say(q).then(function () { ear.classList.remove('talk'); }); }
  ear.onclick = function () { G.sfx.play('tap'); ask(); };
  ask();
  return pickOne(ctx, {
    box: wrap, items: G.shuffle([t].concat(others)), label: false, cols: 3, size: 'lg',
    isRight: function (it) { return it === t; },
    onRight: function (it, el) { el.classList.add('jump'); },
    praise: function () { return G.pick([t.w + '! 잘 들었어!', '맞아, ' + t.w + '!', '자비스 말을 잘 들었구나!']); },
    after: function () { return t.s ? ctx.say(t.s + '! ' + t.s + '!', { repeat: false }) : null; },
    retry: function (it) { return '이건 ' + isYa(it.w) + '. ' + q; },
    answer: function () { return '여기 있어! 반짝이는 ' + t.w + '!'; },
    idle: q
  });
}

function followColor(ctx, kind) {
  var keys = Object.keys(FO_OBJ), cols = foColors(), items, target;
  if (kind === 'c3') {
    var o = G.pick(keys);
    items = G.sample(cols, 3).map(function (c) { return { o: o, c: c }; });
    target = items[0];
  } else {
    var os = G.sample(keys, 2), cs = G.sample(cols, 2);
    items = [{ o: os[0], c: cs[0] }, { o: os[0], c: cs[1] }, { o: os[1], c: cs[0] }, { o: os[1], c: cs[1] }];
    target = G.pick(items);
  }
  var name = foName(target), q = acc(name) + ' ' + G.pick(FO_VERBS) + '!';
  var wrap = wrapEl(ctx, '<button class="fo-ear" type="button" aria-label="다시 듣기"><span>🎨</span>어떤 걸까?</button>');
  var ear = wrap.querySelector('.fo-ear');
  function ask() { ear.classList.add('talk'); return ctx.say(q).then(function () { ear.classList.remove('talk'); }); }
  ear.onclick = function () { G.sfx.play('tap'); ask(); };
  ask();
  return pickOne(ctx, {
    box: wrap, items: G.shuffle(items), cols: items.length, size: 'lg', render: foSvg,
    isRight: function (it) { return it === target; },
    onRight: function (it, el) { el.classList.add('jump'); },
    praise: function () { return G.pick(['맞아! ' + name + '!', '딩동댕! ' + name + '!', '색깔까지 잘 들었구나! ' + name + '!']); },
    retry: function (it) { return '이건 ' + isYa(foName(it)) + '. ' + acc(name) + ' 찾아 줘!'; },
    answer: function (it) { return '이건 ' + isYa(foName(it)) + '. ' + topic(name) + ' 여기 있어!'; },
    idle: q
  });
}

async function followPut(ctx, task, act, first) {
  var others = G.sample(FO_PUT.filter(function (p) { return p.e !== task.e && p.to !== task.to; }), 2);
  var wrap = wrapEl(ctx, '<div class="fo-steps" hidden><b>1</b>' + task.e + '➜' + task.to + '<b>2</b>' + act.e + '</div>' +
    '<div class="fo-zone"><span class="fz-e">' + task.to + '</span><span class="fz-w">' + G.esc(task.tw) + '</span><div class="fz-in"></div></div><div class="fo-items"></div>');
  var steps = G.$('.fo-steps', wrap), zone = G.$('.fo-zone', wrap), zin = G.$('.fz-in', wrap), itemsBox = G.$('.fo-items', wrap);
  var els = G.shuffle([task].concat(others)).map(function (p) {
    var el = G.el('<div class="fo-it" role="button" aria-label="' + G.esc(p.w) + '">' + p.e + '</div>');
    el._p = p; itemsBox.appendChild(el); return el;
  });
  var right = els.filter(function (el) { return el._p === task; })[0];
  var line = acc(task.w) + ' ' + task.tw + '에 ' + task.v + ', ' + act.t + '!';
  var miss = 0, step2Retry = false;
  await ctx.say((first ? '잘 들어 봐. ' : '') + line);
  await new Promise(function (resolve) {
    var done = false, idleH = null;
    function idle() {
      clearTimeout(idleH);
      idleH = ctx.timeout(function () { if (done) return; steps.hidden = false; G.ui.hint(right); ctx.say(line, { repeat: false }); idle(); }, pace(12000));
    }
    function place(el, flyIt) {
      var a = el.getBoundingClientRect(), b = zin.getBoundingClientRect();
      el.classList.add('placed');
      if (flyIt) {
        el.style.transition = 'transform .4s ease-in';
        el.style.transform = 'translate(' + Math.round(b.left + b.width / 2 - a.left - a.width / 2) + 'px,' + Math.round(b.top + b.height * 0.3 - a.top - a.height / 2) + 'px) scale(.7)';
      }
      ctx.timeout(function () { el.style.transition = ''; el.style.transform = ''; zin.appendChild(el); zone.classList.add('full'); G.sfx.play('pop'); }, flyIt ? 420 : 0);
    }
    els.forEach(function (el) {
      var sx = 0, sy = 0;
      el.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
      G.ui.drag(el, {
        onMove: function (x, y) { zone.classList.toggle('drop', G.ui.inside(x, y, zone, 16)); },
        onDrop: function (x, y) {
          zone.classList.remove('drop');
          if (done) return false;
          var tap = Math.abs(x - sx) + Math.abs(y - sy) < 14, inZone = G.ui.inside(x, y, zone, 16);
          if (!tap && !inZone) return false;            /* 아무 데나 놓으면 제자리로 (틀림 아님) */
          if (el._p === task) { done = true; clearTimeout(idleH); place(el, tap); resolve(); return true; }
          miss++;
          G.ui.wiggle(el);
          if (miss >= 2) { G.sfx.play('oops'); steps.hidden = false; G.ui.hint(right); ctx.say('이건 ' + isYa(el._p.w) + '. 반짝이는 ' + acc(task.w) + ' ' + task.tw + '에!', { repeat: false }); }
          else ctx.oops('이건 ' + isYa(el._p.w) + '. ' + acc(task.w) + ' ' + task.tw + '에 ' + task.v + '!', el);
          return false;
        }
      });
    });
    idle();
  });
  await ctx.wait(pace(500));
  await ctx.say(subj(task.w) + ' 쏙! ' + G.pick(['그다음은 뭐였지?', '이제 두 번째!', '또 뭐 하기로 했지?']), { repeat: false });
  await ctx.wait(pace(2500));      /* 아이가 몸으로 해 볼 시간 */
  var yes = await ctx.parentJudge(wrap, ['👍 했어요', '🔁 다시 듣기']);
  if (!yes) {
    step2Retry = true; steps.hidden = false;
    await ctx.say('두 번째는, ' + act.t + '!', { repeat: false });
    await ctx.wait(pace(1500));
    yes = await ctx.parentJudge(wrap, ['👍 했어요', '➡️ 다음']);
  }
  ctx.trial(miss === 0 && !step2Retry);
  if (yes) await ctx.cheer(G.pick(['두 가지 다 했어! 기억 대장!', '심부름 척척! 최고야!', '끝까지 기억했구나! 멋져!']), zone);
  else await ctx.say('괜찮아! 다음 심부름도 같이 해 보자.', { repeat: false });
  await ctx.wait(pace(300));
}

/* =================================================================
   7. 말소리 북치기 (음운 인식: 음절 나누기)
   ================================================================= */
var SY_EXTRA = [
  { w: '무당벌레', e: '🐞' }, { w: '해바라기', e: '🌻' }, { w: '오토바이', e: '🏍️' }, { w: '고슴도치', e: '🦔' }, { w: '미끄럼틀', e: '🛝' },
  { w: '바이올린', e: '🎻' }, { w: '선글라스', e: '🕶️' }, { w: '피아노', e: '🎹' }, { w: '캥거루', e: '🦘' }, { w: '햄버거', e: '🍔' },
  { w: '호랑이', e: '🐯' }, { w: '다람쥐', e: '🐿️' }
];
var NUMK = ['', '한', '두', '세', '네', '다섯'];
function sylPool(n) {
  var seen = {};
  return wordPool(3).concat(SY_EXTRA).filter(function (w) {
    var h = hangul(w.w);
    if (h !== w.w || h.length !== n || seen[w.w]) return false;
    seen[w.w] = 1; return true;
  });
}

G.act({
  id: 'syllable', area: 'speech', title: '말소리 북치기', icon: '🥁', order: 70, levels: 3, mins: 3, needs: [],
  ef: ['attend', 'wm', 'inhibit'],
  desc: '한 소리에 북 한 번, 둥!',
  goal: '음운 인식 — 낱말이 작은 소리(음절)로 나뉜다는 것 알기("사-과" 두 번). 또박또박 끊어 말하기와 읽기 준비의 바탕',
  how: '아이와 같이 소리 내어 "사, 과" 하며 북을 쳐 주세요. 어려워하면 아이 손을 잡고 함께 쳐도 좋아요. 2·3단계는 자비스가 북 칠 때 소리를 내지 않으니 아이가 스스로 말하며 치게 도와주세요. 3단계는 글자가 숨겨져 있어 귀로만 나눠요.',
  basis: '음운 인식 — 음절 분절(손뼉·북 치기), 읽기 준비 기술',
  offline: '이름을 박수로 나눠 치기: "민-준" 짝짝. 계단을 오르며 "바-나-나" 한 칸에 한 소리.',
  run: async function (ctx) {
    var lv = ctx.level, N = 5;
    var counts = lv === 1 ? [1, 2, 1, 2, 2] : lv === 2 ? [2, 3, 2, 3, 3] : [3, 4, 3, 4, 4];
    var used = {}, list = counts.map(function (n) {
      var p = sylPool(n).filter(function (w) { return !used[w.w]; });
      var w = G.pick(p); used[w.w] = 1; return { w: w.w, e: w.e, n: n };
    });
    /* 아이 별명이 맞는 길이면 마지막은 이름 북치기 */
    var nick = hangul(G.profile.nick || '');
    if (nick && nick === String(G.profile.nick || '').trim() && nick.length >= counts[0] && nick.length <= counts[counts.length - 1]) list[N - 1] = { w: nick, e: '🌟', n: nick.length, name: true };
    ctx.progress(0, N);
    await ctx.say(G.pick(['둥둥 북 놀이! 낱말을 작은 소리로 나눠서, 한 소리에 북 한 번씩 쳐 보자.', '자비스 북이 왔어요! 소리 하나에 둥 한 번!']));
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      await syItem(ctx, list[i], lv, i === 0);
    }
    ctx.progress(N, N);
    ctx.finish({ msg: G.pick(['북치기 대장! 소리를 콩콩 잘 나눴어!', '둥둥! 귀가 정말 똑똑해졌어!']) });
  }
});

async function syItem(ctx, it, lv, first) {
  clear(ctx);
  var n = it.n, ss = it.w.split('');
  var wrap = wrapEl(ctx, '<div class="sy-card"><span class="sy-e">' + it.e + '</span><div class="sy-word' + (lv === 3 ? ' hide' : '') + '">' + ss.map(function (s) { return '<span>' + G.esc(s) + '</span>'; }).join('') + '</div></div>' +
    '<div class="sy-dots' + (lv === 3 ? ' hide' : '') + '">' + ss.map(function () { return '<i></i>'; }).join('') + '</div>' +
    '<button class="sy-drum wait" type="button" aria-label="북 치기"><span class="dr-e">🥁</span></button>');
  var word = G.$('.sy-word', wrap), spans = G.$$('.sy-word span', wrap), dots = G.$$('.sy-dots i', wrap), drum = G.$('.sy-drum', wrap);
  var onTap = null;
  function light(k) { spans.forEach(function (s, j) { s.classList.toggle('on', j === k); }); dots.forEach(function (d, j) { d.classList.toggle('on', j <= k); }); }
  function unlight() { spans.forEach(function (s) { s.classList.remove('on'); }); dots.forEach(function (d) { d.classList.remove('on'); }); }
  function hit() {
    drum.classList.remove('hit'); void drum.offsetWidth; drum.classList.add('hit');
    G.sfx.play('drum'); G.buzz(15);
    var b = G.el('<span class="sy-boom">둥!</span>'); drum.appendChild(b); setTimeout(function () { b.remove(); }, 650);
  }
  drum.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (onTap) onTap(); else G.sfx.play('tap');
  });
  async function demo(intro) {
    onTap = null; drum.classList.add('wait'); unlight();
    if (intro) await ctx.say(intro, { repeat: false });
    for (var k = 0; k < n; k++) {
      light(k); hit();
      await ctx.say(ss[k], { repeat: false, rate: 0.85 });
      await ctx.wait(pace(160));
    }
    await ctx.wait(pace(300));
    unlight();
  }
  function childTurn(prompt) {
    return new Promise(function (resolve) {
      var taps = 0, evalH = null, idleN = 0;
      drum.classList.remove('wait'); unlight();
      ctx.say(prompt);
      /* 한참 안 치면 북을 반짝여 부르고, 그래도 쉬고 있으면 같이 치기로 넘어간다 */
      function idle() {
        ctx.timeout(function () {
          if (taps || !onTap) return;
          idleN++;
          if (idleN >= 2) { onTap = null; drum.classList.add('wait'); resolve(0); return; }
          G.ui.hint(drum); ctx.say(G.pick(['북을 둥! 쳐 볼까?', '여기 북이 기다려!']) + ' ' + it.w + '!', { repeat: false }); idle();
        }, pace(10000));
      }
      idle();
      onTap = function () {
        taps++; hit();
        if (taps <= n) { light(taps - 1); if (lv === 1) G.say(ss[taps - 1], { rate: 0.9 }); }
        clearTimeout(evalH);
        evalH = ctx.timeout(function () { onTap = null; drum.classList.add('wait'); resolve(taps); }, taps >= n + 2 ? 250 : pace(1500));
      };
    });
  }
  function waitTap(ms) {
    return new Promise(function (res) {
      drum.classList.remove('wait');
      var h = ctx.timeout(function () { onTap = null; hit(); res(); }, ms);
      onTap = function () { clearTimeout(h); onTap = null; hit(); res(); };
    });
  }
  async function together() {
    await ctx.say(G.pick(['이번엔 같이 치자! 자비스가 말하면 둥!', '자비스랑 같이! 반짝이면 둥!']), { repeat: false });
    unlight();
    for (var k = 0; k < n; k++) {
      light(k); G.ui.hint(drum);
      ctx.say(ss[k], { repeat: false, rate: 0.85 });
      await waitTap(pace(3200));
      await ctx.wait(pace(250));
    }
    drum.classList.add('wait');
  }

  G.sfx.play('pop');
  var intro = it.name ? '마지막은 우리 친구 이름이야! ' + it.w + '!' : G.pick(['이건 ' + isYa(it.w) + '.', it.w + '!', '와, ' + G.josa(it.w, '이다', '다') + '!']);
  await ctx.say(intro, { repeat: false });
  await demo(first ? '자비스가 먼저 쳐 볼게. 잘 들어 봐!' : (n > 1 ? G.pick(['자비스가 먼저!', '들어 봐!']) : null));
  var prompt = (first ? '이제 네 차례! 한 소리에 북 한 번! ' : G.pick(['네 차례! ', '이제 너도! '])) + it.w + '!';
  var miss = 0;
  while (true) {
    var taps = await childTurn(prompt);
    if (taps === n) { if (!miss) ctx.trial(true); break; }
    miss++;
    if (miss === 1) ctx.trial(false);
    if (miss === 1) { await demo(taps < n ? G.pick(['음~ 소리가 더 있어. 같이 들어 볼까?', '자비스가 한 번 더 쳐 볼게!']) : G.pick(['북이 신났구나! 같이 세어 볼까?', '자비스가 한 번 더 쳐 볼게!'])); continue; }
    await together();
    break;
  }
  word.classList.remove('hide');
  spans.forEach(function (s) { s.classList.add('on'); }); dots.forEach(function (d) { d.classList.add('on'); });
  await ctx.cheer(G.pick([it.w + '! 북 ' + NUMK[n] + ' 번, 딱 맞아!', '둥둥! 소리랑 북이 똑같아!', '와, 박자 박사다! ' + ss.join(', ') + '!']), drum);
  await ctx.wait(pace(350));
}

/* =================================================================
   8. 말판 (보완대체의사소통 AAC) — 도구
   ================================================================= */
G.act({
  id: 'talkboard', area: 'speech', title: '말판', icon: '💬', order: 99, levels: 1, tool: true, mins: 0, needs: [],
  ef: ['regulate', 'plan'],
  desc: '그림을 눌러서 말해요',
  goal: '보완대체의사소통(AAC) — 말이 어려울 때 그림을 눌러 원하는 것·기분·싫어요를 전하기, 그림 두세 개를 이어 문장 만들기',
  how: '아이가 그림을 누르면 바로 그 말에 반응해 주세요("물!" → 물 주기). 부모도 말하면서 같은 그림을 눌러 보여 주면(모델링) 아이가 훨씬 빨리 배워요. 그림 자리는 바뀌지 않아요 — 손이 먼저 길을 기억하게 해 주세요. 말판을 써도 말은 늦어지지 않고 오히려 도와줘요.',
  basis: '보완대체의사소통(AAC) 핵심 어휘판 · 피츠제럴드 색 구분 · 고정 위치(운동 계획) — AAC 는 말 발달을 막지 않고 돕는다',
  offline: '냉장고에 "물·우유·과자" 그림 카드를 붙여 손가락으로 가리켜 요청하게 하기. 가리키면 바로 주고 "물 주세요!" 말로 들려주기.',
  run: function (ctx) {
    var B = ctx.body, sent = [], tab = 'core', pics = null;
    B.innerHTML = '<div class="tb"><div class="tb-strip"><div class="tb-sent" aria-live="polite"></div>' +
      '<button class="tb-btn tb-del" type="button" aria-label="하나 지우기">⌫</button><button class="tb-btn tb-clr" type="button" aria-label="모두 지우기">🗑</button>' +
      '<button class="tb-btn tb-say" type="button" aria-label="말하기"><b>▶</b><small>말하기</small></button></div>' +
      '<div class="tb-tabs" role="tablist"></div><div class="tb-grid"></div></div>';
    var sentEl = G.$('.tb-sent', B), tabsEl = G.$('.tb-tabs', B), grid = G.$('.tb-grid', B);
    var tabBtns = D.AAC_TABS.map(function (t) {
      var b = G.el('<button class="tb-tab" type="button" role="tab"><span>' + t.e + '</span><small>' + G.esc(t.name) + '</small></button>');
      b.addEventListener('click', function () { G.sfx.play('tap'); tab = t.id; renderTabs(); renderGrid(); });
      b._id = t.id; tabsEl.appendChild(b); return b;
    });
    function renderTabs() { tabBtns.forEach(function (b) { b.classList.toggle('on', b._id === tab); b.setAttribute('aria-selected', b._id === tab ? 'true' : 'false'); }); }
    function tile(it) {
      var b = G.el('<button class="tb-tile" type="button"></button>');
      b.style.setProperty('--tc', it.img ? '#ffffff' : (D.AAC_COLOR[it.k] || '#ffffff'));
      b.innerHTML = (it.img ? '<img alt="">' : '<span class="te">' + it.e + '</span>') + '<span class="tl">' + G.esc(it.w) + '</span>';
      if (it.img) b.querySelector('img').src = it.img;
      b.addEventListener('click', function () { tapTile(it, b); });
      return b;
    }
    function renderGrid() {
      grid.innerHTML = '';
      if (tab === 'mine') {
        if (!pics) { grid.innerHTML = '<p class="tb-note">사진을 불러오고 있어요…</p>'; return; }
        if (!pics.length) { grid.innerHTML = '<p class="tb-note"><b>📷</b>우리 집 사진 카드가 아직 없어요.<br>부모 화면 → 설정 → 우리 집 낱말에서 사진을 넣어 주세요.</p>'; return; }
        pics.forEach(function (p) { grid.appendChild(tile({ w: String(p.w || '').trim() || '우리 집', img: p.img, k: 'thing' })); });
        return;
      }
      (D.AAC[tab] || []).forEach(function (it) { grid.appendChild(tile(it)); });
      grid.scrollTop = 0;
    }
    function sentence() { return sent.map(function (s) { return s.w; }).join(' '); }
    function renderSent() {
      sentEl.innerHTML = '';
      sent.forEach(function (s) {
        var c = G.el('<span class="tb-chip">' + (s.img ? '<img alt="">' : '<i>' + s.e + '</i>') + G.esc(s.w) + '</span>');
        c.style.setProperty('--tc', s.img ? '#ffffff' : (D.AAC_COLOR[s.k] || '#ffffff'));
        if (s.img) c.querySelector('img').src = s.img;
        c.addEventListener('click', function () { G.sfx.play('tap'); ctx.say(s.w, { repeat: false }); });
        sentEl.appendChild(c);
      });
      sentEl.scrollLeft = sentEl.scrollWidth;
      ctx.instr = sentence();       /* 🔊 단추는 지금까지 만든 말을 읽는다 */
    }
    function tapTile(it, b) {
      G.buzz(10);
      b.classList.remove('tap'); void b.offsetWidth; b.classList.add('tap');
      ctx.say(it.w, { repeat: false });
      sent.push(it); if (sent.length > 12) sent.shift();
      renderSent();
      G.store.set('aacCount', (+G.store.get('aacCount', 0) || 0) + 1);
    }
    G.$('.tb-say', B).addEventListener('click', function () {
      if (!sent.length) { G.sfx.play('tap'); ctx.bubble('그림을 눌러서 말을 만들어 봐!'); return; }
      sentEl.classList.add('say'); ctx.timeout(function () { sentEl.classList.remove('say'); }, 1200);
      ctx.say(sentence(), { repeat: false });
    });
    G.$('.tb-del', B).addEventListener('click', function () { G.sfx.play('tap'); sent.pop(); renderSent(); });
    G.$('.tb-clr', B).addEventListener('click', function () { G.sfx.play('whoosh'); sent = []; renderSent(); });
    renderTabs(); renderGrid(); renderSent();
    ctx.bubble('하고 싶은 말을 눌러 봐!');
    G.db.all('pics').then(function (p) {
      if (!ctx.alive) return;
      pics = (p || []).filter(function (x) { return x && x.img; });
      if (tab === 'mine') renderGrid();
    });
  }
});
})();

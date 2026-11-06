/* ===========================================================
   함께 자라요 — 말하기 (언어치료: 말·듣기·입 운동)

     words     낱말 카드        표현 어휘 — 보고 따라 말하기, 3단계는 두 낱말 잇기, 4·5단계는 세·네 낱말 문장
                                6 다섯 낱말 → 7 누가·무엇을·어디서 대답 → 8 그림 보고 두 문장 → 9·10 세 장면 이야기 다시 말하기(10 '왜?')
     listen    듣고 찾기        수용 어휘 — 이름을 듣고 그림 고르기 (4·5단계는 그림 5·6장)
                                6 뜻 듣고 찾기 → 7 "큰 파란 공" → 8 "동물이 아닌 것" → 9 "빨간색이 아닌 공" → 10 단서 둘 수수께끼
     sounds    누구 소리일까?   소리흉내말 — 듣고 찾기, 3단계는 직접 흉내 내기, 5단계는 소리 둘 기억하기
                                6 소리 둘 차례로 → 7 소리 셋 → 8 셋 차례로 → 9 빗소리 속에서 → 10 두 소리 차례로 흉내
     voice     소리 내기        발성·호흡 — 목소리를 길게 내면 로켓이 날아간다 (1초 → 5초 → 10단계 8초)
                                7 작게·힘차게 → 8 높낮이(올라가기·내려가기) → 9 작게 시작해 신호에 힘차게 → 10 섞어서
     mouth     입 운동 거울     구강 운동 모방 — 거울(앞 카메라)로 보며 따라 하기
                                6 퍼퍼퍼(박자 맞춰 빠르게) → 7 퍼터 → 8 퍼터커 → 9 여러 소리 낱말 → 10 잰말놀이
     follow    지시 따르기      1단계 지시 → 꾸밈말+이름 → 두 단계 지시 → 세·네 가지 심부름
                                6 다섯 가지 → 7 "있으면/없으면" → 8 "~하기 전에" → 9 "~만·~말고 모두" → 10 조건 + 차례
     syllable  말소리 북치기    음운 인식 — 한 소리에 북 한 번 (5단계는 시범 없이 혼자)
                                6 두 낱말 말 북치기 → 7 맨 앞 소리 같은 말 → 8 맨 끝 소리 같은 말 → 9 끝말잇기 → 10 첫소리(ㄱ·ㄴ…)
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
/* '사로'·'곰으로' — 받침이 없거나 ㄹ 받침이면 '로' */
function ro(w) { var c = String(w).charCodeAt(String(w).length - 1) - 0xAC00, j = c >= 0 && c <= 11171 ? c % 28 : 0; return w + (j && j !== 8 ? '으로' : '로'); }
/* 낱말 찾기 (D.WORDS) */
function wordOf(w) { return D.WORDS.filter(function (x) { return x.w === w; })[0]; }
/* 지난 차례의 마이크 줄을 거둔다 (한 카드에서 여러 번 말할 때) */
function dropTalk(box) { G.$$('.sp-talk', box).forEach(function (r) { r.remove(); }); }
/* 칸 맞추기 — 칸(1~3)이 오르면 n 문제 가운데 (칸-1)개만 다음 단계 맛보기(2칸 1개·3칸 2개).
   첫 문제는 늘 그 단계 그대로(쉽게 시작). from~to-1 자리에서만 고른다 → [false, true, …] */
function stepMix(ctx, n, from, to) {
  var idx = G.range(n).slice(from == null ? 1 : from, to == null ? n : to);
  var on = G.sample(idx, Math.min(Math.max(0, (ctx.step || 1) - 1), idx.length));
  return G.range(n).map(function (i) { return on.indexOf(i) >= 0; });
}

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
   o: {box, expect:[낱말], lenient(소리만 내도 맞음), whole(문장 통째로 견주기), again()→Promise, labels}
   → Promise<{ok, heard, said, judged}> */
var sttOff = false;      // 이 기기에서 음성 인식이 안 되면, 다시 열 때까지 부모 단추로
function sttReady() { return G.has.stt && !sttOff; }
/* 세·네 낱말 문장(낱말 카드 4·5단계) — 낱말마다 따로 견주면 점수가 낮게 나온다.
   띄어쓰기를 빼고 문장 통째로 한 번 더 견준다. 발음이 조금 서툴러도 75% 비슷하면 맞음(낱말 하나를 통째로 빼면 70% 쯤) */
function wholeScore(res, expect) {
  var best = 0, nos = function (x) { return String(x || '').replace(/\s+/g, ''); };
  (res.alts && res.alts.length ? res.alts : [res.text]).forEach(function (a) {
    (expect || []).forEach(function (w) { best = Math.max(best, G.similar(nos(a), nos(w))); });
  });
  if (best >= 0.75) { res.ok = true; res.score = Math.max(res.score || 0, best); }
  return res;
}

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
        if (o.whole && !res.ok) wholeScore(res, o.expect);
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

/* ---------- 여러 개 고르기 (6단계~) — 차례대로·모두 찾기, 실패 없는 배움 ----------
   o: {box, items, need:[정답…], ordered(need 차례대로), render, label, cols, size,
       onGot(it,el), more(it,found)→말, praise(it)→말, retry(it,next)→말, answer(it,next)→말, idle→말}
   차례만 다른 정답을 누르면 흐리지 않고 "먼저 ~부터" 하고 알려 준다. 두 번째부터는 다음 정답이 빛난다.
   기록은 한 문제에 한 번(처음 틀릴 때만 trial(false)) */
function pickMany(ctx, o) {
  return new Promise(function (resolve) {
    var found = [], miss = 0, done = false, idleN = 0, idleH = null, ch = null;
    function val(v, a, b) { return typeof v === 'function' ? v(a, b) : v; }
    function left() { return o.need.filter(function (t) { return found.indexOf(t) < 0; }); }
    function want() { return o.ordered ? left().slice(0, 1) : left(); }
    function glow() { ch.buttons.filter(function (b) { return want().indexOf(b._item) >= 0; }).forEach(function (b) { G.ui.hint(b); }); }
    function idle() {
      clearTimeout(idleH);
      idleH = ctx.timeout(function () {
        if (done) return;
        idleN++;
        if (idleN >= 2) glow();
        ctx.say(val(o.idle, found), { repeat: false });
        idle();
      }, pace(11000));
    }
    ch = G.ui.choices(o.box, o.items, {
      cols: o.cols, size: o.size, render: o.render, label: o.label,
      onPick: function (it, el) {
        if (done) return true;
        idle();
        if (want().indexOf(it) >= 0) {
          found.push(it); el.disabled = true; G.ui.good(el);
          if (o.onGot) o.onGot(it, el);
          if (found.length < o.need.length) {
            G.sfx.play('good');
            var m = val(o.more, it, found); if (m) ctx.say(m, { repeat: false });
            return false;
          }
          done = true; clearTimeout(idleH);
          if (!miss) ctx.trial(true);
          ctx.cheer(val(o.praise, it), el)
            .then(function () { return ctx.wait(pace(400)); })
            .then(function () { resolve(miss === 0); });
          return true;
        }
        miss++;
        if (miss === 1) ctx.trial(false);
        if (o.need.indexOf(it) < 0) { el.classList.add('dim'); el.disabled = true; }
        var next = want()[0], open = ch.buttons.filter(function (b) { return !b.disabled; }).length;
        if (miss >= 2 || open <= left().length) {
          G.sfx.play('oops'); G.ui.wiggle(el); glow();
          ctx.say(val(o.answer, it, next), { repeat: false });
        } else {
          ctx.oops(val(o.retry, it, next), el);
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
.act-words .wd-pic.sent{font-size:clamp(60px,min(22vw,15vh),140px)}
.act-words .wd-word.long{font-size:clamp(26px,7.4vw,48px);gap:2px 8px}
.act-words .wd-photo{width:clamp(150px,min(54vw,30vh),290px);aspect-ratio:1;object-fit:cover;border-radius:24px;margin-top:6px;display:block}
.act-words .wd-word{font-family:Jua,sans-serif;font-size:clamp(32px,9vw,58px);line-height:1.3;display:flex;gap:2px 10px;flex-wrap:wrap;justify-content:center;letter-spacing:1px}
.act-words .wd-word.syl{gap:2px}
.act-words .wd-word span{display:inline-block;border-radius:14px;padding:0 4px;transition:transform .15s,color .15s,background .15s}
.act-words .wd-word span.on{color:var(--area);background:color-mix(in srgb,var(--area) 14%,transparent);transform:scale(1.15)}
.act-words .wd-tag{position:absolute;top:-10px;right:-6px;background:var(--area);color:#fff;border-radius:999px;padding:2px 10px;font-size:13px;font-family:Jua,sans-serif}
/* 6~10단계 — 물음표 칸·질문·그림 장면·세 장면 이야기 */
.act-words .wd-pic.scene{font-size:clamp(50px,min(18vw,12vh),112px);line-height:1.3;letter-spacing:2px;white-space:nowrap}
.act-words .wd-word span.q{color:var(--area);background:color-mix(in srgb,var(--area) 14%,transparent);min-width:1.6em;text-align:center}
.act-words .wd-ask{font-family:Jua,sans-serif;font-size:clamp(20px,5.6vw,30px);line-height:1.3;text-align:center;color:var(--area);max-width:100%;word-break:keep-all}
.act-words .st-row{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(8px,2.4vw,14px);width:min(100%,560px)}
.act-words .st-p{position:relative;aspect-ratio:1;border-radius:22px;background:var(--surface);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;
  font-size:clamp(28px,min(9.5vw,7vh),60px);line-height:1;white-space:nowrap;transition:transform .2s,box-shadow .2s}
.act-words .st-p b{position:absolute;top:-8px;left:-4px;background:var(--area);color:#fff;border-radius:999px;padding:1px 8px;font-family:Jua,sans-serif;font-weight:400;font-size:13px}
.act-words .st-p.on{box-shadow:0 0 0 5px var(--area),var(--shadow);transform:scale(1.05)}
.act-words .st-p.cover .st-e{visibility:hidden}
.act-words .st-p.cover::after{content:'❓';position:absolute}
.act-words .st-t{font-family:Jua,sans-serif;font-size:clamp(19px,5.2vw,28px);line-height:1.35;text-align:center;min-height:2.7em;max-width:100%;word-break:keep-all;display:flex;align-items:center;justify-content:center}
.act-words .st-name{font-family:Jua,sans-serif;font-size:clamp(16px,4.4vw,20px);color:var(--soft)}

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
.act-listen .fo-svg{width:clamp(70px,min(22vw,15vh),130px);height:clamp(70px,min(22vw,15vh),130px);display:block}
:is(.act-listen,.act-follow) .fo-svg.sm{transform:scale(.58)}

/* ── sounds ── */
.act-sounds .sd-box{position:relative;width:clamp(150px,min(46vw,28vh),240px);aspect-ratio:1;border-radius:36px;background:var(--surface);box-shadow:var(--shadow);
  display:flex;align-items:center;justify-content:center;border:5px dashed color-mix(in srgb,var(--area) 50%,transparent);transition:border-color .3s}
.act-sounds .sd-q{font-size:clamp(70px,min(22vw,14vh),120px);line-height:1;transition:transform .3s}
.act-sounds .sd-box.open{border-style:solid;border-color:var(--good)}
.act-sounds .sd-box.open .sd-q{animation:spIn .45s}
.act-sounds .sd-q.two{font-size:clamp(44px,min(15vw,10vh),80px);display:flex;gap:2px}
.act-sounds .sd-q.two i{font-style:normal;display:inline-block}
.act-sounds .sd-q.two i.got{animation:spIn .45s}
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
.act-sounds .sd-q.two.three{font-size:clamp(34px,min(11vw,7.5vh),60px)}
.act-sounds .sd-rain{font-family:Jua,sans-serif;font-size:clamp(15px,4vw,19px);color:var(--soft)}

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
/* 6~10단계 — 작게·힘차게 줄(막대 눈금)과 신호 */
.act-voice .vo-meter i{position:absolute;left:0;right:0;height:3px;bottom:var(--at,50%);background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.3);display:none}
.act-voice .vo-meter.band i{display:block}
.act-voice .vo-meter.warn b{background:#ffb74d}
.act-voice .vo-cue{position:absolute;left:50%;top:40%;transform:translateX(-50%);font-family:Jua,sans-serif;font-size:clamp(20px,5.6vw,30px);background:rgba(255,255,255,.92);color:#24344a;
  border-radius:999px;padding:4px 16px;white-space:nowrap;opacity:0;transition:opacity .25s;pointer-events:none}
.act-voice .vo-cue.on{opacity:1}
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
.act-mouth .mo-count.hide{visibility:hidden}
/* 6~10단계 — 박자 맞춰 말하기: 한 박자에 한 소리씩 반짝 */
.act-mouth .mo-e.small{font-size:clamp(54px,min(20vw,12vh),110px)}
.act-mouth .mo-syl{display:flex;flex-wrap:wrap;justify-content:center;gap:2px 1px;font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,24px);line-height:1.35;max-width:100%}
.act-mouth .mo-syl:empty{display:none}
.act-mouth .mo-syl span{padding:0 3px;border-radius:8px;transition:background .1s,color .1s,transform .1s}
.act-mouth .mo-syl span.gap{margin-left:8px}
.act-mouth .mo-syl span.done{color:var(--area)}
.act-mouth .mo-syl span.on{background:var(--area);color:#fff;transform:scale(1.15)}

/* ── follow ── */
.act-follow .fo-svg{width:clamp(70px,min(22vw,15vh),130px);height:clamp(70px,min(22vw,15vh),130px);display:block}
.act-follow .fo-steps{display:flex;align-items:center;gap:8px;background:var(--surface);border-radius:20px;box-shadow:var(--shadow);padding:6px 14px;font-size:clamp(26px,7vw,36px);line-height:1.2}
.act-follow .fo-steps{flex-wrap:wrap;justify-content:center;max-width:100%}
.act-follow .fo-steps.many{gap:5px;padding:6px 10px;font-size:clamp(22px,6vw,32px)}
.act-follow .fo-steps.many b{width:22px;height:22px;font-size:14px}
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
/* 7단계 — 살펴볼 그림 상자(누르지 않는 그림) */
.act-follow .fo-show{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(6px,2vw,12px);background:var(--surface);border-radius:24px;box-shadow:var(--shadow);
  padding:clamp(8px,2.4vw,14px);width:min(100%,520px)}
.act-follow .fo-show span{display:flex;align-items:center;justify-content:center;border-radius:14px}
.act-follow .fo-show .fo-svg{width:100%;height:auto;aspect-ratio:1;max-width:110px}
.act-follow .fo-ask{font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,22px);color:var(--soft);text-align:center}

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
/* 6단계 두 낱말 말 — 낱말 사이 띄우기. 7~10단계 소리 찾기 — 작은 카드·첫소리 글자 */
.act-syllable .sy-word span.gap{margin-left:clamp(10px,3vw,18px)}
.act-syllable .sy-card.task .sy-e{font-size:clamp(60px,min(19vw,11vh),112px);line-height:1.3}
.act-syllable .sy-card.task .sy-word{font-size:clamp(28px,8vw,48px)}
.act-syllable .sy-letter{display:inline-flex;align-items:center;justify-content:center;min-width:1.5em;height:1.5em;border-radius:14px;background:var(--area);color:#fff;
  font-family:Jua,sans-serif;font-size:clamp(26px,7.4vw,40px);line-height:1;margin:2px 0 4px}
.act-syllable .choices{max-width:min(100%,640px);margin:0}
.act-syllable .choice{min-height:clamp(104px,min(28vw,17vh),170px)}
.act-syllable .choice .ce{font-size:clamp(48px,min(14vw,10vh),92px);line-height:1.1}
.act-syllable .choice.jump{animation:spJump .6s}

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
.act-talkboard .tb-tabs{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.act-talkboard .tb-tab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:4px 2px;border-radius:14px;background:var(--surface);box-shadow:var(--shadow);min-height:54px}
.act-talkboard .tb-tab span{font-size:clamp(20px,5.6vw,26px);line-height:1.15}
.act-talkboard .tb-tab small{font-size:clamp(10px,2.7vw,13px);font-weight:700;line-height:1.15;color:var(--soft);text-align:center}
.act-talkboard .tb-tab.on{background:var(--area);box-shadow:none}
.act-talkboard .tb-tab.on small{color:#fff}
/* 칸 수·줄 수를 고정 — 어느 탭이든 그림 크기와 자리가 같아야 손이 기억한다 */
.act-talkboard .tb-grid{flex:1;min-height:0;overflow-y:auto;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,minmax(clamp(78px,12vh,150px),1fr));
  grid-auto-rows:minmax(clamp(78px,12vh,150px),1fr);gap:clamp(6px,1.6vw,10px);padding:2px 2px 8px}
/* 화면을 돌려도 칸이 그대로 — 4칸 고정. 자주 쓰는 6낱말은 어느 탭에서나 위에 고정 */
.act-talkboard .tb-core{display:grid;grid-template-columns:repeat(6,1fr);gap:clamp(4px,1.2vw,8px)}
.act-talkboard .tb-core .tb-tile{min-height:clamp(64px,9vh,96px);padding:4px 1px}
.act-talkboard .tb-core .tb-tile .te{font-size:clamp(24px,6.4vw,40px)}
.act-talkboard .tb-core .tb-tile .tl{font-size:clamp(12px,3.2vw,17px)}
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
/* 4·5단계 문장 — 4단계 세 낱말(누가 + 무엇을 + 해요), 5단계 네 낱말(꾸밈말 하나 더·까닭 잇기) */
var WD_SENT = {
  4: [
    { t: '아기가 우유를 마셔요', e: '👶🥛' }, { t: '강아지가 공을 물어요', e: '🐶⚽' }, { t: '고양이가 생선을 먹어요', e: '🐱🐟' },
    { t: '엄마가 책을 읽어요', e: '👩📖' }, { t: '토끼가 당근을 먹어요', e: '🐰🥕' }, { t: '친구가 그림을 그려요', e: '🧒🖍️' },
    { t: '할머니가 꽃을 심어요', e: '👵🌷' }, { t: '새가 하늘을 날아요', e: '🐦☁️' }, { t: '아이가 이를 닦아요', e: '🧒🪥' },
    { t: '곰이 꿀을 먹어요', e: '🐻🍯' }, { t: '아빠가 버스를 타요', e: '👨🚌' }, { t: '나는 손을 씻어요', e: '✋🧼' }
  ],
  5: [
    { t: '아기가 따뜻한 우유를 마셔요', e: '👶🥛' }, { t: '강아지가 빨간 공을 물어요', e: '🐶🔴' }, { t: '고양이가 소파에서 쿨쿨 자요', e: '🐱🛋️' },
    { t: '엄마가 재미있는 책을 읽어요', e: '👩📖' }, { t: '토끼가 주황색 당근을 먹어요', e: '🐰🥕' }, { t: '새가 파란 하늘을 날아요', e: '🐦🌤️' },
    { t: '나는 비누로 손을 씻어요', e: '🧼✋' }, { t: '곰이 달콤한 꿀을 먹어요', e: '🐻🍯' }, { t: '할머니가 예쁜 꽃을 심어요', e: '👵🌷' },
    { t: '비가 와서 우산을 써요', e: '🌧️☂️' }, { t: '배가 고파서 밥을 먹어요', e: '🍚😋' }, { t: '아빠가 노란 버스를 타요', e: '👨🚌' }
  ],
  /* 6단계 — 다섯 낱말(누가 + 어디에서 + 어떤 + 무엇을 + 해요). who·what·at 은 7단계 '누가·무엇을·어디에서' 묻기에 쓴다 */
  6: [
    { t: '아기가 부엌에서 따뜻한 우유를 마셔요', e: '👶🥛', who: '아기', what: '우유', at: '부엌', v: '마셔요' },
    { t: '강아지가 마당에서 빨간 공을 물어요', e: '🐶⚽', who: '강아지', what: '공', at: '마당', v: '물어요' },
    { t: '고양이가 거실에서 동그란 털실을 굴려요', e: '🐱🧶', who: '고양이', what: '털실', at: '거실', v: '굴려요' },
    { t: '엄마가 침대에서 재미있는 책을 읽어요', e: '👩📖', who: '엄마', what: '책', at: '침대', v: '읽어요' },
    { t: '토끼가 밭에서 주황색 당근을 먹어요', e: '🐰🥕', who: '토끼', what: '당근', at: '밭', v: '먹어요' },
    { t: '곰이 숲속에서 달콤한 꿀을 먹어요', e: '🐻🍯', who: '곰', what: '꿀', at: '숲속', v: '먹어요' },
    { t: '아이가 화장실에서 비누로 손을 씻어요', e: '🧒🧼', who: '아이', what: '손', at: '화장실', v: '씻어요' },
    { t: '할머니가 마당에 예쁜 꽃을 심어요', e: '👵🌷', who: '할머니', what: '꽃', at: '마당', v: '심어요', in: true },
    { t: '아빠가 정류장에서 노란 버스를 타요', e: '👨🚌', who: '아빠', what: '버스', at: '정류장', v: '타요' },
    { t: '친구가 공원에서 커다란 연을 날려요', e: '🧒🪁', who: '친구', what: '연', at: '공원', v: '날려요' },
    { t: '새가 나뭇가지에서 예쁜 노래를 불러요', e: '🐦🎶', who: '새', what: '노래', at: '나뭇가지', v: '불러요' },
    { t: '오리가 연못에서 작은 물고기를 찾아요', e: '🦆🐟', who: '오리', what: '물고기', at: '연못', v: '찾아요' }
  ]
};
/* 8단계 — 그림 보고 두 문장으로 말하기. s1 '누가 무엇을 해요', q2·s2 '어디에서·어때요'. k1·k2 는 알아들을 낱말 */
var WD_DESC = [
  { e: '🧒⚽🌳', s1: '아이가 공을 차요', k1: ['아이', '공을', '차요', '축구'], q2: '어디에서 놀고 있을까?', s2: '공원에서 신나게 놀아요', k2: ['공원', '나무', '신나', '놀아'] },
  { e: '👧🎂🎈', s1: '친구가 생일 케이크를 먹어요', k1: ['친구', '케이크', '생일', '먹어'], q2: '친구 기분은 어때 보여?', s2: '친구가 아주 기뻐요', k2: ['기뻐', '좋아', '행복', '신나', '웃어'] },
  { e: '🐶🛁🫧', s1: '강아지가 목욕을 해요', k1: ['강아지', '목욕', '씻어'], q2: '물에 뭐가 있어?', s2: '거품이 보글보글 나요', k2: ['거품', '보글', '비누', '방울'] },
  { e: '👩☂️🌧️', s1: '엄마가 우산을 써요', k1: ['엄마', '우산', '써요', '쓰고'], q2: '날씨는 어때?', s2: '비가 주룩주룩 와요', k2: ['비가', '주룩', '와요', '내려'] },
  { e: '🧒🚲💨', s1: '아이가 자전거를 타요', k1: ['아이', '자전거', '타요'], q2: '어떻게 달리고 있을까?', s2: '쌩쌩 빠르게 달려요', k2: ['쌩쌩', '빠르', '달려', '씽씽'] },
  { e: '👵🌷💧', s1: '할머니가 꽃에 물을 줘요', k1: ['할머니', '꽃에', '물을', '줘요'], q2: '꽃은 어때 보여?', s2: '꽃이 예쁘게 피었어요', k2: ['예쁘', '예뻐', '피었', '활짝'] },
  { e: '🐱😴🛋️', s1: '고양이가 소파에서 자요', k1: ['고양이', '자요', '잠을', '소파'], q2: '고양이 기분은 어떨까?', s2: '고양이가 편안해 보여요', k2: ['편안', '편해', '좋아', '쿨쿨', '졸려'] },
  { e: '🧒🍦☀️', s1: '아이가 아이스크림을 먹어요', k1: ['아이스크림', '먹어', '아이'], q2: '날씨는 어때?', s2: '해가 쨍쨍해서 더워요', k2: ['더워', '쨍쨍', '덥다', '해가'] },
  { e: '👨🍳🥚', s1: '아빠가 달걀을 부쳐요', k1: ['아빠', '달걀', '계란', '부쳐', '요리'], q2: '어디에서 요리할까?', s2: '부엌에서 맛있게 요리해요', k2: ['부엌', '주방', '맛있', '요리'] }
];
/* 9·10단계 — 세 장면 이야기(처음·그다음·마지막) 듣고 다시 말하기. k 는 알아들을 낱말, why 는 10단계 '왜?' 묻기 */
var WD_STORY = [
  { name: '비 오는 날', parts: [
    { e: '🌧️', t: '비가 주룩주룩 내렸어요', k: ['비가', '주룩', '내렸', '와요', '왔어'] },
    { e: '🐻☂️', t: '곰이 노란 우산을 썼어요', k: ['우산', '썼어', '쓰고', '곰이'] },
    { e: '🐻💦', t: '곰은 물웅덩이에서 첨벙첨벙 놀았어요', k: ['웅덩이', '첨벙', '놀았', '물놀이'] }],
    why: { q: '곰은 왜 우산을 썼을까?', a: '비가 와서 우산을 썼어요', k: ['비가', '와서', '내려서', '오니까'] } },
  { name: '아기 새', parts: [
    { e: '🐣🪺', t: '아기 새가 둥지에서 배가 고팠어요', k: ['배가', '고팠', '고파', '둥지', '아기'] },
    { e: '🐦🍒', t: '엄마 새가 빨간 열매를 물어 왔어요', k: ['열매', '엄마', '물어', '가져'] },
    { e: '🐣😋', t: '아기 새가 냠냠 먹고 웃었어요', k: ['냠냠', '먹고', '먹었', '웃었'] }],
    why: { q: '엄마 새는 왜 열매를 물어 왔을까?', a: '아기 새가 배가 고파서 물어 왔어요', k: ['배고파', '배가', '고파서', '고프니까', '먹으라고'] } },
  { name: '눈사람', parts: [
    { e: '❄️', t: '하얀 눈이 펑펑 내렸어요', k: ['눈이', '펑펑', '내렸', '왔어'] },
    { e: '🧒⛄', t: '아이가 커다란 눈사람을 만들었어요', k: ['눈사람', '만들', '커다란'] },
    { e: '⛄🧣', t: '눈사람에게 목도리를 둘러 주었어요', k: ['목도리', '둘러', '감아', '줬어'] }],
    why: { q: '아이는 왜 눈사람에게 목도리를 둘러 주었을까?', a: '추울까 봐 둘러 주었어요', k: ['추워', '추울', '따뜻', '감기'] } },
  { name: '강아지 산책', parts: [
    { e: '🐶🌳', t: '강아지가 공원으로 산책을 갔어요', k: ['산책', '공원', '갔어'] },
    { e: '🐶⚽', t: '강아지가 데굴데굴 공을 쫓아갔어요', k: ['공을', '데굴', '쫓아', '따라'] },
    { e: '🐶💤', t: '집에 와서 쿨쿨 낮잠을 잤어요', k: ['낮잠', '쿨쿨', '잤어', '자요'] }],
    why: { q: '강아지는 왜 낮잠을 잤을까?', a: '많이 뛰어놀아서 피곤했어요', k: ['피곤', '힘들', '졸려', '놀아서', '뛰어서'] } },
  { name: '생일 선물', parts: [
    { e: '🎂', t: '오늘은 친구의 생일이에요', k: ['생일', '친구', '오늘'] },
    { e: '🎁', t: '나는 예쁜 선물을 준비했어요', k: ['선물', '준비', '샀어', '포장'] },
    { e: '🥳', t: '친구가 선물을 받고 활짝 웃었어요', k: ['웃었', '활짝', '받고', '좋아'] }],
    why: { q: '친구는 왜 활짝 웃었을까?', a: '선물을 받아서 기뻤어요', k: ['선물', '받아서', '기뻐', '좋아서'] } },
  { name: '해바라기', parts: [
    { e: '🌱', t: '작은 씨앗을 화분에 심었어요', k: ['씨앗', '심었', '화분'] },
    { e: '💧', t: '날마다 물을 주었어요', k: ['물을', '물', '주었', '줬어'] },
    { e: '🌻', t: '노란 해바라기가 활짝 피었어요', k: ['해바라기', '피었', '꽃이', '활짝'] }],
    why: { q: '해바라기는 왜 활짝 피었을까?', a: '날마다 물을 주어서 피었어요', k: ['물을', '줘서', '주어서', '햇빛', '물'] } },
  { name: '다람쥐', parts: [
    { e: '🐿️🌰', t: '다람쥐가 도토리를 주웠어요', k: ['도토리', '주웠', '다람쥐'] },
    { e: '🐿️🌳', t: '도토리를 나무 구멍에 숨겼어요', k: ['숨겼', '구멍', '나무', '감췄'] },
    { e: '❄️🐿️', t: '겨울이 되자 도토리를 꺼내 먹었어요', k: ['겨울', '꺼내', '먹었'] }],
    why: { q: '다람쥐는 왜 도토리를 숨겼을까?', a: '겨울에 먹으려고 숨겼어요', k: ['겨울', '먹으려고', '먹으려', '배고플'] } },
  { name: '아침', parts: [
    { e: '⏰', t: '따르릉 시계가 울렸어요', k: ['따르릉', '시계', '울렸', '알람'] },
    { e: '🪥', t: '세수하고 이를 닦았어요', k: ['세수', '이를', '닦았', '양치'] },
    { e: '🎒', t: '가방을 메고 학교에 갔어요', k: ['가방', '학교', '갔어', '메고'] }],
    why: { q: '아이는 왜 아침에 일어났을까?', a: '시계가 따르릉 울려서 일어났어요', k: ['시계', '울려서', '따르릉', '알람', '학교'] } }
];

G.act({
  id: 'words', area: 'speech', title: '낱말 카드', icon: '🍎', order: 10, levels: 10, mins: 3, needs: [],
  ef: ['attend', 'wm'],
  desc: '그림 보고 이름 말하기',
  goal: '표현 어휘 늘리기 — 그림·우리 집 사진을 보고 이름을 소리 내어 말하기(따라 말하기 → 스스로 이름 대기), 3단계는 두 낱말 잇기("아기가 자요"). 4단계는 세 낱말 문장("아기가 우유를 마셔요"), 5단계는 네 낱말 문장("아기가 따뜻한 우유를 마셔요"). 6~10단계는 다섯 낱말 문장 → "누가·무엇을·어디에서?" 대답하기 → 그림 보고 두 문장 말하기 → 세 장면 이야기 다시 말하기 → "왜?"까지 대답하기',
  how: '자비스가 말한 뒤에는 아이가 입을 뗄 때까지 5초쯤 조용히 기다려 주세요(기다려 주기). "아과"처럼 서툴러도, 소리만 내도 웃으며 "그래, 사과!" 하고 바른 말을 한 번 더 들려주면 충분해요. 아이가 한 낱말을 말하면 "빨간 사과!"처럼 한 낱말을 더해 돌려주세요(확장하기). 4·5단계 문장은 낱말 하나를 빠뜨려도 "우유를 마셔요!" 하고 문장 전체를 한 번 더 들려주면 돼요.',
  basis: '모방·명명 훈련 + 부모 언어 자극(Hanen: 기다리기·확장하기), 한 낱말 → 두 낱말 표현 발달 단계',
  offline: '밥 먹을 때 숟가락을 들고 "숟가락!" 하고 3초 기다리기. 아이가 소리만 내도 따라 말해 주고 "큰 숟가락!"처럼 한 낱말 더해 주기.',
  run: async function (ctx) {
    var lv = ctx.level, N = 6, TOP = ctx.def.levels;
    if (lv >= 6) return wordsHigh(ctx);
    function phraseCard(p) { return { w: p.t, e: p.e, phrase: true }; }
    function sentCard(p) { return { w: p.t, e: p.e, phrase: true, sent: true }; }
    function wordCardOf(w) { return { w: w.w, e: w.e, src: w }; }
    /* 칸이 오르면 여섯 장 가운데 (칸-1)장을 다음 단계 카드로 — 1단계엔 2단계 낱말, 2단계엔 두 낱말 잇기,
       3단계엔 세 낱말 문장, 4단계엔 네 낱말 문장, 5단계엔 다섯 낱말 문장(6단계 맛보기).
       맨 위 단계는 (칸-1)장을 자비스가 끊어 읽어 주지 않고 한 번에 들려준다(통째로 듣고 따라 말하기) */
    var mix = stepMix(ctx, N), m = mix.filter(Boolean).length, next, cur;
    if (lv >= 3) {
      next = lv < TOP ? G.sample(WD_SENT[lv + 1], m).map(sentCard) : [];
      cur = G.sample(lv === 3 ? D.PHRASES : WD_SENT[lv], N - next.length).map(lv === 3 ? phraseCard : sentCard);
    } else {
      next = lv === 1 ? G.sample(wordPool(2).filter(function (w) { return w.lv === 2; }), m).map(wordCardOf) : G.sample(D.PHRASES, m).map(phraseCard);
      cur = (function () {
        /* 말소리 연구실이 찾은 '어려운 낱말'을 두 개까지 먼저 넣어 더 자주 연습한다 */
        var pool = wordPool(lv), hardW = G.SL && G.SL.hard ? G.SL.hard() : [], K = N - next.length;
        var first = G.shuffle(pool.filter(function (w) { return hardW.indexOf(w.w) >= 0; })).slice(0, 2);
        return first.concat(G.sample(pool.filter(function (w) { return first.indexOf(w) < 0; }), K - first.length));
      })().map(wordCardOf);
    }
    var items = mix.map(function (on) { return on && next.length ? next.shift() : cur.shift(); });
    if (lv === TOP) items.forEach(function (it, i) { if (mix[i]) it.whole = true; });
    ctx.progress(0, N);
    /* 우리 집 사진 카드를 두 장까지 섞는다 — 진짜 사진은 그림보다 잘 배운다 (다음 단계 카드 자리는 비켜서) */
    var pics = (await G.db.all('pics')).filter(function (p) { return p && p.img && p.w && String(p.w).trim(); });
    if (!ctx.alive) return;
    if (pics.length) {
      var ps = G.sample(pics, Math.min(2, pics.length)), at = G.sample(G.range(N).filter(function (i) { return i > 0 && !mix[i]; }), ps.length);
      ps.forEach(function (p, k) { items[at[k]] = { w: String(p.w).trim(), img: p.img, photo: true }; });
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
  var card = G.el('<div class="wd-card">' + (it.photo ? '<span class="wd-tag">📷 우리 집</span><img class="wd-photo" alt="">' : '<div class="wd-pic' + (it.phrase ? ' two' : '') + (it.sent ? ' sent' : '') + '">' + it.e + '</div>') +
    '<div class="wd-word' + (syl ? ' syl' : '') + (it.sent ? ' long' : '') + '">' + chunks.map(function (c) { return '<span>' + G.esc(c) + '</span>'; }).join('') + '</div></div>');
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
  /* whole: 끊어 읽기 없이 한 번 들은 문장을 통째로 따라 말하기 (5단계 2·3칸). 어려우면 다시 들려줄 때 끊어 준다 */
  var cut = chunks.length > 1 && !it.whole;
  if (cut) lightSeq(pace(it.phrase ? 700 : 520));
  await ctx.say((cut ? sayChunks + '. ' : '') + ask);
  var r = await speakTurn(ctx, {
    box: wrap, expect: [w], lenient: lv === 1 || !!it.photo, whole: !!it.sent,
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

/* ---------- 낱말 카드 6~10단계 ----------
   6 다섯 낱말 문장 따라 말하기 · 7 문장을 듣고 '누가·무엇을·어디에서' 대답하기 · 8 그림 보고 두 문장 말하기
   9 세 장면 이야기 다시 말하기 · 10 이야기 + '왜?' 대답하기.
   칸이 오르면 (칸-1)개를 다음 단계 문제로(첫 문제는 늘 그 단계). 10단계(맨 위) 2·3칸은 (칸-1)개 이야기에서
   다시 말할 때 그림을 가려 둔다(기억해서 말하기 — 어려우면 다시 들려줄 때 그림이 열린다) */
async function wordsHigh(ctx) {
  var lv = ctx.level, TOP = ctx.def.levels;
  var N = lv <= 7 ? 6 : lv === 8 ? 4 : 3;
  var mix = stepMix(ctx, N);
  var sents = G.shuffle(WD_SENT[6]), descs = G.shuffle(WD_DESC), stories = G.shuffle(WD_STORY);
  var whs = G.shuffle(['who', 'what', 'at']);
  var items = mix.map(function (on, i) {
    var L = on && lv < TOP ? lv + 1 : lv;
    if (L === 6) { var s6 = sents.shift(); return { k: 'sent', it: { w: s6.t, e: s6.e, phrase: true, sent: true } }; }
    if (L === 7) return { k: 'wh', s: sents.shift(), q: whs[i % 3] };
    if (L === 8) return { k: 'desc', d: descs.shift() };
    return { k: 'story', st: stories.shift(), why: L >= 10, cover: lv === TOP && on };
  });
  ctx.progress(0, N);
  await ctx.say(lv === 6 ? G.pick(['긴 문장 놀이! 자비스가 말하면 끝까지 따라 해 줘.', '그림 카드 놀이! 이번엔 문장이 길어. 같이 말해 보자.']) :
    lv === 7 ? '자비스가 그림 이야기를 들려줄게. 잘 듣고 질문에 대답해 줘!' :
    lv === 8 ? '그림을 보고 두 문장으로 말해 볼까? 자비스가 도와줄게.' :
    '자비스가 짧은 이야기를 들려줄게. 잘 듣고 네가 다시 이야기해 줘!');
  for (var i = 0; i < N; i++) {
    ctx.progress(i, N);
    var x = items[i];
    if (x.k === 'sent') await wordCard(ctx, x.it, lv);
    else if (x.k === 'wh') await whCard(ctx, x.s, x.q);
    else if (x.k === 'desc') await descCard(ctx, x.d);
    else await storyCard(ctx, x.st, x.why, x.cover);
  }
  ctx.progress(N, N);
  ctx.finish({ msg: lv >= 9 ? G.pick(['이야기 박사! 처음부터 끝까지 다 말했어!', '이야기를 정말 잘 기억했어! 말하는 힘이 쑥쑥!']) :
    G.pick(['문장으로 척척 말했어! 정말 멋져!', '긴 말도 잘했어! 말하는 힘이 쑥쑥!']) });
}

/* 7단계 — 문장을 듣고 물음에 대답하기: 누가(who)·무엇을(what)·어디에서(at). 답 자리는 ❓ 로 비워 둔다 */
async function whCard(ctx, s, q) {
  clear(ctx);
  var ans = s[q], chunks = s.t.split(/\s+/);
  var at = Math.max(0, chunks.map(function (c) { return c.indexOf(ans) === 0; }).indexOf(true));
  var wrap = wrapEl(ctx);
  var card = G.el('<div class="wd-card"><div class="wd-pic two sent">' + s.e + '</div><div class="wd-word long">' +
    chunks.map(function (c) { return '<span>' + G.esc(c) + '</span>'; }).join('') + '</div></div>');
  wrap.appendChild(card);
  var spans = G.$$('.wd-word span', card), slot = spans[at];
  var ask = G.el('<div class="wd-ask"></div>'); wrap.appendChild(ask);
  G.sfx.play('pop');
  var place = s.at + (s.in ? '에' : '에서');
  var Q = q === 'who' ? '누가 ' + acc(s.what) + ' ' + s.v + '?' :
    q === 'what' ? subj(s.who) + ' 무엇을 ' + s.v + '?' :
    subj(s.who) + (s.in ? ' 어디에 ' : ' 어디에서 ') + acc(s.what) + ' ' + s.v + '?';
  var full = subj(s.who) + ' ' + place + ' ' + acc(s.what) + ' ' + s.v;
  await ctx.say(G.pick(['잘 들어 봐. ', '그림 이야기야. ']) + s.t + '.', { repeat: false });
  function hide() { slot.textContent = '❓'; slot.classList.add('q'); }
  function show() { slot.textContent = chunks[at]; slot.classList.remove('q'); slot.classList.add('on'); }
  hide();
  ask.textContent = Q;
  await ctx.say(Q);
  var r = await speakTurn(ctx, {
    box: wrap, expect: [ans, G.josa(ans, '이요', '요')], lenient: false, labels: ['👍 대답했어요', '➡️ 다음에'],
    again: function () { show(); return ctx.say('다시 들어 봐. ' + s.t + '. ' + Q, { repeat: false }); }
  });
  ctx.trial(r.ok);
  show();
  if (r.ok) await ctx.cheer(G.pick(['맞아! ', '딩동댕! ', '잘 들었구나! ']) + full + '!', card);
  else if (r.heard) await ctx.cheer(G.pick(['대답해 줘서 고마워! ', '용감하게 말했네! ']) + full + '!', card);
  else await ctx.say('괜찮아! ' + full + '. 다음에 같이 해 보자.', { repeat: false });
  await ctx.wait(pace(350));
}

/* 8단계 — 그림 보고 두 문장으로 말하기. 첫 문장 '누가 무엇을 해요', 둘째 문장은 그림마다 묻는 말(어디에서·어때요).
   못 하면 자비스가 한 문장을 들려주고 따라 말하게 한다(모델링) */
async function descCard(ctx, d) {
  clear(ctx);
  var wrap = wrapEl(ctx);
  var card = G.el('<div class="wd-card"><div class="wd-pic scene">' + d.e + '</div><div class="wd-word long"></div></div>');
  wrap.appendChild(card);
  var line = G.$('.wd-word', card), ask = G.el('<div class="wd-ask"></div>'); wrap.appendChild(ask);
  G.sfx.play('pop');
  var said = [], okAll = true;
  var turns = [{ q: G.pick(['이 그림에서 누가 무엇을 하고 있어?', '누가 뭐 하고 있을까?']), s: d.s1, k: d.k1 }, { q: d.q2, s: d.s2, k: d.k2 }];
  await ctx.say(G.pick(['이 그림을 보고 두 문장으로 말해 볼까?', '그림 이야기를 두 문장으로 만들어 보자!']), { repeat: false });
  for (var j = 0; j < 2; j++) {
    var t = turns[j];
    dropTalk(wrap);
    ask.textContent = (j ? '둘째 문장: ' : '첫 문장: ') + t.q;
    await ctx.say(t.q);
    var r = await speakTurn(ctx, {
      box: wrap, expect: t.k, lenient: false, labels: ['👍 말했어요', '➡️ 다음에'],
      again: (function (tt) { return function () { line.textContent = said.concat([tt.s]).join('. ') + '.'; return ctx.say('자비스는 이렇게 말할래. ' + tt.s + '. 따라 해 볼까?', { repeat: false }); }; })(t)
    });
    ctx.trial(r.ok);
    if (!r.ok) okAll = false;
    said.push(t.s);
    line.textContent = said.join('. ') + '.';
    if (r.ok) await ctx.cheer(G.pick(['멋진 문장이야! ', '잘 말했어! ']) + t.s + '!', card);
    else if (r.heard) await ctx.cheer(G.pick(['말해 줘서 고마워! ', '좋아! ']) + t.s + '!', card);
    else await ctx.say('괜찮아! ' + t.s + '.', { repeat: false });
  }
  dropTalk(wrap);
  ask.textContent = '';
  await ctx.say((okAll ? '두 문장 완성! ' : '두 문장을 같이 만들었어! ') + d.s1 + '. ' + d.s2 + '.', { repeat: false });
  await ctx.wait(pace(350));
}

/* 9·10단계 — 세 장면 이야기: 자비스가 한 장면씩 들려준 뒤, 그림을 보며 '처음·그다음·마지막' 을 아이가 다시 말한다.
   why: 10단계 — 이야기 뒤에 '왜?' 하나. cover: 다시 말할 때 그림을 가려 두기(10단계 2·3칸) */
async function storyCard(ctx, st, why, cover) {
  clear(ctx);
  var wrap = wrapEl(ctx, '<div class="st-name">📖 ' + G.esc(st.name) + '</div><div class="st-row">' +
    st.parts.map(function (p, j) { return '<div class="st-p"><b>' + (j + 1) + '</b><span class="st-e">' + p.e + '</span></div>'; }).join('') + '</div><div class="st-t"></div>');
  var panes = G.$$('.st-p', wrap), text = G.$('.st-t', wrap);
  function on(k) { panes.forEach(function (p, j) { p.classList.toggle('on', j === k); }); }
  G.sfx.play('pop');
  await ctx.say(G.pick(['이야기 시작! 잘 들어 봐.', '자비스 이야기를 들어 볼까?']), { repeat: false });
  for (var j = 0; j < 3; j++) {
    on(j); text.textContent = st.parts[j].t + '.';
    await ctx.say(st.parts[j].t + '.', { repeat: false });
    await ctx.wait(pace(300));
  }
  on(-1); text.textContent = '';
  if (cover) panes.forEach(function (p) { p.classList.add('cover'); });
  await ctx.say(G.pick(['이제 네가 이야기해 줄래? 처음부터!', '이번엔 네 차례! 이야기를 다시 들려줘.']), { repeat: false });
  var CUE = ['처음엔 어떻게 됐지?', '그다음엔 어떻게 됐어?', '마지막엔 어떻게 됐어?'];
  for (j = 0; j < 3; j++) {
    var p = st.parts[j];
    dropTalk(wrap);
    on(j); text.textContent = CUE[j];
    await ctx.say(CUE[j]);
    var r = await speakTurn(ctx, {
      box: wrap, expect: p.k, lenient: false, labels: ['👍 말했어요', '➡️ 다음에'],
      again: (function (pp, pane) { return function () { pane.classList.remove('cover'); text.textContent = pp.t + '.'; return ctx.say('자비스가 도와줄게. ' + pp.t + '. 따라 해 볼까?', { repeat: false }); }; })(p, panes[j])
    });
    ctx.trial(r.ok);
    panes[j].classList.remove('cover');
    text.textContent = p.t + '.';
    if (r.ok) await ctx.cheer(G.pick(['맞아! ', '잘 기억했어! ', '그렇지! ']) + p.t + '!', panes[j]);
    else if (r.heard) await ctx.cheer(G.pick(['말해 줘서 고마워! ', '좋아! ']) + p.t + '!', panes[j]);
    else await ctx.say('괜찮아! ' + p.t + '.', { repeat: false });
  }
  if (why) {
    dropTalk(wrap);
    on(-1); text.textContent = '🤔 ' + st.why.q;
    await ctx.say(G.pick(['하나 더 물어볼게. ', '이번엔 생각 질문! ']) + st.why.q);
    var w = await speakTurn(ctx, {
      box: wrap, expect: st.why.k, lenient: false, labels: ['👍 대답했어요', '➡️ 다음에'],
      again: function () { return ctx.say('힌트! 이야기를 다시 떠올려 봐. ' + st.parts.map(function (x) { return x.t; }).join('. ') + '. ' + st.why.q, { repeat: false }); }
    });
    ctx.trial(w.ok);
    text.textContent = st.why.a + '.';
    if (w.ok) await ctx.cheer(G.pick(['생각 대장! ', '맞아! ', '와, 까닭까지 말했어! ']) + st.why.a + '!');
    else if (w.heard) await ctx.cheer(G.pick(['생각해 줘서 고마워! ', '좋은 생각이야! ']) + st.why.a + '!');
    else await ctx.say('괜찮아! ' + st.why.a + '.', { repeat: false });
  }
  dropTalk(wrap);
  await ctx.wait(pace(350));
}

/* =================================================================
   2. 듣고 찾기 (수용 어휘)
   ================================================================= */
G.act({
  id: 'listen', area: 'speech', title: '듣고 찾기', icon: '👂', order: 20, levels: 10, mins: 2, needs: [],
  ef: ['attend', 'wm'],
  desc: '이름을 듣고 그림을 찾아요',
  goal: '수용 어휘 — 낱말을 듣고 뜻(그림)과 잇기. 말로 표현하기 전에 먼저 알아듣는 말을 늘려요. 4·5단계는 그림이 5·6장으로 늘고, 같은 무리 그림(동물끼리·탈것끼리)이 더 섞여 소리를 끝까지 잘 들어야 해요. 6~10단계는 이름 대신 뜻 듣고 찾기("불을 끄는 차") → 꾸밈말 둘("큰 파란 공") → "동물이 아닌 것" → "빨간색이 아닌 공" → 단서 둘 수수께끼',
  how: '아이가 고르기 전에 정답을 손가락으로 가리키지 말고 기다려 주세요. 찾으면 "맞아, 강아지! 멍멍!" 하고 이름을 한 번 더 들려주세요. 틀리게 고르면 "이건 고양이야" 하고 그 그림 이름도 알려 주면 두 낱말을 함께 배워요.',
  basis: '수용 어휘 과제(그림 어휘력 검사 형식) + 무오류 학습(두 번째엔 정답 표시)',
  offline: '장난감 두세 개를 바닥에 놓고 "공 어디 있어?" 찾기. 찾으면 "공 굴려!"처럼 이어서 놀기.',
  run: async function (ctx) {
    var lv = ctx.level, N = 6, k = lv + 1, TOP = ctx.def.levels;
    if (lv >= 6) return listenHigh(ctx);
    /* 낱말은 3단계까지 — 4·5단계는 같은 낱말에서 그림이 하나씩 늘고(5·6장) 같은 무리 그림이 더 섞인다 */
    function wl(L) { return Math.min(L, 3); }
    var pool = wordPool(lv === 1 ? 1 : lv === 2 ? 2 : 3);
    /* 칸이 오르면 여섯 문제 가운데 (칸-1)문제를 다음 단계처럼 — 다음 단계 낱말(3단계까지) + 그림 하나 더.
       5단계는 (칸-1)문제가 6단계 '뜻 듣고 찾기'(맛보기) */
    var up = lv < 5, mix = stepMix(ctx, N), nextPool = up ? wordPool(wl(lv + 1)) : pool;
    var nx = up ? G.sample(nextPool.filter(function (w) { return lv < 3 ? w.lv === lv + 1 : true; }), mix.filter(Boolean).length) : [];
    var rid = lv === 5 ? G.sample(lsRiddles(), mix.filter(Boolean).length) : [];
    var cur = G.sample(pool.filter(function (w) { return nx.indexOf(w) < 0 && !rid.some(function (r) { return r.t === w; }); }), N - nx.length);
    var isNx = [];
    var targets = mix.map(function (on, i) { if (on && nx.length) { isNx[i] = 1; return nx.shift(); } return cur.shift(); });
    ctx.progress(0, N);
    await ctx.say(G.pick(['숨바꼭질 놀이! 자비스가 부르는 친구를 찾아 줘. 귀를 쫑긋!', '자비스가 이름을 부르면 콕 찾아 줘! 잘 들어 봐.']));
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      if (lv === 5 && mix[i] && rid.length) { await riddleItem(ctx, rid.shift(), 6); continue; }
      var t = targets[i], L = isNx[i] ? lv + 1 : lv;
      /* 같은 무리 그림: 3단계 1장 · 4단계 2장 · 5단계 3장 */
      var P = L > lv ? nextPool : pool, kk = L + 1, S = L - 2;
      var others = L === 1 ? G.sample(P.filter(function (w) { return w.c !== t.c; }), kk - 1)
        : L >= 3 ? (function () {
          var same = G.sample(P.filter(function (w) { return w.c === t.c && w !== t; }), S);
          return same.concat(G.sample(P.filter(function (w) { return w !== t && same.indexOf(w) < 0; }), kk - 1 - same.length));
        })()
          : G.sample(P.filter(function (w) { return w !== t; }), kk - 1);
      await listenItem(ctx, t, others, kk);
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
    box: wrap, items: G.shuffle([t].concat(others)), label: false, cols: k > 4 ? 3 : k, size: k >= 4 ? 'md' : 'lg',
    isRight: function (it) { return it === t; },
    onRight: function (it, el) { el.classList.add('jump'); },
    praise: function () { return G.pick(['맞아! ', '찾았다! ', '딩동댕! ', '우와, 잘 들었구나! ']) + t.w + '!'; },
    after: function () { var ex = expand(t); return ex ? ctx.say(ex, { repeat: false }) : null; },
    retry: function (it) { return '이건 ' + isYa(it.w) + '. ' + acc(t.w) + ' 찾아볼까?'; },
    answer: function (it) { return '이건 ' + isYa(it.w) + '. ' + topic(t.w) + ' 여기 있어! 반짝반짝!'; },
    idle: q
  });
}

/* ---------- 듣고 찾기 6~10단계 ----------
   6 뜻 듣고 찾기(이름 대신 "불을 끄는 차", 같은 무리 그림 사이에서) · 7 꾸밈말 둘 "큰 파란 공"
   8 "동물이 아닌 것" · 9 "빨간색이 아닌 공"·"공이 아닌 빨간 것" · 10 단서 둘 수수께끼(단서 하나로는 헷갈리는 그림이 섞인다).
   칸이 오르면 (칸-1)문제를 다음 단계 문제로. 10단계(맨 위) 2·3칸은 (칸-1)문제에 헷갈리는 그림 한 장 더 */
/* 6단계 — 뜻 듣고 찾기. w 정답(D.WORDS), not 함께 나오면 헷갈려서 빼는 낱말 */
var LS_RIDDLE = [
  { q: '불을 끄는 차', w: '소방차' }, { q: '아픈 사람을 태우는 차', w: '구급차' },
  { q: '하늘을 나는 탈것', w: '비행기', not: ['헬리콥터', '로켓'] }, { q: '물 위에 떠서 가는 탈것', w: '배' },
  { q: '페달을 밟아서 타는 것', w: '자전거' }, { q: '시간을 알려 주는 물건', w: '시계', not: ['전화'] },
  { q: '비 올 때 쓰는 물건', w: '우산' }, { q: '종이를 싹둑 자르는 물건', w: '가위' }, { q: '문을 여는 물건', w: '열쇠' },
  { q: '이를 닦는 물건', w: '칫솔' }, { q: '추울 때 손에 끼는 것', w: '장갑' }, { q: '눈이 잘 보이게 쓰는 것', w: '안경', not: ['모자'] },
  { q: '머리에 쓰는 것', w: '모자', not: ['안경'] }, { q: '코가 아주 긴 동물', w: '코끼리' }, { q: '음매 하고 우는 동물', w: '소' },
  { q: '꼬끼오 하고 아침을 알리는 동물', w: '닭', not: ['병아리'] }, { q: '엉금엉금 기어가는 동물', w: '거북이', not: ['뱀'] },
  { q: '꿀을 모으는 곤충', w: '벌', not: ['나비'] }, { q: '비가 그친 뒤 하늘에 뜨는 일곱 빛깔', w: '무지개' },
  { q: '밤하늘에 반짝반짝 빛나는 것', w: '별', not: ['달'] }, { q: '겨울에 눈으로 만드는 것', w: '눈사람' },
  { q: '아플 때 치료해 주는 사람', w: '의사' }, { q: '껍질을 까서 먹는 노란 과일', w: '바나나', not: ['귤', '옥수수'] },
  { q: '겉은 초록색, 속은 빨간 과일', w: '수박' }
];
/* 10단계 — 단서 둘. pics 헷갈리는 그림(단서 하나만 맞는 그림), more 맨 위 단계 2·3칸에 한 장 더 */
var LS_RIDDLE2 = [
  { q: '하늘을 날고, 날개가 빙글빙글 도는 탈것', w: '헬리콥터', pics: ['비행기', '로켓', '새', '자동차'], more: '배' },
  { q: '빨갛고, 불을 끄는 차', w: '소방차', pics: ['자동차', '구급차', '경찰차', '사과'], more: '불' },
  { q: '노랗고, 껍질을 까서 먹는 과일', w: '바나나', pics: ['귤', '달걀', '병아리', '딸기'], more: '해' },
  { q: '초록색이고, 개굴개굴 우는 동물', w: '개구리', pics: ['뱀', '거북이', '오리', '병아리'], more: '나무' },
  { q: '하얗고, 깡충깡충 뛰는 동물', w: '토끼', pics: ['양', '개구리', '강아지', '고양이'], more: '눈사람' },
  { q: '날개가 있고, 꿀을 모으는 곤충', w: '벌', pics: ['나비', '새', '비행기', '꽃'], more: '부엉이' },
  { q: '밤에 뜨고, 작게 반짝반짝 빛나는 것', w: '별', pics: ['달', '해', '부엉이', '무지개'], more: '불' },
  { q: '시간을 알려 주고, 똑딱똑딱 소리 나는 물건', w: '시계', pics: ['전화', '북', '열쇠', '컵'], more: '책' },
  { q: '알을 낳고, 꼬끼오 우는 동물', w: '닭', pics: ['병아리', '오리', '새', '부엉이'], more: '달걀' },
  { q: '물에 살고, 뻐끔뻐끔 헤엄치는 동물', w: '물고기', pics: ['오리', '개구리', '거북이', '배'], more: '물' },
  { q: '추울 때 끼고, 손가락이 다섯 개 있는 것', w: '장갑', pics: ['모자', '양말', '손', '눈사람'], more: '신발' },
  { q: '타고 다니고, 따르릉 소리를 내는 것', w: '자전거', pics: ['전화', '자동차', '버스', '기차'], more: '시계' }
];
/* 8단계 '아닌 것' 무리 이름 */
var LS_NOT = { food: '먹는 것', animal: '동물', vehicle: '탈것', people: '사람' };

/* 뜻 수수께끼를 낱말과 이어 둔다 (정답·헷갈리는 낱말이 D.WORDS 에 있는 것만) */
function lsRiddles() {
  return LS_RIDDLE.map(function (r) { return { q: r.q, t: wordOf(r.w), not: r.not || [] }; }).filter(function (r) { return r.t; });
}
/* 귀 단추 + 그림 고르기 한 문제 — o: {q(물음), items, isRight, praise, retry, answer, cols, size, render, label} */
function earPick(ctx, o) {
  var wrap = wrapEl(ctx, '<button class="ls-ear" type="button" aria-label="다시 듣기"><span>👂</span>잘 들어 봐!</button>');
  var ear = wrap.querySelector('.ls-ear');
  function ask() { ear.classList.add('talk'); return ctx.say(o.q).then(function () { ear.classList.remove('talk'); }); }
  ear.onclick = function () { G.sfx.play('tap'); ask(); };
  ask();
  return pickOne(ctx, {
    box: wrap, items: o.items, label: !!o.label, cols: o.cols || (o.items.length > 4 ? 3 : o.items.length), size: o.size || (o.items.length >= 4 ? 'md' : 'lg'), render: o.render,
    isRight: o.isRight, onRight: function (it, el) { el.classList.add('jump'); },
    praise: o.praise, after: o.after, retry: o.retry, answer: o.answer, idle: o.q
  });
}

async function listenHigh(ctx) {
  var lv = ctx.level, N = 6, TOP = ctx.def.levels;
  var mix = stepMix(ctx, N);
  var rid = G.shuffle(lsRiddles()), rid2 = G.shuffle(LS_RIDDLE2), cats = G.shuffle(Object.keys(LS_NOT));
  ctx.progress(0, N);
  await ctx.say(lv === 6 ? '수수께끼 듣기 놀이! 자비스 설명을 잘 듣고 맞는 그림을 찾아 줘.' :
    lv === 10 ? '단서가 두 개인 수수께끼야! 끝까지 잘 듣고 찾아 줘.' :
    G.pick(['귀를 쫑긋! 자비스 말을 끝까지 잘 듣고 찾아 줘.', '잘 듣기 대장 놀이! 끝까지 듣고 콕 찾아 줘.']));
  for (var i = 0; i < N; i++) {
    ctx.progress(i, N);
    clear(ctx);
    var L = mix[i] && lv < TOP ? lv + 1 : lv;
    if (L === 6) await riddleItem(ctx, rid.shift(), 6);
    else if (L === 7) await attrItem(ctx);
    else if (L === 8) await notItem(ctx, cats[i % cats.length]);
    else if (L === 9) await notAttrItem(ctx);
    else await riddle2Item(ctx, rid2.shift(), lv === TOP && mix[i]);
  }
  ctx.progress(N, N);
  ctx.finish({ msg: G.pick(['끝까지 잘 듣고 다 찾았어! 귀가 정말 밝구나!', '어려운 말도 척척! 듣는 힘이 쑥쑥!']) });
}

/* 6단계 — 뜻 듣고 찾기: 같은 무리 그림(동물끼리·탈것끼리) 사이에서 */
function riddleItem(ctx, r, k) {
  var t = r.t, pool = wordPool(3).filter(function (w) { return w !== t && w.e !== t.e && r.not.indexOf(w.w) < 0; });
  var same = G.sample(pool.filter(function (w) { return w.c === t.c; }), k - 1);
  var others = same.concat(G.sample(pool.filter(function (w) { return same.indexOf(w) < 0; }), k - 1 - same.length));
  return earPick(ctx, {
    q: G.pick([acc(r.q) + ' 찾아 줘!', topic(r.q) + ' 어디 있을까?', acc(r.q) + ' 콕 눌러 봐!']),
    items: G.shuffle([t].concat(others)), isRight: function (it) { return it === t; },
    praise: function () { return G.pick(['맞아! ', '딩동댕! ', '수수께끼 대장! ']) + r.q + ', ' + t.w + '!'; },
    retry: function (it) { return '이건 ' + isYa(it.w) + '. ' + acc(r.q) + ' 찾아볼까?'; },
    answer: function (it) { return '이건 ' + isYa(it.w) + '. ' + topic(r.q) + ' ' + t.w + '! 여기 있어!'; }
  });
}

/* 7단계 — 크기·색·이름 세 가지 듣고 찾기("큰 파란 공"). 여섯 그림이 모두 하나씩만 다르다 */
function lsName(it) { return (it.big ? '큰 ' : '작은 ') + foName(it); }
function attrItem(ctx) {
  var os = G.sample(Object.keys(FO_OBJ), 2), cs = G.sample(foColors(), 2);
  var items = [];
  [[os[0], cs[0]], [os[0], cs[1]], [os[1], cs[0]]].forEach(function (p) { [true, false].forEach(function (b) { items.push({ o: p[0], c: p[1], big: b }); }); });
  var t = G.pick(items), name = lsName(t);
  return earPick(ctx, {
    q: G.pick([acc(name) + ' 찾아 줘!', acc(name) + ' 콕 눌러 봐!']), items: G.shuffle(items), render: foSvg, cols: 3, size: 'md',
    isRight: function (it) { return it === t; },
    praise: function () { return G.pick(['맞아! ', '딩동댕! ', '크기도 색도 잘 들었구나! ']) + name + '!'; },
    retry: function (it) { return '이건 ' + isYa(lsName(it)) + '. ' + acc(name) + ' 찾아볼까?'; },
    answer: function (it) { return '이건 ' + isYa(lsName(it)) + '. ' + topic(name) + ' 여기 있어!'; }
  });
}

/* 8단계 — '~이 아닌 것': 같은 무리 다섯 장 + 다른 무리 한 장 */
function notItem(ctx, c) {
  var pool = wordPool(3), name = LS_NOT[c];
  var five = G.sample(pool.filter(function (w) { return w.c === c; }), 5);
  /* 다른 무리 한 장 — 몸(손·발)과, '동물이 아닌 것'에 사람은 헷갈리니 빼고 */
  var t = G.pick(pool.filter(function (w) { return w.c !== c && w.c !== 'body' && !(c === 'animal' && w.c === 'people'); }));
  var q = subj(name) + ' 아닌 것을 찾아 줘!';
  return earPick(ctx, {
    q: q, items: G.shuffle([t].concat(five)), isRight: function (it) { return it === t; },
    praise: function () { return G.pick(['맞아! ', '딩동댕! ', '잘 들었구나! ']) + topic(t.w) + ' ' + subj(name) + ' 아니야!'; },
    retry: function (it) { return '이건 ' + isYa(it.w) + '. ' + topic(it.w) + ' ' + G.josa(name, '이야', '야') + '. ' + subj(name) + ' 아닌 걸 찾아볼까?'; },
    answer: function () { return '여기 있어! ' + topic(t.w) + ' ' + subj(name) + ' 아니야!'; }
  });
}

/* 9단계 — 꾸밈말 + '아닌': "빨간색이 아닌 공" 또는 "공이 아닌 빨간 것" */
function colWord(c) { var x = COL_FULL[c.adj] || c.adj; return /색$/.test(x) ? x : x + '색'; }
function notAttrItem(ctx) {
  var os = G.sample(Object.keys(FO_OBJ), 2), A = Math.random() < 0.5, cols = foColors();
  /* "공이 아닌 빨간 것" 꼴은 꾸밈말이 자연스러운 빨간·노란·파란만 */
  var c = G.pick(A ? cols : cols.filter(function (x) { return ['red', 'yellow', 'blue'].indexOf(x.id) >= 0; }));
  var c2 = G.pick(cols.filter(function (x) { return x !== c; }));
  var o = os[0], o2 = os[1], t, rest;
  if (A) { t = { o: o, c: c2 }; rest = [{ o: o, c: c }, { o: o, c: c }, { o: o2, c: c }, { o: o2, c: c }, { o: o2, c: c2 }]; }
  else { t = { o: o2, c: c }; rest = [{ o: o, c: c }, { o: o, c: c }, { o: o2, c: c2 }, { o: o2, c: c2 }, { o: o, c: c2 }]; }
  var name = A ? subj(colWord(c)) + ' 아닌 ' + FO_OBJ[o].n : subj(FO_OBJ[o].n) + ' 아닌 ' + c.adj + ' 것';
  return earPick(ctx, {
    q: acc(name) + ' 찾아 줘!', items: G.shuffle([t].concat(rest)), render: foSvg, cols: 3, size: 'md',
    isRight: function (it) { return it === t; },
    praise: function () { return G.pick(['맞아! ', '딩동댕! ', '끝까지 잘 들었구나! ']) + name + ', ' + foName(t) + '!'; },
    retry: function (it) { return '이건 ' + isYa(foName(it)) + '. ' + acc(name) + ' 찾아볼까?'; },
    answer: function (it) { return '이건 ' + isYa(foName(it)) + '. ' + topic(name) + ' 여기 있어! ' + foName(t) + '!'; }
  });
}

/* 10단계 — 단서 둘 수수께끼 */
function riddle2Item(ctx, r, more) {
  var t = wordOf(r.w), others = r.pics.concat(more && r.more ? [r.more] : []).map(wordOf).filter(Boolean);
  return earPick(ctx, {
    q: G.pick([acc(r.q) + ' 찾아 줘!', topic(r.q) + ' 무엇일까?']), items: G.shuffle([t].concat(others)), cols: 3, size: 'md',
    isRight: function (it) { return it === t; },
    praise: function () { return G.pick(['맞아! ', '딩동댕! ', '단서 둘을 다 들었구나! ']) + t.w + '!'; },
    retry: function (it) { return '이건 ' + isYa(it.w) + '. 단서를 하나씩 생각해 볼까? ' + r.q + '!'; },
    answer: function (it) { return '이건 ' + isYa(it.w) + '. ' + topic(r.q) + ' ' + t.w + '! 여기 있어!'; }
  });
}

/* =================================================================
   3. 누구 소리일까? (소리흉내말)
   ================================================================= */
/* 6~10단계 문제 차례 — two 두 친구(차례 상관없이) · seq2 둘을 들린 차례대로 · three 셋 · seq3 셋 차례대로
   seq3n 작은 빗소리 속에서 셋 차례대로 · say 흉내 내기 · say2 두 소리를 차례로 흉내 내기 */
var SD_KINDS = {
  6: ['two', 'seq2', 'say', 'seq2', 'say', 'seq2'],
  7: ['seq2', 'three', 'say', 'three', 'say', 'three'],
  8: ['three', 'seq3', 'say', 'seq3', 'say', 'seq3'],
  9: ['seq3', 'seq3n', 'say', 'seq3n', 'say', 'seq3n'],
  10: ['seq3n', 'say2', 'seq3n', 'say2', 'seq3n', 'say2']
};
/* 다음 단계 맛보기 — 칸이 오르면 이 자리 가운데 (칸-1)개를 다음 단계 새 문제로 */
var SD_NEXT = { 5: [[2, 4], 'seq2'], 6: [[1, 3, 5], 'three'], 7: [[1, 3, 5], 'seq3'], 8: [[1, 3, 5], 'seq3n'], 9: [[2, 4], 'say2'] };
var SD_N = { seq2: 2, three: 3, seq3: 3, seq3n: 3, say2: 2 };
G.act({
  id: 'sounds', area: 'speech', title: '누구 소리일까?', icon: '🐶', order: 30, levels: 10, mins: 3, needs: [],
  ef: ['attend', 'wm'],
  desc: '멍멍! 누구 소리인지 찾아요',
  goal: '소리흉내말(멍멍·부릉부릉) 이해와 표현 — 첫 낱말이 나오기 쉬운 소리부터. 3단계는 그림을 보고 직접 소리 흉내 내기. 4단계는 흉내 내기가 세 번(탈것 소리까지), 5단계는 소리 둘을 듣고 기억해 두 친구를 다 찾기. 6~10단계는 들린 차례대로 찾기 → 소리 셋 기억하기 → 셋을 차례대로 → 작은 빗소리 속에서 듣기 → 두 소리를 차례로 흉내 내기(청각 기억·소음 속 듣기)',
  how: '소리흉내말은 아이가 가장 먼저 따라 하기 쉬운 말이에요. 자비스가 소리를 내면 부모도 몸짓과 함께 크게 따라 해 주세요("멍멍!" 하며 강아지 손). 아이가 소리를 내면 "강아지가 멍멍!"처럼 이름을 붙여 넓혀 주세요.',
  basis: '의성어·의태어 — 초기 표현 어휘의 디딤돌(소리 모방 → 낱말), 청각 변별',
  offline: '동물 그림책을 보며 엄마가 "멍멍!" 하고 아이 차례를 기다리기. 산책길 자동차엔 "빵빵!", 비 오는 날엔 "주룩주룩!"',
  run: async function (ctx) {
    var lv = ctx.level, N = 6, k = Math.min(lv, 3) + 1, TOP = ctx.def.levels, opt = { cats: ['animal', 'vehicle'], sound: true };
    var pool = wordPool(Math.min(lv, 3), opt);
    /* 4단계: 고르기 셋 + 흉내 내기 셋(둘은 탈것 소리). 5단계: 흉내 셋 + '두 친구 찾기' 둘(소리 둘을 듣고 둘 다 찾기) */
    var kinds = lv === 3 ? ['pick', 'pick', 'say', 'pick', 'pick', 'say'] : lv === 4 ? ['pick', 'say', 'pick', 'say', 'pick', 'say']
      : lv === 5 ? ['pick', 'say', 'two', 'say', 'two', 'say'] : lv >= 6 ? SD_KINDS[lv].slice() : ['pick', 'pick', 'pick', 'pick', 'pick', 'pick'];
    /* 칸이 오르면 여섯 문제 가운데 (칸-1)문제를 다음 단계처럼 — 다음 단계 친구 + 그림 하나 더('next').
       2단계 3칸은 그 둘 중 하나가 '직접 소리 내기'(3단계 맛보기).
       3단계는 소리 내기 (칸-1)문제에 탈것 소리(부릉부릉·삐뽀삐뽀)도 나온다(4단계 맛보기).
       4단계는 고르기 (칸-1)문제가 '두 친구 찾기'(5단계 맛보기), 5~9단계는 SD_NEXT 자리 (칸-1)개가 다음 단계 새 문제.
       10단계(맨 위)는 빗소리 문제 (칸-1)개에 그림 한 장 더 */
    var nextPool = lv < 3 ? wordPool(lv + 1, opt) : pool, big = {};
    if (lv < 3) {
      var mixAt = stepMix(ctx, N).map(function (on, i) { return on ? i : -1; }).filter(function (i) { return i >= 0; });
      mixAt.forEach(function (i) { kinds[i] = 'next'; });
      if (lv === 2 && mixAt.length >= 2) kinds[mixAt[mixAt.length - 1]] = 'say';
    }
    if (lv === 4) G.sample([2, 4], ctx.step - 1).forEach(function (i) { kinds[i] = 'two'; });
    if (SD_NEXT[lv]) G.sample(SD_NEXT[lv][0], ctx.step - 1).forEach(function (i) { kinds[i] = SD_NEXT[lv][1]; });
    if (lv === TOP) G.sample([2, 4], ctx.step - 1).forEach(function (i) { big[i] = 1; });
    var easy = pool.filter(function (w) { return w.c === 'animal' && hangul(w.s).length <= 4; });
    /* 몇 번째 흉내부터 탈것 소리인지 — 3단계는 셋째부터(칸이 오르면 앞당김), 4·5단계는 둘째부터 */
    var hardFrom = lv >= 4 ? 2 : 3 - (lv === 3 ? ctx.step - 1 : 0), says = 0;
    var used = {}, list = [];
    kinds.forEach(function (kind) {
      var src;
      if (kind === 'two') {
        var a = G.pick(pool.filter(function (w) { return !used[w.w]; })); used[a.w] = 1;
        var b = G.pick(pool.filter(function (w) { return !used[w.w] && w.s !== a.s; })); used[b.w] = 1;
        list.push([a, b]); return;
      }
      if (SD_N[kind]) {
        /* 소리가 서로 다른 친구 둘·셋 */
        var grp = [];
        while (grp.length < SD_N[kind]) {
          var g = G.pick(pool.filter(function (w) { return !used[w.w] && grp.every(function (x) { return x.s !== w.s; }); }));
          used[g.w] = 1; grp.push(g);
        }
        list.push(grp); return;
      }
      if (kind === 'next') src = nextPool.filter(function (w) { return w.lv === lv + 1 && !used[w.w]; });
      else if (kind === 'say') {
        says++;
        src = (says >= hardFrom ? pool.filter(function (w) { return easy.indexOf(w) < 0; }) : easy).filter(function (w) { return !used[w.w]; });
      } else src = pool.filter(function (w) { return !used[w.w]; });
      if (!src.length) src = pool.filter(function (w) { return !used[w.w]; });
      var w = G.pick(src); used[w.w] = 1; list.push(w);
    });
    ctx.progress(0, N);
    await ctx.say(lv >= 6 ? G.pick(['소리 상자에 친구들이 숨었어! 소리를 잘 듣고 기억해서 찾아 줘.', '쉿, 소리가 여러 개 들려! 잘 듣고 기억해 볼까?']) :
      G.pick(['소리 상자에 누가 숨었을까? 소리를 잘 듣고 찾아 줘!', '쉿, 무슨 소리가 들려! 누구 소리인지 찾아볼까?']));
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      if (kinds[i] === 'say') await soundSay(ctx, list[i]);
      else if (kinds[i] === 'say2') await soundSay2(ctx, list[i]);
      else if (SD_N[kinds[i]]) await soundMany(ctx, list[i], pool, list[i].length + 2 + (big[i] ? 1 : 0), { ordered: /^seq/.test(kinds[i]), noise: kinds[i] === 'seq3n' });
      else if (kinds[i] === 'two') await soundTwo(ctx, list[i], pool, big[i] ? k + 1 : k);
      else if (kinds[i] === 'next') await soundPick(ctx, list[i], nextPool, k + 1);
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

/* 두 친구 찾기 (5단계) — 소리 둘을 듣고 기억해서 두 친구를 다 찾는다. 순서는 상관없다.
   틀리면 흔들리고, 두 번째에는 남은 친구가 빛난다(실패 없는 배움). 기록은 한 문제에 한 번 */
function soundTwo(ctx, ts, pool, k) {
  clear(ctx);
  var wrap = wrapEl(ctx, '<button class="sd-box" type="button" aria-label="소리 다시 듣기"><span class="sd-q two"><i>❓</i><i>❓</i></span><span class="sd-w"><i></i><i></i><i></i></span></button>');
  var box = wrap.querySelector('.sd-box'), qs = G.$$('.sd-q i', box);
  var sounds = {}, others = [];
  ts.forEach(function (t) { sounds[t.s] = 1; });
  G.shuffle(pool).forEach(function (w) { if (others.length < k - 2 && ts.indexOf(w) < 0 && !sounds[w.s]) { sounds[w.s] = 1; others.push(w); } });
  var line = ts[0].s + '! ' + ts[1].s + '! ' + G.pick(['두 친구는 누구 누구일까?', '누구 누구 소리일까? 둘 다 찾아 줘!', '소리가 둘! 두 친구를 다 찾아볼까?']);
  function play() { box.classList.add('play'); return ctx.say(line).then(function () { box.classList.remove('play'); }); }
  box.onclick = function () { G.sfx.play('tap'); play(); };
  play();
  return new Promise(function (resolve) {
    var found = [], miss = 0, done = false, idleN = 0, idleH = null, ch = null;
    function left() { return ts.filter(function (t) { return found.indexOf(t) < 0; }); }
    function leftSay() { return left().map(function (t) { return t.s; }).join(', '); }
    function glow() { ch.buttons.filter(function (b) { return left().indexOf(b._item) >= 0; }).forEach(function (b) { G.ui.hint(b); }); }
    function idle() {
      clearTimeout(idleH);
      idleH = ctx.timeout(function () {
        if (done) return;
        idleN++;
        if (idleN >= 2) glow();
        ctx.say(found.length ? leftSay() + '! 이 소리는 누구일까?' : line, { repeat: false });
        idle();
      }, pace(11000));
    }
    var items = G.shuffle(ts.concat(others));
    ch = G.ui.choices(wrap, items, {
      cols: items.length > 4 ? 3 : items.length, size: items.length >= 4 ? 'md' : 'lg', label: false,
      onPick: function (it, el) {
        if (done) return true;
        idle();
        if (left().indexOf(it) >= 0) {
          found.push(it); el.disabled = true; G.ui.good(el);
          var q = qs[ts.indexOf(it)]; q.textContent = it.e; q.classList.add('got');
          if (found.length < ts.length) {
            G.sfx.play('good');
            ctx.say(G.pick(['맞아! ', '찾았다! ']) + subj(it.w) + ' ' + it.s + '! ' + G.pick(['또 누가 있었지?', '한 친구 더!', '다른 소리는 누구였을까?']), { repeat: false });
            return false;
          }
          done = true; clearTimeout(idleH);
          if (!miss) ctx.trial(true);
          box.classList.remove('play'); box.classList.add('open');
          ctx.cheer(G.pick(['둘 다 찾았어! ', '딩동댕! 두 친구 다! ', '기억 대장! ']) + subj(ts[0].w) + ' ' + ts[0].s + ', ' + subj(ts[1].w) + ' ' + ts[1].s + '!', el)
            .then(function () { return ctx.wait(pace(400)); })
            .then(function () { resolve(miss === 0); });
          return true;
        }
        miss++;
        if (miss === 1) ctx.trial(false);
        el.classList.add('dim'); el.disabled = true;
        var open = ch.buttons.filter(function (b) { return !b.disabled; }).length;
        if (miss >= 2 || open <= left().length) {
          G.sfx.play('oops'); G.ui.wiggle(el); glow();
          ctx.say(topic(it.w) + ' ' + it.s + '! 반짝이는 친구가 ' + leftSay() + '!', { repeat: false });
        } else {
          ctx.oops(topic(it.w) + ' ' + it.s + '! ' + leftSay() + ' 소리는 누구일까?', el);
        }
        return false;
      }
    });
    idle();
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

/* 빗소리 (9·10단계) — 시끄러운 곳에서도 듣기 연습. 작고 부드러운 소리(차분 모드는 더 작게), 효과음을 끄면 없다.
   멈춤 함수를 돌려준다 (놀이를 나가도 멈춘다) */
function rain(ctx) {
  var a = G.settings.sound ? G.sfx.ctx : null;
  if (!a) return function () {};
  var n = a.sampleRate * 2, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0), lo = 0;
  for (var i = 0; i < n; i++) { lo = lo * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = lo * 5 + (Math.random() * 2 - 1) * 0.12; }
  var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), off = false;
  s.buffer = b; s.loop = true; f.type = 'lowpass'; f.frequency.value = 1800;
  g.gain.setValueAtTime(0.0001, a.currentTime); g.gain.exponentialRampToValueAtTime(calm() ? 0.04 : 0.08, a.currentTime + 0.4);
  s.connect(f); f.connect(g); g.connect(a.destination); s.start();
  function stop() { if (off) return; off = true; try { g.gain.setTargetAtTime(0.0001, a.currentTime, 0.12); s.stop(a.currentTime + 0.6); } catch (e) {} }
  ctx.cleanup(stop);
  return stop;
}

/* 여러 소리 기억하기 (6단계~) — 소리 둘·셋을 듣고 친구를 다 찾는다.
   o.ordered: 들린 차례대로 · o.noise: 빗소리 속에서 듣기. k: 그림 수 */
function soundMany(ctx, ts, pool, k, o) {
  clear(ctx);
  var n = ts.length;
  var wrap = wrapEl(ctx, '<button class="sd-box" type="button" aria-label="소리 다시 듣기"><span class="sd-q two' + (n > 2 ? ' three' : '') + '">' + ts.map(function () { return '<i>❓</i>'; }).join('') +
    '</span><span class="sd-w"><i></i><i></i><i></i></span></button>' + (o.noise ? '<div class="sd-rain">🌧️ 빗소리 속에서 잘 들어 봐</div>' : ''));
  var box = wrap.querySelector('.sd-box'), qs = G.$$('.sd-q i', box);
  var sounds = {}, others = [];
  ts.forEach(function (t) { sounds[t.s] = 1; });
  G.shuffle(pool).forEach(function (w) { if (others.length < k - n && ts.indexOf(w) < 0 && !sounds[w.s]) { sounds[w.s] = 1; others.push(w); } });
  var line = ts.map(function (t) { return t.s; }).join('! ') + '! ' + (o.ordered ? G.pick(['들린 차례대로 찾아 줘!', '처음 소리부터 차례로 찾아볼까?']) :
    G.pick(['누구 누구일까? 다 찾아 줘!', '소리가 ' + NUMK[n] + ' 개! 친구들을 다 찾아볼까?']));
  var all = ts.map(function (t) { return subj(t.w) + ' ' + t.s; }).join(', ');
  function play() {
    box.classList.add('play');
    var hush = o.noise ? rain(ctx) : null;
    return ctx.say(line).then(function () { box.classList.remove('play'); if (hush) hush(); });
  }
  box.onclick = function () { G.sfx.play('tap'); play(); };
  play();
  var items = G.shuffle(ts.concat(others));
  return pickMany(ctx, {
    box: wrap, items: items, need: ts, ordered: !!o.ordered, label: false,
    cols: items.length > 4 ? 3 : items.length, size: items.length >= 4 ? 'md' : 'lg',
    onGot: function (it) { var q = qs[ts.indexOf(it)]; q.textContent = it.e; q.classList.add('got'); },
    more: function (it) { return G.pick(['맞아! ', '찾았다! ']) + subj(it.w) + ' ' + it.s + '! ' + (o.ordered ? G.pick(['그다음은?', '다음 소리는 누구였지?']) : G.pick(['또 누가 있었지?', '다른 소리는 누구였을까?'])); },
    praise: function (it) { box.classList.remove('play'); box.classList.add('open'); return G.pick([o.ordered ? '차례대로 다 찾았어! ' : '다 찾았어! ', '기억 대장! ', '딩동댕! ']) + all + '!'; },
    retry: function (it, nx) {
      if (o.ordered && ts.indexOf(it) >= 0) return topic(it.w) + ' ' + it.s + '! 맞아, 있었지. 그런데 그 전에 들린 소리부터!';
      return topic(it.w) + ' ' + it.s + '! ' + (o.ordered ? '처음부터 차례로 떠올려 볼까?' : '이 소리는 없었어. 다시 떠올려 볼까?');
    },
    answer: function (it, nx) { return topic(it.w) + ' ' + it.s + '! ' + (o.ordered ? '반짝이는 친구부터! ' + nx.s + '!' : '반짝이는 친구들을 찾아 줘!'); },
    idle: function () { return line; }
  });
}

/* 두 소리를 차례로 흉내 내기 (10단계) — 그림 둘을 보고 "멍멍, 빵빵!" 차례로 말하기.
   두 소리가 다 들려야 '맞음'(하나만 말해도 칭찬하고 둘 다 들려준다) */
async function soundSay2(ctx, ts) {
  clear(ctx);
  var wrap = wrapEl(ctx, '<div class="sd-box open"><span class="sd-q two">' + ts.map(function (t) { return '<i>' + t.e + '</i>'; }).join('') + '</span></div><div class="sd-name">' + G.esc(ts[0].w + ' → ' + ts[1].w) + '</div>');
  var box = wrap.querySelector('.sd-box');
  G.sfx.play('pop');
  var both = ts.map(function (t) { return t.s; }).join(', ');
  var ask = ts[0].w + ', 그다음 ' + ts[1].w + '! 두 친구 소리를 차례로 내 볼까?';
  var model = both + '! ' + G.pick(['같이 해 보자.', '너도 해 볼까?']);
  await ctx.say(sttReady() ? ask : ask + ' ' + model);
  var r = await speakTurn(ctx, {
    box: wrap, expect: [ts[0].s + ' ' + ts[1].s], whole: true, lenient: false, labels: ['👍 소리 냈어요', '➡️ 다음에'],
    again: function () { return ctx.say(model, { repeat: false }); }
  });
  /* 알아들었으면 두 소리가 다 있는지 한 번 더 본다 */
  var ok = r.ok && (!r.heard || ts.every(function (t) { return G.similar(r.said, t.s) >= 0.5; }));
  ctx.trial(ok);
  if (ok) await ctx.cheer(G.pick(['차례대로 똑같다! ', '흉내 대장! ', '와, 두 소리 다! ']) + both + '!', box);
  else if (r.heard) await ctx.cheer('멋진 소리야! 차례로 ' + both + '!', box);
  else await ctx.say('괜찮아! ' + both + '! 다음에 같이 해 보자.', { repeat: false });
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
/* 6~10단계 — 한 번 소리 낼 때 할 일 하나 더 (판마다). plain 그냥 길게 · soft 작게(하얀 줄 아래) · loud 힘차게(줄 위, 소리 지르기 아님)
   up·down 높낮이 올라가기·내려가기 · switch 작게 시작해서 반짝 신호에 힘차게 */
var VO_MODES = {
  6: ['plain', 'plain', 'plain', 'plain', 'plain'],
  7: ['plain', 'soft', 'loud', 'soft', 'loud'],
  8: ['plain', 'up', 'down', 'up', 'down'],
  9: ['soft', 'switch', 'loud', 'switch', 'switch'],
  10: ['soft', 'up', 'switch', 'down', 'loud']
};
var VO_SOFT = 0.55, VO_LOUD = 0.3;      /* 막대 높이(0~1) — 작게는 이 아래, 힘차게는 이 위 */
var VO_TAG = { plain: '길게', soft: '작게', loud: '힘차게', up: '↗ 위로', down: '↘ 아래로', 'switch': '작게→힘차게' };
function voLine(md, vw) {
  return md === 'soft' ? '이번엔 작은 목소리로! ' + vw.v + '~ 살살 길게. 막대가 하얀 줄을 넘지 않게.' :
    md === 'loud' ? '이번엔 힘찬 목소리로 ' + vw.v + '~! 소리 지르지 말고, 배에 힘을 주고 길게.' :
    md === 'up' ? '사이렌처럼! 낮은 소리에서 높은 소리로 ' + vw.v + '~ 쭉 올라가 볼까?' :
    md === 'down' ? '미끄럼틀처럼! 높은 소리에서 낮은 소리로 ' + vw.v + '~ 쭉 내려와 볼까?' :
    '처음엔 작게, 반짝 신호가 나오면 힘차게! ' + vw.v + '~';
}
/* 목소리 높이가 올라갔나(1)·내려갔나(-1) — 앞 1/3 과 뒤 1/3 가운데 값 비교 (칭찬에만 쓴다) */
function voSlope(pts) {
  function mid(a) { a = a.slice().sort(function (x, y) { return x - y; }); return a.length ? a[Math.floor(a.length / 2)] : 0; }
  var a = mid(pts.filter(function (x) { return x[0] < 0.35; }).map(function (x) { return x[1]; }));
  var b = mid(pts.filter(function (x) { return x[0] > 0.65; }).map(function (x) { return x[1]; }));
  return !a || !b ? 0 : b > a * 1.08 ? 1 : b < a / 1.08 ? -1 : 0;
}

G.act({
  id: 'voice', area: 'speech', title: '소리 내기', icon: '🚀', order: 40, levels: 10, mins: 2, needs: ['mic'],
  ef: ['regulate', 'attend'],
  desc: '아~ 길게! 목소리로 로켓 띄우기',
  goal: '발성 시작·길게 소리 내기(호흡 지지) — 목소리를 눈으로 보며 크기와 길이를 스스로 조절하기. 1단계 1초 → 3단계 3초 → 4단계 4초 → 5단계 5초(한 숨에 길게). 6~10단계는 6초 → 8초로 길어지며 작게·힘차게, 높낮이(사이렌처럼 올라가기·내려가기), 신호에 맞춰 크기 바꾸기가 하나씩 더해져요',
  how: '부모가 먼저 "아~" 하고 길게 소리 내 보여 주고, 아이와 함께 소리 내도 괜찮아요(로켓은 함께 낸 소리에도 날아가요). 소리가 작아도 "소리 났다!" 하고 바로 칭찬해 주세요. 마이크가 안 되면 아이가 단추를 꾹 누르며 "아~" 하게 하고, 부모가 소리를 냈는지 눌러 주세요. 7단계부터의 "힘차게"는 소리 지르기가 아니에요 — 배에 힘을 주고 또렷하게 내는 소리예요(목이 아프지 않게).',
  basis: '발성 유도·호흡 지지 — 소리를 눈으로 보여 주는 시각적 바이오피드백, 모음 연장 발성',
  offline: '휴지 조각을 손바닥에 놓고 "아~" 길게 소리 내며 누가 더 오래 하나 놀이. 엘리베이터에서 "우~" 하며 위로 올라가기.',
  run: function (ctx) {
    /* 길게 낼 시간 — 칸마다 0.3초쯤 더 길게 (1 → 1.3 → 1.7 → 2초 … 3 → 3.3 → 3.7 → 4초 … 5 → 5.3 → 5.7 → 6초).
       6~10단계는 6 → 8초(10살 아이가 한 숨에 낼 수 있는 10초 남짓보다 짧게). 같은 길이인 단계(6·8)는 할 일이 하나 더 는다 */
    var lv = ctx.level, TOP = ctx.def.levels, GOAL = ctx.tune([10, 20, 30, 40, 50, 60, 60, 70, 70, 80]) / 10, ROUNDS = 5, TH = 0.1;
    /* 판마다 할 일 — 칸이 오르면 (칸-1)판을 다음 단계 할 일로 (6~9단계) */
    var modes = VO_MODES[lv] ? VO_MODES[lv].slice() : null;
    if (modes && lv < TOP && VO_MODES[lv + 1]) stepMix(ctx, ROUNDS).forEach(function (on, i) { if (on) modes[i] = VO_MODES[lv + 1][i]; });
    var B = ctx.body;
    B.innerHTML = '<div class="sp"><div class="vo-sky"><span class="vo-cloud c1">☁️</span><span class="vo-cloud c2">☁️</span><span class="vo-goal"></span>' +
      '<span class="vo-who"><span class="vo-e"></span><span class="vo-fire">🔥</span></span><div class="vo-meter"><b></b><i></i></div><span class="vo-cue"></span></div>' +
      '<div class="vo-bot"><div class="vo-mouth"><span></span><small>입 모양</small></div>' +
      /* 아이 화면에는 소수점 없이 '2초'처럼 */
      '<div class="vo-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle class="bg" cx="50" cy="50" r="42"/><circle class="fg" cx="50" cy="50" r="42"/></svg><b><span></span><small>' + Math.round(GOAL) + '초 길게</small></b></div>' +
      '<button class="btn big vo-hold" type="button" hidden>🗣️ 꾹 누르고 아~</button></div></div>';
    var wrap = G.$('.sp', B), who = G.$('.vo-who', B), whoE = G.$('.vo-e', B), goal = G.$('.vo-goal', B), meter = G.$('.vo-meter b', B),
      fire = G.$('.vo-fire', B), ring = G.$('.vo-ring .fg', B), ringT = G.$('.vo-ring b span', B), mouth = G.$('.vo-mouth span', B), hold = G.$('.vo-hold', B),
      meterBox = G.$('.vo-meter', B), cue = G.$('.vo-cue', B), ringS = G.$('.vo-ring b small', B);
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
      var md = modes ? modes[r] : 'plain';
      showCue(''); meterBox.classList.remove('warn');
      ringS.textContent = md === 'switch' ? VO_TAG[md] : Math.round(GOAL) + '초 ' + VO_TAG[md];
      band(md === 'switch' ? 'soft' : md);
      var line = r === 0 ? '목소리로 ' + acc(th.name) + ' 띄워 보자! ' + vw.v + '~ 하고 길게 소리 내면 ' + subj(th.name) + ' ' + th.place + '까지 날아가!' :
        md !== 'plain' ? '' : G.pick([th.name + '야, ' + th.place + '까지 가자! ' + vw.v + '~ 길게!', '이번엔 ' + vw.v + '~ 소리! ' + subj(th.name) + ' 기다리고 있어.', vw.v + '~ 하고 길게 불러 볼까? ' + th.place + '까지 슝!']);
      if (md !== 'plain') line += (line ? ' ' : '') + voLine(md, vw);
      if (fallback && r === 0) line += ' 단추를 꾹 누르면서 소리 내 봐!';
      ctx.say(line).then(function () { fly(th, vw, md); });
    }
    /* 작게·힘차게 줄 — 막대에 하얀 줄을 긋는다 (마이크가 있을 때만) */
    function band(md) {
      var at = md === 'soft' ? VO_SOFT : md === 'loud' ? VO_LOUD : 0;
      meterBox.classList.toggle('band', !!at && !!mic);
      meterBox.style.setProperty('--at', Math.round(at * 100) + '%');
    }
    function showCue(t) { t = t || ''; if (cue._t === t) return; cue._t = t; cue.textContent = t; cue.classList.toggle('on', !!t); }
    function fly(th, vw, md) {
      var held = 0, cont = 0, quiet = 9, t0 = performance.now(), over = false, nudged = false, pts = [], late = false, cueH = null;
      md = md || 'plain';
      var judgeH = fallback ? null : ctx.timeout(function () {
        if (over) return;
        /* 오래 걸리면 부모가 대신 판단할 수 있게 (마이크가 작게 잡는 기기) */
        ctx.parentJudge(wrap, ['👍 소리 냈어요', '➡️ 다음']).then(function (yes) { judgeEl = null; if (over) return; over = true; done(th, vw, yes, true); });
        judgeEl = wrap.lastElementChild;
      }, pace(Math.max(15000, GOAL * 1000 + 9000)));
      ctx.loop(function (dt) {
        if (over) return false;
        var lvl = 0, on = false;
        if (mic) { lvl = G.voice.speaking ? 0 : mic.level(); on = lvl > TH; }
        else { on = holding; lvl = holding ? 0.55 + Math.random() * 0.25 : 0; }
        if (on) quiet = 0; else quiet += dt;
        var voiced = on || (quiet < 0.22 && cont > 0);   // 아주 짧게 끊겨도 이어진 소리로
        /* 작게·힘차게: 크기가 맞지 않으면 로켓이 잠깐 멈춘다(줄어들지는 않는다). 마이크가 없으면 따지지 않는다 */
        var want = md === 'switch' ? (late ? 'loud' : 'soft') : md;
        var fit = !mic || !on || (want === 'soft' ? lvl <= VO_SOFT : want === 'loud' ? lvl >= VO_LOUD : true);
        if (voiced && fit) { held += dt; cont += dt; }
        else if (voiced) cont += dt;
        else { held = Math.max(0, held - dt * 0.7); if (quiet > 0.35) cont = 0; }
        if (cont > best) best = cont;
        var p = Math.min(1, held / GOAL);
        setP(p, lvl, voiced);
        if (md !== 'plain') {
          meterBox.classList.toggle('warn', !fit);
          if (md === 'switch' && !late && p >= 0.5) {
            late = true; band('loud'); showCue('🔊 이제 힘차게!');
            clearTimeout(cueH); cueH = ctx.timeout(function () { cueH = null; showCue(''); }, 1600);
          } else if (!fit && !cueH) showCue(want === 'soft' ? '🤫 조금 더 작게~' : '💪 조금 더 힘차게!');
          else if (fit && !cueH) showCue('');
          if (mic && on && (md === 'up' || md === 'down')) { var f = mic.pitch(); if (f > 0) pts.push([p, f]); }
        }
        if (mic && !nudged && performance.now() - t0 > pace(8000) && p < 0.3) {
          nudged = true;
          ctx.say(G.pick(['자비스랑 같이! ' + vw.v + '~', '작은 소리도 좋아. ' + vw.v + '~ 해 볼까?', '엄마랑 같이 ' + vw.v + '~ 해도 돼!']), { repeat: false });
        }
        if (p >= 1) {
          over = true; clearTimeout(judgeH); clearTimeout(cueH); cueH = null; showCue(''); meterBox.classList.remove('warn');
          var sl = voSlope(pts);
          done(th, vw, true, false, md === 'up' && sl > 0 ? '사이렌처럼 쭉 올라갔어! 목소리 높이도 척척!' : md === 'down' && sl < 0 ? '미끄럼틀처럼 쭉 내려왔어! 멋지다!' :
            md === 'soft' ? '살살 작은 목소리로 끝까지! 목소리 조절 대장!' : md === 'loud' ? '힘찬 목소리 최고! 소리 지르지 않고도 또렷해!' :
            md === 'switch' ? '작게 하다가 힘차게! 신호를 잘 봤구나!' : '');
          return false;
        }
      });
    }
    function done(th, vw, ok, judged, note) {
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
        if (yes) return ctx.cheer(note || G.pick([th.place + '에 도착! 목소리가 정말 길다!', '슝! ' + subj(th.name) + ' 날아갔어! 최고야!', '와, 길게 소리 냈어! 목소리 힘이 세다!', vw.v + '~ 소리 멋지다!']));
        return ctx.say(G.pick(['괜찮아! 다음엔 같이 소리 내 보자.', '좋아, 다음 친구한테 가 보자!']), { repeat: false });
      }).then(function () {
        r++; ctx.progress(r, ROUNDS);
        ctx.extra.best = Math.round(best * 10) / 10;
        ctx.extra.score = ctx.extra.best;        /* 가장 길게 이어 낸 소리(초) — 내 기록 */
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
  3: ['혀 위로', '똑딱 혀', '말발굽', '아에이오우', '휘파람 입', '빠빠빠'],
  /* 4단계 — 혀·입술·볼을 더 섬세하게(돌리기·떨기·옮기기·번갈아 하기) */
  4: ['혀 돌리기', '입술 부르르', '볼 옮기기', '우이우이', '혀 위아래', '말발굽'],
  /* 5단계 — 두 동작 잇기와 퍼터커(입술 → 혀끝 → 혀뿌리 차례로) */
  5: ['퍼터커', '메롱 위로', '빵빵 뽀뽀', '혀 돌리기', '우이우이', '입술 부르르'],
  /* 6~10단계 — 박자에 맞춰 말하기(교대 운동). 6 한 소리 빠르게 되풀이(퍼퍼퍼) · 7 두 소리 번갈아(퍼터)
     8 세 소리 잇기(퍼터커) · 9 여러 소리 낱말(데굴데굴) · 10 짧은 잰말놀이(간장 공장 공장장) */
  6: ['볼 옮기기', '퍼퍼퍼', '메롱 위로', '터터터', '빵빵 뽀뽀', '커커커'],
  7: ['퍼퍼퍼', '퍼터 퍼터', '커커커', '터커 터커', '혀 돌리기', '퍼커 퍼커'],
  8: ['퍼터 퍼터', '퍼터커 세 번', '아이우', '터커 터커', '바다가', '우이우이'],
  9: ['바다가', '데굴데굴', '보글보글', '알록달록', '울퉁불퉁', '바나나 우유'],
  10: ['퍼터커 세 번', '빨간 공 파란 공', '간장 공장 공장장', '딱따구리 딱딱', '내가 그린 기린 그림', '개구리 개굴개굴']
};
/* 4·5단계 입 운동 (data.js 의 D.MOUTH 와 같은 꼴) */
var MO_MORE = [
  { e: '😋', name: '혀 돌리기', say: '혀로 입술을 따라 빙글빙글 한 바퀴 돌려요.' },
  { e: '🏍️', name: '입술 부르르', say: '입술을 살짝 붙이고 부르르르~ 떨어요. 오토바이 소리처럼!' },
  { e: '🎈', name: '볼 옮기기', say: '볼에 바람을 넣고, 이쪽 볼에서 저쪽 볼로 옮겨요.' },
  { e: '🎵', name: '우이우이', say: '입술을 쭉 내밀어 우~, 활짝 웃어 이~. 우, 이, 우, 이!' },
  { e: '🍭', name: '혀 위아래', say: '혀를 쏙 내밀고 위로, 아래로! 사탕을 핥듯이.' },
  { e: '🥁', name: '퍼터커', say: '입술로 퍼, 혀끝으로 터, 목 안쪽으로 커. 퍼, 터, 커!' },
  { e: '😜', name: '메롱 위로', say: '혀를 쏙 내밀었다가, 코 쪽으로 쭉 올려요. 메롱, 위로!' },
  { e: '😚', name: '빵빵 뽀뽀', say: '볼을 빵빵하게 했다가, 바람을 빼고 쭉 뽀뽀 입!' },
  /* 6~10단계 — rep: 박자 하나에 한 소리(띄어 쓴 곳은 낱말 사이). 자비스가 먼저 천천히 들려주고, 아이가 박자에 맞춰 말한다 */
  { e: '💋', name: '퍼퍼퍼', say: '입술을 꼭 붙였다가 퍼! 박자에 맞춰 다섯 번. 퍼, 퍼, 퍼, 퍼, 퍼.', rep: '퍼 퍼 퍼 퍼 퍼' },
  { e: '👅', name: '터터터', say: '혀끝으로 윗니 뒤를 톡! 박자에 맞춰 다섯 번. 터, 터, 터, 터, 터.', rep: '터 터 터 터 터' },
  { e: '😮', name: '커커커', say: '목 안쪽에서 커! 박자에 맞춰 다섯 번. 커, 커, 커, 커, 커.', rep: '커 커 커 커 커' },
  { e: '🎵', name: '퍼터 퍼터', say: '입술로 퍼, 혀끝으로 터! 번갈아 세 번. 퍼터, 퍼터, 퍼터.', rep: '퍼터 퍼터 퍼터' },
  { e: '🎶', name: '터커 터커', say: '혀끝으로 터, 목 안쪽으로 커! 번갈아 세 번. 터커, 터커, 터커.', rep: '터커 터커 터커' },
  { e: '🥁', name: '퍼커 퍼커', say: '입술로 퍼, 목 안쪽으로 커! 번갈아 세 번. 퍼커, 퍼커, 퍼커.', rep: '퍼커 퍼커 퍼커' },
  { e: '🚂', name: '퍼터커 세 번', say: '퍼, 터, 커를 기차처럼 이어서 세 번! 퍼터커, 퍼터커, 퍼터커.', rep: '퍼터커 퍼터커 퍼터커' },
  { e: '🌊', name: '바다가', say: '입술 바, 혀끝 다, 목 안쪽 가! 세 번 이어서. 바다가, 바다가, 바다가.', rep: '바다가 바다가 바다가' },
  { e: '😃', name: '아이우', say: '입을 크게 아, 옆으로 이, 쭉 내밀어 우! 세 번. 아이우, 아이우, 아이우.', rep: '아이우 아이우 아이우' },
  { e: '🍌', name: '바나나 우유', say: '천천히 또박또박! 바나나 우유, 바나나 우유.', rep: '바나나 우유 바나나 우유' },
  { e: '⚽', name: '데굴데굴', say: '공이 데굴데굴 굴러가요. 데굴데굴, 데굴데굴!', rep: '데굴데굴 데굴데굴' },
  { e: '🫧', name: '보글보글', say: '입술로 보, 혀로 글! 보글보글, 보글보글.', rep: '보글보글 보글보글' },
  { e: '🌈', name: '알록달록', say: '혀끝을 톡톡! 알록달록, 알록달록.', rep: '알록달록 알록달록' },
  { e: '🛣️', name: '울퉁불퉁', say: '울퉁불퉁 길을 가요. 울퉁불퉁, 울퉁불퉁!', rep: '울퉁불퉁 울퉁불퉁' },
  { e: '🎈', name: '빨간 공 파란 공', say: '잰말놀이! 입술을 톡톡. 빨간 공, 파란 공, 노란 공.', rep: '빨간 공 파란 공 노란 공' },
  { e: '🏭', name: '간장 공장 공장장', say: '잰말놀이! 천천히 먼저. 간장, 공장, 공장장.', rep: '간장 공장 공장장' },
  { e: '🐦', name: '딱따구리 딱딱', say: '잰말놀이! 혀끝으로 딱딱. 딱따구리 딱딱, 똑딱똑딱.', rep: '딱따구리 딱딱 똑딱똑딱' },
  { e: '🦒', name: '내가 그린 기린 그림', say: '잰말놀이! 천천히 먼저. 내가 그린, 기린 그림.', rep: '내가 그린 기린 그림' },
  { e: '🐸', name: '개구리 개굴개굴', say: '잰말놀이! 목 안쪽으로. 개구리 개굴개굴, 개굴개굴.', rep: '개구리 개굴개굴 개굴개굴' }
];
var MO_ANIM = { '똑딱 혀': 'tick', '빠빠빠': 'bounce', '말발굽': 'bounce', '아에이오우': 'bounce',
  '혀 돌리기': 'tick', '볼 옮기기': 'tick', '입술 부르르': 'bounce', '우이우이': 'bounce', '혀 위아래': 'bounce', '퍼터커': 'bounce' };

G.act({
  id: 'mouth', area: 'speech', title: '입 운동 거울', icon: '👄', order: 50, levels: 10, mins: 3, needs: ['cam'],
  ef: ['attend', 'plan'],
  desc: '거울 보며 입 모양 따라 하기',
  goal: '입술·혀·볼 근육 움직이기와 모방 — 또렷한 발음의 바탕. 거울로 자기 입을 보며 움직임을 스스로 맞춰 가기. 4단계는 혀 돌리기·입술 떨기처럼 더 섬세한 움직임, 5단계는 두 동작 잇기와 "퍼터커". 6~10단계는 박자에 맞춰 빠르게 말하기 — 퍼퍼퍼 → 퍼터 번갈아 → 퍼터커 → 여러 소리 낱말(데굴데굴) → 짧은 잰말놀이(박자가 조금씩 빨라져요)',
  how: '부모도 아이 옆에서 같이 거울을 보며 과장되게 따라 해 주세요 — 아이는 화면보다 엄마 얼굴을 더 잘 따라 해요. 셋을 세는 동안 자세를 유지하면 최고! 비슷하게만 해도 「따라 했어요」를 눌러 주세요. 카메라가 없어도 할 수 있어요.',
  basis: '구강 운동 모방(입술·혀·볼) — 언어치료 입 근육 놀이, 거울 시각 피드백',
  offline: '양치 전 욕실 거울 앞에서 엄마와 "메롱·뽀뽀·볼 빵빵" 따라 하기. 빨대로 물 마시기, 비눗방울 불기.',
  run: async function (ctx) {
    var lv = ctx.level, TOP = ctx.def.levels, names = MO_SETS[lv].slice(), all = D.MOUTH.concat(MO_MORE);
    /* 칸이 오르면 (칸-1)개를 다음 단계 입 운동으로 바꿔 미리 해 본다 (5단계엔 6단계 '퍼퍼퍼' 같은 박자 말하기).
       10단계(맨 위)는 칸이 오르면 박자만 조금 더 빨라진다 */
    if (lv < TOP) {
      var nx = G.sample(MO_SETS[lv + 1].filter(function (n) { return names.indexOf(n) < 0; }), ctx.step - 1);
      stepMix(ctx, names.length).forEach(function (on, i) { if (on && nx.length) names[i] = nx.shift(); });
    }
    var beat = 750;    /* 자세 버티기 — 하나, 둘, 셋 한 박자 */
    /* 박자 말하기 한 박자(ms) — 6단계 0.7초 → 10단계 0.5초(1초에 두 소리, 3학년이 애써서 하는 빠르기보다 느리게) */
    var rbeat = ctx.tune([800, 800, 800, 800, 800, 700, 650, 600, 550, 500]);
    var list = names.map(function (n) { return all.filter(function (m) { return m.name === n; })[0]; }).filter(Boolean);
    var N = list.length;
    var wrap = wrapEl(ctx, '<div class="mo-pair"><div class="mo-model"><span class="mo-tag">자비스</span><span class="mo-e"></span><b class="mo-n"></b><div class="mo-syl"></div></div>' +
      '<div class="mo-mirror"><span class="mo-tag">나</span><video playsinline muted autoplay></video><div class="mo-nocam"><span>🪞</span><small>엄마 아빠 얼굴을 보며<br>같이 따라 해요</small></div></div></div>' +
      '<div class="mo-count"><i></i><i></i><i></i></div>');
    var model = G.$('.mo-model', wrap), moE = G.$('.mo-e', wrap), moN = G.$('.mo-n', wrap), mirror = G.$('.mo-mirror', wrap), video = G.$('video', wrap), dots = G.$$('.mo-count i', wrap);
    var moS = G.$('.mo-syl', wrap), countEl = G.$('.mo-count', wrap);
    if (G.has.cam) ctx.camera(video).then(function () { mirror.classList.add('live'); }).catch(function () { mirror.classList.add('off'); });
    ctx.progress(0, N);
    await ctx.say(G.pick(['거울 놀이! 자비스 얼굴을 보고 똑같이 따라 해 봐.', '입 체조 시간! 거울 속 내 얼굴을 보면서 따라 해 볼까?']));
    for (var i = 0; i < N; i++) {
      var m = list[i];
      ctx.progress(i, N);
      moE.textContent = m.e; moE.className = 'mo-e ' + (m.rep ? 'small bounce' : (MO_ANIM[m.name] || 'pulse'));
      moN.textContent = m.name; moN.hidden = !!m.rep;
      moS.innerHTML = m.rep ? sylChips(m.rep) : '';
      countEl.classList.toggle('hide', !!m.rep);
      moE.style.animation = 'none'; void moE.offsetWidth; moE.style.animation = '';
      G.sfx.play('pop');
      var tries = 0, chips = G.$$('span', moS);
      while (true) {
        dots.forEach(function (d) { d.classList.remove('on'); });
        chips.forEach(function (c) { c.classList.remove('on', 'done'); });
        await ctx.say(m.say);
        if (m.rep) await beatRun(ctx, chips, rbeat);
        else await count3(ctx, dots, beat);
        var yes = await ctx.parentJudge(wrap, ['👍 따라 했어요', '🔁 한 번 더']);
        if (yes) {
          if (tries === 0) ctx.trial(true);
          await ctx.cheer(m.rep ? G.pick(['박자 척척! 입이 빨라졌어!', '또박또박 최고야!', '와, 혀가 춤을 춘다!', '입 근육이 튼튼해져!']) :
            G.pick(['멋진 ' + m.name + '!', '거울 속 친구도 잘했대!', '입 근육이 튼튼해져!', '똑같이 했어! 최고야!']), model);
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

/* 박자 말하기 글자 — 소리마다 한 칸, 띄어 쓴 곳은 사이를 둔다 */
function sylChips(rep) {
  return rep.split(/\s+/).map(function (w) { return hangul(w).split('').map(function (c, j) { return '<span' + (j === 0 ? ' class="gap"' : '') + '>' + G.esc(c) + '</span>'; }).join(''); }).join('');
}
/* 준비, 시작! — 한 박자(beat ms)에 한 소리씩 반짝. 아이가 반짝이는 소리를 박자에 맞춰 말한다 */
function beatRun(ctx, chips, beat) {
  return ctx.say('준비, 시작!', { repeat: false }).then(function () {
    return new Promise(function (ok) {
      var k = 0;
      function step() {
        chips.forEach(function (c, j) { c.classList.toggle('on', j === k); c.classList.toggle('done', j < k); });
        if (k >= chips.length) { ctx.wait(pace(500)).then(ok); return; }
        G.sfx.play('tick'); k++;
        ctx.timeout(step, pace(beat));
      }
      step();
    });
  });
}

/* 하나, 둘, 셋 — 자세를 잠깐 유지 (beat: 한 박자 ms, 기본 750) */
function count3(ctx, dots, beat) {
  ctx.say('하나, 둘, 셋!', { repeat: false, rate: 0.75 });
  return new Promise(function (ok) {
    var k = 0;
    function step() {
      if (k >= dots.length) { ctx.wait(pace(300)).then(ok); return; }
      dots[k].classList.add('on'); G.sfx.play('tick'); k++;
      ctx.timeout(step, pace(beat || 750));
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
function foSvg(it) { return '<svg class="fo-svg' + (it.big === false ? ' sm' : '') + '" viewBox="0 0 100 100" aria-hidden="true"><g stroke="rgba(0,0,0,.18)" stroke-width="2.5" stroke-linejoin="round">' + FO_OBJ[it.o].svg(it.c.hex) + '</g></svg>'; }
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
/* 여러 가지 심부름(4~6단계)을 이어 말할 때 — '박수 쳐 줘' → '박수 치고' */
var FO_GO = { '👏': '박수 치고', '👋': '손 흔들고', '🙌': '만세 하고', '🦶': '발을 쿵쿵 구르고', '👃': '코를 짚고', '😘': '뽀뽀를 보내고', '🙆': '머리에 손을 올리고' };
function foChain(acts) { return acts.map(function (a, j) { return j < acts.length - 1 ? FO_GO[a.e] : a.t; }).join(', '); }

G.act({
  id: 'follow', area: 'speech', title: '지시 따르기', icon: '🧺', order: 60, levels: 10, mins: 3, needs: [],
  ef: ['wm', 'attend', 'plan'],
  desc: '자비스 말대로 해 봐요',
  goal: '말 알아듣고 행동하기 — 1단계 지시("강아지 눌러") → 꾸밈말+이름("빨간 공") → 두 단계 지시("사과를 바구니에 넣고, 박수 쳐") → 4단계 세 가지("넣고, 박수 치고, 만세") → 5단계 네 가지 심부름. 6~10단계는 다섯 가지 심부름 → 조건 지시("빨간 것이 있으면 박수") → 차례 말("별을 누르기 전에 공을") → "빨간 것만 모두"·"별 말고 모두" → 조건과 차례를 함께(초등 3학년 지시 따르기)',
  how: '지시는 한 번 말한 뒤 기다려 주세요. 손짓·눈짓으로 답을 알려 주지 않는 것이 연습이에요. 3단계는 두 가지를 기억해야 해서 어려워요 — 아이가 첫 번째만 하면 "그다음은?" 하고 물어봐 주고, 그래도 어려우면 자비스가 다시 알려 줘요. 4·5단계는 몸짓이 둘·셋으로 늘어요 — 순서가 조금 바뀌어도 다 해내면 「했어요」를 눌러 주세요.',
  basis: '지시 따르기 단계(1단계 → 속성 → 2단계 지시) — 수용 언어·청각 작업기억',
  offline: '정리 시간에 "블록을 상자에 넣고, 손뼉 쳐!" 두 단계 심부름. 옷 입을 때 "파란 양말 가져와!"처럼 색을 붙여 말하기.',
  run: async function (ctx) {
    var lv = ctx.level, N = 5, TOP = ctx.def.levels;
    ctx.progress(0, N);
    await ctx.say(lv >= 7 ? G.pick(['자비스 생각 심부름! 끝까지 잘 듣고, 생각해서 눌러 줘.', '머리를 쓰는 심부름이야! 자비스 말을 끝까지 들어 봐.']) :
      lv >= 3 ? '자비스 심부름 놀이! 자비스 말을 끝까지 잘 듣고, ' + NUMK[lv - 1] + ' 가지를 해 줘.' :
      G.pick(['자비스 말 잘 듣기 놀이! 자비스가 말하는 대로 해 줘.', '귀를 쫑긋! 자비스가 부탁하는 걸 찾아 줘.']));
    var pool = wordPool(1), targets = G.sample(pool, N);
    var kinds = G.shuffle(['c3', 'c3', 'g4', 'g4']); kinds.unshift('c3');
    var puts = G.sample(FO_PUT, N), acts = G.sample(FO_ACT, N);
    /* 칸이 오르면 다섯 문제 가운데 (칸-1)문제를 다음 단계 지시로 — 1단계엔 '빨간 공' 찾기, 2단계엔 두 가지 심부름,
       3단계엔 세 가지, 4단계엔 네 가지, 5단계엔 다섯 가지 심부름, 6단계부터는 다음 단계 생각 심부름(foThink).
       10단계(맨 위)는 (칸-1)문제에 그림이 하나 더 (살펴볼 것이 늘어난다) */
    var mix = stepMix(ctx, N), putN = 0;
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      var L = lv < TOP && mix[i] ? lv + 1 : lv;
      if (L === 1) await followTap(ctx, targets[i], pool);
      else if (L === 2) await followColor(ctx, lv === 1 ? 'c3' : kinds[i]);
      else if (L <= 6) {
        /* 몸짓 — 3단계 하나, 4단계 둘, 5단계 셋, 6단계 넷 (서로 다른 것으로) */
        var acs = L === 3 ? acts[i] : [acts[i]].concat(G.sample(FO_ACT.filter(function (a) { return a !== acts[i]; }), L - 3));
        await followPut(ctx, puts[i], acs, lv >= 3 ? i === 0 : putN++ === 0, false);
      }
      else await foThink(ctx, L, lv === TOP && mix[i]);
    }
    ctx.progress(N, N);
    ctx.finish({ msg: lv >= 7 ? G.pick(['생각 심부름 척척! 귀도 머리도 최고야!', '끝까지 듣고 생각했구나! 정말 멋져!']) :
      lv >= 3 ? '심부름을 척척! ' + NUMK[lv - 1] + ' 가지를 다 기억했어!' : G.pick(['자비스 말을 정말 잘 들었어!', '귀 대장! 말한 대로 척척 했어!']) });
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

/* act: 몸짓 하나(3단계) 또는 여러 개 [몸짓, …](4·5단계 — 세·네 가지 심부름) */
async function followPut(ctx, task, act, first, quiet) {
  var acts = Array.isArray(act) ? act : [act], na = acts.length;
  var others = G.sample(FO_PUT.filter(function (p) { return p.e !== task.e && p.to !== task.to; }), 2);
  var wrap = wrapEl(ctx, '<div class="fo-steps' + (na >= 3 ? ' many' : '') + '" hidden><b>1</b>' + task.e + '➜' + task.to + acts.map(function (a, j) { return '<b>' + (j + 2) + '</b>' + a.e; }).join('') + '</div>' +
    '<div class="fo-zone"><span class="fz-e">' + task.to + '</span><span class="fz-w">' + G.esc(task.tw) + '</span><div class="fz-in"></div></div><div class="fo-items"></div>');
  var steps = G.$('.fo-steps', wrap), zone = G.$('.fo-zone', wrap), zin = G.$('.fz-in', wrap), itemsBox = G.$('.fo-items', wrap);
  var els = G.shuffle([task].concat(others)).map(function (p) {
    var el = G.el('<div class="fo-it" role="button" aria-label="' + G.esc(p.w) + '">' + p.e + '</div>');
    el._p = p; itemsBox.appendChild(el); return el;
  });
  var right = els.filter(function (el) { return el._p === task; })[0];
  var line = acc(task.w) + ' ' + task.tw + '에 ' + task.v + ', ' + foChain(acts) + '!';
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
  /* quiet: 두 번째 할 일을 묻지 않고 기다린다 (3단계 2·3칸) */
  await ctx.say(subj(task.w) + ' 쏙!' + (quiet ? '' : ' ' + G.pick(['그다음은 뭐였지?', '이제 두 번째!', '또 뭐 하기로 했지?'])), { repeat: false });
  await ctx.wait(pace(2500 + 1500 * (na - 1)));      /* 아이가 몸으로 해 볼 시간 (몸짓이 늘면 조금 더) */
  var yes = await ctx.parentJudge(wrap, ['👍 했어요', '🔁 다시 듣기']);
  if (!yes) {
    step2Retry = true; steps.hidden = false;
    await ctx.say((na > 1 ? '남은 건, ' : '두 번째는, ') + foChain(acts) + '!', { repeat: false });
    await ctx.wait(pace(1500 + 1000 * (na - 1)));
    yes = await ctx.parentJudge(wrap, ['👍 했어요', '➡️ 다음']);
  }
  ctx.trial(miss === 0 && !step2Retry);
  if (yes) await ctx.cheer(G.pick([NUMK[na + 1] + ' 가지 다 했어! 기억 대장!', '심부름 척척! 최고야!', '끝까지 기억했구나! 멋져!']), zone);
  else await ctx.say('괜찮아! 다음 심부름도 같이 해 보자.', { repeat: false });
  await ctx.wait(pace(300));
}

/* ---------- 지시 따르기 7~10단계 — 생각 심부름 ----------
   7 "빨간 것이 있으면 박수, 없으면 만세" (그림 상자를 살펴보고 몸짓 그림 고르기)
   8 "별을 누르기 전에 공을 눌러 줘" / "공을 누른 다음에 별을" (차례 말)
   9 "빨간 것만 모두" / "별 말고 모두" (만·말고·모두)
   10 "노란 것이 있으면, 별을 누르기 전에 공을. 없으면 하트만" (조건 + 차례).  more: 그림 하나 더 */
var FO_ADJ = ['red', 'yellow', 'blue'];          /* '빨간 것'처럼 꾸밈말이 자연스러운 색 */
function foAll() { var out = []; Object.keys(FO_OBJ).forEach(function (o) { foColors().forEach(function (c) { out.push({ o: o, c: c }); }); }); return out; }
function foAdjCol() { return G.pick(foColors().filter(function (c) { return FO_ADJ.indexOf(c.id) >= 0; })); }
function foNameOf(o) { return FO_OBJ[o].n; }
function foEar(ctx, wrap, line, icon) {
  var ear = G.el('<button class="fo-ear" type="button" aria-label="다시 듣기"><span>' + (icon || '🤖') + '</span>자비스 부탁!</button>');
  wrap.insertBefore(ear, wrap.firstChild);
  function ask() { ear.classList.add('talk'); return ctx.say(line).then(function () { ear.classList.remove('talk'); }); }
  ear.onclick = function () { G.sfx.play('tap'); ask(); };
  return ask;
}

function foThink(ctx, L, more) {
  if (L === 7) return foIf(ctx, more);
  if (L === 8) return foOrder(ctx, more);
  if (L === 9) return foOnly(ctx, more);
  return foIfOrder(ctx, more);
}

/* 7단계 — 조건: 그림 상자에 ○○이 있으면 A, 없으면 B 그림을 누른다 */
function foIf(ctx, more) {
  var kind = G.pick(['col', 'obj', 'both']), want = { o: G.pick(Object.keys(FO_OBJ)), c: kind === 'col' ? foAdjCol() : G.pick(foColors()) };
  function match(it) { return (kind === 'obj' || it.c === want.c) && (kind === 'col' || it.o === want.o); }
  var all = foAll(), hit = all.filter(match), miss = all.filter(function (x) { return !match(x); });
  /* 헷갈리게 — 하나만 같은 그림(같은 색 다른 모양, 같은 모양 다른 색)을 먼저 */
  var near = G.shuffle(miss.filter(function (x) { return x.o === want.o || x.c === want.c; })), far = G.shuffle(miss.filter(function (x) { return near.indexOf(x) < 0; }));
  var n = 4 + (more ? 1 : 0), yes = Math.random() < 0.5;
  var show = (yes ? [G.pick(hit)] : []).concat(near.slice(0, 2));
  show = G.shuffle(show.concat(far.slice(0, n - show.length)));
  var cond = kind === 'col' ? want.c.adj + ' 것' : kind === 'obj' ? foNameOf(want.o) : foName(want);
  var pair = G.sample([FO_ACT[0], FO_ACT[2], FO_ACT[1], FO_ACT[3]], 2);       /* 박수·만세·손 흔들기·발 구르기 가운데 둘 */
  var A = { e: pair[0].e, w: FO_WORD[pair[0].e], t: pair[0].t }, B = { e: pair[1].e, w: FO_WORD[pair[1].e], t: pair[1].t };
  var right = yes ? A : B;
  var line = subj(cond) + ' 있으면 ' + A.w + ', 없으면 ' + B.w + '! 맞는 그림을 눌러 줘.';
  var wrap = wrapEl(ctx, '<div class="fo-show">' + show.map(function (it) { return '<span>' + foSvg(it) + '</span>'; }).join('') + '</div><div class="fo-ask">🔎 그림 상자를 잘 살펴봐!</div>');
  var cells = G.$$('.fo-show span', wrap);
  function glowHits() { show.forEach(function (it, j) { if (match(it)) G.ui.hint(cells[j]); }); }
  var why = yes ? subj(cond) + ' 여기 있어! 그래서 ' + A.w + '!' : subj(cond) + ' 하나도 없어! 그래서 ' + B.w + '!';
  foEar(ctx, wrap, line)();
  return pickOne(ctx, {
    box: wrap, items: G.shuffle([A, B]), cols: 2, size: 'lg', label: true,
    isRight: function (it) { return it === right; },
    onRight: function (it, el) { el.classList.add('jump'); glowHits(); },
    praise: function () { return G.pick(['맞아! ', '딩동댕! ', '잘 살펴봤구나! ']) + why; },
    after: function () { return ctx.say(G.pick(['진짜로 ', '우리 같이 ']) + right.t.replace(/ 줘$/, ' 볼까?'), { repeat: false }).then(function () { return ctx.wait(pace(1500)); }); },
    retry: function () { return '그림 상자를 한 번 더 볼까? ' + line; },
    answer: function () { glowHits(); return '음~ ' + why; },
    idle: line
  });
}
/* 몸짓 이름 (그림 단추 글자) */
var FO_WORD = { '👏': '박수', '🙌': '만세', '👋': '손 흔들기', '🦶': '발 쿵쿵' };

/* 8단계 — 차례 말: "~을 누르기 전에 ~을" (말한 차례와 거꾸로) / "~을 누른 다음에 ~을" */
function foOrder(ctx, more) {
  var os = G.sample(Object.keys(FO_OBJ), 4 + (more ? 1 : 0)), cs = foColors();
  var items = os.map(function (o) { return { o: o, c: G.pick(cs) }; });
  var a = items[0], b = items[1], na = foNameOf(a.o), nb = foNameOf(b.o), before = Math.random() < 0.5;
  var line = before ? acc(nb) + ' 누르기 전에 ' + acc(na) + ' 눌러 줘!' : acc(na) + ' 누른 다음에 ' + acc(nb) + ' 눌러 줘!';
  var wrap = wrapEl(ctx);
  foEar(ctx, wrap, line)();
  return pickMany(ctx, {
    box: wrap, items: G.shuffle(items), need: [a, b], ordered: true, render: foSvg, cols: items.length > 4 ? 3 : 2, size: 'md',
    more: function () { return G.pick(['좋아! 그다음은?', '맞아! 이제 다음 거!']); },
    praise: function () { return G.pick(['차례대로 척척! ', '딩동댕! ', '말 순서까지 잘 들었구나! ']) + na + ' 먼저, 그다음 ' + nb + '!'; },
    retry: function (it, nx) { return it === b ? nb + '도 누를 거야. 그런데 먼저 ' + foNameOf(nx.o) + '부터!' : '이건 ' + isYa(foNameOf(it.o)) + '. ' + line; },
    answer: function (it, nx) { return '반짝이는 ' + foNameOf(nx.o) + '부터! ' + na + ' 먼저, 그다음 ' + nb + '!'; },
    idle: line
  });
}

/* 9단계 — '만'·'말고'·'모두': "빨간 것만 모두 눌러 줘" / "별 말고 모두 눌러 줘" */
function foOnly(ctx, more) {
  var n = 5 + (more ? 1 : 0), only = Math.random() < 0.5, items, need, line, got, all = foAll();
  if (only) {
    var c = foAdjCol(), k = G.pick([2, 3]);
    need = G.sample(all.filter(function (x) { return x.c === c; }), k);
    items = need.concat(G.sample(all.filter(function (x) { return x.c !== c; }), n - k));
    line = c.adj + ' 것만 모두 눌러 줘!'; got = c.adj + ' 것만 쏙쏙 다 찾았어!';
  } else {
    var o = G.pick(Object.keys(FO_OBJ));
    var skip = G.sample(all.filter(function (x) { return x.o === o; }), 2);
    need = G.sample(all.filter(function (x) { return x.o !== o; }), n - 2);
    items = skip.concat(need);
    line = foNameOf(o) + ' 말고 다른 것을 모두 눌러 줘!'; got = foNameOf(o) + '만 빼고 다 찾았어!';
  }
  var wrap = wrapEl(ctx);
  foEar(ctx, wrap, line)();
  return pickMany(ctx, {
    box: wrap, items: G.shuffle(items), need: need, ordered: false, render: foSvg, cols: 3, size: 'md',
    more: function () { return G.pick(['좋아! 또 있을까?', '맞아! 남은 것도 찾아볼까?']); },
    praise: function () { return G.pick(['딩동댕! ', '하나도 빠짐없이! ', '잘 들었구나! ']) + got; },
    retry: function (it) { return '이건 ' + isYa(foName(it)) + '. ' + line; },
    answer: function () { return '반짝이는 걸 눌러 줘! ' + line; },
    idle: line
  });
}

/* 10단계 — 조건 + 차례: "노란 것이 있으면, 별을 누르기 전에 공을 눌러 줘. 없으면 하트만 눌러 줘" */
function foIfOrder(ctx, more) {
  var os = G.sample(Object.keys(FO_OBJ), 4 + (more ? 1 : 0)), c = foAdjCol(), yes = Math.random() < 0.5;
  var others = foColors().filter(function (x) { return x !== c; });
  var items = os.map(function (o) { return { o: o, c: G.pick(others) }; });
  if (yes) G.pick(items).c = c;     /* 조건 색이 하나 있다 */
  var X = items[0], Y = items[1], Z = items[2], nx = foNameOf(X.o), ny = foNameOf(Y.o), nz = foNameOf(Z.o);
  var cond = c.adj + ' 것';
  var line = subj(cond) + ' 있으면, ' + acc(nx) + ' 누르기 전에 ' + acc(ny) + ' 눌러 줘. 없으면 ' + nz + '만 눌러 줘!';
  var need = yes ? [Y, X] : [Z];
  var why = yes ? subj(cond) + ' 있어! 그러니까 ' + ny + ' 먼저, 그다음 ' + nx + '!' : subj(cond) + ' 없어! 그러니까 ' + nz + '만!';
  var wrap = wrapEl(ctx);
  foEar(ctx, wrap, line, '🧠')();
  return pickMany(ctx, {
    box: wrap, items: G.shuffle(items), need: need, ordered: true, render: foSvg, cols: items.length > 4 ? 3 : 2, size: 'md',
    more: function () { return G.pick(['좋아! 그다음은?', '맞아! 이제 다음 거!']); },
    praise: function () { return G.pick(['생각 대장! ', '딩동댕! ', '조건도 차례도 척척! ']) + why; },
    retry: function () { return G.pick(['먼저 ' + subj(cond) + ' 있는지 살펴볼까? ', '천천히 다시 들어 봐. ']) + line; },
    answer: function () { return '음~ ' + why; },
    idle: line
  });
}

/* =================================================================
   7. 말소리 북치기 (음운 인식: 음절 나누기)
   ================================================================= */
var SY_EXTRA = [
  { w: '무당벌레', e: '🐞' }, { w: '해바라기', e: '🌻' }, { w: '오토바이', e: '🏍️' }, { w: '고슴도치', e: '🦔' }, { w: '미끄럼틀', e: '🛝' },
  { w: '바이올린', e: '🎻' }, { w: '선글라스', e: '🕶️' }, { w: '피아노', e: '🎹' }, { w: '캥거루', e: '🦘' }, { w: '햄버거', e: '🍔' },
  { w: '호랑이', e: '🐯' }, { w: '다람쥐', e: '🐿️' }
];
/* 4·5단계 — 다섯·여섯 소리 낱말 */
var SY_LONG = [
  { w: '크리스마스', e: '🎄' }, { w: '롤러코스터', e: '🎢' }, { w: '장수풍뎅이', e: '🪲' }, { w: '카레라이스', e: '🍛' },
  { w: '아이스하키', e: '🏒' }, { w: '오케스트라', e: '🎼' }, { w: '다이아몬드', e: '💎' }, { w: '레모네이드', e: '🍋' },
  { w: '스케이트보드', e: '🛹' }, { w: '롤러스케이트', e: '🛼' }, { w: '트리케라톱스', e: '🦕' }
];
/* 6단계 — 두 낱말 말(꾸밈말 + 이름)을 소리마다 나누기: '빨간 사과' 북 네 번 */
var SY_PHRASE = [
  { w: '빨간 사과', e: '🍎' }, { w: '하얀 우유', e: '🥛' }, { w: '커다란 곰', e: '🐻' }, { w: '빠른 기차', e: '🚄' }, { w: '동그란 달', e: '🌕' },
  { w: '맛있는 빵', e: '🍞' }, { w: '파란 바다', e: '🌊' }, { w: '노란 바나나', e: '🍌' }, { w: '작은 강아지', e: '🐶' }, { w: '파란 자동차', e: '🚙' },
  { w: '귀여운 토끼', e: '🐰' }, { w: '맛있는 피자', e: '🍕' }, { w: '초록 개구리', e: '🐸' }, { w: '아기 고양이', e: '🐱' }, { w: '예쁜 무지개', e: '🌈' },
  { w: '시원한 수박', e: '🍉' }, { w: '하얀 눈사람', e: '⛄' }, { w: '빨간 소방차', e: '🚒' }, { w: '따뜻한 장갑', e: '🧤' },
  { w: '달콤한 케이크', e: '🎂' }, { w: '노란 해바라기', e: '🌻' }, { w: '커다란 코끼리', e: '🐘' }
];
function sylPhrase(n) { return SY_PHRASE.filter(function (w) { return hangul(w.w).length === n; }); }
/* 7~10단계 소리 찾기에 더 쓰는 그림 낱말 (끝말잇기가 이어지게) */
var SY_MORE = [
  { w: '기린', e: '🦒' }, { w: '고래', e: '🐋' }, { w: '도토리', e: '🌰' }, { w: '리본', e: '🎀' }, { w: '박수', e: '👏' }, { w: '산', e: '⛰️' },
  { w: '나팔', e: '🎺' }, { w: '라면', e: '🍜' }, { w: '오이', e: '🥒' }, { w: '구두', e: '👞' }, { w: '연필', e: '✏️' }, { w: '사탕', e: '🍬' },
  { w: '마이크', e: '🎤' }, { w: '스키', e: '🎿' }, { w: '키위', e: '🥝' }, { w: '자석', e: '🧲' }, { w: '바다', e: '🌊' }, { w: '소라', e: '🐚' },
  { w: '라디오', e: '📻' }, { w: '오징어', e: '🦑' }, { w: '지구', e: '🌍' }, { w: '채소', e: '🥬' }, { w: '소금', e: '🧂' }, { w: '금붕어', e: '🐠' }
];
var NUMK = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱'];
function sylPool(n) {
  var seen = {};
  return wordPool(3).concat(SY_EXTRA, SY_LONG).filter(function (w) {
    var h = hangul(w.w);
    if (h !== w.w || h.length !== n || seen[w.w]) return false;
    seen[w.w] = 1; return true;
  });
}

G.act({
  id: 'syllable', area: 'speech', title: '말소리 북치기', icon: '🥁', order: 70, levels: 10, mins: 3, needs: [],
  ef: ['attend', 'wm', 'inhibit'],
  desc: '한 소리에 북 한 번, 둥!',
  goal: '음운 인식 — 낱말이 작은 소리(음절)로 나뉜다는 것 알기("사-과" 두 번). 또박또박 끊어 말하기와 읽기 준비의 바탕. 4단계는 네·다섯 소리 낱말("크리스마스"), 5단계는 자비스 시범 없이 혼자 듣고 나누기. 6~10단계는 두 낱말 말 북치기("빨간 사과") → 맨 앞 소리가 같은 말("사과·사자") → 맨 끝 소리가 같은 말("과자·모자") → 끝말잇기 → 첫소리 자음(ㄱ·ㄴ…)이 같은 말 찾기(읽기·받아쓰기의 바탕)',
  how: '아이와 같이 소리 내어 "사, 과" 하며 북을 쳐 주세요. 어려워하면 아이 손을 잡고 함께 쳐도 좋아요. 2·3단계는 자비스가 북 칠 때 소리를 내지 않으니 아이가 스스로 말하며 치게 도와주세요. 3단계는 글자가 숨겨져 있어 귀로만 나눠요. 5단계는 자비스가 먼저 쳐 주지 않아요 — 어려우면 그때 쳐 주니 기다려 주세요.',
  basis: '음운 인식 — 음절 분절(손뼉·북 치기), 읽기 준비 기술',
  offline: '이름을 박수로 나눠 치기: "민-준" 짝짝. 계단을 오르며 "바-나-나" 한 칸에 한 소리.',
  run: async function (ctx) {
    var lv = ctx.level, N = 5, TOP = ctx.def.levels;
    if (lv >= 7) return syllableHigh(ctx);
    var counts = lv === 1 ? [1, 2, 1, 2, 2] : lv === 2 ? [2, 3, 2, 3, 3] : lv === 3 ? [3, 4, 3, 4, 4] : lv === 6 ? [4, 5, 4, 5, 6] : [4, 5, 4, 5, 5];
    /* 칸이 오르면 가운데 세 낱말 중 (칸-1)개를 다음 단계처럼. 첫·마지막 낱말은 그대로.
       1~3단계는 한 소리 더 긴 낱말로, 4단계는 자비스가 먼저 쳐 주지 않고 귀로만 듣고 친다(5단계 맛보기 — 어려우면 그때 쳐 준다).
       5·6단계는 첫 낱말 말고는 모두 혼자 치기. 5단계 칸이 오르면 (칸-1)개를 두 낱말 말('빨간 사과' — 6단계 맛보기)로,
       6단계(모두 두 낱말 말)는 (칸-1)개를 7단계 '맨 앞 소리가 같은 말 찾기'로 */
    var mix = stepMix(ctx, N, 1, N - 1);
    if (lv < 4) counts = counts.map(function (n, i) { return mix[i] ? n + 1 : n; });
    function solo(i) { return lv >= 5 ? i > 0 : lv === 4 && mix[i]; }
    function phrase(i) { return lv === 6 || (lv === 5 && mix[i]); }
    var used = {}, list = counts.map(function (n, i) {
      var src = phrase(i) ? sylPhrase : sylPool;
      var p = src(n).filter(function (w) { return !used[w.w]; });
      while (!p.length && n > 1) { n--; p = src(n).filter(function (w) { return !used[w.w]; }); }   /* 그 길이 낱말이 모자라면 한 소리 짧게 */
      var w = G.pick(p); used[w.w] = 1; return { w: w.w, e: w.e, n: n };
    });
    var finds = lv === 6 ? syTasks('first', mix.filter(Boolean).length, 3) : [];
    /* 아이 별명이 맞는 길이면 마지막은 이름 북치기 */
    var nick = hangul(G.profile.nick || '');
    if (nick && nick === String(G.profile.nick || '').trim() && nick.length >= counts[0] && nick.length <= counts[counts.length - 1]) list[N - 1] = { w: nick, e: '🌟', n: nick.length, name: true };
    ctx.progress(0, N);
    await ctx.say(G.pick(['둥둥 북 놀이! 낱말을 작은 소리로 나눠서, 한 소리에 북 한 번씩 쳐 보자.', '자비스 북이 왔어요! 소리 하나에 둥 한 번!']));
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      if (lv === 6 && mix[i] && finds.length) await syFind(ctx, finds.shift());
      else await syItem(ctx, list[i], lv, i === 0, solo(i));
    }
    ctx.progress(N, N);
    ctx.finish({ msg: G.pick(['북치기 대장! 소리를 콩콩 잘 나눴어!', '둥둥! 귀가 정말 똑똑해졌어!']) });
  }
});

/* ---------- 말소리 북치기 7~10단계 — 소리 찾기 ----------
   7 맨 앞 소리(음절)가 같은 말('사과'·'사자') · 8 맨 끝 소리가 같은 말('과자'·'모자') · 9 끝말잇기('바나나' → '나비')
   10 첫소리 자음이 같은 말('고래'·'기차' — ㄱ). 그림 이름은 자비스가 차례로 불러 준다(글자는 숨겨 귀로 찾기).
   칸이 오르면 (칸-1)문제를 다음 단계 문제로. 10단계(맨 위) 2·3칸은 (칸-1)문제에 보기 하나 더 */
var SY_KIND = { 7: 'first', 8: 'last', 9: 'chain', 10: 'cho' };
var SY_CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
/* 첫소리 이름과 소리 — '기역, 그' (된소리·ㅇ 은 문제로 내지 않는다) */
var SY_CHO_SAY = { 'ㄱ': ['기역', '그'], 'ㄴ': ['니은', '느'], 'ㄷ': ['디귿', '드'], 'ㄹ': ['리을', '르'], 'ㅁ': ['미음', '므'], 'ㅂ': ['비읍', '브'], 'ㅅ': ['시옷', '스'],
  'ㅈ': ['지읒', '즈'], 'ㅊ': ['치읓', '츠'], 'ㅋ': ['키읔', '크'], 'ㅌ': ['티읕', '트'], 'ㅍ': ['피읖', '프'], 'ㅎ': ['히읗', '흐'] };
/* 소리가 비슷한 첫소리 — 보기에 함께 내지 않는다 */
var SY_FAM = ['ㄱㅋㄲ', 'ㄷㅌㄸ', 'ㅂㅍㅃ', 'ㅅㅆ', 'ㅈㅊㅉ'];
function choOf(w) { var c = String(w).charCodeAt(0) - 0xAC00; return c >= 0 && c <= 11171 ? SY_CHO[Math.floor(c / 588)] : ''; }
function famOf(ch) { return SY_FAM.filter(function (x) { return x.indexOf(ch) >= 0; })[0] || ch; }
function syWords() {
  var sw = {}, se = {};
  return wordPool(3).concat(SY_EXTRA, SY_LONG, SY_MORE).filter(function (w) {
    if (hangul(w.w) !== w.w || sw[w.w] || se[w.e]) return false;
    sw[w.w] = se[w.e] = 1; return true;
  });
}
/* 문제 n 개 만들기 — kind 문제 꼴, k 보기 수(정답 하나 + 나머지) */
function syTasks(kind, n, k, used) {
  var words = syWords(), out = [];
  used = used || {};
  function first(w) { return w.w.charAt(0); }
  function last(w) { return w.w.charAt(w.w.length - 1); }
  for (var j = 0; j < n; j++) {
    var x = syTask(kind, words, used, k, first, last) || syTask('first', words, used, k, first, last);
    if (x) out.push(x);
  }
  return out;
}
function syTask(kind, words, used, k, first, last) {
  var cands = G.shuffle(words.filter(function (w) { return !used[w.w] && w.w.length >= 2; }));
  for (var i = 0; i < cands.length; i++) {
    var t = cands[i], key, ok, off = null;
    if (kind === 'first') { key = first(t); ok = function (w) { return first(w) === key; }; }
    else if (kind === 'last') { key = last(t); ok = function (w) { return last(w) === key; }; }
    else if (kind === 'chain') { key = last(t); ok = function (w) { return first(w) === key; }; }
    else {
      key = choOf(t.w); if (!SY_CHO_SAY[key]) continue;
      ok = function (w) { return choOf(w.w) === key && first(w) !== first(t); };
      off = function (w) { return famOf(choOf(w.w)) !== famOf(key); };
    }
    off = off || function (w) { return !ok(w); };
    var m = words.filter(function (w) { return w !== t && !used[w.w] && ok(w); });
    if (!m.length) continue;
    var right = G.pick(m);
    var opts = G.sample(words.filter(function (w) { return w !== t && w !== right && off(w) && (kind !== 'cho' || first(w) !== first(t)); }), k - 1);
    if (opts.length < k - 1) continue;
    used[t.w] = used[right.w] = 1;
    return { kind: kind, t: t, right: right, opts: opts, key: key };
  }
  return null;
}

async function syllableHigh(ctx) {
  var lv = ctx.level, N = 5, TOP = ctx.def.levels;
  var mix = stepMix(ctx, N), used = {};
  var list = mix.map(function (on) {
    var L = on && lv < TOP ? lv + 1 : lv;
    var k = L >= 10 ? 4 + (lv === TOP && on ? 1 : 0) : 3;
    return syTasks(SY_KIND[L], 1, k, used)[0];
  }).filter(Boolean);
  ctx.progress(0, list.length);
  await ctx.say(lv === 9 ? '끝말잇기 놀이! 끝소리를 잘 듣고 이어지는 그림을 찾아 줘.' :
    lv === 10 ? '첫소리 탐정 놀이! 낱말의 맨 처음 소리를 잘 듣고 찾아 줘.' :
    G.pick(['소리 탐정 놀이! 낱말 소리를 잘 듣고 짝을 찾아 줘.', '귀를 쫑긋! 같은 소리가 숨은 그림을 찾아볼까?']));
  for (var i = 0; i < list.length; i++) {
    ctx.progress(i, list.length);
    await syFind(ctx, list[i]);
  }
  ctx.progress(list.length, list.length);
  ctx.finish({ msg: G.pick(['소리 탐정 대장! 소리를 콕콕 잘 찾았어!', '귀가 정말 똑똑해졌어! 읽기 힘도 쑥쑥!']) });
}

/* 소리 찾기 한 문제 — 위 카드(그림+글자, 찾을 소리가 빛남)를 누르면 다시 듣는다 */
function syFind(ctx, x) {
  clear(ctx);
  var t = x.t, ss = t.w.split(''), kind = x.kind, hi = kind === 'last' || kind === 'chain' ? ss.length - 1 : 0;
  var syl = ss[hi], cs = SY_CHO_SAY[x.key];
  var wrap = wrapEl(ctx, '<button class="sy-card task" type="button" aria-label="다시 듣기"><span class="sy-e">' + t.e + '</span><div class="sy-word">' +
    ss.map(function (c, j) { return '<span' + (j === hi ? ' class="on"' : '') + '>' + G.esc(c) + '</span>'; }).join('') + '</div>' +
    (kind === 'cho' ? '<span class="sy-letter">' + x.key + '</span>' : '') + '</button>');
  var card = G.$('.sy-card', wrap);
  var items = G.shuffle([x.right].concat(x.opts)), names = items.map(function (w) { return w.w; }).join(', ');
  var sound = kind === 'cho' ? cs[0] + ', ' + cs[1] + ' 소리' : syl;
  var head = kind === 'first' ? t.w + '의 맨 앞 소리는 ' + syl + '! ' + ro(syl) + ' 시작하는 건 뭘까?' :
    kind === 'last' ? t.w + '의 맨 끝 소리는 ' + syl + '! ' + ro(syl) + ' 끝나는 건 뭘까?' :
    kind === 'chain' ? '끝말잇기! ' + t.w + '의 맨 끝 소리는 ' + syl + '! ' + ro(syl) + ' 시작하는 건 뭘까?' :
    t.w + '의 첫소리는 ' + sound + '! ' + cs[1] + ' 소리로 시작하는 건 뭘까?';
  var short = kind === 'last' ? ro(syl) + ' 끝나는 건 뭘까?' : kind === 'cho' ? cs[1] + ' 소리로 시작하는 건 뭘까?' : ro(syl) + ' 시작하는 건 뭘까?';
  var Q = head + ' ' + names + '!';
  var why = kind === 'first' ? '둘 다 ' + ro(syl) + ' 시작해!' : kind === 'last' ? '둘 다 ' + ro(syl) + ' 끝나!' :
    kind === 'chain' ? t.w + ', ' + x.right.w + '! 끝말잇기 성공!' : '둘 다 ' + cs[1] + ' 소리로 시작해!';
  function ask() { return ctx.say(Q); }
  card.onclick = function () { G.sfx.play('tap'); ask(); };
  G.sfx.play('pop');
  ask();
  return pickOne(ctx, {
    box: wrap, items: items, label: false, cols: items.length === 4 ? 4 : 3, size: 'md',
    isRight: function (it) { return it === x.right; },
    onRight: function (it, el) { el.classList.add('jump'); G.sfx.play('drum'); },
    praise: function () { return G.pick(['맞아! ', '딩동댕! ', '소리 탐정! ']) + (kind === 'chain' ? why : t.w + ', ' + x.right.w + '! ' + why); },
    retry: function (it) { return '이건 ' + isYa(it.w) + '. ' + short; },
    answer: function (it) { return '이건 ' + isYa(it.w) + '. 여기 있어! ' + x.right.w + '! ' + why; },
    idle: Q
  });
}

async function syItem(ctx, it, lv, first, solo) {
  clear(ctx);
  /* 두 낱말 말(6단계)은 띄어 쓴 곳에 사이를 둔다. 소리는 글자(음절)마다 */
  var n = it.n, ss = hangul(it.w).split(''), gaps = {}, at = 0;
  it.w.split(/\s+/).forEach(function (w, j) { if (j) gaps[at] = 1; at += hangul(w).length; });
  var wrap = wrapEl(ctx, '<div class="sy-card"><span class="sy-e">' + it.e + '</span><div class="sy-word' + (lv >= 3 ? ' hide' : '') + '">' + ss.map(function (s, j) { return '<span' + (gaps[j] ? ' class="gap"' : '') + '>' + G.esc(s) + '</span>'; }).join('') + '</div></div>' +
    '<div class="sy-dots' + (lv >= 3 ? ' hide' : '') + '">' + ss.map(function () { return '<i></i>'; }).join('') + '</div>' +
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
  /* solo: 자비스 시범 없이 바로 아이 차례 (4단계 2·3칸 · 5단계) */
  if (!solo) await demo(first ? '자비스가 먼저 쳐 볼게. 잘 들어 봐!' : (n > 1 ? G.pick(['자비스가 먼저!', '들어 봐!']) : null));
  var prompt = (solo ? G.pick(['이번엔 혼자 해 볼까? 귀로 잘 듣고, 한 소리에 북 한 번! ', '자비스는 쉿! 네가 먼저 쳐 봐. ']) :
    first ? '이제 네 차례! 한 소리에 북 한 번! ' : G.pick(['네 차례! ', '이제 너도! '])) + it.w + '!';
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
      '<div class="tb-core" aria-label="자주 쓰는 말"></div><div class="tb-tabs" role="tablist"></div><div class="tb-grid"></div></div>';
    var sentEl = G.$('.tb-sent', B), tabsEl = G.$('.tb-tabs', B), grid = G.$('.tb-grid', B), coreEl = G.$('.tb-core', B);
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
    ['나', '줘', '더', '그만', '도와줘', '싫어'].forEach(function (w) {
      var it = (D.AAC.core || []).filter(function (x) { return x.w === w; })[0]; if (it) coreEl.appendChild(tile(it));
    });
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

#!/usr/bin/env node
/* ===========================================================
   오늘의 말씀 자동 게시 — 정적 페이지 생성기
   매일 새벽(한국시간)에 GitHub Actions가 실행한다. 04:41 을 본 게시로 두고
   06:23·09:11 에 그물을 더 던진다 — 예약이 밀려도 그날을 거르지 않게.
     생성물: today.html      (홈페이지에 올라가는 오늘의 말씀 한 장)
             word-today.json (다른 페이지가 읽어 쓰는 요약 데이터)
   사용법: node scripts/build-today.js [YYYY-MM-DD]
   =========================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const KST = 9 * 60 * 60 * 1000;

/* ---------- 데이터 로드 ---------- */
const BIBLE_DATA = new Function(
  fs.readFileSync(path.join(ROOT, 'dongsan_bible.js'), 'utf8') + '\nreturn BIBLE_DATA;')();
const { WordData } = require(path.join(ROOT, 'word-data.js'));
const { keepTimeIfSame } = require('./kept-time.js');

/* ---------- 유틸 ---------- */
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* 각주 기호만 걷어낸다.
   개역개정 원문의 괄호·대괄호는 본문이므로 절대 지우지 않는다 —
   통째로 지우면 신 3:9·3:11 은 빈 절이 되고 145절이 훼손된다. */
const clean = t => String(t || '')
  .replace(/\([a-z](?:\s[^)]*)?\)/g, '')     // "(a 또는 …)", "(a)" 같은 각주 괄호
  .replace(/(^|\s)[a-z](?=[가-힣])/g, '$1')    // 낱말 앞에 붙은 각주 문자
  .replace(/[a-z]:(?=\d)/g, '')                // "창a:1" → "창1"
  .replace(/\s{2,}/g, ' ').trim();

/* "사무엘상 3:19-4:11" 처럼 장을 넘어가는 본문도 읽는다 */
function passageVerses(passage) {
  const r = WordData.parseRef(passage);
  if (!r) return { verses: [], missing: [] };
  const bk = BIBLE_DATA[r.book];
  if (!bk || !bk.data) return { verses: [], missing: [] };
  const multi = String(r.chapter) !== String(r.toChapter);
  const verses = [], missing = [];
  WordData.refSpans(r, bk).forEach(sp => {
    const ch = bk.data[sp.chapter];
    for (let v = sp.from; v <= sp.to; v++) {
      const label = multi ? sp.chapter + ':' + v : v;
      if (ch[String(v)]) verses.push({ v: label, t: clean(ch[String(v)]) });
      else missing.push(label);
    }
  });
  return { verses, missing };
}
function oneVerse(ref) {
  const r = WordData.parseRef(ref);
  if (!r) return '';
  const bk = BIBLE_DATA[r.book];
  const t = bk && bk.data[r.chapter] && bk.data[r.chapter][String(r.from)];
  return t ? clean(t) : '';
}

/* ---------- 오늘 날짜(한국시간) ---------- */
const arg = process.argv[2];
const today = /^\d{4}-\d{2}-\d{2}$/.test(arg || '')
  ? arg
  : new Date(Date.now() + KST).toISOString().slice(0, 10);

const day = WordData.forDate(today);
const { verses, missing } = passageVerses(day.passage);
const kidVerse = oneVerse(day.kids.verseRef);
const weekday = WordData.weekday(today);

/* ---------- 공유용 텍스트 ---------- */
const shareText = [
  `📖 오늘의 말씀 (${today.replace(/-/g, '.')} ${weekday})`,
  `${day.passage} · ${day.title}`,
  '',
  verses.map(v => `${v.v} ${v.t}`).join(' '),
  '',
  '🌿 묵상',
  ...day.adult.questions.map((q, i) => `${i + 1}. ${q}`),
  '',
  `🙏 ${day.adult.prayer}`,
  '',
  '동산감리교회 오늘의 말씀 나눔'
].join('\n');

/* ---------- today.html ---------- */
const html = `<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
<title>오늘의 말씀 · ${esc(today.replace(/-/g, '.'))} — 동산감리교회</title>
<meta name="description" content="${esc(day.passage)} ${esc(day.title)} — 동산감리교회 오늘의 말씀">
<meta property="og:title" content="오늘의 말씀 · ${esc(day.passage)}">
<meta property="og:description" content="${esc(day.title)} — 동산감리교회">
<meta name="theme-color" content="#8f4531">
<link href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{--brick:#b3593f;--brick-deep:#8f4531;--moss:#5f7d4d;--gold:#c99a3f;
 --cream:#fbf3e7;--paper:#fffaf2;--warm:#f4e6d3;--border:#e6d3b4;
 --text:#3a2e22;--text2:#6b5a45;--text3:#9b8a72;--sky:#4aa3df}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{font-family:'Noto Sans KR',sans-serif;background:var(--cream);color:var(--text);
 line-height:1.8;word-break:keep-all;padding:0 0 60px}
a{color:inherit;text-decoration:none}
.wrap{max-width:720px;margin:0 auto;padding:0 18px}
header{background:linear-gradient(135deg,var(--brick-deep),var(--brick));color:#fff;padding:18px 0 22px;margin-bottom:20px}
header .wrap{display:flex;align-items:center;gap:10px}
.mark{width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.18);display:flex;
 align-items:center;justify-content:center;font-size:19px;flex:none}
h1{font-family:'Gowun Batang',serif;font-size:17px;font-weight:700}
.sub{font-size:11px;opacity:.85}
.home{margin-left:auto;font-size:12px;background:rgba(255,255,255,.2);padding:7px 13px;border-radius:999px}
/* 방문자 수 — 나눔터 주소를 넣기 전에는 자리도 차지하지 않는다 */
.visitors{display:flex;align-items:center;flex-wrap:wrap;gap:6px;
 margin:0 0 14px;font-size:12px;color:var(--text3)}
.visitors[hidden]{display:none}
.visitors b{color:var(--text2);font-weight:700}
.vt-sep{color:var(--border)}
.vt-dot{width:7px;height:7px;border-radius:50%;background:var(--moss);margin-right:2px;
 box-shadow:0 0 0 0 rgba(95,125,77,.55);animation:vtPulse 2s infinite}
@keyframes vtPulse{
 70%{box-shadow:0 0 0 7px rgba(95,125,77,0)}
 100%{box-shadow:0 0 0 0 rgba(95,125,77,0)}}
@media (prefers-reduced-motion:reduce){.vt-dot{animation:none}}
.hero{background:linear-gradient(135deg,#2f2a26,#4a3a2c);color:#fff;border-radius:20px;padding:26px 22px;
 position:relative;overflow:hidden;margin-bottom:16px}
.hero::after{content:'';position:absolute;right:-40px;top:-40px;width:170px;height:170px;border-radius:50%;
 background:rgba(201,154,63,.18)}
.hero .d{font-size:12.5px;color:#e6d3b4;position:relative}
.hero .p{font-family:'Gowun Batang',serif;font-size:clamp(26px,7vw,34px);font-weight:700;margin:8px 0 6px;position:relative}
.hero .t{font-size:16px;color:#f0e2cb;position:relative}
.hero .th{display:inline-block;margin-top:12px;font-size:11.5px;background:rgba(255,255,255,.16);
 padding:5px 12px;border-radius:999px;position:relative}
.card{background:var(--paper);border:1px solid var(--border);border-radius:18px;padding:20px;margin-bottom:14px}
.st{font-size:13.5px;font-weight:700;color:var(--brick-deep);margin-bottom:12px;display:flex;align-items:center;gap:6px}
.st .r{margin-left:auto;font-size:11px;font-weight:400;color:var(--text3)}
.verse{font-family:'Gowun Batang',serif;font-size:18px;line-height:2.1}
.vn{display:inline-block;min-width:20px;color:var(--brick);font-weight:700;font-size:12.5px;
 font-family:'Noto Sans KR',sans-serif;margin-right:3px;vertical-align:2px}
.note{margin-top:14px;padding:11px 13px;background:var(--warm);border-radius:11px;font-size:12.5px;color:var(--text2);line-height:1.7}
.q{display:flex;gap:9px;padding:11px 0;border-bottom:1px dashed var(--border);font-size:15.5px;color:var(--text2)}
.q:last-of-type{border-bottom:none}
.q b{color:var(--brick);flex:none}
.pray{margin-top:12px;background:var(--warm);border-radius:12px;padding:14px;font-family:'Gowun Batang',serif;
 font-size:15.5px;color:var(--text2);line-height:1.95}
.kids{background:#f2f9ff;border:1px solid #dfeef9;border-radius:18px;padding:20px;margin-bottom:14px}
.kids .st{color:#2f6fa1}
.kids .kv{background:#fff;border:2px dashed #7fc4f0;border-radius:16px;padding:16px;text-align:center;
 font-size:17px;font-weight:700;line-height:1.9;color:#2f4256}
.kids .kvr{text-align:center;font-size:12.5px;color:var(--sky);font-weight:700;margin-top:8px}
.kids .story{font-size:16px;color:#5b7186;margin-top:14px;line-height:1.95}
.kids .mi{display:flex;gap:11px;align-items:center;background:#fff8e6;border-radius:14px;padding:14px;margin-top:14px}
.kids .mi .em{font-size:26px}
.kids .mi .tx{font-size:15.5px;font-weight:700;color:#6b4f00}
details{margin-top:14px;background:#fff;border-radius:14px;padding:14px}
summary{cursor:pointer;font-size:15.5px;font-weight:700;color:#2f4256}
details ul{margin:10px 0 0 18px;font-size:15px;color:#5b7186;line-height:2}
.answer{margin-top:8px;font-size:14px;color:var(--moss);font-weight:700}
.btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:6px}
.btn{flex:1 1 45%;text-align:center;padding:15px;border-radius:14px;font-size:15px;font-weight:700;
 border:1px solid transparent;cursor:pointer;font-family:inherit}
.b1{background:linear-gradient(135deg,var(--brick),var(--brick-deep));color:#fff}
.b2{background:linear-gradient(135deg,#4aa3df,#7fc4f0);color:#fff}
.b3{background:var(--warm);color:var(--text2);border-color:var(--border)}
.foot{text-align:center;font-size:11.5px;color:var(--text3);line-height:2;margin-top:22px}
@media print{header,.btns,.foot{display:none}body{background:#fff}.card,.kids{border:none;padding:0;margin-bottom:18px}}
/* 지난 말씀 알림 — 게시가 늦어 어제 것이 걸려 있을 때만 나온다.
   오늘 것이면 아예 그리지 않으므로 평소에는 보이지 않는다. */
.stale{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;
  background:#fff6e6;border:1px solid var(--gold);border-left:4px solid var(--gold);
  border-radius:12px;padding:12px 14px;margin:14px 0 0;font-size:13.5px;color:var(--text2)}
.stale[hidden]{display:none}
.stale b{color:var(--brick-deep)}
.stale a{margin-left:auto;flex:none;background:var(--brick-deep);color:#fff;font-weight:700;
  border-radius:999px;padding:7px 15px;font-size:13px;white-space:nowrap}
.explain{font-size:1rem;color:var(--text);word-break:keep-all}
.explain p{line-height:2.0;margin:0 0 .95rem;text-align:justify;text-justify:inter-word}
.explain p:last-child{margin-bottom:0}
</style>
</head>
<body>
<header><div class="wrap">
  <div class="mark">✝</div>
  <div><h1>오늘의 말씀</h1><div class="sub">동산감리교회 · 매일 새벽</div></div>
  <a class="home" href="index.html">교회 홈</a>
</div></header>

<div class="wrap">
  <div class="visitors" id="visitorBox" hidden aria-live="polite" aria-label="방문자 수"></div>
  <div class="stale" id="staleBox" hidden role="status"></div>
  <div class="hero">
    <div class="d">${esc(today.replace(/-/g, '.'))} (${esc(weekday)}) · ${day.source === 'plan' ? '교회 읽기표' : (day.source === 'custom' ? '인도자 지정' : '매일 묵상표')}</div>
    <div class="p">${esc(day.passage)}</div>
    <div class="t">${esc(day.title)}</div>
    ${day.theme ? `<div class="th">${esc(day.theme)}</div>` : ''}
  </div>

  <div class="card">
    <div class="st">📖 오늘의 본문 <span class="r">개역개정</span></div>
    <div class="verse">${verses.length
      ? verses.map(v => `<span class="vn">${v.v}</span>${esc(v.t)}`).join(' ')
      : `<span style="color:var(--text3)">${esc(day.passage)} 본문을 성경책에서 펴서 읽어 주세요.</span>`}</div>
    ${missing.length ? `<div class="note">📌 ${missing.join(', ')}절은 앱에 실린 본문 파일에 빠져 있어 표시하지 못했습니다. 성경책에서 함께 읽어 주세요.</div>` : ''}
  </div>

  ${day.explain ? `<div class="card">
    <div class="st">💡 오늘의 묵상</div>
    <div class="explain">${day.explain.split(/\n{2,}/).map(t => `<p>${esc(t.trim())}</p>`).join('')}</div>
  </div>` : ''}

  <div class="card">
    <div class="st">🌿 묵상 길잡이</div>
    ${day.adult.questions.map((q, i) => `<div class="q"><b>${i + 1}.</b><div>${esc(q)}</div></div>`).join('')}
    <div class="pray">🙏 ${esc(day.adult.prayer)}</div>
  </div>

  <div class="kids">
    <div class="st">🧒 어린이와 함께 읽어요</div>
    <div class="kv">${esc(kidVerse || day.kids.summary)}</div>
    <div class="kvr">${esc(day.kids.verseRef)}</div>
    <div class="story">${esc(day.kids.emoji)} ${esc(day.kids.summary)}</div>
    <div class="mi"><div class="em">🎯</div><div class="tx">오늘의 미션 · ${esc(day.kids.mission)}</div></div>
    <details>
      <summary>❓ 말씀 퀴즈 — ${esc(day.kids.quiz.q)}</summary>
      <ul>${day.kids.quiz.c.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
      <div class="answer">정답: ${esc(day.kids.quiz.c[day.kids.quiz.a])}</div>
    </details>
  </div>

  <div class="btns">
    <a class="btn b1" href="word-adult.html">🙏 성인용 앱에서 읽기</a>
    <a class="btn b2" href="word-kids.html">🧒 어린이용 앱에서 읽기</a>
    <button class="btn b3" onclick="copyToday()">📤 카톡으로 나누기</button>
    <button class="btn b3" onclick="window.print()">🖨️ 인쇄하기</button>
  </div>

  <div class="foot">
    이 페이지는 매일 새벽에 자동으로 새로 올라갑니다. 늦어질 때는 위에 알려 드립니다.<br>
    지난 말씀은 <a href="word-adult.html" style="color:var(--brick-deep);font-weight:700">말씀표</a>에서 보실 수 있습니다.<br>
    동산감리교회 · 강원도 태백시 계산4길 25 · 주일예배 오전 9:00 / 11:00
  </div>
</div>

<script>
/* ── 이 페이지가 오늘 것인지 스스로 확인한다 ────────────────────
   게시는 GitHub 이 정해진 시각에 돌려 주는데, 붐빌 때는 여섯 시간
   넘게 밀리기도 한다. 그동안 이 페이지에는 어제 말씀이 걸려 있고,
   카톡으로 받은 분은 그것을 오늘 말씀으로 읽게 된다.

   그래서 화면을 열 때 한국 날짜와 견주어, 지난 것이면 그렇다고
   말하고 늘 오늘 것을 보여 주는 앱으로 안내한다.
   오늘 것이면 아무것도 그리지 않는다. ── */
var PAGE_DATE=${JSON.stringify(today)};
(function(){
  var box=document.getElementById('staleBox'); if(!box) return;
  var k=new Date(Date.now()+(new Date().getTimezoneOffset()*60000)+9*3600000);
  var p=function(n){return String(n).padStart(2,'0')};
  var today=k.getFullYear()+'-'+p(k.getMonth()+1)+'-'+p(k.getDate());
  if(PAGE_DATE>=today) return;              /* 오늘 것이거나 앞선 것이면 조용히 있는다 */

  var d=PAGE_DATE.split('-');
  var gap=Math.round((Date.parse(today)-Date.parse(PAGE_DATE))/86400000);
  var when=gap===1?'어제':gap+'일 전';
  box.innerHTML='<span>이 페이지는 <b>'+when+'('+Number(d[1])+'월 '+Number(d[2])+'일)</b> 말씀입니다. '+
    '오늘 말씀은 아직 올라오지 않았습니다.</span>'+
    '<a href="word-adult.html">오늘 말씀 보기 →</a>';
  box.hidden=false;
})();

var SHARE=${JSON.stringify(shareText)};
function copyToday(){
  if(navigator.share){navigator.share({text:SHARE}).catch(function(){});return}
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(SHARE).then(function(){alert('복사했습니다. 카톡에 붙여넣기 하세요.')});return}
  var t=document.createElement('textarea');t.value=SHARE;document.body.appendChild(t);t.select();
  try{document.execCommand('copy');alert('복사했습니다.')}catch(e){}
  document.body.removeChild(t);
}
</script>

<!-- 방문자 수 (WORD_API 를 넣기 전까지는 저절로 숨는다) -->
<script src="word-config.js"></script>
<script src="visitors.js"></script>
</body></html>
`;

/* ---------- 요약 JSON ---------- */
const snippet = verses.length
  ? (verses[0].t.length > 110 ? verses[0].t.slice(0, 110) + '…' : verses[0].t)
  : '';
const json = {
  date: today, weekday, source: day.source,
  passage: day.passage, title: day.title, theme: day.theme, verseSnippet: snippet,
  adult: day.adult,
  kids: { verseRef: day.kids.verseRef, verse: kidVerse, emoji: day.kids.emoji,
          summary: day.kids.summary, mission: day.kids.mission, quiz: day.kids.quiz },
  missingVerses: missing
};
json.updatedAt = keepTimeIfSame(path.join(ROOT, 'word-today.json'), json);

fs.writeFileSync(path.join(ROOT, 'today.html'), html);
fs.writeFileSync(path.join(ROOT, 'word-today.json'), JSON.stringify(json, null, 2) + '\n');
console.log(`[오늘의 말씀] ${today} (${weekday}) ${day.passage} — ${day.title}`);
console.log(`  본문 ${verses.length}절${missing.length ? ' / 누락 ' + missing.join(',') + '절' : ''} · 출처 ${day.source}`);
console.log('  today.html, word-today.json 생성 완료');

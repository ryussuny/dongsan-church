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
  ...(day.remember ? ['📌 오늘 기억할 한 줄', day.remember, ''] : []),
  '🌿 묵상',
  ...day.adult.questions.map((q, i) => `${i + 1}. ${q}`),
  '',
  `🙏 ${day.adult.prayer}`,
  '',
  '동산감리교회 오늘의 말씀 나눔'
].join('\n');

/* ---------- 오늘의 핵심 절 (어린이 암송 구절과 같은 절) ---------- */
const keyRange = (() => {
  const r = WordData.parseRef(day.kids.verseRef), p = WordData.parseRef(day.passage);
  if (!r || !p || r.book !== p.book || !r.from) return null;
  return { ch: String(r.chapter), base: String(p.chapter), from: +r.from, to: +(r.to || r.from) };
})();
const isKey = v => {
  if (!keyRange) return false;
  const s = String(v), c = s.indexOf(':') > 0 ? s.split(':')[0] : keyRange.base, n = +(s.indexOf(':') > 0 ? s.split(':')[1] : s);
  return c === keyRange.ch && n >= keyRange.from && n <= keyRange.to;
};
const series = WordData.series ? WordData.series(today) : null;
const dp = today.split('-');
const dateLong = `${dp[0]}년 ${+dp[1]}월 ${+dp[2]}일 ${weekday === '주일' ? '주일' : weekday + '요일'}`;
const srcTxt = day.source === 'plan' ? '교회 읽기표' : (day.source === 'custom' ? '인도자 지정' : '매일 묵상표');
const verseHtml = verses.map((v, i) => {
  const t = esc(v.t), body = i === 0 && v.t ? `<span class="dc">${esc(v.t.charAt(0))}</span>${esc(v.t.slice(1))}` : t;
  return `<p class="vv${isKey(v.v) ? ' key' : ''}"><span class="vn">${v.v}</span><span class="vt">${body}</span></p>`;
}).join('\n    ');

/* ---------- today.html — A 새벽 종이 (주보 한 장처럼) ---------- */
const html = `<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8">
<script src="theme.js"></script>
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
<title>오늘의 말씀 · ${esc(today.replace(/-/g, '.'))} — 동산감리교회</title>
<meta name="description" content="${esc(day.passage)} ${esc(day.title)} — 동산감리교회 오늘의 말씀">
<meta property="og:title" content="오늘의 말씀 · ${esc(day.passage)}">
<meta property="og:description" content="${esc(day.title)} — 동산감리교회">
<meta name="theme-color" content="#f6f1e7">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700;900&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{--bg:#f6f1e7;--paper:#fbf8f1;--warm:#ece3d1;--line:#d8cdb8;--rule:#cfc4b0;--ink:#1f1b16;--ink2:#3a332a;--ink3:#6b6052;
 --acc:#1f2f5e;--acc-on:#f6f1e7;--mark:#f1dfa8;--moss:#5f7d4d}
[data-theme="dark"]{color-scheme:dark;--bg:#15171c;--paper:#1c1f26;--warm:#262a33;--line:#353a45;--rule:#3d4350;--ink:#ece6da;--ink2:#d3ccbf;--ink3:#a59d90;
 --acc:#a9bdf0;--acc-on:#15171c;--mark:rgba(241,223,168,.24);--moss:#8fb47a}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
body{font-family:'Noto Sans KR',sans-serif;background:var(--bg);color:var(--ink);line-height:1.8;word-break:keep-all;overflow-wrap:anywhere}
a{color:var(--acc)}
.serif,h1,h2,.ttl,.verse,.keep div,.q b,.pray,.kv{font-family:'Noto Serif KR','Gowun Batang',serif}
.wrap{max-width:680px;margin:0 auto;padding:12px 22px calc(40px + env(safe-area-inset-bottom))}
/* 머리 */
.dl{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:44px;font-size:12px;letter-spacing:.12em;color:var(--ink3);font-weight:500}
.dl .r{display:flex;align-items:center;gap:8px}
.dl .home{letter-spacing:0;font-size:13px;font-weight:700;text-decoration:none;min-height:44px;display:flex;align-items:center}
#themeSlot #themeBtn{width:40px;height:40px;border-radius:50%;border:1px solid var(--rule);background:transparent;font-size:16px;line-height:1;cursor:pointer}
[data-theme="dark"] #themeSlot #themeBtn{background:transparent!important;border-color:var(--rule)!important}
.mast{margin-top:6px;border-top:3px solid var(--ink);border-bottom:1px solid var(--ink);padding:12px 0 10px;text-align:center}
.mast .ch{font-size:11.5px;letter-spacing:.32em;color:var(--acc);font-weight:700}
.mast h1{margin-top:4px;font-size:28px;font-weight:900;line-height:1.25}
.mast .sub{margin-top:4px;font-size:12px;color:var(--ink3)}
/* 지난 말씀 알림 — 게시가 늦어 어제 것이 걸려 있을 때만 나온다 */
.stale{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;background:var(--warm);border-radius:4px;padding:12px 14px;margin:14px 0 0;font-size:13.5px;color:var(--ink2)}
.stale[hidden]{display:none}
.stale b{color:var(--ink)}
.stale a{margin-left:auto;flex:none;background:var(--acc);color:var(--acc-on);font-weight:700;border-radius:4px;padding:8px 14px;font-size:13px;white-space:nowrap;text-decoration:none}
.visitors{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:12px 0 0;font-size:12px;color:var(--ink3)}
.visitors[hidden]{display:none}
.visitors b{color:var(--ink2);font-weight:700}
.vt-sep{color:var(--rule)}
.vt-dot{width:7px;height:7px;border-radius:50%;background:var(--moss);margin-right:2px}
/* 제목 */
.hero{margin-top:24px}
.hero .k{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-size:12.5px;font-weight:700;color:var(--acc);letter-spacing:.05em}
.hero .k i{width:18px;height:1px;background:var(--acc)}
.hero .ttl{margin-top:12px;font-size:clamp(30px,8.4vw,40px);font-weight:900;line-height:1.28;letter-spacing:-.02em}
.hero .pl{margin-top:16px;display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:4px 10px;border-top:1.5px solid var(--ink);border-bottom:1px solid var(--rule);padding:10px 0}
.hero .pl b{font-family:'Noto Serif KR','Gowun Batang',serif;font-size:16.5px;font-weight:600}
.hero .pl span{font-size:12px;color:var(--ink3)}
.hero .th{display:inline-block;margin-top:10px;font-size:12px;border:1px solid var(--rule);color:var(--ink2);padding:3px 10px;border-radius:999px}
/* 구역 제목 */
.sh{display:flex;align-items:center;gap:10px;margin:34px 0 12px}
.sh h2{font-size:21px;font-weight:700}
.sh i{flex:1;height:1px;background:var(--rule)}
.sh small{font-size:12px;color:var(--ink3)}
/* 본문 */
.verse{margin-top:20px;font-size:18.5px;line-height:1.95}
.vv{position:relative;padding:.28em 0 .28em 2.1em}
.vn{position:absolute;left:0;top:.85em;font-family:'Noto Sans KR',sans-serif;font-size:.62em;line-height:1;font-weight:700;color:var(--acc)}
.dc{float:left;font-size:3.05em;line-height:.92;font-weight:900;margin:.1em .14em 0 0;color:var(--acc)}
.vv.key .vt{background:var(--mark);-webkit-box-decoration-break:clone;box-decoration-break:clone;padding:0 .12em;border-radius:2px}
.note{margin-top:14px;padding:11px 13px;background:var(--warm);border-radius:4px;font-size:12.5px;color:var(--ink2);line-height:1.7}
/* 마음에 새길 한 줄 */
.keep{margin:28px 0 0;padding:22px 4px;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);text-align:center}
.keep small{display:block;font-size:11.5px;letter-spacing:.2em;color:var(--ink3);font-weight:700}
.keep div{margin-top:10px;font-size:21px;line-height:1.6;font-weight:700;color:var(--acc)}
/* 묵상 · 복음 · 질문 · 기도 */
.explain p{font-size:16px;line-height:1.95;color:var(--ink2);margin:0 0 .95rem}
.explain p:last-child{margin-bottom:0}
.gospel{margin-top:16px;padding:16px 18px;border-radius:4px;background:var(--warm);font-size:15px;line-height:1.85;color:var(--ink2)}
.gospel b{display:block;font-size:12px;letter-spacing:.08em;color:var(--acc);margin-bottom:4px}
.q{display:flex;gap:14px;padding:7px 0;font-size:16px;line-height:1.8}
.q b{flex:none;font-size:22px;font-weight:900;color:var(--acc);line-height:1.3;min-width:14px}
.pray{margin-top:14px;padding-top:16px;border-top:1px solid var(--rule);font-size:17px;line-height:1.9}
/* 어린이와 함께 */
.kids{margin-top:34px;padding:22px 20px;border:1.5px solid var(--acc);border-radius:6px;background:var(--paper)}
.kids .h{font-size:12.5px;font-weight:700;letter-spacing:.12em;color:var(--acc)}
.kv{margin-top:10px;font-size:20px;line-height:1.7;font-weight:700}
.kvr{margin-top:4px;font-size:12.5px;color:var(--ink3)}
.story{margin-top:14px;font-size:15.5px;line-height:1.9;color:var(--ink2)}
.mi{margin-top:14px;padding:12px 14px;border-radius:4px;background:var(--warm);font-size:15px;font-weight:700;line-height:1.7}
.mi small{display:block;font-size:11.5px;letter-spacing:.1em;color:var(--acc)}
details{margin-top:12px;border-top:1px solid var(--rule);padding-top:12px}
summary{cursor:pointer;font-size:15px;font-weight:700;min-height:32px;list-style:none}
summary::-webkit-details-marker{display:none}
summary::before{content:'▸ ';color:var(--acc)}
details[open] summary::before{content:'▾ '}
details ul{margin:8px 0 0 20px;font-size:15px;color:var(--ink2);line-height:2}
.answer{margin-top:6px;font-size:14px;color:var(--moss);font-weight:700}
/* 단추 */
.btns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:30px}
.btn{display:flex;align-items:center;justify-content:center;min-height:54px;padding:10px;border-radius:4px;font:inherit;font-size:15px;font-weight:700;text-align:center;text-decoration:none;cursor:pointer;
 border:1.5px solid var(--ink);background:transparent;color:var(--ink)}
.btn.b1{grid-column:1/-1;border-color:var(--acc);background:var(--acc);color:var(--acc-on);min-height:58px;font-size:16.5px}
.foot{margin-top:26px;padding-top:16px;border-top:1px solid var(--rule);text-align:center;font-size:12px;color:var(--ink3);line-height:2}
.foot a{font-weight:700;text-decoration:none}
/* 인쇄 — A4 한 장, 단추·알림은 감춘다 */
@media print{
 @page{size:A4;margin:14mm 16mm}
 [data-theme="dark"]{color-scheme:light}
 body{background:#fff;color:#000}
 .dl,.btns,.stale,.visitors,#themeBtn{display:none!important}
 .wrap{max-width:none;padding:0}
 .hero .ttl{font-size:26pt}.verse{font-size:12.5pt;line-height:1.8}.explain p,.q,.story{font-size:11pt}
 .keep div{font-size:15pt}.sh{margin:18pt 0 8pt}.kids{break-inside:avoid}
}
</style>
</head>
<body>
<div class="wrap">
  <div class="dl"><span>${esc(dateLong)}</span><span class="r"><a class="home" href="word.html">말씀 처음으로</a><span id="themeSlot"></span></span></div>
  <header class="mast">
    <div class="ch">동산감리교회</div>
    <h1>오늘의 말씀</h1>
    <div class="sub">매일 새벽 · 하나님과 함께 이웃과 함께</div>
  </header>
  <div class="stale" id="staleBox" hidden role="status"></div>
  <div class="visitors" id="visitorBox" hidden aria-live="polite" aria-label="방문자 수"></div>

  <section class="hero">
    <div class="k">${series ? `<span>${esc(series.title)}</span><i></i><span>${series.day}일째</span>` : `<span>${esc(day.theme || '오늘의 말씀')}</span>`}</div>
    <h2 class="ttl">${esc(day.title || day.passage)}</h2>
    <div class="pl"><b>${esc(day.passage)}</b><span>개역개정 · ${esc(srcTxt)}</span></div>
    ${series && day.theme ? `<span class="th">${esc(day.theme)}</span>` : ''}
  </section>

  <div class="verse">
    ${verses.length ? verseHtml : `<p style="color:var(--ink3)">${esc(day.passage)} 본문을 성경책에서 펴서 읽어 주세요.</p>`}
  </div>
  ${missing.length ? `<div class="note">${missing.join(', ')}절은 앱에 실린 본문 파일에 빠져 있어 표시하지 못했습니다. 성경책에서 함께 읽어 주세요.</div>` : ''}

  ${day.remember ? `<div class="keep"><small>오늘 마음에 새길 한 줄</small><div>${esc(day.remember)}</div></div>` : ''}

  ${day.explain || day.gospel ? `<div class="sh"><h2>묵상</h2><i></i></div>
  <div class="explain">${(day.explain || '').split(/\n{2,}/).filter(Boolean).map(t => `<p>${esc(t.trim())}</p>`).join('')}</div>
  ${day.gospel ? `<div class="gospel"><b>복음으로 보기</b>${esc(day.gospel)}</div>` : ''}` : ''}

  <div class="sh"><h2>생각해 볼 질문</h2><i></i></div>
  ${day.adult.questions.map((q, i) => `<div class="q"><b>${i + 1}</b><div>${esc(q)}</div></div>`).join('\n  ')}
  <div class="pray">${esc(day.adult.prayer)}</div>

  <section class="kids">
    <div class="h">어린이와 함께 읽어요</div>
    <div class="kv">“${esc(kidVerse || day.kids.summary)}”</div>
    <div class="kvr">${esc(day.kids.verseRef)}</div>
    <div class="story">${esc(day.kids.summary)}</div>
    <div class="mi"><small>오늘의 미션</small>${esc(day.kids.mission)}</div>
    <details>
      <summary>말씀 퀴즈 — ${esc(day.kids.quiz.q)}</summary>
      <ul>${day.kids.quiz.c.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
      <div class="answer">정답: ${esc(day.kids.quiz.c[day.kids.quiz.a])}</div>
    </details>
  </section>

  <div class="btns">
    <a class="btn b1" href="word-adult.html">성인용 앱에서 읽기</a>
    <a class="btn" href="word-kids.html">어린이용 앱</a>
    <a class="btn" href="word-easy.html">큰 글씨</a>
    <button class="btn" type="button" onclick="copyToday()">카톡으로 나누기</button>
    <button class="btn" type="button" onclick="window.print()">인쇄하기</button>
  </div>

  <div class="foot">
    이 페이지는 매일 새벽에 자동으로 새로 올라갑니다. 늦어질 때는 위에 알려 드립니다.<br>
    지난 말씀은 <a href="archive.html">말씀 아카이브</a>에서 보실 수 있습니다.<br>
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
  remember: day.remember || '',
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

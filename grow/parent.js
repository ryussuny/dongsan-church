/* ===========================================================
   함께 자라요 — 부모 화면
   오늘 · 기록(그래프) · 일지 · 자비스 코치 · 치료사 리포트 · 설정

   모든 기록은 이 기기에만 있다. 리포트는 인쇄(PDF)하거나 공유 버튼으로
   부모가 직접 선생님께 보낸다.
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;

var TABS = [['home', '🏠', '오늘'], ['rec', '📈', '기록'], ['diary', '📝', '일지'], ['coach', '🤖', '코치'], ['report', '🖨️', '리포트'], ['set', '⚙️', '설정']];
var tab = 'home', period = 7, coachCtl = null;

/* 차트 색 — 영역 색은 그대로, 노랑만 그래프에서 조금 진하게(밝은 바탕에서 보이게) */
function areaColor(k) { return k === 'mind' ? '#cf8f00' : (G.AREAS[k] || {}).color || '#4f8cff'; }

G.css('parent', [
  '.pbody h4{font-family:Jua,sans-serif;font-weight:400;font-size:17px;margin:12px 0 4px}',
  '.pstats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
  '.pstats div{background:var(--bg);border-radius:16px;padding:10px 8px;text-align:center}',
  '.pstats b{display:block;font-family:Jua,sans-serif;font-weight:400;font-size:26px;line-height:1.2}',
  '.pstats small{color:var(--soft);font-size:12px}',
  '.ptools{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}',
  /* 막대 그래프 (하루 시간) */
  '.dchart{position:relative;height:160px;display:flex;align-items:flex-end;gap:2px;padding:0 0 0 30px;border-bottom:1px solid var(--line)}',
  '.dchart .ygrid{position:absolute;left:30px;right:0;border-top:1px dashed var(--line);font-size:10px;color:var(--soft)}',
  '.dchart .ygrid span{position:absolute;left:-30px;top:-7px;width:26px;text-align:right}',
  '.dchart .bar{flex:1;min-width:2px;max-width:34px;height:100%;display:flex;align-items:flex-end;position:relative;outline:none}',
  '.dchart .bar i{display:block;width:100%;background:#4f8cff;border-radius:4px 4px 0 0;min-height:0;transition:filter .15s}',
  '.dchart .bar:hover i,.dchart .bar:focus i{filter:brightness(1.15);box-shadow:0 0 0 2px var(--surface),0 0 0 3px #4f8cff}',
  '.dlabels{display:flex;justify-content:space-between;padding-left:30px;font-size:11px;color:var(--soft);margin-top:3px}',
  '.ptip{position:fixed;z-index:120;pointer-events:none;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:6px 10px;box-shadow:var(--shadow);font-size:13px;line-height:1.35;display:none}',
  '.ptip b{display:block;font-size:15px}',
  '.ptip small{color:var(--soft)}',
  /* 가로 막대 (영역·실행기능) */
  '.hbars{display:flex;flex-direction:column;gap:7px}',
  '.hbar{display:grid;grid-template-columns:minmax(92px,30%) 1fr auto;align-items:center;gap:8px;font-size:13.5px}',
  '.hbar .lb{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700}',
  '.hbar .tr{height:14px;background:var(--bg);border-radius:4px;overflow:hidden}',
  '.hbar .tr i{display:block;height:100%;border-radius:0 4px 4px 0;background:var(--c,#4f8cff)}',
  '.hbar .v{color:var(--soft);font-size:12.5px;white-space:nowrap;min-width:64px;text-align:right}',
  '@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .hbar .tr i,:root:not([data-theme=light]) .dchart .bar i{filter:brightness(.88)}}',
  /* 표 */
  '.tblw{overflow-x:auto;margin:0 -4px}',
  '.tbl{width:100%;border-collapse:collapse;font-size:13.5px}',
  '.tbl th{text-align:left;color:var(--soft);font-weight:700;font-size:12px;padding:6px 4px;border-bottom:1px solid var(--line);white-space:nowrap}',
  '.tbl td{padding:7px 4px;border-bottom:1px solid var(--line);vertical-align:middle}',
  '.tbl td:nth-child(3),.tbl td:nth-child(4){white-space:nowrap}',
  '.arts>p,.pics>p{grid-column:1/-1}',
  '.tbl .mb{display:inline-block;width:34px;height:8px;background:var(--bg);border-radius:4px;overflow:hidden;vertical-align:middle;margin-right:4px}',
  '.tbl .mb i{display:block;height:100%;background:#22b07d;border-radius:4px}',
  '.tbl .area{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px}',
  /* 낱말·칩 */
  '.wchips{display:flex;flex-wrap:wrap;gap:6px}',
  '.wchips span{background:var(--bg);border-radius:999px;padding:4px 10px;font-size:14px}',
  '.wchips span small{color:var(--soft);margin-left:3px}',
  '.wchips span button{margin-left:4px;color:var(--soft)}',
  '.moods{display:flex;gap:6px;flex-wrap:wrap}',
  '.moods div{text-align:center;font-size:11px;color:var(--soft);min-width:38px}',
  '.moods div b{display:block;font-size:26px;font-weight:400}',
  /* 일지 */
  '.note{border-left:4px solid var(--accent);padding:6px 10px;margin:8px 0;background:var(--bg);border-radius:0 12px 12px 0}',
  '.note .nt{font-size:12px;color:var(--soft);display:flex;justify-content:space-between;gap:6px}',
  '.note p{white-space:pre-wrap;margin-top:2px}',
  /* 코치 */
  '.clog{display:flex;flex-direction:column;gap:10px;margin:10px 0}',
  '.cmsg{padding:10px 14px;border-radius:16px;font-size:14.5px;line-height:1.7;max-width:100%}',
  '.cmsg.user{align-self:flex-end;background:color-mix(in srgb,var(--accent) 14%,var(--surface));max-width:88%;white-space:pre-wrap}',
  '.cmsg.assistant{background:var(--surface);box-shadow:var(--shadow)}',
  '.md h4,.md h5{font-family:Jua,sans-serif;font-weight:400;font-size:16.5px;margin:10px 0 2px}',
  '.md ul,.md ol{padding-left:20px;margin:4px 0}',
  '.md p{margin:5px 0}',
  '.md table{border-collapse:collapse;font-size:13px;margin:6px 0;display:block;overflow-x:auto}',
  '.md td,.md th{border:1px solid var(--line);padding:4px 6px;vertical-align:top}',
  '.cin{display:flex;gap:6px;align-items:flex-end;position:sticky;bottom:calc(64px + var(--safe-b));background:var(--bg);padding:8px 0}',
  '.cin textarea{flex:1;min-height:52px;max-height:160px}',
  /* 사진 낱말 */
  '.pics{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}',
  '.pics div{position:relative;background:var(--bg);border-radius:14px;padding:6px;text-align:center;font-size:13px}',
  '.pics img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;display:block}',
  '.pics button{position:absolute;top:2px;right:2px;width:28px;height:28px;border-radius:50%;background:var(--surface)}',
  '.arts{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:6px}',
  '.arts img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;background:#fff;cursor:pointer}',
  '.lvrow{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid var(--line);font-size:14px}',
  '.lvrow select{min-height:36px;border-radius:10px;border:2px solid var(--line);background:var(--bg);padding:0 6px}',
  '.sw{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:15px}',
  '.sw input[type=checkbox]{width:24px;height:24px;accent-color:var(--accent)}',
  '.sw input[type=range]{width:46%}',
  '.princ li{margin:6px 0;list-style:none}',
  '.rep-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}',
  '@media print{.pbody{padding:0}.card{page-break-inside:avoid}.cin,.ptools{display:none!important}}'
].join('\n'));

/* ---------- 묶음 계산 ---------- */
function stats(days) {
  var since = new Date(); since.setHours(0, 0, 0, 0); since = since.getTime() - (days - 1) * 864e5;
  var L = G.logs().filter(function (l) { return l.t >= since; });
  var byDay = {}, byArea = {}, byAct = {}, byEF = {}, moods = [];
  L.forEach(function (l) {
    var ms = Math.min(l.ms || 0, 15 * 60000);
    var d = byDay[l.d] = byDay[l.d] || { ms: 0, n: 0 }; d.ms += ms; d.n++;
    var a = byArea[l.area] = byArea[l.area] || { ms: 0, n: 0 }; a.ms += ms; a.n++;
    var b = byAct[l.id] = byAct[l.id] || { n: 0, tr: 0, ok: 0, lv: [], last: 0, ms: 0, area: l.area }; b.n++; b.tr += l.n || 0; b.ok += l.ok || 0; b.lv.push(l.lv || 1); b.last = Math.max(b.last, l.t); b.ms += ms;
    var def = G.acts[l.id]; ((def && def.ef) || []).forEach(function (k) { byEF[k] = (byEF[k] || 0) + 1; });
    if (l.id === 'checkin' && l.x && l.x.emo) moods.push({ d: l.d, emo: l.x.emo });
  });
  return { L: L, byDay: byDay, byArea: byArea, byAct: byAct, byEF: byEF, moods: moods, since: since, days: days };
}
function mins(ms) { var m = Math.round(ms / 60000); return m < 1 && ms > 0 ? '1분 미만' : m + '분'; }
function emo(id) { return (D.EMOTIONS || []).filter(function (e) { return e.id === id; })[0] || { e: '🙂', name: id }; }
function fmtD(t) { var d = new Date(t); return (d.getMonth() + 1) + '/' + d.getDate(); }
function card(html, cls) { return '<div class="card ' + (cls || '') + '">' + html + '</div>'; }

/* ---------- 말풍선 도움말(툴팁) ---------- */
var tipEl = null;
function tip(e, strong, sub) {
  if (!tipEl) { tipEl = G.el('<div class="ptip" role="tooltip"><b></b><small></small></div>'); document.body.appendChild(tipEl); }
  if (!e) { tipEl.style.display = 'none'; return; }
  tipEl.querySelector('b').textContent = strong; tipEl.querySelector('small').textContent = sub;
  tipEl.style.display = 'block';
  var r = e.getBoundingClientRect(), w = tipEl.offsetWidth;
  tipEl.style.left = G.clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px';
  tipEl.style.top = Math.max(8, r.top - tipEl.offsetHeight - 8) + 'px';
}
function bindTips(root) {
  G.$$('[data-tip]', root).forEach(function (el) {
    var on = function () { var p = el.dataset.tip.split('|'); tip(el, p[0], p[1] || ''); };
    el.addEventListener('pointerenter', on); el.addEventListener('focus', on);
    el.addEventListener('pointerleave', function () { tip(null); }); el.addEventListener('blur', function () { tip(null); });
    el.addEventListener('click', on);
  });
}

/* ---------- 그래프 ---------- */
function dayChart(S) {
  var days = [], max = 0;
  for (var i = S.days - 1; i >= 0; i--) { var dd = new Date(); dd.setDate(dd.getDate() - i); var k = G.today(dd), v = (S.byDay[k] || { ms: 0, n: 0 }); days.push({ k: k, dd: dd, ms: v.ms, n: v.n }); max = Math.max(max, v.ms); }
  var top = Math.max(5, Math.ceil(max / 60000 / 5) * 5);
  var bars = days.map(function (d) {
    var h = d.ms ? Math.max(2, d.ms / 60000 / top * 100) : 0;
    return '<div class="bar" tabindex="0" data-tip="' + (d.ms ? mins(d.ms) : '0분') + ' · 놀이 ' + d.n + '번|' + (d.dd.getMonth() + 1) + '월 ' + d.dd.getDate() + '일" aria-label="' + d.k + ' ' + mins(d.ms) + '"><i style="height:' + h + '%"></i></div>';
  }).join('');
  var grid = [0.5, 1].map(function (f) { return '<div class="ygrid" style="bottom:' + (f * 100) + '%"><span>' + Math.round(top * f) + '분</span></div>'; }).join('');
  var mid = days[Math.floor(days.length / 2)];
  return '<div class="dchart">' + grid + bars + '</div><div class="dlabels"><span>' + fmtD(days[0].dd) + '</span><span>' + fmtD(mid.dd) + '</span><span>오늘</span></div>';
}
function areaBars(S) {
  var keys = G.AREA_ORDER.filter(function (k) { return S.byArea[k]; });
  if (!keys.length) return '<p class="muted">아직 기록이 없어요.</p>';
  var max = Math.max.apply(null, keys.map(function (k) { return S.byArea[k].ms; })) || 1;
  return '<div class="hbars">' + keys.map(function (k) {
    var a = G.AREAS[k], v = S.byArea[k];
    return '<div class="hbar" tabindex="0" data-tip="' + mins(v.ms) + '|' + a.name + ' · ' + v.n + '번"><span class="lb">' + a.icon + ' ' + a.name + '</span><span class="tr"><i style="width:' + Math.max(3, v.ms / max * 100) + '%;--c:' + areaColor(k) + '"></i></span><span class="v">' + mins(v.ms) + ' · ' + v.n + '번</span></div>';
  }).join('') + '</div>';
}
function efBars(S) {
  var keys = Object.keys(G.EF), max = Math.max.apply(null, keys.map(function (k) { return S.byEF[k] || 0; })) || 1;
  return '<div class="hbars">' + keys.map(function (k) {
    var e = G.EF[k], v = S.byEF[k] || 0;
    return '<div class="hbar" tabindex="0" data-tip="' + v + '번|' + e.name + ' — ' + e.desc + '"><span class="lb">' + e.e + ' ' + e.name + '</span><span class="tr"><i style="width:' + (v ? Math.max(3, v / max * 100) : 0) + '%;--c:#4b5bd6"></i></span><span class="v">' + v + '번</span></div>';
  }).join('') + '</div>' + efAdvice(S);
}
function efAdvice(S) {
  var keys = Object.keys(G.EF), tot = keys.reduce(function (s, k) { return s + (S.byEF[k] || 0); }, 0);
  if (tot < 6) return '<p class="muted" style="margin-top:8px">놀이 기록이 쌓이면 어떤 생각 힘을 많이 썼는지 보여 드려요.</p>';
  var low = keys.filter(function (k) { return (S.byEF[k] || 0) < tot / keys.length * 0.35; });
  if (!low.length) return '<p class="muted" style="margin-top:8px">👍 여섯 가지 생각 힘을 고르게 쓰고 있어요.</p>';
  var sug = low.map(function (k) {
    var acts = Object.keys(G.acts).filter(function (id) { var d = G.acts[id]; return !d.tool && (d.ef || [])[0] === k; }).slice(0, 2).map(function (id) { return G.acts[id].icon + ' ' + G.acts[id].title; });
    return '<b>' + G.EF[k].name + '</b>' + (acts.length ? ' — ' + acts.join(', ') : '');
  });
  return '<p class="muted" style="margin-top:8px">💡 조금 덜 쓴 힘: ' + sug.join(' · ') + '</p>';
}
function actTable(S, withGoal) {
  var ids = Object.keys(S.byAct).sort(function (a, b) { return G.AREA_ORDER.indexOf(S.byAct[a].area) - G.AREA_ORDER.indexOf(S.byAct[b].area) || S.byAct[b].n - S.byAct[a].n; });
  if (!ids.length) return '<p class="muted">아직 기록이 없어요.</p>';
  return '<div class="tblw"><table class="tbl"><thead><tr><th>놀이</th><th>횟수</th><th>반응·정답</th><th>단계</th>' + (withGoal ? '<th>기르는 힘</th>' : '<th>마지막</th>') + '</tr></thead><tbody>' +
    ids.map(function (id) {
      var b = S.byAct[id], d = G.acts[id] || { title: id, icon: '•' }, pct = b.tr ? Math.round(b.ok / b.tr * 100) : null;
      var lv = b.lv.slice(-6), trend = lv[lv.length - 1] > lv[0] ? ' ↑' : lv[lv.length - 1] < lv[0] ? ' ↓' : '';
      return '<tr><td><span class="area" style="background:' + areaColor(b.area) + '"></span>' + d.icon + ' ' + G.esc(d.title) + '</td><td>' + b.n + '</td><td>' +
        (pct == null ? '<span class="muted">자유 놀이</span>' : '<span class="mb"><i style="width:' + pct + '%"></i></span>' + pct + '%') + '</td><td>' + lv.join('→') + trend + '</td><td>' +
        (withGoal ? G.esc(d.goal || '') : fmtD(b.last)) + '</td></tr>';
    }).join('') + '</tbody></table></div>';
}
function moodRow(S) {
  if (!S.moods.length) return '<p class="muted">오늘의 놀이를 시작하면 「오늘 기분」이 기록돼요.</p>';
  return '<div class="moods">' + S.moods.slice(-14).map(function (m) { var e = emo(m.emo); return '<div><b>' + e.e + '</b>' + m.d.slice(5).replace('-', '/') + '</div>'; }).join('') + '</div>';
}
function saidChips(limit, del) {
  var s = G.store.get('saidWords', {}), ks = Object.keys(s).sort(function (a, b) { return s[b].n - s[a].n; });
  if (!ks.length) return '<p class="muted">말하기 놀이·자비스랑 이야기에서 음성 인식이 들은 말이 여기 모여요.</p>';
  return '<div class="wchips">' + ks.slice(0, limit || 200).map(function (k) { return '<span>' + G.esc(k) + '<small>' + s[k].n + '</small>' + (del ? '<button data-delw="' + G.esc(k) + '" aria-label="지우기">×</button>' : '') + '</span>'; }).join('') + '</div>' +
    '<p class="muted" style="margin-top:6px">총 ' + ks.length + '개 · 음성 인식이라 정확하지 않을 수 있어요. 잘못 들은 말은 × 로 지우세요.</p>';
}

/* ---------- 받아쓰기 (부모 메모·코치 질문을 말로) ---------- */
function dictate(ta, btn) {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { btn.hidden = true; return; }
  var rec = null;
  btn.onclick = function () {
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = 'ko-KR'; rec.continuous = true; rec.interimResults = false;
    var base = ta.value;
    rec.onresult = function (e) { var t = ''; for (var i = 0; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript; ta.value = (base ? base + ' ' : '') + t; };
    rec.onend = function () { rec = null; btn.textContent = '🎤'; };
    rec.onerror = function () { rec = null; btn.textContent = '🎤'; };
    btn.textContent = '⏹'; rec.start();
  };
}

/* ---------- 마크다운 조금 ---------- */
function md(t) {
  var lines = G.esc(t).split('\n'), out = [], list = null, table = null;
  function inl(s) { return s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>'); }
  function close() { if (list) { out.push('</' + list + '>'); list = null; } if (table) { out.push('</table>'); table = null; } }
  lines.forEach(function (l) {
    var m;
    if (/^\s*\|.*\|\s*$/.test(l)) {
      if (/^\s*\|[\s:|-]+\|\s*$/.test(l)) return;
      if (!table) { close(); out.push('<table>'); table = 1; }
      out.push('<tr>' + l.trim().slice(1, -1).split('|').map(function (c) { return '<td>' + inl(c.trim()) + '</td>'; }).join('') + '</tr>'); return;
    }
    if ((m = /^\s*#{1,6}\s+(.*)/.exec(l))) { close(); out.push('<h4>' + inl(m[1]) + '</h4>'); return; }
    if ((m = /^\s*[-*•]\s+(.*)/.exec(l))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push('<li>' + inl(m[1]) + '</li>'); return; }
    if ((m = /^\s*\d+[.)]\s+(.*)/.exec(l))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push('<li>' + inl(m[1]) + '</li>'); return; }
    close();
    if (l.trim()) out.push('<p>' + inl(l) + '</p>');
  });
  close();
  return '<div class="md">' + out.join('') + '</div>';
}

/* ---------- 탭 ---------- */
function renderTabs() {
  var nav = G.$('#pTabs');
  nav.innerHTML = TABS.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (t[0] === tab ? 'on' : '') + '"><span>' + t[1] + '</span>' + t[2] + '</button>'; }).join('');
  G.$$('button', nav).forEach(function (b) { b.onclick = function () { tab = b.dataset.t; renderTabs(); render(); window.scrollTo(0, 0); }; });
}
G.renderParent = function (t) { if (t) tab = t; renderTabs(); render(); };
function render() {
  var body = G.$('#pBody'); tip(null);
  ({ home: tHome, rec: tRec, diary: tDiary, coach: tCoach, report: tReport, set: tSet })[tab](body);
  bindTips(body);
}

/* ===== 오늘 ===== */
function tHome(body) {
  var S = stats(7), S14 = stats(14), today = S.byDay[G.today()] || { ms: 0, n: 0 };
  var daysOn = Object.keys(S.byDay).length, nick = (G.profile.nick || '').trim();
  var h = '';
  if (!nick && !G.profile.birth) h += card('<h3>👋 처음 오셨네요</h3><p>먼저 <b>⚙️ 설정</b>에서 아이 별명, 태어난 달, 다니는 치료, 집중할 영역을 넣어 주세요. 자비스가 아이 이름을 불러 주고 놀이를 맞춰 골라요. 모든 정보는 이 기기에만 저장돼요.</p><button class="btn" data-go-tab="set" style="margin-top:8px">설정하러 가기</button>');
  h += card('<h3>' + (nick ? G.esc(nick) + ' — ' : '') + '오늘</h3><div class="pstats"><div><b>' + today.n + '</b><small>오늘 한 놀이</small></div><div><b>' + mins(today.ms) + '</b><small>오늘 놀이 시간</small></div><div><b>' + daysOn + '/7</b><small>이번 주 한 날</small></div></div>');
  h += card('<h3>💗 요즘 기분</h3>' + moodRow(S14));
  h += card('<h3>🧠 생각 힘(실행기능) 균형 · 14일</h3><p class="muted">전두엽이 맡는 여섯 가지 힘을 어떤 놀이로 얼마나 썼는지예요.</p>' + efBars(S14));
  var plan = G.planToday();
  h += card('<h3>📋 오늘의 놀이 미리 보기</h3><ol style="padding-left:20px">' + plan.map(function (e) {
    if (typeof e === 'string') { var d = G.acts[e]; return d ? '<li>' + d.icon + ' ' + G.esc(d.title) + '</li>' : ''; }
    return '<li>' + e.pick.map(function (id) { var d = G.acts[id]; return d.icon + ' ' + G.esc(d.title); }).join(' <span class="muted">또는</span> ') + ' <span class="muted">(아이가 골라요)</span></li>';
  }).join('') + '</ol><p class="muted">' + G.settings.sessionMin + '분 · 생각 힘 놀이 하나는 꼭 들어가고, 몸놀이로 화면을 쉬고, 쉬어가기로 끝나요.</p>' +
    '<button class="btn green" id="pStart" style="margin-top:8px">▶ 아이 화면에서 시작</button>');
  /* 오늘의 부모 팁 — 날마다 바뀐다 */
  var acts = Object.keys(G.acts).map(function (k) { return G.acts[k]; }).filter(function (d) { return d.offline; });
  var di = +G.today().replace(/-/g, '') % Math.max(1, acts.length), ta = acts[di];
  if (ta) h += card('<h3>🏠 오늘의 화면 밖 놀이</h3><p><b>' + ta.icon + ' ' + G.esc(ta.title) + '</b> 대신 생활 속에서:</p><p>' + G.esc(ta.offline) + '</p><p class="muted">' + G.esc(ta.goal || '') + '</p>');
  h += card('<h3>📚 이 앱이 지키는 치료 원리</h3><ul class="princ">' + (G.PRINCIPLES || []).map(function (p) { return '<li>' + p.e + ' <b>' + p.t + '</b> — ' + p.d + '</li>'; }).join('') + '</ul>');
  body.innerHTML = h;
  var ps = G.$('#pStart', body); if (ps) ps.onclick = function () { G.home(); G.startSession(); };
  G.$$('[data-go-tab]', body).forEach(function (b) { b.onclick = function () { tab = b.dataset.goTab; renderTabs(); render(); }; });
}

/* ===== 기록 ===== */
function tRec(body) {
  var S = stats(period);
  var h = '<div class="ptools">' + [7, 30, 90].map(function (p) { return '<button class="chip ' + (p === period ? 'on' : '') + '" data-p="' + p + '">최근 ' + p + '일</button>'; }).join('') + '</div>';
  var tot = S.L.reduce(function (s, l) { return s + Math.min(l.ms || 0, 9e5); }, 0), tr = S.L.reduce(function (s, l) { return s + (l.n || 0); }, 0), ok = S.L.reduce(function (s, l) { return s + (l.ok || 0); }, 0);
  h += card('<div class="pstats"><div><b>' + S.L.length + '</b><small>놀이 횟수</small></div><div><b>' + mins(tot) + '</b><small>모두 합한 시간</small></div><div><b>' + (tr ? Math.round(ok / tr * 100) + '%' : '–') + '</b><small>반응·정답</small></div></div>');
  h += card('<h3>하루 놀이 시간</h3>' + dayChart(S));
  h += card('<h3>영역별 시간</h3>' + areaBars(S));
  h += card('<h3>🧠 생각 힘(실행기능) 균형</h3>' + efBars(S));
  h += card('<h3>놀이별 결과</h3><p class="muted">단계는 자비스가 맞춰 올리고 내린 기록이에요(1→3). ↑ 는 오른 것.</p>' + actTable(S));
  h += card('<h3>🗣️ 아이가 말한 낱말</h3>' + saidChips(200, true));
  h += card('<h3>🎨 그림첩</h3><div class="arts" id="pArts"><p class="muted">불러오는 중…</p></div>');
  h += card('<h3>내보내기</h3><p class="muted">기록을 표 파일(CSV)로 받아 엑셀에서 볼 수 있어요. 공개 홈페이지에 올리지 마세요.</p><button class="btn soft" id="pCsv" style="margin-top:6px">⬇️ 기록 CSV 받기</button>');
  body.innerHTML = h;
  G.$$('[data-p]', body).forEach(function (b) { b.onclick = function () { period = +b.dataset.p; render(); }; });
  G.$$('[data-delw]', body).forEach(function (b) { b.onclick = function () { var s = G.store.get('saidWords', {}); delete s[b.dataset.delw]; G.store.set('saidWords', s); render(); }; });
  G.$('#pCsv', body).onclick = function () {
    var rows = [['날짜', '시각', '영역', '놀이', '단계', '시도', '맞음', '초', '덧붙임']];
    G.logs().forEach(function (l) { var d = G.acts[l.id]; rows.push([l.d, new Date(l.t).toTimeString().slice(0, 5), (G.AREAS[l.area] || {}).name || l.area, d ? d.title : l.id, l.lv, l.n, l.ok, Math.round((l.ms || 0) / 1000), JSON.stringify(l.x || {})]); });
    var csv = '﻿' + rows.map(function (r) { return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
    download(new Blob([csv], { type: 'text/csv' }), '함께자라요-기록-' + G.today() + '.csv');
  };
  G.db.all('art').then(function (arts) {
    var box = G.$('#pArts'); if (!box) return;
    arts.sort(function (a, b) { return b.t - a.t; });
    box.innerHTML = arts.length ? arts.slice(0, 24).map(function (a) { return '<img src="' + a.img + '" alt="' + fmtD(a.t) + ' 그림" data-id="' + a.id + '">'; }).join('') : '<p class="muted">그리기 놀이에서 💾 저장한 그림이 여기 모여요. 미술치료 선생님께 보여 드리세요.</p>';
    G.$$('img', box).forEach(function (im) {
      im.onclick = function () {
        var a = arts.filter(function (x) { return x.id === im.dataset.id; })[0];
        var ov = G.el('<div class="modal"><div class="md-card"><img src="' + a.img + '" style="width:100%;border-radius:14px;background:#fff"><p>' + new Date(a.t).toLocaleString('ko-KR') + (a.emo ? ' · ' + emo(a.emo).e + ' ' + emo(a.emo).name : '') + '</p><div class="row" style="justify-content:center;margin-top:10px"><button class="btn dl">⬇️ 받기</button><button class="btn soft x">닫기</button></div></div></div>');
        document.body.appendChild(ov);
        ov.querySelector('.x').onclick = function () { ov.remove(); };
        ov.querySelector('.dl').onclick = function () { var l = document.createElement('a'); l.href = a.img; l.download = '그림-' + G.today(new Date(a.t)) + '.jpg'; l.click(); };
      };
    });
  });
}

/* ===== 일지 ===== */
var TAGS = [['🎉', '처음 해낸 것'], ['🗣️', '말'], ['✋', '손·몸'], ['💗', '마음·행동'], ['🧑‍⚕️', '치료 메모'], ['😟', '걱정'], ['🙏', '기도']];
var noteTag = '🎉 처음 해낸 것';
function tDiary(body) {
  var notes = G.store.get('diary', []);
  var h = card('<h3>📝 오늘 본 것 적기</h3><p class="muted">처음 한 말, 치료 시간에 선생님이 하신 말씀, 힘들었던 순간… 짧게라도 적어 두면 치료사 리포트와 자비스 코치가 함께 봐요.</p>' +
    '<div class="wchips" style="margin:8px 0" id="nTags">' + TAGS.map(function (t) { var v = t[0] + ' ' + t[1]; return '<button class="chip ' + (v === noteTag ? 'on' : '') + '" data-tag="' + v + '">' + v + '</button>'; }).join('') + '</div>' +
    '<textarea class="inp" id="nText" placeholder="예) 오늘 처음으로 &quot;물&quot; 이라고 말하며 컵을 가리켰다!"></textarea>' +
    '<div class="row" style="margin-top:8px"><input type="date" class="inp" id="nDate" style="flex:1;min-width:150px" value="' + G.today() + '"><button class="btn soft" id="nMic" aria-label="말로 적기">🎤</button><button class="btn" id="nSave">저장</button></div>');
  if (notes.length) {
    var byM = {};
    notes.slice().sort(function (a, b) { return b.t - a.t; }).forEach(function (n) { var m = G.today(new Date(n.t)).slice(0, 7); (byM[m] = byM[m] || []).push(n); });
    h += Object.keys(byM).map(function (m) {
      return card('<h3>' + m.replace('-', '년 ') + '월</h3>' + byM[m].map(function (n) {
        return '<div class="note"><div class="nt"><span>' + fmtD(n.t) + ' · ' + G.esc(n.tag || '') + '</span><button data-deln="' + n.id + '" aria-label="지우기">🗑</button></div><p>' + G.esc(n.text) + '</p></div>';
      }).join(''));
    }).join('');
  } else h += card('<p class="muted">아직 적은 일지가 없어요.</p>');
  body.innerHTML = h;
  G.$$('[data-tag]', body).forEach(function (b) { b.onclick = function () { noteTag = b.dataset.tag; G.$$('[data-tag]', body).forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
  dictate(G.$('#nText', body), G.$('#nMic', body));
  G.$('#nSave', body).onclick = function () {
    var t = G.$('#nText', body).value.trim(); if (!t) { G.toast('내용을 적어 주세요'); return; }
    var dv = G.$('#nDate', body).value, when = dv ? new Date(dv + 'T' + new Date().toTimeString().slice(0, 8)).getTime() : Date.now();
    var ns = G.store.get('diary', []); ns.push({ id: G.uid(), t: when, tag: noteTag, text: t }); G.store.set('diary', ns.slice(-1000));
    G.toast('저장했어요'); render();
  };
  G.$$('[data-deln]', body).forEach(function (b) { b.onclick = function () { if (!confirm('이 일지를 지울까요?')) return; G.store.set('diary', G.store.get('diary', []).filter(function (n) { return n.id !== b.dataset.deln; })); render(); }; });
}

/* ===== 자비스 코치 ===== */
function tCoach(body) {
  var hist = G.store.get('coachChat', []), has = G.ai.key();
  var h = card('<div class="rep-h"><h3>🤖 자비스 코치</h3><button class="btn sm soft" id="cNew">새 대화</button></div><p class="muted">기록을 함께 보고 집 놀이 계획·치료사 질문·마음 돌봄을 도와요. 진단이나 치료를 대신하지 않아요. 아이 이름은 \'아이\'로 바꿔 보내고, 대화는 이 기기에만 남아요.</p>' +
    (has ? '' : '<div class="note" style="margin-top:8px"><p>Claude API 키가 필요해요. <b>⚙️ 설정 → 자비스 AI</b>에서 넣어 주세요. (교회 관리자 앱에 넣은 키가 있으면 그대로 써요.)</p></div>') +
    '<label class="sw" style="border:0"><span>📊 기록 함께 보내기 (최근 14일 요약)</span><input type="checkbox" id="cData" ' + (G.store.get('coachData', true) ? 'checked' : '') + '></label>' +
    '<div class="wchips" id="cQuick">' + G.coach.QUICK.map(function (q, i) { return '<button class="chip" data-q="' + i + '">' + q.e + ' ' + q.t + '</button>'; }).join('') + '</div>');
  h += '<div class="clog" id="cLog">' + hist.map(function (m) { return '<div class="cmsg ' + m.role + '">' + (m.role === 'assistant' ? md(m.content) : G.esc(m.content)) + '</div>'; }).join('') + '</div>';
  h += '<div class="cin"><textarea class="inp" id="cIn" placeholder="궁금한 것을 물어보세요. 예) 아이가 자꾸 귀를 막아요. 어떻게 도와줄까요?"></textarea><button class="btn soft" id="cMic" aria-label="말로 묻기">🎤</button><button class="btn" id="cSend">보내기</button></div>';
  body.innerHTML = h;
  dictate(G.$('#cIn', body), G.$('#cMic', body));
  G.$('#cData', body).onchange = function () { G.store.set('coachData', this.checked); };
  G.$('#cNew', body).onclick = function () { if (coachCtl) coachCtl.abort(); G.store.set('coachChat', []); render(); };
  G.$$('[data-q]', body).forEach(function (b) { b.onclick = function () { send(G.coach.QUICK[+b.dataset.q].q); }; });
  G.$('#cSend', body).onclick = function () {
    if (coachCtl) { coachCtl.abort(); return; }
    var q = G.$('#cIn', body).value.trim(); if (q) send(q);
  };
  var lg = G.$('#cLog', body); if (lg.lastElementChild) lg.lastElementChild.scrollIntoView({ block: 'end' });
  function send(q) {
    if (!G.ai.key()) { G.toast('설정에서 API 키를 먼저 넣어 주세요'); return; }
    var hs = G.store.get('coachChat', []); hs.push({ role: 'user', content: q, t: Date.now() });
    G.store.set('coachChat', hs);
    var log = G.$('#cLog'), u = G.el('<div class="cmsg user"></div>'); u.textContent = q; log.appendChild(u);
    var a = G.el('<div class="cmsg assistant"><p class="muted">자비스가 기록을 보고 생각하고 있어요…</p></div>'); log.appendChild(a); a.scrollIntoView({ block: 'end' });
    G.$('#cIn').value = ''; var sb = G.$('#cSend'); sb.textContent = '멈춤';
    coachCtl = new AbortController();
    var hist2 = hs.slice(-20); if (hist2[0].role !== 'user') hist2 = hist2.slice(1);
    G.coach.ask(hist2, function (t) { a.innerHTML = md(t); }, coachCtl.signal, G.store.get('coachData', true)).then(function (r) {
      coachCtl = null; if (G.$('#cSend')) G.$('#cSend').textContent = '보내기';
      if (r.error) { a.innerHTML = '<p>⚠️ ' + G.esc(r.error) + '</p>'; var h3 = G.store.get('coachChat', []); h3.pop(); G.store.set('coachChat', h3); return; }
      a.innerHTML = md(r.text);
      var h2 = G.store.get('coachChat', []); h2.push({ role: 'assistant', content: r.text, t: Date.now() }); G.store.set('coachChat', h2.slice(-40));
    });
  }
}

/* ===== 치료사 리포트 ===== */
var repDays = 14, repNick = false, repAI = '';
function tReport(body) {
  var S = stats(repDays), nick = (G.profile.nick || '').trim(), age = G.ageMonths();
  var since = new Date(S.since);
  var notes = G.store.get('diary', []).filter(function (n) { return n.t >= S.since; }).sort(function (a, b) { return a.t - b.t; });
  var mask = function (s) { return !repNick && nick ? String(s).split(nick).join('아이') : s; };
  var tot = S.L.reduce(function (s, l) { return s + Math.min(l.ms || 0, 9e5); }, 0);
  var moodCount = {}; S.moods.forEach(function (m) { moodCount[m.emo] = (moodCount[m.emo] || 0) + 1; });
  var h = '<div class="ptools">' + [14, 28, 90].map(function (p) { return '<button class="chip ' + (p === repDays ? 'on' : '') + '" data-rd="' + p + '">' + (p === 90 ? '3개월' : p / 7 + '주') + '</button>'; }).join('') +
    '<label class="chip"><input type="checkbox" id="rNick" ' + (repNick ? 'checked' : '') + '> 별명 넣기</label>' +
    '<button class="btn sm" id="rPrint">🖨️ 인쇄·PDF</button><button class="btn sm soft" id="rShare">📤 공유</button><button class="btn sm soft" id="rAI">🤖 AI 요약</button></div>';
  h += card('<div class="rep-h"><h3>🌱 함께 자라요 — 집 놀이 리포트</h3><span class="muted">' + G.today(since) + ' ~ ' + G.today() + '</span></div>' +
    '<p>' + (repNick && nick ? '<b>' + G.esc(nick) + '</b> · ' : '') + (age ? '약 ' + age + '개월' : '') + (G.profile.therapies && G.profile.therapies.length ? ' · 다니는 치료: ' + G.esc(G.profile.therapies.join(', ')) : '') + '</p>' +
    (G.profile.goals ? '<p class="muted">치료 목표·선생님 말씀: ' + G.esc(mask(G.profile.goals)) + '</p>' : '') +
    '<div class="pstats" style="margin-top:8px"><div><b>' + Object.keys(S.byDay).length + '일</b><small>놀이한 날</small></div><div><b>' + S.L.length + '</b><small>놀이 횟수</small></div><div><b>' + mins(tot) + '</b><small>모두 합한 시간</small></div></div>' +
    '<p class="muted" style="margin-top:8px">※ 집에서 부모와 함께 한 놀이 앱의 자동 기록과 부모 메모입니다. 검사 결과가 아니며 경향을 보는 참고 자료입니다.</p>');
  if (repAI) h += card('<h3>🤖 요약 (AI 작성 · 부모 확인)</h3>' + md(repAI));
  h += card('<h3>영역별 시간</h3>' + areaBars(S));
  h += card('<h3>🧠 생각 힘(실행기능) 균형</h3>' + efBars(S));
  h += card('<h3>놀이별 결과와 목표</h3>' + actTable(S, true));
  h += card('<h3>💗 기분 체크</h3>' + (S.moods.length ? '<div class="moods">' + Object.keys(moodCount).map(function (k) { var e = emo(k); return '<div><b>' + e.e + '</b>' + e.name + ' ' + moodCount[k] + '</div>'; }).join('') + '</div>' : '<p class="muted">기록 없음</p>'));
  h += card('<h3>🗣️ 음성 인식이 들은 아이 말</h3>' + saidChips(60, false));
  h += card('<h3>📝 부모 메모</h3>' + (notes.length ? notes.map(function (n) { return '<div class="note"><div class="nt"><span>' + fmtD(n.t) + ' · ' + G.esc(n.tag || '') + '</span></div><p>' + G.esc(mask(n.text)) + '</p></div>'; }).join('') : '<p class="muted">이 기간 메모 없음</p>'));
  body.innerHTML = h;
  G.$$('[data-rd]', body).forEach(function (b) { b.onclick = function () { repDays = +b.dataset.rd; repAI = ''; render(); }; });
  G.$('#rNick', body).onchange = function () { repNick = this.checked; render(); };
  G.$('#rPrint', body).onclick = function () { window.print(); };
  G.$('#rShare', body).onclick = function () {
    var txt = '함께 자라요 집 놀이 리포트 (' + G.today(since) + '~' + G.today() + ')\n놀이한 날 ' + Object.keys(S.byDay).length + '일, ' + S.L.length + '번, ' + mins(tot) + '\n' +
      G.AREA_ORDER.filter(function (k) { return S.byArea[k]; }).map(function (k) { return '- ' + G.AREAS[k].name + ': ' + mins(S.byArea[k].ms) + ' (' + S.byArea[k].n + '번)'; }).join('\n') +
      (repAI ? '\n\n' + repAI : '') + (notes.length ? '\n\n부모 메모\n' + notes.map(function (n) { return '- ' + fmtD(n.t) + ' ' + mask(n.text); }).join('\n') : '');
    if (navigator.share) navigator.share({ title: '집 놀이 리포트', text: txt }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { G.toast('복사했어요. 문자·카톡에 붙여 넣으세요'); });
  };
  G.$('#rAI', body).onclick = function () {
    if (!G.ai.key()) { G.toast('설정에서 API 키를 먼저 넣어 주세요'); return; }
    var btn = this; btn.disabled = true; btn.textContent = '🤖 쓰는 중…';
    G.coach.ask([{ role: 'user', content: '위 기록으로 담당 치료사(언어·작업·미술치료) 선생님께 드릴 ' + (repDays === 90 ? '3개월' : repDays / 7 + '주') + ' 집 놀이 리포트 요약을 써 주세요. 1) 한눈에 요약 2) 영역별로 집에서 본 모습(잘 되는 것·어려운 것) 3) 실행기능(주의·기억·참기·바꾸기·계획·조절) 관찰 4) 선생님께 여쭙고 싶은 질문 3가지 5) 다음 기간 집에서 해 볼 목표 2~3개. 과장하지 말고 숫자는 경향으로만, 진단처럼 쓰지 마세요. 15줄 안팎.' }],
      null, null, repDays).then(function (r) {
      btn.disabled = false; btn.textContent = '🤖 AI 요약';
      if (r.error) { G.toast(r.error); return; }
      repAI = r.text; render();
    });
  };
}

/* ===== 설정 ===== */
var THERAPIES = ['언어치료', '작업치료', '미술치료', '감각통합', '놀이치료', '인지치료', '물리치료', '음악치료', 'ABA'];
function tSet(body) {
  var P = G.profile, St = G.settings;
  var h = card('<h3>👦 아이 정보</h3><p class="muted">이 기기에만 저장돼요. 별명은 자비스가 부를 때만 써요(AI 로 보내지 않아요).</p>' +
    '<h4>별명</h4><input class="inp" id="sNick" maxlength="12" placeholder="예) 민준" value="' + G.esc(P.nick || '') + '">' +
    '<h4>태어난 달</h4><input class="inp" id="sBirth" type="month" value="' + G.esc(P.birth || '') + '">' +
    '<h4>다니는 치료</h4><div class="wchips" id="sTher">' + THERAPIES.map(function (t) { return '<button class="chip ' + ((P.therapies || []).indexOf(t) >= 0 ? 'on' : '') + '" data-th="' + t + '">' + t + '</button>'; }).join('') + '</div>' +
    '<h4>집중할 영역 (오늘의 놀이에 들어가요)</h4><div class="wchips" id="sFocus">' + G.AREA_ORDER.map(function (k) { var a = G.AREAS[k]; return '<button class="chip ' + ((P.focus || []).indexOf(k) >= 0 ? 'on' : '') + '" style="--c:' + a.color + '" data-fo="' + k + '">' + a.icon + ' ' + a.name + '</button>'; }).join('') + '</div>' +
    '<h4>좋아하는 것</h4><input class="inp" id="sLikes" placeholder="예) 자동차, 공룡, 기차, 뽀로로" value="' + G.esc(P.likes || '') + '"><p class="muted">자비스가 대화할 때 아이 관심사를 따라가요.</p>' +
    '<h4>치료 목표 · 선생님 말씀</h4><textarea class="inp" id="sGoals" placeholder="예) 두 낱말 붙여 말하기, 가위질 준비, 차례 기다리기">' + G.esc(P.goals || '') + '</textarea>' +
    '<button class="btn" id="sSaveP" style="margin-top:10px;width:100%">아이 정보 저장</button>');
  h += card('<h3>📷 우리 집 낱말 (사진 카드)</h3><p class="muted">엄마·아빠·할머니, 우리 강아지, 아이 컵처럼 <b>아이가 매일 보는 진짜 사진</b>은 그림보다 훨씬 잘 배워요. 낱말 카드와 말판 「우리 집」에 나와요.</p>' +
    '<div class="row" style="margin:8px 0"><input class="inp" id="picW" placeholder="낱말 (예: 우리 엄마)" style="flex:1"><label class="btn soft" style="cursor:pointer">📷 사진<input type="file" accept="image/*" id="picF" hidden></label></div><div class="pics" id="picList"></div>');
  h += card('<h3>🗣️ 자비스 목소리</h3>' +
    '<label class="sw"><span>목소리</span><select class="inp" id="sVoice" style="width:55%">' + (G.voice.list().length ? G.voice.list().map(function (v) { return '<option ' + (v.name === St.voice ? 'selected' : '') + '>' + G.esc(v.name) + '</option>'; }).join('') : '<option>기기 기본</option>') + '</select></label>' +
    '<label class="sw"><span>말 빠르기 <small class="muted" id="vRateV">' + St.rate + '</small></span><input type="range" id="sRate" min="0.6" max="1.2" step="0.02" value="' + St.rate + '"></label>' +
    '<label class="sw"><span>목소리 높이 <small class="muted" id="vPitchV">' + St.pitch + '</small></span><input type="range" id="sPitch" min="0.8" max="1.6" step="0.05" value="' + St.pitch + '"></label>' +
    '<button class="btn soft" id="sTest" style="margin-top:8px">🔊 들어 보기</button><p class="muted" style="margin-top:6px">발달이 늦은 아이에게는 조금 느린 말(0.8~0.9)이 알아듣기 좋아요.</p>');
  h += card('<h3>🎛️ 소리 · 화면</h3>' +
    sw('sound', '효과음') + sw('vibrate', '진동') + sw('praiseVoice', '칭찬을 소리로') +
    sw('calm', '🌿 감각 예민 모드 (소리 작게 · 반짝임 끄기)') +
    '<h4>오늘의 놀이 시간</h4><div class="wchips">' + [10, 15, 20, 30].map(function (m) { return '<button class="chip ' + (St.sessionMin === m ? 'on' : '') + '" data-sm="' + m + '">' + m + '분</button>'; }).join('') + '</div>' +
    '<p class="muted" style="margin-top:6px">WHO·미국소아과학회는 2~5세 화면 시간을 하루 1시간 이하, 어른과 함께하기를 권해요.</p>');
  h += card('<h3>📶 놀이 단계 · 보이기</h3><p class="muted">「자동」이면 자비스가 최근 세 번 결과로 단계를 맞춰요. 치료사 선생님이 정한 단계가 있으면 고정하세요.</p><div id="lvList"></div>');
  h += card('<h3>🤖 자비스 AI (Claude)</h3><p class="muted">키를 넣으면 「자비스랑 이야기」가 아이 말에 맞춰 대답하고, 코치·리포트 요약을 쓸 수 있어요. 키가 없어도 모든 놀이는 그대로 돼요. 보내는 것: 아이가 한 말(음성 인식 글)·나이·좋아하는 것·기록 요약. 이름은 보내지 않아요.</p>' +
    '<div class="row" style="margin-top:8px"><input class="inp" id="sKey" type="password" placeholder="sk-ant-..." style="flex:1" value="' + G.esc(G.store.get('apiKey', '')) + '"><button class="btn" id="sKeySave">저장</button></div>' +
    (G.store.get('apiKey', '') ? '' : (G.ai.key() ? '<p class="muted" style="margin-top:6px">✅ 교회 관리자 앱에 넣은 키를 함께 쓰고 있어요.</p>' : '')) +
    sw2('aiOn', 'AI 쓰기', G.store.get('aiOn', true)) +
    '<button class="btn soft" id="sKeyTest" style="margin-top:8px">연결 확인</button> <span class="muted" id="sKeyState"></span>');
  h += card('<h3>📲 휴대폰·태블릿에 앱으로 설치</h3><p>안드로이드(크롬·삼성 인터넷): 아래 단추 또는 메뉴 ⋮ → <b>홈 화면에 추가</b>. 아이폰·아이패드(사파리): 공유 ⬆️ → <b>홈 화면에 추가</b>. 설치하면 인터넷이 없어도 놀이가 열려요.</p><button class="btn" id="sInstall" style="margin-top:8px" hidden>📲 지금 설치</button>');
  h += card('<h3>💾 데이터</h3><p class="muted">기기를 바꾸거나 초기화하기 전에 백업 파일을 받아 두세요. 백업에는 아이 기록·사진·그림이 들어 있으니 공개된 곳에 올리지 마세요.</p>' +
    '<div class="row" style="margin-top:8px"><button class="btn soft" id="dExp">⬇️ 백업 받기</button><label class="btn soft" style="cursor:pointer">⬆️ 백업 불러오기<input type="file" accept="application/json,.json" id="dImp" hidden></label><button class="btn soft" id="dDel" style="color:#e5484d">🗑 모두 지우기</button></div>');
  body.innerHTML = h;

  /* 아이 정보 */
  G.$$('[data-th]', body).forEach(function (b) { b.onclick = function () { b.classList.toggle('on'); }; });
  G.$$('[data-fo]', body).forEach(function (b) { b.onclick = function () { b.classList.toggle('on'); }; });
  G.$('#sSaveP', body).onclick = function () {
    P.nick = G.$('#sNick', body).value.trim(); P.birth = G.$('#sBirth', body).value;
    P.therapies = G.$$('[data-th].on', body).map(function (b) { return b.dataset.th; });
    P.focus = G.$$('[data-fo].on', body).map(function (b) { return b.dataset.fo; });
    if (!P.focus.length) P.focus = G.AREA_ORDER.slice();
    P.likes = G.$('#sLikes', body).value.trim(); P.goals = G.$('#sGoals', body).value.trim();
    G.saveProfile(); G.toast('저장했어요'); if (G.renderHome) G.renderHome();
  };
  /* 사진 낱말 */
  function loadPics() {
    G.db.all('pics').then(function (ps) {
      var box = G.$('#picList'); if (!box) return;
      box.innerHTML = ps.length ? ps.map(function (p) { return '<div><img src="' + p.img + '" alt=""><span>' + G.esc(p.w) + '</span><button data-delp="' + p.id + '" aria-label="지우기">×</button></div>'; }).join('') : '<p class="muted">아직 사진 카드가 없어요.</p>';
      G.$$('[data-delp]', box).forEach(function (b) { b.onclick = function () { if (confirm('이 사진 카드를 지울까요?')) G.db.del('pics', b.dataset.delp).then(loadPics); }; });
    });
  }
  loadPics();
  G.$('#picF', body).onchange = function () {
    var f = this.files && this.files[0], w = G.$('#picW', body).value.trim(); this.value = '';
    if (!f) return; if (!w) { G.toast('낱말을 먼저 적어 주세요'); return; }
    shrink(f, 360).then(function (img) { return G.db.put('pics', { id: G.uid(), w: w, img: img, t: Date.now() }); })
      .then(function () { G.$('#picW', body).value = ''; G.toast('사진 카드를 만들었어요'); loadPics(); })
      .catch(function () { G.toast('사진을 넣지 못했어요'); });
  };
  /* 목소리 */
  G.$('#sVoice', body).onchange = function () { St.voice = this.value; G.saveSettings(); G.voice.load(); };
  G.$('#sRate', body).oninput = function () { St.rate = +this.value; G.$('#vRateV').textContent = this.value; G.saveSettings(); };
  G.$('#sPitch', body).oninput = function () { St.pitch = +this.value; G.$('#vPitchV').textContent = this.value; G.saveSettings(); };
  G.$('#sTest', body).onclick = function () { G.say((G.profile.nick ? G.callName() + ', ' : '') + '안녕! 나는 자비스야. 오늘도 같이 놀자!'); };
  G.$$('[data-set]', body).forEach(function (c) { c.onchange = function () { St[c.dataset.set] = c.checked; G.saveSettings(); }; });
  G.$$('[data-sm]', body).forEach(function (b) { b.onclick = function () { St.sessionMin = +b.dataset.sm; G.saveSettings(); render(); }; });
  /* 단계 */
  var lv = G.$('#lvList', body), lh = '';
  G.AREA_ORDER.forEach(function (k) {
    var list = Object.keys(G.acts).map(function (id) { return G.acts[id]; }).filter(function (d) { return d.area === k && !d.tool; });
    if (!list.length) return;
    lh += '<h4>' + G.AREAS[k].icon + ' ' + G.AREAS[k].name + '</h4>' + list.map(function (d) {
      var cur = (P.level || {})[d.id] || 0, hidden = (P.hide || {})[d.id];
      return '<div class="lvrow"><span>' + d.icon + ' ' + G.esc(d.title) + ' <small class="muted">지금 ' + G.levelFor(d.id, d.levels) + '단계</small></span>' +
        (d.levels > 1 ? '<select data-lv="' + d.id + '"><option value="0">자동</option>' + G.range(d.levels).map(function (i) { return '<option value="' + (i + 1) + '" ' + (cur === i + 1 ? 'selected' : '') + '>' + (i + 1) + '단계</option>'; }).join('') + '</select>' : '<span></span>') +
        '<label class="muted"><input type="checkbox" data-hide="' + d.id + '" ' + (hidden ? '' : 'checked') + '> 보이기</label></div>';
    }).join('');
  });
  lv.innerHTML = lh;
  G.$$('[data-lv]', lv).forEach(function (s) { s.onchange = function () { P.level = P.level || {}; if (+s.value) P.level[s.dataset.lv] = +s.value; else delete P.level[s.dataset.lv]; G.saveProfile(); }; });
  G.$$('[data-hide]', lv).forEach(function (c) { c.onchange = function () { P.hide = P.hide || {}; if (c.checked) delete P.hide[c.dataset.hide]; else P.hide[c.dataset.hide] = 1; G.saveProfile(); }; });
  /* AI */
  G.$('#sKeySave', body).onclick = function () { G.store.set('apiKey', G.$('#sKey', body).value.trim()); G.toast('저장했어요'); };
  G.$$('[data-set2]', body).forEach(function (c) { c.onchange = function () { G.store.set(c.dataset.set2, c.checked); }; });
  G.$('#sKeyTest', body).onclick = function () {
    var st = G.$('#sKeyState'); st.textContent = '확인 중…';
    G.ai.call({ system: '짧게 대답하세요.', messages: [{ role: 'user', content: '"연결됐어요" 라고만 말해 주세요.' }], maxTokens: 400, effort: 'low' }).then(function (r) { st.textContent = r.error ? '❌ ' + r.error : '✅ ' + r.text; });
  };
  /* 설치 */
  var ib = G.$('#sInstall', body);
  if (G.installPrompt) { ib.hidden = false; ib.onclick = function () { G.installPrompt.prompt(); G.installPrompt = null; ib.hidden = true; }; }
  /* 데이터 */
  G.$('#dExp', body).onclick = function () {
    var ls = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('grow_') === 0) ls[k] = localStorage.getItem(k); }
    Promise.all([G.db.all('pics'), G.db.all('art')]).then(function (r) {
      download(new Blob([JSON.stringify({ app: 'grow', v: 1, at: new Date().toISOString(), ls: ls, pics: r[0], art: r[1] })], { type: 'application/json' }), '함께자라요-백업-' + G.today() + '.json');
    });
  };
  G.$('#dImp', body).onchange = function () {
    var f = this.files && this.files[0]; this.value = ''; if (!f) return;
    f.text().then(function (t) {
      var d = JSON.parse(t); if (d.app !== 'grow') throw new Error('x');
      if (!confirm('백업을 불러오면 지금 기기의 기록이 백업 내용으로 바뀝니다. 계속할까요?')) return;
      Object.keys(d.ls || {}).forEach(function (k) { if (k.indexOf('grow_') === 0) localStorage.setItem(k, d.ls[k]); });
      return Promise.all((d.pics || []).map(function (p) { return G.db.put('pics', p); }).concat((d.art || []).map(function (a) { return G.db.put('art', a); }))).then(function () { G.toast('불러왔어요. 다시 엽니다'); setTimeout(function () { location.reload(); }, 900); });
    }).catch(function () { G.toast('함께 자라요 백업 파일이 아니에요'); });
  };
  G.$('#dDel', body).onclick = function () {
    if (!confirm('아이 정보·기록·일지·사진·그림을 모두 지울까요? 되돌릴 수 없어요.')) return;
    if (!confirm('정말 모두 지울까요? 먼저 백업을 받으셨나요?')) return;
    Object.keys(localStorage).filter(function (k) { return k.indexOf('grow_') === 0; }).forEach(function (k) { localStorage.removeItem(k); });
    try { indexedDB.deleteDatabase('grow'); } catch (e) {}
    location.reload();
  };
}
function sw(key, label) { return '<label class="sw"><span>' + label + '</span><input type="checkbox" data-set="' + key + '" ' + (G.settings[key] ? 'checked' : '') + '></label>'; }
function sw2(key, label, val) { return '<label class="sw"><span>' + label + '</span><input type="checkbox" data-set2="' + key + '" ' + (val ? 'checked' : '') + '></label>'; }

function download(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
function shrink(file, max) {
  return new Promise(function (ok, no) {
    var img = new Image(), url = URL.createObjectURL(file);
    img.onload = function () {
      var s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = no; img.src = url;
  });
}

/* 안드로이드 설치 신호를 잡아 둔다 */
window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); G.installPrompt = e; });
})();

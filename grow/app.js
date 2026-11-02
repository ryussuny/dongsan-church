/* ===========================================================
   함께 자라요 — 아이 화면 (홈·영역·스티커북·이동)
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;

/* 자비스 얼굴 자리 채우기 */
G.$('#hmJv').innerHTML = G.jarvisSVG();
G.$('#stJv').innerHTML = G.jarvisSVG();

var DAYS = ['일', '월', '화', '수', '목', '금', '토'];
function hello() {
  var h = new Date().getHours(), n = (G.profile.nick || '').trim();
  var who = n ? G.callName() : '';
  if (h < 11) return (who ? who + ', ' : '') + '좋은 아침! 🌞';
  if (h < 17) return (who ? who + ', ' : '') + '안녕! 같이 놀자 🎈';
  if (h < 20) return (who ? who + ', ' : '') + '반가워! 오늘 어땠어? 🌇';
  return (who ? who + ', ' : '') + '조용히 놀아 볼까? 🌙';
}

G.renderHome = function () {
  var d = new Date();
  G.$('#hmDate').textContent = (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + DAYS[d.getDay()] + '요일';
  G.$('#hmHello').textContent = hello();
  var last = G.store.get('lastSession', {}), done = last.d === G.today();
  var tb = G.$('#todayBtn');
  tb.classList.toggle('done', done);
  tb.querySelector('b').textContent = done ? '오늘의 놀이 끝! 🎉' : '오늘의 놀이';
  G.$('#todaySub').textContent = done ? '또 하고 싶으면 눌러요 · 아래에서 골라도 돼요' : G.settings.sessionMin + '분 · 자비스가 골라 줘요';
  /* 영역 타일 */
  var box = G.$('#hmAreas'); box.innerHTML = '';
  G.AREA_ORDER.forEach(function (k) {
    var a = G.AREAS[k], n = G.actsIn(k).length;
    if (!n) return;
    var b = G.el('<button class="area-tile" style="--c:' + a.color + '"><span class="ai">' + a.icon + '</span><b>' + a.name + '</b><small>' + a.desc + '</small></button>');
    b.onclick = function () { G.sfx.play('tap'); openArea(k); };
    box.appendChild(b);
  });
  /* 자라는 나무 — 스티커가 모일수록 자란다 */
  var tr = G.tree(); G.$('#trE').innerHTML = tr.e + tr.fruit; G.$('#trName').textContent = '내 나무: ' + tr.name; G.$('#trSub').textContent = tr.sub;
  /* 이번 주 도장 */
  var sd = G.store.get('sessionDays', []), logs = G.logs(), st = G.$('#hmStreak'); st.innerHTML = '';
  for (var i = 6; i >= 0; i--) {
    var dd = new Date(); dd.setDate(dd.getDate() - i);
    var key = G.today(dd), on = sd.indexOf(key) >= 0 || logs.some(function (l) { return l.d === key; });
    st.appendChild(G.el('<i class="' + (on ? 'on' : '') + '" title="' + key + '">' + (on ? '⭐' : DAYS[dd.getDay()]) + '</i>'));
  }
};

G.tree = function () {
  var c = G.stickers().count;
  var st = c >= 21 ? ['🌳', '열매 나무'] : c >= 13 ? ['🌳', '큰 나무'] : c >= 7 ? ['🪴', '작은 나무'] : c >= 3 ? ['🌿', '어린 잎'] : c >= 1 ? ['🌱', '새싹'] : ['🌰', '씨앗'];
  var fruits = c >= 21 ? Math.min(6, Math.floor((c - 21) / 3) + 1) : 0;
  var pos = [[-6, 2], [30, 0], [-4, 26], [32, 24], [12, -6], [14, 30]];
  var f = ''; for (var i = 0; i < fruits; i++) f += '<i style="left:' + pos[i][0] + 'px;top:' + pos[i][1] + 'px">🍎</i>';
  var next = c >= 21 ? 3 - ((c - 21) % 3) : c >= 13 ? 21 - c : c >= 7 ? 13 - c : c >= 3 ? 7 - c : c >= 1 ? 3 - c : 1;
  return { e: st[0], name: st[1], fruit: f, count: c, sub: '놀이 ' + next + '번 더 하면 ' + (c >= 21 ? '열매가 하나 더!' : '나무가 자라요!') };
};

function openArea(k) {
  var a = G.AREAS[k];
  G.$('#areaTitle').innerHTML = a.icon + ' ' + a.name + '<small>' + a.therapy + ' · ' + a.desc + '</small>';
  var list = G.$('#areaList'); list.innerHTML = '';
  G.actsIn(k).forEach(function (def) {
    var miss = def.needs.filter(function (n) { return !G.has[n]; });
    var need = def.needs.map(function (n) { return { mic: '🎤', stt: '🎤', cam: '📷', motion: '📐' }[n] || ''; }).join('');
    var c = G.el('<button class="act-card" style="--c:' + a.color + '"><div class="ae">' + def.icon + '</div><b>' + G.esc(def.title) + '</b><small>' + G.esc(def.desc || '') + '</small>' +
      (need ? '<span class="need">' + need + (miss.length ? ' 이 기기는 일부만' : '') + '</span>' : '') + '</button>');
    c.onclick = function () { G.sfx.play('tap'); G.start(def.id); };
    list.appendChild(c);
  });
  G.showScreen('area');
  G.say(a.name + ' 놀이를 골라 봐!');
}
G.openArea = openArea;

function openBook() {
  var s = G.stickers(), all = D.STICKERS;
  G.$('#bookSum').textContent = '모은 스티커 ' + s.have.length + ' / ' + all.length + '  ·  받은 별 ' + s.stars + '개';
  G.$('#bookGrid').innerHTML = all.map(function (x) { return '<i class="' + (s.have.indexOf(x) >= 0 ? '' : 'no') + '">' + x + '</i>'; }).join('');
  G.showScreen('book');
  G.say(s.have.length ? '와, 스티커를 ' + s.have.length + '개나 모았어!' : '놀이를 하면 스티커를 받을 수 있어!');
}

/* ---------- 단추 연결 ---------- */
G.$('#todayBtn').onclick = function () { G.sfx.play('tap'); G.startSession(); };
G.$$('.hm-quick [data-go]').forEach(function (b) {
  b.onclick = function () {
    G.sfx.play('tap');
    var go = b.dataset.go;
    if (go === 'book') return openBook();
    if (G.acts[go]) G.start(go); else G.toast('준비 중이에요');
  };
});
G.$$('[data-home]').forEach(function (b) { b.onclick = function () { G.sfx.play('tap'); G.home(); }; });
G.$('#stX').onclick = function () {
  G.sfx.play('tap');
  if (G.session) G.session = null;
  if (/#\/play\//.test(location.hash)) history.back(); else G.home();
};
G.$('#stSay').onclick = function () { if (G.cur && G.cur.instr) G.cur.say(G.cur.instr); };
G.$('#stJv').onclick = function () { if (G.cur && G.cur.instr) G.cur.say(G.cur.instr); };
G.$('#hmTree').onclick = function () {
  var t = G.tree(); G.sfx.play('sparkle');
  G.say(t.count ? '놀이를 할 때마다 나무가 쑥쑥 자라! 지금은 ' + t.name + '야. ' + t.sub : '놀이를 하면 씨앗에서 싹이 나!');
};
/* 💡 부모 도움말 — 이 놀이로 기르는 힘, 함께 노는 법, 화면 밖 놀이 */
G.$('#stTip').onclick = function () {
  var d = G.cur && G.cur.def; if (!d) return;
  var ef = (d.ef || []).map(function (k) { var e = G.EF[k]; return e ? '<span>' + e.e + ' ' + e.name + '</span>' : ''; }).join('');
  var ov = G.el('<div class="modal"><div class="md-card"><h3>' + d.icon + ' ' + G.esc(d.title) + '</h3><p>' + G.esc((G.AREAS[d.area] || {}).therapy || '') + ' · 지금 ' + (G.cur.level || 1) + '단계</p>' +
    (ef ? '<div class="tip-ef">' + ef + '</div>' : '') +
    (d.goal ? '<div class="tip-sec"><b>🎯 기르는 힘</b>' + G.esc(d.goal) + '</div>' : '') +
    (d.how ? '<div class="tip-sec"><b>👨‍👩‍👦 함께 하는 법</b>' + G.esc(d.how) + '</div>' : '') +
    (d.offline ? '<div class="tip-sec"><b>🏠 화면 밖에서도</b>' + G.esc(d.offline) + '</div>' : '') +
    (d.basis ? '<div class="tip-sec"><b>📚 근거</b>' + G.esc(d.basis) + '</div>' : '') +
    '<button class="btn soft md-x" style="margin-top:14px">닫기</button></div></div>');
  document.body.appendChild(ov);
  ov.querySelector('.md-x').onclick = function () { ov.remove(); };
  ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
};
G.$('#hmJv').onclick = function () { G.say(G.$('#hmHello').textContent + ' 놀고 싶은 그림을 눌러 봐.'); };

/* 부모 화면 — 1.2초 길게 누른 뒤 어른 확인 */
(function () {
  var b = G.$('#parentBtn'), h = null;
  function start(e) { e.preventDefault(); b.classList.add('hold'); h = setTimeout(function () { b.classList.remove('hold'); G.buzz(30); G.grownUp().then(function (ok) { if (ok) G.openParent(); }); }, 1200); }
  function stop() { clearTimeout(h); b.classList.remove('hold'); }
  b.addEventListener('pointerdown', start); b.addEventListener('pointerup', stop); b.addEventListener('pointerleave', stop); b.addEventListener('pointercancel', stop);
  b.addEventListener('click', function () { if (!b.classList.contains('hold')) G.toast('부모 화면은 길게 눌러요 👆'); });
  b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
})();

G.openParent = function (tab) { if (G.renderParent) { G.showScreen('parent'); G.renderParent(tab); } };

/* 첫 화면 */
G.renderHome();
var m = /#\/play\/([\w-]+)/.exec(location.hash);
if (m && G.acts[m[1]]) { history.replaceState(null, '', location.pathname + location.search); G.start(m[1]); }
else if (/#parent/.test(location.hash)) { history.replaceState(null, '', location.pathname + location.search); }
/* 처음 연 날 — 아이 정보 넣기 안내 */
if (!G.store.get('welcomed')) {
  G.store.set('welcomed', 1);
  setTimeout(function () { G.toast('👨‍👩‍👦 를 길게 눌러 아이 별명·나이·집중할 영역을 먼저 넣어 주세요', 5200); }, 800);
}

/* 앱처럼 설치·오프라인 */
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});
})();

/* ===========================================================
   함께 자라요 — 아이 화면 (홈·영역·스티커북·이동)
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;

/* 자비스 얼굴 자리 채우기 */
G.$('#hmJv').innerHTML = G.jarvisSVG('full');
G.$('#stJv').innerHTML = G.jarvisSVG();
/* 만화 이모지 대신 메카 그림 — 빠른 단추·격납고 제목 */
if (window.GA && GA.robot) {
  var qj = G.$('.hm-quick [data-go="chat"] .qe'), qb = G.$('.hm-quick [data-go="book"] .qe');
  if (qj) qj.innerHTML = G.jarvisSVG();
  if (qb) qb.innerHTML = GA.robot(0, 6, { size: 44 });
  var bt = G.$('#bookTitle'); if (bt) bt.innerHTML = '<span class="bt-ic">' + GA.robot(0, 6, { size: 34 }) + '</span>로봇 격납고';
  G.css('qart', '.hm-quick .qe svg{width:clamp(30px,8vw,44px);height:clamp(30px,8vw,44px);display:block;margin:0 auto}#bookTitle{display:flex;align-items:center;gap:6px}#bookTitle .bt-ic svg{width:34px;height:34px;display:block}');
}

var DAYS = ['일', '월', '화', '수', '목', '금', '토'];
function hello() {
  var h = new Date().getHours(), n = (G.profile.nick || '').trim();
  var who = n ? G.callName() : '';
  if (G.older()) {
    if (h < 11) return (who ? who + ', ' : '') + '좋은 아침! 오늘 미션 준비됐지? 🚀';
    if (h < 17) return (who ? who + ', ' : '') + '왔구나! 오늘도 같이 가 보자 ⚡';
    if (h < 20) return (who ? who + ', ' : '') + '오늘 하루 어땠어? 미션 하나 할까? 🌇';
    return (who ? who + ', ' : '') + '조용히 미션 하나만 해 볼까? 🌙';
  }
  if (h < 11) return (who ? who + ', ' : '') + '좋은 아침! 🌞';
  if (h < 17) return (who ? who + ', ' : '') + '안녕! 같이 놀자 🎈';
  if (h < 20) return (who ? who + ', ' : '') + '반가워! 오늘 어땠어? 🌇';
  return (who ? who + ', ' : '') + '조용히 놀아 볼까? 🌙';
}

G.renderHome = function () {
  var d = new Date();
  G.$('#hmDate').textContent = (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + DAYS[d.getDay()] + '요일';
  G.$('#hmHello').textContent = hello();
  var last = G.store.get('lastSession', {}), done = last.d === G.today(), saved = G.savedSession();
  var tb = G.$('#todayBtn');
  tb.classList.toggle('done', done && !saved);
  var word = G.older() ? '미션' : '놀이';
  tb.querySelector('b').textContent = saved ? '이어서 하기 ▶' : done ? '오늘의 ' + word + ' 끝! 🎉' : '오늘의 ' + word;
  G.$('#todaySub').textContent = saved ? '아까 하던 놀이를 이어서 해요' : done ? '내일 또 만나요 · 이제 몸으로 놀아요' : G.settings.sessionMin + '분 · 자비스가 골라 줘요';
  /* 영역 타일 */
  var box = G.$('#hmAreas'); box.innerHTML = '';
  G.AREA_ORDER.forEach(function (k) {
    var a = G.AREAS[k], n = G.actsIn(k).length;
    if (!n) return;
    var ic = window.GA && GA.areaIcon ? GA.areaIcon(k, { size: 68 }) : a.icon;
    var b = G.el('<button class="area-tile" style="--c:' + a.color + '"><span class="ai">' + ic + '</span><b>' + a.name + '</b><small>' + a.desc + '</small></button>');
    b.onclick = function () { G.sfx.play('tap'); openArea(k); };
    box.appendChild(b);
  });
  /* 자라는 나무 — 스티커가 모일수록 자란다 */
  var rp = G.robotNow();
  if (rp) {
    var ni = window.GR && GR.nextInfo ? GR.nextInfo() : null;
    G.$('#trE').innerHTML = rp.svg; G.$('#trName').textContent = rp.robot.name + (ni && ni.locked ? ' — 열쇠 필요' : ' 조립 중');
    G.$('#trSub').textContent = ni && ni.locked ? '🔒 ' + ni.locked.text + ' (' + ni.locked.have + '/' + ni.locked.need + ')' :
      '부품 ' + rp.owned + ' / 6 · ⚡' + (ni ? ni.have + '/' + ni.cost : '') + ' · 다음: ' + (rp.robot.parts ? rp.robot.parts[rp.owned] : '부품');
  }
  else { var tr = G.tree(); G.$('#trE').innerHTML = tr.e + tr.fruit; G.$('#trName').textContent = '내 나무: ' + tr.name; G.$('#trSub').textContent = tr.sub; }
  /* 🗺️ 1년 여정 카드 */
  if (G.journey) G.journey.renderHome();
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
  if (G.openHangar && window.GR) { G.openHangar(); return; }   /* 로봇 군단 격납고 (robots.js) */
  var s2 = G.stickers(), c = s2.count;
  if (!(window.GA && GA.ROBOTS)) {   /* 그림 파일이 없으면 예전 스티커북 */
    G.$('#bookGrid').hidden = false; G.$('#hangar').hidden = true;
    G.$('#bookSum').textContent = '모은 스티커 ' + s2.have.length + ' / ' + D.STICKERS.length;
    G.$('#bookGrid').innerHTML = D.STICKERS.map(function (x) { return '<i class="' + (s2.have.indexOf(x) >= 0 ? '' : 'no') + '">' + x + '</i>'; }).join('');
    G.showScreen('book'); return;
  }
  var n = GA.ROBOTS.length, done = Math.floor(c / 6), box = G.$('#hangar');
  G.$('#bookSum').textContent = '완성한 로봇 ' + Math.min(done, n) + ' / ' + n + '  ·  모은 부품 ' + c + '개' + (done >= n ? '  ·  🏆 모든 로봇 완성! 이제 황금 로봇!' : '');
  box.innerHTML = '';
  GA.ROBOTS.forEach(function (r, i) {
    var owned = Math.max(0, Math.min(6, c - i * 6)), gold = c >= (n + i) * 6 + 6;
    var st = owned === 6 ? 'done' : owned > 0 ? 'now' : 'lock';
    var card = G.el('<button class="hg-card ' + st + '" style="--c:' + r.color + '"><div class="hg-art">' + GA.robot(i, owned, { cls: gold ? 'gold' : '' }) + '</div><b>' + G.esc((gold ? '황금 ' : '') + r.name) + '</b><small>' +
      (owned === 6 ? G.esc(r.desc) : owned ? '부품 ' + owned + ' / 6 조립 중' : '🔒 부품을 모으면 나타나요') + '</small>' + (owned < 6 ? '<div class="hg-bar"><i style="width:' + (owned / 6 * 100) + '%"></i></div>' : '') + '</button>');
    card.onclick = function () {
      G.sfx.play(owned === 6 ? 'great' : 'tap');
      if (owned === 6) { var art = card.querySelector('.hg-art'); art.classList.remove('transform'); void art.offsetWidth; art.classList.add('transform'); G.say(r.name + ', 변신! ' + r.desc); }
      else if (owned) G.say(r.name + ' 조립 중이야. 부품 ' + (6 - owned) + '개만 더 모으면 완성!');
      else G.say('미션을 하면 이 로봇의 부품이 나타나!');
    };
    box.appendChild(card);
  });
  G.showScreen('book');
  G.say(done ? '와, 로봇을 ' + Math.min(done, n) + '대나 완성했어! 멋진 격납고다!' : '미션을 하나 마칠 때마다 로봇 부품을 하나 얻어. 여섯 개 모으면 로봇 완성!');
}

/* ---------- 단추 연결 ---------- */
G.$('#todayBtn').onclick = function () {
  G.sfx.play('tap');
  if (G.resumeSession()) return;
  /* 하루 한 번 — 다 했으면 또 하는 것은 어른이 정한다 (화면 시간) */
  if (G.store.get('lastSession', {}).d === G.today()) {
    G.say('오늘 놀이는 다 했어! 내일 또 만나자. 이제 엄마 아빠랑 몸으로 놀자!');
    G.grownUp('오늘의 놀이를 한 번 더 하려면 어른이 답을 눌러 주세요.').then(function (ok) { if (ok) G.startSession(); });
    return;
  }
  G.startSession();
};
G.$$('.hm-quick [data-go]').forEach(function (b) {
  b.onclick = function () {
    G.sfx.play('tap');
    var go = b.dataset.go;
    if (go === 'book') return openBook();
    if (G.acts[go]) G.start(go); else G.toast('준비 중이에요');
  };
});
G.$$('[data-home]').forEach(function (b) { b.onclick = function () { G.sfx.play('tap'); G.home(); }; });
/* ✕ — 한 번 눌러 바로 끝나지 않게 그림으로 묻는다. 오늘의 놀이는 남겨 두었다가 이어 한다 */
function leaveStage() {
  if (G.session) { G.saveSession(); G.session = null; }
  if (/#\/play\//.test(location.hash)) history.back(); else G.home();
}
G.$('#stX').onclick = function () {
  G.sfx.play('tap');
  if (!G.cur || G.cur.def.tool) { leaveStage(); return; }
  var ov = G.el('<div class="modal quit-ask"><div class="md-card"><h3>그만할까?</h3><div class="md-opts" style="margin-top:12px">' +
    '<button class="btn soft keep"><span>▶</span>계속 놀래요</button><button class="btn stop"><span>🏠</span>그만할래요</button></div></div></div>');
  document.body.appendChild(ov); G.say('그만할까? 더 놀까?', { repeat: false });
  ov.querySelector('.keep').onclick = function () { ov.remove(); G.sfx.play('tap'); };
  ov.querySelector('.stop').onclick = function () { ov.remove(); G.sfx.play('tap'); leaveStage(); };
};
/* 💬 어느 놀이에서든 아이가 마음을 말할 수 있게 — 그만 · 도와줘 · 쉬고 싶어 · 한 번 더 */
G.$('#stTalk').onclick = function () {
  var old = G.$('.talk-strip'); if (old) { old.remove(); return; }
  G.sfx.play('tap');
  var st = G.el('<div class="talk-strip" role="dialog" aria-label="말하기">' +
    '<button class="t-stop"><span>✋</span>그만</button><button class="t-help"><span>🆘</span>도와줘</button>' +
    '<button class="t-rest"><span>😮‍💨</span>쉬고 싶어</button><button class="t-more"><span>🔁</span>한 번 더</button></div>');
  document.body.appendChild(st);
  var n = G.store.get('talkCount', {});
  function said(k, line) { n[k] = (n[k] || 0) + 1; G.store.set('talkCount', n); st.remove(); G.sfx.play('tap'); return G.say(line, { repeat: false }); }
  st.querySelector('.t-stop').onclick = function () { said('stop', '그만하고 싶구나. 말해 줘서 고마워!').then(leaveStage); };
  st.querySelector('.t-help').onclick = function () { said('help', '도와줘! 엄마 아빠, 도와주세요!').then(function () { if (G.cur && G.cur.instr) G.cur.say(G.cur.instr); }); };
  st.querySelector('.t-rest').onclick = function () {
    said('rest', '쉬고 싶구나. 같이 쉬자.').then(function () { if (G.session) { G.saveSession(); G.session = null; } G.start(G.acts.bubbles ? 'bubbles' : 'breathe'); });
  };
  st.querySelector('.t-more').onclick = function () { said('more', '한 번 더!').then(function () { if (G.cur && G.cur.instr) G.cur.say(G.cur.instr); }); };
  setTimeout(function () { document.addEventListener('pointerdown', function off(e) { if (!st.contains(e.target) && e.target.id !== 'stTalk') { st.remove(); } document.removeEventListener('pointerdown', off, true); }, true); }, 50);
};
G.$('#stSay').onclick = function () { if (G.cur && G.cur.instr) G.cur.say(G.cur.instr); };
G.$('#stJv').onclick = function () { if (G.cur && G.cur.instr) G.cur.say(G.cur.instr); };
G.$('#hmTree').onclick = function () {
  if (G.robotNow()) { G.sfx.play('sparkle'); openBook(); return; }
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
G.$('#hmJv').onclick = function () { G.say(G.$('#hmHello').textContent + (G.older() ? ' 하고 싶은 미션을 골라 봐.' : ' 놀고 싶은 그림을 눌러 봐.')); };

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
else if (/#parent/.test(location.hash)) openParentLink();
/* 부모 화면 바로 가기 링크 (grow.html#parent) — 링크로 와도 어른 확인은 거친다 */
function openParentLink() {
  history.replaceState(null, '', location.pathname + location.search);
  setTimeout(function () { G.grownUp('부모 화면 링크로 오셨어요. 답을 눌러 주세요.').then(function (ok) { if (ok) G.openParent(); }); }, 300);
}
window.addEventListener('hashchange', function () { if (/#parent/.test(location.hash)) openParentLink(); });
/* 처음 연 날 — 아이 정보 넣기 안내 */
if (!G.store.get('welcomed')) {
  G.store.set('welcomed', 1);
  setTimeout(function () { if (!G.cur) G.toast('👨‍👩‍👦 를 길게 눌러 아이 별명·나이·집중할 영역을 먼저 넣어 주세요', 5200); }, 800);
}

/* 고급 목소리를 켜 두었으면 자주 하는 말을 미리 받아 둔다 */
if (G.voice.premium.ready()) setTimeout(function () { G.voice.warm([].concat(D.PRAISE, D.TRY, D.DONE)); }, 4000);

/* 앱처럼 설치·오프라인 */
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});
})();

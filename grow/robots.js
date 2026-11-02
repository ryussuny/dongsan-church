/* ===========================================================
   함께 자라요 — 로봇 군단 (부품 모으기)

   미션(놀이) 하나를 마치면 부품 하나. 로봇 하나 = 부품 여섯.
   부품 순서: 다리 구동부 → 몸통 코어 → 왼팔 → 오른팔 → 머리 센서 → 특수 장비(완성·변신!)
   그림은 파란 설계도에서 시작해 부품을 얻을 때마다 그 자리가 실제 색으로 살아난다.
   오늘의 미션을 끝까지 하면 보너스 부품 하나.
   로봇을 몇 대 완성했는지에 따라 계급이 오른다 (훈련생 → … → 전설의 사령관).

   모든 로봇은 이 앱의 창작 캐릭터다. 실존 작품(트랜스포머·건담·카봇·또봇·마블)의
   이름·모양·색 배합을 베끼지 않는다.
   =========================================================== */
(function () {
'use strict';
var G = window.G;

/* 실사 그림이 준비된 로봇 (assets/grow/robots/<id>.jpg) — 그림을 더하면 여기에 id 를 적는다 */
var HAS_IMG = { striker: 1, sentinel: 1, breaker: 1 };

var R = window.GR = {};
R.SLOTS = ['다리 구동부', '몸통 코어', '왼팔', '오른팔', '머리 센서', '특수 장비'];
R.SEASONS = [
  { id: 1, name: '시즌 1 · 출격 군단', desc: '땅과 하늘을 지키는 첫 번째 군단' },
  { id: 2, name: '시즌 2 · 특수 군단', desc: '바다·궤도·번개·야수·공룡·우주의 특수 대원' },
  { id: 3, name: '전설', desc: '모든 군단을 완성한 사령관에게만' }
];
/* svg: 실사 그림이 없을 때 쓰는 벡터 그림 번호(hero-art.js), hue: 색을 돌려 구별 */
R.ROBOTS = [
  { id: 'striker', name: '크림슨 스트라이커', type: '스피드형', alt: '빨간 슈퍼카', skill: '번개 질주', color: '#e5484d', season: 1, svg: 0,
    parts: ['터보 레그', '스파크 코어', '블레이드 암', '부스터 캐논', '헤드라이트 센서', '리어 윙'],
    line: '빨간 슈퍼카로 변신하는 스피드형 로봇! 특기는 번개 질주!' },
  { id: 'sentinel', name: '블루 센티널', type: '방어형', alt: '경찰 추격차', skill: '철벽 방패', color: '#3b82f6', season: 1, svg: 1,
    parts: ['추격 휠 레그', '사이렌 코어', '방패 암', '포획 암', '경광 센서', '라이엇 실드'],
    line: '경찰 추격차로 변신하는 방어형 로봇! 특기는 철벽 방패!' },
  { id: 'breaker', name: '타이탄 브레이커', type: '파워형', alt: '굴착기', skill: '대지 분쇄', color: '#f5b700', season: 1, svg: 2,
    parts: ['무한궤도 레그', '유압 코어', '드릴 암', '집게 암', '작업등 센서', '타이탄 클로'],
    line: '굴착기로 변신하는 파워형 로봇! 특기는 대지 분쇄!' },
  { id: 'airblade', name: '에어 블레이드', type: '비행형', alt: '전투기', skill: '음속 비행', color: '#e2e8f0', season: 1, svg: 3,
    parts: ['제트 부스터 레그', '흡입구 코어', '윙 암', '레이저 암', '조종석 센서', '날개 칼날'],
    line: '전투기로 변신하는 비행형 로봇! 특기는 음속 비행!' },
  { id: 'rotor', name: '스톰 로터', type: '구조 비행형', alt: '구조 헬리콥터', skill: '폭풍 구조', color: '#f97316', season: 1, svg: 3, hue: 160,
    parts: ['착륙 스키드 레그', '터빈 코어', '윈치 암', '탐조등 암', '레이더 센서', '로터 블레이드'],
    line: '구조 헬리콥터로 변신하는 구조 비행형 로봇! 특기는 폭풍 구조!' },
  { id: 'lancer', name: '레스큐 랜서', type: '구조형', alt: '소방 구조차', skill: '물대포 구조', color: '#22c55e', season: 1, svg: 4,
    parts: ['구조 휠 레그', '펌프 코어', '물대포 암', '구조 암', '비상등 센서', '사다리 랜스'],
    line: '소방 구조차로 변신하는 구조형 로봇! 특기는 물대포 구조!' },
  { id: 'trident', name: '딥 트라이던트', type: '해저형', alt: '잠수함', skill: '심해 돌진', color: '#14b8a6', season: 2, svg: 1, hue: -40,
    parts: ['프로펠러 레그', '소나 코어', '어뢰 암', '작살 암', '잠망경 센서', '트라이던트'],
    line: '잠수함으로 변신하는 해저형 로봇! 특기는 심해 돌진!' },
  { id: 'fortress', name: '아이언 포트리스', type: '요새형', alt: '장갑 궤도차', skill: '강철 요새', color: '#84cc16', season: 2, svg: 2, hue: 50,
    parts: ['궤도 레그', '장갑 코어', '방벽 암', '쌍포 암', '조준 센서', '포트리스 캐논'],
    line: '장갑 궤도차로 변신하는 요새형 로봇! 특기는 강철 요새!' },
  { id: 'express', name: '볼트 익스프레스', type: '번개형', alt: '고속열차', skill: '전격 질주', color: '#38bdf8', season: 2, svg: 3, hue: 200,
    parts: ['레일 레그', '발전 코어', '전격 암', '연결 암', '판토그래프 센서', '볼트 노즈'],
    line: '고속열차로 변신하는 번개형 로봇! 특기는 전격 질주!' },
  { id: 'fang', name: '와일드 팽', type: '비스트형', alt: '강철 늑대', skill: '야성 추적', color: '#a855f7', season: 2, svg: 5, hue: 40,
    parts: ['도약 레그', '야성 코어', '발톱 암', '송곳니 암', '늑대 눈 센서', '팽 블레이드'],
    line: '강철 늑대로 변신하는 비스트형 로봇! 특기는 야성 추적!' },
  { id: 'rex', name: '렉스 크러셔', type: '공룡형', alt: '티라노사우루스', skill: '포효 충격', color: '#ea580c', season: 2, svg: 0, hue: 25,
    parts: ['공룡 다리', '화산 코어', '꼬리 암', '턱 암', '포효 센서', '렉스 테일'],
    line: '티라노사우루스로 변신하는 공룡형 로봇! 특기는 포효 충격!' },
  { id: 'nova', name: '팬텀 노바', type: '우주형', alt: '스텔스 우주기', skill: '은하 은신', color: '#8b5cf6', season: 2, svg: 5,
    parts: ['궤도 추진 레그', '항성 코어', '중력 암', '광자 암', '은하 센서', '노바 윙'],
    line: '스텔스 우주기로 변신하는 우주형 로봇! 특기는 은하 은신!' },
  { id: 'omega', name: '오메가 가디언', type: '전설 사령관형', alt: '황금 지휘 기함', skill: '오메가 수호', color: '#fbbf24', season: 3, svg: 0, gold: true,
    parts: ['황금 레그', '오메가 코어', '수호 암', '지휘 암', '왕관 센서', '오메가 윙'],
    line: '모든 군단을 지휘하는 전설의 사령관 로봇! 특기는 오메가 수호!' }
];
R.RANKS = [
  { n: 0, name: '훈련생', e: '🔰' }, { n: 1, name: '대원', e: '🎖️' }, { n: 3, name: '정예 대원', e: '🏅' }, { n: 5, name: '팀장', e: '⭐' },
  { n: 7, name: '부대장', e: '🌟' }, { n: 9, name: '대장', e: '🛡️' }, { n: 12, name: '사령관', e: '👑' }, { n: 13, name: '전설의 사령관', e: '🏆' }
];
R.ROBOTS.forEach(function (r) { if (HAS_IMG[r.id]) r.img = 'assets/grow/robots/' + r.id + '.jpg'; });

/* ---------- 진행 상황 ---------- */
R.count = function () { return G.stickers().count; };                 /* 모은 부품 수 */
R.state = function (count) {
  if (count == null) count = R.count();
  var n = R.ROBOTS.length, done = Math.min(n, Math.floor(count / 6)), round = Math.floor(count / (n * 6));
  var cur = done < n ? done : (Math.floor(count / 6) % n), owned = count % 6;
  return { count: count, done: Math.floor(count / 6), robots: done, round: round, cur: cur, owned: owned };
};
R.ownedOf = function (i, count) { if (count == null) count = R.count(); var n = R.ROBOTS.length; if (count >= n * 6) return 6; return Math.max(0, Math.min(6, count - i * 6)); };
R.rank = function (robotsDone) {
  var r = R.RANKS[0]; R.RANKS.forEach(function (x) { if (robotsDone >= x.n) r = x; });
  var next = R.RANKS.filter(function (x) { return x.n > robotsDone; })[0] || null;
  return { cur: r, next: next };
};

/* ---------- 그림: 설계도 → 부품마다 살아나기 ---------- */
var REGION = [
  'inset(57% 0 0 0)',                                        /* 다리 구동부 */
  'polygon(28% 27%,72% 27%,74% 60%,26% 60%)',                /* 몸통 코어 */
  'polygon(0 18%,38% 18%,34% 68%,0 68%)',                    /* 왼팔 (보는 쪽 왼쪽) */
  'polygon(62% 18%,100% 18%,100% 68%,66% 68%)',              /* 오른팔 */
  'polygon(30% 0,70% 0,70% 30%,30% 30%)'                     /* 머리 센서 */
];
G.css('robots', [
  '.rart{position:relative;display:block;aspect-ratio:3/4;overflow:hidden;border-radius:14px;background:#0a1430}',
  '.rart img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}',
  '.rart .bp{filter:grayscale(1) brightness(.55) sepia(1) hue-rotate(175deg) saturate(3.2) contrast(1.15);opacity:.85}',
  '.rart::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(120,200,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(120,200,255,.12) 1px,transparent 1px);background-size:14px 14px;opacity:var(--grid,1)}',
  '.rart.complete::after{opacity:0}',
  '.rart.complete{box-shadow:0 0 22px color-mix(in srgb,var(--rc) 55%,transparent)}',
  '.rart .flash{animation:partFlash 1s ease-in-out 3}',
  '.rart .scan{position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#7df9ff,transparent);box-shadow:0 0 12px #7df9ff;animation:rScan 2.4s linear infinite;pointer-events:none}',
  '@keyframes rScan{from{top:0}to{top:100%}}',
  '.rart.complete .scan{display:none}',
  '.calm .rart .scan{display:none}',
  '.rsvg{display:block}.rsvg svg{width:100%;height:100%;display:block}'
].join('\n'));

/* i 번째 로봇, 부품 owned 개. o: {highlight: 0~5, cls} */
G.robotArt = function (i, owned, o) {
  o = o || {};
  var r = R.ROBOTS[i]; if (!r) return '';
  var gold = o.gold || r.gold;
  if (r.img) {
    var h = '<span class="rart' + (owned >= 6 ? ' complete' : '') + ' ' + (o.cls || '') + '" style="--rc:' + r.color + '">';
    if (owned >= 6) h += '<img class="' + (o.highlight === 5 ? 'flash' : '') + '" src="' + r.img + '" alt="' + G.esc(r.name) + '"' + (gold && !r.gold ? ' style="filter:sepia(.6) saturate(1.6) hue-rotate(-10deg)"' : '') + '>';
    else {
      h += '<img class="bp" src="' + r.img + '" alt="">';
      for (var k = 0; k < owned && k < 5; k++) h += '<img class="' + (o.highlight === k ? 'flash' : '') + '" src="' + r.img + '" alt="" style="clip-path:' + REGION[k] + '">';
      h += '<i class="scan"></i>';
    }
    return h + '</span>';
  }
  /* 실사 그림이 아직 없으면 벡터 그림 (색을 돌려 구별) */
  if (!(window.GA && GA.robot)) return '<span class="rsvg" style="font-size:64px;text-align:center">🤖</span>';
  var f = [];
  if (r.hue) f.push('hue-rotate(' + r.hue + 'deg)');
  if (gold) f.push('sepia(.7) saturate(2) hue-rotate(-12deg) brightness(1.08)');
  return '<span class="rsvg ' + (o.cls || '') + '"' + (f.length ? ' style="filter:' + f.join(' ') + '"' : '') + '>' + GA.robot(r.svg, owned, { highlight: o.highlight == null ? null : o.highlight }) + '</span>';
};

/* 상 화면에 쓸 정보 — count = 부품을 받은 뒤의 수 */
G.rewardPart = function (count) {
  if (!count) return null;
  var n = R.ROBOTS.length, k = count - 1, idx = Math.floor(k / 6) % n, round = Math.floor(k / (n * 6)), owned = (k % 6) + 1;
  var r = R.ROBOTS[idx], before = R.rank(Math.min(n, Math.floor(k / 6))), after = R.rank(Math.min(n, Math.floor(count / 6)));
  var name = (round ? '황금 ' : '') + r.name;
  return { robot: { name: name, color: r.color }, idx: idx, owned: owned, complete: owned === 6,
    partName: r.parts[owned - 1] + ' (' + R.SLOTS[owned - 1] + ')', slot: R.SLOTS[owned - 1],
    rankUp: owned === 6 && after.cur.name !== before.cur.name ? after.cur : null,
    svg: G.robotArt(idx, owned, { highlight: owned - 1, gold: !!round }) };
};
G.robotNow = function () {
  var s = R.state(), n = R.ROBOTS.length, idx = s.robots >= n ? s.cur : s.robots;
  return { robot: R.ROBOTS[idx], owned: s.owned, idx: idx, svg: G.robotArt(idx, s.owned, {}) };
};

/* ---------- 격납고 화면 ---------- */
G.css('hangar2', [
  '.hg2{max-width:980px;margin:0 auto;padding:0 14px calc(28px + var(--safe-b))}',
  '.hg-rank{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,rgba(255,255,255,.09),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:12px 14px;margin-bottom:12px}',
  '.hg-rank .rk-e{font-size:40px;line-height:1}',
  '.hg-rank b{display:block;font-family:"Black Han Sans","Jua",sans-serif;font-weight:400;font-size:22px}',
  '.hg-rank small{color:#a9bde3;font-size:13px}',
  '.hg-rank .rk-bar{height:8px;border-radius:9px;background:rgba(255,255,255,.12);margin-top:6px;overflow:hidden}.hg-rank .rk-bar i{display:block;height:100%;background:linear-gradient(90deg,#ffd54f,#ff9f1c)}',
  '.hg-now{display:grid;grid-template-columns:minmax(130px,42%) 1fr;gap:14px;align-items:center;background:linear-gradient(160deg,rgba(94,234,255,.10),rgba(255,255,255,.02));border:1px solid rgba(94,234,255,.35);border-radius:20px;padding:12px;margin-bottom:16px;box-shadow:0 0 24px rgba(56,189,248,.18)}',
  '.hg-now .rart,.hg-now .rsvg{width:100%}',
  '.hg-now h3{font-family:"Black Han Sans","Jua",sans-serif;font-weight:400;font-size:22px;color:#fff;margin-bottom:2px}',
  '.hg-now .meta{color:#9fdcff;font-size:13px;margin-bottom:6px}',
  '.plist{list-style:none;display:flex;flex-direction:column;gap:4px}',
  '.plist li{display:flex;align-items:center;gap:8px;font-size:14px;color:#cfe0ff;background:rgba(255,255,255,.05);border-radius:10px;padding:5px 8px}',
  '.plist li i{font-style:normal;width:22px;text-align:center}',
  '.plist li.got{color:#fff;background:rgba(94,234,255,.14)}',
  '.plist li.next{outline:2px dashed rgba(255,213,79,.7)}',
  '.plist li small{margin-left:auto;color:#8ea4cb;font-size:11.5px}',
  '.hg-season{margin:14px 0 8px;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}',
  '.hg-season b{font-family:"Black Han Sans","Jua",sans-serif;font-weight:400;font-size:19px;color:#fff}',
  '.hg-season small{color:#8ea4cb;font-size:12.5px}',
  '.hg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}',
  '.hg-card .rart,.hg-card .rsvg{width:100%}',
  '.hg-card .rsvg{height:170px}',
  '.hg-card .tag{display:inline-block;font-size:11px;color:#0b1530;background:var(--c);border-radius:999px;padding:0 8px;margin-top:4px;font-weight:700}',
  '.rb-modal .md-card{background:linear-gradient(165deg,#13244f,#0c1733);color:#eaf2ff;border:1px solid rgba(120,180,255,.35);max-height:92vh;overflow:auto}',
  '.rb-modal .md-card p{color:#a9bde3}',
  '.rb-modal .rart,.rb-modal .rsvg{width:min(260px,70vw);margin:6px auto 10px}',
  '.rb-modal .rsvg{height:300px}',
  '@media (max-width:420px){.hg-now{grid-template-columns:1fr}.hg-now .rart{max-width:240px;margin:0 auto}}'
].join('\n'));

function partsList(i, owned) {
  var r = R.ROBOTS[i];
  return '<ul class="plist">' + r.parts.map(function (p, k) {
    return '<li class="' + (k < owned ? 'got' : k === owned ? 'next' : '') + '"><i>' + (k < owned ? '✅' : k === owned ? '🔧' : '🔒') + '</i>' + G.esc(p) + '<small>' + R.SLOTS[k] + '</small></li>';
  }).join('') + '</ul>';
}
function detail(i) {
  var r = R.ROBOTS[i], owned = R.ownedOf(i);
  var ov = G.el('<div class="modal rb-modal"><div class="md-card">' + G.robotArt(i, owned, { cls: owned >= 6 ? 'transform' : '' }) +
    '<h3 class="hero-t" style="font-size:24px">' + G.esc(r.name) + '</h3><p>' + r.type + ' · 변신: ' + r.alt + ' · 특기: ' + r.skill + '</p>' +
    (owned >= 6 ? '<p style="color:#7df9ff">✨ 완성! 변신 가능</p>' : owned ? '<p>부품 ' + owned + ' / 6 — 미션 ' + (6 - owned) + '개만 더!</p>' : '<p>🔒 앞 로봇을 완성하면 조립을 시작해요</p>') +
    partsList(i, owned) + '<button class="btn soft md-x" style="margin-top:12px">닫기</button></div></div>');
  document.body.appendChild(ov);
  ov.querySelector('.md-x').onclick = function () { ov.remove(); G.voice.stop(); };
  ov.onclick = function (e) { if (e.target === ov) { ov.remove(); G.voice.stop(); } };
  G.sfx.play(owned >= 6 ? 'great' : 'tap');
  G.say(owned >= 6 ? r.name + ', 변신! ' + r.line : owned ? r.name + ' 조립 중! ' + r.parts[owned] + ' 부품이 다음이야.' : r.name + '. ' + r.line + ' 미션을 하면 만날 수 있어!');
}
G.openHangar = function () {
  var s = R.state(), n = R.ROBOTS.length, rk = R.rank(Math.min(n, s.robots)), now = G.robotNow();
  var box = G.$('#hangar'); G.$('#bookGrid').hidden = true; box.hidden = false;
  box.className = 'hg2';
  var toNext = rk.next ? rk.next.n - Math.min(n, s.robots) : 0;
  var h = '<div class="hg-rank"><span class="rk-e">' + rk.cur.e + '</span><div style="flex:1"><small>나의 계급</small><b>' + rk.cur.name + '</b>' +
    '<small>완성한 로봇 ' + Math.min(n, s.robots) + ' / ' + n + ' · 모은 부품 ' + s.count + '개' + (rk.next ? ' · 다음 계급 「' + rk.next.name + '」까지 로봇 ' + toNext + '대' : ' · 최고 계급!') + '</small>' +
    (rk.next ? '<div class="rk-bar"><i style="width:' + Math.round((Math.min(n, s.robots) - rk.cur.n) / (rk.next.n - rk.cur.n) * 100) + '%"></i></div>' : '') + '</div></div>';
  var nr = now.robot;
  h += '<div class="hg-now"><div>' + now.svg + '</div><div><small style="color:#7df9ff">지금 조립 중</small><h3>' + G.esc(nr.name) + '</h3><div class="meta">' + nr.type + ' · 변신: ' + nr.alt + ' · 특기: ' + nr.skill + '</div>' +
    partsList(now.idx, now.owned) + '<p style="margin-top:8px;color:#ffd54f;font-size:13.5px">🔧 다음 부품: ' + G.esc(nr.parts[now.owned] || '') + ' — 미션 하나 더!</p></div></div>';
  R.SEASONS.forEach(function (se) {
    h += '<div class="hg-season"><b>' + se.name + '</b><small>' + se.desc + '</small></div><div class="hg-grid">';
    R.ROBOTS.forEach(function (r, i) {
      if (r.season !== se.id) return;
      var owned = R.ownedOf(i), st = owned >= 6 ? 'done' : owned ? 'now' : 'lock';
      h += '<button class="hg-card ' + st + '" data-ri="' + i + '" style="--c:' + r.color + '">' + G.robotArt(i, owned, {}) + '<b>' + G.esc(r.name) + '</b><span class="tag">' + r.type + '</span><small>' +
        (owned >= 6 ? '✨ 완성 · ' + r.skill : owned ? '부품 ' + owned + ' / 6 조립 중' : '🔒 ' + r.alt) + '</small>' + (owned && owned < 6 ? '<div class="hg-bar"><i style="width:' + (owned / 6 * 100) + '%"></i></div>' : '') + '</button>';
    });
    h += '</div>';
  });
  box.innerHTML = h;
  G.$$('[data-ri]', box).forEach(function (b) { b.onclick = function () { detail(+b.dataset.ri); }; });
  G.$('#bookSum').textContent = '';
  G.showScreen('book');
  G.say(s.robots ? '격납고에 로봇이 ' + Math.min(n, s.robots) + '대! 계급은 ' + rk.cur.name + '. 지금은 ' + nr.name + ' 조립 중이야.' : '여기는 로봇 격납고야. 미션을 하나 마칠 때마다 부품을 하나 얻어. 여섯 개를 모으면 ' + nr.name + ' 완성!');
};
})();

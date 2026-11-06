/* ===========================================================
   함께 자라요 — 로봇 군단 (부품 모으기)

   ⚡ 에너지로 부품을 만든다 — 놀이를 마치기만 하면 부품이 나오던 것을 바꿨다(너무 쉽고 빨랐다).
   에너지: 완주 +1 · 정확(80%↑) +1 · 도전 단계(4~5) +1 · 칸 오름 +2 · 단계 오름 +4 · 오늘의 미션 완주 +3.
     같은 놀이는 하루 두 번까지만 완주 에너지가 나온다(여러 놀이 고루) · 하루 최대 16.
   부품 값: 시즌 1 ⚡3 · 2 ⚡4 · 3 ⚡5 · 4 ⚡6 · 5 ⚡8 · 최종 ⚡10 (부모 화면에서 빠르게·보통·천천히).
   시즌 4~최종(10대)은 🗺️ 1년 여정(journey.js)의 장마다 하나씩 열린다 — 1장 피닉스 … 10장 아크 라이트.
     장을 넘기려면 미션 날 + 단계 열쇠가 있어야 하니, 로봇도 1년에 걸쳐 만난다.
   남는 에너지는 완성한 로봇 강화(★1~★5)에 쓴다 — ⚡8·16·24·32·40. ★5 는 전설 등급(상장).
   로봇 하나 = 부품 여섯. 순서: 다리 구동부 → 몸통 코어 → 왼팔 → 오른팔 → 머리 센서 → 특수 장비(완성·변신!)
   그림은 파란 설계도에서 시작해 부품을 얻을 때마다 그 자리가 실제 색으로 살아난다.
   로봇을 몇 대 완성했는지에 따라 계급이 오른다 (훈련생 → … → 전신갑주 용사).

   모든 로봇은 이 앱의 창작 캐릭터다. 실존 작품(트랜스포머·건담·카봇·또봇·마블)의
   이름·모양·색 배합을 베끼지 않는다.
   =========================================================== */
(function () {
'use strict';
var G = window.G;

/* 실사 그림이 준비된 로봇 (assets/grow/robots/<id>.jpg) — 그림을 더하면 여기에 id 를 적는다 */
var HAS_IMG = { striker: 1, sentinel: 1, breaker: 1, airblade: 1, rotor: 1, lancer: 1, trident: 1, fortress: 1, express: 1, fang: 1, rex: 1, nova: 1, omega: 1,
  phoenix: 1, thunder: 1, aurora: 1, leo: 1, gigas: 1, seraph: 1, cosmos: 1, leviathan: 1, chrono: 1, arclight: 1 };
/* 완성하면 볼 수 있는 변신 영상 (assets/grow/videos/<id>.mp4, Higgsfield) */
var HAS_VID = { phoenix: 1, thunder: 1, aurora: 1, leo: 1, gigas: 1, seraph: 1, cosmos: 1, leviathan: 1, chrono: 1, arclight: 1 };

var R = window.GR = {};
R.SLOTS = ['다리 구동부', '몸통 코어', '왼팔', '오른팔', '머리 센서', '특수 장비'];
/* cost: 부품 하나 값(⚡), gate: 열쇠 — 놀이 games 가지를 lv 단계 이상까지 해 본 적이 있어야 열린다 */
R.SEASONS = [
  { id: 1, name: '시즌 1 · 출격 군단', desc: '땅과 하늘을 지키는 첫 번째 군단', cost: 3 },
  { id: 2, name: '시즌 2 · 특수 군단', desc: '바다·궤도·번개·야수·공룡·우주의 특수 대원', cost: 4 },
  { id: 3, name: '전설', desc: '모든 군단을 완성한 사령관에게만', cost: 5 },
  { id: 4, name: '시즌 4 · 폭풍 전설 군단', desc: '1년 여정 1~5장의 전설', cost: 6 },
  { id: 5, name: '시즌 5 · 빛의 군단', desc: '1년 여정 6~9장 — 빛·별·바다·시간의 수호자', cost: 8 },
  { id: 6, name: '최종 전설', desc: '1년 여정 10장 — 하나님의 전신 갑주를 입은 마지막 수호자', cost: 10 }
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
    line: '모든 군단을 지휘하는 전설의 사령관 로봇! 특기는 오메가 수호!' },
  /* 시즌 4 · 폭풍 전설 군단 */
  { id: 'phoenix', chapter: 1, name: '블레이즈 피닉스', type: '불사조형', alt: '불꽃 전투기', skill: '불꽃 부활', color: '#ff5a1f', season: 4, svg: 3, hue: -20,
    parts: ['불꽃 발톱 레그', '용암 크리스털 코어', '화염 깃 암', '피닉스 블래스터', '불새 투구 센서', '불사조 날개'],
    line: '불꽃 전투기로 변신하는 불사조형 로봇! 넘어져도 다시 일어나는 불꽃 부활이 특기야!' },
  { id: 'thunder', chapter: 2, name: '썬더 드래곤', type: '용기사형', alt: '번개 용', skill: '천둥 랜스', color: '#3d8bff', season: 4, svg: 5, hue: 190,
    parts: ['용 발톱 레그', '뇌전 코어', '용비늘 방패 암', '썬더 랜스 암', '용 뿔 센서', '천둥 날개'],
    line: '번개 용으로 변신하는 용기사형 로봇! 특기는 천둥 랜스!' },
  { id: 'aurora', chapter: 3, name: '오로라 나이트', type: '빙결 기사형', alt: '설원 스노 제트', skill: '오로라 검', color: '#7fe3ff', season: 4, svg: 1, hue: 150,
    parts: ['빙판 스키 레그', '빙정 코어', '서리 방패 암', '오로라 검 암', '눈꽃 왕관 센서', '빙하 망토'],
    line: '설원 스노 제트로 변신하는 빙결 기사형 로봇! 특기는 오로라 검!' },
  { id: 'leo', chapter: 4, name: '킹 레오', type: '사자왕형', alt: '황금 사자 전차', skill: '사자왕의 포효', color: '#e6a700', season: 4, svg: 2, hue: 20,
    parts: ['사자 궤도 레그', '사자 얼굴 코어', '왕의 방패 암', '왕의 대검 암', '갈기 투구 센서', '황금 갈기'],
    line: '황금 사자 전차로 변신하는 사자왕형 로봇! 특기는 사자왕의 포효!' },
  { id: 'gigas', chapter: 5, name: '기가 타이탄', type: '초거대 합체형', alt: '중장비 합체 기지', skill: '대지 합체', color: '#ff9f1c', season: 4, svg: 2, hue: 35,
    parts: ['덤프트럭 레그', '불도저 코어', '굴착기 암', '메가 해머 암', '관제 센서', '크레인 합체 엔진'],
    line: '중장비 여러 대가 하나로 합체하는 초거대 로봇! 특기는 대지 합체!' },
  /* 시즌 5 · 빛의 군단 */
  { id: 'seraph', chapter: 6, name: '세라프 윙', type: '빛의 수호천사형', alt: '빛의 우주선', skill: '여섯 날개 방벽', color: '#bfe9ff', season: 5, svg: 4, hue: 0,
    parts: ['빛 추진 레그', '광휘 코어', '빛의 방패 암', '빛의 검 암', '빛 고리 센서', '여섯 날개'],
    line: '빛의 우주선으로 변신하는 수호천사형 로봇! 특기는 여섯 날개 방벽!' },
  { id: 'cosmos', chapter: 7, name: '코스모 엠퍼러', type: '은하 황제형', alt: '은하 기함', skill: '별빛 왕관', color: '#a78bfa', season: 5, svg: 5, hue: 0,
    parts: ['성운 추진 레그', '은하 코어', '행성 고리 암', '별 지팡이 암', '별 왕관 센서', '은하 망토'],
    line: '은하 기함으로 변신하는 은하 황제형 로봇! 특기는 별빛 왕관!' },
  { id: 'leviathan', chapter: 8, name: '오션 리바이어던', type: '심해 거신형', alt: '고래 전함', skill: '해일 방벽', color: '#22d3ee', season: 5, svg: 1, hue: 180,
    parts: ['고래 지느러미 레그', '심해 빛 코어', '물대포 암 (왼쪽)', '물대포 암 (오른쪽)', '수중 음파 센서', '고래 꼬리 망토'],
    line: '고래 전함으로 변신하는 심해 거신형 로봇! 특기는 해일 방벽!' },
  { id: 'chrono', chapter: 9, name: '크로노 가디언', type: '시간 수호자형', alt: '태엽 비행선', skill: '시간의 톱니', color: '#e8c15a', season: 5, svg: 4, hue: 30,
    parts: ['태엽 레그', '모래시계 코어', '톱니 방패 암', '진자 지팡이 암', '별시계 센서', '황금 톱니 고리'],
    line: '태엽 비행선으로 변신하는 시간 수호자형 로봇! 특기는 시간의 톱니!' },
  /* 최종 전설 — 에베소서 6:14~17 의 전신 갑주 (부품 이름은 풀어 쓴 말) */
  { id: 'arclight', chapter: 10, name: '아크 라이트', type: '전신 갑주 수호자', alt: '빛의 성채', skill: '하나님의 전신 갑주', color: '#ffe27a', season: 6, svg: 0, gold: true,
    parts: ['평안의 복음의 신', '의의 호심경', '믿음의 방패', '성령의 검', '구원의 투구', '진리의 허리띠'],
    line: '하나님의 전신 갑주를 입은 마지막 수호자! 믿음의 방패와 성령의 검으로 친구들을 지켜!',
    verse: '“마귀의 간계를 능히 대적하기 위하여 하나님의 전신 갑주를 입으라” (에베소서 6:11)' }
];
R.RANKS = [
  { n: 0, name: '훈련생', e: '🔰' }, { n: 1, name: '대원', e: '🎖️' }, { n: 3, name: '정예 대원', e: '🏅' }, { n: 5, name: '팀장', e: '⭐' },
  { n: 7, name: '부대장', e: '🌟' }, { n: 9, name: '대장', e: '🛡️' }, { n: 12, name: '사령관', e: '👑' }, { n: 13, name: '전설의 사령관', e: '🏆' },
  { n: 15, name: '폭풍 영웅', e: '🌪️' }, { n: 18, name: '전설 영웅', e: '🦸' }, { n: 20, name: '빛의 사령관', e: '🌠' }, { n: 22, name: '시간의 수호자', e: '⏳' }, { n: 23, name: '전신 갑주 용사', e: '⚜️' }
];
R.ROBOTS.forEach(function (r) { if (HAS_IMG[r.id]) r.img = 'assets/grow/robots/' + r.id + '.jpg'; if (HAS_VID[r.id]) r.video = 'assets/grow/videos/' + r.id + '.mp4'; });

/* ---------- 진행 상황 ---------- */
/* 모은 부품 수 — 예전에는 스티커 수와 같았다. 처음 한 번 옮겨 오고(그때 있던 13대까지), 이제는 에너지로만 는다 */
var OLD_N = 13;
R.count = function () {
  var p = G.store.get('parts', null);
  if (p == null) { p = Math.min(G.stickers().count, OLD_N * 6); G.store.set('parts', p); }
  return p;
};

/* ---------- ⚡ 에너지 ---------- */
R.PACE = { fast: 0.7, normal: 1, slow: 1.5 };
R.EN_CAP = 200;   /* 새 로봇이 잠겨 있을 때 모아 둘 수 있는 에너지 */
/* ---------- ⭐ 로봇 강화 (완성한 로봇, ★1~★5) ---------- */
R.upOf = function (id) { return (G.store.get('robotUp', {}) || {})[id] || 0; };
R.upCost = function (id) { return Math.max(4, Math.round(8 * (R.upOf(id) + 1) * (R.PACE[(G.settings || {}).partPace] || 1))); };
R.upgrade = function (i) {
  var r = R.ROBOTS[i]; if (!r || R.ownedOf(i) < 6) return null;
  var lvl = R.upOf(r.id); if (lvl >= 5) return null;
  var en = R.energy(), cost = R.upCost(r.id); if (en.e < cost) return null;
  en.e -= cost; G.store.set('energy', en);
  var U = G.store.get('robotUp', {}); U[r.id] = lvl + 1; G.store.set('robotUp', U);
  var badge = lvl + 1 === 5 && G.badges ? G.badges.award('up5:' + r.id, '「' + r.name + '」 전설 강화 ★5', '🌟') : null;
  return { stars: lvl + 1, badge: badge };
};
R.stars = function (n) { return '★'.repeat(n) + '☆'.repeat(5 - n); };
R.DAY_MAX = 16;
R.seasonOf = function (r) { return R.SEASONS.filter(function (x) { return x.id === r.season; })[0] || R.SEASONS[0]; };
/* idx 번째 로봇 부품 값 (round: 황금 로봇 다시 모으기) */
R.costOf = function (idx, round) {
  var c = round ? 8 : R.seasonOf(R.ROBOTS[idx]).cost;
  return Math.max(2, Math.round(c * (R.PACE[(G.settings || {}).partPace] || 1)));
};
R.energy = function () {
  var e = G.store.get('energy', { e: 0, total: 0, d: '', today: 0 });
  if (e.d !== G.today()) { e.d = G.today(); e.today = 0; }
  return e;
};
/* 놀이마다 끝까지 해 본 가장 높은 단계 */
R.bestLevels = function () {
  var b = {};
  G.logs().forEach(function (l) { var d = G.acts[l.id]; if (!d || d.tool || (l.x && l.x.quit) || (d.levels || 1) < 2) return; b[l.id] = Math.max(b[l.id] || 0, l.lv || 1); });
  return b;
};
/* idx 번째 로봇의 열쇠 — {ok, have, need, lv, text} 또는 null(열쇠 없음) */
R.gateFor = function (idx) {
  var r = R.ROBOTS[idx], se = R.seasonOf(r);
  /* 1년 여정의 장 — 그 장에 가야 열린다 */
  if (r.chapter && G.journey) {
    var js = G.journey.state(), c = G.journey.CHAPTERS[r.chapter - 1];
    return { ok: js.ch >= r.chapter, have: Math.min(js.ch, r.chapter), need: r.chapter, chapter: r.chapter, season: { name: '🗺️ 1년 여정 ' + r.chapter + '장 「' + c.name + '」' },
      text: '1년 여정 ' + r.chapter + '장 「' + c.name + '」에 가면' };
  }
  if (!se.gate) return null;
  var b = R.bestLevels(), have = Object.keys(b).filter(function (k) { return b[k] >= se.gate.lv; }).length;
  return { ok: have >= se.gate.games, have: Math.min(have, se.gate.games), need: se.gate.games, lv: se.gate.lv, season: se,
    text: '놀이 ' + se.gate.games + '가지를 ' + (G.levelName ? G.levelName(se.gate.lv) : se.gate.lv + '단계') + ' 이상까지' };
};
/* 지금 만드는 로봇 */
R.cursor = function (c) {
  if (c == null) c = R.count();
  var n = R.ROBOTS.length;
  return { idx: Math.floor(c / 6) % n, round: Math.floor(c / (n * 6)), owned: c % 6 };
};
/* 모인 에너지로 부품 만들기 — 열쇠가 없으면 멈추고(에너지는 부품 둘 값까지 보관) */
R.spend = function (en) {
  var made = [], locked = null;
  for (var g = 0; g < 12; g++) {
    var cu = R.cursor(), cost = R.costOf(cu.idx, cu.round);
    var gate = cu.round || cu.owned ? null : R.gateFor(cu.idx);   /* 열쇠는 새 로봇을 시작할 때만 본다 */
    if (gate && !gate.ok) { locked = gate; en.e = Math.min(en.e, R.EN_CAP); break; }   /* 남는 에너지는 로봇 강화에 */
    if (en.e < cost) break;
    en.e -= cost; var c = R.count() + 1; G.store.set('parts', c); made.push(c);
  }
  return { made: made, locked: locked };
};
/* 다음 부품까지 — {cost, have, left, part, robot, locked} */
R.nextInfo = function () {
  var en = R.energy(), cu = R.cursor(), r = R.ROBOTS[cu.idx], cost = R.costOf(cu.idx, cu.round);
  var gate = cu.round || cu.owned ? null : R.gateFor(cu.idx);
  return { cost: cost, have: Math.min(en.e, cost), left: Math.max(0, cost - en.e), part: r.parts[cu.owned], robot: r, idx: cu.idx, owned: cu.owned,
    locked: gate && !gate.ok ? gate : null, today: en.today, dayMax: R.DAY_MAX };
};
/* 놀이를 마칠 때 — o: {id, n, ok, level, up:'step'|'level'|''} → {gain, items, capped, made, locked, next} */
G.earnEnergy = function (o) {
  var en = R.energy(), items = [];
  var timesToday = G.logs().filter(function (l) { return l.d === G.today() && l.id === o.id && !(l.x && l.x.quit); }).length;   /* 이번 판까지 */
  if (timesToday <= 2) {
    items.push({ t: '완주', v: 1 });
    if (o.n >= 3 && o.ok / o.n >= 0.8) items.push({ t: '정확', v: 1 });
    if (o.level >= 4) items.push({ t: '도전 단계', v: 1 });
  } else items.push({ t: '같은 놀이는 하루 두 번까지', v: 0 });
  if (o.up === 'level') items.push({ t: '단계 오름', v: 4 }); else if (o.up === 'step') items.push({ t: '칸 오름', v: 2 });
  var sum = items.reduce(function (s, x) { return s + x.v; }, 0), room = Math.max(0, R.DAY_MAX - en.today), gain = Math.min(sum, room);
  en.today += gain; en.total += gain; en.e += gain;
  var sp = R.spend(en);
  G.store.set('energy', en);
  return { gain: gain, items: items.filter(function (x) { return x.v; }), capped: gain < sum, same: timesToday > 2, made: sp.made, locked: sp.locked, next: R.nextInfo() };
};
/* 오늘의 미션 완주 보너스 (하루 한 번, 하루 최대와 따로) */
G.energyBonus = function (v) {
  var en = R.energy(); en.e += v; en.total += v;
  var sp = R.spend(en); G.store.set('energy', en);
  return { gain: v, made: sp.made, locked: sp.locked, next: R.nextInfo() };
};
/* 에너지 막대 (상 화면·격납고) */
G.energyBar = function (nx) {
  nx = nx || R.nextInfo();
  if (nx.locked && nx.locked.chapter) return '<div class="en-box locked"><b>🔒 ' + G.esc(nx.locked.season.name) + '</b><small>' + G.esc(nx.locked.text) + ' 만날 수 있어요 · 모은 에너지 ⚡' + R.energy().e + ' 는 격납고에서 로봇 강화에 쓸 수 있어요</small>' +
    '<div class="en-bar"><i style="width:' + Math.round(nx.locked.have / nx.locked.need * 100) + '%"></i></div></div>';
  if (nx.locked) return '<div class="en-box locked"><b>🔒 ' + G.esc(nx.locked.season.name) + '</b><small>' + G.esc(nx.locked.text) + ' 해 보면 열려요 · 지금 ' + nx.locked.have + ' / ' + nx.locked.need + '</small>' +
    '<div class="en-bar"><i style="width:' + Math.round(nx.locked.have / nx.locked.need * 100) + '%"></i></div></div>';
  return '<div class="en-box"><b>⚡ ' + nx.have + ' / ' + nx.cost + '</b><small>다음 부품 「' + G.esc(nx.part || '') + '」까지 ⚡' + nx.left + '</small>' +
    '<div class="en-bar"><i style="width:' + Math.round(nx.have / nx.cost * 100) + '%"></i></div></div>';
};
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
  '.rb-video{display:block;width:min(260px,70vw);aspect-ratio:3/4;margin:6px auto 10px;border-radius:14px;background:#000;object-fit:cover}',
  '.rb-up{color:#ffd54f;font-size:18px;letter-spacing:2px;margin:4px 0}',
  '.hg-st{color:#ffd54f;letter-spacing:1px}',
  '.hg-card.up3 .rart{box-shadow:0 0 18px color-mix(in srgb,var(--c) 70%,transparent)}',
  '.hg-card.up4 .rart{box-shadow:0 0 26px color-mix(in srgb,var(--c) 85%,transparent),0 0 6px #fff8}',
  '.hg-card.up5 .rart{box-shadow:0 0 34px #ffd54f,0 0 10px #fff;outline:2px solid #ffd54f}',
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
    (owned >= 6 ? '<p style="color:#7df9ff">✨ 완성! 변신 가능</p>' : owned ? '<p>부품 ' + owned + ' / 6 · 부품 하나에 ⚡' + R.costOf(i, 0) + '</p>' : '<p>🔒 앞 로봇을 완성하면 조립을 시작해요 · 부품 하나에 ⚡' + R.costOf(i, 0) + '</p>') +
    (r.verse ? '<p style="color:#ffe27a;font-size:13.5px">' + G.esc(r.verse) + '</p>' : '') +
    (owned >= 6 ? '<p class="rb-up">' + R.stars(R.upOf(r.id)) + ' 강화 ' + R.upOf(r.id) + ' / 5</p>' +
      (R.upOf(r.id) < 5 ? '<button class="btn md-up">⚡' + R.upCost(r.id) + ' 으로 강화하기 (지금 ⚡' + R.energy().e + ')</button>' : '<p style="color:#ffe082">🌟 전설 등급!</p>') : '') +
    (owned >= 6 && r.video ? '<button class="btn soft md-vid" style="margin-top:8px">▶ 변신 영상</button>' : '') +
    partsList(i, owned) + '<button class="btn soft md-x" style="margin-top:12px">닫기</button></div></div>');
  document.body.appendChild(ov);
  var ub = ov.querySelector('.md-up');
  if (ub) { if (R.energy().e < R.upCost(r.id)) ub.disabled = true;
    ub.onclick = function () { var u = R.upgrade(i); if (!u) return; ov.remove(); G.sfx.play('great'); G.fx.confetti(30); G.toast('⭐ ' + r.name + ' 강화 ★' + u.stars + '!' + (u.badge ? ' 🏅 새 상장!' : '')); G.openHangar(); setTimeout(function () { detail(i); }, 300); }; }
  var vb = ov.querySelector('.md-vid');
  if (vb) vb.onclick = function () {
    var art = ov.querySelector('.rart, .rsvg'); if (!art) return;
    var v = G.el('<video class="rb-video" src="' + r.video + '" autoplay muted playsinline></video>');
    art.replaceWith(v); vb.remove(); G.sfx.play('great');
    v.onended = function () { v.pause(); };
  };
  ov.querySelector('.md-x').onclick = function () { ov.remove(); G.voice.stop(); };
  ov.onclick = function (e) { if (e.target === ov) { ov.remove(); G.voice.stop(); } };
  G.sfx.play(owned >= 6 ? 'great' : 'tap');
  G.say(owned >= 6 ? r.name + ', 변신! ' + r.line : owned ? r.name + ' 조립 중! ' + r.parts[owned] + ' 부품이 다음이야. 에너지를 모으자!' : r.name + '. ' + r.line + ' 에너지를 모아 만나러 가자!');
}
G.openHangar = function () {
  var s = R.state(), n = R.ROBOTS.length, rk = R.rank(Math.min(n, s.robots)), now = G.robotNow();
  var box = G.$('#hangar'); G.$('#bookGrid').hidden = true; box.hidden = false;
  box.className = 'hg2';
  var toNext = rk.next ? rk.next.n - Math.min(n, s.robots) : 0;
  var h = '<div class="hg-rank"><span class="rk-e">' + rk.cur.e + '</span><div style="flex:1"><small>나의 계급</small><b>' + rk.cur.name + '</b>' +
    '<small>완성한 로봇 ' + Math.min(n, s.robots) + ' / ' + n + ' · 모은 부품 ' + s.count + '개' + (rk.next ? ' · 다음 계급 「' + rk.next.name + '」까지 로봇 ' + toNext + '대' : ' · 최고 계급!') + '</small>' +
    (rk.next ? '<div class="rk-bar"><i style="width:' + Math.round((Math.min(n, s.robots) - rk.cur.n) / (rk.next.n - rk.cur.n) * 100) + '%"></i></div>' : '') + '</div></div>';
  var nr = now.robot, ni = R.nextInfo(), en = R.energy();
  h += '<div class="hg-now"><div>' + now.svg + '</div><div><small style="color:#7df9ff">' + (ni.locked ? '다음 로봇 (열쇠가 필요해요)' : '지금 조립 중') + '</small><h3>' + G.esc(nr.name) + '</h3><div class="meta">' + nr.type + ' · 변신: ' + nr.alt + ' · 특기: ' + nr.skill + '</div>' +
    partsList(now.idx, now.owned) + G.energyBar(ni) + '</div></div>';
  /* 에너지 모으는 법 */
  h += '<div class="hg-rank hg-en"><span class="rk-e">⚡</span><div style="flex:1"><small>에너지 모으는 법 · 오늘 ' + en.today + ' / ' + R.DAY_MAX + ' · 지금까지 ' + en.total + '</small>' +
    '<b style="font-size:16px;line-height:1.5">완주 +1 · 정확(80%↑) +1 · 칸 오름 +2 · 단계 오름 +4 · 도전 단계 +1 · 오늘의 미션 완주 +3</b>' +
    '<small>같은 놀이는 하루 두 번까지 에너지가 나와요. 여러 놀이를 골고루! 실력이 늘수록(칸·단계) 에너지가 쑥쑥.</small></div></div>';
  R.SEASONS.forEach(function (se) {
    var gt = se.gate ? (function () { var first = R.ROBOTS.map(function (r, i) { return r.season === se.id ? i : -1; }).filter(function (i) { return i >= 0; })[0]; return R.gateFor(first); })() : null;
    h += '<div class="hg-season"><b>' + se.name + '</b><small>' + se.desc + ' · 부품 ⚡' + Math.max(2, Math.round(se.cost * (R.PACE[(G.settings || {}).partPace] || 1))) + '</small>' +
      (gt ? '<small style="color:' + (gt.ok ? '#7df9ff' : '#ffd54f') + '">' + (gt.ok ? '🔓 열림' : '🔒 열쇠: ' + G.esc(gt.text) + ' (지금 ' + gt.have + '/' + gt.need + ')') + '</small>' : '') + '</div><div class="hg-grid">';
    R.ROBOTS.forEach(function (r, i) {
      if (r.season !== se.id) return;
      var owned = R.ownedOf(i), st = owned >= 6 ? 'done' : owned ? 'now' : 'lock';
      var up = owned >= 6 ? R.upOf(r.id) : 0;
      h += '<button class="hg-card ' + st + (up ? ' up' + up : '') + '" data-ri="' + i + '" style="--c:' + r.color + '">' + G.robotArt(i, owned, {}) + '<b>' + G.esc(r.name) + '</b><span class="tag">' + r.type + '</span><small>' +
        (owned >= 6 ? '✨ 완성 · ' + r.skill + '<br><span class="hg-st">' + R.stars(up) + '</span>' + (r.video ? ' ▶' : '') : owned ? '부품 ' + owned + ' / 6 조립 중' : '🔒 ' + (r.chapter ? r.chapter + '장에서 만나요' : r.alt)) + '</small>' + (owned && owned < 6 ? '<div class="hg-bar"><i style="width:' + (owned / 6 * 100) + '%"></i></div>' : '') + '</button>';
    });
    h += '</div>';
  });
  box.innerHTML = h;
  G.$$('[data-ri]', box).forEach(function (b) { b.onclick = function () { detail(+b.dataset.ri); }; });
  G.$('#bookSum').textContent = '';
  G.showScreen('book');
  G.say(ni.locked ? '격납고에 로봇이 ' + Math.min(n, s.robots) + '대! 다음 ' + ni.locked.season.name + '은 ' + ni.locked.text + ' 해 보면 열려. 실력을 키워 보자!' :
    s.robots ? '격납고에 로봇이 ' + Math.min(n, s.robots) + '대! 계급은 ' + rk.cur.name + '. 지금은 ' + nr.name + ' 조립 중이야. 에너지 ' + ni.left + '만 더 모으면 다음 부품!' :
    '여기는 로봇 격납고야. 미션을 하면 에너지가 모이고, 에너지로 부품을 만들어. 여섯 개를 모으면 ' + nr.name + ' 완성!');
};
})();

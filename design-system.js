/* ===========================================================
   동산감리교회 디자인 시스템 — 디자인 스튜디오(design.html)가 쓰는 값

   - 테마(DS_THEMES): 색 8가지 + 글꼴 3가지. 디자인은 이 값을 CSS 변수로만 쓰므로
     테마만 바꾸면 포스터·카드·슬라이드 전체가 한 번에 바뀐다.
   - 크기(DS_FORMATS): 포스터·카드뉴스·휴대폰 세로·예배 화면·주보 표지·현수막.
   - 규칙(DS_RULES): AI 에게 주는 디자인 규칙. 사람이 읽는 설명은 DESIGN.md 에 있다.
   값을 바꾸면 DESIGN.md 의 표도 함께 고친다.
   =========================================================== */
var DS_CHURCH = {
  name: '동산감리교회',
  denom: '기독교대한감리회',
  pastor: '류선희 목사',
  address: '강원도 태백시 계산4길 25',
  motto: '하나님의 은혜가 흐르는 물댄동산',
  mottoVerse: '이사야 58:11',
  worship: [
    ['주일 오전 예배', '주일 오전 11:00'],
    ['주일 오후 예배', '주일 오후 2:00'],
    ['교회학교 예배', '주일 오전 9:00'],
    ['수요 예배', '수요일 저녁 7:30'],
    ['금요 기도회', '금요일 저녁 8:00'],
    ['아침 기도회', '월~금 새벽 6:00']
  ],
  site: 'https://ryussuny.github.io/dongsan-church/'
};

/* 글꼴 — 모두 구글 폰트(한글). 쓰는 것만 불러온다 */
var DS_FONTS = {
  'Noto Serif KR': 'Noto+Serif+KR:wght@400;600;700;900',
  'Noto Sans KR': 'Noto+Sans+KR:wght@400;500;700;900',
  'Gowun Batang': 'Gowun+Batang:wght@400;700',
  'Gowun Dodum': 'Gowun+Dodum',
  'Nanum Myeongjo': 'Nanum+Myeongjo:wght@400;700;800',
  'Jua': 'Jua',
  'Black Han Sans': 'Black+Han+Sans',
  'Nanum Pen Script': 'Nanum+Pen+Script'
};

/* 색 이름
   bg 바탕 · surface 바탕 위 상자 · ink 글자 · soft 흐린 글자 · line 선
   accent 대표색 · accent2 둘째 색 · onAccent 대표색 위 글자 */
var DS_THEMES = [
  { id: 'dongsan', name: '동산', note: '남색·금빛 · 언제나',
    c: { bg: '#FAF7F0', surface: '#FFFFFF', ink: '#17255A', soft: '#5B6280', line: '#E6DCC3',
         accent: '#A88428', accent2: '#4E9A2F', onAccent: '#17255A' },
    f: { title: 'Noto Serif KR', body: 'Noto Sans KR', hand: 'Nanum Pen Script' } },
  { id: 'night', name: '동산 밤', note: '어두운 바탕 · 저녁 예배·송년',
    c: { bg: '#17213F', surface: '#22305A', ink: '#FAF7F0', soft: '#C8C2B0', line: '#3A4878',
         accent: '#D9B95C', accent2: '#8FB4F0', onAccent: '#17213F' },
    f: { title: 'Noto Serif KR', body: 'Noto Sans KR', hand: 'Nanum Pen Script' } },
  { id: 'dawn', name: '새벽 종이', note: '크림·흙빛 · 말씀 카드',
    c: { bg: '#F4EDE1', surface: '#FFFAF2', ink: '#3B2A1F', soft: '#7A6653', line: '#E2D4BE',
         accent: '#A9512F', accent2: '#B98A2F', onAccent: '#FFFFFF' },
    f: { title: 'Gowun Batang', body: 'Gowun Dodum', hand: 'Nanum Pen Script' } },
  { id: 'garden', name: '물댄동산', note: '초록 · 성령강림 후(녹색 절기)',
    c: { bg: '#F2F6EA', surface: '#FFFFFF', ink: '#1F3A26', soft: '#56685A', line: '#D5E2C5',
         accent: '#3F8526', accent2: '#1A2F5C', onAccent: '#FFFFFF' },
    f: { title: 'Noto Serif KR', body: 'Noto Sans KR', hand: 'Nanum Pen Script' } },
  { id: 'advent', name: '대림절', note: '보라 · 기다림과 회개',
    c: { bg: '#F4F0F8', surface: '#FFFFFF', ink: '#2A1B45', soft: '#665880', line: '#DFD5EC',
         accent: '#5B3A8C', accent2: '#B8933A', onAccent: '#FFFFFF' },
    f: { title: 'Nanum Myeongjo', body: 'Noto Sans KR', hand: 'Nanum Pen Script' } },
  { id: 'christmas', name: '성탄', note: '흰빛·금·붉은 · 성탄절',
    c: { bg: '#FFFDF8', surface: '#FFFFFF', ink: '#1E3A2F', soft: '#5A6B62', line: '#EEE5D0',
         accent: '#B02E2C', accent2: '#B8933A', onAccent: '#FFFFFF' },
    f: { title: 'Noto Serif KR', body: 'Noto Sans KR', hand: 'Nanum Pen Script' } },
  { id: 'harvest', name: '추수감사', note: '가을 들녘 · 감사 절기',
    c: { bg: '#FBF2E2', surface: '#FFF9EF', ink: '#43280F', soft: '#7E6247', line: '#EADBC0',
         accent: '#B5561A', accent2: '#6F7C26', onAccent: '#FFFFFF' },
    f: { title: 'Gowun Batang', body: 'Gowun Dodum', hand: 'Nanum Pen Script' } },
  { id: 'easter', name: '부활절', note: '흰 백합·봄빛',
    c: { bg: '#FFFFFF', surface: '#F7F4EA', ink: '#2A2A2A', soft: '#66625A', line: '#ECE7D8',
         accent: '#8F6A0C', accent2: '#5E8C43', onAccent: '#FFFFFF' },
    f: { title: 'Nanum Myeongjo', body: 'Noto Sans KR', hand: 'Nanum Pen Script' } },
  { id: 'pentecost', name: '성령강림', note: '붉은 불꽃 · 성령강림주일',
    c: { bg: '#FFF5F0', surface: '#FFFFFF', ink: '#3A1410', soft: '#7A524C', line: '#F2D9CF',
         accent: '#B8352A', accent2: '#D9791A', onAccent: '#FFFFFF' },
    f: { title: 'Noto Serif KR', body: 'Noto Sans KR', hand: 'Nanum Pen Script' } },
  { id: 'kids', name: '어린이', note: '하늘·햇살 · 교회학교',
    c: { bg: '#EAF6FD', surface: '#FFFFFF', ink: '#173A5E', soft: '#486A8A', line: '#CFE6F5',
         accent: '#1A72AF', accent2: '#F2B233', onAccent: '#FFFFFF' },
    f: { title: 'Jua', body: 'Gowun Dodum', hand: 'Nanum Pen Script' } },
  { id: 'youth', name: '청년', note: '밤·네온 · 청년부',
    c: { bg: '#111827', surface: '#1E293B', ink: '#F3F4F6', soft: '#A8B3C4', line: '#334155',
         accent: '#FF7A59', accent2: '#5FD3C4', onAccent: '#111827' },
    f: { title: 'Black Han Sans', body: 'Noto Sans KR', hand: 'Nanum Pen Script' } }
];

/* 크기 — w·h 는 화면 크기(CSS px), scale 은 그림으로 저장할 때 곱하는 배수.
   A4 794×1123 은 인쇄하면 정확히 A4 한 장이다. */
var DS_FORMATS = [
  { id: 'poster', name: 'A4 포스터', icon: '📄', w: 794, h: 1123, scale: 2, pages: 1, use: '게시판·출력' },
  { id: 'square', name: '카드뉴스', icon: '🟨', w: 540, h: 540, scale: 2, pages: 1, use: '단톡방·인스타 1:1' },
  { id: 'story', name: '휴대폰 세로', icon: '📱', w: 540, h: 960, scale: 2, pages: 1, use: '단톡방·스토리 9:16' },
  { id: 'slide', name: '예배 화면', icon: '🖥', w: 960, h: 540, scale: 2, pages: 4, use: '광고·찬양 슬라이드 16:9 · 여러 장' },
  { id: 'bulletin', name: '주보 표지', icon: '📰', w: 559, h: 794, scale: 3, pages: 1, use: 'A5 세로' },
  { id: 'banner', name: '현수막', icon: '🎌', w: 1100, h: 200, scale: 3, pages: 1, use: '가로 5.5:1' }
];

/* 교회력 → 어울리는 테마 (church-plan.html 의 주일 이름·강단색으로 고른다) */
function dsThemeForDay(name, altar) {
  var n = String(name || '');
  if (/추수감사/.test(n)) return 'harvest';
  if (/대림/.test(n)) return 'advent';
  if (/성탄/.test(n)) return 'christmas';
  if (/송년|송구영신|제야/.test(n)) return 'night';
  if (/부활/.test(n)) return 'easter';
  if (/성령강림주일/.test(n)) return 'pentecost';
  if (/어린이|교회학교|성탄 발표/.test(n)) return 'kids';
  if (/청년/.test(n)) return 'youth';
  if (altar === 'purple') return 'advent';
  if (altar === 'white') return 'christmas';
  if (altar === 'red') return 'pentecost';
  if (altar === 'green') return 'garden';
  return 'dongsan';
}

function dsTheme(id) { for (var i = 0; i < DS_THEMES.length; i++) if (DS_THEMES[i].id === id) return DS_THEMES[i]; return DS_THEMES[0]; }
function dsFormat(id) { for (var i = 0; i < DS_FORMATS.length; i++) if (DS_FORMATS[i].id === id) return DS_FORMATS[i]; return DS_FORMATS[0]; }

/* 테마 → CSS 변수 */
function dsVars(theme) {
  var c = theme.c, f = theme.f;
  return ':root{--bg:' + c.bg + ';--surface:' + c.surface + ';--ink:' + c.ink + ';--soft:' + c.soft +
    ';--line:' + c.line + ';--accent:' + c.accent + ';--accent2:' + c.accent2 + ';--on-accent:' + c.onAccent +
    ";--font-title:'" + f.title + "',serif;--font-body:'" + f.body + "',sans-serif;--font-hand:'" + f.hand + "',cursive}";
}

function dsFontLink(theme) {
  var seen = {}, fam = [];
  [theme.f.title, theme.f.body, theme.f.hand].forEach(function (n) {
    if (!seen[n] && DS_FONTS[n]) { seen[n] = 1; fam.push('family=' + DS_FONTS[n]); }
  });
  return 'https://fonts.googleapis.com/css2?' + fam.join('&') + '&display=swap';
}

/* AI 가 만든 조각을 안전하게 걸러 낸다 — 스크립트·외부 연결·이벤트 속성은 지운다.
   미리보기는 CSP 로도 막지만, 내려받은 HTML 파일에도 남지 않게 여기서 지운다. */
function dsSanitize(html) {
  var s = String(html || '');
  var m = s.match(/```(?:html)?\s*([\s\S]*?)(?:```|$)/i);
  if (m && /<section|<style/i.test(m[1])) s = m[1];
  var doc = new DOMParser().parseFromString('<!doctype html><html><body>' + s + '</body></html>', 'text/html');
  var bad = doc.querySelectorAll('script,iframe,frame,object,embed,link,meta,base,form,input,button,textarea,select,video,audio,source,track,noscript,template');
  for (var i = 0; i < bad.length; i++) bad[i].remove();
  var all = doc.body.querySelectorAll('*');
  for (var j = 0; j < all.length; j++) {
    var el = all[j], attrs = [].slice.call(el.attributes);
    attrs.forEach(function (a) {
      var n = a.name.toLowerCase(), v = a.value;
      if (/^on/.test(n)) el.removeAttribute(a.name);
      else if (/^(href|src|xlink:href|action|formaction|srcset)$/.test(n)) {
        if (/^\s*(javascript|vbscript):/i.test(v)) el.removeAttribute(a.name);
        else if (n !== 'href' && /^\s*(https?:)?\/\//i.test(v)) el.removeAttribute(a.name);   // 바깥 그림은 쓰지 않는다
      }
    });
  }
  var styles = doc.querySelectorAll('style');
  for (var k = 0; k < styles.length; k++) styles[k].textContent = styles[k].textContent.replace(/@import[^;]*;?/gi, '');
  /* 장 바깥에 붙은 설명 글("다음은 디자인입니다" 같은 것)은 버린다 */
  [].slice.call(doc.body.childNodes).forEach(function (n) {
    if (n.nodeType === 3 || n.nodeType === 8) { if (n.nodeType === 8 || n.textContent.trim()) n.remove(); return; }
    if (n.nodeType !== 1) return;
    var tag = n.nodeName.toLowerCase();
    if (tag === 'style' || tag === 'svg' || (n.classList && n.classList.contains('page')) || n.querySelector('.page')) return;
    n.remove();
  });
  return doc.body.innerHTML.trim();
}

/* 디자인 조각 → 완성된 HTML 문서 (미리보기·인쇄·내려받기 공용)
   opts.base: 로고 같은 교회 파일을 찾을 주소 · opts.preview: 장 사이를 띄운다 */
function dsDocument(fragment, themeId, formatId, opts) {
  opts = opts || {};
  var t = dsTheme(themeId), fm = dsFormat(formatId);
  var base = opts.base || '';
  var origin = '';
  try { origin = base ? new URL(base).origin : location.origin; } catch (e) { origin = ''; }
  var csp = "default-src 'none'; img-src 'self' " + origin + " data: blob:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:";
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta http-equiv="Content-Security-Policy" content="' + csp + '">' +
    (base ? '<base href="' + base + '">' : '') +
    '<title>' + DS_CHURCH.name + ' 디자인</title>' +
    '<link rel="stylesheet" href="' + dsFontLink(t) + '">' +
    '<style id="ds-vars">' + dsVars(t) + '</style>' +
    '<style id="ds-base">' +
    '*{box-sizing:border-box;margin:0;padding:0}' +
    'html,body{background:' + (opts.preview ? 'transparent' : t.c.bg) + '}' +
    'body{display:flex;flex-direction:column;align-items:flex-start;gap:' + (opts.preview ? 28 : 0) + 'px;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.page{width:' + fm.w + 'px;height:' + fm.h + 'px;flex:none;overflow:hidden;position:relative;background:var(--bg);color:var(--ink);' +
    'font-family:var(--font-body);word-break:keep-all;overflow-wrap:break-word;line-height:1.5;font-synthesis:none;container-type:size}' +
    '.page img{max-width:100%}' +
    '@page{size:' + fm.w + 'px ' + fm.h + 'px;margin:0}' +
    '@media print{body{gap:0;background:none}.page{break-after:page;page-break-after:always}.page:last-child{break-after:auto;page-break-after:auto}}' +
    '</style></head><body>' + (fragment || '') + '</body></html>';
}

/* AI 에게 주는 디자인 규칙 — 바뀌지 않는 부분이라 맨 앞(system)에 둔다 */
var DS_RULES = [
  '당신은 강원도 태백 ' + DS_CHURCH.name + '(' + DS_CHURCH.denom + ')의 전속 디자이너입니다.',
  '목사님이 한 줄로 부탁하면 교회 포스터·카드뉴스·예배 화면 슬라이드·주보 표지·현수막을 HTML+CSS 로 디자인합니다.',
  '',
  '## 출력 형식 (반드시 지킬 것)',
  '- 설명 없이 HTML 조각만 출력합니다. <html>·<head>·<body> 는 쓰지 않습니다.',
  '- 맨 앞에 <style> 하나, 그 뒤에 장마다 <section class="page"> 하나씩. 장 크기(가로×세로 px)는 요청에 적힌 대로 이미 고정되어 있으니 .page 의 width·height 는 다시 정하지 않습니다.',
  '- <script>, 이벤트 속성(onclick 등), 바깥 주소의 그림·글꼴·@import 는 쓰지 않습니다. 장식은 CSS 도형·그라데이션·인라인 SVG·유니코드 기호로 그립니다.',
  '- 교회 로고 그림을 쓸 수 있습니다: <img src="assets/logo/dongsan-logo.png" alt="동산감리교회"> (밝은 바탕용, 가로 776×세로 211 비율), 어두운 바탕에는 assets/logo/dongsan-logo-white.png. 로고는 장 아래쪽에 작게 한 번만.',
  '- 모든 요소는 장 안에 들어가야 합니다. 글자가 넘치거나 잘리면 안 됩니다. 긴 글은 줄이고 글자 크기를 맞춥니다.',
  '',
  '## 색과 글꼴 — 디자인 시스템 변수만 씁니다',
  '테마를 바꾸면 화면 전체가 같이 바뀌도록, 색과 글꼴은 아래 CSS 변수로만 씁니다. #색상값·rgb()·글꼴 이름을 직접 쓰지 않습니다.',
  '- var(--bg) 바탕 · var(--surface) 바탕 위 상자 · var(--ink) 글자 · var(--soft) 흐린 글자 · var(--line) 선',
  '- var(--accent) 대표색 · var(--accent2) 둘째 색 · var(--on-accent) 대표색 바탕 위 글자',
  '- var(--font-title) 제목 글꼴 · var(--font-body) 본문 글꼴 · var(--font-hand) 손글씨 포인트(짧게만)',
  '- 투명도가 필요하면 color-mix(in srgb, var(--accent) 20%, transparent) 처럼 섞어 씁니다. 흰색·검은색이 꼭 필요할 때만 #fff·#000 을 씁니다.',
  '',
  '## 한글 글자 다루기',
  '- 제목은 짧고 크게. 줄바꿈 자리는 <br> 로 직접 정해 낱말이 어색하게 끊기지 않게 합니다 (word-break:keep-all 이 이미 걸려 있습니다).',
  '- 본문 글자는 장 가로 폭의 2.6% 보다 작게 하지 않습니다 (어르신도 읽게). 줄 간격 1.5 이상.',
  '- 날짜·시간·장소는 한눈에 찾게 묶어서 보여 줍니다. 요일을 함께 씁니다 (예: 11월 1일(주일) 오전 11시).',
  '- 영어 장식 문구(WELCOME, Thanksgiving 등)는 목사님이 부탁하지 않으면 쓰지 않습니다.',
  '',
  '## 성경 인용',
  '- 큰따옴표 “ ” 안에는 개역개정 원문을 글자 그대로만 씁니다. 원문을 정확히 모르면 인용하지 말고 장·절만 쓰거나, 작은따옴표 ‘ ’ 로 풀어 쓴 말임을 드러냅니다.',
  '- 요청에 [정확한 본문] 이 주어지면 그 글을 바꾸지 않고 그대로 씁니다. 장·절 표기는 “요한복음 3:16” 꼴.',
  '',
  '## 피할 것 (흔한 AI 디자인 버릇)',
  '- 보라-파랑 그라데이션 배경, 모든 요소를 둥근 카드+그림자로 감싸기, 제목 옆 반짝이 이모지 줄줄이, 아무 뜻 없는 큰 숫자·통계, 장 전체를 똑같은 크기 글자로 채우기.',
  '- 장식이 글보다 눈에 띄면 안 됩니다. 한 장에 강조는 하나. 여백을 넉넉히.',
  '',
  '## 교회 정보 (필요할 때만 씁니다)',
  '- ' + DS_CHURCH.name + ' · ' + DS_CHURCH.denom + ' · 담임 ' + DS_CHURCH.pastor + ' · ' + DS_CHURCH.address,
  '- 표어: ' + DS_CHURCH.motto + ' (' + DS_CHURCH.mottoVerse + ')',
  '- 예배: ' + DS_CHURCH.worship.map(function (w) { return w[0] + ' ' + w[1].replace(/^(주일|수요일|금요일|월~금) /, ''); }).join(', '),
  '- 교회력: 추수감사주일은 11월 첫째 주일, 종교개혁주일은 10월 마지막 주일, 왕국주일은 대림절 바로 앞 주일, 송년주일은 12월 마지막 주일.',
  '- 요청에 없는 사람 이름·전화번호·계좌번호는 지어내지 않습니다. 모르는 정보는 비워 두지 말고 그 줄을 빼세요.'
].join('\n');

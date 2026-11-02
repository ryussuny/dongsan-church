/* ===========================================================
   함께 자라요 — 놀이마다 "무엇을 기르나" (실행기능·근거·화면 밖 놀이)

   ef      : 기르는 생각 힘 (G.EF 의 열쇠)
   basis   : 이 놀이가 따르는 치료 원리·연구 과제
   offline : 화면 없이 생활 속에서 같은 힘을 쓰는 놀이
             — 화면 놀이로 기른 힘은 그 놀이에만 좁게 옮겨지기 쉽다(Diamond & Ling 2016;
               Melby-Lervåg & Hulme 2013). 그래서 꼭 몸과 생활로 다시 해 본다.
   놀이 파일이 스스로 ef·basis 를 달았으면 그것을 그대로 두고, 없는 것만 채운다.
   =========================================================== */
(function () {
'use strict';
var G = window.G;

var MAP = {
  /* 말하기 */
  words:     { ef: ['attend'], basis: '모방·명명 — 부모 언어 자극(Hanen) 방식', offline: '밥 먹을 때 숟가락을 들고 "숟가락!" 하고 3초 기다리기. 아이가 소리만 내도 따라 말해 주기.' },
  listen:    { ef: ['attend', 'wm'], basis: '수용 어휘 과제(그림 어휘 검사 형식)', offline: '장난감 두세 개를 놓고 "공 어디 있어?" 찾기 놀이.' },
  sounds:    { ef: ['attend', 'wm'], basis: '의성어·의태어 — 초기 표현 어휘의 디딤돌', offline: '동물 그림책을 보며 "멍멍!" 소리 내고 아이 차례 기다리기.' },
  voice:     { ef: ['regulate', 'attend'], basis: '발성 유도·호흡 지지 — 소리를 눈으로 보여 주기', offline: '휴지 조각을 손바닥에 놓고 "아~" 길게 소리 내며 누가 오래 하나 놀이.' },
  mouth:     { ef: ['attend'], basis: '구강 운동 모방 — 언어치료 입 근육 놀이', offline: '양치 전 거울 앞에서 엄마와 "메롱·뽀뽀·빵빵" 따라 하기.' },
  follow:    { ef: ['wm', 'attend', 'plan'], basis: '지시 따르기 단계(1단계 → 속성 → 2단계 지시)', offline: '정리 시간에 "블록을 상자에 넣고, 손뼉 쳐!" 두 단계 심부름.' },
  syllable:  { ef: ['attend', 'wm'], basis: '음운 인식 — 음절 나누기(읽기 준비)', offline: '이름을 박수로 나눠 치기: "민-준" 짝짝.' },
  talkboard: { ef: ['regulate'], basis: '보완대체의사소통(AAC) 핵심 어휘판 — 말 발달을 막지 않고 돕는다', offline: '냉장고에 "물·우유·과자" 그림 카드를 붙여 손가락으로 가리켜 요청하게 하기.' },
  chat:      { ef: ['attend', 'inhibit'], basis: 'Hanen OWL(관찰·기다리기·듣기) + 확장하기', offline: '차 안에서 "빨강? 파랑?" 고르기 질문을 하고 대답에 한 낱말 더해 돌려주기.' },
  /* 손놀이 */
  trace:     { ef: ['attend', 'plan', 'inhibit'], basis: '시각-운동 통합(VMI) — 선 긋기 발달 순서(세로→가로→원→네모→세모)', offline: '쟁반에 소금·밀가루를 깔고 손가락으로 길 따라 그리기.' },
  dots:      { ef: ['plan', 'attend'], basis: '시각-운동 협응 + 수 순서', offline: '바닥에 숫자 쓴 종이를 놓고 1→2→3 순서로 밟기.' },
  pop:       { ef: ['attend', 'inhibit'], basis: '눈-손 협응 — 3단계는 Go/No-Go(참기) 규칙', offline: '비눗방울을 불어 주고 "빨간 컵 위 방울만 잡아!" 규칙 놀이.' },
  sort:      { ef: ['shift', 'attend'], basis: '분류하기 — 색 → 범주(규칙 바꾸기의 기초)', offline: '빨래 갤 때 양말은 여기, 수건은 저기 나누기.' },
  tilt:      { ef: ['plan', 'attend'], basis: '양손 협응·운동 계획(전정·고유수용 감각)', offline: '쟁반 위에 구슬을 올리고 기울여 컵에 넣기.' },
  scratch:   { ef: ['attend'], basis: '손가락 분리 운동·지속 동작', offline: '스크래치 종이나 김 서린 창문에 손가락 그림.' },
  puzzle:    { ef: ['plan', 'attend'], basis: '형태 지각·공간 관계(모양 맞추기 상자)', offline: '그릇 뚜껑 맞추기, 모양 맞추기 장난감.' },
  /* 몸놀이·쉬어가기 */
  move:      { ef: ['wm', 'plan'], basis: '운동 계획(실행) — 동작 모방, 대근육', offline: '"곰처럼 걸어서 소파까지!" 동물 흉내 이동 놀이.' },
  freeze:    { ef: ['inhibit', 'attend'], basis: '억제 조절 — 얼음 놀이(Tools of the Mind 활동)', offline: '노래 틀고 춤추다 멈추면 "얼음!" (엄마가 노래를 끈다).' },
  shake:     { ef: ['wm', 'attend'], basis: '리듬 모방 — 청각 작업기억·타이밍', offline: '냄비 뚜껑 북으로 엄마가 "둥둥둥" 치면 똑같이 따라 치기.' },
  breathe:   { ef: ['regulate'], basis: '복식 호흡 — 자기조절 전략(감정 조절 교육)', offline: '잠자기 전 배 위에 인형을 올리고 숨 쉴 때 오르내리는 것 보기.' },
  blow:      { ef: ['regulate', 'inhibit'], basis: '호흡 조절·입술 근육 — 언어치료 불기 활동', offline: '빨대로 탁구공 불어 굴리기, 생일 초 불기 연습.' },
  bubbles:   { ef: ['regulate'], basis: '감각 진정 — 예측 가능한 부드러운 자극', offline: '어두운 방에서 손전등 빛을 천천히 따라가기.' },
  /* 그리기 */
  draw:      { ef: ['plan', 'regulate'], basis: '미술치료 — 과정 중심 자유 표현', offline: '큰 종이를 바닥에 깔고 크레파스로 함께 그리며 "이야기해 줄래?" 묻기.' },
  mirror:    { ef: ['regulate', 'attend'], basis: '양측 협응·대칭, 만다라의 진정 효과', offline: '데칼코마니 — 종이 반쪽에 물감 짜고 접어 펼치기.' },
  color:     { ef: ['attend', 'plan'], basis: '소근육 조절·색 개념', offline: '색칠 공부 책 — 굵은 크레파스로 큰 칸부터.' },
  feeldraw:  { ef: ['regulate'], basis: '정서 표현 미술 — 감정에 이름 붙이기(affect labeling)', offline: '"오늘 마음은 무슨 색?" 색종이 고르기.' },
  /* 마음 */
  checkin:   { ef: ['regulate'], basis: '감정 알아차리기 — 이름 붙이면 가라앉는다', offline: '저녁 식탁에서 감정 얼굴 카드로 "오늘 기분" 하나씩 고르기.' },
  emotion:   { ef: ['attend'], basis: '얼굴 표정 재인(사회 인지)', offline: '그림책 속 인물 얼굴을 보며 "이 친구 기분은?" 묻기.' },
  situation: { ef: ['regulate', 'shift'], basis: '상황-감정 잇기, 마음 읽기의 기초', offline: '오늘 있었던 일을 말하며 "그때 어떤 기분이었어?" 묻기.' },
  facemirror:{ ef: ['attend', 'regulate'], basis: '표정 모방 — 거울 놀이', offline: '거울 앞에서 엄마와 번갈아 표정 짓고 맞히기.' },
  stories:   { ef: ['plan', 'regulate'], basis: '사회 이야기(Carol Gray) — 미리 보면 덜 불안하다', offline: '병원·미용실 가기 전날 이야기를 다시 읽고 인형으로 역할 놀이.' },
  /* 생각놀이 */
  match:     { ef: ['wm'], basis: '시각 작업기억 — 짝 맞추기', offline: '컵 세 개 중 하나에 과자 숨기고 섞은 뒤 찾기.' },
  same:      { ef: ['attend'], basis: '시각 변별·짝짓기', offline: '양말 짝 찾기 놀이.' },
  order:     { ef: ['plan', 'wm'], basis: '순서화 — 일과·원인과 결과 이해', offline: '손 씻기 순서 그림을 세면대 옆에 붙이고 하나씩 짚으며 하기.' },
  count:     { ef: ['attend', 'wm'], basis: '하나씩 짚어 세기(일대일 대응) → 수량', offline: '계단을 오르며 "하나, 둘, 셋" 세기, 귤 나눠 세기.' },
  shape:     { ef: ['attend', 'shift'], basis: '모양·색 개념 — 두 성질 함께 보기', offline: '장보기 때 "빨간 동그라미 찾아봐!"' },
  odd:       { ef: ['shift'], basis: '범주화 — 다른 하나 찾기', offline: '과일 바구니에 장난감 자동차를 몰래 넣고 "이상한 거 찾아!"' },
  big:       { ef: ['attend'], basis: '크기·양 비교 개념', offline: '아빠 신발과 아이 신발 나란히 놓고 "큰 거 줘!"' },
  /* 생각 힘 — 놀이 파일이 ef·basis 를 직접 달았다. 여기서는 화면 밖 놀이만 더한다 */
  simon:     { ef: ['wm'], offline: '엄마가 "코, 귀, 배꼽" 차례로 짚으면 아이가 똑같은 순서로 짚기. 맞히면 하나씩 늘리기.' },
  daynight:  { ef: ['inhibit'], offline: '"반대로 말하기" — 엄마가 "크게!" 하면 작게, "빨리!" 하면 천천히 걷기.' },
  switch:    { ef: ['shift'], offline: '장난감 정리를 "색깔대로" 하다가 "이번엔 종류대로!" 규칙 바꾸기.' },
  gonogo:    { ef: ['inhibit', 'attend'], offline: '"가위바위보 중 보만 나오면 박수!" 또는 "동물 이름이 나오면 점프, 과일이면 가만히".' },
  findall:   { ef: ['attend'], offline: '거실에서 "빨간 것 세 개 찾아 와!" 보물찾기, 그림책 속 숨은 그림 찾기.' },
  maze:      { ef: ['plan'], offline: '방석·베개로 거실에 길을 만들고 "어떻게 갈지 먼저 손가락으로 가리켜 봐" 한 뒤 출발.' },
  wait:      { ef: ['inhibit', 'regulate'], offline: '간식 앞에서 모래시계(30초) 기다리기 — 기다리는 동안 노래 부르기·손 무릎에 두기 같이 하기.' },
  opposite:  { ef: ['inhibit', 'wm'], offline: '"머리 하면 발, 발 하면 머리" 몸으로 하는 반대 놀이를 산책·목욕 때.' },
  /* 도구 */
  schedule:  { ef: ['plan', 'regulate'], basis: '시각 일정표 — 예측 가능하면 불안과 전환 어려움이 준다(TEACCH·긍정적 행동 지원)', offline: '하루 일과 그림을 냉장고에 붙이고 끝난 것은 떼어 상자에 넣기.' },
  timer:     { ef: ['inhibit', 'regulate'], basis: '시각 타이머 — 기다리기와 전환 돕기', offline: '모래시계나 부엌 타이머로 "이게 다 내려가면 놀이터!"' },
  gallery:   { ef: ['regulate'], basis: '작품 돌아보기 — 자기 효능감', offline: '그림을 냉장고에 붙이고 가족에게 설명하게 하기.' }
};

/* 단계마다 기르는 힘이 다른 놀이 — 1단계가 '규칙 익히기'(갈등 없음)인 놀이는 1단계를 주의 집중으로만 센다.
   warm: 1단계를 한 판만 잘해도 진짜 연습(2단계)으로 올린다. */
var BY_LEVEL = {
  daynight: { warm: true, efLv: { 1: ['attend'] } },
  opposite: { warm: true, efLv: { 1: ['attend', 'wm'] } },
  switch:   { warm: true, efLv: { 1: ['attend'] } },
  maze:     { efLv: { 1: ['attend'], 2: ['attend', 'plan'] } },
  pop:      { efLv: { 1: ['attend'], 2: ['attend'] } }
};
/* 맞고 틀림이 없는 자유 놀이 — 한 칸에서 한 번 하면 한 칸 (한 단계에 세 번).
   shake 는 1단계(자유 흔들기)만 맞고 틀림이 없다 — 맞고 틀림이 있는 단계에서는 결과로 칸을 정하니 1단계에 갇히지 않는다 */
var FREE = ['draw', 'mirror', 'color', 'feeldraw', 'shake'];

G.EF_MAP = MAP;
Object.keys(G.acts).forEach(function (id) {
  var a = G.acts[id], m = MAP[id]; if (!m) return;
  if (!a.ef || !a.ef.length) a.ef = m.ef;
  if (!a.basis) a.basis = m.basis;
  if (!a.offline) a.offline = m.offline;
});
Object.keys(BY_LEVEL).forEach(function (id) { var a = G.acts[id]; if (a) { if (BY_LEVEL[id].warm) a.warm = true; a.efLv = BY_LEVEL[id].efLv; } });
FREE.forEach(function (id) { if (G.acts[id]) G.acts[id].autoLevel = true; });
/* 이 판(단계)에서 실제로 쓴 생각 힘 */
G.efOf = function (id, lv) { var a = G.acts[id]; if (!a) return []; return (a.efLv && a.efLv[lv]) || a.ef || []; };

/* 이 앱이 지키는 치료 원리 — 부모 화면 「치료 원리」와 안내 문서에 같이 쓴다 */
G.PRINCIPLES = [
  { e: '🌱', t: '실패 없는 배움', d: '아이 화면에는 "틀렸어"가 없어요. 두 번 어려우면 정답이 반짝여 알려 주고, 맞히면 바로 칭찬해요(무오류 학습).' },
  { e: '📶', t: '딱 알맞은 어려움', d: '같은 단계에서 끝까지 한 세 판을 모아 85% 넘으면 올리고, 한 판이라도 40% 밑이면 바로 내려요. 중간에 그만둔 판은 세지 않아요. 쉬워서 지루하지도, 어려워서 포기하지도 않게(근접발달영역).' },
  { e: '🤫', t: '아이 차례 기다리기', d: '자비스가 듣고 있을 때(🎤 빨간불)는 아이 차례예요. 부모님은 5초쯤 조용히 기다려 주세요. 대신 말해 주면 아이가 말할 기회가 사라지고, 기록에도 부모님 말이 섞여요.' },
  { e: '💬', t: '언제든 "그만·도와줘·쉬고 싶어"', d: '놀이 화면의 💬 를 누르면 아이가 그림으로 마음을 말할 수 있어요. 말로 하기 어려운 아이가 떼 대신 요청하는 법을 배워요.' },
  { e: '⏱️', t: '짧게, 자주', d: '놀이 하나 1~4분, 하루 10~20분. 매일 조금씩이 가끔 오래보다 좋아요.' },
  { e: '👨‍👩‍👦', t: '함께 하기', d: '화면은 부모와 아이 사이에 놓는 장난감이에요. 놀이 중 💡 를 누르면 함께 노는 법이 나와요(공동 주의).' },
  { e: '🏠', t: '생활로 옮기기', d: '화면 놀이로 기른 힘은 좁게 옮겨져요. 그래서 놀이마다 "화면 밖 놀이"를 붙였어요. 이것이 진짜 치료 효과를 만들어요.' },
  { e: '🙋', t: '스스로 고르기', d: '오늘의 놀이는 둘 중 아이가 골라요. 스스로 고르면 더 즐겁게, 더 오래 참여해요.' },
  { e: '💗', t: '마음이 먼저', d: '기분 묻기에서 슬퍼요·화나요·무서워요를 고르면 그날은 편한 놀이 하나와 쉬어가기만 해요. 마음이 가라앉아야 배울 수 있어요.' },
  { e: '🎉', t: '즐거움이 먼저', d: '스티커, 자라는 나무, 자비스의 칭찬. 놀이가 즐거워야 뇌가 배워요.' },
  { e: '🌿', t: '감각 친화', d: '부드러운 소리, 감각 예민 모드(소리·반짝임 줄이기), 놀이 끝은 늘 쉬어가기로.' },
  { e: '📵', t: '화면 시간 지키기', d: 'WHO·미국소아과학회: 2~5세는 하루 1시간 이하, 어른과 함께. 오늘의 놀이가 끝나면 자비스가 "이제 몸으로 놀자"고 말해요.' },
  { e: '🧑‍⚕️', t: '치료사와 한 팀', d: '이 앱은 치료를 대신하지 않아요. 리포트를 선생님께 보여 드리고, 선생님이 정한 목표에 맞춰 단계와 놀이를 고르세요.' }
];
})();

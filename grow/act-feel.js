/* ===========================================================
   함께 자라요 — 마음 (사회·정서: 감정·관계·이야기)

     checkin     오늘 기분        오늘의 놀이 첫 칸 — 기분 고르기, 힘든 마음엔 진정 방법 고르기
     emotion     감정 찾기        "기쁜 얼굴을 찾아봐" — 표정 읽기 + 몸 신호 (4·5단계는 걱정·신남·실망 같은 마음 낱말)
                                  6 몸 신호로 마음 읽기 · 7·8 복잡한 마음(뿌듯·부러움·서운·억울·미안·안심)
                                  9 마음의 크기(조금/아주 많이) · 10 두 마음이 함께
     situation   이럴 땐 어떤 기분? 상황 → 감정, 그리고 마음을 말로 하는 법
                                  6·7 복잡한 마음 이야기 · 8 같은 일, 다른 마음(나와 친구)
                                  9 마음 + 좋은 방법 고르기 · 10 친구 마음 + 해 줄 말 고르기
     facemirror  표정 따라 하기   앞 카메라 거울 + 부모 판정 (카메라 없어도 된다)
     stories     사회 이야기      병원·미용실·차례 기다리기… 미리 보면 덜 불안하다

   ▸ 아이가 고른 기분은 고치지 않는다 — "그랬구나" 하고 받아 준다.
   ▸ 맞고 틀림이 있는 놀이(emotion·situation·facemirror)만 ctx.trial 을 쓴다.
     처음 틀리면 한 번만 기록하고, 두 번째에는 정답이 빛난다(실패 없는 배움).
   ▸ checkin 은 ctx.extra.emo 에 기분을 남긴다 → 부모 화면 「기분 체크」.
   =========================================================== */
(function () {
'use strict';
var G = window.G, D = window.GD;
if (!G || !D) return;

/* ---------- 마음 낱말 ---------- */
var ADJ = { happy: '기쁜', sad: '슬픈', angry: '화난', scared: '무서운', surprised: '놀란', sleepy: '졸린', calm: '편안한', hurt: '아픈', love: '사랑하는', shy: '부끄러운',
  worried: '걱정되는', excited: '신나는', curious: '궁금한', disappointed: '실망한', embarrassed: '당황한', bored: '심심한',
  proud: '뿌듯한', envious: '부러운', hurtfeel: '서운한', unfair: '억울한', sorry: '미안한', relieved: '안심되는' };
var WHEN = { happy: '기쁠 땐', sad: '슬플 땐', angry: '화날 땐', scared: '무서울 땐', surprised: '놀랄 땐', sleepy: '졸릴 땐', calm: '편안할 땐', hurt: '아플 땐', love: '사랑할 땐', shy: '부끄러울 땐',
  worried: '걱정될 땐', excited: '신날 땐', curious: '궁금할 땐', disappointed: '실망했을 땐', embarrassed: '당황했을 땐', bored: '심심할 땐',
  proud: '뿌듯할 땐', envious: '부러울 땐', hurtfeel: '서운할 땐', unfair: '억울할 땐', sorry: '미안할 땐', relieved: '안심될 땐' };
/* 4·5단계 마음 낱말 — 초등 중학년이 배우는 조금 더 섬세한 기분 (D.EMOTIONS 와 같은 꼴, 감정 찾기·이럴 땐 어떤 기분에만 쓴다) */
var EMO_MORE = [
  { id: 'worried', name: '걱정돼요', e: '😟', col: '#7986cb', body: '눈썹이 가운데로 모이고 손을 만지작거려요', lv: 4 },
  { id: 'excited', name: '신나요', e: '🤩', col: '#ffb300', body: '눈이 반짝이고 몸이 들썩들썩해요', lv: 4 },
  { id: 'curious', name: '궁금해요', e: '🤔', col: '#4db6ac', body: '고개를 갸웃하고 손을 턱에 대요', lv: 4 },
  { id: 'disappointed', name: '실망했어요', e: '😞', col: '#78909c', body: '어깨가 축 처지고 고개가 숙여져요', lv: 5 },
  { id: 'embarrassed', name: '당황했어요', e: '😅', col: '#ff8a65', body: '얼굴이 화끈하고 머리를 긁적여요', lv: 5 },
  { id: 'bored', name: '심심해요', e: '😑', col: '#bcaaa4', body: '표정이 없어지고 몸이 축 늘어져요', lv: 5 }
];
/* 4·5단계 이야기 */
var SIT_MORE = [
  { e: '📝', t: '내일 받아쓰기 시험이 있어요', a: 'worried', lv: 4 },
  { e: '🎒', t: '준비물을 집에 두고 왔어요', a: 'worried', lv: 4 },
  { e: '🤒', t: '동생이 열이 나서 누워 있어요', a: 'worried', lv: 4 },
  { e: '🎢', t: '내일 놀이공원에 가기로 했어요', a: 'excited', lv: 4 },
  { e: '⚽', t: '친구들과 운동장에서 축구를 해요', a: 'excited', lv: 4 },
  { e: '📦', t: '문 앞에 커다란 상자가 와 있어요', a: 'curious', lv: 4 },
  { e: '🥚', t: '알이 톡톡 흔들려요. 안에 누가 있는지 보고 싶어요', a: 'curious', lv: 4 },
  { e: '🌧️', t: '소풍 가는 날 비가 와서 못 가게 됐어요', a: 'disappointed', lv: 5 },
  { e: '🍰', t: '케이크를 나눴는데 내 조각만 작아요', a: 'disappointed', lv: 5 },
  { e: '👕', t: '친구들 앞에서 옷을 거꾸로 입은 걸 알았어요', a: 'embarrassed', lv: 5 },
  { e: '🙋', t: '발표하다가 할 말을 깜빡 잊었어요', a: 'embarrassed', lv: 5 },
  { e: '🪟', t: '비 오는 날 집에서 할 일이 없어요', a: 'bored', lv: 5 },
  { e: '🚗', t: '차를 오래오래 타고 가요. 할 게 없어요', a: 'bored', lv: 5 }
];
/* 6~10단계 복잡한 마음 낱말 — lv 6: 뿌듯·부러움·서운, lv 7: 억울·미안·안심.
   이럴 땐 어떤 기분은 6·7단계에, 감정 찾기는 7·8단계에 나온다(wordLv). 얼굴만으로는 헷갈려서 이름과 몸 신호로 읽는다 */
var EMO_DEEP = [
  { id: 'proud', name: '뿌듯해요', e: '😊', col: '#ffca28', body: '가슴을 쭉 펴고 어깨가 으쓱해요', lv: 6 },
  { id: 'envious', name: '부러워요', e: '🥺', col: '#aed581', body: '친구 것을 자꾸 쳐다보며 나도 갖고 싶어요', lv: 6 },
  { id: 'hurtfeel', name: '서운해요', e: '😔', col: '#90caf9', body: '입이 삐죽 나오고 고개를 홱 돌려요', lv: 6 },
  { id: 'unfair', name: '억울해요', e: '😣', col: '#e57373', body: '주먹을 꼭 쥐고 "내가 안 그랬는데!" 하고 외치고 싶어요', lv: 7 },
  { id: 'sorry', name: '미안해요', e: '🙇', col: '#b39ddb', body: '고개를 숙이고 친구 얼굴을 살짝 살펴요', lv: 7 },
  { id: 'relieved', name: '안심돼요', e: '😮‍💨', col: '#80cbc4', body: '휴~ 하고 숨이 나오고 어깨가 스르르 풀려요', lv: 7 }
];
/* 6·7단계 이야기 (복잡한 마음) — not: 이 이야기에선 보기로 내지 않을 기분(답과 헷갈릴 수 있는 것) */
var SIT_DEEP = [
  { e: '💯', t: '받아쓰기에서 100점을 받았어요', a: 'proud', lv: 6 },
  { e: '🧩', t: '어려운 퍼즐을 혼자 힘으로 다 맞췄어요', a: 'proud', lv: 6 },
  { e: '👟', t: '처음으로 혼자 신발 끈을 묶었어요', a: 'proud', lv: 6 },
  { e: '🚲', t: '친구가 멋진 새 자전거를 타고 왔어요. 나도 타 보고 싶어요', a: 'envious', lv: 6, not: ['excited'] },
  { e: '✏️', t: '짝꿍 필통에 반짝이는 로봇 연필이 있어요. 나는 없어요', a: 'envious', lv: 6 },
  { e: '🍭', t: '형만 사탕을 두 개 받았어요. 나도 두 개 먹고 싶어요', a: 'envious', lv: 6 },
  { e: '🧒', t: '단짝 친구가 오늘은 다른 친구하고만 놀았어요', a: 'hurtfeel', lv: 6 },
  { e: '🖼️', t: '열심히 그린 그림을 보여 드렸는데 아빠가 바빠서 못 보셨어요', a: 'hurtfeel', lv: 6 },
  { e: '🎂', t: '친구들이 내 생일을 깜빡 잊었어요', a: 'hurtfeel', lv: 6 },
  { e: '🏺', t: '꽃병을 깬 건 고양이인데 내가 꾸중을 들었어요', a: 'unfair', lv: 7 },
  { e: '🍪', t: '동생이 과자를 먹고는 내가 먹었다고 했어요', a: 'unfair', lv: 7 },
  { e: '🧹', t: '동생이랑 같이 어지른 방을 나 혼자 치우래요', a: 'unfair', lv: 7 },
  { e: '🥛', t: '내가 친구 우유를 쏟아서 친구 옷이 젖었어요', a: 'sorry', lv: 7, not: ['surprised'] },
  { e: '📢', t: '화가 나서 동생한테 큰 소리를 쳤더니 동생이 울어요', a: 'sorry', lv: 7, not: ['angry'] },
  { e: '🧸', t: '친구 장난감을 빌렸다가 망가뜨렸어요', a: 'sorry', lv: 7 },
  { e: '🎒', t: '잃어버린 줄 알았던 가방을 찾았어요', a: 'relieved', lv: 7 },
  { e: '💉', t: '주사를 맞았는데 생각보다 하나도 안 아팠어요', a: 'relieved', lv: 7 },
  { e: '🐕', t: '집을 나간 강아지가 저녁에 꼬리를 흔들며 돌아왔어요', a: 'relieved', lv: 7, not: ['excited', 'surprised'] }
];
function allEmo() { return D.EMOTIONS.concat(EMO_MORE, EMO_DEEP); }
function allSit() { return D.SITUATIONS.concat(SIT_MORE, SIT_DEEP); }
var HARD = { sad: 1, angry: 1, scared: 1, hurt: 1 };
/* 마음을 말로 — 이럴 땐 이렇게 해요 */
var COPE = {
  happy: '기쁠 땐 활짝 웃고 "좋아요!" 하고 말해요.',
  sad: '슬플 땐 엄마한테 "슬퍼요" 하고 말해요. 꼭 안아 줄 거예요.',
  angry: '화날 땐 멈추고 후~ 숨을 쉬어요. 그리고 "화났어요" 하고 말해요.',
  scared: '무서울 땐 엄마 손을 꼭 잡아요. "무서워요" 하고 말해도 돼요.',
  surprised: '깜짝 놀랐을 땐 숨을 한 번 쉬고 "깜짝이야!" 하고 말해요.',
  sleepy: '졸릴 땐 "졸려요" 하고 말하고 코~ 쉬어요.',
  calm: '편안할 땐 몸이 말랑말랑해요. 이 기분을 기억해요.',
  hurt: '아플 땐 "아파요" 하고 말하고 아픈 곳을 손으로 알려 줘요.',
  love: '사랑할 땐 "사랑해요" 하고 말하고 꼭 안아 줘요.',
  shy: '부끄러울 땐 엄마 뒤에 잠깐 숨어도 괜찮아요. 준비되면 "안녕" 해요.',
  worried: '걱정될 땐 엄마 아빠한테 "걱정돼요" 하고 말해요. 같이 방법을 찾을 수 있어요.',
  excited: '신날 땐 "신나요!" 하고 말해요. 너무 들뜨면 숨을 한 번 크게 쉬어요.',
  curious: '궁금할 땐 "이게 뭐예요?" 하고 물어봐요.',
  disappointed: '실망했을 땐 "아쉬워요" 하고 말해요. 다음에 할 수 있는 걸 같이 찾아봐요.',
  embarrassed: '당황했을 땐 숨을 한 번 쉬고 "괜찮아" 하고 다시 해 봐요.',
  bored: '심심할 땐 "뭐 하고 놀까요?" 하고 물어보거나 좋아하는 놀이를 골라요.',
  proud: '뿌듯할 땐 "내가 해냈어!" 하고 말해요. 애쓴 나를 칭찬해 줘요.',
  envious: '부러울 땐 "나도 해 보고 싶다" 하고 말해요. 친구에게 "멋지다!" 하고 말해 줄 수도 있어요.',
  hurtfeel: '서운할 땐 "나도 같이 하고 싶었어" 하고 마음을 말해요.',
  unfair: '억울할 땐 숨을 한 번 쉬고 "제 말도 들어 주세요" 하고 차분히 말해요.',
  sorry: '미안할 땐 "미안해" 하고 말하고, 도와줄 일을 찾아요.',
  relieved: '안심될 땐 휴~ 숨을 쉬고 "다행이다!" 하고 말해요.'
};
/* 헷갈리기 쉬운 기분끼리는 같은 문제에 내지 않는다 */
var CLOSE = { angry: ['sad'], sad: ['angry', 'hurt'], scared: ['surprised'], surprised: ['scared', 'happy'], happy: ['love', 'surprised', 'calm'],
  love: ['happy', 'calm'], calm: ['happy', 'love', 'sleepy'], hurt: ['sad'], sleepy: ['calm'], shy: [],
  worried: ['scared', 'sad', 'embarrassed'], excited: ['happy', 'surprised', 'love'], curious: ['surprised', 'excited'],
  disappointed: ['sad', 'worried', 'bored'], embarrassed: ['shy', 'worried', 'surprised'], bored: ['sleepy', 'calm', 'disappointed'],
  proud: ['happy', 'excited', 'calm', 'love', 'relieved'], envious: ['disappointed', 'sad', 'angry', 'curious', 'hurtfeel', 'unfair'],
  hurtfeel: ['sad', 'disappointed', 'angry', 'bored', 'envious', 'unfair'], unfair: ['angry', 'sad', 'disappointed', 'hurtfeel', 'envious'],
  sorry: ['embarrassed', 'worried', 'sad', 'shy', 'scared'], relieved: ['calm', 'happy', 'sleepy', 'love', 'proud'] };
/* 새 마음 낱말 쪽에서도 헷갈리는 짝이 보이게 (3단계까지의 짝은 그대로 두고, 새 낱말만 더한다) */
Object.keys(CLOSE).forEach(function (id) {
  if (!EMO_MORE.some(function (e) { return e.id === id; })) return;
  CLOSE[id].forEach(function (o) { if (CLOSE[o] && CLOSE[o].indexOf(id) < 0) CLOSE[o] = CLOSE[o].concat(id); });
});
/* 6~10단계 낱말도 같은 방법으로 (1~5단계 문제에는 이 낱말이 없어 아무 영향이 없다) */
EMO_DEEP.forEach(function (d) {
  CLOSE[d.id].forEach(function (o) { if (CLOSE[o] && CLOSE[o].indexOf(d.id) < 0) CLOSE[o] = CLOSE[o].concat(d.id); });
});
function near(a, b) { return (CLOSE[a.id] || []).indexOf(b.id) >= 0; }

/* 몸 신호 둘째 말 — 6단계부터 같은 마음도 다른 몸짓으로 읽어 본다 */
var BODY2 = {
  happy: '폴짝폴짝 뛰면서 싱글벙글 웃어요', sad: '훌쩍훌쩍 눈물이 나고 혼자 있고 싶어요', angry: '얼굴이 빨개지고 씩씩 숨이 거칠어져요',
  scared: '몸이 덜덜 떨리고 눈을 꼭 감아요', surprised: '"앗!" 하고 몸이 움찔해요', sleepy: '눈꺼풀이 무겁고 고개가 꾸벅꾸벅해요',
  calm: '몸에 힘이 빠지고 마음이 잔잔해요', hurt: '"아야!" 하고 다친 곳을 호호 불어요', love: '두 팔을 벌려 꼭 안아 주고 싶어요',
  shy: '고개를 푹 숙이고 작은 목소리로 말해요', worried: '자꾸 그 일이 생각나서 잠이 잘 안 와요', excited: '가만히 있기 힘들고 자꾸 웃음이 나와요',
  curious: '눈을 크게 뜨고 가까이 다가가서 살펴봐요', disappointed: '"에이…" 하고 힘이 쭉 빠져요', embarrassed: '"어머, 어떡해!" 하고 얼굴이 빨개져요',
  bored: '하품이 나고 시계만 자꾸 쳐다봐요', proud: '"내가 해냈어!" 하고 자랑하고 싶어요', envious: '"나도 저거 있으면 좋겠다" 하고 생각해요',
  hurtfeel: '나만 빼고 노는 것 같아 마음이 쓸쓸해요', unfair: '내 말은 안 들어 주는 것 같아 눈물이 날 것 같아요',
  sorry: '"내가 잘못했어" 하고 말하고 싶어요', relieved: '"이제 됐다!" 하고 가슴을 쓸어내려요'
};
/* 9단계 마음의 크기 — 같은 마음도 조금/아주 많이 (마음 온도계) */
var SIZE = [
  { id: 'happy', f: ['🙂', '😄', '😆'], adj: ['조금 기쁜', '기쁜', '아주 많이 기쁜'], name: ['조금 기뻐요', '기뻐요', '아주 많이 기뻐요'],
    tip: ['조금 기쁠 땐 살짝 미소가 나와요.', '아주 많이 기쁘면 하하 웃으며 폴짝폴짝 뛰어요.'] },
  { id: 'sad', f: ['🙁', '😢', '😭'], adj: ['조금 슬픈', '슬픈', '아주 많이 슬픈'], name: ['조금 슬퍼요', '슬퍼요', '아주 많이 슬퍼요'],
    tip: ['조금 슬플 땐 입꼬리가 살짝 내려가요.', '아주 많이 슬프면 엉엉 울어요. 그럴 땐 "안아 주세요" 하고 말해요.'] },
  { id: 'angry', f: ['😒', '😠', '😡'], adj: ['조금 화난', '화난', '아주 많이 화난'], name: ['조금 화나요', '화나요', '아주 많이 화나요'],
    tip: ['조금 화날 땐 입이 삐죽 나와요.', '아주 많이 화나면 얼굴이 빨개져요. 그럴 땐 멈추고 숨을 후~ 쉬어요.'] },
  { id: 'scared', f: ['😟', '😨', '😰'], adj: ['조금 무서운', '무서운', '아주 많이 무서운'], name: ['조금 무서워요', '무서워요', '아주 많이 무서워요'],
    tip: ['조금 무서울 땐 몸이 살짝 움츠러들어요.', '아주 많이 무서우면 몸이 덜덜 떨려요. 그럴 땐 어른 손을 꼭 잡아요.'] }
];
/* 10단계 두 마음 — 한 가지 일에 마음이 두 개 */
var TWO = [
  { e: '🎢', t: '롤러코스터 앞이에요. 가슴이 콩닥콩닥하지만 빨리 타 보고 싶어요', a: ['scared', 'excited'] },
  { e: '🚚', t: '새집으로 이사 가요. 내 방이 생기지만 옆집 친구와 헤어져요', a: ['happy', 'sad'] },
  { e: '🥈', t: '달리기에서 2등 상을 받아 어깨가 으쓱해요. 그런데 1등을 못 해서 "에이…" 했어요', a: ['proud', 'disappointed'] },
  { e: '🎁', t: '동생이 생일 선물을 받았어요. 축하해 주고 싶은데, 나도 갖고 싶어요', a: ['happy', 'envious'] },
  { e: '🦷', t: '흔들리던 이가 쏙 빠졌어요. 피가 나서 깜짝 놀랐지만, 이제 안 흔들려서 휴~ 했어요', a: ['surprised', 'relieved'], not: ['hurt'] },
  { e: '🐶', t: '강아지가 너무 귀여워요. 그런데 내 신발을 물어뜯어 놓았어요', a: ['love', 'angry'] },
  { e: '🎤', t: '무대에 서기 전에 손이 떨려요. 그런데 엄마가 손을 흔들어 주셔서 웃음이 나요', a: ['worried', 'happy'] },
  { e: '🧸', t: '친구 장난감을 망가뜨려 고개가 숙여져요. 그런데 친구가 "괜찮아" 해 줘서 휴~ 했어요', a: ['sorry', 'relieved'] },
  { e: '🏫', t: '새 반 친구들은 어떤 아이들일까 알고 싶은데, 얼굴이 빨개지고 말이 잘 안 나와요', a: ['curious', 'shy'], not: ['worried', 'scared'] }
];
/* 이럴 땐 어떤 기분 8단계 — 같은 일, 다른 마음 (나와 다른 사람의 마음 읽기). who: [누구, 기분, 보기로 안 낼 기분] */
var PERSP = [
  { e: '🏃', t: '달리기 시합에서 내가 이기고 친구는 졌어요', who: [['나', 'proud'], ['친구', 'disappointed', ['angry']]] },
  { e: '🌧️', t: '비가 와서 소풍이 미뤄졌어요. 밭에 물이 필요했던 농부 할아버지도 이 비를 봐요', who: [['나', 'disappointed', ['angry']], ['농부 할아버지', 'happy']] },
  { e: '🧱', t: '동생이 실수로 내 블록 성을 무너뜨렸어요', who: [['나', 'angry', ['disappointed']], ['동생', 'sorry', ['surprised']]] },
  { e: '👛', t: '길에서 주운 지갑을 주인 아주머니께 돌려 드렸어요', who: [['나', 'proud'], ['아주머니', 'relieved', ['surprised']]] },
  { e: '🏅', t: '내가 반 대표로 뽑혔어요. 대표가 되고 싶던 친구는 뽑히지 못했어요', who: [['나', 'happy'], ['친구', 'envious']] },
  { e: '🎮', t: '형이 새 게임기를 선물 받았어요. 나는 다음 생일까지 기다려야 해요', who: [['형', 'excited'], ['나', 'envious']] },
  { e: '🐕', t: '나는 큰 개와 신나게 공놀이를 해요. 동생은 엄마 뒤로 쏙 숨었어요', who: [['나', 'excited'], ['동생', 'scared', ['shy']]] }
];
/* 9단계 — 마음을 알고, 좋은 방법 고르기 (fix[0] 이 좋은 방법) */
var FIX = [
  { e: '📝', t: '내일 받아쓰기 시험이 있어요', a: 'worried', fix: ['오늘 저녁에 한 번 더 연습해요', '걱정만 하다가 그냥 자요', '학교에 안 가겠다고 떼를 써요'] },
  { e: '🧱', t: '열심히 쌓은 블록이 와르르 무너졌어요', a: 'angry', not: ['sad', 'disappointed'], fix: ['숨을 후~ 쉬고 다시 쌓아요', '블록을 휙 던져요', '다시는 안 한다고 소리쳐요'] },
  { e: '🎒', t: '준비물을 집에 두고 학교에 왔어요', a: 'worried', fix: ['선생님께 말씀드리고 도움을 청해요', '아무 말 없이 그냥 앉아 있어요', '집에 가겠다고 울어요'] },
  { e: '⚽', t: '친구들이 놀이에 끼워 주지 않아요', a: 'hurtfeel', fix: ['"나도 같이 해도 돼?" 하고 물어봐요', '공을 뺏어서 도망가요', '발을 쿵쿵 구르며 화를 내요'] },
  { e: '🍦', t: '아이스크림을 바닥에 떨어뜨렸어요', a: 'sad', fix: ['"아쉽다" 하고 엄마께 말씀드려요', '바닥에 주저앉아 계속 울어요', '동생 아이스크림을 뺏어 먹어요'] },
  { e: '🖍️', t: '동생이 내 그림에 낙서를 했어요', a: 'angry', fix: ['"내 그림은 건드리지 말아 줘" 하고 말해요', '동생 그림에도 낙서해요', '동생을 밀어요'] },
  { e: '🏺', t: '꽃병을 깬 건 고양이인데 내가 꾸중을 들었어요', a: 'unfair', fix: ['숨을 쉬고 "제 말도 들어 주세요" 하고 말해요', '문을 쾅 닫고 들어가요', '고양이한테 소리를 질러요'] },
  { e: '🥛', t: '내가 친구 우유를 쏟았어요', a: 'sorry', not: ['surprised'], fix: ['"미안해" 하고 휴지로 같이 닦아요', '모른 척하고 자리를 피해요', '친구가 잘못 놓아서 그렇다고 해요'] },
  { e: '🌧️', t: '소풍 가는 날 비가 와서 못 가게 됐어요', a: 'disappointed', not: ['angry'], fix: ['집에서 할 재미있는 놀이를 찾아봐요', '하루 종일 짜증을 내요', '비가 오는데 혼자 밖에 나가요'] }
];
/* 10단계 — 친구 마음을 알고, 친구에게 해 줄 말 고르기 (say[0] 이 따뜻한 말, say[3] 은 10단계 2·3칸에만) */
var SAYF = [
  { e: '✏️', t: '친구가 아끼던 연필을 잃어버렸어요', a: 'sad', say: ['"속상하겠다. 같이 찾아볼까?"', '"그까짓 연필 하나 가지고 뭘."', '"나는 연필 많은데."', '"네가 잘 챙겼어야지."'] },
  { e: '🏆', t: '친구가 그림 대회에서 상을 받았어요', a: 'proud', say: ['"축하해! 열심히 그리더니 정말 대단하다!"', '"나도 그 정도는 그려."', '"상 받았다고 자랑하지 마."', '"그 그림 별로던데."'] },
  { e: '🤕', t: '친구가 운동장에서 넘어져 무릎이 까졌어요', a: 'hurt', say: ['"많이 아프지? 보건실에 같이 가 줄게."', '"하하, 넘어졌다!"', '"조심 좀 하지."', '"나는 안 넘어졌는데."'] },
  { e: '🏫', t: '전학 온 친구가 혼자 쭈뼛쭈뼛 서 있어요', a: 'shy', not: ['worried', 'scared'], say: ['"안녕? 나랑 같이 놀래?"', '"저리 비켜 줄래?"', '(아무 말 없이 지나가요)', '"너 왜 혼자 있어? 이상해."'] },
  { e: '⚽', t: '친구가 축구 경기에서 공을 놓쳐서 우리 편이 졌어요', a: 'disappointed', not: ['sad', 'sorry', 'embarrassed'], say: ['"괜찮아, 다음에 같이 연습하자!"', '"너 때문에 졌잖아."', '"그것도 못 막아?"', '"나라면 막았을 텐데."'] },
  { e: '📄', t: '친구가 내일 발표 생각에 손을 만지작거리고 한숨을 쉬어요', a: 'worried', not: ['scared', 'disappointed'], say: ['"걱정되는구나. 같이 연습해 볼까?"', '"발표가 뭐가 어렵다고."', '"나는 하나도 안 떨리는데."', '"몰라, 네가 알아서 해."'] },
  { e: '🧱', t: '친구가 열심히 쌓은 탑이 와르르 무너졌어요', a: 'disappointed', not: ['sad', 'angry'], say: ['"아깝다! 같이 다시 쌓아 볼까?"', '"하하, 무너졌다!"', '"그러니까 내가 뭐랬어."', '"이제 내가 할 차례야."'] },
  { e: '🎂', t: '오늘은 친구 생일이에요. 친구가 들떠서 자꾸 웃어요', a: 'excited', say: ['"생일 축하해! 오늘 정말 신나겠다!"', '"생일이 뭐 대수야."', '"나도 다음 달에 생일이야."', '"케이크 나도 줘."'] }
];

function emoOf(id) { return allEmo().filter(function (e) { return e.id === id; })[0]; }
function calm() { return !!G.settings.calm; }
function clear(ctx) { ctx.body.innerHTML = ''; }
/* 같은 것이 연달아 나오지 않게 n 개 뽑기 */
function deck(pool, n) {
  var out = [], bag = [];
  while (out.length < n) {
    if (!bag.length) bag = G.shuffle(pool);
    var x = bag.shift();
    if (out.length && out[out.length - 1] === x && pool.length > 1) { bag.push(x); continue; }
    out.push(x);
  }
  return out;
}
/* 칸 맞추기 — 칸(1~3)이 오르면 n 문제 가운데 (칸-1)개만 다음 단계 맛보기(2칸 1개·3칸 2개).
   첫 문제는 늘 그 단계 그대로 → [false, true, …] */
function stepMix(ctx, n) {
  var idx = G.range(n).slice(1);
  var on = G.sample(idx, Math.min(Math.max(0, (ctx.step || 1) - 1), idx.length));
  return G.range(n).map(function (i) { return on.indexOf(i) >= 0; });
}
function faceHTML(e, showName) {
  return '<span class="ce">' + e.e + '</span><span class="cl fe-name' + (showName ? ' on' : '') + '">' + G.esc(e.name) + '</span>';
}

/* 하나 고르기 — 실패 없는 배움
   o: {items, isRight(it), render, cols, size, color, praise(it), miss1(it), answer, after(it)→Promise} */
function pickOne(ctx, o) {
  return new Promise(function (resolve) {
    var miss = 0, ch = null;
    ch = ctx.choices(o.items, {
      cols: o.cols, size: o.size, render: o.render, label: o.label, color: o.color,
      onPick: function (it, el) {
        if (o.isRight(it)) {
          if (!miss) ctx.trial(true);
          var nm = el.querySelector('.fe-name'); if (nm) nm.classList.add('on');
          ctx.cheer(o.praise(it), el).then(function () { return o.after ? o.after(it) : null; })
            .then(function () { return ctx.wait(450); }).then(function () { resolve(miss === 0); });
          return true;
        }
        miss++;
        if (miss === 1) ctx.trial(false);
        el.classList.add('dim'); el.disabled = true;
        var nm2 = el.querySelector('.fe-name'); if (nm2) nm2.classList.add('on');
        var right = ch.buttons.filter(function (b) { return o.isRight(b._item); })[0];
        var left = ch.buttons.filter(function (b) { return !b.disabled; }).length;
        if (miss >= 2 || left <= 1) {
          G.sfx.play('oops'); G.ui.wiggle(el); G.ui.hint(right);
          ctx.say(o.answer, { repeat: false });
        } else {
          ctx.oops(o.miss1(it), el);
        }
        return false;
      }
    });
  });
}

/* ---------- 모양 ---------- */
G.css('feel', `
/* 공통 — 감정 얼굴 이름은 맞힌 뒤에 보인다. 화면 폭 카드는 1보다 커지지 않게 나타난다(커지면 잠깐 가로로 넘친다) */
@keyframes feIn{from{opacity:0;transform:scale(.94)}}
@keyframes feRight{40%{transform:scale(1.05)}}
:is(.act-emotion,.act-situation) .choices:is(.c1,.c4) .choice.right{animation:feRight .5s}
.act-emotion .fe-name{visibility:hidden}
.act-emotion .fe-name.on{visibility:visible}

/* ── checkin ── */
.act-checkin .choice{border-bottom-width:8px}
.act-checkin .ck{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%}
.act-checkin .ck-halo{width:clamp(170px,48vw,270px);aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle,color-mix(in srgb,var(--fc) 70%,transparent) 0%,color-mix(in srgb,var(--fc) 28%,transparent) 55%,transparent 72%);
  font-size:clamp(104px,30vw,170px);line-height:1;animation:pop .6s;transition:width .4s}
.act-checkin .ck-halo span{filter:drop-shadow(0 8px 12px rgba(0,0,0,.14))}
.act-checkin .ck-name{font-family:Jua,sans-serif;font-size:clamp(28px,8vw,42px);line-height:1.2}
.act-checkin .ck.small .ck-halo{width:clamp(110px,28vw,150px);font-size:clamp(64px,17vw,92px)}
.act-checkin .ck.small .ck-name{font-size:clamp(20px,5.6vw,28px)}
.act-checkin .ck-more{width:100%;max-width:640px;display:flex;flex-direction:column;align-items:center;gap:10px}
.act-checkin .ck-more .choices{margin:6px 0}
.act-checkin .ck-act{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.act-checkin .ck-act .big{font-size:clamp(90px,26vw,150px);line-height:1.1;display:inline-block;animation:ckHug 1.6s ease-in-out infinite}
.act-checkin .ck-act b{font-family:Jua,sans-serif;font-weight:400;font-size:clamp(22px,6vw,30px)}
@keyframes ckHug{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
.act-checkin .ck-breath{display:flex;flex-direction:column;align-items:center;gap:10px}
.act-checkin .ck-ball{width:clamp(150px,42vw,240px);aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:clamp(46px,13vw,74px);
  background:radial-gradient(circle at 40% 35%,#e3f4ff,#90cdf8 55%,#5aa9ff);box-shadow:0 10px 30px rgba(90,169,255,.35);
  transform:scale(.62);transition:transform 3.8s ease-in-out}
.act-checkin .ck-ball.in{transform:scale(1);transition-duration:3.2s}
.calm .act-checkin .ck-ball{transition-property:transform!important;transition-duration:4.8s!important}
.calm .act-checkin .ck-ball.in{transition-duration:4s!important}
.act-checkin .ck-bt{font-family:Jua,sans-serif;font-weight:400;font-size:clamp(24px,6.6vw,34px)}
.act-checkin .ck-cnt{display:flex;gap:8px}
.act-checkin .ck-cnt i{width:16px;height:16px;border-radius:50%;background:var(--line)}
.act-checkin .ck-cnt i.on{background:var(--area)}
@media (max-height:560px){
  .act-checkin .ck-halo{width:120px;font-size:72px}
  .act-checkin .ck.small .ck-halo{width:84px;font-size:52px}
  .act-checkin .ck-ball{width:130px}
}

/* ── emotion ── */
.act-emotion .fe-q{width:auto;max-width:100%;margin:auto 0 8px;display:flex;align-items:center;gap:10px;background:var(--surface);border-radius:999px;padding:8px 22px 8px 14px;box-shadow:var(--shadow);
  font-family:Jua,sans-serif;font-size:clamp(22px,6vw,32px);border:3px dashed color-mix(in srgb,var(--area) 50%,transparent)}
.act-emotion .fe-q span{font-size:1.3em}
.act-emotion .fe-q b{font-weight:400;color:var(--area)}
.act-emotion .choices{margin:0 auto auto}
.act-emotion .choice{min-height:clamp(130px,32vw,220px)}
.act-emotion .fe-clue{margin:10px auto 0;max-width:560px;text-align:center;background:color-mix(in srgb,var(--area) 12%,var(--surface));border-radius:20px;padding:10px 18px;
  font-family:Jua,sans-serif;font-size:clamp(18px,4.8vw,24px);animation:feIn .4s}
/* 6~10단계 — 몸 신호·두 마음 카드, 마음 온도계 */
.act-emotion .fe-scene{margin:auto 0 10px;display:flex;flex-direction:column;align-items:center;gap:2px;background:var(--surface);border-radius:28px;padding:8px 20px 12px;
  box-shadow:var(--shadow);max-width:600px;animation:feIn .4s;border:3px dashed color-mix(in srgb,var(--area) 45%,transparent)}
.act-emotion .fe-sc-e{font-size:clamp(50px,14vw,84px);line-height:1.15}
.act-emotion .fe-sc-t{font-family:Jua,sans-serif;font-size:clamp(19px,5.2vw,27px);text-align:center;line-height:1.4;word-break:keep-all}
.act-emotion .fe-sc-q{color:var(--soft);font-size:clamp(14px,3.8vw,17px);text-align:center}
.act-emotion .fe-slots{display:flex;align-items:center;gap:8px;margin-top:4px;font-family:Jua,sans-serif;font-size:clamp(16px,4.4vw,21px)}
.act-emotion .fe-slots span{min-width:64px;text-align:center;padding:2px 12px;border-radius:999px;border:3px dashed color-mix(in srgb,var(--area) 50%,transparent)}
.act-emotion .fe-slots span.on{border-style:solid;border-color:var(--good);animation:pop .4s}
.act-emotion .fe-q.sz{border-radius:26px}
.act-emotion .fe-q.sz > span:last-child{font-size:1em;word-break:keep-all}
.act-emotion .fe-q .fe-th{position:relative;flex:none;width:18px;height:46px;font-size:0;border-radius:999px;background:var(--line);overflow:hidden;box-shadow:inset 0 0 0 2px rgba(0,0,0,.08)}
.act-emotion .fe-th i{position:absolute;left:0;right:0;bottom:0;height:30%;border-radius:999px;background:#ef5350}
.act-emotion .fe-th.hi i{height:100%}

/* ── situation ── */
.act-situation .sit-scene{margin:auto 0 10px;display:flex;flex-direction:column;align-items:center;background:var(--surface);border-radius:30px;padding:10px 22px 14px;
  box-shadow:var(--shadow);max-width:600px;animation:feIn .4s}
.act-situation .sit-e{font-size:clamp(84px,24vw,150px);line-height:1.15}
.act-situation .sit-t{font-family:Jua,sans-serif;font-size:clamp(21px,5.6vw,30px);text-align:center;line-height:1.35}
.act-situation .sit-q{color:var(--soft);font-size:clamp(14px,3.8vw,17px)}
.act-situation .choices{margin:0 auto auto}
.act-situation .sit-cope{margin:0 auto auto;max-width:600px;display:flex;align-items:center;gap:12px;background:color-mix(in srgb,var(--area) 13%,var(--surface));border-radius:24px;
  padding:12px 18px;box-shadow:var(--shadow);animation:feIn .4s}
.act-situation .sit-cope .ce{font-size:clamp(54px,15vw,84px);line-height:1}
.act-situation .sit-cope p{font-family:Jua,sans-serif;font-size:clamp(18px,4.8vw,24px);line-height:1.45}
/* 8~10단계 — 두 사람 마음 표·좋은 방법·해 줄 말 */
.act-situation .sit-scene.sm{padding:6px 18px 10px}
.act-situation .sit-scene.sm .sit-e{font-size:clamp(52px,14vw,84px)}
.act-situation .sit-scene.sm .sit-t{font-size:clamp(18px,5vw,26px)}
.act-situation .sit-t{word-break:keep-all}
.act-situation .sit-who{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 auto 8px;max-width:600px}
.act-situation .sit-who span{background:var(--surface);border-radius:999px;padding:4px 14px;box-shadow:var(--shadow);font-family:Jua,sans-serif;font-size:clamp(16px,4.4vw,20px);animation:pop .4s}
.act-situation .choices.c1{max-width:560px}
.act-situation .choice .sit-a{font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,22px);line-height:1.35;padding:2px 10px;text-align:center;word-break:keep-all}

/* ── facemirror ── */
.act-facemirror .fm{flex:1;min-height:0;width:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto;grid-template-areas:"t" "c" "j";gap:10px;justify-items:center}
.act-facemirror .fm-target{grid-area:t;display:flex;align-items:center;gap:12px;background:var(--surface);border-radius:26px;padding:6px 20px 6px 12px;box-shadow:var(--shadow);
  border:4px solid var(--fc,var(--area));max-width:100%}
.act-facemirror .fm-target.show{animation:pop .45s}
.act-facemirror .fm-e{font-size:clamp(58px,16vw,96px);line-height:1.1}
.act-facemirror .fm-tt b{display:block;font-family:Jua,sans-serif;font-weight:400;font-size:clamp(22px,6vw,32px);line-height:1.2}
.act-facemirror .fm-tt small{display:block;color:var(--soft);font-size:clamp(14px,3.8vw,17px);line-height:1.4}
.act-facemirror .fm-cam{grid-area:c;position:relative;width:min(100%,640px);height:100%;min-height:160px;border-radius:30px;overflow:hidden;
  background:radial-gradient(circle at 50% 40%,#3a4a63,#1b2433);box-shadow:var(--shadow);transition:box-shadow .3s}
.act-facemirror .fm-cam video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.act-facemirror .fm-cam::before{content:'📷';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:48px;opacity:.35}
.act-facemirror .fm-cam.yay{box-shadow:0 0 0 7px var(--good),0 0 40px color-mix(in srgb,var(--good) 60%,transparent)}
.act-facemirror .fm-mini{position:absolute;right:10px;top:10px;z-index:2;width:clamp(60px,16vw,86px);aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.92);
  display:flex;align-items:center;justify-content:center;font-size:clamp(38px,10vw,56px);box-shadow:0 4px 14px rgba(0,0,0,.25)}
.act-facemirror .fm-no{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;color:#fff;padding:16px;
  background:radial-gradient(circle at 50% 40%,#dff1ff,#a9d6ff 60%,#7fb8f2)}
.act-facemirror .fm-no span{font-size:clamp(70px,20vw,120px);line-height:1.1}
.act-facemirror .fm-no b{font-family:Jua,sans-serif;font-weight:400;font-size:clamp(18px,4.8vw,24px);color:#24344a}
.act-facemirror .fm-j{grid-area:j;width:100%;min-height:76px}
.act-facemirror .fm-j .judge{margin:0}
@media (orientation:landscape) and (min-width:700px){
  .act-facemirror .fm{grid-template-columns:minmax(0,1fr) minmax(230px,330px);grid-template-rows:1fr auto;grid-template-areas:"c t" "c j";align-items:center}
  .act-facemirror .fm-target{flex-direction:column;text-align:center;padding:10px 14px}
  .act-facemirror .fm-j .judge{flex-direction:column}
  .act-facemirror .fm-j .judge .btn{max-width:none}
}
@media (orientation:landscape) and (max-height:520px){
  .act-facemirror .fm-target{padding:4px 12px}
  .act-facemirror .fm-e{font-size:48px}
  .act-facemirror .fm-j .judge{flex-direction:row}
  .act-facemirror .fm-j .judge .btn.big{min-height:52px;font-size:18px;padding:8px 10px}
}

/* ── stories ── */
.act-stories .choice .cl{font-size:clamp(14px,3.9vw,21px);line-height:1.3}
.act-stories .sy{flex:1;min-height:0;width:100%;display:flex;flex-direction:column;align-items:center;gap:10px}
.act-stories .sy-title{font-family:Jua,sans-serif;font-size:clamp(18px,5vw,24px);color:var(--soft)}
.act-stories .sy-page{flex:1;min-height:0;width:min(100%,760px);background:var(--surface);border-radius:32px;box-shadow:var(--shadow);display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:12px;padding:16px 20px;overflow:hidden;touch-action:pan-y;border-bottom:8px solid color-mix(in srgb,var(--area) 35%,transparent)}
.act-stories .sy-page.in-r{animation:syR .4s ease-out}
.act-stories .sy-page.in-l{animation:syL .4s ease-out}
@keyframes syR{from{transform:translateX(40px);opacity:0}}
@keyframes syL{from{transform:translateX(-40px);opacity:0}}
.act-stories .sy-e{font-size:clamp(84px,min(42vw,26vh),220px);line-height:1.1;cursor:pointer;filter:drop-shadow(0 8px 14px rgba(0,0,0,.12));animation:pop .6s}
.act-stories .sy-t{font-family:Jua,sans-serif;font-size:clamp(20px,5.6vw,32px);line-height:1.5;text-align:center;max-width:640px}
.act-stories .sy-nav{display:flex;align-items:center;gap:12px;width:min(100%,760px)}
.act-stories .sy-btn{flex:1;min-height:clamp(64px,16vw,80px);border-radius:24px;background:var(--surface);box-shadow:var(--shadow);font-size:clamp(28px,8vw,38px);
  font-family:Jua,sans-serif;transition:transform .1s}
.act-stories .sy-btn:active{transform:scale(.95)}
.act-stories .sy-btn:disabled{opacity:.3}
.act-stories .sy-btn.next{background:var(--area);color:#fff;box-shadow:0 5px 0 color-mix(in srgb,var(--area) 70%,#000)}
.act-stories .sy-btn.next.end{background:var(--good);box-shadow:0 5px 0 color-mix(in srgb,var(--good) 70%,#000);font-size:clamp(22px,6vw,30px)}
.act-stories .sy-n{flex:none;min-width:64px;text-align:center;font-family:Jua,sans-serif;font-size:clamp(17px,4.6vw,21px);color:var(--soft)}
/* ── 낮고 넓은 화면(휴대폰 가로) — 스크롤 없이 한눈에 ── */
@media (orientation:landscape) and (max-height:520px){
  .st-body:is(.act-checkin,.act-emotion,.act-situation,.act-stories) .choice{min-height:0;padding:6px 4px}
  .act-checkin .choices{grid-template-columns:repeat(auto-fit,minmax(110px,1fr));max-width:none}
  .st-body.act-checkin .choices .choice .ce{font-size:min(22vh,92px)}
  .st-body.act-checkin .choices.md .choice .ce{font-size:min(11vh,46px)}
  .st-body.act-checkin .choices.md .choice .cl{font-size:17px;line-height:1.3}
  .act-checkin .ck.small .ck-halo{display:none}
  .st-body.act-checkin .ck-more .choices .choice .ce{font-size:40px}
  .act-checkin .ck-act .big{font-size:72px}
  .act-emotion .fe-q{margin:0 0 6px;padding:4px 18px 4px 10px;font-size:22px}
  .st-body.act-emotion .choices .choice .ce{font-size:min(19vh,80px)}
  .act-emotion .choices{max-width:720px}
  .act-situation .sit-scene{flex-direction:row;gap:14px;padding:4px 18px;margin:0 0 6px}
  .act-situation .sit-e{font-size:64px}
  .st-body.act-situation .choices .choice .ce{font-size:min(15vh,58px)}
  .act-situation .choices{max-width:760px}
  .act-situation .sit-cope{margin:0 auto}
  .act-emotion .fe-scene{flex-direction:row;gap:12px;padding:4px 16px;margin:0 0 6px}
  .act-emotion .fe-sc-e{font-size:52px}
  .act-emotion .fe-sc-t{font-size:19px}
  .act-emotion .fe-q .fe-th{height:34px}
  .act-situation .sit-scene.sm .sit-e{font-size:48px}
  .act-stories .choices{grid-template-columns:repeat(5,1fr);max-width:none}
  .st-body.act-stories .choices .choice .ce{font-size:38px}
  .st-body.act-stories .choices .choice .cl{font-size:15px}
}
@media (orientation:landscape) and (max-height:520px){
  .act-stories .sy-page{flex-direction:row;gap:18px}
  .act-stories .sy-e{font-size:96px}
  .act-stories .sy-t{text-align:left}
  .act-stories .sy-btn{min-height:54px}
}
`);

/* =================================================================
   1. 오늘 기분 — 하루 꾸러미의 첫 칸 (1분 안에)
   ================================================================= */
var REFLECT = {
  happy: ['기쁘구나! 좋은 일이 있었나 봐.', '와, 기쁘구나! 자비스도 같이 기뻐.'],
  surprised: ['깜짝 놀랐구나! 무슨 일이 있었을까?', '우와, 놀랐구나! 엄마 아빠한테 이야기해 줄래?'],
  sleepy: ['졸리구나. 오늘은 천천히, 살살 놀자.', '하암~ 졸리구나. 조금만 놀고 푹 쉬자.'],
  calm: ['편안하구나. 몸이 말랑말랑하지?', '마음이 편안하구나. 참 좋다.'],
  love: ['사랑하는 마음이구나! 자비스 마음도 따뜻해져.', '사랑해요 마음이구나! 꼭 안아 주고 싶다.'],
  shy: ['부끄럽구나. 괜찮아, 천천히 해도 돼.', '조금 부끄럽구나. 자비스가 기다려 줄게.'],
  sad: ['슬프구나. 슬플 수도 있어. 자비스가 옆에 있을게.', '마음이 슬프구나. 말해 줘서 고마워.'],
  angry: ['화가 났구나. 화날 수도 있어. 괜찮아.', '화가 났구나. 그런 마음이 들 수 있어.'],
  scared: ['무서웠구나. 괜찮아, 자비스가 같이 있을게.', '무서운 마음이구나. 이제 괜찮아.'],
  hurt: ['아프구나. 어디가 아픈지 엄마 아빠한테 알려 주자.', '아프구나. 엄마 아빠가 살펴 줄 거야.']
};
var COMFORT = [
  { id: 'hug', e: '🤗', name: '안아 줘요' },
  { id: 'breathe', e: '🌬️', name: '숨 쉬기' },
  { id: 'water', e: '💧', name: '물 마시기' },
  { id: 'ok', e: '👌', name: '괜찮아요' }
];

G.act({
  id: 'checkin', area: 'feel', title: '오늘 기분', icon: '😊', order: 1, levels: 3, needs: [], mins: 1,
  ef: ['regulate'],
  desc: '오늘 기분은 어때?',
  goal: '감정 알아차리기와 이름 붙이기(정서 어휘), 힘든 마음일 때 스스로 진정하는 방법 고르기',
  how: '아이가 고른 기분을 고치지 말고 "그랬구나" 하고 그대로 받아 주세요. 슬프거나 화난 날은 안아 주기·숨쉬기·물 마시기 중 아이가 고른 것을 실제로 함께 해 주세요. 매일 고른 기분은 부모 화면 「기분 체크」에 모여요.',
  basis: '감정 알아차리기 — 감정에 이름을 붙이면 가라앉는다(affect labeling), 스스로 진정 방법 고르기',
  offline: '저녁 식탁에서 감정 얼굴 카드로 "오늘 기분"을 하나씩 고르고 엄마 아빠 기분도 말해 주기.',
  run: function (ctx) {
    /* 좋은 기분과 힘든 기분을 고르게 — 1단계 기쁨·편안·슬픔·화남, 2단계 + 무서움·졸림 */
    var pickE = function (ids) { return ids.map(function (id) { return D.EMOTIONS.filter(function (e) { return e.id === id; })[0]; }).filter(Boolean); };
    var lv = ctx.level, list = lv === 1 ? pickE(['happy', 'calm', 'sad', 'angry']) : lv === 2 ? pickE(['happy', 'calm', 'sad', 'angry', 'scared', 'sleepy']) : D.EMOTIONS.slice();
    var cols = list.length === 4 ? 2 : list.length === 6 ? 3 : 4;
    ctx.say(G.pick(['오늘 기분이 어때?', G.callName() + ', 오늘 기분이 어때?', '지금 마음은 어떤 얼굴이야?']) + ' 하나 골라 봐.');
    var ch = ctx.choices(list, {
      cols: cols, size: list.length > 6 ? 'md' : list.length > 4 ? 'lg' : 'xl', color: function (e) { return e.col; },
      onPick: function (e) {
        ctx.extra.emo = e.id;
        G.voice.stop();
        ctx.timeout(function () { reflect(e); }, 350);
        return true;
      }
    });
    if (list.length > 6 && innerWidth >= 700) ch.el.style.gridTemplateColumns = 'repeat(5,1fr)';

    function reflect(e) {
      clear(ctx);
      var v = G.el('<div class="ck"><div class="ck-halo"><span>' + e.e + '</span></div><div class="ck-name">' + G.esc(e.name) + '</div><div class="ck-more"></div></div>');
      v.querySelector('.ck-halo').style.setProperty('--fc', e.col);
      ctx.body.appendChild(v);
      var more = v.querySelector('.ck-more');
      if (HARD[e.id]) G.sfx.play('ding');
      else { G.sfx.play('good'); var c = G.fx.center(v.querySelector('.ck-halo')); G.fx.burst(c[0], c[1], ['💗', '✨', '⭐']); }
      ctx.say(G.pick(REFLECT[e.id] || ['그렇구나. 말해 줘서 고마워.'])).then(function () {
        if (!HARD[e.id]) { return ctx.wait(350).then(function () { ctx.finish({ msg: (ADJ[e.id] || '오늘') + ' 마음을 알려 줘서 고마워!' }); }); }
        v.classList.add('small');
        ctx.say('안아 줄까? 숨 쉬어 볼까? 물 마실까?');
        G.ui.choices(more, COMFORT, {
          cols: 4, size: 'md',
          onPick: function (k) { G.voice.stop(); ctx.timeout(function () { comfort(k, more); }, 250); return true; }
        });
      });
    }
    function comfort(k, box) {
      box.innerHTML = '';
      ctx.extra.comfort = k.id;
      var step;
      if (k.id === 'hug') step = waitBtn(box, '<div class="ck-act"><span class="big">🤗</span><b>꼬옥~</b></div>', '💗 꼭 안았어요', '엄마 아빠, 꼭 안아 주세요! 꼬옥~', 12000);
      else if (k.id === 'water') step = waitBtn(box, '<div class="ck-act"><span class="big">🥤</span><b>꿀꺽꿀꺽</b></div>', '💧 마셨어요', '물 한 모금 마시고 올까? 꿀꺽꿀꺽!', 15000);
      else if (k.id === 'breathe') step = breathe(box);
      else step = ctx.say('그래, 괜찮구나. 힘들면 언제든지 말해 줘.', { repeat: false });
      step.then(function () {
        return ctx.say(G.pick(['조금 나아졌어? 언제든지 마음을 말해 줘.', '잘했어. 마음을 돌보는 법을 알았네!', '마음이 조금 편안해졌지? 자비스가 늘 들어 줄게.']), { repeat: false });
      }).then(function () { ctx.finish({ msg: '마음을 말해 줘서 고마워. 정말 용감해!' }); });
    }
    /* 부모가 누르거나, 시간이 지나면 다음으로 */
    function waitBtn(box, html, label, line, ms) {
      return new Promise(function (done) {
        box.insertAdjacentHTML('beforeend', html);
        var b = G.el('<button type="button" class="btn big"></button>'); b.textContent = label; box.appendChild(b);
        var fin = false; function go() { if (fin) return; fin = true; G.sfx.play('good'); done(); }
        b.onclick = function () { G.sfx.play('tap'); go(); };
        ctx.say(line); ctx.timeout(go, ms);
      });
    }
    /* 꽃 냄새 흡~, 촛불 후~ 세 번 */
    function breathe(box) {
      return new Promise(function (done) {
        box.innerHTML = '<div class="ck-breath"><div class="ck-ball">🌸</div><b class="ck-bt">준비~</b><div class="ck-cnt"><i></i><i></i><i></i></div></div>';
        var ball = box.querySelector('.ck-ball'), label = box.querySelector('.ck-bt'), dots = G.$$('.ck-cnt i', box);
        var IN = calm() ? 4000 : 3200, OUT = calm() ? 4800 : 3800, k = 0;
        function cycle() {
          if (k >= 3) { label.textContent = '잘했어! 🌿'; done(); return; }
          ball.textContent = '🌸'; label.textContent = '코로 흡~'; ball.classList.add('in');
          ctx.say('코로 흡~', { repeat: false });
          ctx.timeout(function () {
            ball.textContent = '🕯️'; label.textContent = '입으로 후~'; ball.classList.remove('in');
            ctx.say('입으로 후~', { repeat: false });
            dots[k].classList.add('on'); k++;
            ctx.timeout(cycle, OUT);
          }, IN);
        }
        ctx.say('꽃 냄새를 맡듯 코로 흡~, 촛불을 끄듯 입으로 후~. 세 번 같이 해 보자.').then(cycle);
      });
    }
  }
});

/* =================================================================
   2. 감정 찾기 — 표정 읽기
   1~5단계 "OO 얼굴은 어디?" · 6 몸 신호로 마음 읽기 · 7·8 복잡한 마음 낱말
   9 마음의 크기(조금/아주 많이) · 10 두 마음이 함께
   ================================================================= */
var FACE_TOP = 5;                                   /* 얼굴 찾기는 5단계까지 */
var DEEP_K = { 6: 4, 7: 5, 8: 5, 9: 5, 10: 5 };     /* 몸 신호 문제 보기 수 */
/* 감정 찾기의 마음 낱말 — 6단계 기본 16개 · 7단계 +뿌듯·부러움·서운 · 8단계부터 +억울·미안·안심 */
function wordLv(lv) { return lv <= FACE_TOP ? lv : Math.min(lv - 1, 7); }
function cueOf(t) { return BODY2[t.id] ? G.pick([t.body, BODY2[t.id]]) : t.body; }
/* 몸 신호 문제 — 이름이 보이는 얼굴 가운데 고르기 (extra: 보기 하나 더) */
function bodyQ(t, lv, extra) {
  var P = allEmo().filter(function (e) { return e.lv <= wordLv(lv); }), k = DEEP_K[lv] + (extra ? 1 : 0);
  var others = G.sample(P.filter(function (e) { return e !== t && !near(t, e); }), k - 1);
  return { type: 'body', t: t, cue: cueOf(t), items: G.shuffle([t].concat(others)) };
}
/* 마음의 크기 문제 — 같은 마음 얼굴 셋(조금·보통·아주 많이). extra: 다른 마음의 같은 크기 얼굴 하나 더 */
function sizeQ(fam, w, extra) {
  function face(f, k) { return { e: f.f[k], name: f.name[k], adj: f.adj[k], fam: f, k: k }; }
  var items = [0, 1, 2].map(function (k) { return face(fam, k); }), t = items[w];
  if (extra) items.push(face(G.pick(SIZE.filter(function (f) { return f !== fam; })), w));
  return { type: 'size', t: t, fam: fam, w: w, items: G.shuffle(items) };
}
/* 두 마음 문제 — 답 둘 + 두 답 어느 쪽과도 헷갈리지 않는 보기 */
function twoQ(it, extra) {
  var ans = it.a.map(emoOf);
  var far = allEmo().filter(function (e) {
    return ans.indexOf(e) < 0 && !ans.some(function (a) { return near(a, e); }) && (it.not || []).indexOf(e.id) < 0;
  });
  return { type: 'two', it: it, ans: ans, items: G.shuffle(ans.concat(G.sample(far, 3 + (extra ? 1 : 0)))) };
}
/* 1~5단계 문제 짜기 (예전 그대로). 칸이 오르면 여섯 문제 가운데 (칸-1)문제를 다음 단계처럼 — 다음 단계 얼굴 + 보기 하나 더.
   5단계 2·3칸은 (칸-1)문제가 6단계 몸 신호 문제 */
function facePlan(lv, mix, N) {
  var k = lv + 1, pool = allEmo().filter(function (e) { return e.lv <= lv; });
  var targets = deck(pool, N);
  var up = lv < FACE_TOP, nextPool = up ? allEmo().filter(function (e) { return e.lv <= lv + 1; }) : pool;
  /* 4·5단계는 그 단계에서 새로 배우는 마음 얼굴이 꼭 두 번은 나오게 (첫 문제와 맛보기 자리는 비켜서) */
  if (lv >= 4) {
    var fresh = deck(pool.filter(function (e) { return e.lv === lv; }), 2);
    G.sample(G.range(N).filter(function (i) { return i > 0 && !mix[i]; }), 2).forEach(function (p, j) {
      if (targets[p - 1] !== fresh[j] && targets[p + 1] !== fresh[j]) targets[p] = fresh[j];
    });
  }
  if (up) {
    var nx = deck(nextPool.filter(function (e) { return e.lv === lv + 1; }), N);
    mix.forEach(function (on, i) { if (on) targets[i] = nx[i]; });
  }
  return targets.map(function (t, i) {
    if (!up && mix[i]) return bodyQ(t, FACE_TOP + 1, false);
    var nxt = up && mix[i], P = nxt ? nextPool : pool, kk = nxt ? k + 1 : k;
    var others = G.sample(P.filter(function (e) { return e !== t && !near(t, e); }), kk - 1);
    if (others.length < kk - 1) others = others.concat(G.sample(P.filter(function (e) { return e !== t && others.indexOf(e) < 0; }), kk - 1 - others.length));
    return { type: 'face', t: t, kk: kk, items: G.shuffle([t].concat(others)) };
  });
}
/* 6~10단계 문제 짜기. 칸이 오르면 (칸-1)문제를 다음 단계 문제로 — 7·8단계 새 낱말, 9단계 마음의 크기, 10단계 두 마음.
   10단계(맨 위)는 (칸-1)문제에 보기가 하나 더 */
function deepPlan(lv, mix, N, top) {
  var wl = wordLv(lv), pool = allEmo().filter(function (e) { return e.lv <= wl; });
  var types = lv === 9 ? ['body', 'size', 'body', 'size', 'body', 'size'] : lv === 10 ? ['body', 'two', 'size', 'two', 'body', 'two']
    : G.range(N).map(function () { return 'body'; });
  var targets = deck(pool, N);
  /* 7·8단계는 그 단계의 새 마음 낱말이 꼭 두 번은 (첫 문제와 맛보기 자리는 비켜서) */
  if (lv === 7 || lv === 8) {
    var fresh = deck(pool.filter(function (e) { return e.lv === wl; }), 2);
    G.sample(G.range(N).filter(function (i) { return i > 0 && !mix[i]; }), 2).forEach(function (p, j) {
      if (targets[p - 1] !== fresh[j] && targets[p + 1] !== fresh[j]) targets[p] = fresh[j];
    });
  }
  var up = lv < top, nxw = up && lv < 8 ? deck(allEmo().filter(function (e) { return e.lv === wordLv(lv + 1); }), N) : [];
  var fams = deck(SIZE, N), twos = G.shuffle(TWO), fi = 0, ti = 0, big = G.pick([0, 2]);
  return G.range(N).map(function (i) {
    var ty = types[i], ql = lv, extra = false, t = targets[i];
    if (mix[i]) {
      if (!up) extra = true;
      else if (lv < 8) { ql = lv + 1; t = nxw[i]; }
      else ty = lv === 8 ? 'size' : 'two';
    }
    if (ty === 'size') { big = 2 - big; return sizeQ(fams[fi++], big, extra); }   /* 조금 ↔ 아주 많이 번갈아 */
    if (ty === 'two') return twoQ(twos[ti++ % twos.length], extra);
    return bodyQ(t, ql, extra);
  });
}

function askFace(ctx, q, i) {
  var t = q.t, kk = q.kk;
  var el = G.el('<div class="fe-q"><span>🔍</span><span><b></b> 얼굴은 어디?</span></div>');
  el.querySelector('b').textContent = ADJ[t.id];
  ctx.body.appendChild(el);
  ctx.say(i === 0 ? ADJ[t.id] + ' 얼굴을 찾아봐!' : G.pick([ADJ[t.id] + ' 얼굴은 어디 있을까?', ADJ[t.id] + ' 얼굴을 찾아 줘!', '이번엔 ' + ADJ[t.id] + ' 얼굴!']));
  return pickOne(ctx, {
    items: q.items, cols: kk > 4 ? 3 : kk > 3 ? 4 : kk, size: kk > 3 ? 'md' : 'lg',
    render: function (e) { return faceHTML(e, false); },
    isRight: function (e) { return e === t; },
    praise: function () { return G.pick(['맞아! ' + ADJ[t.id] + ' 얼굴!', '딩동댕! ' + ADJ[t.id] + ' 얼굴이야!', '찾았다! ' + ADJ[t.id] + ' 얼굴!']); },
    miss1: function (e) { return '이건 ' + ADJ[e.id] + ' 얼굴이야. ' + ADJ[t.id] + ' 얼굴은 어디 있을까?'; },
    answer: '여기 있어! 반짝이는 얼굴이 ' + ADJ[t.id] + ' 얼굴이야.',
    after: function () { return clue(ctx, t.e, WHEN[t.id] + ' ' + t.body + '.'); }
  });
}
function clue(ctx, e, text) {
  var c = G.el('<div class="fe-clue"></div>'); c.textContent = e + ' ' + text;
  ctx.body.appendChild(c);
  return ctx.say(text, { repeat: false });
}
/* 6단계~ 몸 신호 → 마음 (얼굴 이름이 보인다) */
function askBody(ctx, q, first) {
  var t = q.t, n = q.items.length;
  var sc = G.el('<div class="fe-scene"><div class="fe-sc-e">👀</div><div class="fe-sc-t"></div><div class="fe-sc-q">몸이 이렇게 말해요. 어떤 마음일까?</div></div>');
  sc.querySelector('.fe-sc-t').textContent = q.cue;
  ctx.body.appendChild(sc);
  ctx.say((first ? '몸이 하는 말을 잘 들어 봐. ' : '') + q.cue + '. ' + G.pick(['어떤 마음일까?', '이럴 땐 무슨 마음일까?']));
  return pickOne(ctx, {
    items: q.items, cols: n > 4 ? 3 : n > 3 ? 4 : n, size: 'md',
    color: function (e) { return e.col; },
    render: function (e) { return faceHTML(e, true); },
    isRight: function (e) { return e === t; },
    praise: function () { return G.pick(['맞아, ' + t.name + '!', '그렇지! ' + ADJ[t.id] + ' 마음이야!', '몸 신호를 잘 읽었어!']); },
    miss1: function (e) { return WHEN[e.id] + ' ' + e.body + '. 다른 마음도 볼까?'; },
    answer: '이럴 땐 ' + ADJ[t.id] + ' 마음이야. 반짝이는 얼굴을 눌러 봐.',
    after: function () { return clue(ctx, t.e, WHEN[t.id] + ' ' + q.cue + '.'); }
  });
}
/* 9단계~ 마음의 크기 — 온도계가 낮으면 '조금', 꽉 차면 '아주 많이' */
function askSize(ctx, q, first) {
  var t = q.t, n = q.items.length;
  var el = G.el('<div class="fe-q sz"><span class="fe-th"><i></i></span><span><b></b> 얼굴은 어디?</span></div>');
  el.querySelector('.fe-th').classList.add(q.w ? 'hi' : 'lo');
  el.querySelector('b').textContent = t.adj;
  ctx.body.appendChild(el);
  ctx.say((first ? '이번엔 마음의 크기! 같은 마음도 조금일 때와 아주 많을 때 얼굴이 달라. ' : '') + t.adj + ' 얼굴을 찾아봐!');
  return pickOne(ctx, {
    items: q.items, cols: n > 3 ? 4 : n, size: n > 3 ? 'md' : 'lg',
    render: function (x) { return faceHTML(x, false); },
    isRight: function (x) { return x === t; },
    praise: function () { return G.pick(['맞아! ' + t.adj + ' 얼굴!', '찾았다! ' + t.adj + ' 얼굴이야!']); },
    miss1: function (x) { return '이건 ' + x.adj + ' 얼굴이야. ' + t.adj + ' 얼굴은 어디 있을까?'; },
    answer: '여기 있어! 반짝이는 얼굴이 ' + t.adj + ' 얼굴이야.',
    after: function () { return clue(ctx, t.e, q.fam.tip[q.w ? 1 : 0]); }
  });
}
/* 10단계 두 마음 — 둘 다 찾으면 끝. 처음 고른 보기가 아니면 한 번만 기록, 두 번째에는 남은 답이 반짝 */
function pickTwo(ctx, o) {
  return new Promise(function (resolve) {
    var miss = 0, need = o.right.slice(), ch = null;
    ch = ctx.choices(o.items, {
      cols: o.cols, size: o.size, render: o.render, color: o.color,
      onPick: function (it, el) {
        var at = need.indexOf(it);
        if (at >= 0) {
          need.splice(at, 1); el.disabled = true;
          var nm = el.querySelector('.fe-name'); if (nm) nm.classList.add('on');
          if (o.found) o.found(it);
          if (need.length) { G.sfx.play('good'); G.ui.good(el); ctx.say(o.more(it), { repeat: false }); return false; }
          if (!miss) ctx.trial(true);
          ctx.cheer(o.praise(), el).then(function () { return o.after ? o.after() : null; })
            .then(function () { return ctx.wait(450); }).then(function () { resolve(miss === 0); });
          return true;
        }
        miss++;
        if (miss === 1) ctx.trial(false);
        el.classList.add('dim'); el.disabled = true;
        var rights = ch.buttons.filter(function (b) { return need.indexOf(b._item) >= 0; });
        var left = ch.buttons.filter(function (b) { return !b.disabled; }).length;
        if (miss >= 2 || left <= need.length) {
          G.sfx.play('oops'); G.ui.wiggle(el); rights.forEach(function (b) { G.ui.hint(b); });
          ctx.say(o.answer(need), { repeat: false });
        } else {
          ctx.oops(o.miss1(it), el);
        }
        return false;
      }
    });
  });
}
function askTwo(ctx, q, first) {
  var it = q.it, ans = q.ans, n = q.items.length, got = 0;
  var sc = G.el('<div class="fe-scene"><div class="fe-sc-e">' + it.e + '</div><div class="fe-sc-t"></div><div class="fe-slots"><span>❔</span><b>+</b><span>❔</span></div></div>');
  sc.querySelector('.fe-sc-t').textContent = it.t;
  ctx.body.appendChild(sc);
  var slots = G.$$('.fe-slots span', sc);
  ctx.say((first ? '마음은 한꺼번에 두 개일 수도 있어. ' : '') + it.t + '. 두 가지 마음을 찾아봐!');
  return pickTwo(ctx, {
    items: q.items, right: ans, cols: n > 4 ? 3 : n > 3 ? 4 : n, size: 'md',
    color: function (e) { return e.col; },
    render: function (e) { return faceHTML(e, true); },
    found: function (e) { var sl = slots[got++]; if (sl) { sl.textContent = e.e + ' ' + e.name; sl.classList.add('on'); } },
    more: function (e) { return '맞아, ' + ADJ[e.id] + ' 마음! 또 하나는 어떤 마음일까?'; },
    praise: function () { return G.pick(['두 마음을 다 찾았어!', '맞아, 마음이 두 개였어!']); },
    miss1: function () { return G.pick(['그럴 수도 있겠다. 이야기를 다시 생각해 볼까?', '음, 이야기 속에 다른 마음이 숨어 있어. 다시 볼까?']); },
    answer: function (left) { return '반짝이는 ' + (left.length > 1 ? '얼굴들이' : '얼굴이') + ' 이 이야기 속 마음이야. 눌러 봐.'; },
    after: function () { return clue(ctx, ans[0].e + ans[1].e, ADJ[ans[0].id] + ' 마음과 ' + ADJ[ans[1].id] + ' 마음이 함께 들 수 있어요.'); }
  });
}

G.act({
  id: 'emotion', area: 'feel', title: '감정 찾기', icon: '🎭', order: 10, levels: 10, needs: [], mins: 2,
  ef: ['attend', 'wm'],
  desc: '기쁜 얼굴, 슬픈 얼굴 찾기',
  goal: '얼굴 표정 읽기(정서 인식), 감정 낱말 이해, 표정과 몸 신호 잇기. 4단계는 걱정돼요·신나요·궁금해요, 5단계는 실망했어요·당황했어요·심심해요처럼 더 섬세한 마음 낱말과 얼굴 5·6개. 6~10단계는 몸 신호만 듣고 마음 읽기 → 뿌듯·부러움·서운·억울·미안·안심 같은 복잡한 마음 → 마음의 크기(조금/아주 많이) → 한 일에 두 마음이 함께 드는 것까지 (초등 3학년 수준)',
  how: '찾고 나면 거울 앞에서 같은 얼굴을 함께 지어 보세요. "입꼬리가 올라갔네!"처럼 얼굴 어디가 달라지는지 짚어 주면 표정 읽기가 쉬워져요. 틀려도 괜찮아요 — 자비스가 그 얼굴 이름을 알려 주고, 두 번째에는 정답이 반짝여요. 6단계부터는 "어깨가 축 처졌네, 무슨 마음일까?"처럼 몸짓을 말로 짚어 주고, 하루에 있었던 일로 "그때 마음이 두 개였니?" 하고 물어봐 주세요.',
  basis: '얼굴 표정 재인 — 사회 인지·마음 읽기의 첫걸음. 몸 신호·감정 강도·혼합 감정 이해(8~10세 발달 과제)',
  offline: '그림책 속 인물 얼굴을 보며 "이 친구 기분은 어때?" 하고 묻기.',
  run: async function (ctx) {
    var lv = ctx.level, N = 6, TOP = ctx.def.levels, mix = stepMix(ctx, N);
    var qs = lv <= FACE_TOP ? facePlan(lv, mix, N) : deepPlan(lv, mix, N, TOP), seen = {};
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      var q = qs[i], first = !seen[q.type]; seen[q.type] = 1;
      if (q.type === 'face') await askFace(ctx, q, i);
      else if (q.type === 'body') await askBody(ctx, q, first);
      else if (q.type === 'size') await askSize(ctx, q, first);
      else await askTwo(ctx, q, first);
    }
    ctx.progress(N, N);
    ctx.finish({ msg: lv <= FACE_TOP ? G.pick(['마음 얼굴을 척척 찾았어! 표정 박사다!', '얼굴만 봐도 마음을 아는구나! 정말 멋져!'])
      : G.pick(['몸짓만 봐도 마음을 척척 읽었어! 마음 탐정이다!', '복잡한 마음도 알아보는구나! 정말 멋져!']) });
  }
});

/* =================================================================
   3. 이럴 땐 어떤 기분? — 상황과 감정 잇기, 마음을 말로
   1~7단계 이야기 → 기분 (6·7단계는 뿌듯·부러움·서운·억울·미안·안심)
   8 같은 일, 다른 마음(나와 다른 사람) · 9 기분 + 좋은 방법 고르기 · 10 친구 기분 + 해 줄 말 고르기
   ================================================================= */
var SIT_K = [2, 3, 4, 5, 6, 6, 6, 5, 5, 5];     /* 기분 보기 수 (1~5단계는 예전처럼 단계+1, 6개를 넘지 않는다) */
var SIT_N = [5, 5, 5, 5, 5, 5, 5, 4, 4, 4];     /* 한 판 이야기 수 — 8단계부터는 한 이야기에 두 번 고른다 */
var STORY_TOP = 7;                              /* 이야기 → 기분 하나는 7단계까지 */
var SIT_KIND = { 8: 'two', 9: 'fix', 10: 'say' }, SIT_LIST = { two: PERSP, fix: FIX, say: SAYF };
function feelOpts(ans, emos, k, not) {
  var far = emos.filter(function (e) { return e !== ans && !near(ans, e) && (not || []).indexOf(e.id) < 0; });
  return [ans].concat(G.sample(far, k - 1));
}
function plain(t) { return String(t).replace(/["“”()]/g, ''); }
/* 1~7단계 이야기 짜기 (5단계까지는 예전 그대로).
   칸이 오르면 다섯 이야기 가운데 (칸-1)개를 다음 단계 이야기로 — 다음 단계 기분 + 보기 하나 더(6개까지).
   7단계는 (칸-1)개가 8단계 '같은 일, 다른 마음' 이야기 */
function storyPlan(ctx, lv, N) {
  var k = SIT_K[lv - 1];
  var emos = allEmo().filter(function (e) { return e.lv <= lv; });
  var pool = allSit().filter(function (s) { var e = emoOf(s.a); return e && (s.lv || 1) <= lv && e.lv <= lv; });
  var up = lv < STORY_TOP, mix = stepMix(ctx, Math.min(N, pool.length)), cnt = mix.filter(Boolean).length;
  var nEmos = up ? allEmo().filter(function (e) { return e.lv <= lv + 1; }) : emos;
  var hard = up ? allSit().filter(function (s) { var e = emoOf(s.a); return e && (s.lv || 1) <= lv + 1 && e.lv <= lv + 1 && pool.indexOf(s) < 0; }) : [];
  var nx = up ? G.sample(hard, cnt) : [], px = up ? [] : G.sample(PERSP, cnt), nn = nx.length + px.length, cur;
  if (lv < 4) cur = G.sample(pool.filter(function (s) { return nx.indexOf(s) < 0; }), mix.length - nn);
  else {
    /* 4단계부터는 그 단계의 새 이야기가 두 개는 나오게 (첫 이야기는 익숙한 것으로 쉽게 시작) */
    var rest = pool.filter(function (s) { return nx.indexOf(s) < 0; }), M = mix.length - nn;
    var news = G.sample(rest.filter(function (s) { return (s.lv || 1) === lv; }), Math.min(2, M - 1));
    var olds = G.sample(rest.filter(function (s) { return news.indexOf(s) < 0 && (s.lv || 1) < lv; }), M - news.length);
    cur = olds.slice(0, 1).concat(G.shuffle(olds.slice(1).concat(news)));
  }
  return mix.map(function (on) {
    if (on && px.length) return { kind: 'two', p: px.shift() };
    var nxt = on && nx.length, s = nxt ? nx.shift() : cur.shift();
    return { kind: 'one', s: s, opts: feelOpts(emoOf(s.a), nxt ? nEmos : emos, nxt ? SIT_K[lv] : k, s.not) };
  });
}
/* 8~10단계 짜기 — (칸-1)개는 다음 단계 꼴, 10단계(맨 위)는 (칸-1)개에 '해 줄 말' 보기가 하나 더 */
function deepSitPlan(ctx, lv, N) {
  var kind = SIT_KIND[lv], nk = SIT_KIND[lv + 1], mix = stepMix(ctx, N);
  var cur = G.sample(SIT_LIST[kind], N), nx = nk ? G.sample(SIT_LIST[nk], mix.filter(Boolean).length) : [];
  return mix.map(function (on) { return on && nk ? { kind: nk, p: nx.shift() } : { kind: kind, p: cur.shift(), extra: on && !nk }; });
}
/* 기분 고르기 (얼굴 + 이름) */
function feelSpec(ans, opts, after) {
  return {
    items: G.shuffle(opts), cols: opts.length > 4 ? 3 : opts.length > 3 ? 4 : opts.length, size: opts.length > 3 ? 'md' : 'lg',
    color: function (e) { return e.col; },
    render: function (e) { return faceHTML(e, true); },
    isRight: function (e) { return e === ans; },
    praise: function () { return G.pick(['맞아, ' + ans.name + '!', '그렇지! ' + ans.name + '!', '마음을 잘 알아주는구나!']); },
    miss1: function () { return G.pick(['음, 그럴 수도 있겠다. 다른 얼굴도 볼까?', '그런 마음이 들 수도 있어. 또 어떤 마음일까?']); },
    answer: '이럴 땐 ' + ADJ[ans.id] + ' 마음이 들어. 반짝이는 얼굴을 눌러 봐.',
    after: after
  };
}
/* 글 보기 고르기 (좋은 방법·해 줄 말) */
function textSpec(items, good, o) {
  return {
    items: items, cols: 1, size: 'md',
    render: function (x) { return '<span class="sit-a">' + G.esc(x) + '</span>'; },
    isRight: function (x) { return x === good; },
    praise: function () { return G.pick(o.praise); }, miss1: function () { return G.pick(o.miss1); }, answer: o.answer, after: o.after
  };
}
function sitScene(ctx, p, small, q) {
  var sc = G.el('<div class="sit-scene' + (small ? ' sm' : '') + '"><div class="sit-e">' + p.e + '</div><div class="sit-t"></div><div class="sit-q"></div></div>');
  sc.querySelector('.sit-t').textContent = p.t; sc.querySelector('.sit-q').textContent = q;
  ctx.body.appendChild(sc);
  return sc.querySelector('.sit-q');
}
function dropChoices(ctx) { var ch = G.$('.choices', ctx.body); if (ch) ch.remove(); }
function chip(row, who, e) { var c = G.el('<span></span>'); c.textContent = who + ' ' + e.e + ' ' + e.name; row.appendChild(c); }
function deepEmos() { return allEmo().filter(function (e) { return e.lv <= STORY_TOP; }); }

function askStory(ctx, it, i) {
  var s = it.s, ans = emoOf(s.a);
  sitScene(ctx, s, false, '어떤 기분일까?');
  ctx.say(s.t + '. ' + (i === 0 ? '이럴 땐 어떤 기분일까?' : G.pick(['어떤 기분일까?', '이럴 땐 마음이 어떨까?'])));
  return pickOne(ctx, feelSpec(ans, it.opts, function () {
    dropChoices(ctx);
    var c = G.el('<div class="sit-cope"><span class="ce">' + ans.e + '</span><p></p></div>');
    c.querySelector('p').textContent = COPE[ans.id];
    ctx.body.appendChild(c);
    return ctx.say(COPE[ans.id], { repeat: false }).then(function () { return ctx.wait(400); });
  }));
}
/* 8단계 — 같은 일, 두 사람의 마음 */
async function askPersp(ctx, it, first) {
  var p = it.p, k = SIT_K[7], qEl = sitScene(ctx, p, true, ''), row = G.el('<div class="sit-who"></div>');
  ctx.body.appendChild(row);
  for (var j = 0; j < 2; j++) {
    var w = p.who[j], ans = emoOf(w[1]), mind = (w[0] === '나' ? '내' : w[0]) + ' 마음은';
    qEl.textContent = '🔍 ' + mind + ' 어떨까?';
    ctx.say(j === 0 ? (first ? '같은 일이라도 사람마다 마음이 다를 수 있어. ' : '') + p.t + '. ' + mind + ' 어떨까?' : '그럼 ' + mind + ' 어떨까?');
    await pickOne(ctx, feelSpec(ans, feelOpts(ans, deepEmos(), k, w[2]), (function (w, ans) {
      return function () { dropChoices(ctx); chip(row, w[0], ans); return ctx.wait(300); };
    })(w, ans)));
  }
  if (first) await ctx.say('같은 일인데도 두 사람 마음이 다르지? 그럴 수 있어.', { repeat: false });
}
/* 9단계 — 기분을 알고, 좋은 방법 고르기 */
async function askFix(ctx, it, first) {
  var p = it.p, ans = emoOf(p.a), good = p.fix[0], qEl = sitScene(ctx, p, true, '어떤 기분일까?'), row = G.el('<div class="sit-who"></div>');
  ctx.body.appendChild(row);
  ctx.say(p.t + '. 이럴 땐 어떤 기분일까?');
  await pickOne(ctx, feelSpec(ans, feelOpts(ans, deepEmos(), SIT_K[8], p.not), function () { dropChoices(ctx); chip(row, '나', ans); return ctx.wait(250); }));
  qEl.textContent = '💡 어떻게 하면 좋을까?';
  ctx.say((first ? ADJ[ans.id] + ' 마음이 들 때, ' : '') + '어떻게 하면 좋을까?');
  await pickOne(ctx, textSpec(G.shuffle(p.fix.slice(0, 3)), good, {
    praise: ['좋은 방법이야!', '멋진 방법을 골랐어!', '그렇게 하면 마음도 일도 풀려!'],
    miss1: ['그렇게 하면 마음이 더 힘들어질 수 있어. 다른 방법도 볼까?', '음, 그러면 어떻게 될까? 다른 방법도 생각해 볼까?'],
    answer: '이 방법이 좋아. 반짝이는 걸 눌러 봐.',
    after: function () { return ctx.say(plain(good) + '. 좋은 방법이야!', { repeat: false }).then(function () { return ctx.wait(300); }); }
  }));
}
/* 10단계 — 친구 기분을 알고, 친구에게 해 줄 말 고르기 */
async function askFriend(ctx, it, first) {
  var p = it.p, ans = emoOf(p.a), good = p.say[0], qEl = sitScene(ctx, p, true, '친구 마음은 어떨까?'), row = G.el('<div class="sit-who"></div>');
  ctx.body.appendChild(row);
  ctx.say(p.t + '. 친구 마음은 어떨까?');
  await pickOne(ctx, feelSpec(ans, feelOpts(ans, deepEmos(), SIT_K[9], p.not), function () { dropChoices(ctx); chip(row, '친구', ans); return ctx.wait(250); }));
  qEl.textContent = '💬 친구에게 뭐라고 말해 줄까?';
  ctx.say((first ? '친구가 ' + ADJ[ans.id] + ' 마음일 때, ' : '') + '친구에게 뭐라고 말해 줄까?');
  await pickOne(ctx, textSpec(G.shuffle(p.say.slice(0, it.extra ? 4 : 3)), good, {
    praise: ['따뜻한 말이야!', '친구 마음이 환해지겠다!', '마음을 알아주는 말이야!'],
    miss1: ['그 말을 들으면 친구 마음이 어떨까? 마음을 따뜻하게 해 줄 말을 골라 볼까?', '음, 친구가 그 말을 들으면 어떨까? 다른 말도 볼까?'],
    answer: '이 말이 친구 마음을 따뜻하게 해 줘. 반짝이는 말을 눌러 봐.',
    after: function () { return ctx.say(plain(good), { repeat: false }).then(function () { return ctx.wait(300); }); }
  }));
}

G.act({
  id: 'situation', area: 'feel', title: '이럴 땐 어떤 기분?', icon: '🤔', order: 20, levels: 10, needs: [], mins: 3,
  ef: ['regulate', 'shift'],
  desc: '이럴 땐 어떤 기분일까?',
  goal: '상황과 감정 잇기(마음 읽기의 기초), 감정을 말로 표현하고 도움 청하는 말 배우기. 4·5단계는 학교·놀이 이야기(받아쓰기 시험·소풍·발표)로 걱정·신남·실망·당황 같은 마음을 읽고, 보기가 5·6개로 늘어요. 6·7단계는 뿌듯·부러움·서운·억울·미안·안심 이야기, 8단계는 같은 일에 나와 친구 마음이 다른 것(관점 바꾸기), 9단계는 그 마음일 때 좋은 방법 고르기, 10단계는 친구 마음을 알고 해 줄 따뜻한 말 고르기',
  how: '"너라면 어떤 기분일 것 같아?" 하고 물어 주세요. 아이가 다른 기분을 골라도 "그럴 수도 있겠다" 하고 받아 준 뒤 이야기를 나눠요. 자비스가 알려 주는 말("슬퍼요", "화났어요")을 같이 따라 말해 보세요. 8단계부터는 "친구는 어땠을까?", "그럴 땐 어떻게 하면 좋을까?"를 생활에서도 자주 물어봐 주세요.',
  basis: '상황-감정 이해와 대처 말 연습 — 사회정서학습(SEL)·마음 이론의 기초, 관점 수용·사회적 문제 해결(초등 저·중학년 SEL)',
  offline: '오늘 있었던 일을 이야기하며 "그때 어떤 기분이었어?" 묻고 기분 이름을 말해 주기.',
  run: async function (ctx) {
    var lv = ctx.level, N = SIT_N[lv - 1];
    var items = lv <= STORY_TOP ? storyPlan(ctx, lv, N) : deepSitPlan(ctx, lv, N), seen = {};
    N = items.length;
    for (var i = 0; i < N; i++) {
      ctx.progress(i, N);
      clear(ctx);
      var it = items[i], first = !seen[it.kind]; seen[it.kind] = 1;
      if (it.kind === 'one') await askStory(ctx, it, i);
      else if (it.kind === 'two') await askPersp(ctx, it, first);
      else if (it.kind === 'fix') await askFix(ctx, it, first);
      else await askFriend(ctx, it, first);
    }
    ctx.progress(N, N);
    ctx.finish({ msg: G.pick(['친구 마음을 잘 알아주었어! 마음 박사다!', '마음을 말로 하는 법도 배웠네! 정말 멋져!']) });
  }
});

/* =================================================================
   4. 표정 따라 하기 — 앞 카메라 거울
   ================================================================= */
G.act({
  id: 'facemirror', area: 'feel', title: '표정 따라 하기', icon: '🤳', order: 30, levels: 1, needs: ['cam'], mins: 2,
  ef: ['attend', 'regulate'],
  desc: '거울 보고 표정 따라 하기',
  goal: '표정 모방(얼굴 근육 조절), 감정과 표정 잇기, 거울 속 나를 보며 자기 인식',
  how: '부모도 아이 옆에서 같은 표정을 크게 지어 보여 주세요. 비슷하기만 해도 "👍 했어요"를 눌러 주세요 — 따라 하려고 한 것이 중요해요. 카메라 화면은 저장되지도, 어디로 보내지지도 않아요.',
  basis: '표정 모방 — 거울 놀이, 모방은 사회적 의사소통의 기초',
  offline: '거울 앞에서 엄마와 번갈아 표정을 짓고 "무슨 기분일까?" 맞히기.',
  run: function (ctx) {
    var B = ctx.body;
    B.innerHTML = '<div class="fm"><div class="fm-target"></div><div class="fm-cam"><video playsinline muted autoplay></video><div class="fm-mini"></div></div><div class="fm-j"></div></div>';
    var video = G.$('video', B), cam = G.$('.fm-cam', B), tg = G.$('.fm-target', B), mini = G.$('.fm-mini', B), jbox = G.$('.fm-j', B);
    function noCam() {
      if (G.$('.fm-no', cam)) return;
      video.remove();
      cam.insertAdjacentHTML('afterbegin', '<div class="fm-no"><span>🪞</span><b>엄마 아빠 얼굴을 보며 같이 해 봐요!</b></div>');
    }
    if (G.has.cam) ctx.camera(video).catch(noCam); else noCam();
    var list = [emoOf('happy')].concat(G.sample(['sad', 'angry', 'surprised', 'scared', 'sleepy', 'love'], 4).map(emoOf));
    var N = list.length;

    function show(e) {
      tg.style.setProperty('--fc', e.col);
      tg.innerHTML = '<span class="fm-e">' + e.e + '</span><span class="fm-tt"><b></b><small></small></span>';
      tg.querySelector('b').textContent = ADJ[e.id] + ' 얼굴';
      tg.querySelector('small').textContent = e.body;
      mini.textContent = e.e;
      tg.classList.remove('show'); void tg.offsetWidth; tg.classList.add('show');
      G.sfx.play('pop');
    }
    function yay(e) {
      cam.classList.add('yay');
      return ctx.cheer(G.pick(['와, ' + ADJ[e.id] + ' 얼굴이다! 똑같아!', '우와, 진짜 ' + ADJ[e.id] + ' 얼굴 같아!', '표정 배우 같아! 최고야!'])).then(function () { cam.classList.remove('yay'); });
    }
    (async function () {
      for (var i = 0; i < N; i++) {
        var e = list[i];
        ctx.progress(i, N);
        show(e);
        await ctx.say((i === 0 ? '거울을 봐! 자비스랑 표정 놀이 하자. ' : '') + ADJ[e.id] + ' 얼굴 해 볼까? ' + e.body + '!');
        var ok = await ctx.parentJudge(jbox, ['👍 했어요', '🔁 다시']);
        if (ok) { ctx.trial(true); await yay(e); continue; }
        ctx.trial(false);
        await ctx.say(G.pick(['같이 해 보자! ', '한 번 더! ']) + e.body + '. 하나, 둘, 셋!');
        ok = await ctx.parentJudge(jbox, ['👍 했어요', '⏭️ 다음']);
        if (ok) await yay(e);
        else await ctx.say('괜찮아! 다음 얼굴도 재미있어.', { repeat: false });
      }
      ctx.progress(N, N);
      ctx.finish({ msg: '표정을 ' + ['', '한', '두', '세', '네', '다섯'][N] + ' 가지나 따라 했어! 거울 놀이 최고!' });
    })();
  }
});

/* =================================================================
   5. 사회 이야기 — 미리 보면 덜 불안해요
   ================================================================= */
G.act({
  id: 'stories', area: 'feel', title: '사회 이야기', icon: '📖', order: 40, levels: 1, needs: [], mins: 3,
  ef: ['plan', 'regulate'],
  desc: '그림 이야기 듣기',
  goal: '처음 가는 곳·힘든 상황을 미리 보고 덜 불안해하기, 상황에 맞는 행동과 순서 알기',
  how: '병원·미용실처럼 처음 가는 곳은 가기 전날과 당일 아침에 함께 읽어 주세요. 한 장씩 천천히 넘기며 아이가 그림을 가리키면 기다려 주세요. 실제로 해낸 뒤 "이야기처럼 해냈네!" 하고 다시 읽으면 자신감이 생겨요.',
  basis: '사회 이야기(Social Stories, Carol Gray) — 미리 알면 불안이 줄어든다',
  offline: '병원·미용실 가기 전날 이야기를 다시 읽고 인형으로 역할 놀이하기.',
  run: function (ctx) {
    ctx.say(G.pick(['어떤 이야기를 볼까? 하나 골라 봐!', '오늘은 무슨 이야기를 들어 볼까?']));
    ctx.choices(D.STORIES, {
      cols: 3, size: 'md',
      render: function (s) { return '<span class="ce">' + s.e + '</span><span class="cl">' + G.esc(s.title) + '</span>'; },
      onPick: function (s) { G.voice.stop(); ctx.timeout(function () { read(s); }, 250); return true; }
    });

    function read(s) {
      clear(ctx);
      ctx.body.innerHTML = '<div class="sy"><div class="sy-title"></div><div class="sy-page"></div>' +
        '<div class="sy-nav"><button type="button" class="sy-btn prev" aria-label="앞 장">◀</button><span class="sy-n"></span><button type="button" class="sy-btn next" aria-label="다음 장">▶</button></div></div>';
      var title = G.$('.sy-title', ctx.body), page = G.$('.sy-page', ctx.body), num = G.$('.sy-n', ctx.body);
      var prev = G.$('.prev', ctx.body), next = G.$('.next', ctx.body);
      var i = 0, N = s.pages.length, token = 0, ending = false;
      title.textContent = s.e + ' ' + s.title;

      function show(dir) {
        var p = s.pages[i], my = ++token;
        ctx.progress(i, N);
        page.className = 'sy-page ' + (dir < 0 ? 'in-l' : 'in-r');
        page.innerHTML = '<div class="sy-e">' + p.e + '</div><p class="sy-t"></p>';
        page.querySelector('.sy-t').textContent = p.t;
        page.querySelector('.sy-e').onclick = function () { G.sfx.play('tap'); ctx.say(p.t); };
        num.textContent = (i + 1) + ' / ' + N;
        prev.disabled = i === 0;
        var last = i === N - 1;
        next.textContent = last ? '✔ 끝!' : '▶';
        next.classList.toggle('end', last);
        next.setAttribute('aria-label', last ? '이야기 끝' : '다음 장');
        G.sfx.play(last ? 'sparkle' : 'tap');
        ctx.say(p.t).then(function () { if (my === token) G.ui.hint(next); });
      }
      function go(d) {
        if (ending) return;
        if (d > 0 && i === N - 1) { end(); return; }
        var ni = G.clamp(i + d, 0, N - 1); if (ni === i) return;
        i = ni; show(d);
      }
      function end() {
        ending = true;
        ctx.progress(N, N);
        ctx.cheer(G.pick(['이야기 끝! 끝까지 잘 들었어!', '와, 마지막 장까지 다 봤다!'])).then(function () {
          ctx.finish({ msg: '「' + s.title + '」 이야기를 끝까지 들었어! 정말 멋져!' });
        });
      }
      prev.onclick = function () { G.sfx.play('tap'); go(-1); };
      next.onclick = function () { G.sfx.play('tap'); go(1); };
      /* 옆으로 밀어 넘기기 */
      var sx = null;
      page.addEventListener('pointerdown', function (e) { sx = e.clientX; });
      page.addEventListener('pointerup', function (e) {
        if (sx == null) return; var dx = e.clientX - sx; sx = null;
        if (dx < -60) go(1); else if (dx > 60) go(-1);
      });
      show(1);
    }
  }
});
})();

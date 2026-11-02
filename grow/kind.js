/* ===========================================================
   함께 자라요 — 고운 말 · 표준말 (G.kind)

   아이가 표준말과 예쁘고 고운 말을 쓰도록 — 꾸짖지 않고, 본보기와 칭찬으로.
   · 자비스는 언제나 표준말·고운 말로만 말한다. AI 가 만든 말도 유행어가 섞이면 표준말로 바꾼다(polish).
   · 아이가 유행어·줄임말·아기 말을 쓰면 "틀렸어" 대신 표준말로 한 번 더 들려준다
     (고쳐 말해 주기, recast — 언어치료의 교정적 피드백. 따라 하라고 시키지 않는다).
   · 거친 말이 들리면 마음을 먼저 알아주고(감정 읽기), 대신 쓸 고운 말을 본보기로 준다(대체 행동).
     음성 인식이 잘못 들었을 수도 있으니 늘 '혹시 ~?' 로 부드럽게. 욕설은 따라 말하지도, 글자로 남기지도 않는다.
   · 고운 말을 스스로 쓰면 무엇이 좋았는지 구체적으로 칭찬한다.
   · 들은 말은 기기(localStorage 'grow_kindTalk')에만 센다 — 부모 화면 「🌷 고운 말」.
   =========================================================== */
(function () {
'use strict';
var G = window.G;
var K = G.kind = {};

/* ---------- 고운 말 (무리별) ---------- */
K.GOOD = [
  { g: 'thanks', name: '고마워요', e: '🙏', re: /고마워|고맙습니다|고마웠|감사합니다|감사해/, praise: '"고마워" 하는 말, 정말 예쁘다! 듣는 사람 마음이 따뜻해져.' },
  { g: 'sorry', name: '미안해요', e: '🙇', re: /미안해|미안합니다|죄송합니다|죄송해요/, praise: '"미안해"라고 말하는 건 정말 용기 있는 거야. 멋지다!' },
  { g: 'hello', name: '인사', e: '👋', re: /안녕하세요|안녕히|다녀오겠습니다|다녀왔습니다|다녀올게요|잘 ?먹겠습니다|잘 ?먹었습니다|안녕/, praise: '인사를 정말 잘하네! 바르게 인사하면 모두 반가워해.' },
  { g: 'please', name: '부탁해요', e: '🤲', re: /주세요|도와줘|도와주세요|부탁해|부탁합니다|빌려 ?줄래|해 ?줄래|해도 ?돼/, praise: '예쁘게 부탁했네! 그렇게 말하면 다들 도와주고 싶어져.' },
  { g: 'praise', name: '칭찬해요', e: '👍', re: /멋지다|멋져|멋있다|잘했어|잘했다|최고야|훌륭해|대단해/, praise: '칭찬하는 말을 했네! 칭찬은 모두를 기쁘게 해.' },
  { g: 'care', name: '걱정해요', e: '💗', re: /괜찮아|괜찮니|힘내|아프지 ?마|다치지 ?않았/, praise: '다른 사람을 걱정해 주는 마음, 정말 예뻐.' },
  { g: 'love', name: '사랑해요', e: '❤️', re: /사랑해|사랑합니다|좋아해|보고 ?싶어/, praise: '자비스도 정말 좋아! 마음을 말로 해 줘서 고마워.' },
  { g: 'share', name: '함께해요', e: '🤝', re: /같이 ?하자|같이 ?놀자|먼저 ?해|나눠 ?줄게|양보/, praise: '"같이 하자"는 말, 최고야! 함께하면 더 재미있어.' },
  /* 거친 말 대신 마음을 말로 — 대체 행동이 나오면 꼭 칭찬 */
  { g: 'feel', name: '마음 말하기', e: '💬', re: /속상해|화났어|화가 ?나|답답해|아쉽다|아쉬워|혼자 ?있고 ?싶어|무서워|슬퍼/, praise: '마음을 고운 말로 말했네! 그렇게 말하면 다들 도와줄 수 있어.' }
];

/* ---------- 유행어·줄임말·아기 말 → 표준말 ----------
   to 가 함수면 맞은 말을 받아 바꾼다. 아이 말 고쳐 들려주기와 자비스 말 다듬기에 함께 쓴다. */
K.STD = [
  { re: /대박/g, from: '대박', to: '정말 멋지다' },
  { re: /(^|\s)헐(?=\s|$|[!?.~])/g, from: '헐', toLabel: '깜짝이야', to: function (m, a) { return a + '깜짝이야'; } },
  { re: /짱이다|짱이야|(^|\s)짱(?=\s|$|[!~.])/g, from: '짱', toLabel: '최고야', to: function (m, a) { return (a || '') + '최고야'; } },   /* '짱구' 같은 이름은 그대로 */
  { re: /(^|\s)개(좋|맛있|웃기|웃겨|재밌|재미있|멋있|멋져|빨라|빠르|귀여|쉬워|어려)/g, from: '개~', toLabel: '정말 ~', to: function (m, a, b) { return a + '정말 ' + b; } },
  { re: /(^|\s)(존나|졸라)\s?/g, from: '거친 꾸밈말', toLabel: '정말', crude: true, to: function (m, a) { return a + '정말 '; } },   /* 화난 말이 아니라 거친 '아주' — '정말'로 */
  { re: /존맛/g, from: '존맛', to: '정말 맛있어' },
  { re: /존잼|꿀잼/g, from: '꿀잼', to: '정말 재미있어' },
  { re: /노잼/g, from: '노잼', to: '재미없어' },
  { re: /킹받아|킹받네|빡쳐|빡치네|빡친다/g, from: '킹받아', to: '화가 나' },
  { re: /쩐다|쩔어|쩔었어/g, from: '쩐다', to: '대단해' },
  { re: /레알/g, from: '레알', to: '정말' },
  { re: /극혐/g, from: '극혐', to: '정말 싫어' },
  { re: /겁나\s?(좋|맛있|재밌|재미있|빨|크|많|멋)/g, from: '겁나', toLabel: '아주 ~', to: function (m, b) { return '아주 ' + b; } },
  { re: /디게/g, from: '디게', to: '되게' },
  { re: /(^|\s)쫌(?=\s|$)/g, from: '쫌', toLabel: '좀', to: function (m, a) { return a + '좀'; } },
  { re: /일케/g, from: '일케', to: '이렇게' },
  { re: /글케/g, from: '글케', to: '그렇게' },
  { re: /어케/g, from: '어케', to: '어떻게' },
  { re: /(^|\s)(머|모)해/g, from: '머해', toLabel: '뭐 해', to: function (m, a) { return a + '뭐 해'; } },
  { re: /맛있쪄|맛있져/g, from: '맛있쪄', to: '맛있어' },
  { re: /했쪄|했져/g, from: '했쪄', to: '했어' }
];

/* ---------- 거친 말 → 대신 쓸 고운 말 ----------
   '싫어'·'시끄러워'(느낌 말)·'때렸어'(겪은 일 말하기)는 거친 말이 아니다 — 고르지 않는다.
   swear: 욕설 — 글자로 남기지 않고 '거친 말'로만 센다. */
K.ROUGH = [
  { re: /바보|멍청/, key: '바보', feel: '속상했구나.', alt: '나 속상해' },
  { re: /꺼져|저리 ?가/, key: '저리 가', feel: '혼자 있고 싶었구나.', alt: '나 혼자 있고 싶어' },
  { re: /닥쳐|시끄러(?!워|운|웠)/, key: '시끄러', feel: '소리가 힘들었구나.', alt: '조금만 조용히 해 줄래' },
  { re: /짜증 ?나|짜증 ?난다/, key: '짜증 나', feel: '마음이 답답했구나.', alt: '나 답답해' },
  { re: /죽을래|죽여(?!서)|(^|\s)죽어[!~]*$/, key: '죽어', feel: '정말 화가 났구나.', alt: '나 정말 화났어' },   /* '벌레가 죽어 있어' 같은 말은 빼고 */
  { re: /미친|미쳤/, key: '미쳤다', feel: '깜짝 놀랐구나.', alt: '정말 놀랐어' },
  { re: /씨발|시발|씨바|ㅅㅂ|개새|병신|븅신|좆|지랄|엿 ?먹/, key: '욕', swear: true, feel: '혹시 화가 났어?', alt: '나 화났어' }
];

function norm(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }

/* 한 말 살펴보기 → { good:[무리], std:[{from,to}], rough:[{key,alt,feel,swear}], fixed:'표준말로 고친 문장' } */
K.check = function (text) {
  var t = norm(text), out = { good: [], std: [], rough: [], fixed: t };
  if (!t) return out;
  K.ROUGH.forEach(function (r) { if (r.re.test(t)) out.rough.push(r); });
  var fixed = t;
  K.STD.forEach(function (s) {
    s.re.lastIndex = 0;
    if (!s.re.test(fixed)) return;
    s.re.lastIndex = 0;
    var before = fixed;
    fixed = fixed.replace(s.re, s.to);
    if (fixed !== before) {
      out.std.push({ from: s.from, to: typeof s.to === 'string' ? s.to : s.toLabel || '', crude: !!s.crude });
    }
  });
  out.fixed = norm(fixed);
  /* 거친 말과 같이 나온 '고운 말'은 세지 않는다 (예: "바보야 안녕") */
  if (!out.rough.length) K.GOOD.forEach(function (g) { if (g.re.test(t)) out.good.push(g); });
  return out;
};

/* 자비스가 할 말 다듬기 — 유행어·줄임말을 표준말로 (AI 대답·이야기 글에) */
K.polish = function (say) {
  var s = String(say || '');
  K.STD.forEach(function (x) { x.re.lastIndex = 0; s = s.replace(x.re, x.to); });
  return s.replace(/\s{2,}/g, ' ');
};

/* 자비스의 한마디 — 거친 말 > 유행어 > 고운 말 순서. 할 말이 없으면 null.
   { say, expect(따라 말해 볼 말), kind:'rough'|'std'|'good' } */
K.reply = function (chk) {
  if (!chk) return null;
  if (chk.rough.length) {
    var r = chk.rough[0];
    return { kind: 'rough', expect: r.alt, say: r.swear ? r.feel + ' 화가 날 때는 "' + r.alt + '!" 하고 말해 줘. 자비스가 도와줄게.' : r.feel + ' 그럴 때는 "' + r.alt + '"라고 말하면 마음이 더 잘 전해져.' };
  }
  if (chk.std.length && chk.fixed) {
    /* 고쳐 말해 주기: 아이 말을 표준말로 한 번 더 — "틀렸어"도 "따라 해"도 없이 */
    return { kind: 'std', expect: '', say: '"' + chk.fixed.replace(/[.!?~]+$/, '') + '", 그렇구나!' + (chk.std.some(function (x) { return x.crude; }) ? ' "정말"이라고 하면 더 고운 말이 돼.' : '') };
  }
  if (chk.good.length) return { kind: 'good', expect: '', say: chk.good[0].praise };
  return null;
};

/* AI 에게 보낼 아이 말 — 욕설은 '(거친 말)'로 가린다 */
K.mask = function (text) {
  var t = String(text || '');
  K.ROUGH.forEach(function (r) { if (r.swear) t = t.replace(new RegExp(r.re.source, 'g'), '(거친 말)'); });
  return t.replace(/(^|\s)(존나|졸라)/g, '$1(거친 말)');
};
/* AI 에게 주는 귀띔 한 줄 */
K.hint = function (chk) {
  if (!chk) return '';
  if (chk.rough.length) return '[참고] 거친 말이 들렸어요(음성 인식이 잘못 들었을 수도 있음). 꾸짖지 말고 마음을 먼저 알아준 뒤, 대신 쓸 고운 말 "' + chk.rough[0].alt + '"를 본보기로 들려주고 expect 에 넣어 줘.';
  if (chk.std.length) return '[참고] 유행어·줄임말이 있어요: ' + chk.std.map(function (s) { return s.from + (s.to ? '→' + s.to : ''); }).join(', ') + '. "틀렸어" 하지 말고 표준말 문장 "' + chk.fixed + '"으로 자연스럽게 다시 들려줘.';
  if (chk.good.length) return '[참고] 아이가 고운 말(' + chk.good.map(function (g) { return g.name; }).join(', ') + ')을 썼어요. 무엇이 좋았는지 구체적으로 칭찬해 줘.';
  return '';
};

/* ---------- 기록 (기기에만) ----------
   { days: {날짜: {good, self, std, rough}}, good: {무리: {n, self}}, std: {유행어: {to, n, last}}, rough: {대신할말: {key, n, last}} }
   self = 놀이가 시킨 말(expect)이 아닌데 스스로 쓴 고운 말 */
K.data = function () { return G.store.get('kindTalk', { days: {}, good: {}, std: {}, rough: {} }); };
K.note = function (text, expect) {
  var chk = K.check(text);
  if (!chk.good.length && !chk.std.length && !chk.rough.length) return chk;
  var d = K.data(), day = G.today(), td = d.days[day] = d.days[day] || { good: 0, self: 0, std: 0, rough: 0 };
  var asked = (expect || []).join(' ');
  chk.good.forEach(function (g) {
    var self = !(asked && g.re.test(asked));
    var e = d.good[g.g] = d.good[g.g] || { n: 0, self: 0 };
    e.n++; td.good++; if (self) { e.self++; td.self++; }
  });
  chk.std.forEach(function (s) { var e = d.std[s.from] = d.std[s.from] || { to: s.to, n: 0 }; e.n++; e.last = day; td.std++; });
  chk.rough.forEach(function (r) { var e = d.rough[r.alt] = d.rough[r.alt] || { key: r.swear ? '거친 말(욕)' : r.key, n: 0 }; e.n++; e.last = day; td.rough++; });
  /* 60일만 남긴다 */
  var ks = Object.keys(d.days).sort(); if (ks.length > 60) ks.slice(0, ks.length - 60).forEach(function (k) { delete d.days[k]; });
  G.store.set('kindTalk', d);
  return chk;
};
K.clear = function () { G.store.set('kindTalk', { days: {}, good: {}, std: {}, rough: {} }); };

/* 최근 n일 합계 */
K.sum = function (days) {
  var d = K.data(), since = new Date(Date.now() - (days || 7) * 864e5).toISOString().slice(0, 10), s = { good: 0, self: 0, std: 0, rough: 0, days: 0 };
  Object.keys(d.days).forEach(function (k) { if (k < since) return; var x = d.days[k]; s.good += x.good; s.self += x.self; s.std += x.std; s.rough += x.rough; s.days++; });
  return s;
};
/* 코치에게 줄 요약 (낱말 그대로가 아니라 무리·횟수만, 욕설은 '거친 말'로) */
K.summaryText = function () {
  var d = K.data(), w = K.sum(7), a = K.sum(30);
  if (!a.good && !a.std && !a.rough) return '';
  var lines = ['[고운 말·표준말] 최근 7일: 고운 말 ' + w.good + '번(스스로 ' + w.self + '번), 유행어·줄임말 ' + w.std + '번, 거친 말 ' + w.rough + '번 / 30일: 고운 말 ' + a.good + ', 유행어 ' + a.std + ', 거친 말 ' + a.rough];
  var g = Object.keys(d.good).map(function (k) { var x = K.GOOD.filter(function (q) { return q.g === k; })[0]; return (x ? x.name : k) + ' ' + d.good[k].n; });
  if (g.length) lines.push('  · 고운 말 무리: ' + g.join(', '));
  var st = Object.keys(d.std).sort(function (x, y) { return d.std[y].n - d.std[x].n; }).slice(0, 6).map(function (k) { return k + '→' + (d.std[k].to || '표준말') + ' ' + d.std[k].n; });
  if (st.length) lines.push('  · 유행어→표준말: ' + st.join(', '));
  var ro = Object.keys(d.rough).map(function (k) { return d.rough[k].key + '(대신: ' + k + ') ' + d.rough[k].n; });
  if (ro.length) lines.push('  · 거친 말: ' + ro.join(', '));
  return lines.join('\n');
};

/* 부모님께 드리는 고운 말 기르기 다섯 가지 */
K.TIPS = [
  ['👄 먼저 본보기', '아이는 들은 대로 말해요. 집에서 어른끼리 "고마워", "미안해", "부탁해"를 자주, 또렷하게 말해 주세요.'],
  ['🔁 고쳐 말해 주기', '"대박!" 하면 "그렇지, 정말 멋지다!"처럼 표준말로 한 번 더 들려주세요. "틀렸어", "따라 해" 대신 자연스럽게.'],
  ['🌟 콕 집어 칭찬', '고운 말을 쓰면 바로 "\'고마워\'라고 말해 줘서 엄마 마음이 따뜻해졌어"처럼 무엇이 좋았는지 말해 주세요.'],
  ['💗 마음 먼저, 말은 다음', '거친 말은 대개 화나 속상함이에요. "속상했구나"로 마음을 읽고, "나 속상해"처럼 대신 할 말을 알려 주세요.'],
  ['🏠 우리 집 약속', '유행어는 막기보다 "집에서는 이렇게 말해요" 약속을 정하고, 지키면 칭찬 스티커를 붙여 주세요.']
];

})();

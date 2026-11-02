/* ===========================================================
   함께 자라요 — 공통 엔진 (window.G)

   놀이 파일(act-*.js)은 G.act({...}) 로 자기를 등록만 한다.
   소리·말소리 듣기·마이크·카메라·진동·기록·스티커·화면 전환은 모두 여기서 맡는다.

   ▸ 아이 정보(별명·기록·그림·사진)는 이 기기(localStorage·IndexedDB)에만 둔다.
     인터넷으로 보내는 것은 부모가 켠 AI(자비스 대화·코치)에 넣는 글뿐이고,
     그때도 아이 이름은 '아이'로 바꿔 보낸다.

   놀이 등록 모양
   G.act({
     id:'words', area:'speech', title:'낱말 카드', icon:'🍎',
     desc:'그림 보고 이름 말하기',            // 아이 화면에 보이는 짧은 말
     goal:'표현 어휘 늘리기',                  // 부모 화면 — 치료 목표
     how:'아이가 말하지 않아도 ...',          // 부모 화면 — 함께하는 법
     levels:3, needs:['mic'], tool:false, mins:3,
     run(ctx){ ... }
   })
   =========================================================== */
(function () {
'use strict';
var G = window.G = {};
var D = window.GD || {};

/* ---------- 작은 도구 ---------- */
G.$ = function (s, r) { return (r || document).querySelector(s); };
G.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
G.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
G.el = function (html) { var t = document.createElement('template'); t.innerHTML = String(html).trim(); return t.content.firstElementChild; };
G.shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
G.pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
G.sample = function (a, n) { return G.shuffle(a).slice(0, n); };
G.range = function (n) { var r = []; for (var i = 0; i < n; i++) r.push(i); return r; };
G.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
G.sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
G.today = function (d) { d = d || new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
G.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
/* 놀이가 자기 모양(CSS)을 한 번만 넣는다 */
var cssDone = {};
G.css = function (id, text) { if (cssDone[id]) return; cssDone[id] = 1; var s = document.createElement('style'); s.textContent = text; document.head.appendChild(s); };

/* 받침 있는 말 뒤에 붙는 조사: G.josa('사과','이','가') → '사과가' */
G.josa = function (w, a, b) {
  var c = String(w).charCodeAt(String(w).length - 1);
  var has = c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 > 0;
  return w + (has ? a : b);
};

/* ---------- 저장 ---------- */
var P = 'grow_';
G.store = {
  get: function (k, d) { try { var v = localStorage.getItem(P + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); return true; } catch (e) { G.toast('기기 저장 공간이 꽉 찼어요. 부모 화면에서 백업 후 정리해 주세요.'); return false; } },
  del: function (k) { try { localStorage.removeItem(P + k); } catch (e) {} }
};

/* 사진·그림처럼 큰 것은 IndexedDB 에 둔다 */
G.db = (function () {
  var dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (ok, no) {
      if (!window.indexedDB) { no(new Error('no idb')); return; }
      var r = indexedDB.open('grow', 1);
      r.onupgradeneeded = function () { var d = r.result; ['pics', 'art'].forEach(function (n) { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); }); };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { no(r.error); };
    });
    return dbp;
  }
  function tx(store, mode, fn) {
    return open().then(function (d) {
      return new Promise(function (ok, no) {
        var t = d.transaction(store, mode), s = t.objectStore(store), out = fn(s);
        t.oncomplete = function () { ok(out && out.result !== undefined ? out.result : out); };
        t.onerror = function () { no(t.error); };
      });
    });
  }
  return {
    put: function (store, obj) { return tx(store, 'readwrite', function (s) { s.put(obj); return obj; }); },
    get: function (store, id) { return tx(store, 'readonly', function (s) { return s.get(id); }); },
    all: function (store) { return tx(store, 'readonly', function (s) { return s.getAll(); }).then(function (r) { return r || []; }).catch(function () { return []; }); },
    del: function (store, id) { return tx(store, 'readwrite', function (s) { s.delete(id); }); }
  };
})();

/* ---------- 설정·아이 정보 ---------- */
G.settings = Object.assign({
  rate: 0.88,        // 자비스 말 빠르기
  pitch: 1.15,       // 자비스 목소리 높이
  voice: '',         // 고른 목소리 이름
  sound: true,       // 효과음
  vibrate: true,     // 진동
  calm: false,       // 감각 예민 모드 — 소리 작게, 반짝임·꽃가루 끄기
  sessionMin: 15,    // 오늘의 놀이 시간(분)
  praiseVoice: true, // 칭찬을 소리로
  listenMs: 6000     // 말을 기다리는 시간
}, G.store.get('settings', {}));
G.saveSettings = function () { G.store.set('settings', G.settings); applyCalm(); };

G.AREAS = {
  speech: { name: '말하기', icon: '🗣️', color: '#ff7f61', therapy: '언어치료', desc: '말·듣기·입 운동' },
  motor:  { name: '손놀이', icon: '✋', color: '#1fb38f', therapy: '작업치료', desc: '소근육·눈손 협응' },
  art:    { name: '그리기', icon: '🎨', color: '#9a74ff', therapy: '미술치료', desc: '표현·창작' },
  mind:   { name: '생각놀이', icon: '🧩', color: '#f2a900', therapy: '인지', desc: '기억·짝짓기·순서' },
  brain:  { name: '생각 힘', icon: '🧠', color: '#4b5bd6', therapy: '실행기능(전두엽)', desc: '집중·기억·참기·바꾸기' },
  feel:   { name: '마음', icon: '💗', color: '#ee5d92', therapy: '사회·정서', desc: '감정·관계·이야기' },
  body:   { name: '몸놀이', icon: '🤸', color: '#3b9cf0', therapy: '감각통합·대근육', desc: '움직임·균형' },
  calm:   { name: '쉬어가기', icon: '🌿', color: '#4caf6e', therapy: '자기조절', desc: '숨쉬기·진정' }
};
G.AREA_ORDER = ['speech', 'motor', 'art', 'mind', 'brain', 'feel', 'body', 'calm'];

/* 실행기능(전두엽이 맡는 생각 힘) — 놀이마다 ef:['wm','inhibit'] 처럼 단다.
   Diamond(2013)의 세 핵심(작업기억·억제·인지적 유연성)에 주의·계획·정서 조절을 더했다. */
G.EF = {
  attend:   { name: '주의 집중', e: '🎯', desc: '한 가지에 눈과 귀를 모으고 오래 유지하기' },
  wm:       { name: '작업 기억', e: '🧠', desc: '들은 것·본 것을 머릿속에 잠깐 담아 두고 쓰기' },
  inhibit:  { name: '참기(억제)', e: '✋', desc: '하고 싶은 대로 바로 하지 않고 멈추기·기다리기' },
  shift:    { name: '바꿔 생각하기', e: '🔄', desc: '규칙이 바뀌면 생각을 바꿔 따라가기(인지적 유연성)' },
  plan:     { name: '계획·순서', e: '🗺️', desc: '먼저-다음을 떠올리고 차례대로 해 나가기' },
  regulate: { name: '감정·자기조절', e: '🌿', desc: '마음과 몸을 알아차리고 스스로 가라앉히기' }
};

G.profile = Object.assign({ nick: '', birth: '', focus: G.AREA_ORDER.slice(), level: {}, hide: {}, therapies: [] }, G.store.get('profile', {}));
G.saveProfile = function () { G.store.set('profile', G.profile); };
G.nick = function () { return (G.profile.nick || '').trim() || '친구'; };
/* 부르는 말: 받침 따라 '민준아' / '서아야' */
G.callName = function () { var n = (G.profile.nick || '').trim(); return n ? G.josa(n, '아', '야') : '친구야'; };
G.ageMonths = function () {
  var b = G.profile.birth; if (!/^\d{4}-\d{2}/.test(b || '')) return null;
  var y = +b.slice(0, 4), m = +b.slice(5, 7), now = new Date();
  return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
};

/* ---------- 기기 기능 알아보기 ---------- */
var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
G.has = {
  tts: 'speechSynthesis' in window,
  stt: !!SR,
  mic: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  cam: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  vibrate: !!navigator.vibrate,
  motion: 'DeviceOrientationEvent' in window,
  wake: 'wakeLock' in navigator,
  touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0
};

/* ---------- 알림 띠 ---------- */
G.toast = function (msg, ms) {
  var t = G.$('#toast'); if (!t) { t = G.el('<div id="toast" role="status"></div>'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('on'); }, ms || 2600);
};

/* ---------- 효과음 (Web Audio 로 그 자리에서 만든다 — 파일 없음) ---------- */
G.sfx = (function () {
  var ac = null, master = null;
  function ctx() {
    if (!ac) {
      var A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
      ac = new A(); master = ac.createGain(); master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    master.gain.value = G.settings.calm ? 0.35 : 0.8;
    return ac;
  }
  function tone(f, t0, dur, type, vol, slideTo) {
    var a = ctx(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, a.currentTime + t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + t0 + dur);
    g.gain.setValueAtTime(0.0001, a.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, a.currentTime + t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
    o.connect(g); g.connect(master); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, hp) {
    var a = ctx(); if (!a) return;
    var n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp || 1500; s.buffer = b; g.gain.value = vol || 0.3;
    s.connect(f); f.connect(g); g.connect(master); s.start(a.currentTime + t0);
  }
  var N = { C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880, C6: 1046.5 };
  var lib = {
    tap: function () { tone(660, 0, 0.07, 'sine', 0.18); },
    pop: function () { tone(900, 0, 0.09, 'sine', 0.3, 300); noise(0, 0.05, 0.12, 2500); },
    good: function () { tone(N.C5, 0, 0.12, 'triangle', 0.28); tone(N.E5, 0.09, 0.12, 'triangle', 0.28); tone(N.G5, 0.18, 0.22, 'triangle', 0.3); },
    great: function () { [N.C5, N.E5, N.G5, N.C6].forEach(function (f, i) { tone(f, i * 0.09, 0.25, 'triangle', 0.28); }); },
    win: function () { [N.C5, N.D5, N.E5, N.G5, N.E5, N.G5, N.C6].forEach(function (f, i) { tone(f, i * 0.11, 0.3, 'triangle', 0.26); }); },
    oops: function () { tone(330, 0, 0.16, 'sine', 0.16, 262); },        // 부드러운 '음~' (꾸중 소리 아님)
    whoosh: function () { noise(0, 0.35, 0.18, 600); },
    ding: function () { tone(N.A5, 0, 0.5, 'sine', 0.25); tone(N.E5 * 2, 0, 0.4, 'sine', 0.08); },
    tick: function () { tone(1200, 0, 0.03, 'square', 0.06); },
    drum: function () { tone(140, 0, 0.18, 'sine', 0.5, 60); noise(0, 0.05, 0.08, 800); },
    shaker: function () { noise(0, 0.12, 0.25, 4000); },
    click: function () { tone(1500, 0, 0.02, 'square', 0.08); },
    up: function () { tone(400, 0, 0.25, 'sine', 0.2, 900); },
    sparkle: function () { [N.E5, N.A5, N.C6].forEach(function (f, i) { tone(f * 1.5, i * 0.05, 0.12, 'sine', 0.12); }); }
  };
  return {
    N: N,
    unlock: function () { ctx(); },
    play: function (name) { if (!G.settings.sound) return; try { (lib[name] || lib.tap)(); } catch (e) {} },
    tone: function (f, dur, type, vol, delay) { if (!G.settings.sound) return; tone(f, delay || 0, dur || 0.3, type, vol); },
    noise: function (dur, vol, hp) { if (!G.settings.sound) return; noise(0, dur, vol, hp); },
    /* 멜로디: notes = [['C5',0.5], ['E5',0.5], [null,0.25 (쉼)] ...], 박자 bpm. stop() 을 돌려준다 */
    melody: function (notes, bpm, loop) {
      var stopped = false, h = null, beat = 60 / (bpm || 110);
      function run() {
        if (stopped) return; var t = 0;
        notes.forEach(function (n) { if (n[0] && G.settings.sound) tone(N[n[0]] || n[0], t, n[1] * beat * 0.9, 'triangle', 0.18); t += n[1] * beat; });
        if (loop) h = setTimeout(run, t * 1000);
      }
      run();
      return function () { stopped = true; clearTimeout(h); };
    },
    get ctx() { return ctx(); }
  };
})();

G.buzz = function (p) { if (G.settings.vibrate && navigator.vibrate) try { navigator.vibrate(p || 20); } catch (e) {} };

/* ---------- 자비스 목소리 (기기 음성 합성) ---------- */
G.voice = (function () {
  var voices = [], chosen = null, speaking = false, endT = null, curResolve = null;
  var PREFER = /yuna|유나|sunhi|선희|heami|해미|injoon|google 한국|korean|ko-kr|female/i;
  function load() {
    if (!G.has.tts) return;
    voices = speechSynthesis.getVoices().filter(function (v) { return /^ko/i.test(v.lang); });
    chosen = voices.filter(function (v) { return v.name === G.settings.voice; })[0] ||
      voices.filter(function (v) { return /yuna|유나|sunhi|선희|google/i.test(v.name); })[0] ||
      voices.filter(function (v) { return PREFER.test(v.name); })[0] || voices[0] || null;
  }
  if (G.has.tts) { load(); speechSynthesis.onvoiceschanged = load; }
  function talking(on) {
    speaking = on;
    document.documentElement.classList.toggle('jv-talk', on);
  }
  function clean(t) { /* 이모지·기호는 읽지 않게 */
    return String(t || '').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, ' ').replace(/[~*#_]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function say(text, o) {
    o = o || {};
    var t = clean(text);
    return new Promise(function (ok) {
      stop();
      if (!t) { ok(); return; }
      var est = 700 + t.length * 160 / (o.rate || G.settings.rate);
      function done() { if (curResolve !== done) return; curResolve = null; clearTimeout(endT); talking(false); setTimeout(ok, 60); }
      curResolve = done;
      if (!G.has.tts || G.settings.mute) { talking(true); endT = setTimeout(done, est * 0.8); return; }
      try {
        var u = new SpeechSynthesisUtterance(t);
        u.lang = 'ko-KR'; if (chosen) u.voice = chosen;
        u.rate = o.rate || G.settings.rate; u.pitch = o.pitch || G.settings.pitch; u.volume = G.settings.calm ? 0.75 : 1;
        u.onstart = function () { talking(true); };
        u.onend = done; u.onerror = done;
        talking(true);
        speechSynthesis.speak(u);
        endT = setTimeout(done, est + 4000);   // onend 가 안 오는 기기 대비
      } catch (e) { done(); }
    });
  }
  function stop() {
    if (G.has.tts) try { speechSynthesis.cancel(); } catch (e) {}
    clearTimeout(endT); talking(false);
    if (curResolve) { var r = curResolve; curResolve = null; r(); }
  }
  return {
    say: say, stop: stop, load: load,
    list: function () { return voices; },
    get speaking() { return speaking; },
    unlock: function () { if (G.has.tts) try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {} }
  };
})();
G.say = function (t, o) { return G.voice.say(t, o); };

/* ---------- 말소리 듣기 (음성 인식) + 너그러운 맞춤 ----------
   발달이 늦은 아이는 '사과'를 '아과', '바나나'를 '나나'로 말하곤 한다.
   그래서 글자를 자모로 풀어 얼마나 비슷한지 보고, 절반쯤 맞으면 '말했다'로 친다. */
var CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ', JONG = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';
G.jamo = function (s) {
  var out = '';
  String(s).replace(/[^가-힣a-z0-9]/gi, '').split('').forEach(function (ch) {
    var c = ch.charCodeAt(0) - 0xAC00;
    if (c >= 0 && c <= 11171) { out += CHO[Math.floor(c / 588)] + JUNG[Math.floor((c % 588) / 28)] + (c % 28 ? JONG[c % 28] : ''); }
    else out += ch.toLowerCase();
  });
  return out;
};
function lev(a, b) {
  var m = a.length, n = b.length, d = [], i, j;
  if (!m) return n; if (!n) return m;
  for (i = 0; i <= m; i++) d[i] = [i];
  for (j = 0; j <= n; j++) d[0][j] = j;
  for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
/* 0~1: 들은 말 heard 안에 목표 낱말 target 이 얼마나 비슷하게 들어 있나 */
G.similar = function (heard, target) {
  var h = G.jamo(heard), t = G.jamo(target);
  if (!h || !t) return 0;
  if (h.indexOf(t) >= 0) return 1;
  var best = 0;
  for (var len = Math.max(1, t.length - 2); len <= t.length + 2; len++) {
    for (var i = 0; i + len <= h.length || (i === 0 && h.length < len); i++) {
      var part = h.substr(i, len), s = 1 - lev(part, t) / Math.max(part.length, t.length);
      if (s > best) best = s;
      if (i + len >= h.length) break;
    }
  }
  return best;
};

var recNow = null;
/* o: {expect:[낱말], ms, onInterim(text)} → Promise<{text, alts, score, ok, heard, unsupported, denied}> */
G.listen = function (o) {
  o = o || {};
  return new Promise(function (ok) {
    if (!SR) { ok({ unsupported: true, text: '', alts: [], score: 0, ok: false, heard: false }); return; }
    G.voice.stop();
    if (recNow) try { recNow.abort(); } catch (e) {}
    var r = new SR(), alts = [], fin = false, timer = null, got = false;
    recNow = r;
    r.lang = 'ko-KR'; r.interimResults = true; r.maxAlternatives = 5; r.continuous = false;
    document.documentElement.classList.add('jv-listen');
    function end(extra) {
      if (fin) return; fin = true; clearTimeout(timer);
      document.documentElement.classList.remove('jv-listen');
      try { r.abort(); } catch (e) {}
      if (recNow === r) recNow = null;
      var text = alts[0] || '', score = 0;
      (o.expect || []).forEach(function (w) { alts.forEach(function (a) { score = Math.max(score, G.similar(a, w)); }); });
      ok(Object.assign({ text: text, alts: alts, score: score, ok: score >= (o.threshold || 0.5), heard: !!text }, extra || {}));
    }
    r.onresult = function (e) {
      var res = e.results[e.results.length - 1], list = [];
      for (var i = 0; i < res.length; i++) list.push(res[i].transcript.trim());
      got = true;
      if (o.onInterim) try { o.onInterim(list[0]); } catch (er) {}
      if (res.isFinal) { alts = list.concat(alts); end(); }
      else { alts = list; }
    };
    r.onerror = function (e) { end({ denied: e.error === 'not-allowed' || e.error === 'service-not-allowed', error: e.error }); };
    r.onend = function () { end(); };
    try { r.start(); } catch (e) { end({ error: 'start' }); return; }
    timer = setTimeout(function () { end(); }, o.ms || G.settings.listenMs);
  });
};
G.stopListen = function () { if (recNow) try { recNow.abort(); } catch (e) {} };

/* ---------- 마이크 소리 크기·바람 소리 ----------
   G.mic() → {level() 0~1, flat() 0~1(바람 소리일수록 큼), voiced(), stop()}
   처음 0.6초 동안 방 소음을 재서 그만큼은 빼고 잰다. */
G.mic = function (o) {
  o = o || {};
  if (!G.has.mic) return Promise.reject(new Error('nomic'));
  return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (stream) {
    var a = G.sfx.ctx, src = a.createMediaStreamSource(stream), an = a.createAnalyser();
    an.fftSize = 1024; an.smoothingTimeConstant = 0.6; src.connect(an);
    var td = new Float32Array(an.fftSize), fd = new Uint8Array(an.frequencyBinCount);
    var floor = 0.01, t0 = performance.now(), sm = 0, stopped = false;
    function rms() { an.getFloatTimeDomainData ? an.getFloatTimeDomainData(td) : null; var s = 0; for (var i = 0; i < td.length; i++) s += td[i] * td[i]; return Math.sqrt(s / td.length); }
    var api = {
      stream: stream,
      raw: rms,
      level: function () {
        if (stopped) return 0;
        var v = rms();
        if (performance.now() - t0 < 600) { floor = Math.max(floor, v * 1.3); return 0; }
        var x = G.clamp((v - floor) / (o.range || 0.18), 0, 1);
        sm = sm * 0.6 + x * 0.4; return sm;
      },
      /* 스펙트럼 평탄도 — 후~ 부는 소리(바람)는 높고, 목소리는 낮다 */
      flat: function () {
        an.getByteFrequencyData(fd);
        var lo = 8, hi = Math.min(fd.length, 300), g = 0, ar = 0, n = 0;
        for (var i = lo; i < hi; i++) { var v = fd[i] + 1; g += Math.log(v); ar += v; n++; }
        return n ? Math.exp(g / n) / (ar / n) : 0;
      },
      /* 가장 센 주파수(Hz) — 목소리 높낮이 놀이용 */
      pitch: function () {
        an.getByteFrequencyData(fd); var bi = 0, bv = 0;
        for (var i = 3; i < 120; i++) if (fd[i] > bv) { bv = fd[i]; bi = i; }
        return bv > 90 ? bi * a.sampleRate / an.fftSize : 0;
      },
      stop: function () { stopped = true; try { src.disconnect(); } catch (e) {} stream.getTracks().forEach(function (t) { t.stop(); }); }
    };
    return api;
  });
};

/* ---------- 카메라 (거울 놀이) ---------- */
G.camera = function (video, o) {
  o = o || {};
  if (!G.has.cam) return Promise.reject(new Error('nocam'));
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: o.facing || 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false }).then(function (stream) {
    video.setAttribute('playsinline', ''); video.muted = true; video.srcObject = stream;
    if ((o.facing || 'user') === 'user') video.style.transform = 'scaleX(-1)';
    var p = video.play(); if (p && p.catch) p.catch(function () {});
    return { stream: stream, stop: function () { stream.getTracks().forEach(function (t) { t.stop(); }); video.srcObject = null; } };
  });
};

/* ---------- 화면 켜 두기 ---------- */
var wakeL = null;
G.wake = function (on) {
  if (!G.has.wake) return;
  if (on && !wakeL) navigator.wakeLock.request('screen').then(function (l) { wakeL = l; l.addEventListener('release', function () { wakeL = null; }); }).catch(function () {});
  if (!on && wakeL) { wakeL.release().catch(function () {}); wakeL = null; }
};
document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && G.cur) G.wake(true); });

/* ---------- 자비스 얼굴 ---------- */
G.jarvisSVG = function (cls) {
  return '<svg class="jv ' + (cls || '') + '" viewBox="0 0 120 120" aria-hidden="true">' +
    '<line x1="60" y1="14" x2="60" y2="26" class="jv-ant"/><circle cx="60" cy="11" r="6" class="jv-bulb"/>' +
    '<rect x="14" y="26" width="92" height="76" rx="30" class="jv-head"/>' +
    '<rect x="24" y="38" width="72" height="50" rx="22" class="jv-face"/>' +
    '<g class="jv-eyes"><ellipse cx="46" cy="58" rx="7" ry="9" class="jv-eye"/><ellipse cx="74" cy="58" rx="7" ry="9" class="jv-eye"/>' +
    '<circle cx="48.5" cy="55" r="2.4" class="jv-shine"/><circle cx="76.5" cy="55" r="2.4" class="jv-shine"/></g>' +
    '<circle cx="34" cy="73" r="5" class="jv-cheek"/><circle cx="86" cy="73" r="5" class="jv-cheek"/>' +
    '<path d="M50 74 Q60 82 70 74" class="jv-smile"/><ellipse cx="60" cy="77" rx="7" ry="5" class="jv-mouth"/>' +
    '<rect x="6" y="54" width="10" height="22" rx="5" class="jv-ear"/><rect x="104" y="54" width="10" height="22" rx="5" class="jv-ear"/>' +
    '</svg>';
};

/* ---------- 효과: 별·꽃가루 ---------- */
G.fx = {
  burst: function (x, y, chars) {
    if (G.settings.calm) return;
    chars = chars || ['⭐', '✨', '🌟'];
    for (var i = 0; i < 8; i++) {
      var s = G.el('<span class="fx-star">' + G.pick(chars) + '</span>'), ang = (i / 8) * Math.PI * 2, r = 60 + Math.random() * 50;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.setProperty('--dx', Math.cos(ang) * r + 'px'); s.style.setProperty('--dy', Math.sin(ang) * r + 'px');
      document.body.appendChild(s); setTimeout(function (n) { n.remove(); }.bind(null, s), 900);
    }
  },
  confetti: function (n) {
    if (G.settings.calm) return;
    var cols = ['#ff7f61', '#ffd54f', '#4fc3a1', '#64b5f6', '#b388ff', '#f48fb1'];
    for (var i = 0; i < (n || 40); i++) {
      var c = G.el('<i class="fx-conf"></i>');
      c.style.left = Math.random() * 100 + 'vw'; c.style.background = G.pick(cols);
      c.style.animationDelay = Math.random() * 0.4 + 's'; c.style.animationDuration = 1.6 + Math.random() * 1.2 + 's';
      c.style.setProperty('--rx', (Math.random() * 720 - 360) + 'deg');
      document.body.appendChild(c); setTimeout(function (n) { n.remove(); }.bind(null, c), 3200);
    }
  },
  center: function (el) { var r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
};

/* ---------- 기록 ----------
   하나의 놀이를 마치면 한 줄: {t, d(날짜), id, area, lv, n(시도), ok(맞음), ms, x(덧붙임)} */
G.logs = function () { return G.store.get('logs', []); };
G.log = function (e) {
  var L = G.logs(); L.push(e);
  if (L.length > 4000) L = L.slice(-4000);
  G.store.set('logs', L);
};
G.logsFor = function (id) { return G.logs().filter(function (l) { return l.id === id; }); };

/* 단계 맞추기 — 최근 세 번이 잘 되면 올리고(정답 85%↑), 힘들면(50%↓) 내린다.
   부모가 정해 둔 단계(profile.level[id])가 있으면 그것을 쓴다. */
G.levelFor = function (id, max) {
  max = max || 3;
  var fixed = G.profile.level && G.profile.level[id];
  if (fixed) return G.clamp(fixed, 1, max);
  var L = G.logsFor(id).filter(function (l) { return l.n > 0; }).slice(-3);
  if (!L.length) return 1;
  var last = L[L.length - 1].lv || 1;
  var acc = L.reduce(function (s, l) { return s + l.ok / l.n; }, 0) / L.length;
  if (L.length >= 2 && acc >= 0.85) return Math.min(max, last + 1);
  if (acc <= 0.5) return Math.max(1, last - 1);
  return last;
};

/* ---------- 스티커 ---------- */
G.stickers = function () { return G.store.get('stickers', { have: [], count: 0, stars: 0 }); };
G.giveSticker = function () {
  var s = G.stickers(), all = D.STICKERS || ['⭐'];
  var left = all.filter(function (x) { return s.have.indexOf(x) < 0; });
  var one = left.length ? G.pick(left) : G.pick(all);
  if (s.have.indexOf(one) < 0) s.have.push(one);
  s.count++; s.stars += 3;
  G.store.set('stickers', s);
  return one;
};

/* ---------- 놀이 등록 ---------- */
G.acts = {};
G.act = function (def) {
  def.levels = def.levels || 1;
  def.needs = def.needs || [];
  G.acts[def.id] = def;
};
G.actsIn = function (area) {
  return Object.keys(G.acts).map(function (k) { return G.acts[k]; })
    .filter(function (a) { return a.area === area && !(G.profile.hide || {})[a.id]; })
    .sort(function (a, b) { return (a.order || 50) - (b.order || 50); });
};

/* ---------- 화면 고르기 도우미 ---------- */
G.ui = {};
/* 큰 그림 단추 여러 개. items 각각을 render 로 그리고, 누르면 onPick(item, el, i).
   onPick 이 true 를 돌려주면 다른 단추를 잠근다. o.cols 로 칸 수, o.size 'xl'|'lg'|'md' */
G.ui.choices = function (box, items, o) {
  o = o || {};
  var g = G.el('<div class="choices c' + (o.cols || Math.min(items.length, items.length > 4 ? 3 : items.length)) + ' ' + (o.size || 'lg') + '"></div>');
  var locked = false;
  items.forEach(function (it, i) {
    var b = G.el('<button class="choice" type="button"></button>');
    b.innerHTML = o.render ? o.render(it, i) : '<span class="ce">' + it.e + '</span>' + (o.label === false ? '' : '<span class="cl">' + G.esc(it.w || it.name || '') + '</span>');
    if (o.color) b.style.setProperty('--cc', o.color(it));
    b.addEventListener('click', function () {
      if (locked || b.disabled) return;
      G.sfx.play('tap'); G.buzz(10);
      var r = o.onPick && o.onPick(it, b, i);
      if (r === true) { locked = true; g.classList.add('locked'); }
    });
    b._item = it;
    g.appendChild(b);
  });
  box.appendChild(g);
  return { el: g, buttons: G.$$('.choice', g), unlock: function () { locked = false; g.classList.remove('locked'); } };
};
/* 정답 쪽을 살살 빛나게 — 두 번 틀리면 놀이가 불러서 답을 보여 준다(실패 없는 배움) */
G.ui.hint = function (el) { if (!el) return; el.classList.remove('hint'); void el.offsetWidth; el.classList.add('hint'); };
G.ui.wiggle = function (el) { if (!el) return; el.classList.remove('wiggle'); void el.offsetWidth; el.classList.add('wiggle'); };
G.ui.good = function (el) { if (!el) return; el.classList.add('right'); var c = G.fx.center(el); G.fx.burst(c[0], c[1]); };

/* 끌어다 놓기. o.onDrop(x, y, el) 가 true 면 그 자리에 두고, 아니면 제자리로 돌아간다 */
G.ui.drag = function (el, o) {
  o = o || {};
  var sx = 0, sy = 0, ox = 0, oy = 0, on = false, pid = null;
  el.style.touchAction = 'none';
  function down(e) {
    if (el.classList.contains('placed')) return;
    on = true; pid = e.pointerId; try { el.setPointerCapture(pid); } catch (er) {}
    sx = e.clientX; sy = e.clientY; ox = 0; oy = 0;
    el.classList.add('dragging'); G.sfx.play('tap'); if (o.onStart) o.onStart(el);
  }
  function move(e) {
    if (!on || e.pointerId !== pid) return;
    ox = e.clientX - sx; oy = e.clientY - sy;
    el.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(1.08)';
    if (o.onMove) o.onMove(e.clientX, e.clientY, el);
  }
  function up(e) {
    if (!on || e.pointerId !== pid) return; on = false;
    el.classList.remove('dragging');
    var ok = o.onDrop ? o.onDrop(e.clientX, e.clientY, el) : false;
    if (!ok) { el.style.transition = 'transform .25s'; el.style.transform = ''; setTimeout(function () { el.style.transition = ''; }, 260); }
  }
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
};
/* (x,y) 가 el 안에 있나 (여유 pad px) */
G.ui.inside = function (x, y, el, pad) { var r = el.getBoundingClientRect(); pad = pad || 0; return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad; };

/* 화면 크기에 맞는 그림판. {cv, c(2d), w, h, dpr, clear()} — 크기가 바뀌면 o.onResize */
G.ui.canvas = function (box, o) {
  o = o || {};
  var cv = document.createElement('canvas'); cv.className = 'gcv'; box.appendChild(cv);
  var api = { cv: cv, c: cv.getContext('2d'), w: 0, h: 0, dpr: 1 };
  function fit() {
    var r = box.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var w = Math.max(10, Math.floor(r.width)), h = Math.max(10, Math.floor(o.height || r.height));
    if (w === api.w && h === api.h) return;
    var keep = null;
    if (o.keep && api.w) { keep = document.createElement('canvas'); keep.width = cv.width; keep.height = cv.height; keep.getContext('2d').drawImage(cv, 0, 0); }
    api.w = w; api.h = h; api.dpr = dpr;
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    api.c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (keep) api.c.drawImage(keep, 0, 0, keep.width / dpr, keep.height / dpr);
    if (o.onResize) o.onResize(api);
  }
  api.fit = fit;
  api.clear = function () { api.c.clearRect(0, 0, api.w, api.h); };
  api.pos = function (e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure && e.pointerType === 'pen' ? e.pressure : 0.5 }; };
  requestAnimationFrame(fit);
  var ro = window.ResizeObserver ? new ResizeObserver(function () { fit(); }) : null;
  if (ro) ro.observe(box); else window.addEventListener('resize', fit);
  api.destroy = function () { if (ro) ro.disconnect(); else window.removeEventListener('resize', fit); };
  return api;
};

/* ---------- 놀이 무대 ---------- */
G.cur = null;          // 지금 하는 놀이의 ctx
G.session = null;      // 오늘의 놀이 진행 {list, i, start, done:[]}

function stageEls() {
  return { st: G.$('#stage'), body: G.$('#stBody'), title: G.$('#stTitle'), dots: G.$('#stDots'), bubble: G.$('#stBubble'), sess: G.$('#stSess') };
}

/* 놀이 시작 */
G.start = function (id, o) {
  o = o || {};
  var def = G.acts[id]; if (!def) { G.toast('준비 중인 놀이예요'); return; }
  G.exit(true);
  var E = stageEls();
  var lv = o.level || G.levelFor(id, def.levels);
  var ctx = {
    def: def, id: id, level: lv, alive: true, body: E.body, t0: Date.now(), n: 0, ok: 0, extra: {}, _clean: [], instr: '',
    say: function (t, so) { if (!ctx.alive) return Promise.resolve(); so = so || {}; E.bubble.textContent = String(t).replace(/\s+/g, ' '); E.bubble.classList.add('on'); if (so.repeat !== false) ctx.instr = t; return G.say(t, so).then(function () { return ctx.alive ? undefined : new Promise(function () {}); }); },
    bubble: function (t) { E.bubble.textContent = t; E.bubble.classList.toggle('on', !!t); },
    cheer: function (t, el) {
      if (!ctx.alive) return Promise.resolve();
      G.sfx.play('good'); G.buzz([15, 40, 15]);
      if (el) G.ui.good(el); else { var c = [innerWidth / 2, innerHeight * 0.45]; G.fx.burst(c[0], c[1]); }
      return G.settings.praiseVoice ? ctx.say(t || G.pick(D.PRAISE), { repeat: false }) : G.sleep(500);
    },
    oops: function (t, el) {
      if (!ctx.alive) return Promise.resolve();
      G.sfx.play('oops'); if (el) G.ui.wiggle(el);
      return ctx.say(t || G.pick(D.TRY), { repeat: false });
    },
    trial: function (ok) { ctx.n++; if (ok) ctx.ok++; },
    progress: function (i, n) {
      /* 점이 많으면 머리말이 밀리므로 10개 넘으면 '3/12' 글자로 */
      if (n > 10) { E.dots.innerHTML = '<b class="dots-n">' + Math.min(i + 1, n) + '/' + n + '</b>'; return; }
      E.dots.innerHTML = G.range(n).map(function (k) { return '<i class="' + (k < i ? 'done' : k === i ? 'now' : '') + '"></i>'; }).join('');
    },
    wait: function (ms) { return new Promise(function (r) { var h = setTimeout(function () { if (ctx.alive) r(); }, ms); ctx._clean.push(function () { clearTimeout(h); }); }); },
    timeout: function (fn, ms) { var h = setTimeout(function () { if (ctx.alive) fn(); }, ms); ctx._clean.push(function () { clearTimeout(h); }); return h; },
    interval: function (fn, ms) { var h = setInterval(function () { if (ctx.alive) fn(); }, ms); ctx._clean.push(function () { clearInterval(h); }); return h; },
    /* 매 장면 fn(dt초, 지난시간초). false 를 돌려주면 멈춘다 */
    loop: function (fn) {
      var last = performance.now(), start = last, id = 0;
      function f(now) { if (!ctx.alive) return; var dt = Math.min(0.05, (now - last) / 1000); last = now; if (fn(dt, (now - start) / 1000) === false) return; id = requestAnimationFrame(f); }
      id = requestAnimationFrame(f); ctx._clean.push(function () { cancelAnimationFrame(id); });
    },
    on: function (tg, ev, fn, op) { tg.addEventListener(ev, fn, op); ctx._clean.push(function () { tg.removeEventListener(ev, fn, op); }); },
    cleanup: function (fn) { ctx._clean.push(fn); },
    listen: function (lo) { ctx._clean.push(G.stopListen); return G.listen(lo).then(function (r) { return ctx.alive ? r : new Promise(function () {}); }); },
    mic: function (mo) { return G.mic(mo).then(function (m) { if (!ctx.alive) { m.stop(); return new Promise(function () {}); } ctx._clean.push(m.stop); return m; }); },
    camera: function (v, co) { return G.camera(v, co).then(function (c) { if (!ctx.alive) { c.stop(); return new Promise(function () {}); } ctx._clean.push(c.stop); return c; }); },
    choices: function (items, co) { return G.ui.choices(ctx.body, items, co); },
    canvas: function (box, co) { var c = G.ui.canvas(box || ctx.body, co); ctx._clean.push(c.destroy); return c; },
    /* 부모가 '말했어요/했어요' 를 눌러 주는 큰 단추 둘 (음성 인식이 없거나 몸으로 하는 놀이) */
    parentJudge: function (box, labels) {
      if (Array.isArray(box)) { labels = box; box = null; }   /* parentJudge(['👍 …','🔁 …']) 도 된다 */
      labels = labels || ['👍 했어요', '🔁 다시'];
      return new Promise(function (ok) {
        var w = G.el('<div class="judge"><button class="btn big yes">' + labels[0] + '</button><button class="btn big soft no">' + labels[1] + '</button></div>');
        (box || ctx.body).appendChild(w);
        w.querySelector('.yes').onclick = function () { G.sfx.play('tap'); w.remove(); ok(true); };
        w.querySelector('.no').onclick = function () { G.sfx.play('tap'); w.remove(); ok(false); };
      });
    },
    finish: function (x) { finish(ctx, x || {}); }
  };
  G.cur = ctx;
  E.title.innerHTML = '<span>' + def.icon + '</span> ' + G.esc(def.title) + (def.levels > 1 ? ' <small class="lv">' + '★'.repeat(lv) + '</small>' : '');
  E.dots.innerHTML = ''; E.bubble.textContent = ''; E.bubble.classList.remove('on');
  E.body.innerHTML = ''; E.body.className = 'st-body act-' + id;
  E.st.style.setProperty('--area', (G.AREAS[def.area] || {}).color || '#4f8cff');
  if (G.session) { var s = G.session; E.sess.hidden = false; E.sess.innerHTML = '<b style="width:' + Math.round(s.i / s.list.length * 100) + '%"></b>'; }
  else E.sess.hidden = true;
  showScreen('stage');
  var tt = G.$('#toast'); if (tt) tt.classList.remove('on');   /* 알림 띠가 놀이 단추를 가리지 않게 */
  G.wake(true);
  if (!/#\/play\//.test(location.hash)) { history.pushState({ play: id }, '', '#/play/' + id); }
  try { def.run(ctx); } catch (e) { console.error(e); G.toast('놀이를 여는 중 문제가 생겼어요'); }
};

/* 놀이 끝내기(중간에 나가기) */
G.exit = function (silent) {
  var c = G.cur; if (!c) return;
  c.alive = false; G.cur = null;
  G.voice.stop(); G.stopListen();
  c._clean.forEach(function (f) { try { f(); } catch (e) {} });
  c._clean = [];
  G.wake(false);
  if (!silent && c.n > 0 && !c.def.tool) {  /* 하다 만 것도 기록은 남긴다 (스티커는 없음) */
    G.log({ t: Date.now(), d: G.today(), id: c.id, area: c.def.area, lv: c.level, n: c.n, ok: c.ok, ms: Date.now() - c.t0, x: Object.assign({ quit: 1 }, c.extra) });
  }
};

function finish(ctx, x) {
  if (!ctx.alive) return;
  var def = ctx.def, ms = Date.now() - ctx.t0;
  if (!def.tool) G.log({ t: Date.now(), d: G.today(), id: ctx.id, area: def.area, lv: ctx.level, n: ctx.n, ok: ctx.ok, ms: ms, x: Object.assign({}, ctx.extra, x.extra || {}) });
  ctx.alive = false;
  G.voice.stop(); G.stopListen();
  ctx._clean.forEach(function (f) { try { f(); } catch (e) {} }); ctx._clean = [];
  G.cur = null; G.wake(false);
  if (def.tool && !x.reward) { G.home(); return; }
  /* 상 화면 — 아이에게는 언제나 별 셋. 맞고 틀림은 부모 화면에만 */
  var stk = G.giveSticker();
  var inSess = !!G.session;
  if (inSess) G.session.done.push(ctx.id);
  var ov = G.el('<div class="reward" role="dialog">' +
    '<div class="rw-card"><div class="rw-stars"><span>⭐</span><span>⭐</span><span>⭐</span></div>' +
    '<div class="rw-jv">' + G.jarvisSVG('big') + '</div>' +
    '<div class="rw-msg">' + G.esc(x.msg || G.pick(D.DONE)) + '</div>' +
    '<div class="rw-stk"><small>새 스티커</small><b>' + stk + '</b></div>' +
    '<div class="rw-btns">' + (inSess ? '<button class="btn big go">다음 놀이 ▶</button>' : '<button class="btn big again">🔁 한 번 더</button>') +
    '<button class="btn big soft home">🏠 처음으로</button></div></div></div>');
  document.body.appendChild(ov);
  G.sfx.play('win'); G.fx.confetti(); G.buzz([30, 60, 30, 60, 60]);
  G.say((x.msg || G.pick(D.DONE)));
  function close() { ov.remove(); G.voice.stop(); }
  var go = ov.querySelector('.go'), again = ov.querySelector('.again');
  if (go) go.onclick = function () { close(); G.nextInSession(); };
  if (again) again.onclick = function () { close(); G.start(ctx.id); };
  ov.querySelector('.home').onclick = function () { close(); G.session = null; G.home(); };
}

/* ---------- 오늘의 놀이 (하루 10~20분 꾸러미) ----------
   기분 묻기 → (아이가 둘 중 하나 고르기) × 3~5 → 쉬어가기로 마무리.
   · 실행기능(생각 힘) 놀이를 하루 하나는 꼭 넣는다.
   · 15분 넘는 날은 가운데에 몸놀이를 넣는다 — 화면에서 눈을 떼고 몸을 쓰면 집중과 조절에 도움이 된다.
   · 스스로 고르게 하면 아이가 더 즐겁게, 오래 참여한다(선택하기). */
G.planToday = function () {
  var focus = (G.profile.focus && G.profile.focus.length ? G.profile.focus : G.AREA_ORDER).filter(function (a) { return a !== 'calm' && G.AREAS[a]; });
  var seed = +G.today().replace(/-/g, '') + G.store.get('sessionsToday', { d: '', n: 0 }).n * 7, list = [];
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  var used = {}, recent = G.logs().slice(-40).map(function (l) { return l.id; });
  function freq(id) { return recent.filter(function (r) { return r === id; }).length; }
  function poolOf(a) {
    return G.actsIn(a).filter(function (d) { return !d.tool && !used[d.id] && d.id !== 'checkin' && d.id !== 'chat' && (!d.needs.length || d.needs.every(function (n) { return G.has[n]; })); })
      .sort(function (x, y) { return freq(x.id) - freq(y.id) || rnd() - 0.5; });   /* 요즘 덜 한 놀이를 먼저 */
  }
  function slot(a) {
    var p = poolOf(a); if (!p.length) return null;
    var two = p.slice(0, 2).map(function (d) { used[d.id] = 1; return d.id; });
    return two.length === 2 ? { pick: two } : two[0];
  }
  if (G.acts.checkin) list.push('checkin');
  var count = G.settings.sessionMin <= 10 ? 3 : G.settings.sessionMin <= 15 ? 4 : 5;
  var areas = focus.filter(function (a) { return a !== 'body' && a !== 'brain'; }).sort(function () { return rnd() - 0.5; });
  var slots = [];
  if (focus.indexOf('brain') >= 0 || !focus.length) { var br = slot('brain'); if (br) slots.push(br); }
  for (var k = 0; slots.length < count && k < 24 && areas.length; k++) { var sl = slot(areas[k % areas.length]); if (sl) slots.push(sl); }
  if (G.settings.sessionMin >= 15 && focus.indexOf('body') >= 0) { var bd = slot('body'); if (bd) slots.splice(Math.ceil(slots.length / 2), 0, bd); }
  list = list.concat(slots);
  var calm = poolOf('calm');
  if (calm.length) list.push(calm[Math.floor(rnd() * calm.length)].id);
  return list;
};
G.startSession = function () {
  var list = G.planToday();
  if (!list.length) { G.toast('놀이가 아직 없어요'); return; }
  var st = G.store.get('sessionsToday', { d: '', n: 0 }); if (st.d !== G.today()) st = { d: G.today(), n: 0 }; st.n++; G.store.set('sessionsToday', st);
  G.session = { list: list, i: 0, start: Date.now(), done: [] };
  G.say(G.callName() + ', 오늘도 자비스랑 같이 놀자!').then(function () { if (G.session) G.runSlot(G.session.list[0]); });
};
/* 한 칸 시작 — 둘 중 고르기면 고르는 화면부터 */
G.runSlot = function (entry) {
  if (typeof entry === 'string') { G.start(entry); return; }
  var a = G.acts[entry.pick[0]], b = G.acts[entry.pick[1]];
  if (!a || !b) { G.start((a || b).id); return; }
  G.exit(true);
  var E = stageEls();
  E.title.innerHTML = '<span>🤔</span> 뭐 하고 놀까?'; E.dots.innerHTML = '';
  E.body.innerHTML = ''; E.body.className = 'st-body act-pick';
  E.st.style.setProperty('--area', '#4f8cff');
  var s = G.session; if (s) { E.sess.hidden = false; E.sess.innerHTML = '<b style="width:' + Math.round(s.i / s.list.length * 100) + '%"></b>'; }
  showScreen('stage');
  G.css('pick', '.act-pick .choices{max-width:720px}.act-pick .choice{min-height:clamp(180px,42vw,300px);border-bottom:8px solid var(--cc)}.act-pick .choice .ce{font-size:clamp(70px,20vw,130px)}.act-pick .choice small{color:var(--soft);font-size:clamp(13px,3.4vw,16px)}');
  G.ui.choices(E.body, [a, b], {
    cols: 2, size: 'xl',
    color: function (d) { return (G.AREAS[d.area] || {}).color; },
    render: function (d) { return '<span class="ce">' + d.icon + '</span><span class="cl">' + G.esc(d.title) + '</span><small>' + G.esc(d.desc || '') + '</small>'; },
    onPick: function (d) { G.voice.stop(); setTimeout(function () { G.start(d.id); }, 250); return true; }
  });
  var q = G.josa(a.title, '이랑', '랑') + ' ' + b.title + ', 뭐 하고 싶어?';
  E.bubble.textContent = q; E.bubble.classList.add('on');
  G.say(q);
};
G.nextInSession = function () {
  var s = G.session; if (!s) { G.home(); return; }
  s.i++;
  var over = (Date.now() - s.start) / 60000 >= G.settings.sessionMin;
  /* 시간이 다 됐어도 마무리 쉬어가기는 하고 끝낸다 */
  if (over && s.i < s.list.length - 1) s.i = s.list.length - 1;
  if (s.i >= s.list.length) {
    G.session = null;
    G.store.set('lastSession', { d: G.today(), n: s.done.length });
    var sd = G.store.get('sessionDays', []); if (sd.indexOf(G.today()) < 0) { sd.push(G.today()); G.store.set('sessionDays', sd.slice(-400)); }
    G.home();
    G.fx.confetti(60); G.sfx.play('win');
    G.say('오늘의 놀이 끝! ' + G.callName() + ', 정말 멋졌어. 이제 화면은 쉬고, 엄마 아빠랑 몸으로 놀자!');
    G.toast('🎉 오늘의 놀이를 모두 마쳤어요! 이제 화면을 쉬어요', 4500);
    return;
  }
  G.runSlot(s.list[s.i]);
};

/* ---------- 화면 전환 ---------- */
function showScreen(id) {
  G.$$('.screen').forEach(function (s) { s.classList.toggle('on', s.id === id); });
  document.documentElement.dataset.screen = id;
  window.scrollTo(0, 0);
}
G.showScreen = showScreen;
G.home = function () {
  G.exit(); showScreen('home');
  if (G.renderHome) G.renderHome();
  if (/#\/play\//.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
};
window.addEventListener('popstate', function () {
  if (G.cur && !/#\/play\//.test(location.hash)) { G.session = null; G.home(); }
  else if (!G.cur && document.documentElement.dataset.screen !== 'home' && !location.hash) G.home();
});

/* 감각 예민 모드 */
function applyCalm() { document.documentElement.classList.toggle('calm', !!G.settings.calm); }
applyCalm();

/* 처음 손이 닿을 때 소리·목소리를 깨운다 (아이폰은 이걸 해야 소리가 난다) */
function unlockOnce() { G.sfx.unlock(); G.voice.unlock(); document.removeEventListener('pointerdown', unlockOnce, true); }
document.addEventListener('pointerdown', unlockOnce, true);

/* ---------- 어른 확인 (아이가 부모 화면에 들어가지 않게) ---------- */
G.grownUp = function () {
  return new Promise(function (ok) {
    var a = 2 + Math.floor(Math.random() * 6), b = 2 + Math.floor(Math.random() * 6), ans = a + b;
    var opts = G.shuffle([ans, ans + 1, ans - 1, ans + 2].filter(function (v, i, s) { return s.indexOf(v) === i; }));
    var ov = G.el('<div class="modal"><div class="md-card"><h3>👨‍👩‍👦 어른 확인</h3><p>부모 화면으로 가려면 답을 눌러 주세요.</p>' +
      '<div class="md-q">' + a + ' + ' + b + ' = ?</div><div class="md-opts">' + opts.map(function (v) { return '<button class="btn">' + v + '</button>'; }).join('') + '</div>' +
      '<button class="btn soft md-x">닫기</button></div></div>');
    document.body.appendChild(ov);
    G.$$('.md-opts .btn', ov).forEach(function (b) { b.onclick = function () { var r = +b.textContent === ans; ov.remove(); if (!r) G.toast('다시 해 볼까요?'); ok(r); }; });
    ov.querySelector('.md-x').onclick = function () { ov.remove(); ok(false); };
  });
};
})();

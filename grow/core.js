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
      var r = indexedDB.open('grow', 3);
      r.onupgradeneeded = function () { var d = r.result; ['pics', 'art', 'tts', 'speech'].forEach(function (n) { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n, { keyPath: 'id' }); }); };
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
  rate: 0.95,        // 자비스 말 빠르기 — 또렷하고 자신 있게
  pitch: 1.0,        // 자비스 목소리 높이 — 형 목소리
  voice: '',         // 고른 목소리 이름 (비우면 남자 목소리를 찾아 고른다)
  elOn: false,       // ElevenLabs 고급 목소리
  elVoice: 'nbrxrAz3eYm9NgojrmFK',   // Min-joon — 밝고 자신 있는 젊은 남성(한국어)
  elModel: 'eleven_multilingual_v2',
  elName: false,     // 고급 목소리에 아이 별명도 보내기 (기본: 안 보냄)
  recVoice: true,    // 아이가 한 말 자동 기록 (글)
  recAudio: true,    // 소리도 녹음 (기기가 허락하면)
  recDays: 90,       // 소리 파일 보관 일수 (글은 남는다)
  sound: true,       // 효과음
  vibrate: true,     // 진동
  calm: false,       // 감각 예민 모드 — 소리 작게, 반짝임·꽃가루 끄기
  sessionMin: 15,    // 오늘의 놀이 시간(분)
  praiseVoice: true, // 칭찬을 소리로
  listenMs: 6000     // 말을 기다리는 시간
}, G.store.get('settings', {}));
/* 예전 판(아기 목소리) 설정을 형 목소리로 옮긴다 */
if ((G.settings.v || 1) < 2) {
  if (G.settings.rate === 0.88) G.settings.rate = 0.95;
  if (G.settings.pitch === 1.15) G.settings.pitch = 1.0;
  G.settings.voice = ''; G.settings.v = 2;
  try { localStorage.setItem('grow_settings', JSON.stringify(G.settings)); } catch (e) {}
}
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
/* 초등학생(7살·84개월 이상)이면 '형' 말투·히어로 미션. 부모가 설정에서 바꿀 수 있다 */
G.older = function () {
  var st = G.profile.style || 'auto';
  if (st === 'hero') return true; if (st === 'little') return false;
  var m = G.ageMonths(); return m == null ? true : m >= 84;
};
/* 칭찬·격려·마침 말은 나이에 맞는 묶음을 고른다 (놀이 파일은 D.PRAISE 를 그대로 쓰면 된다) */
['PRAISE', 'TRY', 'DONE'].forEach(function (k) {
  var little = D[k];
  if (!little) return;
  D[k + '_LITTLE'] = little;
  Object.defineProperty(D, k, { configurable: true, get: function () { return G.older() && D[k + '_HERO'] ? D[k + '_HERO'] : D[k + '_LITTLE']; } });
});
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
    tick: function () { tone(880, 0, 0.05, 'sine', 0.05); },             // 부드러운 똑
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
    /* 멜로디: notes = [['C5',0.5], ['E5',0.5], [null,0.25 (쉼)] ...], 박자 bpm. stop() 을 돌려준다.
       음을 하나씩 예약해서 stop() 하면 바로 멈춘다 (멈춰 놀이에서 중요) */
    melody: function (notes, bpm, loop) {
      var stopped = false, h = null, beat = 60 / (bpm || 110), i = 0;
      function step() {
        if (stopped) return;
        if (i >= notes.length) { if (!loop) return; i = 0; }
        var n = notes[i++];
        if (n[0] && G.settings.sound) tone(N[n[0]] || n[0], 0, n[1] * beat * 0.9, 'triangle', 0.18);
        h = setTimeout(step, n[1] * beat * 1000);
      }
      step();
      return function () { stopped = true; clearTimeout(h); };
    },
    get ctx() { return ctx(); }
  };
})();

G.buzz = function (p) { if (G.settings.vibrate && !G.settings.calm && navigator.vibrate) try { navigator.vibrate(p || 20); } catch (e) {} };

/* ---------- 자비스 목소리 (기기 음성 합성) ---------- */
G.voice = (function () {
  var voices = [], chosen = null, speaking = false, endT = null, curResolve = null;
  /* 기기마다 목소리 이름이 다르다 — 남자 목소리를 알아보는 이름들
     안드로이드 구글: ko-kr-x-koc/kod(남) · kob/ism(여) / 삼성: SMTm(남) · SMTf(여) / 윈도우: InJoon·Hyunsu(남) · SunHi(여) / 애플: Minsu 등 */
  var MALE = /injoon|인준|hyunsu|현수|minsu|민수|jinho|진호|bongjin|봉진|gookmin|국민|junho|준호|male|남성|남자|x-koc|x-kod|smtm|standard-c|standard-d|wavenet-c|wavenet-d|neural2-c/i;
  var FEMALE = /yuna|유나|sunhi|선희|heami|해미|seoyeon|서연|jimin|지민|yujin|유진|female|여성|여자|x-kob|x-ism|smtf|standard-a|standard-b|wavenet-a|wavenet-b|neural2-a|neural2-b|google 한국/i;
  function score(v) {
    var n = (v.name || '') + ' ' + (v.voiceURI || ''), s = 0;
    if (MALE.test(n)) s += 10; else if (FEMALE.test(n)) s -= 5;
    if (/enhanced|premium|natural|neural|online|향상/i.test(n)) s += 2;
    if (/ko[-_]KR/i.test(v.lang)) s += 1;
    return s;
  }
  function isMale(v) { return !!v && MALE.test((v.name || '') + ' ' + (v.voiceURI || '')); }
  function load() {
    if (!G.has.tts) return;
    voices = speechSynthesis.getVoices().filter(function (v) { return /^ko/i.test(v.lang); });
    chosen = voices.filter(function (v) { return v.name === G.settings.voice; })[0] ||
      voices.slice().sort(function (a, b) { return score(b) - score(a); })[0] || null;
  }
  if (G.has.tts) { load(); speechSynthesis.onvoiceschanged = load; }
  function talking(on) {
    speaking = on;
    document.documentElement.classList.toggle('jv-talk', on);
  }
  function clean(t) { /* 이모지·기호는 읽지 않게 */
    return String(t || '').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, ' ').replace(/[~*#_]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* ----- ElevenLabs 고급 목소리 (부모가 키를 넣고 켰을 때만) -----
     만든 소리는 기기(IndexedDB)에 모아 두어 같은 말은 다시 받지 않고, 인터넷이 없어도 나온다.
     2.5초 안에 못 받으면 이번엔 기기 목소리로 말하고, 받아 온 소리는 다음을 위해 남겨 둔다. */
  var au = null, elFail = '', inflight = {};
  function elKey() { return String(G.store.get('elKey', '') || '').trim(); }
  function elReady() { return G.settings.elOn && !!elKey() && !elFail; }
  function elText(t) {
    if (G.settings.elName) return t;
    var nick = (G.profile.nick || '').trim(); if (!nick) return t;
    /* 별명은 보내지 않는다: "(별명)아, 오늘도" → "오늘도" */
    return t.split(G.callName()).join('').split(nick).join('').replace(/^[\s,!.]+/, '').replace(/\s+([,!.?])/g, '$1').trim() || t;
  }
  function elId(t) { return [G.settings.elVoice, G.settings.elModel, Math.round(G.settings.rate * 100), t].join('|'); }
  function fetchClip(t) {
    var id = elId(t);
    if (inflight[id]) return inflight[id];
    inflight[id] = G.db.get('tts', id).catch(function () { return null; }).then(function (hit) {
      if (hit && hit.blob) return hit.blob;
      return fetch('https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(G.settings.elVoice) + '?output_format=mp3_44100_64', {
        method: 'POST',
        headers: { 'xi-api-key': elKey(), 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        body: JSON.stringify({ text: t, model_id: G.settings.elModel,
          voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed: G.clamp(G.settings.rate, 0.7, 1.2) } })
      }).then(function (r) {
        if (!r.ok) {
          return r.json().catch(function () { return {}; }).then(function (d) {
            var m = (d.detail && (d.detail.message || d.detail.status)) || ('오류 ' + r.status);
            if (r.status === 401) elFail = 'ElevenLabs 키가 맞지 않아요';
            else if (r.status === 402 || r.status === 403) elFail = '이 목소리·모델을 지금 요금제로 쓸 수 없어요 (' + m + ')';
            else if (r.status === 429) { /* 잠깐 붐빔 — 이번만 기기 목소리 */ }
            throw new Error(m);
          });
        }
        return r.blob();
      }).then(function (blob) {
        G.db.put('tts', { id: id, blob: blob, t: Date.now() }).catch(function () {});
        return blob;
      });
    });
    inflight[id].then(function () { delete inflight[id]; }, function () { delete inflight[id]; });
    return inflight[id];
  }
  function playBlob(blob, done) {
    if (!au) au = new Audio();
    var url = URL.createObjectURL(blob);
    au.onplay = function () { talking(true); };
    au.onended = au.onerror = function () { URL.revokeObjectURL(url); done(); };
    au.src = url; au.volume = G.settings.calm ? 0.75 : 1;
    var p = au.play(); if (p && p.catch) p.catch(function () { URL.revokeObjectURL(url); done(); });
  }

  /* 0.05초짜리 조용한 WAV — 아이폰에서 소리 재생기를 깨울 때 쓴다 */
  var silentUrl = null;
  function silentWav() {
    if (silentUrl) return silentUrl;
    var n = 2205, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    function w(o, str) { for (var i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); }
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    silentUrl = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
    return silentUrl;
  }
  function deviceSay(t, o, done, est) {
    if (!G.has.tts || G.settings.mute) { talking(true); endT = setTimeout(done, est * 0.8); return; }
    try {
      var u = new SpeechSynthesisUtterance(t);
      u.lang = 'ko-KR'; if (chosen) u.voice = chosen;
      /* 남자 목소리가 없는 기기면 조금 낮춰 아기 같지 않게 */
      var pitch = o.pitch || G.settings.pitch; if (!isMale(chosen)) pitch = Math.max(0.5, pitch * 0.88);
      u.rate = o.rate || G.settings.rate; u.pitch = pitch; u.volume = G.settings.calm ? 0.75 : 1;
      u.onstart = function () { talking(true); };
      u.onend = done; u.onerror = done;
      talking(true);
      speechSynthesis.speak(u);
      endT = setTimeout(done, est + 4000);   // onend 가 안 오는 기기 대비
    } catch (e) { done(); }
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
      if (elReady() && !o.device) {
        var et = elText(t), late = false;
        talking(true);
        var wait = setTimeout(function () { late = true; if (curResolve === done) deviceSay(t, o, done, est); }, 2500);
        fetchClip(et).then(function (blob) {
          clearTimeout(wait);
          if (late || curResolve !== done) return;          /* 늦게 온 소리는 다음 번을 위해 남겨만 둔다 */
          playBlob(blob, done);
        }, function () { clearTimeout(wait); if (!late && curResolve === done) deviceSay(t, o, done, est); });
        return;
      }
      deviceSay(t, o, done, est);
    });
  }
  function stop() {
    if (G.has.tts) try { speechSynthesis.cancel(); } catch (e) {}
    if (au) try { au.pause(); } catch (e) {}
    clearTimeout(endT); talking(false);
    if (curResolve) { var r = curResolve; curResolve = null; r(); }
  }
  /* 자주 하는 말(칭찬·격려·인사)을 미리 받아 둔다 — 고급 목소리가 바로 나오게 */
  function warm(lines) {
    if (!elReady()) return;
    var list = lines.map(function (l) { return elText(clean(l)); }).filter(Boolean), i = 0;
    (function next() { if (i >= list.length || !elReady()) return; fetchClip(list[i++]).then(function () { setTimeout(next, 250); }, function () { setTimeout(next, 1500); }); })();
  }
  return {
    say: say, stop: stop, load: load, warm: warm, isMale: isMale, score: score,
    list: function () { return voices; },
    current: function () { return chosen; },
    premium: { ready: elReady, error: function () { return elFail; }, reset: function () { elFail = ''; }, test: function (t) { elFail = ''; return fetchClip(elText(clean(t))); } },
    get speaking() { return speaking; },
    unlock: function () {
      if (G.has.tts) try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
      /* 아이폰: 손이 닿을 때 소리 재생기를 한 번 깨워 둔다 */
      try { if (!au) au = new Audio(); au.src = silentWav(); var p = au.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    }
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
/* 같은 자리에서 나는 소리끼리는 같게 본다 — 아이들이 흔히 ㅋ↔ㄱ, ㅌ↔ㄷ, ㅍ↔ㅂ 로 바꿔 말한다 */
var EASE = { 'ㅋ': 'ㄱ', 'ㄲ': 'ㄱ', 'ㅌ': 'ㄷ', 'ㄸ': 'ㄷ', 'ㅍ': 'ㅂ', 'ㅃ': 'ㅂ', 'ㅊ': 'ㅈ', 'ㅉ': 'ㅈ', 'ㅆ': 'ㅅ' };
function syls(w) { /* 낱말 → [[초성(쉽게), 중성], ...] */
  var out = [];
  String(w).replace(/[^가-힣]/g, '').split('').forEach(function (ch) {
    var c = ch.charCodeAt(0) - 0xAC00, cho = CHO[Math.floor(c / 588)];
    out.push([EASE[cho] || cho, JUNG[Math.floor((c % 588) / 28)]]);
  });
  return out;
}
/* 0~1: 들은 말 heard 안에 목표 낱말 target 이 얼마나 비슷하게 들어 있나.
   · 띄어 쓴 낱말마다 따로 비교한다 (여러 낱말에 걸쳐 우연히 맞는 것을 막는다)
   · 한 글자 낱말(코·눈·이)은 짧은 대답(두 글자 이하) 안에 같은 첫소리+모음이 있어야 맞다고 본다
     — "배고파"가 "코"로, "아니"가 "이"로 칭찬받지 않게 */
G.similar = function (heard, target) {
  var t = G.jamo(target); if (!t) return 0;
  var toks = String(heard || '').split(/\s+/).filter(function (x) { return G.jamo(x); });
  if (!toks.length) return 0;
  var ts = syls(target);
  if (ts.length === 1) {
    var hit = toks.some(function (tok) {
      var hs = syls(tok); if (!hs.length || hs.length > 2) return false;
      return hs.some(function (x) { return x[0] === ts[0][0] && x[1] === ts[0][1]; });
    });
    return hit ? 1 : 0;
  }
  var best = 0;
  toks.forEach(function (tok) {
    var h = G.jamo(tok);
    if (h.indexOf(t) >= 0) { best = 1; return; }
    if (h.length <= t.length + 1) { best = Math.max(best, 1 - lev(h, t) / Math.max(h.length, t.length)); return; }
    for (var len = Math.max(1, t.length - 1); len <= t.length + 1; len++) {
      for (var i = 0; i + len <= h.length; i++) {
        var part = h.substr(i, len); best = Math.max(best, 1 - lev(part, t) / Math.max(len, t.length));
      }
    }
  });
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
    var r = new SR(), alts = [], fin = false, timer = null, got = false, t0 = Date.now(), firstAt = 0;
    recNow = r;
    /* 말소리 자동 녹음 (speech-lab.js) — 듣는 동안 소리도 기기에 담는다 */
    var clip = G.SL && G.SL.startClip ? G.SL.startClip() : null;
    r.lang = 'ko-KR'; r.interimResults = true; r.maxAlternatives = 5; r.continuous = false;
    document.documentElement.classList.add('jv-listen');
    function end(extra) {
      if (fin) return; fin = true; clearTimeout(timer);
      document.documentElement.classList.remove('jv-listen');
      try { r.abort(); } catch (e) {}
      if (recNow === r) recNow = null;
      var text = alts[0] || '', score = 0;
      (o.expect || []).forEach(function (w) { alts.forEach(function (a) { score = Math.max(score, G.similar(a, w)); }); });
      /* 아이 말소리 사전: 부모가 👍 해 준 발음은 다음부터 맞다고 본다 */
      if (G.SL && G.SL.accepts) (o.expect || []).forEach(function (w) { if (G.SL.accepts(w, alts)) score = Math.max(score, 0.9); });
      var res = Object.assign({ text: text, alts: alts, score: score, ok: score >= (o.threshold || 0.5), heard: !!text }, extra || {});
      /* 고운 말·표준말 — 들은 말을 기기 안에서만 센다(부모 화면 🌷). 대화에서 자비스가 고쳐 들려줄 때도 쓴다 */
      if (text && G.kind) try { res.kind = G.kind.note(text, o.expect); } catch (e) {}
      if (G.SL && G.SL.save) {
        if (extra && extra.error === 'audio-capture' && clip) G.SL.noteConflict('audio-capture');
        var meta = { act: G.cur ? G.cur.id : '', lv: G.cur ? G.cur.level : 0, target: (o.expect || [])[0] || '', heard: text, alts: alts.slice(0, 3),
          score: Math.round(score * 100) / 100, ok: res.ok, latency: firstAt ? firstAt - t0 : 0, err: extra && extra.error || '' };
        if (clip) clip.stop().then(function (c) { if (text || c) G.SL.save(meta, c); }); else if (text) G.SL.save(meta, null);
      }
      ok(res);
    }
    r.onresult = function (e) {
      var res = e.results[e.results.length - 1], list = [];
      for (var i = 0; i < res.length; i++) list.push(res[i].transcript.trim());
      got = true; if (!firstAt) firstAt = Date.now();
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
   G.mic() → {level() 0~1, flat() 0~1(바람 소리일수록 큼), pitch(), stop()}
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
G.JV_IMG = { head: 'assets/grow/jarvis-head.jpg', full: 'assets/grow/jarvis.jpg' };
G.jarvisSVG = function (cls) {
  /* 히어로 로봇 그림(hero-art.js)이 있으면 그것을 쓴다 — 'big'·'full' 은 전신 */
  /* 실사 자비스(assets/grow) — 말할 때·들을 때는 테두리가 빛난다 */
  if (G.JV_IMG && !/\bsvg\b/.test(cls || '')) {
    var full = /\b(big|full)\b/.test(cls || '');
    return '<span class="jvi ' + (full ? 'jvi-full ' : '') + (cls || '') + '"><img src="' + (full ? G.JV_IMG.full : G.JV_IMG.head) + '" alt="자비스"><i class="jvi-eq"><b></b><b></b><b></b><b></b><b></b></i></span>';
  }
  if (window.GA && GA.jarvis) try { return GA.jarvis({ full: /\b(big|full)\b/.test(cls || ''), cls: cls || '' }); } catch (e) {}
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

/* 단계 맞추기 — 단계(1~3)마다 작은 칸이 셋(1~3칸) 있다. 모두 9칸: 1-1 → 1-2 → 1-3 → 2-1 … → 3-3.
   칸이 오를 때마다 속도·개수·시간 같은 어려움이 다음 단계 쪽으로 1/3씩만 다가간다(ctx.tune) —
   갑자기 어려워지지 않게 '조금씩'. 규칙이 새로 생기는 큰 변화는 단계가 바뀔 때만 온다.
   · 오르기: 이 칸에서 한 판 80% 이상 → 한 칸 위. 다음 단계로 넘어가는 칸(x-3 → 다음 단계 1칸)만 85% 이상.
     (한 칸에 한 판씩, 한 단계를 오르려면 잘한 판이 세 번 — 예전 '세 판 85%' 와 같은 속도)
   · 내리기: 한 판이라도 40% 밑이거나, 이 칸에서 두 판 모아 50% 밑이면 한 칸 아래 (한 단계가 아니라 한 칸만).
   · 1단계가 '규칙 익히기'(warm)인 놀이는 한 판만 잘해도 2단계 1칸으로.
   · 부모가 단계를 정해 두면(profile.level[id]) 그 단계 안에서만 칸이 움직인다. */
G.STEPS = 3;
function fineOf(l) { return ((l.lv || 1) - 1) * G.STEPS + G.clamp(l.st || 1, 1, G.STEPS); }
G.stageFor = function (id, max) {
  var def = G.acts[id] || {}, S = G.STEPS;
  max = max || def.levels || 3;
  if (max <= 1) return { lv: 1, st: 1, fine: 1 };
  var lo = 1, hi = max * S, fixed = G.profile.level && G.profile.level[id];
  if (fixed) { fixed = G.clamp(fixed, 1, max); lo = (fixed - 1) * S + 1; hi = fixed * S; }
  function out(f) { f = G.clamp(f, lo, hi); return { lv: Math.ceil(f / S), st: (f - 1) % S + 1, fine: f }; }
  /* 중간에 그만둔 판은 빼고, 끝까지 한 판만 본다 */
  var done = G.logsFor(id).filter(function (l) { return !(l.x && l.x.quit); });
  if (!done.length) {
    /* 처음 하는 놀이: 8살(96개월) 넘은 아이는 말하기 말고는 2단계 1칸부터 — 너무 쉬우면 지루하다. 어려우면 한 판 만에 내려온다 */
    var am = G.ageMonths();
    return out(am != null && am >= 96 && def.area !== 'speech' && max >= 3 && !def.tool ? S + 1 : 1);
  }
  var cur = fineOf(done[done.length - 1]);
  if (cur < lo || cur > hi) return out(cur);                       /* 부모가 단계를 바꿨으면 그 단계로 */
  /* 지금 칸에서 이어서 한 판들만 (예전에 같은 칸이었던 판은 섞지 않는다) */
  var run = [];
  for (var i = done.length - 1; i >= 0 && fineOf(done[i]) === cur; i--) run.unshift(done[i]);
  var graded = run.filter(function (l) { return l.n > 0; }).slice(-3);
  if (!graded.length) {
    /* 맞고 틀림이 없는 자유 놀이(그리기)는 한 칸에서 한 번 하면 한 칸 오른다 (한 단계에 세 번) */
    return out(def.autoLevel && run.length >= 1 ? cur + 1 : cur);
  }
  var last = graded[graded.length - 1], lastAcc = last.ok / last.n;
  var pool = graded.reduce(function (s, l) { return [s[0] + l.ok, s[1] + l.n]; }, [0, 0]), acc = pool[0] / pool[1];
  if (lastAcc < 0.4 || (graded.length >= 2 && acc < 0.5)) return out(cur - 1);
  if (def.warm && cur <= S) return out(lastAcc >= 0.85 ? S + 1 : cur);
  /* 오르는 기준 — 높은 단계일수록 조금 더 깐깐하게.
     칸 오르기: 1~3단계 80% · 4~5단계 85%. 단계 넘기: 1→2·2→3 85% · 3→4·4→5 90% */
  var curLv = Math.ceil(cur / S), edge = cur % S === 0;
  var need = edge ? (curLv >= 3 ? 0.9 : 0.85) : (curLv >= 4 ? 0.85 : 0.8);
  return out(lastAcc >= need ? cur + 1 : cur);
};
G.levelFor = function (id, max) { return G.stageFor(id, max).lv; };
/* '2-3' 처럼 — 부모 화면·기록용 */
G.stageLabel = function (lv, st) { return (lv || 1) + '-' + (st || 1); };
/* 단계 이름 — 4·5단계는 3단계를 다 익힌 아이를 위한 도전·마스터 단계 */
G.LEVEL_NAME = { 1: '1단계', 2: '2단계', 3: '3단계', 4: '4단계 · 도전', 5: '5단계 · 마스터' };
G.levelName = function (lv) { return G.LEVEL_NAME[lv] || lv + '단계'; };
/* 단계 표시: 1~3 은 ★, 4 는 🔥도전, 5 는 👑마스터 */
G.levelBadge = function (lv) { return lv >= 5 ? '👑<b class="lv-n">마스터</b>' : lv >= 4 ? '🔥<b class="lv-n">도전</b>' : '★'.repeat(lv); };

/* 단계별 숫자를 칸에 맞게 고르기. arr = [1단계, 2단계, 3단계] 값.
   1칸은 그 단계 값 그대로, 2칸·3칸은 다음 단계 값 쪽으로 1/3, 2/3 다가간다.
   마지막 단계는 앞 단계와의 차이의 절반 쪽으로 (3-3 이 3-1 보다 차이의 1/3 만큼 어려움).
   값이 모두 정수면 정수로 돌려준다. 숫자가 아니면 그 단계 값 그대로. */
G.tune = function (arr, lv, st) {
  if (!Array.isArray(arr)) return arr;
  var i = G.clamp(lv || 1, 1, arr.length) - 1, a = arr[i], f = (G.clamp(st || 1, 1, G.STEPS) - 1) / G.STEPS;
  if (typeof a !== 'number' || !f) return a;
  var b = i + 1 < arr.length ? arr[i + 1] : (i > 0 && typeof arr[i - 1] === 'number' ? a + (a - arr[i - 1]) * 0.5 : a);
  if (typeof b !== 'number') return a;
  var v = a + (b - a) * f;
  var ints = arr.every(function (n) { return typeof n !== 'number' || Math.round(n) === n; });
  return ints ? Math.round(v) : Math.round(v * 10000) / 10000;
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
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';   /* 위로 떠오르게 (절대 위치 조각은 그대로) */
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
  return { st: G.$('#stage'), body: G.$('#stBody'), title: G.$('#stTitle'), lv: G.$('#stLv'), dots: G.$('#stDots'), bubble: G.$('#stBubble'), sess: G.$('#stSess') };
}

/* 놀이 시작 */
G.start = function (id, o) {
  o = o || {};
  var def = G.acts[id]; if (!def) { G.toast('준비 중인 놀이예요'); return; }
  G.exit(true);
  var E = stageEls();
  /* 단계·칸 — o.level(+o.step) 이 있으면 그대로(시험·부모가 고른 놀이), 없으면 기록으로 맞춘다 */
  var sg = o.level ? { lv: G.clamp(o.level, 1, def.levels), st: def.levels > 1 ? G.clamp(o.step || 1, 1, G.STEPS) : 1 } : G.stageFor(id, def.levels);
  var lv = sg.lv;
  var ctx = {
    def: def, id: id, level: lv, step: sg.st, alive: true, body: E.body, t0: Date.now(), n: 0, ok: 0, extra: {}, _clean: [], instr: '',
    say: function (t, so) { if (!ctx.alive) return Promise.resolve(); so = so || {}; E.bubble.textContent = String(t).replace(/\s+/g, ' '); E.bubble.classList.add('on'); if (so.repeat !== false) ctx.instr = t; return G.say(t, so).then(function () { return ctx.alive ? undefined : new Promise(function () {}); }); },
    bubble: function (t) { E.bubble.textContent = t; E.bubble.classList.toggle('on', !!t); },
    cheer: function (t, el) {
      if (!ctx.alive) return Promise.resolve();
      G.sfx.play('good'); G.buzz(15);
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
      var w = G.el('<div class="judge"><button class="btn big yes">' + labels[0] + '</button><button class="btn big soft no">' + labels[1] + '</button></div>');
      var p = new Promise(function (ok) {
        (box || ctx.body).appendChild(w);
        w.querySelector('.yes').onclick = function () { G.sfx.play('tap'); w.remove(); if (G.SL) G.SL.judge(true); ok(true); };
        w.querySelector('.no').onclick = function () { G.sfx.play('tap'); w.remove(); if (G.SL) G.SL.judge(false); ok(false); };
      });
      p.cancel = function () { w.remove(); };   /* 음성 인식이 먼저 들으면 단추를 거둔다 (이 약속은 끝나지 않음) */
      return p;
    },
    /* 칸에 맞춘 숫자: ctx.tune([1단계, 2단계, 3단계]) — G.tune 참고 */
    tune: function (arr) { return G.tune(arr, ctx.level, ctx.step); },
    finish: function (x) { finish(ctx, x || {}); }
  };
  G.cur = ctx;
  E.title.innerHTML = '<span>' + def.icon + '</span><span class="tt">' + G.esc(def.title) + '</span>';
  /* ★ 단계 ●●○ 칸 — 말풍선 줄 오른쪽에 늘 보이게 */
  if (E.lv) E.lv.innerHTML = def.levels > 1 ? '<small class="lv" title="' + lv + '단계 ' + sg.st + '칸" aria-label="' + lv + '단계 ' + sg.st + '칸">' + G.levelBadge(lv) + '<i class="lv-st">' + G.range(G.STEPS).map(function (k) { return k < sg.st ? '●' : '○'; }).join('') + '</i></small>' : '';
  E.dots.innerHTML = ''; E.bubble.textContent = ''; E.bubble.classList.remove('on');
  var tk = G.$('#stTalk'); if (tk) tk.hidden = !!def.tool;   /* 말판·도구 화면에선 💬 가 겹친다 */
  E.body.innerHTML = ''; E.body.className = 'st-body act-' + id;
  E.st.style.setProperty('--area', (G.AREAS[def.area] || {}).color || '#4f8cff');
  if (G.session) { var s = G.session; E.sess.hidden = false; E.sess.innerHTML = '<b style="width:' + Math.round(s.i / s.list.length * 100) + '%"></b>'; }
  else E.sess.hidden = true;
  if (G.SL && G.SL.prewarm && (def.area === 'speech')) G.SL.prewarm();
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
    G.log({ t: Date.now(), d: G.today(), id: c.id, area: c.def.area, lv: c.level, st: c.step, n: c.n, ok: c.ok, ms: Date.now() - c.t0, x: Object.assign({ quit: 1 }, c.extra) });
  }
};

function finish(ctx, x) {
  if (!ctx.alive) return;
  var def = ctx.def, ms = Date.now() - ctx.t0;
  if (!def.tool) G.log({ t: Date.now(), d: G.today(), id: ctx.id, area: def.area, lv: ctx.level, st: ctx.step, n: ctx.n, ok: ctx.ok, ms: ms, x: Object.assign({}, ctx.extra, x.extra || {}) });
  ctx.alive = false;
  G.voice.stop(); G.stopListen();
  ctx._clean.forEach(function (f) { try { f(); } catch (e) {} }); ctx._clean = [];
  G.cur = null; G.wake(false);
  if (def.tool && !x.reward) { G.home(); return; }
  /* 상 화면 — 아이에게는 언제나 별 셋. 맞고 틀림은 부모 화면에만.
     꽃가루·긴 팡파르는 오늘의 놀이를 다 마쳤을 때만. 놀이 하나 끝은 짧고 부드럽게(과자극 막기).
     기분이 힘든 날의 기분 묻기 뒤에는 축하 대신 다독임. */
  var stk = G.giveSticker();
  var inSess = !!G.session;
  if (inSess) { G.session.done.push(ctx.id); G.saveSession(); }
  var hard = ctx.id === 'checkin' && G.HARD_MOODS.indexOf(ctx.extra.emo) >= 0;
  var msg = x.msg || (hard ? '마음을 말해 줘서 고마워. 자비스가 옆에 있을게.' : G.pick(D.DONE));
  /* 칸 오르기 알림 — 오를 때만 보인다. 내려갈 때는 아이에게 아무 말도 하지 않는다(무오류 학습) */
  var up = '', upKind = '', nx = null;
  if (!def.tool && def.levels > 1 && !hard) {
    nx = G.stageFor(ctx.id, def.levels); var was = (ctx.level - 1) * G.STEPS + ctx.step;
    if (nx.fine > was) {
      upKind = nx.lv > ctx.level ? 'level' : 'step';
      up = nx.lv > ctx.level ? (G.older() ? '레벨 업! ' : '와, 실력이 쑥! ') + (nx.lv >= 4 ? G.levelName(nx.lv).replace(' · ', '(') + ')' : nx.lv + '단계') + '로 올라갔어!' : '실력이 쑥! 한 칸 올라갔어!';
    }
  }
  /* 로봇: ⚡ 에너지를 모아 부품을 만든다 (robots.js) — 완주·정확·칸 오름·단계 오름이 에너지 */
  var earn = !def.tool && G.earnEnergy ? G.earnEnergy({ id: ctx.id, n: ctx.n, ok: ctx.ok, level: ctx.level, up: upKind }) : null;
  var part = earn && earn.made.length && G.rewardPart ? G.rewardPart(earn.made[earn.made.length - 1]) : null;
  if (part && !x.msg && !hard) msg = part.complete ? part.robot.name + ' 완성! 변신!' + (part.rankUp ? ' 계급이 ' + G.josa(part.rankUp.name, '으로', '로') + ' 올랐어!' : '') : G.pick(D.PRAISE) + ' ' + part.partName.replace(/ \(.*\)$/, '') + ' 획득!';
  else if (earn && earn.gain && !x.msg && !hard) msg = G.pick(D.PRAISE) + ' 에너지 ' + earn.gain + ' 충전!';
  if (up) msg += ' ' + up;
  var enHTML = earn ? '<div class="rw-en"><b>⚡ +' + earn.gain + '</b><small>' + earn.items.map(function (it) { return it.t + ' +' + it.v; }).join(' · ') +
    (earn.capped ? (earn.items.length ? ' · ' : '') + '오늘 에너지는 가득! 내일 또 모으자' : '') + (earn.same ? ' · 같은 놀이는 하루 두 번까지 — 다른 놀이도 해 보자!' : '') + '</small>' + (G.energyBar ? G.energyBar(earn.next) : '') + '</div>' : '';
  var ov = G.el('<div class="reward' + (part || earn ? ' hero' : '') + '" role="dialog">' +
    '<div class="rw-card">' + (hard ? '<div class="rw-stars"><span>💗</span></div>' : '<div class="rw-stars"><span>⭐</span><span>⭐</span><span>⭐</span></div>') +
    (part ? '' : '<div class="rw-jv">' + G.jarvisSVG('big') + '</div>') +
    '<div class="rw-msg">' + G.esc(up ? msg.slice(0, msg.length - up.length - 1) : msg) + '</div>' +
    (up ? '<div class="rw-up">⬆️ ' + G.esc(up) + '<small>' + G.levelBadge(nx.lv).replace(/<[^>]+>/g, '') + ' ' + G.range(G.STEPS).map(function (k) { return k < nx.st ? '●' : '○'; }).join('') + ' · 다음엔 조금 더 멋진 도전!</small></div>' : '') +
    (part ? '<div class="rw-part"><div class="rp-art' + (part.complete ? ' transform' : '') + '">' + part.svg + '</div><div><small>' + (part.complete ? '로봇 완성! 변신!' : '새 부품 획득') + '</small><b>' + G.esc(part.robot.name) + '</b><b class="rp-name">' + G.esc(part.partName) + '</b>' +
      '<span class="rp-dots">' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<i class="' + (k < part.owned ? 'on' : '') + (k === part.owned - 1 ? ' new' : '') + '"></i>'; }).join('') + '</span>' +
      (part.rankUp ? '<small class="rp-rank">' + part.rankUp.e + ' 계급 업! 「' + G.esc(part.rankUp.name) + '」</small>' : '') + '</div></div>' + enHTML
      : earn ? enHTML : '<div class="rw-stk"><small>새 스티커</small><b>' + stk + '</b></div>') +
    '<div class="rw-btns">' + (inSess ? '<button class="btn big go">다음 놀이 ▶</button>' : '<button class="btn big again">🔁 한 번 더</button>') +
    '<button class="btn big soft home">' + (inSess ? '🏠 쉬었다 할래요' : '🏠 처음으로') + '</button></div></div></div>');
  document.body.appendChild(ov);
  if (hard || G.settings.calm) G.sfx.play('ding');
  else { G.sfx.play('great'); G.buzz(30); if (!inSess) G.fx.confetti(24); }
  G.say(msg);
  function close() { ov.remove(); G.voice.stop(); }
  var go = ov.querySelector('.go'), again = ov.querySelector('.again');
  if (go) go.onclick = function () { close(); G.nextInSession(); };
  if (again) again.onclick = function () { close(); G.start(ctx.id); };
  /* 오늘의 놀이 중 '쉬었다 할래요' — 꾸러미는 남겨 두고 나중에 이어 한다 */
  ov.querySelector('.home').onclick = function () { close(); if (G.session) { G.session.i++; G.saveSession(); } G.session = null; G.home(); };
}

/* 힘든 기분 — 이날은 꾸러미를 줄이고 편한 놀이 + 쉬어가기로 (조절이 먼저) */
G.HARD_MOODS = ['sad', 'angry', 'scared', 'hurt', 'sleepy'];
G.saveSession = function () { if (G.session) G.store.set('sessionSave', { d: G.today(), list: G.session.list, i: G.session.i, done: G.session.done, start: G.session.start, gentle: G.session.gentle }); };
G.savedSession = function () { var v = G.store.get('sessionSave', null); return v && v.d === G.today() && v.i < v.list.length ? v : null; };
G.resumeSession = function () {
  var v = G.savedSession(); if (!v) return false;
  G.session = { list: v.list, i: v.i, start: Date.now() - 60000, done: v.done || [], gentle: v.gentle };
  G.say(G.callName() + ', 아까 하던 놀이 이어서 하자!').then(function () { if (G.session) G.runSlot(G.session.list[G.session.i]); });
  return true;
};
function gentlePlan(emo) {
  var soft = ['mirror', 'stories', 'draw', 'color', 'scratch', 'bubbles', 'feeldraw'].filter(function (id) { return G.acts[id] && !(G.profile.hide || {})[id]; });
  var played = G.logs().slice(-60).map(function (l) { return l.id; });
  soft.sort(function (a, b) { return played.filter(function (x) { return x === b; }).length - played.filter(function (x) { return x === a; }).length; });
  var two = soft.slice(0, 2), calm = (emo === 'angry' || emo === 'scared') && G.acts.breathe ? 'breathe' : (G.acts.bubbles ? 'bubbles' : 'breathe');
  if (two.indexOf(calm) >= 0) two = soft.filter(function (x) { return x !== calm; }).slice(0, 2);
  var out = ['checkin']; if (two.length === 2) out.push({ pick: two }); else if (two.length) out.push(two[0]);
  if (G.acts[calm]) out.push(calm);
  return out;
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
  G.saveSession();
  G.say(G.older() ? G.callName() + ', 오늘의 미션 시작! 자비스 형이 함께할게.' : G.callName() + ', 오늘도 자비스랑 같이 놀자!').then(function () { if (G.session) G.runSlot(G.session.list[0]); });
};
/* 한 칸 시작 — 둘 중 고르기면 고르는 화면부터 */
G.runSlot = function (entry) {
  if (typeof entry === 'string') { G.start(entry); return; }
  var a = G.acts[entry.pick[0]], b = G.acts[entry.pick[1]];
  if (!a || !b) { G.start((a || b).id); return; }
  G.exit(true);
  var E = stageEls();
  E.title.innerHTML = '<span>🤔</span><span class="tt">뭐 하고 놀까?</span>'; if (E.lv) E.lv.innerHTML = ''; E.dots.innerHTML = '';
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
  /* 기분 묻기에서 힘든 마음을 골랐으면 오늘은 짧고 편하게 */
  if (s.list[s.i] === 'checkin' && !s.gentle) {
    var lg = G.logs().filter(function (l) { return l.id === 'checkin'; }).pop();
    if (lg && lg.d === G.today() && lg.x && G.HARD_MOODS.indexOf(lg.x.emo) >= 0) {
      s.list = gentlePlan(lg.x.emo); s.gentle = 1; s.i = 0;
      G.toast('💗 오늘은 마음이 힘든 날 — 편한 놀이 하나와 쉬어가기만 해요', 4200);
    }
  }
  s.i++;
  G.saveSession();
  var over = (Date.now() - s.start) / 60000 >= G.settings.sessionMin;
  /* 시간이 다 됐어도 마무리 쉬어가기는 하고 끝낸다 */
  if (over && s.i < s.list.length - 1) s.i = s.list.length - 1;
  if (s.i >= s.list.length) {
    G.session = null; G.store.del('sessionSave');
    /* 오늘의 미션을 끝까지 하면 보너스 에너지 ⚡3 (하루 한 번) — 모자라던 부품이 생길 수도 있다 */
    var bonus = G.store.get('bonusDay', '') !== G.today() && s.done.length >= 2, bres = null;
    if (bonus) { G.store.set('bonusDay', G.today()); if (G.energyBonus) bres = G.energyBonus(3); else G.giveSticker(); }
    G.store.set('lastSession', { d: G.today(), n: s.done.length });
    var sd = G.store.get('sessionDays', []); if (sd.indexOf(G.today()) < 0) { sd.push(G.today()); G.store.set('sessionDays', sd.slice(-400)); }
    G.home();
    if (!G.settings.calm) { G.fx.confetti(50); G.sfx.play('win'); } else G.sfx.play('ding');
    G.say(G.older() ? '오늘의 미션 모두 완료! ' + G.callName() + ', 진짜 멋졌어. 이제 화면은 쉬고 몸으로 놀자!' : '오늘의 놀이 끝! ' + G.callName() + ', 정말 멋졌어. 이제 화면은 쉬고, 엄마 아빠랑 몸으로 놀자!');
    G.toast(bonus ? '🎁 오늘의 미션 완료 보너스 ⚡3' + (bres && bres.made.length ? ' — 새 부품 완성!' : '') + ' 이제 화면을 쉬어요' : '🎉 오늘의 놀이를 모두 마쳤어요! 이제 화면을 쉬어요', 4500);
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
G.grownUp = function (why) {
  return new Promise(function (ok) {
    var a = 2 + Math.floor(Math.random() * 6), b = 2 + Math.floor(Math.random() * 6), ans = a + b;
    var opts = G.shuffle([ans, ans + 1, ans - 1, ans + 2].filter(function (v, i, s) { return s.indexOf(v) === i; }));
    var ov = G.el('<div class="modal"><div class="md-card"><h3>👨‍👩‍👦 어른 확인</h3><p>' + G.esc(why || '부모 화면으로 가려면 답을 눌러 주세요.') + '</p>' +
      '<div class="md-q">' + a + ' + ' + b + ' = ?</div><div class="md-opts">' + opts.map(function (v) { return '<button class="btn">' + v + '</button>'; }).join('') + '</div>' +
      '<button class="btn soft md-x">닫기</button></div></div>');
    document.body.appendChild(ov);
    G.$$('.md-opts .btn', ov).forEach(function (b) { b.onclick = function () { var r = +b.textContent === ans; ov.remove(); if (!r) G.toast('다시 해 볼까요?'); ok(r); }; });
    ov.querySelector('.md-x').onclick = function () { ov.remove(); ok(false); };
  });
};
})();

/* ===========================================================
   함께 자라요 — 말소리 연구실 (자동 녹음 · 분석 · 학습 데이터)

   ▸ 자비스가 들을 때(🎤 빨간불)마다 아이가 한 말을 글로 남기고, 기기가 허락하면 소리도 담는다.
     모든 녹음은 이 기기(IndexedDB 'speech')에만 있다. 인터넷으로 저절로 나가지 않는다.
   ▸ 분석(기기 안에서): 말한 횟수·알아들은 비율·다른 낱말 수(NDW)·평균 문장 길이(MLU, 어절)·
     반응 시간·어려운 낱말·말소리 패턴(언어치료에서 보는 음운 변동 — 받침 빠짐, ㄱ→ㄷ, ㅅ→ㄷ, 음절 빠짐 …).
     음성 인식은 실제 낱말 쪽으로 고쳐 듣는 경향이 있어 패턴은 '추정'이다 — 치료사 확인이 필요하다.
   ▸ 학습: ① 부모가 👍 한 발음은 '아이 말소리 사전'에 담아 다음부터 맞다고 본다
            ② 어려운 낱말은 낱말 카드에서 더 자주 나온다
            ③ 부모가 녹음마다 정확/비슷/다름·실제로 들린 말을 달면 정답 표시(라벨)가 된다
   ▸ 학습 데이터 내보내기: ZIP (manifest.jsonl · utterances.csv · summary.json · audio/) —
     언어치료 선생님께 드리거나 아이 맞춤 음성 인식 학습에 쓸 수 있는 형식. 아이 이름은 넣지 않는다.
   =========================================================== */
(function () {
'use strict';
var G = window.G;
var SL = G.SL = {};
var MAX = 800;                       /* 기록은 최대 800개 — 넘으면 오래된 것부터 지운다 */

SL.on = function () { return G.settings.recVoice !== false; };
SL.audioOn = function () { return SL.on() && G.settings.recAudio !== false && !G.store.get('recConflict', false) && !!(window.MediaRecorder && G.has.mic); };

/* ---------- 녹음 ---------- */
var stream = null, releaseT = null;
function getStream() {
  if (stream && stream.active) { clearTimeout(releaseT); return Promise.resolve(stream); }
  return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (s) { stream = s; return s; });
}
function releaseLater() {
  clearTimeout(releaseT);
  releaseT = setTimeout(function () { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } }, 20000);
}
function pickMime() {
  var c = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg;codecs=opus'];
  for (var i = 0; i < c.length; i++) if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c[i])) return c[i];
  return '';
}
/* 듣기를 시작할 때 부른다 → {stop() → Promise<{blob,mime,ms}|null>} */
SL.startClip = function () {
  if (!SL.audioOn()) return null;
  var chunks = [], rec = null, t0 = Date.now(), stopped = false, mime = pickMime();
  var ready = getStream().then(function (s) {
    if (stopped) return;
    var opt = { audioBitsPerSecond: 32000 }; if (mime) opt.mimeType = mime;
    rec = new MediaRecorder(s, opt);
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.start(); document.documentElement.classList.add('rec-on');
  }).catch(function () { rec = null; });
  return {
    stop: function () {
      stopped = true;
      return ready.then(function () {
        document.documentElement.classList.remove('rec-on');
        return new Promise(function (ok) {
          if (!rec || rec.state === 'inactive') { releaseLater(); ok(null); return; }
          rec.onstop = function () {
            releaseLater();
            var b = new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' });
            ok(b.size > 800 ? { blob: b, mime: b.type, ms: Date.now() - t0 } : null);
          };
          try { rec.stop(); } catch (e) { ok(null); }
        });
      });
    }
  };
};
/* 말하기 놀이를 시작할 때 마이크를 미리 열어 둔다 — 빨리 대답해도 첫마디부터 담긴다 */
SL.prewarm = function () { if (SL.audioOn()) getStream().then(releaseLater).catch(function () {}); };
/* 이 기기에서 녹음과 음성 인식이 함께 안 되면(audio-capture) 녹음은 끄고 글만 남긴다 */
SL.noteConflict = function (err) { if (err === 'audio-capture') G.store.set('recConflict', true); };

/* ---------- 기록 ---------- */
SL.last = null;
SL.save = function (meta, clip) {
  if (!SL.on()) return;
  var e = Object.assign({ id: G.uid(), t: Date.now(), d: G.today(), judge: null, label: '' }, meta);
  if (clip) { e.audio = clip.blob; e.mime = clip.mime; e.dur = clip.ms; }
  SL.last = e;
  G.db.put('speech', e).then(function () { prune(); SL.refreshSoon(); }).catch(function () {});
};
/* 부모가 👍/🔁 를 누르면 방금 한 말의 정답 표시가 된다 */
SL.judge = function (ok) {
  var e = SL.last; if (!e || Date.now() - e.t > 30000) return;
  e.judge = !!ok; SL.last = null;
  G.db.put('speech', e).catch(function () {});
  if (ok && e.target && e.heard && !e.ok) learn(e.target, e.heard);
  SL.refreshSoon();
};
SL.update = function (e) { return G.db.put('speech', e).then(function () { SL.refreshSoon(); }); };
SL.all = function () { return G.db.all('speech').then(function (r) { return (r || []).sort(function (a, b) { return a.t - b.t; }); }); };
SL.del = function (id) { return G.db.del('speech', id); };
SL.clear = function () { return SL.all().then(function (r) { return Promise.all(r.map(function (e) { return G.db.del('speech', e.id); })); }); };
function prune() {
  SL.all().then(function (r) {
    var days = G.settings.recDays || 90, cut = Date.now() - days * 864e5, extra = r.length - MAX;
    r.forEach(function (e, i) {
      if (i < extra) G.db.del('speech', e.id);
      else if (e.audio && e.t < cut) { delete e.audio; G.db.put('speech', e); }     /* 오래된 소리만 지우고 글은 남긴다 */
    });
  });
}

/* ---------- 아이 말소리 사전 (학습) ---------- */
function norm(s) { return String(s || '').replace(/[^가-힣a-z0-9]/gi, ''); }
function learn(target, heard) {
  var d = G.store.get('pronDict', {}), v = norm(heard).slice(0, 12); if (!v || v === norm(target)) return;
  d[target] = d[target] || {}; d[target][v] = (d[target][v] || 0) + 1; G.store.set('pronDict', d);
}
SL.learn = learn;
SL.accepts = function (target, alts) {
  var d = (G.store.get('pronDict', {})[target]) || {};
  return (alts || []).some(function (a) { var n = norm(a); return n && d[n] >= 1; });
};
SL.dict = function () { return G.store.get('pronDict', {}); };
SL.forget = function (target, v) { var d = G.store.get('pronDict', {}); if (d[target]) { delete d[target][v]; if (!Object.keys(d[target]).length) delete d[target]; } G.store.set('pronDict', d); };

/* ---------- 분석 ---------- */
var CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ', JONG = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';
function syls(w) {
  return String(w || '').replace(/[^가-힣]/g, '').split('').map(function (ch) {
    var c = ch.charCodeAt(0) - 0xAC00; return { cho: CHO[Math.floor(c / 588)], jung: JUNG[Math.floor((c % 588) / 28)], jong: c % 28 ? JONG[c % 28] : '' };
  });
}
SL.PROC = [
  { id: 'final', name: '받침(끝소리) 빠짐', ex: '물 → 무', tip: '받침 있는 낱말을 천천히, 끝소리를 길게 들려주세요 ("무-ㄹ").' },
  { id: 'front', name: 'ㄱ·ㅋ이 ㄷ·ㅌ로', ex: '고기 → 도기', tip: '혀 뒤쪽 소리예요. "가글가글", "꿀꺽" 같은 놀이 소리로 연습해요.' },
  { id: 'stop', name: 'ㅅ·ㅈ·ㅊ이 ㄷ·ㅌ로', ex: '사과 → 다과', tip: '바람 소리 "스-" 를 길게 내는 놀이부터 시작해요.' },
  { id: 'deasp', name: '거센소리(ㅋㅌㅍㅊ)가 예사소리로', ex: '토끼 → 도끼', tip: '손바닥에 "후" 바람을 느끼며 ㅋ·ㅌ·ㅍ 소리를 내 봐요.' },
  { id: 'liquid', name: 'ㄹ 소리 어려움', ex: '라면 → 아면', tip: '"랄랄라" 노래, 혀끝을 윗잇몸에 대는 놀이를 해요.' },
  { id: 'initial', name: '첫소리 빠짐', ex: '바다 → 아다', tip: '첫소리를 살짝 크게 들려주고 따라 하게 해요.' },
  { id: 'syll', name: '음절 빠짐', ex: '바나나 → 나나', tip: '박수로 음절을 나눠 말해요 (말소리 북치기 놀이).' },
  { id: 'vowel', name: '모음이 다름', ex: '오리 → 우리', tip: '거울 앞에서 입 모양을 크게 보여 주세요 (입 운동 거울).' }
];
/* 목표 낱말과 들린 말을 비교해 음운 변동을 찾는다 */
SL.analyzePair = function (target, heard) {
  var T = syls(target), Hs = String(heard || '').split(/\s+/).map(syls).filter(function (x) { return x.length; });
  if (!T.length || !Hs.length) return [];
  /* 목표와 가장 비슷한 낱말 하나만 본다 */
  var H = Hs.sort(function (a, b) { return Math.abs(a.length - T.length) - Math.abs(b.length - T.length); })[0];
  var out = [];
  if (H.length < T.length) {
    /* 음절 빠짐은 들린 말이 목표 낱말에서 음절만 빠진 모양일 때만 (바나나 → 나나). 엉뚱한 말은 빼낸다 */
    var j = 0;
    for (var k = 0; k < T.length && j < H.length; k++) if (T[k].cho === H[j].cho && T[k].jung === H[j].jung) j++;
    if (j === H.length) out.push('syll');
    return out;
  }
  if (H.length !== T.length) return out;
  var same = 0;
  for (var i = 0; i < T.length; i++) {
    var t = T[i], h = H[i];
    if (t.cho === h.cho && t.jung === h.jung && t.jong === h.jong) { same++; continue; }
    if (t.jong && !h.jong) out.push('final');
    if (t.cho !== h.cho) {
      if ('ㄱㅋㄲ'.indexOf(t.cho) >= 0 && 'ㄷㅌㄸ'.indexOf(h.cho) >= 0) out.push('front');
      else if ('ㅅㅆㅈㅊㅉ'.indexOf(t.cho) >= 0 && 'ㄷㅌㄸ'.indexOf(h.cho) >= 0) out.push('stop');
      else if ('ㅋㅌㅍㅊ'.indexOf(t.cho) >= 0 && 'ㄱㄷㅂㅈ'.indexOf(h.cho) >= 0) out.push('deasp');
      else if (t.cho === 'ㄹ') out.push('liquid');
      else if (t.cho !== 'ㅇ' && h.cho === 'ㅇ') out.push('initial');
    }
    if (t.jung !== h.jung) out.push('vowel');
  }
  /* 거의 다른 말이면(같은 음절이 하나도 없고 변동이 많음) 엉뚱한 인식으로 보고 빼낸다 */
  if (!same && out.length > T.length) return [];
  return out.filter(function (x, i, a) { return a.indexOf(x) === i; });
};
function words(text) { return String(text || '').split(/\s+/).map(norm).filter(function (w) { return w && /[가-힣]/.test(w); }); }
function weekKey(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return G.today(d); }
/* entries 를 분석 — days 일 */
SL.analyze = function (entries, days) {
  days = days || 30;
  var since = Date.now() - days * 864e5, E = entries.filter(function (e) { return e.t >= since; });
  var heardE = E.filter(function (e) { return e.heard; }), targeted = E.filter(function (e) { return e.target; });
  var success = function (e) { return e.judge === true || (e.judge == null && e.ok); };
  var vocab = {}, firstSeen = {};
  entries.forEach(function (e) { words(e.heard).forEach(function (w) { if (!firstSeen[w]) firstSeen[w] = e.t; }); });
  heardE.forEach(function (e) { words(e.heard).forEach(function (w) { vocab[w] = (vocab[w] || 0) + 1; }); });
  var newWords = Object.keys(firstSeen).filter(function (w) { return firstSeen[w] >= Date.now() - 7 * 864e5; });
  var mluOf = function (arr) { var n = 0, s = 0; arr.forEach(function (e) { var c = words(e.heard).length; if (c) { n++; s += c; } }); return n ? Math.round(s / n * 100) / 100 : 0; };
  var lat = heardE.filter(function (e) { return e.latency > 0 && e.latency < 15000; });
  /* 음운 변동 */
  var procs = {}; SL.PROC.forEach(function (p) { procs[p.id] = { id: p.id, name: p.name, ex: p.ex, tip: p.tip, count: 0, examples: [] }; });
  var checked = 0;
  targeted.forEach(function (e) {
    if (!e.heard) return;
    var said = e.label || e.heard;               /* 부모가 고쳐 단 말이 있으면 그것을 믿는다 */
    if (norm(said) === norm(e.target)) { checked++; return; }
    var ps = SL.analyzePair(e.target, said); if (ps.length) checked++;
    ps.forEach(function (id) { var p = procs[id]; p.count++; if (p.examples.length < 4) p.examples.push(e.target + ' → ' + said); });
  });
  /* 어려운 낱말 — 두 번 이상 해 보고 성공이 60% 밑 */
  var byT = {};
  targeted.forEach(function (e) { var b = byT[e.target] = byT[e.target] || { w: e.target, n: 0, ok: 0 }; b.n++; if (success(e)) b.ok++; });
  var hard = Object.keys(byT).map(function (k) { return byT[k]; }).filter(function (b) { return b.n >= 2 && b.ok / b.n < 0.6; })
    .sort(function (a, b) { return a.ok / a.n - b.ok / b.n || b.n - a.n; }).slice(0, 12);
  /* 주별 추이 */
  var wk = {};
  E.forEach(function (e) { var k = weekKey(e.t), w = wk[k] = wk[k] || { wk: k, n: 0, arr: [] }; w.n++; w.arr.push(e); });
  var weekly = Object.keys(wk).sort().map(function (k) { return { wk: k, n: wk[k].n, mlu: mluOf(wk[k].arr) }; });
  return {
    n: E.length, days: Object.keys(E.reduce(function (s, e) { s[e.d] = 1; return s; }, {})).length,
    audio: E.filter(function (e) { return e.audio; }).length,
    recog: targeted.length ? Math.round(targeted.filter(success).length / targeted.length * 100) : null,
    ndw: Object.keys(vocab).length, topWords: Object.keys(vocab).sort(function (a, b) { return vocab[b] - vocab[a]; }).slice(0, 30).map(function (w) { return { w: w, n: vocab[w] }; }),
    newWords: newWords.slice(0, 30), mlu: mluOf(heardE), mluChat: mluOf(heardE.filter(function (e) { return e.act === 'chat'; })),
    latency: lat.length ? Math.round(lat.reduce(function (s, e) { return s + e.latency; }, 0) / lat.length) : null,
    procs: SL.PROC.map(function (p) { return procs[p.id]; }).filter(function (p) { return p.count; }).sort(function (a, b) { return b.count - a.count; }),
    checked: checked, hard: hard, weekly: weekly, labeled: E.filter(function (e) { return e.judge != null || e.label; }).length
  };
};
/* 부모 코치·리포트에 넣을 짧은 글 (이름 없음) */
SL.summaryText = '';
SL.hardCache = [];
var refreshT = null;
SL.refreshSoon = function () { clearTimeout(refreshT); refreshT = setTimeout(SL.refresh, 1500); };
SL.refresh = function () {
  return SL.all().then(function (r) {
    var a = SL.analyze(r, 30); SL.hardCache = a.hard.map(function (h) { return h.w; });
    if (!a.n) { SL.summaryText = ''; return a; }
    SL.summaryText = '[말소리 기록 30일 · 음성 인식 기준 추정] 말한 횟수 ' + a.n + '번(' + a.days + '일), 목표 낱말 성공 ' + (a.recog == null ? '–' : a.recog + '%') +
      ', 다른 낱말 수 ' + a.ndw + '개(이번 주 새 낱말 ' + a.newWords.length + '), 평균 문장 길이 ' + a.mlu + '어절' + (a.mluChat ? '(대화 ' + a.mluChat + ')' : '') +
      (a.latency ? ', 평균 반응 시간 ' + (a.latency / 1000).toFixed(1) + '초' : '') +
      (a.procs.length ? '\n말소리 패턴: ' + a.procs.slice(0, 5).map(function (p) { return p.name + ' ' + p.count + '회(예: ' + p.examples.slice(0, 2).join(', ') + ')'; }).join(' / ') : '') +
      (a.hard.length ? '\n어려운 낱말: ' + a.hard.slice(0, 8).map(function (h) { return h.w + '(' + h.ok + '/' + h.n + ')'; }).join(', ') : '');
    return a;
  });
};
/* 낱말 카드가 쓰는 '더 연습할 낱말' */
SL.hard = function () { return SL.hardCache.slice(); };

/* ---------- 학습 데이터 내보내기 (ZIP) ---------- */
var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u) { var c = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
/* 압축 없는(store) ZIP — files: [{name, data: Uint8Array}] → Blob */
SL.zip = function (files) {
  var enc = new TextEncoder(), parts = [], central = [], off = 0;
  function u16(v) { return [v & 255, (v >>> 8) & 255]; }
  function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
  var now = new Date(), dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)), dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate());
  files.forEach(function (f) {
    var name = enc.encode(f.name), data = f.data, crc = crc32(data);
    var head = [].concat([0x50, 0x4b, 0x03, 0x04], u16(20), u16(0x0800), u16(0), u16(dt), u16(dd), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
    parts.push(new Uint8Array(head), name, data);
    central.push(new Uint8Array([].concat([0x50, 0x4b, 0x01, 0x02], u16(20), u16(20), u16(0x0800), u16(0), u16(dt), u16(dd), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off))), name);
    off += head.length + name.length + data.length;
  });
  var csize = central.reduce(function (s, p) { return s + p.length; }, 0);
  var end = new Uint8Array([].concat([0x50, 0x4b, 0x05, 0x06], u16(0), u16(0), u16(files.length), u16(files.length), u32(csize), u32(off), u16(0)));
  return new Blob(parts.concat(central, [end]), { type: 'application/zip' });
};
function ext(mime) { return /mp4|aac/.test(mime || '') ? 'm4a' : /ogg/.test(mime || '') ? 'ogg' : 'webm'; }
function csvCell(v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
SL.exportData = function (opt) {
  opt = opt || {};
  return SL.all().then(function (r) {
    var enc = new TextEncoder(), files = [], lines = [], rows = [['id', 'date', 'time', 'activity', 'level', 'target', 'asr_text', 'match_score', 'recognized', 'parent_judgement', 'parent_label', 'latency_ms', 'audio_file', 'duration_ms']];
    var audioJobs = r.map(function (e) {
      var af = e.audio && opt.audio !== false ? 'audio/' + e.id + '.' + ext(e.mime) : '';
      var a = G.acts[e.act];
      lines.push(JSON.stringify({ id: e.id, date: e.d, time: new Date(e.t).toISOString(), activity: e.act, activity_title: a ? a.title : '', level: e.lv,
        target: e.target, asr_text: e.heard, asr_alternatives: e.alts || [], match_score: e.score, recognized: !!e.ok,
        parent_judgement: e.judge == null ? null : e.judge, parent_label: e.label || null, text: e.label || (e.judge ? e.target : e.heard) || '',
        latency_ms: e.latency || null, audio_filepath: af || null, duration_ms: e.dur || null }));
      rows.push([e.id, e.d, new Date(e.t).toTimeString().slice(0, 8), a ? a.title : e.act, e.lv, e.target, e.heard, e.score, e.ok ? 1 : 0, e.judge == null ? '' : e.judge ? 1 : 0, e.label || '', e.latency || '', af, e.dur || '']);
      if (!af) return null;
      return e.audio.arrayBuffer().then(function (buf) { files.push({ name: af, data: new Uint8Array(buf) }); });
    }).filter(Boolean);
    return Promise.all(audioJobs).then(function () {
      var a = SL.analyze(r, 3650);
      var readme = ['함께 자라요 — 말소리 학습 데이터', '',
        '만든 날: ' + new Date().toLocaleString('ko-KR'), '녹음 ' + r.length + '개 (소리 파일 ' + files.length + '개)', '',
        '파일', '- manifest.jsonl : 한 줄에 말 한 번. text = 가장 믿을 만한 정답 글(부모 라벨 > 부모 👍 시 목표 낱말 > 음성 인식 글)',
        '- utterances.csv : 같은 내용을 표로 (엑셀)', '- summary.json   : 분석 결과 (다른 낱말 수·평균 문장 길이·말소리 패턴·어려운 낱말)', '- audio/         : 소리 파일 (webm/m4a)', '',
        '주의', '- 아이 목소리가 들어 있습니다. 공개된 곳에 올리지 말고 담당 치료사 등 꼭 필요한 사람에게만 주세요.',
        '- 아이 이름은 넣지 않았습니다.', '- 음성 인식 글은 기계가 들은 것이라 실제 발음과 다를 수 있습니다. 부모 라벨이 있는 줄이 가장 정확합니다.'].join('\r\n');
      files.unshift(
        { name: 'README.txt', data: enc.encode(readme) },
        { name: 'manifest.jsonl', data: enc.encode(lines.join('\n') + '\n') },
        { name: 'utterances.csv', data: enc.encode('﻿' + rows.map(function (x) { return x.map(csvCell).join(','); }).join('\r\n')) },
        { name: 'summary.json', data: enc.encode(JSON.stringify(a, null, 2)) }
      );
      return SL.zip(files);
    });
  });
};

/* 앱을 열면 어려운 낱말·요약을 미리 계산해 둔다 */
setTimeout(function () { SL.refresh().catch(function () {}); }, 1500);
})();

/* ===========================================================
   동산 퀴즈 배틀 — 휴대폰 참여 (실시간 연결)

   인도자 화면(방장)과 참가자 휴대폰이 공개 MQTT 방송국(WebSocket)을 거쳐 이야기한다.
   - 서버를 따로 만들 필요가 없다. 누구나 쓰는 공개 방송국에 붙는다 (EMQX → 안 되면 HiveMQ → Mosquitto).
   - 방 코드마다 길이 따로 있다.
       dongsan-quiz/v1/<코드>/state  방장 → 모두 (마지막 화면 상태를 남겨 두어 늦게 온 사람도 바로 본다)
       dongsan-quiz/v1/<코드>/in     참가자 → 방장 (참여 · 답 · 버저)
   - 오가는 것은 팀 이름 · 별명 · 답뿐이다. 이름 · 전화번호는 쓰지 않는다.
     정답은 인도자가 「정답 공개」를 누른 뒤에만 보낸다.
   - 다른 방송국을 쓰려면 주소 뒤에 ?broker=wss://… (참가 링크에도 저절로 붙는다).
   - 라이브러리(mqtt.js · QR)는 「휴대폰 참여 켜기」나 「참여」를 누를 때만 불러온다.
   =========================================================== */
(function () {
'use strict';
const LIBS = {
  mqtt: 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js',
  qr: 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'
};
const BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081'];
const ROOT = 'dongsan-quiz/v1/';
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 헷갈리는 I O 0 1 은 뺀다

const loading = {};
function load(src, global) {
  if (window[global]) return Promise.resolve();
  if (!loading[src]) loading[src] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => (window[global] ? res() : rej(new Error('실시간 도구를 불러오지 못했어요')));
    s.onerror = () => { delete loading[src]; s.remove(); rej(new Error('인터넷 연결을 확인해 주세요 (실시간 도구를 불러오지 못했어요)')); };
    document.head.appendChild(s);
  });
  return loading[src];
}
function customBroker() { try { return new URLSearchParams(location.search).get('broker') || ''; } catch (e) { return ''; } }
function brokers() { const c = customBroker(); return c ? [c] : BROKERS; }
function order(prefer) {
  const all = brokers().map((_, i) => i);
  return prefer != null && all.indexOf(+prefer) >= 0 ? [+prefer].concat(all.filter(i => i !== +prefer)) : all;
}
function newCode() {
  const a = new Uint32Array(4);
  crypto.getRandomValues(a);
  return Array.from(a, x => ALPHA[x % ALPHA.length]).join('');
}
const cleanCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

function connect(url, ms) {
  return new Promise((res, rej) => {
    let done = false;
    const c = window.mqtt.connect(url, { clientId: 'dq' + Math.random().toString(36).slice(2, 12), clean: true, connectTimeout: ms, reconnectPeriod: 0, keepalive: 30 });
    const to = setTimeout(() => fail(new Error('연결 시간이 지났어요')), ms + 500);
    function fail(e) { if (done) return; done = true; clearTimeout(to); try { c.end(true); } catch (x) {} rej(e || new Error('연결하지 못했어요')); }
    c.once('connect', () => { if (done) return; done = true; clearTimeout(to); c.options.reconnectPeriod = 2500; res(c); });
    c.once('error', fail);
    c.once('close', () => fail());
  });
}
/* 남겨 둔 상태 하나를 잠깐 기다려 본다 (없으면 null) */
function peek(c, topic, ms) {
  return new Promise(res => {
    let t = 0;
    const on = (tp, p) => { if (tp !== topic || !p || !p.length) return; clearTimeout(t); c.removeListener('message', on); res(p.toString()); };
    c.on('message', on);
    c.subscribe(topic, { qos: 1 }, err => { if (err) { c.removeListener('message', on); res(null); } });
    t = setTimeout(() => { c.removeListener('message', on); res(null); }, ms);
  });
}
function watch(c, onStatus) {
  c.on('connect', () => onStatus('on'));
  c.on('reconnect', () => onStatus('wait'));
  c.on('offline', () => onStatus('off'));
}

/* 방장: 방을 열고(코드가 겹치지 않게) /in 을 듣는다 */
async function host(opts) {
  await load(LIBS.mqtt, 'mqtt');
  const urls = brokers();
  let last = null;
  for (const i of order(opts.prefer)) {
    let c;
    try { c = await connect(urls[i], 7000); } catch (e) { last = e; continue; }
    let code = cleanCode(opts.code);
    if (!code) {
      for (let k = 0; k < 4 && !code; k++) {
        const cand = newCode(), tp = ROOT + cand + '/state';
        const hit = await peek(c, tp, 700);
        c.unsubscribe(tp);
        if (!hit) code = cand;
      }
      if (!code) code = newCode();
    }
    const base = ROOT + code;
    c.subscribe(base + '/in', { qos: 1 });
    c.on('message', (tp, p) => {
      if (tp !== base + '/in' || !p || !p.length || p.length > 4000) return;
      let m; try { m = JSON.parse(p.toString()); } catch (e) { return; }
      if (m && typeof m === 'object') opts.onMsg(m);
    });
    watch(c, opts.onStatus);
    return {
      code, broker: i, custom: customBroker(),
      pub(state) { if (c.connected) c.publish(base + '/state', JSON.stringify(state), { qos: 1, retain: true }); },
      close() {
        return new Promise(r => {
          const t = setTimeout(r, 1500);
          try { c.publish(base + '/state', '', { qos: 1, retain: true }, () => { c.end(false, {}, () => { clearTimeout(t); r(); }); }); } catch (e) { r(); }
        });
      }
    };
  }
  throw last || new Error('실시간 연결에 실패했어요');
}

/* 참가자: 방을 찾아(방송국을 차례로) 상태를 받고 /in 으로 보낸다 */
async function join(opts) {
  await load(LIBS.mqtt, 'mqtt');
  const code = cleanCode(opts.code), topic = ROOT + code + '/state', urls = brokers();
  let last = null;
  for (const i of order(opts.prefer)) {
    let c;
    try { c = await connect(urls[i], 7000); } catch (e) { last = e; continue; }
    const first = await peek(c, topic, 3500);
    if (!first) { c.end(true); last = new Error('방을 찾지 못했어요. 코드를 다시 확인해 주세요'); continue; }
    const hand = s => { if (!s) { opts.onState(null); return; } let v; try { v = JSON.parse(s); } catch (e) { return; } opts.onState(v); };
    c.on('message', (tp, p) => { if (tp === topic) hand(p && p.length ? p.toString() : ''); });
    watch(c, opts.onStatus);
    hand(first);
    return {
      code, broker: i,
      send(m) { if (!c.connected) return false; c.publish(ROOT + code + '/in', JSON.stringify(m), { qos: 1 }); return true; },
      close() { try { c.end(true); } catch (e) {} }
    };
  }
  throw last || new Error('실시간 연결에 실패했어요');
}

/* 참여 QR (흰 바탕 검은 칸 — 어느 화면에서도 카메라가 잘 읽게) */
async function qrSVG(text) {
  await load(LIBS.qr, 'qrcode');
  const q = window.qrcode(0, 'M');
  q.addData(text); q.make();
  const n = q.getModuleCount(), m = 2, w = n + m * 2;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ',' + (r + m) + 'h1v1h-1z';
  return '<svg viewBox="0 0 ' + w + ' ' + w + '" shape-rendering="crispEdges" role="img" aria-label="참여 QR 코드"><rect width="' + w + '" height="' + w + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
}

window.QuizLive = { host, join, qrSVG, newCode, cleanCode, customBroker, BROKERS, LIBS };
})();

/* 어린이 이야기 드라마 낭독 — 배역 나누기 · 소리 파일 잇기
 *
 *   node scripts/kids-voice.js plan            → 날마다 이야기를 내레이터·인물 대사로 나눈 목록(JSON)을 찍는다
 *   node scripts/kids-voice.js join <조각폴더>  → <날짜>-<번호>.mp3 조각을 날짜마다 하나로 이어
 *                                                audio/kids/<날짜>.mp3 와 word-audio.js 를 만든다
 *
 * 소리는 ElevenLabs(eleven_v4)로 한 줄씩 만든다. 같은 형식(128kbps·44.1kHz·모노) mp3 는
 * 앞의 ID3 머리만 떼고 이어 붙이면 그대로 한 파일로 재생된다.
 * 성경 본문(개역개정)은 녹음하지 않는다 — 우리가 쓴 어린이 이야기(kids.summary)만 읽는다.
 */
var fs = require('fs'), path = require('path'), vm = require('vm');
var ROOT = path.join(__dirname, '..');

/* 배역 — voice 는 ElevenLabs 목소리 id, tag 는 그 인물의 기본 연기 */
var CAST = {
  narrator: { name: '이야기꾼', voice: 'JQaWvPoEUkcuOTfxFYpJ', tag: 'warm, gentle storytelling to young children' },
  god:      { name: '하나님',   voice: 'WnFTM7Gw75NWybKycaRt', tag: 'deep, majestic, slow and loving' },
  jesus:    { name: '예수님',   voice: '86GErZIiGJsPO3g7QNxZ', tag: 'gentle, warm and kind' },
  prophet:  { name: '선지자·어르신', voice: '8G6jifm9f1BhHXadvwOt', tag: 'earnest, heartfelt' },
  david:    { name: '다윗·시인', voice: 'Ir7oQcBXWiq4oFGROCfj', tag: 'tender, like singing a prayer' },
  paul:     { name: '바울·사도', voice: 'jctVgUrrEJoJjGpfN5Ef', tag: 'passionate, encouraging' },
  peter:    { name: '베드로·제자·사람들', voice: 'VpI9YrC8mqZsi3NvIQzK', tag: 'bright, sincere' },
  woman:    { name: '마리아·여인', voice: 'Ss1VfT7ri4lqnvTDWII0', tag: 'soft, bright, heartfelt' },
  angel:    { name: '천사', voice: 'gnWujHp24oqX3I03lRbU', tag: 'radiant, joyful announcement' },
  villain:  { name: '뱀·마귀', voice: 'wMrz30qBeYiSkAtnZGtn', tag: 'sly, sneaky, playful villain for kids' }
};

/* 따옴표 앞 글에서 마지막 '주어'(이름 + 은·는·이·가·께서)로 말하는 사람을 정한다.
   주어가 없으면 마지막으로 나온 이름을 쓴다. 앞에 있는 것이 먼저 맞춰 본다(세례 요한 → 요한). */
var WHO = [
  ['뱀|마귀', 'villain'],
  ['천사 가브리엘|천사들|천사', 'angel'],
  ['마리아|마르다|사마리아 여인|여인|하와|여자들', 'woman'],
  ['예수님', 'jesus'],
  ['하나님|여호와', 'god'],
  ['다윗 왕|다윗|시편 기자', 'david'],
  ['세례 요한|이사야|예레미야|시므온 할아버지|시므온|아빠 사가랴|사가랴|모세|엘리야', 'prophet'],
  ['바울|요한 사도|요한', 'paul'],
  ['베드로|제자들|사람들|안드레|삭개오', 'peter']
];
/* 따옴표지만 대사가 아닌 것(강조·이름) — 이야기꾼이 그대로 읽는다 */
var NOT_SPEECH = ['‘하나님을 닮게’', '‘말씀’', '‘임마누엘’'];
/* 날짜별로 바로잡기: [날짜, 몇 번째 대사(0부터), 배역] */
var FIX = [
  ['2026-11-14', 0, 'narrator'],   /* “아빠 아버지!” — 우리가 부르는 말 */
  ['2026-11-22', 0, 'jesus'],      /* 주기도문 첫마디 */
  ['2026-12-20', 0, 'jesus'],      /* 요한복음 3:16 */
  ['2026-12-13', 0, 'god'],        /* “위로하라 내 백성을…” 하는 하나님 말씀 */
  ['2026-12-24', 0, 'prophet']     /* 사가랴의 노래 (‘아기 요한이’ 가 주어로 잡히지 않게) */
];

var NAME_ROLE = {}, NAMES = [];
WHO.forEach(function (w) { w[0].split('|').forEach(function (n) { NAME_ROLE[n] = w[1]; NAMES.push(n); }); });
NAMES.sort(function (a, b) { return b.length - a.length; });   /* 긴 이름부터 — 「세례 요한」이 「요한」보다 먼저 */
var NAME_RE = new RegExp('(' + NAMES.join('|') + ')(은|는|이|가|께서)?(?=[\\s,.!?]|$)', 'g');
function lastRole(txt) {
  var subj = null, any = null, m;
  NAME_RE.lastIndex = 0;
  while ((m = NAME_RE.exec(txt))) { any = NAME_ROLE[m[1]]; if (m[2]) subj = any; }
  return subj || any;
}
function mood(t, role) {
  if (role === 'narrator') return /!$/.test(t.trim()) ? 'cheerful, excited' : '';
  if (/\?\s*[’”]?$/.test(t)) return 'asking, curious';
  if (/!\s*[’”]?$/.test(t)) return 'with joy and excitement';
  return '';
}

function loadData() {
  var ctx = { window: {}, console: console }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'word-data.js'), 'utf8') + ';this.W=WordData;this.S=WORD_SERIES', ctx);
  return ctx;
}

function plan() {
  var c = loadData(), W = c.W, d = c.S.from, out = [];
  while (d <= c.S.to) {
    var x = W.forDate(d, {}), parts = x.kids.summary.split(/([‘“][^’”]*[’”])/).filter(function (p) { return p.trim(); });
    var segs = [], said = 0, before = '';
    parts.forEach(function (p) {
      var isQ = /^[‘“]/.test(p) && NOT_SPEECH.indexOf(p) < 0, role = 'narrator';
      if (isQ) {
        role = lastRole(before) || 'narrator';
        FIX.forEach(function (f) { if (f[0] === d && f[1] === said) role = f[2]; });
        said++;
        p = p.replace(/^[‘“]|[’”]$/g, '');
      }
      if (!isQ) before += p;
      var last = segs[segs.length - 1];
      if (last && last.role === role) { last.text += ' ' + p.trim(); return; }   /* 같은 목소리는 한 줄로 */
      segs.push({ role: role, text: p.trim() });
    });
    /* 맨 앞에 오늘 이야기 제목을 이야기꾼이 알려 준다 */
    var intro = '오늘의 이야기. ' + x.title + '.';
    if (segs[0].role === 'narrator') segs[0].text = intro + ' ' + segs[0].text;
    else segs.unshift({ role: 'narrator', text: intro });
    segs.forEach(function (s, i) {
      var cast = CAST[s.role], m = mood(s.text, s.role);
      out.push({ date: d, i: i + 1, role: s.role, voice: cast.voice, text: s.text,
                 prompt: '[' + cast.tag + (m ? ', ' + m : '') + '] ' + s.text });
    });
    d = W.shift(d, 1);
  }
  return out;
}

/* mp3 앞의 ID3v2 머리를 뗀다 */
function stripId3(buf) {
  if (buf.length > 10 && buf.toString('latin1', 0, 3) === 'ID3') {
    var size = (buf[6] & 0x7f) << 21 | (buf[7] & 0x7f) << 14 | (buf[8] & 0x7f) << 7 | (buf[9] & 0x7f);
    return buf.slice(10 + size + ((buf[5] & 0x10) ? 10 : 0));
  }
  return buf;
}

function join(dir) {
  var files = fs.readdirSync(dir).filter(function (f) { return /^\d{4}-\d\d-\d\d-\d+\.mp3$/.test(f); });
  var byDay = {};
  files.forEach(function (f) { var m = f.match(/^(\d{4}-\d\d-\d\d)-(\d+)\.mp3$/); (byDay[m[1]] = byDay[m[1]] || []).push([+m[2], f]); });
  var want = {}; plan().forEach(function (s) { want[s.date] = Math.max(want[s.date] || 0, s.i); });
  var outDir = path.join(ROOT, 'audio', 'kids'); fs.mkdirSync(outDir, { recursive: true });
  var done = [];
  Object.keys(byDay).sort().forEach(function (day) {
    var parts = byDay[day].sort(function (a, b) { return a[0] - b[0]; });
    if (parts.length !== want[day]) { console.log('건너뜀(조각 모자람)', day, parts.length + '/' + want[day]); return; }
    var bufs = parts.map(function (p) { return stripId3(fs.readFileSync(path.join(dir, p[1]))); });
    fs.writeFileSync(path.join(outDir, day + '.mp3'), Buffer.concat(bufs));
    done.push(day);
  });
  /* 앱이 읽는 목록 — 소리 파일이 있는 날만, 줄마다 배역·글·끝나는 시각(초)을 적는다.
     128kbps 고정 비트레이트라 길이는 (바이트 × 8 ÷ 128000) 으로 셈한다. */
  var lines = {}, P = plan();
  done.forEach(function (day) {
    var t = 0;
    lines[day] = P.filter(function (s) { return s.date === day; }).map(function (s) {
      var bytes = stripId3(fs.readFileSync(path.join(dir, day + '-' + s.i + '.mp3'))).length;
      t += bytes * 8 / 128000;
      return { r: s.role, e: Math.round(t * 100) / 100, x: s.text };
    });
  });
  var old = {};
  try { var c0 = { window: {} }; vm.createContext(c0); vm.runInContext(fs.readFileSync(path.join(ROOT, 'word-audio.js'), 'utf8') + ';this.A=WORD_AUDIO', c0); old = c0.A || {}; } catch (e) {}
  Object.keys(old).forEach(function (d) { if (!lines[d] && Array.isArray(old[d]) && fs.existsSync(path.join(outDir, d + '.mp3'))) lines[d] = old[d]; });
  var body = Object.keys(lines).sort().map(function (d) { return JSON.stringify(d) + ':' + JSON.stringify(lines[d]); }).join(',\n');
  fs.writeFileSync(path.join(ROOT, 'word-audio.js'),
    '/* 어린이 이야기 드라마 낭독 목록 — scripts/kids-voice.js 가 만든다. 손으로 고치지 않는다.\n' +
    '   날짜: [{r:배역, e:끝나는 시각(초), x:글}]. 소리 파일은 audio/kids/<날짜>.mp3 */\n' +
    'var WORD_AUDIO={\n' + body + '\n};\n');
  console.log('이은 날', done.length, '일');
}

if (require.main === module) {
  var cmd = process.argv[2];
  if (cmd === 'plan') console.log(JSON.stringify(plan(), null, 1));
  else if (cmd === 'join') join(process.argv[3]);
  else console.log('사용법: node scripts/kids-voice.js plan | join <조각폴더>');
}
module.exports = { plan: plan, CAST: CAST };

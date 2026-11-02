/* =========================================================
   함께 자라요 — 그림 모음 (hero-art.js)
   자비스·영역 문장·모으는 로봇·메달을 SVG 글자로 그린다. 라이브러리 없음.

   window.GA = {
     jarvis({full, size, cls})          자비스 (얼굴 / 온몸)
     areaIcon(key, {size})              영역 육각 문장 (speech motor art mind brain feel body calm)
     ROBOTS, PARTS                      모으는 로봇 6종 · 부품 이름 6개
     robot(index, owned, {size, highlight, cls})
     badge(text, {size, color, ribbon, cls})
     AREAS                              영역 색·이름
   }
   - 모든 그림은 독창적인 디자인이다 (특정 만화·영화 캐릭터를 본뜨지 않는다).
   - <defs> 의 id 에는 부를 때마다 다른 꼬리표가 붙어 한 화면에 여러 장을 놓아도 섞이지 않는다.
   - 빛은 늘 왼쪽 위에서 온다.
   ========================================================= */
(function () {
  'use strict';

  var OL = '#0f1830';                                   /* 외곽선 */
  var PFX = 'g' + Math.random().toString(36).slice(2, 5);
  var seq = 0;

  /* ---------- 색 ---------- */
  function n2(v) { return Math.round(v * 100) / 100; }
  function rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var v = parseInt(h, 16) || 0; return [v >> 16 & 255, v >> 8 & 255, v & 255]; }
  function hex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }
  function lt(c, t) { return mix(c, '#ffffff', t); }
  function dk(c, t) { return mix(c, '#070b18', t); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function nz(v) { return String(v).replace(/^0\./, '.'); }
  function stops(st) {
    return st.map(function (s) { return '<stop offset="' + nz(s[0]) + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + nz(s[2]) + '"' : '') + '/>'; }).join('');
  }

  /* ---------- 한 장의 그림 (defs 모음) ---------- */
  function Ctx() { this.p = PFX + (++seq).toString(36) + '-'; this.d = []; this.k = {}; }
  Ctx.prototype.add = function (name, make) {
    if (!this.k[name]) { this.k[name] = this.p + this.d.length.toString(36); this.d.push(make(this.k[name])); }
    return this.k[name];
  };
  Ctx.prototype.lin = function (name, st, v) {
    v = v || [0, 0, 0, 1];
    return 'url(#' + this.add(name, function (id) {
      return '<linearGradient id="' + id + '" x1="' + nz(v[0]) + '" y1="' + nz(v[1]) + '" x2="' + nz(v[2]) + '" y2="' + nz(v[3]) + '">' + stops(st) + '</linearGradient>';
    }) + ')';
  };
  Ctx.prototype.rad = function (name, st, v) {
    v = v || [.5, .5, .5];
    return 'url(#' + this.add(name, function (id) {
      return '<radialGradient id="' + id + '" cx="' + nz(v[0]) + '" cy="' + nz(v[1]) + '" r="' + nz(v[2]) + '"' + (v[3] != null ? ' fx="' + nz(v[3]) + '" fy="' + nz(v[4]) + '"' : '') + '>' + stops(st) + '</radialGradient>';
    }) + ')';
  };
  /* 반짝이는 칠: 위 왼쪽 밝게 → 가운데 또렷한 반사 경계 → 아래 어둡게(바닥 반사광 조금) */
  Ctx.prototype.metal = function (c) {
    return this.lin('m' + c.replace('#', ''), [[0, lt(c, .68)], [.22, lt(c, .3)], [.46, c], [.5, dk(c, .1)], [.86, dk(c, .46)], [1, dk(c, .3)]], [.15, 0, .7, 1]);
  };
  Ctx.prototype.silver = function () {
    return this.lin('sv', [[0, '#ffffff'], [.4, '#e7edf6'], [.5, '#c5cfde'], [.88, '#7c8aa3'], [1, '#98a6bc']], [.15, 0, .7, 1]);
  };
  Ctx.prototype.joint = function () {
    return this.lin('jt', [[0, '#7a87a3'], [.45, '#3a445e'], [1, '#181e30']], [.15, 0, .7, 1]);
  };
  Ctx.prototype.glass = function () {
    return this.lin('gs', [[0, '#2f62ad'], [.42, '#0a1a3d'], [1, '#17427e']]);
  };
  Ctx.prototype.shine = function () { return this.rad('sh', [[0, '#ffffff', .95], [1, '#ffffff', 0]]); };
  /* 빛 번짐. 범위는 그 그림의 칸(r = [x, y, w, h])으로만 잡아 휴대폰에서도 가볍게 */
  Ctx.prototype.glow = function (sd, r) {
    r = r || [-10, -10, 220, 280];
    return 'url(#' + this.add('f' + sd + r.join(), function (id) {
      return '<filter id="' + id + '" filterUnits="userSpaceOnUse" x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '"><feGaussianBlur stdDeviation="' + sd + '"/></filter>';
    }) + ')';
  };
  Ctx.prototype.hazard = function () {
    return 'url(#' + this.add('hz', function (id) {
      return '<pattern id="' + id + '" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(45)"><rect width="9" height="9" fill="#ffc21a"/><rect width="4.5" height="9" fill="#1d2030"/></pattern>';
    }) + ')';
  };
  Ctx.prototype.svg = function (vb, cls, size, body, sw) {
    var s = size == null || size === '' ? '100%' : size;
    return '<svg xmlns="http://www.w3.org/2000/svg" class="' + esc(cls) + '" viewBox="' + vb + '" width="' + s + '" height="' + s + '" aria-hidden="true" focusable="false">' +
      (this.d.length ? '<defs>' + this.d.join('') + '</defs>' : '') +
      '<g stroke-width="' + (sw || 2) + '" stroke-linejoin="round" stroke-linecap="round">' + body + '</g></svg>';
  };

  /* ---------- 좌우 뒤집기 (왼쪽만 그리고 오른쪽은 거울로) ---------- */
  function mxd(d, W) {
    var cmd = '', i = 0;
    return d.replace(/([A-Za-z])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g, function (m, c, num) {
      if (c) { cmd = c; i = 0; return c; }
      var v = parseFloat(num), U = cmd.toUpperCase(), rel = cmd !== U;
      if (U === 'H') v = rel ? -v : W - v;
      else if (U === 'A') { var q = i % 7; if (q === 5) v = rel ? -v : W - v; else if (q === 4) v = 1 - v; else if (q === 2) v = -v; }
      else if (U !== 'V' && i % 2 === 0) v = rel ? -v : W - v;
      i++;
      return ' ' + n2(v);
    }).replace(/([A-Za-z]) /g, '$1').trim();
  }
  function mir(s, W) {
    W = W || 200;
    return s.replace(/<([a-zA-Z]+)([^<>]*?)(\/?)>/g, function (m, tag, at, sl) {
      var w = /\swidth="([-\d.]+)"/.exec(at);
      at = at.replace(/\s(d|cx|x1|x2|x|points|transform)="([^"]*)"/g, function (mm, k, v) {
        if (k === 'd') v = mxd(v, W);
        else if (k === 'points') v = mxd('M' + v, W).replace(/^M\s*/, '');
        else if (k === 'transform') v = v.replace(/rotate\(\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([-\d.]+)\s*\)/g, function (q, a, x, y) { return 'rotate(' + n2(-a) + ' ' + n2(W - x) + ' ' + y + ')'; });
        else if (k === 'x') v = w ? n2(W - v - w[1]) : v;
        else v = n2(W - v);
        return ' ' + k + '="' + v + '"';
      });
      return '<' + tag + at + sl + '>';
    });
  }

  /* ---------- 작은 도형 ---------- */
  function star(cx, cy, R, r, n, rot) {
    n = n || 5; rot = rot == null ? -90 : rot;
    var d = '';
    for (var i = 0; i < n * 2; i++) {
      var a = (rot + i * 180 / n) * Math.PI / 180, q = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + n2(cx + q * Math.cos(a)) + ' ' + n2(cy + q * Math.sin(a));
    }
    return d + 'Z';
  }
  function rhex(cx, cy, r, rd) {          /* 모서리가 둥근 육각형 (뾰족한 꼭지가 위) */
    var p = [], d = '', t = rd / r, i;
    for (i = 0; i < 6; i++) { var a = (60 * i - 90) * Math.PI / 180; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    for (i = 0; i < 6; i++) {
      var v = p[i], a0 = p[(i + 5) % 6], a1 = p[(i + 1) % 6];
      d += (i ? 'L' : 'M') + n2(v[0] + (a0[0] - v[0]) * t) + ' ' + n2(v[1] + (a0[1] - v[1]) * t) +
        'Q' + n2(v[0]) + ' ' + n2(v[1]) + ' ' + n2(v[0] + (a1[0] - v[0]) * t) + ' ' + n2(v[1] + (a1[1] - v[1]) * t);
    }
    return d + 'Z';
  }
  function hexPts(cx, cy, r) {
    var d = '';
    for (var i = 0; i < 6; i++) { var a = (60 * i - 90) * Math.PI / 180; d += (i ? 'L' : 'M') + n2(cx + r * Math.cos(a)) + ' ' + n2(cy + r * Math.sin(a)); }
    return d + 'Z';
  }
  function sz(o) { return o && o.size != null ? o.size : '100%'; }

  /* =========================================================
     1. 자비스 — 듬직한 형 같은 히어로 로봇
     ========================================================= */
  function jvPal(c, full) {
    return {
      A: c.lin('ja', [[0, '#a6caff'], [.2, '#5791f2'], [.45, '#2b5fd1'], [.5, '#1f4ab1'], [.88, '#0b1b52'], [1, '#183779']], [.15, 0, .72, 1]),
      D: c.lin('jd', [[0, '#5a7fd0'], [.5, '#1b3478'], [1, '#0b163d']], [.15, 0, .72, 1]),
      O: c.lin('jo', [[0, '#ffdf98'], [.42, '#ffa43c'], [.5, '#f3821a'], [1, '#ad4405']], [.15, 0, .72, 1]),
      V: c.lin('jz', [[0, '#24528f'], [.42, '#08183a'], [1, '#133a71']]),
      S: c.silver(), J: c.joint(), W: c.shine(),
      G: c.glow(2.2, [-8, -8, 136, 136]),          /* 머리 칸 (120) */
      G2: full ? c.glow(2.2, [-8, -8, 216, 316]) : ''   /* 온몸 칸 (200×300) */
    };
  }

  function jvEye(x, P) {
    var d = 'M' + (x - 8) + ' 54.6C' + (x - 8) + ' 49.6 ' + (x - 4.2) + ' 47.8 ' + x + ' 47.8C' + (x + 4.2) + ' 47.8 ' + (x + 8) + ' 49.6 ' + (x + 8) + ' 54.6C' +
      (x + 8) + ' 59.2 ' + (x + 4.5) + ' 61.8 ' + x + ' 61.8C' + (x - 4.5) + ' 61.8 ' + (x - 8) + ' 59.2 ' + (x - 8) + ' 54.6Z';
    return '<g class="jv-eye" fill="#6af3ff"><path d="' + d + '" filter="' + P.G + '" opacity=".9"/><path d="' + d + '"/>' +
      '<ellipse cx="' + x + '" cy="55.8" rx="5.2" ry="4" fill="' + P.W + '"/>' +
      '<circle cx="' + (x - 3.4) + '" cy="51.7" r="2" fill="#fff"/><circle cx="' + (x + 3.6) + '" cy="58.4" r=".95" fill="#fff" opacity=".85"/></g>';
  }

  /* 머리 — 120×120 칸 */
  function jvHead(P, sw, bust) {
    var ol = ' stroke="' + OL + '"';
    var th = ' stroke="' + OL + '" stroke-width="' + n2(sw * .6) + '"';
    var ln = ' fill="none" stroke="' + OL + '" stroke-opacity=".4" stroke-width="' + n2(sw * .5) + '"';
    var s = '';
    if (bust) {
      s += '<rect x="46" y="94" width="28" height="18" rx="3" fill="' + P.J + '"' + th + '/>' +
        '<path d="M18 118.8C20 109 33 103 48 103L72 103C87 103 100 109 102 118.8Z" fill="' + P.A + '"' + ol + '/>' +
        '<path d="M50 104.5L60 112L70 104.5L70 110L60 117.5L50 110Z" fill="' + P.O + '"' + th + '/>' +
        '<path d="M24 115C27 110 34 107 42 106" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="' + n2(sw * .6) + '"/>';
    }
    /* 뒤로 젖힌 귀 날개 (주황) */
    var fin = '<path d="M15 60C11 45 8 33 4 16C14 23.5 21 36 26.5 50Z" fill="' + P.O + '"' + ol + '/>';
    s += fin + mir(fin, 120) +
      '<path d="M8.5 25C12 33 15 41 18 50" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="' + n2(sw * .6) + '"/>' +
      '<path d="M111.5 25C108 33 105 41 102 50" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="' + n2(sw * .6) + '"/>';
    /* 투구 */
    s += '<path d="M60 9C81 9 97 20 99.5 40L101 62C101 80 93 94 79 101L70 106L50 106L41 101C27 94 19 80 19 62L20.5 40C23 20 39 9 60 9Z" fill="' + P.A + '"' + ol + '/>';
    var pl = '<path d="M29.5 45C29.5 62 31.5 78 41 91.5"' + ln + '/>';
    s += pl + mir(pl, 120);
    s += '<path d="M26.5 41C28.5 25 40 14.5 55 12.5C43 18 35 27 32 42Z" fill="#fff" opacity=".5"/>' +
      '<circle cx="33" cy="22" r="1.8" fill="#fff" opacity=".7"/>';
    /* 볏 */
    s += '<path d="M55.5 42L57 5.5Q60 2.2 63 5.5L64.5 42Z" fill="' + P.S + '"' + ol + '/>' +
      '<path d="M58.2 9L57.6 38" fill="none" stroke="#fff" stroke-width="' + n2(sw * .5) + '"/>';
    /* 은색 얼굴판 */
    s += '<path d="M31 57L89 57L87.5 82C86 94 74 101 60 101C46 101 34 94 32.5 82Z" fill="' + P.S + '"' + ol + '/>';
    var vent = '<path d="M35 70.5L43.5 73L44 78L35.6 75.6Z" fill="' + P.O + '"' + ' stroke="' + OL + '" stroke-width="' + n2(sw * .35) + '"/>';
    s += vent + mir(vent, 120);
    var seam = '<path d="M35.5 79C37.5 88 42 94 48 97.5"' + ln + '/>';
    s += seam + mir(seam, 120) + '<path d="M60 93L60 99.5"' + ln + '/>';
    /* 바이저 */
    s += '<path d="M25 45Q60 35 95 45L92.5 64Q60 73 27.5 64Z" fill="' + P.V + '"' + ol + '/>' +
      '<path d="M29.5 47.2Q60 39.2 90.5 47.2" fill="none" stroke="#9cc6ff" stroke-opacity=".55" stroke-width="' + n2(sw * .45) + '"/>' +
      '<path d="M31 48.5L39.5 46.3L34 63.6L29.6 62.6Z" fill="#fff" opacity=".1"/>';
    s += '<g class="jv-eyes">' + jvEye(45, P) + jvEye(75, P) + '</g>';
    /* 입: 홈 + 웃는 빛줄 + 말할 때 소리 막대 */
    s += '<rect x="46.5" y="79" width="27" height="11" rx="5.5" fill="#0a1734"' + th + '/>' +
      '<path d="M50 88.6L70 88.6" fill="none" stroke="#5a7db8" stroke-opacity=".5" stroke-width="' + n2(sw * .35) + '"/>';
    var sm = 'M52.5 83Q60 88.6 67.5 83';
    s += '<g class="jv-smile"><path d="' + sm + '" fill="none" stroke="#5ff1ff" stroke-width="4.6" opacity=".55" filter="' + P.G + '"/>' +
      '<path d="' + sm + '" fill="none" stroke="#c4fdff" stroke-width="2.3"/></g>';
    var bars = '', hs = [3.6, 6.6, 9, 6.6, 3.6];
    for (var i = 0; i < 5; i++) bars += '<rect x="' + n2(51.3 + i * 3.75) + '" y="' + n2(84.5 - hs[i] / 2) + '" width="2.4" height="' + hs[i] + '" rx="1.2"/>';
    s += '<g class="jv-mouth" fill="#6af3ff" opacity="0">' + bars + '</g>';
    /* 이마 보석 불빛 */
    s += '<path d="' + hexPts(60, 31.2, 10) + '" fill="' + P.S + '"' + ol + '/>' +
      '<g class="jv-bulb" fill="#ffd54f"><circle cx="60" cy="31.2" r="7.5" filter="' + P.G + '" opacity=".85"/>' +
      '<path d="' + hexPts(60, 31.2, 6.4) + '" stroke="' + OL + '" stroke-opacity=".45" stroke-width="' + n2(sw * .3) + '"/>' +
      '<path d="M60 24.8L65.5 28L60 31.2L54.5 28Z" fill="#fff" opacity=".6"/><circle cx="57.6" cy="33.6" r="1" fill="#fff" opacity=".7"/></g>';
    /* 귀 (들을 때 분홍빛) */
    function ear(x) {
      return '<g class="jv-ear" fill="#5fe9ff"><rect x="' + x + '" y="47.5" width="15" height="31" rx="6.5" fill="' + P.A + '"' + ol + '/>' +
        '<rect x="' + (x + 4.5) + '" y="53" width="6" height="20" rx="3" filter="' + P.G + '" opacity=".9"/><rect x="' + (x + 4.5) + '" y="53" width="6" height="20" rx="3"/>' +
        '<rect x="' + (x + 5.7) + '" y="55" width="1.7" height="8.5" rx=".85" fill="#fff" opacity=".75"/></g>';
    }
    s += ear(9) + ear(96);
    return s;
  }

  /* 온몸 — 200×300 칸, 한 손은 허리에, 한 손은 엄지 척 */
  function jvBody(P) {
    var ol = ' stroke="' + OL + '"';
    var th = ' stroke="' + OL + '" stroke-width="1.5"';
    var ln = ' fill="none" stroke="' + OL + '" stroke-opacity=".4" stroke-width="1.3"';
    var hi = ' fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"';
    var s = '<ellipse cx="100" cy="292" rx="58" ry="6" fill="#071026" opacity=".22"/>';
    /* 등 날개 */
    var fin = '<path d="M76 94C62 76 48 60 26 44C44 47 62 57 84 82Z" fill="' + P.O + '"' + ol + '/>' +
      '<path d="M76 94C66 80 56 70 42 58L84 82Z" fill="#000" opacity=".16"/>';
    s += fin + mir(fin) + '<path d="M34 49C50 55 62 63 74 76"' + hi + '/>';
    /* 다리 */
    var leg = '<g transform="rotate(4 86 160)">' +
      '<rect x="74" y="158" width="24" height="46" rx="8" fill="' + P.J + '"' + ol + '/>' +
      '<path d="M72.5 172L98.5 170L97.5 196L75 198Z" fill="' + P.A + '"' + ol + '/>' +
      '<path d="M76 176L77 192"' + hi + '/>' +
      '<path d="M70 210L100 210L104 252L97 265L74 265L66 252Z" fill="' + P.A + '"' + ol + '/>' +
      '<path d="M72 214L72 248"' + hi + '/>' +
      '<path d="M86 216L97 216L95 232L88 236Z" fill="' + P.O + '"' + th + '/>' +
      '<rect x="78" y="236" width="5" height="18" rx="2.5" fill="#6af3ff"/>' +
      '<path d="M73 198L98 198L100 210L86 217L71 210Z" fill="' + P.S + '"' + ol + '/>' +
      '<path d="M64 261L100 261L105 280L105 290L54 290C54 282 57 277 64 275Z" fill="' + P.D + '"' + ol + '/>' +
      '<path d="M54 290C54 282 57 277 64 275L74 275L76 290Z" fill="' + P.O + '"' + th + '/>' +
      '<path d="M80 270L100 270"' + ln + '/></g>';
    s += leg + mir(leg);
    /* 허리·골반 */
    var hip = '<path d="M73 154L92 157L90.5 175L70.5 170Z" fill="' + P.A + '"' + ol + '/>';
    s += '<path d="M90 156L110 156L106 176L94 176Z" fill="' + P.J + '"' + ol + '/>' + hip + mir(hip) +
      '<path d="M78 144L122 144L124 157L76 157Z" fill="' + P.S + '"' + ol + '/>' +
      '<path d="M92 145L108 145L106.5 157L93.5 157Z" fill="' + P.O + '"' + th + '/>' +
      '<rect x="96" y="148.5" width="8" height="4.5" rx="2.2" fill="#6af3ff"/>';
    /* 목 */
    s += '<rect x="88" y="60" width="24" height="24" rx="4" fill="' + P.J + '"' + th + '/><path d="M91 68L109 68M91 74L109 74"' + ln + '/>';
    /* 가슴 */
    s += '<path d="M64 78L136 78L151 98L141 130L120 146L80 146L59 130L49 98Z" fill="' + P.A + '"' + ol + '/>' +
      '<path d="M84 128L116 128L114 146L86 146Z" fill="' + P.J + '"' + th + '/>' +
      '<path d="M87 133.5L113 133.5M88 139.5L112 139.5"' + ln + '/>' +
      '<path d="M74 78L126 78L119 88L81 88Z" fill="' + P.S + '"' + th + '/>';
    var pec = '<path d="M56 99L88 92.5L88 116L74 126L60.5 120Z" fill="' + P.A + '"' + th + '/>' +
      '<path d="M57.5 100.5L88 94L88 100L60 106Z" fill="' + P.O + '"' + th + '/>';
    s += pec + mir(pec) + '<path d="M63 110L70 122"' + hi + '/>';
    /* 가슴 코어 (육각) */
    s += '<path d="' + hexPts(100, 110, 15) + '" fill="' + P.S + '"' + ol + '/>' +
      '<g class="jv-core" fill="#5ff1ff"><circle cx="100" cy="110" r="13" filter="' + P.G2 + '" opacity=".9"/>' +
      '<path d="' + hexPts(100, 110, 10) + '" stroke="' + OL + '" stroke-opacity=".4" stroke-width="1"/>' +
      '<circle cx="100" cy="110.5" r="6.5" fill="' + P.W + '"/><path d="M100 100L108.7 105L100 110L91.3 105Z" fill="#fff" opacity=".45"/></g>';
    /* 어깨 받침 */
    var pad = '<path d="M64 82C54 74 36 76 30 90C26 100 30 112 40 116L58 110L68 94Z" fill="' + P.A + '"' + ol + '/>' +
      '<path d="M32.5 92C38 81.5 52 78.5 62.5 84L60.5 90C51 86 41.5 88 37.5 96.5Z" fill="' + P.O + '"' + th + '/>';
    /* 왼팔(보는 쪽 왼쪽): 주먹을 허리에 */
    s += '<path d="M38 106L54 110L44 141L28 135Z" fill="' + P.J + '"' + ol + '/>' +
      '<path d="M25 136L39 126L73 145L65 160Z" fill="' + P.A + '"' + ol + '/>' +
      '<path d="M33 133L66 151"' + ln + '/><path d="M29 134L39 128" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>' +
      '<circle cx="33" cy="137" r="8.5" fill="' + P.S + '"' + ol + '/><circle cx="33" cy="137" r="3" fill="' + P.J + '"/>' +
      '<rect x="64" y="142" width="20" height="19" rx="6" transform="rotate(28 74 151.5)" fill="' + P.J + '"' + ol + '/>' +
      '<path d="M69.5 145.5L80.5 151.5" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.6"/>';
    s += pad;
    /* 오른팔: 엄지 척 */
    s += '<path d="M146 106L162 102L181 130L167 138Z" fill="' + P.J + '"' + ol + '/>' +
      '<path d="M163 134L184 130L187 92L168 89Z" fill="' + P.A + '"' + ol + '/>' +
      '<path d="M169.5 95L185 97L184.4 105L169.3 103Z" fill="' + P.O + '"' + th + '/>' +
      '<path d="M170 110L169 128" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>' +
      '<circle cx="174" cy="134" r="8.5" fill="' + P.S + '"' + ol + '/><circle cx="174" cy="134" r="3" fill="' + P.J + '"/>' +
      '<rect x="162" y="50" width="11" height="25" rx="5.5" fill="' + P.J + '"' + ol + '/>' +
      '<rect x="164.3" y="52.5" width="6.4" height="7" rx="3" fill="' + P.S + '"/>' +
      '<rect x="163" y="67" width="27" height="25" rx="7.5" fill="' + P.J + '"' + ol + '/>' +
      '<path d="M170 74.5L186 74.5M170 80.5L186 80.5M170 86.5L186 86.5"' + ln + '/>' +
      '<path d="M166.5 72L166.5 86" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.8"/>';
    s += mir(pad);
    /* 머리 */
    s += '<g transform="translate(62.2 2) scale(.63)" stroke-width="3.6">' + jvHead(P, 3.6, false) + '</g>';
    return s;
  }

  function jarvis(opts) {
    opts = opts || {};
    var full = !!opts.full, c = new Ctx(), P = jvPal(c, full);
    var body = full ? jvBody(P) : jvHead(P, 2.4, true);
    return c.svg(full ? '0 0 200 300' : '0 0 120 120', 'jv' + (full ? ' jv-full' : '') + (opts.cls ? ' ' + opts.cls : ''), sz(opts), body, 2.4);
  }

  /* =========================================================
     2. 영역 문장 (육각 배지)
     ========================================================= */
  var AREAS = {
    speech: { color: '#ff7f61', name: '말하기' },
    motor: { color: '#1fb38f', name: '손놀이' },
    art: { color: '#9a74ff', name: '그리기' },
    mind: { color: '#f2a900', name: '생각놀이' },
    brain: { color: '#4b5bd6', name: '생각 힘' },
    feel: { color: '#ee5d92', name: '마음' },
    body: { color: '#3b9cf0', name: '몸놀이' },
    calm: { color: '#4caf6e', name: '쉬어가기' }
  };

  /* 그림 글자: f = 흰색(또는 그림자색), k = 안쪽 무늬 색 */
  var ICONS = {
    speech: function (f, k) {
      var w = ' fill="none" stroke="' + f + '" stroke-width="5"';
      return '<rect x="41" y="20" width="18" height="34" rx="9" fill="' + f + '"/>' +
        '<path d="M45.5 30L54.5 30M45.5 36.5L54.5 36.5M45.5 43L54.5 43" fill="none" stroke="' + k + '" stroke-width="2.4"/>' +
        '<path d="M34 43Q34 63 50 63Q66 63 66 43M50 63L50 73M40 74L60 74"' + w + '/>' +
        '<path d="M26 34Q21 44 26 54M74 34Q79 44 74 54"' + w.replace('5"', '4.6"') + '/>' +
        '<path d="M19.5 33Q14 44 19.5 55M80.5 33Q86 44 80.5 55"' + w.replace('5"', '4"') + ' opacity=".7"/>';
    },
    motor: function (f, k) {
      return '<path d="M30.5 50.5L38 44.5L45 55L39 61Z" fill="' + f + '"/>' +
        '<rect x="37" y="49" width="30" height="26" rx="7" fill="' + f + '"/>' +
        '<rect x="38.5" y="27" width="7" height="25" rx="3.5" fill="' + f + '"/><rect x="47.5" y="22" width="7" height="30" rx="3.5" fill="' + f + '"/>' +
        '<rect x="56.5" y="24" width="7" height="28" rx="3.5" fill="' + f + '"/><rect x="65" y="31" width="6.5" height="23" rx="3.2" fill="' + f + '"/>' +
        '<path d="M40 38L44 38M49 34L53 34M58 35.5L62 35.5M66.5 41.5L70 41.5" fill="none" stroke="' + k + '" stroke-width="2"/>' +
        '<rect x="41" y="74" width="22" height="8" rx="2.5" fill="' + f + '"/>' +
        '<path d="' + star(52, 62, 7, 4.6, 8, -90) + '" fill="' + k + '"/><circle cx="52" cy="62" r="2.4" fill="' + f + '"/>';
    },
    art: function (f, k) {
      return '<path d="M24 72C22 65 27 60 33 61C35 55 43 54 46 59C51 58 55 63 52 68C56 72 52 78 46 77C42 82 34 82 31 77C26 79 22 76 24 72Z" fill="' + f + '"/>' +
        '<circle cx="57" cy="76" r="3.4" fill="' + f + '"/><circle cx="21" cy="61" r="2.7" fill="' + f + '"/><circle cx="31" cy="54" r="2" fill="' + f + '"/>' +
        '<g transform="rotate(38 56 44)"><rect x="51.5" y="14" width="9" height="30" rx="4.5" fill="' + f + '"/>' +
        '<rect x="50" y="42" width="12" height="10" rx="2" fill="' + f + '"/><path d="M50.5 45.5L61.5 45.5M50.5 49L61.5 49" stroke="' + k + '" stroke-width="1.8"/>' +
        '<path d="M50.5 53L61.5 53Q63 64 56 74Q49 64 50.5 53Z" fill="' + f + '"/><path d="M56 56L56 67" stroke="' + k + '" stroke-width="1.8" opacity=".6"/></g>';
    },
    mind: function (f, k) {
      return '<path d="M27 38L40 38C38 31.5 41 26 47.5 26C54 26 57 31.5 55 38L68 38L68 50.5C74.5 48.5 80 51.5 80 58C80 64.5 74.5 67.5 68 65.5L68 78L55.5 78C57 72 53.5 68 47.5 68C41.5 68 38 72 39.5 78L27 78Z" fill="' + f + '"/>' +
        '<circle cx="47.5" cy="54" r="3.4" fill="' + k + '"/><path d="M33 44L33 52" stroke="' + k + '" stroke-width="2.4" opacity=".45"/>';
    },
    brain: function (f, k) {
      var c = ' fill="none" stroke="' + k + '" stroke-width="2.6"';
      return '<path d="M50 26C44 21.5 35.5 23.5 33.5 30C26.5 30 22.5 37 24.5 43C19.5 47 19.5 56 25.5 60C24.5 67 30.5 73 37.5 72C40.5 77 47 78.5 50 75C53 78.5 59.5 77 62.5 72C69.5 73 75.5 67 74.5 60C80.5 56 80.5 47 75.5 43C77.5 37 73.5 30 66.5 30C64.5 23.5 56 21.5 50 26Z" fill="' + f + '"/>' +
        '<path d="M50 28L50 73"' + c + '/>' +
        '<path d="M34 40L41 40L45 46M66 40L59 40L55 46M31 54L43 54M69 54L57 54M38 66L44 61M62 66L56 61"' + c + '/>' +
        '<circle cx="45" cy="46" r="2.6" fill="' + k + '"/><circle cx="55" cy="46" r="2.6" fill="' + k + '"/><circle cx="43" cy="54" r="2.6" fill="' + k + '"/>' +
        '<circle cx="57" cy="54" r="2.6" fill="' + k + '"/><circle cx="44" cy="61" r="2.6" fill="' + k + '"/><circle cx="56" cy="61" r="2.6" fill="' + k + '"/>';
    },
    feel: function (f, k) {
      return '<path d="M50 19L75 28L75 49C75 64 64.5 74.5 50 81C35.5 74.5 25 64 25 49L25 28Z" fill="' + f + '"/>' +
        '<path d="M50 63C40.5 56.5 36 51.5 36 45.5C36 40.5 39.8 37 44.2 37C47 37 49 38.6 50 40.6C51 38.6 53 37 55.8 37C60.2 37 64 40.5 64 45.5C64 51.5 59.5 56.5 50 63Z" fill="' + k + '"/>' +
        '<path d="M41 44C41 42 42.5 40.8 44.3 40.8" fill="none" stroke="' + f + '" stroke-width="2.2" opacity=".8"/>';
    },
    body: function (f, k) {
      var w = ' fill="none" stroke="' + f + '" stroke-width="7"';
      return '<path d="M20 44L31 44M17 53L29 53M21 62L30 62" fill="none" stroke="' + f + '" stroke-width="4" opacity=".7"/>' +
        '<circle cx="59" cy="25" r="7.5" fill="' + f + '"/>' +
        '<path d="M56 36L51 55M55.5 40L45 32M55.5 40L68 34.5M51 55L62 61L60.5 72M51 55L42 63L34 62"' + w + '/>';
    },
    calm: function (f, k) {
      return '<path d="M47.5 21A24 24 0 1 0 64.5 56A18 18 0 1 1 47.5 21Z" fill="' + f + '"/>' +
        '<path d="M54 79C53 64 61 53.5 79 51C80 66 71 78 54 79Z" fill="' + f + '"/>' +
        '<path d="M56 77C61 69 67 62 74.5 56" fill="none" stroke="' + k + '" stroke-width="2.4"/>' +
        '<path d="' + star(69, 27, 6, 1.8, 4, -90) + '" fill="' + f + '"/><path d="' + star(78, 39, 3.6, 1.1, 4, -90) + '" fill="' + f + '" opacity=".8"/>';
    },
    star: function (f, k) { return '<path d="' + star(50, 52, 26, 11.5) + '" fill="' + f + '" stroke="' + f + '" stroke-width="3"/>'; }
  };

  function areaIcon(key, opts) {
    opts = opts || {};
    var a = AREAS[key], col = opts.color || (a ? a.color : '#7b8aa6'), draw = ICONS[a ? key : 'star'];
    var c = new Ctx();
    var rim = c.lin('rm', [[0, lt(col, .72)], [.35, lt(col, .25)], [.6, col], [1, dk(col, .45)]], [.2, 0, .75, 1]);
    var face = c.rad('fc', [[0, lt(col, .32)], [.55, col], [1, dk(col, .32)]], [.38, .3, .78]);
    var gl = c.lin('gl', [[0, '#ffffff', .55], [1, '#ffffff', 0]]);
    var clip = c.add('cp', function (id) { return '<clipPath id="' + id + '"><path d="' + rhex(50, 50, 38.5, 8) + '"/></clipPath>'; });
    var shade = dk(col, .55);
    var s = '<path d="' + rhex(50, 53.5, 46, 10) + '" fill="' + dk(col, .5) + '"/>' +
      '<path d="' + rhex(50, 50, 46, 10) + '" fill="' + rim + '" stroke="' + dk(col, .55) + '" stroke-width="1.6"/>' +
      '<path d="' + rhex(50, 50, 39.5, 8.5) + '" fill="' + dk(col, .35) + '"/>' +
      '<path d="' + rhex(50, 50.8, 38.5, 8) + '" fill="' + face + '"/>' +
      '<g clip-path="url(#' + clip + ')"><path d="M0 0L100 0L100 33Q50 50 0 33Z" fill="' + gl + '"/></g>' +
      '<g transform="matrix(.9 0 0 .9 5 7.4)" opacity=".38">' + draw(shade, shade) + '</g>' +
      '<g transform="matrix(.9 0 0 .9 5 5.2)">' + draw('#ffffff', dk(col, .1)) + '</g>' +
      '<path d="' + star(29, 22, 5, 1.2, 4, -90) + '" fill="#fff" opacity=".9"/>';
    return c.svg('0 0 100 100', 'ga-area ga-' + (a ? key : 'x') + (opts.cls ? ' ' + opts.cls : ''), sz(opts), s);
  }

  /* =========================================================
     3. 모으는 로봇 6종 — 200×260 칸
     ========================================================= */
  var ROBOTS = [
    { id: 'racer', name: '썬더 레이서', color: '#e8352d', desc: '번개처럼 빠른 스포츠카 로봇' },
    { id: 'guard', name: '블루 가디언', color: '#2f6fe0', desc: '방패로 친구를 지키는 경찰 순찰 로봇' },
    { id: 'digger', name: '빅 버킷', color: '#f5b000', desc: '커다란 삽으로 척척 짓는 공사 로봇' },
    { id: 'sky', name: '스카이 윙', color: '#3fa6ff', desc: '구름 위를 슝 나는 제트기 로봇' },
    { id: 'rescue', name: '그린 레스큐', color: '#1fae5b', desc: '사다리와 물대포로 구해 주는 구조 로봇' },
    { id: 'nova', name: '스타 노바', color: '#8b5cf6', desc: '반짝이는 별에서 온 우주 로봇' }
  ];
  var PARTS = ['머리', '몸통', '왼팔', '오른팔', '다리', '특수 장비'];

  /* 부품 조각: 글자 = 꾸밈(없는 부품에선 빠짐), B() = 실루엣이 되는 큰 모양, {g, items} = 한 묶음 */
  function B(s) { return { b: s }; }
  function mirT(tf) { return mir('<g transform="' + tf + '">').slice(14, -2); }
  function mirItems(a) {
    return a.map(function (x) {
      return typeof x === 'string' ? mir(x) : x.items ? { g: mirT(x.g), items: mirItems(x.items) } : B(mir(x.b));
    });
  }
  function draw(items, owned) {
    return items.map(function (x) {
      if (typeof x === 'string') return owned ? x : '';
      if (x.items) return '<g transform="' + x.g + '">' + draw(x.items, owned) + '</g>';
      return owned ? x.b : x.b.replace(/\s(fill|stroke|stroke-width|stroke-opacity|stroke-dasharray|opacity|filter|fill-opacity)="[^"]*"/g, '');
    }).join('');
  }
  function part(items, i, owned, hl, tf) {
    var cls = 'part p' + i + (hl === i ? ' new-part' : '') + (owned ? '' : ' missing');
    return '<g class="' + cls + '"' + (tf ? ' transform="' + tf + '"' : '') + (owned ? '' : ' fill="#9aa7bd" opacity=".3"') + '>' + draw(items, owned) + '</g>';
  }

  function kit(c, R) {
    return {
      c: c, R: R,
      M: c.metal(R.m), X: c.metal(R.s), A: c.metal(R.a), S: c.silver(), J: c.joint(), GS: c.glass(), G: c.glow(1.8), W: c.shine(),
      ol: ' stroke="' + OL + '"',
      th: ' stroke="' + OL + '" stroke-width="1.2"',
      ln: ' fill="none" stroke="' + OL + '" stroke-opacity=".38" stroke-width="1.1"',
      hi: ' fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.8"'
    };
  }
  /* 빛나는 눈 한 쌍 (알약 모양) */
  function eyes(k, y, gap, w, h, col) {
    var s = '';
    [100 - gap, 100 + gap].forEach(function (x) {
      var r = '<rect x="' + n2(x - w / 2) + '" y="' + n2(y - h / 2) + '" width="' + w + '" height="' + h + '" rx="' + n2(h / 2) + '"';
      s += '<g fill="' + col + '">' + r + ' filter="' + k.G + '" opacity=".9"/>' + r + '/>' +
        '<ellipse cx="' + x + '" cy="' + n2(y + h * .1) + '" rx="' + n2(w * .32) + '" ry="' + n2(h * .3) + '" fill="' + k.W + '"/>' +
        '<circle cx="' + n2(x - w * .24) + '" cy="' + n2(y - h * .16) + '" r="' + n2(h * .2) + '" fill="#fff"/></g>';
    });
    return s;
  }
  function glint(x, y, r) { return '<path d="' + star(x, y, r, r * .25, 4, -90) + '" fill="#fff" opacity=".9"/>'; }
  function wheel(k, cx, cy, r, rim, hub) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#1b2031"' + k.ol + '/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + n2(r - 2.3) + '" fill="none" stroke="#454f6c" stroke-width="2.4" stroke-dasharray="2.2 2.2"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + n2(r * .58) + '" fill="' + rim + '"' + k.th + '/>' +
      '<path d="' + star(cx, cy, r * .5, r * .2, 5) + '" fill="' + OL + '" opacity=".38"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + n2(r * .2) + '" fill="' + hub + '"' + k.th + '/>' +
      '<path d="M' + n2(cx - r * .72) + ' ' + n2(cy - r * .3) + 'A' + n2(r * .78) + ' ' + n2(r * .78) + ' 0 0 1 ' + n2(cx - r * .3) + ' ' + n2(cy - r * .72) + '" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>';
  }

  /* --- 공통 몸통 --- */
  function torso(k) {
    var R = k.R;
    return [
      B('<rect x="89" y="54" width="22" height="16" rx="3" fill="' + k.J + '"' + k.th + '/>'),
      B('<path d="M66 66L134 66L147 82L139 116L122 128L78 128L61 116L53 82Z" fill="' + (R.chestFill ? R.chestFill(k) : k.M) + '"' + k.ol + '/>'),
      B('<path d="M82 124L118 124L116 140L84 140Z" fill="' + k.J + '"' + k.ol + '/>'),
      '<path d="M86 130L114 130M87 135L113 135"' + k.ln + '/>',
      B('<path d="M70 138L130 138L126 152L110 160L90 160L74 152Z" fill="' + (R.pelvis ? R.pelvis(k) : k.X) + '"' + k.ol + '/>'),
      '<path d="M93 141L107 141L105.5 151L94.5 151Z" fill="' + k.A + '"' + k.th + '/>',
      '<path d="M59 84C61 76 64.5 71 70 68.5"' + k.hi + '/>'
    ].concat(R.chest(k));
  }
  /* --- 공통 팔 (보는 쪽 왼쪽; 오른팔은 거울) --- */
  function arm(k) {
    var R = k.R, f = R.fist ? R.fist(k) : k.J;
    var a = [
      B('<path d="M46 88L62 88L59 114L45 114Z" fill="' + k.J + '"' + k.ol + '/>'),
      B('<path d="M39.5 118L63 116L61.5 143L42 145Z" fill="' + k.M + '"' + k.ol + '/>'),
      '<path d="M43 122L42.5 139"' + k.hi + '/>',
      '<path d="M46 125L59 124"' + k.ln + '/>',
      B('<circle cx="52" cy="116" r="6.5" fill="' + k.S + '"' + k.ol + '/>'),
      B('<rect x="40" y="141" width="22" height="18" rx="6" fill="' + f + '"' + k.ol + '/>'),
      '<path d="M44.5 147L57.5 147M44.5 152L57.5 152"' + k.ln + '/>'
    ];
    return a.concat(R.shoulder(k));
  }
  function stdPad(k, fill) {
    return B('<path d="M70 70C62 61 45 61 39 72C35 80 37 90 45 94L64 92L72 82Z" fill="' + (fill || k.M) + '"' + k.ol + '/>');
  }
  /* --- 공통 다리 --- */
  function legs(k) {
    var R = k.R, lg = R.leg ? R.leg(k) : { pre: [], post: [] };
    var one = (lg.pre || []).concat([
      B('<rect x="70" y="150" width="18" height="38" rx="5" fill="' + k.J + '"' + k.ol + '/>'),
      B('<path d="M68.5 160L89.5 159L88 181L71 182.5Z" fill="' + (R.thigh ? R.thigh(k) : k.M) + '"' + k.ol + '/>'),
      '<path d="M71.5 163L71.8 177"' + k.hi + '/>',
      B('<path d="M64 196L94 196L96 228L90 238L70 238L62 228Z" fill="' + (R.shin ? R.shin(k) : k.M) + '"' + k.ol + '/>'),
      '<path d="M65.5 200L65.5 226"' + k.hi + '/>',
      B('<path d="M65 184L91 184L92 196L78 202L64 196Z" fill="' + (R.knee ? R.knee(k) : k.S) + '"' + k.ol + '/>'),
      B('<path d="M58 236L94 236L97 250L96 254L52 254C52 246 54 240 58 236Z" fill="' + (R.foot ? R.foot(k) : k.J) + '"' + k.ol + '/>'),
      '<path d="M56 248L94 248"' + k.ln + '/>'
    ], lg.post || []);
    var left = [{ g: 'rotate(3 79 152)', items: one }];
    return left.concat(mirItems(left));
  }

  /* --- 로봇별 모양 --- */
  var RS = [
    /* 0 썬더 레이서 — 빨간 스포츠카 */
    {
      m: '#e8352d', s: '#2b3045', a: '#ffc81e', e: '#fff3a0',
      head: function (k) {
        /* 옆 거울 귀 + 지붕 공기 흡입구 + 노란 줄무늬 */
        var mr = '<path d="M75 38L68 34L69 31L76 35Z" fill="' + k.J + '"' + k.th + '/><path d="M58 25L70 23.5C72 23.3 73 24.5 72.6 26.4L71 33.5C70.6 35.3 69.4 36 67.6 36L59 36C57.2 36 56 34.8 56.2 33L57 27Z" fill="' + k.M + '"' + k.ol + '/>' +
          '<path d="M59.5 27L69.6 25.8L68.4 33.4L59 33.6Z" fill="' + k.S + '"/><path d="M61 31.5L66 27.2" fill="none" stroke="#fff" stroke-width="1.2"/>';
        return [
          B(mr), B(mir(mr)),
          B('<path d="M92 16L108 16L106 6.5Q100 4.5 94 6.5Z" fill="' + k.M + '"' + k.ol + '/>'),
          '<path d="M96 8.5L104 8.5L104.4 13L95.6 13Z" fill="' + k.J + '"/>',
          B('<path d="M100 14C115 14 125 22 126 36L125 50C123 58 113 63 100 63C87 63 77 58 75 50L74 36C75 22 85 14 100 14Z" fill="' + k.M + '"' + k.ol + '/>'),
          '<path d="M96 14.3L104 14.3L103.4 31L96.6 31Z" fill="' + k.A + '"' + k.th + '/>',
          '<path d="M78 32C79 24 84 19 90 17"' + k.hi + '/>',
          '<path d="M78 33Q100 29 122 33L119.5 46.5Q100 49.5 80.5 46.5Z" fill="' + k.GS + '"' + k.ol + '/>',
          eyes(k, 40, 11, 13, 7, k.R.e),
          '<path d="M84 49.5L116 49.5L112.5 59C108 61.5 92 61.5 87.5 59Z" fill="' + k.S + '"' + k.th + '/>',
          '<path d="M93.5 53Q100 57.5 106.5 53" fill="none" stroke="' + OL + '" stroke-width="1.7"/>',
          '<path d="M86.5 52.5L90 52.5M87.5 55.5L90.5 55.5M113.5 52.5L110 52.5M112.5 55.5L109.5 55.5"' + k.ln + '/>'
        ];
      },
      chest: function (k) {
        var hl = '<path d="M60 95L80 97.5L78.5 106L62 103.5Z" fill="' + k.c.rad('hl', [[0, '#ffffff'], [.5, '#fff6c2'], [1, '#ffc81e']], [.4, .4, .7]) + '"' + k.th + '/>';
        return [
          '<path d="M75 69L125 69L119 90L81 90Z" fill="' + k.GS + '"' + k.th + '/>',
          '<path d="M80 71L90 71L84 88L80.5 88Z" fill="#fff" opacity=".18"/>',
          '<path d="M60 100L78 102" stroke="#fff6b0" stroke-width="5" opacity=".6" filter="' + k.G + '"/>',
          hl, mir(hl),
          '<path d="M102.5 92L94 105L99.5 105L96.5 115L106.5 100L101 100L104.5 92Z" fill="' + k.A + '"' + k.th + '/>',
          '<path d="M86 108L90 120M114 108L110 120"' + k.ln + '/>'
        ];
      },
      shoulder: function (k) {
        return [stdPad(k),
          '<path d="M42 78C46 70 56 67 66 70L65 75C56 73 49 75 45.5 81Z" fill="' + k.A + '"' + k.th + '/>',
          '<path d="M47 84L61 84L60 90L48 90Z" fill="' + k.J + '"' + k.th + '/>',
          '<path d="M49.5 86.5L58 86.5"' + k.ln + '/>'];
      },
      leg: function (k) {
        return { pre: [B(wheel(k, 60, 213, 12, k.M, k.A))], post: ['<path d="M80 206L91 206L89.5 222L82 224Z" fill="' + k.A + '"' + k.th + '/>'] };
      },
      gear: function (k) {
        /* 등에 단 스포일러 날개 (가운데가 갈라진 V) + 끝판 */
        var bl = '<path d="M84 60L22 38L19 48L82 72Z" fill="' + k.M + '"' + k.ol + '/>';
        var dt = '<path d="M80 63L24 43L23.2 45.6L79.5 66Z" fill="' + k.R.a + '"/>' +
          '<path d="M76 58.5L24 40" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="1.4"/>';
        var ep = '<path d="M12 28L24 31L24 58L12 55Z" fill="' + k.X + '"' + k.ol + '/>';
        return [B(bl), B(mir(bl)), dt, mir(dt), B(ep), B(mir(ep)),
          '<path d="M14 31L22 33" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.4"/>'];
      }
    },
    /* 1 블루 가디언 — 경찰 순찰 */
    {
      m: '#2f6fe0', s: '#eef3fa', a: '#ffcf3a', e: '#7af5ff', front: true,
      head: function (k) {
        var ear = '<circle cx="72" cy="44" r="5.5" fill="' + k.X + '"' + k.ol + '/><circle cx="72" cy="44" r="2.4" fill="#4fd8ff"/>';
        return [
          B('<path d="M84 13L116 13L118 21L82 21Z" fill="' + k.J + '"' + k.ol + '/>'),
          B('<rect x="82" y="4.5" width="36" height="10.5" rx="5" fill="' + k.J + '"' + k.ol + '/>'),
          '<rect x="84" y="6.3" width="15" height="7" rx="3.5" fill="#ff4058"/><rect x="101" y="6.3" width="15" height="7" rx="3.5" fill="#3d8bff"/>',
          '<ellipse cx="91" cy="9.8" rx="9" ry="6" fill="#ff4058" opacity=".7" filter="' + k.G + '"/><ellipse cx="109" cy="9.8" rx="9" ry="6" fill="#3d8bff" opacity=".7" filter="' + k.G + '"/>',
          '<path d="M86 8L93 8M103 8L110 8" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.5"/>',
          B(ear), B(mir(ear)),
          B('<path d="M77 20L123 20C127 20 129 23 129 27L127 50C125 58 115 63 100 63C85 63 75 58 73 50L71 27C71 23 73 20 77 20Z" fill="' + k.M + '"' + k.ol + '/>'),
          '<path d="M75.5 30C76 25 78 23 82 22.5"' + k.hi + '/>',
          '<path d="M71 27.5L129 27.5L126.5 35L73.5 35Z" fill="' + k.J + '"' + k.th + '/>',
          '<path d="M74 29.5L126 29.5" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.2"/>',
          '<path d="' + star(100, 31.3, 5.2, 2.3) + '" fill="' + k.A + '" stroke="' + OL + '" stroke-width=".8"/>',
          '<path d="M77 36.5L123 36.5L121 46Q100 49.5 79 46Z" fill="' + k.GS + '"' + k.th + '/>',
          eyes(k, 41.3, 11, 12, 6.6, k.R.e),
          '<path d="M80 47.5L120 47.5L116 58C110 61.5 90 61.5 84 58Z" fill="' + k.X + '"' + k.th + '/>',
          '<path d="M94 53Q100 56 106 53" fill="none" stroke="' + OL + '" stroke-width="1.6"/>'
        ];
      },
      chest: function (k) {
        return [
          '<path d="M66.5 67L133.5 67L141 77L59 77Z" fill="' + k.X + '"' + k.th + '/>',
          '<path d="M58 92L68 89L67 112L62 109Z" fill="' + k.X + '"' + k.th + '/>', mir('<path d="M58 92L68 89L67 112L62 109Z" fill="' + k.X + '"' + k.th + '/>'),
          '<path d="M100 84L114.5 89L113.5 103C112.5 111 107 116 100 119C93 116 87.5 111 86.5 103L85.5 89Z" fill="' + k.A + '"' + k.ol + '/>',
          '<path d="' + star(100, 100.5, 7.4, 3.2) + '" fill="' + k.M + '" stroke="' + OL + '" stroke-width=".8"/>',
          '<path d="M89 90.5L99 87.3" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/>',
          '<rect x="73" y="114" width="9" height="4" rx="2" fill="#4fd8ff"/><rect x="118" y="114" width="9" height="4" rx="2" fill="#4fd8ff"/>'
        ];
      },
      shoulder: function (k) {
        return [B(wheel(k, 53, 77, 15, k.S, k.M)),
          B('<path d="M36 70C40 58 66 58 70 70L70 73L36 73Z" fill="' + k.M + '"' + k.ol + '/>'),
          '<path d="M40 68C43 63 50 61 56 61"' + k.hi + '/>'];
      },
      leg: function (k) {
        return { post: ['<path d="M68 204L74 204L73 228L68.5 226Z" fill="' + k.X + '"' + k.th + '/>', '<rect x="80" y="214" width="9" height="4" rx="2" fill="#4fd8ff"/>'] };
      },
      knee: function (k) { return k.X; },
      gear: function (k) {
        var bd = 'M42 96L68 104L66 133C64 150 55 160 42 167C29 160 20 150 18 133L16 104Z';
        return [
          B('<path d="' + bd + '" fill="' + k.S + '"' + k.ol + '/>'),
          '<path d="M42 102.5L62.5 109L61 133C59.5 147 52 155 42 160.5C32 155 24.5 147 23 133L21.5 109Z" fill="' + k.M + '"' + k.th + '/>',
          '<path d="M23.5 118L60.5 118L60 125L24 125Z" fill="' + k.X + '"/>',
          '<path d="M42 113L52 116.5L51.3 126C50.6 131.5 47 135 42 137C37 135 33.4 131.5 32.7 126L32 116.5Z" fill="' + k.A + '"' + k.th + '/>',
          '<path d="' + star(42, 125.5, 5, 2.2) + '" fill="' + k.M + '"/>',
          '<path d="M24.5 108L40 103" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>',
          '<path d="M25 132C26 142 31 150 38 155"' + k.hi + '/>',
          '<rect x="38" y="143" width="8" height="5" rx="2.5" fill="#ff4058"/>'
        ];
      }
    },
    /* 2 빅 버킷 — 노란 굴착기 */
    {
      m: '#f6b500', s: '#2b3045', a: '#ff8a1c', e: '#ffb347', front: true,
      head: function (k) {
        return [
          B('<path d="M93.5 11Q93.5 2 100 2Q106.5 2 106.5 11Z" fill="#ff9a1f"' + k.th + '/>'),
          '<ellipse cx="100" cy="7" rx="9" ry="6" fill="#ffae35" opacity=".75" filter="' + k.G + '"/>',
          '<path d="M96.5 5.5Q98 3.8 100 3.6" fill="none" stroke="#fff" stroke-width="1.3"/>',
          B('<path d="M76 34L124 34L124 55C124 60 120 63 115 63L85 63C80 63 76 60 76 55Z" fill="' + k.J + '"' + k.ol + '/>'),
          B('<path d="M74 30C74 17 86 9.5 100 9.5C114 9.5 126 17 126 30Z" fill="' + k.M + '"' + k.ol + '/>'),
          '<path d="M95 10L105 10L106 30L94 30Z" fill="' + k.M + '"' + k.th + '/>',
          '<path d="M79 25C80 18 85 14 91 12.5"' + k.hi + '/>',
          B('<path d="M64 28.5L136 28.5C138.5 28.5 139.5 31 138 33L136 36.5L64 36.5L62 33C60.5 31 61.5 28.5 64 28.5Z" fill="' + k.M + '"' + k.ol + '/>'),
          '<path d="M66 30.6L134 30.6" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.3"/>',
          '<rect x="80" y="38.5" width="40" height="13" rx="3" fill="' + k.GS + '"' + k.th + '/>',
          '<path d="M83 40L90 40L85 50L82 50Z" fill="#fff" opacity=".15"/>',
          eyes(k, 45, 10, 11, 6, k.R.e),
          '<path d="M85 54L115 54L113 60.5L87 60.5Z" fill="' + k.S + '"' + k.th + '/>',
          '<path d="M88 57.3L112 57.3"' + k.ln + '/>',
          '<circle cx="79.5" cy="58.5" r="1.6" fill="' + k.S + '"/><circle cx="120.5" cy="58.5" r="1.6" fill="' + k.S + '"/>'
        ];
      },
      chest: function (k) {
        var bolt = '<circle cx="64" cy="86" r="2.2" fill="' + k.S + '"' + k.th + '/>';
        return [
          '<rect x="78" y="70" width="44" height="25" rx="4" fill="' + k.J + '"' + k.th + '/>',
          '<rect x="81" y="73" width="38" height="19" rx="2.5" fill="' + k.GS + '"/>',
          '<path d="M84 74L94 74L87 91L84 91Z" fill="#fff" opacity=".16"/>',
          '<path d="M100 74L100 91" stroke="' + k.J + '" stroke-width="2"/>',
          '<path d="M60 102L140 102L136.5 116L63.5 116Z" fill="' + k.c.hazard() + '"' + k.th + '/>',
          bolt, mir(bolt), '<circle cx="82" cy="121" r="1.8" fill="' + k.S + '"/><circle cx="118" cy="121" r="1.8" fill="' + k.S + '"/>'
        ];
      },
      shoulder: function (k) {
        return [
          B('<path d="M37 66L71 66L73 92L40 95Z" fill="' + k.M + '"' + k.ol + '/>'),
          '<path d="M37.5 66.5L70.5 66.5L71 73L38 73Z" fill="' + k.c.hazard() + '"' + k.th + '/>',
          '<path d="M41 77L41.8 91"' + k.hi + '/>',
          '<circle cx="46" cy="88" r="1.8" fill="' + k.S + '"/><circle cx="66" cy="87" r="1.8" fill="' + k.S + '"/>'
        ];
      },
      leg: function (k) {
        var t = '<rect x="53" y="190" width="15" height="52" rx="7.5" fill="#1d2132"' + k.ol + '/>' +
          '<path d="M55 197L66 197M55 203L66 203M55 209L66 209M55 215L66 215M55 221L66 221M55 227L66 227M55 233L66 233" fill="none" stroke="#5a6480" stroke-width="2"/>' +
          '<circle cx="60.5" cy="198" r="3.2" fill="' + k.S + '"/><circle cx="60.5" cy="234" r="3.2" fill="' + k.S + '"/>';
        return { pre: [B(t)], post: ['<path d="M66 208L93 208L94 216L65.5 216Z" fill="' + k.c.hazard() + '"' + k.th + '/>'] };
      },
      foot: function (k) { return k.M; },
      gear: function (k) {
        return [
          B('<path d="M146 146L165 136L191 186L174 195Z" fill="' + k.M + '"' + k.ol + '/>'),
          '<path d="M149.5 146.5L175 191"' + k.hi + '/>',
          '<path d="M164 146L186 186" fill="none" stroke="' + OL + '" stroke-width="7"/><path d="M164 146L176 168" fill="none" stroke="#4a5470" stroke-width="4.6"/><path d="M176 168L186 186" fill="none" stroke="#e7edf6" stroke-width="2.6"/>',
          '<path d="M150 158L162 152L166 160L154 166Z" fill="' + k.c.hazard() + '"' + k.th + '/>',
          B('<path d="M163 189L197 183L196 213C191 227 172 229 164 219Z" fill="' + k.J + '"' + k.ol + '/>'),
          '<path d="M164 191L196.3 185.3L196.1 192L164.2 197.6Z" fill="' + k.c.hazard() + '"/>',
          '<path d="M168 205C172 214 182 217 191 212" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.8"/>',
          B('<path d="M165 219L168 231L173 222.5L177.5 233L182 223.5L187 231.5L190 219.5Z" fill="' + k.S + '"' + k.th + '/>'),
          B('<circle cx="184" cy="189" r="6.5" fill="' + k.S + '"' + k.ol + '/>'),
          '<circle cx="184" cy="189" r="2.2" fill="' + k.J + '"/>'
        ];
      }
    },
    /* 3 스카이 윙 — 하얀 제트기 */
    {
      m: '#f2f6fc', s: '#3fa6ff', a: '#ff7a3d', e: '#8ff6ff',
      head: function (k) {
        var fin = '<path d="M81 34L64 9L71.5 8L88 28Z" fill="' + k.X + '"' + k.ol + '/>';
        var tip = '<path d="M64 9L71.5 8L74.6 11.8L66.6 13Z" fill="' + k.A + '"/>';
        return [
          B(fin), B(mir(fin)), tip, mir(tip),
          B('<path d="M100 16C116 16 125 26 125 40C125 54 114 63 100 63C86 63 75 54 75 40C75 26 84 16 100 16Z" fill="' + k.M + '"' + k.ol + '/>'),
          B('<path d="M95.5 30L100 2.5L104.5 30Z" fill="' + k.X + '"' + k.ol + '/>'),
          '<path d="M98.6 8L97.6 26" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/>',
          '<path d="M79 33C80 25 85 20 91 18.5"' + k.hi + '/>',
          '<path d="M80 34C86 28.5 114 28.5 120 34L118 46.5C110 50.5 90 50.5 82 46.5Z" fill="' + k.c.lin('cg', [[0, '#9fe2ff'], [.45, '#2a83d6'], [1, '#0d3d82']]) + '"' + k.ol + '/>',
          '<path d="M84 34C88 31.5 93 30.8 97 30.8L90 47.5L84.5 46Z" fill="#fff" opacity=".28"/>',
          eyes(k, 40.2, 10.5, 11.5, 6.4, '#ffffff'),
          '<path d="M77.5 48L86 50.5L85 55L78.5 52.5Z" fill="' + k.X + '"/>', mir('<path d="M77.5 48L86 50.5L85 55L78.5 52.5Z" fill="' + k.X + '"/>'),
          '<path d="M95 56.5L105 56.5" fill="none" stroke="' + OL + '" stroke-width="1.6"/>'
        ];
      },
      chest: function (k) {
        var intake = '<path d="M57.5 86L68 83L68 101L61 101Z" fill="' + k.J + '"' + k.th + '/>';
        return [
          '<path d="M100 69C112 69 118 79 118 90C118 99 110 105 100 105C90 105 82 99 82 90C82 79 88 69 100 69Z" fill="' + k.c.lin('cg', [[0, '#9fe2ff'], [.45, '#2a83d6'], [1, '#0d3d82']]) + '"' + k.ol + '/>',
          '<path d="M88 76C91 72.5 95 71 99 71L91 98C87 96 85 92 85 88Z" fill="#fff" opacity=".3"/>',
          '<path d="M72 107L100 120L128 107L128 114L100 127L72 114Z" fill="' + k.X + '"' + k.th + '/>',
          intake, mir(intake),
          '<path d="M60 90L66 89M60 95L66 94" fill="none" stroke="#6a7591" stroke-width="1.2"/>'
        ];
      },
      shoulder: function (k) {
        return [
          B('<path d="M46 72L38 50L45 51L56 69Z" fill="' + k.X + '"' + k.ol + '/>'),
          '<path d="M38 50L45 51L46.8 55L39.6 54.5Z" fill="' + k.A + '"/>',
          stdPad(k),
          '<path d="M41 80C44 72 52 68 62 69L61.5 74C54 73.5 48 76 44.5 83Z" fill="' + k.X + '"' + k.th + '/>'
        ];
      },
      shin: function (k) { return k.M; },
      leg: function (k) {
        return {
          pre: [B('<path d="M62 214L54 216L54 234L63 234Z" fill="' + k.S + '"' + k.ol + '/>'),
            '<ellipse cx="54" cy="236" rx="5" ry="3" fill="#6ff3ff" opacity=".9" filter="' + k.G + '"/>'],
          post: ['<path d="M70 204L90 204L88 214L72 214Z" fill="' + k.X + '"' + k.th + '/>', '<path d="M74 222L86 222L84 230L76 230Z" fill="' + k.A + '"' + k.th + '/>']
        };
      },
      foot: function (k) { return k.X; },
      gear: function (k) {
        /* 위로 젖힌 큰 날개 + 파란 앞전 + 주황 날개 끝 + 작은 엔진 */
        var w = '<path d="M74 74L16 22L3 24L10 44L34 92L66 108Z" fill="' + k.M + '"' + k.ol + '/>';
        var d = '<path d="M16 22L3 24L6.5 34L19 30Z" fill="' + k.A + '"/>' +
          '<path d="M22 32L70 78" fill="none" stroke="' + k.R.s + '" stroke-width="5"/>' +
          '<path d="M12 30L22 54M18 50L50 92"' + k.ln + '/>' +
          '<path d="M9 28L60 76"' + k.hi + '/>' +
          '<path d="M30 74L36 64L44 70L38 80Z" fill="' + k.X + '"' + k.th + '/>';
        return [B(w), B(mir(w)), d, mir(d)];
      }
    },
    /* 4 그린 레스큐 — 구조대 */
    {
      m: '#1fae5b', s: '#eef3fa', a: '#ffd23a', e: '#fff3a0',
      head: function (k) {
        return [
          B('<path d="M78 36L122 36L120 55C118 61 110 63.5 100 63.5C90 63.5 82 61 80 55Z" fill="' + k.X + '"' + k.ol + '/>'),
          B('<path d="M76 31C76 16.5 88 9 100 9C112 9 124 16.5 124 31L131 34C132.5 37 130.5 39.5 127 39.5L73 39.5C69.5 39.5 67.5 37 69 34Z" fill="' + k.M + '"' + k.ol + '/>'),
          '<path d="M75.6 27.5L124.4 27.5L124.6 31.5L75.4 31.5Z" fill="' + k.A + '"/>',
          '<path d="M80 25C81 18 86 13.5 92 12"' + k.hi + '/>',
          '<path d="M93 12L107 12L108 24.5L100 30.5L92 24.5Z" fill="' + k.A + '"' + k.th + '/>',
          '<path d="M100 15.5C102.5 18.5 104 20.5 104 23C104 25.3 102.2 27 100 27C97.8 27 96 25.3 96 23C96 20.5 97.5 18.5 100 15.5Z" fill="#2f8fff"/>',
          '<path d="M80 41L120 41L118.5 49Q100 52 81.5 49Z" fill="' + k.GS + '"' + k.th + '/>',
          eyes(k, 45.2, 10.5, 11, 5.6, k.R.e),
          '<path d="M90 51.5L110 51.5L108 59C104 61.5 96 61.5 92 59Z" fill="' + k.J + '"' + k.th + '/>',
          '<circle cx="95" cy="55.5" r="1.5" fill="' + k.S + '"/><circle cx="100" cy="56.3" r="1.5" fill="' + k.S + '"/><circle cx="105" cy="55.5" r="1.5" fill="' + k.S + '"/>'
        ];
      },
      chest: function (k) {
        return [
          '<path d="M56 89L144 89L142 98L58 98Z" fill="' + k.A + '"' + k.th + '/>',
          '<path d="M57 92.5L143 92.5L142.6 94.5L57.4 94.5Z" fill="' + k.S + '"/>',
          '<path d="M62 108L138 108L135 116L65 116Z" fill="' + k.A + '"' + k.th + '/>',
          '<path d="M63 111L137 111L136.4 113L63.6 113Z" fill="' + k.S + '"/>',
          '<circle cx="100" cy="77" r="8" fill="' + k.X + '"' + k.th + '/>',
          '<path d="M97.8 71.5L102.2 71.5L102.2 74.8L105.5 74.8L105.5 79.2L102.2 79.2L102.2 82.5L97.8 82.5L97.8 79.2L94.5 79.2L94.5 74.8L97.8 74.8Z" fill="' + k.M + '"/>'
        ];
      },
      shoulder: function (k) {
        return [
          '<rect x="49" y="58" width="13" height="7" rx="3.5" fill="#ff8a1c"' + k.th + '/>',
          '<ellipse cx="55.5" cy="60" rx="9" ry="5" fill="#ffa53a" opacity=".7" filter="' + k.G + '"/>',
          stdPad(k),
          '<path d="M38.5 82L71.5 79L71.8 84L40.5 87.5Z" fill="' + k.A + '"/>'
        ];
      },
      leg: function (k) {
        return { pre: [B(wheel(k, 58, 212, 13.5, k.S, k.M))], post: ['<path d="M64.5 214L95.5 214L95.8 220L64.2 220Z" fill="' + k.A + '"/>'] };
      },
      gear: function (k) {
        var rung = '';
        for (var y = 30; y <= 96; y += 11) rung += 'M35 ' + (y - 1.6) + 'L47 ' + (y - 1.6) + 'L47 ' + (y + 1.6) + 'L35 ' + (y + 1.6) + 'Z';
        return [{ g: 'rotate(-14 55 100)', items: [
          B('<path d="M29 19L35 19L35 106L29 106ZM47 19L53 19L53 106L47 106Z' + rung + '" fill="' + k.S + '"' + k.th + '/>'),
          '<path d="M30.5 23L30.5 100" fill="none" stroke="#fff" stroke-width="1.4"/>',
          B('<path d="M25 12L57 12L55 21L27 21Z" fill="' + k.A + '"' + k.ol + '/>'),
          B('<path d="M34 2L48 2L46.5 13L35.5 13Z" fill="' + k.c.metal('#e0b44a') + '"' + k.ol + '/>'),
          '<path d="M36 4.5L46 4.5" stroke="#fff" stroke-opacity=".6" stroke-width="1.2"/>'
        ] }];
      }
    },
    /* 5 스타 노바 — 보라 우주 */
    {
      m: '#8b5cf6', s: '#2d2456', a: '#ffd84a', e: '#ffe8a0',
      head: function (k) {
        var ant = '<path d="M86.5 18L76 7L78.4 5.4L89 16Z" fill="' + k.S + '"' + k.th + '/>';
        var st = '<path d="' + star(76.5, 8, 6.4, 2.7) + '" fill="' + k.A + '"' + k.th + '/>';
        return [
          B(ant), B(mir(ant)),
          '<circle cx="76.5" cy="8" r="7" fill="#ffe36a" opacity=".7" filter="' + k.G + '"/><circle cx="123.5" cy="8" r="7" fill="#ffe36a" opacity=".7" filter="' + k.G + '"/>',
          B(st), B(mir(st)),
          B('<ellipse cx="100" cy="60" rx="22" ry="6" fill="' + k.X + '"' + k.ol + '/>'),
          B('<path d="M100 20C113 20 120 29 120 40C120 51 112 58 100 58C88 58 80 51 80 40C80 29 87 20 100 20Z" fill="' + k.M + '"' + k.ol + '/>'),
          '<path d="M85 33Q100 28 115 33L114 47Q100 52 86 47Z" fill="#170f3a"' + k.th + '/>',
          '<circle cx="93" cy="39.5" r="5" fill="' + k.R.e + '" filter="' + k.G + '" opacity=".9"/><circle cx="107" cy="39.5" r="5" fill="' + k.R.e + '" filter="' + k.G + '" opacity=".9"/>',
          '<circle cx="93" cy="39.5" r="4" fill="' + k.R.e + '"/><circle cx="107" cy="39.5" r="4" fill="' + k.R.e + '"/>',
          '<circle cx="91.6" cy="38" r="1.5" fill="#fff"/><circle cx="105.6" cy="38" r="1.5" fill="#fff"/>',
          '<path d="M96 45.5Q100 48 104 45.5" fill="none" stroke="#ff9cf0" stroke-width="1.6"/>',
          '<circle cx="85" cy="50" r="2.4" fill="#ff8fd8" opacity=".55"/><circle cx="115" cy="50" r="2.4" fill="#ff8fd8" opacity=".55"/>',
          B('<circle cx="100" cy="38" r="26" fill="' + k.c.rad('bb', [[0, '#ffffff', 0], [.72, '#d9c8ff', .08], [1, '#e9dcff', .5]], [.5, .5, .5]) + '" stroke="#c9b3ff" stroke-width="1.6"/>'),
          '<path d="M80 28C83 19 91 14 100 13" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="2.6"/>',
          '<circle cx="117" cy="51" r="1.6" fill="#fff" opacity=".7"/>'
        ];
      },
      chest: function (k) {
        return [
          '<path d="M66 70L60 86M134 70L140 86" fill="none" stroke="#ff9cf0" stroke-width="2" opacity=".8"/>',
          '<circle cx="100" cy="97" r="19" fill="#ffe36a" opacity=".45" filter="' + k.G + '"/>',
          '<path d="' + star(100, 97, 18, 7.6) + '" fill="' + k.A + '"' + k.ol + '/>',
          '<path d="' + star(100, 97, 9, 3.8) + '" fill="#fff8d0"/>',
          '<path d="M72 78L80 86L74 98M128 78L120 86L126 98" fill="none" stroke="#e7dbff" stroke-opacity=".7" stroke-width="1"/>',
          '<circle cx="72" cy="78" r="1.8" fill="#fff"/><circle cx="80" cy="86" r="1.5" fill="#fff"/><circle cx="74" cy="98" r="1.8" fill="#fff"/>',
          '<circle cx="128" cy="78" r="1.8" fill="#fff"/><circle cx="120" cy="86" r="1.5" fill="#fff"/><circle cx="126" cy="98" r="1.8" fill="#fff"/>'
        ];
      },
      shoulder: function (k) {
        return [
          B('<path d="M48 70L30 46L56 64Z" fill="' + k.c.lin('cr', [[0, '#ffe2ff'], [.5, '#d58bff'], [1, '#7a3fe0']], [0, 0, 1, 1]) + '"' + k.ol + '/>'),
          stdPad(k),
          '<path d="M41 85C46 89 56 91 66 89" fill="none" stroke="#ff9cf0" stroke-width="2" opacity=".85"/>'
        ];
      },
      leg: function (k) {
        return { post: ['<path d="M58 235L94 235" stroke="#ff8fe8" stroke-width="3" filter="' + k.G + '"/>', '<path d="M58 235L94 235" stroke="#ffd2f6" stroke-width="1.6"/>', '<path d="' + star(79, 215, 5.5, 2.3) + '" fill="' + k.A + '"/>'] };
      },
      foot: function (k) { return k.X; },
      gear: function (k) {
        var cr = k.c.lin('cr2', [[0, '#ffe9ff', .95], [.45, '#c58cff', .9], [1, '#5b2bc8', .85]], [0, 0, 1, 1]);
        var w = '<path d="M74 82L30 12L44 46L22 40L46 72L16 78L66 98Z" fill="' + cr + '"' + k.ol + '/>';
        var d = '<path d="M71 85L34 22L48 54" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/>';
        var st = '<circle cx="30" cy="12" r="9" fill="#ffe36a" opacity=".7" filter="' + k.G + '"/><path d="' + star(30, 12, 8, 3.4) + '" fill="' + k.A + '"' + k.th + '/>';
        return [B(w), B(mir(w)), d, mir(d), st, mir(st)];
      }
    }
  ];

  function robot(index, owned, opts) {
    opts = opts || {};
    var i = ((Math.floor(+index) || 0) % 6 + 6) % 6;
    var n = Math.max(0, Math.min(6, Math.floor(+owned) || 0));
    var hl = opts.highlight == null || opts.highlight === '' ? null : +opts.highlight;
    var c = new Ctx(), R = RS[i], k = kit(c, R);
    var armL = arm(k);
    var P = [R.head(k), torso(k), armL, mirItems(armL), legs(k), R.gear(k)];
    var tf = ['', '', 'rotate(7 58 80)', 'rotate(-7 142 80)', '', ''];
    var g = function (j) { return part(P[j], j, j < n, hl, tf[j]); };
    var done = n === 6;
    var s = (done ? '<ellipse cx="100" cy="128" rx="98" ry="124" fill="' + c.rad('au', [[0, lt(ROBOTS[i].color, .3), .55], [.6, ROBOTS[i].color, .18], [1, ROBOTS[i].color, 0]]) + '" class="ga-aura"/>' : '') +
      '<ellipse cx="100" cy="253" rx="52" ry="5" fill="#071026" opacity=".2"/>' +
      (R.front ? '' : g(5)) + g(4) + g(1) + g(2) + g(3) + g(0) + (R.front ? g(5) : '') +
      (done ? glint(30, 150, 7) + glint(168, 96, 5.5) + glint(150, 222, 4.5) : '');
    return c.svg('0 0 200 260', 'ga-robot ga-' + ROBOTS[i].id + (done ? ' complete' : '') + (opts.cls ? ' ' + opts.cls : ''), sz(opts), s);
  }

  /* =========================================================
     4. 메달
     ========================================================= */
  var MEDAL = { gold: ['#ffd23a', '#7a4a00'], silver: ['#cfd8e6', '#3d4a60'], bronze: ['#e09a5a', '#5a2d0c'] };
  function badge(text, opts) {
    opts = opts || {};
    var m = MEDAL[opts.color] || (opts.color && /^#/.test(opts.color) ? [opts.color, dk(opts.color, .6)] : MEDAL.gold);
    var col = m[0], ink = m[1], rib = opts.ribbon || '#4f8cff';
    var c = new Ctx();
    var mt = c.lin('md', [[0, lt(col, .7)], [.3, lt(col, .25)], [.5, col], [.55, dk(col, .12)], [1, dk(col, .45)]], [.2, 0, .75, 1]);
    var fc = c.rad('mf', [[0, lt(col, .45)], [.6, col], [1, dk(col, .2)]], [.4, .35, .7]);
    var rb = c.metal(rib);
    var raw = String(text == null ? '' : text).trim(), w = raw.split(/\s+/);
    var lines = raw.length > 3 && w.length > 1 ? [w[0], w.slice(1).join(' ')] : [raw];
    var L = Math.max.apply(null, lines.map(function (x) { return x.length; }));
    var fs = lines.length > 1 ? (L <= 2 ? 17 : L === 3 ? 13.5 : 11) : (L <= 1 ? 30 : L === 2 ? 26 : L === 3 ? 21 : L === 4 ? 17 : 13);
    var ys = lines.length > 1 ? [46 - fs * .08, 46 + fs * .98] : [46 + fs * .36];
    var tail = '<path d="M33 62L22 106L33 99.5L41 109L52 68Z" fill="' + rb + '" stroke="' + OL + '" stroke-width="1.6"/>';
    var seal = '';
    for (var i = 0; i < 32; i++) {
      var a = (i * 11.25 - 90) * Math.PI / 180, r = i % 2 ? 37 : 41;
      seal += (i ? 'L' : 'M') + n2(50 + r * Math.cos(a)) + ' ' + n2(46 + r * Math.sin(a));
    }
    var txt = lines.map(function (ln, j) {
      var tx = '<text x="50" y="' + n2(ys[j]) + '" text-anchor="middle" font-family="\'Black Han Sans\',\'Jua\',\'Gowun Dodum\',sans-serif" font-size="' + fs + '" font-weight="700"';
      return tx + ' fill="#fff" fill-opacity=".55" transform="translate(0 1.2)">' + esc(ln) + '</text>' + tx + ' fill="' + ink + '">' + esc(ln) + '</text>';
    }).join('');
    var s = tail + mir(tail, 100) +
      '<path d="' + seal + 'Z" fill="' + dk(col, .4) + '" transform="translate(0 2.5)"/>' +
      '<path d="' + seal + 'Z" fill="' + mt + '" stroke="' + dk(col, .55) + '" stroke-width="1.4"/>' +
      '<circle cx="50" cy="46" r="29" fill="' + dk(col, .3) + '"/>' +
      '<circle cx="50" cy="46.8" r="27" fill="' + fc + '"/>' +
      '<circle cx="50" cy="46" r="23" fill="none" stroke="' + lt(col, .6) + '" stroke-opacity=".6" stroke-width="1" stroke-dasharray="1.5 2.5"/>' +
      '<path d="M26 40C28 28 38 20 50 19.5" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="2.4"/>' +
      (raw ? txt : '<path d="' + star(50, 47, 15, 6.5) + '" fill="' + ink + '" opacity=".85"/>') +
      glint(76, 18, 5);
    return c.svg('0 0 100 112', 'ga-badge' + (opts.cls ? ' ' + opts.cls : ''), sz(opts), s);
  }

  window.GA = {
    jarvis: jarvis,
    areaIcon: areaIcon,
    ROBOTS: ROBOTS,
    PARTS: PARTS,
    robot: robot,
    badge: badge,
    AREAS: AREAS
  };
})();

/* =========================================================
   함께 자라요 — 그림 모음 (hero-art.js)
   자비스·영역 문장·모으는 로봇·메달을 SVG 글자로 그린다. 라이브러리 없음.

   window.GA = {
     jarvis({full, size, cls})          자비스 (얼굴 / 온몸)
     areaIcon(key, {size})              영역 육각 휘장 (speech motor art mind brain feel body calm)
     ROBOTS, PARTS                      모으는 로봇 6종 · 부품 이름 6개
     robot(index, owned, {size, highlight, cls})
     badge(text, {size, color, ribbon, cls})
     AREAS                              영역 색·이름
   }
   그림 방식 (실사풍 메카):
   - 장갑판은 모두 다각형이고 plate() 가 모서리를 깎아(베벨) 빛 방향에 따라
     밝은 면·중간 면·그림자 면·깊은 그림자로 나눠 칠한다. 빛은 늘 왼쪽 위.
   - 회색 강철 몸에 로봇마다 강조색 하나. 빛나는 부분은 흐림 필터로 번지게.
   - 모든 그림은 독창적인 디자인이다 (특정 영화·만화 캐릭터를 본뜨지 않는다).
   - <defs> 의 id 에는 부를 때마다 다른 꼬리표가 붙어 한 화면에 여러 장을 놓아도 섞이지 않는다.
   ========================================================= */
(function () {
  'use strict';

  var OL = '#080b12';                                   /* 외곽선 */
  var PFX = 'g' + Math.random().toString(36).slice(2, 5);
  var seq = 0;
  var LV = [-0.53, -0.848];                             /* 빛이 오는 쪽 (왼쪽 위) */

  /* ---------- 숫자·색 ---------- */
  function n1(v) { return Math.round(v * 10) / 10; }
  function n2(v) { return Math.round(v * 100) / 100; }
  function rgb(h) { h = String(h).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var v = parseInt(h, 16) || 0; return [v >> 16 & 255, v >> 8 & 255, v & 255]; }
  function hex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([0, 1, 2].map(function (i) { return x[i] + (y[i] - x[i]) * t; })); }
  function lt(c, t) { return mix(c, '#ffffff', t); }
  function dk(c, t) { return mix(c, '#05070c', t); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }
  function nz(v) { return String(v).replace(/^0\./, '.').replace(/^-0\./, '-.'); }
  function stops(st) {
    return st.map(function (s) { return '<stop offset="' + nz(s[0]) + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + nz(s[2]) + '"' : '') + '/>'; }).join('');
  }
  /* 배열 펼치기: cat(a, [b, [c]], null, d) → [a, b, c, d] */
  function cat() {
    var o = [];
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      if (Array.isArray(a)) o.push.apply(o, cat.apply(null, a));
      else if (a) o.push(a);
    }
    return o;
  }

  /* ---------- 한 장의 그림 (defs 모음) ---------- */
  function Ctx() { this.p = PFX + (++seq).toString(36) + '-'; this.d = []; this.k = {}; this.mt = {}; }
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
      return '<radialGradient id="' + id + '" cx="' + nz(v[0]) + '" cy="' + nz(v[1]) + '" r="' + nz(v[2]) + '">' + stops(st) + '</radialGradient>';
    }) + ')';
  };
  /* 빛 번짐. 범위는 그 그림의 칸(r = [x, y, w, h])으로만 잡아 휴대폰에서도 가볍게 */
  Ctx.prototype.glow = function (sd, r) {
    r = r || [-10, -10, 220, 280];
    return 'url(#' + this.add('f' + sd + r.join(), function (id) {
      return '<filter id="' + id + '" filterUnits="userSpaceOnUse" x="' + r[0] + '" y="' + r[1] + '" width="' + r[2] + '" height="' + r[3] + '"><feGaussianBlur stdDeviation="' + sd + '"/></filter>';
    }) + ')';
  };
  Ctx.prototype.hazard = function () {
    return 'url(#' + this.add('hz', function (id) {
      return '<pattern id="' + id + '" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="#e9a900"/><rect width="3" height="6" fill="#14161c"/></pattern>';
    }) + ')';
  };
  /* 재질: md(중간 면) hi(밝은 면) lo(그림자 면) sp(모서리 반짝임) face(판 가운데, 비스듬한 반사 경계) */
  Ctx.prototype.mat = function (c) {
    var self = this, m = this.mt[c];
    if (!m) {
      /* 판 가운데: 위쪽 반사띠 → 또렷한 지평선 반사 → 아래 깊은 그림자 → 바닥 반사광 */
      m = this.mt[c] = {
        md: dk(c, .56), hi: lt(c, .62), sp: lt(c, .92),
        face: this.lin('m' + c, [[0, lt(c, .3)], [.15, lt(c, .52)], [.3, lt(c, .12)], [.46, c], [.5, dk(c, .2)], [.86, dk(c, .55)], [1, dk(c, .36)]], [.25, 0, .75, 1])
      };
      /* t > 0: 위를 보는 면(밝게), t < 0: 아래를 보는 면(어둡게) */
      m.F = function (t) {
        return t > 0 ? self.lin('u' + c, [[0, lt(c, .58)], [.22, lt(c, .72)], [.55, lt(c, .26)], [1, dk(c, .06)]], [.25, 0, .75, 1])
          : t < 0 ? self.lin('w' + c, [[0, dk(c, .12)], [.5, dk(c, .42)], [1, dk(c, .64)]], [.25, 0, .75, 1]) : m.face;
      };
    }
    return m;
  };
  Ctx.prototype.glass = function (gold) {
    return { md: '#04070d', face: gold ? this.lin('gg', [[0, '#ffe2a0'], [.3, '#a8691c'], [.62, '#2b1806'], [1, '#6a4417']])
      : this.lin('gb', [[0, '#4a72aa'], [.32, '#0e1c36'], [.7, '#060b16'], [1, '#1d3a64']]) };
  };
  Ctx.prototype.chrome = function () {
    return this.lin('ch', [[0, '#f5f8fc'], [.45, '#aab4c3'], [.55, '#677284'], [1, '#d8dfe8']]);
  };
  Ctx.prototype.svg = function (vb, cls, size, body, sw) {
    var s = size == null || size === '' ? '100%' : size;
    return '<svg xmlns="http://www.w3.org/2000/svg" class="' + esc(cls) + '" viewBox="' + vb + '" width="' + s + '" height="' + s + '" aria-hidden="true" focusable="false">' +
      (this.d.length ? '<defs>' + this.d.join('') + '</defs>' : '') +
      '<g stroke-width="' + (sw || 2) + '" stroke-miterlimit="3">' + body + '</g></svg>';
  };

  /* ---------- 좌우 뒤집기 ---------- */
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
  function pts(s) { return typeof s === 'string' ? s.trim().split(/\s+/).map(function (p) { return p.split(',').map(Number); }) : s; }
  function mp(p, W) { return p.map(function (q) { return [(W || 200) - q[0], q[1]]; }); }
  function pd(p) { return 'M' + p.map(function (q) { return n1(q[0]) + ' ' + n1(q[1]); }).join('L') + 'Z'; }
  /* 한쪽(s=1 이면 거울)을 그리는 도우미 */
  function sideFn(s, W) {
    return { p: function (q) { q = pts(q); return s ? mp(q, W) : q; }, t: function (x) { return s ? mir(x, W) : x; } };
  }
  function both(fn, W) { return cat(fn(sideFn(0, W)), fn(sideFn(1, W))); }

  /* ---------- 작은 도형 ---------- */
  function star(cx, cy, R, r, n, rot) {
    n = n || 5; rot = rot == null ? -90 : rot;
    var d = '';
    for (var i = 0; i < n * 2; i++) {
      var a = (rot + i * 180 / n) * Math.PI / 180, q = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + n1(cx + q * Math.cos(a)) + ' ' + n1(cy + q * Math.sin(a));
    }
    return d + 'Z';
  }
  function hexArr(cx, cy, r) {
    var a = [];
    for (var i = 0; i < 6; i++) { var t = (60 * i - 90) * Math.PI / 180; a.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); }
    return a;
  }
  function hexPts(cx, cy, r) { return pd(hexArr(cx, cy, r)); }
  function cp(x, y, r) { return 'M' + n1(x - r) + ' ' + n1(y) + 'a' + r + ' ' + r + ' 0 1 0 ' + n1(2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + n1(-2 * r) + ' 0Z'; }
  function slits(x, y, w, h, n, g) {
    var d = '';
    for (var i = 0; i < n; i++) d += 'M' + x + ' ' + n1(y + i * g) + 'h' + w + 'v' + h + 'h' + (-w) + 'Z';
    return d;
  }
  function sz(o) { return o && o.size != null ? o.size : '100%'; }

  /* ---------- 장갑판: 모서리를 깎아 빛 방향대로 칠한다 ----------
     p: 다각형 점들 ('x,y x,y …'), m: 재질, o.d: 베벨 폭, o.th: 가는 외곽선 */
  function B(s) { return { b: s }; }
  function plate(k, p, m, o) {
    o = o || {}; p = pts(p);
    var n = p.length, d = o.d == null ? 2.8 : o.d, A = 0, i, N = [], Q = [], S = [], Ls = [], x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (i = 0; i < n; i++) {
      var a = p[i], b = p[(i + 1) % n]; A += a[0] * b[1] - b[0] * a[1];
      x0 = Math.min(x0, a[0]); x1 = Math.max(x1, a[0]); y0 = Math.min(y0, a[1]); y1 = Math.max(y1, a[1]);
    }
    var big = (x1 - x0) + (y1 - y0) > 64;
    for (i = 0; i < n; i++) {
      var a2 = p[i], b2 = p[(i + 1) % n], ex = b2[0] - a2[0], ey = b2[1] - a2[1], L = Math.sqrt(ex * ex + ey * ey) || 1;
      Ls.push(L); N.push(A > 0 ? [ey / L, -ex / L] : [-ey / L, ex / L]);
      S.push(N[i][0] * LV[0] + N[i][1] * LV[1]);
    }
    for (i = 0; i < n; i++) {
      var na = N[(i + n - 1) % n], nb = N[i], c = 1 + na[0] * nb[0] + na[1] * nb[1], f = d / Math.max(c, .45);
      Q.push([p[i][0] - (na[0] + nb[0]) * f, p[i][1] - (na[1] + nb[1]) * f]);
    }
    function pt(q) { return n1(q[0]) + ' ' + n1(q[1]); }
    function lp(u, v, t) { return [u[0] + (v[0] - u[0]) * t, u[1] + (v[1] - u[1]) * t]; }
    /* 빛 받는 모서리: 베벨 띠 한가운데를 띠 폭만큼 굵은 선으로 (각진 이음 = 띠와 꼭 맞음) */
    var st = 0, hi = '', sp = '', rm = '', run = false;
    for (i = 0; i < n; i++) if (S[i] <= .15) { st = (i + 1) % n; break; }
    for (var t = 0; t < n; t++) {
      i = (st + t) % n;
      var j = (i + 1) % n;
      if (S[i] > .15) {
        hi += (run ? '' : 'M' + pt(lp(p[i], Q[i], .5))) + 'L' + pt(lp(p[j], Q[j], .5)); run = true;
        if (S[i] > .6 && Ls[i] > 11) sp += 'M' + pt(lp(p[i], Q[i], .4)) + 'L' + pt(lp(p[j], Q[j], .4));
      } else {
        run = false;
        if (big && S[i] < -.72 && Ls[i] > 14) rm += 'M' + pt(lp(p[i], Q[i], .3)) + 'L' + pt(lp(p[j], Q[j], .3));
      }
    }
    var out = [B('<path d="' + pd(p) + '" fill="' + m.md + '"' + (o.th ? k.th : k.ol) + '/>')];
    if (hi) out.push('<path d="' + hi + '" fill="none" stroke="' + m.hi + '" stroke-width="' + n1(d) + '"/>');
    out.push('<path d="' + pd(Q) + '" fill="' + (o.t ? m.F(o.t) : m.face) + '"/>');
    if (sp && big) out.push('<path d="' + sp + '" fill="none" stroke="' + m.sp + '" stroke-width=".7"/>');
    if (rm && o.rim !== false) out.push('<path d="' + rm + '" fill="none" stroke="#9cc2ff" stroke-opacity=".4" stroke-width=".6"/>');
    return out;
  }
  function flat(k, p, m, th) { return B('<path d="' + pd(pts(p)) + '" fill="' + m.face + '"' + (th ? k.th : k.ol) + '/>'); }
  function flatS(k, p, m) { return '<path d="' + pd(pts(p)) + '" fill="' + m.face + '"' + k.th + '/>'; }
  function seam(d, o) { return '<path d="' + d + '" fill="none" stroke="#020409" stroke-opacity="' + (o || .6) + '" stroke-width=".8"/>'; }
  function vent(x, y, w, h, n, g, col) { return '<path d="' + slits(x, y, w, h, n, g) + '" fill="' + (col || '#04060b') + '"/>'; }
  function bolts(a) {
    return '<path d="' + a.map(function (q) { return cp(q[0], q[1], q[2] || 1.1); }).join('') + '" fill="#b4bdca" stroke="' + OL + '" stroke-width=".5"/>';
  }
  /* 빛: 번짐 + 본체 + (뜨거운 속) */
  function lamp(k, d, c, core) {
    return '<path d="' + d + '" fill="' + c + '" filter="' + k.G + '" opacity=".95"/><path d="' + d + '" fill="' + c + '"/>' +
      (core ? '<path d="' + core + '" fill="#fff" opacity=".85"/>' : '');
  }
  function piston(x1, y1, x2, y2) {
    var mx = n1(x1 + (x2 - x1) * .55), my = n1(y1 + (y2 - y1) * .55), a = 'M' + x1 + ' ' + y1, b = 'L' + x2 + ' ' + y2;
    return '<path d="' + a + b + '" stroke="' + OL + '" stroke-width="4.4"/><path d="M' + mx + ' ' + my + b + '" stroke="#cfd6e0" stroke-width="2"/>';
  }
  function wheel(k, cx, cy, r, cal) {
    var c = function (rr, at) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + n1(rr) + '"' + at + '/>'; };
    return c(r, ' fill="#12151b"' + k.ol) +
      c(r - 1.8, ' fill="none" stroke="#303643" stroke-width="2.3" stroke-dasharray="1.4 1.5"') +
      c(r * .64, ' fill="#1a1e26"' + k.th) +
      '<path d="' + star(cx, cy, r * .6, r * .15, 6, -75) + '" fill="' + k.CH + '"/>' +
      (cal ? '<path d="M' + n1(cx + r * .18) + ' ' + n1(cy - r * .5) + 'L' + n1(cx + r * .48) + ' ' + n1(cy - r * .3) + 'L' + n1(cx + r * .36) + ' ' + n1(cy - r * .14) + 'L' + n1(cx + r * .1) + ' ' + n1(cy - r * .32) + 'Z" fill="' + cal + '"/>' : '') +
      c(r * .17, ' fill="#c3cbd6"' + k.th) +
      '<path d="M' + n1(cx - r * .8) + ' ' + n1(cy - r * .2) + 'A' + n1(r * .82) + ' ' + n1(r * .82) + ' 0 0 1 ' + n1(cx - r * .2) + ' ' + n1(cy - r * .8) + '" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".9"/>';
  }

  /* 부품 조각: 글자 = 꾸밈(없는 부품에선 빠짐), B() = 실루엣이 되는 큰 모양, {g, items} = 한 묶음 */
  function mirT(tf) { return mir('<g transform="' + tf + '">').slice(14, -2); }
  function draw(items, owned) {
    return items.map(function (x) {
      if (typeof x === 'string') return owned ? x : '';
      if (x.items) return '<g transform="' + x.g + '">' + draw(x.items, owned) + '</g>';
      return owned ? x.b : x.b.replace(/\s(fill|stroke|stroke-width|stroke-opacity|stroke-dasharray|opacity|filter|fill-opacity)="[^"]*"/g, '');
    }).join('');
  }
  function part(items, i, owned, hl) {
    var cls = 'part p' + i + (hl === i ? ' new-part' : '') + (owned ? '' : ' missing');
    return '<g class="' + cls + '"' + (owned ? '' : ' fill="#9aa7bd" opacity=".3"') + '>' + draw(items, owned) + '</g>';
  }

  /* =========================================================
     공통 기체 골격 — 200×260 칸 (보는 쪽 왼쪽을 그리고 오른쪽은 거울)
     ========================================================= */
  function kit(c, R) {
    var k = { c: c, R: R, ol: ' stroke="' + OL + '"', th: ' stroke="' + OL + '" stroke-width="1"' };
    k.S = c.mat(R.steel || '#5c6679'); k.D = c.mat(R.dark || '#353b47'); k.A = c.mat(R.a);
    k.GL = c.glass(false); k.GOLD = c.glass(true); k.CH = c.chrome(); k.G = c.glow(1.6, R.gr);
    return k;
  }
  function torso(k) {
    var R = k.R, P = k[R.pecM || 'A'];
    return cat(
      B('<path d="M70 54L130 54L140 92L124 132L128 156L72 156L76 132L60 92Z" fill="#12161d"' + k.th + '/>'),
      seam('M92 96C90 110 92 122 90 132M108 96C110 110 108 122 110 132', .9),
      flat(k, '88,40 112,40 114,56 86,56', k.D),
      seam('M93 42L92 55M100 41L100 56M107 42L108 55'),
      both(function (f) { return plate(k, f.p('98,50 80,51 63,58 71,65 98,61'), k.D, { d: 1.6, t: 1 }); }),
      plate(k, '87,106 113,106 110,132 90,132', k.D, { d: 1.8 }),
      seam('M89 113L111 113M89.5 120L110.5 120M90 127L110 127'),
      piston(80, 100, 86, 132), piston(120, 100, 114, 132),
      both(function (f) { return plate(k, f.p('64,92 92,96 90,112 80,118 68,110'), k.S, { t: -1 }); }),
      both(function (f) {
        return cat(plate(k, f.p('99,56 99,68 78,72 55,70 63,57'), P, { d: 2.2, t: 1 }),
          plate(k, f.p('99,68 99,84 92,94 68,90 55,71 78,73'), P, { d: 2.6 }));
      }),
      R.chest ? R.chest(k) : plate(k, '95,58 105,58 106,84 100,92 94,84', k.S, { d: 1.4 }),
      plate(k, '88,130 112,130 111,146 100,154 89,146', k[R.pelM || 'D'], { d: 1.8 }),
      both(function (f) { return plate(k, f.p('68,134 88,134 86,150 74,161 63,152 65,140'), k.S, { d: 2.2 }); }),
      bolts([[92, 136], [108, 136]])
    );
  }
  function stdPad(k, f, m) {
    m = m || k[k.R.padM || 'A'];
    return cat(plate(k, f.p('18,84 44,92 42,104 20,98'), k.S, { d: 1.6, t: -1 }),
      plate(k, f.p('13,63 38,67 58,71 52,90 30,98 14,85'), m, { d: 2.6 }),
      plate(k, f.p('62,56 44,45 22,51 12,62 38,66 59,70'), m, { d: 2.2, t: 1 }),
      plate(k, f.p('22,51 14,36 30,46'), k.D, { d: 1, th: 1 }),
      f.t(seam('M20 80L34 90')));
  }
  function arm(k, s) {
    var R = k.R, f = sideFn(s);
    if (R.arm) return R.arm(k, f);
    return cat(
      B(f.t('<circle cx="52" cy="68" r="9" fill="' + k.D.face + '"' + k.ol + '/>')),
      flat(k, f.p('37,86 49,86 47,118 39,118'), k.D),
      plate(k, f.p('31,90 44,88 45,102 42,114 33,115 30,102'), k.S, { d: 1.8 }),
      B(f.t('<circle cx="42" cy="121" r="6" fill="' + k.D.face + '"' + k.ol + '/>')),
      f.t(piston(48, 96, 50, 130)),
      plate(k, f.p('28,163 47,162 50,175 45,184 32,184 26,176'), k.D, { d: 1.8 }),
      flat(k, f.p('40,122 52,124 51,158 43,164'), k.D, 1),
      f.t(piston(48.5, 128, 47.5, 156)),
      plate(k, f.p('24,111 31,109 44,120 49,130 46,158 37,167 27,165 20,146 22,124'), k[R.foreM || 'S'], { d: 2.4 }),
      plate(k, f.p('17,128 23,126 21,158 15,149'), k.D, { d: 1.1, th: 1, t: -1 }),
      R.fore ? R.fore(k, f) : f.t(vent(27, 140, 15, 1.3, 3, 3.2)),
      f.t(seam('M30 171L46 170.5M31 177L46 176.5')),
      R.pad ? R.pad(k, f) : stdPad(k, f)
    );
  }
  function legs(k) {
    var R = k.R;
    return both(function (f) {
      return { g: f.t('<g transform="rotate(4 79 150)">').slice(14, -2), items: cat(
        R.calfBack ? R.calfBack(k, f) : null,
        flat(k, f.p('71,150 87,150 88,190 72,190'), k.D),
        plate(k, f.p('64,156 84,152 87,166 85,186 74,191 62,176'), k.S),
        f.t(seam('M67 163L83 160.5')),
        f.t(piston(63, 176, 55, 214)),
        plate(k, f.p('53,214 46,222 49,240 58,244'), k.D, { d: 1.2, th: 1, t: -1 }),
        plate(k, f.p('55,215 92,212 90,236 82,246 66,246 56,232'), k[R.shinM || 'A'], { d: 2.6 }),
        plate(k, f.p('58,203 86,198 92,212 55,215'), k[R.shinM || 'A'], { d: 1.8, t: 1 }),
        R.shinDet ? R.shinDet(k, f) : null,
        plate(k, f.p('62,186 74,175 87,182 91,195 80,208 64,202'), k.S, { d: 1.8 }),
        plate(k, f.p('48,241 90,241 96,250 91,257 40,257 38,250'), k.D, { d: 1.6 }),
        plate(k, f.p('38,250 50,243 62,244 61,257 40,257'), k.S, { d: 1.3, th: 1, t: 1 }),
        R.calfFront ? R.calfFront(k, f) : null
      ) };
    });
  }

  /* =========================================================
     1. 자비스 — 든든한 형 같은 수호 기체 (남색 장갑 · 청록 눈 · 주황 포인트)
     ========================================================= */
  var JV = { a: '#21467f', o: '#ff8a2a', e: '#5ff0ff', steel: '#5f697c', dark: '#323844', face: '#4f5a70', padM: 'A', shinM: 'A', foreM: 'A' };

  /* 머리 — 120×120 칸 */
  function jvHead(k, bust) {
    var W = 120, O = k.O;
    var sd = function (fn) { return both(fn, W); };
    var it = [];
    if (bust) {
      it = cat(
        flat(k, '46,90 74,90 76,112 44,112', k.D),
        sd(function (f) { return cat(plate(k, f.p('57,102 34,101 12,109 5,119 57,119'), k.A, { d: 2.4 }),
          f.t('<path d="M14 111L34 104L36.5 107.4L17 115Z" fill="' + O.face + '"/>')); }),
        plate(k, '49,103 71,103 75,119 45,119', k.S, { d: 2 }),
        lamp(k, 'M60 107L64 111.5L60 116L56 111.5Z', '#5ff0ff')
      );
    }
    /* 뒤로 젖힌 안테나 날개 + 귀 (들을 때 빛이 바뀜) */
    sd(function (f) {
      var e = cat(plate(k, f.p('30,44 6,27 2,33 10,46 19,56'), k.A, { d: 1.4 }),
        f.t('<path d="M6 27L2 33L4.6 37L9.4 30.6Z" fill="' + O.face + '"/>'),
        plate(k, f.p('31,46 19,48 14,60 18,75 31,75'), k.D, { d: 1.6 }));
      var strip = f.t('<path d="M18.8 54L25 52.5L25 70.5L19.8 69.5Z"/>');
      var fin = f.t('<path d="M27 46.4L8.6 33.2L9.4 32L28 44.8Z"/>');
      it.push('<g class="jv-ear" fill="#4fe0ff">' + draw(e, true) + strip.replace('/>', ' filter="' + k.G + '" opacity=".9"/>') + strip + fin + '</g>');
      return [];
    });
    it = it.concat(cat(
      plate(k, '60,4 78,7 92,16 99,30 99,44 92,47 60,43 28,47 21,44 21,30 28,16 42,7', k.A, { d: 2.8 }),
      sd(function (f) { return cat(plate(k, f.p('22,31 30,20 42,24 36,45 22,45'), k.A, { d: 1.6, t: -1 }), f.t(vent(26, 32, 7, 1, 3, 2.6))); }),
      seam('M44 9L50 30M76 9L70 30'),
      plate(k, '53.5,7 66.5,7 70,29 60,37 50,29', k.S, { d: 1.6 }),
      flat(k, '28,48 92,48 88,61 32,61', k.GL, 1),
      sd(function (f) { return plate(k, f.p('21,43 28,46.5 60.5,43.5 60.5,48.5 30,52.5 20,50'), k.D, { d: 1.2, th: 1 }); }),
      sd(function (f) { return cat(plate(k, f.p('20,50 30,52 33,61 37,80 47,95 37,97 26,85 19,66'), k.A, { d: 1.8 }),
        f.t('<path d="M22.5 66L28.5 68L29.5 76L23.5 73.5Z" fill="' + O.face + '"/>')); }),
      plate(k, '33,61 87,61 85,79 72,93 48,93 35,79', k.F, { d: 2 }),
      sd(function (f) { return f.t(seam('M37 64L44 86')); })
    ));
    var V = 'M44 69h32v2.6h-32ZM46 74h28v2.6h-28ZM49 79h22v2.6h-22ZM52 84h16v2.6h-16Z';
    it.push('<path d="' + V + '" fill="#06090f"/>');
    /* 말하지 않을 때: 덤덤한 이음매 한 줄 */
    it.push('<g class="jv-smile"><path d="M40 65.4L80 65.4" fill="none" stroke="#04070c" stroke-width="1.1"/><path d="M40.5 66.7L79.5 66.7" fill="none" stroke="#f2f6fc" stroke-opacity=".55" stroke-width=".6"/></g>');
    /* 말할 때: 환풍구 막대가 빛난다 */
    it.push('<g class="jv-mouth" fill="#5ff0ff" opacity="0"><path d="' + V + '" filter="' + k.G + '"/><path d="' + V + '"/></g>');
    it = it.concat(plate(k, '48,93 72,93 68,101 52,101', k.D, { d: 1.2, th: 1 }));
    /* 눈: 좁은 바이저 틈 (깜빡일 때 위아래로 접힘) */
    function eye(s) {
      var f = sideFn(s, W), d = f.t('<path d="M33.5 51.3L55 53L54 57.8L35.5 57.1Z"/>');
      return '<g class="jv-eye" fill="#5ff0ff">' + d.replace('/>', ' filter="' + k.G + '" opacity=".95"/>') + d +
        f.t('<path d="M37 53.5L52 54.7L51.6 55.8L37.4 55.1Z" fill="#effffe" opacity=".9"/>') + '</g>';
    }
    it.push('<path d="M30 49.4L90 49.4" fill="none" stroke="#7fb0ff" stroke-opacity=".35" stroke-width=".6"/>');
    it.push('<g class="jv-eyes">' + eye(0) + eye(1) + '</g>');
    /* 이마 감지기 */
    it.push('<path d="M60 22.4L67.6 30L60 37.6L52.4 30Z" fill="' + k.S.face + '"' + k.ol + '/>' +
      '<g class="jv-bulb" fill="#ffb54a"><path d="M60 24.6L65.4 30L60 35.4L54.6 30Z" filter="' + k.G + '" opacity=".9"/>' +
      '<path d="M60 25.2L64.8 30L60 34.8L55.2 30Z"/><path d="M60 25.2L64.8 30L60 30.9L55.2 30Z" fill="#fff" opacity=".5"/></g>');
    return it;
  }

  /* 온몸 — 200×260 칸, 두 주먹을 허리에 얹은 당당한 자세 */
  JV.chest = function (k) {
    return cat(
      plate(k, hexArr(100, 74, 13), k.S, { d: 2.2 }),
      '<g class="jv-core" fill="#5ff0ff"><path d="' + hexPts(100, 74, 9) + '" filter="' + k.G + '"/><path d="' + hexPts(100, 74, 8.4) + '"/>' +
      '<path d="' + hexPts(100, 74, 4.2) + '" fill="#e8ffff" opacity=".9"/></g>',
      plate(k, '96,88 104,88 104,96 100,100 96,96', k.D, { d: 1, th: 1 }),
      both(function (f) { return f.t('<path d="M58 72L88 80L88 84L60 76Z" fill="' + k.O.face + '"/>'); })
    );
  };
  JV.arm = function (k, f) {
    return cat(
      B(f.t('<circle cx="52" cy="68" r="10" fill="' + k.D.face + '"' + k.ol + '/>')),
      flat(k, f.p('44,74 57,82 35,118 22,110'), k.D),
      plate(k, f.p('42,80 54,86 37,112 27,107'), k.S, { d: 1.6 }),
      f.t(piston(40, 98, 42, 126)),
      B(f.t('<circle cx="28" cy="114" r="7.5" fill="' + k.D.face + '"' + k.ol + '/>')),
      f.t(bolts([[28, 114, 2]])),
      plate(k, f.p('15,113 27,102 41,108 67,128 61,146 31,130'), k.A, { d: 2.4 }),
      f.t('<path d="M30 112L58 131L56.4 134L28.6 115.2Z" fill="' + k.O.face + '"/>'),
      plate(k, f.p('57,127 74,129 79,143 69,152 56,146'), k.D, { d: 1.6 }),
      f.t(seam('M62 133L73 135M60 139L74 141')),
      stdPad(k, f),
      f.t('<path d="M26 58L44 49.5L46 52.8L28.6 61.4Z" fill="' + k.O.face + '"/>')
    );
  };
  JV.shinDet = function (k, f) {
    return cat(f.t('<path d="M58 210L90 205.5L90.6 209.5L59 214Z" fill="' + k.O.face + '"/>'), f.t(lamp(k, 'M66 228L82 226L82.4 229.4L66.4 231.4Z', '#5ff0ff')));
  };
  function jvFull(c, k) {
    var back = [];
    var kh = {}; for (var x in k) kh[x] = k[x];
    kh.G = c.glow(1.8, [-8, -8, 136, 136]);
    return '<ellipse cx="100" cy="255" rx="62" ry="4.5" fill="#000" opacity=".28"/>' +
      draw(cat(back, legs(k), torso(k), arm(k, 0), arm(k, 1)), true) +
      '<g transform="translate(73.6 2) scale(.44)" stroke-width="4.4">' + draw(jvHead(kh, false), true) + '</g>';
  }

  function jarvis(opts) {
    opts = opts || {};
    var full = !!opts.full, c = new Ctx(), k;
    if (full) { k = kit(c, JV); k.O = c.mat(JV.o); }
    else {
      k = { c: c, R: JV, ol: ' stroke="' + OL + '"', th: ' stroke="' + OL + '" stroke-width=".8"',
        A: c.mat(JV.a), S: c.mat(JV.steel), D: c.mat(JV.dark), O: c.mat(JV.o), GL: c.glass(false), G: c.glow(1.8, [-8, -8, 136, 136]) };
    }
    k.F = c.mat(JV.face);
    var body = full ? jvFull(c, k) : draw(jvHead(k, true), true);
    return c.svg(full ? '0 0 200 260' : '0 0 120 120', 'jv' + (full ? ' jv-full' : '') + (opts.cls ? ' ' + opts.cls : ''), sz(opts), body, 2);
  }

  /* =========================================================
     2. 영역 휘장 — 깎은 강철 육각판 + 빛나는 선 그림 (HUD 느낌)
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
  var LINE = {
    speech: 'M44 22L56 22Q61 22 61 27L61 45Q61 50 56 50L44 50Q39 50 39 45L39 27Q39 22 44 22ZM45 30L55 30M45 36L55 36M45 42L55 42' +
      'M32 42Q32 61 50 61Q68 61 68 42M50 61L50 71M40 72L60 72M25 33Q20 43 25 53M75 33Q80 43 75 53M19 29Q13 43 19 57M81 29Q87 43 81 57',
    motor: 'M40 79L38 62L29 53Q26.5 50 29 47.6Q31.4 45.4 34 47.8L40 53L40 31Q40 27.5 43.5 27.5Q47 27.5 47 31L47 25Q47 21.5 50.5 21.5Q54 21.5 54 25L54 28Q54 24.5 57.5 24.5Q61 24.5 61 28L61 35Q61 31.5 64.3 31.5Q67.6 31.5 67.6 35L67.6 60Q67.6 70 62 74L62 79Z' +
      'M47 31L47 49M54 28L54 49M61 35L61 50M40 40L47 40M47 34L54 34M54 37L61 37M61 43L67.6 43M38 79L64 79' + cp(53, 63, 3.6),
    art: 'M76 17L82 23L61 46L55 40ZM55 40L61 46L56 51L50 45ZM50 45L56 51Q51 62 38 65Q42 52 50 45Z' +
      'M24 74C21 68 26 63 31 65C33 59 41 59 43 64C48 63 51 68 48 72C51 76 47 81 42 79C39 84 31 84 29 79C24 81 21 78 24 74Z' + cp(56, 75, 2.4) + cp(18, 62, 1.8),
    mind: 'M27 38L40 38C38 31.5 41 26 47.5 26C54 26 57 31.5 55 38L68 38L68 50.5C74.5 48.5 80 51.5 80 58C80 64.5 74.5 67.5 68 65.5L68 78L55.5 78C57 72 53.5 68 47.5 68C41.5 68 38 72 39.5 78L27 78Z' + cp(47.5, 53, 3),
    brain: 'M50 26C44 21.5 35.5 23.5 33.5 30C26.5 30 22.5 37 24.5 43C19.5 47 19.5 56 25.5 60C24.5 67 30.5 73 37.5 72C40.5 77 47 78.5 50 75C53 78.5 59.5 77 62.5 72C69.5 73 75.5 67 74.5 60C80.5 56 80.5 47 75.5 43C77.5 37 73.5 30 66.5 30C64.5 23.5 56 21.5 50 26Z' +
      'M50 29L50 72M34 40L41 40L45 46M66 40L59 40L55 46M31 54L43 54M69 54L57 54M38 66L44 61M62 66L56 61' + cp(45, 46, 1.8) + cp(55, 46, 1.8) + cp(43, 54, 1.8) + cp(57, 54, 1.8),
    feel: 'M50 19L75 28L75 49C75 64 64.5 74.5 50 81C35.5 74.5 25 64 25 49L25 28Z' +
      'M50 64C40.5 57.5 36 52.5 36 46.5C36 41.5 39.8 38 44.2 38C47 38 49 39.6 50 41.6C51 39.6 53 38 55.8 38C60.2 38 64 41.5 64 46.5C64 52.5 59.5 57.5 50 64Z',
    body: cp(59, 25, 6.5) + 'M56 36L51 55M55.5 40L45 32M55.5 40L68 34.5M51 55L62 61L60.5 72M51 55L42 63L34 62M20 44L31 44M17 53L29 53M21 62L30 62',
    calm: 'M47.5 21A24 24 0 1 0 64.5 56A18 18 0 1 1 47.5 21ZM54 79C53 64 61 53.5 79 51C80 66 71 78 54 79ZM56 77C61 69 67 62 74.5 56' + star(70, 27, 6, 2, 4),
    star: star(50, 52, 24, 10)
  };
  function areaIcon(key, opts) {
    opts = opts || {};
    var a = AREAS[key], col = opts.color || (a ? a.color : '#8a96aa'), ic = LINE[a ? key : 'star'];
    var c = new Ctx(), k = { ol: ' stroke="' + OL + '"', th: ' stroke="' + OL + '" stroke-width="1"' };
    var steel = c.mat('#5d687b'), G = c.glow(2.4, [-10, -10, 120, 120]);
    var face = c.rad('fc', [[0, '#2d3747'], [.7, '#161c27'], [1, '#0e121a']], [.4, .3, .78]);
    var bl = hexArr(50, 50, 43.2).map(function (q) { return [q[0], q[1], 1.3]; });
    var s = '<path d="' + hexPts(50, 52.4, 47) + '" fill="#000" opacity=".4"/>' +
      draw(plate(k, hexArr(50, 50, 47), steel, { d: 6.5 }), true) +
      '<path d="' + hexPts(50, 50, 39.6) + '" fill="' + face + '" stroke="#05070b" stroke-width="1.6"/>' +
      '<path d="' + hexPts(50, 50, 36) + '" fill="none" stroke="' + col + '" stroke-opacity=".38" stroke-width=".8"/>' +
      '<path d="M23 34.5L50 19L77 34.5L77 38Q50 28 23 38Z" fill="#fff" opacity=".05"/>' +
      bolts(bl) +
      '<g transform="matrix(.88 0 0 .88 6 6.4)" fill="none" stroke-linejoin="round" stroke-linecap="round">' +
      '<path d="' + ic + '" stroke="' + col + '" stroke-width="5.4" opacity=".8" filter="' + G + '"/>' +
      '<path d="' + ic + '" stroke="' + col + '" stroke-width="3.1"/>' +
      '<path d="' + ic + '" stroke="' + lt(col, .7) + '" stroke-width="1.1"/></g>';
    return c.svg('0 0 100 100', 'ga-area ga-' + (a ? key : 'x') + (opts.cls ? ' ' + opts.cls : ''), sz(opts), s);
  }

  /* =========================================================
     3. 모으는 기체 6종
     ========================================================= */
  var ROBOTS = [
    { id: 'striker', name: '크림슨 스트라이커', color: '#cf2a2c', desc: '번개처럼 달리는 슈퍼카 돌격 기체' },
    { id: 'sentinel', name: '블루 센티널', color: '#2a6cd4', desc: '진압 방패를 든 경찰 요격 기체' },
    { id: 'titan', name: '타이탄 브레이커', color: '#efb300', desc: '유압 집게로 무엇이든 드는 중장비 거인' },
    { id: 'blade', name: '에어 블레이드', color: '#8fc3ff', desc: '날개 칼날로 하늘을 가르는 전투기 기체' },
    { id: 'lancer', name: '레스큐 랜서', color: '#1d9a52', desc: '사다리 창으로 사람을 구하는 소방 장갑 기체' },
    { id: 'phantom', name: '팬텀 노바', color: '#9b6cff', desc: '어둠 속을 누비는 스텔스 우주 기체' }
  ];
  var PARTS = ['머리', '몸통', '왼팔', '오른팔', '다리', '특수 장비'];

  var RS = [
    /* 0 크림슨 스트라이커 — 빨간 슈퍼카 (바퀴: 종아리, 장비: 리어 윙) */
    {
      a: '#cf2a2c', e: '#ffd66e', foreM: 'A',
      head: function (k) {
        return cat(
          plate(k, '100,6 113,10 120,22 117,31 100,27 83,31 80,22 87,10', k.A, { d: 2 }),
          plate(k, '96,7 104,7 103.5,25 96.5,25', k.D, { d: 1.1, th: 1 }),
          vent(97.6, 11, 4.8, 1, 4, 2.6),
          both(function (f) { return plate(k, f.p('81,22 91,29 90,44 81,41 78,31'), k.S, { d: 1.4 }); }),
          flat(k, '85,28 115,28 113,36 87,36', k.GL, 1),
          lamp(k, 'M87.5 30.6L112.5 30.6L110.6 33.8L89.4 33.8Z', k.R.e, 'M92 31.6L108 31.6L107.5 32.5L92.5 32.5Z'),
          plate(k, '88,36 112,36 110,46 100,51 90,46', k.S, { d: 1.6 }),
          vent(93, 39.5, 14, 1.3, 3, 2.4),
          seam('M100 46.5L100 50.5'),
          both(function (f) { return plate(k, f.p('81,41 89,44 90,51 84,49'), k.A, { d: 1, th: 1 }); })
        );
      },
      chest: function (k) {
        return cat(
          plate(k, '95,58 105,58 106,84 100,92 94,84', k.D, { d: 1.3 }),
          vent(96.6, 63, 6.8, 1.3, 6, 3),
          both(function (f) { return f.t(lamp(k, 'M69 80L86 84.5L85 89L71 86.5Z', '#fff4cf', 'M72.5 82.2L83 84.9L82.7 86L72.8 83.6Z')); }),
          both(function (f) { return f.t(seam('M60 68L92 77')); })
        );
      },
      calfBack: function (k, f) { return B(f.t(wheel(k, 50, 222, 12.5, k.R.a))); },
      shinDet: function (k, f) {
        return cat(f.t(vent(66, 222, 14, 1.2, 3, 2.8)), f.t(lamp(k, 'M83 208.6L89.5 207.6L90.2 212.4L83.6 213.4Z', '#ffb347')));
      },
      gear: function (k) {
        return both(function (f) {
          return cat(plate(k, f.p('85,58 24,35 19,45 83,70'), k.A, { d: 1.8 }),
            f.t('<path d="M80 63.6L25 43L24.2 45.4L79.4 66Z" fill="' + k.D.md + '"/>'),
            plate(k, f.p('12,27 25,30 25,58 12,55'), k.D, { d: 1.4 }),
            f.t(lamp(k, 'M14 50L23 52L23 54.6L14 52.6Z', '#ff3434')));
        });
      }
    },
    /* 1 블루 센티널 — 경찰 요격 (바퀴: 어깨, 장비: 진압 방패) */
    {
      a: '#2a6cd4', e: '#6ff3ff', front: true, on: 'L',
      head: function (k) {
        return cat(
          flat(k, '86,5 114,5 115,12 85,12', k.D, 1),
          lamp(k, 'M87.5 6.6L98.5 6.6L98.5 10.4L87.5 10.4Z', '#ff3b4f', 'M89.5 7.5L96.5 7.5L96.5 8.4L89.5 8.4Z'),
          lamp(k, 'M101.5 6.6L112.5 6.6L112.5 10.4L101.5 10.4Z', '#3d8bff', 'M103.5 7.5L110.5 7.5L110.5 8.4L103.5 8.4Z'),
          plate(k, '84,12 116,12 121,24 118,33 100,30 82,33 79,24', k.A, { d: 2 }),
          plate(k, '86,20.5 114,20.5 112,26 88,26', k.S, { d: 1, th: 1 }),
          both(function (f) { return plate(k, f.p('79,24 86,30 86,44 79,42 76,32'), k.D, { d: 1.2 }); }),
          flat(k, '84,29 116,29 114,37 86,37', k.GL, 1),
          both(function (f) { return f.t(lamp(k, 'M87.5 31.6L98 32.2L97.4 35.2L88.2 34.8Z', k.R.e, 'M89.6 32.8L96 33.2L95.8 33.9L89.8 33.6Z')); }),
          plate(k, '87,37 113,37 111,47 100,52 89,47', k.S, { d: 1.6 }),
          vent(92, 40, 16, 1.3, 3, 2.5),
          both(function (f) { return f.t(lamp(k, 'M79.8 33.5L82.4 34.4L82.4 39.4L79.8 38.6Z', k.R.e)); })
        );
      },
      chest: function (k) {
        return cat(
          flat(k, '78,60 122,60 116,77 84,77', k.GL, 1),
          '<path d="M84 61.5L93 61.5L88 75.5L85.5 75.5Z" fill="#fff" opacity=".13"/>',
          plate(k, '95,77 105,77 106,88 100,94 94,88', k.S, { d: 1.2, th: 1 }),
          '<path d="' + star(100, 85, 3.6, 1.6) + '" fill="#ffd34a" stroke="' + OL + '" stroke-width=".5"/>',
          both(function (f) { return f.t(lamp(k, 'M69 81L86 85L85 89.5L71 87Z', '#eaf6ff', 'M72.5 83L83 85.5L82.7 86.6L72.8 84.4Z')); })
        );
      },
      pad: function (k, f) { return cat(stdPad(k, f), B(f.t(wheel(k, 37, 68, 13.5, '#3d8bff')))); },
      shinDet: function (k, f) {
        return cat(f.t('<path d="M56.5 214L92 209.5L93 214.5L57.5 219Z" fill="#e6ecf4" opacity=".92"/>'),
          f.t(lamp(k, 'M66 228L80 226.5L80.4 229.5L66.4 231Z', k.R.e)));
      },
      gear: function (k) {
        return cat(
          plate(k, '22,98 60,92 70,104 70,156 58,182 30,184 18,158 18,110', k.S, { d: 2.8 }),
          plate(k, '27,106 59,101 65,110 65,154 55,175 33,177 23,155 23,114', k.A, { d: 2 }),
          flatS(k, '26,117 64,111 64,125 26,131', k.GL),
          '<path d="M28 119L38 117.5L32 129.7L28 130.3Z" fill="#fff" opacity=".14"/>',
          lamp(k, 'M30 160L42 158L41.6 161.6L30.4 163.4Z', '#ff3b4f'),
          lamp(k, 'M46 157.4L58 155.4L57.6 159L46.4 161Z', '#3d8bff'),
          seam('M44 133L44 172'),
          bolts([[24, 112], [63, 106], [24, 154], [63, 150]])
        );
      }
    },
    /* 2 타이탄 브레이커 — 노랑·검정 중장비 (궤도: 종아리, 장비: 유압 집게) */
    {
      a: '#efb300', e: '#ffae2b', pecM: 'S', foreM: 'A', shinM: 'S', front: true,
      head: function (k) {
        return cat(
          flat(k, '92,8 108,8 108,11 92,11', k.D, 1),
          lamp(k, 'M94.5 8.2Q94.5 2.5 100 2.5Q105.5 2.5 105.5 8.2Z', '#ffae2b', 'M97.2 6Q97.6 4.2 99.6 4L99.6 6Z'),
          plate(k, '80,10 120,10 123,20 121,44 112,50 88,50 79,44 77,20', k.A, { d: 2 }),
          '<path d="M80.5 13.5L119.5 13.5L120.4 18.5L79.6 18.5Z" fill="' + k.c.hazard() + '"' + k.th + '/>',
          flat(k, '84,22 116,22 115,33 85,33', k.GL, 1),
          lamp(k, 'M87 25.6L113 25.6L112 29.6L88 29.6Z', k.R.e, 'M90 26.9L110 26.9L109.6 27.9L90.4 27.9Z'),
          '<path d="M86 23L94 23L89 32L86 32Z" fill="#fff" opacity=".1"/>',
          plate(k, '85,34 115,34 113,46 87,46', k.S, { d: 1.6 }),
          vent(89.5, 37, 21, 1.6, 3, 3),
          bolts([[81.5, 24], [118.5, 24], [81.5, 40], [118.5, 40]])
        );
      },
      chest: function (k) {
        return cat(
          plate(k, '84,59 116,59 114,80 86,80', k.D, { d: 1.4 }),
          flat(k, '87,62 113,62 111.6,77 88.4,77', k.GL, 1),
          '<path d="M89 63L97 63L91.5 76L89.5 76Z" fill="#fff" opacity=".12"/>',
          '<path d="M66 96L134 96L131.5 105L68.5 105Z" fill="' + k.c.hazard() + '"' + k.th + '/>',
          bolts([[71, 100.5], [129, 100.5]]),
          both(function (f) { return f.t(piston(68, 66, 80, 88)); })
        );
      },
      pad: function (k, f) {
        return cat(
          plate(k, f.p('18,82 44,90 42,102 20,96'), k.S, { d: 1.6 }),
          plate(k, f.p('64,50 40,40 15,50 9,78 22,97 50,91 62,72'), k.A, { d: 3 }),
          f.t('<path d="M19 52L40 43L47 46.5L25 56.5Z" fill="' + k.c.hazard() + '"' + k.th + '/>'),
          f.t(bolts([[20, 74], [30, 90], [50, 86]])),
          f.t(piston(28, 94, 40, 116))
        );
      },
      calfFront: function (k, f) {
        var d = '';
        for (var y = 204; y < 242; y += 4.6) d += 'M45.4 ' + n1(y) + 'h11.2v2.2h-11.2Z';
        return cat(B(f.t('<rect x="44" y="200" width="14" height="46" rx="5" fill="#15181e"' + k.ol + '/>')),
          f.t('<path d="' + d + '" fill="#3c4350"/>'), f.t(bolts([[51, 204, 2], [51, 242, 2]])));
      },
      shinDet: function (k, f) { return f.t('<path d="M60 206L90 202L91.5 208L61 212Z" fill="' + k.c.hazard() + '"' + k.th + '/>'); },
      gear: function (k) {
        return cat(
          plate(k, '162,164 180,159 193,203 177,210', k.A, { d: 2.2 }),
          '<path d="M165 175L180 170.6L182 177L167 181.4Z" fill="' + k.c.hazard() + '"' + k.th + '/>',
          piston(183, 166, 194, 200),
          plate(k, '170,204 192,199 195,212 173,217', k.D, { d: 1.4 }),
          plate(k, '173,215 184,214 182,230 174,245 167,241 171,228', k.S, { d: 1.5 }),
          plate(k, '186,213 195,211 197,228 192,245 186,243 188,228', k.S, { d: 1.5 }),
          B('<circle cx="184" cy="208" r="5" fill="' + k.D.face + '"' + k.ol + '/>'),
          bolts([[184, 208, 1.6]])
        );
      }
    },
    /* 3 에어 블레이드 — 은백색 전투기 (추진기: 종아리, 장비: 날개 칼날) */
    {
      a: '#d6dee9', e: '#7fe6ff', st: '#2f8cff', gr: [-10, -10, 220, 280],
      head: function (k) {
        var st = k.R.st;
        return cat(
          both(function (f) { return cat(plate(k, f.p('84,24 70,7 75,6 90,20'), k.A, { d: 1.1, th: 1 }), f.t('<path d="M70 7L75 6L76.8 8.4L71.8 9.6Z" fill="' + st + '"/>')); }),
          plate(k, '100,8 112,12 119,24 116,34 100,30 84,34 81,24 88,12', k.A, { d: 2 }),
          '<path d="M98.3 9L101.7 9L101.3 28.5L98.7 28.5Z" fill="' + st + '"/>',
          both(function (f) { return cat(plate(k, f.p('80,26 86,30 86,42 79,40'), k.D, { d: 1, th: 1 }), f.t(vent(80.6, 31, 4, 1, 3, 2.6))); }),
          flat(k, '86,29 114,29 111,37 89,37', k.GOLD, 1),
          lamp(k, 'M89 31.6L111 31.6L109.5 34.6L90.5 34.6Z', k.R.e, 'M92 32.7L108 32.7L107.6 33.6L92.4 33.6Z'),
          plate(k, '88,37 112,37 109,46 100,50 91,46', k.S, { d: 1.5 }),
          vent(93.5, 40, 13, 1.2, 3, 2.3),
          both(function (f) { return f.t('<path d="M82 40L88 42L88.5 46L83 44Z" fill="' + st + '"/>'); })
        );
      },
      chest: function (k) {
        return cat(
          plate(k, '92,58 108,58 110,80 100,94 90,80', k.D, { d: 1.3 }),
          flat(k, '94.6,61 105.4,61 107,79 100,89 93,79', k.GOLD, 1),
          '<path d="M95.5 62L99.5 62L96 84L94.5 79Z" fill="#fff" opacity=".22"/>',
          both(function (f) { return cat(plate(k, f.p('66,96 82,98 81,109 68,107'), k.D, { d: 1.2, th: 1 }), f.t(vent(69, 100, 10, 1.1, 3, 2.6))); }),
          both(function (f) { return f.t('<path d="M58 71L92 81L92 85L60 75.5Z" fill="' + k.R.st + '"/>'); })
        );
      },
      calfBack: function (k, f) {
        return cat(plate(k, f.p('55,212 46,216 46,236 57,236'), k.D, { d: 1.2 }), f.t(lamp(k, 'M46.5 236.5L56.5 236.5L55 241L48 241Z', k.R.e)));
      },
      shinDet: function (k, f) { return f.t('<path d="M60 210L90 205.5L90.8 209.5L61 214Z" fill="' + k.R.st + '"/>'); },
      gear: function (k) {
        return cat(
          both(function (f) {
            return cat(plate(k, f.p('74,56 32,24 5,5 2,15 20,42 15,58 46,72'), k.A, { d: 2.4 }),
              plate(k, f.p('5,5 2,15 12,29 16,22'), k.S, { d: 1, th: 1 }),
              f.t('<path d="M10 13L70 55" stroke="' + k.R.st + '" stroke-width="2.6"/>'),
              f.t(seam('M22 42L48 60M18 56L44 68')),
              plate(k, f.p('26,60 40,66 36,82 22,76'), k.D, { d: 1.2, th: 1 }),
              f.t(lamp(k, 'M22.4 77L35.6 82.6L34.4 85.4L21.4 80Z', k.R.e)));
          }),
          lamp(k, 'M2.6 14.6L5 5.4L7.4 7.8L4.8 17Z', '#ff4d4d'),
          lamp(k, 'M197.4 14.6L195 5.4L192.6 7.8L195.2 17Z', '#3dff8a')
        );
      }
    },
    /* 4 레스큐 랜서 — 초록 소방 장갑차 (바퀴: 종아리, 장비: 사다리 창) */
    {
      a: '#1d9a52', e: '#ffd54a', foreM: 'A',
      head: function (k) {
        return cat(
          plate(k, '84,10 116,10 122,22 120,30 80,30 78,22', k.A, { d: 2 }),
          '<path d="M79.4 24.5L120.6 24.5L121.3 27.5L78.7 27.5Z" fill="#ffd54a"/>',
          plate(k, '95,5 105,5 106,18 100,23 94,18', k.S, { d: 1.2, th: 1 }),
          lamp(k, 'M98 9L102 9L102 13L98 13Z', '#ff9a2a'),
          plate(k, '72,28 128,28 130,34 70,34', k.D, { d: 1.2, th: 1 }),
          both(function (f) { return plate(k, f.p('78,34 86,35 87,47 80,45'), k.S, { d: 1, th: 1 }); }),
          flat(k, '84,34 116,34 114,41 86,41', k.GL, 1),
          lamp(k, 'M87 36.2L113 36.2L111.6 39.2L88.4 39.2Z', k.R.e, 'M90 37.2L110 37.2L109.6 38.1L90.4 38.1Z'),
          plate(k, '87,41 113,41 111,49 100,54 89,49', k.S, { d: 1.5 }),
          '<path d="' + cp(95, 46, 1.6) + cp(100, 47.6, 1.6) + cp(105, 46, 1.6) + '" fill="#05080d"/>'
        );
      },
      chest: function (k) {
        return cat(
          plate(k, '89,58 111,58 112,84 100,93 88,84', k.D, { d: 1.4 }),
          '<path d="' + slits(91.5, 62, 17, 1.7, 6, 3.4) + '" fill="' + k.CH + '"/>',
          both(function (f) { return f.t(lamp(k, 'M68 80L86 84.5L85 89L70 86.5Z', '#fff6d6', 'M71.5 82.2L83 84.9L82.7 86L71.8 83.6Z')); }),
          both(function (f) { return f.t('<path d="M65 101L91 104.5L90.6 108.5L66 105Z" fill="#ffd54a"/>'); })
        );
      },
      calfBack: function (k, f) { return B(f.t(wheel(k, 49, 222, 14, null))); },
      shinDet: function (k, f) {
        return cat(f.t('<path d="M57.5 216L93 211.5L93.8 216L58.5 220.5Z" fill="#ffd54a"/>'), f.t('<path d="M58 218.2L93.4 213.7" stroke="#eef2f8" stroke-width="1.1"/>'));
      },
      gear: function (k) {
        var rung = '', brass = k.c.mat('#c99a3e');
        for (var y = 26; y <= 108; y += 9) rung += 'M144 ' + y + 'h16v2.6h-16Z';
        return [{
          g: 'rotate(14 152 112)', items: cat(
            plate(k, '137,16 144,16 144,118 137,118', k.S, { d: 1.1, th: 1 }),
            plate(k, '160,16 167,16 167,118 160,118', k.S, { d: 1.1, th: 1 }),
            B('<path d="' + rung + '" fill="' + k.CH + '"' + k.th + '/>'),
            plate(k, '133,8 171,8 168,18 136,18', k.A, { d: 1.4, th: 1 }),
            plate(k, '148,0 156,0 160,9 144,9', brass, { d: 1, th: 1 }),
            lamp(k, 'M137 19.5L144 19.5L144 22.5L137 22.5ZM160 19.5L167 19.5L167 22.5L160 22.5Z', '#ff9a2a')
          )
        }];
      }
    },
    /* 5 팬텀 노바 — 보라·검정 스텔스 우주 기체 (장비: 각진 스텔스 날개) */
    {
      a: '#302f3e', e: '#c58cff', steel: '#5c6172', dark: '#2a2e38', foreM: 'A',
      head: function (k) {
        return cat(
          both(function (f) { return plate(k, f.p('85,20 70,3 74.5,2.5 90,15'), k.A, { d: 1, th: 1 }); }),
          plate(k, '100,7 114,13 120,26 114,38 100,34 86,38 80,26 86,13', k.A, { d: 2 }),
          plate(k, '100,8 106,15 100,29 94,15', k.S, { d: 1.1, th: 1 }),
          flat(k, '84,29 116,29 113,36 87,36', k.GL, 1),
          lamp(k, 'M86.5 31L113.5 31L111.6 34L88.4 34Z', k.R.e, 'M90 32L110 32L109.6 32.9L90.4 32.9Z'),
          plate(k, '88,36 112,36 109,46 100,51 91,46', k.D, { d: 1.5 }),
          vent(93, 39.5, 14, 1.2, 3, 2.4, '#000'),
          both(function (f) { return f.t(lamp(k, 'M84.5 38L87 39.5L88.5 47L86.5 46Z', k.R.e)); })
        );
      },
      chest: function (k) {
        return cat(
          plate(k, '93,58 107,58 108,82 100,90 92,82', k.D, { d: 1.4 }),
          lamp(k, 'M100 63L105.5 72L100 85L94.5 72Z', k.R.e, 'M100 67L102.6 72L100 79L97.4 72Z'),
          both(function (f) { return f.t(lamp(k, 'M62 71L89 79.5L89 82.2L63 74.4Z', k.R.e)); }),
          both(function (f) { return f.t(lamp(k, 'M68 103L90 106L89.7 108.2L68.4 105.4Z', k.R.e)); })
        );
      },
      shinDet: function (k, f) {
        return cat(f.t(lamp(k, 'M62 214L90 209.5L90.6 212L62.6 216.5Z', k.R.e)), f.t(lamp(k, 'M64 234L88 232L88.3 234.4L64.3 236.4Z', k.R.e)));
      },
      gear: function (k) {
        return both(function (f) {
          return cat(plate(k, f.p('74,58 26,8 21,14 38,50 16,60 58,88'), k.A, { d: 2.2 }),
            plate(k, f.p('62,66 42,40 38,44 52,74'), k.S, { d: 1, th: 1 }),
            f.t(lamp(k, 'M26 8L21 14L37.4 50.4L39.4 49.6Z', k.R.e)),
            f.t(lamp(k, 'M16 60L18.4 61.6L58.6 86.6L57.2 88Z', k.R.e)));
        });
      }
    }
  ];

  function robot(index, owned, opts) {
    opts = opts || {};
    var i = ((Math.floor(+index) || 0) % 6 + 6) % 6;
    var n = Math.max(0, Math.min(6, Math.floor(+owned) || 0));
    var hl = opts.highlight == null || opts.highlight === '' ? null : +opts.highlight;
    var c = new Ctx(), R = RS[i], k = kit(c, R), col = ROBOTS[i].color;
    var AL = 'rotate(7 52 68)', AR = 'rotate(-7 148 68)';
    var P = [[{ g: 'matrix(1.1 0 0 1.1 -10 -1.5)', items: R.head(k) }], torso(k), [{ g: AL, items: arm(k, 0) }], [{ g: AR, items: arm(k, 1) }], legs(k),
      R.on ? [{ g: R.on === 'L' ? AL : AR, items: R.gear(k) }] : R.gear(k)];
    var g = function (j) { return part(P[j], j, j < n, hl); };
    var done = n === 6;
    var s = (done ? '<ellipse cx="100" cy="130" rx="98" ry="126" fill="' + c.rad('au', [[0, col, .34], [.55, col, .12], [1, col, 0]]) + '" class="ga-aura"/>' : '') +
      '<ellipse cx="100" cy="255" rx="62" ry="4.5" fill="#000" opacity=".28"/>' +
      (R.front ? '' : g(5)) + g(4) + g(1) + g(2) + g(3) + g(0) + (R.front ? g(5) : '');
    return c.svg('0 0 200 260', 'ga-robot ga-' + ROBOTS[i].id + (done ? ' complete' : '') + (opts.cls ? ' ' + opts.cls : ''), sz(opts), s);
  }

  /* =========================================================
     4. 메달 — 금속 훈장
     ========================================================= */
  var MEDAL = { gold: ['#e8b923', '#4a2f00'], silver: ['#c5ced9', '#2a3240'], bronze: ['#c98348', '#3c1f08'] };
  function badge(text, opts) {
    opts = opts || {};
    var m = MEDAL[opts.color] || (opts.color && /^#/.test(opts.color) ? [opts.color, dk(opts.color, .7)] : MEDAL.gold);
    var col = m[0], ink = m[1], rib = opts.ribbon || '#2a6cd4';
    var c = new Ctx(), k = { ol: ' stroke="' + OL + '"', th: ' stroke="' + OL + '" stroke-width="1"' };
    var mt = c.mat(col), rb = c.mat(rib);
    var fc = c.rad('mf', [[0, lt(col, .35)], [.6, col], [1, dk(col, .35)]], [.38, .32, .75]);
    var raw = String(text == null ? '' : text).trim(), w = raw.split(/\s+/);
    var lines = raw.length > 3 && w.length > 1 ? [w[0], w.slice(1).join(' ')] : [raw];
    var L = Math.max.apply(null, lines.map(function (x) { return x.length; }));
    var fs = lines.length > 1 ? (L <= 2 ? 16 : L === 3 ? 13 : 10.5) : (L <= 1 ? 28 : L === 2 ? 24 : L === 3 ? 19 : L === 4 ? 15.5 : 12);
    var ys = lines.length > 1 ? [47 - fs * .08, 47 + fs * .98] : [47 + fs * .36];
    var txt = lines.map(function (ln, j) {
      var tx = '<text x="50" y="' + n2(ys[j]) + '" text-anchor="middle" font-family="\'Black Han Sans\',\'Jua\',\'Gowun Dodum\',sans-serif" font-size="' + fs + '" font-weight="700"';
      return tx + ' fill="#fff" fill-opacity=".5" transform="translate(0 1)">' + esc(ln) + '</text>' + tx + ' fill="' + ink + '">' + esc(ln) + '</text>';
    }).join('');
    var s = draw(cat(
      both(function (f) { return plate(k, f.p('30,64 21,108 33,100 41,110 51,70'), rb, { d: 1.8 }); }, 100),
      plate(k, '50,3 79,13 91,40 86,68 64,88 50,92 36,88 14,68 9,40 21,13', mt, { d: 4.5 })
    ), true) +
      '<path d="' + hexPts(50, 47, 30) + '" fill="' + dk(col, .45) + '"/>' +
      '<circle cx="50" cy="47.5" r="25" fill="' + fc + '" stroke="' + dk(col, .55) + '" stroke-width="1.2"/>' +
      '<circle cx="50" cy="47.5" r="21.5" fill="none" stroke="' + lt(col, .6) + '" stroke-opacity=".55" stroke-width=".8" stroke-dasharray="1.4 2.2"/>' +
      (raw ? txt : '<path d="' + star(50, 48, 14, 6) + '" fill="' + ink + '" opacity=".85"/>') +
      '<path d="M73 14L74.4 18.6L79 20L74.4 21.4L73 26L71.6 21.4L67 20L71.6 18.6Z" fill="#fff" opacity=".85"/>';
    return c.svg('0 0 100 112', 'ga-badge' + (opts.cls ? ' ' + opts.cls : ''), sz(opts), s, 1.6);
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

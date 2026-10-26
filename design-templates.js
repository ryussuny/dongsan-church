/* ===========================================================
   동산 디자인 스튜디오 — AI 없이 바로 쓰는 틀

   빈칸만 채우면 디자인 시스템(design-system.js) 색·글꼴로 바로 그려진다.
   크기 단위는 cqmin/cqw/cqh(장 크기에 비례)라 포스터·카드·슬라이드 어디에 넣어도 맞는다.
   build(v, fmt) 는 <style> + <section class="page">… 조각을 돌려준다.
   =========================================================== */
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function br(s) { return esc(String(s || '').trim()).replace(/\n/g, '<br>'); }
  function logo(dark) { return '<img class="lg" src="assets/logo/dongsan-logo' + (dark ? '-white' : '') + '.png" alt="동산감리교회">'; }
  /* 어두운 바탕 테마면 흰 로고 */
  function darkBg(themeId) { return themeId === 'night' || themeId === 'youth'; }
  /* 글 길이에 따라 글자 크기(cqmin)를 줄인다 */
  function fit(len, steps) { for (var i = 0; i < steps.length; i++) if (len <= steps[i][0]) return steps[i][1]; return steps[steps.length - 1][1]; }

  var T = [];

  /* ---------- 1. 예배·행사 안내 ---------- */
  T.push({
    id: 'worship', name: '예배·행사 안내', icon: '⛪', formats: ['poster', 'square', 'story', 'slide', 'bulletin'], format: 'poster',
    fields: [
      { k: 'kicker', label: '작은 머리말', ph: '2026 추수감사주일' },
      { k: 'title', label: '제목', ph: '감사로 드리는 예배', area: 1 },
      { k: 'sub', label: '한 줄 소개 (선택)', ph: '한 해의 은혜를 세어 보며 함께 감사드립니다' },
      { k: 'when', label: '일시', ph: '11월 1일(주일) 오전 11시' },
      { k: 'where', label: '장소', ph: '동산감리교회 본당' },
      { k: 'ref', label: '말씀 장·절 (선택 · 넣으면 본문이 저절로 채워져요)', ph: '시편 100:4', verse: 'verse' },
      { k: 'verse', label: '말씀 본문', ph: '장·절을 넣으면 개역개정 본문이 들어갑니다', area: 1 },
      { k: 'note', label: '덧붙임 (선택)', ph: '성만찬이 함께 있습니다' }
    ],
    build: function (v, fm, th) {
      var title = br(v.title || '감사로 드리는 예배');
      var tl = String(v.title || '').length;
      var ts = fit(tl, [[8, 12], [14, 10], [22, 8.4], [999, 7]]);
      var vs = fit(String(v.verse || '').length, [[60, 3.7], [110, 3.3], [170, 2.9], [999, 2.6]]);
      return '<style>' +
        '.w{position:absolute;inset:0;display:flex;flex-direction:column;padding:9cqmin 8cqmin 6cqmin}' +
        '.w .d1{position:absolute;right:-20cqmin;top:-20cqmin;width:72cqmin;height:72cqmin;border-radius:50%;border:2cqmin solid color-mix(in srgb,var(--accent) 38%,transparent)}' +
        '.w .d2{position:absolute;right:-4cqmin;top:-4cqmin;width:44cqmin;height:44cqmin;border-radius:50%;background:color-mix(in srgb,var(--accent2) 15%,transparent)}' +
        '.w .k{position:relative;font:700 3.3cqmin/1.3 var(--font-body);color:var(--accent);letter-spacing:.06em;display:flex;align-items:center;gap:2.4cqmin}' +
        '.w .k:after{content:"";flex:0 0 12cqmin;height:.45cqmin;background:var(--accent)}' +
        '.w h1{position:relative;font:900 ' + ts + 'cqmin/1.2 var(--font-title);margin-top:4cqmin;color:var(--ink)}' +
        '.w .s{margin-top:3cqmin;font:500 3.6cqmin/1.55 var(--font-body);color:var(--soft)}' +
        '.w .r{margin-top:auto}' +
        '.w .v{font:400 ' + vs + 'cqmin/1.75 var(--font-title);color:var(--ink);border-left:.9cqmin solid var(--accent);padding-left:3.6cqmin}' +
        '.w .v b{display:block;margin-top:1.2cqmin;font:700 2.9cqmin var(--font-body);color:var(--accent)}' +
        '.w dl{margin-top:5cqmin;padding-top:4cqmin;border-top:.3cqmin solid var(--line);display:grid;grid-template-columns:auto 1fr;gap:1.8cqmin 4cqmin;font:500 3.8cqmin/1.4 var(--font-body)}' +
        '.w dt{color:var(--accent);font-weight:700}' +
        '.w .n{margin-top:2.6cqmin;font:400 3.1cqmin/1.6 var(--font-body);color:var(--soft)}' +
        '.w .f{margin-top:5cqmin;display:flex;align-items:center;justify-content:space-between;gap:3cqmin;font:500 2.6cqmin var(--font-body);color:var(--soft)}' +
        '.w .lg{height:7.5cqmin;width:auto}' +
        '@container (orientation: landscape){' +
        '.w{display:grid;grid-template-columns:1.1fr 1fr;grid-template-rows:auto auto 1fr auto;column-gap:8cqmin;padding:9cqmin 8cqmin 6cqmin}' +
        '.w .k{grid-column:1;grid-row:1}.w h1{grid-column:1;grid-row:2}.w .s{grid-column:1;grid-row:3;align-self:start}' +
        '.w .r{grid-column:2;grid-row:1/4;margin-top:0;align-self:center}' +
        '.w .f{grid-column:1/3;grid-row:4}' +
        '.w .d1{right:auto;top:auto;left:-26cqmin;bottom:-34cqmin}.w .d2{right:auto;top:auto;left:-10cqmin;bottom:-22cqmin}}' +
        '</style>' +
        '<section class="page"><div class="w">' +
        '<div class="d1"></div><div class="d2"></div>' +
        (v.kicker ? '<div class="k">' + esc(v.kicker) + '</div>' : '') +
        '<h1>' + title + '</h1>' +
        (v.sub ? '<p class="s">' + br(v.sub) + '</p>' : '') +
        '<div class="r">' +
        (v.verse ? '<p class="v">“' + br(v.verse) + '”' + (v.ref ? '<b>' + esc(v.ref) + '</b>' : '') + '</p>' : '') +
        ((v.when || v.where) ? '<dl>' + (v.when ? '<dt>일시</dt><dd>' + esc(v.when) + '</dd>' : '') + (v.where ? '<dt>장소</dt><dd>' + esc(v.where) + '</dd>' : '') + '</dl>' : '') +
        (v.note ? '<p class="n">' + br(v.note) + '</p>' : '') +
        '</div>' +
        '<div class="f">' + logo(darkBg(th)) + '<span>' + esc(DS_CHURCH.address) + '</span></div>' +
        '</div></section>';
    }
  });

  /* ---------- 2. 말씀 카드 ---------- */
  T.push({
    id: 'verse', name: '말씀 카드', icon: '📖', formats: ['square', 'story', 'poster', 'slide', 'bulletin'], format: 'square', theme: 'dawn',
    fields: [
      { k: 'label', label: '머리말', ph: '오늘의 말씀' },
      { k: 'ref', label: '말씀 장·절', ph: '이사야 58:11', verse: 'text' },
      { k: 'text', label: '말씀 본문', ph: '장·절을 넣으면 개역개정 본문이 들어갑니다', area: 1 },
      { k: 'sub', label: '한 줄 묵상 (선택)', ph: '나는 하나님을 닮게 지음받은 귀한 사람입니다.' }
    ],
    build: function (v, fm, th) {
      var len = String(v.text || '').length;
      var ts = fit(len, [[30, 7.6], [60, 6.4], [100, 5.4], [150, 4.6], [220, 4], [999, 3.4]]);
      return '<style>' +
        '.vc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10cqmin 10cqmin 8cqmin}' +
        '.vc:before{content:"";position:absolute;inset:3.4cqmin;border:.35cqmin solid var(--line);pointer-events:none}' +
        '.vc .lb{font:700 3cqmin/1 var(--font-body);letter-spacing:.3em;color:var(--accent);padding-left:.3em}' +
        '.vc .q{font:700 16cqmin/1 var(--font-title);color:color-mix(in srgb,var(--accent) 45%,transparent);height:9cqmin;margin-top:4cqmin}' +
        '.vc .t{font:600 ' + ts + 'cqmin/1.7 var(--font-title);color:var(--ink);max-width:100%}' +
        '.vc .rf{margin-top:4.4cqmin;font:700 3.2cqmin var(--font-body);color:var(--accent);display:flex;align-items:center;gap:2cqmin}' +
        '.vc .rf:before,.vc .rf:after{content:"";width:6cqmin;height:.35cqmin;background:var(--accent)}' +
        '.vc .sb{margin-top:5cqmin;font:400 5.2cqmin/1.4 var(--font-hand);color:var(--soft)}' +
        '.vc .ch{position:absolute;bottom:6.4cqmin;left:0;right:0;font:500 2.4cqmin var(--font-body);letter-spacing:.2em;color:var(--soft)}' +
        '</style>' +
        '<section class="page"><div class="vc">' +
        (v.label ? '<div class="lb">' + esc(v.label) + '</div>' : '') +
        '<div class="q">“</div>' +
        '<p class="t">' + br(v.text || '말씀 본문을 넣어 주세요') + '</p>' +
        (v.ref ? '<div class="rf">' + esc(v.ref) + '</div>' : '') +
        (v.sub ? '<p class="sb">' + br(v.sub) + '</p>' : '') +
        '<div class="ch">' + esc(DS_CHURCH.name) + '</div>' +
        '</div></section>';
    }
  });

  /* ---------- 3. 교회 소식 (광고) ---------- */
  T.push({
    id: 'news', name: '교회 소식·광고', icon: '📢', formats: ['slide', 'square', 'story', 'poster'], format: 'slide',
    fields: [
      { k: 'title', label: '제목', ph: '교회 소식' },
      { k: 'date', label: '날짜 (선택)', ph: '2026년 11월 1일' },
      { k: 'items', label: '소식 — 한 줄에 하나씩, 「제목 | 설명」', ph: '추수감사 헌금 | 오늘 예배 때 드립니다\n이웃주민 식사 | 11월 8일(주일) 점심, 교육관\n다니엘 기도회 | 11월 9일부터 21일 새벽 6시', area: 1, rows: 6 }
    ],
    build: function (v, fm, th) {
      var lines = String(v.items || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (!lines.length) lines = ['소식 제목 | 설명을 한 줄로 적어 주세요'];
      var per = { slide: 3, square: 4, story: 6, poster: 7 }[fm.id] || 4;
      var pages = [];
      for (var i = 0; i < lines.length; i += per) pages.push(lines.slice(i, i + per));
      var css = '<style>' +
        '.nw{position:absolute;inset:0;display:flex;flex-direction:column;padding:7cqmin 8cqmin 5cqmin}' +
        '.nw .hd{display:flex;align-items:baseline;justify-content:space-between;gap:3cqmin;padding-bottom:3cqmin;border-bottom:.6cqmin solid var(--accent)}' +
        '.nw h1{font:900 8cqmin/1.1 var(--font-title);color:var(--ink)}' +
        '.nw .dt{font:500 3cqmin var(--font-body);color:var(--soft);white-space:nowrap}' +
        '.nw ol{list-style:none;flex:1;display:flex;flex-direction:column;justify-content:space-evenly}' +
        '.nw li{display:grid;grid-template-columns:auto 1fr;column-gap:4cqmin;align-items:baseline;padding:2.2cqmin 0;border-bottom:.3cqmin solid var(--line)}' +
        '.nw li:last-child{border-bottom:0}' +
        '.nw .no{font:900 6.4cqmin/1 var(--font-title);color:var(--accent);min-width:7cqmin}' +
        '.nw .tt{font:700 4.8cqmin/1.3 var(--font-body);color:var(--ink)}' +
        '.nw .ds{grid-column:2;margin-top:.8cqmin;font:400 3.6cqmin/1.5 var(--font-body);color:var(--soft)}' +
        '.nw .ft{display:flex;align-items:center;justify-content:space-between;font:500 2.6cqmin var(--font-body);color:var(--soft)}' +
        '.nw .lg{height:6cqmin;width:auto}' +
        '</style>';
      var n = 0;
      return css + pages.map(function (pg, pi) {
        return '<section class="page"><div class="nw"><div class="hd"><h1>' + esc(v.title || '교회 소식') + '</h1>' +
          (v.date ? '<span class="dt">' + esc(v.date) + '</span>' : '') + '</div><ol>' +
          pg.map(function (l) {
            var p = l.split('|'); n++;
            return '<li><span class="no">' + (n < 10 ? '0' + n : n) + '</span><span class="tt">' + esc(p[0].trim()) + '</span>' +
              (p[1] ? '<span class="ds">' + esc(p.slice(1).join('|').trim()) + '</span>' : '') + '</li>';
          }).join('') + '</ol><div class="ft">' + logo(darkBg(th)) + '<span>' + (pages.length > 1 ? (pi + 1) + ' / ' + pages.length : '') + '</span></div></div></section>';
      }).join('');
    }
  });

  /* ---------- 4. 찬양 가사 ---------- */
  T.push({
    id: 'lyrics', name: '찬양 가사', icon: '🎵', formats: ['slide', 'square', 'story'], format: 'slide', theme: 'night',
    fields: [
      { k: 'title', label: '곡 제목', ph: '은혜' },
      { k: 'lyrics', label: '가사 — 빈 줄로 장을 나눠요', ph: '첫째 장 첫 줄\n첫째 장 둘째 줄\n\n둘째 장 첫 줄\n둘째 장 둘째 줄', area: 1, rows: 8 }
    ],
    build: function (v, fm, th) {
      var parts = String(v.lyrics || '').replace(/\r/g, '').split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (!parts.length) parts = ['가사를 넣어 주세요\n빈 줄을 두면 다음 장으로 넘어갑니다'];
      var css = '<style>' +
        '.ly{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:8cqmin 9cqmin}' +
        '.ly:after{content:"";position:absolute;left:0;right:0;bottom:0;height:1.2cqmin;background:linear-gradient(90deg,var(--accent),var(--accent2))}' +
        '.ly p{font-family:var(--font-title);font-weight:700;color:var(--ink);line-height:1.55}' +
        '.ly .tt{position:absolute;left:5cqmin;bottom:4.4cqmin;font:500 2.6cqmin var(--font-body);color:var(--soft)}' +
        '.ly .pg{position:absolute;right:5cqmin;bottom:4.4cqmin;font:500 2.6cqmin var(--font-body);color:var(--soft)}' +
        '</style>';
      return css + parts.map(function (p, i) {
        var ls = p.split('\n'), longest = 0;
        ls.forEach(function (l) { if (l.length > longest) longest = l.length; });
        var byW = (fm.w >= fm.h ? 150 : 84) / Math.max(longest, 6);
        var byH = 60 / (ls.length * 1.55);
        var size = Math.max(3.6, Math.min(10, byW, byH));
        return '<section class="page"><div class="ly"><p style="font-size:' + size.toFixed(1) + 'cqmin">' + br(p) + '</p>' +
          (v.title ? '<span class="tt">' + esc(v.title) + '</span>' : '') +
          '<span class="pg">' + (i + 1) + ' / ' + parts.length + '</span></div></section>';
      }).join('');
    }
  });

  /* ---------- 5. 새가족 환영 ---------- */
  T.push({
    id: 'welcome', name: '새가족 환영', icon: '🤝', formats: ['story', 'square', 'poster'], format: 'story',
    fields: [
      { k: 'name', label: '받는 분 (선택)', ph: '○○○ 성도님' },
      { k: 'msg', label: '환영 인사', ph: '동산감리교회 가족이 되신 것을\n진심으로 환영하고 축복합니다', area: 1 },
      { k: 'ref', label: '말씀 장·절', ph: '로마서 15:7', verse: 'verse' },
      { k: 'verse', label: '말씀 본문', ph: '장·절을 넣으면 개역개정 본문이 들어갑니다', area: 1 }
    ],
    build: function (v, fm, th) {
      var times = DS_CHURCH.worship.slice(0, 1).concat(DS_CHURCH.worship.slice(3, 5));
      return '<style>' +
        '.wc{position:absolute;inset:0;display:flex;flex-direction:column;padding:9cqmin 8cqmin 6cqmin}' +
        '.wc .tp{margin:-9cqmin -8cqmin 0;padding:9cqmin 8cqmin 13cqmin;background:var(--accent);clip-path:ellipse(90% 100% at 50% 0);color:var(--on-accent);text-align:center}' +
        '.wc .hi{font:400 6cqmin var(--font-hand);opacity:.9}' +
        '.wc h1{font:900 11cqmin/1.15 var(--font-title);margin-top:1cqmin}' +
        '.wc .nm{margin-top:2cqmin;font:700 4.4cqmin var(--font-body)}' +
        '.wc .ms{margin-top:6cqmin;text-align:center;font:500 4.4cqmin/1.6 var(--font-body);color:var(--ink)}' +
        '.wc .v{margin-top:6cqmin;text-align:center;font:400 3.6cqmin/1.7 var(--font-title);color:var(--soft)}' +
        '.wc .v b{display:block;margin-top:1cqmin;font:700 2.9cqmin var(--font-body);color:var(--accent)}' +
        '.wc ul{list-style:none;margin-top:auto;border-top:.3cqmin solid var(--line);padding-top:3.4cqmin;display:grid;gap:1.4cqmin;font:500 3.3cqmin var(--font-body);color:var(--ink)}' +
        '.wc li{display:flex;justify-content:space-between;gap:3cqmin}.wc li span{color:var(--soft)}' +
        '.wc .ft{margin-top:4cqmin;display:flex;flex-direction:column;align-items:center;gap:1.4cqmin;font:400 2.5cqmin var(--font-body);color:var(--soft)}' +
        '.wc .lg{height:8cqmin;width:auto}' +
        '@container (max-height: 600px){.wc ul{display:none}.wc .ft{margin-top:auto}}' +
        '</style>' +
        '<section class="page"><div class="wc"><div class="tp">' +
        '<div class="hi">어서 오세요</div><h1>환영합니다</h1>' + (v.name ? '<div class="nm">' + esc(v.name) + '</div>' : '') + '</div>' +
        '<p class="ms">' + br(v.msg || '동산감리교회 가족이 되신 것을\n진심으로 환영하고 축복합니다') + '</p>' +
        (v.verse ? '<p class="v">“' + br(v.verse) + '”' + (v.ref ? '<b>' + esc(v.ref) + '</b>' : '') + '</p>' : '') +
        '<ul>' + times.map(function (w) { return '<li>' + esc(w[0]) + '<span>' + esc(w[1]) + '</span></li>'; }).join('') + '</ul>' +
        '<div class="ft">' + logo(darkBg(th)) + '<span>' + esc(DS_CHURCH.address) + '</span></div>' +
        '</div></section>';
    }
  });

  /* ---------- 6. 현수막 ---------- */
  T.push({
    id: 'banner', name: '현수막', icon: '🎌', formats: ['banner'], format: 'banner',
    fields: [
      { k: 'kicker', label: '작은 머리말 (선택)', ph: '2026 추수감사주일' },
      { k: 'title', label: '큰 글씨', ph: '감사함으로 그의 문에 들어가며' },
      { k: 'sub', label: '오른쪽 작은 글씨 (선택)', ph: '11월 1일(주일) 오전 11시' }
    ],
    build: function (v, fm, th) {
      var tl = Math.max(4, String(v.title || '감사함으로 그의 문에 들어가며').length);
      var ts = 'min(44cqh,' + (60 / tl).toFixed(2) + 'cqw)';
      return '<style>' +
        '.bn{position:absolute;inset:0;display:flex;align-items:center;gap:5cqw;padding:0 4cqw 0 0}' +
        '.bn .bar{align-self:stretch;width:3.4cqw;background:linear-gradient(var(--accent),var(--accent2))}' +
        '.bn .mid{flex:1;min-width:0}' +
        '.bn .k{font:700 11cqh/1.2 var(--font-body);color:var(--accent);letter-spacing:.06em}' +
        '.bn h1{font:900 ' + ts + '/1.15 var(--font-title);color:var(--ink);white-space:nowrap}' +
        '.bn .rt{display:flex;flex-direction:column;align-items:flex-end;gap:5cqh;text-align:right;font:700 10cqh/1.3 var(--font-body);color:var(--soft)}' +
        '.bn .lg{height:22cqh;width:auto}' +
        '</style>' +
        '<section class="page"><div class="bn"><div class="bar"></div><div class="mid">' +
        (v.kicker ? '<div class="k">' + esc(v.kicker) + '</div>' : '') +
        '<h1>' + esc(v.title || '감사함으로 그의 문에 들어가며') + '</h1></div>' +
        '<div class="rt">' + (v.sub ? '<span>' + esc(v.sub) + '</span>' : '') + logo(darkBg(th)) + '</div>' +
        '</div></section>';
    }
  });

  window.DS_TEMPLATES = T;
})();

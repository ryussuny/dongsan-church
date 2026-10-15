/* ===========================================================
   본문 장을 유튜브 낭독으로 듣기 — 성인용 · 큰 글씨 · 청년 화면

   - WORD_VIDEO 에 「책 장」 → 유튜브 영상 주소(또는 영상 번호)를 적어 두면
     그 장은 앱 안에서 바로 재생한다 (유튜브 공식 퍼가기 · youtube-nocookie).
   - 적어 두지 않은 장은 @prs 채널 안에서 그 장을 찾아 새 창으로 연다.
   소리 파일을 우리 홈페이지에 옮겨 담지 않는다 — 유튜브에서 틀거나 그쪽으로 보낸다.
   =========================================================== */
var WORD_VIDEO_CHANNEL = '@prs';
var WORD_VIDEO = {
  /* 예) '창세기 1': 'https://www.youtube.com/watch?v=XXXXXXXXXXX', */
};

var WordVideo = (function () {
  var css = false;
  function style() {
    if (css) return; css = true;
    var s = document.createElement('style');
    s.textContent =
      '.wv{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
      '.wv a,.wv button{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:999px;' +
      'border:1px solid rgba(204,0,0,.28);background:rgba(204,0,0,.07);color:inherit;font:inherit;font-size:14px;font-weight:700;' +
      'text-decoration:none;cursor:pointer}' +
      '.wv a i,.wv button i{font-style:normal;color:#cc0000}' +
      '.wv-frame{position:relative;width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#000;margin-top:10px}' +
      '.wv-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}' +
      '.wv-note{width:100%;font-size:11.5px;opacity:.65;margin-top:2px}';
    document.head.appendChild(s);
  }
  function idOf(v) {
    var m = String(v || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/) || String(v || '').match(/^([\w-]{11})$/);
    return m ? m[1] : '';
  }
  /* 시편 23 → 시편 23편, 그 밖 → 창세기 1장 */
  function label(book, ch) { return book + ' ' + ch + (book === '시편' ? '편' : '장'); }
  function chapters(passage) {
    var r = WordData.parseRef(passage); if (!r) return [];
    var out = [], a = +r.chapter, b = +(r.toChapter || r.chapter);
    for (var c = a; c <= b && out.length < 4; c++) out.push({ book: r.book, ch: c });
    return out;
  }
  function searchUrl(book, ch) {
    return 'https://www.youtube.com/' + WORD_VIDEO_CHANNEL + '/search?query=' + encodeURIComponent(label(book, ch));
  }
  /* el 자리에 장마다 단추를 그린다 */
  function mount(el, passage) {
    if (!el) return;
    style();
    var list = chapters(passage);
    if (!list.length) { el.innerHTML = ''; return; }
    var hasAny = false;
    el.innerHTML = '<div class="wv">' + list.map(function (x) {
      var id = idOf(WORD_VIDEO[x.book + ' ' + x.ch]);
      if (id) { hasAny = true; return '<button type="button" data-id="' + id + '"><i>▶</i> ' + label(x.book, x.ch) + ' 낭독 듣기</button>'; }
      return '<a href="' + searchUrl(x.book, x.ch) + '" target="_blank" rel="noopener"><i>▶</i> 유튜브에서 ' + label(x.book, x.ch) + ' 듣기</a>';
    }).join('') + (hasAny ? '' : '<div class="wv-note">유튜브 ' + WORD_VIDEO_CHANNEL + ' 채널에서 이 장을 찾아 열어 드려요.</div>') + '</div>';
    el.querySelectorAll('button[data-id]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (window.WordVoice && WordVoice.playing) WordVoice.stop();
        var f = el.querySelector('.wv-frame');
        if (f && f.dataset.id === b.dataset.id) { f.remove(); return; }   /* 다시 누르면 닫는다 */
        if (f) f.remove();
        f = document.createElement('div'); f.className = 'wv-frame'; f.dataset.id = b.dataset.id;
        f.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + b.dataset.id + '?autoplay=1&rel=0&playsinline=1" ' +
          'title="성경 낭독" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
        el.appendChild(f);
      });
    });
  }
  return { mount: mount, searchUrl: searchUrl, idOf: idOf };
})();

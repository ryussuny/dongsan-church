/* ===========================================================
   「휴대폰에 앱으로 설치하기」 단추 — 말씀 화면들이 함께 쓴다

   - <div data-install-slot></div> 자리에 큰 설치 단추를 그린다.
     data-install 이 붙은 단추·링크도 똑같이 움직인다.
   - 누르면
       · 갤럭시(크롬·삼성 인터넷)처럼 바로 설치할 수 있으면 그 자리에서 설치 창을 띄운다.
       · 카카오톡 안이면 휴대폰의 인터넷 앱으로 이 화면을 다시 열고, 거기서 이어서 안내한다.
       · 아이폰처럼 바로 설치가 안 되면 화면 아래에 큰 글씨로 따라 할 차례를 띄운다.
         (아이폰은 애플이 막아 두어 「홈 화면에 추가」를 사람이 눌러야 한다)
   - 이미 설치해서 아이콘으로 열었으면 단추를 감춘다 (data-install-box 칸째).
   - 주소 끝이 #install 이면 열리자마자 안내를 띄운다 (카톡에서 넘어올 때).
   head 에서 일찍 불러야 휴대폰이 보내는 설치 신호를 놓치지 않는다.
   =========================================================== */
(function () {
  var deferred = null, sheet = null;
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var isKakao = /KAKAOTALK/i.test(ua);
  /* 네이버·밴드·인스타그램·페이스북·라인 같은 앱 안 화면 — 여기서는 설치가 안 된다 */
  var isInApp = isKakao || /NAVER|BAND\/|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp|; wv\)/i.test(ua);
  var isSafari = isIOS && !isInApp && !/CriOS|FxiOS|EdgiOS|Whale/i.test(ua);
  var isSamsung = /SamsungBrowser/i.test(ua);
  var GUIDE = 'install.html';

  function installed() {
    return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }
  function all(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  function hide() { all('[data-install],[data-install-box],[data-install-slot]', function (el) { el.style.display = 'none'; }); }

  var css = false;
  function style() {
    if (css) return; css = true;
    var s = document.createElement('style');
    s.textContent =
      '.ib-bar{display:flex;align-items:center;gap:12px;width:100%;margin:10px 0 14px;padding:14px 16px;border:none;border-radius:18px;cursor:pointer;' +
      'background:linear-gradient(135deg,#8f4531,#b3593f);color:#fff;font-family:inherit;text-align:left;box-shadow:0 4px 0 rgba(0,0,0,.18);-webkit-tap-highlight-color:transparent}' +
      '.ib-bar:active{transform:translateY(2px);box-shadow:0 2px 0 rgba(0,0,0,.18)}' +
      '.ib-bar img{flex:none;width:46px;height:46px;border-radius:12px;box-shadow:0 2px 6px rgba(0,0,0,.25)}' +
      '.ib-bar b{display:block;font-size:19px;font-weight:900;line-height:1.3}' +
      '.ib-bar small{display:block;font-size:14px;opacity:.92;margin-top:2px;line-height:1.4}' +
      '.ib-bar .ib-go{margin-left:auto;flex:none;font-size:15px;font-weight:900;background:#fff;color:#8f4531;border-radius:999px;padding:8px 14px}' +
      '.ib-ov{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center}' +
      '.ib-sh{width:100%;max-width:560px;max-height:88vh;overflow:auto;background:#fffaf2;color:#231d17;border-radius:24px 24px 0 0;' +
      'padding:20px 18px calc(22px + env(safe-area-inset-bottom));font-family:"Noto Sans KR",sans-serif;font-size:19px;line-height:1.7;word-break:keep-all;' +
      'box-shadow:0 -8px 30px rgba(0,0,0,.25);animation:ibUp .25s ease-out}' +
      '@keyframes ibUp{from{transform:translateY(40px);opacity:0}}' +
      '.ib-sh h3{font-size:23px;line-height:1.35;margin:0 0 10px;font-weight:900}' +
      '.ib-sh ol{list-style:none;margin:0;padding:0}' +
      '.ib-sh li{display:flex;gap:12px;align-items:flex-start;background:#fff;border:2px solid #e6d3b4;border-radius:16px;padding:12px 14px;margin-bottom:10px}' +
      '.ib-sh li i{flex:none;width:36px;height:36px;border-radius:50%;background:#8f4531;color:#fff;font-style:normal;font-weight:900;font-size:19px;display:flex;align-items:center;justify-content:center}' +
      '.ib-sh .k{display:inline-block;padding:0 10px;border-radius:10px;background:#fff1b8;border:2px solid #e0b400;font-weight:900;white-space:nowrap}' +
      '.ib-sh .note{font-size:16px;color:#4a3f33;background:#fbf1e3;border-radius:12px;padding:10px 12px;margin:6px 0 10px}' +
      '.ib-sh .ib-btn{display:flex;align-items:center;justify-content:center;width:100%;min-height:60px;margin-top:10px;border:none;border-radius:16px;' +
      'background:#8f4531;color:#fff;font-family:inherit;font-size:21px;font-weight:900;cursor:pointer;text-decoration:none}' +
      '.ib-sh .ib-btn.sub{background:#fff;color:#8f4531;border:2px solid #8f4531;font-size:18px;min-height:52px}' +
      '.ib-sh .ib-x{float:right;width:44px;height:44px;margin:-6px -6px 0 0;border:none;border-radius:50%;background:#f1e4d0;color:#231d17;font-size:22px;cursor:pointer}' +
      /* 아이폰 사파리 — 아래쪽 공유 단추를 가리키는 화살표 */
      '.ib-arrow{position:fixed;left:50%;bottom:calc(6px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:10000;font-size:44px;line-height:1;' +
      'color:#ffd54a;text-shadow:0 2px 6px rgba(0,0,0,.6);animation:ibB 1s infinite;pointer-events:none}' +
      '@keyframes ibB{50%{transform:translate(-50%,10px)}}' +
      '@media (prefers-reduced-motion:reduce){.ib-arrow,.ib-sh{animation:none}}' +
      '[data-theme="dark"] .ib-sh{background:#24201b;color:#f3ece2}' +
      '[data-theme="dark"] .ib-sh li{background:#2c261f;border-color:#433a30}' +
      '[data-theme="dark"] .ib-sh .k{background:#4a3d17;border-color:#b38f00}' +
      '[data-theme="dark"] .ib-sh .note{background:#2c261f;color:#d6cbbb}' +
      '[data-theme="dark"] .ib-sh .ib-btn.sub{background:transparent;color:#e7a487;border-color:#e7a487}' +
      '[data-theme="dark"] .ib-sh .ib-x{background:#433a30;color:#f3ece2}' +
      '@media print{.ib-bar,.ib-ov,.ib-arrow{display:none!important}}';
    document.head.appendChild(s);
  }

  /* 큰 설치 단추 그리기 */
  function slots() {
    if (installed()) { hide(); return; }
    style();
    all('[data-install-slot]', function (el) {
      if (el.firstChild) return;
      el.innerHTML = '<button type="button" class="ib-bar" data-install>' +
        '<img src="icons/icon-192.png" alt="">' +
        '<span><b>휴대폰에 앱으로 설치하기</b><small data-install-ready="누르고 「설치」만 누르면 끝나요">첫 화면에 「동산 말씀」 아이콘이 생겨요</small></span>' +
        '<span class="ib-go">설치</span></button>';
    });
    refresh();
  }
  function refresh() {
    all('[data-install]', function (el) {
      var t = el.querySelector('[data-install-ready]');
      if (!t) return;
      if (t.dataset.installOrig == null) t.dataset.installOrig = t.textContent;
      t.textContent = deferred ? t.getAttribute('data-install-ready') : t.dataset.installOrig;
    });
    /* 안내 창이 떠 있는 동안 설치 신호가 오면 바로 설치 단추를 보여 준다 */
    if (sheet && deferred) openSheet();
  }

  function closeSheet() {
    if (sheet) { sheet.remove(); sheet = null; }
    var a = document.querySelector('.ib-arrow'); if (a) a.remove();
  }
  function here() { return location.href.split('#')[0]; }
  /* 카톡·네이버 앱 안에서 → 휴대폰의 인터넷 앱으로 이 화면을 다시 연다 */
  function openOutside() {
    var url = here() + '#install';
    if (isKakao) { location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url); return; }
    if (isAndroid) {
      location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' +
        encodeURIComponent(url) + ';end';
    }
  }
  function body() {
    var guide = '<a class="ib-btn sub" href="' + GUIDE + '">🖼 그림으로 자세히 보기</a>';
    if (deferred) return '<h3>📲 「동산 말씀」 설치</h3>' +
      '<p>아래 단추를 누르고, 나오는 창에서 <span class="k">설치</span> 를 누르면 끝입니다.</p>' +
      '<button type="button" class="ib-btn" data-ib="prompt">📲 지금 설치하기</button>';
    if (isInApp) return '<h3>⚠️ 이 앱 안에서는 설치가 안 돼요</h3>' +
      '<p>' + (isKakao ? '카카오톡' : '지금 앱') + ' 안에서 열려 있습니다. 아래 단추를 누르면 <b>' + (isIOS ? '사파리' : '인터넷 앱') + '</b>로 다시 열리고, 거기서 바로 설치할 수 있어요.</p>' +
      ((isKakao || isAndroid) ? '<button type="button" class="ib-btn" data-ib="out">🌐 ' + (isIOS ? '사파리' : '인터넷 앱') + '로 열기</button>' : '') +
      '<div class="note">단추가 안 되면 화면 구석의 <span class="k">⋮</span> 나 <span class="k">⬆</span> 를 누르고 「' + (isIOS ? 'Safari로 열기' : '다른 브라우저로 열기') + '」를 고르세요.</div>' + guide;
    if (isSafari) return '<h3>🍎 아이폰은 이렇게 세 번만 누르세요</h3><ol>' +
      '<li><i>1</i><span>화면 <b>맨 아래</b> <span class="k">⬆ 공유</span> 를 누릅니다.<br><small>공유가 안 보이면 <span class="k">···</span> 을 먼저 누르세요.</small></span></li>' +
      '<li><i>2</i><span>목록을 위로 올려 <span class="k">➕ 홈 화면에 추가</span> 를 누릅니다.</span></li>' +
      '<li><i>3</i><span>오른쪽 위 <span class="k">추가</span> 를 누르면 끝! 🎉</span></li></ol>' +
      '<div class="note">아이폰은 애플이 정해 둔 대로 「홈 화면에 추가」를 직접 눌러야 합니다. 이 창을 닫고 아래 노란 화살표 쪽을 보세요.</div>' +
      '<button type="button" class="ib-btn" data-ib="close">알겠어요, 해 볼게요 👇</button>' + guide;
    if (isIOS) return '<h3>🍎 아이폰 (크롬 등)</h3><ol>' +
      '<li><i>1</i><span>주소창 오른쪽 <span class="k">⬆ 공유</span> 를 누릅니다.</span></li>' +
      '<li><i>2</i><span><span class="k">➕ 홈 화면에 추가</span> → <span class="k">추가</span></span></li></ol>' +
      '<div class="note">안 보이면 <b>사파리</b>로 이 주소를 열어 주세요.</div>' + guide;
    if (isAndroid) return '<h3>📲 설치 준비 중이에요</h3>' +
      '<p>잠시 뒤 <b>「지금 설치하기」</b> 단추가 여기에 나타나면 누르세요. 안 나타나면 이렇게 하세요.</p><ol>' +
      (isSamsung
        ? '<li><i>1</i><span>맨 아래 오른쪽 <span class="k">≡ 메뉴</span></span></li><li><i>2</i><span><span class="k">➕ 현재 페이지 추가</span> → <span class="k">홈 화면</span></span></li>'
        : '<li><i>1</i><span>오른쪽 위 <span class="k">⋮</span> (점 세 개)</span></li><li><i>2</i><span><span class="k">➕ 홈 화면에 추가</span> 또는 <span class="k">앱 설치</span></span></li>') +
      '<li><i>3</i><span><span class="k">설치</span> 또는 <span class="k">추가</span> 를 누르면 끝! 🎉</span></li></ol>' +
      '<div class="note">이미 설치하셨다면 휴대폰 첫 화면에서 「동산 말씀」 아이콘을 찾아 보세요.</div>' + guide;
    return '<h3>📲 휴대폰에서 열어 주세요</h3><p>이 주소를 휴대폰으로 열면 첫 화면에 설치할 수 있어요. 카톡으로 나에게 보내 두면 편합니다.</p>' +
      '<div class="note" style="word-break:break-all">' + here() + '</div>' + guide;
  }
  function openSheet() {
    style();
    if (!sheet) {
      sheet = document.createElement('div'); sheet.className = 'ib-ov';
      sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-label', '휴대폰에 설치하기');
      sheet.addEventListener('click', function (e) {
        if (e.target === sheet) return closeSheet();
        var b = e.target.closest('[data-ib]'); if (!b) return;
        var k = b.getAttribute('data-ib');
        if (k === 'close') { closeSheet(); if (isSafari) arrow(); }
        else if (k === 'out') openOutside();
        else if (k === 'prompt') doPrompt();
      });
      document.body.appendChild(sheet);
    }
    sheet.innerHTML = '<div class="ib-sh"><button type="button" class="ib-x" data-ib="x" aria-label="닫기">✕</button>' + body() + '</div>';
    sheet.querySelector('.ib-x').onclick = closeSheet;
  }
  /* 사파리 맨 아래 공유 단추 쪽을 가리킨다 (몇 초 뒤 사라짐) */
  function arrow() {
    var a = document.createElement('div'); a.className = 'ib-arrow'; a.textContent = '⬇'; a.setAttribute('aria-hidden', 'true');
    document.body.appendChild(a);
    setTimeout(function () { a.remove(); }, 9000);
  }
  function doPrompt() {
    if (!deferred) return openSheet();
    var p = deferred; deferred = null;
    closeSheet();
    p.prompt();
    p.userChoice.then(function (c) {
      if (c && c.outcome === 'accepted') hide();
      else refresh();
    }).catch(function () {});
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e; refresh();
  });
  window.addEventListener('appinstalled', function () { deferred = null; closeSheet(); hide(); });
  document.addEventListener('DOMContentLoaded', function () {
    slots();
    if (location.hash === '#install' && !installed()) openSheet();
  });
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-install]');
    if (!el) return;
    e.preventDefault();
    if (deferred) doPrompt();          /* 갤럭시 — 바로 설치 창 */
    else if (isKakao) { openSheet(); openOutside(); }   /* 카톡 — 인터넷 앱으로 넘기고, 안 넘어가면 안내가 남는다 */
    else openSheet();
  });
  window.InstallButton = { open: openSheet };
})();

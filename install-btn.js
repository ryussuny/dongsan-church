/* ===========================================================
   「휴대폰 첫 화면에 설치하기」 단추 — 말씀 화면들이 함께 쓴다

   - data-install 이 붙은 단추·링크를 누르면
       · 안드로이드(크롬·삼성 인터넷)처럼 바로 설치할 수 있는 휴대폰은
         그 자리에서 설치 창을 띄운다 (「설치」만 누르면 끝).
       · 아이폰·카카오톡 안처럼 바로 설치가 안 되는 곳은
         그림 안내(install.html)로 넘어간다.
   - 이미 설치해서 아이콘으로 열었으면 단추(와 data-install-box 칸)를 감춘다.
   - data-install-ready="글" 이 있으면 바로 설치할 수 있을 때 그 글로 바꿔 보여 준다.
   head 에서 일찍 불러야 휴대폰이 보내는 설치 신호를 놓치지 않는다.
   =========================================================== */
(function () {
  var deferred = null;
  function installed() {
    return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }
  function each(fn) { Array.prototype.forEach.call(document.querySelectorAll('[data-install]'), fn); }
  /* 감출 때는 단추를 감싼 칸(data-install-box)째 감춘다. 칸마다 display 를 정해 두어 hidden 만으로는 안 숨는다 */
  function hide() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-install],[data-install-box]'), function (el) { el.style.display = 'none'; });
  }
  function refresh() {
    each(function (el) {
      if (installed()) { hide(); return; }
      var t = el.querySelector('[data-install-ready]');
      if (!t) return;
      if (t.dataset.installOrig == null) t.dataset.installOrig = t.textContent;
      t.textContent = deferred ? t.getAttribute('data-install-ready') : t.dataset.installOrig;
    });
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e; refresh();
  });
  window.addEventListener('appinstalled', function () { deferred = null; hide(); });
  document.addEventListener('DOMContentLoaded', refresh);
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-install]');
    if (!el || !deferred) return;          /* 바로 설치가 안 되면 링크대로 안내 화면으로 */
    e.preventDefault();
    var p = deferred; deferred = null;
    p.prompt();
    p.userChoice.then(function (c) {
      if (c && c.outcome === 'accepted') hide();
      else refresh();
    }).catch(function () {});
  });
})();

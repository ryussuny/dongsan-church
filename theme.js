/* ===========================================================
   동산감리교회 말씀 앱 — 어두운 화면(다크 모드)

   - 처음에는 휴대폰 설정(어두운 화면)을 그대로 따른다.
   - 오른쪽 아래 🌙 / ☀️ 버튼을 누르면 그 선택을 기억한다.
   - 인쇄할 때는 항상 밝은 화면으로 인쇄한다.
   head 맨 앞에서 불러야 화면이 하얗게 번쩍이지 않는다.
   =========================================================== */
(function () {
  var KEY = 'dongsan_theme';
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function isDark() {
    var s = saved();
    if (s === 'dark') return true;
    if (s === 'light') return false;
    return !!(mq && mq.matches);
  }
  function apply() {
    if (isDark()) root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    var b = document.getElementById('themeBtn');
    if (b) {
      var d = isDark();
      b.textContent = d ? '☀️' : '🌙';
      b.setAttribute('aria-label', d ? '밝은 화면으로' : '어두운 화면으로');
      b.setAttribute('aria-pressed', d ? 'true' : 'false');
    }
  }
  apply();
  if (mq) {
    var onChange = function () { if (!saved()) apply(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  window.addEventListener('beforeprint', function () { root.removeAttribute('data-theme'); });
  window.addEventListener('afterprint', apply);

  function addButton() {
    if (document.getElementById('themeBtn')) return;
    var b = document.createElement('button');
    b.id = 'themeBtn';
    b.type = 'button';
    b.style.cssText = 'position:fixed;right:14px;bottom:calc(92px + env(safe-area-inset-bottom));z-index:60;' +
      'width:44px;height:44px;border-radius:50%;border:1px solid rgba(0,0,0,.12);background:rgba(255,255,255,.92);' +
      'box-shadow:0 2px 10px rgba(0,0,0,.18);font-size:20px;line-height:1;cursor:pointer;' +
      '-webkit-tap-highlight-color:transparent';
    b.addEventListener('click', function () {
      try { localStorage.setItem(KEY, isDark() ? 'light' : 'dark'); } catch (e) {}
      apply();
    });
    document.body.appendChild(b);
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton);
  else addButton();
})();

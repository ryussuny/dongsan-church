/* ===========================================================
   방문자 수 — 실시간 · 오늘 · 누적

   홈페이지는 서버가 없는 정적 사이트라 방문자를 혼자서는 셀 수 없다.
   그래서 말씀 나눔과 같은 구글 앱스 스크립트에 1분에 한 번 신호를 보내고,
   거기서 세어 준 숫자를 받아 적는다.

   word-config.js 의 WORD_API 가 비어 있으면 아무 일도 하지 않고
   숫자 칸을 숨긴다. 지어낸 숫자는 절대 보이지 않는다.

   보내는 것은 기기 안에서 만든 임의의 번호 하나뿐이다.
   이름·전화번호 같은 개인 정보는 오가지 않는다.
   =========================================================== */
(function () {
  'use strict';

  var BOX = 'visitorBox';
  var EVERY = 60 * 1000;   /* 1분에 한 번 */
  var KEY = 'dongsan_visitor_id';

  var api = (typeof WORD_API === 'string' ? WORD_API : '').trim();
  var box = document.getElementById(BOX);
  if (!box) return;
  if (!api) { box.hidden = true; return; }

  /* 기기 번호 — 이 기기 안에만 남는다 */
  function deviceId() {
    var id;
    try { id = localStorage.getItem(KEY); } catch (err) { id = null; }
    if (!id) {
      id = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem(KEY, id); } catch (err) { /* 사생활 보호 모드 */ }
    }
    return id;
  }

  function num(n) { return Number(n || 0).toLocaleString('ko-KR'); }

  /* 어린이 화면은 말을 부드럽게 하고 「누적」은 빼 준다 —
     아이들에게 연인원은 와닿지 않는다 */
  var kids = box.getAttribute('data-tone') === 'kids';

  function paint(d) {
    box.hidden = false;
    if (kids) {
      box.innerHTML =
        '<span class="vt-dot" aria-hidden="true"></span>' +
        '<span class="vt-item">지금 <b>' + num(d.live) + '</b>명이 함께 읽고 있어요</span>' +
        '<span class="vt-sep">·</span>' +
        '<span class="vt-item">오늘 <b>' + num(d.today) + '</b>명</span>';
      return;
    }
    box.innerHTML =
      '<span class="vt-dot" aria-hidden="true"></span>' +
      '<span class="vt-item"><b>' + num(d.live) + '</b>명 접속 중</span>' +
      '<span class="vt-sep">·</span>' +
      '<span class="vt-item">오늘 <b>' + num(d.today) + '</b>명</span>' +
      '<span class="vt-sep">·</span>' +
      '<span class="vt-item">누적 <b>' + num(d.total) + '</b>명</span>';
  }

  var id = deviceId();
  var failures = 0;

  function ping() {
    if (document.hidden) return;            /* 창을 보고 있을 때만 센다 */
    fetch(api + '?action=visit&id=' + encodeURIComponent(id))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ok) throw new Error(d && d.error ? d.error : '응답 없음');
        failures = 0;
        paint(d);
      })
      .catch(function () {
        /* 두 번까지는 봐 준다. 계속 안 되면 조용히 숨긴다 */
        if (++failures >= 3) box.hidden = true;
      });
  }

  ping();
  setInterval(ping, EVERY);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) ping();           /* 다시 돌아오면 바로 한 번 */
  });
})();

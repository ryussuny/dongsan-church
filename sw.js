/* ===========================================================
   동산감리교회 — 앱처럼 쓰기 위한 서비스 워커

   두 가지만 한다.
     1) 말씀·나눔처럼 늘 새것이어야 하는 것은 "인터넷 먼저" 받아 온다.
        인터넷이 안 되면 그때만 지난번 것을 보여 준다.
     2) 성경 파일·아이콘처럼 잘 바뀌지 않고 무거운 것은 한 번 받아 두고 쓴다.

   1)을 "인터넷 먼저"로 둔 이유: 저장해 둔 것을 먼저 보여 주면
   홈페이지를 고쳐도 성도들 화면이 옛날 그대로 머무는 일이 생긴다.
   =========================================================== */
var VERSION = 'dongsan-v1';
var SHELL = [
  'word.html', 'word-adult.html', 'word-kids.html',
  'word-core.js', 'word-data.js', 'word-config.js',
  'icons/icon-192.png', 'icons/icon-512.png'
];
/* 한 번 받아 두고 계속 쓰는 것 (4.8MB 성경 파일 등) */
var KEEP = /dongsan_bible\.js$|\/icons\/|\.png$|\.jpg$|\.webp$/;
/* 노래는 손대지 않고 브라우저에 맡긴다.
   가로채면 곡을 틀 때마다 6MB를 통째로 다시 받고, 브라우저가
   끊어 받은 조각(206)은 캐시에 넣을 수도 없어 오류만 남는다. */
var PASS = /\.(mp3|m4a|ogg|wav)$/i;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () {
    /* 예전 판이 담아 둔 노래 파일은 쓰이지도 않으면서 자리만 차지한다 */
    return caches.open(VERSION).then(function (c) {
      return c.keys().then(function (rs) {
        return Promise.all(rs.filter(function (r) {
          return PASS.test(new URL(r.url).pathname);
        }).map(function (r) { return c.delete(r); }));
      });
    }).catch(function () {});
  }).then(function () { return self.clients.claim(); }));
});

/* 온전한 응답(200)만 담아 둔다. 조각난 응답이나 오류 쪽은 담으려 하면
   브라우저가 거절해 오류가 나므로 아예 건드리지 않는다. */
function keep(req, res) {
  if (!res || res.status !== 200 || res.type === 'opaque') return;
  var copy = res.clone();
  caches.open(VERSION).then(function (c) { return c.put(req, copy); })
    .catch(function () {});
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;            /* 남의 집 것은 손대지 않는다 */
  if (PASS.test(url.pathname)) return;                    /* 노래도 손대지 않는다 */

  if (KEEP.test(url.pathname)) {                          /* 무거운 것 — 저장해 둔 것 먼저 */
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        keep(req, res);
        return res;
      });
    }));
    return;
  }

  e.respondWith(                                          /* 나머지 — 인터넷 먼저 */
    fetch(req).then(function (res) {
      keep(req, res);
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match('word.html');
      });
    })
  );
});

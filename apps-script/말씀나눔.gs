/* ===========================================================
   동산감리교회 · 말씀 나눔 저장소   (구글 앱스 스크립트)

   홈페이지는 깃허브 페이지에 올라가는 "정적" 사이트라 서버가 없다.
   그래서 나눔 글을 모두가 함께 보려면 글을 담아 둘 곳이 따로 있어야 한다.
   이 스크립트가 구글 스프레드시트를 그 자리로 쓴다. 돈이 들지 않고,
   목사님이 시트를 열면 그대로 명단과 통계가 된다.

   시트 네 장이 저절로 만들어진다.
     나눔     — 어른 묵상 나눔 (홈페이지에서 모두가 본다)
     어린이   — 어린이 묵상·퀴즈·미션 (홈페이지에 내보내지 않는다. 목사님만 본다)
     읽음     — 누가 어느 날 말씀을 읽었는지
     통계     — 위 세 장을 요약한 표 (자동으로 다시 만들어진다)

   설치하는 법은 저장소의 말씀나눔-설치.md 에 적어 두었다.
   =========================================================== */

var SHEET_NAMES = { share: '나눔', kid: '어린이', confirm: '읽음', stat: '통계' };

var HEADERS = {
  나눔:   ['글번호', '날짜', '이름', '나눈 말씀', '아멘 누른 사람', '아멘 수', '올린 시각'],
  어린이: ['글번호', '날짜', '이름', '나눈 말씀', '기분', '퀴즈 정답', '미션 완료', '보호자 확인', '올린 시각'],
  읽음:   ['날짜', '이름', '구분', '퀴즈 정답', '미션 완료', '기분', '보호자 확인', '기록 시각'],
};

/* ---------- 시트 준비 ---------- */
function book() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet(name) {
  var ss = book(), sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (HEADERS[name]) {
      sh.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]])
        .setFontWeight('bold').setBackground('#eef1f7');
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

/* 열 이름 → 열 번호 (1부터) */
function colIndex(name, header) {
  return HEADERS[name].indexOf(header) + 1;
}

function rowsOf(name) {
  var sh = sheet(name), last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, HEADERS[name].length).getValues();
  return vals.map(function (r, i) {
    var o = { _row: i + 2 };
    HEADERS[name].forEach(function (h, c) { o[h] = r[c]; });
    return o;
  });
}

function ymd(v) {
  if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Seoul', 'yyyy-MM-dd');
  return String(v || '').slice(0, 10);
}

/* ---------- 홈페이지가 읽어 가는 곳 ---------- */
/* 어린이 글은 여기서 절대 내보내지 않는다. 목사님이 시트에서만 보신다. */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'ping') return json({ ok: true, mode: 'server' });

    var date = ymd(p.date || '');
    var shares = rowsOf(SHEET_NAMES.share)
      .filter(function (r) { return ymd(r['날짜']) === date; })
      .map(function (r) {
        return {
          id: String(r['글번호']), date: date, name: String(r['이름']),
          ver: 'adult', text: String(r['나눈 말씀']),
          amens: String(r['아멘 누른 사람'] || '').split(',').map(function (s) { return s.trim(); }).filter(String),
          ts: r['올린 시각'] instanceof Date ? r['올린 시각'].getTime() : Number(r['올린 시각']) || 0,
        };
      });

    /* 읽음 표시는 이름만 (어린이 글 내용은 나가지 않는다) */
    var confirms = rowsOf(SHEET_NAMES.confirm)
      .filter(function (r) { return ymd(r['날짜']) === date; })
      .map(function (r) {
        return { date: date, name: String(r['이름']), ver: String(r['구분'] || 'adult') };
      });

    return json({ ok: true, shares: shares, confirms: confirms });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ---------- 홈페이지가 써 넣는 곳 ---------- */
function doPost(e) {
  var body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { body = {}; }
  var action = String(body.action || '');
  var rec = body.rec || {};

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    switch (action) {
      case 'share':         return json(putShare(rec));
      case 'share/delete':  return json(dropShare(rec));
      case 'amen':          return json(toggleAmen(rec));
      case 'confirm':       return json(putConfirm(rec));
      case 'confirm/delete':return json(dropConfirm(rec));
      default:              return json({ ok: false, error: '알 수 없는 요청: ' + action });
    }
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (err2) {}
  }
}

/* 나눔 — 어른 글은 "나눔" 시트, 어린이 글은 "어린이" 시트로 갈라 담는다 */
function putShare(rec) {
  var date = ymd(rec.date), name = String(rec.name || '').trim();
  var text = String(rec.text || '').trim();
  if (!date || !name || !text) return { ok: false, error: '날짜·이름·내용이 필요합니다' };
  if (text.length > 2000) text = text.slice(0, 2000);

  var id = String(rec.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7)));
  var ts = Number(rec.ts) || Date.now();

  if (String(rec.ver) === 'kids') {
    sheet(SHEET_NAMES.kid).appendRow([
      id, date, name, text, String(rec.mood || ''),
      rec.quizOk ? 'O' : '', rec.missionOk ? 'O' : '', String(rec.parent || ''), new Date(ts),
    ]);
    return { ok: true, id: id, private: true };   /* 홈페이지에는 내보내지 않는다 */
  }

  sheet(SHEET_NAMES.share).appendRow([id, date, name, text, '', 0, new Date(ts)]);
  return { ok: true, id: id };
}

function dropShare(rec) {
  var sh = sheet(SHEET_NAMES.share);
  var hit = rowsOf(SHEET_NAMES.share).filter(function (r) {
    return String(r['글번호']) === String(rec.id) && String(r['이름']) === String(rec.name);
  })[0];
  if (!hit) return { ok: false, error: '글을 찾지 못했습니다' };
  sh.deleteRow(hit._row);
  return { ok: true };
}

function toggleAmen(rec) {
  var sh = sheet(SHEET_NAMES.share), name = String(rec.name || '').trim();
  var hit = rowsOf(SHEET_NAMES.share).filter(function (r) {
    return String(r['글번호']) === String(rec.id);
  })[0];
  if (!hit || !name) return { ok: false, error: '글을 찾지 못했습니다' };

  var list = String(hit['아멘 누른 사람'] || '').split(',').map(function (s) { return s.trim(); }).filter(String);
  var i = list.indexOf(name);
  if (i >= 0) list.splice(i, 1); else list.push(name);

  sh.getRange(hit._row, colIndex('나눔', '아멘 누른 사람')).setValue(list.join(', '));
  sh.getRange(hit._row, colIndex('나눔', '아멘 수')).setValue(list.length);
  return { ok: true, amens: list };
}

/* 읽음 — 같은 날 같은 사람은 한 줄만 두고 덮어쓴다 */
function putConfirm(rec) {
  var date = ymd(rec.date), name = String(rec.name || '').trim();
  if (!date || !name) return { ok: false, error: '날짜·이름이 필요합니다' };
  var ver = String(rec.ver || 'adult');

  var sh = sheet(SHEET_NAMES.confirm);
  var hit = rowsOf(SHEET_NAMES.confirm).filter(function (r) {
    return ymd(r['날짜']) === date && String(r['이름']) === name && String(r['구분']) === ver;
  })[0];

  var row = [date, name, ver, rec.quizOk ? 'O' : '', rec.missionOk ? 'O' : '',
             String(rec.mood || ''), String(rec.parent || ''), new Date()];

  if (hit) {
    /* 이미 있는 값을 지우지 않는다 — 퀴즈·미션은 한 번 O 면 계속 O */
    if (!rec.quizOk && String(hit['퀴즈 정답']) === 'O') row[3] = 'O';
    if (!rec.missionOk && String(hit['미션 완료']) === 'O') row[4] = 'O';
    if (!row[5]) row[5] = String(hit['기분'] || '');
    if (!row[6]) row[6] = String(hit['보호자 확인'] || '');
    sh.getRange(hit._row, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }
  return { ok: true };
}

function dropConfirm(rec) {
  var sh = sheet(SHEET_NAMES.confirm), date = ymd(rec.date), name = String(rec.name || '').trim();
  var hit = rowsOf(SHEET_NAMES.confirm).filter(function (r) {
    return ymd(r['날짜']) === date && String(r['이름']) === name && String(r['구분']) === String(rec.ver || 'adult');
  })[0];
  if (hit) sh.deleteRow(hit._row);
  return { ok: true };
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ===========================================================
   통계 — 목사님이 보시는 요약표

   시트 위쪽 메뉴 「말씀 나눔 → 통계 다시 만들기」 를 누르거나,
   하루 한 번 저절로 다시 만들어진다(설치 안내의 트리거 항목 참고).
   =========================================================== */

function 통계다시만들기() { rebuildStats(); SpreadsheetApp.getActive().toast('통계를 다시 만들었습니다'); }

function rebuildStats() {
  var sh = sheet(SHEET_NAMES.stat);
  sh.clear();

  var kids = rowsOf(SHEET_NAMES.kid);
  var conf = rowsOf(SHEET_NAMES.confirm);
  var share = rowsOf(SHEET_NAMES.share);

  var kidConf = conf.filter(function (r) { return String(r['구분']) === 'kids'; });
  var out = [];

  out.push(['동산감리교회 · 말씀 나눔 통계', '', '', '', '']);
  out.push(['만든 때', Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm'), '', '', '']);
  out.push(['', '', '', '', '']);

  /* ── 한눈에 ── */
  out.push(['■ 한눈에', '', '', '', '']);
  out.push(['어른 나눔 글', share.length, '', '', '']);
  out.push(['어린이 나눔 글', kids.length, '', '', '']);
  out.push(['어린이 참여 인원', uniq(kidConf.map(function (r) { return String(r['이름']); })).length, '', '', '']);
  out.push(['어린이 참여한 날', uniq(kidConf.map(function (r) { return ymd(r['날짜']); })).length, '', '', '']);
  out.push(['퀴즈 맞힌 횟수', kidConf.filter(function (r) { return String(r['퀴즈 정답']) === 'O'; }).length, '', '', '']);
  out.push(['미션 마친 횟수', kidConf.filter(function (r) { return String(r['미션 완료']) === 'O'; }).length, '', '', '']);
  out.push(['보호자 확인', kidConf.filter(function (r) { return String(r['보호자 확인'] || '').trim(); }).length, '', '', '']);
  out.push(['', '', '', '', '']);

  /* ── 어린이별 ── */
  out.push(['■ 어린이별', '참여한 날', '퀴즈 정답', '미션 완료', '나눔 글']);
  var byKid = {};
  kidConf.forEach(function (r) {
    var n = String(r['이름']); if (!n) return;
    var k = byKid[n] = byKid[n] || { days: {}, quiz: 0, mission: 0, share: 0, last: '' };
    k.days[ymd(r['날짜'])] = true;
    if (String(r['퀴즈 정답']) === 'O') k.quiz++;
    if (String(r['미션 완료']) === 'O') k.mission++;
    var d = ymd(r['날짜']); if (d > k.last) k.last = d;
  });
  kids.forEach(function (r) {
    var n = String(r['이름']); if (!n) return;
    (byKid[n] = byKid[n] || { days: {}, quiz: 0, mission: 0, share: 0, last: '' }).share++;
  });
  Object.keys(byKid).sort(function (a, b) {
    return Object.keys(byKid[b].days).length - Object.keys(byKid[a].days).length || a.localeCompare(b, 'ko');
  }).forEach(function (n) {
    var k = byKid[n];
    out.push([n, Object.keys(k.days).length, k.quiz, k.mission, k.share]);
  });
  if (!Object.keys(byKid).length) out.push(['(아직 참여한 어린이가 없습니다)', '', '', '', '']);
  out.push(['', '', '', '', '']);

  /* ── 날짜별 ── */
  out.push(['■ 날짜별', '어른 읽음', '어린이 읽음', '어른 나눔', '어린이 나눔']);
  var byDate = {};
  function slot(d) { return byDate[d] = byDate[d] || { a: 0, k: 0, as: 0, ks: 0 }; }
  conf.forEach(function (r) {
    var s = slot(ymd(r['날짜']));
    if (String(r['구분']) === 'kids') s.k++; else s.a++;
  });
  share.forEach(function (r) { slot(ymd(r['날짜'])).as++; });
  kids.forEach(function (r) { slot(ymd(r['날짜'])).ks++; });
  Object.keys(byDate).sort().reverse().slice(0, 120).forEach(function (d) {
    var s = byDate[d];
    out.push([d, s.a, s.k, s.as, s.ks]);
  });
  if (!Object.keys(byDate).length) out.push(['(아직 기록이 없습니다)', '', '', '', '']);

  sh.getRange(1, 1, out.length, 5).setValues(out);
  sh.getRange(1, 1, 1, 5).setFontWeight('bold').setFontSize(13);
  out.forEach(function (r, i) {
    if (String(r[0]).indexOf('■') === 0) {
      sh.getRange(i + 1, 1, 1, 5).setFontWeight('bold').setBackground('#eef1f7');
    }
  });
  sh.setColumnWidth(1, 220);
  sh.autoResizeColumns(2, 4);
}

function uniq(a) { return Object.keys(a.reduce(function (o, v) { if (v) o[v] = 1; return o; }, {})); }

/* 시트를 열면 위쪽에 메뉴가 하나 생긴다 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('말씀 나눔')
    .addItem('통계 다시 만들기', '통계다시만들기')
    .addItem('시트 처음 만들기', '시트준비')
    .addToUi();
}

function 시트준비() {
  [SHEET_NAMES.share, SHEET_NAMES.kid, SHEET_NAMES.confirm, SHEET_NAMES.stat].forEach(sheet);
  rebuildStats();
  SpreadsheetApp.getActive().toast('시트를 준비했습니다');
}

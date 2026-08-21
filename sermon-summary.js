/* ===========================================================
   설교문 자동 요약 — 설교 원고 글에서 등록용 요약을 뽑아낸다.

   목사님이 쓰시는 원고의 짜임(제목 / 본문 / 서론 / 본론 1·2·3 / 결론 / 찬송)을
   그대로 읽어 내는 방식이라 인터넷 연결이나 API 키 없이도 동작한다.
   (AI 로 문장을 더 다듬고 싶으면 관리자 화면의 "AI로 다듬기" 를 쓰면 된다.)

   쓰는 곳
     · 브라우저 : <script src="sermon-summary.js"></script>  →  SermonSummary.parse(text)
     · 노드     : const { parse } = require('./sermon-summary.js')
   =========================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SermonSummary = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BOOKS = [
    '창세기', '출애굽기', '레위기', '민수기', '신명기', '여호수아', '사사기', '룻기',
    '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야', '에스더',
    '욥기', '시편', '잠언', '전도서', '아가',
    '이사야', '예레미야', '예레미야애가', '에스겔', '다니엘',
    '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔', '하박국', '스바냐', '학개', '스가랴', '말라기',
    '마태복음', '마가복음', '누가복음', '요한복음', '사도행전',
    '로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서',
    '데살로니가전서', '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서', '히브리서',
    '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서', '요한계시록'
  ];

  /* 예배 이름 — 시리즈 뒤에 붙는다 */
  var SERVICES = [
    ['주일오전예배', /주일\s*오전\s*예배|주일오전/],
    ['주일오후예배', /주일\s*오후\s*예배|주일오후/],
    ['주일예배', /주일\s*설교|주일예배/],
    ['수요예배', /수요\s*예배|수요\s*설교|수요예/],
    ['금요기도회', /금요\s*기도회|금요\s*설교|금요예배/],
    ['새벽기도회', /새벽\s*기도|새벽\s*예배/]
  ];

  function tidy(s) {
    return String(s == null ? '' : s)
      .replace(/\\([*_'"])/g, '$1')     /* 워드에서 넘어온 이스케이프 정리 */
      .replace(/[✦✝ðŸ🔹■◆●▶]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function lines(text) {
    return String(text || '').split(/\r?\n/).map(tidy).filter(function (l) { return l; });
  }

  /* "로마서 8장 31-39절" · "롬 8:31-39" → "로마서 8:31-39" */
  function normalizeRef(raw) {
    var s = tidy(raw).replace(/\(.*?\)/g, ' ');
    for (var i = 0; i < BOOKS.length; i++) {
      var b = BOOKS[i];
      var re = new RegExp(b + '\\s*(\\d+)\\s*(?:장)?\\s*[:：]?\\s*(\\d+)?\\s*(?:절)?\\s*(?:[-~–]\\s*(\\d+)\\s*(?:[:：]\\s*(\\d+))?\\s*(?:절)?)?');
      var m = s.match(re);
      if (!m) continue;
      var ref = b + ' ' + m[1];
      if (m[2]) {
        ref += ':' + m[2];
        if (m[3] && m[4]) ref += '-' + m[3] + ':' + m[4];
        else if (m[3]) ref += '-' + m[3];
      }
      return { book: b, ref: ref, chapter: +m[1], verse: m[2] ? +m[2] : 0 };
    }
    return null;
  }

  function pickTitle(ls) {
    for (var i = 0; i < ls.length; i++) {
      var m = ls[i].match(/^제목\s*[:：]\s*(.+)$/);
      if (m) return tidy(m[1]).replace(/\s*본문\s*[:：].*$/, '').replace(/[—-]\s*$/, '').trim();
    }
    /* "제목:" 이 없으면 머리글 다음의 짧은 문장을 제목으로 본다 */
    for (var j = 0; j < Math.min(ls.length, 12); j++) {
      var l = ls[j];
      if (/설교문|설교$|예배$|콘티|기도회$/.test(l)) continue;
      if (/^본문/.test(l)) continue;
      if (l.length >= 4 && l.length <= 40) return l.replace(/^["“'](.+)["”']$/, '$1');
    }
    return '';
  }

  function pickScripture(ls) {
    for (var i = 0; i < ls.length; i++) {
      if (!/^본문\s*[:：]/.test(ls[i])) continue;
      var got = normalizeRef(ls[i].replace(/^본문\s*[:：]/, ''));
      if (got) return got;
    }
    for (var j = 0; j < Math.min(ls.length, 25); j++) {
      var g = normalizeRef(ls[j]);
      if (g) return g;
    }
    return null;
  }

  function pickSeries(ls, book) {
    var head = ls.slice(0, 8).join(' ');
    var service = '';
    for (var i = 0; i < SERVICES.length; i++) {
      if (SERVICES[i][1].test(head)) { service = SERVICES[i][0]; break; }
    }
    var series = book ? book + ' 강해' : '';
    var m = head.match(/([가-힣]+(?:상|하|서|기|음|전|후)?)\s*강해/);
    if (m) series = m[1] + ' 강해';
    return series + (service ? ' · ' + service : '');
  }

  /* 본론 소제목 — "본론 1 …", "본론1:", "첫째," 를 모두 받는다 */
  function pickPoints(ls) {
    var out = [];
    ls.forEach(function (l) {
      var m = l.match(/^본론\s*(\d+)?\s*[:：.]?\s*(.+)$/);
      if (m && m[2]) {
        var t = tidy(m[2]).replace(/^["“'](.+?)["”']\s*[—-]?\s*/, '$1 — ');
        if (t.length > 3) out.push((m[1] ? m[1] + '. ' : (out.length + 1) + '. ') + t);
      }
    });
    if (!out.length) {
      ls.forEach(function (l) {
        var m = l.match(/^(첫째|둘째|셋째|넷째|다섯째)\s*[,，.:：]\s*(.+)$/);
        if (m && m[2] && out.length < 5) out.push((out.length + 1) + '. ' + tidy(m[2]));
      });
    }
    return out.slice(0, 6).map(function (t) { return t.length > 90 ? t.slice(0, 88) + '…' : t; });
  }

  /* 문단에서 앞쪽 문장 몇 개를 잘라 온다 */
  function firstSentences(text, max) {
    var s = tidy(text);
    if (!s) return '';
    var parts = s.split(/(?<=[.!?요다])\s+/);
    var out = '';
    for (var i = 0; i < parts.length; i++) {
      if (!parts[i]) continue;
      if (out && (out + ' ' + parts[i]).length > max) break;
      out = out ? out + ' ' + parts[i] : parts[i];
      if (out.length >= max * 0.6) break;
    }
    return out.length > max ? out.slice(0, max - 1) + '…' : out;
  }

  /* 제목 아래에 따옴표로 적어 둔 주제 한 줄 */
  function pickTheme(ls) {
    for (var i = 0; i < Math.min(ls.length, 20); i++) {
      var m = ls[i].match(/^["“](.{10,90})["”]$/);
      if (m && !/하나님 아버지|아멘|기도/.test(m[1])) return tidy(m[1]);
    }
    return '';
  }

  function sectionBody(ls, startRe, stopRe, limit) {
    var started = false, buf = [];
    for (var i = 0; i < ls.length; i++) {
      var l = ls[i];
      if (!started) { if (startRe.test(l)) started = true; continue; }
      if (stopRe.test(l)) break;
      if (/^\d+\s*[.\\]?\s*(설교문|기도|축도|찬양|통성|소그룹|적용|기도회)/.test(l)) break;
      if (/^(찬송|기도 제목|축도|통성기도)/.test(l)) break;
      if (l.length < 8) continue;
      buf.push(l);
      if (buf.join(' ').length > limit * 3) break;
    }
    return buf.join(' ');
  }

  function pickHymns(ls) {
    var out = [];
    ls.forEach(function (l) {
      var m = l.match(/찬송가\s*\d+\s*장[^,·|]*/g);
      if (m) m.forEach(function (h) { if (out.indexOf(tidy(h)) < 0) out.push(tidy(h)); });
    });
    return out.slice(0, 3);
  }

  /* ---------- 본체 ---------- */
  function parse(text, opts) {
    opts = opts || {};
    var ls = lines(text);
    if (!ls.length) return { ok: false, reason: '내용이 비어 있습니다.' };

    var scripture = pickScripture(ls);
    var title = pickTitle(ls);
    var theme = pickTheme(ls);

    var introBody = sectionBody(ls, /^(서론|◆\s*서론|도입|◆\s*도입)/, /^(본론|◆\s*본론)/, 160);
    var closingBody = sectionBody(ls, /^(결론|◆\s*결론|맺는|나가는)/, /^(기도|축도|통성|소그룹|적용)/, 160);

    var summary = theme || firstSentences(introBody, 150);
    if (!summary) summary = firstSentences(closingBody, 150);

    var conclusion = firstSentences(closingBody, 150);
    if (!conclusion && theme) conclusion = theme;

    var entry = {
      title: title,
      scripture: scripture ? scripture.ref : '',
      book: scripture ? scripture.book : '',
      chapter: scripture ? scripture.chapter : 0,
      verse: scripture ? scripture.verse : 0,
      series: pickSeries(ls, scripture ? scripture.book : ''),
      summary: summary,
      keyPoints: pickPoints(ls),
      conclusion: conclusion,
      hymns: pickHymns(ls),
      source: opts.source || ''
    };

    var missing = [];
    if (!entry.title) missing.push('제목');
    if (!entry.scripture) missing.push('본문');
    if (!entry.summary) missing.push('요약');

    return {
      ok: missing.length === 0,
      missing: missing,
      reason: missing.length ? missing.join(' · ') + ' 을(를) 원고에서 찾지 못했습니다.' : '',
      entry: entry
    };
  }

  /* AI 로 다듬을 때 쓰는 지시문 — 원고에 없는 내용은 지어내지 않게 못 박는다 */
  function aiPrompt(text, entry) {
    return [
      '아래는 교회 설교 원고입니다. 홈페이지 설교 목록에 올릴 요약을 만들어 주세요.',
      '',
      '규칙',
      '1. 원고에 실제로 있는 내용만 쓰고, 없는 내용은 절대 지어내지 마세요.',
      '2. 성도 이름·건강 상태·개인 사정은 요약에 넣지 마세요.',
      '3. 아래 JSON 형식 그대로, 다른 말 없이 JSON 만 출력하세요.',
      '',
      '{"title":"제목","scripture":"' + (entry && entry.scripture ? entry.scripture : '책 장:절') + '",' +
      '"series":"OO 강해 · 예배이름","summary":"2~3문장 요약","keyPoints":["1. …","2. …","3. …"],' +
      '"conclusion":"맺는 말씀 1~2문장","hymns":[]}',
      '',
      '--- 설교 원고 ---',
      String(text || '').slice(0, 12000)
    ].join('\n');
  }

  return { parse: parse, normalizeRef: normalizeRef, aiPrompt: aiPrompt, BOOKS: BOOKS };
});

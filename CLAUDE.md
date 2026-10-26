# 동산교회 홈페이지·말씀 앱 — 작업 메모

## 교회력 (목사님 확인)
- **추수감사주일은 매년 11월 첫째 주일**이다. (2026년은 11월 1일)
- 종교개혁주일은 10월 마지막 주일, 왕국주일은 대림절 바로 앞 주일, 송년주일은 12월 마지막 주일.
- 교회 일정·절기는 `church-plan.html`(주일별 계획표)이 기준이다.

## 개인정보 (꼭 지킬 것)
- 이 저장소는 **공개**이고 GitHub Pages 로 누구나 내려받는다. 교인 이름·전화번호·주소·생일, 심방 계획, 상담 내용은 **절대 커밋하지 않는다** (`.gitignore` 에 엑셀·CSV 를 막아 두었다).
- 교인 명단·심방 계획은 관리자 앱(`admin.html` 교인 → 「📥 명단·심방계획 가져오기」)에서 엑셀 파일을 골라 목사님 기기(localStorage)에만 넣는다.
- 상담 기록도 기기에만 저장한다. AI 로는 대화 글만 보내고 이름·전화번호는 보내지 않는다.

## 오늘의 말씀
- 데이터: `word-data.js` (WORD_PLAN 읽기표, WORD_SERIES/WORD_PLAN_FIRST 주제 시리즈, WORD_CYCLE 순환)
- 주간 암송: `word-extra.js` 의 MEMORY (월요일 날짜 → 구절)
- 묵상집(인쇄·책 보기): `word-book.html` — 앱과 같은 데이터를 쓴다.
  묵상 글·본문을 고치면 `node scripts/build-book-bible.js`(묵상집 전용 작은 성경 `book-bible.js`) → `node scripts/build-book.js` 순서로 다시 만든다. `book-bible.js` 가 낡아도 묵상집은 전체 성경으로 열린다.
- 설교 묵상집(로마서·빌립보서): `sermon-book.html` + `sermon-book-data.js`. 날마다 hk 여는 한마디(본문 앞 호기심을 여는 한두 줄), ex 묵상, dp 「알고 읽으면 더 깊은 이야기」(문단 앞 【궁금한 소제목】, 원어는 하루 한 단어 이하, 이야기 중심). 고친 뒤 `node scripts/build-sermon-book-bible.js` 로 인용 대조·작은 성경 다시 만들기. 글씨는 모든 쪽 10pt, 넘치면 다음 쪽으로 이어진다.
- 묵상 글에서 “ ” 안은 개역개정 원문 그대로, ‘ ’ 는 풀어 쓴 말이다. 인용을 고치면 `dongsan_bible.js` 원문과 글자를 대조한다.

## 디자인 스튜디오
- 화면: `design.html` (관리자 앱 홈 「🎨 디자인」). 한 줄 부탁 → Claude 가 HTML 조각을 그리고, 틀(`design-templates.js`)은 AI 없이 그린다.
- 디자인 시스템: 값은 `design-system.js`(테마·크기·AI 규칙), 설명은 `DESIGN.md`. 테마 값을 바꾸면 `DESIGN.md` 표도 같이 고친다.
- 디자인은 색·글꼴을 CSS 변수(`--bg` `--ink` `--accent` …)로만 쓴다 — 그래야 테마만 바꿔도 전체가 바뀐다.
- 코딩 에이전트에서는 `.claude/skills/dongsan-design` 스킬과 `node scripts/design-render.js` 를 쓴다. 결과물 `designs/` 는 커밋하지 않는다.

---
name: dongsan-design
description: 동산감리교회 포스터·카드뉴스·예배 화면 슬라이드·주보 표지·현수막을 교회 디자인 시스템(DESIGN.md)으로 만든다. "포스터 만들어줘", "카드뉴스", "예배 화면", "현수막", "초대장", "동산 디자인으로" 같은 부탁에 쓴다.
---

# 동산 디자인

교회 디자인 스튜디오(`design.html`)와 같은 규칙으로, 코딩 에이전트 안에서 바로 디자인을 만든다.

## 순서

1. `DESIGN.md` 를 읽는다 — 색·글꼴 변수, 크기, 하라·하지 말라, 출력 형식(9장).
   교회 일정·절기는 `church-plan.html`, 교회력 규칙은 `CLAUDE.md` 를 따른다.
2. 부탁에 맞는 **크기**(`poster`·`square`·`story`·`slide`·`bulletin`·`banner`)와 **테마**(`dongsan`·`harvest`·`advent` …)를 고른다.
   말이 없으면 절기에 맞는 테마, 크기는 `poster`.
3. 성경을 인용하면 `dongsan_bible.js` 에서 개역개정 원문을 찾아 “ ” 안에 글자 그대로 넣는다.
4. 조각을 `designs/<이름>.frag.html` 에 쓴다 — `<style>` 하나 + 장마다 `<section class="page">`.
   색·글꼴은 `var(--…)` 로만, `<script>`·바깥 주소 그림은 쓰지 않는다.
5. 그린다:
   ```bash
   node scripts/design-render.js designs/<이름>.frag.html --theme <테마> --format <크기> --out designs/<이름>
   ```
   `designs/<이름>.html`(인쇄용)과 `designs/<이름>-1.png …`(장마다 그림)이 나온다.
6. PNG 를 직접 열어 본다. 글자가 넘치거나(스크립트가 ⚠️ 로 알려 줌) 겹치면 조각을 고쳐 5로 돌아간다.
7. 다 되면 파일 위치를 알려 드리고, 스튜디오에서 이어 고치고 싶으면 `design.html` 을 쓰시라고 안내한다.

## 지킬 것

- `designs/` 는 `.gitignore` 에 들어 있다. 교인 이름·연락처가 들어간 디자인은 **커밋하지 않는다** (공개 저장소).
- 요청에 없는 이름·전화번호·계좌번호는 지어내지 않는다.

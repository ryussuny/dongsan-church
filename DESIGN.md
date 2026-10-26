# DESIGN.md — 동산감리교회 디자인 시스템

> 이 파일은 **교회 디자인의 기준**입니다. 사람이 읽어도 되고, AI 디자인 도구(Open Design, Claude Code 같은
> 코딩 에이전트)에게 "이 저장소의 DESIGN.md 를 디자인 시스템으로 써 줘"라고 건네도 됩니다.
> 실제 값은 `design-system.js` 에 있고, 교회 앱의 **🎨 디자인 스튜디오**(`design.html`)가 이 값을 그대로 씁니다.
> 값을 바꾸면 두 파일을 함께 고칩니다.

## 1. 분위기 (Visual Theme & Atmosphere)

- **물댄동산** — 표어 「하나님의 은혜가 흐르는 물댄동산」(이사야 58:11). 맑은 물, 자라는 잎, 따뜻한 빛.
- 강원도 태백의 작은 교회답게 **소박하고 단정하게**. 화려함보다 또렷함, 장식보다 여백.
- 읽는 사람의 절반은 어르신입니다. **크고, 진하고, 한눈에** 찾히는 글자가 먼저입니다.
- 한 장에 강조는 하나. 제목 → 날짜·장소 → 말씀 → 로고 순서로 눈이 흐르게 합니다.

## 2. 색 (Color Palette & Roles)

색은 이름이 아니라 **역할**로 씁니다. 디자인은 아래 CSS 변수만 쓰고, 테마를 바꾸면 값이 통째로 바뀝니다.

| 변수 | 역할 |
|---|---|
| `--bg` | 장 바탕 |
| `--surface` | 바탕 위 상자 |
| `--ink` | 글자 (제목·본문) |
| `--soft` | 흐린 글자 (설명·주소) |
| `--line` | 가는 선·테두리 |
| `--accent` | 대표색 — 머리말, 강조, 색 띠 |
| `--accent2` | 둘째 색 — 작은 장식에만 |
| `--on-accent` | 대표색 바탕 위 글자 |

투명도가 필요하면 `color-mix(in srgb, var(--accent) 20%, transparent)` 처럼 섞어 씁니다.

### 테마 (교회력에 맞춰 고릅니다)

| 테마 | id | 쓰임 | bg | surface | ink | soft | line | accent | accent2 | on-accent | 제목 글꼴 | 본문 글꼴 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 동산 | `dongsan` | 남색·금빛 · 언제나 | `#FAF7F0` | `#FFFFFF` | `#17255A` | `#5B6280` | `#E6DCC3` | `#A88428` | `#4E9A2F` | `#17255A` | Noto Serif KR | Noto Sans KR |
| 동산 밤 | `night` | 어두운 바탕 · 저녁 예배·송년 | `#17213F` | `#22305A` | `#FAF7F0` | `#C8C2B0` | `#3A4878` | `#D9B95C` | `#8FB4F0` | `#17213F` | Noto Serif KR | Noto Sans KR |
| 새벽 종이 | `dawn` | 크림·흙빛 · 말씀 카드 | `#F4EDE1` | `#FFFAF2` | `#3B2A1F` | `#7A6653` | `#E2D4BE` | `#A9512F` | `#B98A2F` | `#FFFFFF` | Gowun Batang | Gowun Dodum |
| 물댄동산 | `garden` | 초록 · 성령강림 후(녹색 절기) | `#F2F6EA` | `#FFFFFF` | `#1F3A26` | `#56685A` | `#D5E2C5` | `#3F8526` | `#1A2F5C` | `#FFFFFF` | Noto Serif KR | Noto Sans KR |
| 대림절 | `advent` | 보라 · 기다림과 회개 | `#F4F0F8` | `#FFFFFF` | `#2A1B45` | `#665880` | `#DFD5EC` | `#5B3A8C` | `#B8933A` | `#FFFFFF` | Nanum Myeongjo | Noto Sans KR |
| 성탄 | `christmas` | 흰빛·금·붉은 · 성탄절 | `#FFFDF8` | `#FFFFFF` | `#1E3A2F` | `#5A6B62` | `#EEE5D0` | `#B02E2C` | `#B8933A` | `#FFFFFF` | Noto Serif KR | Noto Sans KR |
| 추수감사 | `harvest` | 가을 들녘 · 감사 절기 | `#FBF2E2` | `#FFF9EF` | `#43280F` | `#7E6247` | `#EADBC0` | `#B5561A` | `#6F7C26` | `#FFFFFF` | Gowun Batang | Gowun Dodum |
| 부활절 | `easter` | 흰 백합·봄빛 | `#FFFFFF` | `#F7F4EA` | `#2A2A2A` | `#66625A` | `#ECE7D8` | `#8F6A0C` | `#5E8C43` | `#FFFFFF` | Nanum Myeongjo | Noto Sans KR |
| 성령강림 | `pentecost` | 붉은 불꽃 · 성령강림주일 | `#FFF5F0` | `#FFFFFF` | `#3A1410` | `#7A524C` | `#F2D9CF` | `#B8352A` | `#D9791A` | `#FFFFFF` | Noto Serif KR | Noto Sans KR |
| 어린이 | `kids` | 하늘·햇살 · 교회학교 | `#EAF6FD` | `#FFFFFF` | `#173A5E` | `#486A8A` | `#CFE6F5` | `#1A72AF` | `#F2B233` | `#FFFFFF` | Jua | Gowun Dodum |
| 청년 | `youth` | 밤·네온 · 청년부 | `#111827` | `#1E293B` | `#F3F4F6` | `#A8B3C4` | `#334155` | `#FF7A59` | `#5FD3C4` | `#111827` | Black Han Sans | Noto Sans KR |

- 모든 테마는 글자(`ink`)와 바탕의 명암비가 10:1 이상, 흐린 글자(`soft`)도 4.5:1 이상입니다.
- 교회 로고 색: 잎 `#7FB539`·`#4E9A2F`·`#2F7A3A`, 줄기 `#7A5230`, 글자 남색 `#17255A` (`assets/logo/README.md`).
- 교회력과 테마: 대림절 → `advent`, 성탄 → `christmas`, 추수감사주일(11월 첫째 주일) → `harvest`,
  송년·송구영신 → `night`, 부활절 → `easter`, 성령강림주일 → `pentecost`, 그 밖의 녹색 절기 → `garden`.
  스튜디오는 `church-plan.html` 의 주일 이름·강단색을 보고 저절로 고릅니다.

## 3. 글자 (Typography Rules)

| 변수 | 쓰임 |
|---|---|
| `--font-title` | 제목·말씀 인용 |
| `--font-body` | 본문·날짜·장소 |
| `--font-hand` | 손글씨 포인트 (Nanum Pen Script) — 한두 낱말만 |

- 모두 구글 폰트의 한글 글꼴입니다. 없는 굵기를 억지로 굵게 만들지 않습니다(`font-synthesis:none`).
- 줄바꿈은 낱말 단위(`word-break:keep-all`). 제목은 `<br>` 로 끊을 자리를 직접 정합니다.
- 본문 글자는 **장 가로 폭의 2.6% 이상**, 줄 간격 1.5 이상.
- 날짜는 요일과 함께: `11월 1일(주일) 오전 11시`.
- 영어 장식 문구(WELCOME, Thanksgiving)는 부탁이 없으면 쓰지 않습니다.

## 4. 요소 (Component Stylings)

- **머리말** — 작은 굵은 글자, `--accent`, 자간을 조금 넓히고 뒤에 짧은 선.
- **제목** — `--font-title`, 아주 크게(짧은 제목은 장 짧은 변의 10~12%).
- **말씀 인용** — 왼쪽에 `--accent` 세로줄, 아래에 장·절. **“ ” 안은 개역개정 원문 그대로**, 풀어 쓴 말은 ‘ ’.
- **일시·장소** — 이름(`--accent`)과 값의 두 줄 표. 위에 가는 `--line` 선.
- **로고** — `assets/logo/dongsan-logo.png` (밝은 바탕) / `dongsan-logo-white.png` (어두운 바탕). 장 아래쪽에 작게 한 번.
- **장식** — CSS 원·호·선, 인라인 SVG(빛·잎·물결·별). 바깥 그림은 쓰지 않습니다.

## 5. 배치 (Layout Principles)

- 바깥 여백은 장 짧은 변의 8~10%.
- 세로 장: 위(머리말·제목) — 가운데(여백 또는 그림) — 아래(말씀·일시·장소·로고).
- 가로 장(예배 화면): 왼쪽 제목, 오른쪽 말씀·정보의 두 단.
- 장식은 가장자리로 밀어 글과 겹치지 않게.

## 6. 깊이 (Depth & Elevation)

- 그림자는 거의 쓰지 않습니다. 겹침은 색 면과 가는 선으로 나눕니다.
- 모든 요소를 둥근 카드에 넣지 않습니다.

## 7. 하라 · 하지 말라 (Do's and Don'ts)

**하라**
- 색·글꼴은 변수로만 — 테마만 바꾸면 전체가 바뀌게
- 글자가 장 밖으로 넘치지 않게 길이에 맞춰 크기 조절
- 성경 인용은 개역개정 원문과 글자까지 같게 (`dongsan_bible.js` 로 대조)

**하지 말라**
- 보라-파랑 그라데이션 배경, 반짝이 이모지 줄줄이, 뜻 없는 큰 숫자·통계
- 요청에 없는 사람 이름·전화번호·계좌번호 지어내기
- 교인 개인정보(이름·연락처·주소) 넣어서 저장소에 올리기 — 이 저장소는 공개입니다

## 8. 크기 (Responsive Behavior)

디자인은 한 장(`<section class="page">`)씩 크기가 정해져 있습니다. 화면 크기(px)로 그리고, 그림으로 저장할 때 배수로 키웁니다.
글자·간격은 `cqmin`/`cqw`/`cqh`(장 크기 비례 단위)로 쓰면 어느 크기에도 맞습니다.

| 크기 | id | 화면(px) | 저장 그림(px) | 쓰임 |
|---|---|---|---|---|
| 📄 A4 포스터 | `poster` | 794 × 1123 | 1588 × 2246 | 게시판·출력 (인쇄하면 정확히 A4) |
| 🟨 카드뉴스 | `square` | 540 × 540 | 1080 × 1080 | 단톡방·인스타 1:1 |
| 📱 휴대폰 세로 | `story` | 540 × 960 | 1080 × 1920 | 단톡방·스토리 9:16 |
| 🖥 예배 화면 | `slide` | 960 × 540 | 1920 × 1080 | 광고·찬양 슬라이드 16:9 · 여러 장 |
| 📰 주보 표지 | `bulletin` | 559 × 794 | 1677 × 2382 | A5 세로 |
| 🎌 현수막 | `banner` | 1100 × 200 | 3300 × 600 | 가로 5.5:1 |

## 9. AI 에게 부탁할 때 (Agent Prompt Guide)

출력은 **HTML 조각**입니다 — `<style>` 하나와 장마다 `<section class="page">`. `<html>`·`<script>`·바깥 주소는 쓰지 않습니다.
스튜디오가 이 조각을 테마 변수·글꼴·장 크기가 들어 있는 문서로 감싸 보여 주고, 인쇄하고, 그림으로 저장합니다.

```html
<style>
  .hero{position:absolute;inset:0;padding:9cqmin 8cqmin;display:flex;flex-direction:column}
  .hero .k{font:700 3.3cqmin var(--font-body);color:var(--accent)}
  .hero h1{font:900 11cqmin/1.2 var(--font-title);color:var(--ink)}
</style>
<section class="page">
  <div class="hero">
    <div class="k">2026 추수감사주일</div>
    <h1>감사로<br>드리는 예배</h1>
  </div>
</section>
```

부탁 예시
- "11월 1일 추수감사주일 예배 안내 A4 포스터, 추수감사 테마, 시편 100:4 넣어서"
- "대림절 첫째 주일 예배 화면 4장 — 촛불 하나를 밝히는 장면"
- "새가족 환영 카드, 휴대폰 세로, 새벽 종이 테마"

교회 정보: 동산감리교회 · 기독교대한감리회 · 담임 류선희 목사 · 강원도 태백시 계산4길 25 ·
주일 오전 예배 11:00 · 주일 오후 예배 14:00 · 교회학교 9:00 · 수요 예배 19:30 · 금요 기도회 20:00 · 아침 기도회(월~금) 06:00

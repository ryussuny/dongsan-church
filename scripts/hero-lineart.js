#!/usr/bin/env node
/* ===========================================================
   첫 화면에 깔 단체사진 만들기

     node scripts/hero-lineart.js <원본사진> [저장할 곳] [가로크기]

   예) node scripts/hero-lineart.js "photos/단체사진/2026-07-25 단체사진.jpg"

   먼저 sketch-photo.js 로 연필 스케치를 만든 뒤, 흰 종이는 비우고
   연필선만 흰색으로 남긴 그림(PNG)으로 바꾼다. 첫 화면은 짙은 남색이라
   종이가 남아 있으면 흰 상자처럼 보이기 때문이다.

   맨 윗줄만 살짝 눕혀 남색 바탕에 자연스럽게 스며들게 한다.
   얼굴은 잘리지 않아야 하므로 사진 전체를 그대로 담는다.

   올라가는 파일은 스케치라 원본 사진은 공개되지 않는다.
   =========================================================== */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const [, , src, outArg, widthArg] = process.argv;
if (!src) {
  console.error('사용법: node scripts/hero-lineart.js <원본사진> [저장할 곳] [가로크기=2000]');
  process.exit(1);
}
const out = outArg || path.join('assets', '첫화면-단체사진-스케치.png');
const width = Number(widthArg) || 2000;

/* 1) 연필 스케치 — 변환 방법은 한 곳(sketch-photo.js)에만 둔다 */
const tmp = path.join(os.tmpdir(), `hero-sketch-${process.pid}.jpg`);
execFileSync('node', [path.join(__dirname, 'sketch-photo.js'), src, tmp, String(width + 200), '6'], {
  stdio: 'inherit',
});

/* 2) 종이를 비우고 연필선만 흰색으로 남긴다 */
const py = `
from PIL import Image, ImageChops
import sys
src, out, W = sys.argv[1], sys.argv[2], int(sys.argv[3])

im = Image.open(src).convert('L')
if im.width != W:
    im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
w, h = im.size

# 진할수록 또렷하게 — 종이(흰 곳)는 알파 0 이 되어 비어 버린다
a = im.point(lambda g: min(255, int((((255 - g) / 255.0) ** 0.92) * 255)))
a = a.point(lambda v: 0 if v < 20 else (v // 12) * 12)

# 가장자리를 살짝 눕혀 남색 바탕에 스며들게 한다.
# 위(천장·벽)는 넉넉히, 좌우와 아래는 아주 조금만 — 사람은 지우지 않는다.
fade = Image.new('L', (1, h))
px = fade.load()
for y in range(h):
    t = y / (h - 1)
    if t < 0.14:   v = t / 0.14
    elif t > 0.96: v = 1 - (t - 0.96) / 0.04
    else:          v = 1.0
    px[0, y] = int(max(0.0, min(1.0, v)) * 255)
a = ImageChops.multiply(a, fade.resize((w, h)))

side = Image.new('L', (w, 1))
sx = side.load()
for x in range(w):
    t = x / (w - 1)
    v = t / 0.03 if t < 0.03 else (1 - (t - 0.97) / 0.03 if t > 0.97 else 1.0)
    sx[x, 0] = int(max(0.0, min(1.0, v)) * 255)
a = ImageChops.multiply(a, side.resize((w, h)))
a = a.point(lambda v: 0 if v < 8 else (v // 12) * 12)

Image.merge('LA', (Image.new('L', (w, h), 255), a)).save(out, optimize=True)
print(f'{w}x{h}')
`;

const size = execFileSync('python3', ['-c', py, tmp, out, String(width)], { encoding: 'utf8' }).trim();
fs.unlinkSync(tmp);

const kb = Math.round(fs.statSync(out).size / 1024);
console.log(`✓ 첫 화면 그림을 만들었습니다 — ${out} (${size}, ${kb}KB)`);
console.log('  index.html 의 .hero-photo 가 이 파일을 씁니다.');

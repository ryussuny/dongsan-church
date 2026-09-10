#!/usr/bin/env node
/* ===========================================================
   첫 화면에 깔 단체사진 만들기

     node scripts/hero-lineart.js <원본사진> [저장할 곳] [가로크기]

   예) node scripts/hero-lineart.js "photos/단체사진/2026-07-25 단체사진.jpg"

   먼저 sketch-photo.js 로 연필 스케치를 만든 뒤, 흰 종이는 비우고
   연필선만 흰색으로 남긴 그림(PNG)으로 바꾼다. 첫 화면은 짙은 남색이라
   종이가 남아 있으면 흰 상자처럼 보이기 때문이다.

   위쪽은 서서히 사라지고 맨 아래도 조금 눕혀 두었다. 글씨 위로
   그림이 올라와 읽기를 방해하지 않게 하려는 것이다.

   올라가는 파일은 스케치라 원본 사진은 공개되지 않는다.
   =========================================================== */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const [, , src, outArg, widthArg] = process.argv;
if (!src) {
  console.error('사용법: node scripts/hero-lineart.js <원본사진> [저장할 곳] [가로크기=1600]');
  process.exit(1);
}
const out = outArg || path.join('assets', '첫화면-단체사진-스케치.png');
const width = Number(widthArg) || 1600;

/* 1) 연필 스케치 — 변환 방법은 한 곳(sketch-photo.js)에만 둔다 */
const tmp = path.join(os.tmpdir(), `hero-sketch-${process.pid}.jpg`);
execFileSync('node', [path.join(__dirname, 'sketch-photo.js'), src, tmp, String(width + 200), '8'], {
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
a = im.point(lambda g: min(255, int((((255 - g) / 255.0) ** 1.15) * 255)))
a = a.point(lambda v: 0 if v < 28 else (v // 16) * 16)

# 위는 서서히 나타나고 맨 아래는 조금 눕힌다
fade = Image.new('L', (1, h))
px = fade.load()
for y in range(h):
    t = y / (h - 1)
    if t < 0.34:   v = t / 0.34
    elif t > 0.93: v = 1 - (t - 0.93) / 0.07 * 0.45
    else:          v = 1.0
    px[0, y] = int(max(0.0, min(1.0, v)) * 255)
a = ImageChops.multiply(a, fade.resize((w, h)))
a = a.point(lambda v: 0 if v < 10 else (v // 16) * 16)

Image.merge('LA', (Image.new('L', (w, h), 255), a)).save(out, optimize=True)
print(f'{w}x{h}')
`;

const size = execFileSync('python3', ['-c', py, tmp, out, String(width)], { encoding: 'utf8' }).trim();
fs.unlinkSync(tmp);

const kb = Math.round(fs.statSync(out).size / 1024);
console.log(`✓ 첫 화면 그림을 만들었습니다 — ${out} (${size}, ${kb}KB)`);
console.log('  index.html 의 .hero-photo 가 이 파일을 씁니다.');

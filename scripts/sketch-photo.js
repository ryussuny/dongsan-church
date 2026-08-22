#!/usr/bin/env node
/* ===========================================================
   사진을 연필 스케치로 바꾸기

     node scripts/sketch-photo.js <원본> <저장할 곳> [가로크기] [번짐]

   예) node scripts/sketch-photo.js 원본.jpg "photos/담임목사/인사말.jpg" 1400 9

   흑백으로 바꾼 그림 위에, 같은 그림을 반전·흐림 처리해 겹치면(color dodge)
   면은 하얗게 날아가고 윤곽선만 남아 연필로 그린 것처럼 된다.

   브라우저에서 처리하지 않고 파일에 미리 입히는 이유:
   홈페이지가 공개라 원본 사진을 올리면 누구나 내려받을 수 있기 때문이다.
   이렇게 하면 올라가는 파일 자체가 스케치라 원본은 공개되지 않는다.

   파이썬 Pillow 를 쓴다(이 저장소는 노드 의존성을 두지 않는다).
   =========================================================== */
const { execFileSync } = require('child_process');
const path = require('path');

const [, , src, out, widthArg, radiusArg] = process.argv;
if (!src || !out) {
  console.error('사용법: node scripts/sketch-photo.js <원본> <저장할 곳> [가로크기=1400] [번짐=9]');
  process.exit(1);
}
const width = Number(widthArg) || 1400;
const radius = Number(radiusArg) || 9;

const py = `
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
import sys
src, out, W, R = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])

im = Image.open(src).convert('RGB')
if im.width > W:
    im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)

g = ImageOps.grayscale(im)
blur = ImageOps.invert(g).filter(ImageFilter.GaussianBlur(R))

gp, bp = g.load(), blur.load()
res = Image.new('L', g.size)
rp = res.load()
for y in range(g.size[1]):
    for x in range(g.size[0]):
        b = bp[x, y]
        rp[x, y] = 255 if b >= 255 else min(255, (gp[x, y] * 255) // (255 - b))

res = ImageEnhance.Brightness(res).enhance(1.04)
res = ImageEnhance.Contrast(res).enhance(1.06)
res.convert('RGB').save(out, quality=86, optimize=True, progressive=True)
print(f'{res.size[0]}x{res.size[1]}')
`;

const size = execFileSync('python3', ['-c', py, src, out, String(width), String(radius)], {
  encoding: 'utf8',
}).trim();

console.log(`✓ 연필 스케치로 저장했습니다 — ${path.relative(process.cwd(), out)} (${size})`);
console.log('  원본은 저장소에 올리지 마세요. 올라간 파일 자체가 스케치입니다.');

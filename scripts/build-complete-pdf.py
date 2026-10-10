"""묵상집 완성본 PDF — 앞표지 + 내지 + 뒷표지를 한 파일로 묶는다.

인쇄소에 내는 기본 파일은 book/print/ 의 내지(154×216mm)와 cover/ 의 표지 펼침면이다.
이 스크립트는 그 두 파일을 그대로 써서, 처음부터 끝까지 한 권으로 넘겨 보는 「완성본」을 만든다.
  - 1쪽: 앞표지 (표지 펼침면의 오른쪽을 잘라 154×216mm, 도련 3mm 포함)
  - 2쪽~: 내지 그대로
  - 마지막: 뒷표지 (펼침면의 왼쪽)
쪽마다 TrimBox(148×210mm)·BleedBox 를 넣어 둔다.

실행:  python3 scripts/build-complete-pdf.py  [어른 책등mm] [어린이 책등mm]   (기본 9.5 · 5.5)
       build-book.js · finish-print.py 다음에 돌린다.
"""
import os
import sys

import pymupdf

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PR = os.path.join(ROOT, 'book', 'print')
OUT = os.path.join(PR, '완성본')
MM = 72 / 25.4
W, H, B = 154 * MM, 216 * MM, 3 * MM  # 도련 포함 한 쪽, 도련


def spine_name(v):
    return ('%g' % v).replace('.', '_') + 'mm'


def build(book, label, spine):
    inner = pymupdf.open(os.path.join(PR, 'first-faith-%s-inner.pdf' % book))
    cover = pymupdf.open(os.path.join(PR, 'cover', 'first-faith-%s-cover-spine%s.pdf' % (book, spine_name(spine))))
    cw = cover[0].rect.width
    out = pymupdf.open()

    def add_cover(x0):
        pg = out.new_page(-1, width=W, height=H)
        pg.show_pdf_page(pg.rect, cover, 0, clip=pymupdf.Rect(x0, 0, x0 + W, H))
        return pg

    add_cover(cw - W)          # 앞표지: 펼침면 오른쪽 154mm (왼쪽 3mm 는 책등 쪽 도련)
    out.insert_pdf(inner)      # 내지
    add_cover(0)               # 뒷표지: 펼침면 왼쪽 154mm
    for pg in out:
        m = pg.mediabox  # 쪽마다 실제 크기를 기준으로 (반올림 차이로 밖으로 삐져나가지 않게)
        pg.set_bleedbox(m)
        pg.set_trimbox(pymupdf.Rect(m.x0 + B, m.y0 + B, m.x1 - B, m.y1 - B))
    out.set_metadata({'title': '처음 신앙, 매일 한 걸음 — %s 완성본 (표지 포함)' % label,
                      'author': '동산감리교회', 'subject': 'A5 무선제본 · 도련 3mm · 책등 %gmm 표지' % spine})
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, '처음신앙_%s_완성본_표지포함.pdf' % label)
    out.save(path, garbage=3, deflate=True)
    print(label, len(out), '쪽 →', os.path.relpath(path, ROOT), '%dKB' % (os.path.getsize(path) // 1024))


if __name__ == '__main__':
    sa = float(sys.argv[1]) if len(sys.argv) > 1 else 9.5
    sk = float(sys.argv[2]) if len(sys.argv) > 2 else 5.5
    build('adult', '어른용', sa)
    build('kids', '어린이용', sk)

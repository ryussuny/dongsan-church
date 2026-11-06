"""설교 묵상집 완성본 PDF — 앞표지 + 내지 + 뒷표지를 한 권씩 한 파일로 묶는다.

인쇄소에 내는 기본 파일은 book/print/ 의 내지(sermon-<책>-inner.pdf, 154×216mm)와 cover/ 의 표지 펼침면이다.
이 스크립트는 그 두 파일을 그대로 써서, 처음부터 끝까지 한 권으로 넘겨 보는 「완성본」을 만든다.
  - 1쪽: 앞표지 (표지 펼침면의 오른쪽 154mm, 도련 3mm 포함)
  - 2쪽~: 내지 그대로 (1쪽은 속표지)
  - 마지막: 뒷표지 (펼침면의 왼쪽 154mm)
쪽마다 TrimBox(148×210mm)·BleedBox 를 넣어 둔다.

실행:  python3 scripts/build-sermon-complete-pdf.py            (책마다 가운데 책등 두께의 표지를 쓴다)
       python3 scripts/build-sermon-complete-pdf.py romans=8 ephesians=5.5
       scripts/build-sermon-book.js · scripts/finish-print.py 다음에 돌린다.  (pip install pymupdf)
"""
import glob
import os
import re
import sys

import pymupdf

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PR = os.path.join(ROOT, 'book', 'print')
OUT = os.path.join(PR, '완성본')
MM = 72 / 25.4
W, H, B = 154 * MM, 216 * MM, 3 * MM  # 도련 포함 한 쪽, 도련
BOOKS = {'romans': '로마서', 'philippians': '빌립보서', 'ephesians': '에베소서'}


def covers(book):
    """이 책의 표지 펼침면 파일들 {책등mm: 경로} (확인용 제외)"""
    out = {}
    for f in glob.glob(os.path.join(PR, 'cover', 'sermon-%s-cover-spine*mm.pdf' % book)):
        m = re.search(r'spine(\d+)(?:_(\d))?mm\.pdf$', f)
        if m:
            out[float(m.group(1) + ('.' + m.group(2) if m.group(2) else ''))] = f
    return out


def build(book, spine=None):
    cs = covers(book)
    if not cs:
        print(book, '표지 펼침면이 없습니다 — 먼저 node scripts/build-sermon-book.js')
        return
    thick = sorted(s for s in cs if s > 0) or sorted(cs)
    if spine is None:
        spine = thick[len(thick) // 2]
    if spine not in cs:
        print(book, '책등 %gmm 표지가 없습니다. 있는 것: %s' % (spine, ', '.join('%g' % s for s in sorted(cs))))
        return
    inner = pymupdf.open(os.path.join(PR, 'sermon-%s-inner.pdf' % book))
    cover = pymupdf.open(cs[spine])
    cw = cover[0].rect.width
    out = pymupdf.open()

    def add_cover(x0):
        pg = out.new_page(-1, width=W, height=H)
        pg.show_pdf_page(pg.rect, cover, 0, clip=pymupdf.Rect(x0, 0, x0 + W, H))

    add_cover(cw - W)          # 앞표지: 펼침면 오른쪽 154mm
    out.insert_pdf(inner)      # 내지
    add_cover(0)               # 뒷표지: 펼침면 왼쪽 154mm
    for pg in out:
        m = pg.mediabox
        pg.set_bleedbox(m)
        pg.set_trimbox(pymupdf.Rect(m.x0 + B, m.y0 + B, m.x1 - B, m.y1 - B))
    name = BOOKS[book]
    out.set_metadata({'title': '%s 설교 묵상집 — 완성본 (표지 포함)' % name, 'author': '동산감리교회',
                      'subject': 'A5 · 도련 3mm · 책등 %gmm 표지' % spine})
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, '%s_설교묵상집_완성본_표지포함.pdf' % name)
    out.save(path, garbage=3, deflate=True)
    print(name, len(out), '쪽 (책등 %gmm 표지) →' % spine, os.path.relpath(path, ROOT), '%dKB' % (os.path.getsize(path) // 1024))


if __name__ == '__main__':
    pick = dict(a.split('=') for a in sys.argv[1:] if '=' in a)
    for bk in BOOKS:
        build(bk, float(pick[bk]) if bk in pick else None)

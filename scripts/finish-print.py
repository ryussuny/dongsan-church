"""인쇄소에 넘기는 PDF의 쪽 크기를 mm 단위로 정확히 맞추고 재단선(TrimBox)·도련(BleedBox)을 적는다.

크롬은 PDF를 만들 때 쪽 크기를 화면 점 단위로 반올림해서 216mm가 215.9mm처럼 조금 어긋난다.
여기서 정확한 크기의 새 쪽에 원래 쪽을 그대로(벡터·글꼴 유지) 얹어 다시 저장한다.

    pip install pymupdf
    python3 scripts/finish-print.py        # book/print 아래 PDF 전부
"""
import glob, os, re, sys
import pymupdf

MM = 72 / 25.4
BLEED = 3


def fix(path, w_mm, h_mm):
    src = pymupdf.open(path)
    out = pymupdf.open()
    W, H = w_mm * MM, h_mm * MM
    for i in range(len(src)):
        pg = out.new_page(width=W, height=H)
        pg.show_pdf_page(pg.rect, src, i, keep_proportion=False)
        pg.set_bleedbox(pg.rect)
        pg.set_trimbox(pymupdf.Rect(BLEED * MM, BLEED * MM, W - BLEED * MM, H - BLEED * MM))
    out.set_metadata({'title': os.path.basename(path), 'author': '동산감리교회', 'creator': 'word-book.html'})
    tmp = path + '.tmp'
    out.save(tmp, garbage=3, deflate=True)
    os.replace(tmp, path)
    d = pymupdf.open(path)
    r = d[0].rect
    return len(d), round(r.width / MM, 2), round(r.height / MM, 2)


def main(root):
    for f in sorted(glob.glob(os.path.join(root, 'book', 'print', '**', '*.pdf'), recursive=True)):
        name = os.path.basename(f)
        m = re.search(r'spine(\d+)(?:_(\d))?mm', name)
        if m:
            spine = float(m.group(1) + ('.' + m.group(2) if m.group(2) else ''))
            w = BLEED + 148 + spine + 148 + BLEED
        elif '-inner' in name:
            w = 148 + 2 * BLEED
        else:
            continue
        n, ww, hh = fix(f, w, 210 + 2 * BLEED)
        print(f'{name}: {n}쪽 {ww}×{hh}mm (재단 {ww - 6:.1f}×{hh - 6:.1f}mm)')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..'))

# -*- coding: utf-8 -*-
"""QR 코드 만들기 — 바이트 모드, 버전 1~10. 외부 패키지 없이.

    python3 scripts/qr-encode.py "https://..." 파일이름

  assets/qr/ 에 .svg 와 .png 를 만든다. 주소가 바뀌면 다시 돌리면 된다.
  만든 QR 은 scripts 옆의 검증 코드로 되읽어 확인했다(형식정보·오류정정·내용)."""

# 버전별 전체 코드워드 수
TOTAL_CW = {1:26,2:44,3:70,4:100,5:134,6:172,7:196,8:242,9:292,10:346}
# (버전, 등급) -> (블록당 EC 코드워드, [(블록수, 블록당 데이터 코드워드), ...])
BLOCKS = {
 (1,'M'):(10,[(1,16)]), (2,'M'):(16,[(1,28)]), (3,'M'):(26,[(1,44)]),
 (4,'M'):(18,[(2,32)]), (5,'M'):(24,[(2,43)]), (6,'M'):(16,[(4,27)]),
 (7,'M'):(18,[(4,31)]), (8,'M'):(22,[(2,38),(2,39)]),
 (9,'M'):(22,[(3,36),(2,37)]), (10,'M'):(26,[(4,43),(1,44)]),
 (1,'Q'):(13,[(1,13)]), (2,'Q'):(22,[(1,22)]), (3,'Q'):(18,[(2,17)]),
 (4,'Q'):(26,[(2,24)]), (5,'Q'):(18,[(2,15),(2,16)]), (6,'Q'):(24,[(4,19)]),
 (7,'Q'):(18,[(2,14),(4,15)]), (8,'Q'):(22,[(4,18),(2,19)]),
 (9,'Q'):(20,[(4,16),(4,17)]), (10,'Q'):(24,[(6,19),(2,20)]),
 (1,'H'):(17,[(1,9)]), (2,'H'):(28,[(1,16)]), (3,'H'):(22,[(2,13)]),
 (4,'H'):(16,[(4,9)]), (5,'H'):(22,[(2,11),(2,12)]), (6,'H'):(28,[(4,15)]),
 (7,'H'):(26,[(4,13),(1,14)]), (8,'H'):(26,[(4,14),(2,15)]),
 (9,'H'):(24,[(4,12),(4,13)]), (10,'H'):(28,[(6,15),(2,16)]),
}
ALIGN = {1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],
         7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,50]}
# 버전 7~10 버전정보 비트열
VERINFO = {7:0x07C94,8:0x085BC,9:0x09A99,10:0x0A4D3}
ECL_BITS = {'L':0b01,'M':0b00,'Q':0b11,'H':0b10}

# ── GF(256) ──
EXP=[0]*512; LOG=[0]*256
x=1
for i in range(255):
    EXP[i]=x; LOG[x]=i
    x<<=1
    if x&0x100: x^=0x11D
for i in range(255,512): EXP[i]=EXP[i-255]

def gmul(a,b):
    if a==0 or b==0: return 0
    return EXP[LOG[a]+LOG[b]]

def rs_generator(n):
    g=[1]
    for i in range(n):
        ng=[0]*(len(g)+1)
        for j,c in enumerate(g):
            ng[j]^=gmul(c,1) if False else 0
        # 다항식 곱 (x - a^i)
        ng=[0]*(len(g)+1)
        for j in range(len(g)):
            ng[j]^=g[j]
            ng[j+1]^=gmul(g[j],EXP[i])
        g=ng
    return g

def rs_encode(data,n):
    g=rs_generator(n)
    res=list(data)+[0]*n
    for i in range(len(data)):
        c=res[i]
        if c:
            for j in range(1,len(g)):
                res[i+j]^=gmul(g[j],c)
    return res[len(data):]

# ── 데이터 인코딩 ──
def pick_version(nbytes, ecl):
    for v in range(1,11):
        ec,grp=BLOCKS[(v,ecl)]
        cap=sum(cnt*dcw for cnt,dcw in grp)
        # 모드4 + 길이8(v1-9)/16(v10) + 데이터
        hdr = 4 + (8 if v<10 else 16)
        if cap*8 >= hdr + nbytes*8: return v
    raise ValueError('내용이 너무 깁니다 (버전 10 초과)')

def encode_data(payload, v, ecl):
    ec_per, grp = BLOCKS[(v,ecl)]
    total_data = sum(cnt*dcw for cnt,dcw in grp)
    bits=[]
    def put(val,n):
        for i in range(n-1,-1,-1): bits.append((val>>i)&1)
    put(0b0100,4)
    put(len(payload), 8 if v<10 else 16)
    for b in payload: put(b,8)
    rem = total_data*8 - len(bits)
    put(0, min(4,rem))
    while len(bits)%8: bits.append(0)
    pad=[0xEC,0x11]; i=0
    while len(bits) < total_data*8:
        put(pad[i%2],8); i+=1
    dcw=[int(''.join(map(str,bits[i:i+8])),2) for i in range(0,len(bits),8)]

    blocks=[]; pos=0
    for cnt,n in grp:
        for _ in range(cnt):
            blocks.append(dcw[pos:pos+n]); pos+=n
    ecs=[rs_encode(b,ec_per) for b in blocks]

    out=[]
    for i in range(max(len(b) for b in blocks)):
        for b in blocks:
            if i<len(b): out.append(b[i])
    for i in range(ec_per):
        for e in ecs: out.append(e[i])
    return out

# ── 매트릭스 ──
def make_matrix(v):
    n = 17+4*v
    m=[[None]*n for _ in range(n)]
    def finder(r,c):
        for i in range(-1,8):
            for j in range(-1,8):
                rr,cc=r+i,c+j
                if 0<=rr<n and 0<=cc<n:
                    on = (0<=i<7 and 0<=j<7) and (i in (0,6) or j in (0,6) or (2<=i<=4 and 2<=j<=4))
                    m[rr][cc]=1 if on else 0
    finder(0,0); finder(0,n-7); finder(n-7,0)
    for i in range(8,n-8):
        b = 1 if i%2==0 else 0
        if m[6][i] is None: m[6][i]=b
        if m[i][6] is None: m[i][6]=b
    for r in ALIGN[v]:
        for c in ALIGN[v]:
            if (r<9 and c<9) or (r<9 and c>n-10) or (r>n-10 and c<9): continue
            for i in range(-2,3):
                for j in range(-2,3):
                    m[r+i][c+j] = 1 if (max(abs(i),abs(j))!=1) else 0
    m[n-8][8]=1                      # 항상 검은 모듈
    for i in range(9):               # 형식정보 자리 예약
        if m[8][i] is None: m[8][i]=0
        if m[i][8] is None: m[i][8]=0
    for i in range(8):
        m[8][n-1-i]=0; m[n-1-i][8]=0
    if v>=7:
        for i in range(18):
            r,c=i//3, i%3
            m[n-11+c][r]=0; m[r][n-11+c]=0
    return m,n

def place_data(m,n,cw,v):
    reserved=[[m[r][c] is not None for c in range(n)] for r in range(n)]
    bits=[(b>>i)&1 for b in cw for i in range(7,-1,-1)]
    idx=0; up=True; col=n-1
    while col>0:
        if col==6: col-=1
        rows = range(n-1,-1,-1) if up else range(n)
        for r in rows:
            for c in (col,col-1):
                if not reserved[r][c]:
                    m[r][c] = bits[idx] if idx<len(bits) else 0
                    idx+=1
        up = not up; col-=2
    return reserved

MASKS=[lambda r,c:(r+c)%2==0, lambda r,c:r%2==0, lambda r,c:c%3==0,
       lambda r,c:(r+c)%3==0, lambda r,c:(r//2+c//3)%2==0, lambda r,c:(r*c)%2+(r*c)%3==0,
       lambda r,c:((r*c)%2+(r*c)%3)%2==0, lambda r,c:((r+c)%2+(r*c)%3)%2==0]

def penalty(m,n):
    p=0
    for line in list(m)+[list(col) for col in zip(*m)]:
        run=1
        for i in range(1,n):
            if line[i]==line[i-1]: run+=1
            else:
                if run>=5: p+=3+(run-5)
                run=1
        if run>=5: p+=3+(run-5)
    for r in range(n-1):
        for c in range(n-1):
            if m[r][c]==m[r][c+1]==m[r+1][c]==m[r+1][c+1]: p+=3
    pat=[1,0,1,1,1,0,1,0,0,0,0]
    for line in list(m)+[list(col) for col in zip(*m)]:
        for i in range(n-10):
            if line[i:i+11]==pat or line[i:i+11]==pat[::-1]: p+=40
    dark=sum(sum(r) for r in m); total=n*n
    p += 10*(abs(dark*100//total-50)//5)
    return p

def fmt_bits(ecl,mask):
    d=(ECL_BITS[ecl]<<3)|mask
    v=d<<10
    g=0b10100110111
    for i in range(4,-1,-1):
        if v & (1<<(i+10)): v ^= g<<i
    return ((d<<10)|v) ^ 0b101010000010010

def put_format(m,n,ecl,mask):
    f=fmt_bits(ecl,mask)
    for i in range(15):
        b=(f>>i)&1
        if i<6: m[8][i]=b
        elif i==6: m[8][7]=b
        elif i==7: m[8][8]=b
        elif i==8: m[7][8]=b
        else: m[14-i][8]=b
        if i<8: m[n-1-i][8]=b
        else: m[8][n-15+i]=b
    m[n-8][8]=1

def put_version(m,n,v):
    if v<7: return
    val=VERINFO[v]
    for i in range(18):
        b=(val>>i)&1
        r,c=i//3,i%3
        m[n-11+c][r]=b; m[r][n-11+c]=b

def make_qr(text, ecl='Q'):
    payload=text.encode('utf-8')
    v=pick_version(len(payload),ecl)
    cw=encode_data(payload,v,ecl)
    base,n=make_matrix(v)
    reserved=place_data(base,n,cw,v)
    best=None
    for mask in range(8):
        m=[row[:] for row in base]
        for r in range(n):
            for c in range(n):
                if not reserved[r][c] and MASKS[mask](r,c): m[r][c]^=1
        put_format(m,n,ecl,mask); put_version(m,n,v)
        s=penalty(m,n)
        if best is None or s<best[0]: best=(s,m,mask)
    return best[1], n, v, best[2]


# ── 파일로 뽑기 ──
if __name__ == '__main__':
    import sys, os
    if len(sys.argv) < 3:
        print('사용법: python3 scripts/qr-encode.py "<주소>" <파일이름>'); raise SystemExit(1)
    url, name = sys.argv[1], sys.argv[2]
    out = os.path.join(os.path.dirname(__file__), '..', 'assets', 'qr')
    os.makedirs(out, exist_ok=True)
    m, n, v, mask = make_qr(url, 'Q')
    q = 4; size = n + 2*q
    parts = []
    for r in range(n):
        c = 0
        while c < n:
            if m[r][c]:
                c2 = c
                while c2 < n and m[r][c2]: c2 += 1
                parts.append('M%d %dh%dv1h-%dz' % (c+q, r+q, c2-c, c2-c)); c = c2
            else: c += 1
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
           'shape-rendering="crispEdges"><rect width="%d" height="%d" fill="#fff"/>'
           '<path d="%s" fill="#17255A"/></svg>' % (size, size, size*10, size*10, size, size, ''.join(parts)))
    open(os.path.join(out, name + '.svg'), 'w', encoding='utf-8').write(svg)
    try:
        from PIL import Image
        s_ = 24; side = size*s_
        img = Image.new('RGB', (side, side), 'white'); px = img.load()
        for r in range(n):
            for c in range(n):
                if m[r][c]:
                    for i in range(s_):
                        for j in range(s_):
                            px[(c+q)*s_+i, (r+q)*s_+j] = (23, 37, 90)
        img.save(os.path.join(out, name + '.png'), optimize=True)
    except ImportError:
        pass
    print('QR 만듦 — 버전 %d (%dx%d) · %s' % (v, n, n, url))

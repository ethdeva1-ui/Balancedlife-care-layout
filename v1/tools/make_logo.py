#!/usr/bin/env python3
"""Turn the site's white-background JPEG logo into clean transparent PNGs.

 1. exact colour-to-alpha against white (recovers true antialiased edges)
 2. kill JPEG ringing in the background, firm up the alpha ramp
 3. snap the two brand inks back to clean values (undoes chroma mush)
 4. trim dead margins, and cut a mark-only version for compact placements
"""
import sys, pickle, collections
sys.path.insert(0, 'tools')
from jpeg2png import decode_jpeg, write_png

SRC = 'assets/logo.jpg'
CACHE = '/tmp/claude-1000/-home-ethel-balance-care-layout/0689a44c-a6af-46e5-8ea0-74bfe6344471/scratchpad/logo.pkl'

try:
    W, H, rgb = pickle.load(open(CACHE, 'rb'))
except Exception:
    W, H, rgb = decode_jpeg(SRC)

# ---------- 1. colour-to-alpha against a white matte ----------
# Both inks sit on a flat min-channel plateau (teal ~8, charcoal ~58), so the
# lightest ink defines full opacity. Anything lighter is background or an
# antialiased ramp. Solving O = a*C + (1-a)*255 for C then removes the white
# fringe that a naive threshold would leave behind.
INK_MIN = 58
px = [None]*(W*H)
for i in range(W*H):
    o = i*3
    r, g, b = rgb[o], rgb[o+1], rgb[o+2]
    a = (255 - min(r, g, b))/(255.0 - INK_MIN)
    if a <= 0.0:
        px[i] = (0, 0, 0, 0.0); continue
    if a >= 1.0:
        px[i] = (r, g, b, 1.0); continue
    inv = 255.0*(1.0-a)
    c = tuple(min(255, max(0, int(round((v-inv)/a)))) for v in (r, g, b))
    px[i] = (c[0], c[1], c[2], a)

# ---------- 2. de-ring the background, firm the ramp ----------
FLOOR, KNEE = 0.055, 0.93
for i, (r, g, b, a) in enumerate(px):
    if a < FLOOR:
        px[i] = (0, 0, 0, 0.0)
    else:
        a2 = (a - FLOOR)/(1.0 - FLOOR)
        if a2 > KNEE:
            a2 = 1.0
        px[i] = (r, g, b, a2)

# ---------- 3. snap the two inks ----------
teal_n = dark_n = 0
teal = [0, 0, 0]; dark = [0, 0, 0]
for r, g, b, a in px:
    if a < 0.97:
        continue
    if g > r + 40 and g > 110:          # teal ink
        teal[0] += r; teal[1] += g; teal[2] += b; teal_n += 1
    elif max(r, g, b) < 110:            # charcoal ink
        dark[0] += r; dark[1] += g; dark[2] += b; dark_n += 1
TEAL = tuple(v//teal_n for v in teal)
DARK = tuple(v//dark_n for v in dark)
print('sampled inks  teal=#%02X%02X%02X (%d px)  charcoal=#%02X%02X%02X (%d px)'
      % (TEAL+(teal_n,)+DARK+(dark_n,)))

def snap(c, target, amount):
    return tuple(int(round(c[i] + (target[i]-c[i])*amount)) for i in range(3))

SNAP, TOL = 0.75, 62
for i, (r, g, b, a) in enumerate(px):
    if a < 0.55:
        continue
    c = (r, g, b)
    dt = max(abs(c[j]-TEAL[j]) for j in range(3))
    dd = max(abs(c[j]-DARK[j]) for j in range(3))
    if dt <= TOL and dt <= dd:
        px[i] = snap(c, TEAL, SNAP) + (a,)
    elif dd <= TOL:
        px[i] = snap(c, DARK, SNAP) + (a,)

# ---------- 4. trim + emit ----------
def bbox(x0, x1):
    minx, miny, maxx, maxy = x1, H, x0, 0
    for y in range(H):
        row = y*W
        for x in range(x0, x1):
            if px[row+x][3] > 0.06:
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
    return minx, miny, maxx, maxy

def emit(path, x0, y0, x1, y1, pad=6):
    x0 = max(0, x0-pad); y0 = max(0, y0-pad)
    x1 = min(W-1, x1+pad); y1 = min(H-1, y1+pad)
    w, h = x1-x0+1, y1-y0+1
    buf = bytearray(w*h*4)
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[(y0+y)*W + x0+x]
            o = (y*w+x)*4
            buf[o] = r; buf[o+1] = g; buf[o+2] = b
            buf[o+3] = int(round(a*255))
    n = write_png(path, w, h, buf)
    print('%-26s %4dx%-4d  %6.1f KB' % (path, w, h, n/1024))
    return w, h

fx0, fy0, fx1, fy1 = bbox(0, W)

# find the gutter between the icon and the "B" of the wordmark
colink = [sum(1 for y in range(H) if px[y*W+x][3] > 0.35) for x in range(W)]
run = best = None; start = 0
for x in range(fx0, fx1):
    if colink[x] == 0:
        if run is None:
            run = x
    else:
        if run is not None:
            if best is None or x-run > best[1]-best[0]:
                best = (run, x)
            run = None
gut = (best[0]+best[1])//2 if best else fx1
print('icon/wordmark gutter at x=%d' % gut)

emit('assets/logo.png', fx0, fy0, fx1, fy1)

# ---------- 4b. reversed lockup for dark backgrounds ----------
# Recolour only the charcoal ink to white; the teal is legible on black as-is,
# so the mark keeps its two-tone identity instead of going flat mono.
keep = px[:]
for i, (r, g, b, a) in enumerate(px):
    if a <= 0.0:
        continue
    if not (g > r + 25 and g > 90):          # charcoal (and its edge ramp)
        px[i] = (255, 255, 255, a)
emit('assets/logo-reversed.png', fx0, fy0, fx1, fy1)
px = keep

# the tagline runs the full width underneath, so the mark also needs a
# horizontal cut: take the widest empty row band in the lower half
rowink = [sum(1 for x in range(fx0, gut) if px[y*W+x][3] > 0.35) for y in range(H)]
run = best = None
for y in range(fy0, fy1+1):
    if rowink[y] == 0:
        if run is None:
            run = y
    else:
        if run is not None:
            if run > fy0 + (fy1-fy0)//2 and (best is None or y-run > best[1]-best[0]):
                best = (run, y)
            run = None
if run is not None and run > fy0 + (fy1-fy0)//2:
    best = (run, fy1)
cut = ((best[0]+best[1])//2) if best else fy1
print('mark baseline cut at y=%d' % cut)

mx0, my0, mx1, my1 = bbox(fx0, gut)
emit('assets/logo-mark.png', mx0, my0, mx1, min(my1, cut), pad=4)

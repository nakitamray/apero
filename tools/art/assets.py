"""Paints the cut-out art in assets/art.

    pip install numpy scipy pillow
    python tools/art/assets.py              # everything
    python tools/art/assets.py vase plate   # just some

Output goes straight to assets/art. Seeds are fixed, so re-running gives the same pictures.
"""
import os
import sys
import numpy as np
from paint import Canvas, ellipse_pts, noise
from scipy.ndimage import gaussian_filter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'art')
NAVY = '#13285E'
COBALT = '#2456B8'
SKY = '#7FB0DE'
SILVER = '#DCE5EE'
LEMON = '#F4CF35'
LEMON_DK = '#D9A817'
LEAF = '#3E7D4A'
ORANGE = '#FF7B1C'
PERSIMMON = '#E8510C'
DEEP = '#0B3B8C'
AQUA = '#1FB3CC'
TERRACOTTA = '#C8643B'
BLOOD = '#D9441E'
PINK = '#F2938C'
CREAM = '#FFF8E8'


def poly(c, pts):
    pts = [tuple(p) for p in pts]
    return c.mask(lambda d: d.polygon(pts, fill=255))


# ---------------------------------------------------------------- sardine
def sardine(seed=3, name='sardine'):
    c = Canvas(1400, 480, seed)
    t = np.linspace(0, 1, 120)
    xs = 90 + t * 1010
    top = 232 - 128 * np.sin(np.pi * np.clip(t * 0.92 + 0.04, 0, 1)) ** 0.75 * (1 - 0.35 * t)
    bot = 246 + 104 * np.sin(np.pi * np.clip(t * 0.92 + 0.04, 0, 1)) ** 0.9 * (1 - 0.4 * t)
    body_pts = np.vstack([np.stack([xs, top], 1), np.stack([xs[::-1], bot[::-1]], 1)])
    body = poly(c, body_pts)

    tail = poly(c, [(1070, 232), (1185, 150), (1310, 95), (1250, 190), (1235, 240), (1255, 300), (1320, 395), (1190, 330), (1070, 250)])
    dorsal = poly(c, [(560, 118), (640, 60), (700, 70), (720, 112)])
    anal = poly(c, [(820, 318), (880, 360), (930, 352), (930, 305)])
    pect = poly(c, [(360, 270), (470, 300), (520, 330), (420, 318)])

    # fins first, underneath
    c.wash(tail, SKY, density=0.75, wob=8)
    c.wash(tail * (np.mgrid[0:480, 0:1400][1] > 1150), COBALT, density=0.55, wob=8)
    for f in (dorsal, anal):
        c.wash(f, SKY, density=0.7)
    # silver belly
    c.wash(body, SILVER, density=0.95, blotch=0.15, edge=0.25)
    yy, xx = np.mgrid[0:480, 0:1400]
    mid = np.interp(xx, xs, (top * 0.55 + bot * 0.45)) + noise((480, 1400), 30, c.rng) * 10
    back = body * (yy < mid)
    shade = np.clip((mid - yy) / 90, 0.35, 1.2)
    c.wash(back, SKY, density=0.8, shade=shade)
    c.wash(back * (yy < mid - 25), COBALT, density=0.85, shade=shade)
    c.wash(body * (yy < np.interp(xx, xs, top) + 30), NAVY, density=0.5, wob=4)
    # lateral sheen
    c.wash(body * (abs(yy - mid - 12) < 7), '#FFFFFF', density=0.55, wob=3)
    # tiger stripes
    for x0 in range(430, 1060, 46):
        ty = np.interp(x0, xs, top) + 6
        L = (np.interp(x0, xs, bot) - ty) * 0.42
        pts = [(x0, ty), (x0 - 14, ty + L * 0.35), (x0 + 6, ty + L * 0.7), (x0 - 6, ty + L)]
        c.stroke(pts, NAVY, width=9, alpha=0.85, jitter=2)
    # head
    head = body * (xx < 330)
    c.wash(head, '#B9C9DA', density=0.45, wob=3)
    c.wash(poly(c, ellipse_pts(275, 290, 55, 30, rot=-0.4)), PINK, density=0.55, wob=6, soft=4)
    c.stroke(ellipse_pts(300, 245, 40, 95, start=-1.2, end=1.2), NAVY, width=7, alpha=0.8)
    c.stroke([(105, 252), (170, 262), (225, 258)], NAVY, width=5, alpha=0.7)
    c.wash(poly(c, ellipse_pts(190, 215, 30, 30)), '#FFFFFF', density=1, wob=1)
    c.wash(poly(c, ellipse_pts(190, 215, 21, 21)), LEMON, density=0.95, wob=1)
    c.wash(poly(c, ellipse_pts(190, 215, 12, 12)), '#0B1430', density=1, wob=1, soft=0.6)
    c.wash(poly(c, ellipse_pts(185, 209, 4, 4)), '#FFFFFF', density=1, wob=0, soft=0.4)
    c.wash(pect, SKY, density=0.7)
    # loose outline
    c.stroke(np.stack([xs, top], 1)[::3][4:], NAVY, width=5, alpha=0.75)
    c.stroke(np.stack([xs, bot], 1)[::3][2:-4], NAVY, width=4, alpha=0.6)
    c.stroke([(1235, 240), (1250, 190), (1310, 95)], NAVY, width=4, alpha=0.6)
    c.stroke([(1235, 240), (1255, 300), (1320, 395)], NAVY, width=4, alpha=0.6)
    for k in range(5):
        c.stroke([(1110, 236), (1290 - k * 6, 120 + k * 55)], COBALT, width=3, alpha=0.5)
    c.save(f'{OUT}/{name}.png', size=(700, 260))


# ---------------------------------------------------------------- lemon
def lemon(seed=5):
    c = Canvas(900, 800, seed)
    leaf = poly(c, np.vstack([ellipse_pts(700, 150, 170, 60, rot=-0.75, start=np.pi, end=2 * np.pi), ellipse_pts(700, 150, 170, 45, rot=-0.75, start=0, end=np.pi)]))
    c.wash(leaf, LEAF, density=0.8)
    c.wash(leaf * (noise((800, 900), 25, c.rng) > 0.3), '#2C5E37', density=0.5)
    c.stroke([(640, 270), (700, 150), (780, 60)], '#24502E', width=5, alpha=0.6)
    body_pts = np.vstack([
        ellipse_pts(430, 470, 290, 230, rot=-0.35),
    ])
    body = poly(c, body_pts)
    tip1 = poly(c, ellipse_pts(155, 575, 60, 42, rot=-0.35))
    tip2 = poly(c, ellipse_pts(700, 360, 55, 40, rot=-0.35))
    whole = np.clip(body + tip1 + tip2, 0, 1)
    yy, xx = np.mgrid[0:800, 0:900]
    c.wash(whole, LEMON, density=0.9, blotch=0.2)
    shade = np.clip(((xx - 300) * 0.4 + (yy - 380)) / 260, 0, 1)
    c.wash(whole, LEMON_DK, density=0.75, shade=shade)
    c.wash(whole, '#B97A12', density=0.35, shade=shade ** 3)
    hl = poly(c, ellipse_pts(330, 400, 110, 45, rot=-0.5))
    c.wash(hl * whole, '#FFF7C7', density=0.65, soft=8, wob=10)
    # pores
    for _ in range(140):
        x, y = c.rng.uniform(180, 720), c.rng.uniform(250, 650)
        if whole[int(y), int(x)] > 0.5:
            c.stroke([(x, y), (x + 2, y + 1)], '#C9971A', width=3, alpha=0.35, jitter=0)
    c.stroke(ellipse_pts(430, 470, 292, 232, rot=-0.35, start=-0.2, end=2.6), '#8C5A0C', width=4, alpha=0.5)
    c.save(f'{OUT}/lemon.png', size=(360, 330))


# ---------------------------------------------------------------- citrus slice
def slice_(name, rind, flesh, pith='#FFF6DE', seed=9, segs=10):
    c = Canvas(800, 800, seed)
    cx = cy = 400
    c.wash(poly(c, ellipse_pts(cx, cy, 360, 355)), rind, density=0.95)
    c.wash(poly(c, ellipse_pts(cx, cy, 325, 320)), pith, density=1, wob=3)
    angs = np.linspace(0, 2 * np.pi, segs + 1)[:-1] + c.rng.uniform(0, 1)
    for a in angs:
        a2 = a + 2 * np.pi / segs
        pts = [(cx + 22 * np.cos((a + a2) / 2), cy + 22 * np.sin((a + a2) / 2))]
        for t in np.linspace(a + 0.07, a2 - 0.07, 14):
            pts.append((cx + 295 * np.cos(t), cy + 295 * np.sin(t)))
        seg = poly(c, pts)
        c.wash(seg, flesh, density=0.85, blotch=0.35, edge=0.5, wob=5)
        # juice vesicles
        for _ in range(9):
            r = c.rng.uniform(80, 270)
            t = c.rng.uniform(a + 0.15, a2 - 0.15)
            x, y = cx + r * np.cos(t), cy + r * np.sin(t)
            c.stroke([(x, y), (x + 12 * np.cos(t), y + 12 * np.sin(t))], '#FFFFFF', width=4, alpha=0.45, jitter=0.5)
    c.wash(poly(c, ellipse_pts(cx, cy, 26, 26)), pith, density=1, wob=2)
    c.stroke(ellipse_pts(cx, cy, 362, 357, start=0.4, end=4.2), '#7A2A0A' if rind != LEMON else '#8C5A0C', width=4, alpha=0.45)
    c.save(f'{OUT}/{name}.png', size=(300, 300))


# ---------------------------------------------------------------- spritz
def spritz(seed=11):
    c = Canvas(700, 1000, seed)
    yy, xx = np.mgrid[0:1000, 0:700]
    bowl = poly(c, np.vstack([[(110, 170)], ellipse_pts(350, 170, 240, 330, start=0.02, end=np.pi - 0.02)[::-1][::-1], [(590, 170)]]))
    bowl = bowl * (yy >= 170)
    # liquid
    liquid = bowl * (yy > 240)
    c.wash(liquid, ORANGE, density=0.9, blotch=0.3)
    c.wash(liquid * (yy > 380), BLOOD, density=0.55, shade=np.clip((yy - 380) / 120, 0, 1))
    # bubbles + ice
    for _ in range(26):
        x, y = c.rng.uniform(170, 530), c.rng.uniform(260, 460)
        if bowl[int(y), int(x)] > 0.5:
            r = c.rng.uniform(4, 10)
            c.stroke(ellipse_pts(x, y, r, r, n=16), '#FFE6C2', width=3, alpha=0.7, jitter=0.3)
    for (x, y, r) in [(260, 300, 55), (410, 330, 50), (330, 410, 45)]:
        ice = poly(c, [(x - r, y - r * 0.6), (x + r * 0.7, y - r), (x + r, y + r * 0.5), (x - r * 0.4, y + r)])
        c.wash(ice, '#FFFFFF', density=0.55, wob=3)
        c.stroke([(x - r * 0.8, y - r * 0.5), (x + r * 0.6, y - r * 0.9)], '#FFFFFF', width=4, alpha=0.8)
    # glass
    c.wash(bowl * (yy < 245), '#DDEBF7', density=0.35)
    c.stroke(ellipse_pts(350, 170, 240, 30, n=90), NAVY, width=5, alpha=0.75)
    c.stroke(ellipse_pts(350, 170, 240, 330, start=0.02, end=np.pi - 0.02), NAVY, width=6, alpha=0.8)
    c.stroke([(160, 230), (175, 380), (230, 460)], '#FFFFFF', width=10, alpha=0.75)
    stem = poly(c, [(338, 495), (362, 495), (366, 880), (334, 880)])
    c.wash(stem, '#DDEBF7', density=0.6)
    c.stroke([(340, 500), (336, 880)], NAVY, width=4, alpha=0.7)
    c.stroke([(360, 500), (364, 880)], NAVY, width=4, alpha=0.7)
    foot = poly(c, ellipse_pts(350, 895, 170, 32))
    c.wash(foot, '#DDEBF7', density=0.7)
    c.stroke(ellipse_pts(350, 895, 170, 32), NAVY, width=5, alpha=0.75)
    # straw
    c.stroke([(470, 40), (420, 430)], COBALT, width=18, alpha=0.9, jitter=0.5)
    c.stroke([(474, 42), (424, 300)], '#FFFFFF', width=4, alpha=0.6, jitter=0.5)
    # orange wheel on the rim
    for r, col, d in [(120, ORANGE, 0.95), (100, '#FFF1D8', 1), (90, '#F79A3A', 0.85)]:
        c.wash(poly(c, ellipse_pts(560, 150, r, r)), col, density=d, wob=4)
    for a in np.linspace(0, 2 * np.pi, 9)[:-1]:
        c.stroke([(560, 150), (560 + 88 * np.cos(a), 150 + 88 * np.sin(a))], '#FFF1D8', width=6, alpha=0.9)
    c.save(f'{OUT}/spritz.png', size=(300, 430))


# ---------------------------------------------------------------- majolica plate (score holder)
def plate(seed=13):
    c = Canvas(800, 800, seed)
    cx = cy = 400
    c.wash(poly(c, ellipse_pts(cx, cy, 380, 380)), '#FBFAF4', density=1, wob=2, blotch=0, edge=0, grain=0)
    c.wash(poly(c, ellipse_pts(cx, cy, 240, 240)), '#E7EEF7', density=0.35, wob=6, soft=10)
    rim = poly(c, ellipse_pts(cx, cy, 372, 372)) - poly(c, ellipse_pts(cx, cy, 300, 300))
    c.wash(np.clip(rim, 0, 1), COBALT, density=0.9, wob=3)
    c.wash(np.clip(poly(c, ellipse_pts(cx, cy, 285, 285)) - poly(c, ellipse_pts(cx, cy, 270, 270)), 0, 1), COBALT, density=0.85, wob=2)
    # little painted scallops + dots on the rim
    for a in np.linspace(0, 2 * np.pi, 19)[:-1]:
        x, y = cx + 336 * np.cos(a), cy + 336 * np.sin(a)
        c.wash(poly(c, ellipse_pts(x, y, 20, 12, rot=a + np.pi / 2)), '#FBFAF4', density=0.95, wob=2)
        x2, y2 = cx + 336 * np.cos(a + np.pi / 18), cy + 336 * np.sin(a + np.pi / 18)
        c.wash(poly(c, ellipse_pts(x2, y2, 7, 7)), LEMON, density=0.95, wob=1)
    c.stroke(ellipse_pts(cx, cy, 381, 381), NAVY, width=3, alpha=0.4)
    c.save(f'{OUT}/plate.png', sticker=0, shadow=False, size=(260, 260))


# ---------------------------------------------------------------- sardine tin (empty states)
def tin(seed=17):
    c = Canvas(1000, 700, seed)
    shell = poly(c, ellipse_pts(500, 360, 440, 290, n=200) * [1, 1])
    # rounded-rect-ish tin from a superellipse
    t = np.linspace(0, 2 * np.pi, 240)
    sx = 500 + 440 * np.sign(np.cos(t)) * np.abs(np.cos(t)) ** 0.35
    sy = 360 + 280 * np.sign(np.sin(t)) * np.abs(np.sin(t)) ** 0.35
    shell = poly(c, np.stack([sx, sy], 1))
    inner = poly(c, np.stack([500 + (sx - 500) * 0.9, 360 + (sy - 360) * 0.88], 1))
    c.wash(shell, '#C7B262', density=0.95)
    c.wash(shell, '#8E7A32', density=0.4, shade=np.clip((np.mgrid[0:700, 0:1000][0] - 300) / 300, 0, 1))
    c.wash(inner, ORANGE, density=0.85, blotch=0.35)
    # fish in the tin
    yy, xx = np.mgrid[0:700, 0:1000]
    for i, y in enumerate(range(185, 560, 95)):
        body = poly(c, np.vstack([ellipse_pts(480, y, 320, 46, start=np.pi / 2, end=3 * np.pi / 2), [(640, y - 46), (790, y - 26), (880, y - 50), (860, y), (880, y + 50), (790, y + 26), (640, y + 46)]]))
        body = body * inner
        c.wash(body, '#F4F1E6', density=0.95, wob=3)
        c.wash(body * (yy < y - 4), COBALT, density=0.85, wob=3)
        for x0 in range(260, 780, 52):
            c.stroke([(x0, y - 40), (x0 + 12, y - 8)], NAVY, width=9, alpha=0.8, jitter=1)
        c.wash(poly(c, ellipse_pts(215, y - 6, 18, 18)), '#FFFFFF', density=1, wob=1)
        c.wash(poly(c, ellipse_pts(215, y - 6, 10, 10)), '#0B1430', density=1, wob=1)
        c.wash(poly(c, ellipse_pts(265, y + 16, 30, 12)), PINK, density=0.6, soft=3)
    # peeled lid curl on the left
    lid = poly(c, [(40, 150), (120, 120), (130, 600), (50, 580)])
    c.wash(lid, '#D8C67A', density=0.95)
    c.stroke([(80, 140), (90, 590)], '#6E6C58', width=6, alpha=0.6)
    c.stroke(np.stack([sx, sy], 1)[::2], '#55543F', width=5, alpha=0.6)
    c.save(f'{OUT}/tin.png', size=(420, 300))


# ---------------------------------------------------------------- lino waves (header band texture)
def waves(seed=19, color=COBALT, line='#EAF2FB', name='waves'):
    w, h = 1600, 520
    c = Canvas(w, h, seed)
    c.wash(np.ones((h, w)), color, density=1, wob=0, blotch=0.12, edge=0, grain=0.12)
    xs = np.arange(0, w + 40, 10)
    for k, base in enumerate(range(-30, h + 60, 46)):
        ys = base + 22 * np.sin(xs / 95 + k * 0.9) + 10 * np.sin(xs / 37 + k)
        c.stroke(np.stack([xs, ys], 1)[::2], line, width=13 + 5 * np.sin(k), alpha=0.92, jitter=1.5, taper=False)
    c.save(f'{OUT}/{name}.png', sticker=0, shadow=False, size=(800, 260))


# ---------------------------------------------------------------- tiny accents
def starfish(seed=23):
    c = Canvas(600, 600, seed)
    pts = []
    for i in range(10):
        a = -np.pi / 2 + i * np.pi / 5
        r = 270 if i % 2 == 0 else 105
        pts.append((300 + r * np.cos(a), 310 + r * np.sin(a)))
    m = poly(c, pts)
    c.wash(m, COBALT, density=0.9)
    for _ in range(60):
        x, y = c.rng.uniform(60, 540), c.rng.uniform(60, 560)
        if m[int(y), int(x)] > 0.5:
            c.wash(poly(c, ellipse_pts(x, y, 7, 7)), SKY, density=0.9, wob=1)
    c.save(f'{OUT}/starfish.png', size=(160, 160))



def swash(seed=31):
    c = Canvas(900, 140, seed)
    xs = np.linspace(30, 870, 60)
    ys = 75 + 14 * np.sin(xs / 140) - (xs - 450) ** 2 / 40000
    c.stroke(np.stack([xs, ys], 1), COBALT, width=34, alpha=0.85, jitter=1.5)
    c.stroke(np.stack([xs[5:-8], ys[5:-8] - 6], 1), SKY, width=8, alpha=0.4, jitter=1)
    c.save(f'{OUT}/swash.png', sticker=0, shadow=False, size=(300, 48))


def tile(seed=37):
    c = Canvas(600, 600, seed)
    c.wash(poly(c, [(10, 10), (590, 10), (590, 590), (10, 590)]), '#FBF7EC', density=1, wob=2, blotch=0.05, edge=0.05)
    cx = cy = 300
    c.wash(poly(c, ellipse_pts(cx, cy, 110, 110)), COBALT, density=0.9)
    c.wash(poly(c, ellipse_pts(cx, cy, 64, 64)), '#FBF7EC', density=1, wob=2, blotch=0, edge=0)
    c.wash(poly(c, ellipse_pts(cx, cy, 58, 58)), LEMON, density=0.95)
    c.wash(poly(c, ellipse_pts(cx, cy, 25, 25)), ORANGE, density=0.95)
    for k in range(8):
        a = k * np.pi / 4
        x, y = cx + 200 * np.cos(a), cy + 200 * np.sin(a)
        col = COBALT if k % 2 == 0 else SKY
        c.wash(poly(c, ellipse_pts(x, y, 75, 32, rot=a)), col, density=0.85)
        c.wash(poly(c, ellipse_pts(cx + 150 * np.cos(a + np.pi / 8), cy + 150 * np.sin(a + np.pi / 8), 14, 14)), LEMON, density=0.9, wob=2)
    for (x, y) in [(10, 10), (590, 10), (10, 590), (590, 590)]:
        c.wash(poly(c, ellipse_pts(x, y, 90, 90)) * poly(c, [(10, 10), (590, 10), (590, 590), (10, 590)]), COBALT, density=0.85)
    c.save(f'{OUT}/tile.png', sticker=8, size=(200, 200))


# ---------------------------------------------------------------- tuscan vase
def vase(seed=47):
    c = Canvas(700, 1000, seed)
    yy, xx = np.mgrid[0:1000, 0:700]
    # profile: half-width at each height, mirrored around x=350
    hs = np.linspace(230, 960, 200)
    prof = np.interp(hs, [230, 270, 330, 450, 620, 800, 900, 960], [95, 70, 78, 205, 230, 170, 120, 135])
    pts = np.vstack([np.stack([350 - prof, hs], 1), np.stack([350 + prof[::-1], hs[::-1]], 1)])
    body = poly(c, pts)
    c.wash(body, '#FBF3DF', density=1, blotch=0.12)
    shade = np.clip((xx - 350) / 240, 0, 1)
    c.wash(body, '#E9C9A0', density=0.5, shade=shade)
    # glaze bands
    for y0, y1, col in [(330, 360, DEEP), (440, 470, COBALT), (800, 828, COBALT), (900, 930, DEEP)]:
        c.wash(body * (yy > y0) * (yy < y1), col, density=0.9, wob=3)
    # lemons + leaves painted around the belly
    for i, x in enumerate([230, 350, 470]):
        y = 630 + (i % 2) * 40
        c.wash(poly(c, ellipse_pts(x - 40, y - 50, 40, 16, rot=-0.7)) * body, LEAF, density=0.85)
        c.wash(poly(c, ellipse_pts(x + 40, y - 46, 38, 15, rot=0.7)) * body, '#2C5E37', density=0.85)
        c.wash(poly(c, ellipse_pts(x, y, 48, 38, rot=-0.3)) * body, LEMON, density=0.95)
        c.wash(poly(c, ellipse_pts(x + 14, y + 10, 30, 22, rot=-0.3)) * body, LEMON_DK, density=0.5, soft=4)
    for x in range(140, 580, 46):
        c.wash(poly(c, ellipse_pts(x, 545, 9, 9)) * body, PERSIMMON, density=0.95, wob=1)
        c.wash(poly(c, ellipse_pts(x + 23, 745, 8, 8)) * body, AQUA, density=0.95, wob=1)
    c.stroke(np.stack([350 - prof, hs], 1)[::3], NAVY, width=4, alpha=0.55)
    c.stroke(np.stack([350 + prof, hs], 1)[::3], NAVY, width=4, alpha=0.55)
    # a sprig of olive + blossoms out of the top
    for (x0, y0, x1, y1) in [(350, 240, 240, 60), (350, 240, 470, 40), (350, 240, 360, 10)]:
        c.stroke([(x0, y0), ((x0 + x1) / 2 + 20, (y0 + y1) / 2), (x1, y1)], '#5B4A2A', width=6, alpha=0.8)
        for t in np.linspace(0.25, 0.95, 5):
            px, py = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            a = np.arctan2(y1 - y0, x1 - x0) + (0.9 if int(t * 10) % 2 else -0.9)
            c.wash(poly(c, ellipse_pts(px + 26 * np.cos(a), py + 26 * np.sin(a), 30, 10, rot=a)), '#6E8F4E', density=0.85, wob=2)
    for (x, y) in [(240, 60), (470, 40), (360, 10), (300, 120)]:
        c.wash(poly(c, ellipse_pts(x, y, 22, 22)), '#FFFFFF', density=1, wob=3)
        c.wash(poly(c, ellipse_pts(x, y, 8, 8)), LEMON, density=1, wob=1)
    c.save(f'{OUT}/vase.png', size=(300, 430))


# ---------------------------------------------------------------- platters (card frames, stretched in the app)
def platter(name, rim, accent, dots, center, seed=53):
    w, h = 1000, 760
    c = Canvas(w, h, seed)
    t = np.linspace(0, 2 * np.pi, 300)

    def shape(sx, sy, p=0.42):
        return np.stack([w / 2 + sx * np.sign(np.cos(t)) * np.abs(np.cos(t)) ** p, h / 2 + sy * np.sign(np.sin(t)) * np.abs(np.sin(t)) ** p], 1)

    outer, inner = shape(480, 360), shape(400, 284)
    c.wash(poly(c, outer), '#FFFDF6', density=1, wob=2, blotch=0, edge=0, grain=0)
    ring = np.clip(poly(c, outer) - poly(c, shape(452, 334)), 0, 1)
    c.wash(ring, rim, density=0.92, wob=3)
    band = np.clip(poly(c, shape(418, 302)) - poly(c, inner), 0, 1)
    c.wash(band, accent, density=0.85, wob=2)
    c.wash(poly(c, inner), center, density=0.8, wob=4, blotch=0.12, edge=0.15)
    mid = shape(436, 318)
    for i in range(0, len(mid), 10):
        x, y = mid[i]
        col = dots if i % 20 == 0 else rim
        c.wash(poly(c, ellipse_pts(x, y, 9, 9)), col, density=0.95, wob=1)
    c.stroke(outer[::2], NAVY, width=3, alpha=0.35)
    c.save(f'{OUT}/{name}.png', sticker=0, shadow=False, size=(500, 380))


ALL = {
    'sardine': sardine,
    'lemon': lemon,
    'slices': lambda: (
        slice_('orange_slice', ORANGE, '#F59A34', seed=9),
        slice_('blood_orange', '#E4612A', '#C8321F', seed=10),
        slice_('lemon_slice', LEMON, '#F8E173', seed=12, segs=9),
    ),
    'spritz': spritz,
    'plate': plate,
    'tin': tin,
    'waves': lambda: (
        waves(),
        waves(seed=41, color=AQUA, line='#E6FAFC', name='waves_aqua'),
        waves(seed=43, color=ORANGE, line='#FFF1DC', name='waves_orange'),
    ),
    'starfish': starfish,
    'swash': swash,
    'tile': tile,
    'vase': vase,
    'platters': lambda: (
        platter('platter_blue', COBALT, AQUA, LEMON, '#DDF3F6', seed=53),
        platter('platter_orange', PERSIMMON, LEMON, DEEP, '#FFF0CC', seed=59),
        platter('platter_lemon', DEEP, LEMON, PERSIMMON, '#FFF7DA', seed=61),
    ),
}

if __name__ == '__main__':
    for name in sys.argv[1:] or ALL:
        ALL[name]()
        print('painted', name)


"""Painted food for dish cards: one cut-out per kind of dish (ramen, pizza, tacos, curry...).

    python tools/art/food.py            # everything
    python tools/art/food.py ramen taco # just some

Writes assets/art/food/<name>.webp. components/foodArt.js picks one from the dish's name.
"""
import os
import sys
import numpy as np
from paint import Canvas, ellipse_pts
from assets import poly, LEMON, ORANGE, PERSIMMON, BLOOD, PINK, CREAM, NAVY, COBALT, SKY, AQUA, LEAF

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'art', 'food')
S = 700
BROWN = '#7A4220'
DARK = '#4A2612'
TAN = '#E2A658'
CRUST = '#C97A34'
CHEESE = '#F7C843'
TOMATO = '#D9441E'
GREEN = '#5E9E3F'
DKGREEN = '#2F6B3A'
RICE = '#FFFDF4'
CHOC = '#5A2E18'
SALMON = '#F48B5E'
NORI = '#1F3A2C'
STEEL = '#C9D6E2'


def grid():
    return np.mgrid[0:S, 0:S]


def oval(c, cx, cy, rx, ry, rot=0, start=0, end=2 * np.pi):
    return poly(c, ellipse_pts(cx, cy, rx, ry, rot=rot, start=start, end=end))


def ring(c, cx, cy, rx, ry, color, width=5, alpha=0.75, rot=0):
    c.stroke(ellipse_pts(cx, cy, rx, ry, n=90, rot=rot), color, width=width, alpha=alpha)


def dots(c, n, box, color, r=(6, 10), inside=None, alpha=0.9):
    x0, y0, x1, y1 = box
    for _ in range(n):
        x, y = c.rng.uniform(x0, x1), c.rng.uniform(y0, y1)
        if inside is not None and inside[int(y), int(x)] < 0.5:
            continue
        rr = c.rng.uniform(*r)
        c.wash(oval(c, x, y, rr, rr * c.rng.uniform(0.7, 1)), color, density=alpha, wob=1.5)


def bowl(c, cx=350, top=330, rx=270, depth=230, glaze=COBALT, inside='#FFF2D6'):
    """a deep bowl seen from the front: what's in it goes on the `inside` oval, then the front of the bowl"""
    yy, xx = grid()
    body = oval(c, cx, top, rx, depth, start=0, end=np.pi) * (yy >= top)
    c.wash(body, '#F7FAFD', density=0.95)
    c.wash(body * (yy > top + depth * 0.45), glaze, density=0.5, shade=np.clip((yy - top - depth * 0.45) / 90, 0, 1))
    for k in range(5):
        x = cx - rx * 0.7 + k * rx * 0.35
        c.wash(oval(c, x, top + depth * 0.42, 22, 16), glaze, density=0.8, wob=2)
    foot = oval(c, cx, top + depth + 4, rx * 0.42, 22)
    c.wash(foot, glaze, density=0.7)
    c.stroke(ellipse_pts(cx, top, rx, depth, start=0, end=np.pi), NAVY, width=6, alpha=0.75)
    mouth = oval(c, cx, top, rx, rx * 0.32)
    c.wash(mouth, inside, density=0.95)
    return mouth


def rim(c, cx=350, top=330, rx=270):
    ring(c, cx, top, rx, rx * 0.32, NAVY, width=6)


def plate_top(c, cx=350, cy=360, r=300, color=SKY):
    c.wash(oval(c, cx, cy, r, r * 0.82), '#F7FAFD', density=0.95)
    c.wash(oval(c, cx, cy, r * 0.88, r * 0.72), '#E2EEF7', density=0.8)
    ring(c, cx, cy, r * 0.93, r * 0.76, color, width=10, alpha=0.6)
    ring(c, cx, cy, r, r * 0.82, NAVY, width=5)


# ------------------------------------------------------------------ dishes
def ramen(c):
    mouth = bowl(c, glaze=PERSIMMON, inside='#F2B45C')
    yy, xx = grid()
    for k in range(9):
        y = 300 + k * 7
        xs = np.linspace(140, 560, 30)
        c.stroke(np.stack([xs, y + 10 * np.sin(xs / 22 + k)], 1), '#FFE9A8', width=8, alpha=0.95, jitter=0.6)
    c.wash(oval(c, 230, 300, 58, 36, rot=-0.2), '#FFFDF5', density=1)
    c.wash(oval(c, 236, 302, 26, 18), '#F59E1B', density=1)
    c.wash(poly(c, [(420, 250), (520, 262), (505, 340), (410, 322)]), NORI, density=0.95)
    dots(c, 14, (300, 300, 470, 350), GREEN, r=(6, 9))
    rim(c)
    c.stroke([(470, 70), (300, 320)], TAN, width=16, taper=False, alpha=0.95)
    c.stroke([(520, 80), (340, 325)], TAN, width=16, taper=False, alpha=0.95)


def soup(c):
    bowl(c, glaze=LEAF, inside='#E8742C')
    dots(c, 10, (200, 290, 500, 360), '#FFF0C8', r=(8, 14))
    dots(c, 12, (200, 290, 500, 360), DKGREEN, r=(4, 7))
    rim(c)
    for x in (270, 350, 430):
        c.stroke([(x, 250), (x - 25, 200), (x + 15, 150), (x - 10, 100)], '#B9CCE0', width=10, alpha=0.6)


def curry(c):
    bowl(c, glaze=COBALT, inside='#E89A2F')
    c.wash(oval(c, 270, 300, 120, 50), RICE, density=1)
    dots(c, 20, (170, 270, 360, 330), '#EDE6D4', r=(4, 6))
    c.wash(oval(c, 450, 312, 80, 30), '#C2571C', density=0.7)
    dots(c, 8, (400, 290, 520, 340), '#FFE0A8', r=(8, 12))
    dots(c, 8, (180, 280, 520, 340), DKGREEN, r=(4, 7))
    rim(c)


def ricebowl(c):
    bowl(c, glaze=AQUA, inside=RICE)
    dots(c, 30, (130, 270, 570, 360), '#EDE6D4', r=(4, 6))
    for x, y in [(230, 300), (300, 280), (260, 330)]:
        c.wash(oval(c, x, y, 34, 26), GREEN, density=0.95)
        c.wash(oval(c, x - 6, y - 8, 16, 12), DKGREEN, density=0.6)
    for x, y in [(410, 290), (470, 315), (390, 330)]:
        c.wash(oval(c, x, y, 36, 22, rot=0.4), '#C9853F', density=0.95)
    dots(c, 8, (200, 280, 520, 350), ORANGE, r=(7, 10))
    rim(c)
    c.stroke([(560, 90), (380, 300)], DARK, width=14, taper=False)
    c.stroke([(600, 110), (410, 310)], DARK, width=14, taper=False)


def pizza(c):
    tri = poly(c, [(120, 140), (600, 190), (330, 640)])
    c.wash(tri, CHEESE, density=0.95, blotch=0.3)
    crust = poly(c, [(105, 120), (615, 172), (600, 230), (120, 182)])
    c.wash(crust, CRUST, density=0.95)
    c.stroke([(110, 150), (608, 200)], '#E9A45C', width=10, alpha=0.7)
    for x, y in [(260, 270), (420, 290), (330, 400), (300, 530), (220, 220)]:
        c.wash(oval(c, x, y, 40, 40), TOMATO, density=0.95)
        c.wash(oval(c, x - 10, y - 10, 14, 10), '#F07A57', density=0.6)
    dots(c, 6, (220, 230, 470, 470), DKGREEN, r=(10, 16), inside=tri)
    c.stroke([(120, 140), (330, 640), (600, 190)], NAVY, width=5, alpha=0.5)


def burger(c):
    yy, xx = grid()
    c.wash(oval(c, 350, 560, 250, 56), TAN, density=0.95)
    c.wash(oval(c, 350, 485, 268, 60), BROWN, density=0.95)
    c.wash(poly(c, [(90, 430), (610, 430), (560, 500), (450, 470), (380, 520), (290, 470), (190, 505)]), CHEESE, density=0.95)
    lettuce = poly(c, [(70, 410)] + [(80 + i * 27, 400 + 22 * np.sin(i)) for i in range(21)] + [(630, 430), (70, 440)])
    c.wash(lettuce, GREEN, density=0.9)
    c.wash(oval(c, 300, 395, 70, 22), TOMATO, density=0.9)
    c.wash(oval(c, 430, 395, 70, 22), TOMATO, density=0.9)
    top = oval(c, 350, 380, 265, 220, start=np.pi, end=2 * np.pi) * (yy <= 380)
    c.wash(top, CRUST, density=0.95, shade=np.clip(1.25 - (yy - 160) / 600, 0.6, 1.2))
    dots(c, 22, (150, 200, 550, 340), '#FFF3D6', r=(5, 7), inside=top)
    c.stroke(ellipse_pts(350, 380, 265, 220, start=np.pi, end=2 * np.pi), NAVY, width=5, alpha=0.6)


def sandwich(c):
    yy, xx = grid()
    layers = [(560, TAN, 48), (510, BROWN, 26), (470, CHEESE, 20), (435, TOMATO, 22), (400, GREEN, 26), (350, TAN, 52)]
    for y, col, h in layers:
        c.wash(poly(c, [(100, y - h), (600, y - h - 40), (620, y + h - 40), (90, y + h)]), col, density=0.95)
    c.wash(poly(c, [(100, 290), (600, 250), (620, 300), (90, 340)]), '#C67C35', density=0.8)
    c.stroke([(355, 150), (350, 300)], '#E9D9B0', width=8, alpha=0.9)
    c.wash(oval(c, 352, 145, 20, 20), BLOOD, density=0.95)


def burrito(c):
    yy, xx = grid()
    # a burrito lying on its side, half wrapped in foil, cut end facing you
    body = oval(c, 360, 360, 240, 110) + poly(c, [(170, 250), (560, 250), (560, 470), (170, 470)])
    body = np.clip(body, 0, 1) * (xx > 120)
    c.wash(body, '#F1D6A2', density=0.97, blotch=0.25)
    for k in range(4):
        c.stroke([(220 + k * 60, 262), (250 + k * 60, 460)], '#D9B677', width=5, alpha=0.6)
    foil = body * (xx > 400)
    c.wash(foil, STEEL, density=0.97)
    for k in range(7):
        x = 420 + k * 26
        c.stroke([(x, 255), (x + 14, 330), (x - 6, 400), (x + 10, 465)], '#FFFFFF', width=4, alpha=0.7)
    c.stroke([(400, 250), (410, 360), (398, 470)], '#9FB2C4', width=6, alpha=0.8)
    end = oval(c, 170, 360, 78, 112)
    c.wash(end, '#F7E9C8', density=1)
    inside = oval(c, 170, 360, 62, 94)
    dots(c, 18, (110, 270, 230, 450), RICE, r=(7, 10), inside=inside)
    dots(c, 10, (110, 270, 230, 450), BROWN, r=(8, 12), inside=inside)
    dots(c, 8, (110, 270, 230, 450), TOMATO, r=(7, 10), inside=inside)
    dots(c, 7, (110, 270, 230, 450), GREEN, r=(6, 9), inside=inside)
    ring(c, 170, 360, 78, 112, CRUST, width=7)

def taco(c):
    yy, xx = grid()
    shell = oval(c, 350, 470, 290, 260, start=np.pi, end=2 * np.pi) * (yy <= 470)
    inner = oval(c, 350, 470, 250, 220, start=np.pi, end=2 * np.pi) * (yy <= 470)
    top_edge = (yy > 230) & (yy < 330)
    c.wash(shell * (1 - inner) + shell * (yy > 330), '#F2B84B', density=0.95)
    fill = inner * (yy <= 330) * (yy > 200)
    c.wash(fill, BROWN, density=0.9)
    dots(c, 18, (130, 200, 570, 320), GREEN, r=(12, 20), inside=fill + shell * top_edge)
    dots(c, 12, (130, 210, 570, 320), TOMATO, r=(9, 13), inside=fill)
    dots(c, 14, (130, 210, 570, 320), CHEESE, r=(6, 9), inside=fill)
    c.wash(shell * (yy > 330), '#E7A33A', density=0.4)
    c.stroke(ellipse_pts(350, 470, 290, 260, start=np.pi, end=2 * np.pi), CRUST, width=7, alpha=0.8)
    c.stroke([(60, 470), (640, 470)], CRUST, width=7, alpha=0.8)


def salad(c):
    plate_top(c, color=AQUA)
    for _ in range(26):
        x, y = c.rng.uniform(170, 530), c.rng.uniform(220, 500)
        c.wash(oval(c, x, y, c.rng.uniform(40, 70), c.rng.uniform(26, 40), rot=c.rng.uniform(0, 3)), [GREEN, DKGREEN, '#8CC152'][_ % 3], density=0.8, wob=6)
    for x, y in [(250, 300), (420, 280), (360, 450)]:
        c.wash(oval(c, x, y, 30, 30), TOMATO, density=0.95)
    for x, y in [(300, 420), (460, 400)]:
        c.wash(oval(c, x, y, 32, 32), '#D8EFC0', density=0.95)
        ring(c, x, y, 32, 32, GREEN, width=5)
    c.wash(oval(c, 380, 340, 44, 30), '#FFFDF5', density=1)
    c.wash(oval(c, 380, 340, 18, 14), '#F5A31B', density=1)


def fries(c):
    for k in range(13):
        x = 190 + k * 27 + c.rng.uniform(-6, 6)
        top = 110 + c.rng.uniform(0, 100)
        a = c.rng.uniform(-0.25, 0.25)
        c.wash(poly(c, [(x, 420), (x + 22, 420), (x + 22 + a * 200, top), (x + a * 200, top)]), ['#F8C94A', '#F2B336'][k % 2], density=0.95, wob=2)
    box = poly(c, [(160, 330), (540, 330), (500, 630), (200, 630)])
    c.wash(box, TOMATO, density=0.97)
    c.wash(poly(c, [(160, 330), (540, 330), (530, 380), (170, 380)]), BLOOD, density=0.6)
    for k in range(4):
        x = 215 + k * 80
        c.stroke([(x, 400), (x + 6, 610)], '#FFF4E2', width=16, taper=False, alpha=0.9)

def pasta(c):
    plate_top(c, color=TOMATO)
    for k in range(10):
        r = 40 + k * 18
        c.stroke(ellipse_pts(350, 360, r, r * 0.8, n=60, start=k, end=k + 5.2), '#F6D27A', width=11, alpha=0.95)
    c.wash(oval(c, 350, 340, 110, 80), TOMATO, density=0.85, blotch=0.35)
    dots(c, 8, (280, 290, 420, 390), '#8E2A12', r=(8, 13))
    for x, y in [(320, 300), (390, 330)]:
        c.wash(oval(c, x, y, 34, 18, rot=0.6), DKGREEN, density=0.9)
    dots(c, 30, (220, 240, 480, 470), '#FFF8E0', r=(3, 5))


def sushi(c):
    yy, xx = grid()
    c.wash(poly(c, [(70, 450), (630, 360), (650, 470), (90, 560)]), '#C98F58', density=0.9)
    for x, y in [(190, 330), (340, 300), (490, 270)]:
        c.wash(oval(c, x, y, 82, 82), NORI, density=0.97)
        c.wash(oval(c, x, y, 66, 66), RICE, density=1)
        dots(c, 10, (x - 60, y - 60, x + 60, y + 60), '#EDE6D4', r=(4, 6))
        c.wash(oval(c, x, y, 28, 28), SALMON, density=1)
        c.wash(oval(c, x + 8, y - 6, 10, 10), GREEN, density=0.9)
    c.wash(oval(c, 360, 470, 120, 40, rot=-0.16), RICE, density=1)
    c.wash(oval(c, 360, 452, 126, 34, rot=-0.16), SALMON, density=0.95)
    for k in range(4):
        c.stroke([(280 + k * 50, 440 - k * 6), (300 + k * 50, 470 - k * 6)], '#FFD9C4', width=6, alpha=0.8)


def dumplings(c):
    c.wash(oval(c, 350, 420, 290, 200), '#D8B07A', density=0.9)
    ring(c, 350, 420, 290, 200, '#A9763E', width=10, alpha=0.8)
    for x, y in [(240, 380), (440, 360), (340, 480), (250, 300), (460, 470)]:
        d = oval(c, x, y, 82, 56)
        c.wash(d, '#FBF1DD', density=1)
        for k in range(5):
            c.stroke([(x - 50 + k * 25, y - 30), (x - 40 + k * 25, y + 10)], '#E6D3AE', width=5, alpha=0.8)
        c.wash(oval(c, x, y + 36, 70, 14), '#D99A45', density=0.6)
    dots(c, 12, (180, 290, 520, 520), DKGREEN, r=(4, 7))


def chicken(c):
    meat = oval(c, 300, 330, 190, 150, rot=-0.6)
    c.wash(meat, '#C9772B', density=0.97, blotch=0.4)
    dots(c, 40, (140, 180, 470, 480), '#E8A54C', r=(6, 12), inside=meat)
    dots(c, 25, (140, 180, 470, 480), '#8E4A17', r=(4, 8), inside=meat)
    c.wash(poly(c, [(410, 430), (440, 410), (560, 540), (530, 560)]), '#FFF5E0', density=1)
    for x, y in [(560, 560), (585, 530)]:
        c.wash(oval(c, x, y, 26, 24), '#FFF5E0', density=1)
    c.stroke([(420, 420), (545, 555)], '#D9C9A8', width=4, alpha=0.7)


def hotdog(c):
    c.wash(oval(c, 350, 380, 300, 100, rot=-0.15), TAN, density=0.95)
    c.wash(oval(c, 350, 350, 300, 56, rot=-0.15), '#B5462A', density=0.97)
    c.stroke([(80, 380)] + [(110 + i * 30, 340 + 18 * np.sin(i * 1.3) - i * 4.5) for i in range(16)], LEMON, width=10, alpha=0.95)
    c.wash(oval(c, 350, 420, 290, 70, rot=-0.15) * (grid()[0] > 400), CRUST, density=0.6)


def fish(c):
    plate_top(c, color=AQUA)
    body = poly(c, np.vstack([ellipse_pts(330, 360, 190, 80, start=np.pi, end=2 * np.pi), ellipse_pts(330, 360, 190, 80, start=0, end=np.pi)]))
    c.wash(body, '#D69A4E', density=0.97)
    c.wash(poly(c, [(500, 360), (590, 290), (580, 430)]), '#C98536', density=0.95)
    for k in range(6):
        c.stroke([(200 + k * 50, 300), (180 + k * 50, 420)], '#A8692C', width=5, alpha=0.7)
    c.wash(oval(c, 200, 470, 40, 40), LEMON, density=0.95)
    c.wash(oval(c, 200, 470, 26, 26), '#FFF3B5', density=0.9)


def plate(c):
    plate_top(c, color=COBALT)
    c.wash(oval(c, 240, 300, 130, 95), RICE, density=1)
    dots(c, 26, (130, 220, 350, 380), '#F2D97A', r=(4, 6))
    for k in range(8):
        x, y = 390 + (k % 3) * 50, 250 + (k // 3) * 55
        c.wash(oval(c, x, y, 46, 26, rot=0.5), '#B66A2C', density=0.97)
        c.stroke([(x - 30, y - 6), (x + 30, y + 6)], '#7E4116', width=4, alpha=0.7)
    hummus = oval(c, 300, 470, 105, 62)
    c.wash(hummus, '#F0DDB0', density=0.97)
    c.stroke(ellipse_pts(300, 470, 60, 34, start=0, end=5), '#C99B4F', width=6, alpha=0.8)
    dots(c, 6, (250, 440, 350, 500), TOMATO, r=(4, 6), inside=hummus)
    for k, (x, y) in enumerate([(460, 440), (520, 490), (440, 520)]):
        c.wash(poly(c, [(x, y), (x + 70, y - 30), (x + 60, y + 40)]), '#E8C07A', density=0.97)
    dots(c, 10, (130, 380, 230, 520), TOMATO, r=(12, 16))
    dots(c, 10, (130, 380, 230, 520), GREEN, r=(10, 14))

def steak(c):
    plate_top(c, color=NAVY)
    meat = oval(c, 320, 350, 190, 130, rot=0.2)
    c.wash(meat, '#8A3A1E', density=0.97, blotch=0.35)
    for k in range(6):
        c.stroke([(190 + k * 50, 260), (170 + k * 50, 440)], '#4E1C0B', width=9, alpha=0.6)
    c.wash(oval(c, 520, 470, 50, 32), '#F4DFA6', density=0.95)
    dots(c, 8, (450, 380, 580, 540), GREEN, r=(10, 16))


def cookie(c):
    for x, y, r in [(270, 300, 190), (440, 430, 170)]:
        m = oval(c, x, y, r, r * 0.95)
        c.wash(m, '#D99A4E', density=0.97, blotch=0.4)
        dots(c, 12, (x - r, y - r, x + r, y + r), CHOC, r=(12, 22), inside=m)
        dots(c, 18, (x - r, y - r, x + r, y + r), '#B5742F', r=(4, 8), inside=m, alpha=0.6)


def donut(c):
    c.wash(oval(c, 350, 360, 260, 240), '#D99A4E', density=0.97)
    icing = poly(c, [(350 + (225 + 18 * np.sin(a * 9)) * np.cos(a), 350 + (205 + 18 * np.sin(a * 9)) * np.sin(a)) for a in np.linspace(0, 2 * np.pi, 120)])
    c.wash(icing, '#F7A6B8', density=0.97)
    hole = oval(c, 350, 360, 80, 72)
    c.put('#000000', hole * 0, multiply=0)
    c.a = c.a * (1 - np.clip(hole * 1.2, 0, 1))
    for _ in range(40):
        a, r = c.rng.uniform(0, 2 * np.pi), c.rng.uniform(110, 200)
        x, y = 350 + r * np.cos(a), 355 + r * 0.92 * np.sin(a)
        b = c.rng.uniform(0, 3)
        c.stroke([(x, y), (x + 14 * np.cos(b), y + 14 * np.sin(b))], [COBALT, LEMON, '#FFFFFF', AQUA][_ % 4], width=7, taper=False)


def croissant(c):
    for k, (x, y, rx, ry, rot) in enumerate([(160, 420, 90, 60, 0.9), (250, 330, 110, 90, 0.4), (350, 300, 120, 105, 0), (450, 330, 110, 90, -0.4), (540, 420, 90, 60, -0.9)]):
        m = oval(c, x, y, rx, ry, rot=rot)
        c.wash(m, ['#D9862E', '#E39A3F', '#EBAA4E', '#E39A3F', '#D9862E'][k], density=0.97)
        c.stroke(ellipse_pts(x, y, rx * 0.9, ry * 0.9, rot=rot, start=0.3, end=2.8), '#9C5418', width=6, alpha=0.6)
    c.stroke([(250, 300), (330, 230)], '#FFE2A8', width=8, alpha=0.6)


def bread(c):
    for k, (x, y) in enumerate([(240, 300), (440, 290), (330, 450), (520, 460), (170, 470)]):
        m = oval(c, x, y, 95, 75, rot=k)
        c.wash(m, '#E3A452', density=0.97)
        c.stroke(ellipse_pts(x, y, 50, 30, rot=k, start=0, end=4), '#B36A23', width=8, alpha=0.7)
        dots(c, 6, (x - 70, y - 50, x + 70, y + 50), '#FFF4D6', r=(4, 6), inside=m)
        dots(c, 6, (x - 70, y - 50, x + 70, y + 50), GREEN, r=(3, 5), inside=m)


def pancakes(c):
    c.wash(oval(c, 350, 560, 300, 70), '#F7FAFD', density=0.95)
    ring(c, 350, 560, 300, 70, NAVY, width=5)
    for k in range(4):
        y = 520 - k * 70
        c.wash(oval(c, 350, y, 220, 56), '#C9802F', density=0.97)
        c.wash(oval(c, 350, y - 12, 210, 44), '#E8B05E', density=0.95)
    c.wash(oval(c, 350, 300, 200, 40), '#A65A12', density=0.7)
    c.stroke([(250, 300), (230, 390), (238, 450)], '#A65A12', width=16, alpha=0.8)
    c.stroke([(470, 305), (480, 380)], '#A65A12', width=14, alpha=0.8)
    c.wash(poly(c, [(310, 260), (390, 250), (400, 300), (320, 310)]), '#FFF0A0', density=0.97)
    dots(c, 4, (230, 230, 470, 300), BLOOD, r=(14, 18))


def breakfast(c):
    c.wash(oval(c, 350, 360, 300, 246), '#F7FAFD', density=0.95)
    c.wash(oval(c, 350, 360, 260, 212), '#D6E8F4', density=0.9)
    ring(c, 350, 360, 300, 246, NAVY, width=5)
    # toast
    c.wash(poly(c, [(420, 420), (560, 400), (575, 520), (440, 545)]), '#C98536', density=0.97)
    c.wash(poly(c, [(432, 430), (548, 412), (560, 508), (450, 530)]), '#EDC27A', density=0.95)
    for x, y in [(250, 300), (420, 280)]:
        white = poly(c, [(x + (95 + 14 * np.sin(a * 5)) * np.cos(a), y + (78 + 12 * np.cos(a * 4)) * np.sin(a)) for a in np.linspace(0, 2 * np.pi, 60)])
        c.wash(white, '#FFFFFF', density=1)
        c.stroke([(x + (95 + 14 * np.sin(a * 5)) * np.cos(a), y + (78 + 12 * np.cos(a * 4)) * np.sin(a)) for a in np.linspace(0, 2 * np.pi, 60)], '#E3D3AE', width=4, alpha=0.8)
        c.wash(oval(c, x + 8, y, 38, 36), '#F6A21B', density=1)
        c.wash(oval(c, x, y - 10, 12, 8), '#FFE3A0', density=0.8)
    for k in range(2):
        pts = [(150 + i * 30, 440 + k * 52 + 14 * np.sin(i * 1.4)) for i in range(9)]
        c.stroke(pts, '#B23A22', width=28, taper=False, alpha=0.95)
        c.stroke(pts, '#F4B9A0', width=8, taper=False, alpha=0.8)

def cake(c):
    yy, xx = grid()
    side = poly(c, [(120, 360), (560, 250), (580, 520), (130, 600)])
    c.wash(side, '#FFF1DA', density=0.97)
    for y0 in (430, 500):
        c.stroke([(125, y0 + 40), (570, y0 - 60)], '#E87A8F', width=18, taper=False, alpha=0.9)
    top = poly(c, [(120, 360), (560, 250), (600, 290), (170, 400)])
    c.wash(top, '#FBE3EA', density=0.97)
    c.wash(oval(c, 450, 250, 40, 46), TOMATO, density=0.97)
    c.stroke([(450, 210), (470, 180)], DKGREEN, width=8)


def icecream(c):
    cone = poly(c, [(240, 360), (460, 360), (350, 660)])
    c.wash(cone, '#E1A35A', density=0.97)
    for k in range(5):
        c.stroke([(250 + k * 45, 360), (330 + k * 10, 600)], '#B57232', width=5, alpha=0.7)
        c.stroke([(450 - k * 45, 360), (370 - k * 10, 600)], '#B57232', width=5, alpha=0.7)
    c.wash(oval(c, 350, 330, 150, 110), '#F7A6B8', density=0.97)
    c.wash(oval(c, 350, 200, 120, 100), '#FFF3D6', density=0.97)
    dots(c, 14, (250, 130, 450, 280), CHOC, r=(4, 6))
    c.wash(oval(c, 355, 100, 30, 32), TOMATO, density=0.97)


def coffee(c):
    c.wash(oval(c, 330, 560, 250, 60), '#F7FAFD', density=0.95)
    ring(c, 330, 560, 250, 60, NAVY, width=5)
    yy, xx = grid()
    cup = oval(c, 330, 330, 190, 220, start=0, end=np.pi) * (yy >= 330)
    c.wash(cup, '#F7FAFD', density=0.97)
    c.wash(cup * (yy > 470), COBALT, density=0.5)
    c.stroke(ellipse_pts(540, 410, 60, 70, start=-1.4, end=1.6), NAVY, width=18, taper=False, alpha=0.8)
    c.wash(oval(c, 330, 330, 190, 60), '#B0723C', density=0.97)
    c.wash(poly(c, [(330, 370), (280, 320), (300, 300), (330, 315), (360, 300), (380, 320)]), '#FFF2DC', density=0.97)
    ring(c, 330, 330, 190, 60, NAVY, width=5)
    for x in (280, 380):
        c.stroke([(x, 250), (x - 20, 200), (x + 10, 150)], '#B9CCE0', width=9, alpha=0.6)


def drink(c):
    yy, xx = grid()
    glass = poly(c, [(200, 180), (500, 180), (460, 640), (240, 640)])
    c.wash(glass * (yy > 250), '#F6D58A', density=0.9)
    c.wash(glass * (yy <= 250), '#E8F2FA', density=0.6)
    dots(c, 22, (250, 540, 450, 630), DARK, r=(14, 18), inside=glass)
    for x, y in [(300, 300), (390, 360)]:
        c.wash(poly(c, [(x, y), (x + 50, y - 10), (x + 56, y + 40), (x + 6, y + 50)]), '#FFFFFF', density=0.6)
    c.stroke([(200, 180), (240, 640), (460, 640), (500, 180)], NAVY, width=5, alpha=0.6)
    c.stroke([(380, 60), (330, 600)], PINK, width=26, taper=False, alpha=0.95)
    c.wash(oval(c, 480, 190, 60, 60), LEMON, density=0.95)
    c.wash(oval(c, 480, 190, 46, 46), '#FFF0A8', density=0.9)


def seafood(c):
    plate_top(c, color=AQUA)
    for k in range(5):
        x, y = 210 + k * 70, 300 + (k % 2) * 90
        m = poly(c, ellipse_pts(x, y, 60, 60, start=-0.3, end=3.6))
        c.wash(m, '#F28B5E', density=0.97)
        for j in range(3):
            c.stroke(ellipse_pts(x, y, 40 - j * 12, 40 - j * 12, start=0, end=3), '#FFD2BC', width=5, alpha=0.8)
    c.wash(oval(c, 360, 480, 50, 30), LEMON, density=0.95)
    dots(c, 10, (180, 420, 540, 520), GREEN, r=(6, 10))


ALL = {f.__name__: f for f in [ramen, soup, curry, ricebowl, pizza, burger, sandwich, burrito, taco, salad, fries, pasta, sushi, dumplings, chicken, hotdog, fish, plate, steak, cookie, donut, croissant, bread, pancakes, breakfast, cake, icecream, coffee, drink, seafood]}

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name in sys.argv[1:] or ALL:
        c = Canvas(S, S, 200 + list(ALL).index(name))
        ALL[name](c)
        img = c.save(os.path.join(OUT, f'{name}.png'), size=(360, 360))
        # webp keeps the soft paper edge at a fraction of the size
        img.save(os.path.join(OUT, f'{name}.webp'), 'WEBP', quality=86, method=6)
        os.remove(os.path.join(OUT, f'{name}.png'))
        print('painted', name)

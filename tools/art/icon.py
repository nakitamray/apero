"""The app icon: the painted spritz on cobalt ticking.

    python tools/art/icon.py

Writes assets/icon.png, adaptive-icon.png (Android, spritz only), splash-icon.png, favicon.png
and assets/art/icon_web.png (the website's tab icon), plus website/img/icon-*.png for installing the site.
"""
import os
import tempfile
import numpy as np
from PIL import Image, ImageDraw
from assets import spritz

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets')
COBALT = (36, 86, 184)
STRIPES = [((63, 112, 205), 3), ((255, 123, 28), 2), ((63, 112, 205), 3), ((255, 212, 59), 2)]


def glass():
    c = spritz()
    with tempfile.TemporaryDirectory() as tmp:
        return c.save(os.path.join(tmp, 'g.png')).copy()


def ticking(size):
    bg = Image.new('RGB', (size, size), COBALT)
    d = ImageDraw.Draw(bg)
    step = size // 16
    for i, x in enumerate(range(step // 2, size, step)):
        color, w = STRIPES[i % len(STRIPES)]
        w = max(1, round(w * size / 1024))
        d.rectangle([x, 0, x + w - 1, size], fill=color)
    return bg


def place(canvas, art, height, tilt, nudge=(0, 0)):
    a = art.rotate(tilt, resample=Image.BICUBIC, expand=True)
    a = a.resize((round(a.width * height / a.height), height), Image.LANCZOS)
    x = (canvas.width - a.width) // 2 + nudge[0]
    y = (canvas.height - a.height) // 2 + nudge[1]
    canvas.alpha_composite(a, (x, y))
    return canvas


def rounded(img, radius):
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.width - 1, img.height - 1], radius, fill=255)
    out = img.copy()
    out.putalpha(mask)
    return out


if __name__ == '__main__':
    art = glass()
    icon = place(ticking(1024).convert('RGBA'), art, 930, -7, (14, 4))
    icon.convert('RGB').save(f'{ROOT}/icon.png', optimize=True)
    place(Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)), art, 600, -7, (6, 4)).save(f'{ROOT}/adaptive-icon.png', optimize=True)
    place(Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)), art, 900, -7, (8, 0)).save(f'{ROOT}/splash-icon.png', optimize=True)
    small = rounded(icon, 180)
    small.resize((48, 48), Image.LANCZOS).save(f'{ROOT}/favicon.png', optimize=True)
    small.resize((192, 192), Image.LANCZOS).save(f'{ROOT}/art/icon_web.png', optimize=True)
    # installable website (Add to Home Screen): square icons the phone rounds itself, plus a "maskable"
    # one with the glass kept inside the middle 80% so Android's circle / squircle masks never cut it
    site = os.path.join(ROOT, '..', 'website', 'img')
    os.makedirs(site, exist_ok=True)
    icon.convert('RGB').resize((512, 512), Image.LANCZOS).save(f'{site}/icon-512.png', optimize=True)
    icon.convert('RGB').resize((192, 192), Image.LANCZOS).save(f'{site}/icon-192.png', optimize=True)
    icon.convert('RGB').resize((180, 180), Image.LANCZOS).save(f'{site}/apple-touch-icon.png', optimize=True)
    masked = place(ticking(1024).convert('RGBA'), art, 640, -7, (8, 4))
    masked.convert('RGB').resize((512, 512), Image.LANCZOS).save(f'{site}/icon-maskable.png', optimize=True)
    print('icons written')

"""Illustrated 'photos' for the demo feed: painted food on a majolica plate, shot from above.

    python tools/art/postcards.py     (run assets.py first; this reuses its output)
"""
import os
import random
from PIL import Image, ImageDraw, ImageFilter

ART = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'art')
OUT = os.path.join(ART, 'photos')
SIZE = 720


def art(name):
    return Image.open(os.path.join(ART, f'{name}.png')).convert('RGBA')


def gingham(color, base='#FFFDF7', step=48):
    img = Image.new('RGB', (SIZE, SIZE), base)
    over = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    for i in range(0, SIZE, step * 2):
        d.rectangle([i, 0, i + step, SIZE], fill=color + '66')
        d.rectangle([0, i, SIZE, i + step], fill=color + '66')
    img.paste(over, (0, 0), over)
    return img


def crop_bg(name):
    bg = Image.open(os.path.join(ART, f'{name}.jpg')).convert('RGB')
    return bg.crop((0, 0, min(bg.size), min(bg.size))).resize((SIZE, SIZE), Image.LANCZOS)


def place(canvas, sticker, width, xy, rotate=0):
    s = sticker.copy()
    s = s.resize((width, int(width * s.height / s.width)), Image.LANCZOS)
    if rotate:
        s = s.rotate(rotate, resample=Image.BICUBIC, expand=True)
    x, y = xy
    shadow = Image.new('RGBA', s.size, (10, 20, 50, 0))
    shadow.putalpha(s.getchannel('A').point(lambda a: a * 0.35))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    canvas.paste(shadow, (x - s.width // 2 + 8, y - s.height // 2 + 14), shadow)
    canvas.paste(s, (x - s.width // 2, y - s.height // 2), s)


PLATE = None


def plate_with(canvas, foods, plate_w=560):
    place(canvas, PLATE, plate_w, (SIZE // 2, SIZE // 2))
    for name, w, dx, dy, rot in foods:
        place(canvas, art(name), w, (SIZE // 2 + dx, SIZE // 2 + dy), rot)


SHOTS = [
    (lambda: gingham('#2456B8'), [('blood_orange', 230, -60, -40, 0), ('lemon_slice', 160, 90, 70, 20)], [('spritz', 170, 590, 140, 8)]),
    (lambda: gingham('#E8510C'), [('sardine', 420, 0, -40, -12), ('sardine', 400, 0, 50, -8), ('lemon_slice', 120, 120, -110, 0)], []),
    (lambda: crop_bg('bg_tiles'), [('orange_slice', 200, -70, 0, 0), ('blood_orange', 180, 80, -60, 15), ('lemon_slice', 150, 60, 100, 0)], []),
    (lambda: gingham('#FFD43B', '#FFFDF7'), [('lemon', 260, 0, 0, -18)], [('spritz', 170, 600, 520, -6)]),
    (lambda: crop_bg('bg_orange'), [('sardine', 440, 0, 0, 14), ('lemon_slice', 120, -130, -100, 0)], []),
    (lambda: gingham('#1FB3CC'), [('orange_slice', 180, -80, -60, 0), ('orange_slice', 180, 70, -40, 30), ('orange_slice', 180, 0, 90, 10)], []),
    (lambda: gingham('#2456B8', '#FFF5C9'), [('starfish', 150, -110, -90, 0), ('sardine', 380, 20, 40, 160)], [('lemon', 150, 610, 610, 10)]),
    (lambda: crop_bg('bg_tiles'), [('blood_orange', 250, 0, -10, 0)], [('spritz', 170, 110, 560, 6)]),
]


if __name__ == '__main__':
    random.seed(4)
    os.makedirs(OUT, exist_ok=True)
    PLATE = art('plate')
    for i, (bg, foods, extras) in enumerate(SHOTS, 1):
        canvas = bg().convert('RGBA')
        plate_with(canvas, foods)
        for name, w, x, y, rot in extras:
            place(canvas, art(name), w, (x, y), rot)
        canvas.convert('RGB').save(os.path.join(OUT, f'photo_{i}.jpg'), quality=86, optimize=True)
        print('shot', i)

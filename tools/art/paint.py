"""tiny watercolor/gouache painter: masks -> pigment layers -> RGBA png"""
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, map_coordinates, binary_dilation, distance_transform_edt

RNG = np.random.default_rng(7)


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])


def noise(shape, scale, rng=RNG):
    n = gaussian_filter(rng.standard_normal(shape), scale)
    n -= n.mean()
    return n / (n.std() + 1e-9)


class Canvas:
    def __init__(self, w, h, seed=1):
        self.w, self.h = w, h
        self.rgb = np.ones((h, w, 3))
        self.a = np.zeros((h, w))
        self.rng = np.random.default_rng(seed)
        # paper grain shared by all washes so pigment settles in the same "tooth"
        self.grain = noise((h, w), 1.2, self.rng) * 0.6 + noise((h, w), 4, self.rng) * 0.4

    # -- masks -------------------------------------------------------------
    def mask(self, draw_fn):
        im = Image.new('L', (self.w, self.h), 0)
        draw_fn(ImageDraw.Draw(im))
        return np.asarray(im, dtype=float) / 255

    def wobble(self, m, amp=6, scale=18):
        """push edges around with smooth noise so nothing looks vector-clean"""
        yy, xx = np.mgrid[0:self.h, 0:self.w].astype(float)
        dx = noise(m.shape, scale, self.rng) * amp
        dy = noise(m.shape, scale, self.rng) * amp
        return map_coordinates(m, [yy + dy, xx + dx], order=1, mode='constant')

    # -- painting ----------------------------------------------------------
    def put(self, color, alpha):
        alpha = np.clip(alpha, 0, 1)
        c = hexrgb(color) if isinstance(color, str) else color
        # pigment over pigment: mostly normal blend with a touch of multiply so overlaps deepen
        under = self.rgb
        mult = under * c
        top = c * 0.65 + mult * 0.35
        out_a = alpha + self.a * (1 - alpha)
        mix = (top * alpha[..., None] + under * self.a[..., None] * (1 - alpha[..., None])) / np.maximum(out_a[..., None], 1e-6)
        self.rgb = np.where(out_a[..., None] > 0, mix, under)
        self.a = out_a

    def wash(self, m, color, density=0.85, wob=6, blotch=0.25, edge=0.35, grain=0.18, soft=1.2, shade=None):
        """watercolor wash: wobbly edge, darker rim where pigment pools, uneven density"""
        m = self.wobble(m, wob, 16)
        m = gaussian_filter(m, soft)
        rim = np.clip(m - gaussian_filter(m, 6), 0, 1) * 4
        dens = density * (1 + blotch * noise(m.shape, 22, self.rng)) + edge * rim
        dens = dens * (1 + grain * self.grain)
        if shade is not None:
            dens = dens * shade
        self.put(color, m * np.clip(dens, 0, 1))

    def gouache(self, m, color, wob=3, grain=0.08):
        """flatter, opaque paint for pop-art bits"""
        m = gaussian_filter(self.wobble(m, wob, 12), 0.8)
        self.put(color, m * np.clip(0.96 + grain * self.grain, 0, 1))

    def stroke(self, pts, color, width=6, taper=True, alpha=0.9, jitter=1.5):
        """brush-pen line through points, width swells in the middle"""
        pts = np.array(pts, dtype=float)
        # densify
        seg = []
        for p, q in zip(pts[:-1], pts[1:]):
            n = max(2, int(np.hypot(*(q - p)) / 2))
            seg.append(np.linspace(p, q, n, endpoint=False))
        seg.append(pts[-1:])
        pts = np.vstack(seg)
        pts += gaussian_filter(self.rng.standard_normal(pts.shape), (3, 0)) * jitter
        im = Image.new('L', (self.w, self.h), 0)
        d = ImageDraw.Draw(im)
        n = len(pts)
        for i, (x, y) in enumerate(pts):
            t = i / max(n - 1, 1)
            w = width * (np.sin(np.pi * t) ** 0.6 * 0.8 + 0.2 if taper else 1)
            d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=255)
        m = np.asarray(im, dtype=float) / 255
        m = gaussian_filter(m, 0.7)
        self.put(color, m * alpha * np.clip(1 + 0.15 * self.grain, 0, 1))

    # -- output ------------------------------------------------------------
    def save(self, path, sticker=14, shadow=True, size=None):
        a = self.a
        rgba = np.dstack([self.rgb, a])
        if sticker:
            solid = a > 0.08
            dist = distance_transform_edt(~solid)
            border = np.clip((sticker - dist) / 2.0, 0, 1)
            border = gaussian_filter(border, 0.8)
            paper = np.array([1.0, 0.995, 0.975])
            base_rgb = np.broadcast_to(paper, rgba[..., :3].shape)
            out_a = a + border * (1 - a)
            rgb = (rgba[..., :3] * a[..., None] + base_rgb * border[..., None] * (1 - a[..., None])) / np.maximum(out_a[..., None], 1e-6)
            rgba = np.dstack([rgb, out_a])
        if shadow:
            sh = gaussian_filter(rgba[..., 3], 7)
            sh = np.roll(np.roll(sh, 7, 0), 4, 1) * 0.28
            a2 = rgba[..., 3]
            out_a = a2 + sh * (1 - a2)
            shade_rgb = np.array([0.08, 0.15, 0.35])
            rgb = (rgba[..., :3] * a2[..., None] + shade_rgb * sh[..., None] * (1 - a2[..., None])) / np.maximum(out_a[..., None], 1e-6)
            rgba = np.dstack([rgb, out_a])
        img = Image.fromarray((np.clip(rgba, 0, 1) * 255).astype(np.uint8), 'RGBA')
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)
        if size:
            img.thumbnail(size, Image.LANCZOS)
        img.save(path, optimize=True)
        return img


def ellipse_pts(cx, cy, rx, ry, n=80, rot=0, start=0, end=2 * np.pi):
    t = np.linspace(start, end, n)
    x, y = rx * np.cos(t), ry * np.sin(t)
    c, s = np.cos(rot), np.sin(rot)
    return np.stack([cx + x * c - y * s, cy + x * s + y * c], 1)

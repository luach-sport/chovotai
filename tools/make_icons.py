"""Generates the app icons (launcher, adaptive foreground, web icon) for חובותיי.

Run: python3 tools/make_icons.py   (needs Pillow)
"""
import math
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, 'android-res')
TEAL = (30, 95, 116, 255)
TEAL_DARK = (20, 70, 88, 255)
PAPER = (247, 240, 225, 255)
PAPER_SHADE = (226, 214, 190, 255)
LINE = (171, 189, 187, 255)
GOLD = (214, 160, 58, 255)
WHITE = (255, 255, 255, 255)
SS = 4  # supersampling


def quad(p0, p1, p2, n=24):
    pts = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        pts.append((x, y))
    return pts


def art(size, scale, bg=None):
    """bg: None (transparent), 'square' or 'circle'. scale: book width relative to the canvas."""
    S = size * SS
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if bg == 'square':
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=TEAL)
    elif bg == 'circle':
        d.ellipse([0, 0, S - 1, S - 1], fill=TEAL)
    cx, cy = S / 2, S / 2 - S * 0.02 * scale / 0.6
    W = S * scale
    H = W * 0.64
    top, bottom = cy - H / 2, cy + H / 2
    dip = H * 0.10
    for side in (-1, 1):
        outer = cx + side * W / 2
        top_edge = quad((cx, top + dip), (cx + side * W * 0.22, top - dip * 0.6), (outer, top))
        bottom_edge = quad((outer, bottom - dip * 0.4), (cx + side * W * 0.22, bottom - dip * 0.2), (cx, bottom + dip * 0.35))
        page = top_edge + bottom_edge
        # page thickness (shade under the page)
        shade = [(x, y + H * 0.045) for (x, y) in page]
        d.polygon(shade, fill=PAPER_SHADE)
        d.polygon(page, fill=PAPER)
        # text lines
        for k in range(4):
            fy = 0.30 + k * 0.15
            x0 = cx + side * W * 0.09
            x1 = cx + side * W * (0.40 if k < 3 else 0.28)
            y0 = top + dip * 0.7 + H * fy
            lw = max(1, int(H * 0.045))
            d.line([(x0, y0), (x1, y0 - dip * 0.15)], fill=LINE, width=lw)
    # spine
    d.line([(cx, top + dip), (cx, bottom + dip * 0.35)], fill=TEAL_DARK, width=max(2, int(W * 0.018)))
    # gold check badge (bottom, on the left side as read in Hebrew)
    r = W * 0.19
    bx, by = cx - W * 0.40, bottom + dip * 0.15
    d.ellipse([bx - r - W * 0.025, by - r - W * 0.025, bx + r + W * 0.025, by + r + W * 0.025], fill=TEAL if bg else (0, 0, 0, 0))
    d.ellipse([bx - r, by - r, bx + r, by + r], fill=GOLD)
    lw = max(2, int(r * 0.26))
    d.line([(bx - r * 0.45, by + r * 0.02), (bx - r * 0.1, by + r * 0.38), (bx + r * 0.5, by - r * 0.33)], fill=WHITE, width=lw, joint='curve')
    return img.resize((size, size), Image.LANCZOS)


def save(img, *parts):
    path = os.path.join(*parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)


DENS = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for name, f in DENS.items():
    legacy = int(48 * f)
    save(art(legacy, 0.60, 'square'), RES, 'mipmap-' + name, 'ic_launcher.png')
    save(art(legacy, 0.56, 'circle'), RES, 'mipmap-' + name, 'ic_launcher_round.png')
    fg = int(108 * f)
    save(art(fg, 0.52), RES, 'mipmap-' + name, 'ic_launcher_foreground.png')

save(art(192, 0.60, 'square'), ROOT, 'www', 'icon.png')
save(art(512, 0.60, 'square'), ROOT, 'docs', 'icon-512.png')
print('icons written')

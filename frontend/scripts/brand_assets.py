"""Builds tight, transparent logo variants in public/brand/ from public/srini-logo.png.

The source logo has wide white margins (it renders tiny at header sizes), so we crop to the artwork
and turn the white background transparent. Re-run if the logo changes:
    python scripts/brand_assets.py
"""
from pathlib import Path
from PIL import Image

PUBLIC = Path(__file__).resolve().parent.parent / "public"
SRC = PUBLIC / "srini-logo.png"
OUT = PUBLIC / "brand"

MARK_BOX = (130, 120, 690, 566)    # runner + rings
FULL_BOX = (130, 120, 690, 780)    # mark + SRINI wordmark + tagline


def unwhite(im):
    """White background → transparent, keeping anti-aliased edges smooth."""
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = px[x, y]
            a = 255 - min(r, g, b)
            a = min(255, int(a * 1.35))
            if a <= 6:
                px[x, y] = (0, 0, 0, 0)
                continue
            f = a / 255
            # un-mix the white so colours stay true at the edges
            px[x, y] = tuple(max(0, min(255, int((c - 255 * (1 - f)) / f))) for c in (r, g, b)) + (a,)
    return im


def light_version(im):
    """For navy backgrounds: navy artwork → white, gold stays gold."""
    im = im.copy()
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a and b >= r:          # navy family (blue ≥ red); gold has red ≫ blue
                px[x, y] = (255, 255, 255, a)
    return im


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    mark = unwhite(src.crop(MARK_BOX))
    full = unwhite(src.crop(FULL_BOX))
    mark.save(OUT / "logo-mark.png", optimize=True)
    light_version(mark).save(OUT / "logo-mark-light.png", optimize=True)
    full.save(OUT / "logo-full.png", optimize=True)
    light_version(full).save(OUT / "logo-full-light.png", optimize=True)
    for f in sorted(OUT.iterdir()):
        print(f.name, Image.open(f).size)

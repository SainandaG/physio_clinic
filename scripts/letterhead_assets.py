"""Build the letterhead images used for treatment summaries (backend/app/assets/).

    python scripts/letterhead_assets.py

- letterhead-mark.png       the running-man mark recoloured in the letterhead's gold gradient
- letterhead-watermark.png  the full stacked logo in pale gold, for the faint page watermark
Both are made from frontend/public/brand/, so they follow any logo update.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "frontend" / "public" / "brand"
OUT = ROOT / "backend" / "app" / "assets"

# Light → dark gold, as on the printed letterhead
GOLD_TOP, GOLD_BOTTOM = (240, 205, 120), (176, 130, 46)


def gold(src: Path, opacity: float = 1.0, scale: int = 2) -> Image.Image:
    im = Image.open(src).convert("RGBA")
    im = im.resize((im.width * scale, im.height * scale), Image.LANCZOS)
    alpha = im.getchannel("A").point(lambda a: int(a * opacity))
    w, h = im.size
    grad = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        grad.putpixel((0, y), tuple(int(a + (b - a) * t) for a, b in zip(GOLD_TOP, GOLD_BOTTOM)))
    out = grad.resize((w, h))
    out.putalpha(alpha)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    gold(BRAND / "logo-mark.png").save(OUT / "letterhead-mark.png", optimize=True)
    gold(BRAND / "logo-full.png", opacity=0.09).save(OUT / "letterhead-watermark.png", optimize=True)
    print("wrote", *sorted(p.name for p in OUT.glob("letterhead-*.png")))


if __name__ == "__main__":
    main()

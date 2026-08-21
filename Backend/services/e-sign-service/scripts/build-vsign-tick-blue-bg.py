"""
Build VSign tick.png: light-blue box (#E8F2FF) + green checkmark only (no text watermark).
Utility renders signer text separately — tick must NOT include "Digitally Signed" caption.
Usage: python scripts/build-vsign-tick-blue-bg.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

SERVICE_ROOT = Path(__file__).resolve().parents[1]
UTILITY = SERVICE_ROOT / "utility"
# Typical appearance box aspect (~280x85); utility scales tick to signature box.
OUT_SIZE = (280, 85)
BG_COLOR = (232, 242, 255, 255)  # #E8F2FF


def load_checkmark_source() -> Image.Image:
    for candidate in [
        UTILITY / "tick-official-src.png",
        UTILITY / "tick.png",
    ]:
        if candidate.exists():
            img = Image.open(candidate).convert("RGBA")
            # Official kit: green check on black — make black transparent.
            pixels = img.load()
            w, h = img.size
            for y in range(h):
                for x in range(w):
                    r, g, b, a = pixels[x, y]
                    if r < 40 and g < 40 and b < 40:
                        pixels[x, y] = (r, g, b, 0)
            return img
    raise FileNotFoundError("Checkmark source not found in utility/")


def composite_tick() -> Image.Image:
    src = load_checkmark_source()
    canvas = Image.new("RGBA", OUT_SIZE, BG_COLOR)
    # Small checkmark, bottom-left — leaves room for text lines on the right.
    target_h = int(OUT_SIZE[1] * 0.55)
    scale = target_h / src.height
    target_w = max(1, int(src.width * scale))
    check = src.resize((target_w, target_h), Image.Resampling.LANCZOS)
    x = int(OUT_SIZE[0] * 0.03)
    y = OUT_SIZE[1] - target_h - int(OUT_SIZE[1] * 0.08)
    canvas.paste(check, (x, y), check)
    return canvas


def main() -> None:
    UTILITY.mkdir(parents=True, exist_ok=True)
    out = composite_tick()
    for dest in [
        UTILITY / "tick.png",
        SERVICE_ROOT / "uploads" / "vSign" / "tick.png",
        SERVICE_ROOT / "uploads" / "vSignTemp" / "tick.png",
    ]:
        dest.parent.mkdir(parents=True, exist_ok=True)
        out.save(dest, "PNG")
        print(f"Wrote {dest} ({dest.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

"""
Build VSign tick.png: light-green background + official green check (no text).
Usage: python scripts/build-vsign-tick-green-bg.py
"""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

SERVICE_ROOT = Path(__file__).resolve().parents[1]
UTILITY = SERVICE_ROOT / "utility"
KIT_TICK = Path(
    r"C:\Users\DELL\Desktop\ASP eSign 2.1_ITIO Innovex Private Limited(UAT)_17-Feb-26"
    r"\ASP eSign 2.1_ITIO Innovex Private Limited(UAT)_17-Feb-26\UAT\tick.png"
)
OUT_SIZE = (501, 281)
# Light green shade for signature block background
BG_COLOR = (232, 245, 233, 255)  # #E8F5E9


def load_source_tick() -> Image.Image:
    for candidate in [UTILITY / "tick-official-src.png", KIT_TICK, UTILITY / "tick.png"]:
        if candidate.exists():
            return Image.open(candidate).convert("RGBA")
    raise FileNotFoundError("Official tick source not found")


def composite_tick() -> Image.Image:
    src = load_source_tick()
    canvas = Image.new("RGBA", OUT_SIZE, BG_COLOR)
    # Scale tick to ~88% of canvas, bottom-left anchored like reference
    scale = min(OUT_SIZE[0] / src.width, OUT_SIZE[1] / src.height) * 0.92
    w = max(1, int(src.width * scale))
    h = max(1, int(src.height * scale))
    tick = src.resize((w, h), Image.Resampling.LANCZOS)
    x = int(OUT_SIZE[0] * 0.02)
    y = OUT_SIZE[1] - h - int(OUT_SIZE[1] * 0.04)
    canvas.paste(tick, (x, y), tick)
    return canvas


def main() -> None:
    UTILITY.mkdir(parents=True, exist_ok=True)
    out = composite_tick()
    dest = UTILITY / "tick.png"
    backup = UTILITY / "tick-official-src.png"
    kit = KIT_TICK
    if kit.exists() and not backup.exists():
        backup.write_bytes(kit.read_bytes())
    out.save(dest, "PNG")
    uploads = SERVICE_ROOT / "uploads" / "vSign" / "tick.png"
    uploads.parent.mkdir(parents=True, exist_ok=True)
    out.save(uploads, "PNG")
    print(f"Wrote {dest} ({dest.stat().st_size} bytes) size={OUT_SIZE}")


if __name__ == "__main__":
    main()

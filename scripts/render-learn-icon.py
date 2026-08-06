"""Render app/icon.png from the white mark SVG (simple raster fallback)."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    size = 256
    img = Image.new("RGBA", (size, size), (7, 7, 13, 255))
    draw = ImageDraw.Draw(img)
    # Centered simplified mark in white
    cx, cy = size // 2, size // 2 - 8
    s = 1.35
    white = (255, 255, 255, 255)
    w = 5

    def L(x1, y1, x2, y2):
        draw.line(
            [(cx + x1 * s, cy + y1 * s), (cx + x2 * s, cy + y2 * s)],
            fill=white,
            width=w,
        )

    # Pages
    draw.polygon(
        [
            (cx - 2 * s, cy - 10 * s),
            (cx - 48 * s, cy - 6 * s),
            (cx - 44 * s, cy + 38 * s),
            (cx - 2 * s, cy + 38 * s),
        ],
        outline=white,
    )
    draw.polygon(
        [
            (cx + 2 * s, cy - 10 * s),
            (cx + 48 * s, cy - 6 * s),
            (cx + 44 * s, cy + 38 * s),
            (cx + 2 * s, cy + 38 * s),
        ],
        outline=white,
    )
    L(0, -36, 0, 28)
    L(-12, -22, 12, -22)
    L(-12, -6, 12, -6)
    L(-12, 10, 12, 10)
    draw.polygon(
        [
            (cx - 12 * s, cy + 28 * s),
            (cx, cy + 58 * s),
            (cx + 12 * s, cy + 28 * s),
        ],
        outline=white,
    )
    L(-18, -36, -18, -50)
    L(-6, -36, -6, -58)
    L(6, -36, 6, -64)
    L(18, -36, 18, -52)

    out = ROOT / "app" / "icon.png"
    img.save(out)
    print("wrote", out)


if __name__ == "__main__":
    main()

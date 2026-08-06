"""Crop LEARN logo assets from the branding sheet into public/brand + app/icon.png."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    r"C:\Users\Cyber Beast Tech\.cursor\projects\c-Users-Cyber-Beast-Tech-Desktop-english-learning-dse-app\assets\c__Users_Cyber_Beast_Tech_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_eng_logo-414c570b-53b3-4467-b632-07cc9df9c276.png"
)
OUT = ROOT / "public" / "brand"
APP = ROOT / "app"


def ink_on_transparent(im: Image.Image, light_thresh: int = 200) -> Image.Image:
    arr = np.asarray(im.convert("RGBA")).astype(np.float32)
    brightness = arr[:, :, :3].mean(axis=2)
    # Only keep dark ink on light backgrounds (drop navy sample panels).
    alpha = np.zeros(brightness.shape, dtype=np.uint8)
    ink = brightness < 140
    # soft edge
    soft = (brightness >= 140) & (brightness < light_thresh)
    alpha[ink] = 255
    alpha[soft] = np.clip(255 - (brightness[soft] - 140) * (255 / 60), 0, 255).astype(
        np.uint8
    )
    out = np.zeros((*brightness.shape, 4), dtype=np.uint8)
    out[:, :, 3] = alpha
    return Image.fromarray(out, "RGBA")


def white_on_transparent(im: Image.Image) -> Image.Image:
    arr = np.asarray(im.convert("RGBA")).copy()
    a = arr[:, :, 3]
    out = np.zeros_like(arr)
    out[:, :, 0:3] = 255
    out[:, :, 3] = a
    return Image.fromarray(out, "RGBA")


def trim(im: Image.Image, pad: int = 6) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    left, top, right, bottom = bbox
    return im.crop(
        (
            max(0, left - pad),
            max(0, top - pad),
            min(im.width, right + pad),
            min(im.height, bottom + pad),
        )
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    APP.mkdir(parents=True, exist_ok=True)
    img = Image.open(SRC).convert("RGBA")

    # Fixed crop of the main stacked black lockup (excludes navy samples on the right).
    lockup_box = (120, 8, 360, 205)
    lockup = img.crop(lockup_box)
    lockup_black = trim(ink_on_transparent(lockup))
    lockup_white = white_on_transparent(lockup_black)
    lockup_black.save(OUT / "learn-lockup-black.png")
    lockup_white.save(OUT / "learn-lockup-white.png")
    print("lockup", lockup_black.size, "opaque", (np.asarray(lockup_black)[:, :, 3] > 200).mean())

    # Icon-only from top of lockup (stop before LEARN wordmark).
    cut = int(lockup_black.height * 0.58)
    mark_black = trim(lockup_black.crop((0, 0, lockup_black.width, cut)))
    mark_white = white_on_transparent(mark_black)
    mark_black.save(OUT / "learn-mark-black.png")
    mark_white.save(OUT / "learn-mark-white.png")
    print("mark", mark_black.size)

    # App icon
    icon = Image.new("RGBA", (256, 256), (7, 7, 13, 255))
    mw, mh = mark_white.size
    scale = min(188 / max(mw, 1), 188 / max(mh, 1))
    nw, nh = max(1, int(mw * scale)), max(1, int(mh * scale))
    resized = mark_white.resize((nw, nh), Image.Resampling.LANCZOS)
    icon.paste(resized, ((256 - nw) // 2, (256 - nh) // 2), resized)
    icon.save(APP / "icon.png")
    print("icon ok")


if __name__ == "__main__":
    main()

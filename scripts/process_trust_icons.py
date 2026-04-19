from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


DOWNLOADS = Path(r"C:/Users/IFEANYI PC/Downloads")
OUT = Path("public/trust")
OUT.mkdir(parents=True, exist_ok=True)


def remove_white_bg(path: Path, tolerance: int = 34) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    data = np.array(img, dtype=np.int32)

    h, w = data.shape[:2]
    corners = [
        data[0, 0, :3],
        data[0, w - 1, :3],
        data[h - 1, 0, :3],
        data[h - 1, w - 1, :3],
    ]
    bg = np.mean(corners, axis=0)

    rgb = data[:, :, :3].astype(np.float32)
    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    mask = dist < tolerance
    data[mask, 3] = 0

    result = Image.fromarray(data.astype(np.uint8), "RGBA")
    r, g, b, a = result.split()
    a = a.filter(ImageFilter.GaussianBlur(0.55))
    return Image.merge("RGBA", (r, g, b, a))


def trim_alpha(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


def fit_canvas(img: Image.Image, width: int = 320, height: int = 140) -> Image.Image:
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    ratio = min((width * 0.78) / img.width, (height * 0.72) / img.height)
    resized = img.resize((max(1, int(img.width * ratio)), max(1, int(img.height * ratio))), Image.LANCZOS)
    x = (width - resized.width) // 2
    y = (height - resized.height) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


SOURCES = {
    "cbn": "CBNicon.webp",
    "nigeria": "nigeriaicon.png",
    "crc": "CRCicon.png",
    "nibss": "NIBSSicon.png",
}


def main() -> None:
    for slug, name in SOURCES.items():
        src = DOWNLOADS / name
        if not src.exists():
            print(f"[MISSING] {name}")
            continue

        processed = remove_white_bg(src)
        processed = trim_alpha(processed)
        processed = fit_canvas(processed)

        out = OUT / f"{slug}.png"
        processed.save(out, "PNG")
        print(f"[OK] {out}")


if __name__ == "__main__":
    main()

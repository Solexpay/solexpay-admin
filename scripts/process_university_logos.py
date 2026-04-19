"""
Process university logos - remove white backgrounds.
Uses the same remove_white_bg function from process_logos.py
"""

from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

LOGOS_DIR = Path("public/logos")

def remove_white_bg(path: Path, tolerance: int = 28) -> Image.Image:
    """
    Remove white/near-white background from a JPEG logo.
    Uses corner-sampling so solid-colour content is never wiped.
    Returns RGBA image with transparent background.
    """
    img = Image.open(path).convert("RGBA")
    data = np.array(img, dtype=np.int32)

    # Sample background colour from all four corners (average)
    h, w = data.shape[:2]
    corners = [data[0, 0, :3], data[0, w-1, :3],
               data[h-1, 0, :3], data[h-1, w-1, :3]]
    bg = np.mean(corners, axis=0)

    # Euclidean distance from background colour
    rgb = data[:, :, :3].astype(np.float32)
    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))

    # Pixels within tolerance become transparent
    mask = dist < tolerance
    data[mask, 3] = 0

    # Soften jagged edges with a very slight blur on the alpha channel only
    result = Image.fromarray(data.astype(np.uint8), "RGBA")
    r, g, b, a = result.split()
    a = a.filter(ImageFilter.GaussianBlur(0.6))
    result = Image.merge("RGBA", (r, g, b, a))
    return result

def trim_alpha(img: Image.Image) -> Image.Image:
    """Crop transparent borders."""
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img

def process_logo(filename: str):
    """Process a single logo file."""
    input_path = LOGOS_DIR / filename
    output_path = LOGOS_DIR / filename.replace('.jpg', '.png')
    
    if not input_path.exists():
        print(f"[MISSING] Not found: {filename}")
        return
    
    print(f"Processing {filename} ...")
    
    # Remove white background
    img = remove_white_bg(input_path, tolerance=30)
    
    # Trim transparent edges
    img = trim_alpha(img)
    
    # Save as PNG with transparency
    img.save(output_path, "PNG")
    
    # Remove original JPG
    input_path.unlink()
    
    print(f"  [OK] Saved: {output_path.name}")

# Process all logos
logos = ["unilag.jpg", "ui.jpg", "oau.jpg", "unn.jpg", "abu.jpg", "futa.jpg", "cu.jpg", "uniabuja.jpg"]

print("Processing university logos...\n")
for logo in logos:
    process_logo(logo)

print("\n[OK] All logos processed!")

# List final files
print("\nFinal logos in public/logos/:")
for f in sorted(LOGOS_DIR.glob("*.png")):
    size_kb = f.stat().st_size / 1024
    print(f"  {f.name} ({size_kb:.1f} kB)")

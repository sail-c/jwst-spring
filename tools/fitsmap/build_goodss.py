"""Build the compact, colour-preserving GOODS-S production map."""

from __future__ import annotations

import argparse
import json
import math
import os
import shutil
import struct
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from astropy.io import fits
from astropy.wcs import WCS
from PIL import Image

ROOT = Path(__file__).resolve().parent
REPOSITORY_ROOT = ROOT.parent.parent
FITSMAP_DIR = REPOSITORY_ROOT / "docs" / "_static" / "fitsmap"
MAP_DIR = FITSMAP_DIR / "goodss"
WEB_DIR = ROOT / "web"
METADATA_PATH = ROOT / "build-metadata-goodss.json"
CATALOG_PATH = Path(r"E:\ALL_CANDELS_JWST_final_goodss_v2.fits")
TILE_SIZE = 2048
OVERVIEW_SIZE = 512
MIN_ZOOM = 1
THRESHOLD_SIGMA = 0.4
SHADOW_GAMMA = 0.65

LAYERS = ("RGB_ENHANCED", "F150W", "F277W", "F444W")

BANDS = {
    "F150W": Path(r"E:\hlsp_goodss_jwst_nircam_all_F150W_030mas_v1.6_drz.fits"),
    "F277W": Path(r"E:\hlsp_goodss_jwst_nircam_all_F277W_030mas_v1.6_drz.fits"),
    "F444W": Path(r"E:\hlsp_goodss_jwst_nircam_all_F444W_030mas_v1.6_drz.fits"),
}
RGB_ORDER = ("F444W", "F277W", "F150W")


def robust_stats(data: np.ndarray) -> dict[str, float]:
    sample = np.asarray(data[::64, ::64], dtype=np.float32)
    sample = sample[np.isfinite(sample)]
    if not sample.size:
        raise RuntimeError("The FITS image contains no finite sampled pixels")
    median = float(np.median(sample))
    mad = float(np.median(np.abs(sample - median)))
    sigma = max(1.4826 * mad, np.finfo(np.float32).eps)
    return {
        "median": median,
        "sigma": sigma,
        "originalLow": median - 1.5 * sigma,
        "originalHigh": float(np.percentile(sample, 99.92)),
        "sampleCount": int(sample.size),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--quality", type=int, default=80)
    parser.add_argument("--webp-method", type=int, default=2, choices=range(0, 7))
    parser.add_argument("--workers", type=int, default=max(1, min(4, (os.cpu_count() or 4) // 2)))
    parser.add_argument("--clean", action="store_true")
    return parser.parse_args()


def original_float(data: np.ndarray, stats: dict[str, float]) -> np.ndarray:
    low = stats["originalLow"]
    high = stats["originalHigh"]
    scaled = np.zeros(data.shape, dtype=np.float32)
    finite = np.isfinite(data)
    scaled[finite] = (data[finite] - low) / (high - low)
    np.clip(scaled, 0.0, 1.0, out=scaled)
    scaled = np.arcsinh(8.0 * scaled) / np.arcsinh(8.0)
    return scaled


def enhanced_rgb(blocks: dict[str, np.ndarray], stats: dict[str, dict[str, float]]) -> np.ndarray:
    # Start from exactly the same per-band stretch as the original RGB.  Every
    # subsequent adjustment is derived from one shared luminance value and is
    # applied equally to R, G, and B, so source colours are retained.
    channels = np.stack([original_float(blocks[band], stats[band]) for band in RGB_ORDER], axis=-1)
    luminance = channels.mean(axis=-1)
    thresholds = []
    for band in RGB_ORDER:
        threshold_value = stats[band]["median"] + THRESHOLD_SIGMA * stats[band]["sigma"]
        thresholds.append(float(original_float(np.asarray([[threshold_value]], dtype=np.float32), stats[band])[0, 0]))
    black_level = float(np.mean(thresholds))
    adjusted = np.maximum(luminance - black_level, 0.0) / max(1.0 - black_level, np.finfo(np.float32).eps)
    lifted = np.power(adjusted, SHADOW_GAMMA)
    scale = np.zeros_like(luminance)
    np.divide(lifted, luminance, out=scale, where=luminance > 0)
    channels *= scale[..., None]
    peak = channels.max(axis=-1)
    channels /= np.maximum(peak, 1.0)[..., None]
    return np.rint(channels * 255.0).astype(np.uint8)


def original_rgb(blocks: dict[str, np.ndarray], stats: dict[str, dict[str, float]]) -> np.ndarray:
    channels = np.stack([original_float(blocks[band], stats[band]) for band in RGB_ORDER], axis=-1)
    return np.rint(channels * 255.0).astype(np.uint8)


def original_gray(data: np.ndarray, stats: dict[str, float]) -> np.ndarray:
    return np.rint(original_float(data, stats) * 255.0).astype(np.uint8)


def save_image(array: np.ndarray, path: Path, quality: int, method: int) -> None:
    height, width = array.shape[:2]
    mode = "L" if array.ndim == 2 else "RGB"
    shape = (TILE_SIZE, TILE_SIZE) if mode == "L" else (TILE_SIZE, TILE_SIZE, 3)
    canvas = np.zeros(shape, dtype=np.uint8)
    canvas[:height, :width] = array
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(canvas, mode).save(path, "WEBP", quality=quality, method=method)


def build_native_tiles(
    stats: dict[str, dict[str, float]],
    width: int,
    height: int,
    max_zoom: int,
    quality: int,
    method: int,
    workers: int,
) -> None:
    tiles_x = math.ceil(width / TILE_SIZE)
    tiles_y = math.ceil(height / TILE_SIZE)

    def make_one(x: int, y: int, strips: dict[str, np.ndarray]) -> None:
        destinations = [MAP_DIR / "tiles" / layer / str(max_zoom) / str(x) / f"{y}.webp" for layer in LAYERS]
        if all(path.exists() for path in destinations):
            return
        x0, x1 = x * TILE_SIZE, min((x + 1) * TILE_SIZE, width)
        blocks = {band: strip[:, x0:x1] for band, strip in strips.items()}
        save_image(enhanced_rgb(blocks, stats), destinations[0], quality, method)
        for band, destination in zip(BANDS, destinations[1:]):
            save_image(original_gray(blocks[band], stats[band]), destination, quality, method)

    for y in range(tiles_y):
        # FITS pixel Y increases towards north, while browser image rows increase
        # downwards. Read strips from the top of the FITS plane and reverse each
        # strip so the web map is north-up (the equivalent of origin="lower").
        display_y0 = y * TILE_SIZE
        display_y1 = min((y + 1) * TILE_SIZE, height)
        source_y0 = height - display_y1
        source_y1 = height - display_y0
        strips = {}
        for band, path in BANDS.items():
            with fits.open(path, memmap=True, do_not_scale_image_data=True) as hdul:
                strips[band] = np.flipud(
                    np.array(hdul[0].data[source_y0:source_y1, :], dtype=np.float32, copy=True)
                )
        with ThreadPoolExecutor(max_workers=workers) as executor:
            list(executor.map(lambda x: make_one(x, y, strips), range(tiles_x)))
        del strips
        print(f"Native tiles: row {y + 1}/{tiles_y}", flush=True)


def build_lower_levels(layer: str, max_zoom: int, quality: int, method: int, workers: int) -> None:
    root = MAP_DIR / "tiles" / layer
    mode = "RGB" if layer.startswith("RGB") else "L"
    for zoom in range(max_zoom - 1, MIN_ZOOM - 1, -1):
        child_root = root / str(zoom + 1)
        x_dirs = [path for path in child_root.iterdir() if path.is_dir() and path.name.isdigit()]
        max_child_x = max(int(path.name) for path in x_dirs)
        max_child_y = max(int(path.stem) for x_dir in x_dirs for path in x_dir.glob("*.webp"))
        tiles_x = (max_child_x + 2) // 2
        tiles_y = (max_child_y + 2) // 2
        destination_root = root / str(zoom)

        def make_one(coords: tuple[int, int]) -> None:
            x, y = coords
            destination = destination_root / str(x) / f"{y}.webp"
            canvas = Image.new(mode, (TILE_SIZE * 2, TILE_SIZE * 2), 0)
            for dx in (0, 1):
                for dy in (0, 1):
                    child = child_root / str(x * 2 + dx) / f"{y * 2 + dy}.webp"
                    if child.exists():
                        with Image.open(child) as image:
                            canvas.paste(image.convert(mode), (dx * TILE_SIZE, dy * TILE_SIZE))
            parent = canvas.resize((TILE_SIZE, TILE_SIZE), Image.Resampling.LANCZOS)
            destination.parent.mkdir(parents=True, exist_ok=True)
            parent.save(destination, "WEBP", quality=quality, method=method)

        coords = [(x, y) for y in range(tiles_y) for x in range(tiles_x)]
        with ThreadPoolExecutor(max_workers=workers) as executor:
            list(executor.map(make_one, coords))
        print(f"{layer}: zoom {zoom} ({tiles_x} x {tiles_y})", flush=True)


def build_catalog(header: fits.Header, width: int, height: int, max_zoom: int) -> dict[str, int | float | str]:
    data = fits.getdata(CATALOG_PATH, 1, memmap=True)
    # Convert verified sky coordinates through the mosaic WCS. Web X/Y refer
    # to pixel centres measured from the top-left of the north-up display.
    wcs = WCS(header)
    x, y = wcs.world_to_pixel_values(
        np.asarray(data["X_WORLD"], dtype=np.float64),
        np.asarray(data["Y_WORLD"], dtype=np.float64),
    )
    x = np.asarray(x, dtype=np.float32)
    y = np.asarray(y, dtype=np.float32)
    valid = np.isfinite(x) & np.isfinite(y) & (x >= 0) & (x < width) & (y >= 0) & (y < height)
    ids = np.asarray(data["ID"], dtype=np.uint32)[valid]
    x = x[valid] + 0.5
    y = height - (y[valid] + 0.5)
    zbest = np.asarray(data["zbest"], dtype=np.float32)[valid]
    major = np.asarray(data["A_IMAGE"], dtype=np.float32)[valid]
    minor = np.asarray(data["B_IMAGE"], dtype=np.float32)[valid]
    theta = np.asarray(data["THETA_IMAGE"], dtype=np.float32)[valid]
    tile_x = np.floor(x / TILE_SIZE).astype(np.int32)
    tile_y = np.floor(y / TILE_SIZE).astype(np.int32)
    keys = tile_x.astype(np.int64) << 32 | tile_y.astype(np.uint32)
    order = np.argsort(keys)
    boundaries = np.flatnonzero(np.diff(keys[order])) + 1
    catalog_root = MAP_DIR / "catalog" / str(max_zoom)
    if catalog_root.exists():
        shutil.rmtree(catalog_root)
    record = struct.Struct("<Iffffff")
    for indexes in np.split(order, boundaries):
        tx = int(tile_x[indexes[0]])
        ty = int(tile_y[indexes[0]])
        destination = catalog_root / str(tx) / f"{ty}.bin"
        destination.parent.mkdir(parents=True, exist_ok=True)
        with destination.open("wb") as stream:
            for index in indexes:
                stream.write(record.pack(
                    int(ids[index]), float(x[index]), float(y[index]), float(zbest[index]),
                    float(major[index]), float(minor[index]), float(theta[index]),
                ))
    return {
        "recordBytes": record.size,
        "sourceCount": int(valid.sum()),
        "tileCount": len(np.split(order, boundaries)),
        "minDisplayZoom": 5,
        "ellipseZoom": max_zoom,
        "maxDisplayRadiusNative": 300,
        "path": f"catalog/{max_zoom}/{{x}}/{{y}}.bin?v=northup1",
    }


def write_config(
    header: fits.Header,
    width: int,
    height: int,
    max_zoom: int,
    quality: int,
    method: int,
    stats: dict[str, dict[str, float]],
    catalog: dict[str, int | float | str],
) -> None:
    wcs = WCS(header)
    center = wcs.pixel_to_world_values((width - 1) / 2, (height - 1) / 2)
    config = {
        "field": "GOODS-S",
        "width": width,
        "height": height,
        "tileSize": TILE_SIZE,
        "minZoom": MIN_ZOOM,
        "initialZoom": MIN_ZOOM,
        "maxNativeZoom": max_zoom,
        "maxZoom": max_zoom + 4,
        "downsampleFactor": 1,
        "pixelScaleArcsec": 0.03,
        "orientation": "north-up, east-left",
        "webpQuality": quality,
        "webpMethod": method,
        "center": {"ra": float(center[0]), "dec": float(center[1])},
        "layers": [
            {"id": "RGB_ENHANCED", "label": "Color — F150W / F277W / F444W"},
            {"id": "F150W", "label": "F150W · 1.50 μm"},
            {"id": "F277W", "label": "F277W · 2.77 μm"},
            {"id": "F444W", "label": "F444W · 4.44 μm"},
        ],
        "wcs": {
            "crpix": [float(header["CRPIX1"]), float(header["CRPIX2"])],
            "crval": [float(header["CRVAL1"]), float(header["CRVAL2"])],
            "matrix": wcs.pixel_scale_matrix.tolist(),
        },
        "display": {"thresholdSigma": THRESHOLD_SIGMA, "shadowGamma": SHADOW_GAMMA, "statistics": stats},
        "catalog": catalog,
    }
    (MAP_DIR / "config.js").write_text("window.GOODSS_CONFIG = " + json.dumps(config, indent=2) + ";\n", encoding="utf-8")
    METADATA_PATH.write_text(json.dumps(config, indent=2), encoding="utf-8")


def copy_shell() -> None:
    MAP_DIR.mkdir(parents=True, exist_ok=True)
    for name in ("index.html", "map.css", "map.js"):
        shutil.copy2(WEB_DIR / name, MAP_DIR / name)


def build_landing_card(max_zoom: int) -> None:
    """Refresh the image used by the GOODS-S card on the FITSmap landing page."""
    source = MAP_DIR / "tiles" / "RGB_ENHANCED" / str(max_zoom) / "12" / "11.webp"
    if not source.exists():
        raise RuntimeError(f"Missing landing-card source tile: {source}")
    with Image.open(source) as image:
        card = image.convert("RGB").crop((350, 0, 1310, 960))
        card = card.resize((720, 720), Image.Resampling.LANCZOS)
        card.save(FITSMAP_DIR / "goodss-card.webp", "WEBP", quality=84, method=4)


def main() -> None:
    args = parse_args()
    missing = [path for path in [*BANDS.values(), CATALOG_PATH] if not path.exists()]
    if missing:
        raise SystemExit("Missing inputs:\n" + "\n".join(map(str, missing)))
    if args.clean and MAP_DIR.exists():
        expected = (REPOSITORY_ROOT / "docs" / "_static" / "fitsmap" / "goodss").resolve()
        if MAP_DIR.resolve() != expected:
            raise RuntimeError(f"Refusing to clean unexpected output directory: {MAP_DIR}")
        shutil.rmtree(MAP_DIR)
    copy_shell()

    stats = {}
    shapes = set()
    header = None
    for band, path in BANDS.items():
        with fits.open(path, memmap=True, do_not_scale_image_data=True) as hdul:
            shapes.add(hdul[0].shape)
            stats[band] = robust_stats(hdul[0].data)
            if band == "F150W":
                header = hdul[0].header.copy()
    if len(shapes) != 1 or header is None:
        raise RuntimeError(f"Input shape/header mismatch: {shapes}")
    height, width = next(iter(shapes))
    max_zoom = max(0, math.ceil(math.log2(max(width, height) / OVERVIEW_SIZE)))
    print(f"Output {width} x {height}; {TILE_SIZE}px; zoom {MIN_ZOOM}-{max_zoom}; q{args.quality}", flush=True)
    build_native_tiles(stats, width, height, max_zoom, args.quality, args.webp_method, args.workers)
    for layer in LAYERS:
        build_lower_levels(layer, max_zoom, args.quality, args.webp_method, args.workers)
    catalog = build_catalog(header, width, height, max_zoom)
    write_config(header, width, height, max_zoom, args.quality, args.webp_method, stats, catalog)
    build_landing_card(max_zoom)
    files = [path for path in MAP_DIR.rglob("*") if path.is_file()]
    size = sum(path.stat().st_size for path in files)
    print(f"Finished: {len(files):,} files, {size / 2**20:.1f} MiB", flush=True)


if __name__ == "__main__":
    main()

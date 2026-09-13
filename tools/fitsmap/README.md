# GOODS-S FITSmap builder

This directory contains the source needed to reproduce the production GOODS-S
FITSmap in `docs/_static/fitsmap/goodss`. The generated map is committed with
the website; the much larger FITS inputs remain outside the repository.

The current build uses:

- native `0.03 arcsec/pixel` sampling;
- 2048 x 2048 pixel WebP tiles;
- north-up, east-left sky orientation derived from the FITS WCS;
- a colour-preserving F150W/F277W/F444W composite;
- F150W, F277W, and F444W single-band layers;
- a spatially indexed catalogue layer containing source ID, `zbest`, and
  `A_IMAGE`/`B_IMAGE` ellipses;
- catalogue centres computed from `X_WORLD`/`Y_WORLD` through the mosaic WCS.

## Inputs

The builder currently reads these local inputs from `E:\`:

- `hlsp_goodss_jwst_nircam_all_F150W_030mas_v1.6_drz.fits`
- `hlsp_goodss_jwst_nircam_all_F277W_030mas_v1.6_drz.fits`
- `hlsp_goodss_jwst_nircam_all_F444W_030mas_v1.6_drz.fits`
- `ALL_CANDELS_JWST_final_goodss_v2.fits`

## Build

Run these commands from the repository root:

```powershell
.\.venv\Scripts\python.exe -m pip install -r tools\fitsmap\requirements.txt
.\.venv\Scripts\python.exe tools\fitsmap\build_goodss.py
```

The normal command resumes an interrupted build and reuses existing image
tiles. Use `--clean` only when changing the image orientation, stretch, tile
size, or pyramid structure and intentionally regenerating every tile:

```powershell
.\.venv\Scripts\python.exe tools\fitsmap\build_goodss.py --clean
```

The builder also refreshes `docs/_static/fitsmap/goodss-card.webp` and writes
the current build metadata to `tools/fitsmap/build-metadata-goodss.json`.

Build the complete website for local review with:

```powershell
.\.venv\Scripts\python.exe -m sphinx -b html -W --keep-going docs docs\_build\html
```

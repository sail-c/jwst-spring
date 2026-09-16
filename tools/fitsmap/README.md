# JWST-SPRING FITSmap builders

This directory contains the shared source used to reproduce the production
maps for all five survey fields in `docs/_static/fitsmap`. The generated maps are
committed with the website; the much larger FITS inputs remain outside the
repository.

All five fields use:

- native `0.03 arcsec/pixel` sampling;
- 2048 x 2048 pixel WebP tiles;
- north-up, east-left sky orientation derived from the FITS WCS;
- a colour-preserving F150W/F277W/F444W composite;
- F150W, F277W, and F444W single-band layers;
- a spatially indexed catalogue layer containing source ID, `zbest` with
  `zspec`/`zphot` provenance, `lmass_med`, `Av_med`, the number of positive-flux
  SED bands, and `A_IMAGE`/`B_IMAGE` ellipses;
- catalogue centres computed from `X_WORLD`/`Y_WORLD` through each mosaic WCS.

`build_goodss.py` contains the shared implementation and GOODS-S defaults.
The field wrappers (`build_cosmos.py`, `build_egs.py`, `build_goodsn.py`, and
`build_uds.py`) supply input paths, landing-card selections, and field-specific
compression settings. Each generated field remains below 150 MiB without
reducing its pixel scale.

## Inputs

The GOODS-S builder reads these inputs from `E:\`:

- `hlsp_goodss_jwst_nircam_all_F150W_030mas_v1.6_drz.fits`
- `hlsp_goodss_jwst_nircam_all_F277W_030mas_v1.6_drz.fits`
- `hlsp_goodss_jwst_nircam_all_F444W_030mas_v1.6_drz.fits`
- `ALL_CANDELS_JWST_final_goodss_v2.fits`

The COSMOS builder reads:

- `hlsp_cos_jwst_nircam_all_F150W_030mas_v1.6_drz.fits`
- `hlsp_cos_jwst_nircam_all_F277W_030mas_v1.6_drz.fits`
- `hlsp_cos_jwst_nircam_all_F444W_030mas_v1.6_drz.fits`
- `ALL_CANDELS_JWST_final_cos_v2.fits`


The EGS, GOODS-N, and UDS wrappers read the corresponding `F150W`, `F277W`,
and `F444W` 030 mas mosaics together with:

- `ALL_CANDELS_JWST_final_egs_v2.fits`
- `ALL_CANDELS_JWST_final_goodsn_v2.fits`
- `ALL_CANDELS_JWST_final_uds_v2.fits`

## Build

Run these commands from the repository root:

```powershell
.\.venv\Scripts\python.exe -m pip install -r tools\fitsmap\requirements.txt
.\.venv\Scripts\python.exe tools\fitsmap\build_goodss.py
.\.venv\Scripts\python.exe tools\fitsmap\build_cosmos.py
.\.venv\Scripts\python.exe tools\fitsmap\build_egs.py
.\.venv\Scripts\python.exe tools\fitsmap\build_goodsn.py
.\.venv\Scripts\python.exe tools\fitsmap\build_uds.py
```

The normal commands resume interrupted builds and reuse existing image tiles.
When only a source catalogue changes, refresh its binary catalogue,
configuration, and web shell without touching image tiles:

```powershell
.\.venv\Scripts\python.exe tools\fitsmap\build_goodss.py --catalog-only
.\.venv\Scripts\python.exe tools\fitsmap\build_cosmos.py --catalog-only
.\.venv\Scripts\python.exe tools\fitsmap\build_egs.py --catalog-only
.\.venv\Scripts\python.exe tools\fitsmap\build_goodsn.py --catalog-only
.\.venv\Scripts\python.exe tools\fitsmap\build_uds.py --catalog-only
```

Use `--clean` only when changing the image orientation, stretch, tile size, or
pyramid structure and intentionally regenerating every tile:

```powershell
.\.venv\Scripts\python.exe tools\fitsmap\build_goodss.py --clean
.\.venv\Scripts\python.exe tools\fitsmap\build_cosmos.py --clean
.\.venv\Scripts\python.exe tools\fitsmap\build_egs.py --clean
.\.venv\Scripts\python.exe tools\fitsmap\build_goodsn.py --clean
.\.venv\Scripts\python.exe tools\fitsmap\build_uds.py --clean
```

Each builder also refreshes its FITSmap landing-card image and writes current
metadata to `tools/fitsmap/build-metadata-<field>.json`.

Build the complete website for local review with:

```powershell
.\.venv\Scripts\python.exe -m sphinx -b html -W --keep-going docs docs\_build\html
```

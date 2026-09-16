"""Build the compact, colour-preserving GOODS-N production map."""

from pathlib import Path

import build_goodss as builder

builder.__doc__ = "Build the compact, colour-preserving GOODS-N production map."
builder.MAP_DIR = builder.FITSMAP_DIR / "goodsn"
builder.METADATA_PATH = builder.ROOT / "build-metadata-goodsn.json"
builder.CATALOG_PATH = Path(r"E:\ALL_CANDELS_JWST_final_goodsn_v2.fits")
builder.FIELD_NAME = "GOODS-N"
builder.CONFIG_GLOBAL = "window.FITSMAP_CONFIG"
builder.CATALOG_VERSION = "catalog1"
builder.TILE_VERSION = "goodsn1"
builder.LANDING_CARD_TILE = (10, 10)
builder.LANDING_CARD_PATH = builder.FITSMAP_DIR / "goodsn-card.webp"
builder.BANDS = {
    "F150W": Path(r"E:\hlsp_goodsn_jwst_nircam_all_F150W_030mas_v1.6_drz.fits"),
    "F277W": Path(r"E:\hlsp_goodsn_jwst_nircam_all_F277W_030mas_v1.6_drz.fits"),
    "F444W": Path(r"E:\hlsp_goodsn_jwst_nircam_all_F444W_030mas_v1.6_drz.fits"),
}
builder.LAYER_QUALITY = {
    "RGB_ENHANCED": 45,
    "F150W": 24,
    "F277W": 45,
    "F444W": 32,
}


if __name__ == "__main__":
    builder.main()

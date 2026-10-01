window.FITSMAP_CONFIG = {
  "field": "UDS",
  "width": 61440,
  "height": 32000,
  "tileSize": 2048,
  "minZoom": 1,
  "initialZoom": 1,
  "maxNativeZoom": 7,
  "maxZoom": 11,
  "downsampleFactor": 1,
  "pixelScaleArcsec": 0.03,
  "orientation": "north-up, east-left",
  "webpQuality": {
    "RGB_ENHANCED": 45,
    "F150W": 24,
    "F277W": 45,
    "F444W": 32
  },
  "tileVersion": "uds20261001",
  "webpMethod": 2,
  "center": {
    "ra": 34.350018594167906,
    "dec": -5.199997509431472
  },
  "layers": [
    {
      "id": "RGB_ENHANCED",
      "label": "Color \u2014 F150W / F277W / F444W"
    },
    {
      "id": "F150W",
      "label": "F150W \u00b7 1.50 \u03bcm"
    },
    {
      "id": "F277W",
      "label": "F277W \u00b7 2.77 \u03bcm"
    },
    {
      "id": "F444W",
      "label": "F444W \u00b7 4.44 \u03bcm"
    }
  ],
  "wcs": {
    "crpix": [
      24000.5,
      16000.5
    ],
    "crval": [
      34.40625,
      -5.2
    ],
    "matrix": [
      [
        -8.333333e-06,
        0.0
      ],
      [
        0.0,
        8.333333e-06
      ]
    ]
  },
  "display": {
    "thresholdSigma": 0.4,
    "shadowGamma": 0.65,
    "statistics": {
      "F150W": {
        "median": 0.0009693004540167749,
        "sigma": 0.008828061351086944,
        "originalLow": -0.012272791572613642,
        "originalHigh": 1.0986943244934082,
        "sampleCount": 263455
      },
      "F277W": {
        "median": 0.0009165058727376163,
        "sigma": 0.0042218286761082705,
        "originalLow": -0.005416237141424789,
        "originalHigh": 1.2639895677566528,
        "sampleCount": 272150
      },
      "F444W": {
        "median": 0.0009149133693426847,
        "sigma": 0.005269482891261577,
        "originalLow": -0.006989310967549681,
        "originalHigh": 0.9481378793716431,
        "sampleCount": 276554
      }
    }
  },
  "catalog": {
    "recordBytes": 38,
    "sourceCount": 204002,
    "tileCount": 302,
    "spectroscopicSourceCount": 6055,
    "fluxBandCount": 12,
    "minDisplayZoom": 5,
    "ellipseZoom": 7,
    "maxDisplayRadiusNative": 300,
    "path": "catalog/7/{x}/{y}.bin?v=uds20261001"
  },
  "inputs": [
    {
      "band": "F150W",
      "file": "hlsp_uds_jwst_nircam_all_F150W_030mas_v1.7_drz.fits",
      "bytes": 7864329600,
      "modifiedUTC": "2026-09-20T15:34:49.897400+00:00"
    },
    {
      "band": "F277W",
      "file": "hlsp_uds_jwst_nircam_all_F277W_030mas_v1.7_drz.fits",
      "bytes": 7864329600,
      "modifiedUTC": "2026-09-24T02:06:49.858925+00:00"
    },
    {
      "band": "F444W",
      "file": "hlsp_uds_jwst_nircam_all_F444W_030mas_v1.7_drz.fits",
      "bytes": 7864329600,
      "modifiedUTC": "2026-09-22T06:24:27.459043+00:00"
    }
  ],
  "catalogInput": "ALL_CANDELS_JWST_final_uds_v2.fits"
};

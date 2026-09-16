window.FITSMAP_CONFIG = {
  "field": "GOODS-N",
  "width": 40960,
  "height": 40960,
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
  "tileVersion": "goodsn1",
  "webpMethod": 2,
  "center": {
    "ra": 189.2321991423427,
    "dec": 62.23857195394836
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
      20680.5,
      20480.5
    ],
    "crval": [
      189.228621,
      62.238572
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
        "median": 0.0008105744491331279,
        "sigma": 0.004977668744092807,
        "originalLow": -0.0066559286670060825,
        "originalHigh": 1.0611345767974854,
        "sampleCount": 138851
      },
      "F277W": {
        "median": 0.0006732534384354949,
        "sigma": 0.0024264785718172786,
        "originalLow": -0.002966464419290423,
        "originalHigh": 1.2409964799880981,
        "sampleCount": 108960
      },
      "F444W": {
        "median": 0.0007011943962424994,
        "sigma": 0.003426845598919317,
        "originalLow": -0.004439074002136476,
        "originalHigh": 0.9647170305252075,
        "sampleCount": 202042
      }
    }
  },
  "catalog": {
    "recordBytes": 38,
    "sourceCount": 156327,
    "tileCount": 213,
    "spectroscopicSourceCount": 5920,
    "fluxBandCount": 18,
    "minDisplayZoom": 5,
    "ellipseZoom": 7,
    "maxDisplayRadiusNative": 300,
    "path": "catalog/7/{x}/{y}.bin?v=catalog1"
  }
};

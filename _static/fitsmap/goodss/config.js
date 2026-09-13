window.GOODSS_CONFIG = {
  "field": "GOODS-S",
  "width": 50100,
  "height": 46900,
  "tileSize": 2048,
  "minZoom": 1,
  "initialZoom": 1,
  "maxNativeZoom": 7,
  "maxZoom": 11,
  "downsampleFactor": 1,
  "pixelScaleArcsec": 0.03,
  "orientation": "north-up, east-left",
  "webpQuality": 80,
  "webpMethod": 2,
  "center": {
    "ra": 53.12604870016444,
    "dec": -27.815505626968775
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
      25400.5,
      24700.5
    ],
    "crval": [
      53.122751,
      -27.805089
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
        "median": 0.0005604568868875504,
        "sigma": 0.0028884571427945046,
        "originalLow": -0.0037722288273042068,
        "originalHigh": 1.1113122701644897,
        "sampleCount": 194188
      },
      "F277W": {
        "median": 0.0005240290192887187,
        "sigma": 0.0017136882541934028,
        "originalLow": -0.0020465033620013853,
        "originalHigh": 1.1878682374954224,
        "sampleCount": 203231
      },
      "F444W": {
        "median": 0.000508295139297843,
        "sigma": 0.0019936672280542553,
        "originalLow": -0.00248220570278354,
        "originalHigh": 0.8897275328636169,
        "sampleCount": 224062
      }
    }
  },
  "catalog": {
    "recordBytes": 28,
    "sourceCount": 205983,
    "tileCount": 242,
    "minDisplayZoom": 5,
    "ellipseZoom": 7,
    "maxDisplayRadiusNative": 300,
    "path": "catalog/7/{x}/{y}.bin?v=northup1"
  }
};

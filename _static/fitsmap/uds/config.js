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
  "tileVersion": "uds1",
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
        "median": 0.0009656671900302172,
        "sigma": 0.008890596825163811,
        "originalLow": -0.012370228047715499,
        "originalHigh": 1.1300549507141113,
        "sampleCount": 250514
      },
      "F277W": {
        "median": 0.0009093345724977553,
        "sigma": 0.004238861618796363,
        "originalLow": -0.005448957855696789,
        "originalHigh": 1.3172590732574463,
        "sampleCount": 246715
      },
      "F444W": {
        "median": 0.0008987750625237823,
        "sigma": 0.005313445509038865,
        "originalLow": -0.007071393201034514,
        "originalHigh": 0.9694244265556335,
        "sampleCount": 251071
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
    "path": "catalog/7/{x}/{y}.bin?v=catalog1"
  }
};

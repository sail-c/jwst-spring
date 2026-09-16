window.FITSMAP_CONFIG = {
  "field": "EGS",
  "width": 81600,
  "height": 25200,
  "tileSize": 2048,
  "minZoom": 1,
  "initialZoom": 1,
  "maxNativeZoom": 8,
  "maxZoom": 12,
  "downsampleFactor": 1,
  "pixelScaleArcsec": 0.03,
  "orientation": "north-up, east-left",
  "webpQuality": {
    "RGB_ENHANCED": 45,
    "F150W": 24,
    "F277W": 45,
    "F444W": 32
  },
  "tileVersion": "egs1",
  "webpMethod": 2,
  "center": {
    "ra": 215.00544852446046,
    "dec": 52.93450565917972
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
      59276.5,
      14044.5
    ],
    "crval": [
      214.825,
      52.825
    ],
    "matrix": [
      [
        -5.389915e-06,
        -6.355569e-06
      ],
      [
        -6.355569e-06,
        5.389915e-06
      ]
    ]
  },
  "display": {
    "thresholdSigma": 0.4,
    "shadowGamma": 0.65,
    "statistics": {
      "F150W": {
        "median": 0.0007966075791046023,
        "sigma": 0.005323638418503106,
        "originalLow": -0.007188850048650056,
        "originalHigh": 1.0310136079788208,
        "sampleCount": 100418
      },
      "F277W": {
        "median": 0.0007242095307447016,
        "sigma": 0.002791013680840842,
        "originalLow": -0.0034623109905165617,
        "originalHigh": 0.970423698425293,
        "sampleCount": 103038
      },
      "F444W": {
        "median": 0.0007634770590811968,
        "sigma": 0.003563651786511764,
        "originalLow": -0.004582000620686449,
        "originalHigh": 0.874614417552948,
        "sampleCount": 119060
      }
    }
  },
  "catalog": {
    "recordBytes": 38,
    "sourceCount": 76894,
    "tileCount": 157,
    "spectroscopicSourceCount": 5307,
    "fluxBandCount": 15,
    "minDisplayZoom": 5,
    "ellipseZoom": 8,
    "maxDisplayRadiusNative": 300,
    "path": "catalog/8/{x}/{y}.bin?v=catalog1"
  }
};

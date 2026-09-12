window.GOODSS_CONFIG = {
  "field": "GOODS-S",
  "width": 50100,
  "height": 46900,
  "tileSize": 1024,
  "maxNativeZoom": 7,
  "maxZoom": 11,
  "downsampleFactor": 1,
  "pixelScaleArcsec": 0.03,
  "webpQuality": 82,
  "webpMethod": 1,
  "center": {
    "ra": 53.12604870016444,
    "dec": -27.815505626968775
  },
  "layers": [
    {
      "id": "RGB",
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
  "displayLimits": {
    "F150W": {
      "median": 0.0005604568868875504,
      "sigma": 0.0028884571427945046,
      "low": -0.0037722288273042068,
      "high": 1.1113122701644897,
      "sample_count": 194188
    },
    "F277W": {
      "median": 0.0005240290192887187,
      "sigma": 0.0017136882541934028,
      "low": -0.0020465033620013853,
      "high": 1.1878682374954224,
      "sample_count": 203231
    },
    "F444W": {
      "median": 0.000508295139297843,
      "sigma": 0.0019936672280542553,
      "low": -0.00248220570278354,
      "high": 0.8897275328636169,
      "sample_count": 224062
    }
  }
};

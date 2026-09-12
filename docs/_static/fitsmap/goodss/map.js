(() => {
  "use strict";

  const cfg = window.GOODSS_CONFIG;
  if (!cfg) throw new Error("Missing config.js. Run build_goodss_map.py first.");

  const divisor = 2 ** cfg.maxNativeZoom;
  const crs = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(1 / divisor, 0, -1 / divisor, 0)
  });
  const bounds = L.latLngBounds([[-cfg.height, 0], [0, cfg.width]]);
  const transparentTile = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  const map = L.map("map", {
    crs,
    minZoom: 0,
    maxZoom: cfg.maxZoom,
    zoomControl: true,
    attributionControl: false,
    maxBounds: bounds.pad(0.08),
    maxBoundsViscosity: 0.8
  });

  const layers = {};
  cfg.layers.forEach((layer) => {
    layers[layer.label] = L.tileLayer(`tiles/${layer.id}/{z}/{x}/{y}.webp`, {
      tileSize: cfg.tileSize,
      minZoom: 0,
      maxNativeZoom: cfg.maxNativeZoom,
      maxZoom: cfg.maxZoom,
      noWrap: true,
      bounds,
      errorTileUrl: transparentTile,
      keepBuffer: 3,
      updateWhenIdle: false
    });
  });

  const firstLabel = cfg.layers[0].label;
  layers[firstLabel].addTo(map);
  L.control.layers(layers, null, { collapsed: window.innerWidth < 720, position: "topright" }).addTo(map);
  map.fitBounds(bounds, { animate: false, padding: [8, 8] });

  const layerLabel = document.getElementById("layer-label");
  const coordinateLabel = document.getElementById("coordinate-label");
  const scaleLabel = document.getElementById("scale-label");
  scaleLabel.textContent = `${cfg.pixelScaleArcsec.toFixed(2)}″/pixel at native zoom`;

  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;
  const ra0 = cfg.wcs.crval[0] * rad;
  const dec0 = cfg.wcs.crval[1] * rad;
  const matrix = cfg.wcs.matrix;
  const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  const inverse = [
    [matrix[1][1] / det, -matrix[0][1] / det],
    [-matrix[1][0] / det, matrix[0][0] / det]
  ];

  function pixelToSky(x, y) {
    const fitsX = cfg.downsampleFactor * x + 0.5;
    const fitsY = cfg.downsampleFactor * y + 0.5;
    const dx = fitsX - cfg.wcs.crpix[0];
    const dy = fitsY - cfg.wcs.crpix[1];
    const xi = (matrix[0][0] * dx + matrix[0][1] * dy) * rad;
    const eta = (matrix[1][0] * dx + matrix[1][1] * dy) * rad;
    const denominator = Math.cos(dec0) - eta * Math.sin(dec0);
    let ra = Math.atan2(xi, denominator) + ra0;
    if (ra < 0) ra += 2 * Math.PI;
    if (ra >= 2 * Math.PI) ra -= 2 * Math.PI;
    const dec = Math.atan2(
      Math.sin(dec0) + eta * Math.cos(dec0),
      Math.sqrt(denominator * denominator + xi * xi)
    );
    return { ra: ra * deg, dec: dec * deg };
  }

  function skyToPixel(raDeg, decDeg) {
    const ra = raDeg * rad;
    const dec = decDeg * rad;
    let deltaRa = ra - ra0;
    if (deltaRa > Math.PI) deltaRa -= 2 * Math.PI;
    if (deltaRa < -Math.PI) deltaRa += 2 * Math.PI;
    const cosc = Math.sin(dec0) * Math.sin(dec) + Math.cos(dec0) * Math.cos(dec) * Math.cos(deltaRa);
    if (cosc <= 0) return null;
    const xi = Math.cos(dec) * Math.sin(deltaRa) / cosc * deg;
    const eta = (Math.cos(dec0) * Math.sin(dec) - Math.sin(dec0) * Math.cos(dec) * Math.cos(deltaRa)) / cosc * deg;
    const dx = inverse[0][0] * xi + inverse[0][1] * eta;
    const dy = inverse[1][0] * xi + inverse[1][1] * eta;
    return {
      x: (dx + cfg.wcs.crpix[0] - 0.5) / cfg.downsampleFactor,
      y: (dy + cfg.wcs.crpix[1] - 0.5) / cfg.downsampleFactor
    };
  }

  function updateUrl() {
    const center = map.getCenter();
    const sky = pixelToSky(center.lng, -center.lat);
    const url = new URL(window.location.href);
    url.searchParams.set("ra", sky.ra.toFixed(7));
    url.searchParams.set("dec", sky.dec.toFixed(7));
    url.searchParams.set("zoom", map.getZoom());
    history.replaceState(null, "", url);
  }

  map.on("mousemove", (event) => {
    const x = event.latlng.lng;
    const y = -event.latlng.lat;
    if (x < 0 || y < 0 || x > cfg.width || y > cfg.height) {
      coordinateLabel.textContent = "Outside the GOODS-S image";
      return;
    }
    const sky = pixelToSky(x, y);
    coordinateLabel.textContent = `RA ${sky.ra.toFixed(7)}°   Dec ${sky.dec.toFixed(7)}°`;
  });
  map.on("baselayerchange", (event) => { layerLabel.textContent = event.name; });
  map.on("moveend zoomend", updateUrl);

  document.getElementById("coordinate-search").addEventListener("submit", (event) => {
    event.preventDefault();
    const ra = Number(document.getElementById("ra-input").value);
    const dec = Number(document.getElementById("dec-input").value);
    if (!Number.isFinite(ra) || !Number.isFinite(dec)) return;
    const pixel = skyToPixel(ra, dec);
    if (!pixel || pixel.x < 0 || pixel.y < 0 || pixel.x > cfg.width || pixel.y > cfg.height) {
      coordinateLabel.textContent = "That coordinate is outside the GOODS-S image";
      return;
    }
    map.setView([-pixel.y, pixel.x], Math.max(map.getZoom(), cfg.maxNativeZoom - 2));
  });

  const params = new URLSearchParams(window.location.search);
  if (params.has("ra") && params.has("dec")) {
    const pixel = skyToPixel(Number(params.get("ra")), Number(params.get("dec")));
    const zoom = Math.min(cfg.maxZoom, Math.max(0, Number(params.get("zoom")) || cfg.maxNativeZoom - 2));
    if (pixel && pixel.x >= 0 && pixel.y >= 0 && pixel.x <= cfg.width && pixel.y <= cfg.height) {
      map.setView([-pixel.y, pixel.x], zoom, { animate: false });
    }
  }
})();

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
    minZoom: cfg.minZoom,
    maxZoom: cfg.maxZoom,
    zoomControl: true,
    attributionControl: false,
    maxBounds: bounds.pad(0.08),
    maxBoundsViscosity: 0.8
  });

  const layers = {};
  cfg.layers.forEach((layer) => {
    layers[layer.label] = L.tileLayer(`tiles/${layer.id}/{z}/{x}/{y}.webp?v=northup1`, {
      tileSize: cfg.tileSize,
      minZoom: cfg.minZoom,
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
  const catalogLayer = L.layerGroup();
  L.control.layers(
    layers,
    { "Catalog · positions and source ellipses": catalogLayer },
    { collapsed: window.innerWidth < 720, position: "topright" }
  ).addTo(map);
  map.setView([-cfg.height / 2, cfg.width / 2], cfg.initialZoom, { animate: false });

  const layerLabel = document.getElementById("layer-label");
  const coordinateLabel = document.getElementById("coordinate-label");
  const catalogStatus = document.getElementById("catalog-status");
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
    const fitsY = cfg.height + 0.5 - cfg.downsampleFactor * y;
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
      y: (cfg.height + 0.5 - (dy + cfg.wcs.crpix[1])) / cfg.downsampleFactor
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

  const catalogCanvas = document.createElement("canvas");
  catalogCanvas.className = "catalog-canvas";
  map.getContainer().appendChild(catalogCanvas);
  const catalogContext = catalogCanvas.getContext("2d");
  const catalogCache = new Map();
  let catalogEnabled = false;
  let catalogRenderToken = 0;
  let visibleSources = [];

  function resizeCatalogCanvas() {
    const size = map.getSize();
    const ratio = window.devicePixelRatio || 1;
    catalogCanvas.width = Math.round(size.x * ratio);
    catalogCanvas.height = Math.round(size.y * ratio);
    catalogCanvas.style.width = `${size.x}px`;
    catalogCanvas.style.height = `${size.y}px`;
    catalogContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function clearCatalogCanvas() {
    const size = map.getSize();
    catalogContext.clearRect(0, 0, size.x, size.y);
    visibleSources = [];
  }

  function parseCatalog(buffer) {
    const view = new DataView(buffer);
    const rows = [];
    for (let offset = 0; offset + cfg.catalog.recordBytes <= view.byteLength; offset += cfg.catalog.recordBytes) {
      rows.push({
        id: view.getUint32(offset, true),
        x: view.getFloat32(offset + 4, true),
        y: view.getFloat32(offset + 8, true),
        zbest: view.getFloat32(offset + 12, true),
        major: view.getFloat32(offset + 16, true),
        minor: view.getFloat32(offset + 20, true),
        theta: view.getFloat32(offset + 24, true)
      });
    }
    return rows;
  }

  function loadCatalogTile(x, y) {
    const key = `${x}/${y}`;
    if (!catalogCache.has(key)) {
      const path = cfg.catalog.path.replace("{x}", x).replace("{y}", y);
      catalogCache.set(key, fetch(path).then((response) => {
        if (response.status === 404) return [];
        if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
        return response.arrayBuffer().then(parseCatalog);
      }).catch((error) => {
        console.warn(error);
        return [];
      }));
    }
    return catalogCache.get(key);
  }

  function visibleCatalogTiles() {
    const viewBounds = map.getBounds();
    const x0 = Math.max(0, Math.floor(viewBounds.getWest() / cfg.tileSize));
    const x1 = Math.min(Math.ceil(cfg.width / cfg.tileSize) - 1, Math.floor(viewBounds.getEast() / cfg.tileSize));
    const y0 = Math.max(0, Math.floor(-viewBounds.getNorth() / cfg.tileSize));
    const y1 = Math.min(Math.ceil(cfg.height / cfg.tileSize) - 1, Math.floor(-viewBounds.getSouth() / cfg.tileSize));
    const tiles = [];
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) tiles.push([x, y]);
    }
    return tiles;
  }

  async function renderCatalog() {
    const token = ++catalogRenderToken;
    clearCatalogCanvas();
    if (!catalogEnabled) {
      catalogStatus.textContent = "Catalog hidden";
      return;
    }
    const zoom = map.getZoom();
    if (zoom < cfg.catalog.minDisplayZoom) {
      catalogStatus.textContent = `Catalog appears at zoom ${cfg.catalog.minDisplayZoom}`;
      return;
    }
    catalogStatus.textContent = "Loading catalog…";
    const groups = await Promise.all(visibleCatalogTiles().map(([x, y]) => loadCatalogTile(x, y)));
    if (token !== catalogRenderToken) return;
    const sourceScale = 2 ** (zoom - cfg.maxNativeZoom);
    const drawEllipses = zoom >= cfg.catalog.ellipseZoom;
    const size = map.getSize();
    const sources = [];
    catalogContext.lineWidth = 1.5;
    catalogContext.strokeStyle = "rgba(92, 151, 224, .92)";
    catalogContext.fillStyle = "rgba(92, 151, 224, .78)";
    for (const group of groups) {
      for (const source of group) {
        const point = map.latLngToContainerPoint([-source.y, source.x]);
        if (point.x < -30 || point.y < -30 || point.x > size.x + 30 || point.y > size.y + 30) continue;
        if (drawEllipses) {
          const nativeMajor = Math.min(source.major, cfg.catalog.maxDisplayRadiusNative || 300);
          const nativeMinor = Math.min(Math.max(source.minor, 0.5), nativeMajor);
          const major = Math.max(1.6, nativeMajor * sourceScale);
          const minor = Math.max(1.2, nativeMinor * sourceScale);
          catalogContext.beginPath();
          catalogContext.ellipse(point.x, point.y, major, minor, -source.theta * Math.PI / 180, 0, Math.PI * 2);
          catalogContext.stroke();
          sources.push({ ...source, point, major, minor });
        } else {
          catalogContext.beginPath();
          catalogContext.arc(point.x, point.y, 1.6, 0, Math.PI * 2);
          catalogContext.fill();
          sources.push({ ...source, point, major: 5, minor: 5 });
        }
      }
    }
    visibleSources = sources;
    catalogStatus.textContent = `${sources.length.toLocaleString()} catalog sources in view`;
  }

  map.on("overlayadd", (event) => {
    if (event.layer === catalogLayer) {
      catalogEnabled = true;
      renderCatalog();
    }
  });
  map.on("overlayremove", (event) => {
    if (event.layer === catalogLayer) {
      catalogEnabled = false;
      renderCatalog();
    }
  });
  map.on("moveend zoomend resize", () => {
    resizeCatalogCanvas();
    renderCatalog();
  });
  map.on("click", (event) => {
    if (!catalogEnabled || map.getZoom() < cfg.catalog.minDisplayZoom) return;
    const click = map.latLngToContainerPoint(event.latlng);
    let selected = null;
    let bestDistance = Infinity;
    for (const source of visibleSources) {
      const dx = click.x - source.point.x;
      const dy = click.y - source.point.y;
      const distance = Math.hypot(dx, dy);
      if (distance < Math.max(7, source.major) && distance < bestDistance) {
        selected = source;
        bestDistance = distance;
      }
    }
    if (!selected) return;
    const redshift = Number.isFinite(selected.zbest) && selected.zbest >= 0 ? selected.zbest.toFixed(4) : "—";
    L.popup({ className: "catalog-popup", closeButton: true })
      .setLatLng([-selected.y, selected.x])
      .setContent(`<strong>Source ${selected.id}</strong><br>zbest: ${redshift}`)
      .openOn(map);
  });
  resizeCatalogCanvas();
  renderCatalog();

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
    const zoom = Math.min(cfg.maxZoom, Math.max(cfg.minZoom, Number(params.get("zoom")) || cfg.initialZoom));
    if (pixel && pixel.x >= 0 && pixel.y >= 0 && pixel.x <= cfg.width && pixel.y <= cfg.height) {
      map.setView([-pixel.y, pixel.x], zoom, { animate: false });
    }
  }

  const filterStyle = document.createElement("style");
  document.head.appendChild(filterStyle);
  const brightness = document.getElementById("brightness-control");
  const contrast = document.getElementById("contrast-control");
  const brightnessValue = document.getElementById("brightness-value");
  const contrastValue = document.getElementById("contrast-value");

  function updateDisplayFilters() {
    brightnessValue.textContent = `${brightness.value}%`;
    contrastValue.textContent = `${contrast.value}%`;
    filterStyle.textContent = `.leaflet-tile { filter: brightness(${brightness.value}%) contrast(${contrast.value}%); }`;
  }
  brightness.addEventListener("input", updateDisplayFilters);
  contrast.addEventListener("input", updateDisplayFilters);
  document.getElementById("display-reset").addEventListener("click", () => {
    brightness.value = 100;
    contrast.value = 100;
    updateDisplayFilters();
  });
  updateDisplayFilters();
})();

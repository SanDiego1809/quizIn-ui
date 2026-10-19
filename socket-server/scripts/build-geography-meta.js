/**
 * Build geography-borders.json and geography-difficulty.json from the
 * world countries GeoJSON used by the client map.
 *
 * Usage: node socket-server/scripts/build-geography-meta.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const GEO_PATH = path.join(ROOT, "public/geo/world-countries.geo.json");
const BANK_PATH = path.join(ROOT, "socket-server/data/geography-questions.json");
const BORDERS_OUT = path.join(ROOT, "socket-server/data/geography-borders.json");
const DIFFICULTY_OUT = path.join(
  ROOT,
  "socket-server/data/geography-difficulty.json"
);

const PRECISION = 2;

function countryCodeOf(feature) {
  const raw = feature?.properties?.iso_a2;
  if (!raw || raw === "-99") return null;
  return String(raw).trim().toLowerCase();
}

function ringArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function geometryArea(geometry) {
  if (!geometry) return 0;
  if (geometry.type === "Polygon") {
    return (geometry.coordinates || []).reduce(
      (acc, ring) => acc + ringArea(ring),
      0
    );
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry.coordinates || []).reduce(
      (acc, polygon) =>
        acc + polygon.reduce((inner, ring) => inner + ringArea(ring), 0),
      0
    );
  }
  return 0;
}

function edgeKey(a, b) {
  const ax = a[0].toFixed(PRECISION);
  const ay = a[1].toFixed(PRECISION);
  const bx = b[0].toFixed(PRECISION);
  const by = b[1].toFixed(PRECISION);
  if (ax < bx || (ax === bx && ay <= by)) {
    return `${ax},${ay}|${bx},${by}`;
  }
  return `${bx},${by}|${ax},${ay}`;
}

function walkRing(ring, code, edgeOwners) {
  if (!Array.isArray(ring) || ring.length < 2) return;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const a = ring[i];
    const b = ring[i + 1];
    if (!a || !b) continue;
    const key = edgeKey(a, b);
    let owners = edgeOwners.get(key);
    if (!owners) {
      owners = new Set();
      edgeOwners.set(key, owners);
    }
    owners.add(code);
  }
}

function walkGeometry(geometry, code, edgeOwners) {
  if (!geometry) return;
  if (geometry.type === "Polygon") {
    for (const ring of geometry.coordinates || []) {
      walkRing(ring, code, edgeOwners);
    }
    return;
  }
  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates || []) {
      for (const ring of polygon) {
        walkRing(ring, code, edgeOwners);
      }
    }
  }
}

function main() {
  const geo = JSON.parse(fs.readFileSync(GEO_PATH, "utf8"));
  const bank = JSON.parse(fs.readFileSync(BANK_PATH, "utf8"));
  const bankCodes = new Set(
    bank.map((entry) => String(entry.countryCode || "").toLowerCase())
  );

  const edgeOwners = new Map();
  const areas = {};

  for (const feature of geo.features || []) {
    const code = countryCodeOf(feature);
    if (!code || !bankCodes.has(code)) continue;
    areas[code] = (areas[code] || 0) + geometryArea(feature.geometry);
    walkGeometry(feature.geometry, code, edgeOwners);
  }

  const borders = {};
  for (const code of bankCodes) {
    borders[code] = [];
  }

  for (const owners of edgeOwners.values()) {
    if (owners.size < 2) continue;
    const list = [...owners];
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        if (!borders[a]) borders[a] = [];
        if (!borders[b]) borders[b] = [];
        if (!borders[a].includes(b)) borders[a].push(b);
        if (!borders[b].includes(a)) borders[b].push(a);
      }
    }
  }

  for (const code of Object.keys(borders)) {
    borders[code].sort();
  }

  // Smaller land area → higher weight (harder / less "famous" proxy).
  const areaValues = Object.values(areas).filter((n) => n > 0);
  const minArea = Math.min(...areaValues);
  const maxArea = Math.max(...areaValues);
  const difficulty = {};
  for (const code of bankCodes) {
    const area = areas[code] || minArea;
    const t =
      maxArea === minArea
        ? 0.5
        : (Math.log(area + 1) - Math.log(minArea + 1)) /
          (Math.log(maxArea + 1) - Math.log(minArea + 1));
    // Invert: small countries get weight closer to 1, large closer to 0.15.
    const weight = 0.15 + (1 - t) * 0.85;
    difficulty[code] = Math.round(weight * 1000) / 1000;
  }

  fs.writeFileSync(BORDERS_OUT, `${JSON.stringify(borders, null, 2)}\n`);
  fs.writeFileSync(DIFFICULTY_OUT, `${JSON.stringify(difficulty, null, 2)}\n`);

  const withNeighbors = Object.values(borders).filter((n) => n.length).length;
  console.log(
    `Wrote ${BORDERS_OUT} (${withNeighbors}/${bankCodes.size} with neighbors)`
  );
  console.log(`Wrote ${DIFFICULTY_OUT} (${Object.keys(difficulty).length} weights)`);
}

main();

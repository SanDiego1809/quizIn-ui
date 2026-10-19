"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import useResizeObserver from "@/hooks/useResizeObserver";
import classes from "./WorldMap.module.css";

const GEO_DATA_URL = "/geo/world-countries.geo.json";
const MIN_SCALE = 1;
const MAX_SCALE = 12;
const ZOOM_STEP = 1.35;
const DRAG_THRESHOLD_PX = 4;

// Cached at module scope so every WorldMap instance (and every question in
// a game) reuses the same parsed GeoJSON instead of re-fetching it.
let cachedGeoData = null;
let geoDataPromise = null;

function loadGeoData() {
  if (cachedGeoData) return Promise.resolve(cachedGeoData);
  if (!geoDataPromise) {
    geoDataPromise = fetch(GEO_DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load map (${res.status})`);
        return res.json();
      })
      .then((data) => {
        cachedGeoData = data;
        return data;
      })
      .catch((err) => {
        geoDataPromise = null;
        throw err;
      });
  }
  return geoDataPromise;
}

function countryCodeOf(feature) {
  return (feature?.properties?.iso_a2 || "").toLowerCase();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Keep the map from being panned so far that empty space shows past
 * its edges. With `translate(x,y) scale(s)` over a map that fills
 * [0,width]×[0,height], the viewport stays covered iff:
 *   x ∈ [width*(1-s), 0] and y ∈ [height*(1-s), 0]
 * At s=1 that collapses to (0,0), so no free pan when fully zoomed out.
 */
function clampTransform({ x, y, scale }, mapWidth, mapHeight) {
  const s = clamp(scale, MIN_SCALE, MAX_SCALE);
  const minX = mapWidth * (1 - s);
  const minY = mapHeight * (1 - s);
  return {
    scale: s,
    x: clamp(x, minX, 0),
    y: clamp(y, minY, 0),
  };
}

// Used only to compute the projection's scale/translate via fitSize().
// Calling fitSize() directly on the real dataset is unreliable here:
// Russia's polygon rings touch both -180° and +180° (they aren't cut at
// the antimeridian), which makes d3's bounds calculation think the
// map wraps almost the entire globe — collapsing the visible landmass
// to a tiny sliver in the middle of the SVG. This hand-picked frame
// covers all of the world's landmass in the dataset (~-56° to 84°
// latitude) while staying safely clear of the antimeridian, giving a
// stable, full-size projection. Rendering itself is unaffected: d3's
// (cylindrical) projections clip at the antimeridian by default, so
// Russia still draws correctly split across the map edges.
const WORLD_FRAME = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-179, -58],
        [-179, 84],
        [179, 84],
        [179, -58],
        [-179, -58],
      ],
    ],
  },
};

const INITIAL_TRANSFORM = { x: 0, y: 0, scale: 1 };

/**
 * Interactive world map. Clicking a country reports its lowercase
 * ISO 3166-1 alpha-2 code via `onSelectCountry`. Supports wheel/pinch
 * zoom and drag-to-pan. Adapted from the d3 + React GeoChart pattern
 * (geoPath projecting a world GeoJSON FeatureCollection).
 */
export default function WorldMap({
  onSelectCountry,
  disabled,
  pendingCode,
  silhouette = false,
  highlightCodes = [],
  correctCode = null,
  wrongCode = null,
}) {
  const wrapperRef = useRef(null);
  const dimensions = useResizeObserver(wrapperRef);
  const [geoData, setGeoData] = useState(cachedGeoData);
  const [loadError, setLoadError] = useState(null);
  const [transform, setTransform] = useState(INITIAL_TRANSFORM);
  const [isDragging, setIsDragging] = useState(false);

  const transformRef = useRef(transform);
  const pointersRef = useRef(new Map());
  const dragRef = useRef(null);
  const pinchRef = useRef(null);
  const suppressClickRef = useRef(false);
  const highlightSet = useMemo(
    () => new Set((highlightCodes || []).map((code) => String(code).toLowerCase())),
    [highlightCodes]
  );
  const correctNormalized = correctCode
    ? String(correctCode).toLowerCase()
    : null;
  const wrongNormalized = wrongCode
    ? String(wrongCode).toLowerCase()
    : null;

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    if (geoData) return undefined;
    let cancelled = false;

    loadGeoData()
      .then((data) => {
        if (!cancelled) setGeoData(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load the world map.");
      });

    return () => {
      cancelled = true;
    };
  }, [geoData]);

  const width = dimensions?.width || 960;
  const height = dimensions?.height || 500;
  const sizeRef = useRef({ width, height });
  useEffect(() => {
    sizeRef.current = { width, height };
  }, [width, height]);

  const pathGenerator = useMemo(() => {
    if (!geoData || !width || !height) return null;
    const projection = geoEquirectangular().fitSize([width, height], WORLD_FRAME);
    return geoPath().projection(projection);
  }, [geoData, width, height]);

  function applyTransform(next) {
    const { width: mapWidth, height: mapHeight } = sizeRef.current;
    const clamped = clampTransform(next, mapWidth, mapHeight);
    transformRef.current = clamped;
    setTransform(clamped);
  }

  function zoomAt(clientX, clientY, nextScale) {
    const rect = wrapperRef.current?.getBoundingClientRect();
    const { width: mapWidth, height: mapHeight } = sizeRef.current;
    if (!rect || !mapWidth || !mapHeight) return;

    const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const pointerX = ((clientX - rect.left) / rect.width) * mapWidth;
    const pointerY = ((clientY - rect.top) / rect.height) * mapHeight;
    const prev = transformRef.current;
    const worldX = (pointerX - prev.x) / prev.scale;
    const worldY = (pointerY - prev.y) / prev.scale;
    applyTransform({
      scale,
      x: pointerX - worldX * scale,
      y: pointerY - worldY * scale,
    });
  }

  // Wheel needs a non-passive listener so we can preventDefault and stop
  // the page from scrolling while the user zooms the map.
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return undefined;

    const onWheel = (event) => {
      event.preventDefault();
      const direction = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      zoomAt(event.clientX, event.clientY, transformRef.current.scale * direction);
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  function updatePointers(event) {
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
  }

  function countryCodeFromTarget(target) {
    if (!(target instanceof Element)) return null;
    const path = target.closest("path[data-country-code]");
    return path?.getAttribute("data-country-code") || null;
  }

  function handlePointerDown(event) {
    if (event.button != null && event.button !== 0) return;

    updatePointers(event);

    const pointers = [...pointersRef.current.values()];
    if (pointers.length >= 2) {
      const [a, b] = pointers;
      pinchRef.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale: transformRef.current.scale,
      };
      dragRef.current = null;
      setIsDragging(false);
      suppressClickRef.current = true;
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: transformRef.current.x,
      originY: transformRef.current.y,
      moved: false,
      countryCode: countryCodeFromTarget(event.target),
    };
  }

  function handlePointerMove(event) {
    if (!pointersRef.current.has(event.pointerId)) return;
    updatePointers(event);

    const pointers = [...pointersRef.current.values()];
    if (pointers.length >= 2 && pinchRef.current) {
      const [a, b] = pointers;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const ratio = distance / (pinchRef.current.distance || distance);
      zoomAt(midX, midY, pinchRef.current.scale * ratio);
      suppressClickRef.current = true;
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      drag.moved = true;
      suppressClickRef.current = true;
      setIsDragging(true);
      // Capture only once we know it's a pan, so a simple tap can still
      // select a country (setPointerCapture on pointerdown was eating clicks).
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    if (!drag.moved) return;

    const rect = wrapperRef.current?.getBoundingClientRect();
    const { width: mapWidth, height: mapHeight } = sizeRef.current;
    if (!rect || !mapWidth || !mapHeight) return;

    applyTransform({
      ...transformRef.current,
      x: drag.originX + dx * (mapWidth / rect.width),
      y: drag.originY + dy * (mapHeight / rect.height),
    });
  }

  function handlePointerUp(event) {
    const drag = dragRef.current;
    const wasTap =
      drag &&
      drag.pointerId === event.pointerId &&
      !drag.moved &&
      !suppressClickRef.current;

    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }

    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }

    if (drag?.pointerId === event.pointerId) {
      dragRef.current = null;
      setIsDragging(false);

      if (wasTap) {
        const code =
          countryCodeFromTarget(event.target) || drag.countryCode || null;
        if (!disabled && code) {
          onSelectCountry(code);
        }
      }
    }

    // If one finger remains after a pinch, re-arm drag from that finger.
    if (pointersRef.current.size === 1) {
      const [pointerId, point] = pointersRef.current.entries().next().value;
      dragRef.current = {
        pointerId,
        startX: point.x,
        startY: point.y,
        originX: transformRef.current.x,
        originY: transformRef.current.y,
        moved: false,
        countryCode: null,
      };
    }

    suppressClickRef.current = false;
  }

  function zoomByButton(factor) {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomAt(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      transformRef.current.scale * factor
    );
  }

  function resetZoom() {
    transformRef.current = INITIAL_TRANSFORM;
    setTransform(INITIAL_TRANSFORM);
  }

  const atDefaultZoom =
    transform.scale === 1 && transform.x === 0 && transform.y === 0;

  const wrapperClass = [
    classes.wrapper,
    isDragging ? classes.dragging : "",
    silhouette ? classes.silhouette : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={wrapperRef}
      className={wrapperClass}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {!geoData || !pathGenerator ? (
        <p className={classes.status}>{loadError || "Loading map…"}</p>
      ) : (
        <>
          <svg
            className={classes.svg}
            viewBox={`0 0 ${width} ${height}`}
            role="group"
            aria-label="World map"
          >
            <g
              transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}
            >
              {geoData.features.map((feature, index) => {
                const code = countryCodeOf(feature);
                const isPending =
                  Boolean(pendingCode) &&
                  code === pendingCode &&
                  !correctNormalized;
                const isCorrect = correctNormalized && code === correctNormalized;
                const isWrong =
                  wrongNormalized &&
                  code === wrongNormalized &&
                  !isCorrect;
                const isHeat =
                  !isCorrect &&
                  !isWrong &&
                  code &&
                  highlightSet.has(code);

                return (
                  <path
                    key={feature.properties?.adm0_a3 || `feature-${index}`}
                    data-country-code={code || undefined}
                    d={pathGenerator(feature)}
                    className={[
                      classes.country,
                      isPending ? classes.pending : "",
                      isCorrect ? classes.correct : "",
                      isWrong ? classes.wrong : "",
                      isHeat ? classes.heat : "",
                      disabled ? classes.disabled : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                );
              })}
            </g>
          </svg>

          <div
            className={classes.controls}
            role="group"
            aria-label="Map zoom"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={classes.controlButton}
              onClick={() => zoomByButton(ZOOM_STEP)}
              disabled={transform.scale >= MAX_SCALE}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className={classes.controlButton}
              onClick={() => zoomByButton(1 / ZOOM_STEP)}
              disabled={transform.scale <= MIN_SCALE}
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              className={classes.controlButton}
              onClick={resetZoom}
              disabled={atDefaultZoom}
              aria-label="Reset zoom"
            >
              ⟲
            </button>
          </div>
        </>
      )}
    </div>
  );
}

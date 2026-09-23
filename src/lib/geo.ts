import type { AreaGeometry, Position } from "./types";

function pointInRing(lng: number, lat: number, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** First ring is the outer boundary, the rest are holes. */
export function pointInPolygon(
  lng: number,
  lat: number,
  rings: Position[][],
): boolean {
  if (rings.length === 0 || !pointInRing(lng, lat, rings[0])) return false;
  return !rings.slice(1).some((hole) => pointInRing(lng, lat, hole));
}

export function pointInArea(
  lng: number,
  lat: number,
  geometry: AreaGeometry,
): boolean {
  if (geometry.type === "Polygon") {
    return pointInPolygon(lng, lat, geometry.coordinates);
  }
  return geometry.coordinates.some((poly) => pointInPolygon(lng, lat, poly));
}

/**
 * Accepts a bare geometry or a GeoJSON Feature and returns a geometry,
 * or null when the value is not a usable (multi)polygon.
 */
export function normalizeGeometry(value: unknown): AreaGeometry | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { type?: string; geometry?: unknown; coordinates?: unknown };
  if (v.type === "Feature") return normalizeGeometry(v.geometry);
  if (v.type === "Polygon" && isRings(v.coordinates)) {
    return { type: "Polygon", coordinates: v.coordinates };
  }
  if (
    v.type === "MultiPolygon" &&
    Array.isArray(v.coordinates) &&
    v.coordinates.length > 0 &&
    v.coordinates.every(isRings)
  ) {
    return { type: "MultiPolygon", coordinates: v.coordinates as Position[][][] };
  }
  return null;
}

function isRings(value: unknown): value is Position[][] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (ring) =>
        Array.isArray(ring) &&
        ring.length >= 4 &&
        ring.every(
          (p) =>
            Array.isArray(p) &&
            p.length >= 2 &&
            Number.isFinite(p[0]) &&
            Number.isFinite(p[1]),
        ),
    )
  );
}

/** Builds a closed polygon from [lat, lng] points as drawn on the map. */
export function polygonFromLatLngs(points: [number, number][]): AreaGeometry {
  const ring: Position[] = points.map(([lat, lng]) => [lng, lat]);
  const [first] = ring;
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
  return { type: "Polygon", coordinates: [ring] };
}

/** Outer rings as [lat, lng] arrays, the shape Leaflet expects. */
export function toLatLngRings(geometry: AreaGeometry): [number, number][][] {
  const polys =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polys.map((rings) => rings[0].map(([lng, lat]) => [lat, lng]));
}

/** Outer ring of every polygon in the area, as [lng, lat] positions. */
export function outerRings(geometry: AreaGeometry): Position[][] {
  return geometry.type === "Polygon"
    ? [geometry.coordinates[0]]
    : geometry.coordinates.map((poly) => poly[0]);
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm([lng1, lat1]: Position, [lng2, lat2]: Position): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Circle around the ring's bounding-box center that contains every vertex. */
export function enclosingCircle(ring: Position[]): { center: Position; radiusKm: number } {
  const lngs = ring.map(([lng]) => lng);
  const lats = ring.map(([, lat]) => lat);
  const center: Position = [
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
  const radiusKm = Math.max(...ring.map((p) => distanceKm(center, p)));
  return { center, radiusKm };
}

/** Keeps at most `max` vertices (evenly spaced), dropping the closing duplicate. */
export function sampleRing(ring: Position[], max: number): Position[] {
  const open =
    ring.length > 1 && ring[0][0] === ring.at(-1)![0] && ring[0][1] === ring.at(-1)![1]
      ? ring.slice(0, -1)
      : ring;
  if (open.length <= max) return open;
  const step = open.length / max;
  return Array.from({ length: max }, (_, i) => open[Math.floor(i * step)]);
}

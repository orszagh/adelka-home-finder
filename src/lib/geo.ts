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

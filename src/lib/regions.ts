import { inBox, outerRings, pointInArea } from "./geo";
import { PROVINCES, REGIONS } from "./italy";
import { rememberByPoint } from "./point-cache";
import type { GeoBox, Property } from "./types";

/** Box around each region, so that a house is tested exactly only against the few regions near it. */
const REGION_BOXES = new Map<string, GeoBox>(
  REGIONS.map((r) => {
    const points = outerRings(r.geometry).flat();
    return [
      r.code,
      {
        south: Math.min(...points.map(([, lat]) => lat)),
        north: Math.max(...points.map(([, lat]) => lat)),
        west: Math.min(...points.map(([lng]) => lng)),
        east: Math.max(...points.map(([lng]) => lng)),
      },
    ];
  }),
);

/**
 * Region of a listing: inside its shape, else by the province name the portal gave, else the region
 * with the nearest outline (houses right on the coast can fall just outside the simplified shapes).
 */
export function regionOf(p: Pick<Property, "latitude" | "longitude" | "region">): string | null {
  return regionAt(`${p.latitude},${p.longitude},${p.region}`);
}

const regionAt = rememberByPoint((key) => {
  const [lat, lng, ...name] = key.split(",");
  return findRegion({ latitude: Number(lat), longitude: Number(lng), region: name.join(",") });
});

function findRegion(p: Pick<Property, "latitude" | "longitude" | "region">): string | null {
  const inside = REGIONS.find((r) => inBox(p, REGION_BOXES.get(r.code)!) && pointInArea(p.longitude, p.latitude, r.geometry));
  if (inside) return inside.code;
  const byName = PROVINCES.find((pr) => pr.name.toLowerCase() === p.region.toLowerCase());
  if (byName) return byName.regionCode;
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const r of REGIONS) {
    for (const ring of outerRings(r.geometry)) {
      for (const [lng, lat] of ring) {
        const d = (lat - p.latitude) ** 2 + (lng - p.longitude) ** 2;
        if (d < bestDistance) [best, bestDistance] = [r.code, d];
      }
    }
  }
  return best;
}

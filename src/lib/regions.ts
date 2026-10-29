import { outerRings, pointInArea } from "./geo";
import { PROVINCES, REGIONS } from "./italy";
import type { Property } from "./types";

/**
 * Region of a listing: inside its shape, else by the province name the portal gave, else the region
 * with the nearest outline (houses right on the coast can fall just outside the simplified shapes).
 */
export function regionOf(p: Pick<Property, "latitude" | "longitude" | "region">): string | null {
  const inside = REGIONS.find((r) => pointInArea(p.longitude, p.latitude, r.geometry));
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

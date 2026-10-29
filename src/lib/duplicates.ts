import { distanceKm } from "./geo";
import type { Property } from "./types";

/** Portals place pins roughly (often only the street or the village), so "the same place" is generous. */
export const SAME_PLACE_KM = 0.6;
const PRICE_TOLERANCE = 0.03;
const AREA_TOLERANCE = 0.1;

/** The same house offered on both portals: other portal, nearly the same price, size and rooms, close by. */
export function sameHouse(a: Property, b: Property): boolean {
  if (a.source === b.source || a.price === null || b.price === null) return false;
  if (Math.abs(a.price - b.price) > PRICE_TOLERANCE * Math.max(a.price, b.price)) return false;
  if (a.area_sqm && b.area_sqm && Math.abs(a.area_sqm - b.area_sqm) > AREA_TOLERANCE * Math.max(a.area_sqm, b.area_sqm)) {
    return false;
  }
  if (a.rooms && b.rooms && a.rooms !== b.rooms) return false;
  return distanceKm([a.longitude, a.latitude], [b.longitude, b.latitude]) <= SAME_PLACE_KM;
}

export type Deduped = {
  /** One listing per house, in the original order. */
  listings: Property[];
  /** For a listing shown, the same house on the other portal. */
  twins: Record<string, Property[]>;
};

/**
 * One card per house. Which of the two stays: the one Adelka saved (so her heart and note stay
 * with it), else the cheaper, else the one with more photos.
 */
export function dedupe(properties: Property[], preferIds: ReadonlySet<string> = new Set()): Deduped {
  const byPrice = properties.filter((p) => p.price !== null).sort((a, b) => a.price! - b.price!);
  const paired = new Set<string>();
  const hidden = new Set<string>();
  const twins: Record<string, Property[]> = {};

  for (let i = 0; i < byPrice.length; i++) {
    const a = byPrice[i];
    if (paired.has(a.id)) continue;
    let best: Property | null = null;
    let bestKm = Infinity;
    // Sorted by price: only the next few listings can be within the price tolerance.
    for (let j = i + 1; j < byPrice.length && byPrice[j].price! <= a.price! * (1 + PRICE_TOLERANCE); j++) {
      const b = byPrice[j];
      if (paired.has(b.id) || !sameHouse(a, b)) continue;
      const km = distanceKm([a.longitude, a.latitude], [b.longitude, b.latitude]);
      if (km < bestKm) [best, bestKm] = [b, km];
    }
    if (!best) continue;
    paired.add(a.id).add(best.id);
    const [keep, drop] = keepFirst(a, best, preferIds);
    hidden.add(drop.id);
    twins[keep.id] = [drop];
  }

  return { listings: properties.filter((p) => !hidden.has(p.id)), twins };
}

function keepFirst(a: Property, b: Property, preferIds: ReadonlySet<string>): [Property, Property] {
  if (preferIds.has(a.id) !== preferIds.has(b.id)) return preferIds.has(a.id) ? [a, b] : [b, a];
  if (a.price !== b.price) return a.price! < b.price! ? [a, b] : [b, a];
  return a.photos.length >= b.photos.length ? [a, b] : [b, a];
}

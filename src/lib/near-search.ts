import { circlePolygon } from "./geo";
import type { SearchArea } from "./types";

/** Circles Adelka can choose around herself, in km. */
export const NEAR_RADII = [5, 10, 20, 40, 100];

/** When the circle around Adelka was last searched (app_state). */
export const NEAR_SEARCH_KEY = "near_search_at";
/** "Prehľadať tento okruh" pays Apify each time, so a second tap has to wait a little. */
export const NEAR_SEARCH_COOLDOWN_MS = 10 * 60 * 1000;

export type NearSearch = { latitude: number; longitude: number; radiusKm: number };

/** Roughly Italy with its islands; anything outside is not searched. */
const ITALY = { south: 35, north: 48, west: 6, east: 19 };

export function parseNearSearch(input: unknown): NearSearch | null {
  if (typeof input !== "object" || input === null) return null;
  const { latitude, longitude, radiusKm } = input as Record<string, unknown>;
  if (typeof latitude !== "number" || typeof longitude !== "number" || typeof radiusKm !== "number") return null;
  if (!(latitude >= ITALY.south && latitude <= ITALY.north && longitude >= ITALY.west && longitude <= ITALY.east)) return null;
  if (!NEAR_RADII.includes(radiusKm)) return null;
  return { latitude, longitude, radiusKm };
}

/**
 * The circle as a one-off area for the provider. It matches no region or province, so it is
 * searched whole (Idealista around the centre, Immobiliare in the polygon) and never stored.
 */
export function nearArea({ latitude, longitude, radiusKm }: NearSearch): SearchArea {
  return {
    id: "near",
    name: "Okolie",
    polygon: circlePolygon(longitude, latitude, radiusKm),
    created_at: new Date().toISOString(),
  };
}

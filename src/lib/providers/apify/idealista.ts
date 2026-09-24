import { enclosingCircle } from "../../geo";
import type { Position, ProviderListing } from "../../types";
import { cleanTitle, num, photoList, str } from "./parse";

/** https://apify.com/igolaizola/idealista-scraper */
export const IDEALISTA_ACTOR = "igolaizola~idealista-scraper";

/** The scraper only takes a circle, so the polygon is covered by its enclosing circle. */
export function idealistaInput(ring: Position[], maxItems: number) {
  const { center, radiusKm } = enclosingCircle(ring);
  return idealistaCircleInput(center, radiusKm, maxItems);
}

export function idealistaCircleInput(center: Position, radiusKm: number, maxItems: number) {
  return {
    country: "it",
    operation: "sale",
    propertyType: "homes",
    latitude: center[1],
    longitude: center[0],
    distanceKm: Math.max(1, Math.ceil(radiusKm)),
    sortBy: "mostRecent",
    maxItems,
  };
}

/** Looks up specific listings; ones no longer on offer are simply absent from the output. */
export function idealistaRecheckInput(codes: string[]) {
  return { country: "it", operation: "sale", propertyType: "homes", propertyCodes: codes, maxItems: codes.length };
}

/** Recheck output is `{ propertyCode, _details }`; returns the code and current price. */
export function readIdealistaRecheck(raw: unknown): { code: string; price: number | null } | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as { propertyCode?: unknown; _details?: { price?: unknown; priceInfo?: { amount?: unknown } } };
  const code = str(item.propertyCode);
  if (!code) return null;
  return { code, price: num(item._details?.price) ?? num(item._details?.priceInfo?.amount) };
}

/** WEB_DETAIL-M is 1365 px wide; the default XL variant is ~2700 px. */
function resizeImage(url: string): string {
  return url.replace(/\/blur\/[A-Z_-]+\//, "/blur/WEB_DETAIL-M/");
}

type IdealistaItem = {
  propertyCode?: unknown;
  price?: unknown;
  size?: unknown;
  rooms?: unknown;
  address?: unknown;
  municipality?: unknown;
  province?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  url?: unknown;
  thumbnail?: unknown;
  suggestedTexts?: { title?: unknown };
  multimedia?: { images?: { url?: unknown }[] };
};

export function mapIdealistaItem(raw: unknown): ProviderListing | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as IdealistaItem;
  const code = str(item.propertyCode);
  const latitude = num(item.latitude);
  const longitude = num(item.longitude);
  if (!code || latitude === null || longitude === null) return null;

  const city = str(item.municipality) ?? "Neznáme mesto";
  const images = item.multimedia?.images?.map((i) => str(i.url)) ?? [str(item.thumbnail)];
  return {
    external_id: `idealista-${code}`,
    title: cleanTitle(str(item.suggestedTexts?.title) ?? str(item.address), `Nehnuteľnosť v ${city}`),
    price: num(item.price),
    area_sqm: num(item.size),
    rooms: num(item.rooms),
    city,
    region: str(item.province) ?? "",
    latitude,
    longitude,
    photos: photoList(images).map(resizeImage),
    listing_url: str(item.url) ?? `https://www.idealista.it/immobile/${code}/`,
    source: "idealista",
  };
}

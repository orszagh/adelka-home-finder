import { sampleRing } from "../../geo";
import type { Position, ProviderListing } from "../../types";
import { cleanTitle, num, photoList, str } from "./parse";

/** https://apify.com/memo23/immobiliare-scraper */
export const IMMOBILIARE_ACTOR = "memo23~immobiliare-scraper";

/** Immobiliare's own "draw on map" search limits results to the polygon (`vrt`). */
const MAX_VERTICES = 40;

export function immobiliareSearchUrl(ring: Position[]): string {
  const vrt = sampleRing(ring, MAX_VERTICES)
    .map(([lng, lat]) => `${lat.toFixed(5)},${lng.toFixed(5)}`)
    .join(";");
  // idContratto=1: sale, idCategoria=1: residential
  const params = new URLSearchParams({ idContratto: "1", idCategoria: "1", vrt });
  return `https://www.immobiliare.it/search-list/?${params}`;
}

export function immobiliareInput(ring: Position[], maxItems: number) {
  return { startUrls: [immobiliareSearchUrl(ring)], maxItems, sortBy: "mostRecent" };
}

/** Detail pages return the same item shape as searches; removed listings return nothing. */
export function immobiliareRecheckInput(ids: string[]) {
  return { startUrls: ids.map((id) => `https://www.immobiliare.it/annunci/${id}/`), maxItems: ids.length };
}

type ImmobiliareItem = {
  id?: unknown;
  title?: unknown;
  price?: { raw?: unknown; isHidden?: unknown };
  topology?: {
    typology?: { name?: unknown };
    surface?: { size?: unknown };
    rooms?: unknown;
  };
  geography?: {
    municipality?: { name?: unknown };
    province?: { name?: unknown };
    street?: unknown;
    geolocation?: { latitude?: unknown; longitude?: unknown };
  };
  description?: { caption?: unknown };
  media?: { images?: { hd?: unknown; sd?: unknown }[] };
};

export function mapImmobiliareItem(raw: unknown): ProviderListing | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as ImmobiliareItem;
  const id = str(item.id);
  const geo = item.geography;
  const latitude = num(geo?.geolocation?.latitude);
  const longitude = num(geo?.geolocation?.longitude);
  if (!id || latitude === null || longitude === null) return null;

  const city = str(geo?.municipality?.name) ?? "Neznáme mesto";
  const kind = str(item.topology?.typology?.name) ?? str(item.title) ?? "Nehnuteľnosť";
  const street = str(geo?.street);
  return {
    external_id: `immobiliare-${id}`,
    title: cleanTitle(str(item.description?.caption) ?? (street ? `${kind} in ${street}, ${city}` : null), `${kind} a ${city}`),
    price: item.price?.isHidden === true ? null : num(item.price?.raw),
    area_sqm: num(item.topology?.surface?.size),
    rooms: num(item.topology?.rooms),
    city,
    region: str(geo?.province?.name) ?? "",
    latitude,
    longitude,
    photos: photoList(item.media?.images?.map((i) => str(i.hd) ?? str(i.sd)) ?? []),
    listing_url: `https://www.immobiliare.it/annunci/${id}/`,
    source: "immobiliare",
  };
}

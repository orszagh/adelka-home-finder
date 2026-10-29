import type { Property } from "./types";

/**
 * What the home page knows about every listing: enough for the map, the counts, the filters,
 * the sorting and the circle around Adelka. The card (photo, title, town) is fetched only for
 * the houses on screen.
 */
export type IndexedListing = {
  id: string;
  latitude: number;
  longitude: number;
  price: number | null;
  rooms: number | null;
  sea_km: number | null;
  first_seen_at: string;
  /** ISTAT code of the region, worked out on the server. */
  region_code: string | null;
  /** Appeared in the last few days (the "Nové" badge). */
  is_new: boolean;
};

/**
 * Column by column instead of an object per listing: thousands of listings without repeating
 * the keys. Coordinates rounded to ~10 m, the time to the minute.
 */
export type EncodedIndex = {
  ids: string[];
  lat: number[];
  lng: number[];
  price: (number | null)[];
  rooms: (number | null)[];
  sea: (number | null)[];
  /** Minutes since 1970. */
  added: number[];
  /** Index into `regions`, -1 without a region. */
  region: number[];
  regions: string[];
  /** 1 = new. */
  fresh: (0 | 1)[];
};

const round = (value: number, digits: number) => Math.round(value * 10 ** digits) / 10 ** digits;

export function encodeIndex(
  listings: (Pick<Property, "id" | "latitude" | "longitude" | "price" | "rooms" | "sea_km" | "first_seen_at"> & {
    region_code: string | null;
    is_new: boolean;
  })[],
): EncodedIndex {
  const regions: string[] = [];
  const regionAt = new Map<string, number>();
  const encoded: EncodedIndex = { ids: [], lat: [], lng: [], price: [], rooms: [], sea: [], added: [], region: [], regions, fresh: [] };
  for (const p of listings) {
    encoded.ids.push(p.id);
    encoded.lat.push(round(p.latitude, 4));
    encoded.lng.push(round(p.longitude, 4));
    encoded.price.push(p.price);
    encoded.rooms.push(p.rooms);
    encoded.sea.push(p.sea_km ?? null);
    encoded.added.push(Math.floor(Date.parse(p.first_seen_at) / 60_000));
    encoded.fresh.push(p.is_new ? 1 : 0);
    if (p.region_code === null) encoded.region.push(-1);
    else {
      if (!regionAt.has(p.region_code)) regionAt.set(p.region_code, regions.push(p.region_code) - 1);
      encoded.region.push(regionAt.get(p.region_code)!);
    }
  }
  return encoded;
}

export function decodeIndex(encoded: EncodedIndex): IndexedListing[] {
  return encoded.ids.map((id, i) => ({
    id,
    latitude: encoded.lat[i],
    longitude: encoded.lng[i],
    price: encoded.price[i],
    rooms: encoded.rooms[i],
    sea_km: encoded.sea[i],
    first_seen_at: new Date(encoded.added[i] * 60_000).toISOString(),
    region_code: encoded.region[i] === -1 ? null : encoded.regions[encoded.region[i]],
    is_new: encoded.fresh[i] === 1,
  }));
}

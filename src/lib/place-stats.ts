import { inBox, pointInArea } from "./geo";
import type { Place } from "./italy";
import type { GeoBox, MapListing } from "./types";

/** Houses in a place and the cheapest of them, for the labels and the follow panel. */
export type Stats = { count: number; minPrice: number | null };

/** The box around a place, so that houses far away skip the exact (slow) test. */
const boxes = new Map<string, GeoBox>();

function boxOf(place: Place): GeoBox {
  const key = `${place.kind}:${place.code}`;
  let box = boxes.get(key);
  if (!box) {
    box = { south: Infinity, north: -Infinity, west: Infinity, east: -Infinity };
    const polygons = place.geometry.type === "Polygon" ? [place.geometry.coordinates] : place.geometry.coordinates;
    for (const ring of polygons.flat()) {
      for (const [lng, lat] of ring) {
        box.south = Math.min(box.south, lat);
        box.north = Math.max(box.north, lat);
        box.west = Math.min(box.west, lng);
        box.east = Math.max(box.east, lng);
      }
    }
    boxes.set(key, box);
  }
  return box;
}

export function statsFor(place: Place, properties: MapListing[]): Stats {
  let count = 0;
  let minPrice: number | null = null;
  const box = boxOf(place);
  for (const p of properties) {
    if (!inBox(p, box) || !pointInArea(p.longitude, p.latitude, place.geometry)) continue;
    count++;
    if (p.price !== null && (minPrice === null || p.price < minPrice)) minPrice = p.price;
  }
  return { count, minPrice };
}

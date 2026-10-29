import type { Property } from "./types";

/**
 * A listing as the home page needs it: the card shows only the first photo, so the rest
 * stays on the server (the detail loads the listing again with all of them).
 */
export function toListingSummary(p: Property): Property {
  return { ...p, photos: p.photos.slice(0, 1) };
}

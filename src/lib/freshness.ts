import type { Property } from "./types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Not seen by the daily search for this long: ask the portal directly whether it still exists. */
export const RECHECK_AFTER_MS = 36 * HOUR;
/** Not confirmed for this long: treat as sold or withdrawn and hide it. */
export const STALE_AFTER_MS = 4 * DAY;
/** Stop spending re-checks on listings that have been gone this long. */
export const GIVE_UP_AFTER_MS = 10 * DAY;

export function ageMs(property: Pick<Property, "last_seen_at">, now = Date.now()): number {
  return now - Date.parse(property.last_seen_at);
}

export function isStale(property: Pick<Property, "last_seen_at">, now = Date.now()): boolean {
  return ageMs(property, now) > STALE_AFTER_MS;
}

/** Listings worth re-checking today, the ones closest to being hidden first. */
export function recheckCandidates(properties: Property[], seenNow: Set<string>, now = Date.now()): Property[] {
  return properties
    .filter((p) => {
      const age = ageMs(p, now);
      return !seenNow.has(p.external_id) && age >= RECHECK_AFTER_MS && age < GIVE_UP_AFTER_MS;
    })
    .sort((a, b) => a.last_seen_at.localeCompare(b.last_seen_at));
}

/** A price drop worth pointing out: known previous price, lower now, changed recently. */
export function recentPriceDrop(property: Property, since: number): number | null {
  const { previous_price: previous, price, price_changed_at: changedAt } = property;
  if (previous == null || price == null || !changedAt || price >= previous) return null;
  return Date.parse(changedAt) > since ? previous : null;
}

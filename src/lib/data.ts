import "server-only";
import { getRepo } from "./db/repo";
import { isStale, recentPriceDrop } from "./freshness";
import { getProvider } from "./providers";
import { syncFromProvider } from "./sync";
import type { Property } from "./types";

/**
 * Listings for the UI, only from the active provider (leftover demo data
 * disappears the moment a real provider is switched on). Demo data is
 * generated on first use; real listings arrive through area creation and
 * the daily cron, never during a page render.
 */
export async function getProperties(): Promise<Property[]> {
  const repo = getRepo();
  const provider = getProvider();
  const properties = (await repo.listProperties()).filter((p) => provider.ownsExternalId(p.external_id));
  if (!provider.isMock) return properties.filter((p) => !isStale(p));
  if (properties.length > 0) return properties;
  await syncFromProvider(repo, provider, []);
  return repo.listProperties();
}

/** Remembered price before a recent drop, per listing id (for the "zlacnené" badge). */
export function findPriceDrops(properties: Property[], now = Date.now()): Record<string, number> {
  const since = now - PRICE_DROP_BADGE_MS;
  const drops: Record<string, number> = {};
  for (const p of properties) {
    const previous = recentPriceDrop(p, since);
    if (previous !== null) drops[p.id] = previous;
  }
  return drops;
}

const PRICE_DROP_BADGE_MS = 14 * 24 * 60 * 60 * 1000;

const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const FIRST_IMPORT_GRACE_MS = 60 * 60 * 1000;

/**
 * Listings that appeared in the last few days. Everything from the very
 * first import is excluded, since none of it is new to Adelka.
 */
export function findNewIds(properties: Property[], now = Date.now()): string[] {
  if (properties.length === 0) return [];
  const firstImport = Math.min(...properties.map((p) => Date.parse(p.first_seen_at)));
  return properties
    .filter((p) => {
      const seen = Date.parse(p.first_seen_at);
      return seen - firstImport > FIRST_IMPORT_GRACE_MS && now - seen < NEW_WINDOW_MS;
    })
    .map((p) => p.id);
}

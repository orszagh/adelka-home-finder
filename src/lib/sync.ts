import { distanceToSeaKm } from "./coast";
import type { Repository } from "./db/repo";
import { recheckCandidates } from "./freshness";
import type { PropertyProvider } from "./providers";
import { withinBand } from "./search-settings";
import type { PriceChange, Property, ProviderListing, SearchArea, SyncResult } from "./types";

export type ListingDiff = {
  newIds: Set<string>;
  previousPrices: Map<string, number | null>;
};

/** Which incoming listings are new, and which existing ones changed price. */
export function diffListings(
  existing: Pick<Property, "external_id" | "price">[],
  incoming: ProviderListing[],
): ListingDiff {
  const known = new Map(existing.map((p) => [p.external_id, p.price]));
  const newIds = new Set<string>();
  const previousPrices = new Map<string, number | null>();
  for (const listing of incoming) {
    if (!known.has(listing.external_id)) {
      newIds.add(listing.external_id);
      continue;
    }
    const before = known.get(listing.external_id) ?? null;
    if (before !== listing.price) previousPrices.set(listing.external_id, before);
  }
  return { newIds, previousPrices };
}

const nearSea = (bandKm: number | null) => (l: Pick<ProviderListing, "longitude" | "latitude">) =>
  withinBand(bandKm === null ? null : distanceToSeaKm(l.longitude, l.latitude), bandKm);

/**
 * Pulls listings for the given areas and stores them. Listings left over
 * from a different provider (e.g. the demo data) are removed, and the first
 * import from a provider is flagged so it is not reported as news.
 * With `bandKm`, only listings that close to the sea are kept; older ones
 * further away are not re-checked either (they are hidden, not deleted).
 */
export async function syncFromProvider(
  repo: Repository,
  provider: PropertyProvider,
  areas: SearchArea[],
  options: { recheck?: boolean; bandKm?: number | null } = {},
): Promise<SyncResult> {
  const bandKm = options.bandKm ?? null;
  const inBand = nearSea(bandKm);
  const fetched = await provider.fetchListings(areas, { bandKm });
  const listings = fetched.listings.filter(inBand);
  const errors = [...fetched.errors];

  const stored = await repo.listProperties();
  const foreign = stored.filter((p) => !provider.ownsExternalId(p.external_id));
  if (foreign.length > 0) await repo.deleteProperties(foreign.map((p) => p.id));
  const existing = stored.filter((p) => provider.ownsExternalId(p.external_id));

  const rechecked: ProviderListing[] = [];
  let checked = 0;
  if (options.recheck && provider.recheck) {
    const candidates = recheckCandidates(existing.filter(inBand), new Set(listings.map((l) => l.external_id)));
    if (candidates.length > 0) {
      checked = candidates.length;
      try {
        const result = await provider.recheck(candidates);
        rechecked.push(...result.listings);
        errors.push(...result.errors);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
  }

  const incoming = dedupe([...listings, ...rechecked]);
  const { newIds, previousPrices } = diffListings(existing, incoming);
  const saved = await repo.upsertProperties(incoming);

  const inserted: Property[] = [];
  const priceChanged: PriceChange[] = [];
  for (const property of saved) {
    if (newIds.has(property.external_id)) inserted.push(property);
    else if (previousPrices.has(property.external_id)) {
      priceChanged.push({
        property,
        previousPrice: previousPrices.get(property.external_id) ?? null,
      });
    }
  }
  if (priceChanged.length > 0) {
    await repo.recordPriceChanges(
      priceChanged.map((c) => ({ id: c.property.id, previousPrice: c.previousPrice })),
    );
  }

  return {
    total: saved.length,
    initialImport: existing.length === 0,
    inserted,
    priceChanged,
    removed: foreign.length,
    rechecked: checked > 0 ? { checked, alive: rechecked.length } : undefined,
    errors,
  };
}

function dedupe(listings: ProviderListing[]): ProviderListing[] {
  return [...new Map(listings.map((l) => [l.external_id, l])).values()];
}

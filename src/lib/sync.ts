import type { Repository } from "./db/repo";
import type { PropertyProvider } from "./providers";
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

/**
 * Pulls listings for the given areas and stores them. Listings left over
 * from a different provider (e.g. the demo data) are removed, and the first
 * import from a provider is flagged so it is not reported as news.
 */
export async function syncFromProvider(
  repo: Repository,
  provider: PropertyProvider,
  areas: SearchArea[],
): Promise<SyncResult> {
  const { listings, errors } = await provider.fetchListings(areas);
  const incoming = dedupe(listings);

  const stored = await repo.listProperties();
  const foreign = stored.filter((p) => !provider.ownsExternalId(p.external_id));
  if (foreign.length > 0) await repo.deleteProperties(foreign.map((p) => p.id));
  const existing = stored.filter((p) => provider.ownsExternalId(p.external_id));

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
  return {
    total: saved.length,
    initialImport: existing.length === 0,
    inserted,
    priceChanged,
    removed: foreign.length,
    errors,
  };
}

function dedupe(listings: ProviderListing[]): ProviderListing[] {
  return [...new Map(listings.map((l) => [l.external_id, l])).values()];
}

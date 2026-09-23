import type { Repository } from "./db/repo";
import type { PropertyProvider } from "./providers";
import type { PriceChange, Property, ProviderListing, SyncResult } from "./types";

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

export async function syncFromProvider(
  repo: Repository,
  provider: PropertyProvider,
): Promise<SyncResult> {
  const incoming = dedupe(await provider.fetchListings());
  const { newIds, previousPrices } = diffListings(await repo.listProperties(), incoming);
  const stored = await repo.upsertProperties(incoming);

  const inserted: Property[] = [];
  const priceChanged: PriceChange[] = [];
  for (const property of stored) {
    if (newIds.has(property.external_id)) inserted.push(property);
    else if (previousPrices.has(property.external_id)) {
      priceChanged.push({
        property,
        previousPrice: previousPrices.get(property.external_id) ?? null,
      });
    }
  }
  return { total: stored.length, inserted, priceChanged };
}

function dedupe(listings: ProviderListing[]): ProviderListing[] {
  return [...new Map(listings.map((l) => [l.external_id, l])).values()];
}

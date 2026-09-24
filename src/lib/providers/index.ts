import type { Property, ProviderListing, SearchArea } from "../types";
import { apifyProvider } from "./apify";
import { mockProvider } from "./mock";

export type FetchResult = {
  listings: ProviderListing[];
  /** Partial failures (e.g. one portal down); the rest of the listings are still usable. */
  errors: string[];
};

/**
 * Source of real-estate listings. Another data source plugs in by
 * implementing this interface and registering it in `PROVIDERS`;
 * the rest of the app does not change.
 */
export interface PropertyProvider {
  id: string;
  label: string;
  isMock: boolean;
  /** Whether a stored listing came from this provider (by its external_id). */
  ownsExternalId(externalId: string): boolean;
  /** Listings within (or around) Adelka's search areas. */
  fetchListings(areas: SearchArea[], options?: FetchOptions): Promise<FetchResult>;
  /**
   * Asks the source directly about listings the regular search no longer
   * returned. Returns current data for those still on offer; missing ones are gone.
   */
  recheck?(listings: Property[]): Promise<FetchResult>;
}

export type FetchOptions = {
  /** Search only this far from the coast (km); null or missing means the whole area. */
  bandKm?: number | null;
};

const PROVIDERS: Record<string, PropertyProvider> = {
  [mockProvider.id]: mockProvider,
  [apifyProvider.id]: apifyProvider,
};

export function getProvider(): PropertyProvider {
  const id = process.env.PROPERTY_PROVIDER ?? mockProvider.id;
  const provider = PROVIDERS[id];
  if (!provider) {
    throw new Error(
      `Unknown PROPERTY_PROVIDER "${id}". Known: ${Object.keys(PROVIDERS).join(", ")}`,
    );
  }
  return provider;
}

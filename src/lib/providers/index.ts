import type { ProviderListing } from "../types";
import { mockProvider } from "./mock";

/**
 * Source of real-estate listings. A commercial API (RealtyAPI, PropAPIS,
 * Apify, ...) plugs in by implementing this interface and registering it
 * in `PROVIDERS`; the rest of the app does not change.
 */
export interface PropertyProvider {
  id: string;
  label: string;
  isMock: boolean;
  fetchListings(): Promise<ProviderListing[]>;
}

const PROVIDERS: Record<string, PropertyProvider> = {
  [mockProvider.id]: mockProvider,
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

import { describe, expect, it } from "vitest";
import { MemoryRepository } from "./db/memory-repo";
import type { PropertyProvider } from "./providers";
import { buildMockListings } from "./providers/mock";
import { diffListings, syncFromProvider } from "./sync";
import type { ProviderListing } from "./types";

function providerOf(listings: ProviderListing[]): PropertyProvider {
  return { id: "test", label: "test", isMock: true, fetchListings: async () => listings };
}

describe("diffListings", () => {
  it("separates new listings from price changes", () => {
    const [a, b, c] = buildMockListings();
    const diff = diffListings(
      [
        { external_id: a.external_id, price: a.price },
        { external_id: b.external_id, price: 1 },
      ],
      [a, b, c],
    );
    expect([...diff.newIds]).toEqual([c.external_id]);
    expect(diff.previousPrices.get(b.external_id)).toBe(1);
    expect(diff.previousPrices.has(a.external_id)).toBe(false);
  });
});

describe("syncFromProvider", () => {
  it("inserts everything on first run, then reports only changes", async () => {
    const repo = new MemoryRepository();
    const listings = buildMockListings();

    const first = await syncFromProvider(repo, providerOf(listings));
    expect(first.inserted).toHaveLength(listings.length);
    expect(first.priceChanged).toHaveLength(0);

    const [firstStored] = await repo.listProperties();
    const cheaper = listings.map((l) =>
      l.external_id === firstStored.external_id ? { ...l, price: (l.price ?? 0) - 5000 } : l,
    );
    const extra: ProviderListing = { ...listings[0], external_id: "new-1", title: "Nuovo" };

    const second = await syncFromProvider(repo, providerOf([...cheaper, extra]));
    expect(second.inserted.map((p) => p.external_id)).toEqual(["new-1"]);
    expect(second.priceChanged).toHaveLength(1);
    expect(second.priceChanged[0].previousPrice).toBe(firstStored.price);
    expect(second.total).toBe(listings.length + 1);

    const updated = await repo.getProperty(firstStored.id);
    expect(updated?.first_seen_at).toBe(firstStored.first_seen_at);
    expect(updated?.price).toBe((firstStored.price ?? 0) - 5000);
  });

  it("produces a stable mock data set along the coast", () => {
    const a = buildMockListings();
    expect(a).toEqual(buildMockListings());
    expect(a.length).toBe(36);
    expect(new Set(a.map((l) => l.region))).toEqual(new Set(["Liguria", "Toscana", "Puglia"]));
  });
});

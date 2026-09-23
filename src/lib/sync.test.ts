import { describe, expect, it } from "vitest";
import { MemoryRepository } from "./db/memory-repo";
import type { PropertyProvider } from "./providers";
import { buildMockListings, mockProvider } from "./providers/mock";
import { diffListings, syncFromProvider } from "./sync";
import type { ProviderListing } from "./types";

function providerOf(listings: ProviderListing[], prefix = "mock-"): PropertyProvider {
  return {
    id: "test",
    label: "test",
    isMock: false,
    ownsExternalId: (id) => id.startsWith(prefix),
    fetchListings: async () => ({ listings, errors: [] }),
  };
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

    const first = await syncFromProvider(repo, providerOf(listings), []);
    expect(first.inserted).toHaveLength(listings.length);
    expect(first.priceChanged).toHaveLength(0);
    expect(first.initialImport).toBe(true);

    const [firstStored] = await repo.listProperties();
    const cheaper = listings.map((l) =>
      l.external_id === firstStored.external_id ? { ...l, price: (l.price ?? 0) - 5000 } : l,
    );
    const extra: ProviderListing = { ...listings[0], external_id: "mock-new-1", title: "Nuovo" };

    const second = await syncFromProvider(repo, providerOf([...cheaper, extra]), []);
    expect(second.initialImport).toBe(false);
    expect(second.inserted.map((p) => p.external_id)).toEqual(["mock-new-1"]);
    expect(second.priceChanged).toHaveLength(1);
    expect(second.priceChanged[0].previousPrice).toBe(firstStored.price);
    expect(second.total).toBe(listings.length + 1);
    expect(second.removed).toBe(0);

    const updated = await repo.getProperty(firstStored.id);
    expect(updated?.first_seen_at).toBe(firstStored.first_seen_at);
    expect(updated?.price).toBe((firstStored.price ?? 0) - 5000);
  });

  it("replaces demo data quietly when a real provider takes over", async () => {
    const repo = new MemoryRepository();
    await syncFromProvider(repo, mockProvider, []);
    const [demo] = await repo.listProperties();
    await repo.saveListing(demo.id, "demo poznámka");

    const real: ProviderListing = { ...buildMockListings()[0], external_id: "idealista-1", source: "idealista" };
    const result = await syncFromProvider(repo, providerOf([real], "idealista-"), []);

    expect(result.removed).toBe(36);
    expect(result.initialImport).toBe(true);
    expect((await repo.listProperties()).map((p) => p.external_id)).toEqual(["idealista-1"]);
    expect(await repo.listSaved()).toEqual([]);
  });

  it("passes provider errors through", async () => {
    const provider: PropertyProvider = {
      ...providerOf([]),
      fetchListings: async () => ({ listings: [], errors: ["Immobiliare – Sanremo: 502"] }),
    };
    expect((await syncFromProvider(new MemoryRepository(), provider, [])).errors).toEqual(["Immobiliare – Sanremo: 502"]);
  });

  it("produces a stable mock data set along the coast", () => {
    const a = buildMockListings();
    expect(a).toEqual(buildMockListings());
    expect(a.length).toBe(36);
    expect(new Set(a.map((l) => l.region))).toEqual(new Set(["Liguria", "Toscana", "Puglia"]));
  });
});

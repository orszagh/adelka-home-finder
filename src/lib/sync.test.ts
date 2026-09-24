import { describe, expect, it, vi } from "vitest";
import { MemoryRepository } from "./db/memory-repo";
import type { PropertyProvider } from "./providers";
import { buildMockListings, mockProvider } from "./providers/mock";
import { diffListings, syncFromProvider } from "./sync";
import type { Property, ProviderListing } from "./types";

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

  it("re-checks listings the search stopped returning and remembers price drops", async () => {
    const repo = new MemoryRepository();
    const [a, b, c] = buildMockListings();
    await syncFromProvider(repo, providerOf([a, b, c]), []);
    // Pretend the last search saw them three days ago.
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    for (const p of await repo.listProperties()) p.last_seen_at = threeDaysAgo;

    const recheck = vi.fn(async (listings: Property[]) => ({
      // b is still on offer, now cheaper; c is gone.
      listings: listings.filter((p) => p.external_id === b.external_id).map((p) => ({ ...p, price: 100_000 })),
      errors: [],
    }));
    const provider: PropertyProvider = { ...providerOf([a]), recheck };

    const result = await syncFromProvider(repo, provider, [], { recheck: true });
    expect(recheck.mock.calls[0][0].map((p) => p.external_id).sort()).toEqual([b.external_id, c.external_id].sort());
    expect(result.rechecked).toEqual({ checked: 2, alive: 1 });
    expect(result.priceChanged.map((ch) => ch.property.external_id)).toEqual([b.external_id]);

    const byExternal = new Map((await repo.listProperties()).map((p) => [p.external_id, p]));
    expect(byExternal.get(b.external_id)).toMatchObject({ price: 100_000, previous_price: b.price });
    expect(Date.parse(byExternal.get(b.external_id)!.last_seen_at)).toBeGreaterThan(Date.parse(threeDaysAgo));
    expect(byExternal.get(c.external_id)!.last_seen_at).toBe(threeDaysAgo);
  });

  it("does not re-check without the option or when a recheck fails", async () => {
    const repo = new MemoryRepository();
    const [a] = buildMockListings();
    await syncFromProvider(repo, providerOf([a]), []);
    for (const p of await repo.listProperties()) p.last_seen_at = new Date(Date.now() - 3 * 86_400_000).toISOString();

    const recheck = vi.fn(async (): Promise<never> => {
      throw new Error("Apify down");
    });
    const provider: PropertyProvider = { ...providerOf([]), recheck };
    expect((await syncFromProvider(repo, provider, [])).rechecked).toBeUndefined();
    expect(recheck).not.toHaveBeenCalled();
    expect((await syncFromProvider(repo, provider, [], { recheck: true })).errors).toEqual(["Apify down"]);
  });

  it("keeps only listings near the sea and does not re-check older ones inland", async () => {
    const repo = new MemoryRepository();
    const [coast] = buildMockListings(); // Sanremo
    const inland: ProviderListing = { ...coast, external_id: "mock-inland", city: "Caltanissetta", latitude: 37.49, longitude: 14.062 };

    // Stored earlier with the whole area, then not seen for three days.
    await syncFromProvider(repo, providerOf([coast, inland]), []);
    expect(await repo.listProperties()).toHaveLength(2);
    for (const p of await repo.listProperties()) p.last_seen_at = new Date(Date.now() - 3 * 86_400_000).toISOString();

    const fetchListings = vi.fn(async () => ({ listings: [coast, { ...inland, external_id: "mock-inland-2" }], errors: [] }));
    const recheck = vi.fn(async () => ({ listings: [], errors: [] }));
    const provider: PropertyProvider = { ...providerOf([]), fetchListings, recheck };
    const result = await syncFromProvider(repo, provider, [], { recheck: true, bandKm: 3 });

    expect(fetchListings).toHaveBeenCalledWith([], { bandKm: 3 });
    expect(result.inserted).toHaveLength(0);
    expect((await repo.listProperties()).map((p) => p.external_id)).not.toContain("mock-inland-2");
    // The old inland listing is neither re-checked nor deleted.
    expect(recheck).not.toHaveBeenCalled();
    expect((await repo.listProperties()).map((p) => p.external_id)).toContain("mock-inland");
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

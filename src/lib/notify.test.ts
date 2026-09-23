import { describe, expect, it } from "vitest";
import { polygonFromLatLngs } from "./geo";
import { buildDigest } from "./notify";
import type { Property, SearchArea, SyncResult } from "./types";

function property(overrides: Partial<Property>): Property {
  return {
    id: "p1",
    external_id: "e1",
    title: "Casa",
    price: 200_000,
    area_sqm: 90,
    rooms: 3,
    city: "Alassio",
    region: "Liguria",
    latitude: 44.0,
    longitude: 8.17,
    photos: ["/mock-photo/x.svg"],
    listing_url: null,
    source: "immobiliare",
    first_seen_at: "2026-09-23T00:00:00Z",
    last_seen_at: "2026-09-23T00:00:00Z",
    ...overrides,
  };
}

const liguria: SearchArea = {
  id: "a1",
  name: "Ligúria",
  created_at: "2026-09-23T00:00:00Z",
  polygon: polygonFromLatLngs([
    [43.7, 7.45],
    [44.5, 7.45],
    [44.5, 10.1],
    [43.7, 10.1],
  ]),
};

const inside = property({ id: "in", title: "Villetta <b>" });
const outside = property({ id: "out", latitude: 40.1, longitude: 18.4, city: "Otranto", region: "Puglia" });

describe("buildDigest", () => {
  it("returns null when nothing changed", () => {
    expect(buildDigest({ total: 5, initialImport: false, inserted: [], priceChanged: [] }, [liguria], "https://x")).toBeNull();
  });

  it("keeps only listings inside Adelka's areas", () => {
    const result: SyncResult = {
      total: 2,
      initialImport: false,
      inserted: [inside, outside],
      priceChanged: [{ property: property({ id: "drop", price: 180_000 }), previousPrice: 200_000 }],
    };
    const digest = buildDigest(result, [liguria], "https://app.test")!;
    expect(digest.count).toBe(2);
    expect(digest.subject).toBe("Domček pri mori: 1 nový inzerát, 1 zmena ceny");
    expect(digest.html).toContain("https://app.test/inzerat/in");
    expect(digest.html).not.toContain("/inzerat/out");
    expect(digest.html).toContain("▼ lacnejšie");
    expect(digest.html).toContain("https://app.test/mock-photo/x.svg");
    expect(digest.text).toMatch(/200\s000\s€ → 180\s000\s€/);
  });

  it("reports everything when no areas are defined", () => {
    const digest = buildDigest({ total: 2, initialImport: false, inserted: [inside, outside], priceChanged: [] }, [], "https://x")!;
    expect(digest.count).toBe(2);
    expect(digest.subject).toContain("2 nové inzeráty");
  });

  it("stays quiet about the very first import", () => {
    expect(buildDigest({ total: 1, initialImport: true, inserted: [inside], priceChanged: [] }, [], "https://x")).toBeNull();
  });

  it("escapes listing text in HTML", () => {
    const digest = buildDigest({ total: 1, initialImport: false, inserted: [inside], priceChanged: [] }, [], "https://x")!;
    expect(digest.html).toContain("Villetta &lt;b&gt;");
    expect(digest.html).not.toContain("Villetta <b>");
  });
});

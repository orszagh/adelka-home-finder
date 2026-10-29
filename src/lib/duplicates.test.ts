import { describe, expect, it } from "vitest";
import { dedupe, sameHouse } from "./duplicates";
import type { Property } from "./types";

const house = (id: string, over: Partial<Property>): Property => ({
  id,
  external_id: id,
  title: "Casa",
  price: 250_000,
  area_sqm: 120,
  rooms: 4,
  city: "Sanremo",
  region: "Imperia",
  latitude: 43.8159,
  longitude: 7.7761,
  photos: ["a"],
  listing_url: null,
  source: "idealista",
  first_seen_at: "2026-10-01T00:00:00Z",
  last_seen_at: "2026-10-29T00:00:00Z",
  ...over,
});

describe("same house on both portals", () => {
  it("matches close listings with nearly the same price and size on different portals", () => {
    const a = house("a", {});
    const b = house("b", { source: "immobiliare", price: 255_000, area_sqm: 125, latitude: 43.818 });
    expect(sameHouse(a, b)).toBe(true);
  });

  it("does not match the same portal, another price, other rooms or another village", () => {
    const a = house("a", {});
    expect(sameHouse(a, house("b", {}))).toBe(false);
    expect(sameHouse(a, house("b", { source: "immobiliare", price: 290_000 }))).toBe(false);
    expect(sameHouse(a, house("b", { source: "immobiliare", rooms: 2 }))).toBe(false);
    expect(sameHouse(a, house("b", { source: "immobiliare", latitude: 43.85 }))).toBe(false);
  });

  it("keeps one card per house: the saved one, else the cheaper", () => {
    const a = house("a", { price: 250_000 });
    const b = house("b", { source: "immobiliare", price: 249_000 });
    const c = house("c", { price: 400_000, latitude: 44.1 });

    const cheaper = dedupe([a, b, c]);
    expect(cheaper.listings.map((p) => p.id)).toEqual(["b", "c"]);
    expect(cheaper.twins.b.map((p) => p.id)).toEqual(["a"]);

    const saved = dedupe([a, b, c], new Set(["a"]));
    expect(saved.listings.map((p) => p.id)).toEqual(["a", "c"]);
    expect(saved.twins.a.map((p) => p.id)).toEqual(["b"]);
  });
});

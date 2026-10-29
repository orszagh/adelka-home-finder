import { describe, expect, it } from "vitest";
import { toListingSummary } from "./listing-summary";
import type { Property } from "./types";

const property: Property = {
  id: "p1",
  external_id: "x",
  title: "Casa",
  price: 185000,
  area_sqm: 70,
  rooms: 3,
  city: "Diano Marina",
  region: "Liguria",
  latitude: 43.9,
  longitude: 8.08,
  photos: Array.from({ length: 20 }, (_, i) => `https://img.test/${i}.jpg`),
  listing_url: null,
  source: "idealista",
  first_seen_at: "2026-10-01T00:00:00Z",
  last_seen_at: "2026-10-29T00:00:00Z",
  sea_km: 0.4,
};

describe("toListingSummary", () => {
  it("keeps only the first photo and everything else", () => {
    const summary = toListingSummary(property);
    expect(summary.photos).toEqual(["https://img.test/0.jpg"]);
    expect({ ...summary, photos: property.photos }).toEqual(property);
  });

  it("leaves a listing without photos as it is", () => {
    expect(toListingSummary({ ...property, photos: [] }).photos).toEqual([]);
  });
});

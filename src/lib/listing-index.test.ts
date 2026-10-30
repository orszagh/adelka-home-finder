import { describe, expect, it } from "vitest";
import { decodeIndex, encodeIndex } from "./listing-index";

const listings = [
  { id: "a", latitude: 43.912345, longitude: 8.081234, price: 185000, rooms: 3, sea_km: 0.4, first_seen_at: "2026-10-01T08:15:00.000Z", region_code: "07", is_new: true, in_band: true },
  { id: "b", latitude: 37.5, longitude: 15.09, price: null, rooms: null, sea_km: null, first_seen_at: "2026-10-29T19:53:16.593Z", region_code: null, is_new: false, in_band: true },
  { id: "c", latitude: 44.1, longitude: 9.8, price: 99000, rooms: 1, sea_km: 9.1, first_seen_at: "2026-10-02T00:00:00.000Z", region_code: "07", is_new: false, in_band: false },
];

describe("listing index", () => {
  it("decodes what it encoded (coordinates to ~10 m, time to the minute)", () => {
    expect(decodeIndex(encodeIndex(listings))).toEqual([
      { ...listings[0], latitude: 43.9123, longitude: 8.0812 },
      { ...listings[1], first_seen_at: "2026-10-29T19:53:00.000Z" },
      listings[2],
    ]);
  });

  it("lists only the houses further from the sea than the setting", () => {
    expect(encodeIndex(listings).out).toEqual([2]);
    expect(encodeIndex(listings.slice(0, 2)).out).toEqual([]);
  });

  it("keeps each region code once", () => {
    expect(encodeIndex(listings).regions).toEqual(["07"]);
  });

  it("keeps the order, so newest first stays newest first", () => {
    expect(decodeIndex(encodeIndex(listings)).map((l) => l.id)).toEqual(["a", "b", "c"]);
  });
});

import { describe, expect, it } from "vitest";
import { coastLinesForArea } from "./coast";
import { nearArea, parseNearSearch } from "./near-search";

describe("parseNearSearch", () => {
  it("accepts a spot in Italy with one of the circles", () => {
    expect(parseNearSearch({ latitude: 44.13, longitude: 9.99, radiusKm: 20 })).toEqual({
      latitude: 44.13,
      longitude: 9.99,
      radiusKm: 20,
    });
  });

  it("rejects anything else", () => {
    expect(parseNearSearch(null)).toBeNull();
    expect(parseNearSearch({ latitude: 48.15, longitude: 17.11, radiusKm: 10 })).toBeNull(); // Bratislava
    expect(parseNearSearch({ latitude: 44.13, longitude: 9.99, radiusKm: 15 })).toBeNull();
    expect(parseNearSearch({ latitude: 44.13, longitude: 9.99, radiusKm: 500 })).toBeNull();
    expect(parseNearSearch({ latitude: "44", longitude: 9.99, radiusKm: 10 })).toBeNull();
  });
});

describe("nearArea", () => {
  it("is a circle that matches no place, so the provider searches it whole", () => {
    const area = nearArea({ latitude: 44.13, longitude: 9.99, radiusKm: 10 });
    expect(area.polygon.type).toBe("Polygon");
    expect(coastLinesForArea(area)).toBeNull();
  });
});

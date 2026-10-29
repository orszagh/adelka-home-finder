import { describe, expect, it } from "vitest";
import { regionOf } from "./regions";

describe("regionOf", () => {
  it("finds the region of a house inside it", () => {
    expect(regionOf({ latitude: 43.9, longitude: 8.08, region: "" })).toBe("07"); // Diano Marina, Liguria
    expect(regionOf({ latitude: 40.85, longitude: 14.27, region: "" })).toBe("15"); // Napoli, Kampánia
  });

  it("falls back to the province name, then to the nearest region", () => {
    expect(regionOf({ latitude: 0, longitude: 0, region: "Imperia" })).toBe("07");
    expect(regionOf({ latitude: 43.79, longitude: 7.4, region: "" })).toBe("07"); // just off the coast by Ventimiglia
  });
});

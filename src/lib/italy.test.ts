import { describe, expect, it } from "vitest";
import { pointInArea } from "./geo";
import { PROVINCES, REGIONS, areaNameFor, findPlace, provincesOf } from "./italy";

describe("Italian regions and provinces", () => {
  it("covers all 20 regions and 110 provinces (ISTAT 2026)", () => {
    expect(REGIONS).toHaveLength(20);
    expect(PROVINCES).toHaveLength(110);
    expect(new Set(PROVINCES.map((p) => p.code)).size).toBe(110);
    for (const region of REGIONS) expect(provincesOf(region.code).length).toBeGreaterThan(0);
  });

  it("marks coastal provinces consistently with their regions", () => {
    for (const region of REGIONS) {
      const coastalProvinces = provincesOf(region.code).filter((p) => p.coastal);
      expect(coastalProvinces.length > 0, region.name).toBe(region.coastal);
    }
    expect(provincesOf("07").every((p) => p.coastal)).toBe(true); // Liguria
    expect(findPlace("province", "FI")?.coastal).toBe(false); // Firenze
    expect(findPlace("province", "LU")?.coastal).toBe(true); // Lucca (Viareggio)
    expect(findPlace("province", "EN")?.coastal).toBe(false); // Enna
    expect(PROVINCES.filter((p) => p.coastal)).toHaveLength(62);
  });

  it("uses Slovak region names and short province names", () => {
    expect(findPlace("region", "07")?.name).toBe("Ligúria");
    expect(findPlace("region", "16")?.name).toBe("Apúlia");
    expect(findPlace("province", "BZ")?.name).toBe("Bolzano");
    expect(findPlace("province", "AO")?.name).toBe("Valle d'Aosta");
  });

  it("places every label inside its shape", () => {
    for (const place of [...REGIONS, ...PROVINCES]) {
      const [lat, lng] = place.label;
      expect(pointInArea(lng, lat, place.geometry), place.name).toBe(true);
    }
  });

  it("puts real towns in the right province", () => {
    const sanremo = { lat: 43.8159, lng: 7.7761 };
    const containing = PROVINCES.filter((p) => pointInArea(sanremo.lng, sanremo.lat, p.geometry));
    expect(containing.map((p) => p.code)).toEqual(["IM"]);
  });

  it("names areas so they can be matched back to places", () => {
    expect(areaNameFor(findPlace("province", "IM")!)).toBe("Imperia");
    expect(areaNameFor(findPlace("region", "07")!)).toBe("Ligúria (celý región)");
  });
});

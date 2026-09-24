import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEARCH_SETTINGS,
  bandKm,
  formatSearchSettings,
  getSearchSettings,
  parseSearchSettings,
  withinBand,
} from "./search-settings";

describe("search settings", () => {
  it("defaults to the coast only", async () => {
    expect(parseSearchSettings(null)).toEqual(DEFAULT_SEARCH_SETTINGS);
    expect(bandKm(DEFAULT_SEARCH_SETTINGS)).toBe(3);
    expect(formatSearchSettings(DEFAULT_SEARCH_SETTINGS)).toBe("Len pri mori · 3 km");
    // No app_state table yet: the repository returns null.
    expect(await getSearchSettings({ getState: async () => null })).toEqual(DEFAULT_SEARCH_SETTINGS);
  });

  it("reads stored settings back and drops invalid values", async () => {
    const stored = { inland: true, inlandKm: 40 };
    expect(await getSearchSettings({ getState: async <T,>() => stored as T })).toEqual(stored);
    expect(bandKm(parseSearchSettings({ inland: true, inlandKm: null }))).toBeNull();
    expect(parseSearchSettings({ inland: true, inlandKm: 7 })).toEqual({ inland: true, inlandKm: 20 });
    expect(parseSearchSettings({ inland: "yes", inlandKm: 10 })).toEqual({ inland: false, inlandKm: 10 });
    expect(formatSearchSettings({ inland: true, inlandKm: null })).toBe("Celá oblasť");
    expect(formatSearchSettings({ inland: true, inlandKm: 10 })).toBe("Do 10 km od mora");
  });

  it("keeps listings within the band, with a little tolerance", () => {
    expect(withinBand(3.4, 3)).toBe(true);
    expect(withinBand(3.6, 3)).toBe(false);
    expect(withinBand(80, null)).toBe(true);
    expect(withinBand(undefined, 3)).toBe(true);
  });
});

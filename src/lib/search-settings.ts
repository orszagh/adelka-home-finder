/** Where to look for houses: along the coast only, or further inland too. */
export type SearchSettings = {
  inland: boolean;
  /** How far inland; null means the whole region or province. */
  inlandKm: InlandKm | null;
};

export const INLAND_OPTIONS = [10, 20, 40] as const;
export type InlandKm = (typeof INLAND_OPTIONS)[number];

/** "By the sea": within walking or cycling distance of it. */
export const COAST_BAND_KM = 3;

export const SEARCH_SETTINGS_KEY = "search_settings";

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = { inland: false, inlandKm: 20 };

/** Accepts whatever is stored (or sent from a form) and falls back to the defaults. */
export function parseSearchSettings(value: unknown): SearchSettings {
  if (!value || typeof value !== "object") return DEFAULT_SEARCH_SETTINGS;
  const v = value as { inland?: unknown; inlandKm?: unknown };
  const inlandKm =
    v.inlandKm === null
      ? null
      : INLAND_OPTIONS.find((km) => km === v.inlandKm) ?? DEFAULT_SEARCH_SETTINGS.inlandKm;
  return { inland: v.inland === true, inlandKm };
}

/** How far from the coast to search, in km; null means the whole area. */
export function bandKm(settings: SearchSettings): number | null {
  return settings.inland ? settings.inlandKm : COAST_BAND_KM;
}

/** Listings a little beyond the band still count (coastline and coordinates are approximate). */
export const BAND_TOLERANCE_KM = 0.5;

export function withinBand(seaKm: number | null | undefined, band: number | null): boolean {
  return band === null || seaKm == null || seaKm <= band + BAND_TOLERANCE_KM;
}

export function formatSearchSettings(settings: SearchSettings): string {
  if (!settings.inland) return `Len pri mori · ${COAST_BAND_KM} km`;
  return settings.inlandKm === null ? "Celá oblasť" : `Do ${settings.inlandKm} km od mora`;
}

export async function getSearchSettings(repo: { getState<T>(key: string): Promise<T | null> }): Promise<SearchSettings> {
  return parseSearchSettings(await repo.getState(SEARCH_SETTINGS_KEY));
}

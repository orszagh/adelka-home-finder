import provincesData from "@/data/italy-provinces.json";
import regionsData from "@/data/italy-regions.json";
import type { AreaGeometry } from "./types";

/** Boundaries: ISTAT (1 Jan 2026) via openpolis/geojson-italy, CC BY 4.0. Rebuilt by `npm run geo:build`. */
export const ITALY_ATTRIBUTION =
  'Hranice: <a href="https://www.istat.it/">ISTAT</a> / <a href="https://github.com/openpolis/geojson-italy">openpolis</a>, CC BY 4.0';

export type PlaceKind = "region" | "province";

export type Place = {
  kind: PlaceKind;
  code: string;
  /** Slovak name for regions, Italian for provinces. */
  name: string;
  regionCode: string;
  coastal: boolean;
  label: [lat: number, lng: number];
  geometry: AreaGeometry;
};

const REGION_NAMES_SK: Record<string, string> = {
  "01": "Piemont",
  "02": "Údolie Aosty",
  "03": "Lombardia",
  "04": "Trentino-Horná Adiža",
  "05": "Benátsko",
  "06": "Friulsko-Julské Benátsko",
  "07": "Ligúria",
  "08": "Emília-Romagna",
  "09": "Toskánsko",
  "10": "Umbria",
  "11": "Marche",
  "12": "Lazio",
  "13": "Abruzzo",
  "14": "Molise",
  "15": "Kampánia",
  "16": "Apúlia",
  "17": "Bazilikáta",
  "18": "Kalábria",
  "19": "Sicília",
  "20": "Sardínia",
};

type RawProps = {
  code: string;
  name: string;
  coastal: boolean;
  labelLat: number;
  labelLng: number;
  regionCode?: string;
};
type RawCollection = { features: { properties: RawProps; geometry: AreaGeometry }[] };

export const REGIONS: Place[] = (regionsData as unknown as RawCollection).features
  .map(({ properties: p, geometry }) => ({
    kind: "region" as const,
    code: p.code,
    name: REGION_NAMES_SK[p.code] ?? p.name,
    regionCode: p.code,
    coastal: p.coastal,
    label: [p.labelLat, p.labelLng] as [number, number],
    geometry,
  }))
  .sort((a, b) => a.code.localeCompare(b.code));

export const PROVINCES: Place[] = (provincesData as unknown as RawCollection).features.map(
  ({ properties: p, geometry }) => ({
    kind: "province" as const,
    code: p.code,
    name: p.name.split("/")[0],
    regionCode: p.regionCode!,
    coastal: p.coastal,
    label: [p.labelLat, p.labelLng] as [number, number],
    geometry,
  }),
);

export function findPlace(kind: PlaceKind, code: string): Place | undefined {
  return (kind === "region" ? REGIONS : PROVINCES).find((p) => p.code === code);
}

export function provincesOf(regionCode: string): Place[] {
  return PROVINCES.filter((p) => p.regionCode === regionCode);
}

/**
 * Name of the search area created from a place. Areas are matched back to
 * places by this name, so it must stay stable.
 */
export function areaNameFor(place: Place): string {
  return place.kind === "region" ? `${place.name} (celý región)` : place.name;
}

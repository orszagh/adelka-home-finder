import { polygonFromLatLngs } from "./geo";
import type { AreaGeometry } from "./types";

export type RegionPreset = { id: string; name: string; polygon: AreaGeometry };

/** Rough outlines of the coastal regions Adelka is interested in. */
export const REGION_PRESETS: RegionPreset[] = [
  {
    id: "liguria",
    name: "Ligúria",
    polygon: polygonFromLatLngs([
      [43.7, 7.45],
      [44.5, 7.45],
      [44.5, 10.1],
      [43.7, 10.1],
    ]),
  },
  {
    id: "toscana",
    name: "Toskánske pobrežie",
    polygon: polygonFromLatLngs([
      [42.35, 10.15],
      [44.0, 10.15],
      [44.0, 11.35],
      [42.35, 11.35],
    ]),
  },
  {
    id: "puglia",
    name: "Apúlia",
    polygon: polygonFromLatLngs([
      [39.75, 15.9],
      [42.0, 15.9],
      [42.0, 18.6],
      [39.75, 18.6],
    ]),
  },
];

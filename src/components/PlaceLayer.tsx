"use client";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Marker, Polygon, useMap } from "react-leaflet";
import { formatPriceShort } from "@/lib/format";
import { inBox, pointInArea } from "@/lib/geo";
import { type Place, REGIONS, areaNameFor, provincesOf } from "@/lib/italy";
import type { AreaGeometry, GeoBox, MapListing } from "@/lib/types";
import { ICONS, iconHtml } from "./ui";

export type PlaceChooser = {
  /** null = all of Italy (pick a region), otherwise the region whose provinces are shown. */
  regionCode: string | null;
  /** Names of Adelka's current areas; places are matched to areas by name. */
  areaNames: string[];
  properties: MapListing[];
  busy: boolean;
  onPick: (place: Place) => void;
};

/** Pastel fill per coastal region (ISTAT code), in the spirit of a travel poster. */
export const REGION_COLORS: Record<string, string> = {
  "05": "#a5d8ff",
  "06": "#b2f2bb",
  "07": "#74c0fc",
  "08": "#ffd8a8",
  "09": "#ffe066",
  "11": "#c0eb75",
  "12": "#ffa8a8",
  "13": "#91a7ff",
  "14": "#d0bfff",
  "15": "#ffd43b",
  "16": "#e599f7",
  "17": "#96f2d7",
  "18": "#99e9f2",
  "19": "#ffc078",
  "20": "#8ce99a",
};
export const INLAND = "#dee2e6";

type Stats = { count: number; minPrice: number | null };

export function latLngs(geometry: AreaGeometry): L.LatLngExpression[][][] {
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polys.map((rings) => rings.map((ring) => ring.map(([lng, lat]) => [lat, lng] as L.LatLngTuple)));
}

export function boundsOf(places: Place[]): L.LatLngBounds {
  return L.latLngBounds(places.flatMap((p) => latLngs(p.geometry).flat(2) as L.LatLngTuple[]));
}

/** The box around a place, so that houses far away skip the exact (slow) test. */
const boxes = new Map<string, GeoBox>();

function boxOf(place: Place): GeoBox {
  const key = `${place.kind}:${place.code}`;
  let box = boxes.get(key);
  if (!box) {
    box = { south: Infinity, north: -Infinity, west: Infinity, east: -Infinity };
    for (const ring of latLngs(place.geometry).flat() as [number, number][][]) {
      for (const [lat, lng] of ring) {
        box.south = Math.min(box.south, lat);
        box.north = Math.max(box.north, lat);
        box.west = Math.min(box.west, lng);
        box.east = Math.max(box.east, lng);
      }
    }
    boxes.set(key, box);
  }
  return box;
}

function statsFor(place: Place, properties: MapListing[]): Stats {
  let count = 0;
  let minPrice: number | null = null;
  const box = boxOf(place);
  for (const p of properties) {
    if (!inBox(p, box) || !pointInArea(p.longitude, p.latitude, place.geometry)) continue;
    count++;
    if (p.price !== null && (minPrice === null || p.price < minPrice)) minPrice = p.price;
  }
  return { count, minPrice };
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function plural(n: number, one: string, few: string, many: string): string {
  return `${n} ${n === 1 ? one : n < 5 ? few : many}`;
}

/** `partial`: how many of a region's provinces Adelka follows. */
function labelIcon(place: Place, stats: Stats, followed: boolean, partial: number): L.DivIcon {
  const selected = followed || partial > 0;
  const detail = [
    partial > 0 ? plural(partial, "provincia", "provincie", "provincií") : null,
    stats.count > 0
      ? `${plural(stats.count, "ponuka", "ponuky", "ponúk")}${
          stats.minPrice !== null ? ` od ${formatPriceShort(stats.minPrice)}` : ""
        }`
      : null,
    place.coastal ? null : "vnútrozemie",
  ]
    .filter(Boolean)
    .join(" · ");
  const classes = ["place-label", `is-${place.kind}`, selected ? "is-selected" : "", place.coastal ? "" : "is-inland"].join(" ");
  return L.divIcon({
    className: "place-label-icon",
    html: `<span class="${classes}"><b>${selected ? `${iconHtml(ICONS.check, 12)} ` : ""}${escapeHtml(place.name)}</b>${
      detail ? `<small>${escapeHtml(detail)}</small>` : ""
    }</span>`,
    iconSize: [0, 0],
  });
}

export function PlaceLayer({ regionCode, areaNames, properties, busy, onPick }: PlaceChooser) {
  const map = useMap();
  const places = useMemo(() => (regionCode ? provincesOf(regionCode) : REGIONS), [regionCode]);
  const names = useMemo(() => new Set(areaNames), [areaNames]);
  const stats = useMemo(() => new Map(places.map((p) => [p.code, statsFor(p, properties)])), [places, properties]);

  useEffect(() => {
    // Extra top padding keeps shapes clear of the chooser panel floating over the map.
    const fit = () => map.fitBounds(boundsOf(places), { paddingTopLeft: [16, 130], paddingBottomRight: [16, 16] });
    const { x, y } = map.getSize();
    if (x > 0 && y > 0) fit();
    // The container settles its final size after the first paint (and on phone/desktop switches).
    map.on("resize", fit);
    return () => {
      map.off("resize", fit);
    };
  }, [map, places]);

  const isSelected = (place: Place) => names.has(areaNameFor(place));
  const selectedProvinces = (region: Place) => provincesOf(region.code).filter(isSelected).length;

  return (
    <>
      {regionCode &&
        REGIONS.filter((r) => r.code !== regionCode).map((r) => (
          <Polygon
            key={`ctx-${r.code}`}
            positions={latLngs(r.geometry)}
            interactive={false}
            pathOptions={{ className: "place-context", weight: 1, fillOpacity: 0.25 }}
          />
        ))}
      {places.map((place) => {
        const selected = isSelected(place) || (place.kind === "region" && selectedProvinces(place) > 0);
        const fill = place.coastal ? (REGION_COLORS[place.regionCode] ?? INLAND) : INLAND;
        return (
          <Polygon
            key={`${place.kind}-${place.code}-${selected}`}
            positions={latLngs(place.geometry)}
            pathOptions={{
              // Outline (and the selected fill) come from CSS (.place-shape) so they follow the theme.
              className: selected ? "place-shape is-selected" : "place-shape",
              weight: selected ? 2.5 : 1.5,
              fillColor: fill,
              fillOpacity: selected ? 0.45 : place.coastal ? 0.75 : 0.5,
            }}
            eventHandlers={{ click: () => !busy && onPick(place) }}
          />
        );
      })}
      {places
        // On the Italy overview the grey inland regions stay unlabeled to keep the map readable.
        .filter((place) => place.coastal || place.kind === "province")
        .map((place) => (
        <Marker
          key={`label-${place.kind}-${place.code}`}
          position={place.label}
          icon={labelIcon(
            place,
            stats.get(place.code) ?? { count: 0, minPrice: null },
            isSelected(place),
            place.kind === "region" ? selectedProvinces(place) : 0,
          )}
          eventHandlers={{ click: () => !busy && onPick(place) }}
        />
      ))}
    </>
  );
}

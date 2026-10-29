"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { formatPriceShort, homesLabel } from "@/lib/format";
import { ITALY_ATTRIBUTION, type Place, REGIONS, findPlace, provincesOf } from "@/lib/italy";
import type { Property } from "@/lib/types";
import { INLAND, type PlaceChooser, PlaceLayer, REGION_COLORS, boundsOf, latLngs } from "./PlaceLayer";

/**
 * What the map shows: all of Italy with its coloured regions, one region
 * zoomed in with the houses in it, or the provinces of a region to pick
 * which ones to follow.
 */
export type MapMode =
  | { kind: "overview" }
  | { kind: "region"; code: string }
  | { kind: "pick"; chooser: PlaceChooser };

type Props = {
  mode: MapMode;
  /** Houses shown as pins (region mode). */
  properties: Property[];
  /** Houses per region code, for the labels on the overview. */
  regionCounts: Map<string, number>;
  /** Region codes where Adelka follows the region or some of its provinces. */
  followedRegions: Set<string>;
  /** Province codes Adelka follows (outlined in region mode). */
  followedProvinces: Set<string>;
  savedIds: string[];
  selectedId: string | null;
  onRegion: (code: string) => void;
  onSelect: (id: string) => void;
  /** A tap on the map outside a pin. */
  onBackground: () => void;
  /** Room kept free for the cards floating over the map, in px. */
  insets: { top: number; bottom: number };
};

/** Below this zoom level price labels overlap, so markers shrink to dots. */
const LABEL_MIN_ZOOM = 8.5;

export default function MapView(props: Props) {
  const { mode, properties, savedIds, selectedId } = props;
  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  const [zoom, setZoom] = useState(6);
  // Open straight on the region (or Italy) instead of Italy first and then zooming in: coming
  // back to the map, the phone would load two sets of tiles and show the half-loaded zoom.
  const [initial] = useState(() => ({
    bounds: boundsOf(mode.kind === "region" ? [findPlace("region", mode.code)!] : REGIONS),
    options: {
      paddingTopLeft: [16, props.insets.top] as L.PointTuple,
      paddingBottomRight: [16, props.insets.bottom] as L.PointTuple,
    },
  }));

  return (
    <MapContainer
      bounds={initial.bounds}
      boundsOptions={initial.options}
      // Quarter steps let Italy (and each region) fill the map instead of snapping a level too far out.
      zoomSnap={0.25}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | ${ITALY_ATTRIBUTION}`}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {mode.kind === "overview" && <OverviewLayer {...props} />}
      {mode.kind === "region" && <RegionLayer {...props} code={mode.code} />}
      {mode.kind === "pick" && <PlaceLayer {...mode.chooser} />}

      {mode.kind === "region" &&
        properties.map((p) => (
          <PriceMarker
            key={p.id}
            property={p}
            selected={p.id === selectedId}
            saved={saved.has(p.id)}
            compact={zoom < LABEL_MIN_ZOOM}
            onSelect={props.onSelect}
          />
        ))}

      <MapEvents onZoom={setZoom} onBackground={props.onBackground} />
      <ViewController {...props} />
    </MapContainer>
  );
}

function fillOf(place: Place): string {
  return place.coastal ? (REGION_COLORS[place.regionCode] ?? INLAND) : INLAND;
}

/** All of Italy: tap a region to see its houses. Labels only where there is something to see. */
function OverviewLayer({ regionCounts, followedRegions, onRegion }: Props) {
  return (
    <>
      {REGIONS.map((r) => (
        <Polygon
          key={`ov-${r.code}`}
          positions={latLngs(r.geometry)}
          pathOptions={{ className: "place-shape", weight: 1.5, fillColor: fillOf(r), fillOpacity: r.coastal ? 0.72 : 0.45 }}
          eventHandlers={{ click: () => onRegion(r.code) }}
          bubblingMouseEvents={false}
        />
      ))}
      {REGIONS.filter((r) => (regionCounts.get(r.code) ?? 0) > 0 || followedRegions.has(r.code)).map((r) => {
        const count = regionCounts.get(r.code) ?? 0;
        return (
          <Marker
            key={`lbl-${r.code}`}
            position={r.label}
            icon={regionLabel(r.name, count > 0 ? homesLabel(count) : "sledované, zatiaľ nič")}
            eventHandlers={{ click: () => onRegion(r.code) }}
          />
        );
      })}
    </>
  );
}

/** One region zoomed in; the others stay tappable around it. Followed provinces are tinted. */
function RegionLayer({ code, followedProvinces, onRegion }: Props & { code: string }) {
  const provinces = useMemo(() => provincesOf(code), [code]);
  return (
    <>
      {REGIONS.filter((r) => r.code !== code).map((r) => (
        <Polygon
          key={`ctx-${r.code}`}
          positions={latLngs(r.geometry)}
          pathOptions={{ className: "place-context", weight: 1, fillOpacity: 0.3 }}
          eventHandlers={{ click: () => onRegion(r.code) }}
          bubblingMouseEvents={false}
        />
      ))}
      {provinces.map((p) => {
        const followed = followedProvinces.has(p.code);
        return (
          <Polygon
            key={`prov-${p.code}-${followed}`}
            positions={latLngs(p.geometry)}
            interactive={false}
            pathOptions={{
              className: followed ? "place-shape is-selected" : "province-line",
              weight: followed ? 1.5 : 1,
              fillOpacity: followed ? 0.1 : 0,
              dashArray: followed ? undefined : "3 4",
            }}
          />
        );
      })}
      <Polygon
        key={`focus-${code}`}
        positions={latLngs(findPlace("region", code)!.geometry)}
        interactive={false}
        pathOptions={{ className: "region-focus", weight: 3, fillOpacity: 0.03 }}
      />
    </>
  );
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function regionLabel(name: string, detail: string): L.DivIcon {
  return L.divIcon({
    className: "place-label-icon",
    html: `<span class="place-label is-region-count"><b>${escapeHtml(name)}</b><small>${escapeHtml(detail)}</small></span>`,
    iconSize: [0, 0],
  });
}

function PriceMarker({
  property,
  selected,
  saved,
  compact,
  onSelect,
}: {
  property: Property;
  selected: boolean;
  saved: boolean;
  compact: boolean;
  onSelect: (id: string) => void;
}) {
  const dot = compact && !selected;
  const icon = useMemo(
    () =>
      L.divIcon({
        className: `price-marker${selected ? " is-selected" : ""}${saved ? " is-saved" : ""}${dot ? " is-dot" : ""}`,
        html: `<span>${dot ? "" : formatPriceShort(property.price)}</span>`,
        iconSize: [0, 0],
      }),
    [property.price, selected, saved, dot],
  );
  return (
    <Marker
      position={[property.latitude, property.longitude]}
      icon={icon}
      zIndexOffset={selected ? 1000 : 0}
      title={property.title}
      eventHandlers={{ click: () => onSelect(property.id) }}
    />
  );
}

function MapEvents({ onZoom, onBackground }: { onZoom: (zoom: number) => void; onBackground: () => void }) {
  const map = useMapEvents({
    zoomend() {
      onZoom(map.getZoom());
    },
    click() {
      onBackground();
    },
  });
  // The map opens already zoomed in, without a zoomend.
  useEffect(() => {
    onZoom(map.getZoom());
  }, [map, onZoom]);
  return null;
}

/** Flies to Italy or to the chosen region; keeps the selected pin in view. */
function ViewController({ mode, properties, selectedId, insets }: Props) {
  const map = useMap();
  const key = mode.kind === "region" ? `region:${mode.code}` : mode.kind;
  const lastKey = useRef<string | null>(null);

  const fit = useEffectEvent(() => {
    // The province picker positions the map itself.
    if (mode.kind === "pick" || lastKey.current === key) return;
    const { x, y } = map.getSize();
    // fitBounds on a container that has not been laid out yet yields a bogus view.
    if (x === 0 || y === 0) return;
    const first = lastKey.current === null;
    lastKey.current = key;
    const bounds = mode.kind === "region" ? boundsOf([findPlace("region", mode.code)!]) : boundsOf(REGIONS);
    const options = { paddingTopLeft: [16, insets.top] as L.PointTuple, paddingBottomRight: [16, insets.bottom] as L.PointTuple };
    if (first) map.fitBounds(bounds, options);
    else map.flyToBounds(bounds, { ...options, duration: 0.7 });
  });

  useEffect(() => {
    fit();
  }, [key]);

  useEffect(() => {
    const selected = properties.find((p) => p.id === selectedId);
    if (!selected) return;
    const target = L.latLng(selected.latitude, selected.longitude);
    if (!map.getBounds().pad(-0.15).contains(target)) map.panTo(target);
  }, [map, properties, selectedId]);

  useEffect(() => {
    // The container settles its final size after the first paint (and on phone/desktop switches).
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      fit();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}

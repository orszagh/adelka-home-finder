"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { formatPriceShort } from "@/lib/format";
import { toLatLngRings } from "@/lib/geo";
import { ITALY_ATTRIBUTION } from "@/lib/italy";
import type { Property, SearchArea } from "@/lib/types";
import { type PlaceChooser, PlaceLayer } from "./PlaceLayer";

export type LatLng = [number, number];

type Props = {
  properties: Property[];
  areas: SearchArea[];
  activeAreaIds: string[];
  savedIds: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** When set, the map shows clickable regions/provinces instead of listings. */
  chooser: PlaceChooser | null;
};

const ITALY_CENTER: LatLng = [42.5, 12.5];

/** Below this zoom level price labels overlap, so markers shrink to dots. */
const LABEL_MIN_ZOOM = 9;

export default function MapView(props: Props) {
  const { properties, areas, activeAreaIds, savedIds, selectedId, chooser } = props;
  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  const [zoom, setZoom] = useState(6);

  return (
    <MapContainer
      center={ITALY_CENTER}
      zoom={6}
      // Quarter steps let Italy (and each region) fill the map instead of snapping a level too far out.
      zoomSnap={0.25}
      className="h-full w-full"
    >
      <TileLayer
        attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | ${ITALY_ATTRIBUTION}`}
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {chooser && <PlaceLayer {...chooser} />}

      {!chooser && areas.map((area) => {
        const active = activeAreaIds.includes(area.id);
        return (
          <Polygon
            // Leaflet sets className only once, so a change of state needs a new layer.
            key={`${area.id}-${active}`}
            positions={toLatLngRings(area.polygon)}
            interactive={false}
            pathOptions={{
              // Colours come from CSS (.area-shape) so they follow the theme.
              className: active ? "area-shape is-active" : "area-shape",
              weight: active ? 2 : 1,
              fillOpacity: active ? 0.08 : 0.02,
              dashArray: active ? undefined : "4 4",
            }}
          />
        );
      })}

      {!chooser && properties.map((p) => (
        <PriceMarker
          key={p.id}
          property={p}
          selected={p.id === selectedId}
          saved={saved.has(p.id)}
          compact={zoom < LABEL_MIN_ZOOM}
          onSelect={props.onSelect}
        />
      ))}

      <ZoomWatcher onZoom={setZoom} />
      <ViewController {...props} />
    </MapContainer>
  );
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

function ZoomWatcher({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend() {
      onZoom(map.getZoom());
    },
  });
  return null;
}

/** Keeps the viewport on what matters: active areas, visible listings, the selection. */
function ViewController({ properties, areas, activeAreaIds, selectedId, chooser }: Props) {
  const map = useMap();
  const areaKey = activeAreaIds.join(",");
  const lastFitKey = useRef<string | null>(null);
  // Closing the place chooser changes the key, so the view returns to the areas.
  const fitKey = `${areaKey}|${properties.length}|${chooser ? "chooser" : ""}`;

  /** Fits the view once per area/filter change, and only once the map has a size. */
  const fitIfNeeded = useEffectEvent(() => {
    // The chooser positions the map itself.
    if (chooser || lastFitKey.current === fitKey) return;
    const { x, y } = map.getSize();
    // fitBounds on a container that has not been laid out yet yields a bogus view.
    if (x === 0 || y === 0) return;
    lastFitKey.current = fitKey;

    const active = areas.filter((a) => activeAreaIds.includes(a.id));
    const points: LatLng[] =
      active.length > 0
        ? active.flatMap((a) => toLatLngRings(a.polygon).flat())
        : properties.map((p) => [p.latitude, p.longitude]);
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 });
  });

  useEffect(() => {
    fitIfNeeded();
  }, [fitKey]);

  useEffect(() => {
    const selected = properties.find((p) => p.id === selectedId);
    if (!selected) return;
    const target = L.latLng(selected.latitude, selected.longitude);
    if (!map.getBounds().pad(-0.1).contains(target)) {
      map.panTo(target);
    }
  }, [map, properties, selectedId]);

  useEffect(() => {
    // The container may resize when the layout switches between mobile and desktop.
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      fitIfNeeded();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}

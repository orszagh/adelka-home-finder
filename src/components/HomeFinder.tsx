"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { addPlaceArea, deleteArea, type AreaResult } from "@/app/actions";
import { formatPrice, homesLabel } from "@/lib/format";
import { pointInArea } from "@/lib/geo";
import type { Property, SearchArea } from "@/lib/types";
import type { Greeting } from "@/lib/greeting";
import { type Place, REGIONS, areaNameFor } from "@/lib/italy";
import { AreaBar } from "./AreaBar";
import { CheckNowButton } from "./CheckNowButton";
import { GreetingCard } from "./GreetingCard";
import { ListingCard } from "./ListingCard";
import { SyncSheet } from "./SyncSheet";
import { useToast } from "./Toast";
import { Button, ICONS, Icon } from "./ui";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-muted">Načítavam mapu…</div>,
});

type Sort = "newest" | "cheapest" | "priciest";

const SELECT_CLASS =
  "mt-1 min-h-11 w-full rounded-2xl bg-surface px-3 text-sm font-medium text-ink shadow-card focus:outline-2 focus:outline-accent";

const PRICE_OPTIONS = [150_000, 200_000, 300_000, 400_000, 600_000];

export function HomeFinder({
  properties,
  areas,
  savedIds,
  newIds,
  priceDrops,
  greeting,
  manualSync,
  notices,
  settingsLabel,
}: {
  properties: Property[];
  areas: SearchArea[];
  savedIds: string[];
  newIds: string[];
  priceDrops: Record<string, number>;
  greeting: Greeting | null;
  manualSync: { waitMinutes: number } | null;
  notices: string[];
  /** Current search setting, e.g. "Len pri mori · 3 km". */
  settingsLabel: string;
}) {
  const [inactiveAreaIds, setInactiveAreaIds] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRooms, setMinRooms] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [showGreeting, setShowGreeting] = useState(greeting !== null);
  /** "Ukázať mi ich": only the listings from the greeting, regardless of areas and filters. */
  const [highlightIds, setHighlightIds] = useState<string[] | null>(null);
  /** Picking regions/provinces on the map; opens by itself while Adelka has no areas yet. */
  const [chooserOpen, setChooserOpen] = useState(areas.length === 0);
  const [chooserRegion, setChooserRegion] = useState<string | null>(null);
  const [placeBusy, startPlace] = useTransition();
  /** Name of the place whose listings are being fetched right now. */
  const [syncingPlace, setSyncingPlace] = useState<string | null>(null);
  const toast = useToast();

  const activeAreas = useMemo(
    () => areas.filter((a) => !inactiveAreaIds.includes(a.id)),
    [areas, inactiveAreaIds],
  );
  const activeAreaIds = useMemo(() => activeAreas.map((a) => a.id), [activeAreas]);
  const saved = useMemo(() => new Set(savedIds), [savedIds]);

  const visible = useMemo(() => {
    if (highlightIds) {
      const wanted = new Set(highlightIds);
      return properties.filter((p) => wanted.has(p.id));
    }
    const filtered = properties.filter(
      (p) =>
        (activeAreas.length === 0 || activeAreas.some((a) => pointInArea(p.longitude, p.latitude, a.polygon))) &&
        (maxPrice === null || (p.price !== null && p.price <= maxPrice)) &&
        (minRooms === null || (p.rooms !== null && p.rooms >= minRooms)),
    );
    const byPrice = (p: Property) => p.price ?? Number.MAX_SAFE_INTEGER;
    return filtered.sort((a, b) =>
      sort === "cheapest"
        ? byPrice(a) - byPrice(b)
        : sort === "priciest"
          ? byPrice(b) - byPrice(a)
          : b.first_seen_at.localeCompare(a.first_seen_at),
    );
  }, [properties, activeAreas, maxPrice, minRooms, sort, highlightIds]);

  const fresh = useMemo(() => new Set(newIds), [newIds]);
  const selected = visible.find((p) => p.id === selectedId) ?? null;

  const selectFromMap = (id: string) => {
    setSelectedId(id);
    document.getElementById(`listing-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const toggleArea = (id: string) =>
    setInactiveAreaIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const onAreaCreated = (result: AreaResult) => {
    setSyncingPlace(null);
    if (result.error) toast.show({ tone: "error", text: result.error });
    else if (result.fetched !== null) toast.show({ tone: "success", text: `Hotovo, našiel som ${homesLabel(result.fetched)}.` });
  };

  const areaByName = (place: Place) => areas.find((a) => a.name === areaNameFor(place));

  /** Adds the place as an area, or removes it when Adelka already follows it. */
  const togglePlace = (place: Place) => {
    const existing = areaByName(place);
    if (existing) {
      toast.show({ tone: "info", text: `${place.name} už nesleduješ.` });
      startPlace(() => deleteArea(existing.id));
      return;
    }
    setSyncingPlace(place.name);
    startPlace(async () => onAreaCreated(await addPlaceArea(place.kind, place.code)));
  };

  const pickPlace = (place: Place) => {
    if (place.kind === "region" && chooserRegion === null) setChooserRegion(place.code);
    else togglePlace(place);
  };

  const chooserRegionPlace = REGIONS.find((r) => r.code === chooserRegion) ?? null;

  // Rendered twice: above the map on phones (so it is seen first), atop the list on desktop.
  const greetingCard = (className: string) =>
    greeting && showGreeting ? (
      <GreetingCard
        greeting={greeting}
        className={className}
        onDismiss={() => setShowGreeting(false)}
        onShow={() => {
          setShowGreeting(false);
          setHighlightIds(greeting.ids);
          setSelectedId(null);
        }}
      />
    ) : null;

  return (
    <main className="flex flex-1 flex-col lg:h-[calc(100dvh_-_65px)] lg:flex-none lg:flex-row">
      {greetingCard("m-3 mb-0 lg:hidden")}
      <section
        className={`relative isolate ${chooserOpen ? "h-[65dvh]" : "h-[50dvh]"} shrink-0 lg:order-2 lg:h-auto lg:flex-1`}
        aria-label="Mapa"
      >
        <MapView
          properties={visible}
          areas={areas}
          activeAreaIds={highlightIds ? [] : activeAreaIds}
          savedIds={savedIds}
          selectedId={selectedId}
          onSelect={selectFromMap}
          chooser={
            chooserOpen
              ? {
                  regionCode: chooserRegion,
                  areaNames: areas.map((a) => a.name),
                  properties,
                  busy: placeBusy,
                  onPick: pickPlace,
                }
              : null
          }
        />

        {chooserOpen && (
          <div className="absolute inset-x-2 top-2 z-[1000] mx-auto max-w-md space-y-2 rounded-3xl bg-surface/95 p-4 shadow-lift">
            <div className="flex items-center justify-between gap-2">
              {chooserRegionPlace ? (
                <button
                  type="button"
                  onClick={() => setChooserRegion(null)}
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent-ink hover:underline"
                >
                  <Icon d={ICONS.back} size={16} />
                  Celé Taliansko
                </button>
              ) : (
                <p className="font-display text-xl font-semibold text-ink">Kde hľadáš domček?</p>
              )}
              <Button
                onClick={() => {
                  setChooserOpen(false);
                  setChooserRegion(null);
                }}
              >
                Hotovo
              </Button>
            </div>
            {chooserRegionPlace ? (
              <>
                <p className="text-sm text-ink-2">
                  <strong>{chooserRegionPlace.name}:</strong> ťukni na provinciu pri mori, ktorú chceš sledovať. Ďalším
                  ťuknutím ju zrušíš.
                </p>
                <button
                  type="button"
                  disabled={placeBusy}
                  onClick={() => togglePlace(chooserRegionPlace)}
                  className="min-h-11 text-sm font-semibold text-accent-ink underline disabled:opacity-50"
                >
                  {areaByName(chooserRegionPlace) ? "✓ Sleduješ celý región (zrušiť)" : "Sledovať celý región"}
                </button>
              </>
            ) : (
              <p className="text-sm text-ink-2">
                Ťukni na región, ukážem ti jeho provincie. Farebné sú regióny pri mori.
              </p>
            )}
          </div>
        )}

        {!chooserOpen && (
          <Link
            href="/nastavenia"
            className="absolute right-2.5 top-2.5 z-[1000] inline-flex min-h-11 items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm font-semibold text-ink shadow-lift hover:bg-surface-2"
          >
            <Icon d={ICONS.waves} size={18} className="text-accent" />
            {settingsLabel}
            <span className="sr-only"> – zmeniť, kde hľadať</span>
          </Link>
        )}

        {selected && (
          <Link
            href={`/inzerat/${selected.id}`}
            className="absolute inset-x-2.5 bottom-2.5 z-[1000] mx-auto flex max-w-md items-center gap-3 rounded-3xl bg-surface p-2 shadow-lift lg:hidden"
          >
            {selected.photos[0] && (
              <img src={selected.photos[0]} alt="" className="h-14 w-20 shrink-0 rounded-2xl object-cover" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-semibold">{formatPrice(selected.price)}</span>
              <span className="block truncate text-sm text-muted">{selected.title}</span>
            </span>
            <span className="pr-3 text-sm font-semibold text-accent-ink">Detail ›</span>
          </Link>
        )}
      </section>

      <section className="space-y-5 p-4 lg:order-1 lg:w-[480px] lg:overflow-y-auto lg:border-r lg:border-line">
        {greetingCard("hidden lg:block")}

        {highlightIds && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-accent-soft px-4 py-2 text-sm text-accent-ink">
            <span className="font-medium">Zobrazujem novinky od Lubka ({visible.length})</span>
            <button type="button" onClick={() => setHighlightIds(null)} className="min-h-11 font-semibold underline">
              Zobraziť všetky ponuky
            </button>
          </div>
        )}

        {notices.map((notice) => (
          <p key={notice} className="rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn-ink">
            {notice}
          </p>
        ))}

        <AreaBar
          areas={areas}
          activeAreaIds={activeAreaIds}
          onToggle={toggleArea}
          onOpenChooser={() => setChooserOpen(true)}
          busy={chooserOpen || placeBusy}
        />

        <SyncSheet open={syncingPlace !== null} subtitle={syncingPlace ?? ""} />

        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs font-semibold text-muted">
            Cena do
            <select
              value={maxPrice ?? ""}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
              className={SELECT_CLASS}
            >
              <option value="">Bez limitu</option>
              {PRICE_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {formatPrice(v)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted">
            Izby
            <select
              value={minRooms ?? ""}
              onChange={(e) => setMinRooms(e.target.value ? Number(e.target.value) : null)}
              className={SELECT_CLASS}
            >
              <option value="">Všetky</option>
              {[2, 3, 4].map((v) => (
                <option key={v} value={v}>
                  {v}+
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-muted">
            Zoradiť
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className={SELECT_CLASS}
            >
              <option value="newest">Najnovšie</option>
              <option value="cheapest">Najlacnejšie</option>
              <option value="priciest">Najdrahšie</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <h2 className="font-display text-[22px] font-semibold text-ink" aria-live="polite">
            {visible.length === 0 ? "Zatiaľ nič" : homesLabel(visible.length)}
          </h2>
          {manualSync && areas.length > 0 && <CheckNowButton waitMinutes={manualSync.waitMinutes} />}
        </div>
        {visible.length === 0 && (
          <p className="-mt-3 text-sm text-muted">V zvolených oblastiach a filtroch nie sú žiadne ponuky.</p>
        )}

        <div className="grid gap-4">
          {visible.map((p, i) => (
            <ListingCard
              key={p.id}
              enterDelayMs={Math.min(i, 10) * 40}
              property={p}
              saved={saved.has(p.id)}
              selected={p.id === selectedId}
              isNew={fresh.has(p.id)}
              previousPrice={priceDrops[p.id] ?? null}
              onSelect={setSelectedId}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

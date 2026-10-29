"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { addPlaceArea, deleteArea, type AreaResult } from "@/app/actions";
import { formatPrice, homesLabel, roomsLabel, seaLabel } from "@/lib/format";
import { outerRings, pointInArea } from "@/lib/geo";
import type { Greeting } from "@/lib/greeting";
import { PROVINCES, type Place, REGIONS, areaNameFor, findPlace, provincesOf } from "@/lib/italy";
import type { Property, SearchArea } from "@/lib/types";
import { AdPopup } from "./AdPopup";
import { CheckNowButton } from "./CheckNowButton";
import { GreetingCard } from "./GreetingCard";
import { ListingCard } from "./ListingCard";
import { markReplace } from "./navigation";
import type { MapMode } from "./MapView";
import { SyncSheet } from "./SyncSheet";
import { useToast } from "./Toast";
import { Button, Card, ICONS, Icon, chipClass } from "./ui";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-muted">Načítavam mapu…</div>,
});

type Sort = "newest" | "cheapest" | "sea";
const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Najnovšie" },
  { value: "cheapest", label: "Najlacnejšie" },
  { value: "sea", label: "Najbližšie k moru" },
];
const PRICE_OPTIONS = [150_000, 200_000, 300_000, 400_000, 600_000];
const SELECT_CLASS =
  "min-h-10 shrink-0 rounded-full bg-surface px-3.5 text-sm font-semibold text-ink-2 shadow-card focus:outline-2 focus:outline-accent";

/** The view lives in the URL (?r=region&v=list&p=listing&pick=1), so the phone's back gesture steps back through it. */
type View = { r: string | null; v: "list" | "new" | null; p: string | null; pick: boolean };

function readView(params: URLSearchParams): View {
  const r = params.get("r");
  const v = params.get("v");
  return {
    r: r && findPlace("region", r) ? r : null,
    v: v === "list" || v === "new" ? v : null,
    p: params.get("p"),
    pick: params.get("pick") === "1",
  };
}

function go(next: Partial<View>, replace = false) {
  const sp = new URLSearchParams();
  if (next.r) sp.set("r", next.r);
  if (next.v) sp.set("v", next.v);
  if (next.p) sp.set("p", next.p);
  if (next.pick) sp.set("pick", "1");
  const url = sp.size > 0 ? `?${sp}` : window.location.pathname;
  if (replace) {
    markReplace();
    window.history.replaceState(null, "", url);
  }
  else window.history.pushState(null, "", url);
}

/**
 * Region of a listing: inside its shape, else by the province name the portal gave, else the region
 * with the nearest outline (houses right on the coast can fall just outside the simplified shapes).
 */
function regionOf(p: Property): string | null {
  const inside = REGIONS.find((r) => pointInArea(p.longitude, p.latitude, r.geometry));
  if (inside) return inside.code;
  const byName = PROVINCES.find((pr) => pr.name.toLowerCase() === p.region.toLowerCase());
  if (byName) return byName.regionCode;
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const r of REGIONS) {
    for (const ring of outerRings(r.geometry)) {
      for (const [lng, lat] of ring) {
        const d = (lat - p.latitude) ** 2 + (lng - p.longitude) ** 2;
        if (d < bestDistance) [best, bestDistance] = [r.code, d];
      }
    }
  }
  return best;
}

export function HomeFinder({
  properties,
  areas,
  savedIds,
  newIds,
  seenIds,
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
  /** Listings Adelka has opened before. */
  seenIds: string[];
  priceDrops: Record<string, number>;
  greeting: Greeting | null;
  manualSync: { waitMinutes: number } | null;
  notices: string[];
  /** Current search setting, e.g. "Len pri mori · 3 km". */
  settingsLabel: string;
}) {
  const view = readView(useSearchParams());
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRooms, setMinRooms] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("newest");
  const [showGreeting, setShowGreeting] = useState(greeting !== null);
  const [placeBusy, startPlace] = useTransition();
  /** Name of the place whose listings are being fetched right now. */
  const [syncingPlace, setSyncingPlace] = useState<string | null>(null);
  const toast = useToast();

  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  const fresh = useMemo(() => new Set(newIds), [newIds]);
  const seen = useMemo(() => new Set(seenIds), [seenIds]);
  const areaNames = useMemo(() => new Set(areas.map((a) => a.name)), [areas]);
  const region = view.r ? findPlace("region", view.r)! : null;

  const regionByListing = useMemo(() => new Map(properties.map((p) => [p.id, regionOf(p)])), [properties]);
  const regionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const code of regionByListing.values()) if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
    return counts;
  }, [regionByListing]);

  const followedProvinces = useMemo(
    () => new Set(PROVINCES.filter((p) => areaNames.has(areaNameFor(p))).map((p) => p.code)),
    [areaNames],
  );
  const followedRegions = useMemo(
    () =>
      new Set(
        REGIONS.filter(
          (r) => areaNames.has(areaNameFor(r)) || provincesOf(r.code).some((p) => followedProvinces.has(p.code)),
        ).map((r) => r.code),
      ),
    [areaNames, followedProvinces],
  );

  /** Houses of the chosen region (or the greeting's news), with the list filters applied. */
  const shown = useMemo(() => {
    const wanted = view.v === "new" && greeting ? new Set(greeting.ids) : null;
    const base = properties.filter((p) => (wanted ? wanted.has(p.id) : region && regionByListing.get(p.id) === region.code));
    const filtered = base.filter(
      (p) =>
        (maxPrice === null || (p.price !== null && p.price <= maxPrice)) &&
        (minRooms === null || (p.rooms !== null && p.rooms >= minRooms)),
    );
    const byPrice = (p: Property) => p.price ?? Number.MAX_SAFE_INTEGER;
    return filtered.sort((a, b) =>
      sort === "cheapest"
        ? byPrice(a) - byPrice(b)
        : sort === "sea"
          ? (a.sea_km ?? 99) - (b.sea_km ?? 99)
          : b.first_seen_at.localeCompare(a.first_seen_at),
    );
  }, [properties, region, regionByListing, view.v, greeting, maxPrice, minRooms, sort]);

  const peek = view.p ? (shown.find((p) => p.id === view.p) ?? null) : null;

  const onAreaCreated = (result: AreaResult) => {
    setSyncingPlace(null);
    if (result.error) toast.show({ tone: "error", text: result.error });
    else if (result.fetched !== null) toast.show({ tone: "success", text: `Hotovo, našiel som ${homesLabel(result.fetched)}.` });
  };

  /** Follows the place, or stops following it when Adelka already does. */
  const togglePlace = (place: Place) => {
    const existing = areas.find((a) => a.name === areaNameFor(place));
    if (existing) {
      toast.show({ tone: "info", text: `${place.name} už nesleduješ.` });
      startPlace(() => deleteArea(existing.id));
      return;
    }
    setSyncingPlace(place.name);
    startPlace(async () => onAreaCreated(await addPlaceArea(place.kind, place.code)));
  };

  const mode: MapMode = !region
    ? { kind: "overview" }
    : view.pick
      ? {
          kind: "pick",
          chooser: { regionCode: region.code, areaNames: [...areaNames], properties, busy: placeBusy, onPick: togglePlace },
        }
      : { kind: "region", code: region.code };

  const followedInRegion = region ? provincesOf(region.code).filter((p) => followedProvinces.has(p.code)).length : 0;
  const wholeRegionFollowed = region ? areaNames.has(areaNameFor(region)) : false;
  const listOpen = (region && view.v === "list" && !view.pick) || view.v === "new";

  return (
    <>
      <AdPopup />
      <SyncSheet open={syncingPlace !== null} subtitle={syncingPlace ?? ""} />
      <main className="relative isolate h-[calc(100dvh-65px)] overflow-hidden">
        <section className="absolute inset-0" aria-label="Mapa">
          <MapView
            mode={mode}
            properties={region && !view.pick ? shown : []}
            regionCounts={regionCounts}
            followedRegions={followedRegions}
            followedProvinces={followedProvinces}
            savedIds={savedIds}
            selectedId={view.p}
            onRegion={(code) => go({ r: code }, region !== null)}
            onSelect={(id) => go({ r: view.r, p: id }, view.p !== null)}
            onBackground={() => view.p && go({ r: view.r }, true)}
            insets={{ top: region ? 110 : 20, bottom: region ? 90 : 210 }}
          />
        </section>

        {/* Italy: tap a region. The greeting, if there is news, takes the card's place. */}
        {!region && view.v !== "new" && (
          <div className="absolute inset-x-3 bottom-3 z-[1000] mx-auto max-w-md space-y-2">
            {greeting && showGreeting ? (
              <GreetingCard
                greeting={greeting}
                onDismiss={() => setShowGreeting(false)}
                onShow={() => {
                  setShowGreeting(false);
                  go({ v: "new" });
                }}
              />
            ) : (
              <Card className="animate-rise space-y-3 p-5">
                <div>
                  <h2 className="font-display text-[22px] font-semibold leading-tight text-ink">Kde hľadáš domček?</h2>
                  <p className="text-[15px] text-muted">
                    {areas.length > 0
                      ? "Ťukni na región. Čísla ukazujú, koľko domčekov tam už mám."
                      : "Ťukni na región pri mori a vyber provincie, ktoré mám sledovať."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href="/nastavenia" className={chipClass(false, "min-h-11")}>
                    <Icon d={ICONS.waves} size={16} className="text-accent" />
                    {settingsLabel}
                  </Link>
                  {manualSync && areas.length > 0 && <CheckNowButton waitMinutes={manualSync.waitMinutes} />}
                </div>
                {notices.map((notice) => (
                  <p key={notice} className="rounded-2xl bg-warn-soft px-3 py-2 text-sm text-warn-ink">
                    {notice}
                  </p>
                ))}
              </Card>
            )}
          </div>
        )}

        {/* List of houses: the region's, or the news from the greeting. */}
        {listOpen && (
          <ListingsLayer
            listings={shown}
            saved={saved}
            fresh={fresh}
            seen={seen}
            priceDrops={priceDrops}
            sort={sort}
            setSort={setSort}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            minRooms={minRooms}
            setMinRooms={setMinRooms}
            empty={
              view.v === "new" ? (
                <p className="text-muted">Novinky si už videla.</p>
              ) : (
                <EmptyRegion onPick={() => go({ r: view.r, pick: true })} />
              )
            }
          />
        )}

        {/* Top bar: back to Italy, the region and what Adelka follows there. */}
        {(region || view.v === "new") && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[1200] mx-auto flex max-w-screen-2xl flex-col items-start gap-2 px-3 sm:px-4">
            <div className="pointer-events-auto flex max-w-full items-center gap-2">
              <button
                type="button"
                onClick={() => (view.pick ? go({ r: view.r }, true) : go({}))}
                aria-label={view.pick ? "Hotovo s výberom provincií" : "Späť na celé Taliansko"}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink shadow-lift"
              >
                <Icon d={ICONS.back} size={22} />
              </button>
              <span className="flex min-h-11 min-w-0 items-center gap-2 rounded-full bg-surface px-4 shadow-lift">
                <span className="truncate font-display text-lg font-semibold text-ink">
                  {view.v === "new" ? "Novinky od Lubka" : region!.name}
                </span>
                <span className="shrink-0 text-sm text-muted">
                  {shown.length > 0 ? homesLabel(shown.length) : "zatiaľ nič"}
                </span>
              </span>
            </div>
            {region && !view.pick && (
              <button
                type="button"
                onClick={() => go({ r: view.r, pick: true })}
                className={chipClass(false, "pointer-events-auto min-h-10 shadow-lift")}
              >
                <Icon d={ICONS.heart} size={15} className="text-love" />
                {wholeRegionFollowed
                  ? "Sleduješ celý región · Upraviť"
                  : followedInRegion > 0
                    ? `Sleduješ ${followedInRegion} ${followedInRegion === 1 ? "provinciu" : followedInRegion < 5 ? "provincie" : "provincií"} · Upraviť`
                    : "Sledovať provincie"}
              </button>
            )}
          </div>
        )}

        {/* Picking provinces to follow (the old chooser, now inside the region). */}
        {region && view.pick && (
          <Card className="absolute inset-x-3 top-[68px] z-[1150] mx-auto max-w-md animate-drop space-y-2 p-4">
            <p className="text-sm text-ink-2">
              Ťukni na provinciu, ktorú mám sledovať. Ďalším ťuknutím ju zrušíš. Pre sledované provincie sťahujem ponuky
              každé ráno.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                disabled={placeBusy}
                onClick={() => togglePlace(region)}
                className="min-h-11 text-sm font-semibold text-accent-ink underline disabled:opacity-50"
              >
                {wholeRegionFollowed ? "✓ Sleduješ celý región (zrušiť)" : "Sledovať celý región"}
              </button>
              <Button onClick={() => go({ r: view.r }, true)}>Hotovo</Button>
            </div>
          </Card>
        )}

        {/* A tapped pin: a small preview, the detail one more tap away. */}
        {peek && !listOpen && !view.pick && (
          <Link
            href={`/inzerat/${peek.id}`}
            className="absolute inset-x-3 bottom-[84px] z-[1150] mx-auto flex max-w-md animate-rise items-center gap-3 rounded-3xl bg-surface p-2 shadow-lift"
          >
            {peek.photos[0] && <img src={peek.photos[0]} alt="" className="h-[72px] w-24 shrink-0 rounded-2xl object-cover" />}
            <span className="min-w-0 flex-1">
              <span className="block font-display text-xl font-semibold text-ink">{formatPrice(peek.price)}</span>
              <span className="block truncate text-sm text-ink-2">{peek.title}</span>
              <span className="block truncate text-sm text-muted">
                {[
                  peek.area_sqm ? `${peek.area_sqm} m²` : null,
                  peek.rooms ? roomsLabel(peek.rooms) : null,
                  peek.sea_km != null ? seaLabel(peek.sea_km) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span className="pr-3 text-sm font-bold text-accent-ink">Detail ›</span>
          </Link>
        )}

        {/* Map | List, within reach of the thumb. */}
        {region && !view.pick && (
          <div
            role="group"
            aria-label="Zobrazenie"
            className="absolute bottom-4 left-1/2 z-[1200] flex -translate-x-1/2 gap-1 rounded-full bg-ink p-1 shadow-lift"
          >
            {(
              [
                ["map", "Mapa", ICONS.map],
                ["list", shown.length > 0 ? `Zoznam (${shown.length})` : "Zoznam", ICONS.list],
              ] as const
            ).map(([value, label, icon]) => {
              const on = value === "list" ? view.v === "list" : view.v !== "list";
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => !on && go({ r: view.r, v: value === "list" ? "list" : null })}
                  className={`inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-5 text-[15px] font-semibold transition-colors ${
                    on ? "bg-canvas text-ink" : "text-canvas"
                  }`}
                >
                  <Icon d={icon} size={18} />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

function EmptyRegion({ onPick }: { onPick: () => void }) {
  return (
    <Card className="mx-auto max-w-md space-y-3 p-6 text-center">
      <h2 className="font-display text-xl font-semibold text-ink">Tu zatiaľ nič nemám</h2>
      <p className="text-muted">Vyber provincie, ktoré mám sledovať, a ponuky z nich hneď stiahnem.</p>
      <Button onClick={onPick}>Sledovať provincie</Button>
    </Card>
  );
}

function ListingsLayer({
  listings,
  saved,
  fresh,
  seen,
  priceDrops,
  sort,
  setSort,
  maxPrice,
  setMaxPrice,
  minRooms,
  setMinRooms,
  empty,
}: {
  listings: Property[];
  saved: Set<string>;
  fresh: Set<string>;
  seen: Set<string>;
  priceDrops: Record<string, number>;
  sort: Sort;
  setSort: (s: Sort) => void;
  maxPrice: number | null;
  setMaxPrice: (v: number | null) => void;
  minRooms: number | null;
  setMinRooms: (v: number | null) => void;
  empty: React.ReactNode;
}) {
  return (
    <section
      aria-label="Zoznam domčekov"
      className="absolute inset-0 z-[1100] animate-fade-up overflow-y-auto overscroll-contain bg-canvas px-3.5 pb-28 pt-[124px] sm:px-4"
    >
      <div className="mx-auto mb-4 flex max-w-screen-2xl gap-2 overflow-x-auto pb-1">
        {SORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            aria-pressed={sort === s.value}
            onClick={() => setSort(s.value)}
            className={chipClass(sort === s.value, "min-h-10 shrink-0")}
          >
            {s.label}
          </button>
        ))}
        <select
          aria-label="Cena do"
          value={maxPrice ?? ""}
          onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
          className={SELECT_CLASS}
        >
          <option value="">Cena: bez limitu</option>
          {PRICE_OPTIONS.map((v) => (
            <option key={v} value={v}>
              do {formatPrice(v)}
            </option>
          ))}
        </select>
        <select
          aria-label="Izby"
          value={minRooms ?? ""}
          onChange={(e) => setMinRooms(e.target.value ? Number(e.target.value) : null)}
          className={SELECT_CLASS}
        >
          <option value="">Izby: všetky</option>
          {[2, 3, 4].map((v) => (
            <option key={v} value={v}>
              {v}+ izby
            </option>
          ))}
        </select>
      </div>
      {listings.length === 0 ? (
        empty
      ) : (
        <div className="mx-auto grid max-w-screen-2xl gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {listings.map((p, i) => (
            <ListingCard
              key={p.id}
              enterDelayMs={Math.min(i, 10) * 40}
              property={p}
              saved={saved.has(p.id)}
              isNew={fresh.has(p.id)}
              seen={seen.has(p.id)}
              previousPrice={priceDrops[p.id] ?? null}
            />
          ))}
        </div>
      )}
    </section>
  );
}

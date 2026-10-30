"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { searchNear } from "@/app/actions";
import { formatUsd } from "@/lib/budget";
import { followedByRegion } from "@/lib/follow";
import { formatPrice, homesLabel, roomsLabel, seaLabel } from "@/lib/format";
import { distanceKm, pointInArea } from "@/lib/geo";
import type { Greeting } from "@/lib/greeting";
import { PROVINCES, type Place, REGIONS, areaNameFor, findPlace, provincesOf } from "@/lib/italy";
import { type EncodedIndex, type IndexedListing, decodeIndex } from "@/lib/listing-index";
import { NEAR_RADII } from "@/lib/near-search";
import type { SearchArea } from "@/lib/types";
import { AdPopup } from "./AdPopup";
import { CheckNowButton } from "./CheckNowButton";
import { FeatureAnnouncement } from "./FeatureAnnouncement";
import { FollowPanel } from "./FollowPanel";
import { GreetingCard } from "./GreetingCard";
import { HelpTip } from "./HelpTip";
import { ListingCard, ListingCardSkeleton } from "./ListingCard";
import { useListingCards } from "./listing-cards";
import { markReplace } from "./navigation";
import type { MapMode } from "./MapView";
import { SyncSheet } from "./SyncSheet";
import { useToast } from "./Toast";
import { Button, Card, ICONS, Icon, buttonClass, chipClass } from "./ui";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-muted">Načítavam mapu…</div>,
});

type Sort = "newest" | "cheapest" | "sea" | "me";
const NEAR_SORT: { value: Sort; label: string } = { value: "me", label: "Najbližšie ku mne" };
const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Najnovšie" },
  { value: "cheapest", label: "Najlacnejšie" },
  { value: "sea", label: "Najbližšie k moru" },
];
const PRICE_OPTIONS = [150_000, 200_000, 300_000, 400_000, 600_000];
const SELECT_CLASS =
  "min-h-10 shrink-0 rounded-full bg-surface px-3.5 text-sm font-semibold text-ink-2 shadow-card focus:outline-2 focus:outline-accent";

/**
 * The view lives in the URL (?r=region&v=list&p=listing&pick=1, near=1 around Adelka), so the phone's back
 * gesture steps back through it. Her position itself never goes into the URL, it stays in this page.
 */
type View = { r: string | null; v: "list" | "new" | null; p: string | null; pick: boolean; near: boolean; locate: boolean };

function readView(params: URLSearchParams): View {
  const r = params.get("r");
  const v = params.get("v");
  return {
    r: r && findPlace("region", r) ? r : null,
    v: v === "list" || v === "new" ? v : null,
    p: params.get("p"),
    pick: params.get("pick") === "1",
    near: params.get("near") === "1",
    locate: params.get("locate") === "1",
  };
}

function go(next: Partial<View>, replace = false) {
  const sp = new URLSearchParams();
  if (next.r) sp.set("r", next.r);
  if (next.v) sp.set("v", next.v);
  if (next.p) sp.set("p", next.p);
  if (next.pick) sp.set("pick", "1");
  if (next.near) sp.set("near", "1");
  const url = sp.size > 0 ? `?${sp}` : window.location.pathname;
  if (replace) {
    markReplace();
    window.history.replaceState(null, "", url);
  }
  else window.history.pushState(null, "", url);
}

export function HomeFinder({
  index,
  areas,
  savedIds,
  seenIds,
  priceDrops,
  twinSources,
  greeting,
  manualSync,
  notices,
  settingsLabel,
  costPerAreaUsd,
}: {
  /** Every listing's numbers (see lib/listing-index); cards are fetched for the houses on screen. */
  index: EncodedIndex;
  areas: SearchArea[];
  savedIds: string[];
  /** Listings Adelka has opened before. */
  seenIds: string[];
  priceDrops: Record<string, number>;
  /** The same house is also on these portals (shown as one card). */
  twinSources: Record<string, string[]>;
  greeting: Greeting | null;
  manualSync: { waitMinutes: number } | null;
  notices: string[];
  /** Current search setting, e.g. "Len pri mori · 3 km". */
  settingsLabel: string;
  /** At most what fetching one area costs, for the note while downloading (null for demo data). */
  costPerAreaUsd: number | null;
}) {
  const view = readView(useSearchParams());
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRooms, setMinRooms] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("newest");
  const [showGreeting, setShowGreeting] = useState(greeting !== null);
  /** Provinces ticked in the follow panel and not saved yet (per region; the saved ones otherwise). */
  const [draft, setDraft] = useState<{ region: string; chosen: Set<string> } | null>(null);
  /** Room the follow panel takes over the map. */
  const [panelPad, setPanelPad] = useState({ bottom: 0, left: 0 });
  /** Where Adelka stands, after she asked for the houses around her. */
  const [here, setHere] = useState<[lat: number, lng: number] | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [locating, setLocating] = useState(false);
  /** "Prehľadať tento okruh": asking first (it costs Apify credit), then fetching. */
  const [nearSearch, setNearSearch] = useState<"confirm" | "busy" | null>(null);
  const toast = useToast();

  /** Every stored house; `banded` are those within the distance from the sea set in Nastavenia. */
  const properties = useMemo(() => decodeIndex(index), [index]);
  const banded = useMemo(() => properties.filter((p) => p.in_band), [properties]);
  const saved = useMemo(() => new Set(savedIds), [savedIds]);
  const fresh = useMemo(() => new Set(properties.filter((p) => p.is_new).map((p) => p.id)), [properties]);
  const seen = useMemo(() => new Set(seenIds), [seenIds]);
  const areaNames = useMemo(() => new Set(areas.map((a) => a.name)), [areas]);
  const region = view.r ? findPlace("region", view.r)! : null;
  const near = view.near && here !== null && !region ? { center: here, radiusKm } : null;
  const nearRadius = near?.radiusKm ?? null;
  const distances = useMemo(
    () => (here ? new Map(properties.map((p) => [p.id, distanceKm([here[1], here[0]], [p.longitude, p.latitude])])) : null),
    [here, properties],
  );

  const regionByListing = useMemo(() => new Map(banded.map((p) => [p.id, p.region_code])), [banded]);
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
    // Around Adelka every stored house counts, also those further from the sea than the setting.
    const base = (nearRadius !== null && !wanted ? properties : banded).filter((p) =>
      wanted
        ? wanted.has(p.id)
        : nearRadius !== null
          ? (distances?.get(p.id) ?? Infinity) <= nearRadius
          : region && regionByListing.get(p.id) === region.code,
    );
    const filtered = base.filter(
      (p) =>
        (maxPrice === null || (p.price !== null && p.price <= maxPrice)) &&
        (minRooms === null || (p.rooms !== null && p.rooms >= minRooms)),
    );
    const byPrice = (p: IndexedListing) => p.price ?? Number.MAX_SAFE_INTEGER;
    return filtered.sort((a, b) =>
      sort === "me" && nearRadius !== null && distances
        ? distances.get(a.id)! - distances.get(b.id)!
        : sort === "cheapest"
        ? byPrice(a) - byPrice(b)
        : sort === "sea"
          ? (a.sea_km ?? 99) - (b.sea_km ?? 99)
          : b.first_seen_at.localeCompare(a.first_seen_at),
    );
  }, [properties, banded, region, regionByListing, view.v, greeting, maxPrice, minRooms, sort, nearRadius, distances]);

  const peek = view.p ? (shown.find((p) => p.id === view.p) ?? null) : null;
  const peekCard = useListingCards(peek ? [peek.id] : []).cards.get(peek?.id ?? "") ?? null;

  const followed = useMemo(() => followedByRegion(areaNames), [areaNames]);
  const chosen =
    region && draft?.region === region.code ? draft.chosen : (region && followed.get(region.code)?.provinces) || new Set<string>();
  const setChosen = (next: Set<string>) => region && setDraft({ region: region.code, chosen: next });
  /** Opens the follow panel of a region, optionally with a province already ticked (not saved yet). */
  const openFollow = (regionCode: string, tick?: string) => {
    const saved = followed.get(regionCode)?.provinces ?? new Set<string>();
    setDraft(tick ? { region: regionCode, chosen: new Set([...saved, tick]) } : null);
    go({ r: regionCode, pick: true });
  };
  const closeFollow = () => {
    setDraft(null);
    go({ r: view.r }, true);
  };

  /** The province Adelka stands in, and whether its houses are being downloaded. */
  const hereProvince = here ? (PROVINCES.find((p) => pointInArea(here[1], here[0], p.geometry)) ?? null) : null;
  const hereFollowed =
    hereProvince !== null &&
    (followedProvinces.has(hereProvince.code) || areaNames.has(areaNameFor(findPlace("region", hereProvince.regionCode)!)));

  /** Fetches the circle once (see searchNear); the new houses arrive with the refreshed page. */
  const runNearSearch = async () => {
    if (!near) return;
    setNearSearch("busy");
    const result = await searchNear({ latitude: near.center[0], longitude: near.center[1], radiusKm: near.radiusKm });
    setNearSearch(null);
    if (result.error) toast.show({ tone: "error", text: result.error });
    else if (result.fetched !== null) toast.show({ tone: "success", text: `Hotovo, našiel som ${homesLabel(result.fetched)}.` });
  };
  /** Only with real listings (a price to show) and in Italy. */
  const canSearchNear = near !== null && costPerAreaUsd !== null && hereProvince !== null;

  const locate = () => {
    if (!("geolocation" in navigator)) {
      toast.show({ tone: "error", text: "Tento prehliadač nevie zistiť polohu." });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        // About 10 m is plenty for a circle of kilometres.
        setHere([Math.round(coords.latitude * 1e4) / 1e4, Math.round(coords.longitude * 1e4) / 1e4]);
        setSort("me");
        go({ near: true }, view.near || view.locate);
      },
      (error) => {
        setLocating(false);
        toast.show({
          tone: "error",
          text:
            error.code === error.PERMISSION_DENIED
              ? "Appka nemá povolenú polohu. Povoľ ju v nastaveniach prehliadača pre túto stránku a skús znova."
              : "Polohu sa nepodarilo zistiť. Skús to o chvíľu znova, ideálne vonku.",
        });
        if (view.locate) go({}, true);
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 5 * 60_000 },
    );
  };

  // "Domčeky v okolí" in the menu opens the map with ?locate=1.
  const locateFromLink = useEffectEvent(locate);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the position arrives from the browser, once per tap in the menu
    if (view.locate) locateFromLink();
  }, [view.locate]);

  const mode: MapMode = near
    ? { kind: "near", center: near.center, radiusKm: near.radiusKm }
    : !region
    ? { kind: "overview" }
    : view.pick
      ? {
          kind: "pick",
          chooser: {
            regionCode: region.code,
            chosen,
            properties: banded,
            onPick: (p: Place) => {
              const next = new Set(chosen);
              if (next.has(p.code)) next.delete(p.code);
              else next.add(p.code);
              setChosen(next);
            },
            padding: { top: 76, ...panelPad },
          },
        }
      : { kind: "region", code: region.code };

  const followedInRegion = region ? provincesOf(region.code).filter((p) => followedProvinces.has(p.code)).length : 0;
  const wholeRegionFollowed = region ? areaNames.has(areaNameFor(region)) : false;
  const listOpen = ((region || near) && view.v === "list" && !view.pick) || view.v === "new";
  /** Region, or the circle around Adelka: what the pins, the peek and Map | List belong to. */
  const place = { r: view.r, near: view.near };
  const nearEmpty = near && shown.length === 0 && (
    <NearEmpty
      radiusKm={near.radiusKm}
      province={hereProvince}
      followed={hereFollowed}
      onFollow={() => hereProvince && openFollow(hereProvince.regionCode, hereProvince.code)}
      onWider={() => setRadiusKm(NEAR_RADII.find((r) => r > near.radiusKm) ?? near.radiusKm)}
      onSearch={canSearchNear ? () => setNearSearch("confirm") : null}
    />
  );

  return (
    <>
      <AdPopup />
      <FeatureAnnouncement />
      <SyncSheet open={nearSearch === "busy"} subtitle={`Okruh ${near?.radiusKm ?? ""} km`} costUsd={costPerAreaUsd} />
      {nearSearch === "confirm" && near && costPerAreaUsd !== null && (
        <NearSearchConfirm
          radiusKm={near.radiusKm}
          costUsd={costPerAreaUsd}
          onYes={runNearSearch}
          onNo={() => setNearSearch(null)}
        />
      )}
      <main className="relative isolate h-[calc(100dvh-65px)] overflow-hidden">
        <section className="absolute inset-0" aria-label="Mapa">
          <MapView
            mode={mode}
            properties={(region && !view.pick) || near ? shown : []}
            regionCounts={regionCounts}
            followedRegions={followedRegions}
            followedProvinces={followedProvinces}
            savedIds={savedIds}
            selectedId={view.p}
            onRegion={(code) => go({ r: code }, region !== null)}
            onSelect={(id) => go({ ...place, p: id }, view.p !== null)}
            onBackground={() => view.p && go(place, true)}
            insets={{ top: near ? 120 : region ? 110 : 20, bottom: region || near ? 90 : 210 }}
          />
        </section>

        {/* Italy: tap a region. The greeting, if there is news, takes the card's place. */}
        {!region && !near && view.v !== "new" && (
          <div className="absolute inset-x-3 bottom-3 z-[1000] mx-auto max-w-md space-y-2">
            <div className="flex justify-center">
              <NearButton active={false} busy={locating} onClick={locate} wide />
            </div>
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
                  {manualSync && areas.length > 0 && <CheckNowButton waitMinutes={manualSync.waitMinutes} costUsd={costPerAreaUsd && costPerAreaUsd * areas.length} />}
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
            twinSources={twinSources}
            sort={sort}
            setSort={setSort}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            minRooms={minRooms}
            setMinRooms={setMinRooms}
            sorts={near ? [NEAR_SORT, ...SORTS] : SORTS}
            distances={near ? distances : null}
            empty={
              nearEmpty ? (
                nearEmpty
              ) : view.v === "new" ? (
                <p className="text-muted">Novinky si už videla.</p>
              ) : (
                <EmptyRegion onPick={() => region && openFollow(region.code)} />
              )
            }
          />
        )}

        {/* Top bar: back to Italy, the region and what Adelka follows there. */}
        {(region || near || view.v === "new") && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[1200] mx-auto flex max-w-screen-2xl flex-col items-start gap-2 px-3 sm:px-4">
            <div className="pointer-events-auto flex max-w-full items-center gap-2">
              <button
                type="button"
                onClick={() => (view.pick ? closeFollow() : go({}))}
                aria-label={view.pick ? "Hotovo s výberom provincií" : "Späť na celé Taliansko"}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink shadow-lift"
              >
                <Icon d={ICONS.back} size={22} />
              </button>
              <span className="flex min-h-11 min-w-0 items-center gap-2 rounded-full bg-surface px-4 shadow-lift">
                <span className="truncate font-display text-lg font-semibold text-ink">
                  {view.v === "new" ? "Novinky od Lubka" : near ? "V okolí" : region!.name}
                </span>
                <span className="shrink-0 text-sm text-muted">
                  {shown.length > 0 ? homesLabel(shown.length) : "zatiaľ nič"}
                </span>
              </span>
              {near && (
                <HelpTip label="Ako funguje okolie" title="Domčeky v okolí" href="/napoveda#okolie" className="shrink-0">
                  <p>Ukazujem všetky domčeky, ktoré už mám stiahnuté, aj tie ďalej od mora. Veľkosť kruhu meníš tlačidlami s km.</p>
                  {canSearchNear && (
                    <p>
                      <b>Prehľadať tento okruh</b> stiahne nové ponuky len tu. Cenu ti poviem vopred, dá sa to zastaviť a okruh nezačnem
                      sledovať.
                    </p>
                  )}
                </HelpTip>
              )}
            </div>
            {near && (
              <div className="pointer-events-auto flex max-w-full flex-wrap gap-1.5">
                {NEAR_RADII.map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={r === near.radiusKm}
                    onClick={() => setRadiusKm(r)}
                    className={chipClass(r === near.radiusKm, "min-h-10 shadow-lift")}
                  >
                    {r} km
                  </button>
                ))}
                {canSearchNear && (
                  <button
                    type="button"
                    disabled={nearSearch !== null}
                    onClick={() => setNearSearch("confirm")}
                    className={chipClass(false, "min-h-10 shadow-lift disabled:opacity-50")}
                  >
                    <Icon d={ICONS.search} size={15} className="text-accent" />
                    Prehľadať tento okruh
                  </button>
                )}
                {hereProvince && !hereFollowed && (
                  <button
                    type="button"
                    onClick={() => openFollow(hereProvince.regionCode, hereProvince.code)}
                    className={chipClass(false, "min-h-10 shadow-lift")}
                  >
                    <Icon d={ICONS.heart} size={15} className="text-love" />
                    Sledovať tu…
                  </button>
                )}
              </div>
            )}
            {region && !view.pick && (
              <button
                type="button"
                onClick={() => openFollow(region.code)}
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

        {/* What to follow in the region: ticked in the panel or on the map, nothing downloaded on a tap. */}
        {region && view.pick && (
          <FollowPanel
            key={region.code}
            region={region}
            chosen={chosen}
            setChosen={setChosen}
            areaNames={areas.map((a) => a.name)}
            properties={banded}
            costPerAreaUsd={costPerAreaUsd}
            onDone={closeFollow}
            onSwitchRegion={(code) => openFollow(code)}
            onLayout={setPanelPad}
          />
        )}

        {/* Around Adelka, nothing inside the circle: say why and what helps. */}
        {nearEmpty && !listOpen && <div className="absolute inset-x-3 bottom-[84px] z-[1150] mx-auto max-w-md">{nearEmpty}</div>}

        {/* A tapped pin: a small preview, the detail one more tap away. */}
        {peek && !listOpen && !view.pick && (
          <Link
            href={`/inzerat/${peek.id}`}
            className="absolute inset-x-3 bottom-[84px] z-[1150] mx-auto flex max-w-md animate-rise items-center gap-3 rounded-3xl bg-surface p-2 shadow-lift"
          >
            {peekCard?.photo ? (
              <img src={peekCard.photo} alt="" className="h-[72px] w-24 shrink-0 rounded-2xl object-cover" />
            ) : (
              <span aria-hidden className="h-[72px] w-24 shrink-0 animate-pulse rounded-2xl bg-surface-2" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-display text-xl font-semibold text-ink">{formatPrice(peek.price)}</span>
              <span className="block truncate text-sm text-ink-2">{peekCard?.title ?? " "}</span>
              <span className="block truncate text-sm text-muted">
                {[
                  peekCard?.area_sqm ? `${peekCard.area_sqm} m²` : null,
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

        {/* Map | List, within reach of the thumb, and "Hľadať v okolí" next to it. */}
        {(region || near) && !view.pick && (
          <div className="absolute bottom-4 left-1/2 z-[1200] flex -translate-x-1/2 gap-2">
            <div role="group" aria-label="Zobrazenie" className="flex gap-1 rounded-full bg-ink p-1 shadow-lift">
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
                    onClick={() => !on && go({ ...place, v: value === "list" ? "list" : null })}
                    className={`${SEGMENT} ${on ? "bg-canvas text-ink" : "text-canvas"}`}
                  >
                    <Icon d={icon} size={18} />
                    {label}
                  </button>
                );
              })}
            </div>
            <NearButton active={near !== null} busy={locating} onClick={locate} />
          </div>
        )}
      </main>
    </>
  );
}

/** Cards fetched and shown at once in the list; "Ukázať ďalšie" adds as many again. */
const PAGE_SIZE = 30;

const SEGMENT =
  "inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[15px] font-semibold transition-colors sm:px-5";

/** "Hľadať v okolí": the same dark pill as Map | List; lit while Adelka looks around herself. */
function NearButton({ active, busy, onClick, wide = false }: { active: boolean; busy: boolean; onClick: () => void; wide?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      aria-label={active ? "Znova zistiť moju polohu" : "Hľadať domčeky v mojom okolí"}
      className="flex rounded-full bg-ink p-1 shadow-lift"
    >
      <span className={`${SEGMENT} ${active ? "bg-canvas text-ink" : "text-canvas"}`}>
        <Icon d={ICONS.locate} size={18} className={busy ? "animate-spin" : ""} />
        {wide ? (
          "Hľadať v okolí"
        ) : (
          <>
            <span className="sm:hidden">V okolí</span>
            <span className="hidden sm:inline">Hľadať v okolí</span>
          </>
        )}
      </span>
    </button>
  );
}

/** Nothing in the circle around Adelka: follow the province she is in, or look further. */
function NearEmpty({
  radiusKm,
  province,
  followed,
  onFollow,
  onWider,
  onSearch,
}: {
  radiusKm: number;
  province: Place | null;
  followed: boolean;
  /** Opens the follow panel of the region she stands in. */
  onFollow: () => void;
  onWider: () => void;
  /** "Prehľadať tento okruh", when it is possible here. */
  onSearch: (() => void) | null;
}) {
  const wider = radiusKm < NEAR_RADII[NEAR_RADII.length - 1];
  return (
    <Card className="mx-auto max-w-md animate-rise space-y-3 p-5">
      <h2 className="font-display text-xl font-semibold text-ink">Do {radiusKm} km zatiaľ nič nemám</h2>
      <p className="text-[15px] text-muted">
        {!province
          ? "Si mimo Talianska, tu domčeky nehľadám."
          : followed
            ? `Provinciu ${province.name} sledujem, len v tomto okruhu teraz nič nie je.`
            : `Tu ešte nehľadám. Vybrať, čo mám v regióne ${findPlace("region", province.regionCode)?.name ?? ""} sledovať? Ponuky stiahnem ráno.`}
      </p>
      <div className="flex flex-wrap gap-2">
        {onSearch && <Button onClick={onSearch}>Prehľadať tento okruh</Button>}
        {province && !followed && (
          <Button variant={onSearch ? "secondary" : "primary"} onClick={onFollow}>
            Vybrať, čo sledovať
          </Button>
        )}
        {wider && (
          <Button variant="secondary" onClick={onWider}>
            Hľadať ďalej
          </Button>
        )}
      </div>
    </Card>
  );
}

/** Before "Prehľadať tento okruh": what it does and what it costs at most. */
function NearSearchConfirm({
  radiusKm,
  costUsd,
  onYes,
  onNo,
}: {
  radiusKm: number;
  costUsd: number;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[1500] flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div
        role="alertdialog"
        aria-labelledby="near-search-title"
        className="w-full max-w-[420px] animate-rise space-y-3 rounded-[28px] bg-surface p-5 shadow-lift"
      >
        <h2 id="near-search-title" className="font-display text-xl font-semibold text-ink">
          Prehľadať okruh {radiusKm} km?
        </h2>
        <p className="text-[15px] text-ink-2">
          Stiahnem ponuky z Idealista a Immobiliare v celom kruhu, aj ďalej od mora.
          {costUsd > 0 && (
            <>
              {" "}
              Bude to stáť Lubka najviac asi <strong>{formatUsd(costUsd)}</strong> z kreditu na Apify.
            </>
          )}{" "}
          Tento okruh nezačnem sledovať a počas sťahovania ho môžeš zastaviť.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={onYes} className={buttonClass("primary", "md", "flex-1")}>
            Áno, prehľadať
          </button>
          <button type="button" onClick={onNo} className={buttonClass("secondary", "md", "flex-1")}>
            Zrušiť
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyRegion({ onPick }: { onPick: () => void }) {
  return (
    <Card className="mx-auto max-w-md space-y-3 p-6 text-center">
      <h2 className="font-display text-xl font-semibold text-ink">Tu zatiaľ nič nemám</h2>
      <p className="text-muted">Vyber provincie, ktoré mám sledovať. Ponuky z nich stiahnem ráno, alebo hneď, keď chceš.</p>
      <Button onClick={onPick}>Sledovať provincie</Button>
    </Card>
  );
}

function ListingsLayer({
  listings,
  saved,
  fresh,
  seen,
  sorts,
  distances,
  priceDrops,
  twinSources,
  sort,
  setSort,
  maxPrice,
  setMaxPrice,
  minRooms,
  setMinRooms,
  empty,
}: {
  listings: IndexedListing[];
  saved: Set<string>;
  fresh: Set<string>;
  seen: Set<string>;
  sorts: { value: Sort; label: string }[];
  /** Km from Adelka, around her. */
  distances: Map<string, number> | null;
  priceDrops: Record<string, number>;
  twinSources: Record<string, string[]>;
  sort: Sort;
  setSort: (s: Sort) => void;
  maxPrice: number | null;
  setMaxPrice: (v: number | null) => void;
  minRooms: number | null;
  setMinRooms: (v: number | null) => void;
  empty: React.ReactNode;
}) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const visible = listings.slice(0, limit);
  const { cards, failed, retry } = useListingCards(visible.map((p) => p.id));

  return (
    <section
      aria-label="Zoznam domčekov"
      className="absolute inset-0 z-[1100] animate-fade-up overflow-y-auto overscroll-contain bg-canvas px-3.5 pb-28 pt-[124px] sm:px-4"
    >
      <div className="mx-auto mb-4 flex max-w-screen-2xl gap-2 overflow-x-auto pb-1">
        {sorts.map((s) => (
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
          {visible.map((p, i) => {
            const card = cards.get(p.id);
            return card ? (
              <ListingCard
                key={p.id}
                enterDelayMs={Math.min(i % PAGE_SIZE, 10) * 40}
                property={{ ...p, ...card, photos: card.photo ? [card.photo] : [] }}
                saved={saved.has(p.id)}
                isNew={fresh.has(p.id)}
                seen={seen.has(p.id)}
                distanceKm={distances?.get(p.id) ?? null}
                previousPrice={priceDrops[p.id] ?? null}
                alsoOn={twinSources[p.id] ?? []}
              />
            ) : (
              <ListingCardSkeleton key={p.id} />
            );
          })}
        </div>
      )}
      {failed && (
        <div className="mx-auto mt-4 flex max-w-md flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted">Domčeky sa nepodarilo načítať. Možno je slabý signál.</p>
          <Button variant="secondary" onClick={retry}>
            Skús znova
          </Button>
        </div>
      )}
      {listings.length > limit && (
        <div className="mx-auto mt-5 flex max-w-md justify-center">
          <Button variant="secondary" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
            Ukázať ďalšie (ešte {listings.length - limit})
          </Button>
        </div>
      )}
    </section>
  );
}

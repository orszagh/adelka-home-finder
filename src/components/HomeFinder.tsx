"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { addPlaceArea, createArea, deleteArea, type AreaResult } from "@/app/actions";
import { formatPrice } from "@/lib/format";
import { pointInArea, polygonFromLatLngs } from "@/lib/geo";
import type { Property, SearchArea } from "@/lib/types";
import type { Greeting } from "@/lib/greeting";
import { type Place, REGIONS, areaNameFor } from "@/lib/italy";
import { AreaBar } from "./AreaBar";
import { CheckNowButton } from "./CheckNowButton";
import { GreetingCard } from "./GreetingCard";
import { ListingCard } from "./ListingCard";
import type { LatLng } from "./MapView";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-slate-500">Načítavam mapu…</div>,
});

type Sort = "newest" | "cheapest" | "priciest";

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
}: {
  properties: Property[];
  areas: SearchArea[];
  savedIds: string[];
  newIds: string[];
  priceDrops: Record<string, number>;
  greeting: Greeting | null;
  manualSync: { waitMinutes: number } | null;
  notices: string[];
}) {
  const [inactiveAreaIds, setInactiveAreaIds] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRooms, setMinRooms] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [drawing, setDrawing] = useState(false);
  const [draftPoints, setDraftPoints] = useState<LatLng[]>([]);
  const [draftName, setDraftName] = useState("");
  const [saving, startSaving] = useTransition();
  const [showGreeting, setShowGreeting] = useState(greeting !== null);
  /** "Ukázať mi ich": only the listings from the greeting, regardless of areas and filters. */
  const [highlightIds, setHighlightIds] = useState<string[] | null>(null);
  /** Picking regions/provinces on the map; opens by itself while Adelka has no areas yet. */
  const [chooserOpen, setChooserOpen] = useState(areas.length === 0);
  const [chooserRegion, setChooserRegion] = useState<string | null>(null);
  const [placeBusy, startPlace] = useTransition();
  const [areaStatus, setAreaStatus] = useState<{ tone: "info" | "error"; text: string } | null>(null);

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

  const stopDrawing = () => {
    setDrawing(false);
    setDraftPoints([]);
    setDraftName("");
  };

  const onAreaCreating = (name = "novú oblasť") =>
    setAreaStatus({ tone: "info", text: `Sťahujem ponuky pre ${name}… môže to trvať do minúty.` });

  const onAreaCreated = (result: AreaResult) => {
    if (result.error) setAreaStatus({ tone: "error", text: result.error });
    else if (result.fetched === null) setAreaStatus(null);
    else setAreaStatus({ tone: "info", text: `Hotovo, v oblasti som našiel ${result.fetched} ponúk.` });
  };

  const areaByName = (place: Place) => areas.find((a) => a.name === areaNameFor(place));

  /** Adds the place as an area, or removes it when Adelka already follows it. */
  const togglePlace = (place: Place) => {
    const existing = areaByName(place);
    if (existing) {
      setAreaStatus({ tone: "info", text: `${place.name} už nesleduješ.` });
      startPlace(() => deleteArea(existing.id));
      return;
    }
    onAreaCreating(place.name);
    startPlace(async () => onAreaCreated(await addPlaceArea(place.kind, place.code)));
  };

  const pickPlace = (place: Place) => {
    if (place.kind === "region" && chooserRegion === null) setChooserRegion(place.code);
    else togglePlace(place);
  };

  const chooserRegionPlace = REGIONS.find((r) => r.code === chooserRegion) ?? null;

  const saveDraft = () => {
    onAreaCreating();
    startSaving(async () => {
      onAreaCreated(await createArea(draftName, polygonFromLatLngs(draftPoints)));
      stopDrawing();
    });
  };

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
    <main className="flex flex-1 flex-col lg:h-[calc(100dvh_-_57px)] lg:flex-none lg:flex-row">
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
          drawing={drawing}
          draftPoints={draftPoints}
          onAddPoint={(pt) => setDraftPoints((pts) => [...pts, pt])}
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
          <div className="absolute inset-x-2 top-2 z-[1000] mx-auto max-w-md space-y-2 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-2">
              {chooserRegionPlace ? (
                <button
                  type="button"
                  onClick={() => setChooserRegion(null)}
                  className="text-sm font-medium text-sea-700 hover:underline"
                >
                  ‹ Celé Taliansko
                </button>
              ) : (
                <p className="font-semibold text-slate-900">Kde hľadáš domček?</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setChooserOpen(false);
                  setChooserRegion(null);
                }}
                className="rounded-full bg-sea-700 px-3 py-1 text-sm font-medium text-white hover:bg-sea-800"
              >
                Hotovo
              </button>
            </div>
            {chooserRegionPlace ? (
              <>
                <p className="text-sm text-slate-700">
                  <strong>{chooserRegionPlace.name}:</strong> ťukni na provinciu pri mori, ktorú chceš sledovať. Ďalším
                  ťuknutím ju zrušíš.
                </p>
                <button
                  type="button"
                  disabled={placeBusy}
                  onClick={() => togglePlace(chooserRegionPlace)}
                  className="text-sm font-medium text-sea-800 underline disabled:opacity-50"
                >
                  {areaByName(chooserRegionPlace) ? "✓ Sleduješ celý región (zrušiť)" : "Sledovať celý región"}
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-700">
                Ťukni na región, ukážem ti jeho provincie. Farebné sú regióny pri mori.
              </p>
            )}
          </div>
        )}

        {drawing && !chooserOpen && (
          <div className="absolute inset-x-2 top-2 z-[1000] mx-auto max-w-md space-y-2 rounded-2xl bg-white/95 p-3 shadow-lg ring-1 ring-slate-200">
            <p className="text-sm text-slate-700">
              {draftPoints.length < 3
                ? `Ťukaj na mapu a pridávaj body okraja oblasti (${draftPoints.length}/3).`
                : "Oblasť je pripravená. Pomenuj ju a ulož, alebo pridaj ďalšie body."}
            </p>
            {draftPoints.length >= 3 && (
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Názov, napr. Pobrežie pri Alassiu"
                maxLength={80}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
                autoFocus
              />
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveDraft}
                disabled={draftPoints.length < 3 || saving}
                className="rounded-full bg-sea-700 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
              >
                {saving ? "Ukladám…" : "Uložiť oblasť"}
              </button>
              <button
                type="button"
                onClick={() => setDraftPoints((pts) => pts.slice(0, -1))}
                disabled={draftPoints.length === 0 || saving}
                className="rounded-full px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-300 disabled:opacity-40"
              >
                Späť
              </button>
              <button
                type="button"
                onClick={stopDrawing}
                disabled={saving}
                className="rounded-full px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-300"
              >
                Zrušiť
              </button>
            </div>
          </div>
        )}

        {selected && !drawing && (
          <Link
            href={`/inzerat/${selected.id}`}
            className="absolute inset-x-2 bottom-2 z-[1000] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-slate-200 lg:hidden"
          >
            {selected.photos[0] && (
              <img src={selected.photos[0]} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{formatPrice(selected.price)}</span>
              <span className="block truncate text-sm text-slate-600">{selected.title}</span>
            </span>
            <span className="pr-2 text-sm font-medium text-sea-700">Detail ›</span>
          </Link>
        )}
      </section>

      <section className="space-y-4 p-4 lg:order-1 lg:w-[440px] lg:overflow-y-auto lg:border-r lg:border-slate-200">
        {greetingCard("hidden lg:block")}

        {highlightIds && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sea-50 px-3 py-2 text-sm text-sea-800 ring-1 ring-sea-600/30">
            <span>Zobrazujem novinky od Lubka ({visible.length})</span>
            <button type="button" onClick={() => setHighlightIds(null)} className="font-medium underline">
              Zobraziť všetky ponuky
            </button>
          </div>
        )}

        {notices.map((notice) => (
          <p key={notice} className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
            {notice}
          </p>
        ))}

        <AreaBar
          areas={areas}
          activeAreaIds={activeAreaIds}
          onToggle={toggleArea}
          onOpenChooser={() => {
            setDrawing(false);
            setChooserOpen(true);
          }}
          onStartDrawing={() => {
            setChooserOpen(false);
            setDrawing(true);
          }}
          busy={drawing || chooserOpen || placeBusy}
        />

        {areaStatus && (
          <p
            role="status"
            className={`rounded-xl px-3 py-2 text-sm ring-1 ${
              areaStatus.tone === "error"
                ? "bg-rose-50 text-rose-800 ring-rose-200"
                : "bg-sea-50 text-sea-800 ring-sea-600/30"
            }`}
          >
            {areaStatus.text}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs text-slate-500">
            Cena do
            <select
              value={maxPrice ?? ""}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : null)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
            >
              <option value="">Bez limitu</option>
              {PRICE_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {formatPrice(v)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Izby
            <select
              value={minRooms ?? ""}
              onChange={(e) => setMinRooms(e.target.value ? Number(e.target.value) : null)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
            >
              <option value="">Všetky</option>
              {[2, 3, 4].map((v) => (
                <option key={v} value={v}>
                  {v}+
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Zoradiť
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"
            >
              <option value="newest">Najnovšie</option>
              <option value="cheapest">Najlacnejšie</option>
              <option value="priciest">Najdrahšie</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600" aria-live="polite">
            {visible.length === 0
              ? "V zvolených oblastiach a filtroch nie sú žiadne ponuky."
              : `${visible.length} ${visible.length === 1 ? "ponuka" : visible.length < 5 ? "ponuky" : "ponúk"}`}
          </p>
          {manualSync && areas.length > 0 && <CheckNowButton waitMinutes={manualSync.waitMinutes} />}
        </div>

        <div className="space-y-3">
          {visible.map((p) => (
            <ListingCard
              key={p.id}
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

"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { createArea } from "@/app/actions";
import { formatPrice } from "@/lib/format";
import { pointInArea, polygonFromLatLngs } from "@/lib/geo";
import type { Property, SearchArea } from "@/lib/types";
import { AreaBar } from "./AreaBar";
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
  notices,
}: {
  properties: Property[];
  areas: SearchArea[];
  savedIds: string[];
  newIds: string[];
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

  const activeAreas = useMemo(
    () => areas.filter((a) => !inactiveAreaIds.includes(a.id)),
    [areas, inactiveAreaIds],
  );
  const activeAreaIds = useMemo(() => activeAreas.map((a) => a.id), [activeAreas]);
  const saved = useMemo(() => new Set(savedIds), [savedIds]);

  const visible = useMemo(() => {
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
  }, [properties, activeAreas, maxPrice, minRooms, sort]);

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

  const saveDraft = () =>
    startSaving(async () => {
      await createArea(draftName, polygonFromLatLngs(draftPoints));
      stopDrawing();
    });

  return (
    <main className="flex flex-1 flex-col lg:h-[calc(100dvh_-_57px)] lg:flex-none lg:flex-row">
      <section className="relative isolate h-[50dvh] shrink-0 lg:order-2 lg:h-auto lg:flex-1" aria-label="Mapa">
        <MapView
          properties={visible}
          areas={areas}
          activeAreaIds={activeAreaIds}
          savedIds={savedIds}
          selectedId={selectedId}
          onSelect={selectFromMap}
          drawing={drawing}
          draftPoints={draftPoints}
          onAddPoint={(pt) => setDraftPoints((pts) => [...pts, pt])}
        />

        {drawing && (
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
        {notices.map((notice) => (
          <p key={notice} className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
            {notice}
          </p>
        ))}

        <AreaBar
          areas={areas}
          activeAreaIds={activeAreaIds}
          onToggle={toggleArea}
          onStartDrawing={() => setDrawing(true)}
          drawing={drawing}
        />

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

        <p className="text-sm text-slate-600" aria-live="polite">
          {visible.length === 0
            ? "V zvolených oblastiach a filtroch nie sú žiadne ponuky."
            : `${visible.length} ${visible.length === 1 ? "ponuka" : visible.length < 5 ? "ponuky" : "ponúk"}`}
        </p>

        <div className="space-y-3">
          {visible.map((p) => (
            <ListingCard
              key={p.id}
              property={p}
              saved={saved.has(p.id)}
              selected={p.id === selectedId}
              isNew={fresh.has(p.id)}
              onSelect={setSelectedId}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

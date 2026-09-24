"use server";

import { revalidatePath } from "next/cache";
import { getRepo } from "@/lib/db/repo";
import { LAST_SEEN_KEY, MANUAL_SYNC_COOLDOWN_MS, MANUAL_SYNC_KEY } from "@/lib/greeting";
import { getProvider } from "@/lib/providers";
import { type PlaceKind, areaNameFor, findPlace } from "@/lib/italy";
import { SEARCH_SETTINGS_KEY, bandKm, getSearchSettings, parseSearchSettings } from "@/lib/search-settings";
import { assertSession } from "@/lib/session";
import { syncFromProvider } from "@/lib/sync";
import type { SearchArea } from "@/lib/types";

const MAX_NOTE = 2000;

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, max);
  return text.length > 0 ? text : null;
}

function refreshAll() {
  revalidatePath("/", "layout");
}

export type AreaResult = {
  areaId: string;
  /** Listings fetched for the new area, or null when nothing was fetched (demo data). */
  fetched: number | null;
  error: string | null;
};

/** A new area gets its listings right away instead of waiting for the daily cron. */
async function withListings(area: SearchArea): Promise<AreaResult> {
  const provider = getProvider();
  if (provider.isMock) return { areaId: area.id, fetched: null, error: null };
  try {
    const repo = getRepo();
    const settings = await getSearchSettings(repo);
    const result = await syncFromProvider(repo, provider, [area], { bandKm: bandKm(settings) });
    // Adelka is looking at these right now; they are not news for tomorrow's greeting.
    await repo.setState(LAST_SEEN_KEY, new Date().toISOString());
    return {
      areaId: area.id,
      fetched: result.total,
      error: result.errors.length > 0 ? "Časť ponúk sa nepodarilo stiahnuť, doplnia sa pri ďalšej dennej kontrole." : null,
    };
  } catch (error) {
    console.error("Fetching listings for new area failed", error);
    return {
      areaId: area.id,
      fetched: 0,
      error: "Ponuky sa teraz nepodarilo stiahnuť, doplnia sa pri ďalšej dennej kontrole.",
    };
  }
}

export type SaveSettingsResult =
  | { ok: true; /** Listings fetched with the new setting, or null when nothing was fetched. */ fetched: number | null; error: string | null }
  | { ok: false; error: string };

/**
 * "Kde hľadať domček": stores the search setting (also used by the morning
 * cron) and, when the distance from the sea changed, fetches listings for it
 * right away.
 */
export async function saveSearchSettings(input: unknown): Promise<SaveSettingsResult> {
  await assertSession();
  const repo = getRepo();
  const settings = parseSearchSettings(input);
  const before = await getSearchSettings(repo);
  if (before.inland === settings.inland && before.inlandKm === settings.inlandKm) {
    return { ok: true, fetched: null, error: null };
  }
  if (!(await repo.setState(SEARCH_SETTINGS_KEY, settings))) {
    return { ok: false, error: "Nastavenie potrebuje databázovú migráciu (pozri README)." };
  }

  const provider = getProvider();
  const areas = await repo.listSearchAreas();
  let result: SaveSettingsResult = { ok: true, fetched: null, error: null };
  if (bandKm(before) !== bandKm(settings) && !provider.isMock && areas.length > 0) {
    try {
      const sync = await syncFromProvider(repo, provider, areas, { bandKm: bandKm(settings) });
      // Adelka is looking at these right now; they are not news for tomorrow's greeting.
      await repo.setState(LAST_SEEN_KEY, new Date().toISOString());
      result = {
        ok: true,
        fetched: sync.total,
        error: sync.errors.length > 0 ? "Časť ponúk sa nepodarilo stiahnuť, doplnia sa pri ďalšej dennej kontrole." : null,
      };
    } catch (error) {
      console.error("Fetching listings for new search settings failed", error);
      result = { ok: true, fetched: 0, error: "Nastavenie je uložené, ale ponuky sa teraz nepodarilo stiahnuť. Doplnia sa ráno." };
    }
  }
  refreshAll();
  return result;
}

/** Adelka has seen the news from the greeting (or dismissed it). */
export async function markNewsSeen() {
  await assertSession();
  await getRepo().setState(LAST_SEEN_KEY, new Date().toISOString());
}

export type CheckNowResult = { ok: true } | { ok: false; error: string };

/** "Pozrieť teraz": an on-demand sync, at most once an hour because every run costs Apify credit. */
export async function checkNow(): Promise<CheckNowResult> {
  await assertSession();
  const repo = getRepo();
  const provider = getProvider();
  if (provider.isMock) return { ok: false, error: "Pri ukážkových dátach nie je čo sťahovať." };

  const areas = await repo.listSearchAreas();
  if (areas.length === 0) return { ok: false, error: "Najprv si pridaj oblasť." };

  const last = await repo.getState<string>(MANUAL_SYNC_KEY);
  const waitMs = last ? Date.parse(last) + MANUAL_SYNC_COOLDOWN_MS - Date.now() : 0;
  if (waitMs > 0) return { ok: false, error: `Znova to pôjde o ${Math.ceil(waitMs / 60_000)} min.` };
  if (!(await repo.setState(MANUAL_SYNC_KEY, new Date().toISOString()))) {
    return { ok: false, error: "Ručné sťahovanie potrebuje databázovú migráciu (pozri README)." };
  }

  try {
    const settings = await getSearchSettings(repo);
    const result = await syncFromProvider(repo, provider, areas, { bandKm: bandKm(settings) });
    refreshAll();
    return result.errors.length > 0 && result.total === 0
      ? { ok: false, error: "Portály teraz neodpovedajú, skús to neskôr." }
      : { ok: true };
  } catch (error) {
    console.error("Manual sync failed", error);
    return { ok: false, error: "Portály teraz neodpovedajú, skús to neskôr." };
  }
}

/** Follows a whole region or a province picked on the map. */
export async function addPlaceArea(kind: PlaceKind, code: string): Promise<AreaResult> {
  await assertSession();
  const place = kind === "region" || kind === "province" ? findPlace(kind, String(code)) : undefined;
  if (!place) throw new Error("Neznámy región alebo provincia");
  const repo = getRepo();
  const name = areaNameFor(place);
  const existing = (await repo.listSearchAreas()).find((a) => a.name === name);
  if (existing) return { areaId: existing.id, fetched: null, error: null };
  const area = await repo.createSearchArea(name, place.geometry);
  const result = await withListings(area);
  refreshAll();
  return result;
}

export async function deleteArea(id: string) {
  await assertSession();
  await getRepo().deleteSearchArea(String(id));
  refreshAll();
}

/** Returns true when the listing is saved after the call. */
export async function toggleSaved(propertyId: string): Promise<boolean> {
  await assertSession();
  const repo = getRepo();
  const existing = (await repo.listSaved()).find((s) => s.property_id === propertyId);
  if (existing) {
    await repo.removeSaved(existing.id);
  } else {
    if (!(await repo.getProperty(propertyId))) throw new Error("Inzerát neexistuje");
    await repo.saveListing(propertyId, null);
  }
  refreshAll();
  return !existing;
}

export async function updateSavedNote(savedId: string, note: string) {
  await assertSession();
  await getRepo().updateSavedNote(String(savedId), cleanText(note, MAX_NOTE));
  refreshAll();
}

export async function removeSaved(savedId: string) {
  await assertSession();
  await getRepo().removeSaved(String(savedId));
  refreshAll();
}

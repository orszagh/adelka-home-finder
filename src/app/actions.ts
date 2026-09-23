"use server";

import { revalidatePath } from "next/cache";
import { getRepo } from "@/lib/db/repo";
import { normalizeGeometry } from "@/lib/geo";
import { getProvider } from "@/lib/providers";
import { REGION_PRESETS } from "@/lib/regions";
import { assertSession } from "@/lib/session";
import { syncFromProvider } from "@/lib/sync";
import type { SearchArea } from "@/lib/types";

const MAX_NAME = 80;
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
    const result = await syncFromProvider(getRepo(), provider, [area]);
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

export async function createArea(name: string, geometry: unknown): Promise<AreaResult> {
  await assertSession();
  const polygon = normalizeGeometry(geometry);
  if (!polygon) throw new Error("Neplatný tvar oblasti");
  const area = await getRepo().createSearchArea(cleanText(name, MAX_NAME) ?? "Moja oblasť", polygon);
  const result = await withListings(area);
  refreshAll();
  return result;
}

export async function createPresetArea(presetId: string): Promise<AreaResult> {
  await assertSession();
  const preset = REGION_PRESETS.find((p) => p.id === presetId);
  if (!preset) throw new Error("Neznámy región");
  const area = await getRepo().createSearchArea(preset.name, preset.polygon);
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

"use server";

import { revalidatePath } from "next/cache";
import { getRepo } from "@/lib/db/repo";
import { normalizeGeometry } from "@/lib/geo";
import { REGION_PRESETS } from "@/lib/regions";
import { assertSession } from "@/lib/session";

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

export async function createArea(name: string, geometry: unknown) {
  await assertSession();
  const polygon = normalizeGeometry(geometry);
  if (!polygon) throw new Error("Neplatný tvar oblasti");
  const area = await getRepo().createSearchArea(cleanText(name, MAX_NAME) ?? "Moja oblasť", polygon);
  refreshAll();
  return area;
}

export async function createPresetArea(presetId: string) {
  await assertSession();
  const preset = REGION_PRESETS.find((p) => p.id === presetId);
  if (!preset) throw new Error("Neznámy región");
  const area = await getRepo().createSearchArea(preset.name, preset.polygon);
  refreshAll();
  return area;
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

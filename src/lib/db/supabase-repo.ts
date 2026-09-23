import "server-only";
import type {
  AreaGeometry,
  LocationNote,
  Property,
  ProviderListing,
  SavedListing,
  SearchArea,
} from "../types";
import type { LocationNoteInput, Repository } from "./repo";
import { getSupabase } from "./supabase";

const PAGE_SIZE = 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(`Supabase: ${result.error.message}`);
  return result.data as T;
}

function toProperty(row: Record<string, unknown>): Property {
  return {
    ...(row as unknown as Property),
    price: row.price === null ? null : Number(row.price),
    area_sqm: row.area_sqm === null ? null : Number(row.area_sqm),
    previous_price: row.previous_price == null ? null : Number(row.previous_price),
    photos: Array.isArray(row.photos) ? (row.photos as string[]) : [],
  };
}

/** Postgres/PostgREST codes for a table or column that does not exist (migration not run yet). */
const MISSING_SCHEMA_CODES = new Set(["42P01", "42703", "PGRST204", "PGRST205"]);

let warnedMissingMigration = false;

function isMissingSchema(error: { code?: string } | null): boolean {
  if (!error?.code || !MISSING_SCHEMA_CODES.has(error.code)) return false;
  if (!warnedMissingMigration) {
    warnedMissingMigration = true;
    console.warn("Supabase migration supabase/migrations/20260924_privitanie.sql has not been run yet");
  }
  return true;
}

export class SupabaseRepository implements Repository {
  readonly kind = "supabase" as const;

  async listProperties() {
    const db = getSupabase();
    const rows: Property[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const page = check(
        await db
          .from("properties")
          .select("*")
          .order("first_seen_at", { ascending: false })
          .range(from, from + PAGE_SIZE - 1),
      ) as Record<string, unknown>[];
      rows.push(...page.map(toProperty));
      if (page.length < PAGE_SIZE) return rows;
    }
  }

  async getProperty(id: string) {
    if (!UUID.test(id)) return null;
    const row = check(
      await getSupabase().from("properties").select("*").eq("id", id).maybeSingle(),
    );
    return row ? toProperty(row) : null;
  }

  async upsertProperties(listings: ProviderListing[]) {
    if (listings.length === 0) return [];
    const now = new Date().toISOString();
    const rows = listings.map((l) => ({ ...l, last_seen_at: now }));
    const saved: Property[] = [];
    for (let i = 0; i < rows.length; i += PAGE_SIZE) {
      const data = check(
        await getSupabase()
          .from("properties")
          .upsert(rows.slice(i, i + PAGE_SIZE), { onConflict: "external_id" })
          .select("*"),
      ) as Record<string, unknown>[];
      saved.push(...data.map(toProperty));
    }
    return saved;
  }

  async deleteProperties(ids: string[]) {
    const db = getSupabase();
    // Keeps URLs (and PostgREST's `in` filter) short.
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      check(await db.from("saved_listings").delete().in("property_id", chunk));
      check(await db.from("properties").delete().in("id", chunk));
    }
  }

  async recordPriceChanges(changes: { id: string; previousPrice: number | null }[]) {
    const db = getSupabase();
    const now = new Date().toISOString();
    for (const { id, previousPrice } of changes) {
      const { error } = await db
        .from("properties")
        .update({ previous_price: previousPrice, price_changed_at: now })
        .eq("id", id);
      if (isMissingSchema(error)) return;
      if (error) throw new Error(`Supabase: ${error.message}`);
    }
  }

  async getState<T>(key: string) {
    const { data, error } = await getSupabase().from("app_state").select("value").eq("key", key).maybeSingle();
    if (isMissingSchema(error)) return null;
    if (error) throw new Error(`Supabase: ${error.message}`);
    return (data?.value as T | undefined) ?? null;
  }

  async setState(key: string, value: unknown) {
    const { error } = await getSupabase()
      .from("app_state")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (isMissingSchema(error)) return false;
    if (error) throw new Error(`Supabase: ${error.message}`);
    return true;
  }

  async listSearchAreas() {
    return check(
      await getSupabase()
        .from("search_areas")
        .select("*")
        .order("created_at", { ascending: true }),
    ) as SearchArea[];
  }

  async createSearchArea(name: string, polygon: AreaGeometry) {
    return check(
      await getSupabase()
        .from("search_areas")
        .insert({ name, polygon })
        .select("*")
        .single(),
    ) as SearchArea;
  }

  async deleteSearchArea(id: string) {
    check(await getSupabase().from("search_areas").delete().eq("id", id));
  }

  async listSaved() {
    return check(
      await getSupabase()
        .from("saved_listings")
        .select("*")
        .order("saved_at", { ascending: false }),
    ) as SavedListing[];
  }

  async saveListing(propertyId: string, note: string | null) {
    const db = getSupabase();
    const existing = check(
      await db
        .from("saved_listings")
        .select("*")
        .eq("property_id", propertyId)
        .limit(1)
        .maybeSingle(),
    ) as SavedListing | null;
    if (existing) return existing;
    return check(
      await db
        .from("saved_listings")
        .insert({ property_id: propertyId, note })
        .select("*")
        .single(),
    ) as SavedListing;
  }

  async updateSavedNote(id: string, note: string | null) {
    check(await getSupabase().from("saved_listings").update({ note }).eq("id", id));
  }

  async removeSaved(id: string) {
    check(await getSupabase().from("saved_listings").delete().eq("id", id));
  }

  async getLocationNote(city: string, region: string | null) {
    let query = getSupabase()
      .from("location_notes")
      .select("*")
      .eq("city", city)
      .order("generated_at", { ascending: false })
      .limit(1);
    query = region === null ? query.is("region", null) : query.eq("region", region);
    return check(await query.maybeSingle()) as LocationNote | null;
  }

  async upsertLocationNote(input: LocationNoteInput) {
    const db = getSupabase();
    const existing = await this.getLocationNote(input.city, input.region);
    const values = { ...input, generated_at: new Date().toISOString() };
    const result = existing
      ? await db.from("location_notes").update(values).eq("id", existing.id).select("*").single()
      : await db.from("location_notes").insert(values).select("*").single();
    return check(result) as LocationNote;
  }
}

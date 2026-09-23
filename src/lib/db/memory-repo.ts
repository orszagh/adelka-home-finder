import type {
  AreaGeometry,
  LocationNote,
  Property,
  ProviderListing,
  SavedListing,
  SearchArea,
} from "../types";
import type { LocationNoteInput, Repository } from "./repo";

const GLOBAL_KEY = Symbol.for("adelka.memoryRepository");

/**
 * Fallback used when Supabase is not configured (local development, tests).
 * Data lives only in the server process.
 */
export class MemoryRepository implements Repository {
  readonly kind = "memory" as const;
  private properties = new Map<string, Property>();
  private areas: SearchArea[] = [];
  private saved: SavedListing[] = [];
  private notes: LocationNote[] = [];
  private state = new Map<string, unknown>();

  static shared(): MemoryRepository {
    const g = globalThis as Record<symbol, unknown>;
    // After a hot reload the stored instance may come from an older version of this class.
    if (!(g[GLOBAL_KEY] instanceof MemoryRepository)) g[GLOBAL_KEY] = new MemoryRepository();
    return g[GLOBAL_KEY] as MemoryRepository;
  }

  async listProperties() {
    return [...this.properties.values()];
  }

  async getProperty(id: string) {
    return this.properties.get(id) ?? null;
  }

  async upsertProperties(listings: ProviderListing[]) {
    const now = new Date().toISOString();
    const byExternal = new Map(
      [...this.properties.values()].map((p) => [p.external_id, p]),
    );
    return listings.map((listing) => {
      const existing = byExternal.get(listing.external_id);
      const row: Property = existing
        ? { ...existing, ...listing, last_seen_at: now }
        : { ...listing, id: crypto.randomUUID(), first_seen_at: now, last_seen_at: now };
      this.properties.set(row.id, row);
      return row;
    });
  }

  async deleteProperties(ids: string[]) {
    const gone = new Set(ids);
    this.saved = this.saved.filter((s) => !gone.has(s.property_id));
    for (const id of ids) this.properties.delete(id);
  }

  async recordPriceChanges(changes: { id: string; previousPrice: number | null }[]) {
    const now = new Date().toISOString();
    for (const { id, previousPrice } of changes) {
      const row = this.properties.get(id);
      if (row) Object.assign(row, { previous_price: previousPrice, price_changed_at: now });
    }
  }

  async getState<T>(key: string) {
    return (this.state.get(key) as T | undefined) ?? null;
  }

  async setState(key: string, value: unknown) {
    this.state.set(key, value);
    return true;
  }

  async listSearchAreas() {
    return [...this.areas];
  }

  async createSearchArea(name: string, polygon: AreaGeometry) {
    const area: SearchArea = {
      id: crypto.randomUUID(),
      name,
      polygon,
      created_at: new Date().toISOString(),
    };
    this.areas.push(area);
    return area;
  }

  async deleteSearchArea(id: string) {
    this.areas = this.areas.filter((a) => a.id !== id);
  }

  async listSaved() {
    return [...this.saved];
  }

  async saveListing(propertyId: string, note: string | null) {
    const existing = this.saved.find((s) => s.property_id === propertyId);
    if (existing) return existing;
    const row: SavedListing = {
      id: crypto.randomUUID(),
      property_id: propertyId,
      note,
      saved_at: new Date().toISOString(),
    };
    this.saved.push(row);
    return row;
  }

  async updateSavedNote(id: string, note: string | null) {
    const row = this.saved.find((s) => s.id === id);
    if (row) row.note = note;
  }

  async removeSaved(id: string) {
    this.saved = this.saved.filter((s) => s.id !== id);
  }

  async getLocationNote(city: string, region: string | null) {
    return (
      this.notes.find((n) => n.city === city && (n.region ?? null) === region) ?? null
    );
  }

  async upsertLocationNote(input: LocationNoteInput) {
    const now = new Date().toISOString();
    const existing = await this.getLocationNote(input.city, input.region);
    if (existing) {
      Object.assign(existing, input, { generated_at: now });
      return existing;
    }
    const row: LocationNote = { ...input, id: crypto.randomUUID(), generated_at: now };
    this.notes.push(row);
    return row;
  }
}

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

  static shared(): MemoryRepository {
    const g = globalThis as Record<symbol, MemoryRepository | undefined>;
    g[GLOBAL_KEY] ??= new MemoryRepository();
    return g[GLOBAL_KEY];
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

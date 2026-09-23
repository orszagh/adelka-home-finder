import "server-only";
import type {
  AreaGeometry,
  LocationNote,
  Property,
  ProviderListing,
  SavedListing,
  SearchArea,
} from "../types";
import { isDbConfigured } from "./supabase";
import { MemoryRepository } from "./memory-repo";
import { SupabaseRepository } from "./supabase-repo";

export type LocationNoteInput = Omit<LocationNote, "id" | "generated_at">;

export interface Repository {
  readonly kind: "supabase" | "memory";

  listProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | null>;
  /** Inserts new listings and refreshes existing ones (matched by external_id). */
  upsertProperties(listings: ProviderListing[]): Promise<Property[]>;
  /** Deletes listings together with any saved entries pointing at them. */
  deleteProperties(ids: string[]): Promise<void>;

  listSearchAreas(): Promise<SearchArea[]>;
  createSearchArea(name: string, polygon: AreaGeometry): Promise<SearchArea>;
  deleteSearchArea(id: string): Promise<void>;

  listSaved(): Promise<SavedListing[]>;
  saveListing(propertyId: string, note: string | null): Promise<SavedListing>;
  updateSavedNote(id: string, note: string | null): Promise<void>;
  removeSaved(id: string): Promise<void>;

  getLocationNote(city: string, region: string | null): Promise<LocationNote | null>;
  upsertLocationNote(note: LocationNoteInput): Promise<LocationNote>;
}

let repo: Repository | undefined;

export function getRepo(): Repository {
  repo ??= isDbConfigured() ? new SupabaseRepository() : MemoryRepository.shared();
  return repo;
}

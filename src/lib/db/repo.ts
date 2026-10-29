import "server-only";
import type {
  AreaGeometry,
  GeoBox,
  ListingCardData,
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
  /** All listings with only their first photo: what the home page needs (much less to read). */
  listPropertiesLight(): Promise<Property[]>;
  /** What a listing card shows, for these ids (missing ones are left out). */
  listCards(ids: string[]): Promise<ListingCardData[]>;
  getProperty(id: string): Promise<Property | null>;
  /** Listings inside a small box on the map (latitude / longitude bounds), e.g. around one house. */
  listPropertiesIn(box: GeoBox): Promise<Property[]>;
  /** Inserts new listings and refreshes existing ones (matched by external_id). */
  upsertProperties(listings: ProviderListing[]): Promise<Property[]>;
  /** Deletes listings together with any saved entries pointing at them. */
  deleteProperties(ids: string[]): Promise<void>;
  /** Remembers the old price of listings whose price just changed (no-op before the migration). */
  recordPriceChanges(changes: { id: string; previousPrice: number | null }[]): Promise<void>;

  /** Small key/value store; returns null / false when the app_state table does not exist yet. */
  getState<T>(key: string): Promise<T | null>;
  setState(key: string, value: unknown): Promise<boolean>;

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

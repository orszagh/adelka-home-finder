export type Position = [lng: number, lat: number];

export type PolygonGeometry = { type: "Polygon"; coordinates: Position[][] };
export type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: Position[][][];
};
export type AreaGeometry = PolygonGeometry | MultiPolygonGeometry;

/** A listing as returned by a data provider, before it is stored. */
export type ProviderListing = {
  external_id: string;
  title: string;
  price: number | null;
  area_sqm: number | null;
  rooms: number | null;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  photos: string[];
  listing_url: string | null;
  source: string;
};

/** Row of the `properties` table. */
export type Property = ProviderListing & {
  id: string;
  first_seen_at: string;
  last_seen_at: string;
  /** Price before the last change; null until a change was seen (or before the migration). */
  previous_price?: number | null;
  price_changed_at?: string | null;
};

export type SearchArea = {
  id: string;
  name: string;
  polygon: AreaGeometry;
  created_at: string;
};

export type SavedListing = {
  id: string;
  property_id: string;
  note: string | null;
  saved_at: string;
};

export type LocationNote = {
  id: string;
  city: string;
  region: string | null;
  ai_summary: string | null;
  infrastructure_notes: string | null;
  climate_risk_notes: string | null;
  groundwater_risk_notes: string | null;
  generated_at: string;
};

export type PriceChange = { property: Property; previousPrice: number | null };

export type SyncResult = {
  total: number;
  /** The database was empty before this sync, so nothing in it is news. */
  initialImport: boolean;
  inserted: Property[];
  priceChanged: PriceChange[];
  /** Stale listings from another provider that were deleted. */
  removed: number;
  /** Partial failures reported by the provider. */
  errors: string[];
  /** Older listings asked about directly, and how many are still on offer. */
  rechecked?: { checked: number; alive: number };
};

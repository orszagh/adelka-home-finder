import type { ProviderListing } from "../types";
import type { PropertyProvider } from "./index";

type Town = { city: string; region: string; lat: number; lng: number };

const TOWNS: Town[] = [
  { city: "Sanremo", region: "Liguria", lat: 43.8159, lng: 7.7761 },
  { city: "Alassio", region: "Liguria", lat: 44.0079, lng: 8.173 },
  { city: "Finale Ligure", region: "Liguria", lat: 44.169, lng: 8.3436 },
  { city: "Camogli", region: "Liguria", lat: 44.349, lng: 9.155 },
  { city: "Sestri Levante", region: "Liguria", lat: 44.2717, lng: 9.3968 },
  { city: "Lerici", region: "Liguria", lat: 44.076, lng: 9.911 },
  { city: "Viareggio", region: "Toscana", lat: 43.8669, lng: 10.2503 },
  { city: "Castiglioncello", region: "Toscana", lat: 43.405, lng: 10.41 },
  { city: "San Vincenzo", region: "Toscana", lat: 43.096, lng: 10.54 },
  { city: "Follonica", region: "Toscana", lat: 42.926, lng: 10.761 },
  { city: "Castiglione della Pescaia", region: "Toscana", lat: 42.765, lng: 10.882 },
  { city: "Orbetello", region: "Toscana", lat: 42.441, lng: 11.212 },
  { city: "Vieste", region: "Puglia", lat: 41.882, lng: 16.175 },
  { city: "Polignano a Mare", region: "Puglia", lat: 40.996, lng: 17.22 },
  { city: "Monopoli", region: "Puglia", lat: 40.951, lng: 17.299 },
  { city: "Ostuni", region: "Puglia", lat: 40.729, lng: 17.577 },
  { city: "Otranto", region: "Puglia", lat: 40.147, lng: 18.491 },
  { city: "Gallipoli", region: "Puglia", lat: 40.056, lng: 17.992 },
];

const KINDS = [
  "Villetta con giardino",
  "Casa indipendente",
  "Bilocale vista mare",
  "Trilocale ristrutturato",
  "Rustico con terreno",
  "Casa semindipendente",
  "Attico con terrazza",
  "Villa con piscina",
];

const PER_TOWN = 2;

/** Deterministic PRNG so the mock data set is stable between runs. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildMockListings(): ProviderListing[] {
  const rand = mulberry32(20260923);
  const listings: ProviderListing[] = [];

  TOWNS.forEach((town, townIndex) => {
    for (let n = 0; n < PER_TOWN; n++) {
      const kind = KINDS[Math.floor(rand() * KINDS.length)];
      const rooms = 2 + Math.floor(rand() * 4);
      const area = Math.round(45 + rooms * 18 + rand() * 60);
      const pricePerSqm = town.region === "Liguria" ? 4200 : town.region === "Toscana" ? 3600 : 2300;
      const price = Math.round((area * pricePerSqm * (0.7 + rand() * 0.6)) / 1000) * 1000;
      const id = `mock-${townIndex + 1}-${n + 1}`;
      const source = rand() > 0.5 ? "immobiliare" : "idealista";
      listings.push({
        external_id: id,
        title: `${kind} a ${town.city}`,
        price,
        area_sqm: area,
        rooms,
        city: town.city,
        region: town.region,
        latitude: round(town.lat + (rand() - 0.5) * 0.02),
        longitude: round(town.lng + (rand() - 0.5) * 0.02),
        photos: [1, 2, 3, 4].map((p) => `/mock-photo/${id}-${p}.svg`),
        listing_url: null,
        source,
      });
    }
  });

  return listings;
}

function round(value: number) {
  return Math.round(value * 1e5) / 1e5;
}

export const mockProvider: PropertyProvider = {
  id: "mock",
  label: "Ukážkové dáta",
  isMock: true,
  ownsExternalId: (id) => id.startsWith("mock-"),
  async fetchListings() {
    return { listings: buildMockListings(), errors: [] };
  },
};

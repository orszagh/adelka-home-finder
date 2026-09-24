import { bandPolygon, coastChunks, coastLinesForArea } from "../../coast";
import { enclosingCircle, outerRings, ringArea } from "../../geo";
import type { Position, Property, ProviderListing, SearchArea } from "../../types";
import type { FetchOptions, FetchResult, PropertyProvider } from "../index";
import { ApifyError, runActor } from "./client";
import {
  IDEALISTA_ACTOR,
  idealistaCircleInput,
  idealistaInput,
  idealistaRecheckInput,
  mapIdealistaItem,
  readIdealistaRecheck,
} from "./idealista";
import { IMMOBILIARE_ACTOR, immobiliareInput, immobiliareRecheckInput, mapImmobiliareItem } from "./immobiliare";

function config() {
  return {
    maxItems: Number(process.env.APIFY_MAX_ITEMS) || 50,
    maxChargeUsd: Number(process.env.APIFY_MAX_CHARGE_USD) || 0.25,
    recheckMax: Number(process.env.APIFY_RECHECK_MAX) || 100,
  };
}

type Job = { label: string; run: () => Promise<ProviderListing[]> };

/** A region like Sicily has many islands; searching each would multiply the runs. */
const MAX_RINGS_PER_AREA = 3;

/** Coast pieces searched separately; the listings per portal are split among them, so costs stay the same. */
const MAX_COAST_CHUNKS = 4;
const MIN_ITEMS_PER_CHUNK = 15;

function jobsFor(area: SearchArea, bandKm: number | null): Job[] {
  const coast = bandKm === null ? null : coastLinesForArea(area);
  return coast && bandKm !== null ? coastJobs(area, coast, bandKm) : areaJobs(area);
}

/** Only the strip along the coast: Idealista in a circle around each piece, Immobiliare in a band around it. */
function coastJobs(area: SearchArea, coast: Position[][], bandKm: number): Job[] {
  const { maxItems, maxChargeUsd } = config();
  const chunks = coastChunks(coast, MAX_COAST_CHUNKS);
  const perChunk = Math.max(MIN_ITEMS_PER_CHUNK, Math.ceil(maxItems / chunks.length));
  return chunks.flatMap((chunk, i) => {
    const suffix = chunks.length > 1 ? ` · pobrežie ${i + 1}` : " · pobrežie";
    const { center, radiusKm } = enclosingCircle(chunk);
    return [
      {
        label: `Idealista – ${area.name}${suffix}`,
        run: async () =>
          (
            await runActor(IDEALISTA_ACTOR, idealistaCircleInput(center, radiusKm + bandKm, perChunk), {
              maxItems: perChunk,
              maxChargeUsd,
            })
          )
            .map(mapIdealistaItem)
            .filter((l) => l !== null),
      },
      {
        label: `Immobiliare – ${area.name}${suffix}`,
        run: async () =>
          (
            await runActor(IMMOBILIARE_ACTOR, immobiliareInput(bandPolygon(chunk, bandKm), perChunk), {
              maxItems: perChunk,
              maxChargeUsd,
            })
          )
            .map(mapImmobiliareItem)
            .filter((l) => l !== null),
      },
    ];
  });
}

/** The whole area (inland included, or an area that matches no coastal place). */
function areaJobs(area: SearchArea): Job[] {
  const { maxItems, maxChargeUsd } = config();
  const rings = outerRings(area.polygon)
    .sort((a, b) => ringArea(b) - ringArea(a))
    .slice(0, MAX_RINGS_PER_AREA);
  return rings.flatMap((ring, i) => {
    const suffix = rings.length > 1 ? ` #${i + 1}` : "";
    return [
      {
        label: `Idealista – ${area.name}${suffix}`,
        run: async () =>
          (await runActor(IDEALISTA_ACTOR, idealistaInput(ring, maxItems), { maxItems, maxChargeUsd }))
            .map(mapIdealistaItem)
            .filter((l) => l !== null),
      },
      {
        label: `Immobiliare – ${area.name}${suffix}`,
        run: async () =>
          (await runActor(IMMOBILIARE_ACTOR, immobiliareInput(ring, maxItems), { maxItems, maxChargeUsd }))
            .map(mapImmobiliareItem)
            .filter((l) => l !== null),
      },
    ];
  });
}

function recheckJobs(listings: Property[]): Job[] {
  const { maxChargeUsd, recheckMax } = config();
  const batch = listings.slice(0, recheckMax);
  const idealista = new Map(
    batch.filter((p) => p.external_id.startsWith("idealista-")).map((p) => [p.external_id.slice("idealista-".length), p]),
  );
  const immobiliareIds = batch
    .filter((p) => p.external_id.startsWith("immobiliare-"))
    .map((p) => p.external_id.slice("immobiliare-".length));

  const jobs: Job[] = [];
  if (idealista.size > 0) {
    jobs.push({
      label: "Idealista – overenie starších ponúk",
      run: async () => {
        const items = await runActor(IDEALISTA_ACTOR, idealistaRecheckInput([...idealista.keys()]), {
          maxItems: idealista.size,
          maxChargeUsd,
        });
        return items.flatMap((raw) => {
          const found = readIdealistaRecheck(raw);
          const known = found && idealista.get(found.code);
          return known ? [{ ...toListing(known), price: found.price ?? known.price }] : [];
        });
      },
    });
  }
  if (immobiliareIds.length > 0) {
    jobs.push({
      label: "Immobiliare – overenie starších ponúk",
      run: async () =>
        (
          await runActor(IMMOBILIARE_ACTOR, immobiliareRecheckInput(immobiliareIds), {
            maxItems: immobiliareIds.length,
            maxChargeUsd,
          })
        )
          .map(mapImmobiliareItem)
          .filter((l) => l !== null),
    });
  }
  return jobs;
}

function toListing(p: Property): ProviderListing {
  const { external_id, title, price, area_sqm, rooms, city, region, latitude, longitude, photos, listing_url, source } = p;
  return { external_id, title, price, area_sqm, rooms, city, region, latitude, longitude, photos, listing_url, source };
}

/** Runs jobs in parallel; partial failures become messages, total failure throws. */
async function runJobs(jobs: Job[]): Promise<FetchResult> {
  const settled = await Promise.allSettled(jobs.map((job) => job.run()));
  const listings: ProviderListing[] = [];
  const errors: string[] = [];
  settled.forEach((result, i) => {
    if (result.status === "fulfilled") listings.push(...result.value);
    else errors.push(`${jobs[i].label}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
  });
  if (jobs.length > 0 && errors.length === jobs.length) {
    throw new ApifyError(`Všetky Apify behy zlyhali. ${errors[0]}`);
  }
  return { listings, errors };
}

/**
 * Listings from Idealista.it and Immobiliare.it scraped by Apify Actors,
 * searched within each of Adelka's areas.
 */
export const apifyProvider: PropertyProvider = {
  id: "apify",
  label: "Idealista.it + Immobiliare.it (Apify)",
  isMock: false,
  ownsExternalId: (id) => id.startsWith("idealista-") || id.startsWith("immobiliare-"),
  fetchListings: (areas, options?: FetchOptions) =>
    runJobs(areas.flatMap((area) => jobsFor(area, options?.bandKm ?? null))),
  recheck: (listings) => runJobs(recheckJobs(listings)),
};

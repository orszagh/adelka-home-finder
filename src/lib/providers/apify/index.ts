import { outerRings } from "../../geo";
import type { Property, ProviderListing, SearchArea } from "../../types";
import type { FetchResult, PropertyProvider } from "../index";
import { ApifyError, runActor } from "./client";
import {
  IDEALISTA_ACTOR,
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

function jobsFor(area: SearchArea): Job[] {
  const { maxItems, maxChargeUsd } = config();
  return outerRings(area.polygon).flatMap((ring, i) => {
    const suffix = outerRings(area.polygon).length > 1 ? ` #${i + 1}` : "";
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
  fetchListings: (areas) => runJobs(areas.flatMap(jobsFor)),
  recheck: (listings) => runJobs(recheckJobs(listings)),
};

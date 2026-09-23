import { outerRings } from "../../geo";
import type { ProviderListing, SearchArea } from "../../types";
import type { FetchResult, PropertyProvider } from "../index";
import { ApifyError, runActor } from "./client";
import { IDEALISTA_ACTOR, idealistaInput, mapIdealistaItem } from "./idealista";
import { IMMOBILIARE_ACTOR, immobiliareInput, mapImmobiliareItem } from "./immobiliare";

function config() {
  return {
    maxItems: Number(process.env.APIFY_MAX_ITEMS) || 50,
    maxChargeUsd: Number(process.env.APIFY_MAX_CHARGE_USD) || 0.25,
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

/**
 * Listings from Idealista.it and Immobiliare.it scraped by Apify Actors,
 * searched within each of Adelka's areas.
 */
export const apifyProvider: PropertyProvider = {
  id: "apify",
  label: "Idealista.it + Immobiliare.it (Apify)",
  isMock: false,
  ownsExternalId: (id) => id.startsWith("idealista-") || id.startsWith("immobiliare-"),

  async fetchListings(areas: SearchArea[]): Promise<FetchResult> {
    const jobs = areas.flatMap(jobsFor);
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
  },
};

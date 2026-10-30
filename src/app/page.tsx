import { redirect } from "next/navigation";
import { HomeFinder } from "@/components/HomeFinder";
import { distanceToSeaKm } from "@/lib/coast";
import { rememberByPoint } from "@/lib/point-cache";
import { dedupe } from "@/lib/duplicates";
import { findNewIds, findPriceDrops, getProperties } from "@/lib/data";
import { getRepo } from "@/lib/db/repo";
import { LAST_SEEN_KEY, MANUAL_SYNC_KEY, buildGreeting, manualSyncWaitMinutes } from "@/lib/greeting";
import { insideAreas } from "@/lib/geo";
import { encodeIndex } from "@/lib/listing-index";
import { regionOf } from "@/lib/regions";
import { getDataNotices } from "@/lib/notices";
import { getProvider } from "@/lib/providers";
import { getSeenIds } from "@/lib/seen";
import { bandKm, formatSearchSettings, getSearchSettings, withinBand } from "@/lib/search-settings";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";
/** Creating an area or "Pozrieť teraz" fetches listings from Apify inside the server action. */
export const maxDuration = 300;

/** Km to the sea, remembered per spot (houses do not move, the coast neither). */
const seaKmAt = rememberByPoint((key) => {
  const [lng, lat] = key.split(",").map(Number);
  return Math.round(distanceToSeaKm(lng, lat) * 10) / 10;
});

export default async function Home() {
  if (!(await hasSession())) redirect("/prihlasenie");
  const repo = getRepo();
  const [allProperties, areas, saved, lastSeen, lastManualSync, settings, seenIds] = await Promise.all([
    getProperties(),
    repo.listSearchAreas(),
    repo.listSaved(),
    repo.getState<string>(LAST_SEEN_KEY),
    repo.getState<string>(MANUAL_SYNC_KEY),
    getSearchSettings(repo),
    getSeenIds(repo),
  ]);

  // Regions, counts and the greeting show only houses within the chosen distance of the sea; the
  // circle around Adelka shows every stored house, so the others go along, marked.
  const band = bandKm(settings);
  const withSea = allProperties.map((p) => ({ ...p, sea_km: seaKmAt(`${p.longitude},${p.latitude}`) }));
  // The same house on both portals: one card (the saved one stays, so her heart and note do too).
  const { listings: all, twins } = dedupe(withSea, new Set(saved.map((s) => s.property_id)));
  const properties = all.filter((p) => withinBand(p.sea_km, band));
  const seen = new Set(seenIds);
  for (const [id, others] of Object.entries(twins)) if (others.some((t) => seen.has(t.id))) seen.add(id);
  const twinSources = Object.fromEntries(Object.entries(twins).map(([id, others]) => [id, others.map((t) => t.source)]));

  // First visit: start counting from now instead of greeting with everything.
  if (lastSeen === null) await repo.setState(LAST_SEEN_KEY, new Date().toISOString());
  const greeting = lastSeen ? buildGreeting(insideAreas(properties, areas), lastSeen) : null;
  // Badges (Nové, zlacnel) on every card, the circle around Adelka included.
  const freshIds = new Set(findNewIds(all));

  return (
    <HomeFinder
      // Only the numbers of each listing go to the phone; cards are fetched for the houses on screen.
      index={encodeIndex(
        all.map((p) => ({ ...p, region_code: regionOf(p), is_new: freshIds.has(p.id), in_band: withinBand(p.sea_km, band) })),
      )}
      areas={areas}
      savedIds={saved.map((s) => s.property_id)}
      seenIds={[...seen]}
      twinSources={twinSources}
      priceDrops={findPriceDrops(all)}
      greeting={greeting}
      manualSync={getProvider().isMock ? null : { waitMinutes: manualSyncWaitMinutes(lastManualSync) }}
      notices={getDataNotices({ areaCount: areas.length })}
      settingsLabel={formatSearchSettings(settings)}
      costPerAreaUsd={getProvider().costPerAreaUsd?.() ?? null}
    />
  );
}

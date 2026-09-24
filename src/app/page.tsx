import { redirect } from "next/navigation";
import { HomeFinder } from "@/components/HomeFinder";
import { distanceToSeaKm } from "@/lib/coast";
import { findNewIds, findPriceDrops, getProperties } from "@/lib/data";
import { getRepo } from "@/lib/db/repo";
import { LAST_SEEN_KEY, MANUAL_SYNC_KEY, buildGreeting, manualSyncWaitMinutes } from "@/lib/greeting";
import { insideAreas } from "@/lib/geo";
import { getDataNotices } from "@/lib/notices";
import { getProvider } from "@/lib/providers";
import { bandKm, formatSearchSettings, getSearchSettings, withinBand } from "@/lib/search-settings";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";
/** Creating an area or "Pozrieť teraz" fetches listings from Apify inside the server action. */
export const maxDuration = 300;

export default async function Home() {
  if (!(await hasSession())) redirect("/prihlasenie");
  const repo = getRepo();
  const [allProperties, areas, saved, lastSeen, lastManualSync, settings] = await Promise.all([
    getProperties(),
    repo.listSearchAreas(),
    repo.listSaved(),
    repo.getState<string>(LAST_SEEN_KEY),
    repo.getState<string>(MANUAL_SYNC_KEY),
    getSearchSettings(repo),
  ]);

  // Only houses within the chosen distance of the sea; the rest stay in the database, hidden.
  const band = bandKm(settings);
  const properties = allProperties
    .map((p) => ({ ...p, sea_km: Math.round(distanceToSeaKm(p.longitude, p.latitude) * 10) / 10 }))
    .filter((p) => withinBand(p.sea_km, band));

  // First visit: start counting from now instead of greeting with everything.
  if (lastSeen === null) await repo.setState(LAST_SEEN_KEY, new Date().toISOString());
  const greeting = lastSeen ? buildGreeting(insideAreas(properties, areas), lastSeen) : null;

  return (
    <HomeFinder
      properties={properties}
      areas={areas}
      savedIds={saved.map((s) => s.property_id)}
      newIds={findNewIds(properties)}
      priceDrops={findPriceDrops(properties)}
      greeting={greeting}
      manualSync={getProvider().isMock ? null : { waitMinutes: manualSyncWaitMinutes(lastManualSync) }}
      notices={getDataNotices({ areaCount: areas.length })}
      settingsLabel={formatSearchSettings(settings)}
    />
  );
}

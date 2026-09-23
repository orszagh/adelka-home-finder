import { HomeFinder } from "@/components/HomeFinder";
import { findNewIds, getProperties } from "@/lib/data";
import { getRepo } from "@/lib/db/repo";
import { redirect } from "next/navigation";
import { getDataNotices } from "@/lib/notices";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";
/** Creating an area fetches its listings from Apify inside the server action. */
export const maxDuration = 300;

export default async function Home() {
  if (!(await hasSession())) redirect("/prihlasenie");
  const repo = getRepo();
  const [properties, areas, saved] = await Promise.all([
    getProperties(),
    repo.listSearchAreas(),
    repo.listSaved(),
  ]);

  return (
    <HomeFinder
      properties={properties}
      areas={areas}
      savedIds={saved.map((s) => s.property_id)}
      newIds={findNewIds(properties)}
      notices={getDataNotices({ areaCount: areas.length })}
    />
  );
}

import { HomeFinder } from "@/components/HomeFinder";
import { findNewIds, getProperties } from "@/lib/data";
import { getRepo } from "@/lib/db/repo";
import { getDataNotices } from "@/lib/notices";

export const dynamic = "force-dynamic";

export default async function Home() {
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
      notices={getDataNotices()}
    />
  );
}

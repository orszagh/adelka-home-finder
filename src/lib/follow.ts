import { PROVINCES, type Place, REGIONS, areaNameFor, provincesOf } from "./italy";

/**
 * What Adelka follows, region by region. A whole region is one search (cheap: the provider splits
 * its listings along the coast); single provinces are a search each. Never both for one region.
 */
export type RegionFollow = { whole: boolean; provinces: Set<string> };

/** Region code → what is followed there (only regions with something followed). */
export function followedByRegion(areaNames: Iterable<string>): Map<string, RegionFollow> {
  const names = new Set(areaNames);
  const result = new Map<string, RegionFollow>();
  for (const region of REGIONS) {
    const all = provincesOf(region.code);
    if (names.has(areaNameFor(region))) {
      result.set(region.code, { whole: true, provinces: new Set(all.map((p) => p.code)) });
      continue;
    }
    const chosen = all.filter((p) => names.has(areaNameFor(p)));
    if (chosen.length > 0) result.set(region.code, { whole: false, provinces: new Set(chosen.map((p) => p.code)) });
  }
  return result;
}

/** The areas a region should have for the chosen provinces: all of them = the region itself. */
export function targetPlaces(regionCode: string, chosen: ReadonlySet<string>): Place[] {
  const all = provincesOf(regionCode);
  const picked = all.filter((p) => chosen.has(p.code));
  if (picked.length === 0) return [];
  if (picked.length === all.length) return REGIONS.filter((r) => r.code === regionCode);
  return picked;
}

/** What to create and which stored areas (by name) to remove so the region matches the choice. */
export function planFollow(
  regionCode: string,
  chosen: ReadonlySet<string>,
  areaNames: Iterable<string>,
): { create: Place[]; remove: string[] } {
  const names = new Set(areaNames);
  const target = targetPlaces(regionCode, chosen);
  const wanted = new Set(target.map(areaNameFor));
  const region = REGIONS.find((r) => r.code === regionCode);
  const ofRegion = [...(region ? [region] : []), ...provincesOf(regionCode)].map(areaNameFor);
  return {
    create: target.filter((p) => !names.has(areaNameFor(p))),
    remove: ofRegion.filter((name) => names.has(name) && !wanted.has(name)),
  };
}

/** Provinces whose whole region is followed too are searched with it, not again on their own. */
export function withoutOverlaps<T extends { name: string }>(areas: T[]): T[] {
  const names = new Set(areas.map((a) => a.name));
  const covered = new Set(
    PROVINCES.filter((p) => {
      const region = REGIONS.find((r) => r.code === p.regionCode);
      return region !== undefined && names.has(areaNameFor(region));
    }).map(areaNameFor),
  );
  return areas.filter((a) => !covered.has(a.name));
}

/** Areas searched each morning once a region's choice is applied to what is stored. */
export function areaNamesAfter(regionCode: string, chosen: ReadonlySet<string>, areaNames: Iterable<string>): string[] {
  const { create, remove } = planFollow(regionCode, chosen, areaNames);
  const removed = new Set(remove);
  return withoutOverlaps(
    [...new Set([...areaNames].filter((n) => !removed.has(n)).concat(create.map(areaNameFor)))].map((name) => ({ name })),
  ).map((a) => a.name);
}

/** At most what the morning check costs a day / a month (30 days) for this many searches. */
export function morningCostUsd(searches: number, costPerAreaUsd: number): { daily: number; monthly: number } {
  const daily = searches * costPerAreaUsd;
  return { daily, monthly: daily * 30 };
}

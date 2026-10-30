import { describe, expect, it } from "vitest";
import { areaNamesAfter, followedByRegion, morningCostUsd, planFollow, withoutOverlaps } from "./follow";

const LIGURIA_WHOLE = "Ligúria (celý región)";
const LIGURIA = ["Imperia", "Savona", "Genova", "La Spezia"];
const ALL = new Set(["IM", "SV", "GE", "SP"]);

describe("followedByRegion", () => {
  it("shows a whole region with all its provinces ticked", () => {
    const liguria = followedByRegion([LIGURIA_WHOLE, "Genova"]).get("07");
    expect(liguria).toEqual({ whole: true, provinces: ALL });
  });

  it("lists single provinces", () => {
    expect(followedByRegion(["Lucca", "Pisa"]).get("09")).toEqual({ whole: false, provinces: new Set(["LU", "PI"]) });
    expect(followedByRegion(["Lucca"]).has("07")).toBe(false);
  });
});

describe("planFollow", () => {
  it("turns today's region + 4 provinces into the region alone", () => {
    expect(planFollow("07", ALL, [LIGURIA_WHOLE, ...LIGURIA])).toEqual({ create: [], remove: LIGURIA });
  });

  it("keeps the ticked provinces when one is unticked", () => {
    const { create, remove } = planFollow("07", new Set(["IM", "SV", "GE"]), [LIGURIA_WHOLE]);
    expect(create.map((p) => p.name)).toEqual(["Imperia", "Savona", "Genova"]);
    expect(remove).toEqual([LIGURIA_WHOLE]);
  });

  it("stores all provinces ticked one by one as the whole region", () => {
    const { create, remove } = planFollow("07", ALL, ["Imperia"]);
    expect(create.map((p) => p.name)).toEqual(["Ligúria"]);
    expect(remove).toEqual(["Imperia"]);
  });

  it("removes everything of the region when nothing is ticked, and leaves other regions alone", () => {
    expect(planFollow("07", new Set(), [LIGURIA_WHOLE, "Lucca"])).toEqual({ create: [], remove: [LIGURIA_WHOLE] });
  });
});

describe("withoutOverlaps", () => {
  it("skips provinces whose region is searched whole", () => {
    const areas = [LIGURIA_WHOLE, ...LIGURIA, "Lucca"].map((name) => ({ name }));
    expect(withoutOverlaps(areas).map((a) => a.name)).toEqual([LIGURIA_WHOLE, "Lucca"]);
  });
});

describe("morning cost", () => {
  it("counts the searches after the change", () => {
    expect(areaNamesAfter("07", ALL, [LIGURIA_WHOLE, ...LIGURIA, "Lucca"])).toEqual([LIGURIA_WHOLE, "Lucca"]);
    expect(morningCostUsd(2, 0.29)).toEqual({ daily: 0.58, monthly: 0.58 * 30 });
  });
});

import { describe, expect, it } from "vitest";
import { checkBudget, formatUsage } from "./budget";

const cycle = { cycleStart: "2026-10-23T00:00:00.000Z", cycleEnd: "2026-11-22T23:59:59.999Z" };
const at = (iso: string) => Date.parse(iso);

describe("Apify budget", () => {
  it("stops everything once the month's budget is spent", () => {
    const check = checkBudget({ ...cycle, usedUsd: 4.6 }, 4.5, "manual", at("2026-11-10T12:00:00Z"));
    expect(check).toMatchObject({ allowed: false, hard: true });
    expect(check.allowed === false && check.reason).toContain("23. 11.");
  });

  it("paces the nightly sync over the cycle, but lets Adelka fetch by hand", () => {
    // A quarter of the cycle gone, half of the budget spent: tonight is skipped.
    const early = at("2026-10-30T12:00:00Z");
    expect(checkBudget({ ...cycle, usedUsd: 2.25 }, 4.5, "nightly", early)).toMatchObject({ allowed: false, hard: false });
    expect(checkBudget({ ...cycle, usedUsd: 2.25 }, 4.5, "manual", early)).toEqual({ allowed: true });
    // On pace (plus a little slack) the night runs.
    expect(checkBudget({ ...cycle, usedUsd: 1.2 }, 4.5, "nightly", early)).toEqual({ allowed: true });
    expect(checkBudget({ ...cycle, usedUsd: 0.55 }, 4.5, "nightly", at("2026-10-27T03:00:00Z"))).toEqual({ allowed: true });
  });

  it("formats the usage for the settings page", () => {
    expect(formatUsage(0.5485, 4.5)).toBe("0,55 $ z 4,50 $");
  });
});

import { describe, expect, it } from "vitest";
import { opensPerDay, whenLabel } from "./activity";

describe("Adelka's activity", () => {
  const now = new Date("2026-10-29T15:00:00Z");

  it("counts opens per day in Italy", () => {
    const days = opensPerDay(["2026-10-29T08:00:00Z", "2026-10-29T12:00:00Z", "2026-10-28T23:30:00Z", "2026-10-27T10:00:00Z"], 3, now);
    expect(days.map((d) => [d.day, d.count])).toEqual([
      ["2026-10-27", 1],
      ["2026-10-28", 0],
      ["2026-10-29", 3],
    ]);
  });

  it("says when, the short way", () => {
    expect(whenLabel("2026-10-29T13:32:00Z", now)).toBe("dnes o 14:32");
    expect(whenLabel("2026-10-28T08:10:00Z", now)).toBe("včera o 9:10");
    expect(whenLabel("2026-10-26T17:05:00Z", now)).toMatch(/26\. 10\. o 18:05$/);
  });
});

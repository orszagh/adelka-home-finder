import { describe, expect, it } from "vitest";
import { parseVisit, plannedVisits, todayInItaly, visitWhen } from "./visits";

describe("viewings", () => {
  it("accepts only known states and well-formed dates", () => {
    expect(parseVisit({ status: "booked", date: "2026-10-31", time: "15:00" })).toEqual({
      status: "booked",
      date: "2026-10-31",
      time: "15:00",
    });
    expect(parseVisit({ status: "booked", date: "31.10.", time: "3pm" })).toEqual({ status: "booked", date: null, time: null });
    expect(parseVisit({ status: "sold" })).toBeNull();
  });

  it("lists booked viewings soonest first", () => {
    const at = "2026-10-29T00:00:00Z";
    const planned = plannedVisits({
      x: { status: "booked", date: "2026-11-02", time: "10:00", updated_at: at },
      y: { status: "booked", date: "2026-10-31", time: "15:00", updated_at: at },
      z: { status: "written", date: null, time: null, updated_at: at },
    });
    expect(planned.map(([id]) => id)).toEqual(["y", "x"]);
  });

  it("writes the day the Slovak way and knows today in Italy", () => {
    expect(visitWhen({ date: "2026-10-31", time: "15:00" })).toBe("so 31. 10. o 15:00");
    expect(todayInItaly(new Date("2026-10-29T23:30:00Z"))).toBe("2026-10-30");
  });
});

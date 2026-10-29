import { describe, expect, it } from "vitest";
import type { Property } from "./types";
import { buildVisitIcs, italyToUtc } from "./visit-calendar";

const property: Property = {
  id: "p1",
  external_id: "x",
  title: "Casa vista mare, con giardino e terrazza panoramica sul golfo di Diano Marina",
  price: 185000,
  area_sqm: 70,
  rooms: 3,
  city: "Diano Marina",
  region: "Liguria",
  latitude: 43.9,
  longitude: 8.08,
  photos: [],
  listing_url: "https://www.idealista.it/immobile/1/",
  source: "idealista",
  first_seen_at: "",
  last_seen_at: "",
};

describe("visit calendar", () => {
  it("turns Italian time into UTC in summer and winter", () => {
    expect(italyToUtc("2026-07-10", "10:00").toISOString()).toBe("2026-07-10T08:00:00.000Z");
    expect(italyToUtc("2026-11-05", "15:30").toISOString()).toBe("2026-11-05T14:30:00.000Z");
  });

  it("has the time in UTC and reminders the day before and two hours before", () => {
    const ics = buildVisitIcs(property, { date: "2026-11-05", time: "15:30" }, "https://app.test")!;
    expect(ics).toContain("DTSTART:20261105T143000Z");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).toContain("TRIGGER:-PT2H");
    expect(ics).toContain("SUMMARY:Obhliadka: Diano Marina");
    expect(ics.endsWith("\r\n")).toBe(true);
  });

  it("is a whole-day event without a time, reminding at 9:00 the day before", () => {
    const ics = buildVisitIcs(property, { date: "2026-11-05", time: null }, "https://app.test")!;
    expect(ics).toContain("DTSTART;VALUE=DATE:20261105");
    expect(ics).toContain("TRIGGER:-PT15H");
  });

  it("returns nothing without a date", () => {
    expect(buildVisitIcs(property, { date: null, time: null }, "https://app.test")).toBeNull();
  });

  it("keeps every line within 75 bytes", () => {
    const ics = buildVisitIcs(property, { date: "2026-11-05", time: "15:30" }, "https://app.test")!;
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});

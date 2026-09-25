import { describe, expect, it } from "vitest";
import { buildGreeting } from "./greeting";
import { isStale, recheckCandidates, recentPriceDrop } from "./freshness";
import type { Property } from "./types";

function property(id: string, overrides: Partial<Property> = {}): Property {
  return {
    id,
    external_id: `idealista-${id}`,
    title: "Casa",
    price: 200_000,
    area_sqm: 90,
    rooms: 3,
    city: "Sanremo",
    region: "Imperia",
    latitude: 43.8,
    longitude: 7.7,
    photos: [],
    listing_url: null,
    source: "idealista",
    first_seen_at: "2026-09-20T10:00:00Z",
    last_seen_at: "2026-09-24T03:00:00Z",
    previous_price: null,
    price_changed_at: null,
    ...overrides,
  };
}

const lastSeen = "2026-09-23T19:00:00Z";
// 06:30 in Bratislava (CEST, UTC+2)
const morning = new Date("2026-09-24T04:30:00Z");

describe("buildGreeting", () => {
  it("greets in the morning with new and cheaper listings", () => {
    const greeting = buildGreeting(
      [
        property("old"),
        property("n1", { first_seen_at: "2026-09-24T03:05:00Z" }),
        property("n2", { first_seen_at: "2026-09-24T03:06:00Z" }),
        property("drop", { price: 180_000, previous_price: 200_000, price_changed_at: "2026-09-24T03:07:00Z" }),
      ],
      lastSeen,
      morning,
    )!;
    expect(greeting.title).toBe("Buongiorno, Adelka");
    expect(greeting.eyebrow).toMatch(/^[A-ZŠČŽ][a-zá-ž]+ ráno$/);
    expect(greeting.message).toBe(
      "Lubko ti v noci našiel 2 nové inzeráty (a 1 zlacnený). Pozri si ich pri kávičke.",
    );
    expect(greeting.ids).toEqual(["n1", "n2", "drop"]);
  });

  it("adapts to the time of day and wording", () => {
    const listings = Array.from({ length: 5 }, (_, i) => property(`n${i}`, { first_seen_at: "2026-09-24T03:00:00Z" }));
    const evening = buildGreeting(listings, lastSeen, new Date("2026-09-24T18:00:00Z"))!;
    expect(evening.title).toBe("Buonasera, Adelka");
    expect(evening.message).toMatch(/^Lubko ti od tvojej poslednej návštevy našiel 5 nových inzerátov\./);

    const onlyCheaper = buildGreeting(
      [property("d", { price: 1, previous_price: 2, price_changed_at: "2026-09-24T03:00:00Z" })],
      lastSeen,
      new Date("2026-09-24T10:00:00Z"),
    )!;
    expect(onlyCheaper.title).toBe("Buon pomeriggio, Adelka");
    expect(onlyCheaper.message).toContain("našiel 1 zlacnený inzerát.");
  });

  it("stays quiet when nothing changed since the last visit or prices rose", () => {
    expect(buildGreeting([property("old")], lastSeen, morning)).toBeNull();
    expect(
      buildGreeting([property("up", { price: 3, previous_price: 2, price_changed_at: "2026-09-24T03:00:00Z" })], lastSeen, morning),
    ).toBeNull();
  });
});

describe("freshness", () => {
  const now = Date.parse("2026-09-24T12:00:00Z");

  it("hides listings not confirmed for four days", () => {
    expect(isStale({ last_seen_at: "2026-09-21T12:00:00Z" }, now)).toBe(false);
    expect(isStale({ last_seen_at: "2026-09-20T11:00:00Z" }, now)).toBe(true);
  });

  it("re-checks only unseen listings between 36 h and 10 days, oldest first", () => {
    const candidates = recheckCandidates(
      [
        property("fresh", { last_seen_at: "2026-09-24T03:00:00Z" }),
        property("two-days", { last_seen_at: "2026-09-22T03:00:00Z" }),
        property("three-days", { last_seen_at: "2026-09-21T03:00:00Z" }),
        property("seen-now", { last_seen_at: "2026-09-21T03:00:00Z" }),
        property("gone", { last_seen_at: "2026-09-10T03:00:00Z" }),
      ],
      new Set(["idealista-seen-now"]),
      now,
    );
    expect(candidates.map((p) => p.id)).toEqual(["three-days", "two-days"]);
  });

  it("reports only recent drops", () => {
    const p = property("d", { price: 180_000, previous_price: 200_000, price_changed_at: "2026-09-24T03:00:00Z" });
    expect(recentPriceDrop(p, Date.parse(lastSeen))).toBe(200_000);
    expect(recentPriceDrop(p, Date.parse("2026-09-24T05:00:00Z"))).toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { pointInArea, polygonFromLatLngs } from "../../geo";
import { findPlace } from "../../italy";
import type { Position, SearchArea } from "../../types";
import idealistaFixture from "./fixtures/idealista-sanremo.json";
import immobiliareFixture from "./fixtures/immobiliare-sanremo.json";
import { IDEALISTA_ACTOR, idealistaInput, mapIdealistaItem } from "./idealista";
import { IMMOBILIARE_ACTOR, immobiliareInput, immobiliareSearchUrl, mapImmobiliareItem } from "./immobiliare";
import { apifyProvider } from "./index";
import { cleanTitle, num } from "./parse";

const sanremo: SearchArea = {
  id: "a1",
  name: "Sanremo",
  created_at: "2026-09-24T00:00:00Z",
  polygon: polygonFromLatLngs([
    [43.835, 7.745],
    [43.84, 7.8],
    [43.805, 7.8],
    [43.8, 7.745],
  ]),
};
const ring = (sanremo.polygon.coordinates as Position[][])[0];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Idealista mapping (real Sanremo output)", () => {
  it("maps listings with coordinates, photos and province", () => {
    const listings = idealistaFixture.map(mapIdealistaItem);
    expect(listings.every((l) => l !== null)).toBe(true);
    const [first] = listings;
    expect(first).toMatchObject({
      external_id: "idealista-36915294",
      title: "Casa indipendente in Via Galileo Galilei, 180, Corso degli Inglesi, Sanremo",
      price: 325000,
      area_sqm: 175,
      rooms: 5,
      city: "Sanremo",
      region: "Imperia",
      listing_url: "https://www.idealista.it/immobile/36915294/",
      source: "idealista",
    });
    expect(first!.photos[0]).toContain("/blur/WEB_DETAIL-M/");
    expect(listings.every((l) => pointInArea(l!.longitude, l!.latitude, sanremo.polygon))).toBe(true);
  });

  it("skips items without id or coordinates", () => {
    expect(mapIdealistaItem({ propertyCode: "1" })).toBeNull();
    expect(mapIdealistaItem({ latitude: 1, longitude: 2 })).toBeNull();
    expect(mapIdealistaItem(null)).toBeNull();
  });

  it("searches the circle around the area", () => {
    const input = idealistaInput(ring, 50);
    expect(input).toMatchObject({ country: "it", operation: "sale", propertyType: "homes", sortBy: "mostRecent", maxItems: 50 });
    expect(input.latitude).toBeCloseTo(43.82, 2);
    expect(input.longitude).toBeCloseTo(7.7725, 3);
    expect(input.distanceKm).toBe(4);
  });
});

describe("Immobiliare mapping (real Sanremo output)", () => {
  it("maps listings with coordinates, photos and province", () => {
    const listings = immobiliareFixture.map(mapImmobiliareItem);
    expect(listings.every((l) => l !== null)).toBe(true);
    expect(listings[0]).toMatchObject({
      external_id: "immobiliare-128080462",
      title: "Appartamento con terrazzo e vista sul golfo di Sanremo",
      price: 690000,
      area_sqm: 104,
      rooms: 5,
      city: "Sanremo",
      region: "Imperia",
      listing_url: "https://www.immobiliare.it/annunci/128080462/",
      source: "immobiliare",
    });
    expect(listings[0]!.photos[0]).toBe("https://pwm.im-cdn.it/image/1899994586/xxl.jpg");
    expect(listings.every((l) => pointInArea(l!.longitude, l!.latitude, sanremo.polygon))).toBe(true);
  });

  it("hides the price when the listing does", () => {
    const [item] = immobiliareFixture;
    expect(mapImmobiliareItem({ ...item, price: { raw: 1, isHidden: true } })!.price).toBeNull();
  });

  it("searches exactly the drawn polygon", () => {
    const url = new URL(immobiliareSearchUrl(ring));
    expect(url.pathname).toBe("/search-list/");
    expect(url.searchParams.get("idContratto")).toBe("1");
    expect(url.searchParams.get("vrt")).toBe("43.83500,7.74500;43.84000,7.80000;43.80500,7.80000;43.80000,7.74500");
    expect(immobiliareInput(ring, 20)).toMatchObject({ maxItems: 20, sortBy: "mostRecent" });
  });
});

describe("parse helpers", () => {
  it("reads numbers the scrapers produce", () => {
    expect(num("5+")).toBe(5);
    expect(num("104 m²")).toBe(104);
    expect(num("1.5")).toBe(1.5);
    expect(num(null)).toBeNull();
    expect(num(Number.NaN)).toBeNull();
  });

  it("calms shouting captions", () => {
    expect(cleanTitle("SANREMO VIA GUGLIELMO MARCONI N.124", "x")).toBe("Sanremo via guglielmo marconi n.124");
    expect(cleanTitle(null, "Villa a Sanremo")).toBe("Villa a Sanremo");
  });
});

describe("apifyProvider", () => {
  it("runs both actors per area through the Apify REST API", async () => {
    vi.stubEnv("APIFY_TOKEN", "apify_test");
    vi.stubEnv("APIFY_MAX_ITEMS", "20");
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async (url) =>
      Response.json(url.includes(IDEALISTA_ACTOR) ? idealistaFixture : immobiliareFixture),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { listings, errors } = await apifyProvider.fetchListings([sanremo]);
    expect(errors).toEqual([]);
    expect(listings).toHaveLength(idealistaFixture.length + immobiliareFixture.length);
    expect(new Set(listings.map((l) => l.source))).toEqual(new Set(["idealista", "immobiliare"]));

    const urls = fetchMock.mock.calls.map(([u]) => new URL(u));
    expect(urls.map((u) => u.pathname).sort()).toEqual([
      `/v2/acts/${IDEALISTA_ACTOR}/run-sync-get-dataset-items`,
      `/v2/acts/${IMMOBILIARE_ACTOR}/run-sync-get-dataset-items`,
    ]);
    expect(urls[0].searchParams.get("maxItems")).toBe("20");
    expect(urls[0].searchParams.get("maxTotalChargeUsd")).toBe("0.25");
    const init = fetchMock.mock.calls[0][1]!;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer apify_test");
  });

  it("keeps working when one portal fails, fails when all do", async () => {
    vi.stubEnv("APIFY_TOKEN", "apify_test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes(IDEALISTA_ACTOR) ? Response.json(idealistaFixture) : new Response("blocked", { status: 502 }),
      ),
    );
    const partial = await apifyProvider.fetchListings([sanremo]);
    expect(partial.listings).toHaveLength(idealistaFixture.length);
    expect(partial.errors[0]).toMatch(/^Immobiliare – Sanremo: Apify .* 502/);

    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 500 })));
    await expect(apifyProvider.fetchListings([sanremo])).rejects.toThrow("Všetky Apify behy zlyhali");
  });

  it("re-checks listings by id on both portals", async () => {
    vi.stubEnv("APIFY_TOKEN", "apify_test");
    const known = [
      ...idealistaFixture.slice(0, 2).map(mapIdealistaItem),
      ...immobiliareFixture.slice(0, 2).map(mapImmobiliareItem),
    ].map((l, i) => ({ ...l!, id: `p${i}`, first_seen_at: "2026-09-20T00:00:00Z", last_seen_at: "2026-09-21T00:00:00Z" }));

    const inputs: Record<string, unknown> = {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        const actor = url.includes(IDEALISTA_ACTOR) ? "idealista" : "immobiliare";
        inputs[actor] = JSON.parse(String(init?.body));
        // Real recheck output shapes: idealista returns { propertyCode, _details }, one listing is gone.
        return Response.json(
          actor === "idealista"
            ? [{ propertyCode: "36915294", _details: { price: 310000 } }]
            : immobiliareFixture.slice(0, 2),
        );
      }),
    );

    const { listings, errors } = await apifyProvider.recheck!(known);
    expect(errors).toEqual([]);
    expect(inputs.idealista).toMatchObject({ propertyCodes: ["36915294", "36914097"], maxItems: 2 });
    expect(inputs.immobiliare).toMatchObject({
      startUrls: ["https://www.immobiliare.it/annunci/128080462/", "https://www.immobiliare.it/annunci/131246982/"],
    });
    expect(listings.map((l) => l.external_id).sort()).toEqual(
      ["idealista-36915294", "immobiliare-128080462", "immobiliare-131246982"].sort(),
    );
    expect(listings.find((l) => l.external_id === "idealista-36915294")!.price).toBe(310000);
  });

  it("searches at most the three largest parts of an area with islands", async () => {
    vi.stubEnv("APIFY_TOKEN", "apify_test");
    const fetchMock = vi.fn(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    const toscana = findPlace("region", "09")!;
    expect(toscana.geometry.type).toBe("MultiPolygon");
    expect((toscana.geometry.coordinates as unknown[]).length).toBeGreaterThan(3);

    await apifyProvider.fetchListings([{ id: "t", name: "Toskánsko", created_at: "", polygon: toscana.geometry }]);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("searches only along the coast of a province, with the same number of listings", async () => {
    vi.stubEnv("APIFY_TOKEN", "apify_test");
    const inputs: { actor: string; maxItems: number; body: Record<string, unknown> }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        const u = new URL(url);
        inputs.push({
          actor: u.pathname.includes(IDEALISTA_ACTOR) ? "idealista" : "immobiliare",
          maxItems: Number(u.searchParams.get("maxItems")),
          body: JSON.parse(String(init?.body)),
        });
        return Response.json([]);
      }),
    );
    const catania = findPlace("province", "CT")!;
    const area: SearchArea = { id: "c", name: "Catania", created_at: "", polygon: catania.geometry };

    const { errors } = await apifyProvider.fetchListings([area], { bandKm: 3 });
    expect(errors).toEqual([]);
    const idealista = inputs.filter((i) => i.actor === "idealista");
    const immobiliare = inputs.filter((i) => i.actor === "immobiliare");
    expect(idealista.length).toBe(immobiliare.length);
    expect(idealista.length).toBeGreaterThanOrEqual(1);
    expect(idealista.length).toBeLessThanOrEqual(4);
    const perPortal = idealista.reduce((s, i) => s + i.maxItems, 0);
    expect(perPortal).toBeLessThanOrEqual(Math.max(50 + idealista.length, 15 * idealista.length));

    // The Idealista circles stay near the coast: much smaller than the whole province.
    const whole = idealistaInput(catania.geometry.coordinates[0] as Position[], 50).distanceKm;
    for (const i of idealista) expect(i.body.distanceKm as number).toBeLessThan(whole);
    // Immobiliare gets a band polygon; the coast town of Aci Castello lies inside one of them.
    const bands = immobiliare.map((i) =>
      new URL((i.body.startUrls as string[])[0]).searchParams
        .get("vrt")!
        .split(";")
        .map((p) => p.split(",").map(Number).reverse() as Position),
    );
    expect(bands.some((b) => pointInArea(15.146, 37.556, { type: "Polygon", coordinates: [[...b, b[0]]] }))).toBe(true);
    // Caltagirone, inland, is in none of them.
    expect(bands.some((b) => pointInArea(14.512, 37.237, { type: "Polygon", coordinates: [[...b, b[0]]] }))).toBe(false);
  });

  it("searches the whole area when asked to, or when the area has no coast", async () => {
    vi.stubEnv("APIFY_TOKEN", "apify_test");
    const fetchMock = vi.fn(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    const catania = findPlace("province", "CT")!;
    await apifyProvider.fetchListings([{ id: "c", name: "Catania", created_at: "", polygon: catania.geometry }], {
      bandKm: null,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockClear();
    await apifyProvider.fetchListings([sanremo], { bandKm: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does nothing without areas and owns only portal ids", async () => {
    expect(await apifyProvider.fetchListings([])).toEqual({ listings: [], errors: [] });
    expect(apifyProvider.ownsExternalId("idealista-1")).toBe(true);
    expect(apifyProvider.ownsExternalId("immobiliare-1")).toBe(true);
    expect(apifyProvider.ownsExternalId("mock-1-1")).toBe(false);
  });
});

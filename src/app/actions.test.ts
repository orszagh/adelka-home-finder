import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRepository } from "@/lib/db/memory-repo";
import { polygonFromLatLngs } from "@/lib/geo";
import { LAST_SEEN_KEY, MANUAL_SYNC_KEY } from "@/lib/greeting";
import type { PropertyProvider } from "@/lib/providers";
import { buildMockListings } from "@/lib/providers/mock";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const fetchListings = vi.fn();
const provider: PropertyProvider = {
  id: "fake",
  label: "fake",
  isMock: false,
  ownsExternalId: (id) => id.startsWith("mock-"),
  fetchListings: (areas) => fetchListings(areas),
};
vi.mock("@/lib/providers", () => ({ getProvider: () => provider }));

const { addPlaceArea, checkNow, createArea, markNewsSeen } = await import("./actions");
const repo = MemoryRepository.shared();

beforeEach(() => {
  fetchListings.mockReset();
  fetchListings.mockResolvedValue({ listings: buildMockListings().slice(0, 2), errors: [] });
});

const square = polygonFromLatLngs([
  [43.7, 7.4],
  [44.5, 7.4],
  [44.5, 10.1],
]);

describe("server actions", () => {
  it("asks for an area before a manual sync", async () => {
    expect(await checkNow()).toEqual({ ok: false, error: "Najprv si pridaj oblasť." });
  });

  it("fetches a new area right away and treats it as already seen", async () => {
    const result = await createArea("Ligúria", square);
    expect(result).toMatchObject({ fetched: 2, error: null });
    expect(fetchListings).toHaveBeenCalledTimes(1);
    expect(await repo.getState(LAST_SEEN_KEY)).not.toBeNull();
  });

  it("allows a manual sync at most once an hour", async () => {
    expect(await checkNow()).toEqual({ ok: true });
    expect(fetchListings).toHaveBeenCalledTimes(1);

    const second = await checkNow();
    expect(second).toEqual({ ok: false, error: "Znova to pôjde o 60 min." });
    expect(fetchListings).toHaveBeenCalledTimes(1);

    await repo.setState(MANUAL_SYNC_KEY, new Date(Date.now() - 61 * 60 * 1000).toISOString());
    expect(await checkNow()).toEqual({ ok: true });
  });

  it("follows a province picked on the map, once", async () => {
    const result = await addPlaceArea("province", "IM");
    expect(result).toMatchObject({ fetched: 2, error: null });
    const area = (await repo.listSearchAreas()).find((a) => a.name === "Imperia")!;
    expect(area.polygon.type).toMatch(/Polygon/);
    expect(fetchListings.mock.calls.at(-1)![0]).toEqual([area]);

    const again = await addPlaceArea("province", "IM");
    expect(again).toEqual({ areaId: area.id, fetched: null, error: null });
    expect((await repo.listSearchAreas()).filter((a) => a.name === "Imperia")).toHaveLength(1);
  });

  it("rejects unknown places", async () => {
    await expect(addPlaceArea("province", "XX")).rejects.toThrow("Neznámy región alebo provincia");
    await expect(addPlaceArea("country" as never, "IT")).rejects.toThrow();
  });

  it("remembers when Adelka saw the news", async () => {
    await repo.setState(LAST_SEEN_KEY, "2000-01-01T00:00:00Z");
    await markNewsSeen();
    expect(Date.parse((await repo.getState<string>(LAST_SEEN_KEY))!)).toBeGreaterThan(Date.now() - 5000);
  });
});

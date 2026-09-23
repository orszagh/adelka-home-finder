import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/db/memory-repo";
import { pointInArea, polygonFromLatLngs } from "@/lib/geo";
import { apifyProvider } from "@/lib/providers/apify";
import { syncFromProvider } from "@/lib/sync";
import type { SearchArea } from "@/lib/types";

// Spends real Apify credit, so it runs only when this file is targeted explicitly via npm run test:live.
describe.runIf(Boolean(process.env.APIFY_TOKEN) && process.env.npm_lifecycle_event === "test:live")("Apify live (Sanremo)", () => {
  it("fetches and stores real listings for a drawn area", { timeout: 300_000 }, async () => {
    const area: SearchArea = {
      id: "live",
      name: "Sanremo",
      created_at: new Date().toISOString(),
      polygon: polygonFromLatLngs([[43.835, 7.745], [43.84, 7.8], [43.805, 7.8], [43.8, 7.745]]),
    };
    const repo = new MemoryRepository();
    const result = await syncFromProvider(repo, apifyProvider, [area]);
    const stored = await repo.listProperties();
    const bySource = Object.groupBy(stored, (p) => p.source);
    console.log("errors:", result.errors, "| idealista:", bySource.idealista?.length, "| immobiliare:", bySource.immobiliare?.length);
    console.log(stored.slice(0, 4).map((p) => `${p.source} | ${p.title} | ${p.price} € | ${p.area_sqm} m² | ${p.rooms} | ${p.city}, ${p.region} | foto ${p.photos.length}`).join("\n"));
    const inside = stored.filter((p) => pointInArea(p.longitude, p.latitude, area.polygon)).length;
    console.log(`inside polygon: ${inside}/${stored.length}`);
    expect(result.errors).toEqual([]);
    expect(bySource.idealista?.length).toBeGreaterThan(0);
    expect(bySource.immobiliare?.length).toBeGreaterThan(0);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRepository } from "@/lib/db/memory-repo";
import { buildMockListings } from "@/lib/providers/mock";

const generateStructured = vi.fn();

vi.mock("@/lib/ai/claude", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/claude")>()),
  generateStructured: (...args: unknown[]) => generateStructured(...args),
}));

const { POST } = await import("./route");
const { AiError } = await import("@/lib/ai/claude");

function call(body: unknown) {
  return POST(new Request("http://test/api/location-summary", { method: "POST", body: JSON.stringify(body) }));
}

describe("POST /api/location-summary", () => {
  let propertyId: string;

  beforeEach(async () => {
    generateStructured.mockReset();
    const [stored] = await MemoryRepository.shared().upsertProperties(buildMockListings().slice(0, 1));
    propertyId = stored.id;
  });

  it("generates once, then serves the cached note", async () => {
    generateStructured.mockResolvedValue({
      summary: "Pekné miesto.",
      infrastructure: "Obchody.",
      accessibility: "Letisko Nice.",
      climate_risks: "Horúčavy.",
      groundwater_risks: "Nízke.",
      highlights: ["Pláž"],
    });

    const first = await call({ propertyId });
    expect(first.status).toBe(200);
    const { note } = await first.json();
    expect(note.city).toBe("Sanremo");
    expect(generateStructured).toHaveBeenCalledTimes(1);
    expect(generateStructured.mock.calls[0][0].prompt).toContain("Sanremo");

    const second = await call({ propertyId });
    expect((await second.json()).note.id).toBe(note.id);
    expect(generateStructured).toHaveBeenCalledTimes(1);

    await call({ propertyId, refresh: true });
    expect(generateStructured).toHaveBeenCalledTimes(2);
  });

  it("only accepts known listings and reports AI failures", async () => {
    expect((await call({ propertyId: "nope" })).status).toBe(404);
    expect((await call({ city: "Roma" })).status).toBe(400);

    generateStructured.mockRejectedValue(new AiError("AI túto požiadavku odmietla spracovať."));
    const failed = await call({ propertyId, refresh: true });
    expect(failed.status).toBe(503);
    expect((await failed.json()).error).toContain("odmietla");
  });
});

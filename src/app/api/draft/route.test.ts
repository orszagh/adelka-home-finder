import { beforeEach, describe, expect, it, vi } from "vitest";
import { mailtoHref } from "@/lib/message";
import { MemoryRepository } from "@/lib/db/memory-repo";
import { buildMockListings } from "@/lib/providers/mock";

const generateStructured = vi.fn();

vi.mock("@/lib/ai/claude", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/claude")>()),
  generateStructured: (...args: unknown[]) => generateStructured(...args),
}));

const { POST } = await import("./route");

function call(body: unknown) {
  return POST(new Request("http://test/api/draft", { method: "POST", body: JSON.stringify(body) }));
}

describe("POST /api/draft", () => {
  let propertyId: string;

  beforeEach(async () => {
    generateStructured.mockReset();
    const [stored] = await MemoryRepository.shared().upsertProperties(buildMockListings().slice(2, 3));
    propertyId = stored.id;
  });

  it("drafts from the listing in the database and Adelka's intent", async () => {
    const draft = { subject_it: "Richiesta", body_it: "Buongiorno…", translation_sk: "Dobrý deň…" };
    generateStructured.mockResolvedValue(draft);

    const response = await call({ propertyId, intent: "Chcem obhliadku v septembri", signature: "Adela" });
    expect(response.status).toBe(200);
    expect((await response.json()).draft).toEqual(draft);

    const { prompt } = generateStructured.mock.calls[0][0];
    expect(prompt).toContain("Alassio");
    expect(prompt).toContain("Chcem obhliadku v septembri");
    expect(prompt).toContain("Podpis: Adela");
  });

  it("validates input before calling the AI", async () => {
    expect((await call({ propertyId, intent: "  " })).status).toBe(400);
    expect((await call({ propertyId, intent: "x".repeat(1001) })).status).toBe(400);
    expect((await call({ propertyId: "nope", intent: "ahoj" })).status).toBe(404);
    expect(generateStructured).not.toHaveBeenCalled();
  });
});

describe("mailtoHref", () => {
  it("encodes spaces as %20 and keeps line breaks", () => {
    const href = mailtoHref(" agenzia@example.it ", "Richiesta visita", "Buongiorno,\nvorrei");
    expect(href).toBe("mailto:agenzia@example.it?subject=Richiesta%20visita&body=Buongiorno%2C%0Avorrei");
  });
});

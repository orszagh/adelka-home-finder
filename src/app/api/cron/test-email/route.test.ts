import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRepository } from "@/lib/db/memory-repo";
import { buildMockListings } from "@/lib/providers/mock";
import { POST } from "./route";

const fetchMock = vi.fn();

beforeAll(async () => {
  await MemoryRepository.shared().upsertProperties(buildMockListings().slice(0, 3));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function call(auth?: string) {
  return POST(
    new Request("http://test/api/cron/test-email", {
      method: "POST",
      headers: auth ? { authorization: auth } : {},
    }),
  );
}

describe("POST /api/cron/test-email", () => {
  it("requires the cron secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await call()).status).toBe(401);
    expect((await call("Bearer nope")).status).toBe(401);
  });

  it("sends a [TEST] sample notification through Resend", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("NOTIFY_EMAIL", "adelka@example.com, lubo@example.com");
    vi.stubEnv("APP_URL", "https://app.test");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(Response.json({ id: "email_123" }));

    const response = await call("Bearer s3cret");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sent: true,
      id: "email_123",
      to: ["adelka@example.com", "lubo@example.com"],
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    const payload = JSON.parse(init.body);
    expect(payload.subject).toBe("[TEST] Domček pri mori: 2 nové inzeráty, 1 zmena ceny");
    expect(payload.html).toContain("https://app.test/inzerat/");
    expect(payload.text).toMatch(/^TESTOVACÍ EMAIL/);
  });

  it("reports Resend errors", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("NOTIFY_EMAIL", "adelka@example.com");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(new Response('{"message":"domain not verified"}', { status: 403 }));

    const response = await call("Bearer s3cret");
    expect(response.status).toBe(502);
    expect((await response.json()).error).toContain("domain not verified");
  });
});

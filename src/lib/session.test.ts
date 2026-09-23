import { afterEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE, sessionToken } from "./auth";

let cookieValue: string | undefined;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name === SESSION_COOKIE && cookieValue ? { name, value: cookieValue } : undefined),
  }),
}));

const generateStructured = vi.fn();
vi.mock("@/lib/ai/claude", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/ai/claude")>()),
  generateStructured: (...args: unknown[]) => generateStructured(...args),
}));

const { hasSession, assertSession } = await import("./session");
const { POST: draft } = await import("@/app/api/draft/route");
const { POST: locationSummary } = await import("@/app/api/location-summary/route");
const { toggleSaved } = await import("@/app/actions");

afterEach(() => {
  vi.unstubAllEnvs();
  cookieValue = undefined;
  generateStructured.mockReset();
});

const post = (body: unknown) => new Request("http://test", { method: "POST", body: JSON.stringify(body) });

describe("session checks independent of proxy.ts", () => {
  it("requires the password-derived cookie once APP_PASSWORD is set", async () => {
    vi.stubEnv("APP_PASSWORD", "more-a-sole");
    expect(await hasSession()).toBe(false);
    cookieValue = "forged";
    expect(await hasSession()).toBe(false);
    cookieValue = await sessionToken("more-a-sole");
    expect(await hasSession()).toBe(true);
  });

  it("locks production when no password is configured", async () => {
    vi.stubEnv("APP_PASSWORD", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(await hasSession()).toBe(false);
    await expect(assertSession()).rejects.toThrow("Najprv sa prihlás.");
  });

  it("rejects API routes and server actions without a session", async () => {
    vi.stubEnv("APP_PASSWORD", "more-a-sole");
    expect((await draft(post({ propertyId: "x", intent: "ahoj" }))).status).toBe(401);
    expect((await locationSummary(post({ propertyId: "x" }))).status).toBe(401);
    await expect(toggleSaved("x")).rejects.toThrow("Najprv sa prihlás.");
    expect(generateStructured).not.toHaveBeenCalled();
  });
});

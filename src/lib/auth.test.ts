import { afterEach, describe, expect, it, vi } from "vitest";
import { constantTimeEqual, isValidSession, safeNextPath, sessionToken } from "./auth";

afterEach(() => vi.unstubAllEnvs());

describe("auth", () => {
  it("accepts only the token derived from the current password", async () => {
    vi.stubEnv("APP_PASSWORD", "more-a-sole");
    const token = await sessionToken("more-a-sole");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(await isValidSession(token)).toBe(true);
    expect(await isValidSession(await sessionToken("iné heslo"))).toBe(false);
    expect(await isValidSession(undefined)).toBe(false);

    vi.stubEnv("APP_PASSWORD", "nové heslo");
    expect(await isValidSession(token)).toBe(false);
  });

  it("compares strings of any length", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
    expect(constantTimeEqual("", "")).toBe(true);
  });

  it("only redirects to local paths after login", () => {
    expect(safeNextPath("/inzerat/1?x=2")).toBe("/inzerat/1?x=2");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath(["/a"])).toBe("/");
  });
});

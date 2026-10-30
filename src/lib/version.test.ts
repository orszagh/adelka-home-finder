import { describe, expect, it } from "vitest";
import { formatVersion } from "./version";

describe("formatVersion", () => {
  it("shows the release, the commit and the day it went live", () => {
    expect(formatVersion({ version: "0.4.0", commit: "cef07a1", builtAt: "2026-10-30T15:00:00Z" })).toBe(
      "Verzia 0.4.0 · cef07a1 · 30. 10. 2026",
    );
  });

  it("says vývoj outside Vercel", () => {
    expect(formatVersion({ version: "0.4.0", commit: "", builtAt: "" })).toBe("Verzia 0.4.0 · vývoj");
  });
});

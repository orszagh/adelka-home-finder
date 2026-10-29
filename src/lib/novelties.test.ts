import { describe, expect, it } from "vitest";
import { NOVELTIES, nextNovelty } from "./novelties";

describe("novelties", () => {
  it("keeps the key of the first novelty, so it is not shown again", () => {
    expect(NOVELTIES[0].storageKey).toBe("adelka.novelty.near");
  });

  it("picks the oldest one she has not seen", () => {
    expect(nextNovelty(new Set())?.id).toBe("near");
    expect(nextNovelty(new Set(["adelka.novelty.near"]))?.id).toBe("visits");
  });

  it("shows nothing once all are seen", () => {
    expect(nextNovelty(new Set(NOVELTIES.map((n) => n.storageKey)))).toBeNull();
  });

  it("has a unique key for every novelty", () => {
    expect(new Set(NOVELTIES.map((n) => n.storageKey)).size).toBe(NOVELTIES.length);
  });
});

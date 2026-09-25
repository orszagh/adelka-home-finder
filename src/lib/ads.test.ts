import { describe, expect, it } from "vitest";
import { ADS, AD_GAP_MS, adAt, kissesWord, paidText, shouldShowAd } from "./ads";

describe("Lubko's ads", () => {
  it("shows one ad, the next one at least five hours later", () => {
    const now = Date.parse("2026-09-25T20:00:00Z");
    expect(shouldShowAd(null, now)).toBe(true);
    expect(shouldShowAd(now - AD_GAP_MS + 60_000, now)).toBe(false);
    expect(shouldShowAd(now - AD_GAP_MS, now)).toBe(true);
    expect(shouldShowAd(Number.NaN, now)).toBe(true);
  });

  it("goes through the ads in order and starts again", () => {
    expect(adAt(0)).toBe(ADS[0]);
    expect(adAt(1)).toBe(ADS[1]);
    expect(adAt(ADS.length)).toBe(ADS[0]);
    expect(adAt(-3)).toBe(ADS[0]);
  });

  it("has complete ads with one of the three photos", () => {
    for (const ad of ADS) {
      expect([1, 2, 3]).toContain(ad.photo);
      expect(ad.headline && ad.text && ad.pay && ad.agree && ad.paid).toBeTruthy();
    }
  });

  it("counts kisses in Slovak", () => {
    expect(kissesWord(1)).toBe("pusa");
    expect(kissesWord(3)).toBe("pusy");
    expect(kissesWord(7)).toBe("pús");
    expect(paidText(ADS[0], 3)).toContain("3 pusy");
  });
});

describe("kiss milestones", () => {
  it("fires exactly on the 3rd and 10th kiss", async () => {
    const { milestoneFor } = await import("./ads");
    expect(milestoneFor(2)).toBeNull();
    expect(milestoneFor(3)?.text).toContain("pretiahnuť");
    expect(milestoneFor(4)).toBeNull();
    expect(milestoneFor(10)?.text).toContain("poslala 10× pusu");
  });
});

import { describe, expect, it } from "vitest";
import { ADS, kissesWord, paidText, pickAd, shouldShowAd, todayKey } from "./ads";

describe("Lubko's ads", () => {
  it("shows at most one a day, by Slovak time", () => {
    expect(todayKey(new Date("2026-09-24T22:30:00Z"))).toBe("2026-09-25");
    expect(shouldShowAd(null, "2026-09-25")).toBe(true);
    expect(shouldShowAd("2026-09-25", "2026-09-25")).toBe(false);
    expect(shouldShowAd("2026-09-24", "2026-09-25")).toBe(true);
  });

  it("picks a different ad on consecutive days, the same one all day", () => {
    expect(pickAd("2026-09-25")).toBe(pickAd("2026-09-25"));
    expect(pickAd("2026-09-25")).not.toBe(pickAd("2026-09-26"));
    const week = new Set(Array.from({ length: ADS.length }, (_, i) => pickAd(`2026-10-${String(i + 1).padStart(2, "0")}`)));
    expect(week.size).toBe(ADS.length);
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

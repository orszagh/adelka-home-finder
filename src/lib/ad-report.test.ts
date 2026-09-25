import { describe, expect, it } from "vitest";
import { AD_LOG_MAX, appendToLog, buildAdEmail, parseAdChoice } from "./ad-report";
import { ADS, KISS_MILESTONES } from "./ads";

describe("ad choice report", () => {
  it("accepts only what the popup can send", () => {
    const ok = { headline: ADS[0].headline, choice: "pay", label: ADS[0].pay, kisses: 2 };
    expect(parseAdChoice(ok)).toEqual(ok);
    expect(parseAdChoice({ ...ok, headline: "Niečo iné" })).toBeNull();
    expect(parseAdChoice({ ...ok, choice: "delete" })).toBeNull();
    expect(parseAdChoice({ ...ok, kisses: -1 })).toBeNull();
    expect(parseAdChoice("nonsense")).toBeNull();
  });

  it("keeps a bounded log", () => {
    const entry = { headline: ADS[0].headline, choice: "pay" as const, label: "x", kisses: 1, at: "t" };
    const full = Array.from({ length: AD_LOG_MAX }, () => entry);
    expect(appendToLog(full, { ...entry, at: "new" })).toHaveLength(AD_LOG_MAX);
    expect(appendToLog(null, entry)).toEqual([entry]);
  });

  it("writes Lubko a short note", () => {
    const tenth = KISS_MILESTONES.find((m) => m.at === 10)!;
    const email = buildAdEmail(
      { headline: tenth.headline, choice: "milestone-yes", label: tenth.yes, kisses: 10 },
      new Date("2026-09-25T19:30:00Z"),
    );
    expect(email.subject).toContain("10 pús");
    expect(email.text).toContain("Ťukla na: Už bežím");
    expect(email.text).toContain("21:30");
    expect(buildAdEmail({ headline: ADS[0].headline, choice: "refuse", label: "Nechcem reklamy", kisses: 0 }, new Date()).subject).toBe(
      "Adelka sa pokúsila vypnúť reklamy",
    );
  });
});

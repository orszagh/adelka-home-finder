import { ADS, KISS_MILESTONES } from "./ads";

/** What Adelka tapped in Lubko's ad. */
export type AdChoice = "pay" | "agree" | "refuse" | "more" | "milestone-yes" | "milestone-no";

export type AdChoiceEvent = {
  /** Headline of the ad or of the kiss milestone. */
  headline: string;
  choice: AdChoice;
  /** Label of the button she tapped, as she saw it. */
  label: string;
  kisses: number;
};

export type AdLogEntry = AdChoiceEvent & { at: string };

export const AD_LOG_KEY = "ad_choices";
export const AD_LOG_MAX = 200;
export const LUBKO_EMAIL_DEFAULT = "orszagh.lubo@gmail.com";

const CHOICES: AdChoice[] = ["pay", "agree", "refuse", "more", "milestone-yes", "milestone-no"];
const KNOWN_HEADLINES = new Set([...ADS.map((a) => a.headline), ...KISS_MILESTONES.map((m) => m.headline)]);

/** Accepts only what the popup can send, so the log and the email stay trustworthy. */
export function parseAdChoice(value: unknown): AdChoiceEvent | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const choice = CHOICES.find((c) => c === v.choice);
  const headline = typeof v.headline === "string" && KNOWN_HEADLINES.has(v.headline) ? v.headline : null;
  const label = typeof v.label === "string" ? v.label.trim().slice(0, 80) : "";
  const kisses = Number.isInteger(v.kisses) && (v.kisses as number) >= 0 ? Math.min(v.kisses as number, 100_000) : null;
  if (!choice || !headline || !label || kisses === null) return null;
  return { headline, choice, label, kisses };
}

export function appendToLog(log: AdLogEntry[] | null, entry: AdLogEntry): AdLogEntry[] {
  return [...(log ?? []), entry].slice(-AD_LOG_MAX);
}

function kissWord(n: number): string {
  return n === 1 ? "pusa" : n >= 2 && n <= 4 ? "pusy" : "pús";
}

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** The note Lubko gets when Adelka taps something in his ad. */
export function buildAdEmail(event: AdChoiceEvent, at: Date) {
  const time = new Intl.DateTimeFormat("sk-SK", {
    timeZone: "Europe/Bratislava",
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(at);
  const milestone = event.choice.startsWith("milestone");
  const subject =
    event.choice === "milestone-yes"
      ? `Adelka: „${event.label}“ – ${event.kisses} ${kissWord(event.kisses)} 😏`
      : event.choice === "refuse"
        ? "Adelka sa pokúsila vypnúť reklamy"
        : `Adelka ťukla na „${event.label}“`;
  const lines = [
    `${milestone ? "Míľnik" : "Reklama"}: ${event.headline}`,
    `Ťukla na: ${event.label}`,
    `Pusy spolu: ${event.kisses}`,
    `Kedy: ${time}`,
  ];
  return {
    subject,
    text: lines.join("\n"),
    html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5">${lines.map((l) => `<p style="margin:0 0 6px">${escape(l)}</p>`).join("")}</div>`,
  };
}

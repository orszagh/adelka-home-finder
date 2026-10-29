import { formatPrice } from "./format";
import type { Property } from "./types";
import type { VisitInput } from "./visits";

/** A viewing without a time is a whole-day event; the reminder then rings at 9:00 the day before. */
const ALL_DAY_REMINDER = "-PT15H";
/** Timed viewing: the day before and two hours before. */
const TIMED_REMINDERS = ["-P1D", "-PT2H"];
const DURATION = "PT1H";

/** Wall-clock time in Italy → UTC, so the phone shows it right wherever she is. */
export function italyToUtc(date: string, time: string): Date {
  const guess = new Date(`${date}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(guess);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const shown = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(guess.getTime() - (shown - guess.getTime()));
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const utf8 = new TextEncoder();

/** Lines longer than 75 bytes continue on the next one, starting with a space (never splitting a letter). */
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  for (const char of line) {
    if (utf8.encode(current + char).length > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
    }
    current += char;
  }
  out.push(current);
  return out.map((part, i) => (i ? ` ${part}` : part)).join("\r\n");
}

/** Calendar event (.ics) for a booked viewing, with reminders; null without a date. */
export function buildVisitIcs(property: Property, visit: Pick<VisitInput, "date" | "time">, appUrl: string, now = new Date()): string | null {
  if (!visit.date) return null;
  const price = property.price === null ? null : formatPrice(property.price);
  const summary = `Obhliadka: ${property.city}${price ? ` – ${price}` : ""}`;
  const description = [property.title, `V appke: ${appUrl}/inzerat/${property.id}`, property.listing_url ? `Inzerát: ${property.listing_url}` : null]
    .filter(Boolean)
    .join("\n");

  const when = visit.time
    ? (() => {
        const start = italyToUtc(visit.date, visit.time);
        return [`DTSTART:${stamp(start)}`, `DURATION:${DURATION}`];
      })()
    : [`DTSTART;VALUE=DATE:${visit.date.replace(/-/g, "")}`, `DURATION:P1D`];
  const reminders = (visit.time ? TIMED_REMINDERS : [ALL_DAY_REMINDER]).flatMap((trigger) => [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(summary)}`,
    `TRIGGER:${trigger}`,
    "END:VALARM",
  ]);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//La casetta di Adelka//Obhliadky//SK",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:obhliadka-${property.id}@la-casetta`,
    `DTSTAMP:${stamp(now)}`,
    ...when,
    `SUMMARY:${escape(summary)}`,
    `LOCATION:${escape(`${property.city}, ${property.region}`)}`,
    `GEO:${property.latitude};${property.longitude}`,
    `DESCRIPTION:${escape(description)}`,
    `URL:${property.listing_url ?? `${appUrl}/inzerat/${property.id}`}`,
    ...reminders,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

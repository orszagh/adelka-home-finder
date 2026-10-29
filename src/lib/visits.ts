import type { Repository } from "./db/repo";

/**
 * Adelka's viewings of saved houses, kept in app_state (no new table): where she is with each
 * house and, once agreed, when the viewing is.
 */
export const VISITS_KEY = "visits";

export type VisitStatus = "written" | "booked" | "visited" | "no";

export const VISIT_STATUSES: { value: VisitStatus; label: string }[] = [
  { value: "written", label: "Napísala som" },
  { value: "booked", label: "Obhliadka dohodnutá" },
  { value: "visited", label: "Videla som" },
  { value: "no", label: "Nie je to ono" },
];

export type VisitInput = {
  status: VisitStatus;
  /** YYYY-MM-DD, local to Italy. */
  date: string | null;
  /** HH:MM. */
  time: string | null;
};

export type Visit = VisitInput & { updated_at: string };

/** By property id. */
export type Visits = Record<string, Visit>;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

export function parseVisit(input: unknown): VisitInput | null {
  if (typeof input !== "object" || input === null) return null;
  const { status, date, time } = input as Record<string, unknown>;
  if (!VISIT_STATUSES.some((s) => s.value === status)) return null;
  return {
    status: status as VisitStatus,
    date: typeof date === "string" && DATE.test(date) ? date : null,
    time: typeof time === "string" && TIME.test(time) ? time : null,
  };
}

export async function getVisits(repo: Repository): Promise<Visits> {
  const stored = await repo.getState<unknown>(VISITS_KEY);
  if (typeof stored !== "object" || stored === null) return {};
  const visits: Visits = {};
  for (const [id, value] of Object.entries(stored)) {
    const visit = parseVisit(value);
    if (visit) visits[id] = { ...visit, updated_at: String((value as { updated_at?: unknown }).updated_at ?? "") };
  }
  return visits;
}

/** Booked viewings with a date, soonest first. */
export function plannedVisits(visits: Visits): [string, Visit][] {
  return Object.entries(visits)
    .filter(([, v]) => v.status === "booked" && v.date)
    .sort(([, a], [, b]) => `${a.date}${a.time ?? ""}`.localeCompare(`${b.date}${b.time ?? ""}`));
}

/** Today in Italy as YYYY-MM-DD, to tell coming viewings from past ones. */
export function todayInItaly(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(now);
}

/** "št 31. 10. o 15:00" */
export function visitWhen(visit: Pick<VisitInput, "date" | "time">): string {
  if (!visit.date) return "";
  const day = new Intl.DateTimeFormat("sk-SK", { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" }).format(
    new Date(`${visit.date}T12:00:00Z`),
  );
  return visit.time ? `${day} o ${visit.time}` : day;
}

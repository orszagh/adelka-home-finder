import type { Repository } from "./db/repo";

/**
 * When Adelka opens the app and which houses she looks at, for Lubko's /aktivita page.
 * Lubko's own devices are left out (marked once with ?lubko=1). Adelka knows about it:
 * the help page says so.
 */
export const OPENS_KEY = "activity_opens";
export const SEEN_LOG_KEY = "seen_log";

const MAX_OPENS = 300;
const MAX_SEEN_LOG = 100;
/** Opening the same house again within this time is the same look. */
const SAME_LOOK_MS = 30 * 60_000;

export type SeenEntry = { id: string; at: string };

async function list<T>(repo: Repository, key: string, valid: (x: unknown) => x is T): Promise<T[]> {
  const value = await repo.getState<unknown>(key);
  return Array.isArray(value) ? value.filter(valid) : [];
}

const isIso = (x: unknown): x is string => typeof x === "string" && !Number.isNaN(Date.parse(x));
const isSeen = (x: unknown): x is SeenEntry =>
  typeof x === "object" && x !== null && typeof (x as SeenEntry).id === "string" && isIso((x as SeenEntry).at);

export const getOpens = (repo: Repository) => list(repo, OPENS_KEY, isIso);
export const getSeenLog = (repo: Repository) => list(repo, SEEN_LOG_KEY, isSeen);

export async function recordOpen(repo: Repository, now = new Date()): Promise<void> {
  const opens = await getOpens(repo);
  await repo.setState(OPENS_KEY, [...opens, now.toISOString()].slice(-MAX_OPENS));
}

export async function recordLook(repo: Repository, id: string, now = new Date()): Promise<void> {
  const log = await getSeenLog(repo);
  const last = log[log.length - 1];
  if (last && last.id === id && now.getTime() - Date.parse(last.at) < SAME_LOOK_MS) return;
  await repo.setState(SEEN_LOG_KEY, [...log, { id, at: now.toISOString() }].slice(-MAX_SEEN_LOG));
}

const ZONE = "Europe/Rome";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONE }).format(d);

/** Opens per day for the last `days` days, oldest first. */
export function opensPerDay(opens: string[], days: number, now = new Date()): { day: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const at of opens) {
    const key = dayKey(new Date(at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getTime() - (days - 1 - i) * 86_400_000);
    return {
      day: dayKey(d),
      label: new Intl.DateTimeFormat("sk-SK", { weekday: "short", timeZone: ZONE }).format(d),
      count: counts.get(dayKey(d)) ?? 0,
    };
  });
}

/** "dnes o 14:32", "včera o 9:10", "po 27. 10. o 18:05" */
export function whenLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat("sk-SK", { hour: "numeric", minute: "2-digit", timeZone: ZONE }).format(d);
  if (dayKey(d) === dayKey(now)) return `dnes o ${time}`;
  if (dayKey(d) === dayKey(new Date(now.getTime() - 86_400_000))) return `včera o ${time}`;
  const day = new Intl.DateTimeFormat("sk-SK", { weekday: "short", day: "numeric", month: "numeric", timeZone: ZONE }).format(d);
  return `${day} o ${time}`;
}

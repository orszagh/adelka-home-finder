import { recentPriceDrop } from "./freshness";
import type { Property } from "./types";

export const LAST_SEEN_KEY = "adelka_last_seen_at";
export const MANUAL_SYNC_KEY = "last_manual_sync_at";
export const MANUAL_SYNC_COOLDOWN_MS = 60 * 60 * 1000;

const TIME_ZONE = "Europe/Bratislava";

export type Greeting = {
  title: string;
  message: string;
  /** Listings to show when Adelka taps "Ukázať mi ich". */
  ids: string[];
};

/** Minutes until "Pozrieť teraz" may run again (0 = now). */
export function manualSyncWaitMinutes(lastManualSync: string | null, now = Date.now()): number {
  if (!lastManualSync) return 0;
  return Math.max(0, Math.ceil((Date.parse(lastManualSync) + MANUAL_SYNC_COOLDOWN_MS - now) / 60_000));
}

function localHour(now: Date): number {
  return Number(new Intl.DateTimeFormat("sk-SK", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(now));
}

function plural(n: number, one: string, few: string, many: string): string {
  return `${n} ${n === 1 ? one : n >= 2 && n <= 4 ? few : many}`;
}

/**
 * "Dobré ráno, Adelka ☕ Lubko ti v noci našiel …" – what appeared or got
 * cheaper since she last looked. Null when there is nothing new.
 */
export function buildGreeting(properties: Property[], lastSeenAt: string, now = new Date()): Greeting | null {
  const since = Date.parse(lastSeenAt);
  const fresh = properties.filter((p) => Date.parse(p.first_seen_at) > since);
  const freshIds = new Set(fresh.map((p) => p.id));
  const cheaper = properties.filter((p) => !freshIds.has(p.id) && recentPriceDrop(p, since) !== null);
  if (fresh.length === 0 && cheaper.length === 0) return null;

  const hour = localHour(now);
  const morning = hour >= 4 && hour < 10;
  const title =
    morning ? "Dobré ráno, Adelka ☕" : hour >= 10 && hour < 18 ? "Dobrý deň, Adelka 👋" : "Dobrý večer, Adelka 🌙";

  const found = [
    fresh.length > 0 ? plural(fresh.length, "nový inzerát", "nové inzeráty", "nových inzerátov") : null,
    cheaper.length > 0
      ? fresh.length > 0
        ? `(a ${plural(cheaper.length, "zlacnený", "zlacnené", "zlacnených")})`
        : plural(cheaper.length, "zlacnený inzerát", "zlacnené inzeráty", "zlacnených inzerátov")
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  const when = morning ? "v noci" : "od tvojej poslednej návštevy";
  const outro = morning ? "Pozri si ich pri kávičke." : "Pozri sa na ne, keď budeš mať chvíľku.";
  return {
    title,
    message: `Lubko ti ${when} našiel ${found}. ${outro}`,
    ids: [...fresh, ...cheaper].map((p) => p.id),
  };
}

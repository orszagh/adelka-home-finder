import type { Usage } from "../../budget";

const API_BASE = "https://api.apify.com/v2";
/** Apify caps synchronous runs at 300 s; stay below the Vercel function limit too. */
const RUN_TIMEOUT_SECS = 240;

export class ApifyError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export function isApifyConfigured(): boolean {
  return Boolean(process.env.APIFY_TOKEN);
}

export type RunOptions = { maxItems: number; maxChargeUsd: number };

/**
 * Runs an Actor and returns its default dataset in one request
 * (https://docs.apify.com/api/v2/act-run-sync-get-dataset-items-post).
 * `maxTotalChargeUsd` caps what a single pay-per-event run may cost.
 */
export async function runActor(actorId: string, input: unknown, options: RunOptions): Promise<unknown[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new ApifyError("APIFY_TOKEN nie je nastavený");

  const params = new URLSearchParams({
    timeout: String(RUN_TIMEOUT_SECS),
    maxItems: String(options.maxItems),
    maxTotalChargeUsd: String(options.maxChargeUsd),
    clean: "true",
  });
  const response = await fetch(`${API_BASE}/acts/${actorId}/run-sync-get-dataset-items?${params}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout((RUN_TIMEOUT_SECS + 20) * 1000),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new ApifyError(`Apify ${actorId} ${response.status}: ${text.slice(0, 300)}`, response.status);
  }
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data)) throw new ApifyError(`Apify ${actorId}: neočakávaná odpoveď`);
  return data;
}

/**
 * Stops the runs of these Actors that are waiting or running right now
 * (https://docs.apify.com/api/v2/act-runs-get, https://docs.apify.com/api/v2/actor-run-abort-post).
 * What a stopped run has found so far is still returned to the request that started it.
 */
export async function abortRunningRuns(actorIds: string[]): Promise<number> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return 0;
  const headers = { Authorization: `Bearer ${token}` };
  const runIds: string[] = [];
  for (const actorId of actorIds) {
    for (const status of ["READY", "RUNNING"]) {
      const response = await fetch(`${API_BASE}/acts/${actorId}/runs?status=${status}&limit=100&desc=true`, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new ApifyError(`Apify ${actorId} runs ${response.status}`, response.status);
      const body = (await response.json()) as { data?: { items?: { id?: unknown }[] } };
      for (const item of body.data?.items ?? []) if (typeof item.id === "string") runIds.push(item.id);
    }
  }
  const results = await Promise.allSettled(
    runIds.map((id) =>
      fetch(`${API_BASE}/actor-runs/${id}/abort`, { method: "POST", headers, signal: AbortSignal.timeout(10_000) }).then((r) => {
        if (!r.ok) throw new ApifyError(`Apify abort ${r.status}`, r.status);
      }),
    ),
  );
  return results.filter((r) => r.status === "fulfilled").length;
}

/** This month's spending on the Apify account (https://docs.apify.com/api/v2/user-limits-get). Null when unknown. */
export async function getApifyUsage(): Promise<Usage | null> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return null;
  try {
    const response = await fetch(`${API_BASE}/users/me/limits`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const { data } = (await response.json()) as {
      data?: {
        current?: { monthlyUsageUsd?: unknown };
        limits?: { maxMonthlyUsageUsd?: unknown };
        monthlyUsageCycle?: { startAt?: unknown; endAt?: unknown };
      };
    };
    const usedUsd = Number(data?.current?.monthlyUsageUsd);
    const cycleStart = data?.monthlyUsageCycle?.startAt;
    const cycleEnd = data?.monthlyUsageCycle?.endAt;
    if (!Number.isFinite(usedUsd) || typeof cycleStart !== "string" || typeof cycleEnd !== "string") return null;
    const limitUsd = Number(data?.limits?.maxMonthlyUsageUsd);
    return { usedUsd, cycleStart, cycleEnd, limitUsd: Number.isFinite(limitUsd) ? limitUsd : null };
  } catch {
    return null;
  }
}

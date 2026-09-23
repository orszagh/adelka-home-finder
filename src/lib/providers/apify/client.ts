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

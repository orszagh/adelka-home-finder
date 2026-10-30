import type { Repository } from "./db/repo";

/** When Adelka last pressed "Zastaviť" (ISO time), in app_state: every server instance sees it. */
export const SYNC_STOP_KEY = "sync_stop_at";

export async function requestSyncStop(repo: Repository): Promise<void> {
  await repo.setState(SYNC_STOP_KEY, new Date().toISOString());
}

/** For a download starting now: true once "Zastaviť" has been pressed after it started. */
export function stopAskedSince(repo: Repository, startedAt = Date.now()): () => Promise<boolean> {
  return async () => {
    const at = await repo.getState<string>(SYNC_STOP_KEY);
    return at !== null && Date.parse(at) >= startedAt;
  };
}

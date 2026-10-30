import { getRepo } from "@/lib/db/repo";
import { getProvider } from "@/lib/providers";
import { hasSession, unauthorized } from "@/lib/session";
import { requestSyncStop } from "@/lib/sync-stop";

/**
 * "Zastaviť" while listings are downloading: downloads not started yet stay so, the running ones
 * are stopped at Apify. A route, not a server action: the page's actions wait for the running
 * download to finish, which is exactly what this must not do.
 */
export async function POST() {
  if (!(await hasSession())) return unauthorized();
  await requestSyncStop(getRepo());
  let stopped = 0;
  try {
    stopped = (await getProvider().abortRunning?.()) ?? 0;
  } catch (error) {
    console.error("Stopping the Apify runs failed", error);
    return Response.json({ ok: false, stopped }, { status: 502 });
  }
  return Response.json({ ok: true, stopped });
}

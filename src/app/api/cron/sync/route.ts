import { getRepo } from "@/lib/db/repo";
import { isEmailConfigured, notifyRecipients, sendEmail } from "@/lib/email";
import { LAST_SEEN_KEY } from "@/lib/greeting";
import { buildDigest, getAppUrl } from "@/lib/notify";
import { getProvider } from "@/lib/providers";
import { rejectUnlessCronSecret } from "@/lib/secrets";
import { syncFromProvider } from "@/lib/sync";

export const dynamic = "force-dynamic";
/** Apify runs for all areas happen in parallel; each is capped at 240 s. */
export const maxDuration = 300;

/**
 * Called daily by Vercel Cron (see vercel.json), which sends
 * `Authorization: Bearer $CRON_SECRET`. n8n or any scheduler can call it too.
 */
export async function GET(request: Request) {
  const rejected = rejectUnlessCronSecret(request);
  if (rejected) return rejected;

  const repo = getRepo();
  const provider = getProvider();
  const areas = await repo.listSearchAreas();
  const result = await syncFromProvider(repo, provider, areas, { recheck: true });
  const digest = buildDigest(result, areas, getAppUrl());
  // A first import (e.g. switching away from demo data) must not greet Adelka with hundreds of "new" listings.
  if (result.initialImport) await repo.setState(LAST_SEEN_KEY, new Date().toISOString());

  let email: { sent: boolean; detail: string } = { sent: false, detail: "nič nové na hlásenie" };
  if (digest) {
    if (!isEmailConfigured()) {
      email = { sent: false, detail: "email preskočený: chýba RESEND_API_KEY alebo NOTIFY_EMAIL" };
    } else {
      const sent = await sendEmail({ to: notifyRecipients(), ...digest });
      email = sent.sent ? { sent: true, detail: sent.id } : { sent: false, detail: sent.reason };
    }
  }

  return Response.json({
    provider: provider.id,
    areas: areas.length,
    total: result.total,
    inserted: result.inserted.length,
    priceChanged: result.priceChanged.length,
    removed: result.removed,
    initialImport: result.initialImport,
    rechecked: result.rechecked ?? null,
    reported: digest?.count ?? 0,
    errors: result.errors,
    email,
  });
}

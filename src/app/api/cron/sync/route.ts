import { getRepo } from "@/lib/db/repo";
import { isEmailConfigured, notifyRecipients, sendEmail } from "@/lib/email";
import { LAST_SEEN_KEY } from "@/lib/greeting";
import { buildDigest, getAppUrl } from "@/lib/notify";
import { getProvider } from "@/lib/providers";
import { bandKm, getSearchSettings } from "@/lib/search-settings";
import { LUBKO_EMAIL_DEFAULT } from "@/lib/ad-report";
import { rejectUnlessCronSecret } from "@/lib/secrets";

/** Billing cycle (its start) for which Lubko was already told that the Apify budget is spent. */
const BUDGET_WARNED_KEY = "apify_budget_warned";
import { syncFromProvider } from "@/lib/sync";
import { withoutOverlaps } from "@/lib/follow";

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
  const [areas, settings] = await Promise.all([repo.listSearchAreas(), getSearchSettings(repo)]);
  // A province whose whole region is followed too is searched with the region, not paid twice.
  const result = await syncFromProvider(repo, provider, withoutOverlaps(areas), { recheck: true, bandKm: bandKm(settings), budget: "nightly" });
  if (result.skipped) {
    // Lubko hears about a spent budget once per billing cycle; a skipped night to stay on pace is routine.
    let warned = false;
    if (result.skipped.hard && (await repo.getState<string>(BUDGET_WARNED_KEY)) !== result.skipped.cycleStart) {
      try {
        const to = (process.env.LUBKO_EMAIL ?? LUBKO_EMAIL_DEFAULT).split(",").map((s) => s.trim()).filter(Boolean);
        const sent = await sendEmail({
          to,
          subject: "La casetta: rozpočet na Apify je tento mesiac minutý",
          text: `${result.skipped.reason}\n\nRozpočet zvýšiš premennou APIFY_MONTHLY_BUDGET_USD vo Verceli (a limitom v Apify).`,
          html: `<p>${result.skipped.reason}</p><p>Rozpočet zvýšiš premennou APIFY_MONTHLY_BUDGET_USD vo Verceli (a limitom v Apify).</p>`,
        });
        warned = sent.sent;
        if (warned) await repo.setState(BUDGET_WARNED_KEY, result.skipped.cycleStart);
      } catch (error) {
        console.error("Budget warning email failed", error);
      }
    }
    return Response.json({ provider: provider.id, areas: areas.length, skipped: result.skipped, warned });
  }
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
    bandKm: bandKm(settings),
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

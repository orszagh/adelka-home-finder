import { getRepo } from "@/lib/db/repo";
import { isEmailConfigured, notifyRecipients, sendEmail } from "@/lib/email";
import { buildDigest, getAppUrl } from "@/lib/notify";
import { getProvider } from "@/lib/providers";
import { safeEqual } from "@/lib/secrets";
import { syncFromProvider } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Called daily by Vercel Cron (see vercel.json), which sends
 * `Authorization: Bearer $CRON_SECRET`. n8n or any scheduler can call it too.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return Response.json({ error: "CRON_SECRET nie je nastavený" }, { status: 500 });
    }
  } else if (!safeEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repo = getRepo();
  const provider = getProvider();
  const result = await syncFromProvider(repo, provider);
  const digest = buildDigest(result, await repo.listSearchAreas(), getAppUrl());

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
    total: result.total,
    inserted: result.inserted.length,
    priceChanged: result.priceChanged.length,
    reported: digest?.count ?? 0,
    email,
  });
}

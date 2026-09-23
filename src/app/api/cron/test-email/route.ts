import { getRepo } from "@/lib/db/repo";
import { isEmailConfigured, notifyRecipients, sendEmail } from "@/lib/email";
import { buildDigest, getAppUrl } from "@/lib/notify";
import { rejectUnlessCronSecret } from "@/lib/secrets";

export const dynamic = "force-dynamic";

const SAMPLE_PRICE_DROP = 10_000;

/**
 * Sends a sample notification built from real listings in the database,
 * so the Resend setup can be checked without waiting for new listings.
 * POST only, so link previews or crawlers never trigger it.
 */
export async function POST(request: Request) {
  const rejected = rejectUnlessCronSecret(request);
  if (rejected) return rejected;

  if (!isEmailConfigured()) {
    return Response.json({ error: "Chýba RESEND_API_KEY alebo NOTIFY_EMAIL" }, { status: 500 });
  }

  const [first, second, third] = await getRepo().listProperties();
  if (!first) {
    return Response.json({ error: "V databáze nie sú žiadne inzeráty, najprv otvor appku alebo spusti sync" }, { status: 409 });
  }

  const sample = {
    total: 3,
    initialImport: false,
    removed: 0,
    errors: [] as string[],
    inserted: [first, second].filter((p) => p !== undefined),
    priceChanged: third
      ? [{ property: third, previousPrice: third.price === null ? null : third.price + SAMPLE_PRICE_DROP }]
      : [],
  };
  // No areas passed: the sample must not depend on which areas Adelka has drawn.
  const digest = buildDigest(sample, [], getAppUrl())!;
  const to = notifyRecipients();

  try {
    const sent = await sendEmail({
      to,
      subject: `[TEST] ${digest.subject}`,
      html: digest.html,
      text: `TESTOVACÍ EMAIL – ukážka upozornenia, nie skutočné novinky.\n\n${digest.text}`,
    });
    if (!sent.sent) return Response.json({ error: sent.reason }, { status: 500 });
    return Response.json({ sent: true, id: sent.id, to });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Odoslanie zlyhalo" },
      { status: 502 },
    );
  }
}

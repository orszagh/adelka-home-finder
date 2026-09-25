"use server";

import { AD_LOG_KEY, type AdLogEntry, LUBKO_EMAIL_DEFAULT, appendToLog, buildAdEmail, parseAdChoice } from "@/lib/ad-report";
import { getRepo } from "@/lib/db/repo";
import { sendEmail } from "@/lib/email";
import { assertSession } from "@/lib/session";

/**
 * Adelka tapped a button in Lubko's ad: remember it (app_state) and let
 * Lubko know by email. Never fails loudly: the joke must go on.
 */
export async function reportAdChoice(input: unknown): Promise<void> {
  await assertSession();
  const event = parseAdChoice(input);
  if (!event) return;
  const now = new Date();
  const repo = getRepo();
  try {
    const log = await repo.getState<AdLogEntry[]>(AD_LOG_KEY);
    await repo.setState(AD_LOG_KEY, appendToLog(log, { ...event, at: now.toISOString() }));
  } catch (error) {
    console.error("Saving the ad choice failed", error);
  }
  try {
    const to = (process.env.LUBKO_EMAIL ?? LUBKO_EMAIL_DEFAULT).split(",").map((s) => s.trim()).filter(Boolean);
    await sendEmail({ to, ...buildAdEmail(event, now) });
  } catch (error) {
    console.error("Emailing Lubko about the ad failed", error);
  }
}

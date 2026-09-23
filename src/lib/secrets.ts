import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time string comparison (hashing first equalizes lengths). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Guards endpoints meant for schedulers and manual checks:
 * requires `Authorization: Bearer $CRON_SECRET`. Returns an error response,
 * or null when the request may proceed.
 */
export function rejectUnlessCronSecret(request: Request): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return Response.json({ error: "CRON_SECRET nie je nastavený" }, { status: 500 });
    }
    return null;
  }
  if (!safeEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

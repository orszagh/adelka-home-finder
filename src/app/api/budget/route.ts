import { getProvider } from "@/lib/providers";
import { hasSession } from "@/lib/session";

/** Spent and allowed Apify credit this month, for the cost estimate in the follow panel. */
export async function GET() {
  if (!(await hasSession())) return new Response(null, { status: 401 });
  const usage = await getProvider().usage?.().catch(() => null);
  if (!usage) return new Response(null, { status: 204 });
  return Response.json(usage, { headers: { "Cache-Control": "private, max-age=600" } });
}

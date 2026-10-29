import { getRepo } from "@/lib/db/repo";
import { hasSession, unauthorized } from "@/lib/session";
import { buildVisitIcs } from "@/lib/visit-calendar";
import { getVisits } from "@/lib/visits";

/** The booked viewing as a calendar event; on the iPhone it opens straight in "Add to Calendar". */
export async function GET(request: Request, ctx: RouteContext<"/api/visit-calendar/[id]">) {
  if (!(await hasSession())) return unauthorized();
  const { id } = await ctx.params;
  const repo = getRepo();
  const [property, visits] = await Promise.all([repo.getProperty(id), getVisits(repo)]);
  const visit = visits[id];
  const ics = property && visit?.status === "booked" ? buildVisitIcs(property, visit, new URL(request.url).origin) : null;
  if (!ics) return Response.json({ error: "Obhliadka nemá dátum." }, { status: 404 });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="obhliadka.ics"`,
      "Cache-Control": "no-store",
    },
  });
}

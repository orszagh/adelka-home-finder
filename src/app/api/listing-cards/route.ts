import { getRepo } from "@/lib/db/repo";
import { hasSession, unauthorized } from "@/lib/session";

/** At most this many cards per request (the list shows 30 at a time). */
const MAX_CARDS = 60;

/** Cards for the houses on screen (?ids=a,b,c): the home page only has the numbers of each listing. */
export async function GET(request: Request) {
  if (!(await hasSession())) return unauthorized();
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .filter((id) => id.length > 0 && id.length <= 100)
    .slice(0, MAX_CARDS);
  const cards = ids.length > 0 ? await getRepo().listCards(ids) : [];
  return Response.json(cards, { headers: { "Cache-Control": "private, max-age=600" } });
}

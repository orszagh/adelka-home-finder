import { AiError, generateStructured } from "@/lib/ai/claude";
import {
  LOCATION_SYSTEM_PROMPT,
  LocationSummarySchema,
  locationPrompt,
  toLocationNote,
} from "@/lib/ai/location";
import { getRepo } from "@/lib/db/repo";

export const maxDuration = 120;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { propertyId?: unknown; refresh?: unknown } | null;
  if (typeof body?.propertyId !== "string") {
    return Response.json({ error: "Chýba propertyId" }, { status: 400 });
  }

  const repo = getRepo();
  const property = await repo.getProperty(body.propertyId);
  if (!property) return Response.json({ error: "Inzerát neexistuje" }, { status: 404 });

  const cached = await repo.getLocationNote(property.city, property.region);
  if (cached && body.refresh !== true) return Response.json({ note: cached });

  try {
    const summary = await generateStructured({
      system: LOCATION_SYSTEM_PROMPT,
      prompt: locationPrompt(property.city, property.region),
      schema: LocationSummarySchema,
    });
    const note = await repo.upsertLocationNote(toLocationNote(property.city, property.region, summary));
    return Response.json({ note });
  } catch (error) {
    if (error instanceof AiError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}

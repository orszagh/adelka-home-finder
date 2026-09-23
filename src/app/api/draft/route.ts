import { AiError, generateStructured } from "@/lib/ai/claude";
import { DRAFT_SYSTEM_PROMPT, MessageDraftSchema, draftPrompt } from "@/lib/ai/draft";
import { getRepo } from "@/lib/db/repo";
import { MAX_INTENT, MAX_SIGNATURE } from "@/lib/message";

export const maxDuration = 120;

/** Returns a draft only. Sending is always done by Adelka herself, outside the app. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    propertyId?: unknown;
    intent?: unknown;
    signature?: unknown;
  } | null;

  const intent = typeof body?.intent === "string" ? body.intent.trim() : "";
  const signature = typeof body?.signature === "string" ? body.signature.trim() : "";
  if (typeof body?.propertyId !== "string") {
    return Response.json({ error: "Chýba propertyId" }, { status: 400 });
  }
  if (intent.length === 0) {
    return Response.json({ error: "Napíš, čo chceš realitke povedať." }, { status: 400 });
  }
  if (intent.length > MAX_INTENT) {
    return Response.json({ error: `Zámer je príliš dlhý (max. ${MAX_INTENT} znakov).` }, { status: 400 });
  }

  const property = await getRepo().getProperty(body.propertyId);
  if (!property) return Response.json({ error: "Inzerát neexistuje" }, { status: 404 });

  try {
    const draft = await generateStructured({
      system: DRAFT_SYSTEM_PROMPT,
      prompt: draftPrompt(property, intent, signature.slice(0, MAX_SIGNATURE) || "Adelka"),
      schema: MessageDraftSchema,
    });
    return Response.json({ draft });
  } catch (error) {
    if (error instanceof AiError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}

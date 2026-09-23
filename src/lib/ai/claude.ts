import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

/** User-facing failure; the message is safe to show in the UI (Slovak). */
export class AiError extends Error {}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!isAiConfigured()) {
    throw new AiError("AI nie je nastavená (chýba ANTHROPIC_API_KEY).");
  }
  client ??= new Anthropic();
  return client;
}

/**
 * One structured-output request. On a safety decline the API retries on a
 * fallback model inside the same call (`fallbacks: "default"`).
 */
export async function generateStructured<Schema extends z.ZodType>(options: {
  system: string;
  prompt: string;
  schema: Schema;
  effort?: "low" | "medium" | "high";
}): Promise<z.infer<Schema>> {
  let response;
  try {
    response = await getClient().beta.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: options.system,
      messages: [{ role: "user", content: options.prompt }],
      output_config: {
        effort: options.effort ?? "medium",
        format: zodOutputFormat(options.schema),
      },
    });
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (error instanceof Anthropic.RateLimitError) {
      throw new AiError("AI je momentálne preťažená, skús to o chvíľu.");
    }
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AiError("Neplatný ANTHROPIC_API_KEY.");
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API error", error.status, error.message);
      throw new AiError("AI služba vrátila chybu, skús to znova.");
    }
    throw error;
  }

  if (response.stop_reason === "refusal") {
    throw new AiError("AI túto požiadavku odmietla spracovať.");
  }
  if (response.stop_reason === "max_tokens" || response.parsed_output === null) {
    throw new AiError("AI nevrátila úplnú odpoveď, skús to znova.");
  }
  return response.parsed_output as z.infer<Schema>;
}

import { z } from "zod";
import { formatPrice } from "../format";
import type { MessageDraft } from "../message";
import type { Property } from "../types";

export const MessageDraftSchema: z.ZodType<MessageDraft> = z.object({
  subject_it: z.string().describe("krátky predmet emailu po taliansky"),
  body_it: z.string().describe("celý text emailu po taliansky vrátane oslovenia a podpisu"),
  translation_sk: z.string().describe("presný slovenský preklad body_it, aby Adelka rozumela, čo posiela"),
});

export const DRAFT_SYSTEM_PROMPT = `Pripravuješ návrh emailu, ktorý Adelka (Slovenka, kupuje domček pri mori v Taliansku) sama skontroluje a odošle realitnej kancelárii alebo predajcovi.
Píš zdvorilou, prirodzenou taliančinou (formálne "Lei"), stručne a jasne.
Použi len fakty zo zámeru a z údajov o inzeráte. Nič si nevymýšľaj: žiadne termíny, sumy, telefónne čísla ani sľuby, ktoré Adelka neuviedla.
Ak zámer obsahuje ponuku ceny alebo záväzok, sformuluj ho presne tak, ako ho Adelka zadala, nič nepridávaj.
Ak Adelka nepíše po taliansky, môžeš vo formulácii uviesť, že komunikuje aj po anglicky.
Podpíš email menom, ktoré Adelka zadala.`;

export function draftPrompt(property: Property, intent: string, signature: string): string {
  const facts = [
    `Názov: ${property.title}`,
    `Lokalita: ${property.city}, ${property.region}`,
    `Cena: ${formatPrice(property.price)}`,
    property.area_sqm ? `Plocha: ${property.area_sqm} m²` : null,
    property.rooms ? `Izby: ${property.rooms}` : null,
    property.listing_url ? `Odkaz na inzerát: ${property.listing_url}` : null,
    `Portál: ${property.source}, ID inzerátu: ${property.external_id}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `Údaje o inzeráte:
${facts}

Zámer Adelky (po slovensky):
${intent}

Podpis: ${signature}`;
}

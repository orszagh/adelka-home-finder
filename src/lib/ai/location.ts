import { z } from "zod";
import type { LocationNoteInput } from "../db/repo";

export const LocationSummarySchema = z.object({
  summary: z.string().describe("2-4 vety: aké je to miesto na bývanie pri mori, pre koho sa hodí"),
  infrastructure: z.string().describe("obchody, lekár/nemocnica, lekáreň, reštaurácie, internet, služby počas celého roka vs. len v sezóne"),
  accessibility: z.string().describe("najbližšie letiská, vlaky, diaľnice s orientačnými vzdialenosťami/časmi; dostupnosť zo Slovenska"),
  climate_risks: z.string().describe("horúčavy, sucho, lesné požiare, búrky/záplavy, erózia pobrežia, zemetrasenia"),
  groundwater_risks: z.string().describe("hydrogeologické riziko, záplavové zóny, zosuvy, vlhkosť, spodná voda; odkaz na ISPRA IdroGEO a PAI"),
  highlights: z.array(z.string()).describe("3-6 krátkych zaujímavostí o mieste"),
});

export type LocationSummary = z.infer<typeof LocationSummarySchema>;

export const LOCATION_SYSTEM_PROMPT = `Si pozorný poradca pre Slovenku, ktorá hľadá na kúpu domček pri mori v Taliansku.
Píšeš po slovensky, stručne, vecne a zrozumiteľne pre netechnického človeka.
Vychádzaš zo svojich všeobecných znalostí. Keď si niečím nie si istý, povedz to priamo, nič si nevymýšľaj a nepíš presné čísla, ktoré nepoznáš.
Pri rizikách uveď, kde si ich môže overiť (ISPRA IdroGEO – idrogeo.isprambiente.it, Piano di Assetto Idrogeologico regiónu, obecný úrad).`;

export function locationPrompt(city: string, region: string | null): string {
  return `Priprav prehľad lokality ${city}${region ? ` (región ${region})` : ""}, Taliansko, z pohľadu kúpy domu na bývanie alebo trávenie dlhších pobytov.`;
}

/** Maps the structured answer onto the existing `location_notes` columns. */
export function toLocationNote(
  city: string,
  region: string | null,
  s: LocationSummary,
): LocationNoteInput {
  const highlights = s.highlights.map((h) => `• ${h}`).join("\n");
  return {
    city,
    region,
    ai_summary: highlights ? `${s.summary}\n\n${highlights}` : s.summary,
    infrastructure_notes: `${s.infrastructure}\n\nDostupnosť: ${s.accessibility}`,
    climate_risk_notes: s.climate_risks,
    groundwater_risk_notes: s.groundwater_risks,
  };
}

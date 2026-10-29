"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import type { LocationNote } from "@/lib/types";
import { Button, Eyebrow, ICONS, Icon } from "./ui";

const SECTIONS: { key: keyof LocationNote; title: string; icon: string }[] = [
  { key: "ai_summary", title: "Celkový dojem", icon: ICONS.home },
  { key: "infrastructure_notes", title: "Infraštruktúra a dostupnosť", icon: ICONS.navigate },
  { key: "climate_risk_notes", title: "Počasie a klimatické riziká", icon: ICONS.sun },
  { key: "groundwater_risk_notes", title: "Spodná voda, záplavy, zosuvy", icon: ICONS.droplet },
];

export function LocationSummary({
  propertyId,
  city,
  initialNote,
  aiEnabled,
}: {
  propertyId: string;
  city: string;
  initialNote: LocationNote | null;
  aiEnabled: boolean;
}) {
  const [note, setNote] = useState(initialNote);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const load = async (refresh: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/location-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, refresh }),
      });
      const data = (await response.json().catch(() => ({}))) as { note?: LocationNote; error?: string };
      if (!response.ok || !data.note) throw new Error(data.error ?? "Prehľad sa nepodarilo pripraviť.");
      setNote(data.note);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prehľad sa nepodarilo pripraviť.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="location-heading" className="space-y-3 rounded-3xl bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Eyebrow tone="muted">Prehľad lokality</Eyebrow>
          <h2 id="location-heading" className="font-display text-2xl font-semibold text-ink">
            {city}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {note && !loading && aiEnabled && (
            <Button variant="ghost" onClick={() => load(true)}>
              Obnoviť
            </Button>
          )}
          <button
            type="button"
            onClick={() => setHelpOpen((open) => !open)}
            aria-expanded={helpOpen}
            aria-controls="location-help"
            aria-label="Ako funguje prehľad lokality"
            className="-mr-2 grid size-11 place-items-center rounded-full text-muted hover:text-ink"
          >
            <span
              aria-hidden
              className={`grid size-7 place-items-center rounded-full border text-sm font-bold ${
                helpOpen ? "border-accent bg-accent text-on-accent" : "border-line"
              }`}
            >
              ?
            </span>
          </button>
        </div>
      </div>

      {helpOpen && (
        <div id="location-help" className="animate-fade-up space-y-2 rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-ink-2">
          <p className="font-semibold text-ink">Ako to funguje</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              Po ťuknutí na tlačidlo appka požiada umelú inteligenciu (Claude od Anthropicu) o prehľad mesta <b>{city}</b> –
              nie konkrétneho domu.
            </li>
            <li>
              AI píše zo svojich všeobecných znalostí: z verejných zdrojov, na ktorých sa učila (sprievodcovia, encyklopédie,
              správy, mapy). Internet práve teraz neprehľadáva a inzerát ani fotky nevidí.
            </li>
            <li>
              Dostaneš celkový dojem, obchody a lekárov, dopravu (letiská, vlaky, diaľnice), počasie a riziká ako horúčavy,
              požiare, záplavy či zosuvy.
            </li>
            <li>
              Prehľad sa uloží k mestu, takže pri ďalšom dome z {city} sa ukáže hneď. „Obnoviť“ ho napíše nanovo.
            </li>
            <li>
              Je to orientácia, nie posudok. AI sa môže mýliť alebo nemať čerstvé informácie. Riziká si over na{" "}
              <a
                href="https://idrogeo.isprambiente.it"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-accent-ink underline"
              >
                idrogeo.isprambiente.it
              </a>{" "}
              (mapa záplav a zosuvov) alebo na obecnom úrade.
            </li>
          </ul>
        </div>
      )}

      {!note && !loading && (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            AI ti pripraví krátky prehľad: čo je v okolí, ako sa tam dostať, aké je počasie a či tam hrozia záplavy alebo iné
            riziká.
          </p>
          <Button onClick={() => load(false)} disabled={!aiEnabled}>
            Zobraziť prehľad lokality
          </Button>
          {!aiEnabled && <p className="text-sm text-muted">AI zatiaľ nie je zapnutá – Lubko ju musí nastaviť.</p>}
        </div>
      )}

      {loading && (
        <p className="animate-pulse text-sm text-muted" role="status">
          Pripravujem prehľad… môže to trvať do minúty.
        </p>
      )}

      {error && (
        <p className="rounded-2xl bg-love-soft px-4 py-3 text-sm text-love-ink" role="alert">
          {error}
        </p>
      )}

      {note && !loading && (
        <div className="space-y-4">
          {SECTIONS.map(({ key, title, icon }) =>
            note[key] ? (
              <div key={key}>
                <h3 className="flex items-center gap-2 font-semibold text-ink">
                  <Icon d={icon} size={18} className="shrink-0 text-accent-ink" />
                  {title}
                </h3>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-2">{note[key]}</p>
              </div>
            ) : null,
          )}
          <p className="text-xs text-muted">
            Pripravila AI {formatDate(note.generated_at)} zo všeobecných znalostí. Ber to ako orientáciu – riziká si over na
            idrogeo.isprambiente.it alebo na obecnom úrade.
          </p>
        </div>
      )}
    </section>
  );
}

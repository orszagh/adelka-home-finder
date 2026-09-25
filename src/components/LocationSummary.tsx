"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import type { LocationNote } from "@/lib/types";
import { Button, Eyebrow } from "./ui";

const SECTIONS: { key: keyof LocationNote; title: string; icon: string }[] = [
  { key: "ai_summary", title: "Celkový dojem", icon: "🏘️" },
  { key: "infrastructure_notes", title: "Infraštruktúra a dostupnosť", icon: "🚆" },
  { key: "climate_risk_notes", title: "Počasie a klimatické riziká", icon: "🌡️" },
  { key: "groundwater_risk_notes", title: "Spodná voda, záplavy, zosuvy", icon: "💧" },
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
        {note && !loading && aiEnabled && (
          <Button variant="ghost" onClick={() => load(true)}>
            Obnoviť
          </Button>
        )}
      </div>

      {!note && !loading && (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            AI ti pripraví krátky prehľad: čo je v okolí, ako sa tam dostať, aké je počasie a či tam hrozia záplavy alebo iné
            riziká.
          </p>
          <Button onClick={() => load(false)} disabled={!aiEnabled}>
            Zobraziť prehľad lokality
          </Button>
          {!aiEnabled && <p className="text-sm text-muted">AI zatiaľ nie je nastavená (chýba ANTHROPIC_API_KEY).</p>}
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
                <h3 className="font-semibold text-ink">
                  <span aria-hidden>{icon}</span> {title}
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

"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import type { LocationNote } from "@/lib/types";

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
    <section aria-labelledby="location-heading" className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="location-heading" className="text-lg font-semibold">
          O lokalite {city}
        </h2>
        {note && !loading && aiEnabled && (
          <button type="button" onClick={() => load(true)} className="text-sm font-medium text-sea-700 hover:underline">
            ↻ Obnoviť
          </button>
        )}
      </div>

      {!note && !loading && (
        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            AI ti pripraví krátky prehľad: čo je v okolí, ako sa tam dostať, aké je počasie a či tam hrozia záplavy alebo iné
            riziká.
          </p>
          <button
            type="button"
            onClick={() => load(false)}
            disabled={!aiEnabled}
            className="rounded-full bg-sea-700 px-4 py-2 text-sm font-medium text-white hover:bg-sea-800 disabled:opacity-40"
          >
            ✨ Zobraziť prehľad lokality
          </button>
          {!aiEnabled && <p className="text-sm text-slate-500">AI zatiaľ nie je nastavená (chýba ANTHROPIC_API_KEY).</p>}
        </div>
      )}

      {loading && (
        <p className="animate-pulse text-sm text-slate-600" role="status">
          Pripravujem prehľad… môže to trvať do minúty.
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 ring-1 ring-rose-200" role="alert">
          {error}
        </p>
      )}

      {note && !loading && (
        <div className="space-y-4">
          {SECTIONS.map(({ key, title, icon }) =>
            note[key] ? (
              <div key={key}>
                <h3 className="font-medium text-slate-900">
                  <span aria-hidden>{icon}</span> {title}
                </h3>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">{note[key]}</p>
              </div>
            ) : null,
          )}
          <p className="text-xs text-slate-500">
            Pripravila AI {formatDate(note.generated_at)} zo všeobecných znalostí. Ber to ako orientáciu – riziká si over na
            idrogeo.isprambiente.it alebo na obecnom úrade.
          </p>
        </div>
      )}
    </section>
  );
}

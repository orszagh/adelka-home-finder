"use client";

import { useTransition } from "react";
import { deleteArea } from "@/app/actions";
import type { SearchArea } from "@/lib/types";

export function AreaBar({
  areas,
  activeAreaIds,
  onToggle,
  onOpenChooser,
  onStartDrawing,
  busy,
}: {
  areas: SearchArea[];
  activeAreaIds: string[];
  onToggle: (id: string) => void;
  onOpenChooser: () => void;
  onStartDrawing: () => void;
  /** Drawing or choosing is in progress. */
  busy: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <section aria-labelledby="areas-heading" className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="areas-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Moje oblasti
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenChooser}
            disabled={busy}
            className="rounded-full bg-sea-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-sea-800 disabled:opacity-50"
          >
            🗺️ Vybrať na mape
          </button>
          <button
            type="button"
            onClick={onStartDrawing}
            disabled={busy}
            title="Nakresli si vlastnú oblasť ťukaním na mapu"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-sea-800 ring-1 ring-sea-600 hover:bg-sea-50 disabled:opacity-50"
          >
            ✏️ Nakresliť
          </button>
        </div>
      </div>

      {areas.length === 0 && (
        <p className="text-sm text-slate-600">
          Zatiaľ nemáš žiadnu oblasť. Vyber si na mape región alebo provinciu pri mori, prípadne si oblasť nakresli.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {areas.map((area) => {
          const active = activeAreaIds.includes(area.id);
          return (
            <span
              key={area.id}
              className={`inline-flex items-center rounded-full text-sm ring-1 ${
                active ? "bg-sea-50 text-sea-800 ring-sea-600" : "bg-white text-slate-500 ring-slate-300"
              }`}
            >
              <button
                type="button"
                onClick={() => onToggle(area.id)}
                aria-pressed={active}
                className="py-1.5 pl-3 pr-1"
                title={active ? "Skryť ponuky z tejto oblasti" : "Zobraziť ponuky z tejto oblasti"}
              >
                {active ? "✓ " : ""}
                {area.name}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirm(`Naozaj zmazať oblasť „${area.name}“?`)) {
                    startTransition(() => deleteArea(area.id));
                  }
                }}
                aria-label={`Zmazať oblasť ${area.name}`}
                className="py-1.5 pl-1 pr-3 text-slate-400 hover:text-rose-600"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { useTransition } from "react";
import { deleteArea } from "@/app/actions";
import type { SearchArea } from "@/lib/types";

export function AreaBar({
  areas,
  activeAreaIds,
  onToggle,
  onOpenChooser,
  busy,
}: {
  areas: SearchArea[];
  activeAreaIds: string[];
  onToggle: (id: string) => void;
  onOpenChooser: () => void;
  /** Choosing places on the map is in progress. */
  busy: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <section aria-labelledby="areas-heading" className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="areas-heading" className="text-sm font-semibold uppercase tracking-wide text-muted">
          Moje oblasti
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenChooser}
            disabled={busy}
            className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-strong disabled:opacity-50"
          >
            🗺️ Vybrať na mape
          </button>
        </div>
      </div>

      {areas.length === 0 && (
        <p className="text-sm text-muted">
          Zatiaľ nemáš žiadnu oblasť. Vyber si na mape región alebo provinciu pri mori.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {areas.map((area) => {
          const active = activeAreaIds.includes(area.id);
          return (
            <span
              key={area.id}
              className={`inline-flex items-center rounded-full text-sm ring-1 ${
                active ? "bg-accent-soft text-accent-ink ring-accent" : "bg-surface text-muted ring-line-strong"
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
                className="py-1.5 pl-1 pr-3 text-faint hover:text-love"
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

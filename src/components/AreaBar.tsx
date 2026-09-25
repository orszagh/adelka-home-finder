"use client";

import { useTransition } from "react";
import { deleteArea } from "@/app/actions";
import type { SearchArea } from "@/lib/types";
import { Button, ICONS, Icon, chipClass } from "./ui";

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
    <section aria-labelledby="areas-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="areas-heading" className="text-xs font-bold uppercase tracking-[0.14em] text-muted">
          Moje oblasti
        </h2>
        <Button variant="secondary" onClick={onOpenChooser} disabled={busy}>
          <Icon d={ICONS.map} size={18} />
          Vybrať na mape
        </Button>
      </div>

      {areas.length === 0 && (
        <p className="text-sm text-muted">Zatiaľ nemáš žiadnu oblasť. Vyber si na mape región alebo provinciu pri mori.</p>
      )}

      <div className="flex flex-wrap gap-2">
        {areas.map((area) => {
          const active = activeAreaIds.includes(area.id);
          return (
            <span key={area.id} className={chipClass(active, "pl-0 pr-0")}>
              <button
                type="button"
                onClick={() => onToggle(area.id)}
                aria-pressed={active}
                className="min-h-11 pl-3.5 pr-1"
                title={active ? "Skryť ponuky z tejto oblasti" : "Zobraziť ponuky z tejto oblasti"}
              >
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
                className="grid min-h-11 place-items-center pl-1 pr-3 opacity-60 hover:opacity-100"
              >
                <Icon d={ICONS.close} size={14} />
              </button>
            </span>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { useTransition } from "react";
import { createPresetArea, deleteArea, type AreaResult } from "@/app/actions";
import { REGION_PRESETS } from "@/lib/regions";
import type { SearchArea } from "@/lib/types";

export function AreaBar({
  areas,
  activeAreaIds,
  onToggle,
  onStartDrawing,
  onAreaCreating,
  onAreaCreated,
  drawing,
}: {
  areas: SearchArea[];
  activeAreaIds: string[];
  onToggle: (id: string) => void;
  onStartDrawing: () => void;
  onAreaCreating: () => void;
  onAreaCreated: (result: AreaResult) => void;
  drawing: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const missingPresets = REGION_PRESETS.filter((p) => !areas.some((a) => a.name === p.name));

  return (
    <section aria-labelledby="areas-heading" className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 id="areas-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Moje oblasti
        </h2>
        <button
          type="button"
          onClick={onStartDrawing}
          disabled={drawing}
          className="rounded-full bg-sea-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-sea-800 disabled:opacity-50"
        >
          ✏️ Nakresliť oblasť
        </button>
      </div>

      {areas.length === 0 && (
        <p className="text-sm text-slate-600">
          Zatiaľ nemáš žiadnu oblasť, preto vidíš všetky ponuky. Nakresli si oblasť na mape alebo pridaj celý región:
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
        {missingPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                onAreaCreating();
                onAreaCreated(await createPresetArea(preset.id));
              })
            }
            className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:border-sea-600 hover:text-sea-800 disabled:opacity-50"
          >
            + {preset.name}
          </button>
        ))}
      </div>
    </section>
  );
}

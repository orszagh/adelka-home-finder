"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { type SaveSettingsResult, saveSearchSettings } from "@/app/actions";
import { COAST_BAND_KM, INLAND_OPTIONS, type SearchSettings, formatSearchSettings } from "@/lib/search-settings";

const DISTANCES: { value: SearchSettings["inlandKm"]; label: string }[] = [
  ...INLAND_OPTIONS.map((km) => ({ value: km, label: `${km} km` })),
  { value: null, label: "Celá oblasť" },
];

export function SearchSettingsForm({ initial }: { initial: SearchSettings }) {
  const [settings, setSettings] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [result, setResult] = useState<SaveSettingsResult | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = settings.inland !== saved.inland || settings.inlandKm !== saved.inlandKm;

  const save = () =>
    startTransition(async () => {
      setResult(null);
      const next = await saveSearchSettings(settings);
      setResult(next);
      if (next.ok) setSaved(settings);
    });

  return (
    <div className="space-y-4">
      <section className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-sea-50 text-xl">
          🌊
        </span>
        <div>
          <h2 className="font-semibold text-slate-900">Vždy hľadám pri mori</h2>
          <p className="text-sm text-slate-600">
            Pás {COAST_BAND_KM} km od pobrežia: k moru dôjdeš pešo alebo na bicykli.
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex min-h-12 items-center gap-3">
          <div className="flex-1">
            <h2 id="inland-label" className="font-semibold text-slate-900">
              Hľadať aj vnútrozemie
            </h2>
            <p className="text-sm text-slate-600">Viac domčekov, ale ďalej od vody</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.inland}
            aria-labelledby="inland-label"
            onClick={() => setSettings((s) => ({ ...s, inland: !s.inland }))}
            className={`flex h-8 w-13 shrink-0 items-center rounded-full p-1 transition-colors ${
              settings.inland ? "bg-sea-700" : "bg-slate-300"
            }`}
          >
            <span
              className={`size-6 rounded-full bg-white shadow transition-transform ${
                settings.inland ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {settings.inland && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-600">Ako ďaleko od mora</legend>
            <div className="grid grid-cols-2 gap-2">
              {DISTANCES.map((d) => {
                const on = settings.inlandKm === d.value;
                return (
                  <button
                    key={d.label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSettings((s) => ({ ...s, inlandKm: d.value }))}
                    className={`h-12 rounded-xl text-sm font-semibold transition ${
                      on ? "bg-sea-50 text-sea-800 ring-2 ring-sea-700" : "bg-white text-slate-800 ring-1 ring-slate-300"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
      </section>

      <p className="px-1 text-sm text-slate-600">
        Platí na mobile aj počítači. Podľa tohto hľadá Lubkov nočný pomocník každé ráno.
      </p>

      {pending && (
        <div role="status" className="flex items-center gap-3 rounded-2xl bg-sea-700 p-4 text-white shadow-lg">
          <span aria-hidden className="size-6 shrink-0 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
          <div>
            <p className="font-semibold">Hľadám domčeky · {formatSearchSettings(settings)}</p>
            <p className="text-sm text-sea-100">Môže to trvať do minúty.</p>
          </div>
        </div>
      )}

      {!pending && result && (
        <div
          role="status"
          className={`space-y-1 rounded-2xl p-4 ring-1 ${
            !result.ok || result.error ? "bg-rose-50 text-rose-900 ring-rose-200" : "bg-sea-50 text-sea-800 ring-sea-600/30"
          }`}
        >
          <p className="font-semibold">
            {!result.ok
              ? result.error
              : result.fetched === null
                ? "Uložené."
                : `Hotovo, našiel som ${result.fetched} ponúk.`}
          </p>
          {result.ok && result.error && <p className="text-sm">{result.error}</p>}
          {result.ok && (
            <Link href="/" className="text-sm font-semibold underline">
              Ukáž mi domčeky
            </Link>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={pending || !changed}
        className="h-13 w-full rounded-full bg-sea-700 text-base font-semibold text-white shadow-md transition hover:bg-sea-800 disabled:opacity-50"
      >
        {pending ? "Hľadám…" : changed ? "Uložiť a hľadať" : "Uložené"}
      </button>
    </div>
  );
}

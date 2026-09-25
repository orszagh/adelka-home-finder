"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { type SaveSettingsResult, saveSearchSettings } from "@/app/actions";
import { COAST_BAND_KM, INLAND_OPTIONS, type SearchSettings, formatSearchSettings } from "@/lib/search-settings";
import { ICONS, Icon, buttonClass } from "./ui";

const COAST = "M226 0 C206 36 246 58 230 96 C216 128 262 146 250 200";

/** The coast with the searched strip drawn along it; the strip widens with the chosen distance. */
function CoastIllustration({ settings }: { settings: SearchSettings }) {
  const whole = settings.inland && settings.inlandKm === null;
  const band = !settings.inland ? 14 : ({ 10: 34, 20: 58, 40: 96 } as Record<number, number>)[settings.inlandKm ?? 0] ?? 14;
  return (
    <div className="relative h-48 overflow-hidden rounded-3xl bg-accent-soft shadow-card">
      <svg aria-hidden viewBox="0 0 358 200" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <path d={`${COAST} L0 200 L0 0 Z`} fill="var(--c-surface-2)" />
        <path d={`${COAST} L0 200 L0 0 Z`} fill="var(--c-accent)" fillOpacity={whole ? 0.18 : 0} className="transition-[fill-opacity] duration-500" />
        <path
          d={COAST}
          fill="none"
          stroke="var(--c-accent)"
          strokeOpacity={whole ? 0 : 0.22}
          strokeWidth={band}
          strokeLinejoin="round"
          className="transition-[stroke-width,stroke-opacity] duration-500 ease-out motion-reduce:transition-none"
        />
        <path d={COAST} fill="none" stroke="var(--c-accent)" strokeWidth="1.6" strokeOpacity="0.6" />
        <circle cx="236" cy="60" r="5" fill="var(--c-love)" />
        <circle cx="222" cy="120" r="5" fill="var(--c-love)" />
        <circle cx="120" cy="80" r="5" fill="var(--c-love)" fillOpacity={settings.inland ? 1 : 0.25} />
        <circle cx="80" cy="150" r="5" fill="var(--c-love)" fillOpacity={settings.inland ? 1 : 0.25} />
      </svg>
      <span className="absolute right-4 bottom-3 font-display text-sm italic text-accent-ink">more</span>
      <span className="absolute left-3 top-3 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-ink shadow-card">
        {formatSearchSettings(settings)}
      </span>
    </div>
  );
}

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
      <CoastIllustration settings={settings} />
      <section className="flex gap-3 rounded-3xl bg-surface p-4 shadow-card">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Icon d={ICONS.waves} size={22} />
        </span>
        <div>
          <h2 className="font-semibold text-ink">Vždy hľadám pri mori</h2>
          <p className="text-sm text-muted">
            Pás {COAST_BAND_KM} km od pobrežia: k moru dôjdeš pešo alebo na bicykli.
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl bg-surface p-4 shadow-card">
        <div className="flex min-h-12 items-center gap-3">
          <div className="flex-1">
            <h2 id="inland-label" className="font-semibold text-ink">
              Hľadať aj vnútrozemie
            </h2>
            <p className="text-sm text-muted">Viac domčekov, ale ďalej od vody</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.inland}
            aria-labelledby="inland-label"
            onClick={() => setSettings((s) => ({ ...s, inland: !s.inland }))}
            className={`flex h-8 w-13 shrink-0 items-center rounded-full p-1 transition-colors ${
              settings.inland ? "bg-accent" : "bg-line-strong"
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
            <legend className="text-sm font-medium text-muted">Ako ďaleko od mora</legend>
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
                      on ? "bg-accent-soft text-accent-ink ring-2 ring-accent" : "bg-surface text-ink-2 ring-1 ring-line-strong"
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

      <p className="px-1 text-sm text-muted">
        Platí na mobile aj počítači. Podľa tohto hľadá Lubkov nočný pomocník každé ráno.
      </p>

      {pending && (
        <div role="status" className="flex items-center gap-3 rounded-3xl bg-accent p-4 text-on-accent shadow-lift">
          <span aria-hidden className="size-6 shrink-0 animate-spin rounded-full border-[3px] border-on-accent/30 border-t-on-accent" />
          <div>
            <p className="font-semibold">Hľadám domčeky · {formatSearchSettings(settings)}</p>
            <p className="text-sm text-on-accent/80">Môže to trvať do minúty.</p>
          </div>
        </div>
      )}

      {!pending && result && (
        <div
          role="status"
          className={`space-y-1 rounded-2xl p-4 ring-1 ${
            !result.ok || result.error ? "bg-love-soft text-love-ink ring-love/30" : "bg-accent-soft text-accent-ink ring-accent/30"
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
        className={buttonClass("primary", "lg", "w-full")}
      >
        {pending ? "Hľadám…" : changed ? "Uložiť a hľadať" : "Uložené"}
      </button>
    </div>
  );
}

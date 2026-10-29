"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Eyebrow, ICONS, Icon } from "./ui";

/** Remembered per phone: Adelka sees each novelty once. */
const SEEN_KEY = "adelka.novelty.near";
const SHOW_AFTER_MS = 1200;

/** Hearts drifting up behind the icon: left position (%), size, delay (s). */
const HEARTS: [number, number, number][] = [
  [8, 18, 0],
  [22, 12, 1.1],
  [36, 22, 2.2],
  [62, 14, 0.6],
  [76, 20, 1.7],
  [90, 12, 2.8],
  [48, 10, 3.1],
];

function seen(): boolean | null {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return null;
  }
}

/**
 * A small window introducing a new feature, shown once: "Domčeky v okolí".
 * In a visit with a novelty the ad waits for the next one (AdPopup checks data-novelty-shown).
 */
export function FeatureAnnouncement() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Without storage it would come back on every visit, so it stays away.
    if (seen() !== false || new URLSearchParams(window.location.search).has("reklama")) return;
    const id = setTimeout(() => {
      document.documentElement.dataset.noveltyShown = "1";
      setOpen(true);
    }, SHOW_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

  if (!open) return null;
  return (
    <NoveltyDialog
      onClose={() => {
        try {
          localStorage.setItem(SEEN_KEY, new Date().toISOString());
        } catch {}
        setOpen(false);
      }}
    />
  );
}

function NoveltyDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialog.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="novelty-title"
        tabIndex={-1}
        className="relative w-full max-w-[360px] animate-rise overflow-hidden rounded-[28px] bg-surface shadow-lift outline-none"
      >
        <div aria-hidden className="relative h-40 overflow-hidden bg-love-soft">
          {HEARTS.map(([left, size, delay]) => (
            <svg
              key={`${left}-${delay}`}
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill="currentColor"
              className="absolute bottom-0 animate-float-heart text-love"
              style={{ left: `${left}%`, animationDelay: `${delay}s` }}
            >
              <path d={ICONS.heart} />
            </svg>
          ))}
          <span className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-surface text-accent-ink shadow-lift">
            <Icon d={ICONS.locate} size={40} />
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zavrieť"
          className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-surface/80 text-ink hover:bg-surface"
        >
          <Icon d={ICONS.close} size={18} />
        </button>

        <div className="space-y-3 p-5">
          <Eyebrow>Novinka v appke</Eyebrow>
          <h2 id="novelty-title" className="font-display text-[26px] font-semibold leading-tight text-ink">
            Domčeky v okolí
          </h2>
          <p className="text-[15px] leading-relaxed text-ink-2">
            Prídeš do nového mestečka? Ťukni na mape dole na <b>Hľadať v okolí</b> (alebo v menu na <b>Domčeky v okolí</b>). Appka
            zistí, kde stojíš, a ukáže domčeky na predaj v kruhu okolo teba – do 5, 10, 20 alebo 40 km.
          </p>
          <p className="text-[15px] leading-relaxed text-ink-2">
            Keď je to v provincii, ktorú ešte nesledujem, jedným ťuknutím z nej stiahnem ponuky. Tvoja poloha sa nikam neukladá.
          </p>
          <div className="pt-1">
            <Button variant="danger" size="lg" className="w-full" onClick={onClose}>
              <svg aria-hidden width={20} height={20} viewBox="0 0 24 24" fill="currentColor" className="animate-pop">
                <path d={ICONS.heart} />
              </svg>
              Rozumiem
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

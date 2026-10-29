"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type Novelty, NOVELTIES, nextNovelty } from "@/lib/novelties";
import { Button, Eyebrow, ICONS, Icon } from "./ui";

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

/** Keys of the novelties already seen on this phone, or null without storage. */
function seenKeys(): Set<string> | null {
  try {
    return new Set(NOVELTIES.map((n) => n.storageKey).filter((key) => localStorage.getItem(key) !== null));
  } catch {
    return null;
  }
}

/**
 * A small window introducing a new feature: at most one per visit, the oldest one not seen yet (lib/novelties).
 * In a visit with a novelty the ad waits for the next one (AdPopup checks data-novelty-shown).
 */
export function FeatureAnnouncement() {
  const router = useRouter();
  const [novelty, setNovelty] = useState<Novelty | null>(null);

  useEffect(() => {
    // Without storage it would come back on every visit, so it stays away.
    const seen = seenKeys();
    if (!seen || new URLSearchParams(window.location.search).has("reklama")) return;
    const next = nextNovelty(seen);
    if (!next) return;
    const id = setTimeout(() => {
      document.documentElement.dataset.noveltyShown = "1";
      setNovelty(next);
    }, SHOW_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

  if (!novelty) return null;
  const close = (href?: string) => {
    try {
      localStorage.setItem(novelty.storageKey, new Date().toISOString());
    } catch {}
    setNovelty(null);
    if (href) router.push(href);
  };
  return <NoveltyDialog novelty={novelty} onClose={() => close()} onPrimary={() => close(novelty.primary.href)} />;
}

function NoveltyDialog({ novelty, onClose, onPrimary }: { novelty: Novelty; onClose: () => void; onPrimary: () => void }) {
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
            <Icon d={ICONS[novelty.icon]} size={40} />
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
          <Eyebrow>
            <span className="inline-flex items-center gap-1.5">
              Novinka pre Adelku
              <svg aria-hidden width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
                <path d={ICONS.heart} />
              </svg>
            </span>
          </Eyebrow>
          <h2 id="novelty-title" className="font-display text-[26px] font-semibold leading-tight text-ink">
            {novelty.title}
          </h2>
          <div className="space-y-3 text-[15px] leading-relaxed text-ink-2">{novelty.body()}</div>
          <div className="flex flex-col gap-2 pt-1">
            <Button variant="danger" size="lg" className="w-full" onClick={onPrimary}>
              <svg aria-hidden width={20} height={20} viewBox="0 0 24 24" fill="currentColor" className="animate-pop">
                <path d={ICONS.heart} />
              </svg>
              {novelty.primary.label}
            </Button>
            {novelty.later && (
              <Button variant="ghost" className="w-full" onClick={onClose}>
                {novelty.later}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

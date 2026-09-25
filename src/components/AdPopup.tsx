"use client";

import { useEffect, useRef, useState } from "react";
import { reportAdChoice } from "@/app/ad-actions";
import type { AdChoice } from "@/lib/ad-report";
import { type Ad, type KissMilestone, kissesWord, milestoneFor, paidText, pickAd, shouldShowAd, todayKey } from "@/lib/ads";
import { Button, ICONS, Icon } from "./ui";

const LAST_DAY_KEY = "adelka.ad.lastDay";
const KISSES_KEY = "adelka.ad.kisses";
const SHOW_AFTER_MS = 8000;
const CLOSE_AFTER_S = 3;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

type Stage = "ad" | "paid" | "milestone";

/**
 * Lubko's "paid ad": once a day on the home page (or right away with
 * ?reklama=1). Paying with a kiss counts kisses in this browser; at 3 and
 * 10 kisses Lubko gets bolder.
 */
export function AdPopup() {
  const [ad, setAd] = useState<Ad | null>(null);

  useEffect(() => {
    const today = todayKey();
    const forced = new URLSearchParams(window.location.search).get("reklama") === "1";
    // Without storage the ad could not be limited to once a day, so it stays away.
    if (!forced && (!shouldShowAd(read(LAST_DAY_KEY), today) || !write(LAST_DAY_KEY, read(LAST_DAY_KEY) ?? ""))) return;
    const id = setTimeout(
      () => {
        write(LAST_DAY_KEY, today);
        setAd(pickAd(today));
      },
      forced ? 300 : SHOW_AFTER_MS,
    );
    return () => clearTimeout(id);
  }, []);

  if (!ad) return null;
  return <AdDialog ad={ad} onClose={() => setAd(null)} />;
}

function AdDialog({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>("ad");
  const [kisses, setKisses] = useState(() => Number(read(KISSES_KEY)) || 0);
  const [milestone, setMilestone] = useState<KissMilestone | null>(null);
  const [countdown, setCountdown] = useState(CLOSE_AFTER_S);
  const [shake, setShake] = useState(0);
  const [refused, setRefused] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const canClose = countdown <= 0 || stage !== "ad";

  useEffect(() => {
    dialog.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && canClose && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [canClose, onClose]);

  /** Every tap is remembered on the server and Lubko gets an email. */
  const track = (choice: AdChoice, label: string, total: number, headline = milestone?.headline ?? ad.headline) => {
    void reportAdChoice({ headline, choice, label, kisses: total }).catch(() => {});
  };

  const kiss = (choice: AdChoice, label: string) => {
    const next = kisses + 1;
    track(choice, label, next, choice === "milestone-no" ? milestone?.headline : ad.headline);
    setKisses(next);
    write(KISSES_KEY, String(next));
    const reached = milestoneFor(next);
    setMilestone(reached);
    setStage(reached ? "milestone" : "paid");
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay" onClick={() => canClose && onClose()} />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Platená reklama"
        tabIndex={-1}
        className="relative w-full max-w-[360px] animate-rise overflow-hidden rounded-[28px] bg-surface shadow-lift outline-none"
      >
        <div className="relative h-72 bg-love-soft">
          <img src={`/lubko/${ad.photo}.webp`} alt="Lubko" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
          <span className="absolute left-3 top-3 rounded-lg bg-sun px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-on-sun">
            Platená reklama
          </span>
          {canClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Zavrieť reklamu"
              className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-black/55 text-white"
            >
              <Icon d={ICONS.close} size={18} />
            </button>
          ) : (
            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white">
              Zavrieť o {countdown} s
            </span>
          )}
          <span className="absolute bottom-3 left-3 text-xs font-medium text-white">
            Sponzor: Lubko s. r. o. (s ručením neobmedzeným)
          </span>
        </div>

        {stage === "ad" && (
          <div className="space-y-2.5 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-love-ink">{ad.eyebrow}</p>
            <h2 className="font-display text-[26px] font-semibold leading-tight text-ink">{ad.headline}</h2>
            <p className="text-[15px] leading-relaxed text-muted">{ad.text}</p>
            {kisses > 0 && (
              <p className="text-sm font-semibold text-love-ink">
                Doteraz zaplatené: {kisses} {kissesWord(kisses)}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="danger" size="lg" onClick={() => kiss("pay", ad.pay)}>
                <HeartIcon className="animate-pop" />
                {ad.pay}
              </Button>
              <Button variant="secondary" onClick={() => kiss("agree", ad.agree)}>
                {ad.agree}
              </Button>
              <button
                key={shake}
                type="button"
                onClick={() => {
                  if (!refused) track("refuse", "Nechcem reklamy (nefunguje)", kisses);
                  setShake((n) => n + 1);
                  setRefused(true);
                }}
                className={`min-h-11 text-sm text-muted underline ${shake > 0 ? "animate-shake" : ""}`}
              >
                {refused ? "Toto tlačidlo je len na ozdobu. Skús to pusou." : "Nechcem reklamy (nefunguje)"}
              </button>
            </div>
          </div>
        )}

        {stage === "paid" && (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <span className="animate-pop text-love">
              <HeartIcon size={44} />
            </span>
            <h2 className="font-display text-2xl font-semibold text-ink">Platba prijatá</h2>
            <p className="text-[15px] leading-relaxed text-muted">{paidText(ad, kisses)}</p>
            <div className="flex w-full flex-col gap-2 pt-1">
              <Button variant="danger" onClick={() => kiss("more", "Poslať ešte jednu pusu")}>
                <HeartIcon />
                Poslať ešte jednu pusu
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Späť k domčekom
              </Button>
            </div>
          </div>
        )}

        {stage === "milestone" && milestone && (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <span className="flex gap-1 text-love">
              {[0, 1, 2].map((i) => (
                <span key={i} className="animate-pop" style={{ animationDelay: `${i * 120}ms` }}>
                  <HeartIcon size={30} />
                </span>
              ))}
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-love-ink">
              {kisses} {kissesWord(kisses)} na účte
            </p>
            <h2 className="font-display text-2xl font-semibold leading-tight text-ink">{milestone.headline}</h2>
            <p className="text-[15px] leading-relaxed text-ink-2">{milestone.text}</p>
            <div className="flex w-full flex-col gap-2 pt-1">
              <Button
                variant="danger"
                size="lg"
                onClick={() => {
                  track("milestone-yes", milestone.yes, kisses, milestone.headline);
                  onClose();
                }}
              >
                {milestone.yes}
              </Button>
              <Button variant="secondary" onClick={() => kiss("milestone-no", milestone.no)}>
                {milestone.no}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeartIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d={ICONS.heart} />
    </svg>
  );
}

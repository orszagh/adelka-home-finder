"use client";

import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/budget";
import { Button, ICONS, Icon } from "./ui";

const MESSAGES = [
  "Pýtam sa Idealista.it…",
  "Pýtam sa Immobiliare.it…",
  "Vyberám tie najbližšie k moru…",
  "Ešte chvíľku, portály sú dnes pomalšie…",
];

/**
 * The unmissable "fetching listings" card: a boat bobbing on the waves and
 * an indeterminate bar. The server does not report progress, so the bar
 * does not pretend to know how far along it is.
 */
export function SyncSheet({ open, subtitle, costUsd = null }: { open: boolean; subtitle: string; costUsd?: number | null }) {
  if (!open) return null;
  return <SyncSheetCard subtitle={subtitle} costUsd={costUsd} />;
}

type StopState = "idle" | "stopping" | "stopped" | "failed";

function SyncSheetCard({ subtitle, costUsd }: { subtitle: string; costUsd: number | null }) {
  const [message, setMessage] = useState(0);
  const [stop, setStop] = useState<StopState>("idle");
  /** Folded into a small boat in the bottom-left corner, so Adelka can look around meanwhile. */
  const [collapsed, setCollapsed] = useState(false);

  /** The page's own request ends by itself once the runs stop; what arrived until then is kept. */
  const stopNow = async () => {
    setStop("stopping");
    try {
      const response = await fetch("/api/sync/stop", { method: "POST" });
      setStop(response.ok ? "stopped" : "failed");
    } catch {
      setStop("failed");
    }
  };
  useEffect(() => {
    const id = setInterval(() => setMessage((m) => Math.min(m + 1, MESSAGES.length - 1)), 4000);
    return () => clearInterval(id);
  }, []);

  if (collapsed) {
    return (
      <button
        type="button"
        role="status"
        aria-live="polite"
        aria-label="Sťahujem domčeky, ťukni pre detail"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-[max(188px,calc(env(safe-area-inset-bottom)+176px))] left-3 z-[1500] size-16 origin-bottom-left animate-fold-in overflow-hidden rounded-full bg-accent-soft shadow-lift ring-2 ring-surface"
      >
        <BoatScene small />
      </button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[1500] flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <section
        role="status"
        aria-live="polite"
        className="pointer-events-auto relative w-full max-w-[420px] animate-rise space-y-4 rounded-[28px] bg-surface p-5 shadow-lift"
      >
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="Zbaliť okno sťahovania"
          className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-surface/90 text-ink-2 shadow-card"
        >
          <Icon d={ICONS.chevronDown} size={20} />
        </button>
        <BoatScene />
        <div>
          <h2 className="font-display text-2xl font-semibold leading-tight text-ink">Hľadám domčeky pri mori</h2>
          <p className="text-[15px] text-muted">{subtitle}</p>
        </div>
        <div aria-hidden className="relative h-2.5 overflow-hidden rounded-full bg-surface-2">
          <div className="absolute inset-y-0 w-1/3 animate-sheen rounded-full bg-accent" />
        </div>
        <p key={stop === "idle" ? message : stop} className="animate-fade-up text-sm font-medium text-ink-2">
          {stop === "idle"
            ? MESSAGES[message]
            : stop === "stopping"
              ? "Zastavujem…"
              : stop === "stopped"
                ? "Zastavené. Ukladám, čo sa stihlo stiahnuť…"
                : "Zastaviť sa nepodarilo, skús to ešte raz."}
        </p>
        <p className="rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">
          Trvá to asi minútu. Pokojne zatiaľ listuj – keď budem hotový, zakývam. Ak ti okno zavadzia, zbaľ ho šípkou vpravo hore.
        </p>
        {/* So Adelka knows each download is paid for. An upper bound: fewer listings cost less. */}
        {costUsd !== null && costUsd > 0 && (
          <p className="px-1 text-xs text-muted">
            Toto sťahovanie stojí Lubka najviac asi <strong className="text-ink-2">{formatUsd(costUsd)}</strong> z kreditu na
            Apify.
          </p>
        )}
        <Button variant="secondary" className="w-full" disabled={stop === "stopping" || stop === "stopped"} onClick={stopNow}>
          {stop === "stopped" ? "Zastavené" : "Zastaviť sťahovanie"}
        </Button>
      </section>
    </div>
  );
}

/** The boat bobbing on the waves: on top of the card, or alone in the folded bubble. */
function BoatScene({ small = false }: { small?: boolean }) {
  return (
    <div aria-hidden className={small ? "relative size-full" : "relative h-16 overflow-hidden rounded-2xl bg-accent-soft"}>
      <svg
        width={small ? 34 : 44}
        height={small ? 34 : 44}
        viewBox="0 0 44 44"
        className={`absolute left-1/2 origin-[50%_90%] animate-bob ${small ? "top-2.5 -ml-[17px]" : "top-2 -ml-[22px]"}`}
      >
        <path d="M22 6 V30 M22 8 L34 28 H22 Z" fill="var(--c-surface)" stroke="var(--c-accent)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M20 10 L10 28 H20 Z" fill="var(--c-love)" />
        <path d="M6 31 H38 L33 38 H11 Z" fill="var(--c-accent)" />
      </svg>
      <svg width="440" height="26" viewBox="0 0 440 26" className="absolute bottom-0 left-0 animate-wave">
        <path
          d="M0 10 Q10 2 20 10 T40 10 T60 10 T80 10 T100 10 T120 10 T140 10 T160 10 T180 10 T200 10 T220 10 T240 10 T260 10 T280 10 T300 10 T320 10 T340 10 T360 10 T380 10 T400 10 T420 10 T440 10 V26 H0 Z"
          fill="var(--c-accent)"
          fillOpacity="0.85"
        />
      </svg>
    </div>
  );
}

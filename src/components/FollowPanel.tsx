"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveFollowed, unfollowRegion } from "@/app/actions";
import { formatUsd } from "@/lib/budget";
import { areaNamesAfter, followedByRegion, morningCostUsd, planFollow } from "@/lib/follow";
import { formatPriceShort, homesLabel } from "@/lib/format";
import { type Place, REGIONS, provincesOf } from "@/lib/italy";
import type { MapListing } from "@/lib/types";
import { HelpTip } from "./HelpTip";
import { type Stats, statsFor } from "@/lib/place-stats";
import { SyncSheet } from "./SyncSheet";
import { useToast } from "./Toast";
import { ICONS, Icon, buttonClass } from "./ui";

function provincesLabel(n: number): string {
  return `${n} ${n === 1 ? "provincia" : n < 5 ? "provincie" : "provincií"}`;
}

/** Spent and allowed Apify credit this month (null until known, or when unknown). */
function useBudget() {
  const [budget, setBudget] = useState<{ usedUsd: number; budgetUsd: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/budget")
      .then((r) => (r.status === 200 ? r.json() : null))
      .then((b) => !cancelled && setBudget(b))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return budget;
}

/**
 * Which provinces of a region to follow: ticked here or on the map, saved at once, downloaded by
 * the morning check (or now, when Adelka asks and agrees to the price). On a phone it comes up
 * from the bottom with the region visible above it; on a computer it sits on the left.
 */
export function FollowPanel({
  region,
  chosen,
  setChosen,
  areaNames,
  properties,
  costPerAreaUsd,
  onDone,
  onSwitchRegion,
  onLayout,
}: {
  region: Place;
  /** Provinces ticked right now (kept by the page, so the map shows them too). */
  chosen: ReadonlySet<string>;
  setChosen: (next: Set<string>) => void;
  areaNames: string[];
  properties: MapListing[];
  /** At most what downloading one area costs; null for demo data. */
  costPerAreaUsd: number | null;
  onDone: () => void;
  onSwitchRegion: (code: string) => void;
  /** Room the panel takes over the map, so the map frames the region in the rest. */
  onLayout: (padding: { bottom: number; left: number }) => void;
}) {
  const toast = useToast();
  const budget = useBudget();
  const [saving, startSaving] = useTransition();
  const [fetching, setFetching] = useState(false);
  const [asking, setAsking] = useState<null | "fetch" | "discard" | { unfollow: string }>(null);
  const panel = useRef<HTMLElement>(null);

  const provinces = useMemo(
    () => [...provincesOf(region.code)].sort((a, b) => Number(b.coastal) - Number(a.coastal) || a.name.localeCompare(b.name)),
    [region.code],
  );
  const stats = useMemo(() => new Map<string, Stats>(provinces.map((p) => [p.code, statsFor(p, properties)])), [provinces, properties]);
  const followed = useMemo(() => followedByRegion(areaNames), [areaNames]);
  const saved = followed.get(region.code)?.provinces ?? new Set<string>();
  const dirty = saved.size !== chosen.size || [...chosen].some((c) => !saved.has(c));
  // Re-saving the region as it is still tidies up an old overlap (region and its provinces together).
  const plan = planFollow(region.code, chosen, areaNames);
  const changes = plan.create.length + plan.remove.length > 0;
  const whole = chosen.size === provinces.length;
  const others = REGIONS.filter((r) => r.code !== region.code && followed.has(r.code));

  const searches = areaNamesAfter(region.code, chosen, areaNames).length;
  const cost = costPerAreaUsd !== null ? morningCostUsd(searches, costPerAreaUsd) : null;
  const nowCost = costPerAreaUsd !== null ? plan.create.length * costPerAreaUsd : null;

  useLayoutEffect(() => {
    const el = panel.current;
    if (!el) return;
    const report = () => {
      const desktop = window.matchMedia("(min-width: 768px)").matches;
      onLayout(desktop ? { bottom: 0, left: el.offsetWidth + 12 } : { bottom: el.offsetHeight, left: 0 });
    };
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLayout]);

  const toggle = (code: string) => {
    const next = new Set(chosen);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setChosen(next);
  };

  const save = (fetchNow: boolean) => {
    setAsking(null);
    if (fetchNow) setFetching(true);
    startSaving(async () => {
      const result = await saveFollowed(region.code, [...chosen], fetchNow);
      setFetching(false);
      if (!result.ok || result.error) toast.show({ tone: "error", text: result.error ?? "Uložiť sa nepodarilo." });
      else if (result.fetched !== null) toast.show({ tone: "success", text: `Uložené, našiel som ${homesLabel(result.fetched)}.` });
      else toast.show({ tone: "success", text: chosen.size === 0 ? "Uložené, tu už nehľadám." : "Uložené. Nové ponuky stiahnem ráno." });
      if (result.ok) onDone();
    });
  };

  const close = () => (dirty ? setAsking("discard") : onDone());

  return (
    <>
      <SyncSheet open={fetching} subtitle={region.name} costUsd={nowCost} />
      <section
        ref={panel}
        aria-label={`Sledovanie: ${region.name}`}
        className="absolute inset-x-0 bottom-0 z-[1250] flex max-h-[62%] animate-rise flex-col rounded-t-[28px] bg-surface shadow-lift md:inset-x-auto md:bottom-3 md:left-3 md:top-[68px] md:max-h-none md:w-[380px] md:rounded-[28px]"
      >
        <header className="flex items-center gap-2 px-5 pb-2 pt-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-love">Čo mám sledovať</p>
            <h2 className="truncate font-display text-2xl font-semibold text-ink">{region.name}</h2>
          </div>
          <HelpTip label="Ako funguje sledovanie" title="Sledovanie" href="/napoveda#sledovanie" className="shrink-0">
            <p>Zo sledovaných miest sťahujem nové ponuky každé ráno.</p>
            <p>
              <b>Celý región</b> je jedno lacné hľadanie. Jednotlivé provincie sú každá samostatné hľadanie: viac ponúk z nej, ale
              drahšie.
            </p>
            <p>„Uložiť“ nič nestojí hneď, stiahne to ranná kontrola. „Stiahnuť hneď“ stojí kredit, cenu ti poviem vopred.</p>
          </HelpTip>
          <button
            type="button"
            onClick={close}
            aria-label="Zavrieť výber"
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2"
          >
            <Icon d={ICONS.close} size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-3">
          <button
            type="button"
            role="switch"
            aria-checked={whole}
            onClick={() => setChosen(whole ? new Set() : new Set(provinces.map((p) => p.code)))}
            className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-accent-soft px-4 text-left"
          >
            <span className="flex-1">
              <span className="block font-semibold text-ink">Celý región</span>
              <span className="block text-sm text-muted">Jedno hľadanie, najlacnejšie</span>
            </span>
            <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${whole ? "bg-accent" : "bg-line-strong"}`}>
              <span className={`absolute top-1 size-5 rounded-full bg-surface shadow transition-all ${whole ? "left-6" : "left-1"}`} />
            </span>
          </button>

          <ul className="space-y-1" aria-label="Provincie">
            {provinces.map((p) => {
              const on = chosen.has(p.code);
              const s = stats.get(p.code) ?? { count: 0, minPrice: null };
              return (
                <li key={p.code}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(p.code)}
                    className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-2 text-left hover:bg-surface-2"
                  >
                    <span
                      aria-hidden
                      className={`grid size-6 shrink-0 place-items-center rounded-lg border-2 ${on ? "border-accent bg-accent text-on-accent" : "border-line-strong"}`}
                    >
                      {on && <Icon d={ICONS.check} size={14} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{p.name}</span>
                      <span className="block truncate text-sm text-muted">
                        {[
                          s.count > 0 ? `${homesLabel(s.count)}${s.minPrice !== null ? ` od ${formatPriceShort(s.minPrice)}` : ""}` : "zatiaľ nič",
                          p.coastal ? null : "vnútrozemie",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {others.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Sleduješ aj</p>
              {others.map((r) => {
                const f = followed.get(r.code)!;
                return (
                  <div key={r.code} className="flex min-h-12 items-center gap-2 rounded-2xl bg-canvas px-3">
                    <button type="button" onClick={() => onSwitchRegion(r.code)} className="min-w-0 flex-1 py-2 text-left">
                      <span className="block font-semibold text-ink">{r.name}</span>
                      <span className="block text-sm text-muted">{f.whole ? "celý región" : provincesLabel(f.provinces.size)}</span>
                    </button>
                    <button type="button" onClick={() => onSwitchRegion(r.code)} className="px-2 text-sm font-semibold text-accent-ink">
                      Upraviť
                    </button>
                    <button
                      type="button"
                      onClick={() => setAsking({ unfollow: r.code })}
                      className="px-2 text-sm font-semibold text-love"
                    >
                      Zrušiť
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="space-y-2 border-t border-line px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          {cost && (
            <p className="text-sm text-muted">
              Ranná kontrola: {searches} {searches === 1 ? "hľadanie" : searches < 5 ? "hľadania" : "hľadaní"}, najviac ~
              {formatUsd(cost.daily)} denne, ~{formatUsd(cost.monthly)} mesačne
              {budget ? ` z rozpočtu ${formatUsd(budget.budgetUsd)}` : ""}.
            </p>
          )}
          {cost && budget && cost.monthly > budget.budgetUsd && (
            <p className="rounded-2xl bg-warn-soft px-3 py-2 text-sm text-warn-ink">
              Toľko sa do rozpočtu nezmestí, niektoré rána vynechám.
            </p>
          )}

          {asking === "fetch" && nowCost !== null ? (
            <div role="alertdialog" aria-labelledby="follow-fetch-title" className="space-y-2">
              <p id="follow-fetch-title" className="text-[15px] text-ink-2">
                Stiahnem ponuky pre {plan.create.map((p) => p.name).join(", ")} hneď. Bude to stáť Lubka najviac asi{" "}
                <strong>{formatUsd(nowCost)}</strong> z kreditu na Apify. Počas sťahovania ho môžeš zastaviť.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => save(true)} className={buttonClass("primary", "md", "flex-1")}>
                  Áno, stiahnuť
                </button>
                <button type="button" onClick={() => setAsking(null)} className={buttonClass("secondary", "md", "flex-1")}>
                  Zrušiť
                </button>
              </div>
            </div>
          ) : asking === "discard" ? (
            <div role="alertdialog" aria-labelledby="follow-discard-title" className="space-y-2">
              <p id="follow-discard-title" className="text-[15px] text-ink-2">
                Zmeny nie sú uložené. Zahodiť ich?
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={onDone} className={buttonClass("danger", "md", "flex-1")}>
                  Zahodiť
                </button>
                <button type="button" onClick={() => setAsking(null)} className={buttonClass("secondary", "md", "flex-1")}>
                  Späť
                </button>
              </div>
            </div>
          ) : asking && typeof asking === "object" ? (
            <div role="alertdialog" aria-labelledby="follow-unfollow-title" className="space-y-2">
              <p id="follow-unfollow-title" className="text-[15px] text-ink-2">
                Prestať sledovať {REGIONS.find((r) => r.code === asking.unfollow)?.name}? Domčeky odtiaľ ostanú, len nové už nebudem
                sťahovať.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const code = asking.unfollow;
                    setAsking(null);
                    startSaving(async () => {
                      await unfollowRegion(code);
                      toast.show({ tone: "info", text: `${REGIONS.find((r) => r.code === code)?.name} už nesleduješ.` });
                    });
                  }}
                  className={buttonClass("danger", "md", "flex-1")}
                >
                  Prestať sledovať
                </button>
                <button type="button" onClick={() => setAsking(null)} className={buttonClass("secondary", "md", "flex-1")}>
                  Späť
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={saving || !changes}
                onClick={() => save(false)}
                className={buttonClass("primary", "md", "flex-1")}
              >
                Uložiť
              </button>
              {plan.create.length > 0 && nowCost !== null && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setAsking("fetch")}
                  className={buttonClass("secondary", "md", "flex-1")}
                >
                  Uložiť a stiahnuť hneď
                </button>
              )}
            </div>
          )}
        </footer>
      </section>
    </>
  );
}

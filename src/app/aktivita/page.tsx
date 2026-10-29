import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CloseBar } from "@/components/CloseBar";
import { Card, Eyebrow } from "@/components/ui";
import { getOpens, getSeenLog, opensPerDay, whenLabel } from "@/lib/activity";
import { getRepo } from "@/lib/db/repo";
import { formatPrice } from "@/lib/format";
import { hasSession } from "@/lib/session";
import { VISIT_STATUSES, getVisits, plannedVisits, visitWhen } from "@/lib/visits";

export const metadata: Metadata = { title: "Aktivita", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Lubko's curiosity page, not in the menu: when Adelka last opened the app and what she
 * looked at. Opening it with ?lubko=1 (once per device) leaves his own visits out.
 */
export default async function ActivityPage() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/aktivita");
  const repo = getRepo();
  const [opens, looks, saved, visits, properties] = await Promise.all([
    getOpens(repo),
    getSeenLog(repo),
    repo.listSaved(),
    getVisits(repo),
    repo.listProperties(),
  ]);
  const byId = new Map(properties.map((p) => [p.id, p]));
  const lastOpen = opens[opens.length - 1] ?? null;
  const week = opensPerDay(opens, 7);
  const weekTotal = week.reduce((s, d) => s + d.count, 0);
  const most = Math.max(1, ...week.map((d) => d.count));
  const recentLooks = [...looks].reverse().filter((l) => byId.has(l.id)).slice(0, 12);
  const planned = plannedVisits(visits).filter(([id]) => byId.has(id));
  const statusLabel = (id: string) => VISIT_STATUSES.find((s) => s.value === visits[id]?.status)?.label ?? null;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-6 pt-2">
      <CloseBar label="Zavrieť aktivitu" />
      <div>
        <Eyebrow>Len pre Lubka</Eyebrow>
        <h1 className="font-display text-3xl font-semibold text-ink">Čo robí Adelka</h1>
        <p className="mt-1 text-sm text-muted">
          Stránka nie je v menu. Na svojich zariadeniach ju raz otvor s <code>?lubko=1</code> na konci adresy, aby sa tvoje návštevy
          nepočítali.
        </p>
      </div>

      <Card className="space-y-4 p-5">
        <div>
          <p className="text-sm text-muted">Naposledy otvorila appku</p>
          <p className="font-display text-2xl font-semibold text-ink">{lastOpen ? whenLabel(lastOpen) : "zatiaľ nikdy"}</p>
        </div>
        <div>
          <p className="mb-2 text-sm text-muted">Posledných 7 dní: {weekTotal}× otvorená</p>
          <div className="flex h-24 items-end gap-2">
            {week.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold text-ink-2">{d.count || ""}</span>
                <span className="w-full rounded-t-lg bg-accent" style={{ height: `${(d.count / most) * 64}px`, minHeight: d.count ? 4 : 0 }} />
                <span className="text-xs text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-2 p-5">
        <h2 className="font-display text-xl font-semibold text-ink">Naposledy si pozrela</h2>
        {recentLooks.length === 0 ? (
          <p className="text-sm text-muted">Zatiaľ žiadny domček.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recentLooks.map((look) => {
              const p = byId.get(look.id)!;
              return (
                <li key={`${look.id}-${look.at}`}>
                  <Link href={`/inzerat/${p.id}`} className="flex items-center gap-3 py-2.5">
                    {p.photos[0] && <img src={p.photos[0]} alt="" className="h-12 w-16 shrink-0 rounded-xl object-cover" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">
                        {p.city} · {formatPrice(p.price)}
                      </span>
                      <span className="block text-xs text-muted">{whenLabel(look.at)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="space-y-2 p-5">
        <h2 className="font-display text-xl font-semibold text-ink">Uložené a obhliadky</h2>
        <p className="text-sm text-muted">Uložených domčekov: {saved.length}</p>
        {planned.length > 0 && (
          <ul className="space-y-1 text-sm text-ink-2">
            {planned.map(([id, visit]) => (
              <li key={id}>
                <b>{visitWhen(visit)}</b> · {byId.get(id)!.city} · {formatPrice(byId.get(id)!.price)}
              </li>
            ))}
          </ul>
        )}
        <ul className="space-y-1 text-sm text-ink-2">
          {saved
            .filter((s) => byId.has(s.property_id) && statusLabel(s.property_id) && visits[s.property_id].status !== "booked")
            .map((s) => (
              <li key={s.id}>
                {byId.get(s.property_id)!.city} · {formatPrice(byId.get(s.property_id)!.price)}: {statusLabel(s.property_id)}
              </li>
            ))}
        </ul>
      </Card>
    </main>
  );
}

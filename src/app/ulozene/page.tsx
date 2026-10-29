import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingCard } from "@/components/ListingCard";
import { NoteForm } from "@/components/NoteForm";
import { VisitForm } from "@/components/VisitForm";
import { CloseBar } from "@/components/CloseBar";
import { ButtonLink, Card, Eyebrow, ICONS, Icon } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { getRepo } from "@/lib/db/repo";
import { isStale } from "@/lib/freshness";
import { getProvider } from "@/lib/providers";
import { getSeenIds } from "@/lib/seen";
import { hasSession } from "@/lib/session";
import { getVisits, plannedVisits, todayInItaly, visitWhen } from "@/lib/visits";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/ulozene");
  const repo = getRepo();
  const trackFreshness = !getProvider().isMock;
  const [saved, seenIds, visits] = await Promise.all([repo.listSaved(), getSeenIds(repo), getVisits(repo)]);
  const seen = new Set(seenIds);
  const entries = (
    await Promise.all(
      saved.map(async (s) => ({ saved: s, property: await repo.getProperty(s.property_id) })),
    )
  )
    .filter((e) => e.property !== null)
    // Houses she ruled out go to the end.
    .sort((a, b) => Number(visits[a.property!.id]?.status === "no") - Number(visits[b.property!.id]?.status === "no"));
  const byId = new Map(entries.map((e) => [e.property!.id, e.property!]));
  const today = todayInItaly();
  const planned = plannedVisits(visits).filter(([id]) => byId.has(id));

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 pb-6 pt-2">
      <CloseBar label="Zavrieť uložené" />
      <div>
        <Eyebrow>Domčeky pre teba</Eyebrow>
        <h1 className="font-display text-3xl font-semibold text-ink">Uložené</h1>
      </div>

      {entries.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-love-soft text-love">
            <svg aria-hidden width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
              <path d={ICONS.heart} />
            </svg>
          </span>
          <h2 className="font-display text-xl font-semibold text-ink">Zatiaľ tu nič nie je</h2>
          <p className="max-w-xs text-muted">Keď sa ti domček zapáči, ťukni pri ňom na srdiečko a nájdeš ho tu.</p>
          <ButtonLink href="/" className="mt-2">
            Pozrieť domčeky
          </ButtonLink>
        </Card>
      ) : (
        <>
          {planned.length > 0 && (
            <section aria-labelledby="visits-heading" className="space-y-2 rounded-3xl bg-surface p-4 shadow-card">
              <h2 id="visits-heading" className="px-1 font-display text-xl font-semibold text-ink">
                Plán obhliadok
              </h2>
              <ul className="divide-y divide-line">
                {planned.map(([id, visit]) => {
                  const p = byId.get(id)!;
                  const past = visit.date! < today;
                  return (
                    <li key={id} className="flex items-center gap-3 py-2.5">
                      <Link href={`/inzerat/${id}`} className="min-w-0 flex-1">
                        <span className={`block text-sm font-bold ${past ? "text-muted" : "text-accent-ink"}`}>{visitWhen(visit)}</span>
                        <span className="block truncate font-medium text-ink">
                          {p.city} · {formatPrice(p.price)}
                        </span>
                        {past && <span className="block text-xs text-muted">Ako to dopadlo? Označ pri domčeku „Videla som“.</span>}
                      </Link>
                      {!past && (
                        <a
                          href={`/api/visit-calendar/${encodeURIComponent(id)}`}
                          aria-label={`Pridať obhliadku v ${p.city} do kalendára`}
                          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink"
                        >
                          <Icon d={ICONS.calendar} size={18} />
                        </a>
                      )}
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Navigovať do ${p.city} (Google Maps)`}
                        className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink"
                      >
                        <Icon d={ICONS.navigate} size={18} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          <ul className="grid gap-5">
            {entries.map(({ saved: s, property }) => (
              <li key={s.id} className="space-y-3">
                <ListingCard property={property!} saved seen={seen.has(property!.id)} gone={trackFreshness && isStale(property!)} />
                <div className="rounded-3xl bg-surface p-4 shadow-card">
                  <NoteForm savedId={s.id} note={s.note} />
                  <div className="mt-4 border-t border-line pt-4">
                    <VisitForm propertyId={property!.id} visit={visits[property!.id] ?? null} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

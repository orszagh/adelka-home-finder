import { redirect } from "next/navigation";
import { ListingCard } from "@/components/ListingCard";
import { NoteForm } from "@/components/NoteForm";
import { ButtonLink, Card, Eyebrow, ICONS } from "@/components/ui";
import { getRepo } from "@/lib/db/repo";
import { isStale } from "@/lib/freshness";
import { getProvider } from "@/lib/providers";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/ulozene");
  const repo = getRepo();
  const trackFreshness = !getProvider().isMock;
  const saved = await repo.listSaved();
  const entries = (
    await Promise.all(
      saved.map(async (s) => ({ saved: s, property: await repo.getProperty(s.property_id) })),
    )
  ).filter((e) => e.property !== null);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6">
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
        <ul className="grid gap-5">
          {entries.map(({ saved: s, property }) => (
            <li key={s.id} className="space-y-3">
              <ListingCard property={property!} saved gone={trackFreshness && isStale(property!)} />
              <div className="rounded-3xl bg-surface p-4 shadow-card">
                <NoteForm savedId={s.id} note={s.note} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

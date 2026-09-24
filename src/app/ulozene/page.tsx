import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { NoteForm } from "@/components/NoteForm";
import { redirect } from "next/navigation";
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
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-semibold text-ink">Uložené inzeráty</h1>

      {entries.length === 0 ? (
        <p className="text-muted">
          Zatiaľ nemáš nič uložené. Na{" "}
          <Link href="/" className="font-medium text-accent-ink underline">
            stránke s ponukami
          </Link>{" "}
          ťukni na ♡ pri inzeráte, ktorý sa ti páči.
        </p>
      ) : (
        <ul className="space-y-4">
          {entries.map(({ saved: s, property }) => (
            <li key={s.id} className="space-y-3 rounded-2xl bg-surface p-3 ring-1 ring-line">
              <ListingCard property={property!} saved gone={trackFreshness && isStale(property!)} />
              <NoteForm savedId={s.id} note={s.note} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

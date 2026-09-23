import Link from "next/link";
import { ListingCard } from "@/components/ListingCard";
import { NoteForm } from "@/components/NoteForm";
import { redirect } from "next/navigation";
import { getRepo } from "@/lib/db/repo";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/ulozene");
  const repo = getRepo();
  const saved = await repo.listSaved();
  const entries = (
    await Promise.all(
      saved.map(async (s) => ({ saved: s, property: await repo.getProperty(s.property_id) })),
    )
  ).filter((e) => e.property !== null);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-semibold text-slate-900">Uložené inzeráty</h1>

      {entries.length === 0 ? (
        <p className="text-slate-600">
          Zatiaľ nemáš nič uložené. Na{" "}
          <Link href="/" className="font-medium text-sea-700 underline">
            stránke s ponukami
          </Link>{" "}
          ťukni na ♡ pri inzeráte, ktorý sa ti páči.
        </p>
      ) : (
        <ul className="space-y-4">
          {entries.map(({ saved: s, property }) => (
            <li key={s.id} className="space-y-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <ListingCard property={property!} saved />
              <NoteForm savedId={s.id} note={s.note} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

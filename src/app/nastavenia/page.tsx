import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchSettingsForm } from "@/components/SearchSettingsForm";
import { getRepo } from "@/lib/db/repo";
import { getSearchSettings } from "@/lib/search-settings";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";
/** Saving a new distance from the sea fetches listings from Apify inside the server action. */
export const maxDuration = 300;

export default async function SettingsPage() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/nastavenia");
  const settings = await getSearchSettings(getRepo());

  return (
    <main className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-accent-ink hover:underline">
        ‹ Späť na ponuky
      </Link>
      <h1 className="text-2xl font-semibold text-ink">Kde hľadať domček</h1>
      <SearchSettingsForm initial={settings} />
    </main>
  );
}

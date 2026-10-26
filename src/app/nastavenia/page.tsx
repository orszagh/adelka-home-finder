import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchSettingsForm } from "@/components/SearchSettingsForm";
import { ICONS, Icon } from "@/components/ui";
import { getRepo } from "@/lib/db/repo";
import { formatUsage } from "@/lib/budget";
import { getProvider } from "@/lib/providers";
import { getSearchSettings } from "@/lib/search-settings";
import { hasSession } from "@/lib/session";

export const dynamic = "force-dynamic";
/** Saving a new distance from the sea fetches listings from Apify inside the server action. */
export const maxDuration = 300;

export default async function SettingsPage() {
  if (!(await hasSession())) redirect("/prihlasenie?next=/nastavenia");
  const provider = getProvider();
  const [settings, usage] = await Promise.all([getSearchSettings(getRepo()), provider.usage?.() ?? null]);

  return (
    <main className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
      <Link href="/" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent-ink hover:underline">
        <Icon d={ICONS.back} size={16} />
        Späť na ponuky
      </Link>
      <h1 className="font-display text-3xl font-semibold text-ink">Kde hľadať domček</h1>
      <SearchSettingsForm initial={settings} />
      {usage && (
        <p className="px-1 text-sm text-muted">
          Sťahovanie ponúk tento mesiac: <strong className="text-ink-2">{formatUsage(usage.usedUsd, usage.budgetUsd)}</strong>. Keď
          sa rozpočet minie, ukazujem uložené ponuky a nové stiahnem v ďalšom mesiaci.
        </p>
      )}
    </main>
  );
}

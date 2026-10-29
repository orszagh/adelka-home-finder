import { redirect } from "next/navigation";
import { SearchSettingsForm } from "@/components/SearchSettingsForm";
import { CloseBar } from "@/components/CloseBar";
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
  const repo = getRepo();
  const [settings, usage, areas] = await Promise.all([getSearchSettings(repo), provider.usage?.() ?? null, repo.listSearchAreas()]);
  const perArea = provider.costPerAreaUsd?.() ?? null;

  return (
    <main className="mx-auto w-full max-w-md space-y-4 px-4 pb-6 pt-2">
      <CloseBar label="Zavrieť nastavenia" />
      <h1 className="font-display text-3xl font-semibold text-ink">Kde hľadať domček</h1>
      <SearchSettingsForm initial={settings} syncCostUsd={perArea && perArea * areas.length} />
      {usage && (
        <p className="px-1 text-sm text-muted">
          Sťahovanie ponúk tento mesiac: <strong className="text-ink-2">{formatUsage(usage.usedUsd, usage.budgetUsd)}</strong>. Keď
          sa rozpočet minie, ukazujem uložené ponuky a nové stiahnem v ďalšom mesiaci.
        </p>
      )}
    </main>
  );
}

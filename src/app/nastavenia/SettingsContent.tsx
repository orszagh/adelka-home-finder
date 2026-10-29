import { SearchSettingsForm } from "@/components/SearchSettingsForm";
import { getRepo } from "@/lib/db/repo";
import { formatUsage } from "@/lib/budget";
import { getProvider } from "@/lib/providers";
import { getSearchSettings } from "@/lib/search-settings";

/** Everything on Nastavenia hľadania: the full page and the panel over the map show the same. */
export async function SettingsContent() {
  const provider = getProvider();
  const repo = getRepo();
  const [settings, usage, areas] = await Promise.all([getSearchSettings(repo), provider.usage?.() ?? null, repo.listSearchAreas()]);
  const perArea = provider.costPerAreaUsd?.() ?? null;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-semibold text-ink">Kde hľadať domček</h1>
      <SearchSettingsForm initial={settings} syncCostUsd={perArea && perArea * areas.length} />
      {usage && (
        <p className="px-1 text-sm text-muted">
          Sťahovanie ponúk tento mesiac: <strong className="text-ink-2">{formatUsage(usage.usedUsd, usage.budgetUsd)}</strong>. Keď
          sa rozpočet minie, ukazujem uložené ponuky a nové stiahnem v ďalšom mesiaci.
        </p>
      )}
    </div>
  );
}

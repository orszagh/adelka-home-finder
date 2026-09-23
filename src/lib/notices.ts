import "server-only";
import { getRepo } from "./db/repo";
import { getProvider } from "./providers";
import { isApifyConfigured } from "./providers/apify/client";

/** Honest, low-key hints about what the app is currently running on. */
export function getDataNotices({ areaCount }: { areaCount: number }): string[] {
  const notices: string[] = [];
  const provider = getProvider();
  if (provider.isMock) {
    notices.push("Zobrazujú sa ukážkové ponuky. Skutočný zdroj inzerátov ešte nie je pripojený.");
  } else if (provider.id === "apify" && !isApifyConfigured()) {
    notices.push("Chýba APIFY_TOKEN, nové ponuky sa nesťahujú.");
  } else if (areaCount === 0) {
    notices.push("Ponuky sa sťahujú pre tvoje oblasti. Nakresli si oblasť alebo pridaj región a ponuky sa hneď načítajú.");
  }
  if (getRepo().kind === "memory") {
    notices.push("Databáza nie je pripojená, uložené oblasti a inzeráty sa po reštarte stratia.");
  }
  return notices;
}

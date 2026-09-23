import "server-only";
import { getRepo } from "./db/repo";
import { getProvider } from "./providers";

/** Honest, low-key hints about what the app is currently running on. */
export function getDataNotices(): string[] {
  const notices: string[] = [];
  if (getProvider().isMock) {
    notices.push("Zobrazujú sa ukážkové ponuky. Skutočný zdroj inzerátov ešte nie je pripojený.");
  }
  if (getRepo().kind === "memory") {
    notices.push("Databáza nie je pripojená, uložené oblasti a inzeráty sa po reštarte stratia.");
  }
  return notices;
}

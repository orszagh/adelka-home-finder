/** "Verzia 0.4.0 · cef07a1 · 30. 10. 2026": the release, the GitHub commit and the day it went live. */
export function formatVersion({ version, commit, builtAt }: { version: string; commit: string; builtAt: string }): string {
  const day = Number.isNaN(Date.parse(builtAt))
    ? null
    : new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "numeric", year: "numeric", timeZone: "Europe/Bratislava" }).format(
        new Date(builtAt),
      );
  return [`Verzia ${version}`, commit || "vývoj", day].filter(Boolean).join(" · ");
}

/** Filled in by next.config.ts at build time. */
export const APP_VERSION = formatVersion({
  version: process.env.NEXT_PUBLIC_APP_VERSION ?? "?",
  commit: process.env.NEXT_PUBLIC_APP_COMMIT ?? "",
  builtAt: process.env.NEXT_PUBLIC_BUILD_AT ?? "",
});

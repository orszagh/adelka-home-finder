import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

const nextConfig: NextConfig = {
  // A second local server (the "dev-mock" demo in .claude/launch.json) needs its own build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // "Verzia 0.4.0 · cef07a1 · 30. 10. 2026" at the bottom of the menu: Vercel gives the commit at build time.
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_APP_COMMIT: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "",
    NEXT_PUBLIC_BUILD_AT: new Date().toISOString(),
  },
  experimental: {
    // A page Adelka already saw comes back instantly (the map, saved houses) instead of loading
    // again over a weak signal. Every change she makes (heart, settings, "Pozrieť teraz") refreshes
    // it anyway – the server actions call revalidatePath – and new listings arrive only overnight.
    staleTimes: { dynamic: 600 },
  },
};

export default nextConfig;

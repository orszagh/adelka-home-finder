import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second local server (the "dev-mock" demo in .claude/launch.json) needs its own build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // A page Adelka already saw comes back instantly (the map, saved houses) instead of loading
    // again over a weak signal. Every change she makes (heart, settings, "Pozrieť teraz") refreshes
    // it anyway – the server actions call revalidatePath – and new listings arrive only overnight.
    staleTimes: { dynamic: 600 },
  },
};

export default nextConfig;

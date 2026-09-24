import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second local server (the "dev-mock" demo in .claude/launch.json) needs its own build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;

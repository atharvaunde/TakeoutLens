import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Lets a production build run beside a running dev server (`NEXT_DIST_DIR=.next-build pnpm build`).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Native modules must not be bundled.
  serverExternalPackages: ["better-sqlite3", "sharp"],
}

export default nextConfig

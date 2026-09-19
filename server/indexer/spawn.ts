import { spawn } from "node:child_process"
import path from "node:path"

import { getConfig } from "@/server/config"
import { isIndexerRunning } from "./lock"

/** Start the indexer as a detached child process (own memory budget, survives request end). */
export function startIndexer(): "started" | "already-running" {
  const { dataDir } = getConfig()
  if (isIndexerRunning(dataDir)) return "already-running"
  const tsx = path.join(process.cwd(), "node_modules", ".bin", "tsx")
  const child = spawn(tsx, ["--max-old-space-size=256", path.join("server", "indexer", "cli.ts")], {
    cwd: process.cwd(),
    detached: true,
    stdio: "ignore",
    env: process.env,
  })
  child.unref()
  return "started"
}

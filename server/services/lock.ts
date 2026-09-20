import os from "node:os"

import type { LockInfo } from "@/lib/types"
import { getConfig } from "@/server/config"
import { getDb } from "@/server/db"

/** Numbers shown next to the password form. Deliberately minimal: paths and totals only, no content. */
export function getLockInfo(): LockInfo {
  const { takeoutDir } = getConfig()
  const db = getDb()
  const totals = db.prepare("SELECT count(*) AS files, coalesce(sum(size), 0) AS bytes FROM files").get() as { files: number; bytes: number }
  const home = os.homedir()
  return {
    source: takeoutDir.startsWith(home) ? `~${takeoutDir.slice(home.length)}` : takeoutDir,
    files: totals.files,
    bytes: totals.bytes,
    indexedAt: (db.prepare("SELECT finished_at FROM index_runs ORDER BY id DESC LIMIT 1").pluck().get() as number | undefined) ?? null,
    folderFound: totals.files > 0,
  }
}

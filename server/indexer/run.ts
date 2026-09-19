import fs from "node:fs"
import path from "node:path"

import { MODULES } from "@/lib/constant"
import type { Db } from "@/server/db"
import { scanFiles } from "./scan"

export type Indexer = (ctx: { db: Db; root: string }) => Promise<void> | void

/** Dedicated per-mod indexers (mail, chat, ...) are registered here as they are built. */
export const INDEXERS: Record<string, Indexer> = {}

/** Modules that are only browsable after their own indexer has run. Drive and the generic browser need just the file scan. */
const NEEDS_DEDICATED_INDEXER = new Set(MODULES.map((m) => m.id).filter((id) => id !== "drive" && id !== "browse"))

const setState = (db: Db, id: string, state: string, detail: string | null = null) =>
  db
    .prepare(
      `INSERT INTO modules (id, state, detail, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET state = excluded.state, detail = excluded.detail, updated_at = excluded.updated_at`
    )
    .run(id, state, detail, Date.now())

function refreshCounts(db: Db) {
  db.prepare(
    `UPDATE modules SET
       file_count  = (SELECT count(*) FROM files WHERE module = modules.id),
       total_bytes = (SELECT coalesce(sum(size), 0) FROM files WHERE module = modules.id)`
  ).run()
}

export async function runIndexer(db: Db, root: string) {
  for (const mod of MODULES) {
    const present = mod.sourceFolders.length === 0 || mod.sourceFolders.some((f) => fs.existsSync(path.join(root, f)))
    setState(db, mod.id, present ? "indexing" : "missing")
  }
  db.prepare("DELETE FROM index_errors").run() // errors are re-derived on every run

  const startedAt = Date.now()
  const scan = scanFiles(db, root)

  for (const mod of MODULES) {
    const row = db.prepare("SELECT state FROM modules WHERE id = ?").get(mod.id) as { state: string }
    if (row.state === "missing") continue
    const indexer = INDEXERS[mod.id]
    try {
      if (indexer) {
        await indexer({ db, root })
        setState(db, mod.id, "ready")
      } else {
        setState(db, mod.id, NEEDS_DEDICATED_INDEXER.has(mod.id) ? "pending" : "ready")
      }
    } catch (error) {
      setState(db, mod.id, "failed", (error as Error).message)
      db.prepare("INSERT INTO index_errors (module, path, reason, occurred_at) VALUES (?, ?, ?, ?)").run(
        mod.id,
        mod.sourceFolders[0] ?? "",
        `Indexer failed: ${(error as Error).message}`,
        Date.now()
      )
    }
  }
  refreshCounts(db)
  const total = db.prepare("SELECT count(*) FROM files").pluck().get() as number
  const errors = db.prepare("SELECT count(*) FROM index_errors").pluck().get() as number
  db.prepare(
    "INSERT INTO index_runs (started_at, finished_at, total_files, added, updated, removed, errors) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(startedAt, Date.now(), total, scan.added, scan.updated, scan.removed, errors)
}

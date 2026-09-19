import fs from "node:fs"
import path from "node:path"

import { MODULES } from "@/lib/constant"
import type { Db } from "@/server/db"
import { indexCalendar } from "./calendar"
import { indexChat } from "./chat"
import { indexDrive } from "./drive"
import { indexMail } from "./mail"
import { indexPhotos } from "./photos"
import { scanFiles } from "./scan"

export type Indexer = (ctx: { db: Db; root: string }) => Promise<void> | void

/** Dedicated per-mod indexers (mail, chat, ...) are registered here as they are built. */
export const INDEXERS: Record<string, Indexer> = {
  drive: ({ db }) => indexDrive(db),
  chat: ({ db, root }) => indexChat(db, root),
  mail: ({ db, root }) => indexMail(db, root),
  calendar: ({ db, root }) => indexCalendar(db, root),
  photos: ({ db, root }) => indexPhotos(db, root),
}

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
        setState(db, mod.id, "ready") // small modules parse their files on demand
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

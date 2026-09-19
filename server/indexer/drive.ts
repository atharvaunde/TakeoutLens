import path from "node:path"

import type { Db } from "@/server/db"

/** Rebuild the filename search index for Drive (file list comes from the scanner). */
export function indexDrive(db: Db) {
  const rows = db.prepare("SELECT id, rel_path FROM files WHERE module = 'drive'").all() as { id: number; rel_path: string }[]
  const insert = db.prepare("INSERT INTO drive_fts (rowid, name, path) VALUES (?, ?, ?)")
  db.transaction(() => {
    db.prepare("DELETE FROM drive_fts").run()
    for (const row of rows) insert.run(row.id, path.posix.basename(row.rel_path), row.rel_path)
  })()
}

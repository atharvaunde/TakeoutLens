import fs from "node:fs"
import path from "node:path"
import Database from "better-sqlite3"

import { DB_FILE_NAME } from "@/lib/constant"
import { getConfig } from "@/server/config"
import { MIGRATIONS } from "./schema"

export type Db = Database.Database

export function migrate(db: Db) {
  const current = db.pragma("user_version", { simple: true }) as number
  for (let version = current; version < MIGRATIONS.length; version++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[version])
      db.pragma(`user_version = ${version + 1}`)
    })()
  }
}

export function openDb(file: string): Db {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const db = new Database(file)
  db.pragma("journal_mode = WAL")
  db.pragma("busy_timeout = 5000")
  migrate(db)
  return db
}

const globalForDb = globalThis as unknown as { __takeoutDb?: { key: string; db: Db } }

/**
 * Process-wide handle (survives dev HMR). Re-opened when DATA_DIR or the schema version
 * changes, so a hot-reloaded server picks up new migrations instead of using a stale handle.
 */
export function getDb(): Db {
  const file = path.join(getConfig().dataDir, DB_FILE_NAME)
  // The inode changes if the file is deleted and recreated underneath us (e.g. a manual index reset).
  let inode = 0
  try {
    inode = fs.statSync(file).ino
  } catch {
    // not created yet
  }
  const key = `${file}#${MIGRATIONS.length}#${inode}`
  if (globalForDb.__takeoutDb?.key !== key) {
    try {
      globalForDb.__takeoutDb?.db.close()
    } catch {
      // already unusable
    }
    const db = openDb(file)
    globalForDb.__takeoutDb = { key: `${file}#${MIGRATIONS.length}#${fs.statSync(file).ino}`, db }
  }
  return globalForDb.__takeoutDb.db
}

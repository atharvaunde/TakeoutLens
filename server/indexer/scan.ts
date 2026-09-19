import fs from "node:fs"
import path from "node:path"

import { MODULES } from "@/lib/constant"
import type { Db } from "@/server/db"

const FOLDER_TO_MODULE = new Map<string, string>(
  MODULES.flatMap((m) => m.sourceFolders.map((folder) => [folder, m.id] as const))
)
const FALLBACK_MODULE = "browse"

export function moduleForTopFolder(folder: string): string {
  return FOLDER_TO_MODULE.get(folder) ?? FALLBACK_MODULE
}

export interface ScanResult {
  added: number
  updated: number
  removed: number
  unchanged: number
  errors: number
}

interface FileRow {
  id: number
  rel_path: string
  size: number
  mtime_ms: number
}

/**
 * Walk the (read-only) Takeout tree and sync the `files` table: new and changed
 * files are upserted, vanished files removed, unchanged files skipped
 * (keyed by relative path, size and mtime). Symlinks are never followed.
 */
export function scanFiles(db: Db, root: string, onProgress?: (seen: number) => void): ScanResult {
  const existing = new Map<string, FileRow>(
    (db.prepare("SELECT id, rel_path, size, mtime_ms FROM files").all() as FileRow[]).map((r) => [r.rel_path, r])
  )
  const seen = new Set<string>()
  const result: ScanResult = { added: 0, updated: 0, removed: 0, unchanged: 0, errors: 0 }

  const upsert = db.prepare(
    `INSERT INTO files (rel_path, module, size, mtime_ms) VALUES (@rel, @module, @size, @mtime)
     ON CONFLICT(rel_path) DO UPDATE SET module = @module, size = @size, mtime_ms = @mtime`
  )
  const logError = db.prepare("INSERT INTO index_errors (module, path, reason, occurred_at) VALUES (?, ?, ?, ?)")
  const recordError = (module: string, rel: string, reason: string) => {
    result.errors++
    logError.run(module, rel, reason, Date.now())
  }

  const visit = (dir: string, topFolder: string | null) => {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch (error) {
      recordError(moduleForTopFolder(topFolder ?? ""), path.relative(root, dir), `Cannot read folder: ${(error as Error).message}`)
      return
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name)
      const rel = path.relative(root, abs).split(path.sep).join("/")
      const top = topFolder ?? entry.name
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) {
        visit(abs, top)
        continue
      }
      if (!entry.isFile() || topFolder === null) continue // root-level files (e.g. archive_browser.html) are ignored
      try {
        const stat = fs.statSync(abs)
        const module = moduleForTopFolder(topFolder)
        seen.add(rel)
        const previous = existing.get(rel)
        const mtime = Math.floor(stat.mtimeMs)
        if (!previous) result.added++
        else if (previous.size !== stat.size || previous.mtime_ms !== mtime) result.updated++
        else {
          result.unchanged++
          continue
        }
        upsert.run({ rel, module, size: stat.size, mtime })
        if (onProgress && seen.size % 1000 === 0) onProgress(seen.size)
      } catch (error) {
        recordError(moduleForTopFolder(topFolder), rel, `Cannot stat file: ${(error as Error).message}`)
      }
    }
  }

  db.transaction(() => {
    visit(root, null)
    const remove = db.prepare("DELETE FROM files WHERE id = ?")
    for (const [rel, row] of existing) {
      if (!seen.has(rel)) {
        remove.run(row.id)
        result.removed++
      }
    }
  })()
  return result
}

import fs from "node:fs"
import path from "node:path"

import { getConfig } from "@/server/config"
import { getDb } from "@/server/db"

/**
 * Resolve an opaque file id from the index to an absolute path, guaranteeing it stays
 * inside the Takeout root even through symlinks or ".." in stored paths.
 */
export function resolveWithinRoot(root: string, relPath: string): string | null {
  try {
    const realRoot = fs.realpathSync(root)
    const real = fs.realpathSync(path.join(realRoot, relPath))
    return real === realRoot || real.startsWith(realRoot + path.sep) ? real : null
  } catch {
    return null
  }
}

export interface ResolvedFile {
  id: number
  absPath: string
  name: string
}

export function resolveFileById(rawId: string): ResolvedFile | null {
  if (!/^\d{1,12}$/.test(rawId)) return null
  const row = getDb().prepare("SELECT id, rel_path FROM files WHERE id = ?").get(Number(rawId)) as
    | { id: number; rel_path: string }
    | undefined
  if (!row) return null
  const absPath = resolveWithinRoot(getConfig().takeoutDir, row.rel_path)
  return absPath ? { id: row.id, absPath, name: path.basename(row.rel_path) } : null
}

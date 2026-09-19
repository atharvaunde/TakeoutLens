import fs from "node:fs"
import path from "node:path"

import { PHOTOS } from "@/lib/constant"
import type { Db } from "@/server/db"

interface Sidecar {
  title?: string
  description?: string
  photoTakenTime?: { timestamp?: string }
  creationTime?: { timestamp?: string }
  geoData?: { latitude?: number; longitude?: number }
}

/** Sidecar name candidates: classic `X.jpg.json`, newer `X.jpg.supplemental-metadata.json`, and `X.json` for edited copies. */
export function sidecarCandidates(relPath: string): string[] {
  const ext = path.posix.extname(relPath)
  const stem = relPath.slice(0, relPath.length - ext.length)
  return [`${relPath}.json`, `${relPath}.supplemental-metadata.json`, `${stem}.json`, `${stem.replace(/-edited$/, "")}${ext}.json`]
}

/** Index photos: taken time from the sidecar (falls back to file mtime), album = folder name, location if non-zero. */
export function indexPhotos(db: Db, root: string) {
  const files = db.prepare("SELECT id, rel_path, mtime_ms FROM files WHERE module = 'photos'").all() as { id: number; rel_path: string; mtime_ms: number }[]
  const known = new Set(files.map((f) => f.rel_path))
  const insert = db.prepare("INSERT OR REPLACE INTO photo_items (file_id, taken_ts, title, album, description, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)")
  db.transaction(() => {
    db.prepare("DELETE FROM photo_items").run()
    for (const file of files) {
      if (!PHOTOS.imageExtensions.includes(path.posix.extname(file.rel_path).toLowerCase())) continue
      const sidecarPath = sidecarCandidates(file.rel_path).find((c) => known.has(c))
      let meta: Sidecar = {}
      if (sidecarPath) {
        try {
          meta = JSON.parse(fs.readFileSync(path.join(root, sidecarPath), "utf8")) as Sidecar
        } catch {
          // unreadable sidecar: fall back to file data
        }
      }
      const seconds = Number(meta.photoTakenTime?.timestamp ?? meta.creationTime?.timestamp)
      const lat = meta.geoData?.latitude
      const lon = meta.geoData?.longitude
      const hasGeo = lat !== undefined && lon !== undefined && (lat !== 0 || lon !== 0)
      insert.run(
        file.id,
        Number.isFinite(seconds) ? seconds * 1000 : file.mtime_ms,
        meta.title || path.posix.basename(file.rel_path),
        path.posix.basename(path.posix.dirname(file.rel_path)),
        meta.description ?? "",
        hasGeo ? lat : null,
        hasGeo ? lon : null
      )
    }
  })()
}

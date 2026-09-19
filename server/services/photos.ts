import type { PhotoItem } from "@/lib/types"
import { PHOTOS } from "@/lib/constant"
import { requireSession } from "@/server/auth/session"
import { getDb } from "@/server/db"

export async function listAlbums(): Promise<{ album: string; count: number }[]> {
  await requireSession()
  return getDb().prepare("SELECT album, count(*) AS count FROM photo_items GROUP BY album ORDER BY album DESC").all() as { album: string; count: number }[]
}

interface Row {
  file_id: number
  taken_ts: number
  title: string
  album: string
  description: string
  latitude: number | null
}

export async function listPhotos(page: number, album: string | null): Promise<{ photos: PhotoItem[]; total: number }> {
  await requireSession()
  const db = getDb()
  const where = album ? "WHERE album = ?" : ""
  const args = album ? [album] : []
  const total = db.prepare(`SELECT count(*) FROM photo_items ${where}`).pluck().get(...args) as number
  const rows = db
    .prepare(`SELECT file_id, taken_ts, title, album, description, latitude FROM photo_items ${where} ORDER BY taken_ts DESC, file_id DESC LIMIT ? OFFSET ?`)
    .all(...args, PHOTOS.pageSize, (page - 1) * PHOTOS.pageSize) as Row[]
  return {
    total,
    photos: rows.map((r) => ({ id: r.file_id, takenAt: r.taken_ts, title: r.title, album: r.album, description: r.description, hasLocation: r.latitude !== null })),
  }
}

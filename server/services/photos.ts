import path from "node:path"
import exifr from "exifr"
import sharp from "sharp"

import type { PhotoInfo, PhotoItem } from "@/lib/types"
import { PHOTOS, THUMBNAIL } from "@/lib/constant"
import { requireSession } from "@/server/auth/session"
import { getConfig } from "@/server/config"
import { getDb } from "@/server/db"
import { readTakeoutJson } from "@/server/files/read"
import { resolveWithinRoot } from "@/server/files/resolve"
import { sidecarCandidates } from "@/server/indexer/photos"

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

interface Sidecar {
  title?: string
  description?: string
  imageViews?: string
  photoTakenTime?: { timestamp?: string }
  creationTime?: { timestamp?: string }
  geoData?: { latitude?: number; longitude?: number }
  url?: string
  googlePhotosOrigin?: Record<string, unknown>
}

const seconds = (value: string | undefined) => (value && Number.isFinite(Number(value)) ? Number(value) * 1000 : null)

/** Everything known about one photo: Google's JSON sidecar, image dimensions and the EXIF embedded in the file. */
export async function getPhotoInfo(fileId: number): Promise<PhotoInfo | null> {
  await requireSession()
  const db = getDb()
  const file = db.prepare("SELECT id, rel_path, size FROM files WHERE id = ? AND module = 'photos'").get(fileId) as { id: number; rel_path: string; size: number } | undefined
  if (!file) return null
  const abs = resolveWithinRoot(getConfig().takeoutDir, file.rel_path)
  if (!abs) return null

  const sidecarRel = sidecarCandidates(file.rel_path).find((rel) => db.prepare("SELECT 1 FROM files WHERE rel_path = ?").get(rel) !== undefined)
  const sidecar = sidecarRel ? (readTakeoutJson<Sidecar>(sidecarRel, 1_000_000) ?? {}) : {}

  let width: number | null = null
  let height: number | null = null
  let format: string | null = null
  try {
    const meta = await sharp(abs, { limitInputPixels: THUMBNAIL.maxInputPixels }).metadata()
    // Orientation 5-8 means the stored pixels are rotated 90 degrees relative to how it is shown.
    const rotated = (meta.orientation ?? 1) >= 5
    width = (rotated ? meta.height : meta.width) ?? null
    height = (rotated ? meta.width : meta.height) ?? null
    format = meta.format ?? null
  } catch {
    // unreadable image: sidecar data only
  }

  let exif: Record<string, unknown> = {}
  try {
    exif = ((await exifr.parse(abs, { gps: true })) as Record<string, unknown> | undefined) ?? {}
  } catch {
    // no EXIF
  }
  const text = (key: string) => (typeof exif[key] === "string" && exif[key] ? (exif[key] as string).trim() : null)
  const num = (key: string) => (typeof exif[key] === "number" ? (exif[key] as number) : null)
  const make = text("Make")
  const model = text("Model")
  const camera = [make, model && make && model.startsWith(make) ? model.slice(make.length).trim() : model].filter(Boolean).join(" ") || null

  const geo = sidecar.geoData
  const sidecarHasGeo = geo?.latitude !== undefined && geo.longitude !== undefined && (geo.latitude !== 0 || geo.longitude !== 0)
  const exifTaken = exif.DateTimeOriginal instanceof Date ? exif.DateTimeOriginal.getTime() : null

  return {
    name: sidecar.title || path.posix.basename(file.rel_path),
    width,
    height,
    format,
    sizeBytes: file.size,
    takenAt: seconds(sidecar.photoTakenTime?.timestamp) ?? exifTaken,
    uploadedAt: seconds(sidecar.creationTime?.timestamp),
    views: sidecar.imageViews !== undefined && Number.isFinite(Number(sidecar.imageViews)) ? Number(sidecar.imageViews) : null,
    description: sidecar.description ?? "",
    camera,
    lens: text("LensModel"),
    exposureSeconds: num("ExposureTime"),
    aperture: num("FNumber"),
    iso: num("ISO"),
    focalLengthMm: num("FocalLength"),
    software: text("Software"),
    latitude: sidecarHasGeo ? (geo!.latitude as number) : num("latitude"),
    longitude: sidecarHasGeo ? (geo!.longitude as number) : num("longitude"),
    googleUrl: sidecar.url ?? null,
    origin: sidecar.googlePhotosOrigin ? Object.keys(sidecar.googlePhotosOrigin)[0] : null,
  }
}

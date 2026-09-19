import path from "node:path"

import type { PlaylistRow } from "@/columns/youtube-playlists.column"
import type { VideoRow } from "@/columns/youtube-videos.column"
import { getFileKind, type TableParams } from "@/lib/helper"
import { requireSession } from "@/server/auth/session"
import { parseCsv } from "@/server/csv"
import { getDb } from "@/server/db"
import { readTakeoutText } from "@/server/files/read"

const ROOT = "YouTube and YouTube Music"

/** Match CSV titles to file names despite Google replacing characters like ":" and "/" with "_" in file names. */
export const normalizeTitle = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "")

const csv = (rel: string) => parseCsv(readTakeoutText(`${ROOT}/${rel}`)?.text ?? "")

export interface YoutubeOverview {
  channelTitle: string
  videoCount: number
  playlistCount: number
}

function loadVideos(): VideoRow[] {
  const files = getDb().prepare("SELECT id, rel_path, size FROM files WHERE module = 'youtube' AND rel_path LIKE ?").all(`${ROOT}/videos/%`) as { id: number; rel_path: string; size: number }[]
  const byTitle = new Map(
    files.filter((f) => getFileKind(f.rel_path) === "video").map((f) => [normalizeTitle(path.posix.basename(f.rel_path, path.posix.extname(f.rel_path))), f])
  )
  const used = new Set<string>()
  const rows: VideoRow[] = csv("video metadata/videos.csv").rows.map((r, index) => {
    const title = r["Video Title (Original)"] ?? ""
    const key = normalizeTitle(title)
    const file = byTitle.get(key)
    if (file) used.add(key)
    return {
      id: `v${index}`,
      title,
      durationMs: Number(r["Approx Duration (ms)"]) || null,
      privacy: r["Privacy"] ?? "",
      state: r["Video State"] ?? "",
      createdAt: r["Video Create Timestamp"] || null,
      fileId: file?.id ?? null,
      size: file?.size ?? null,
    }
  })
  // Video files with no metadata row (e.g. live streams) still appear.
  for (const [key, file] of byTitle) {
    if (used.has(key)) continue
    rows.push({ id: `f${file.id}`, title: path.posix.basename(file.rel_path, path.posix.extname(file.rel_path)), durationMs: null, privacy: "", state: "File only", createdAt: null, fileId: file.id, size: file.size })
  }
  return rows
}

export async function getYoutubeOverview(): Promise<YoutubeOverview> {
  await requireSession()
  return {
    channelTitle: csv("channels/channel.csv").rows[0]?.["Channel Title (Original)"] ?? "YouTube",
    videoCount: loadVideos().length,
    playlistCount: csv("playlists/playlists.csv").rows.length,
  }
}

export async function listVideos(params: TableParams): Promise<{ rows: VideoRow[]; total: number }> {
  await requireSession()
  const needle = params.search.toLowerCase()
  const direction = params.dir === "desc" ? -1 : 1
  const key = (v: VideoRow): string | number => (params.sort === "durationMs" ? (v.durationMs ?? -1) : params.sort === "size" ? (v.size ?? -1) : params.sort === "title" ? v.title.toLowerCase() : (v.createdAt ?? ""))
  const rows = loadVideos()
    .filter((v) => !needle || v.title.toLowerCase().includes(needle))
    .sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0) * (params.sort ? direction : -1))
  const start = (params.page - 1) * params.pageSize
  return { rows: rows.slice(start, start + params.pageSize), total: rows.length }
}

export async function listPlaylists(params: TableParams): Promise<{ rows: PlaylistRow[]; total: number }> {
  await requireSession()
  const needle = params.search.toLowerCase()
  const rows: PlaylistRow[] = csv("playlists/playlists.csv")
    .rows.map((r, index) => ({
      id: r["Playlist ID"] || String(index),
      title: r["Playlist Title (Original)"] ?? "",
      visibility: r["Playlist Visibility"] ?? "",
      createdAt: r["Playlist Create Timestamp"] || null,
      updatedAt: r["Playlist Update Timestamp"] || null,
    }))
    .filter((p) => !needle || p.title.toLowerCase().includes(needle))
  const start = (params.page - 1) * params.pageSize
  return { rows: rows.slice(start, start + params.pageSize), total: rows.length }
}

import path from "node:path"

import type { DriveRow } from "@/columns/drive-files.column"
import type { TableParams } from "@/lib/helper"
import { getFileKind, toFtsQuery } from "@/lib/helper"
import { requireSession } from "@/server/auth/session"
import { getDb } from "@/server/db"

export interface TreeSource {
  /** Value of files.module for this tree. */
  module: "drive" | "browse"
  /** Path prefix of the tree inside the export ("Drive"), or "" when top-level folders are the roots. */
  root: string
  /** Use the Drive filename FTS index; otherwise search by LIKE on the path. */
  fts: boolean
}

export const DRIVE_SOURCE: TreeSource = { module: "drive", root: "Drive", fts: true }
export const BROWSE_SOURCE: TreeSource = { module: "browse", root: "", fts: false }

interface FileRow {
  id: number
  rel_path: string
  size: number
  mtime_ms: number
}

export interface DriveListing {
  rows: DriveRow[]
  total: number
  breadcrumbs: { label: string; path: string }[]
  folder: string
  searching: boolean
}

/** Keep only a clean relative folder path (no "..", no leading slash). */
export function normalizeFolder(input: string | undefined): string {
  return (input ?? "")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/")
}

function toFileRow(row: FileRow, showPath: boolean, root: string): DriveRow {
  const name = path.posix.basename(row.rel_path)
  const dir = path.posix.dirname(row.rel_path)
  const folder = dir === "." ? "" : root && dir.startsWith(`${root}`) ? dir.slice(root.length).replace(/^\//, "") : dir
  return {
    id: `f${row.id}`,
    kind: "file",
    fileId: row.id,
    name,
    fileKind: getFileKind(name),
    location: showPath ? folder : "",
    folderPath: "",
    size: row.size,
    modifiedAt: new Date(row.mtime_ms).toISOString(),
  }
}

function sortRows(rows: DriveRow[], params: TableParams): DriveRow[] {
  const direction = params.dir === "desc" ? -1 : 1
  const key = (r: DriveRow): string | number => {
    switch (params.sort) {
      case "size": return r.size ?? -1
      case "modifiedAt": return r.modifiedAt ?? ""
      default: return r.name.toLowerCase()
    }
  }
  return [...rows].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1 // folders first, always
    const ka = key(a)
    const kb = key(b)
    return (ka > kb ? 1 : ka < kb ? -1 : 0) * direction
  })
}

export async function listTree(source: TreeSource, folderInput: string | undefined, params: TableParams): Promise<DriveListing> {
  await requireSession()
  const db = getDb()
  const folder = normalizeFolder(folderInput)
  const breadcrumbs = folder
    .split("/")
    .filter(Boolean)
    .map((label, index, parts) => ({ label, path: parts.slice(0, index + 1).join("/") }))

  const base = source.root ? `${source.root}/` : ""
  const prefix = folder ? `${base}${folder}/` : base
  const needle = params.search.trim()
  if (needle) {
    let found: FileRow[] = []
    if (source.fts) {
      const match = toFtsQuery(needle)
      if (match) {
        found = db
          .prepare(
            `SELECT f.id, f.rel_path, f.size, f.mtime_ms FROM drive_fts
             JOIN files f ON f.id = drive_fts.rowid
             WHERE drive_fts MATCH ? AND substr(f.rel_path, 1, ?) = ?
             ORDER BY rank LIMIT 2000`
          )
          .all(match, prefix.length, prefix) as FileRow[]
      }
    } else {
      found = db
        .prepare("SELECT id, rel_path, size, mtime_ms FROM files WHERE module = ? AND substr(rel_path, 1, ?) = ? AND rel_path LIKE ? ESCAPE '\\' LIMIT 2000")
        .all(source.module, prefix.length, prefix, `%${needle.replace(/[\\%_]/g, "\\$&")}%`) as FileRow[]
    }
    const rows = sortRows(found.map((r) => toFileRow(r, true, source.root)), params.sort ? params : { ...params, sort: null })
    const start = (params.page - 1) * params.pageSize
    return { rows: rows.slice(start, start + params.pageSize), total: rows.length, breadcrumbs, folder, searching: true }
  }

  const files = db
    .prepare("SELECT id, rel_path, size, mtime_ms FROM files WHERE module = ? AND substr(rel_path, 1, ?) = ?")
    .all(source.module, prefix.length, prefix) as FileRow[]

  const folders = new Map<string, { count: number; latest: number }>()
  const direct: DriveRow[] = []
  for (const row of files) {
    const rest = row.rel_path.slice(prefix.length)
    const slash = rest.indexOf("/")
    if (slash === -1) {
      direct.push(toFileRow(row, false, source.root))
    } else {
      const name = rest.slice(0, slash)
      const entry = folders.get(name) ?? { count: 0, latest: 0 }
      entry.count++
      entry.latest = Math.max(entry.latest, row.mtime_ms)
      folders.set(name, entry)
    }
  }
  const folderRows: DriveRow[] = [...folders].map(([name, info]) => ({
    id: `d${name}`,
    kind: "folder",
    fileId: null,
    name,
    fileKind: "other",
    location: "",
    folderPath: folder ? `${folder}/${name}` : name,
    size: null,
    modifiedAt: new Date(info.latest).toISOString(),
    itemCount: info.count,
  }))
  const all = sortRows([...folderRows, ...direct], params)
  const start = (params.page - 1) * params.pageSize
  return { rows: all.slice(start, start + params.pageSize), total: all.length, breadcrumbs, folder, searching: false }
}

export const listDrive = (folder: string | undefined, params: TableParams) => listTree(DRIVE_SOURCE, folder, params)
export const listBrowse = (folder: string | undefined, params: TableParams) => listTree(BROWSE_SOURCE, folder, params)

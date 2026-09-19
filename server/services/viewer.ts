import path from "node:path"

import type { CsvRowData } from "@/lib/types"
import type { TableParams } from "@/lib/helper"
import { VIEWER } from "@/lib/constant"
import { requireSession } from "@/server/auth/session"
import { parseCsv } from "@/server/csv"
import { getConfig } from "@/server/config"
import { getDb } from "@/server/db"
import { readTakeoutText } from "@/server/files/read"
import fs from "node:fs"
import { resolveWithinRoot } from "@/server/files/resolve"

export interface FileMeta {
  id: number
  name: string
  relPath: string
  size: number
}

export type FilePreview =
  | { kind: "text"; text: string; truncated: boolean }
  | { kind: "json"; text: string; truncated: boolean }
  | { kind: "html"; html: string; truncated: boolean }
  | { kind: "csv"; headers: string[]; rows: CsvRowData[]; total: number; secret: boolean; passwordHeaders: string[] }
  | { kind: "download"; reason: string }

const TEXT_EXTENSIONS = new Set([".txt", ".log", ".md", ".ini", ".xml", ".yml", ".yaml", ".sql", ".vcf", ".ics", ".kml", ".cfg", ".conf", ".tsv"])
const PASSWORD_HEADER = /^password$/i

export function getFileMeta(id: number): FileMeta | null {
  const row = getDb().prepare("SELECT id, rel_path, size FROM files WHERE id = ?").get(id) as { id: number; rel_path: string; size: number } | undefined
  return row ? { id: row.id, name: path.posix.basename(row.rel_path), relPath: row.rel_path, size: row.size } : null
}

export async function getFileForViewer(id: number): Promise<FileMeta | null> {
  await requireSession()
  return getFileMeta(id)
}

export function classify(name: string): "json" | "csv" | "html" | "text" | "other" {
  const ext = path.posix.extname(name).toLowerCase()
  if (ext === ".json") return "json"
  if (ext === ".csv") return "csv"
  if (ext === ".html" || ext === ".htm") return "html"
  if (TEXT_EXTENSIONS.has(ext)) return "text"
  return "other"
}

export async function getFilePreview(file: FileMeta, params: TableParams): Promise<FilePreview> {
  await requireSession()
  const kind = classify(file.name)
  if (kind === "other") return { kind: "download", reason: "This file type is not previewed." }
  const abs = resolveWithinRoot(getConfig().takeoutDir, file.relPath)
  if (!abs || !fs.existsSync(abs)) return { kind: "download", reason: "The file is not available." }

  if (kind === "csv") {
    if (file.size > 30_000_000) return { kind: "download", reason: "This CSV is too large to preview." }
    const text = readTakeoutText(file.relPath, 30_000_000)?.text ?? ""
    const { headers, rows } = parseCsv(text)
    const passwordHeaders = headers.filter((h) => PASSWORD_HEADER.test(h))
    const needle = params.search.toLowerCase()
    let list = rows.map((r, index) => ({ ...r, __id: String(index) }) as CsvRowData)
    if (needle) list = list.filter((r) => headers.some((h) => r[h]?.toLowerCase().includes(needle)))
    const sortIndex = params.sort?.startsWith("c") ? Number(params.sort.slice(1)) : NaN
    const sortHeader = Number.isInteger(sortIndex) ? headers[sortIndex] : undefined
    if (sortHeader) {
      const direction = params.dir === "desc" ? -1 : 1
      list = [...list].sort((a, b) => (a[sortHeader] > b[sortHeader] ? 1 : a[sortHeader] < b[sortHeader] ? -1 : 0) * direction)
    }
    const start = (params.page - 1) * params.pageSize
    return { kind: "csv", headers, rows: list.slice(start, start + params.pageSize), total: list.length, secret: passwordHeaders.length > 0, passwordHeaders }
  }

  const file2 = readTakeoutText(file.relPath, VIEWER.maxTextBytes)
  if (!file2) return { kind: "download", reason: "The file could not be read." }
  if (kind === "json") {
    try {
      return { kind: "json", text: file2.truncated ? file2.text : JSON.stringify(JSON.parse(file2.text), null, 2), truncated: file2.truncated }
    } catch {
      return { kind: "text", text: file2.text, truncated: file2.truncated }
    }
  }
  if (kind === "html") return { kind: "html", html: file2.text, truncated: file2.truncated }
  return { kind: "text", text: file2.text, truncated: file2.truncated }
}

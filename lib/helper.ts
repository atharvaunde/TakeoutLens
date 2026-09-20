import type { LucideIcon } from "lucide-react"
import { FILE_ICON_FALLBACK, FOLDER_MIME, MIME_BY_EXT, FILE_KIND_DEFAULT_FAMILY, FILE_KIND_FAMILY, FILE_KIND_MAX_CHARS, FILE_ICONS_BY_EXT, DEFAULT_CURRENCY, DEFAULT_LOCALE, INLINE_MIME_TYPES, PAGINATION, TABLE_PARAMS, UNITS } from "@/lib/constant"

// Shared formatters and small pure helpers. All Intl / toLocale* usage lives here.

type DateInput = Date | string | number | null | undefined

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const PLACEHOLDER = "—"

export function formatDate(value: DateInput, options?: Intl.DateTimeFormatOptions): string {
  const date = toDate(value)
  if (!date) return PLACEHOLDER
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(date)
}

export function formatTime(value: DateInput, options?: Intl.DateTimeFormatOptions): string {
  const date = toDate(value)
  if (!date) return PLACEHOLDER
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(date)
}

export function formatDateTime(value: DateInput): string {
  const date = toDate(value)
  if (!date) return PLACEHOLDER
  return `${formatDate(date)}, ${formatTime(date)}`
}

export function formatRelative(value: DateInput, now: Date = new Date()): string {
  const date = toDate(value)
  if (!date) return PLACEHOLDER
  const diffSeconds = Math.round((date.getTime() - now.getTime()) / 1000)
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]
  const formatter = new Intl.RelativeTimeFormat(DEFAULT_LOCALE, { numeric: "auto" })
  for (const [unit, seconds] of steps) {
    if (Math.abs(diffSeconds) >= seconds) {
      return formatter.format(Math.round(diffSeconds / seconds), unit)
    }
  }
  return formatter.format(diffSeconds, "second")
}

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = DEFAULT_CURRENCY
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return PLACEHOLDER
  return new Intl.NumberFormat(DEFAULT_LOCALE, { style: "currency", currency }).format(amount)
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return PLACEHOLDER
  return new Intl.NumberFormat(DEFAULT_LOCALE).format(value)
}

export function formatBytes(bytes: number | null | undefined, decimals = 1): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return PLACEHOLDER
  if (bytes === 0) return `0 ${UNITS.bytes[0]}`
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(UNITS.bytesBase)),
    UNITS.bytes.length - 1
  )
  const value = bytes / UNITS.bytesBase ** exponent
  return `${value.toFixed(exponent === 0 ? 0 : decimals)} ${UNITS.bytes[exponent]}`
}

export function formatDuration(totalSeconds: number | null | undefined, options: { fixed?: boolean } = {}): string {
  if (totalSeconds === null || totalSeconds === undefined || Number.isNaN(totalSeconds)) {
    return PLACEHOLDER
  }
  const seconds = Math.floor(totalSeconds % 60)
  const minutes = Math.floor((totalSeconds / 60) % 60)
  const hours = Math.floor(totalSeconds / 3600)
  const pad = (n: number) => n.toString().padStart(2, "0")
  if (options.fixed) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` // always HH:MM:SS so a column lines up
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0][0] ?? ""
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : ""
  return (first + last).toUpperCase()
}

type SearchParams = Record<string, string | string[] | undefined>

export interface TableParams {
  page: number
  pageSize: number
  sort: string | null
  dir: "asc" | "desc"
  search: string
  /** Values of the requested filter params, keyed by filter id. */
  filters: Record<string, string>
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

/** Parse the URL params that drive a server-side table (1-based `page`). */
export function parseTableParams(searchParams: SearchParams, filterIds: readonly string[] = []): TableParams {
  const page = Math.max(1, Number.parseInt(first(searchParams[TABLE_PARAMS.page]) ?? "1", 10) || 1)
  const requested = Number.parseInt(first(searchParams[TABLE_PARAMS.pageSize]) ?? "", 10)
  const pageSize = (PAGINATION.pageSizeOptions as readonly number[]).includes(requested)
    ? requested
    : PAGINATION.defaultPageSize
  const dir = first(searchParams[TABLE_PARAMS.dir]) === "desc" ? "desc" : "asc"
  const filters: Record<string, string> = {}
  for (const id of filterIds) {
    const value = first(searchParams[id])
    if (value) filters[id] = value
  }
  return {
    page,
    pageSize,
    sort: first(searchParams[TABLE_PARAMS.sort]) ?? null,
    dir,
    search: first(searchParams[TABLE_PARAMS.search]) ?? "",
    filters,
  }
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`
}

export type FileKind = "image" | "video" | "other"

/** Only images and videos are previewed in the app; everything else is download-only. */
export function getFileKind(fileName: string): FileKind {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
  const mime = INLINE_MIME_TYPES[ext]
  if (!mime) return "other"
  return mime.startsWith("video/") ? "video" : "image"
}

/** Turn free text into a safe FTS5 prefix query: every word quoted, last-word prefix match. */
export function toFtsQuery(input: string): string | null {
  const tokens = input.match(/[\p{L}\p{N}]+/gu)
  if (!tokens?.length) return null
  return tokens.map((token) => `"${token}"*`).join(" ")
}

export function getFileIcon(fileName: string): LucideIcon {
  const dot = fileName.lastIndexOf(".")
  return (dot === -1 ? undefined : FILE_ICONS_BY_EXT[fileName.slice(dot).toLowerCase()]) ?? FILE_ICON_FALLBACK
}

/** Start a browser download for a same-origin URL (client only). */
export function triggerDownload(url: string) {
  const link = document.createElement("a")
  link.href = url
  link.download = ""
  document.body.appendChild(link)
  link.click()
  link.remove()
}

/** YYYY-MM-DD in UTC; used to detect day changes in timelines. */
export function getDayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10)
}

export function formatDay(value: DateInput): string {
  return formatDate(value, { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
}

/** Split an FTS snippet marked with sentinel characters into plain and highlighted parts. */
export function splitHighlight(snippet: string, start: string, end: string): { text: string; match: boolean }[] {
  const parts: { text: string; match: boolean }[] = []
  let rest = snippet
  while (rest.length) {
    const open = rest.indexOf(start)
    if (open === -1) {
      parts.push({ text: rest, match: false })
      break
    }
    if (open > 0) parts.push({ text: rest.slice(0, open), match: false })
    const close = rest.indexOf(end, open + 1)
    const stop = close === -1 ? rest.length : close
    parts.push({ text: rest.slice(open + 1, stop), match: true })
    rest = rest.slice(stop + 1)
  }
  return parts
}

const zoneFormatters = new Map<string, Intl.DateTimeFormat>()

/** Wall-clock offset (ms) of `timeZone` at the given UTC instant. */
export function getZoneOffsetMs(ts: number, timeZone: string): number {
  let formatter = zoneFormatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
    zoneFormatters.set(timeZone, formatter)
  }
  const parts = Object.fromEntries(formatter.formatToParts(new Date(ts)).map((p) => [p.type, Number(p.value)]))
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return asUtc - Math.floor(ts / 1000) * 1000
}

/** Convert a wall-clock time in `timeZone` (given as if it were UTC) to a real UTC timestamp. */
export function zonedTimeToUtc(wallMs: number, timeZone: string): number {
  try {
    const guess = wallMs - getZoneOffsetMs(wallMs, timeZone)
    return wallMs - getZoneOffsetMs(guess, timeZone)
  } catch {
    return wallMs // unknown zone: treat as UTC
  }
}

/** Shift a UTC instant so its UTC fields read as the wall clock in `timeZone`. */
export function utcToWall(ts: number, timeZone: string): number {
  try {
    return ts + getZoneOffsetMs(ts, timeZone)
  } catch {
    return ts
  }
}

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" }

/** Turn the HTML fragments Google puts in descriptions into readable plain text (keeps line breaks and bullets). */
export function htmlToText(input: string): string {
  if (!/[<&]/.test(input)) return input
  return input
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|ul|ol|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, text: string) => (text.trim() === href ? href : `${text} (${href})`))
    .replace(/<[^>]+>/g, "")
    .replace(/\\([;,])/g, "$1")
    .replace(/&(?:nbsp|amp|lt|gt|quot|apos|#39);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Compact size for tight UI (sidebar): 4.6G, 62M, 360K, 14K. */
export function formatBytesCompact(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return ""
  const units = ["B", "K", "M", "G", "T"]
  const exponent = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1000)), units.length - 1)
  const value = bytes / 1000 ** exponent
  return `${exponent >= 3 || (value < 10 && exponent > 0) ? value.toFixed(1) : Math.round(value)}${units[exponent]}`
}

/** Very short relative time for tight lists: 2m, 18m, 1h, 3d, 4mo, 2y. */
export function formatShortAgo(value: DateInput, now: Date = new Date()): string {
  const date = toDate(value)
  if (!date) return ""
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000))
  if (seconds < 60) return "now"
  const steps: [number, string][] = [[31536000, "y"], [2592000, "mo"], [86400, "d"], [3600, "h"], [60, "m"]]
  for (const [size, unit] of steps) if (seconds >= size) return `${Math.floor(seconds / size)}${unit}`
  return "now"
}

const decodeQuoted = (value: string) =>
  value.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_m, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))

/** Decode RFC 2047 encoded words (`=?UTF-8?Q?...?=` / `?B?`) in a header value. Unknown charsets fall back to latin1. */
export function decodeMimeWords(input: string): string {
  if (!input.includes("=?")) return input
  return input.replace(/=\?([^?\s]+)\?([QqBb])\?([^?]*)\?=/g, (_m, charset: string, encoding: string, text: string) => {
    const binary = encoding.toUpperCase() === "B" ? atob(text) : decodeQuoted(text)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    try {
      return new TextDecoder(charset.toLowerCase()).decode(bytes)
    } catch {
      return new TextDecoder("latin1").decode(bytes)
    }
  })
}

/** Short kind label for a file chip: "DIR" for folders, else the upper-case extension (max 4 chars). */
export function getKindLabel(fileName: string, isFolder: boolean): string {
  if (isFolder) return "DIR"
  const dot = fileName.lastIndexOf(".")
  return dot === -1 || dot === fileName.length - 1 ? "FILE" : fileName.slice(dot + 1, dot + 1 + FILE_KIND_MAX_CHARS).toUpperCase()
}

export function getKindFamily(kindLabel: string) {
  return FILE_KIND_FAMILY[kindLabel] ?? FILE_KIND_DEFAULT_FAMILY
}

/**
 * Google Calendar invites embed a "Join with Google Meet ... Please do not edit this section." block
 * fenced by dashed rules (-::~:~::~...). Remove the fences and everything between them; the Meet link is
 * shown separately. If the fences are unbalanced, only the rule lines are removed.
 */
export function stripMeetBoilerplate(text: string): string {
  const isRule = (line: string) => /^-[:~-]{8,}$/.test(line.trim())
  const lines = text.split("\n")
  const kept: string[] = []
  let inside = false
  for (const line of lines) {
    if (isRule(line)) {
      inside = !inside
      continue
    }
    if (!inside) kept.push(line)
  }
  const cleaned = inside ? lines.filter((line) => !isRule(line)) : kept
  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim()
}

/** MIME type from the file extension (folders: inode/directory; unknown: application/octet-stream). */
export function getMimeType(fileName: string, isFolder = false): string {
  if (isFolder) return FOLDER_MIME
  const dot = fileName.lastIndexOf(".")
  return (dot === -1 ? undefined : MIME_BY_EXT[fileName.slice(dot).toLowerCase()]) ?? "application/octet-stream"
}

/** 0.03 -> "1/33 s"; 2 -> "2 s". */
export function formatExposure(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return PLACEHOLDER
  return seconds >= 1 ? `${Number(seconds.toFixed(1))} s` : `1/${Math.round(1 / seconds)} s`
}

export function formatAperture(fNumber: number | null | undefined): string {
  return fNumber ? `f/${Number(fNumber.toFixed(1))}` : PLACEHOLDER
}

export function formatCoordinates(lat: number | null | undefined, lon: number | null | undefined): string {
  if (lat === null || lat === undefined || lon === null || lon === undefined) return PLACEHOLDER
  return `${Math.abs(lat).toFixed(5)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(5)}° ${lon >= 0 ? "E" : "W"}`
}

const NBSP = "\u00a0"

/** Byte size padded to a fixed width ("  113.3 MB") so sizes right-align in a mono column. */
export function formatBytesFixed(bytes: number | null | undefined, width = 9): string {
  return formatBytes(bytes).padStart(width, NBSP)
}

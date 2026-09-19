import type { LucideIcon } from "lucide-react"
import { FILE_ICON_FALLBACK, FILE_ICONS_BY_EXT, DEFAULT_CURRENCY, DEFAULT_LOCALE, INLINE_MIME_TYPES, PAGINATION, TABLE_PARAMS, UNITS } from "@/lib/constant"

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

export function formatDuration(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || Number.isNaN(totalSeconds)) {
    return PLACEHOLDER
  }
  const seconds = Math.floor(totalSeconds % 60)
  const minutes = Math.floor((totalSeconds / 60) % 60)
  const hours = Math.floor(totalSeconds / 3600)
  const pad = (n: number) => n.toString().padStart(2, "0")
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

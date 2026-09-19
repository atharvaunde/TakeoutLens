import type { TableParams } from "@/lib/helper"
import type { IndexErrorRow } from "@/columns/index-errors.column"

// STUB until the SQLite index exists (M1). Deterministic sample rows so the
// shared DataTable can be exercised end to end with server-side paging/sorting/search/filter.
const MODULE_NAMES = ["mail", "chat", "calendar", "drive"] as const
const SAMPLE: IndexErrorRow[] = Array.from({ length: 230 }, (_, i) => ({
  id: String(i),
  module: MODULE_NAMES[i % MODULE_NAMES.length],
  path: `${MODULE_NAMES[i % MODULE_NAMES.length]}/sample-file-${i}.dat`,
  reason: i % 2 ? "Invalid date" : "Malformed JSON",
  occurredAt: new Date(Date.UTC(2026, 8, 1, 0, 0, 0) + i * 3_600_000).toISOString(),
}))

export async function listIndexErrors(params: TableParams) {
  const needle = params.search.toLowerCase()
  let rows = SAMPLE.filter(
    (row) =>
      (!params.filters.module || row.module === params.filters.module) &&
      (!needle || `${row.path} ${row.reason}`.toLowerCase().includes(needle))
  )
  if (params.sort && params.sort in SAMPLE[0]) {
    const key = params.sort as keyof IndexErrorRow
    const direction = params.dir === "desc" ? -1 : 1
    rows = [...rows].sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * direction)
  }
  const start = (params.page - 1) * params.pageSize
  return { rows: rows.slice(start, start + params.pageSize), total: rows.length }
}

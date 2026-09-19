import type { IndexErrorRow } from "@/columns/index-errors.column"
import type { TableParams } from "@/lib/helper"
import { requireSession } from "@/server/auth/session"
import { getDb } from "@/server/db"

// Only whitelisted columns may be used for ORDER BY (never interpolate user input).
const SORTABLE: Record<string, string> = { module: "module", occurredAt: "occurred_at" }

interface Row {
  id: number
  module: string
  path: string
  reason: string
  occurred_at: number
}

export async function listIndexErrors(params: TableParams): Promise<{ rows: IndexErrorRow[]; total: number }> {
  await requireSession()
  const db = getDb()
  const where: string[] = []
  const args: (string | number)[] = []
  if (params.filters.module) {
    where.push("module = ?")
    args.push(params.filters.module)
  }
  if (params.search) {
    where.push("(path LIKE ? ESCAPE '\\' OR reason LIKE ? ESCAPE '\\')")
    const like = `%${params.search.replace(/[\\%_]/g, "\\$&")}%`
    args.push(like, like)
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : ""
  const order = params.sort && SORTABLE[params.sort] ? `ORDER BY ${SORTABLE[params.sort]} ${params.dir === "desc" ? "DESC" : "ASC"}` : "ORDER BY id"
  const total = db.prepare(`SELECT count(*) FROM index_errors ${clause}`).pluck().get(...args) as number
  const rows = db
    .prepare(`SELECT id, module, path, reason, occurred_at FROM index_errors ${clause} ${order} LIMIT ? OFFSET ?`)
    .all(...args, params.pageSize, (params.page - 1) * params.pageSize) as Row[]
  return {
    total,
    rows: rows.map((r) => ({
      id: String(r.id),
      module: r.module,
      path: r.path,
      reason: r.reason,
      occurredAt: new Date(r.occurred_at).toISOString(),
    })),
  }
}

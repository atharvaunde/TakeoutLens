import { MODULES, type ModuleState } from "@/lib/constant"
import type { IndexRunSummary, ModuleStatus } from "@/lib/types"
import { requireSession } from "@/server/auth/session"
import { getConfig } from "@/server/config"
import { getDb } from "@/server/db"
import { isIndexerRunning } from "@/server/indexer/lock"

export interface OverviewData {
  modules: ModuleStatus[]
  indexerRunning: boolean
  lastRun: IndexRunSummary | null
}

interface Row {
  id: string
  state: ModuleState
  file_count: number
  total_bytes: number
  detail: string | null
}

interface RunRow {
  started_at: number
  finished_at: number
  total_files: number
  added: number
  updated: number
  removed: number
  errors: number
}

export function getLastRun(): IndexRunSummary | null {
  const r = getDb().prepare("SELECT * FROM index_runs ORDER BY id DESC LIMIT 1").get() as RunRow | undefined
  return r
    ? {
        finishedAt: r.finished_at,
        durationMs: r.finished_at - r.started_at,
        totalFiles: r.total_files,
        added: r.added,
        updated: r.updated,
        removed: r.removed,
        errors: r.errors,
      }
    : null
}

export async function getOverview(): Promise<OverviewData> {
  await requireSession()
  const rows = new Map((getDb().prepare("SELECT id, state, file_count, total_bytes, detail FROM modules").all() as Row[]).map((r) => [r.id, r]))
  return {
    indexerRunning: isIndexerRunning(getConfig().dataDir),
    lastRun: getLastRun(),
    modules: MODULES.map((module) => {
      const row = rows.get(module.id)
      return {
        module,
        state: row?.state ?? "pending",
        fileCount: row?.file_count ?? 0,
        totalBytes: row?.total_bytes ?? 0,
        detail: row?.detail ?? null,
      }
    }),
  }
}

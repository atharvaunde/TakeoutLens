import { MODULES, type ModuleState } from "@/lib/constant"
import type { ModuleStatus } from "@/lib/types"
import { requireSession } from "@/server/auth/session"
import { getConfig } from "@/server/config"
import { getDb } from "@/server/db"
import { isIndexerRunning } from "@/server/indexer/lock"

export interface OverviewData {
  modules: ModuleStatus[]
  indexerRunning: boolean
}

interface Row {
  id: string
  state: ModuleState
  file_count: number
  total_bytes: number
  detail: string | null
}

export async function getOverview(): Promise<OverviewData> {
  await requireSession()
  const rows = new Map((getDb().prepare("SELECT id, state, file_count, total_bytes, detail FROM modules").all() as Row[]).map((r) => [r.id, r]))
  return {
    indexerRunning: isIndexerRunning(getConfig().dataDir),
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

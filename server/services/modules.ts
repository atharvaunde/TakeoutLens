import { MODULES, type ModuleState } from "@/lib/constant"
import { pluralize } from "@/lib/helper"
import type { HomeData, IndexRunSummary, ModuleStatus } from "@/lib/types"
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

const STACK_TOP = 4

const count = (sql: string, ...args: (string | number)[]) => getDb().prepare(sql).pluck().get(...args) as number

/** Numbers for the overview page: sizes, archive span, per-source one-liners. */
export async function getHomeData(): Promise<HomeData> {
  await requireSession()
  const { modules } = await getOverview()
  const db = getDb()
  const totalBytes = modules.reduce((sum, m) => sum + m.totalBytes, 0)
  const totalFiles = modules.reduce((sum, m) => sum + m.fileCount, 0)

  const years: number[] = []
  const year = (ts: number | null) => (ts && ts > 0 ? new Date(ts).getUTCFullYear() : null)
  for (const [sql, ...args] of [
    ["SELECT min(date_ts), max(date_ts) FROM mail_messages WHERE source = 'mail' AND date_ts > 0"],
    ["SELECT min(first_at), max(last_at) FROM chat_conversations"],
    ["SELECT min(start_ts), max(start_ts) FROM cal_events"],
    ["SELECT min(taken_ts), max(taken_ts) FROM photo_items"],
  ] as [string, ...(string | number)[]][]) {
    const row = db.prepare(sql).raw().get(...args) as [number | null, number | null] | undefined
    for (const ts of row ?? []) {
      const y = year(ts)
      if (y && y > 1995 && y <= new Date().getUTCFullYear() + 1) years.push(y)
    }
  }

  const bytes = modules.map((m) => ({ name: m.module.label, bytes: m.totalBytes })).sort((a, b) => b.bytes - a.bytes)
  const top = bytes.slice(0, STACK_TOP)
  const rest = bytes.slice(STACK_TOP).reduce((sum, m) => sum + m.bytes, 0)
  const stack = [...top, { name: "Everything else", bytes: rest }].map((s) => ({ ...s, percent: totalBytes ? Math.max((s.bytes / totalBytes) * 100, s.bytes > 0 ? 0.5 : 0) : 0 }))

  const contacts = await import("./contacts").then((m) => m.listContacts({ page: 1, pageSize: 1, sort: null, dir: "asc", search: "", filters: {} }))
  const tasks = await import("./tasks").then((m) => m.listTasks({ page: 1, pageSize: 1, sort: null, dir: "asc", search: "", filters: {} }))
  const groups = await import("./groups").then((m) => m.listGroups())
  const videos = await import("./youtube").then((m) => m.getYoutubeOverview())
  const metas: Record<string, string> = {
    mail: pluralize(count("SELECT count(*) FROM mail_messages WHERE source = 'mail'"), "message"),
    chat: `${pluralize(count("SELECT count(*) FROM chat_conversations"), "conversation")}`,
    calendar: `${pluralize(count("SELECT count(*) FROM cal_calendars"), "calendar")} · ${pluralize(count("SELECT count(*) FROM cal_events"), "event")}`,
    drive: pluralize(modules.find((m) => m.module.id === "drive")?.fileCount ?? 0, "file"),
    photos: pluralize(count("SELECT count(*) FROM photo_items"), "item"),
    contacts: pluralize(contacts.total, "person", "people"),
    keep: pluralize(count("SELECT count(*) FROM files WHERE module = 'keep' AND rel_path LIKE '%.json'"), "note"),
    tasks: pluralize(tasks.total, "task"),
    groups: `${pluralize(groups.length, "group")} · ${pluralize(groups.reduce((sum, g) => sum + g.discussionCount, 0), "thread")}`,
    youtube: `${pluralize(videos.videoCount, "video")} · ${pluralize(videos.playlistCount, "playlist")}`,
    browse: pluralize(modules.find((m) => m.module.id === "browse")?.fileCount ?? 0, "file"),
  }

  return {
    totalBytes,
    totalFiles,
    firstYear: years.length ? Math.min(...years) : null,
    lastYear: years.length ? Math.max(...years) : null,
    stack,
    metas,
    parsed: modules.filter((m) => m.state === "ready").length,
    errors: count("SELECT count(*) FROM index_errors"),
  }
}

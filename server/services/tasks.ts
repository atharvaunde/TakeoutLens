import type { TaskRow } from "@/columns/tasks.column"
import type { TableParams } from "@/lib/helper"
import { requireSession } from "@/server/auth/session"
import { readTakeoutJson } from "@/server/files/read"

interface RawTask {
  id: string
  title?: string
  status?: string
  due?: string
  completed?: string
  updated?: string
  notes?: string
  parent?: string
}
interface RawList {
  id: string
  title?: string
  items?: RawTask[]
}

function load(): { lists: { id: string; title: string }[]; tasks: TaskRow[] } {
  const data = readTakeoutJson<{ items?: RawList[] }>("Tasks/Tasks.json")
  const lists = (data?.items ?? []).map((l) => ({ id: l.id, title: l.title ?? "Tasks" }))
  const tasks = (data?.items ?? []).flatMap((list) =>
    (list.items ?? []).map((t) => ({
      id: t.id,
      list: list.title ?? "Tasks",
      title: t.title ?? "",
      status: t.status ?? "needsAction",
      due: t.due ?? null,
      completed: t.completed ?? null,
      updated: t.updated ?? null,
      notes: t.notes ?? "",
    }))
  )
  return { lists, tasks }
}

export async function getTaskListOptions(): Promise<{ value: string; label: string }[]> {
  await requireSession()
  return load().lists.map((l) => ({ value: l.title, label: l.title }))
}

export async function listTasks(params: TableParams): Promise<{ rows: TaskRow[]; total: number }> {
  await requireSession()
  const needle = params.search.toLowerCase()
  let rows = load().tasks.filter(
    (t) => (!params.filters.list || t.list === params.filters.list) && (!params.filters.status || t.status === params.filters.status) && (!needle || `${t.title} ${t.notes}`.toLowerCase().includes(needle))
  )
  const direction = params.dir === "desc" ? -1 : 1
  const sortKey = (t: TaskRow): string => (params.sort === "due" ? (t.due ?? "") : params.sort === "status" ? t.status : params.sort === "title" ? t.title.toLowerCase() : (t.updated ?? ""))
  rows = [...rows].sort((a, b) => (sortKey(a) > sortKey(b) ? 1 : sortKey(a) < sortKey(b) ? -1 : 0) * (params.sort ? direction : -1))
  const start = (params.page - 1) * params.pageSize
  return { rows: rows.slice(start, start + params.pageSize), total: rows.length }
}

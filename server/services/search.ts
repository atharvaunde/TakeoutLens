import { formatDate } from "@/lib/helper"
import type { GlobalSearchResult } from "@/lib/types"
import type { TableParams } from "@/lib/helper"
import { SHELL } from "@/lib/constant"
import { requireSession } from "@/server/auth/session"
import { searchEvents } from "./calendar"
import { searchMessages } from "./chat"
import { listContacts } from "./contacts"
import { listDrive } from "./drive"
import { listKeepNotes } from "./keep"
import { listMailMessages } from "./mail"
import { listTasks } from "./tasks"

const PER_SOURCE = 4

const params = (search: string): TableParams => ({ page: 1, pageSize: PER_SOURCE, sort: null, dir: "asc", search, filters: {} })

/** One quick search across the main sources for the ⌘K palette. Each source is best-effort. */
export async function searchEverything(query: string): Promise<GlobalSearchResult[]> {
  await requireSession()
  const q = query.trim()
  if (q.length < SHELL.searchMinLength) return []
  const safe = async <T,>(work: () => Promise<T[]>): Promise<T[]> => {
    try {
      return await work()
    } catch {
      return []
    }
  }

  const [mail, chat, events, drive, contacts, notes, tasks] = await Promise.all([
    safe(async () => (await listMailMessages({ ...params(q), dir: "desc" }, null)).rows),
    safe(() => searchMessages(q)),
    safe(() => searchEvents(q)),
    safe(async () => (await listDrive(undefined, params(q))).rows),
    safe(async () => (await listContacts(params(q))).rows),
    safe(() => listKeepNotes("notes", q)),
    safe(async () => (await listTasks(params(q))).rows),
  ])

  const out: GlobalSearchResult[] = []
  for (const m of mail.slice(0, PER_SOURCE)) {
    out.push({ id: `mail-${m.messageId}`, label: m.subject || "(no subject)", meta: `mail · ${formatDate(m.date)}`, href: `/mail?m=${m.messageId}`, moduleId: "mail" })
  }
  for (const c of chat.slice(0, PER_SOURCE)) {
    out.push({ id: `chat-${c.messageId}`, label: c.convTitle, meta: `chat · ${formatDate(c.ts)}`, href: `/chat?c=${c.convId}&at=${c.seq}`, moduleId: "chat" })
  }
  for (const e of events.slice(0, PER_SOURCE)) {
    const day = new Date(e.startWall).toISOString().slice(0, 10)
    out.push({ id: `cal-${e.key}`, label: e.title || "(no title)", meta: `calendar · ${formatDate(e.startWall, { timeZone: "UTC" })}`, href: `/calendar?date=${day}&view=day`, moduleId: "calendar" })
  }
  for (const f of drive.slice(0, PER_SOURCE)) {
    out.push({ id: `drive-${f.id}`, label: f.name, meta: `drive · ${f.location || "Drive"}`, href: `/drive?q=${encodeURIComponent(f.name)}`, moduleId: "drive" })
  }
  for (const c of contacts.slice(0, PER_SOURCE)) {
    out.push({ id: `contact-${c.id}`, label: c.name, meta: `contacts · ${c.email || c.phone || ""}`.trim(), href: `/contacts?q=${encodeURIComponent(c.name)}`, moduleId: "contacts" })
  }
  for (const n of notes.slice(0, PER_SOURCE)) {
    out.push({ id: `keep-${n.id}`, label: n.title || n.text.slice(0, 60) || "Note", meta: "keep", href: `/keep?q=${encodeURIComponent(n.title || n.text.slice(0, 30))}`, moduleId: "keep" })
  }
  for (const t of tasks.slice(0, PER_SOURCE)) {
    out.push({ id: `task-${t.id}`, label: t.title, meta: `tasks · ${t.status === "completed" ? "completed" : "to do"}`, href: `/tasks?q=${encodeURIComponent(t.title)}`, moduleId: "tasks" })
  }
  return out
}

import path from "node:path"

import type { KeepView } from "@/lib/constant"
import type { KeepNote } from "@/lib/types"
import { requireSession } from "@/server/auth/session"
import { getDb } from "@/server/db"
import { readTakeoutJson } from "@/server/files/read"

interface RawNote {
  title?: string
  textContent?: string
  listContent?: { text?: string; isChecked?: boolean }[]
  color?: string
  isPinned?: boolean
  isArchived?: boolean
  isTrashed?: boolean
  labels?: { name?: string }[]
  userEditedTimestampUsec?: number
  attachments?: { filePath?: string }[]
}

export async function listKeepNotes(view: KeepView, search: string): Promise<KeepNote[]> {
  await requireSession()
  const db = getDb()
  const files = db.prepare("SELECT id, rel_path FROM files WHERE module = 'keep'").all() as { id: number; rel_path: string }[]
  const byPath = new Map(files.map((f) => [f.rel_path, f.id]))
  const needle = search.toLowerCase()

  const notes: KeepNote[] = []
  for (const file of files.filter((f) => f.rel_path.endsWith(".json"))) {
    const raw = readTakeoutJson<RawNote>(file.rel_path, 2_000_000)
    if (!raw) continue
    const items = (raw.listContent ?? []).map((i) => ({ text: i.text ?? "", checked: Boolean(i.isChecked) }))
    const note: KeepNote = {
      id: String(file.id),
      title: raw.title ?? "",
      text: raw.textContent ?? "",
      items,
      color: raw.color ?? "DEFAULT",
      pinned: Boolean(raw.isPinned),
      archived: Boolean(raw.isArchived),
      trashed: Boolean(raw.isTrashed),
      labels: (raw.labels ?? []).map((l) => l.name ?? "").filter(Boolean),
      editedAt: raw.userEditedTimestampUsec ? Math.floor(raw.userEditedTimestampUsec / 1000) : null,
      attachmentIds: (raw.attachments ?? []).map((a) => byPath.get(path.posix.join(path.posix.dirname(file.rel_path), a.filePath ?? ""))).filter((id): id is number => id !== undefined),
    }
    const inView = view === "trash" ? note.trashed : view === "archived" ? note.archived && !note.trashed : !note.archived && !note.trashed
    const matches = !needle || `${note.title} ${note.text} ${note.items.map((i) => i.text).join(" ")} ${note.labels.join(" ")}`.toLowerCase().includes(needle)
    if (inView && matches) notes.push(note)
  }
  return notes.sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.editedAt ?? 0) - (a.editedAt ?? 0))
}

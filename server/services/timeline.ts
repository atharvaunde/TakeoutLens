import path from "node:path"

import { TIMELINE, type TimelineSource } from "@/lib/constant"
import { formatBytes } from "@/lib/helper"
import type { TimelineItem } from "@/lib/types"
import { requireSession } from "@/server/auth/session"
import { getDb } from "@/server/db"
import { getOwnerEmail } from "@/server/owner"

const NOW = () => Date.now()

/** The newest items across sources, merged by date. `before` (epoch ms) pages backwards. */
export async function getTimeline(source: TimelineSource, before?: number): Promise<{ items: TimelineItem[]; next: number | null }> {
  await requireSession()
  const db = getDb()
  const limit = before ?? NOW() + 86_400_000
  const want = (id: string) => source === "all" || source === id
  const per = TIMELINE.perSource
  const items: TimelineItem[] = []

  if (want("mail")) {
    for (const r of db
      .prepare("SELECT id, subject, from_name, from_email, date_ts FROM mail_messages WHERE source = 'mail' AND date_ts > 0 AND date_ts < ? ORDER BY date_ts DESC LIMIT ?")
      .all(limit, per) as { id: number; subject: string; from_name: string; from_email: string; date_ts: number }[]) {
      items.push({ id: `mail-${r.id}`, ts: r.date_ts, moduleId: "mail", title: r.subject || "(no subject)", sub: r.from_name || r.from_email, href: `/mail?m=${r.id}` })
    }
  }

  if (want("chat")) {
    const seen = new Set<string>()
    for (const r of db
      .prepare(
        `SELECT m.id, m.conv_id, m.seq, m.ts, m.text, m.creator_name, c.title FROM chat_messages m JOIN chat_conversations c ON c.id = m.conv_id
         WHERE m.ts < ? AND m.text != '' ORDER BY m.ts DESC LIMIT ?`
      )
      .all(limit, per * 6) as { id: number; conv_id: number; seq: number; ts: number; text: string; creator_name: string; title: string }[]) {
      const key = `${r.conv_id}:${new Date(r.ts).toISOString().slice(0, 10)}`
      if (seen.has(key)) continue
      seen.add(key)
      items.push({ id: `chat-${r.id}`, ts: r.ts, moduleId: "chat", title: `${r.title} — “${r.text.slice(0, 80)}”`, sub: `${r.creator_name} · direct or space message`, href: `/chat?c=${r.conv_id}&at=${r.seq}` })
      if (seen.size >= per) break
    }
  }

  if (want("calendar")) {
    const owner = getOwnerEmail()?.toLowerCase()
    const own = owner ? (db.prepare("SELECT id FROM cal_calendars WHERE lower(name) = ?").pluck().get(owner) as number | undefined) : undefined
    for (const r of db
      .prepare(`SELECT id, summary, start_ts, location FROM cal_events WHERE rrule IS NULL AND start_ts < ? ${own ? "AND cal_id = ?" : ""} ORDER BY start_ts DESC LIMIT ?`)
      .all(limit, ...(own ? [own] : []), per) as { id: number; summary: string; start_ts: number; location: string }[]) {
      items.push({ id: `cal-${r.id}`, ts: r.start_ts, moduleId: "calendar", title: r.summary || "(no title)", sub: r.location || "Calendar event", href: `/calendar?date=${new Date(r.start_ts).toISOString().slice(0, 10)}&view=day` })
    }
  }

  if (want("drive")) {
    for (const r of db
      .prepare("SELECT id, rel_path, size, mtime_ms FROM files WHERE module = 'drive' AND mtime_ms < ? ORDER BY mtime_ms DESC LIMIT ?")
      .all(limit, per) as { id: number; rel_path: string; size: number; mtime_ms: number }[]) {
      const folder = path.posix.dirname(r.rel_path).replace(/^Drive\/?/, "")
      items.push({ id: `drive-${r.id}`, ts: r.mtime_ms, moduleId: "drive", title: `${path.posix.basename(r.rel_path)}${folder ? ` in ${folder}` : ""}`, sub: formatBytes(r.size), href: `/drive?path=${encodeURIComponent(folder)}` })
    }
  }

  if (want("photos")) {
    for (const r of db
      .prepare("SELECT file_id, title, album, taken_ts FROM photo_items WHERE taken_ts < ? ORDER BY taken_ts DESC LIMIT ?")
      .all(limit, per) as { file_id: number; title: string; album: string; taken_ts: number }[]) {
      items.push({ id: `photo-${r.file_id}`, ts: r.taken_ts, moduleId: "photos", title: r.title, sub: `Photos · ${r.album}`, href: "/photos" })
    }
  }

  items.sort((a, b) => b.ts - a.ts)
  const page = items.slice(0, TIMELINE.pageSize)
  return { items: page, next: items.length > TIMELINE.pageSize ? page[page.length - 1].ts : null }
}

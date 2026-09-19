import fs from "node:fs"
import path from "node:path"

import type { Db } from "@/server/db"
import { readIcs } from "./ics"

const DIR = "Calendar"

/** Import every .ics (one calendar each). Unchanged files (size + mtime) are skipped. */
export async function indexCalendar(db: Db, root: string) {
  const dir = path.join(root, DIR)
  if (!fs.existsSync(dir)) return
  const known = new Map(
    (db.prepare("SELECT id, file_rel, source_size, source_mtime FROM cal_calendars").all() as { id: number; file_rel: string; source_size: number; source_mtime: number }[]).map((r) => [r.file_rel, r])
  )
  const seen = new Set<string>()
  const insertEvent = db.prepare(
    `INSERT INTO cal_events (cal_id, uid, summary, start_ts, end_ts, all_day, rrule, exdates, recurrence_ts, location, description, organizer, attendees, status, meet_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertFts = db.prepare("INSERT INTO cal_fts (rowid, summary, description, location) VALUES (?, ?, ?, ?)")
  const logError = db.prepare("INSERT INTO index_errors (module, path, reason, occurred_at) VALUES ('calendar', ?, ?, ?)")

  const remove = (id: number) => {
    db.prepare("DELETE FROM cal_fts WHERE rowid IN (SELECT id FROM cal_events WHERE cal_id = ?)").run(id)
    db.prepare("DELETE FROM cal_events WHERE cal_id = ?").run(id)
    db.prepare("DELETE FROM cal_calendars WHERE id = ?").run(id)
  }

  for (const name of fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".ics"))) {
    const rel = `${DIR}/${name}`
    seen.add(rel)
    const stat = fs.statSync(path.join(dir, name))
    const mtime = Math.floor(stat.mtimeMs)
    const previous = known.get(rel)
    if (previous && previous.source_size === stat.size && previous.source_mtime === mtime) continue

    db.exec("BEGIN")
    try {
      if (previous) remove(previous.id)
      const calId = Number(
        db.prepare("INSERT INTO cal_calendars (file_rel, name, source_size, source_mtime) VALUES (?, ?, ?, ?)").run(rel, path.basename(name, ".ics"), stat.size, mtime).lastInsertRowid
      )
      let count = 0
      const info = await readIcs(path.join(dir, name), (e) => {
        const id = Number(
          insertEvent.run(
            calId, e.uid, e.summary, e.startTs, e.endTs, e.allDay ? 1 : 0, e.rrule, e.exdates.length ? JSON.stringify(e.exdates) : null,
            e.recurrenceTs, e.location, e.description, e.organizer, e.attendees.length ? JSON.stringify(e.attendees) : null, e.status, e.meetUrl
          ).lastInsertRowid
        )
        insertFts.run(id, e.summary, e.description, e.location)
        count++
      })
      db.prepare("UPDATE cal_calendars SET name = ?, timezone = ?, event_count = ? WHERE id = ?").run(info.name || path.basename(name, ".ics"), info.timezone, count, calId)
      db.exec("COMMIT")
    } catch (error) {
      db.exec("ROLLBACK")
      logError.run(rel, `Cannot import calendar: ${(error as Error).message}`, Date.now())
    }
  }
  for (const [rel, row] of known) if (!seen.has(rel)) db.transaction(() => remove(row.id))()
}

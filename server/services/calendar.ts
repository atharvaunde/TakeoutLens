import { RRule } from "rrule"

import { CALENDAR } from "@/lib/constant"
import { htmlToText, toFtsQuery, utcToWall, zonedTimeToUtc } from "@/lib/helper"
import type { CalendarEventDetail, CalendarEventItem, CalendarInfo } from "@/lib/types"
import { requireSession } from "@/server/auth/session"
import { getDb } from "@/server/db"
import { getOwnerEmail } from "@/server/owner"

interface EventRow {
  id: number
  cal_id: number
  uid: string
  summary: string
  start_ts: number
  end_ts: number
  all_day: number
  rrule: string | null
  exdates: string | null
  recurrence_ts: number | null
  location: string
}

const COLUMNS = "id, cal_id, uid, summary, start_ts, end_ts, all_day, rrule, exdates, recurrence_ts, location"

/** Display timezone: the zone of the calendar with the most events (the account owner's). */
export function getDisplayTimeZone(): string {
  const row = getDb().prepare("SELECT timezone FROM cal_calendars WHERE timezone IS NOT NULL ORDER BY event_count DESC LIMIT 1").pluck().get() as string | undefined
  return row ?? CALENDAR.fallbackTimeZone
}

const wall = (ts: number, allDay: boolean, tz: string) => (allDay ? ts : utcToWall(ts, tz))

function toItem(row: EventRow, tz: string, startTs = row.start_ts, occurrence = false): CalendarEventItem {
  const duration = row.end_ts - row.start_ts
  return {
    key: occurrence ? `${row.id}:${startTs}` : String(row.id),
    eventId: row.id,
    calId: row.cal_id,
    title: row.summary,
    startWall: wall(startTs, row.all_day === 1, tz),
    endWall: wall(startTs + duration, row.all_day === 1, tz),
    allDay: row.all_day === 1,
    recurring: row.rrule !== null,
    location: row.location,
  }
}

/** Expand one recurring event into occurrences overlapping [fromTs, toTs). */
export function expandOccurrences(row: EventRow, overrides: Set<number>, fromTs: number, toTs: number): number[] {
  if (!row.rrule) return []
  const duration = row.end_ts - row.start_ts
  const exdates = new Set<number>(row.exdates ? (JSON.parse(row.exdates) as number[]) : [])
  try {
    const rule = new RRule({ ...RRule.parseString(row.rrule), dtstart: new Date(row.start_ts) })
    return rule
      .between(new Date(fromTs - duration), new Date(toTs), true)
      .map((d) => d.getTime())
      .filter((ts) => ts + duration > fromTs && ts < toTs && !exdates.has(ts) && !overrides.has(ts))
  } catch {
    return [] // unsupported or malformed rule
  }
}

export async function listCalendars(): Promise<CalendarInfo[]> {
  await requireSession()
  const owner = getOwnerEmail()?.toLowerCase()
  const rows = (getDb().prepare("SELECT id, name, event_count FROM cal_calendars ORDER BY event_count DESC").all() as { id: number; name: string; event_count: number }[])
  // Show only the owner's own calendar by default when it can be identified; others are one click away.
  const hasOwn = owner ? rows.some((c) => c.name.toLowerCase() === owner) : false
  return rows.map((c, index) => ({
    id: c.id,
    name: c.name,
    eventCount: c.event_count,
    color: CALENDAR.colors[index % CALENDAR.colors.length],
    defaultVisible: hasOwn ? c.name.toLowerCase() === owner : true,
  }))
}

/** Latest event that has already happened (falls back to the newest event): a sensible landing date. */
export async function getDefaultCalendarDate(): Promise<string> {
  await requireSession()
  const db = getDb()
  const ts =
    (db.prepare("SELECT max(start_ts) FROM cal_events WHERE start_ts <= ?").pluck().get(Date.now()) as number | null) ??
    (db.prepare("SELECT max(start_ts) FROM cal_events").pluck().get() as number | null) ??
    Date.now()
  return new Date(utcToWall(ts, getDisplayTimeZone())).toISOString().slice(0, 10)
}

/** Events overlapping the wall-clock range [fromWall, toWall), recurrences expanded. */
export async function getEventsInRange(fromWall: number, toWall: number): Promise<{ events: CalendarEventItem[]; timeZone: string; truncated: boolean }> {
  await requireSession()
  const db = getDb()
  const tz = getDisplayTimeZone()
  const fromTs = zonedTimeToUtc(fromWall, tz)
  const toTs = zonedTimeToUtc(toWall, tz)

  // All-day events are stored as UTC-midnight dates, so widen the window by a day and let the wall-clock filter below decide.
  const pad = CALENDAR.msPerDay
  const single = db
    .prepare(`SELECT ${COLUMNS} FROM cal_events WHERE rrule IS NULL AND start_ts < ? AND end_ts > ?`)
    .all(toTs + pad, fromTs - pad) as EventRow[]
  const items = single.map((r) => toItem(r, tz)).filter((e) => e.startWall < toWall && (e.endWall > fromWall || e.startWall >= fromWall))

  const recurring = db.prepare(`SELECT ${COLUMNS} FROM cal_events WHERE rrule IS NOT NULL AND start_ts < ?`).all(toTs + pad) as EventRow[]
  if (recurring.length) {
    const overrideRows = db.prepare("SELECT uid, recurrence_ts FROM cal_events WHERE recurrence_ts IS NOT NULL").all() as { uid: string; recurrence_ts: number }[]
    const overrides = new Map<string, Set<number>>()
    for (const o of overrideRows) (overrides.get(o.uid) ?? overrides.set(o.uid, new Set()).get(o.uid)!).add(o.recurrence_ts)
    for (const row of recurring) {
      for (const start of expandOccurrences(row, overrides.get(row.uid) ?? new Set(), fromTs - pad, toTs + pad)) {
        const item = toItem(row, tz, start, true)
        if (item.startWall < toWall && item.endWall > fromWall) items.push(item)
      }
    }
  }
  items.sort((a, b) => a.startWall - b.startWall || a.title.localeCompare(b.title))
  const truncated = items.length > CALENDAR.maxEventsPerRange
  return { events: truncated ? items.slice(0, CALENDAR.maxEventsPerRange) : items, timeZone: tz, truncated }
}

export async function searchEvents(query: string): Promise<CalendarEventItem[]> {
  await requireSession()
  const match = toFtsQuery(query)
  if (!match) return []
  const tz = getDisplayTimeZone()
  const rows = getDb()
    .prepare(
      `SELECT ${COLUMNS.split(", ").map((c) => `e.${c}`).join(", ")} FROM cal_fts JOIN cal_events e ON e.id = cal_fts.rowid
       WHERE cal_fts MATCH ? ORDER BY e.start_ts DESC LIMIT ?`
    )
    .all(match, CALENDAR.searchLimit) as EventRow[]
  return rows.map((r) => toItem(r, tz))
}

export async function getEventDetail(id: number, occurrenceStartWall?: number): Promise<CalendarEventDetail | null> {
  await requireSession()
  const row = getDb()
    .prepare("SELECT e.*, c.name AS calendar_name FROM cal_events e JOIN cal_calendars c ON c.id = e.cal_id WHERE e.id = ?")
    .get(id) as (EventRow & { description: string; organizer: string; attendees: string | null; status: string; meet_url: string | null; calendar_name: string }) | undefined
  if (!row) return null
  const tz = getDisplayTimeZone()
  const base = toItem(row, tz)
  const shift = occurrenceStartWall !== undefined && row.rrule ? occurrenceStartWall - base.startWall : 0
  return {
    ...base,
    startWall: base.startWall + shift,
    endWall: base.endWall + shift,
    calendarName: row.calendar_name,
    description: htmlToText(row.description),
    organizer: row.organizer,
    attendees: row.attendees ? (JSON.parse(row.attendees) as CalendarEventDetail["attendees"]) : [],
    meetUrl: row.meet_url,
    status: row.status,
    rrule: row.rrule,
  }
}

/** Start of "today" as wall-clock ms in the display time zone. */
export async function getTodayWall(): Promise<number> {
  await requireSession()
  return Math.floor(utcToWall(Date.now(), getDisplayTimeZone()) / CALENDAR.msPerDay) * CALENDAR.msPerDay
}

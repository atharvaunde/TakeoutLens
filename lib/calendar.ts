import { CALENDAR, type CalendarView } from "@/lib/constant"
import { formatDate } from "@/lib/helper"
import type { CalendarEventItem } from "@/lib/types"

// Date math on "wall clock" milliseconds: values whose UTC fields are the display-timezone time.
// Nothing here depends on the runtime's local time zone, so server and client agree.

const DAY = CALENDAR.msPerDay

export const startOfDay = (ms: number) => Math.floor(ms / DAY) * DAY
export const addDays = (ms: number, days: number) => ms + days * DAY
export const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export function parseDateParam(value: string | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const ms = Date.parse(`${value}T00:00:00Z`)
  return Number.isNaN(ms) ? null : ms
}

export function startOfWeek(ms: number, weekStartsOn: number = CALENDAR.weekStartsOn): number {
  const day = new Date(ms).getUTCDay()
  return startOfDay(ms) - ((day - weekStartsOn + 7) % 7) * DAY
}

export function monthGridStart(ms: number): number {
  const d = new Date(ms)
  return startOfWeek(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

export function isSameMonth(a: number, b: number): boolean {
  const x = new Date(a)
  const y = new Date(b)
  return x.getUTCFullYear() === y.getUTCFullYear() && x.getUTCMonth() === y.getUTCMonth()
}

export function shiftDate(view: CalendarView, ms: number, direction: -1 | 1): number {
  const d = new Date(ms)
  if (view === "month") return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + direction, 1)
  if (view === "week") return addDays(ms, 7 * direction)
  if (view === "agenda") return addDays(ms, CALENDAR.agendaDays * direction)
  return addDays(ms, direction)
}

/** The wall-clock range [from, to) a view needs events for. */
export function rangeFor(view: CalendarView, ms: number): { from: number; to: number } {
  if (view === "month") {
    const from = monthGridStart(ms)
    return { from, to: addDays(from, 42) }
  }
  if (view === "week") {
    const from = startOfWeek(ms)
    return { from, to: addDays(from, 7) }
  }
  if (view === "agenda") return { from: startOfDay(ms), to: addDays(startOfDay(ms), CALENDAR.agendaDays) }
  return { from: startOfDay(ms), to: addDays(startOfDay(ms), 1) }
}

export function titleFor(view: CalendarView, ms: number): string {
  const utc = { timeZone: "UTC" } as const
  if (view === "month") return formatDate(ms, { month: "long", year: "numeric", day: undefined, ...utc })
  if (view === "week") {
    const from = startOfWeek(ms)
    return `${formatDate(from, { day: "numeric", month: "short", year: undefined, ...utc })} – ${formatDate(addDays(from, 6), { day: "numeric", month: "short", year: "numeric", ...utc })}`
  }
  if (view === "agenda") return `Next ${CALENDAR.agendaDays} days from ${formatDate(ms, utc)}`
  return formatDate(ms, { weekday: "long", month: "long", day: "numeric", year: "numeric", ...utc })
}

/** Does the event touch the given day? (all-day ends are exclusive) */
export function eventTouchesDay(event: CalendarEventItem, dayStart: number): boolean {
  const dayEnd = dayStart + DAY
  return event.startWall < dayEnd && (event.endWall > dayStart || event.startWall === dayStart)
}

export interface PositionedEvent {
  event: CalendarEventItem
  /** 0-based column among overlapping events, and how many columns that overlap group has. */
  column: number
  columns: number
  topMinutes: number
  heightMinutes: number
}

/** Lay out timed events of one day side by side when they overlap. */
export function layoutDay(events: CalendarEventItem[], dayStart: number): PositionedEvent[] {
  const dayEnd = dayStart + DAY
  const items = events
    .filter((e) => !e.allDay)
    .map((event) => {
      const start = Math.max(event.startWall, dayStart)
      const end = Math.min(Math.max(event.endWall, event.startWall + 15 * 60_000), dayEnd)
      return { event, start, end }
    })
    .sort((a, b) => a.start - b.start || b.end - a.end)

  const result: PositionedEvent[] = []
  let group: typeof items = []
  let groupEnd = 0
  const flush = () => {
    const columnEnds: number[] = []
    const placed = group.map((item) => {
      let column = columnEnds.findIndex((end) => end <= item.start)
      if (column === -1) column = columnEnds.length
      columnEnds[column] = item.end
      return { item, column }
    })
    for (const { item, column } of placed) {
      result.push({
        event: item.event,
        column,
        columns: columnEnds.length,
        topMinutes: (item.start - dayStart) / 60_000,
        heightMinutes: (item.end - item.start) / 60_000,
      })
    }
    group = []
  }
  for (const item of items) {
    if (group.length && item.start >= groupEnd) flush()
    group.push(item)
    groupEnd = Math.max(groupEnd, item.end)
  }
  if (group.length) flush()
  return result
}

/** Number of week rows a month grid needs (5 or 6). */
export function monthWeekCount(ms: number): number {
  const d = new Date(ms)
  const first = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
  const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  const offset = (new Date(first).getUTCDay() - CALENDAR.weekStartsOn + 7) % 7
  return Math.ceil((offset + daysInMonth) / 7)
}

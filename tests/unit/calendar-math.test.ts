import { describe, expect, it } from "vitest"

import { addDays, dayKey, layoutDay, monthGridStart, parseDateParam, rangeFor, shiftDate, startOfWeek } from "@/lib/calendar"
import type { CalendarEventItem } from "@/lib/types"

const d = (y: number, m: number, day: number, h = 0, min = 0) => Date.UTC(y, m - 1, day, h, min)
const ev = (id: number, start: number, end: number, allDay = false): CalendarEventItem => ({
  key: String(id), eventId: id, calId: 1, title: `e${id}`, startWall: start, endWall: end, allDay, recurring: false, location: "",
})

describe("calendar date math", () => {
  it("parses date params strictly", () => {
    expect(parseDateParam("2023-01-30")).toBe(d(2023, 1, 30))
    expect(parseDateParam("2023-13-40")).toBeNull()
    expect(parseDateParam("30/01/2023")).toBeNull()
    expect(parseDateParam(undefined)).toBeNull()
  })

  it("weeks start on Monday and month grids cover 6 weeks", () => {
    expect(dayKey(startOfWeek(d(2023, 1, 5)))).toBe("2023-01-02") // Thursday -> Monday
    expect(dayKey(startOfWeek(d(2023, 1, 1)))).toBe("2022-12-26") // Sunday -> previous Monday
    expect(dayKey(monthGridStart(d(2023, 1, 20)))).toBe("2022-12-26")
    const { from, to } = rangeFor("month", d(2023, 1, 20))
    expect((to - from) / 86_400_000).toBe(42)
  })

  it("shifts by view", () => {
    expect(dayKey(shiftDate("month", d(2023, 1, 31), 1))).toBe("2023-02-01")
    expect(dayKey(shiftDate("month", d(2023, 1, 15), -1))).toBe("2022-12-01")
    expect(dayKey(shiftDate("week", d(2023, 1, 15), 1))).toBe("2023-01-22")
    expect(dayKey(shiftDate("day", d(2023, 1, 1), -1))).toBe("2022-12-31")
    expect(dayKey(addDays(d(2023, 2, 28), 1))).toBe("2023-03-01")
  })

  it("lays out overlapping events in columns and separate groups independently", () => {
    const day = d(2023, 1, 2)
    const laid = layoutDay(
      [ev(1, d(2023, 1, 2, 9), d(2023, 1, 2, 10)), ev(2, d(2023, 1, 2, 9, 30), d(2023, 1, 2, 11)), ev(3, d(2023, 1, 2, 13), d(2023, 1, 2, 14)), ev(4, day, addDays(day, 1), true)],
      day
    )
    const by = Object.fromEntries(laid.map((p) => [p.event.eventId, p]))
    expect(laid).toHaveLength(3) // all-day event excluded
    expect(by[1]).toMatchObject({ column: 0, columns: 2, topMinutes: 540, heightMinutes: 60 })
    expect(by[2]).toMatchObject({ column: 1, columns: 2 })
    expect(by[3]).toMatchObject({ column: 0, columns: 1 })
  })
})

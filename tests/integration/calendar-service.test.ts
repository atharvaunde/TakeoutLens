import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { SESSION } from "@/lib/constant"
import { cleanup, createFixture } from "../fixture/generate"

const jar = new Map<string, string>()
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (n: string) => (jar.has(n) ? { name: n, value: jar.get(n) } : undefined) }) }))
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw new Error(`redirect:${to}`) } }))

let base: string
let dataDir: string
beforeAll(async () => {
  const fx = createFixture()
  base = fx.base
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cal-data-"))
  process.env.TAKEOUT_DIR = fx.root
  process.env.DATA_DIR = dataDir
  const { getDb } = await import("@/server/db")
  const { runIndexer } = await import("@/server/indexer/run")
  await runIndexer(getDb(), fx.root)
  const store = await import("@/server/auth/store")
  store.savePassword("cal-test-pw")
  jar.set(SESSION.cookieName, store.createSession().token)
})
afterAll(() => { cleanup(base); fs.rmSync(dataDir, { recursive: true, force: true }) })

const jan = (d: number, h = 0, m = 0) => Date.UTC(2023, 0, d, h, m) // wall-clock ms (Asia/Kolkata display zone)

describe("calendar service", () => {
  it("indexes the calendar with its name and time zone", async () => {
    const { listCalendars, getDisplayTimeZone } = await import("@/server/services/calendar")
    const calendars = await listCalendars()
    expect(calendars).toHaveLength(1)
    expect(calendars[0]).toMatchObject({ name: "Fixture Calendar", eventCount: 5 })
    expect(getDisplayTimeZone()).toBe("Asia/Kolkata")
  })

  it("returns events in wall-clock time, incl. zoned and all-day events", async () => {
    const { getEventsInRange } = await import("@/server/services/calendar")
    const { events } = await getEventsInRange(jan(1), jan(8))
    const by = Object.fromEntries(events.map((e) => [e.title, e]))
    expect(by["Planning, part one"].startWall).toBe(jan(2, 14, 30)) // 09:00Z -> 14:30 IST
    expect(by["Local time event"].startWall).toBe(jan(3, 10, 30))
    expect(by["Holiday"]).toMatchObject({ allDay: true, startWall: jan(5), endWall: jan(6) })
    expect(events.map((e) => e.title)).not.toContain("Weekly sync") // first occurrence is on the 9th
  })

  it("expands recurring events, honouring EXDATE and overridden occurrences", async () => {
    const { getEventsInRange } = await import("@/server/services/calendar")
    const { events } = await getEventsInRange(jan(8), jan(31))
    const weekly = events.filter((e) => e.title.startsWith("Weekly sync"))
    // 9th and 30th remain; 16th is EXDATE'd; 23rd was moved (RECURRENCE-ID) to 05:00Z
    expect(weekly.map((e) => [e.title, e.startWall])).toEqual([
      ["Weekly sync", jan(9, 9, 30)],
      ["Weekly sync (moved)", jan(23, 10, 30)],
      ["Weekly sync", jan(30, 9, 30)],
    ])
    expect(weekly[0].recurring).toBe(true)
  })

  it("searches events and loads details", async () => {
    const { searchEvents, getEventDetail } = await import("@/server/services/calendar")
    const hits = await searchEvents("planning")
    expect(hits.map((h) => h.title)).toEqual(["Planning, part one"])
    const detail = await getEventDetail(hits[0].eventId)
    expect(detail).toMatchObject({ organizer: "Alice Example", meetUrl: "https://meet.google.com/abc-defg-hij", location: "Room 1", calendarName: "Fixture Calendar" })
    expect(detail?.attendees[0].email).toBe("bob@example.test")
    expect(await getEventDetail(9999)).toBeNull()
  })

  it("picks a default date from the newest past event", async () => {
    const { getDefaultCalendarDate } = await import("@/server/services/calendar")
    expect(await getDefaultCalendarDate()).toBe("2023-01-23") // based on stored events, not expanded occurrences
  })
})

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, describe, expect, it } from "vitest"

import { parseIcsTime, parseProp, readIcs, type IcsEvent } from "@/server/indexer/ics"
import { FIXTURE_ICS } from "../fixture/generate"

const file = path.join(os.tmpdir(), `fixture-${process.pid}.ics`)
fs.writeFileSync(file, FIXTURE_ICS)
afterAll(() => fs.rmSync(file, { force: true }))

describe("ics parsing", () => {
  it("parses properties with parameters and quoted values", () => {
    expect(parseProp('ATTENDEE;CN="Bob, Jr";PARTSTAT=ACCEPTED:mailto:bob@x.test')).toEqual({
      name: "ATTENDEE",
      params: { CN: "Bob, Jr", PARTSTAT: "ACCEPTED" },
      value: "mailto:bob@x.test",
    })
  })

  it("converts UTC, zoned, all-day and floating times", () => {
    const p = (value: string, params: Record<string, string> = {}) => ({ name: "DTSTART", params, value })
    expect(parseIcsTime(p("20230102T090000Z"), null)).toEqual({ ts: Date.UTC(2023, 0, 2, 9), allDay: false })
    expect(parseIcsTime(p("20230103T103000", { TZID: "Asia/Kolkata" }), null)).toEqual({ ts: Date.UTC(2023, 0, 3, 5), allDay: false })
    expect(parseIcsTime(p("20230105", { VALUE: "DATE" }), null)).toEqual({ ts: Date.UTC(2023, 0, 5), allDay: true })
    expect(parseIcsTime(p("20230103T103000"), "Asia/Kolkata")?.ts).toBe(Date.UTC(2023, 0, 3, 5)) // floating uses the calendar zone
    expect(parseIcsTime(p("garbage"), null)).toBeNull()
  })

  it("streams a file: unfolds lines, unescapes text, reads attendees, conference, recurrence", async () => {
    const events: IcsEvent[] = []
    const cal = await readIcs(file, (e) => events.push(e))
    expect(cal).toEqual({ name: "Fixture Calendar", timezone: "Asia/Kolkata" })
    expect(events).toHaveLength(5)
    const first = events[0]
    expect(first.summary).toBe("Planning, part one")
    expect(first.description).toBe("Line one\nLine two with a very long text that gets folded by the exporter across lines")
    expect(first).toMatchObject({ organizer: "Alice Example", location: "Room 1", status: "CONFIRMED", meetUrl: "https://meet.google.com/abc-defg-hij" })
    expect(first.attendees).toEqual([{ name: "Bob", email: "bob@example.test", status: "ACCEPTED" }])
    expect(events[2]).toMatchObject({ allDay: true, endTs: Date.UTC(2023, 0, 6) })
    expect(events[3]).toMatchObject({ rrule: "FREQ=WEEKLY;COUNT=4", exdates: [Date.UTC(2023, 0, 16, 4)] })
    expect(events[4].recurrenceTs).toBe(Date.UTC(2023, 0, 23, 4))
  })
})

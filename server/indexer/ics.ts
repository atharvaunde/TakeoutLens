import fs from "node:fs"
import readline from "node:readline"

import { zonedTimeToUtc } from "@/lib/helper"

export interface IcsEvent {
  uid: string
  summary: string
  startTs: number
  endTs: number
  allDay: boolean
  rrule: string | null
  exdates: number[]
  recurrenceTs: number | null
  location: string
  description: string
  organizer: string
  attendees: { name: string; email: string; status: string }[]
  status: string
  meetUrl: string | null
}

export interface IcsCalendar {
  name: string
  timezone: string | null
}

interface Prop {
  name: string
  params: Record<string, string>
  value: string
}

const unescapeText = (value: string) => value.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\;/g, ";").replace(/\\\\/g, "\\")

export function parseProp(line: string): Prop | null {
  const colon = line.indexOf(":")
  if (colon === -1) return null
  const head = line.slice(0, colon)
  const [name, ...rawParams] = head.split(";")
  const params: Record<string, string> = {}
  for (const part of rawParams) {
    const eq = part.indexOf("=")
    if (eq !== -1) params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).replace(/^"|"$/g, "")
  }
  return { name: name.toUpperCase(), params, value: line.slice(colon + 1) }
}

/** DTSTART/DTEND/EXDATE/RECURRENCE-ID value -> UTC ms. All-day (VALUE=DATE) values become UTC midnight. */
export function parseIcsTime(prop: Prop, calendarTz: string | null): { ts: number; allDay: boolean } | null {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/.exec(prop.value.trim())
  if (!m) return null
  const [, y, mo, d, h, mi, s, z] = m
  const wall = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h ?? 0), Number(mi ?? 0), Number(s ?? 0))
  if (h === undefined || prop.params.VALUE === "DATE") return { ts: wall, allDay: true }
  if (z) return { ts: wall, allDay: false }
  return { ts: zonedTimeToUtc(wall, prop.params.TZID || calendarTz || "UTC"), allDay: false }
}

const mailto = (value: string) => value.replace(/^mailto:/i, "")

function buildEvent(props: Prop[], calendarTz: string | null): IcsEvent | null {
  const get = (name: string) => props.find((p) => p.name === name)
  const start = get("DTSTART") && parseIcsTime(get("DTSTART")!, calendarTz)
  const uid = get("UID")?.value
  if (!start || !uid) return null
  const end = get("DTEND") && parseIcsTime(get("DTEND")!, calendarTz)
  const duration = /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(get("DURATION")?.value ?? "")
  const durationMs = duration
    ? ((Number(duration[1] ?? 0) * 7 + Number(duration[2] ?? 0)) * 86400 + Number(duration[3] ?? 0) * 3600 + Number(duration[4] ?? 0) * 60 + Number(duration[5] ?? 0)) * 1000
    : 0
  const endTs = end ? end.ts : start.ts + (durationMs || (start.allDay ? 86_400_000 : 0))
  const recurrence = get("RECURRENCE-ID") && parseIcsTime(get("RECURRENCE-ID")!, calendarTz)
  const description = unescapeText(get("DESCRIPTION")?.value ?? "")
  const conference = get("X-GOOGLE-CONFERENCE")?.value ?? /https:\/\/meet\.google\.com\/[a-z-]+/.exec(description)?.[0] ?? null
  return {
    uid,
    summary: unescapeText(get("SUMMARY")?.value ?? ""),
    startTs: start.ts,
    endTs: Math.max(endTs, start.ts),
    allDay: start.allDay,
    rrule: get("RRULE")?.value ?? null,
    exdates: props
      .filter((p) => p.name === "EXDATE")
      .flatMap((p) => p.value.split(",").map((v) => parseIcsTime({ ...p, value: v }, calendarTz)?.ts))
      .filter((v): v is number => v !== undefined),
    recurrenceTs: recurrence ? recurrence.ts : null,
    location: unescapeText(get("LOCATION")?.value ?? ""),
    description: description.slice(0, 8000),
    organizer: get("ORGANIZER") ? (get("ORGANIZER")!.params.CN ?? mailto(get("ORGANIZER")!.value)) : "",
    attendees: props
      .filter((p) => p.name === "ATTENDEE")
      .slice(0, 50)
      .map((p) => ({ name: p.params.CN ?? "", email: mailto(p.value), status: p.params.PARTSTAT ?? "" })),
    status: get("STATUS")?.value ?? "",
    meetUrl: conference,
  }
}

/**
 * Stream an .ics file (constant memory, RFC 5545 line unfolding) and call `onEvent` per VEVENT.
 * Returns calendar-level info (name, timezone).
 */
export async function readIcs(file: string, onEvent: (event: IcsEvent) => void): Promise<IcsCalendar> {
  const calendar: IcsCalendar = { name: "", timezone: null }
  const lines = readline.createInterface({ input: fs.createReadStream(file, { encoding: "utf8" }), crlfDelay: Infinity })
  let pending: string | null = null
  let current: Prop[] | null = null

  const handle = (line: string) => {
    if (line === "BEGIN:VEVENT") current = []
    else if (line === "END:VEVENT") {
      const event = current && buildEvent(current, calendar.timezone)
      if (event) onEvent(event)
      current = null
    } else {
      const prop = parseProp(line)
      if (!prop) return
      if (current) current.push(prop)
      else if (prop.name === "X-WR-CALNAME") calendar.name = unescapeText(prop.value)
      else if (prop.name === "X-WR-TIMEZONE") calendar.timezone = prop.value
    }
  }

  for await (const raw of lines) {
    if ((raw.startsWith(" ") || raw.startsWith("\t")) && pending !== null) {
      pending += raw.slice(1)
      continue
    }
    if (pending !== null) handle(pending)
    pending = raw
  }
  if (pending !== null) handle(pending)
  return calendar
}

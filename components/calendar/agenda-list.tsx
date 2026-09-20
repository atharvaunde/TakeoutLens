"use client"

import { dayKey, startOfDay } from "@/lib/calendar"
import { formatDay, formatTime } from "@/lib/helper"
import type { CalendarEventItem } from "@/lib/types"

interface AgendaListProps {
  events: CalendarEventItem[]
  colorOf: (calId: number) => string
  nameOf: (calId: number) => string
  onOpen: (event: CalendarEventItem) => void
  emptyText: string
}

/** Events grouped by day; also used for search results. */
export function AgendaList({ events, colorOf, nameOf, onOpen, emptyText }: AgendaListProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-10 text-center">
        <div>
          <div className="text-base font-semibold tracking-[-.015em]">{emptyText}</div>
          <div className="mt-1.5 text-[13px] text-mute">Try another date range or turn on more calendars.</div>
        </div>
      </div>
    )
  }
  const groups = new Map<string, CalendarEventItem[]>()
  for (const event of events) {
    const key = dayKey(startOfDay(event.startWall))
    groups.set(key, [...(groups.get(key) ?? []), event])
  }
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-3.5">
      {[...groups].map(([key, list]) => (
        <section key={key} className="mb-[18px]">
          <div className="border-b border-line2 pb-1.5 font-mono text-[10px] tracking-[.1em] text-faint uppercase">{formatDay(Date.parse(`${key}T00:00:00Z`))}</div>
          {list.map((event) => (
            <button key={event.key} type="button" onClick={() => onOpen(event)} className="flex w-full cursor-pointer items-center gap-3 rounded-[7px] px-1.5 py-[7px] text-left hover:bg-hov">
              <span className="size-[7px] flex-none rounded-full" style={{ backgroundColor: colorOf(event.calId) }} />
              <span className="w-28 flex-none font-mono text-[10.5px] text-faint">
                {event.allDay ? "All day" : `${formatTime(event.startWall, { hour12: false, timeZone: "UTC" })}–${formatTime(event.endWall, { hour12: false, timeZone: "UTC" })}`}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px]">{event.title || "(no title)"}</span>
              <span className="flex-none text-[11.5px] text-faint">{nameOf(event.calId)}</span>
            </button>
          ))}
        </section>
      ))}
    </div>
  )
}

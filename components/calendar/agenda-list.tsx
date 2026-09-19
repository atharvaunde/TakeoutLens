"use client"

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
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
      <Empty className="flex-1">
        <EmptyHeader>
          <EmptyTitle>{emptyText}</EmptyTitle>
          <EmptyDescription>Try another date range or turn on more calendars.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  const groups = new Map<string, CalendarEventItem[]>()
  for (const event of events) {
    const key = dayKey(startOfDay(event.startWall))
    groups.set(key, [...(groups.get(key) ?? []), event])
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-lg border p-4">
      {[...groups].map(([key, list]) => (
        <section key={key} className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">{formatDay(Date.parse(`${key}T00:00:00Z`))}</h3>
          {list.map((event) => (
            <button key={event.key} type="button" onClick={() => onOpen(event)} className="flex items-center gap-3 rounded-md p-2 text-left hover:bg-muted/60">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorOf(event.calId) }} />
              <span className="w-28 shrink-0 text-xs text-muted-foreground">
                {event.allDay ? "All day" : `${formatTime(event.startWall, { timeZone: "UTC" })} – ${formatTime(event.endWall, { timeZone: "UTC" })}`}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{event.title || "(no title)"}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{nameOf(event.calId)}</span>
            </button>
          ))}
        </section>
      ))}
    </div>
  )
}

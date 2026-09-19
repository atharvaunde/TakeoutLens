"use client"

import { useEffect, useRef } from "react"

import { CALENDAR } from "@/lib/constant"
import { addDays, dayKey, eventTouchesDay, layoutDay } from "@/lib/calendar"
import { formatDate } from "@/lib/helper"
import type { CalendarEventItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { EventChip } from "./event-chip"

const HOURS = 24
const MINUTES_PER_HOUR = 60

interface TimeGridProps {
  startMs: number
  dayCount: number
  todayMs: number
  events: CalendarEventItem[]
  colorOf: (calId: number) => string
  onOpen: (event: CalendarEventItem) => void
}

/** Week/day view: an all-day row plus an hourly grid with overlapping events laid out side by side. */
export function TimeGrid({ startMs, dayCount, todayMs, events, colorOf, onOpen }: TimeGridProps) {
  const days = Array.from({ length: dayCount }, (_, i) => addDays(startMs, i))
  const px = CALENDAR.hourHeightPx / MINUTES_PER_HOUR
  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = CALENDAR.initialScrollHour * CALENDAR.hourHeightPx
  }, [])
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
      <div className="grid border-b bg-muted/40" style={{ gridTemplateColumns: `3.5rem repeat(${dayCount}, minmax(0, 1fr))` }}>
        <div />
        {days.map((day) => (
          <div key={day} className="flex flex-col gap-1 border-l px-2 py-1.5">
            <span className={cn("text-xs font-medium", dayKey(day) === dayKey(todayMs) && "text-primary")}>
              {formatDate(day, { weekday: "short", day: "numeric", year: undefined, month: undefined, timeZone: "UTC" })}
            </span>
            {events
              .filter((e) => e.allDay && eventTouchesDay(e, day))
              .map((event) => (
                <EventChip key={event.key} event={event} color={colorOf(event.calId)} onOpen={onOpen} />
              ))}
          </div>
        ))}
      </div>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${dayCount}, minmax(0, 1fr))`, height: HOURS * CALENDAR.hourHeightPx }}>
          <div className="relative">
            {Array.from({ length: HOURS }, (_, hour) => (
              <div key={hour} className="absolute right-2 -translate-y-1/2 text-[0.65rem] text-muted-foreground" style={{ top: hour * CALENDAR.hourHeightPx }}>
                {hour === 0 ? "" : `${String(hour).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div key={day} className="relative border-l">
              {Array.from({ length: HOURS }, (_, hour) => (
                <div key={hour} className="absolute inset-x-0 border-t border-border/60" style={{ top: hour * CALENDAR.hourHeightPx }} />
              ))}
              {layoutDay(events.filter((e) => eventTouchesDay(e, day)), day).map(({ event, column, columns, topMinutes, heightMinutes }) => (
                <EventChip
                  key={event.key}
                  event={event}
                  color={colorOf(event.calId)}
                  onOpen={onOpen}
                  showTime
                  className="absolute items-start"
                  style={{
                    top: topMinutes * px,
                    height: Math.max(heightMinutes * px, 18),
                    left: `${(column / columns) * 100}%`,
                    width: `calc(${100 / columns}% - 2px)`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

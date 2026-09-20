"use client"

import { CALENDAR } from "@/lib/constant"
import { addDays, eventTouchesDay, isSameMonth, monthGridStart, monthWeekCount } from "@/lib/calendar"
import { formatDate } from "@/lib/helper"
import type { CalendarEventItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { EventChip } from "./event-chip"

const WEEKDAYS = 7

interface MonthGridProps {
  dateMs: number
  events: CalendarEventItem[]
  colorOf: (calId: number) => string
  onOpen: (event: CalendarEventItem) => void
  onDayClick: (dayMs: number) => void
}

export function MonthGrid({ dateMs, events, colorOf, onOpen, onDayClick }: MonthGridProps) {
  const start = monthGridStart(dateMs)
  const weeks = monthWeekCount(dateMs)
  const days = Array.from({ length: weeks * WEEKDAYS }, (_, i) => addDays(start, i))
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid flex-none grid-cols-7 border-b border-line bg-panel">
        {days.slice(0, WEEKDAYS).map((day) => (
          <div key={day} className="px-2 py-[5px] font-mono text-[9.5px] tracking-[.14em] text-faint uppercase">
            {formatDate(day, { weekday: "short", year: undefined, month: undefined, day: undefined, timeZone: "UTC" })}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1" style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}>
        {Array.from({ length: weeks }, (_, week) => (
          <div key={week} className="grid min-h-0 grid-cols-7 border-b border-line2">
            {days.slice(week * WEEKDAYS, (week + 1) * WEEKDAYS).map((day) => {
              const dayEvents = events.filter((e) => eventTouchesDay(e, day))
              const extra = dayEvents.length - CALENDAR.maxChipsPerDay
              const muted = !isSameMonth(day, dateMs)
              return (
                <div
                  key={day}
                  role="button"
                  tabIndex={0}
                  onClick={() => onDayClick(day)}
                  onKeyDown={(e) => e.key === "Enter" && onDayClick(day)}
                  className={cn("flex min-w-0 cursor-pointer flex-col gap-0.5 overflow-hidden border-l border-line2 px-[5px] py-1 first:border-l-0", muted && "bg-panel")}
                >
                  <div className={cn("font-mono text-[10.5px]", muted ? "text-faint" : "text-ink2")}>{new Date(day).getUTCDate()}</div>
                  {dayEvents.slice(0, CALENDAR.maxChipsPerDay).map((event) => (
                    <EventChip key={event.key} event={event} color={colorOf(event.calId)} onOpen={onOpen} showTime />
                  ))}
                  {extra > 0 ? <div className="pl-1 font-mono text-[9.5px] text-faint">+{extra} more</div> : null}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

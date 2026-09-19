"use client"

import { CALENDAR } from "@/lib/constant"
import { addDays, dayKey, eventTouchesDay, isSameMonth, monthGridStart } from "@/lib/calendar"
import { formatDate } from "@/lib/helper"
import type { CalendarEventItem } from "@/lib/types"
import { cn } from "@/lib/utils"
import { EventChip } from "./event-chip"

const WEEKDAYS = 7
const GRID_DAYS = 42

interface MonthGridProps {
  dateMs: number
  todayMs: number
  events: CalendarEventItem[]
  colorOf: (calId: number) => string
  onOpen: (event: CalendarEventItem) => void
  onDayClick: (dayMs: number) => void
}

export function MonthGrid({ dateMs, todayMs, events, colorOf, onOpen, onDayClick }: MonthGridProps) {
  const start = monthGridStart(dateMs)
  const days = Array.from({ length: GRID_DAYS }, (_, i) => addDays(start, i))
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        {days.slice(0, WEEKDAYS).map((day) => (
          <div key={day} className="px-2 py-1.5">
            {formatDate(day, { weekday: "short", year: undefined, month: undefined, day: undefined, timeZone: "UTC" })}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-px overflow-y-auto bg-border">
        {days.map((day) => {
          const dayEvents = events.filter((e) => eventTouchesDay(e, day))
          const extra = dayEvents.length - CALENDAR.maxChipsPerDay
          return (
            <div
              key={day}
              role="button"
              tabIndex={0}
              onClick={() => onDayClick(day)}
              onKeyDown={(e) => e.key === "Enter" && onDayClick(day)}
              className={cn("flex min-h-24 cursor-pointer flex-col gap-0.5 bg-background p-1 hover:bg-muted/30", !isSameMonth(day, dateMs) && "bg-muted/20 text-muted-foreground")}
            >
              <span className={cn("w-fit rounded-full px-1.5 text-xs", dayKey(day) === dayKey(todayMs) && "bg-primary font-semibold text-primary-foreground")}>
                {new Date(day).getUTCDate()}
              </span>
              {dayEvents.slice(0, CALENDAR.maxChipsPerDay).map((event) => (
                <EventChip key={event.key} event={event} color={colorOf(event.calId)} onOpen={onOpen} showTime />
              ))}
              {extra > 0 ? <span className="px-1 text-xs text-muted-foreground">+{extra} more</span> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

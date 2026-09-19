"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { DatePicker } from "@/components/common/date-picker"
import { SearchInput } from "@/components/common/search-input"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CALENDAR, type CalendarView } from "@/lib/constant"
import { addDays, dayKey, shiftDate, startOfWeek, titleFor } from "@/lib/calendar"
import type { CalendarEventItem, CalendarInfo } from "@/lib/types"
import { useCalendarStore } from "@/stores/calendar-store"
import { AgendaList } from "./agenda-list"
import { CalendarSidebar } from "./calendar-sidebar"
import { EventDialog } from "./event-dialog"
import { MonthGrid } from "./month-grid"
import { TimeGrid } from "./time-grid"

const VIEW_LABELS: Record<CalendarView, string> = { month: "Month", week: "Week", day: "Day", agenda: "Agenda" }
const WEEK_DAYS = 7

interface CalendarShellProps {
  view: CalendarView
  dateMs: number
  todayMs: number
  events: CalendarEventItem[]
  calendars: CalendarInfo[]
  truncated: boolean
  /** When set, `events` are search results shown as an agenda. */
  searchQuery: string
}

export function CalendarShell({ view, dateMs, todayMs, events, calendars, truncated, searchQuery }: CalendarShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hidden = useCalendarStore((s) => s.hidden)
  const initialize = useCalendarStore((s) => s.initialize)
  const [opened, setOpened] = useState<CalendarEventItem | null>(null)

  // First visit: hide the calendars the server marked as not shown by default (e.g. colleagues').
  useEffect(() => initialize(calendars.filter((c) => !c.defaultVisible).map((c) => c.id)), [calendars, initialize])

  const byId = useMemo(() => new Map(calendars.map((c) => [c.id, c])), [calendars])
  const colorOf = (id: number) => byId.get(id)?.color ?? CALENDAR.colors[0]
  const nameOf = (id: number) => byId.get(id)?.name ?? ""
  const visible = useMemo(() => events.filter((e) => !hidden.has(e.calId)), [events, hidden])

  const go = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    router.push(`${pathname}?${next.toString()}`)
  }
  const goDate = (ms: number, nextView?: CalendarView) => go({ date: dayKey(ms), view: nextView ?? view, q: null })

  return (
    <div className="grid h-[calc(100svh-9rem)] min-h-0 grid-cols-[15rem_minmax(0,1fr)] gap-4">
      <CalendarSidebar calendars={calendars} />
      <div className="flex min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => goDate(todayMs)}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Previous" onClick={() => goDate(shiftDate(view, dateMs, -1))}>
            <ChevronLeftIcon />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next" onClick={() => goDate(shiftDate(view, dateMs, 1))}>
            <ChevronRightIcon />
          </Button>
          <h1 className="text-lg font-semibold">{searchQuery ? `Results for “${searchQuery}”` : titleFor(view, dateMs)}</h1>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <SearchInput className="w-56" placeholder="Search events…" />
            <DatePicker value={dateMs} onChange={(ms) => goDate(ms)} />
            <ToggleGroup type="single" variant="outline" size="sm" value={view} onValueChange={(next) => next && goDate(dateMs, next as CalendarView)}>
              {CALENDAR.views.map((v) => (
                <ToggleGroupItem key={v} value={v}>
                  {VIEW_LABELS[v]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        {truncated ? <p className="text-xs text-muted-foreground">Showing the first {CALENDAR.maxEventsPerRange} events in this range.</p> : null}

        {searchQuery || view === "agenda" ? (
          <AgendaList events={visible} colorOf={colorOf} nameOf={nameOf} onOpen={setOpened} emptyText={searchQuery ? "No events match" : "No events in this period"} />
        ) : view === "month" ? (
          <MonthGrid dateMs={dateMs} todayMs={todayMs} events={visible} colorOf={colorOf} onOpen={setOpened} onDayClick={(day) => goDate(day, "day")} />
        ) : (
          <TimeGrid
            key={`${view}-${dayKey(dateMs)}`}
            startMs={view === "week" ? startOfWeek(dateMs) : addDays(dateMs, 0)}
            dayCount={view === "week" ? WEEK_DAYS : 1}
            todayMs={todayMs}
            events={visible}
            colorOf={colorOf}
            onOpen={setOpened}
          />
        )}
      </div>
      <EventDialog target={opened} color={opened ? colorOf(opened.calId) : CALENDAR.colors[0]} onClose={() => setOpened(null)} />
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { DatePicker } from "@/components/common/date-picker"
import { OptionGroup } from "@/components/common/option-group"
import { SearchInput } from "@/components/common/search-input"
import { CALENDAR, type CalendarView } from "@/lib/constant"
import { addDays, dayKey, shiftDate, startOfWeek, titleFor } from "@/lib/calendar"
import type { CalendarEventItem, CalendarInfo } from "@/lib/types"
import { useCalendarStore } from "@/stores/calendar-store"
import { AgendaList } from "./agenda-list"
import { CalendarSidebar } from "./calendar-sidebar"
import { EventDialog } from "./event-dialog"
import { MonthGrid } from "./month-grid"
import { TimeGrid } from "./time-grid"

const VIEW_OPTIONS = CALENDAR.views.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))
const WEEK_DAYS = 7
const navButton = "cursor-pointer rounded-[4px] border border-line px-2 py-[3px] font-mono text-[11px] hover:bg-hov"

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
    <div className="relative grid h-full grid-cols-[212px_1fr]">
      <CalendarSidebar calendars={calendars} />
      <div className="flex min-h-0 min-w-0 flex-col">
        <div className="flex min-h-[42px] flex-none flex-wrap items-center gap-x-2.5 gap-y-2 border-b border-line px-3.5 py-[7px]">
          <div className="flex flex-none gap-[3px]">
            <button type="button" className={navButton} onClick={() => goDate(todayMs)}>
              Today
            </button>
            <button type="button" className={navButton} aria-label="Previous" onClick={() => goDate(shiftDate(view, dateMs, -1))}>
              ‹
            </button>
            <button type="button" className={navButton} aria-label="Next" onClick={() => goDate(shiftDate(view, dateMs, 1))}>
              ›
            </button>
          </div>
          <DatePicker value={dateMs} onChange={(ms) => goDate(ms)}>
            <button type="button" title="Jump to a date" className="cursor-pointer text-[15px] font-semibold tracking-[-.02em] hover:text-acc">
              {searchQuery ? `Results for “${searchQuery}”` : titleFor(view, dateMs)}
            </button>
          </DatePicker>
          <div className="flex-1" />
          <SearchInput className="h-[26px] w-[190px] bg-surf text-xs" placeholder="Search events…" />
          <OptionGroup options={VIEW_OPTIONS} value={view} variant="segment" onChange={(next) => goDate(dateMs, next)} />
        </div>

        {truncated ? <p className="px-3.5 pt-2 font-mono text-[10px] text-faint">Showing the first {CALENDAR.maxEventsPerRange} events in this range.</p> : null}

        {searchQuery || view === "agenda" ? (
          <AgendaList events={visible} colorOf={colorOf} nameOf={nameOf} onOpen={setOpened} emptyText={searchQuery ? "No events match" : "No events in this period"} />
        ) : view === "month" ? (
          <MonthGrid dateMs={dateMs} events={visible} colorOf={colorOf} onOpen={setOpened} onDayClick={(day) => goDate(day, "day")} />
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

import { CalendarShell } from "@/components/calendar/calendar-shell"
import { Crumb } from "@/components/layout/crumb"
import { CALENDAR, type CalendarView } from "@/lib/constant"
import { parseDateParam, rangeFor, titleFor } from "@/lib/calendar"
import { getDefaultCalendarDate, getEventsInRange, getTodayWall, listCalendars, searchEvents } from "@/server/services/calendar"

type Query = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams
  const viewParam = one(query.view)
  const view: CalendarView = (CALENDAR.views as readonly string[]).includes(viewParam ?? "") ? (viewParam as CalendarView) : CALENDAR.defaultView
  const searchQuery = one(query.q)?.trim() ?? ""
  const dateMs = parseDateParam(one(query.date)) ?? (parseDateParam(await getDefaultCalendarDate()) as number)
  const { from, to } = rangeFor(view, dateMs)

  const [calendars, range, results, todayMs] = await Promise.all([
    listCalendars(),
    searchQuery ? Promise.resolve({ events: [], truncated: false }) : getEventsInRange(from, to),
    searchQuery ? searchEvents(searchQuery) : Promise.resolve([]),
    getTodayWall(),
  ])

  return (
    <>
    <Crumb value={`Calendar / ${titleFor(view, dateMs)}`} />
    <CalendarShell
      view={view}
      dateMs={dateMs}
      todayMs={todayMs}
      events={searchQuery ? results : range.events}
      calendars={calendars}
      truncated={range.truncated}
      searchQuery={searchQuery}
    />
    </>
  )
}

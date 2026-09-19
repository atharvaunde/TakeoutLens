"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatNumber } from "@/lib/helper"
import type { CalendarInfo } from "@/lib/types"
import { useCalendarStore } from "@/stores/calendar-store"

/** Toggle which calendars are overlaid. Each has its own colour. */
export function CalendarSidebar({ calendars }: { calendars: CalendarInfo[] }) {
  const hidden = useCalendarStore((s) => s.hidden)
  const toggle = useCalendarStore((s) => s.toggle)
  const showAll = useCalendarStore((s) => s.showAll)
  const hideAll = useCalendarStore((s) => s.hideAll)
  const only = useCalendarStore((s) => s.only)
  const ids = calendars.map((c) => c.id)

  return (
    <div className="flex min-h-0 flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Calendars</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="xs" onClick={showAll}>
            All
          </Button>
          <Button variant="ghost" size="xs" onClick={() => hideAll(ids)}>
            None
          </Button>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="flex flex-col gap-1">
          {calendars.map((calendar) => (
            <li key={calendar.id} className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60">
              <Checkbox
                id={`cal-${calendar.id}`}
                checked={!hidden.has(calendar.id)}
                onCheckedChange={() => toggle(calendar.id)}
                style={{ accentColor: calendar.color }}
              />
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: calendar.color }} />
              <label htmlFor={`cal-${calendar.id}`} className="min-w-0 flex-1 cursor-pointer truncate text-sm" title={calendar.name}>
                {calendar.name}
              </label>
              <button
                type="button"
                onClick={() => only(calendar.id, ids)}
                className="hidden text-xs text-muted-foreground hover:underline group-hover:inline"
              >
                only
              </button>
              <span className="text-xs text-muted-foreground group-hover:hidden">{formatNumber(calendar.eventCount)}</span>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}

"use client"

import type { CalendarInfo } from "@/lib/types"
import { useCalendarStore } from "@/stores/calendar-store"

/** Toggle which calendars are overlaid: a coloured square per calendar (filled when shown). */
export function CalendarSidebar({ calendars }: { calendars: CalendarInfo[] }) {
  const hidden = useCalendarStore((s) => s.hidden)
  const toggle = useCalendarStore((s) => s.toggle)
  const showAll = useCalendarStore((s) => s.showAll)
  const hideAll = useCalendarStore((s) => s.hideAll)
  const ids = calendars.map((c) => c.id)
  const allHidden = ids.every((id) => hidden.has(id))

  return (
    <div className="overflow-y-auto border-r border-line px-2.5 py-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="font-mono text-[9.5px] tracking-[.16em] text-faint uppercase">Calendars</span>
        <button type="button" onClick={() => (allHidden ? showAll() : hideAll(ids))} className="cursor-pointer text-[11px] text-acc hover:underline">
          {allHidden ? "All" : "None"}
        </button>
      </div>
      {calendars.map((calendar) => {
        const on = !hidden.has(calendar.id)
        return (
          <div key={calendar.id} onClick={() => toggle(calendar.id)} className="flex cursor-pointer items-center gap-2 rounded-[7px] px-[5px] py-1 hover:bg-hov" title={calendar.name}>
            <span
              className="size-[11px] flex-none rounded-[3px] border-[1.5px]"
              style={{ borderColor: calendar.color, backgroundColor: on ? calendar.color : "transparent" }}
            />
            <span className={`min-w-0 flex-1 truncate text-xs ${on ? "text-ink" : "text-mute"}`}>{calendar.name}</span>
          </div>
        )
      })}
    </div>
  )
}

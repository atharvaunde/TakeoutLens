"use client"

import { formatTime } from "@/lib/helper"
import type { CalendarEventItem } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EventChipProps {
  event: CalendarEventItem
  color: string
  onOpen: (event: CalendarEventItem) => void
  showTime?: boolean
  className?: string
  style?: React.CSSProperties
}

/** Compact event pill tinted with its calendar's colour (used in month cells, all-day rows and time grids). */
export function EventChip({ event, color, onOpen, showTime = false, className, style }: EventChipProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(event)
      }}
      title={event.title}
      className={cn("flex min-w-0 items-center gap-1 overflow-hidden rounded-sm border-l-2 px-1.5 py-0.5 text-left text-xs hover:brightness-95", className)}
      style={{ borderLeftColor: color, backgroundColor: `color-mix(in oklch, ${color} 18%, transparent)`, ...style }}
    >
      {showTime && !event.allDay ? <span className="shrink-0 text-muted-foreground">{formatTime(event.startWall, { timeZone: "UTC" })}</span> : null}
      <span className="truncate">{event.title || "(no title)"}</span>
    </button>
  )
}

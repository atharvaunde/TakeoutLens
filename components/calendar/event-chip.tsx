"use client"

import { formatTime } from "@/lib/helper"
import type { CalendarEventItem } from "@/lib/types"
import { cn } from "@/lib/utils"

interface EventChipProps {
  event: CalendarEventItem
  /** Calendar colour (a CSS variable reference) shown as the dot. */
  color: string
  onOpen: (event: CalendarEventItem) => void
  showTime?: boolean
  className?: string
  style?: React.CSSProperties
}

/** Thin event pill: colour dot, optional 24h start time, title. */
export function EventChip({ event, color, onOpen, showTime = false, className, style }: EventChipProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(event)
      }}
      title={event.title}
      className={cn("flex min-w-0 cursor-pointer items-center gap-1 overflow-hidden rounded-[3px] bg-sel px-1 py-px text-left hover:brightness-95", className)}
      style={style}
    >
      <span className="size-1 flex-none rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate text-[10.5px] text-ink2">
        {showTime && !event.allDay ? `${formatTime(event.startWall, { hour12: false, timeZone: "UTC" })} ` : ""}
        {event.title || "(no title)"}
      </span>
    </button>
  )
}

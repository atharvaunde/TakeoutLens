"use client"

import { useEffect, useState } from "react"
import { MapPinIcon, UsersIcon, VideoIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDay, formatTime } from "@/lib/helper"
import type { CalendarEventDetail, CalendarEventItem } from "@/lib/types"
import { loadEventDetailAction } from "@/server/actions/calendar"

interface EventDialogProps {
  target: CalendarEventItem | null
  color: string
  onClose: () => void
}

export function EventDialog({ target, color, onClose }: EventDialogProps) {
  const [detail, setDetail] = useState<CalendarEventDetail | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!target) return
    let cancelled = false
    void loadEventDetailAction(target.eventId, target.recurring ? target.startWall : undefined).then((result) => {
      if (cancelled) return
      setDetail(result)
      setLoadedKey(target.key)
    })
    return () => {
      cancelled = true
    }
  }, [target])

  const ready = target !== null && loadedKey === target.key && detail !== null
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {target ? (
          <>
            <div className="flex items-start gap-3">
              <span className="mt-1.5 size-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <div className="flex min-w-0 flex-col gap-1">
                <DialogTitle className="wrap-break-word">{target.title || "(no title)"}</DialogTitle>
                <DialogDescription>
                  {formatDay(target.startWall)} ·{" "}
                  {target.allDay ? "All day" : `${formatTime(target.startWall, { timeZone: "UTC" })} – ${formatTime(target.endWall, { timeZone: "UTC" })}`}
                </DialogDescription>
              </div>
            </div>
            {ready ? (
              <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{detail.calendarName}</Badge>
                  {detail.recurring ? <Badge variant="outline">Repeats</Badge> : null}
                  {detail.status ? <Badge variant="outline">{detail.status.toLowerCase()}</Badge> : null}
                </div>
                {detail.location ? (
                  <p className="flex items-start gap-2">
                    <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    {detail.location}
                  </p>
                ) : null}
                {detail.meetUrl ? (
                  <p className="flex items-center gap-2">
                    <VideoIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="break-all text-muted-foreground">{detail.meetUrl}</span>
                  </p>
                ) : null}
                {detail.organizer ? <p className="text-muted-foreground">Organizer: {detail.organizer}</p> : null}
                {detail.attendees.length ? (
                  <div className="flex flex-col gap-1">
                    <p className="flex items-center gap-2 font-medium">
                      <UsersIcon className="size-4 text-muted-foreground" />
                      {detail.attendees.length} attendees
                    </p>
                    <ul className="flex flex-col gap-0.5 pl-6 text-muted-foreground">
                      {detail.attendees.map((a) => (
                        <li key={a.email}>
                          {a.name || a.email} {a.status ? <span className="text-xs">({a.status.toLowerCase()})</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {detail.description ? <p className="whitespace-pre-wrap wrap-break-word">{detail.description}</p> : null}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

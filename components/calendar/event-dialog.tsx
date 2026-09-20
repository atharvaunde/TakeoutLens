"use client"

import { useEffect, useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatTime } from "@/lib/helper"
import type { CalendarEventDetail, CalendarEventItem } from "@/lib/types"
import { loadEventDetailAction } from "@/server/actions/calendar"

interface EventDialogProps {
  target: CalendarEventItem | null
  color: string
  onClose: () => void
}

const LABEL = "pt-0.5 font-mono text-[10px] tracking-[.1em] text-faint uppercase"
const TAG = "rounded-[3px] bg-sel px-1.5 py-0.5 font-mono text-[9.5px] text-mute"

const statusOf = (s: string) => (s === "ACCEPTED" ? "accepted" : s === "DECLINED" ? "declined" : "pending")

/** Event card over the calendar: title + time, tags, Meet/Organizer, attendees with response counts. */
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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      cancelled = true
      window.removeEventListener("keydown", onKey)
    }
  }, [target, onClose])

  if (!target) return null
  const ready = loadedKey === target.key && detail !== null
  const counts = { accepted: 0, declined: 0, pending: 0 }
  for (const a of detail?.attendees ?? []) counts[statusOf(a.status)]++

  return (
    <div onClick={onClose} className="absolute inset-0 z-30 flex items-center justify-center bg-scrim p-8">
      <div onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-[480px] overflow-y-auto rounded-[10px] border border-line bg-surf shadow-[0_18px_50px_var(--shadow)]">
        <div className="flex items-start gap-2.5 border-b border-line2 px-[18px] py-4">
          <span className="mt-[5px] size-[9px] flex-none rounded-full" style={{ backgroundColor: color }} />
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold tracking-[-.015em] wrap-break-word">{target.title || "(no title)"}</div>
            <div className="mt-[3px] font-mono text-[11px] text-mute">
              {formatDate(target.startWall, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} ·{" "}
              {target.allDay ? "All day" : `${formatTime(target.startWall, { hour12: false, timeZone: "UTC" })}–${formatTime(target.endWall, { hour12: false, timeZone: "UTC" })}`}
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[13px] text-faint hover:bg-hov hover:text-ink">
            ✕
          </button>
        </div>

        {ready ? (
          <div className="flex flex-col gap-3 px-[18px] py-3.5">
            <div className="flex flex-wrap gap-[5px]">
              <span className={TAG}>{detail.calendarName}</span>
              {detail.recurring ? <span className={TAG}>repeats</span> : null}
              {detail.status ? <span className="rounded-[3px] bg-accbg px-1.5 py-0.5 font-mono text-[9.5px] text-acc">{detail.status.toLowerCase()}</span> : null}
            </div>
            {detail.location || detail.meetUrl || detail.organizer ? (
              <div className="grid grid-cols-[82px_1fr] gap-x-2.5 gap-y-1.5 text-[12.5px]">
                {detail.meetUrl ? (
                  <>
                    <span className={LABEL}>Meet</span>
                    <span className="break-all text-acc">{detail.meetUrl.replace(/^https?:\/\//, "")}</span>
                  </>
                ) : null}
                {detail.location ? (
                  <>
                    <span className={LABEL}>Where</span>
                    <span>{detail.location}</span>
                  </>
                ) : null}
                {detail.organizer ? (
                  <>
                    <span className={LABEL}>Organizer</span>
                    <span>{detail.organizer}</span>
                  </>
                ) : null}
              </div>
            ) : null}
            {detail.attendees.length ? (
              <div>
                <div className="flex items-baseline justify-between border-b border-line2 pb-1.5">
                  <span className="font-mono text-[10px] tracking-[.1em] text-faint uppercase">{detail.attendees.length} attendees</span>
                  <span className="font-mono text-[10px] text-faint">
                    {counts.accepted} yes · {counts.declined} no · {counts.pending} pending
                  </span>
                </div>
                <div className="mt-1 flex flex-col">
                  {detail.attendees.map((a) => {
                    const status = statusOf(a.status)
                    return (
                      <div key={a.email} className="flex items-center gap-2 py-1">
                        <span className={`size-[5px] flex-none rounded-full ${status === "accepted" ? "bg-ok" : status === "declined" ? "bg-acc" : "bg-line"}`} />
                        <span className={`min-w-0 flex-1 truncate text-[12.5px] ${status === "pending" ? "text-mute" : "text-ink"}`}>{a.name || a.email}</span>
                        <span className="font-mono text-[9.5px] text-faint">{status}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
            {detail.description ? <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink2 wrap-break-word">{detail.description}</p> : null}
          </div>
        ) : (
          <div className="flex flex-col gap-2 px-[18px] py-3.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}
      </div>
    </div>
  )
}

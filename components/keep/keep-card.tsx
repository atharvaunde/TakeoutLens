"use client"

import { formatDate } from "@/lib/helper"
import type { KeepNote } from "@/lib/types"

const BOX = "mt-[3px] size-[11px] flex-none rounded-[2px] border border-line"

/** Card body: checklist rows with small boxes, or the note text line by line. */
export function KeepBody({ note }: { note: KeepNote }) {
  return (
    <>
      {note.items.map((item, index) => (
        <div key={index} className="flex items-start gap-[7px] py-[1.5px]">
          <span className={`${BOX} ${item.checked ? "bg-sel" : "bg-transparent"}`} />
          <span className={`text-[12.5px] leading-normal text-pretty ${item.checked ? "text-faint line-through" : "text-ink2"}`}>{item.text}</span>
        </div>
      ))}
      {note.text
        ? note.text.split("\n").map((line, index) => (
            <div key={index} className="py-[1.5px] text-[12.5px] leading-normal text-ink2 text-pretty">
              {line || " "}
            </div>
          ))
        : null}
    </>
  )
}

interface KeepCardProps {
  note: KeepNote
  onOpen: (note: KeepNote) => void
}

export function KeepCard({ note, onOpen }: KeepCardProps) {
  return (
    <div className="mb-2.5 overflow-hidden rounded-xl border border-line bg-surf break-inside-avoid">
      <div className="flex items-center gap-2 border-b border-line2 px-3 py-2.5">
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{note.title || (note.items.length ? "List" : "Note")}</span>
        <span className="font-mono text-[9.5px] text-faint">{formatDate(note.editedAt, { day: "2-digit" })}</span>
      </div>
      <div className="max-h-[230px] overflow-hidden px-3 py-2.5">
        <KeepBody note={note} />
        {note.attachmentIds.map((id) => (
          // eslint-disable-next-line @next/next/no-img-element -- cached local thumbnail
          <img key={id} src={`/thumb/${id}`} alt="" loading="lazy" className="mt-2 rounded-md" />
        ))}
      </div>
      <div className="flex justify-between border-t border-line2 px-3 py-1.5 font-mono text-[10px] text-faint">
        <span>{note.items.length ? "checklist" : "note"}</span>
        <button type="button" onClick={() => onOpen(note)} className="cursor-pointer text-acc">
          Open
        </button>
      </div>
    </div>
  )
}

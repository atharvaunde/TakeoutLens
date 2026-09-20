"use client"

import { useEffect, useState } from "react"

import type { KeepNote } from "@/lib/types"
import { KeepBody, KeepCard } from "./keep-card"

/** Masonry of note cards; "Open" shows the full note (cards clip long content). */
export function KeepBoard({ notes }: { notes: KeepNote[] }) {
  const [open, setOpen] = useState<KeepNote | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  if (notes.length === 0) return <div className="py-16 text-center text-[13px] text-faint">No notes in this view.</div>
  return (
    <>
      <div className="columns-[280px] gap-2.5">
        {notes.map((note) => (
          <KeepCard key={note.id} note={note} onOpen={setOpen} />
        ))}
      </div>
      {open ? (
        <div onClick={() => setOpen(null)} className="absolute inset-0 z-30 flex items-center justify-center bg-scrim p-8">
          <div onClick={(e) => e.stopPropagation()} className="max-h-full w-full max-w-[560px] overflow-y-auto rounded-[10px] border border-line bg-surf shadow-[0_18px_50px_var(--shadow)]">
            <div className="flex items-center gap-2 border-b border-line2 px-[18px] py-3.5">
              <span className="min-w-0 flex-1 text-base font-semibold tracking-[-.015em]">{open.title || "Note"}</span>
              <button type="button" aria-label="Close" onClick={() => setOpen(null)} className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[13px] text-faint hover:bg-hov hover:text-ink">
                ✕
              </button>
            </div>
            <div className="px-[18px] py-3.5">
              <KeepBody note={open} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

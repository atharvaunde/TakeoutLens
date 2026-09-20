"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { HOME_NAV, MODULES, SEARCH_MODULE_LABELS, SHELL, TIMELINE_NAV } from "@/lib/constant"
import type { GlobalSearchResult } from "@/lib/types"
import { searchEverythingAction } from "@/server/actions/search"
import { useRecentsStore } from "@/stores/recents-store"
import { useUiStore } from "@/stores/ui-store"

interface Row {
  id: string
  label: string
  meta: string
  href: string
  moduleId: string
}

const iconFor = (moduleId: string) => MODULES.find((m) => m.id === moduleId)?.icon ?? HOME_NAV.icon

/** ⌘K palette: quick jumps and recents when empty, live search across the main sources when typing. */
export function CommandPalette() {
  const router = useRouter()
  const open = useUiStore((s) => s.cmdOpen)
  const setOpen = useUiStore((s) => s.setCmdOpen)
  const recents = useRecentsStore((s) => s.items)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [active, setActive] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  useEffect(() => {
    const q = query.trim()
    if (q.length < SHELL.searchMinLength) return
    let cancelled = false
    const timer = setTimeout(() => {
      void searchEverythingAction(q).then((found) => {
        if (!cancelled) {
          setResults(found)
          setActive(0)
        }
      })
    }, SHELL.searchDebounceMs)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  if (!open) return null

  const searching = query.trim().length >= SHELL.searchMinLength
  const jumps: Row[] = [
    { id: "home", label: HOME_NAV.label, meta: "overview", href: HOME_NAV.href, moduleId: "home" },
    { id: "timeline", label: TIMELINE_NAV.label, meta: "all sources", href: TIMELINE_NAV.href, moduleId: "timeline" },
    ...MODULES.map((m) => ({ id: m.id, label: m.label, meta: "open", href: m.href, moduleId: m.id })),
  ]
  const recentRows: Row[] = recents.map((r) => ({ id: `recent-${r.href}`, label: r.label, meta: "recent", href: r.href, moduleId: r.moduleId }))
  const rows: Row[] = searching ? results : [...recentRows, ...jumps]

  const close = () => {
    setOpen(false)
    setQuery("")
    setResults([])
  }
  const go = (row: Row) => {
    close()
    router.push(row.href)
  }

  return (
    <div onClick={close} className="absolute inset-0 z-40 flex items-start justify-center bg-scrim pt-20">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[540px] overflow-hidden rounded-[9px] border border-line bg-surf shadow-[0_18px_50px_var(--shadow)]">
        <div className="flex items-center gap-[9px] border-b border-line2 px-3.5 py-[11px]">
          <span className="font-mono text-[11px] text-faint">›</span>
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, rows.length - 1))
              else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0))
              else if (e.key === "Enter" && rows[active]) go(rows[active])
            }}
            placeholder="Search mail, chat, files, events…"
            className="flex-1 border-none bg-transparent text-sm text-ink outline-none"
          />
          <span className="rounded-[3px] border border-line px-[5px] py-px font-mono text-[9.5px] text-faint">ESC</span>
        </div>
        <div className="max-h-80 overflow-y-auto p-1.5">
          {rows.length === 0 ? (
            <div className="px-3 py-6 text-center text-[12.5px] text-faint">{searching ? "No matches" : "Type to search"}</div>
          ) : (
            rows.map((row, index) => {
              const Icon = iconFor(row.moduleId)
              return (
                <div
                  key={row.id}
                  onClick={() => go(row)}
                  onMouseEnter={() => setActive(index)}
                  className={`flex cursor-pointer items-center gap-[9px] rounded-lg px-[9px] py-[7px] ${index === active ? "bg-hov" : ""}`}
                >
                  <span className="flex size-[26px] flex-none items-center justify-center rounded-xl border border-line bg-panel">
                    <Icon className="size-[14px] text-mute" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px]">{row.label}</span>
                  <span className="font-mono text-[10px] text-faint">{SEARCH_MODULE_LABELS[row.moduleId] && row.meta.startsWith(row.moduleId) ? row.meta : row.meta}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

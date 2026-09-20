"use client"

import { usePathname } from "next/navigation"

import { HOME_NAV, MODULES } from "@/lib/constant"
import { logoutAction } from "@/server/actions/auth"
import { useUiStore } from "@/stores/ui-store"

export function AppHeader() {
  const pathname = usePathname()
  const crumb = useUiStore((s) => s.crumb)
  const setCmdOpen = useUiStore((s) => s.setCmdOpen)
  const fallback =
    pathname === "/" ? "overview" : (MODULES.find((m) => pathname.startsWith(m.href))?.label ?? HOME_NAV.label)

  return (
    <header className="flex h-[42px] flex-none items-center gap-3 border-b border-line bg-background px-3.5">
      <div className="flex min-w-0 items-center gap-[7px] font-mono text-[11.5px]">
        <span className="text-faint">~/Takeout</span>
        <span className="text-line">/</span>
        <span className="truncate font-medium text-ink">{crumb ?? fallback}</span>
      </div>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => setCmdOpen(true)}
        className="flex h-[26px] w-[260px] cursor-text items-center gap-2 rounded-[7px] border border-line bg-surf px-2 hover:border-acc"
      >
        <span className="flex-1 text-left text-xs text-faint">Search everything…</span>
        <span className="rounded-[3px] border border-line px-1 py-px font-mono text-[9.5px] text-faint">⌘K</span>
      </button>
      <form action={logoutAction}>
        <button type="submit" className="flex h-[26px] items-center gap-1.5 rounded-[7px] border border-line bg-surf px-[9px] text-xs font-medium text-ink2 hover:bg-hov">
          Lock
        </button>
      </form>
    </header>
  )
}

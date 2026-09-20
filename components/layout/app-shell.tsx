"use client"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { AutoRefresh } from "@/components/common/auto-refresh"
import { MODULES, HOME_NAV } from "@/lib/constant"
import type { IndexStatus } from "@/lib/types"
import { useRecentsStore } from "@/stores/recents-store"
import { useUiStore } from "@/stores/ui-store"
import { AppHeader } from "./app-header"
import { AppSidebar } from "./app-sidebar"
import { CommandPalette } from "./command-palette"

interface AppShellProps {
  sizes: Record<string, number>
  index: IndexStatus
  children: React.ReactNode
}

const SHORTCUT_ROUTES: Record<string, string> = {
  [HOME_NAV.shortcut]: HOME_NAV.href,
  ...Object.fromEntries(MODULES.filter((m) => m.shortcut).map((m) => [m.shortcut as string, m.href])),
}

/** Floating sidebar + slim top bar + ⌘K palette, and the global keyboard shortcuts. */
export function AppShell({ sizes, index, children }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()
  const loadRail = useUiStore((s) => s.loadRail)
  const toggleRail = useUiStore((s) => s.toggleRail)
  const setCmdOpen = useUiStore((s) => s.setCmdOpen)
  const crumb = useUiStore((s) => s.crumb)
  const loadRecents = useRecentsStore((s) => s.load)
  const pushRecent = useRecentsStore((s) => s.push)

  useEffect(() => {
    loadRail()
    loadRecents()
  }, [loadRail, loadRecents])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setCmdOpen(true)
        return
      }
      if (e.key === "Escape") {
        setCmdOpen(false)
        return
      }
      const target = e.target as HTMLElement | null
      if (target && /input|textarea|select/i.test(target.tagName)) return
      if (target?.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "[" || e.key === "]") {
        toggleRail()
        return
      }
      const route = SHORTCUT_ROUTES[e.key.toLowerCase()]
      if (route) router.push(route)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [router, setCmdOpen, toggleRail])

  // Remember where the user has been ("Pick up where you left off").
  useEffect(() => {
    if (!crumb || pathname === "/") return
    const current = MODULES.find((m) => pathname.startsWith(m.href))
    const qs = search.toString()
    pushRecent({ label: crumb, href: qs ? `${pathname}?${qs}` : pathname, moduleId: current?.id ?? "home", kind: current?.kind ?? "neutral" })
  }, [crumb, pathname, search, pushRecent])

  return (
    <div className="flex h-svh">
      <AutoRefresh active={index.indexing} />
      <AppSidebar sizes={sizes} index={index} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="relative min-h-0 flex-1 overflow-hidden">
          {children}
          <CommandPalette />
        </main>
      </div>
    </div>
  )
}

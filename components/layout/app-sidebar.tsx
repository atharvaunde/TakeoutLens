"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MoonIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useTransition } from "react"
import { toast } from "sonner"

import { useMounted } from "@/hooks/use-mounted"
import { APP_NAME, GOOGLE_LOGOS, HOME_NAV, MODULES, type ModuleDefinition } from "@/lib/constant"
import { formatBytesCompact, formatNumber, formatRelative } from "@/lib/helper"
import type { IndexStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { startIndexingAction } from "@/server/actions/indexer"
import { useUiStore } from "@/stores/ui-store"

interface AppSidebarProps {
  sizes: Record<string, number>
  index: IndexStatus
}

interface Item {
  key: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Official product icon (replaces the line icon when present). */
  logo?: string
  size?: string
}

function NavRow({ item, active, mini }: { item: Item; active: boolean; mini: boolean }) {
  return (
    <Link
      href={item.href}
      title={item.size ? `${item.label} · ${item.size}` : item.label}
      className={cn(
        "flex items-center gap-[9px] rounded-lg no-underline hover:bg-hov hover:no-underline",
        mini ? "justify-center px-1.5 py-[7px]" : "px-[9px] py-1.5",
        active ? "bg-sel" : "bg-transparent"
      )}
    >
      <span className="flex size-[18px] flex-none items-center justify-center">
        {item.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- small local static icon
          <img src={item.logo} alt="" className={cn("size-[18px] object-contain", !active && "opacity-90")} />
        ) : (
          <item.icon className={cn("size-[17px]", active ? "text-acc" : "text-mute")} />
        )}
      </span>
      {mini ? null : (
        <>
          <span className={cn("flex-1 text-[13px] font-medium", active ? "text-ink" : "text-ink2")}>{item.label}</span>
          {item.size ? <span className="font-mono text-[10px] text-faint">{item.size}</span> : null}
        </>
      )}
    </Link>
  )
}

export function AppSidebar({ sizes, index }: AppSidebarProps) {
  const pathname = usePathname()
  const mini = useUiStore((s) => s.railMini)
  const toggleRail = useUiStore((s) => s.toggleRail)
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const [pending, startTransition] = useTransition()

  const dark = mounted && resolvedTheme === "dark"
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))
  const toItem = (m: ModuleDefinition): Item => ({ key: m.id, label: m.label, href: m.href, icon: m.icon, logo: GOOGLE_LOGOS[m.id], size: formatBytesCompact(sizes[m.id]) })
  const top: Item[] = [
    { key: "home", label: HOME_NAV.label, href: HOME_NAV.href, icon: HOME_NAV.icon },
  ]
  const core = MODULES.filter((m) => m.nav === "core").map(toItem)
  const more = MODULES.filter((m) => m.nav === "more").map(toItem)

  const ThemeIcon = dark ? SunIcon : MoonIcon
  const RailIcon = mini ? PanelLeftOpenIcon : PanelLeftCloseIcon
  const iconButton = (label: string, onClick: () => void, Icon: typeof SunIcon, size: string) => (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={cn("flex flex-none items-center justify-center hover:bg-hov", size)}>
      <Icon className="size-[17px] text-mute" />
    </button>
  )

  const reindex = () =>
    startTransition(async () => {
      const result = await startIndexingAction()
      if (result.status === "finished") toast.success("Index updated", { description: result.run ? `${formatNumber(result.run.totalFiles)} files scanned.` : undefined })
      else toast.info("Indexing started")
    })

  const barColor = index.indexing || pending ? "bg-acc" : "bg-ok"
  const pct = index.indexing || pending ? Math.max(index.percent, 8) : 100

  return (
    <div className={cn("flex-none overflow-hidden p-2.5 transition-[width] duration-[180ms] ease-in-out", mini ? "w-[70px]" : "w-[246px]")}>
      <div className={cn("flex h-full flex-col rounded-[14px] border border-line bg-panel shadow-[0_1px_2px_var(--shadow)]", mini ? "w-[50px]" : "w-[226px]")}>
        <div className={cn("flex items-center gap-2 px-2.5 pt-3 pb-[18px]", mini && "justify-center")}>
          {/* eslint-disable-next-line @next/next/no-img-element -- small local static logo */}
          <img src="/brand/icon.png" alt={APP_NAME} className="size-7 flex-none object-contain" />
          {mini ? null : (
            <>
              <div className="min-w-0 flex-1 whitespace-nowrap text-[15.5px] font-semibold tracking-[-.01em]">
                Takeout<span className="text-acc">Lens</span>
              </div>
              {iconButton(dark ? "Light theme" : "Dark theme", () => setTheme(dark ? "light" : "dark"), ThemeIcon, "size-6 rounded-[7px]")}
              {iconButton("Hide navigation  [", toggleRail, RailIcon, "size-6 rounded-[7px]")}
            </>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-px overflow-y-auto px-2 pb-2">
          {top.map((item) => (
            <NavRow key={item.key} item={item} active={isActive(item.href)} mini={mini} />
          ))}
          {mini ? <div className="mx-1.5 mt-2.5 mb-[9px] h-px bg-line" /> : <div className="px-[9px] pt-1.5 pb-[5px] text-[11px] font-medium text-faint">Core</div>}
          {core.map((item) => (
            <NavRow key={item.key} item={item} active={isActive(item.href)} mini={mini} />
          ))}
          <div className="mx-1.5 mt-3 mb-1 h-px bg-line" />
          {mini ? null : <div className="px-[9px] pt-2 pb-[5px] text-[11px] font-medium text-faint">More</div>}
          {more.map((item) => (
            <NavRow key={item.key} item={item} active={isActive(item.href)} mini={mini} />
          ))}
        </nav>

        {mini ? (
          <div className="flex flex-col items-center gap-[3px] px-1.5 py-2">
            {iconButton(dark ? "Light theme" : "Dark theme", () => setTheme(dark ? "light" : "dark"), ThemeIcon, "size-[34px] rounded-[10px]")}
            {iconButton("Show navigation  [", toggleRail, RailIcon, "size-[34px] rounded-[10px]")}
          </div>
        ) : (
          <div className="flex flex-col gap-[7px] border-t border-line px-3.5 pt-2.5 pb-[11px]" title={index.indexing ? `Indexing ${index.percent}%` : "Index current"}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-mute">{index.indexing || pending ? "Indexing" : "Index"}</span>
              <span className="font-mono text-[10.5px] text-faint">{pct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded bg-line2">
              <div className={cn("h-full transition-[width] duration-300", barColor)} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-faint">
                {index.indexing || pending ? "Reading files…" : `${formatNumber(index.fileCount)} files${index.lastFinishedAt ? ` · ${formatRelative(index.lastFinishedAt)}` : ""}`}
              </span>
              <button type="button" onClick={reindex} disabled={pending || index.indexing} className="text-[11px] font-medium text-acc hover:underline disabled:opacity-60">
                Reindex
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import Link from "next/link"

import { Crumb } from "@/components/layout/crumb"
import { RecentsCard } from "@/components/home/recents-card"
import { MODULES, SHORTCUTS, type ModuleKind } from "@/lib/constant"
import { formatBytes, formatBytesCompact, formatNumber } from "@/lib/helper"
import { getHomeData, getOverview } from "@/server/services/modules"

const STACK_CLASSES = ["bg-stack-1", "bg-stack-2", "bg-stack-3", "bg-stack-4", "bg-stack-5"]
const KIND_ICON_COLOR: Record<ModuleKind, string> = {
  mail: "text-acc", chat: "text-acc", cal: "text-acc", drive: "text-acc", photos: "text-acc", keep: "text-acc", neutral: "text-mute",
}

const Stat = ({ value, unit, label }: { value: string; unit?: string; label: string }) => (
  <div>
    <div className="font-mono text-[22px] font-medium tracking-[-.02em]">
      {value}
      {unit ? <span className="text-[13px] text-faint">{unit}</span> : null}
    </div>
    <div className="mt-px text-[11px] text-faint">{label}</div>
  </div>
)

export default async function HomePage() {
  const [{ modules }, home] = await Promise.all([getOverview(), getHomeData()])
  const [size, sizeUnit] = formatBytes(home.totalBytes).split(" ")
  const span = home.firstYear && home.lastYear ? { value: String(home.firstYear), unit: home.lastYear !== home.firstYear ? `–${String(home.lastYear).slice(2)}` : "" } : null

  return (
    <div className="h-full overflow-y-auto px-7 pt-[26px] pb-11">
      <Crumb value="overview" />
      <div className="w-full">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-1.5 font-mono text-[10.5px] tracking-[.16em] text-faint uppercase">Archive overview</div>
            <div className="text-[27px] leading-[1.1] font-semibold tracking-[-.03em]">Everything Google kept.</div>
          </div>
          <div className="flex items-end gap-[26px]">
            <Stat value={size} unit={` ${sizeUnit}`} label="total size" />
            <Stat value={formatNumber(home.totalFiles)} label="files" />
            {span ? <Stat value={span.value} unit={span.unit} label="span" /> : null}
          </div>
        </div>

        <div className="mt-[18px] flex h-[7px] overflow-hidden rounded border border-line">
          {home.stack.map((segment, i) => (
            <div key={segment.name} title={segment.name} className={STACK_CLASSES[i]} style={{ width: `${segment.percent}%` }} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-3.5">
          {home.stack.map((segment, i) => (
            <div key={segment.name} className="flex items-center gap-[5px] text-[11.5px] text-mute">
              <span className={`size-[7px] rounded-[2px] ${STACK_CLASSES[i]}`} />
              {segment.name}
              <span className="font-mono text-faint">{formatBytes(segment.bytes)}</span>
            </div>
          ))}
        </div>

        <div className="mt-7 flex items-baseline justify-between">
          <div className="font-mono text-[10.5px] tracking-[.16em] text-faint uppercase">Sources</div>
          <div className="text-[11.5px] text-faint">
            {home.parsed} parsed · {home.errors} errors
          </div>
        </div>
        <div className="mt-2.5 grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-2">
          {MODULES.map((module) => {
            const status = modules.find((m) => m.module.id === module.id)
            const missing = status?.state === "missing"
            const card = (
              <div className={`flex flex-col gap-2.5 rounded-xl border border-line bg-surf px-3 py-[11px] ${missing ? "opacity-60" : "hover:border-acc"}`}>
                <div className="flex items-center justify-between">
                  <span className="flex size-[30px] items-center justify-center rounded-[9px] border border-line bg-panel">
                    <module.icon className={`size-4 ${KIND_ICON_COLOR[module.kind]}`} />
                  </span>
                  <span className="font-mono text-sm font-medium text-ink2">{formatBytesCompact(status?.totalBytes ?? 0)}</span>
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold tracking-[-.01em]">{module.label}</div>
                  <div className="mt-0.5 text-[11.5px] text-faint">{missing ? "Not in this export" : home.metas[module.id]}</div>
                </div>
              </div>
            )
            return missing ? (
              <div key={module.id}>{card}</div>
            ) : (
              <Link key={module.id} href={module.href} className="no-underline hover:no-underline">
                {card}
              </Link>
            )
          })}
        </div>

        <div className="mt-[30px] grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-2.5">
          <RecentsCard />
          <div className="rounded-xl border border-line bg-surf p-3.5">
            <div className="font-mono text-[10px] tracking-[.14em] text-faint uppercase">Shortcuts</div>
            <div className="mt-2.5 grid grid-cols-2 gap-x-3.5 gap-y-[7px]">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center gap-2">
                  <span className="min-w-[26px] rounded-[3px] border border-line px-[5px] py-0.5 text-center font-mono text-[10px] text-ink2">{shortcut.key}</span>
                  <span className="text-xs text-mute">{shortcut.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

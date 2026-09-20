import Link from "next/link"

import { Crumb } from "@/components/layout/crumb"
import { RecentsCard } from "@/components/home/recents-card"
import { GOOGLE_LOGOS, MODULES, STORAGE_OTHER_CLASS, STORAGE_SEGMENT_CLASSES, type ModuleKind } from "@/lib/constant"
import { formatBytes, formatBytesCompact, formatNumber } from "@/lib/helper"
import { getHomeData, getOverview } from "@/server/services/modules"

const segmentClass = (id: string) => STORAGE_SEGMENT_CLASSES[id] ?? STORAGE_OTHER_CLASS
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

        <div className="mt-[18px] flex h-2 overflow-hidden rounded-full">
          {home.stack.map((segment) => (
            <div key={segment.id} title={`${segment.name} · ${formatBytes(segment.bytes)}`} className={`${segmentClass(segment.id)} h-full min-w-px`} style={{ width: `${segment.percent}%` }} />
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-4">
          {home.stack.map((segment) => (
            <div key={segment.id} className="flex items-center gap-1.5 text-[12px] text-mute">
              <span className={`size-2 rounded-full ${segmentClass(segment.id)}`} />
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
                    {GOOGLE_LOGOS[module.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element -- small local static icon
                      <img src={GOOGLE_LOGOS[module.id]} alt="" className="size-[18px] object-contain" />
                    ) : (
                      <module.icon className={`size-4 ${KIND_ICON_COLOR[module.kind]}`} />
                    )}
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

        <div className="mt-[30px] grid grid-cols-1 gap-2.5">
          <RecentsCard />
        </div>
      </div>
    </div>
  )
}

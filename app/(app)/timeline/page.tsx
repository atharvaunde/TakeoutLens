import Link from "next/link"

import { Crumb } from "@/components/layout/crumb"
import { UrlOptionGroup } from "@/components/common/url-option-group"
import { MODULES, TIMELINE, type TimelineSource } from "@/lib/constant"
import { formatDate, formatTime } from "@/lib/helper"
import { getTimeline } from "@/server/services/timeline"

export default async function TimelinePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  const sourceParam = typeof query.source === "string" ? query.source : "all"
  const source: TimelineSource = TIMELINE.sources.some((s) => s.value === sourceParam) ? (sourceParam as TimelineSource) : "all"
  const before = typeof query.before === "string" && /^\d{1,15}$/.test(query.before) ? Number(query.before) : undefined
  const { items, next } = await getTimeline(source, before)

  const more = new URLSearchParams()
  if (source !== "all") more.set("source", source)
  if (next) more.set("before", String(next))

  return (
    <div className="h-full overflow-y-auto px-7 pt-6 pb-11">
      <Crumb value="timeline" />
      <div className="w-full">
        <div className="font-mono text-[10.5px] tracking-[.16em] text-faint uppercase">Across all sources</div>
        <div className="mt-[5px] text-2xl font-semibold tracking-[-.025em]">Timeline</div>
        <UrlOptionGroup className="mt-3.5" param="source" value={source} defaultValue="all" resetParams={["before"]} variant="pill-mono" options={TIMELINE.sources} />

        <div className="mt-5">
          {items.length === 0 ? <div className="py-10 text-center text-[13px] text-faint">Nothing here yet.</div> : null}
          {items.map((item) => {
            const owner = MODULES.find((m) => m.id === item.moduleId)
            return (
              <div key={item.id} className="grid grid-cols-[76px_1fr] gap-3.5">
                <div className="pt-[11px] text-right font-mono text-[10.5px] text-faint">{formatDate(item.ts, { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" })}</div>
                <Link href={item.href} className="relative block border-l border-line py-2.5 pr-0 pl-4 text-ink no-underline hover:bg-hov hover:no-underline">
                  <span className="absolute top-[15px] -left-1 size-[7px] rounded-full border-2 border-background bg-acc" />
                  <div className="flex items-baseline gap-2">
                    <span className="flex size-[18px] flex-none items-center justify-center">{owner ? <owner.icon className="size-[15px] text-mute" /> : null}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{item.title}</span>
                    <span className="font-mono text-[10px] text-faint">{formatTime(item.ts, { hour12: false, timeZone: "UTC" })}</span>
                  </div>
                  <div className="mt-[3px] truncate text-xs text-mute">{item.sub}</div>
                </Link>
              </div>
            )
          })}
        </div>
        {next ? (
          <div className="mt-4 flex justify-center">
            <Link href={`/timeline?${more.toString()}`} className="rounded-lg border border-line bg-surf px-3 py-1.5 text-[12.5px] font-medium text-ink no-underline hover:bg-hov hover:no-underline">
              Older
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}

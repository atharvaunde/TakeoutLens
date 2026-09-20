"use client"

import Link from "next/link"

import { GOOGLE_LOGOS, MODULES } from "@/lib/constant"
import { formatShortAgo } from "@/lib/helper"
import { useRecentsStore } from "@/stores/recents-store"

/** "Pick up where you left off": places opened in this browser. */
export function RecentsCard() {
  const items = useRecentsStore((s) => s.items)
  return (
    <div className="rounded-xl border border-line bg-surf p-3.5">
      <div className="font-mono text-[10px] tracking-[.14em] text-faint uppercase">Pick up where you left off</div>
      <div className="mt-2.5 flex flex-col gap-px">
        {items.length === 0 ? <div className="px-[7px] py-1.5 text-xs text-faint">Nothing opened yet.</div> : null}
        {items.slice(0, 4).map((item) => {
          const owner = MODULES.find((m) => m.id === item.moduleId)
          const Icon = owner?.icon
          const logo = GOOGLE_LOGOS[item.moduleId]
          return (
            <Link key={item.href} href={item.href} className="flex items-center gap-[9px] rounded-[7px] px-[7px] py-1.5 text-ink no-underline hover:bg-hov hover:no-underline">
              <span className="flex size-5 flex-none items-center justify-center">{logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small local static icon
                  <img src={logo} alt="" className="size-4 object-contain" />
                ) : Icon ? (
                  <Icon className="size-3.5 text-mute" />
                ) : null}</span>
              <span className="min-w-0 flex-1 truncate text-[12.5px]">{item.label}</span>
              <span className="font-mono text-[10px] text-faint">{formatShortAgo(item.at)}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

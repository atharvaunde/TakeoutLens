"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { TABLE_PARAMS } from "@/lib/constant"
import { cn } from "@/lib/utils"

interface SortChipsProps {
  options: readonly { value: string; label: string; defaultDir?: "asc" | "desc" }[]
  /** Sort used when the URL has none. */
  fallback: string
}

/** Small mono sort toggles ("Date ↓", "Sender") that drive the `sort`/`dir` URL params. */
export function SortChips({ options, fallback }: SortChipsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = searchParams.get(TABLE_PARAMS.sort) ?? fallback
  const dir = (searchParams.get(TABLE_PARAMS.dir) ?? options.find((o) => o.value === active)?.defaultDir ?? "desc") as "asc" | "desc"

  return (
    <div className="flex gap-[3px] font-mono text-[9.5px] text-mute">
      {options.map((option) => {
        const on = option.value === active
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set(TABLE_PARAMS.sort, option.value)
              params.set(TABLE_PARAMS.dir, on ? (dir === "desc" ? "asc" : "desc") : (option.defaultDir ?? "asc"))
              params.delete(TABLE_PARAMS.page)
              router.push(`${pathname}?${params.toString()}`)
            }}
            className={cn("cursor-pointer rounded-[4px] border border-line px-1.5 py-0.5 hover:bg-hov", on && "bg-sel text-ink")}
          >
            {option.label}
            {on ? (dir === "desc" ? " ↓" : " ↑") : ""}
          </button>
        )
      })}
    </div>
  )
}

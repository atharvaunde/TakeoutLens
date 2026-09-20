"use client"

import { cn } from "@/lib/utils"

export type OptionVariant = "pill-mono" | "pill" | "tab" | "segment" | "segment-mono"

interface OptionGroupProps<T extends string> {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  variant?: OptionVariant
  className?: string
}

const ITEM: Record<OptionVariant, string> = {
  "pill-mono": "rounded-full border px-[9px] py-[3px] font-mono text-[10.5px] tracking-[.04em]",
  pill: "rounded-full border px-[9px] py-[3px] text-[11.5px] font-medium",
  tab: "rounded-[7px] border px-[11px] py-1 text-[11.5px] font-medium",
  segment: "border-l border-line px-2.5 py-1 text-[11.5px] font-medium first:border-l-0",
  "segment-mono": "border-l border-line px-[9px] py-1 font-mono text-[10.5px] first:border-l-0",
}

const ACTIVE: Record<OptionVariant, string> = {
  "pill-mono": "border-ink bg-ink text-background",
  pill: "border-ink bg-ink text-background",
  tab: "border-line bg-sel text-ink",
  segment: "bg-sel text-ink",
  "segment-mono": "bg-sel text-ink",
}

const INACTIVE: Record<OptionVariant, string> = {
  "pill-mono": "border-line bg-transparent text-mute",
  pill: "border-line bg-transparent text-mute",
  tab: "border-line bg-surf text-mute",
  segment: "bg-surf text-mute",
  "segment-mono": "bg-surf text-mute",
}

/** Design-system option switcher: pills, tabs and joined segments. */
export function OptionGroup<T extends string>({ options, value, onChange, variant = "tab", className }: OptionGroupProps<T>) {
  const joined = variant === "segment" || variant === "segment-mono"
  return (
    <div className={cn("flex", joined ? "overflow-hidden rounded-[7px] border border-line" : variant === "tab" ? "gap-1" : "flex-wrap gap-[5px]", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn("cursor-pointer", ITEM[variant], option.value === value ? ACTIVE[variant] : INACTIVE[variant])}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

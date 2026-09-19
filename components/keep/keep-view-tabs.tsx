"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { KEEP, type KeepView } from "@/lib/constant"

const LABELS: Record<KeepView, string> = { notes: "Notes", archived: "Archive", trash: "Trash" }

export function KeepViewTabs({ value }: { value: KeepView }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(next) => {
        if (!next) return
        const params = new URLSearchParams(searchParams.toString())
        if (next === "notes") params.delete("view")
        else params.set("view", next)
        router.push(`${pathname}?${params.toString()}`)
      }}
    >
      {KEEP.views.map((view) => (
        <ToggleGroupItem key={view} value={view}>
          {LABELS[view]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

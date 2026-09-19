"use client"

import { LayoutGridIcon, ListIcon } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DRIVE_VIEWS, type DriveView } from "@/lib/constant"

const OPTIONS: Record<DriveView, { label: string; icon: typeof ListIcon }> = {
  list: { label: "List view", icon: ListIcon },
  grid: { label: "Card view", icon: LayoutGridIcon },
}

export function ViewToggle({ value, onChange }: { value: DriveView; onChange: (view: DriveView) => void }) {
  return (
    <ToggleGroup type="single" variant="outline" value={value} onValueChange={(next) => next && onChange(next as DriveView)}>
      {DRIVE_VIEWS.map((view) => {
        const { label, icon: Icon } = OPTIONS[view]
        return (
          <ToggleGroupItem key={view} value={view} aria-label={label}>
            <Icon />
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}

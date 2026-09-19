"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CHAT, type ChatKind } from "@/lib/constant"

const LABELS: Record<ChatKind, string> = { all: "All", DM: "Direct", Space: "Spaces" }

export function ChatKindTabs({ value }: { value: ChatKind }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(next) => {
        if (!next) return
        const params = new URLSearchParams(searchParams.toString())
        if (next === "all") params.delete("kind")
        else params.set("kind", next)
        router.push(`${pathname}?${params.toString()}`)
      }}
    >
      {CHAT.kinds.map((kind) => (
        <ToggleGroupItem key={kind} value={kind}>
          {LABELS[kind]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

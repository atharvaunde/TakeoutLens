"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TABLE_PARAMS } from "@/lib/constant"

interface TabLinksProps {
  param: string
  value: string
  options: readonly { value: string; label: string }[]
}

/** URL-driven segmented control (the server page renders the selected tab). Resets paging/search on change. */
export function TabLinks({ param, value, options }: TabLinksProps) {
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
        for (const key of [TABLE_PARAMS.page, TABLE_PARAMS.search, TABLE_PARAMS.sort, TABLE_PARAMS.dir]) params.delete(key)
        params.set(param, next)
        router.push(`${pathname}?${params.toString()}`)
      }}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

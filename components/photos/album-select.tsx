"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FILTER_ALL_VALUE } from "@/lib/constant"
import { formatNumber } from "@/lib/helper"

export function AlbumSelect({ albums, value }: { albums: { album: string; count: number }[]; value: string | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return (
    <Select
      value={value ?? FILTER_ALL_VALUE}
      onValueChange={(next) => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("page")
        if (next === FILTER_ALL_VALUE) params.delete("album")
        else params.set("album", next)
        router.push(`${pathname}?${params.toString()}`)
      }}
    >
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Album" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={FILTER_ALL_VALUE}>All photos</SelectItem>
          {albums.map((a) => (
            <SelectItem key={a.album} value={a.album}>
              {a.album} ({formatNumber(a.count)})
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

"use client"

import { useState } from "react"

import { UrlPagination } from "@/components/data-table/url-pagination"
import { formatDate, pluralize } from "@/lib/helper"
import { PhotoViewer, type PhotoTarget } from "./photo-viewer"
import type { PhotoItem } from "@/lib/types"

/** Photos grouped by month (taken date): a heading with count, then a grid of square tiles. Click opens the full image. */
export function PhotoGallery({ photos, total }: { photos: PhotoItem[]; total: number }) {
  const [preview, setPreview] = useState<PhotoTarget | null>(null)

  if (photos.length === 0) return <div className="py-16 text-center text-[13px] text-faint">No photos here.</div>

  const groups = new Map<string, PhotoItem[]>()
  for (const photo of photos) {
    const key = formatDate(photo.takenAt, { month: "long", year: "numeric", day: undefined, timeZone: "UTC" })
    groups.set(key, [...(groups.get(key) ?? []), photo])
  }

  return (
    <div className="flex flex-col">
      {[...groups].map(([month, items]) => (
        <section key={month} className="mb-[22px]">
          <div className="flex items-baseline gap-2.5 border-b border-line2 pb-[7px]">
            <span className="text-[13px] font-semibold">{month}</span>
            <span className="font-mono text-[10.5px] text-faint">{pluralize(items.length, "item")}</span>
          </div>
          <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-[5px]">
            {items.map((photo) => (
              <button
                key={photo.id}
                type="button"
                title={`${photo.title} · ${formatDate(photo.takenAt, { timeZone: "UTC" })}`}
                onClick={() => setPreview({ fileId: photo.id, name: photo.title })}
                className="bg-stripes group relative flex aspect-square cursor-pointer items-end overflow-hidden rounded-[4px] p-1.5 hover:outline-2 hover:-outline-offset-2 hover:outline-acc"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- cached local thumbnail */}
                <img src={`/thumb/${photo.id}`} alt={photo.title} loading="lazy" className="absolute inset-0 size-full object-cover" />
                <span className="relative hidden max-w-full truncate rounded-[3px] bg-surf px-[5px] py-px font-mono text-[9px] text-mute group-hover:block">{photo.title}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <UrlPagination rowCount={total} compact />
      <PhotoViewer target={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

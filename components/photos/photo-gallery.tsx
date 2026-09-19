"use client"

import { useState } from "react"
import { MapPinIcon } from "lucide-react"

import { MediaLightbox, type MediaTarget } from "@/components/common/media-lightbox"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { useTableUrlState } from "@/components/data-table/use-table-url-state"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { PHOTOS, TABLE_PARAMS } from "@/lib/constant"
import { formatDate } from "@/lib/helper"
import type { PhotoItem } from "@/lib/types"

const NO_FILTERS: never[] = []
const PAGE_SIZE_OPTIONS = [PHOTOS.pageSize] as const

/** Photos grouped by month (taken date); thumbnails are cached locally, click opens the full image. */
export function PhotoGallery({ photos, total }: { photos: PhotoItem[]; total: number }) {
  const [preview, setPreview] = useState<MediaTarget | null>(null)
  const { params, update } = useTableUrlState(NO_FILTERS)

  if (photos.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No photos</EmptyTitle>
          <EmptyDescription>Nothing found for this album.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const groups = new Map<string, PhotoItem[]>()
  for (const photo of photos) {
    const key = formatDate(photo.takenAt, { month: "long", year: "numeric", day: undefined, timeZone: "UTC" })
    groups.set(key, [...(groups.get(key) ?? []), photo])
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups].map(([month, items]) => (
        <section key={month} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">{month}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
            {items.map((photo) => (
              <button
                key={photo.id}
                type="button"
                title={`${photo.title} · ${formatDate(photo.takenAt, { timeZone: "UTC" })}`}
                onClick={() => setPreview({ fileId: photo.id, name: photo.title, kind: "image" })}
                className="group relative aspect-square overflow-hidden rounded-md bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- cached local thumbnail */}
                <img src={`/thumb/${photo.id}`} alt={photo.title} loading="lazy" className="size-full object-cover transition-transform group-hover:scale-105" />
                {photo.hasLocation ? <MapPinIcon className="absolute right-1.5 bottom-1.5 size-4 text-white drop-shadow" /> : null}
              </button>
            ))}
          </div>
        </section>
      ))}
      <DataTablePagination
        page={params.page}
        pageSize={PHOTOS.pageSize}
        pageCount={Math.max(Math.ceil(total / PHOTOS.pageSize), 1)}
        rowCount={total}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageChange={(page) => update({ [TABLE_PARAMS.page]: String(page) }, true)}
        onPageSizeChange={() => undefined}
      />
      <MediaLightbox target={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

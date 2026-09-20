"use client"

import { useState } from "react"

import { videoColumns, type VideoRow } from "@/columns/youtube-videos.column"
import { MediaLightbox, type MediaTarget } from "@/components/common/media-lightbox"
import { DataTable } from "@/components/data-table/data-table"

/** Click a row to play the video from the export (only rows whose file exists). */
export function VideosTable({ rows, total }: { rows: VideoRow[]; total: number }) {
  const [playing, setPlaying] = useState<MediaTarget | null>(null)
  return (
    <>
      <DataTable
        columns={videoColumns}
        data={rows}
        rowCount={total}
        rowIdKey="id"
        onRowClick={(row) => row.fileId !== null && setPlaying({ fileId: row.fileId, name: row.title, kind: "video" })}
        emptyTitle="No videos"
      />
      <MediaLightbox target={playing} onClose={() => setPlaying(null)} />
    </>
  )
}

"use client"

import { PlayIcon } from "lucide-react"
import { createColumnHelper } from "@tanstack/react-table"

import type { DataTableFeatures } from "@/components/data-table/features"
import { Badge } from "@/components/ui/badge"
import { formatBytes, formatDate, formatDuration } from "@/lib/helper"

export interface VideoRow {
  id: string
  title: string
  durationMs: number | null
  privacy: string
  state: string
  createdAt: string | null
  fileId: number | null
  size: number | null
}

const helper = createColumnHelper<DataTableFeatures, VideoRow>()

export const videoColumns = helper.columns([
  helper.accessor("title", {
    header: "Title",
    cell: (info) => (
      <div className="flex items-center gap-2">
        <PlayIcon className={info.row.original.fileId ? "size-4 shrink-0" : "size-4 shrink-0 text-muted-foreground/40"} />
        <span className="font-medium">{info.getValue()}</span>
        {info.row.original.fileId === null ? <Badge variant="outline">file missing</Badge> : null}
      </div>
    ),
  }),
  helper.accessor("durationMs", { header: "Length", cell: (info) => (info.getValue() ? formatDuration(info.getValue()! / 1000) : "—") }),
  helper.accessor("privacy", { header: "Privacy", enableSorting: false }),
  helper.accessor("createdAt", { header: "Uploaded", cell: (info) => formatDate(info.getValue()) }),
  helper.accessor("size", { header: "Size", cell: (info) => formatBytes(info.getValue()) }),
])

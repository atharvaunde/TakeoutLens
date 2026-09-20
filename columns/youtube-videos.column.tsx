"use client"

import { createColumnHelper } from "@tanstack/react-table"

import type { DataTableFeatures } from "@/components/data-table/features"
import { formatBytesFixed, formatDate, formatDuration } from "@/lib/helper"
import { cn } from "@/lib/utils"

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
const mono = "font-mono text-[11.5px] whitespace-pre text-mute"

export const videoColumns = helper.columns([
  helper.accessor("title", {
    header: "Title",
    cell: (info) => (
      <span className={cn("text-[13px]", info.row.original.fileId ? "text-ink" : "text-faint")}>
        ▶  {info.getValue()}
        {info.row.original.fileId === null ? <span className="ml-2 font-mono text-[10px] text-faint">file missing</span> : null}
      </span>
    ),
  }),
  helper.accessor("durationMs", { header: "Length", cell: (info) => <span className={mono}>{info.getValue() ? formatDuration(info.getValue()! / 1000, { fixed: true }) : "—"}</span> }),
  helper.accessor("privacy", {
    header: "Privacy",
    enableSorting: false,
    cell: (info) => <span className={cn("font-mono text-[11px]", info.getValue() === "Private" ? "text-acc" : "text-faint")}>{info.getValue() || "—"}</span>,
  }),
  helper.accessor("createdAt", { header: "Uploaded", cell: (info) => <span className={mono}>{formatDate(info.getValue())}</span> }),
  helper.accessor("size", { header: "Size", cell: (info) => <span className={mono}>{formatBytesFixed(info.getValue())}</span> }),
])

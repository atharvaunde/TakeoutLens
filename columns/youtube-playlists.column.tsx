"use client"

import { createColumnHelper } from "@tanstack/react-table"

import type { DataTableFeatures } from "@/components/data-table/features"
import { formatDate } from "@/lib/helper"

export interface PlaylistRow {
  id: string
  title: string
  visibility: string
  createdAt: string | null
  updatedAt: string | null
}

const helper = createColumnHelper<DataTableFeatures, PlaylistRow>()

export const playlistColumns = helper.columns([
  helper.accessor("title", { header: "Playlist", cell: (info) => <span className="text-[13px] text-ink">{info.getValue()}</span> }),
  helper.accessor("visibility", { header: "Visibility", enableSorting: false }),
  helper.accessor("createdAt", { header: "Created", enableSorting: false, cell: (info) => <span className="font-mono text-[11.5px] text-mute">{formatDate(info.getValue())}</span> }),
  helper.accessor("updatedAt", { header: "Updated", enableSorting: false, cell: (info) => <span className="font-mono text-[11.5px] text-mute">{formatDate(info.getValue())}</span> }),
])

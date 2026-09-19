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
  helper.accessor("title", { header: "Playlist" }),
  helper.accessor("visibility", { header: "Visibility", enableSorting: false }),
  helper.accessor("createdAt", { header: "Created", enableSorting: false, cell: (info) => formatDate(info.getValue()) }),
  helper.accessor("updatedAt", { header: "Updated", enableSorting: false, cell: (info) => formatDate(info.getValue()) }),
])

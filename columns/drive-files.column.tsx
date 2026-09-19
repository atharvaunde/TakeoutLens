"use client"

import { createColumnHelper } from "@tanstack/react-table"

import { DriveNameCell } from "@/components/drive/drive-name-cell"
import type { DataTableFeatures } from "@/components/data-table/features"
import type { FileKind } from "@/lib/helper"
import { formatBytes, formatDateTime, formatNumber } from "@/lib/helper"

export interface DriveRow {
  id: string
  kind: "file" | "folder"
  fileId: number | null
  name: string
  fileKind: FileKind
  /** Folder the file lives in (shown for search results). */
  location: string
  /** For folder rows: the path to open. */
  folderPath: string
  size: number | null
  modifiedAt: string | null
  itemCount?: number
}

const helper = createColumnHelper<DataTableFeatures, DriveRow>()

export const driveColumns = helper.columns([
  helper.accessor("name", {
    header: "Name",
    cell: (info) => <DriveNameCell row={info.row.original} />,
  }),
  helper.accessor("location", { header: "Folder", enableSorting: false, cell: (info) => info.getValue() || "" }),
  helper.accessor("size", {
    header: "Size",
    cell: (info) =>
      info.row.original.kind === "folder" ? `${formatNumber(info.row.original.itemCount ?? 0)} items` : formatBytes(info.getValue()),
  }),
  helper.accessor("modifiedAt", { header: "Modified", cell: (info) => formatDateTime(info.getValue()) }),
])

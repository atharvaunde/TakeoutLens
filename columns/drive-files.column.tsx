"use client"

import { createColumnHelper } from "@tanstack/react-table"

import { DriveNameCell } from "@/components/drive/drive-name-cell"
import type { DataTableFeatures } from "@/components/data-table/features"
import type { FileKind } from "@/lib/helper"
import { formatBytes, formatDate, formatNumber } from "@/lib/helper"

export interface DriveRow {
  id: string
  kind: "file" | "folder"
  fileId: number | null
  name: string
  fileKind: FileKind
  /** Folder the file lives in (search results only; drives "Open containing folder"). */
  location: string
  /** Display name of the containing folder (the "Folder" column). */
  parent: string
  /** Chip label: DIR or the file extension. */
  kindLabel: string
  /** For folder rows: the path to open. */
  folderPath: string
  size: number | null
  modifiedAt: string | null
  itemCount?: number
}

const helper = createColumnHelper<DataTableFeatures, DriveRow>()

export const driveColumns = helper.columns([
  helper.accessor("name", { header: "Name", cell: (info) => <DriveNameCell row={info.row.original} /> }),
  helper.accessor("parent", { header: "Folder", enableSorting: false, cell: (info) => <span className="block max-w-64 truncate text-xs text-faint">{info.getValue()}</span> }),
  helper.accessor("size", {
    header: "Size",
    cell: (info) => (
      <span className="font-mono text-[11px] text-mute">
        {info.row.original.kind === "folder" ? `${formatNumber(info.row.original.itemCount ?? 0)} ${info.row.original.itemCount === 1 ? "item" : "items"}` : formatBytes(info.getValue())}
      </span>
    ),
  }),
  helper.accessor("modifiedAt", { header: "Modified", cell: (info) => <span className="font-mono text-[11px] text-faint">{formatDate(info.getValue(), { day: "2-digit" })}</span> }),
])

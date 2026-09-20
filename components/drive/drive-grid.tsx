"use client"

import type { DriveRow } from "@/columns/drive-files.column"
import { formatBytes, formatNumber } from "@/lib/helper"
import { cn } from "@/lib/utils"
import { DriveContextMenu, type DriveActions } from "./drive-context-menu"
import { FileTypeIcon } from "@/components/common/file-type-icon"
import { KindChip } from "./kind-chip"

interface DriveGridProps {
  rows: DriveRow[]
  selectedId: string | null
  actions: DriveActions
  emptyText: string
  canView?: boolean
}

/** Cards: striped preview with a kind chip (images show a cached thumbnail), name and size below. */
export function DriveGrid({ rows, selectedId, actions, emptyText, canView = false }: DriveGridProps) {
  if (rows.length === 0) return <div className="rounded-xl border border-line py-10 text-center text-[13px] text-faint">{emptyText}</div>
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(148px,1fr))] gap-2">
      {rows.map((row) => {
        const card = (
          <div
            tabIndex={0}
            role="button"
            aria-label={row.name}
            aria-pressed={selectedId === row.id}
            title={`${row.name} · ${row.mime}`}
            onClick={() => actions.select(row)}
            onDoubleClick={() => actions.open(row)}
            onKeyDown={(event) => event.key === "Enter" && actions.open(row)}
            className={cn("cursor-pointer overflow-hidden rounded-xl border border-line bg-surf select-none hover:border-acc", selectedId === row.id && "border-acc")}
          >
            <div className="bg-stripes relative flex h-[84px] items-center justify-center">
              {row.kind === "file" && row.fileKind === "image" && row.fileId !== null ? (
                // eslint-disable-next-line @next/next/no-img-element -- cached local thumbnail
                <img src={`/thumb/${row.fileId}`} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <FileTypeIcon name={row.name} isFolder={row.kind === "folder"} className="size-[30px] text-mute" />
                  <KindChip label={row.kindLabel} className="px-1.5 text-[9.5px] tracking-[.06em]" />
                </div>
              )}
            </div>
            <div className="border-t border-line2 px-[9px] py-2">
              <div className="truncate text-xs font-medium">{row.name}</div>
              <div className="mt-0.5 font-mono text-[10px] text-faint">
                {row.kind === "folder" ? `${formatNumber(row.itemCount ?? 0)} ${row.itemCount === 1 ? "item" : "items"}` : formatBytes(row.size)}
              </div>
            </div>
          </div>
        )
        return (
          <DriveContextMenu key={row.id} row={row} actions={actions} canView={canView}>
            {card}
          </DriveContextMenu>
        )
      })}
    </div>
  )
}

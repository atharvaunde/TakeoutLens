"use client"

import type { DriveRow } from "@/columns/drive-files.column"
import { FileTypeIcon } from "@/components/common/file-type-icon"
import { Card } from "@/components/ui/card"
import { formatBytes, formatDate, formatNumber } from "@/lib/helper"
import { cn } from "@/lib/utils"
import { DriveContextMenu, type DriveActions } from "./drive-context-menu"

interface DriveGridProps {
  rows: DriveRow[]
  selectedId: string | null
  actions: DriveActions
  emptyText: string
  canView?: boolean
}

/** Card view: folders as tiles, images with a cached thumbnail, other files with a type icon. */
export function DriveGrid({ rows, selectedId, actions, emptyText, canView = false }: DriveGridProps) {
  if (rows.length === 0) {
    return <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">{emptyText}</div>
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-3">
      {rows.map((row) => {
        const card = (
          <Card
            tabIndex={0}
            role="button"
            aria-label={row.name}
            aria-pressed={selectedId === row.id}
            onClick={() => actions.select(row)}
            onDoubleClick={() => actions.open(row)}
            onKeyDown={(event) => {
              if (event.key === "Enter") actions.open(row)
            }}
            className={cn(
              "cursor-pointer select-none gap-0 overflow-hidden py-0 transition-colors hover:bg-muted/50",
              selectedId === row.id && "ring-2 ring-primary"
            )}
          >
            <div className="flex aspect-video items-center justify-center bg-muted/40">
              {row.kind === "file" && row.fileKind === "image" && row.fileId !== null ? (
                // eslint-disable-next-line @next/next/no-img-element -- cached local thumbnail
                <img src={`/thumb/${row.fileId}`} alt="" loading="lazy" className="size-full object-cover" />
              ) : (
                <FileTypeIcon name={row.name} isFolder={row.kind === "folder"} className="size-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-0.5 p-3">
              <span className="truncate text-sm font-medium">{row.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {row.kind === "folder"
                  ? `${formatNumber(row.itemCount ?? 0)} items`
                  : `${formatBytes(row.size)} · ${formatDate(row.modifiedAt)}`}
              </span>
            </div>
          </Card>
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

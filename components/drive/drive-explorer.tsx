"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { driveColumns, type DriveRow } from "@/columns/drive-files.column"
import { MediaLightbox, type MediaTarget } from "@/components/common/media-lightbox"
import { ViewToggle } from "@/components/common/view-toggle"
import { DataTable } from "@/components/data-table/data-table"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { useTableUrlState } from "@/components/data-table/use-table-url-state"
import { PAGINATION, TABLE_PARAMS } from "@/lib/constant"
import { triggerDownload } from "@/lib/helper"
import { useDriveStore } from "@/stores/drive-store"
import { DriveContextMenu, type DriveActions } from "./drive-context-menu"
import { DriveGrid } from "./drive-grid"

interface DriveExplorerProps {
  rows: DriveRow[]
  total: number
  folder: string
  searching: boolean
}

const NO_FILTERS: never[] = []
const LOCATION_COLUMN_ID = "location"

/**
 * Google-Drive-style browser: click selects, double-click / Enter opens (folder -> navigate,
 * image/video -> preview, other -> download), right-click opens a context menu, and the
 * view toggles between a table (list) and cards (grid). All data comes from the server page.
 */
export function DriveExplorer({ rows, total, folder, searching }: DriveExplorerProps) {
  const router = useRouter()
  const view = useDriveStore((state) => state.view)
  const setView = useDriveStore((state) => state.setView)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<MediaTarget | null>(null)
  const { params, update } = useTableUrlState(NO_FILTERS)

  const loadView = useDriveStore((state) => state.loadView)
  useEffect(() => loadView(), [loadView])

  const actions: DriveActions = useMemo(() => {
    const folderHref = (path: string) => (path ? `/drive?path=${encodeURIComponent(path)}` : "/drive")
    const download = (row: DriveRow) => {
      if (row.fileId !== null) triggerDownload(`/download/${row.fileId}`)
    }
    return {
      select: (row) => setSelectedId(row.id),
      open: (row) => {
        if (row.kind === "folder") router.push(folderHref(row.folderPath))
        else if (row.fileId !== null && row.fileKind !== "other") setPreview({ fileId: row.fileId, name: row.name, kind: row.fileKind })
        else download(row)
      },
      download,
      openContainingFolder: (row) => router.push(folderHref(row.location)),
      copyPath: async (row) => {
        const path = row.kind === "folder" ? row.folderPath : [row.location, row.name].filter(Boolean).join("/")
        try {
          await navigator.clipboard.writeText(`Drive/${path}`)
          toast.success("Path copied")
        } catch {
          toast.error("Could not copy the path")
        }
      },
    }
  }, [router])

  // The "Folder" column only makes sense for search results, which span folders.
  const columns = useMemo(() => (searching ? driveColumns : driveColumns.filter((c) => c.id !== LOCATION_COLUMN_ID)), [searching])
  const emptyText = searching ? "No files match your search" : "This folder is empty"
  const pageCount = Math.max(Math.ceil(total / params.pageSize), 1)

  return (
    <div className="flex flex-col gap-4">
      {view === "list" ? (
        <DataTable
          columns={columns}
          data={rows}
          rowCount={total}
          searchable
          searchPlaceholder={folder ? "Search in this folder…" : "Search all files…"}
          emptyTitle={emptyText}
          getRowId={(row) => row.id}
          selectedRowId={selectedId}
          onRowClick={actions.select}
          onRowDoubleClick={actions.open}
          wrapRow={(row, element) => (
            <DriveContextMenu row={row} actions={actions}>
              {element}
            </DriveContextMenu>
          )}
          toolbarEnd={<ViewToggle value={view} onChange={setView} />}
        />
      ) : (
        <>
          <DataTableToolbar
            search={params.search}
            searchPlaceholder={folder ? "Search in this folder…" : "Search all files…"}
            filters={NO_FILTERS}
            filterValues={params.filters}
            onChange={update}
            end={<ViewToggle value={view} onChange={setView} />}
          />
          <DriveGrid rows={rows} selectedId={selectedId} actions={actions} emptyText={emptyText} />
          <DataTablePagination
            page={params.page}
            pageSize={params.pageSize}
            pageCount={pageCount}
            rowCount={total}
            pageSizeOptions={PAGINATION.pageSizeOptions}
            onPageChange={(page) => update({ [TABLE_PARAMS.page]: String(page) }, true)}
            onPageSizeChange={(size) => update({ [TABLE_PARAMS.pageSize]: String(size) })}
          />
        </>
      )}
      <MediaLightbox target={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { driveColumns, type DriveRow } from "@/columns/drive-files.column"
import { MediaLightbox, type MediaTarget } from "@/components/common/media-lightbox"
import { OptionGroup } from "@/components/common/option-group"
import { PathBreadcrumbs } from "@/components/common/path-breadcrumbs"
import { SearchInput } from "@/components/common/search-input"
import { DataTable } from "@/components/data-table/data-table"
import { UrlPagination } from "@/components/data-table/url-pagination"
import { type DriveView } from "@/lib/constant"
import { triggerDownload } from "@/lib/helper"
import { useDriveStore } from "@/stores/drive-store"
import { DriveContextMenu, type DriveActions } from "./drive-context-menu"
import { DriveGrid } from "./drive-grid"

interface DriveExplorerProps {
  /** Which tree this explorer shows: Drive, or the generic browser for every other product. */
  basePath: "/drive" | "/browse"
  rootLabel: string
  breadcrumbs: { label: string; path: string }[]
  rows: DriveRow[]
  total: number
  folder: string
  searching: boolean
}

const VIEW_OPTIONS: { value: DriveView; label: string }[] = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
]

/**
 * Google-Drive-style browser: click selects, double-click / Enter opens (folder -> navigate,
 * image/video -> preview, other -> download or viewer), right-click opens a context menu, and the
 * view toggles between a table (list) and cards (grid). All data comes from the server page.
 */
export function DriveExplorer({ basePath, rootLabel, breadcrumbs, rows, total, folder, searching }: DriveExplorerProps) {
  const router = useRouter()
  const view = useDriveStore((state) => state.view)
  const setView = useDriveStore((state) => state.setView)
  const loadView = useDriveStore((state) => state.loadView)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [preview, setPreview] = useState<MediaTarget | null>(null)

  useEffect(() => loadView(), [loadView])

  const actions: DriveActions = useMemo(() => {
    const folderHref = (path: string) => (path ? `${basePath}?path=${encodeURIComponent(path)}` : basePath)
    const download = (row: DriveRow) => {
      if (row.fileId !== null) triggerDownload(`/download/${row.fileId}`)
    }
    return {
      select: (row) => setSelectedId(row.id),
      open: (row) => {
        if (row.kind === "folder") router.push(folderHref(row.folderPath))
        else if (row.fileId !== null && row.fileKind !== "other") setPreview({ fileId: row.fileId, name: row.name, kind: row.fileKind })
        else if (basePath === "/browse" && row.fileId !== null) router.push(`/browse/file?id=${row.fileId}`)
        else download(row)
      },
      download,
      openContainingFolder: (row) => router.push(folderHref(row.location)),
      copyPath: async (row) => {
        const path = row.kind === "folder" ? row.folderPath : [row.location, row.name].filter(Boolean).join("/")
        try {
          await navigator.clipboard.writeText(`${rootLabel === "Drive" ? "Drive/" : ""}${path}`)
          toast.success("Path copied")
        } catch {
          toast.error("Could not copy the path")
        }
      },
    }
  }, [router, basePath, rootLabel])

  const emptyText = searching ? "No files match your search" : "This folder is empty"
  const canView = basePath === "/browse"

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none flex-wrap items-center gap-2.5 border-b border-line px-4 py-2.5">
        <PathBreadcrumbs
          rootLabel={rootLabel}
          rootHref={basePath}
          items={breadcrumbs.map((b) => ({ label: b.label, href: `${basePath}?path=${encodeURIComponent(b.path)}` }))}
        />
        <div className="flex-1" />
        <SearchInput className="h-[26px] w-[230px] bg-surf text-xs" placeholder={folder ? "Search in this folder…" : "Search all files…"} resetParams={["page"]} />
        <OptionGroup options={VIEW_OPTIONS} value={view} onChange={setView} variant="segment-mono" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3.5 pb-8">
        {view === "list" ? (
          <DataTable
            columns={driveColumns}
            data={rows}
            rowCount={total}
            emptyTitle={emptyText}
            getRowId={(row) => row.id}
            selectedRowId={selectedId}
            onRowClick={actions.select}
            onRowDoubleClick={actions.open}
            wrapRow={(row, element) => (
              <DriveContextMenu row={row} actions={actions} canView={canView}>
                {element}
              </DriveContextMenu>
            )}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            <DriveGrid rows={rows} selectedId={selectedId} actions={actions} emptyText={emptyText} canView={canView} />
            <UrlPagination rowCount={total} />
          </div>
        )}
      </div>
      <MediaLightbox target={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

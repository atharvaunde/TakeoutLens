"use client"

import { ClipboardIcon, DownloadIcon, EyeIcon, FolderOpenIcon } from "lucide-react"

import type { DriveRow } from "@/columns/drive-files.column"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

export interface DriveActions {
  open: (row: DriveRow) => void
  download: (row: DriveRow) => void
  openContainingFolder: (row: DriveRow) => void
  copyPath: (row: DriveRow) => void
  select: (row: DriveRow) => void
}

interface DriveContextMenuProps {
  row: DriveRow
  actions: DriveActions
  children: React.ReactElement
}

/** Right-click menu for a Drive item (row in list view, card in grid view). */
export function DriveContextMenu({ row, actions, children }: DriveContextMenuProps) {
  const isFolder = row.kind === "folder"
  const previewable = !isFolder && row.fileKind !== "other"
  return (
    <ContextMenu onOpenChange={(open) => open && actions.select(row)}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuGroup>
          {isFolder ? (
            <ContextMenuItem onSelect={() => actions.open(row)}>
              <FolderOpenIcon />
              Open
            </ContextMenuItem>
          ) : null}
          {previewable ? (
            <ContextMenuItem onSelect={() => actions.open(row)}>
              <EyeIcon />
              Preview
            </ContextMenuItem>
          ) : null}
          {!isFolder ? (
            <ContextMenuItem onSelect={() => actions.download(row)}>
              <DownloadIcon />
              Download
            </ContextMenuItem>
          ) : null}
          {row.location ? (
            <ContextMenuItem onSelect={() => actions.openContainingFolder(row)}>
              <FolderOpenIcon />
              Open containing folder
            </ContextMenuItem>
          ) : null}
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem onSelect={() => actions.copyPath(row)}>
            <ClipboardIcon />
            Copy path
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}

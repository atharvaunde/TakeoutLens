import type { DriveRow } from "@/columns/drive-files.column"
import { FileTypeIcon } from "@/components/common/file-type-icon"

/** Display only: interaction (select, double-click, context menu) is handled by DriveExplorer. */
export function DriveNameCell({ row }: { row: DriveRow }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <FileTypeIcon name={row.name} isFolder={row.kind === "folder"} className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate font-medium">{row.name}</span>
    </div>
  )
}

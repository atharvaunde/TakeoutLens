import type { DriveRow } from "@/columns/drive-files.column"
import { KindChip } from "./kind-chip"

/** Display only: interaction (select, double-click, context menu) is handled by DriveExplorer. */
export function DriveNameCell({ row }: { row: DriveRow }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <KindChip label={row.kindLabel} className="w-[26px] flex-none text-[8.5px]" />
      <span className="truncate text-[12.5px]">{row.name}</span>
    </div>
  )
}

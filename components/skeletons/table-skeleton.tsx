import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

interface TableSkeletonProps {
  columns?: number
  rows?: number
}

/** Placeholder shaped like DataTable: panel header row, rows, pager. */
export function TableSkeleton({ columns = 4, rows = SKELETON_ROWS.table }: TableSkeletonProps) {
  return (
    <div data-testid="skeleton-table" className="flex flex-col gap-2.5">
      <div className="overflow-hidden rounded-xl border border-line bg-surf">
        <div className="flex gap-4 border-b border-line bg-panel px-3 py-[9px]">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} className="h-2.5 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex gap-4 border-b border-line2 px-3 py-2.5 last:border-b-0">
            {Array.from({ length: columns }, (_, col) => (
              <Skeleton key={col} className="h-3.5 flex-1" />
            ))}
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-40" />
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

interface TableSkeletonProps {
  columns?: number
  rows?: number
}

/** Placeholder shaped like DataTable: header, rows, footer. */
export function TableSkeleton({ columns = 4, rows = SKELETON_ROWS.table }: TableSkeletonProps) {
  return (
    <div data-testid="skeleton-table" className="flex flex-col gap-4">
      <div className="rounded-lg border">
        <div className="flex gap-4 border-b p-3">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex gap-4 border-b p-3 last:border-b-0">
            {Array.from({ length: columns }, (_, col) => (
              <Skeleton key={col} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-56" />
      </div>
    </div>
  )
}

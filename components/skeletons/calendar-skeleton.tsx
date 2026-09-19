import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

const DAYS_IN_WEEK = 7

/** Toolbar plus a month grid. */
export function CalendarSkeleton() {
  return (
    <div data-testid="skeleton-calendar" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border">
        {Array.from({ length: DAYS_IN_WEEK * SKELETON_ROWS.calendarWeeks }, (_, i) => (
          <div key={i} className="flex min-h-24 flex-col gap-2 bg-background p-2">
            <Skeleton className="h-4 w-6" />
            {i % 3 === 0 ? <Skeleton className="h-4 w-full" /> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

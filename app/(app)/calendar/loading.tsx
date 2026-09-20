import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

const DAYS_IN_WEEK = 7

export default function Loading() {
  return (
    <div data-testid="skeleton-calendar" className="grid h-full grid-cols-[212px_1fr]">
      <div className="flex flex-col gap-2 border-r border-line px-2.5 py-3">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-[7px]">
          <Skeleton className="h-6 w-40" />
          <div className="flex-1" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-7 gap-px bg-line2" style={{ gridTemplateRows: `repeat(${SKELETON_ROWS.calendarWeeks}, minmax(0, 1fr))` }}>
          {Array.from({ length: DAYS_IN_WEEK * SKELETON_ROWS.calendarWeeks }, (_, i) => (
            <div key={i} className="flex flex-col gap-1.5 bg-background p-1.5">
              <Skeleton className="h-3 w-4" />
              {i % 3 !== 1 ? <Skeleton className="h-3.5 w-full" /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

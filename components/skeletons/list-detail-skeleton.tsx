import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

/** Sidebar/list on the left, detail pane on the right (mail, chat, groups). */
export function ListDetailSkeleton({ rows = SKELETON_ROWS.list }: { rows?: number }) {
  return (
    <div data-testid="skeleton-list-detail" className="grid h-full grid-cols-[22rem_1fr] gap-4">
      <div className="flex flex-col gap-1 rounded-lg border p-2">
        <Skeleton className="mb-2 h-9 w-full" />
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md p-3">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 rounded-lg border p-6">
        <Skeleton className="h-7 w-2/3" />
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

export default function Loading() {
  return (
    <div data-testid="skeleton-list-detail" className="grid h-full grid-cols-[minmax(300px,1fr)_minmax(340px,1.1fr)]">
      <div className="flex flex-col border-r border-line">
        <div className="flex flex-col gap-2 border-b border-line px-4 pt-3.5 pb-2.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-7 w-full" />
        </div>
        {Array.from({ length: SKELETON_ROWS.list }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5 border-b border-line2 px-3 py-2.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 px-6 pt-[22px]">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}

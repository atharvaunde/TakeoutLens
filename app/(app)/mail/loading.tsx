import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

export default function Loading() {
  return (
    <div data-testid="skeleton-list-detail" className="grid h-full grid-cols-[206px_minmax(280px,1fr)_minmax(320px,1.05fr)]">
      <div className="flex flex-col gap-2 border-r border-line px-3 py-3">
        {Array.from({ length: SKELETON_ROWS.list }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <div className="flex flex-col border-r border-line">
        <div className="flex flex-col gap-2 border-b border-line2 p-[11px]">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        {Array.from({ length: SKELETON_ROWS.list }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5 border-b border-line2 px-[11px] py-2.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 px-6 pt-[22px]">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  )
}

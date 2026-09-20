import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

export default function Loading() {
  return (
    <div data-testid="skeleton-card-grid" className="flex h-full flex-col">
      <div className="flex items-center border-b border-line px-[18px] pt-3.5 pb-2.5">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="columns-[280px] gap-2.5 px-[18px] pt-3.5">
        {Array.from({ length: SKELETON_ROWS.cards }, (_, i) => (
          <Skeleton key={i} className="mb-2.5 h-40 w-full rounded-xl break-inside-avoid" />
        ))}
      </div>
    </div>
  )
}

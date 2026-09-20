import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

export default function Loading() {
  return (
    <div data-testid="skeleton-photo-grid" className="flex h-full flex-col">
      <div className="flex items-center border-b border-line px-[18px] pt-3.5 pb-2.5">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-[5px] px-[18px] pt-3.5">
        {Array.from({ length: SKELETON_ROWS.photos }, (_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-[4px]" />
        ))}
      </div>
    </div>
  )
}

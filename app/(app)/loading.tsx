import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

export default function Loading() {
  return (
    <div data-testid="skeleton-home" className="h-full overflow-y-auto px-7 pt-[26px] pb-11">
      <div className="mx-auto flex max-w-[1220px] flex-col gap-[18px]">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-72" />
          </div>
          <Skeleton className="h-10 w-72" />
        </div>
        <Skeleton className="h-[7px] w-full" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-2">
          {Array.from({ length: SKELETON_ROWS.cards + 3 }, (_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

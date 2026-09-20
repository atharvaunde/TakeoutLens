import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

export default function Loading() {
  return (
    <div data-testid="skeleton-timeline" className="h-full overflow-y-auto px-7 pt-6 pb-11">
      <div className="flex w-full flex-col gap-3.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-6 w-96" />
        {Array.from({ length: SKELETON_ROWS.list }, (_, i) => (
          <div key={i} className="grid grid-cols-[76px_1fr] gap-3.5">
            <Skeleton className="mt-2 h-3 w-16 justify-self-end" />
            <div className="flex flex-col gap-2 border-l border-line py-2.5 pl-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

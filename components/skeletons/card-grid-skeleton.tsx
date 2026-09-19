import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

export function CardGridSkeleton({ cards = SKELETON_ROWS.cards }: { cards?: number }) {
  return (
    <div data-testid="skeleton-card-grid" className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}

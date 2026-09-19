import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"

export function PhotoGridSkeleton({ photos = SKELETON_ROWS.photos }: { photos?: number }) {
  return (
    <div data-testid="skeleton-photo-grid" className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
      {Array.from({ length: photos }, (_, i) => (
        <Skeleton key={i} className="aspect-square w-full" />
      ))}
    </div>
  )
}

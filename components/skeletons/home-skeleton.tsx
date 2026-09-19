import { CardGridSkeleton } from "./card-grid-skeleton"
import { PageHeaderSkeleton } from "./page-header-skeleton"

export function HomeSkeleton() {
  return (
    <div data-testid="skeleton-home" className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </div>
  )
}

import { ListDetailSkeleton } from "@/components/skeletons/list-detail-skeleton"

export default function Loading() {
  return (
    <div className="h-[calc(100svh-9rem)]">
      <ListDetailSkeleton />
    </div>
  )
}

import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton"
import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton"

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </>
  )
}

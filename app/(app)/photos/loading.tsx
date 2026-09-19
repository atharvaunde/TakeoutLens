import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton"
import { PhotoGridSkeleton } from "@/components/skeletons/photo-grid-skeleton"

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <PhotoGridSkeleton />
    </>
  )
}

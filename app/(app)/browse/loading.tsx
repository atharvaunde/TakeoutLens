import { PageHeaderSkeleton } from "@/components/skeletons/page-header-skeleton"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <TableSkeleton columns={4} />
    </>
  )
}

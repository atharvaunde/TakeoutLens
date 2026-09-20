import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"

export default function Loading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-line px-[18px] pt-3.5 pb-2.5">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex-1" />
        <Skeleton className="h-[27px] w-[250px]" />
      </div>
      <div className="px-[18px] pt-3">
        <TableSkeleton />
      </div>
    </div>
  )
}

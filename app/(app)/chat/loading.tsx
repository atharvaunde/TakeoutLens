import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"
import { cn } from "@/lib/utils"

export default function Loading() {
  return (
    <div data-testid="skeleton-chat" className="grid h-full grid-cols-[266px_1fr]">
      <div className="flex flex-col gap-1 border-r border-line p-[5px]">
        <div className="flex flex-col gap-2 p-[5px]">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-5 w-40" />
        </div>
        {Array.from({ length: SKELETON_ROWS.list }, (_, i) => (
          <div key={i} className="flex items-center gap-[9px] px-2 py-[7px]">
            <Skeleton className="size-[26px] rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3.5 px-[18px] pt-5">
        {Array.from({ length: SKELETON_ROWS.chatMessages }, (_, i) => (
          <div key={i} className={cn("flex items-end gap-[9px]", i % 2 === 1 && "flex-row-reverse")}>
            <Skeleton className="size-6 flex-none rounded-full" />
            <Skeleton className={cn("h-10 rounded-[10px]", i % 3 === 0 ? "w-72" : "w-40")} />
          </div>
        ))}
      </div>
    </div>
  )
}

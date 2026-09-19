import { Skeleton } from "@/components/ui/skeleton"
import { SKELETON_ROWS } from "@/lib/constant"
import { cn } from "@/lib/utils"

/** Conversation list plus alternating message bubbles. */
export function ChatSkeleton({ messages = SKELETON_ROWS.chatMessages }: { messages?: number }) {
  return (
    <div data-testid="skeleton-chat" className="grid h-full grid-cols-[20rem_1fr] gap-4">
      <div className="flex flex-col gap-1 rounded-lg border p-2">
        {Array.from({ length: SKELETON_ROWS.list }, (_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md p-2">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 rounded-lg border p-6">
        {Array.from({ length: messages }, (_, i) => (
          <div key={i} className={cn("flex items-end gap-3", i % 2 === 1 && "flex-row-reverse")}>
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <Skeleton className={cn("h-12 rounded-2xl", i % 3 === 0 ? "w-2/3" : "w-1/3")} />
          </div>
        ))}
      </div>
    </div>
  )
}

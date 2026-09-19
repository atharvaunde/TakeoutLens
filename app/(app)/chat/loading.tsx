import { ChatSkeleton } from "@/components/skeletons/chat-skeleton"

export default function Loading() {
  return (
    <div className="h-[calc(100svh-9rem)]">
      <ChatSkeleton />
    </div>
  )
}

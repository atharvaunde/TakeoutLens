import Link from "next/link"

import { formatDate, getInitials } from "@/lib/helper"
import type { ChatConversationItem } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ConversationListProps {
  conversations: ChatConversationItem[]
  activeId: number | null
  /** Builds the link for a conversation, preserving the current filters. */
  hrefFor: (id: number) => string
}

/** Conversation rows: round avatar for direct messages, rounded square for spaces. */
export function ConversationList({ conversations, activeId, hrefFor }: ConversationListProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-[5px]">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          href={hrefFor(conversation.id)}
          className={cn("flex items-center gap-[9px] rounded-lg px-2 py-[7px] text-ink no-underline hover:bg-hov hover:no-underline", conversation.id === activeId && "bg-sel")}
        >
          <div
            className={cn(
              "flex size-[26px] flex-none items-center justify-center bg-sel font-mono text-[9.5px] font-semibold text-mute",
              conversation.kind === "Space" ? "rounded-md" : "rounded-full"
            )}
          >
            {getInitials(conversation.title)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-[7px]">
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{conversation.title}</span>
              <span className="flex-none font-mono text-[9.5px] text-faint">{formatDate(conversation.lastAt, { year: "numeric", month: undefined, day: undefined, timeZone: "UTC" })}</span>
            </div>
            <div className="truncate text-[11.5px] text-faint">{conversation.preview || "No text"}</div>
          </div>
        </Link>
      ))}
      {conversations.length === 0 ? <p className="p-4 text-center text-[12.5px] text-faint">No conversations</p> : null}
    </div>
  )
}

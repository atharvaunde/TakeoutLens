import Link from "next/link"
import { UsersIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDate, getInitials } from "@/lib/helper"
import type { ChatConversationItem } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ConversationListProps {
  conversations: ChatConversationItem[]
  activeId: number | null
  /** Builds the link for a conversation, preserving the current filters. */
  hrefFor: (id: number) => string
}

export function ConversationList({ conversations, activeId, hrefFor }: ConversationListProps) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="flex flex-col gap-0.5 p-1">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={hrefFor(conversation.id)}
            className={cn(
              "flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/60",
              conversation.id === activeId && "bg-muted"
            )}
          >
            <Avatar>
              <AvatarFallback>{conversation.kind === "Space" ? <UsersIcon /> : getInitials(conversation.title)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{conversation.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(conversation.lastAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="truncate text-xs text-muted-foreground">{conversation.preview || "No text"}</span>
                {conversation.kind === "Space" ? <Badge variant="outline">Space</Badge> : null}
              </div>
            </div>
          </Link>
        ))}
        {conversations.length === 0 ? <p className="p-4 text-center text-sm text-muted-foreground">No conversations</p> : null}
      </div>
    </ScrollArea>
  )
}

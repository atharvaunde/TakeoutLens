import Link from "next/link"

import { ChatKindTabs } from "@/components/chat/chat-kind-tabs"
import { ChatTimeline } from "@/components/chat/chat-timeline"
import { ConversationList } from "@/components/chat/conversation-list"
import { HighlightedText } from "@/components/common/highlighted-text"
import { SearchInput } from "@/components/common/search-input"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { CHAT, type ChatKind } from "@/lib/constant"
import { formatDateTime, formatNumber } from "@/lib/helper"
import { getConversation, getMessages, listConversations, searchMessages } from "@/server/services/chat"

type Query = Record<string, string | string[] | undefined>
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)
const toInt = (value: string | undefined) => (value && /^\d{1,9}$/.test(value) ? Number(value) : undefined)

export default async function ChatPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams
  const kindParam = one(query.kind)
  const kind: ChatKind = (CHAT.kinds as readonly string[]).includes(kindParam ?? "") ? (kindParam as ChatKind) : "all"
  const convSearch = one(query.cq) ?? ""
  const messageSearch = one(query.q) ?? ""
  const activeId = toInt(one(query.c))
  const aroundSeq = toInt(one(query.at))

  const keep = (extra: Record<string, string>) => {
    const params = new URLSearchParams()
    if (kind !== "all") params.set("kind", kind)
    if (convSearch) params.set("cq", convSearch)
    for (const [key, value] of Object.entries(extra)) params.set(key, value)
    return `/chat?${params.toString()}`
  }

  const [conversations, active, hits] = await Promise.all([
    listConversations(kind, convSearch),
    activeId ? getConversation(activeId) : null,
    messageSearch ? searchMessages(messageSearch) : [],
  ])
  const page = active ? await getMessages(active.id, aroundSeq !== undefined ? { aroundSeq } : {}) : null

  return (
    <div className="grid h-[calc(100svh-9rem)] min-h-0 grid-cols-[22rem_1fr] gap-4">
      <div className="flex min-h-0 flex-col gap-3 rounded-lg border p-3">
        <SearchInput param="cq" placeholder="Filter conversations…" />
        <ChatKindTabs value={kind} />
        <ConversationList conversations={conversations} activeId={active?.id ?? null} hrefFor={(id) => keep({ c: String(id) })} />
      </div>

      <div className="flex min-h-0 flex-col gap-3 rounded-lg border p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{messageSearch ? `Search results for “${messageSearch}”` : (active?.title ?? "Chat")}</h1>
            {active && !messageSearch ? (
              <p className="text-xs text-muted-foreground">
                {active.kind === "Space" ? "Space" : "Direct message"} · {formatNumber(active.messageCount)} messages
              </p>
            ) : null}
          </div>
          <SearchInput className="w-72" placeholder="Search all messages…" />
        </div>

        {messageSearch ? (
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
            {hits.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No messages match</EmptyTitle>
                  <EmptyDescription>Try a different word.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              hits.map((hit) => (
                <Link
                  key={hit.messageId}
                  href={keep({ c: String(hit.convId), at: String(hit.seq) })}
                  className="flex flex-col gap-0.5 rounded-md p-2 hover:bg-muted/60"
                >
                  <span className="text-xs text-muted-foreground">
                    {hit.convTitle} · {hit.name} · {formatDateTime(hit.ts)}
                  </span>
                  <span className="text-sm">
                    <HighlightedText snippet={hit.snippet} />
                  </span>
                </Link>
              ))
            )}
          </div>
        ) : page && active ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <ChatTimeline key={`${active.id}-${aroundSeq ?? "latest"}`} convId={active.id} initial={page} focusSeq={aroundSeq} />
          </div>
        ) : (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyTitle>Select a conversation</EmptyTitle>
              <EmptyDescription>Pick one on the left, or search all messages above.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  )
}

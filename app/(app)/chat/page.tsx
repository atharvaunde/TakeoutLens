import Link from "next/link"

import { ChatTimeline } from "@/components/chat/chat-timeline"
import { ConversationList } from "@/components/chat/conversation-list"
import { HighlightedText } from "@/components/common/highlighted-text"
import { SearchInput } from "@/components/common/search-input"
import { UrlOptionGroup } from "@/components/common/url-option-group"
import { Crumb } from "@/components/layout/crumb"
import { CHAT, type ChatKind } from "@/lib/constant"
import { formatDate, formatDateTime, formatNumber, getInitials } from "@/lib/helper"
import { getConversation, getMessages, listConversations, searchMessages } from "@/server/services/chat"

type Query = Record<string, string | string[] | undefined>
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)
const toInt = (value: string | undefined) => (value && /^\d{1,9}$/.test(value) ? Number(value) : undefined)

const KIND_OPTIONS = [
  { value: "all", label: "All" },
  { value: "DM", label: "Direct" },
  { value: "Space", label: "Spaces" },
] as const

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

  const [conversations, active] = await Promise.all([listConversations(kind, convSearch), activeId ? getConversation(activeId) : null])
  const [hits, page] = await Promise.all([
    messageSearch ? searchMessages(messageSearch, active?.id) : [],
    active && !messageSearch ? getMessages(active.id, aroundSeq !== undefined ? { aroundSeq } : {}) : null,
  ])
  const years = active?.firstAt && active.lastAt ? [new Date(active.firstAt).getUTCFullYear(), new Date(active.lastAt).getUTCFullYear()] : []
  const span = years.length ? (years[0] === years[1] ? String(years[0]) : `${years[0]}–${years[1]}`) : ""

  return (
    <div className="grid h-full grid-cols-[266px_1fr]">
      <Crumb value={active ? `Chat / ${active.title}` : "Chat"} />
      <div className="flex min-h-0 flex-col border-r border-line bg-background">
        <div className="flex flex-none flex-col gap-2 border-b border-line2 px-2.5 py-[9px]">
          <SearchInput param="cq" placeholder="Filter conversations…" className="bg-surf" />
          <UrlOptionGroup param="kind" value={kind} defaultValue="all" variant="pill" options={KIND_OPTIONS} />
        </div>
        <ConversationList conversations={conversations} activeId={active?.id ?? null} hrefFor={(id) => keep({ c: String(id) })} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-col bg-surf">
        <div className="flex h-[46px] flex-none items-center gap-2.5 border-b border-line2 px-[18px]">
          <div className={`flex size-6 items-center justify-center bg-sel font-mono text-[9.5px] font-semibold text-mute ${active?.kind === "Space" ? "rounded-md" : "rounded-full"}`}>
            {getInitials(active?.title ?? "Chat")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-semibold tracking-[-.01em]">{active?.title ?? "Chat"}</div>
            {active ? (
              <div className="font-mono text-[10px] text-faint">
                {active.kind === "Space" ? "space" : "direct"} · {formatNumber(active.messageCount)} messages{span ? ` · ${span}` : ""}
              </div>
            ) : null}
          </div>
          <SearchInput className="h-[26px] w-[190px] text-xs" placeholder={active ? "Search thread…" : "Search all messages…"} />
        </div>

        {messageSearch ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {hits.length === 0 ? <div className="py-10 text-center text-[13px] text-faint">No messages match “{messageSearch}”.</div> : null}
            {hits.map((hit) => (
              <Link key={hit.messageId} href={keep({ c: String(hit.convId), at: String(hit.seq) })} className="flex flex-col gap-0.5 rounded-lg px-2.5 py-2 text-ink no-underline hover:bg-hov hover:no-underline">
                <span className="font-mono text-[10px] text-faint">
                  {hit.convTitle} · {hit.name} · {formatDateTime(hit.ts)}
                </span>
                <span className="text-[13px]">
                  <HighlightedText snippet={hit.snippet} />
                </span>
              </Link>
            ))}
          </div>
        ) : page && active ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <ChatTimeline key={`${active.id}-${aroundSeq ?? "latest"}`} convId={active.id} initial={page} focusSeq={aroundSeq} />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-10 text-center">
            <div>
              <div className="text-base font-semibold tracking-[-.015em]">Select a conversation</div>
              <div className="mt-1.5 text-[13px] text-mute">Pick one on the left, or search all messages above.</div>
              <div className="mt-3 font-mono text-[10px] text-faint">Last activity {formatDate(conversations[0]?.lastAt, { timeZone: "UTC" })}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

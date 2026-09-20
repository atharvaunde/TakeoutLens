"use client"

import { Fragment, useEffect, useMemo, useState, useTransition } from "react"

import { MediaLightbox, type MediaTarget } from "@/components/common/media-lightbox"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { groupMessages } from "@/lib/chat"
import { formatDate, getDayKey } from "@/lib/helper"
import type { ChatMessagePage } from "@/lib/types"
import { loadNewerMessagesAction, loadOlderMessagesAction } from "@/server/actions/chat"
import { ChatGroupView } from "./chat-message-row"

interface ChatTimelineProps {
  convId: number
  initial: ChatMessagePage
  /** Message to scroll to and highlight (from a search hit). */
  focusSeq?: number
}

const loadButton = "cursor-pointer rounded-lg border border-line bg-surf px-3 py-1.5 text-xs font-medium hover:bg-hov disabled:opacity-60"

/**
 * Only a window of messages is mounted (conversations reach ~10k messages). Older/newer pages
 * are fetched through Server Functions. Remount with a new `key` when the conversation changes.
 */
export function ChatTimeline({ convId, initial, focusSeq }: ChatTimelineProps) {
  const [messages, setMessages] = useState(initial.messages)
  const [hasOlder, setHasOlder] = useState(initial.hasOlder)
  const [hasNewer, setHasNewer] = useState(initial.hasNewer)
  const [preview, setPreview] = useState<MediaTarget | null>(null)
  const [pending, startTransition] = useTransition()
  const groups = useMemo(() => groupMessages(messages), [messages])

  useEffect(() => {
    if (focusSeq !== undefined) document.getElementById(`msg-${focusSeq}`)?.scrollIntoView({ block: "center" })
  }, [focusSeq])

  const loadOlder = () =>
    startTransition(async () => {
      const page = await loadOlderMessagesAction(convId, messages[0].seq)
      setMessages((current) => [...page.messages, ...current])
      setHasOlder(page.hasOlder)
    })
  const loadNewer = () =>
    startTransition(async () => {
      const page = await loadNewerMessagesAction(convId, messages[messages.length - 1].seq)
      setMessages((current) => [...current, ...page.messages])
      setHasNewer(page.hasNewer)
    })

  return (
    <>
      <MessageScrollerProvider autoScroll={focusSeq === undefined}>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-3.5 px-[18px] pt-5 pb-7">
              {hasOlder ? (
                <MessageScrollerItem messageId="load-older">
                  <div className="flex justify-center">
                    <button type="button" disabled={pending} onClick={loadOlder} className={loadButton}>
                      Load older messages
                    </button>
                  </div>
                </MessageScrollerItem>
              ) : null}
              {groups.map((group, index) => {
                const first = group.messages[0]
                const newDay = index === 0 || getDayKey(groups[index - 1].messages[groups[index - 1].messages.length - 1].ts) !== getDayKey(first.ts)
                return (
                  <Fragment key={group.key}>
                    {newDay ? (
                      <MessageScrollerItem messageId={`day-${group.key}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-line2" />
                          <div className="font-mono text-[10px] tracking-[.1em] text-faint uppercase">
                            {formatDate(first.ts, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
                          </div>
                          <div className="h-px flex-1 bg-line2" />
                        </div>
                      </MessageScrollerItem>
                    ) : null}
                    <MessageScrollerItem messageId={String(group.key)}>
                      <ChatGroupView
                        group={group}
                        focusSeq={focusSeq}
                        onPreview={(attachment) => setPreview({ fileId: attachment.fileId, name: attachment.name, kind: attachment.kind })}
                      />
                    </MessageScrollerItem>
                  </Fragment>
                )
              })}
              {hasNewer ? (
                <MessageScrollerItem messageId="load-newer">
                  <div className="flex justify-center">
                    <button type="button" disabled={pending} onClick={loadNewer} className={loadButton}>
                      Load newer messages
                    </button>
                  </div>
                </MessageScrollerItem>
              ) : null}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <MediaLightbox target={preview} onClose={() => setPreview(null)} />
    </>
  )
}

"use client"

import { Fragment, useEffect, useState, useTransition } from "react"
import { ChevronUpIcon } from "lucide-react"

import { MediaLightbox, type MediaTarget } from "@/components/common/media-lightbox"
import { Button } from "@/components/ui/button"
import { Marker, MarkerContent } from "@/components/ui/marker"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Spinner } from "@/components/ui/spinner"
import { formatDay, getDayKey } from "@/lib/helper"
import type { ChatMessagePage } from "@/lib/types"
import { loadNewerMessagesAction, loadOlderMessagesAction } from "@/server/actions/chat"
import { ChatMessageRow } from "./chat-message-row"

interface ChatTimelineProps {
  convId: number
  initial: ChatMessagePage
  /** Message to scroll to and highlight (from a search hit). */
  focusSeq?: number
}

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

  useEffect(() => {
    if (focusSeq === undefined) return
    const element = document.getElementById(`msg-${focusSeq}`)
    element?.scrollIntoView({ block: "center" })
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

  const loadButton = (label: string, onClick: () => void, icon?: React.ReactNode) => (
    <div className="flex justify-center py-2">
      <Button variant="outline" size="sm" disabled={pending} onClick={onClick}>
        {pending ? <Spinner data-icon="inline-start" /> : icon}
        {label}
      </Button>
    </div>
  )

  return (
    <>
      <MessageScrollerProvider autoScroll={focusSeq === undefined}>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-4 p-4">
              {hasOlder ? (
                <MessageScrollerItem messageId="load-older">{loadButton("Load older messages", loadOlder, <ChevronUpIcon data-icon="inline-start" />)}</MessageScrollerItem>
              ) : null}
              {messages.map((message, index) => {
                const newDay = index === 0 || getDayKey(messages[index - 1].ts) !== getDayKey(message.ts)
                return (
                  <Fragment key={message.id}>
                    {newDay ? (
                      <MessageScrollerItem messageId={`day-${message.id}`}>
                        <Marker variant="separator">
                          <MarkerContent>{formatDay(message.ts)}</MarkerContent>
                        </Marker>
                      </MessageScrollerItem>
                    ) : null}
                    <MessageScrollerItem messageId={String(message.id)}>
                      <div id={`msg-${message.seq}`} className={message.seq === focusSeq ? "rounded-lg bg-primary/10 p-1" : undefined}>
                        <ChatMessageRow
                          message={message}
                          onPreview={(attachment) => setPreview({ fileId: attachment.fileId, name: attachment.name, kind: attachment.kind })}
                        />
                      </div>
                    </MessageScrollerItem>
                  </Fragment>
                )
              })}
              {hasNewer ? <MessageScrollerItem messageId="load-newer">{loadButton("Load newer messages", loadNewer)}</MessageScrollerItem> : null}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <MediaLightbox target={preview} onClose={() => setPreview(null)} />
    </>
  )
}

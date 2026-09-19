"use client"

import { useState } from "react"
import { ChevronDownIcon, DownloadIcon, PaperclipIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { MAIL_TEXT } from "@/lib/constant"
import { formatBytes, formatDateTime } from "@/lib/helper"
import type { MailMessageView } from "@/lib/types"
import { MailMessageFrame } from "./mail-message-frame"

/** A conversation: every message collapsible, the newest expanded. */
export function MailThread({ messages }: { messages: MailMessageView[] }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(messages.length ? [messages[messages.length - 1].id] : []))
  const toggle = (id: number) =>
    setOpen((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  const subject = messages[0]?.subject || MAIL_TEXT.noSubject
  const labels = [...new Set(messages.flatMap((m) => m.labels))]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{subject}</h2>
        <div className="flex flex-wrap gap-1">
          {labels.map((label) => (
            <Badge key={label} variant="secondary">
              {label}
            </Badge>
          ))}
        </div>
      </div>
      {messages.map((message) => (
        <Collapsible key={message.id} open={open.has(message.id)} onOpenChange={() => toggle(message.id)} className="rounded-lg border">
          <CollapsibleTrigger asChild>
            <button type="button" className="flex w-full items-center justify-between gap-3 p-3 text-left">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{message.from}</span>
                <span className="truncate text-xs text-muted-foreground">To: {message.to || "—"}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                {message.attachments.length ? <PaperclipIcon className="size-3.5" /> : null}
                {formatDateTime(message.dateTs || null)}
                <ChevronDownIcon className="size-4" />
              </div>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-3 border-t p-3">
            {message.cc ? <p className="text-xs text-muted-foreground">Cc: {message.cc}</p> : null}
            <MailMessageFrame html={message.html} text={message.text} />
            {message.attachments.length ? (
              <div className="flex flex-wrap gap-2">
                {message.attachments
                  .filter((a) => !a.inline)
                  .map((attachment) => (
                    <Button key={attachment.index} asChild variant="outline" size="sm">
                      <a href={`/attachment/${message.id}/${attachment.index}`} download>
                        <DownloadIcon data-icon="inline-start" />
                        {attachment.name} · {formatBytes(attachment.size)}
                      </a>
                    </Button>
                  ))}
              </div>
            ) : null}
            <div>
              <Button asChild variant="ghost" size="xs">
                <a href={`/attachment/${message.id}/eml`} download>
                  Download .eml
                </a>
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}

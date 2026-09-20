"use client"

import Link from "next/link"
import { useState, useTransition } from "react"

import { MAIL_TEXT } from "@/lib/constant"
import { formatBytes, formatDate, formatTime, getInitials } from "@/lib/helper"
import type { MailMessageView } from "@/lib/types"
import { cn } from "@/lib/utils"
import { loadRawMessageAction } from "@/server/actions/mail"
import { MailMessageFrame } from "./mail-message-frame"

const ACTION = "cursor-pointer rounded-[7px] border border-line bg-surf px-2.5 py-[5px] text-xs font-medium text-ink no-underline hover:bg-hov hover:no-underline"

/** "Name <email>" -> { name, email } */
function splitAddress(value: string): { name: string; email: string } {
  const match = /^(.*?)\s*<([^>]+)>$/.exec(value.trim())
  return match ? { name: match[1].replace(/^"|"$/g, "") || match[2], email: match[2] } : { name: value, email: value }
}

function MessageBlock({ message, defaultOpen }: { message: MailMessageView; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [raw, setRaw] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const from = splitAddress(message.from)
  const date = message.dateTs || null

  return (
    <div className="border-b border-line">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full cursor-pointer items-start gap-2.5 pb-[13px] text-left">
        <div className="flex size-7 flex-none items-center justify-center rounded-lg bg-sel font-mono text-[10px] font-semibold text-mute">{getInitials(from.name)}</div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold">{from.name}</div>
          <div className="mt-px truncate text-[11.5px] text-faint">to {message.to || "—"}</div>
        </div>
        <div className="flex-none text-right font-mono text-[10.5px] text-faint">
          {formatDate(date, { year: "numeric" })}
          <br />
          {formatTime(date)}
        </div>
      </button>
      {open ? (
        <div className="pb-4">
          {message.cc ? <p className="mb-2 text-[11.5px] text-faint">Cc: {message.cc}</p> : null}
          {raw !== null ? (
            <pre className="max-h-[52vh] overflow-auto rounded-lg border border-line2 bg-panel p-3 font-mono text-[11px] whitespace-pre-wrap break-words">{raw}</pre>
          ) : (
            <MailMessageFrame html={message.html} text={message.text} />
          )}
          {message.attachments.some((a) => !a.inline) ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {message.attachments
                .filter((a) => !a.inline)
                .map((attachment) => (
                  <a key={attachment.index} href={`/attachment/${message.id}/${attachment.index}`} download className={ACTION}>
                    {attachment.name} · {formatBytes(attachment.size)}
                  </a>
                ))}
            </div>
          ) : null}
          <div className="mt-[22px] flex flex-wrap gap-1.5 border-t border-line pt-[13px]">
            <button
              type="button"
              disabled={pending}
              className={cn(ACTION, "disabled:opacity-60")}
              onClick={() => (raw !== null ? setRaw(null) : startTransition(async () => setRaw((await loadRawMessageAction(message.id)) ?? "Source unavailable.")))}
            >
              {raw !== null ? "Show message" : "Show original"}
            </button>
            <a href={`/attachment/${message.id}/eml`} download className={ACTION}>
              Export .eml
            </a>
            <Link href={`/mail?q=${encodeURIComponent(from.email)}`} className={ACTION}>
              All from this sender
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** A conversation as the reading pane: subject, label tags, then each message (newest expanded). */
export function MailThread({ messages }: { messages: MailMessageView[] }) {
  const labels = [...new Set(messages.flatMap((m) => m.labels))]
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-[700px] px-6 pt-[22px] pb-10">
        <div className="text-[19px] leading-[1.3] font-semibold tracking-[-.02em] text-pretty">{messages[0]?.subject || MAIL_TEXT.noSubject}</div>
        <div className="mt-2.5 mb-4 flex flex-wrap gap-[5px]">
          {labels.map((label) => (
            <span key={label} className="rounded-[3px] bg-sel px-1.5 py-0.5 font-mono text-[9.5px] tracking-[.05em] text-mute">
              {label}
            </span>
          ))}
        </div>
        {messages.map((message, index) => (
          <MessageBlock key={message.id} message={message} defaultOpen={index === messages.length - 1} />
        ))}
      </div>
    </div>
  )
}

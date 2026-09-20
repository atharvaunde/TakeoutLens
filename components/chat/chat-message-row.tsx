"use client"

import { DownloadIcon, FileIcon, LinkIcon } from "lucide-react"

import { CHAT } from "@/lib/constant"
import type { ChatGroup } from "@/lib/chat"
import { formatTime, getInitials } from "@/lib/helper"
import type { ChatAttachment, ChatMessageItem } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ChatGroupViewProps {
  group: ChatGroup
  focusSeq?: number
  onPreview: (attachment: ChatAttachment & { fileId: number; kind: "image" | "video" }) => void
}

const OTHER_BUBBLE = "rounded-[3px_10px_10px_10px] border border-line bg-panel text-ink"
const MINE_BUBBLE = "rounded-[10px_3px_10px_10px] bg-acc text-on-acc"

function Attachments({ message, onPreview }: { message: ChatMessageItem; onPreview: ChatGroupViewProps["onPreview"] }) {
  return (
    <>
      {message.links.map((link) => (
        <div key={link.title} className="flex max-w-[400px] items-center gap-2 rounded-[10px] border border-line bg-surf px-3 py-2 text-xs">
          <LinkIcon className="size-3.5 flex-none text-mute" />
          <span className="truncate">{link.title}</span>
        </div>
      ))}
      {message.attachments.map((attachment, index) =>
        attachment.fileId !== null && attachment.kind !== "other" ? (
          <button
            key={index}
            type="button"
            onClick={() => onPreview({ ...attachment, fileId: attachment.fileId as number, kind: attachment.kind as "image" | "video" })}
            className="max-w-[400px] cursor-pointer overflow-hidden rounded-[3px_10px_10px_10px] border border-line"
          >
            {attachment.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- cached local thumbnail
              <img src={`/thumb/${attachment.fileId}`} alt={attachment.name} loading="lazy" className="max-h-[220px] max-w-full object-cover" />
            ) : (
              <div className="flex h-[150px] w-[280px] items-center justify-center bg-panel font-mono text-[10.5px] text-mute">▶ {attachment.name}</div>
            )}
          </button>
        ) : (
          <div key={index} className="flex max-w-[400px] items-center gap-2 rounded-[10px] border border-line bg-surf px-3 py-2 text-xs">
            <FileIcon className="size-3.5 flex-none text-mute" />
            <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
            {attachment.fileId !== null ? (
              <a href={`/download/${attachment.fileId}`} download aria-label={`Download ${attachment.name}`} className="text-acc hover:underline">
                <DownloadIcon className="size-3.5" />
              </a>
            ) : (
              <span className="font-mono text-[10px] text-faint">not in export</span>
            )}
          </div>
        )
      )}
    </>
  )
}

/** One run of messages from a sender: avatar (others), stacked bubbles, then time. */
export function ChatGroupView({ group, focusSeq, onPreview }: ChatGroupViewProps) {
  const last = group.messages[group.messages.length - 1]
  const bubbles = group.messages.map((message) => (
    <div key={message.id} id={`msg-${message.seq}`} className={cn("flex flex-col gap-1", group.isMine ? "items-end" : "items-start", message.seq === focusSeq && "rounded-lg bg-accbg p-1")}>
      {message.quoted ? (
        <div className="max-w-[400px] rounded-md border-l-2 border-line bg-panel px-2.5 py-1.5 text-xs text-mute">
          <div className="font-medium">{message.quoted.name}</div>
          <div className="line-clamp-2">{message.quoted.text}</div>
        </div>
      ) : null}
      {message.text ? (
        <div className={cn("max-w-[400px] px-3 py-2 text-[13px] leading-normal break-words whitespace-pre-wrap", group.isMine ? MINE_BUBBLE : OTHER_BUBBLE)}>{message.text}</div>
      ) : null}
      <Attachments message={message} onPreview={onPreview} />
      {message.reactions.length ? (
        <div className="flex flex-wrap gap-1">
          {message.reactions.map((reaction) => (
            <span key={reaction.emoji} className="rounded-full border border-line bg-surf px-1.5 text-[11px]">
              {reaction.emoji} {reaction.count > 1 ? reaction.count : ""}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  ))
  const meta = (
    <div className="font-mono text-[10px] text-faint">
      {formatTime(last.ts, { timeZone: "UTC" })}
      {group.isMine ? ` · ${CHAT.ownerNameFallback.toLowerCase()}` : group.isBot ? " · bot" : ""}
    </div>
  )

  if (group.isMine) {
    return (
      <div className="flex flex-col items-end gap-1">
        {bubbles}
        {meta}
      </div>
    )
  }
  return (
    <div className="flex items-start gap-[9px]">
      <div title={group.name} className="flex size-6 flex-none items-center justify-center rounded-full bg-sel font-mono text-[9px] font-semibold text-mute">
        {getInitials(group.name)}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        {bubbles}
        {meta}
      </div>
    </div>
  )
}

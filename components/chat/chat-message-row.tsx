"use client"

import { FileIcon } from "lucide-react"

import { Attachment, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle, AttachmentTrigger } from "@/components/ui/attachment"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble"
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message"
import { CHAT } from "@/lib/constant"
import { formatTime, getInitials } from "@/lib/helper"
import type { ChatAttachment, ChatMessageItem } from "@/lib/types"

interface ChatMessageRowProps {
  message: ChatMessageItem
  onPreview: (attachment: ChatAttachment & { fileId: number; kind: "image" | "video" }) => void
}

export function ChatMessageRow({ message, onPreview }: ChatMessageRowProps) {
  const align = message.isMine ? "end" : "start"
  return (
    <Message align={align}>
      {!message.isMine ? (
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>{getInitials(message.name)}</AvatarFallback>
          </Avatar>
        </MessageAvatar>
      ) : null}
      <MessageContent>
        <MessageHeader className="gap-2">
          {message.isMine ? CHAT.ownerNameFallback : message.name}
          {message.isBot ? <Badge variant="secondary">Bot</Badge> : null}
        </MessageHeader>

        {message.quoted ? (
          <div className="max-w-[80%] rounded-md border-l-2 bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
            <div className="font-medium">{message.quoted.name}</div>
            <div className="line-clamp-2">{message.quoted.text}</div>
          </div>
        ) : null}

        {message.text ? (
          <Bubble align={align} variant={message.isMine ? "default" : "secondary"}>
            <BubbleContent className="whitespace-pre-wrap">{message.text}</BubbleContent>
            {message.reactions.length ? (
              <BubbleReactions side="bottom" align={align}>
                {message.reactions.map((reaction) => (
                  <Badge key={reaction.emoji} variant="secondary">
                    {reaction.emoji} {reaction.count > 1 ? reaction.count : null}
                  </Badge>
                ))}
              </BubbleReactions>
            ) : null}
          </Bubble>
        ) : null}

        {message.links.map((link) => (
          <Attachment key={link.title}>
            <AttachmentMedia variant="icon">
              <FileIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{link.title}</AttachmentTitle>
              <AttachmentDescription>{link.url ? "Link (opens outside this app)" : "Link"}</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        ))}

        {message.attachments.map((attachment, index) =>
          attachment.fileId !== null && attachment.kind !== "other" ? (
            <button
              key={index}
              type="button"
              onClick={() => onPreview({ ...attachment, fileId: attachment.fileId as number, kind: attachment.kind as "image" | "video" })}
              className="w-fit overflow-hidden rounded-lg border"
            >
              {attachment.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- cached local thumbnail
                <img src={`/thumb/${attachment.fileId}`} alt={attachment.name} loading="lazy" className="max-h-56 max-w-72 object-cover" />
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 text-xs">▶ {attachment.name}</div>
              )}
            </button>
          ) : (
            <Attachment key={index} state={attachment.fileId === null ? "error" : "done"}>
              <AttachmentMedia variant="icon">
                <FileIcon />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{attachment.name}</AttachmentTitle>
                <AttachmentDescription>{attachment.fileId === null ? "File not in the export" : "Click to download"}</AttachmentDescription>
              </AttachmentContent>
              {attachment.fileId !== null ? (
                <AttachmentTrigger asChild>
                  <a href={`/download/${attachment.fileId}`} download aria-label={`Download ${attachment.name}`} />
                </AttachmentTrigger>
              ) : null}
            </Attachment>
          )
        )}
        <MessageFooter>{formatTime(message.ts, { timeZone: "UTC" })} UTC</MessageFooter>
      </MessageContent>
    </Message>
  )
}

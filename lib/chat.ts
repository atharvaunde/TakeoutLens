import { getDayKey } from "@/lib/helper"
import type { ChatMessageItem } from "@/lib/types"

export interface ChatGroup {
  /** First message id: stable key. */
  key: number
  name: string
  isMine: boolean
  isBot: boolean
  messages: ChatMessageItem[]
}

const GROUP_GAP_MS = 5 * 60_000

/** Consecutive messages from the same sender, on the same day, within a few minutes read as one group. */
export function groupMessages(messages: ChatMessageItem[]): ChatGroup[] {
  const groups: ChatGroup[] = []
  for (const message of messages) {
    const last = groups[groups.length - 1]
    const previous = last?.messages[last.messages.length - 1]
    if (last && previous && last.name === message.name && last.isMine === message.isMine && getDayKey(previous.ts) === getDayKey(message.ts) && message.ts - previous.ts <= GROUP_GAP_MS) {
      last.messages.push(message)
    } else {
      groups.push({ key: message.id, name: message.name, isMine: message.isMine, isBot: message.isBot, messages: [message] })
    }
  }
  return groups
}

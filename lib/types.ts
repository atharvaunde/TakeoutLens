import type { ModuleDefinition, ModuleState } from "@/lib/constant"

export interface AuthFormState {
  error: string | null
}

export interface ModuleStatus {
  module: ModuleDefinition
  state: ModuleState
  fileCount: number
  totalBytes: number
  detail: string | null
}

export interface IndexRunSummary {
  finishedAt: number
  durationMs: number
  totalFiles: number
  added: number
  updated: number
  removed: number
  errors: number
}

export type StartIndexingResult =
  | { status: "finished"; run: IndexRunSummary | null }
  | { status: "running" }
  | { status: "already-running" }

export interface ChatConversationItem {
  id: number
  title: string
  kind: "DM" | "Space"
  messageCount: number
  lastAt: number | null
  preview: string
}

export interface ChatAttachment {
  name: string
  fileId: number | null
  kind: "image" | "video" | "other"
}

export interface ChatMessageItem {
  id: number
  seq: number
  ts: number
  name: string
  isBot: boolean
  isMine: boolean
  text: string
  attachments: ChatAttachment[]
  reactions: { emoji: string; count: number }[]
  quoted: { name: string; text: string } | null
  links: { title: string; url: string | null }[]
}

export interface ChatMessagePage {
  messages: ChatMessageItem[]
  hasOlder: boolean
  hasNewer: boolean
}

export interface ChatSearchHit {
  messageId: number
  seq: number
  convId: number
  convTitle: string
  name: string
  ts: number
  snippet: string
}

export interface MailLabelItem {
  label: string
  total: number
  unread: number
}

export interface MailAttachmentItem {
  index: number
  name: string
  mime: string
  size: number
  inline: boolean
}

export interface MailMessageView {
  id: number
  subject: string
  from: string
  to: string
  cc: string
  dateTs: number
  html: string | null
  text: string
  attachments: MailAttachmentItem[]
  labels: string[]
}

export interface CalendarInfo {
  id: number
  name: string
  eventCount: number
  color: string
  defaultVisible: boolean
}

/** Times are "wall clock" milliseconds: read them with UTC getters to get the display-timezone time. */
export interface CalendarEventItem {
  key: string
  eventId: number
  calId: number
  title: string
  startWall: number
  endWall: number
  allDay: boolean
  recurring: boolean
  location: string
}

export interface CalendarEventDetail extends CalendarEventItem {
  calendarName: string
  description: string
  organizer: string
  attendees: { name: string; email: string; status: string }[]
  meetUrl: string | null
  status: string
  rrule: string | null
}

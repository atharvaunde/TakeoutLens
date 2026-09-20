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
  /** Stored (decoded) label, used in URLs and filters. */
  label: string
  /** Display name: nested labels show their last segment, categories drop the "Category " prefix. */
  name: string
  total: number
  unread: number
  /** The label came from a MIME-encoded header (shown with a "Q" badge). */
  decoded: boolean
  depth: number
  group: "system" | "category" | "user"
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

export interface KeepNote {
  id: string
  title: string
  text: string
  items: { text: string; checked: boolean }[]
  color: string
  pinned: boolean
  archived: boolean
  trashed: boolean
  labels: string[]
  editedAt: number | null
  attachmentIds: number[]
}

export interface PhotoItem {
  id: number
  takenAt: number
  title: string
  album: string
  description: string
  hasLocation: boolean
}

export type CsvRowData = Record<string, string> & { __id: string }

export interface GlobalSearchResult {
  id: string
  label: string
  meta: string
  href: string
  moduleId: string
}

export interface IndexStatus {
  indexing: boolean
  /** Share of modules finished (0-100). */
  percent: number
  fileCount: number
  lastFinishedAt: number | null
}

export interface StackSegment {
  name: string
  bytes: number
  percent: number
}

export interface HomeData {
  totalBytes: number
  totalFiles: number
  firstYear: number | null
  lastYear: number | null
  stack: StackSegment[]
  metas: Record<string, string>
  parsed: number
  errors: number
}

export interface LockInfo {
  source: string
  files: number
  bytes: number
  indexedAt: number | null
  folderFound: boolean
}

export interface TimelineItem {
  id: string
  ts: number
  moduleId: string
  title: string
  sub: string
  href: string
}

export interface ChatConversationDetail {
  id: number
  title: string
  kind: "DM" | "Space"
  messageCount: number
  memberCount: number
  firstAt: number | null
  lastAt: number | null
}

export interface PhotoInfo {
  name: string
  width: number | null
  height: number | null
  format: string | null
  sizeBytes: number
  takenAt: number | null
  uploadedAt: number | null
  views: number | null
  description: string
  camera: string | null
  lens: string | null
  exposureSeconds: number | null
  aperture: number | null
  iso: number | null
  focalLengthMm: number | null
  software: string | null
  latitude: number | null
  longitude: number | null
  googleUrl: string | null
  origin: string | null
}

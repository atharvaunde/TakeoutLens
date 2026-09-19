import fs from "node:fs"
import path from "node:path"
import PostalMime, { type Attachment } from "postal-mime"

import type { MailRow } from "@/columns/mail-messages.column"
import { MAIL_INDEX, MAIL_VIEW } from "@/lib/constant"
import { toFtsQuery, type TableParams } from "@/lib/helper"
import type { MailAttachmentItem, MailLabelItem, MailMessageView } from "@/lib/types"
import { requireSession } from "@/server/auth/session"
import { getConfig } from "@/server/config"
import { getDb } from "@/server/db"
import { readMessage } from "@/server/indexer/mbox"

export async function listMailLabels(): Promise<MailLabelItem[]> {
  await requireSession()
  const rows = getDb()
    .prepare(
      `SELECT l.label AS label, count(*) AS total, sum(m.unread) AS unread
       FROM mail_labels l JOIN mail_messages m ON m.id = l.message_id
       WHERE m.source = 'mail' GROUP BY l.label`
    )
    .all() as { label: string; total: number; unread: number }[]
  const visible = rows.filter((r) => !MAIL_INDEX.hiddenLabels.includes(r.label))
  const rank = (label: string) => {
    const i = MAIL_INDEX.systemLabelOrder.indexOf(label)
    return i === -1 ? MAIL_INDEX.systemLabelOrder.length : i
  }
  return visible
    .map((r) => ({ label: r.label, total: r.total, unread: r.unread ?? 0 }))
    .sort((a, b) => rank(a.label) - rank(b.label) || a.label.localeCompare(b.label))
}

const SORTABLE: Record<string, string> = { date: "m.date_ts", from: "m.from_name COLLATE NOCASE", subject: "m.subject COLLATE NOCASE" }

interface ListRow {
  id: number
  thread_id: string
  subject: string
  from_name: string
  from_email: string
  snippet: string
  date_ts: number
  attach_count: number
  unread: number
}

export async function listMailMessages(params: TableParams, label: string | null): Promise<{ rows: MailRow[]; total: number }> {
  await requireSession()
  const db = getDb()
  const joins: string[] = []
  const where: string[] = ["m.source = 'mail'"]
  const args: (string | number)[] = []
  const match = toFtsQuery(params.search)
  if (match) {
    joins.push("JOIN mail_fts ON mail_fts.rowid = m.id")
    where.push("mail_fts MATCH ?")
    args.push(match)
  }
  if (label) {
    joins.push("JOIN mail_labels l ON l.message_id = m.id")
    where.push("l.label = ?")
    args.push(label)
  }
  const base = `FROM mail_messages m ${joins.join(" ")} WHERE ${where.join(" AND ")}`
  const sortColumn = params.sort && SORTABLE[params.sort] ? SORTABLE[params.sort] : "m.date_ts"
  const direction = params.sort && SORTABLE[params.sort] ? (params.dir === "desc" ? "DESC" : "ASC") : "DESC"
  const total = db.prepare(`SELECT count(*) ${base}`).pluck().get(...args) as number
  const rows = db
    .prepare(
      `SELECT m.id, m.thread_id, m.subject, m.from_name, m.from_email, m.snippet, m.date_ts, m.attach_count, m.unread
       ${base} ORDER BY ${sortColumn} ${direction}, m.id DESC LIMIT ? OFFSET ?`
    )
    .all(...args, params.pageSize, (params.page - 1) * params.pageSize) as ListRow[]
  return {
    total,
    rows: rows.map((r) => ({
      id: String(r.id),
      messageId: r.id,
      threadId: r.thread_id,
      from: r.from_name || r.from_email,
      subject: r.subject,
      snippet: r.snippet,
      date: new Date(r.date_ts).toISOString(),
      hasAttachment: r.attach_count > 0,
      unread: r.unread === 1,
      href: "",
    })),
  }
}

interface Located {
  id: number
  file_rel: string
  byte_offset: number
  byte_length: number
  thread_id: string
}

function locate(id: number): Located | undefined {
  return getDb().prepare("SELECT id, file_rel, byte_offset, byte_length, thread_id FROM mail_messages WHERE id = ?").get(id) as Located | undefined
}

function readRaw(row: Located): Buffer {
  const fd = fs.openSync(path.join(getConfig().takeoutDir, row.file_rel), "r")
  try {
    return readMessage(fd, { offset: row.byte_offset, length: row.byte_length })
  } finally {
    fs.closeSync(fd)
  }
}

const format = (a: { name?: string; address?: string } | undefined) => (a ? (a.name ? `${a.name} <${a.address ?? ""}>` : (a.address ?? "")) : "")

function toItem(a: Attachment, index: number): MailAttachmentItem {
  return {
    index,
    name: a.filename || `attachment-${index + 1}`,
    mime: a.mimeType,
    size: typeof a.content === "string" ? a.content.length : a.content.byteLength,
    inline: a.disposition === "inline" && Boolean(a.contentId),
  }
}

/** Replace cid: references with data URIs so inline images display without any network access. */
export function inlineCidImages(html: string, attachments: Attachment[]): string {
  return html.replace(/cid:([^"'\s)>]+)/gi, (whole, cid: string) => {
    const wanted = decodeURIComponent(cid).replace(/^<|>$/g, "")
    const found = attachments.find((a) => a.contentId?.replace(/^<|>$/g, "") === wanted)
    if (!found || typeof found.content === "string" || found.content.byteLength > MAIL_VIEW.inlineImageMaxBytes) return whole
    return `data:${found.mimeType};base64,${Buffer.from(new Uint8Array(found.content)).toString("base64")}`
  })
}

async function parseMessage(row: Located): Promise<MailMessageView> {
  const mail = await new PostalMime().parse(readRaw(row))
  const labels = (mail.headers.find((h) => h.key === "x-gmail-labels")?.value ?? "").split(",").map((l) => l.trim()).filter(Boolean)
  return {
    id: row.id,
    subject: mail.subject ?? "",
    from: format(mail.from),
    to: (mail.to ?? []).map(format).join(", "),
    cc: (mail.cc ?? []).map(format).join(", "),
    dateTs: mail.date ? Date.parse(mail.date) || 0 : 0,
    html: mail.html ? inlineCidImages(mail.html, mail.attachments) : null,
    text: mail.text ?? "",
    attachments: mail.attachments.map(toItem),
    labels: labels.filter((l) => !MAIL_INDEX.hiddenLabels.includes(l)),
  }
}

/** All messages in the thread of `messageId`, oldest first, parsed on demand from the mbox. */
export async function getThread(messageId: number): Promise<MailMessageView[]> {
  await requireSession()
  const row = locate(messageId)
  if (!row) return []
  const siblings = getDb()
    .prepare("SELECT id, file_rel, byte_offset, byte_length, thread_id FROM mail_messages WHERE thread_id = ? AND source = 'mail' ORDER BY date_ts, id")
    .all(row.thread_id) as Located[]
  return Promise.all(siblings.map(parseMessage))
}

export interface MailDownload {
  body: Uint8Array
  fileName: string
  mime: string
}

/** A single attachment (by index) or the whole message as .eml (`index === "eml"`), for the download route. */
export async function getMailDownload(messageId: number, index: string): Promise<MailDownload | null> {
  const row = locate(messageId)
  if (!row) return null
  if (index === "eml") return { body: readRaw(row), fileName: `message-${row.id}.eml`, mime: "message/rfc822" }
  const mail = await new PostalMime().parse(readRaw(row))
  const attachment = mail.attachments[Number(index)]
  if (!attachment || typeof attachment.content === "string") return null
  return { body: new Uint8Array(attachment.content), fileName: attachment.filename || `attachment-${Number(index) + 1}`, mime: attachment.mimeType }
}

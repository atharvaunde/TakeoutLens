import fs from "node:fs"
import path from "node:path"
import PostalMime, { type Email } from "postal-mime"

import { MAIL_INDEX } from "@/lib/constant"
import type { Db } from "@/server/db"
import { readMessage, scanMbox } from "./mbox"

const MBOX_REL = "Mail/All mail Including Spam and Trash.mbox"

export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

const header = (mail: Email, key: string) => mail.headers.find((h) => h.key === key)?.value

export interface IndexedMail {
  subject: string
  fromName: string
  fromEmail: string
  toText: string
  dateTs: number
  snippet: string
  body: string
  attachCount: number
  labels: string[]
  threadId: string
  messageId: string | null
  unread: boolean
}

export async function parseForIndex(raw: Buffer, guarded: boolean): Promise<IndexedMail> {
  const mail = await new PostalMime().parse(raw)
  const text = (mail.text ?? (mail.html ? stripHtml(mail.html) : "")).replace(/\s+/g, " ").trim()
  const labels = (header(mail, "x-gmail-labels") ?? "")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean)
  const to = [...(mail.to ?? []), ...(mail.cc ?? [])].map((a) => a.name || a.address || "").filter(Boolean)
  const date = mail.date ? Date.parse(mail.date) : Number.NaN
  return {
    subject: mail.subject ?? "",
    fromName: mail.from?.name || mail.from?.address || "",
    fromEmail: mail.from?.address ?? "",
    toText: to.join(", "),
    dateTs: Number.isNaN(date) ? 0 : date,
    snippet: text.slice(0, MAIL_INDEX.snippetChars),
    body: text.slice(0, 64 * 1024),
    attachCount: guarded ? Math.max(mail.attachments.length, 1) : mail.attachments.filter((a) => a.disposition !== "inline" || !a.related).length,
    labels,
    threadId: header(mail, "x-gm-thrid") ?? mail.messageId ?? "",
    messageId: mail.messageId ?? null,
    unread: labels.includes("Unread"),
  }
}

export interface MboxImport {
  /** Path of the mbox relative to the export root. */
  rel: string
  /** `mail` for the Gmail mbox, `group:<email>` for a Google Group's topics.mbox. */
  source: string
}

/** Import one mbox: per-message offsets + headers + capped body text into FTS. Skips if the file is unchanged. */
export async function importMbox(db: Db, root: string, { rel, source }: MboxImport) {
  const file = path.join(root, rel)
  if (!fs.existsSync(file)) return
  const stat = fs.statSync(file)
  const signature = `${stat.size}:${Math.floor(stat.mtimeMs)}`
  const signatureKey = source === "mail" ? "mail_signature" : `mbox_signature:${source}`
  const previous = db.prepare("SELECT value FROM kv WHERE key = ?").pluck().get(signatureKey) as string | undefined
  if (previous === signature) return

  const entries = await scanMbox(file)
  const fd = fs.openSync(file, "r")
  const insert = db.prepare(
    `INSERT INTO mail_messages (source, file_rel, byte_offset, byte_length, message_id, thread_id, subject, from_name, from_email, to_text, date_ts, snippet, attach_count, unread)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertLabel = db.prepare("INSERT OR IGNORE INTO mail_labels (message_id, label) VALUES (?, ?)")
  const insertFts = db.prepare("INSERT INTO mail_fts (rowid, subject, sender, recipients, body) VALUES (?, ?, ?, ?, ?)")
  const logError = db.prepare("INSERT INTO index_errors (module, path, reason, occurred_at) VALUES (?, ?, ?, ?)")
  const errorModule = source === "mail" ? "mail" : "groups"

  db.exec("BEGIN")
  try {
    db.prepare("DELETE FROM mail_fts WHERE rowid IN (SELECT id FROM mail_messages WHERE source = ?)").run(source)
    db.prepare("DELETE FROM mail_labels WHERE message_id IN (SELECT id FROM mail_messages WHERE source = ?)").run(source)
    db.prepare("DELETE FROM mail_messages WHERE source = ?").run(source)
    db.exec("COMMIT")
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }

  let batch = 0
  db.exec("BEGIN")
  try {
    for (const entry of entries) {
      const guarded = entry.length > MAIL_INDEX.guardBytes
      try {
        const parsed = await parseForIndex(readMessage(fd, entry, guarded ? MAIL_INDEX.guardHeadBytes : Infinity), guarded)
        const id = Number(
          insert.run(
            source, rel, entry.offset, entry.length, parsed.messageId, parsed.threadId || `${source}:${entry.offset}`, parsed.subject,
            parsed.fromName, parsed.fromEmail, parsed.toText, parsed.dateTs, parsed.snippet, parsed.attachCount, parsed.unread ? 1 : 0
          ).lastInsertRowid
        )
        for (const label of parsed.labels) insertLabel.run(id, label)
        insertFts.run(id, parsed.subject, `${parsed.fromName} ${parsed.fromEmail}`, parsed.toText, parsed.body)
      } catch (error) {
        logError.run(errorModule, `${rel}@${entry.offset}`, `Cannot parse message: ${(error as Error).message}`, Date.now())
      }
      if (++batch % 500 === 0) {
        db.exec("COMMIT")
        db.exec("BEGIN")
      }
    }
    db.prepare("INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(signatureKey, signature)
    db.exec("COMMIT")
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  } finally {
    fs.closeSync(fd)
  }
}

export const indexMail = (db: Db, root: string) => importMbox(db, root, { rel: MBOX_REL, source: "mail" })

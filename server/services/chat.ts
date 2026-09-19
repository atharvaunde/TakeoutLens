import { CHAT, type ChatKind } from "@/lib/constant"
import { getFileKind, toFtsQuery } from "@/lib/helper"
import type { ChatConversationItem, ChatMessageItem, ChatMessagePage, ChatSearchHit } from "@/lib/types"
import { requireSession } from "@/server/auth/session"
import { getConfig } from "@/server/config"
import { getDb } from "@/server/db"
import fs from "node:fs"
import path from "node:path"

interface ConvRow {
  id: number
  title: string
  kind: "DM" | "Space"
  message_count: number
  last_at: number | null
  preview: string | null
}

export async function listConversations(kind: ChatKind, search: string): Promise<ChatConversationItem[]> {
  await requireSession()
  const where: string[] = []
  const args: (string | number)[] = []
  if (kind !== "all") {
    where.push("c.kind = ?")
    args.push(kind)
  }
  if (search.trim()) {
    where.push("c.title LIKE ? ESCAPE '\\'")
    args.push(`%${search.trim().replace(/[\\%_]/g, "\\$&")}%`)
  }
  const rows = getDb()
    .prepare(
      `SELECT c.id, c.title, c.kind, c.message_count, c.last_at,
              (SELECT text FROM chat_messages m WHERE m.conv_id = c.id ORDER BY m.seq DESC LIMIT 1) AS preview
       FROM chat_conversations c ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
       ORDER BY c.last_at DESC`
    )
    .all(...args) as ConvRow[]
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    messageCount: r.message_count,
    lastAt: r.last_at,
    preview: (r.preview ?? "").slice(0, 120),
  }))
}

export async function getConversation(id: number): Promise<{ id: number; title: string; kind: "DM" | "Space"; messageCount: number; memberCount: number } | null> {
  await requireSession()
  const r = getDb().prepare("SELECT id, title, kind, message_count, member_count FROM chat_conversations WHERE id = ?").get(id) as
    | { id: number; title: string; kind: "DM" | "Space"; message_count: number; member_count: number }
    | undefined
  return r ? { id: r.id, title: r.title, kind: r.kind, messageCount: r.message_count, memberCount: r.member_count } : null
}

let cachedOwner: { dataDir: string; email: string | null } | null = null
function ownerEmail(): string | null {
  const { takeoutDir } = getConfig()
  if (cachedOwner?.dataDir === takeoutDir) return cachedOwner.email
  let email: string | null = null
  const usersDir = path.join(takeoutDir, "Google Chat", "Users")
  try {
    for (const entry of fs.readdirSync(usersDir)) {
      const info = JSON.parse(fs.readFileSync(path.join(usersDir, entry, "user_info.json"), "utf8")) as { user?: { email?: string } }
      if (info.user?.email) email = info.user.email
    }
  } catch {
    // no owner info
  }
  cachedOwner = { dataDir: takeoutDir, email }
  return email
}

interface MsgRow {
  id: number
  seq: number
  ts: number
  creator_name: string
  creator_email: string
  is_bot: number
  text: string
  attachments: string | null
  reactions: string | null
  quoted: string | null
  links: string | null
}

const parse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function toMessage(r: MsgRow, owner: string | null): ChatMessageItem {
  return {
    id: r.id,
    seq: r.seq,
    ts: r.ts,
    name: r.creator_name,
    isBot: r.is_bot === 1,
    isMine: owner !== null && r.creator_email === owner,
    text: r.text,
    attachments: parse<{ name: string; fileId: number | null }[]>(r.attachments, []).map((a) => ({ ...a, kind: getFileKind(a.name) })),
    reactions: parse(r.reactions, []),
    quoted: parse(r.quoted, null),
    links: parse(r.links, []),
  }
}

const COLUMNS = "id, seq, ts, creator_name, creator_email, is_bot, text, attachments, reactions, quoted, links"

/**
 * A window of messages in chronological order: the latest page, the page before `beforeSeq`,
 * the page after `afterSeq`, or a page centred on `aroundSeq` (used when opening a search hit).
 */
export async function getMessages(
  convId: number,
  opts: { beforeSeq?: number; afterSeq?: number; aroundSeq?: number } = {}
): Promise<ChatMessagePage> {
  await requireSession()
  const db = getDb()
  const limit = CHAT.pageSize
  let rows: MsgRow[]
  if (opts.aroundSeq !== undefined) {
    const start = Math.max(opts.aroundSeq - Math.floor(limit / 2), 0)
    rows = db.prepare(`SELECT ${COLUMNS} FROM chat_messages WHERE conv_id = ? AND seq >= ? ORDER BY seq LIMIT ?`).all(convId, start, limit) as MsgRow[]
  } else if (opts.afterSeq !== undefined) {
    rows = db.prepare(`SELECT ${COLUMNS} FROM chat_messages WHERE conv_id = ? AND seq > ? ORDER BY seq LIMIT ?`).all(convId, opts.afterSeq, limit) as MsgRow[]
  } else {
    const before = opts.beforeSeq ?? Number.MAX_SAFE_INTEGER
    rows = (db.prepare(`SELECT ${COLUMNS} FROM chat_messages WHERE conv_id = ? AND seq < ? ORDER BY seq DESC LIMIT ?`).all(convId, before, limit) as MsgRow[]).reverse()
  }
  const owner = ownerEmail()
  const first = rows[0]?.seq
  const last = rows.at(-1)?.seq
  const hasOlder = first !== undefined && (db.prepare("SELECT 1 FROM chat_messages WHERE conv_id = ? AND seq < ? LIMIT 1").get(convId, first) !== undefined)
  const hasNewer = last !== undefined && (db.prepare("SELECT 1 FROM chat_messages WHERE conv_id = ? AND seq > ? LIMIT 1").get(convId, last) !== undefined)
  return { messages: rows.map((r) => toMessage(r, owner)), hasOlder, hasNewer }
}

export async function searchMessages(query: string, convId?: number): Promise<ChatSearchHit[]> {
  await requireSession()
  const match = toFtsQuery(query)
  if (!match) return []
  const rows = getDb()
    .prepare(
      `SELECT m.id AS messageId, m.seq, m.conv_id AS convId, c.title AS convTitle, m.creator_name AS name, m.ts,
              snippet(chat_fts, 0, ?, ?, '…', 16) AS snippet
       FROM chat_fts JOIN chat_messages m ON m.id = chat_fts.rowid JOIN chat_conversations c ON c.id = m.conv_id
       WHERE chat_fts MATCH ? ${convId ? "AND m.conv_id = ?" : ""}
       ORDER BY rank LIMIT ?`
    )
    .all(CHAT.snippetStart, CHAT.snippetEnd, match, ...(convId ? [convId] : []), CHAT.searchLimit) as ChatSearchHit[]
  return rows
}

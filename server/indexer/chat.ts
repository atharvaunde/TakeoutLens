import fs from "node:fs"
import path from "node:path"

import type { Db } from "@/server/db"
import { parseChatDate } from "./chat-date"

const GROUPS = "Google Chat/Groups"

interface Person {
  name?: string
  email?: string
  user_type?: string
}
interface RawMessage {
  creator?: Person
  created_date?: string
  text?: string
  fallback_text?: string
  annotations?: { drive_metadata?: { id?: string; title?: string }; url_metadata?: { url?: string; title?: string } }[]
  attached_files?: { original_name?: string; export_name?: string }[]
  reactions?: { emoji?: { unicode?: string; custom_emoji?: { shortcode?: string } }; reactor_emails?: string[] }[]
  quoted_message_metadata?: { creator?: Person; text?: string; attached_files?: unknown[] }
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T
  } catch {
    return null
  }
}

function ownerEmail(root: string): string | null {
  const usersDir = path.join(root, "Google Chat", "Users")
  try {
    for (const entry of fs.readdirSync(usersDir)) {
      const info = readJson<{ user?: Person }>(path.join(usersDir, entry, "user_info.json"))
      if (info?.user?.email) return info.user.email
    }
  } catch {
    // no Users folder
  }
  return null
}

export function conversationTitle(kind: "DM" | "Space", name: string | undefined, members: Person[], owner: string | null): string {
  if (kind === "Space" && name && name !== "Group Chat") return name
  const others = members.filter((m) => m.email !== owner).map((m) => m.name || m.email || "Unknown")
  return others.length ? others.slice(0, 4).join(", ") + (others.length > 4 ? ` +${others.length - 4}` : "") : name || "Conversation"
}

/** Import every conversation (messages + FTS). Unchanged conversations (same size/mtime) are skipped. */
export function indexChat(db: Db, root: string) {
  const groupsDir = path.join(root, GROUPS)
  if (!fs.existsSync(groupsDir)) return
  const owner = ownerEmail(root)

  const fileIds = new Map<string, number>(
    (db.prepare("SELECT id, rel_path FROM files WHERE module = 'chat'").all() as { id: number; rel_path: string }[]).map((r) => [r.rel_path, r.id])
  )
  const known = new Map(
    (db.prepare("SELECT folder, source_size, source_mtime FROM chat_conversations").all() as { folder: string; source_size: number; source_mtime: number }[]).map((r) => [r.folder, r])
  )
  const seen = new Set<string>()

  const insertConv = db.prepare(
    `INSERT INTO chat_conversations (folder, kind, title, member_count, message_count, first_at, last_at, source_size, source_mtime)
     VALUES (@folder, @kind, @title, @members, @count, @first, @last, @size, @mtime)`
  )
  const insertMsg = db.prepare(
    `INSERT INTO chat_messages (conv_id, seq, ts, creator_name, creator_email, is_bot, text, attachments, reactions, quoted, links)
     VALUES (@conv, @seq, @ts, @name, @email, @bot, @text, @attachments, @reactions, @quoted, @links)`
  )
  const insertFts = db.prepare("INSERT INTO chat_fts (rowid, text, creator) VALUES (?, ?, ?)")
  const logError = db.prepare("INSERT INTO index_errors (module, path, reason, occurred_at) VALUES ('chat', ?, ?, ?)")

  const removeConv = (folder: string) => {
    const id = db.prepare("SELECT id FROM chat_conversations WHERE folder = ?").pluck().get(folder) as number | undefined
    if (id === undefined) return
    db.prepare("DELETE FROM chat_fts WHERE rowid IN (SELECT id FROM chat_messages WHERE conv_id = ?)").run(id)
    db.prepare("DELETE FROM chat_messages WHERE conv_id = ?").run(id)
    db.prepare("DELETE FROM chat_conversations WHERE id = ?").run(id)
  }

  for (const folder of fs.readdirSync(groupsDir)) {
    const messagesFile = path.join(groupsDir, folder, "messages.json")
    if (!fs.existsSync(messagesFile)) continue
    seen.add(folder)
    const stat = fs.statSync(messagesFile)
    const mtime = Math.floor(stat.mtimeMs)
    const previous = known.get(folder)
    if (previous && previous.source_size === stat.size && previous.source_mtime === mtime) continue

    const rel = `${GROUPS}/${folder}/messages.json`
    const data = readJson<{ messages?: RawMessage[] }>(messagesFile)
    if (!data?.messages) {
      logError.run(rel, "Invalid or missing messages array", Date.now())
      continue
    }
    const info = readJson<{ name?: string; members?: Person[] }>(path.join(groupsDir, folder, "group_info.json"))
    const kind: "DM" | "Space" = folder.startsWith("DM ") ? "DM" : "Space"

    db.transaction(() => {
      removeConv(folder)
      const messages = data.messages!
        .map((m, index) => ({ m, index, ts: parseChatDate(m.created_date ?? "") }))
        .filter((entry) => {
          if (entry.ts === null) logError.run(rel, `Unparseable date: ${entry.m.created_date ?? "(missing)"}`, Date.now())
          return entry.ts !== null
        })
        .sort((a, b) => (a.ts as number) - (b.ts as number) || a.index - b.index)

      // group_info can omit people (deleted users only appear in messages), so use both sources.
      const byEmail = new Map<string, Person>()
      for (const person of [...(info?.members ?? []), ...data.messages!.map((m) => m.creator ?? {})]) {
        const key = person.email || person.name
        if (key && !byEmail.has(key)) byEmail.set(key, person)
      }
      const members = [...byEmail.values()]

      const convId = Number(
        insertConv.run({
          folder,
          kind,
          title: conversationTitle(kind, info?.name, members, owner),
          members: members.length,
          count: messages.length,
          first: messages[0]?.ts ?? null,
          last: messages.at(-1)?.ts ?? null,
          size: stat.size,
          mtime,
        }).lastInsertRowid
      )

      messages.forEach(({ m, ts }, seq) => {
        const attachments = (m.attached_files ?? []).map((a) => ({
          name: a.original_name ?? a.export_name ?? "file",
          fileId: a.export_name ? (fileIds.get(`${GROUPS}/${folder}/${a.export_name}`) ?? null) : null,
        }))
        const reactions = (m.reactions ?? []).map((r) => ({
          emoji: r.emoji?.unicode ?? (r.emoji?.custom_emoji?.shortcode ? `:${r.emoji.custom_emoji.shortcode}:` : "?"),
          count: r.reactor_emails?.length ?? 1,
        }))
        const links = (m.annotations ?? [])
          .map((a) => a.drive_metadata?.title ? { title: a.drive_metadata.title, url: a.drive_metadata.id ? `https://drive.google.com/open?id=${a.drive_metadata.id}` : null } : a.url_metadata?.url ? { title: a.url_metadata.title ?? a.url_metadata.url, url: a.url_metadata.url } : null)
          .filter(Boolean)
        const text = m.text ?? m.fallback_text ?? ""
        const id = Number(
          insertMsg.run({
            conv: convId,
            seq,
            ts,
            name: m.creator?.name ?? m.creator?.email ?? "Unknown",
            email: m.creator?.email ?? "",
            bot: m.creator?.user_type === "Bot" ? 1 : 0,
            text,
            attachments: attachments.length ? JSON.stringify(attachments) : null,
            reactions: reactions.length ? JSON.stringify(reactions) : null,
            quoted: m.quoted_message_metadata ? JSON.stringify({ name: m.quoted_message_metadata.creator?.name ?? "", text: m.quoted_message_metadata.text ?? "" }) : null,
            links: links.length ? JSON.stringify(links) : null,
          }).lastInsertRowid
        )
        insertFts.run(id, text, m.creator?.name ?? "")
      })
    })()
  }

  for (const folder of known.keys()) if (!seen.has(folder)) db.transaction(() => removeConv(folder))()
}

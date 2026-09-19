import path from "node:path"

import type { ContactRow } from "@/columns/contacts.column"
import type { TableParams } from "@/lib/helper"
import { requireSession } from "@/server/auth/session"
import { getDb } from "@/server/db"
import { readTakeoutText } from "@/server/files/read"

interface ParsedCard {
  name: string
  emails: string[]
  phones: string[]
  org: string
  title: string
  address: string
  note: string
  birthday: string
}

const unfold = (text: string) => text.replace(/\r?\n[ \t]/g, "")
const decode = (v: string) => v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\;/g, ";").replace(/\\\\/g, "\\").trim()

/** Minimal vCard reader for Google's exports (names, emails, phones, org, address, note, birthday). */
export function parseVcf(text: string): ParsedCard[] {
  const cards: ParsedCard[] = []
  for (const block of unfold(text).split(/BEGIN:VCARD/i).slice(1)) {
    const card: ParsedCard = { name: "", emails: [], phones: [], org: "", title: "", address: "", note: "", birthday: "" }
    let structuredName = ""
    for (const line of block.split(/\r?\n/)) {
      const colon = line.indexOf(":")
      if (colon === -1) continue
      const key = line.slice(0, colon).split(";")[0].replace(/^item\d+\./i, "").toUpperCase()
      const value = decode(line.slice(colon + 1))
      if (!value) continue
      if (key === "FN") card.name = value
      else if (key === "N") structuredName = value.split(";").filter(Boolean).reverse().join(" ").trim()
      else if (key === "EMAIL") card.emails.push(value)
      else if (key === "TEL") card.phones.push(value)
      else if (key === "ORG") card.org = value.replace(/;+/g, " ").trim()
      else if (key === "TITLE") card.title = value
      else if (key === "ADR") card.address = value.split(";").filter(Boolean).join(", ")
      else if (key === "NOTE") card.note = value
      else if (key === "BDAY") card.birthday = value
    }
    card.name = card.name || structuredName || card.emails[0] || card.phones[0] || ""
    if (card.name) cards.push(card)
  }
  return cards
}

const key = (c: ParsedCard) => (c.emails[0] ?? c.name).toLowerCase()

function loadFolder(folder: string): ParsedCard[] {
  return parseVcf(readTakeoutText(`Contacts/${folder}/${folder}.vcf`)?.text ?? "")
}

export async function listContacts(params: TableParams): Promise<{ rows: ContactRow[]; total: number }> {
  await requireSession()
  const all = loadFolder("All Contacts")
  const mine = new Set(loadFolder("My Contacts").map(key))
  const starred = new Set(loadFolder("Starred in Android").map(key))
  const base = all.length ? all : [...loadFolder("My Contacts"), ...loadFolder("Starred in Android")]

  const photos = new Map(
    (getDb().prepare("SELECT id, rel_path FROM files WHERE module = 'contacts' AND rel_path LIKE 'Contacts/All Contacts/%' AND rel_path LIKE '%.jpg'").all() as { id: number; rel_path: string }[]).map((r) => [
      path.posix.basename(r.rel_path, ".jpg").toLowerCase(),
      r.id,
    ])
  )

  const needle = params.search.toLowerCase()
  const source = params.filters.source
  let rows: ContactRow[] = base
    .map((c, index) => ({
      id: String(index),
      name: c.name,
      email: c.emails.join(", "),
      phone: c.phones.join(", "),
      org: [c.org, c.title].filter(Boolean).join(" · "),
      address: c.address,
      note: c.note,
      birthday: c.birthday,
      photoId: photos.get(c.name.toLowerCase()) ?? null,
      isMine: mine.has(key(c)),
      isStarred: starred.has(key(c)),
    }))
    .filter((r) => (!source || (source === "my" ? r.isMine : r.isStarred)) && (!needle || `${r.name} ${r.email} ${r.phone} ${r.org}`.toLowerCase().includes(needle)))

  const direction = params.dir === "desc" ? -1 : 1
  const sortKey = (r: ContactRow) => (params.sort === "org" ? r.org : params.sort === "email" ? r.email : r.name).toLowerCase()
  rows = [...rows].sort((a, b) => (sortKey(a) > sortKey(b) ? 1 : sortKey(a) < sortKey(b) ? -1 : 0) * direction)
  const start = (params.page - 1) * params.pageSize
  return { rows: rows.slice(start, start + params.pageSize), total: rows.length }
}

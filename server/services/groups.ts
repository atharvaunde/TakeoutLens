import fs from "node:fs"
import path from "node:path"

import type { GroupMemberRow } from "@/columns/group-members.column"
import type { TableParams } from "@/lib/helper"
import { requireSession } from "@/server/auth/session"
import { parseCsv } from "@/server/csv"
import { getConfig } from "@/server/config"
import { getDb } from "@/server/db"
import { readTakeoutText } from "@/server/files/read"

export interface GroupSummary {
  email: string
  name: string
  description: string
  memberCount: number
  discussionCount: number
}

function groupDirs(): { email: string; rel: string }[] {
  const groupsRoot = path.join(getConfig().takeoutDir, "Groups")
  const found: { email: string; rel: string }[] = []
  if (!fs.existsSync(groupsRoot)) return found
  for (const domain of fs.readdirSync(groupsRoot)) {
    const owned = path.join(groupsRoot, domain, "owned groups")
    if (!fs.existsSync(owned)) continue
    for (const email of fs.readdirSync(owned)) found.push({ email, rel: `Groups/${domain}/owned groups/${email}` })
  }
  return found
}

const csvAt = (rel: string) => parseCsv(readTakeoutText(rel)?.text ?? "")

export async function listGroups(): Promise<GroupSummary[]> {
  await requireSession()
  const db = getDb()
  return groupDirs()
    .map(({ email, rel }) => {
      const info = csvAt(`${rel}/info.csv`).rows[0] ?? {}
      return {
        email,
        name: info.name || email,
        description: info.description ?? "",
        memberCount: csvAt(`${rel}/members.csv`).rows.length,
        discussionCount: db.prepare("SELECT count(DISTINCT thread_id) FROM mail_messages WHERE source = ?").pluck().get(`group:${email}`) as number,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getGroup(email: string): Promise<GroupSummary | null> {
  return (await listGroups()).find((g) => g.email === email) ?? null
}

export async function listGroupMembers(email: string, params: TableParams): Promise<{ rows: GroupMemberRow[]; total: number }> {
  await requireSession()
  const dir = groupDirs().find((g) => g.email === email)
  if (!dir) return { rows: [], total: 0 }
  const needle = params.search.toLowerCase()
  const rows = csvAt(`${dir.rel}/members.csv`)
    .rows.map((r, index) => ({
      id: String(index),
      name: r.displayName ?? "",
      email: r.email ?? "",
      role: r.role ?? "",
      delivery: r.emailDeliverySetting ?? "",
      updatedAt: r.updatedTimestamp || null,
    }))
    .filter((m) => !needle || `${m.name} ${m.email}`.toLowerCase().includes(needle))
  const start = (params.page - 1) * params.pageSize
  return { rows: rows.slice(start, start + params.pageSize), total: rows.length }
}

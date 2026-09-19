import fs from "node:fs"
import path from "node:path"

import type { Db } from "@/server/db"
import { importMbox } from "./mail"

/** Every topics.mbox under Groups/<domain>/owned groups/<group>/ becomes a `group:<email>` mail source. */
export function findGroupMboxes(root: string): { rel: string; group: string }[] {
  const found: { rel: string; group: string }[] = []
  const groupsRoot = path.join(root, "Groups")
  if (!fs.existsSync(groupsRoot)) return found
  for (const domain of fs.readdirSync(groupsRoot)) {
    const owned = path.join(groupsRoot, domain, "owned groups")
    if (!fs.existsSync(owned)) continue
    for (const group of fs.readdirSync(owned)) {
      const rel = `Groups/${domain}/owned groups/${group}/topics.mbox`
      if (fs.existsSync(path.join(root, rel))) found.push({ rel, group })
    }
  }
  return found
}

export async function indexGroups(db: Db, root: string) {
  for (const { rel, group } of findGroupMboxes(root)) await importMbox(db, root, { rel, source: `group:${group}` })
}

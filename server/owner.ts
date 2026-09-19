import fs from "node:fs"
import path from "node:path"

import { getConfig } from "@/server/config"

let cached: { key: string; email: string | null } | null = null

/** The account owner's email, from the user_info.json files under Google Chat/Users (null if the export has none). */
export function getOwnerEmail(): string | null {
  const { takeoutDir } = getConfig()
  if (cached?.key === takeoutDir) return cached.email
  let email: string | null = null
  const usersDir = path.join(takeoutDir, "Google Chat", "Users")
  try {
    for (const entry of fs.readdirSync(usersDir)) {
      const info = JSON.parse(fs.readFileSync(path.join(usersDir, entry, "user_info.json"), "utf8")) as { user?: { email?: string } }
      if (info.user?.email) email = info.user.email
    }
  } catch {
    // no owner info in this export
  }
  cached = { key: takeoutDir, email }
  return email
}

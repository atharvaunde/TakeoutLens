import fs from "node:fs"

import { getConfig } from "@/server/config"
import { resolveWithinRoot } from "./resolve"

export interface TakeoutText {
  text: string
  truncated: boolean
}

/** Read a UTF-8 file from the export (never outside it), capped so big files cannot exhaust memory. */
export function readTakeoutText(relPath: string, maxBytes = 5_000_000): TakeoutText | null {
  const abs = resolveWithinRoot(getConfig().takeoutDir, relPath)
  if (!abs) return null
  try {
    const size = fs.statSync(abs).size
    const fd = fs.openSync(abs, "r")
    try {
      const length = Math.min(size, maxBytes)
      const buffer = Buffer.alloc(length)
      fs.readSync(fd, buffer, 0, length, 0)
      return { text: buffer.toString("utf8"), truncated: size > maxBytes }
    } finally {
      fs.closeSync(fd)
    }
  } catch {
    return null
  }
}

/** Parse a JSON file from the export; null if missing, too large or invalid. */
export function readTakeoutJson<T>(relPath: string, maxBytes = 20_000_000): T | null {
  const file = readTakeoutText(relPath, maxBytes)
  if (!file || file.truncated) return null
  try {
    return JSON.parse(file.text) as T
  } catch {
    return null
  }
}

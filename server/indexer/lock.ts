import fs from "node:fs"
import path from "node:path"

const LOCK_FILE = "indexer.lock"

function isAlive(pid: number) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** Single-instance lock so two indexer processes never write at once. Returns a release function, or null if already running. */
export function acquireLock(dataDir: string): (() => void) | null {
  fs.mkdirSync(dataDir, { recursive: true })
  const file = path.join(dataDir, LOCK_FILE)
  if (fs.existsSync(file)) {
    const pid = Number.parseInt(fs.readFileSync(file, "utf8"), 10)
    if (Number.isInteger(pid) && isAlive(pid)) return null
  }
  fs.writeFileSync(file, String(process.pid))
  return () => fs.rmSync(file, { force: true })
}

export function isIndexerRunning(dataDir: string): boolean {
  try {
    const pid = Number.parseInt(fs.readFileSync(path.join(dataDir, LOCK_FILE), "utf8"), 10)
    return Number.isInteger(pid) && isAlive(pid)
  } catch {
    return false
  }
}

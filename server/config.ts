import fs from "node:fs"
import path from "node:path"

import { DEFAULT_DIRS, ENV, MODULES, TAKEOUT_WRAPPER_FOLDER } from "@/lib/constant"

const PRODUCT_FOLDERS: ReadonlySet<string> = new Set(MODULES.flatMap((m) => m.sourceFolders))

function isDirectory(dir: string) {
  try {
    return fs.statSync(dir).isDirectory()
  } catch {
    return false
  }
}

function containsProductFolder(dir: string) {
  try {
    return fs.readdirSync(dir).some((name) => PRODUCT_FOLDERS.has(name))
  } catch {
    return false
  }
}

/**
 * The user may point at the folder holding the product folders (Mail, Drive, ...)
 * or at its parent that holds a single `Takeout/` folder. Accept both.
 */
export function detectTakeoutRoot(dir: string): string {
  if (containsProductFolder(dir)) return dir
  const wrapped = path.join(dir, TAKEOUT_WRAPPER_FOLDER)
  if (isDirectory(wrapped) && containsProductFolder(wrapped)) return wrapped
  return dir
}

export interface AppConfig {
  takeoutDir: string
  dataDir: string
  /** LOAD_REMOTE_IMAGES=true: show remote images in every email without asking. */
  loadRemoteImages: boolean
}

export function getConfig(): AppConfig {
  const takeout = path.resolve(process.env[ENV.takeoutDir] ?? DEFAULT_DIRS.takeout)
  const dataDir = path.resolve(process.env[ENV.dataDir] ?? DEFAULT_DIRS.data)
  const loadRemoteImages = /^(1|true|yes|on)$/i.test(process.env[ENV.loadRemoteImages] ?? "")
  return { takeoutDir: detectTakeoutRoot(takeout), dataDir, loadRemoteImages }
}

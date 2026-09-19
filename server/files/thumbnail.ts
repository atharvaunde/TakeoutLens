import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"

import { THUMBNAIL } from "@/lib/constant"
import { getConfig } from "@/server/config"
import type { ResolvedFile } from "./resolve"

/** JPEG/PNG/WebP thumbnail cached under DATA_DIR/thumbs (the Takeout folder is never written). */
export async function getThumbnail(file: ResolvedFile): Promise<Buffer | null> {
  const cacheDir = path.join(getConfig().dataDir, THUMBNAIL.dirName)
  const cacheFile = path.join(cacheDir, `${file.id}-${THUMBNAIL.width}.webp`)
  try {
    return await fs.promises.readFile(cacheFile)
  } catch {
    // not cached yet
  }
  try {
    const buffer = await sharp(file.absPath, { limitInputPixels: THUMBNAIL.maxInputPixels })
      .rotate()
      .resize({ width: THUMBNAIL.width, withoutEnlargement: true })
      .webp({ quality: THUMBNAIL.quality })
      .toBuffer()
    await fs.promises.mkdir(cacheDir, { recursive: true })
    await fs.promises.writeFile(cacheFile, buffer)
    return buffer
  } catch {
    return null // unsupported or corrupt image
  }
}

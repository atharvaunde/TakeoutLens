import fs from "node:fs"
import path from "node:path"
import { Readable } from "node:stream"

import { DEFAULT_DOWNLOAD_MIME, INLINE_MIME_TYPES } from "@/lib/constant"

export interface ByteRange {
  start: number
  end: number // inclusive
}

/** Parse a single-range `Range: bytes=…` header. Returns null when absent/unsupported, "invalid" when unsatisfiable. */
export function parseRange(header: string | null, size: number): ByteRange | null | "invalid" {
  if (!header) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return null
  const [, rawStart, rawEnd] = match
  if (rawStart === "" && rawEnd === "") return null
  let start: number
  let end: number
  if (rawStart === "") {
    const suffix = Number(rawEnd)
    if (suffix === 0) return "invalid"
    start = Math.max(size - suffix, 0)
    end = size - 1
  } else {
    start = Number(rawStart)
    end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1)
  }
  if (start >= size || start > end) return "invalid"
  return { start, end }
}

export interface StreamFileOptions {
  /** Force `Content-Disposition: attachment`. Non-inline types are always attachments. */
  download?: boolean
  fileName?: string
}

/**
 * Stream a file from disk with HTTP Range support. Only images and video are
 * served inline; everything else is an attachment with `nosniff` so it can never
 * execute in the app's origin. The caller must already have authorized the request
 * and resolved `absPath` from an opaque ID inside the Takeout root.
 */
export async function streamFile(request: Request, absPath: string, options: StreamFileOptions = {}): Promise<Response> {
  let stat: fs.Stats
  try {
    stat = await fs.promises.stat(absPath)
  } catch {
    return new Response("Not found", { status: 404 })
  }
  if (!stat.isFile()) return new Response("Not found", { status: 404 })

  const ext = path.extname(absPath).toLowerCase()
  const inlineType = INLINE_MIME_TYPES[ext]
  const asAttachment = options.download || !inlineType
  const fileName = options.fileName ?? path.basename(absPath)

  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Content-Type": inlineType ?? DEFAULT_DOWNLOAD_MIME,
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `${asAttachment ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    "Cache-Control": "private, max-age=0, must-revalidate",
  })

  const range = parseRange(request.headers.get("range"), stat.size)
  if (range === "invalid") {
    headers.set("Content-Range", `bytes */${stat.size}`)
    return new Response(null, { status: 416, headers })
  }

  const { start, end } = range ?? { start: 0, end: Math.max(stat.size - 1, 0) }
  headers.set("Content-Length", String(stat.size === 0 ? 0 : end - start + 1))
  if (range) headers.set("Content-Range", `bytes ${start}-${end}/${stat.size}`)
  if (request.method === "HEAD" || stat.size === 0) {
    return new Response(null, { status: range ? 206 : 200, headers })
  }

  const body = Readable.toWeb(fs.createReadStream(absPath, { start, end })) as ReadableStream
  return new Response(body, { status: range ? 206 : 200, headers })
}

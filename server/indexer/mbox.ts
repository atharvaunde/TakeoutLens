import fs from "node:fs"

import { MAIL_INDEX } from "@/lib/constant"

// "From 1779873633236952867@xxx Mon Oct 16 01:29:30 +0000 2023" (and classic "From user@host Mon Oct 16 01:29:30 2023")
const SEPARATOR = /(?:^|\n)From \S+ \w{3} \w{3} [ \d]\d \d\d:\d\d:\d\d[^\n]*\n/g
const OVERLAP = 512

export interface MboxEntry {
  offset: number
  length: number
}

/**
 * Stream the mbox once and return each message's byte offset and length. Constant memory
 * (chunked); bytes are read as latin1 so string index == byte offset.
 */
export async function scanMbox(file: string, chunkBytes: number = MAIL_INDEX.chunkBytes): Promise<MboxEntry[]> {
  const size = fs.statSync(file).size
  const starts: number[] = []
  let carry = ""
  let position = 0
  for await (const chunk of fs.createReadStream(file, { highWaterMark: chunkBytes })) {
    const text = carry + (chunk as Buffer).toString("latin1")
    const base = position - carry.length
    SEPARATOR.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = SEPARATOR.exec(text))) {
      const at = base + match.index + (match[0].startsWith("\n") ? 1 : 0)
      // A match in the overlap region was already reported by the previous chunk.
      if (starts.length === 0 || at > starts[starts.length - 1]) starts.push(at)
    }
    carry = text.slice(-OVERLAP)
    position += (chunk as Buffer).length
  }
  return starts.map((offset, index) => ({ offset, length: (starts[index + 1] ?? size) - offset }))
}

/** Read one message (without the leading "From " separator line). */
export function readMessage(fd: number, entry: MboxEntry, maxBytes = Infinity): Buffer {
  const length = Math.min(entry.length, maxBytes)
  const buffer = Buffer.allocUnsafe(length)
  fs.readSync(fd, buffer, 0, length, entry.offset)
  return buffer.subarray(buffer.indexOf(10) + 1)
}

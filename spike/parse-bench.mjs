import fs from "node:fs"
import { simpleParser } from "mailparser"
import PostalMime from "postal-mime"

const parser = process.argv[2]
const limit = Number(process.argv[3] ?? Infinity)
const guardMB = Number(process.argv[4] ?? Infinity) // messages larger than this are parsed from their first 1MB only (headers + leading parts)
const root = "/Users/atharvaunde/Desktop/Takeout/Mail/All mail Including Spam and Trash.mbox"
const offsets = JSON.parse(fs.readFileSync("spike/mbox-offsets.json", "utf8"))
const size = fs.statSync(root).size
const fd = fs.openSync(root, "r")
let peak = 0, ok = 0, fail = 0, textChars = 0, atts = 0, biggest = 0, noSubject = 0
const start = performance.now()
const n = Math.min(offsets.length, limit)
for (let i = 0; i < n; i++) {
  const from = offsets[i], to = i + 1 < offsets.length ? offsets[i + 1] : size
  const len = to - from
  biggest = Math.max(biggest, len)
  const buf = Buffer.allocUnsafe(len)
  fs.readSync(fd, buf, 0, len, from)
  // drop the leading mbox "From " separator line
  const nl = buf.indexOf(10)
  let raw = buf.subarray(nl + 1)
  if (len > guardMB * 1e6) raw = raw.subarray(0, 1e6)
  try {
    let subject, text, attachments
    if (parser === "mailparser") {
      const m = await simpleParser(raw, { skipImageLinks: true, skipTextToHtml: true })
      subject = m.subject; text = m.text ?? ""; attachments = m.attachments.length
    } else {
      const m = await new PostalMime().parse(raw)
      subject = m.subject; text = m.text ?? ""; attachments = m.attachments.length
    }
    ok++; textChars += text.length; atts += attachments; if (!subject) noSubject++
  } catch { fail++ }
  if (i % 200 === 0) peak = Math.max(peak, process.memoryUsage().rss)
}
peak = Math.max(peak, process.memoryUsage().rss)
const secs = (performance.now() - start) / 1000
console.log(JSON.stringify({ parser, guardMB: Number.isFinite(guardMB) ? guardMB : null, messages: n, ok, fail, noSubject, attachments: atts, textMB: +(textChars / 1e6).toFixed(1), biggestMB: +(biggest / 1e6).toFixed(1), seconds: +secs.toFixed(1), msgPerSec: Math.round(n / secs), peakRssMB: Math.round(peak / 1e6) }))

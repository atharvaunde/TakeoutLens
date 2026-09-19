import fs from "node:fs"
import path from "node:path"
import readline from "node:readline"
const root = process.argv[2]
const t = (label, start) => console.log(`${label}: ${((performance.now() - start) / 1000).toFixed(2)}s`)

// 1. Drive tree walk (stat only)
let s = performance.now(), files = 0, bytes = 0
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else { const st = fs.statSync(p); files++; bytes += st.size }
  }
}
walk(path.join(root, "Drive"))
t(`drive walk (${files} files, ${(bytes / 1e9).toFixed(1)} GB)`, s)

// 2. Chat JSON scan
s = performance.now(); let msgs = 0, convs = 0
for (const d of fs.readdirSync(path.join(root, "Google Chat/Groups"))) {
  const f = path.join(root, "Google Chat/Groups", d, "messages.json")
  if (!fs.existsSync(f)) continue
  msgs += JSON.parse(fs.readFileSync(f, "utf8")).messages.length; convs++
}
t(`chat scan (${convs} conversations, ${msgs} messages)`, s)

// 3. Mbox streaming split: byte offsets per message, constant memory
s = performance.now()
const mbox = path.join(root, "Mail/All mail Including Spam and Trash.mbox")
const stream = fs.createReadStream(mbox, { highWaterMark: 1 << 20 })
let offset = 0, count = 0, prevTail = "", maxRss = 0
const offsets = []
for await (const chunk of stream) {
  const text = prevTail + chunk.toString("latin1")
  const base = offset - prevTail.length
  const re = /(^|\n)From \S+@xxx /g
  let m
  while ((m = re.exec(text))) { offsets.push(base + m.index + (m[1] ? 1 : 0)); count++ }
  prevTail = text.slice(-64); offset += chunk.length
  maxRss = Math.max(maxRss, process.memoryUsage().rss)
}
t(`mbox scan (${count} messages, ${(offset / 1e9).toFixed(2)} GB, peak RSS ${(maxRss / 1e6).toFixed(0)} MB)`, s)
fs.writeFileSync(process.argv[3] ?? "spike/mbox-offsets.json", JSON.stringify(offsets))

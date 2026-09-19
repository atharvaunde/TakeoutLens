import fs from "node:fs"
import path from "node:path"
import Database from "better-sqlite3"

const root = "/Users/atharvaunde/Desktop/Takeout/Google Chat/Groups"
const rows = []
for (const d of fs.readdirSync(root)) {
  const f = path.join(root, d, "messages.json")
  if (!fs.existsSync(f)) continue
  for (const m of JSON.parse(fs.readFileSync(f, "utf8")).messages) if (m.text) rows.push(m.text)
}
console.log("messages with text:", rows.length, "chars:", rows.reduce((a, r) => a + r.length, 0))

const results = {}
for (const [name, tok] of [["unicode61", "unicode61 remove_diacritics 2"], ["trigram", "trigram"]]) {
  const file = `/tmp/fts-${name}.db`
  fs.rmSync(file, { force: true })
  const db = new Database(file)
  db.pragma("journal_mode = WAL")
  db.exec(`create virtual table t using fts5(text, tokenize='${tok}')`)
  const ins = db.prepare("insert into t(text) values (?)")
  const s = performance.now()
  db.transaction(() => { for (const r of rows) ins.run(r) })()
  const build = (performance.now() - s) / 1000
  db.pragma("wal_checkpoint(TRUNCATE)")
  const sizeMB = fs.statSync(file).size / 1e6
  const q = (label, sql, arg) => {
    const st = db.prepare(sql); st.all(arg) // warm
    const t0 = performance.now(); const n = st.all(arg).length
    return { label, hits: n, ms: +(performance.now() - t0).toFixed(1) }
  }
  const queries = name === "unicode61"
    ? [q("word 'deploy'", "select rowid from t where t match ? limit 1000", "deploy"),
       q("prefix 'deplo*'", "select rowid from t where t match ? limit 1000", "deplo*"),
       q("substring 'eploy' (no match expected)", "select rowid from t where t match ? limit 1000", "eploy"),
       q("typo 'deplyo' (no match expected)", "select rowid from t where t match ? limit 1000", "deplyo")]
    : [q("word 'deploy'", "select rowid from t where t match ? limit 1000", '"deploy"'),
       q("substring 'eploy'", "select rowid from t where t match ? limit 1000", '"eploy"'),
       q("typo 'deplyo' (no match expected)", "select rowid from t where t match ? limit 1000", '"deplyo"')]
  results[name] = { buildSeconds: +build.toFixed(1), sizeMB: +sizeMB.toFixed(0), queries }
  db.close()
}
console.log(JSON.stringify(results, null, 1))

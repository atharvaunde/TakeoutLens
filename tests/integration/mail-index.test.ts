import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, describe, expect, it } from "vitest"

import { openDb } from "@/server/db"
import { indexMail, parseForIndex, stripHtml } from "@/server/indexer/mail"
import { scanMbox } from "@/server/indexer/mbox"
import { cleanup, createFixture, FIXTURE_MBOX } from "../fixture/generate"

const bases: string[] = []
afterAll(() => bases.forEach(cleanup))

describe("scanMbox", () => {
  const file = path.join(os.tmpdir(), `mbox-${process.pid}.mbox`)
  fs.writeFileSync(file, FIXTURE_MBOX)
  afterAll(() => fs.rmSync(file, { force: true }))

  it("finds every message and ignores escaped '>From ' lines", async () => {
    const entries = await scanMbox(file)
    expect(entries).toHaveLength(3)
    expect(entries[0].offset).toBe(0)
    expect(entries.reduce((sum, e) => sum + e.length, 0)).toBe(Buffer.byteLength(FIXTURE_MBOX, "latin1"))
  })

  it("gives identical results for any chunk size (boundary safety)", async () => {
    const reference = await scanMbox(file)
    for (const size of [7, 64, 100, 513]) expect(await scanMbox(file, size)).toEqual(reference)
  })
})

describe("indexMail", () => {
  it("indexes headers, labels, threads, attachments and full-text", async () => {
    const fx = createFixture()
    bases.push(fx.base)
    const db = openDb(":memory:")
    await indexMail(db, fx.root)

    const rows = db.prepare("SELECT * FROM mail_messages ORDER BY date_ts").all() as Record<string, string | number>[]
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ subject: "Quarterly plan", from_email: "alice@example.test", thread_id: "1000000000000000001" })
    expect(rows[1]).toMatchObject({ thread_id: "1000000000000000001", attach_count: 1 })
    expect(rows[2]).toMatchObject({ subject: "Été news", unread: 1 })

    const labels = db.prepare("SELECT label FROM mail_labels WHERE message_id = ?").pluck().all(rows[0].id as number)
    expect(labels).toEqual(expect.arrayContaining(["Inbox", "Important", "Opened"]))

    const hit = db.prepare("SELECT rowid FROM mail_fts WHERE mail_fts MATCH ?").pluck().all('"roadmap"*')
    expect(hit).toEqual([rows[0].id])
    expect(db.prepare("SELECT count(*) FROM mail_fts WHERE mail_fts MATCH ?").pluck().get('"tracker"*')).toBe(0) // html tags are not indexed
  })

  it("is skipped when the mbox is unchanged", async () => {
    const fx = createFixture()
    bases.push(fx.base)
    const db = openDb(":memory:")
    await indexMail(db, fx.root)
    db.prepare("UPDATE mail_messages SET subject = 'marker'").run()
    await indexMail(db, fx.root)
    expect(db.prepare("SELECT count(*) FROM mail_messages WHERE subject = 'marker'").pluck().get()).toBe(3)
  })
})

describe("parseForIndex", () => {
  it("strips html to text and handles a guarded (truncated) message", async () => {
    expect(stripHtml("<p>Hi&nbsp;<b>there</b></p><script>x()</script>")).toBe("Hi there")
    const parsed = await parseForIndex(Buffer.from("Subject: t\r\nFrom: a@b.test\r\n\r\nbody"), true)
    expect(parsed.attachCount).toBe(1) // guarded messages are assumed to contain an attachment
  })

  it("decodes MIME-encoded label headers before splitting on commas", async () => {
    const parsed = await parseForIndex(
      Buffer.from("X-Gmail-Labels: =?UTF-8?Q?Inbox,Sent,=E2=9C=94?=,HR/Letters\r\nSubject: t\r\nFrom: a@b.test\r\n\r\nbody"),
      false
    )
    expect(parsed.labels).toEqual(["Inbox", "Sent", "✔", "HR/Letters"])
    expect(parsed.labelsDecoded).toBe(true)
    expect((await parseForIndex(Buffer.from("X-Gmail-Labels: Inbox,Sent\r\nSubject: t\r\n\r\nb"), false)).labelsDecoded).toBe(false)
  })
})

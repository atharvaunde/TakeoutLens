import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { SESSION } from "@/lib/constant"
import { parseTableParams } from "@/lib/helper"
import { cleanup, createFixture } from "../fixture/generate"

const jar = new Map<string, string>()
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (n: string) => (jar.has(n) ? { name: n, value: jar.get(n) } : undefined) }) }))
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw new Error(`redirect:${to}`) } }))

let base: string
let dataDir: string
const ids: number[] = []

beforeAll(async () => {
  const fx = createFixture()
  base = fx.base
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "mail-data-"))
  process.env.TAKEOUT_DIR = fx.root
  process.env.DATA_DIR = dataDir
  const { getDb } = await import("@/server/db")
  const { runIndexer } = await import("@/server/indexer/run")
  const db = getDb()
  await runIndexer(db, fx.root)
  ids.push(...(db.prepare("SELECT id FROM mail_messages WHERE source = 'mail' ORDER BY date_ts").pluck().all() as number[]))
  const store = await import("@/server/auth/store")
  store.savePassword("mail-test-pw")
  jar.set(SESSION.cookieName, store.createSession().token)
})
afterAll(() => { cleanup(base); fs.rmSync(dataDir, { recursive: true, force: true }) })

describe("mail service", () => {
  it("lists labels without state flags, system labels first", async () => {
    const { listMailLabels } = await import("@/server/services/mail")
    const { total, labels } = await listMailLabels()
    expect(total).toBe(3)
    expect(labels.map((l) => l.label)).toEqual(["Inbox", "Important", "Sent", "Category Updates"])
    expect(labels.find((l) => l.label === "Inbox")).toMatchObject({ total: 2, unread: 1, group: "system", decoded: false })
    expect(labels.find((l) => l.label === "Category Updates")).toMatchObject({ name: "Updates", group: "category" })
  })

  it("filters by label, searches full-text and sorts", async () => {
    const { listMailMessages } = await import("@/server/services/mail")
    const inbox = await listMailMessages(parseTableParams({}), "Inbox")
    expect(inbox.total).toBe(2)
    expect(inbox.rows[0].subject).toBe("Été news") // newest first by default
    const found = await listMailMessages(parseTableParams({ q: "roadmap" }), null)
    expect(found.rows.map((r) => r.subject)).toEqual(["Quarterly plan"])
    const sent = await listMailMessages(parseTableParams({ q: "attached" }), "Sent")
    expect(sent.total).toBe(1)
    expect(sent.rows[0].hasAttachment).toBe(true)
    const bySubject = await listMailMessages(parseTableParams({ sort: "subject", dir: "asc" }), null)
    expect(bySubject.rows[0].subject).toBe("Quarterly plan")
  })

  it("assembles a thread on demand from the mbox", async () => {
    const { getThread } = await import("@/server/services/mail")
    const thread = await getThread(ids[0])
    expect(thread.map((m) => m.subject)).toEqual(["Quarterly plan", "Re: Quarterly plan"])
    expect(thread[1].html).toContain("<b>good</b>")
    expect(thread[1].attachments).toEqual([{ index: 0, name: "plan.pdf", mime: "application/pdf", size: 9, inline: false }])
    expect(thread[0].labels).toEqual(["Inbox", "Important"])
    expect(await getThread(999999)).toEqual([])
  })

  it("downloads an attachment and the raw .eml", async () => {
    const { getMailDownload } = await import("@/server/services/mail")
    const att = await getMailDownload(ids[1], "0")
    expect(att?.fileName).toBe("plan.pdf")
    expect(Buffer.from(att!.body).toString("latin1")).toBe("%PDF-1.4\n")
    const eml = await getMailDownload(ids[1], "eml")
    expect(Buffer.from(eml!.body).toString()).toContain("Subject: Re: Quarterly plan")
    expect(await getMailDownload(ids[1], "5")).toBeNull()
  })

  it("inlines cid images as data URIs", async () => {
    const { inlineCidImages } = await import("@/server/services/mail")
    const html = inlineCidImages('<img src="cid:logo@x">', [
      { filename: "l.png", mimeType: "image/png", contentId: "<logo@x>", disposition: "inline", content: new Uint8Array([1, 2, 3]).buffer } as never,
    ])
    expect(html).toBe('<img src="data:image/png;base64,AQID">')
  })

  it("requires a session", async () => {
    jar.clear()
    const { listMailLabels } = await import("@/server/services/mail")
    await expect(listMailLabels()).rejects.toThrow(/redirect:\/login/)
  })
})

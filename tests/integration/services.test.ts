import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { SESSION } from "@/lib/constant"
import { parseTableParams } from "@/lib/helper"

const jar = new Map<string, string>()
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined) }),
}))
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`)
  },
}))

let dataDir: string
beforeAll(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "svc-"))
  process.env.DATA_DIR = dataDir
  process.env.TAKEOUT_DIR = dataDir
  const { getDb } = await import("@/server/db")
  const insert = getDb().prepare("INSERT INTO index_errors (module, path, reason, occurred_at) VALUES (?, ?, ?, ?)")
  for (let i = 0; i < 30; i++) insert.run(i % 2 ? "mail" : "chat", `f${i}_100%.dat`, i % 3 ? "Bad date" : "Bad JSON", 1_700_000_000_000 + i * 1000)
  const store = await import("@/server/auth/store")
  store.savePassword("service-test-pw")
  jar.set(SESSION.cookieName, store.createSession().token)
})
afterAll(() => fs.rmSync(dataDir, { recursive: true, force: true }))

describe("listIndexErrors", () => {
  it("pages, filters, searches and sorts server-side", async () => {
    const { listIndexErrors } = await import("@/server/services/index-errors")
    const all = await listIndexErrors(parseTableParams({}, ["module"]))
    expect(all.total).toBe(30)
    const page2 = await listIndexErrors(parseTableParams({ page: "2", pageSize: "25" }, ["module"]))
    expect(page2.rows).toHaveLength(5)
    const mail = await listIndexErrors(parseTableParams({ module: "mail" }, ["module"]))
    expect(mail.total).toBe(15)
    expect(mail.rows.every((r) => r.module === "mail")).toBe(true)
    const json = await listIndexErrors(parseTableParams({ q: "bad json" }, ["module"]))
    expect(json.total).toBe(10)
    const desc = await listIndexErrors(parseTableParams({ sort: "occurredAt", dir: "desc" }, ["module"]))
    expect(desc.rows[0].path).toBe("f29_100%.dat")
  })

  it("treats LIKE wildcards literally and ignores unknown sort columns", async () => {
    const { listIndexErrors } = await import("@/server/services/index-errors")
    expect((await listIndexErrors(parseTableParams({ q: "100%" }))).total).toBe(30)
    expect((await listIndexErrors(parseTableParams({ q: "%" }))).total).toBe(30) // literal % appears in every path
    expect((await listIndexErrors(parseTableParams({ q: "_" }))).total).toBe(30) // literal _ in every path
    expect((await listIndexErrors(parseTableParams({ sort: "id; DROP TABLE index_errors" }))).total).toBe(30)
  })

  it("requires a session", async () => {
    jar.clear()
    const { listIndexErrors } = await import("@/server/services/index-errors")
    await expect(listIndexErrors(parseTableParams({}))).rejects.toThrow(/redirect:\/login/)
  })
})

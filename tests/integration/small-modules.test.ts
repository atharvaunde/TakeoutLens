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
beforeAll(async () => {
  const fx = createFixture()
  base = fx.base
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "small-data-"))
  process.env.TAKEOUT_DIR = fx.root
  process.env.DATA_DIR = dataDir
  const { getDb } = await import("@/server/db")
  const { runIndexer } = await import("@/server/indexer/run")
  await runIndexer(getDb(), fx.root)
  const store = await import("@/server/auth/store")
  store.savePassword("small-test-pw")
  jar.set(SESSION.cookieName, store.createSession().token)
})
afterAll(() => { cleanup(base); fs.rmSync(dataDir, { recursive: true, force: true }) })

describe("contacts", () => {
  it("lists, searches and filters by source", async () => {
    const { listContacts } = await import("@/server/services/contacts")
    const all = await listContacts(parseTableParams({}, ["source"]))
    expect(all.rows.map((r) => r.name)).toEqual(["Alice Example", "Bob Example"])
    expect(all.rows[0]).toMatchObject({ email: "alice@example.test", isMine: true })
    expect((await listContacts(parseTableParams({ source: "my" }, ["source"]))).total).toBe(1)
    expect((await listContacts(parseTableParams({ q: "123" }, ["source"]))).rows.map((r) => r.name)).toEqual(["Bob Example"])
  })
})

describe("tasks", () => {
  it("lists, filters by status and searches notes", async () => {
    const { listTasks, getTaskListOptions } = await import("@/server/services/tasks")
    expect(await getTaskListOptions()).toEqual([{ value: "My Tasks", label: "My Tasks" }])
    const p = (q: Record<string, string>) => parseTableParams(q, ["list", "status"])
    expect((await listTasks(p({}))).total).toBe(2)
    expect((await listTasks(p({ status: "completed" }))).rows.map((r) => r.title)).toEqual(["Send invoice"])
    expect((await listTasks(p({ q: "quarterly" }))).rows.map((r) => r.title)).toEqual(["Write report"])
    expect((await listTasks(p({ sort: "due", dir: "asc" }))).rows[0].title).toBe("Send invoice") // empty due sorts first
  })
})

describe("keep", () => {
  it("separates notes, archive and trash, and searches", async () => {
    const { listKeepNotes } = await import("@/server/services/keep")
    expect((await listKeepNotes("notes", "")).map((n) => n.title)).toEqual(["Note"])
    const archived = await listKeepNotes("archived", "")
    expect(archived).toHaveLength(1)
    expect(archived[0]).toMatchObject({ title: "Old list", color: "YELLOW", items: [{ text: "milk", checked: true }] })
    expect(await listKeepNotes("trash", "")).toEqual([])
    expect(await listKeepNotes("archived", "MILK")).toHaveLength(1)
    expect(await listKeepNotes("archived", "zzz")).toEqual([])
  })
})

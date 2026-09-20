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

describe("photos", () => {
  it("matches sidecars (classic and supplemental), falls back to mtime, drops zero geo", async () => {
    const { listPhotos, listAlbums } = await import("@/server/services/photos")
    const { photos, total } = await listPhotos(1, null)
    expect(total).toBe(3)
    const by = Object.fromEntries(photos.map((p) => [p.title, p]))
    expect(by["IMG_1.jpg"]).toMatchObject({ takenAt: 1622437268000, hasLocation: true, description: "beach" })
    expect(by["IMG_3.jpg"]).toMatchObject({ takenAt: 1500000000000, hasLocation: false }) // supplemental sidecar, 0/0 geo ignored
    expect(by["IMG_2.jpg"].takenAt).toBeGreaterThan(1_600_000_000_000) // no sidecar: file mtime
    expect(photos[0].title).toBe("IMG_2.jpg") // newest first
    expect(await listAlbums()).toEqual([{ album: "Photos from 2021", count: 3 }])
    expect((await listPhotos(1, "Nope")).total).toBe(0)
  })
})

describe("youtube", () => {
  it("joins metadata rows to files by normalized title and keeps file-only videos", async () => {
    const { listVideos, listPlaylists, getYoutubeOverview } = await import("@/server/services/youtube")
    const { rows } = await listVideos(parseTableParams({}))
    const by = Object.fromEntries(rows.map((r) => [r.title, r]))
    expect(by["Demo: part 1"]).toMatchObject({ durationMs: 90000, privacy: "Unlisted" })
    expect(by["Demo: part 1"].fileId).not.toBeNull() // "Demo: part 1" matches "Demo_ part 1.mp4"
    expect(by["Missing clip"].fileId).toBeNull()
    expect(by["Live Stream"]).toMatchObject({ state: "File only" })
    expect(await getYoutubeOverview()).toEqual({ channelTitle: "Fixture Channel", videoCount: 3, playlistCount: 1 })
    expect((await listPlaylists(parseTableParams({}))).rows[0].title).toBe("Fixture list")
    expect((await listVideos(parseTableParams({ q: "missing" }))).total).toBe(1)
  })
})

describe("generic browser and viewer", () => {
  it("lists product folders at the root and descends into them", async () => {
    const { listBrowse } = await import("@/server/services/drive")
    const root = await listBrowse(undefined, parseTableParams({}))
    expect(root.rows.map((r) => r.name).sort()).toEqual(["Chrome", "Google Shopping", "My Activity"])
    const chrome = await listBrowse("Chrome", parseTableParams({}))
    expect(chrome.rows.map((r) => r.name)).toEqual(["Passwords.csv", "Settings.json"])
    expect((await listBrowse(undefined, parseTableParams({ q: "orders" }))).rows.map((r) => r.name)).toEqual(["Orders.txt"])
  })

  it("previews JSON, text and HTML; downloads unknown types", async () => {
    const { getFileMeta, getFilePreview, classify } = await import("@/server/services/viewer")
    const { getDb } = await import("@/server/db")
    const id = (rel: string) => (getDb().prepare("SELECT id FROM files WHERE rel_path = ?").pluck().get(rel) as number)
    const params = parseTableParams({})
    const json = await getFilePreview(getFileMeta(id("Chrome/Settings.json"))!, params)
    expect(json).toMatchObject({ kind: "json" })
    expect((json as { text: string }).text).toContain('  "a": 1') // pretty printed
    expect(await getFilePreview(getFileMeta(id("Google Shopping/Orders/Orders.txt"))!, params)).toMatchObject({ kind: "text", text: "Order 1\nOrder 2" })
    expect(await getFilePreview(getFileMeta(id("My Activity/Search/MyActivity.html"))!, params)).toMatchObject({ kind: "html" })
    expect(await getFilePreview(getFileMeta(id("Drive/Reports/report.docx"))!, params)).toMatchObject({ kind: "download" })
    expect(classify("x.kmz")).toBe("other")
  })

  it("previews CSV with search, sort, paging and flags password columns", async () => {
    const { getFileMeta, getFilePreview } = await import("@/server/services/viewer")
    const { getDb } = await import("@/server/db")
    const meta = getFileMeta(getDb().prepare("SELECT id FROM files WHERE rel_path = 'Chrome/Passwords.csv'").pluck().get() as number)!
    const all = await getFilePreview(meta, parseTableParams({}))
    expect(all).toMatchObject({ kind: "csv", total: 2, passwordHeaders: ["password"] })
    if (all.kind !== "csv") throw new Error("expected csv")
    expect(all.headers).toEqual(["name", "url", "username", "password", "note"])
    expect(all.rows[1].note).toBe("multi\nline")
    const found = await getFilePreview(meta, parseTableParams({ q: "hunter2" }))
    expect(found.kind === "csv" && found.rows.map((r) => r.username)).toEqual(["bob"])
    const sorted = await getFilePreview(meta, parseTableParams({ sort: "c2", dir: "desc" })) // by username
    expect(sorted.kind === "csv" && sorted.rows.map((r) => r.username)).toEqual(["bob", "alice"])
  })
})

describe("groups", () => {
  it("lists groups with counts, members and discussions, isolated from mail", async () => {
    const { listGroups, getGroup, listGroupMembers } = await import("@/server/services/groups")
    const { listMailMessages, getThread, listMailLabels } = await import("@/server/services/mail")
    const groups = await listGroups()
    expect(groups).toEqual([{ email: "dev@example.test", name: "Dev Team", description: "Dev discussions", memberCount: 2, discussionCount: 1 }])
    expect(await getGroup("nope@example.test")).toBeNull()
    expect((await listGroupMembers("dev@example.test", parseTableParams({}))).rows.map((m) => m.email)).toEqual(["alice@example.test", "bob@example.test"])

    const discussions = await listMailMessages(parseTableParams({}), null, "group:dev@example.test")
    expect(discussions.rows.map((r) => r.subject)).toEqual(["[dev] Release plan"])
    expect((await listMailMessages(parseTableParams({}), null)).rows.every((r) => r.subject !== "[dev] Release plan")).toBe(true) // not in the Gmail view
    expect((await getThread(discussions.rows[0].messageId))[0].text).toContain("ship on Friday")
    expect((await listMailLabels()).labels.length).toBeGreaterThan(0)
  })
})

describe("timeline", () => {
  it("merges sources by date, filters by source and pages backwards", async () => {
    const { getTimeline } = await import("@/server/services/timeline")
    const all = await getTimeline("all")
    const modules = new Set(all.items.map((i) => i.moduleId))
    expect([...modules].sort()).toEqual(expect.arrayContaining(["calendar", "chat", "drive", "mail", "photos"]))
    expect(all.items.map((i) => i.ts)).toEqual([...all.items.map((i) => i.ts)].sort((a, b) => b - a)) // newest first
    const mail = await getTimeline("mail")
    expect(mail.items.every((i) => i.moduleId === "mail")).toBe(true)
    expect(mail.items[0].title).toBe("Été news") // 18 Oct 2023 is the newest mail
    const older = await getTimeline("mail", mail.items[0].ts)
    expect(older.items.every((i) => i.ts < mail.items[0].ts)).toBe(true)
  })
})

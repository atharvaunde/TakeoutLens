import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { SESSION } from "@/lib/constant"
import { parseTableParams } from "@/lib/helper"
import { cleanup, createFixture, write } from "../fixture/generate"

const jar = new Map<string, string>()
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (n: string) => (jar.has(n) ? { name: n, value: jar.get(n) } : undefined) }) }))
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw new Error(`redirect:${to}`) } }))

let base: string
let dataDir: string
beforeAll(async () => {
  const fx = createFixture()
  base = fx.base
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "drive-data-"))
  process.env.TAKEOUT_DIR = fx.root
  process.env.DATA_DIR = dataDir
  write(fx.root, "Drive/Reports/2024/Quarterly Report.pdf", "x")
  write(fx.root, "Drive/Reports/notes.txt", "x")
  write(fx.root, "Drive/Videos/demo.mp4", "x")
  const { getDb } = await import("@/server/db")
  const { runIndexer } = await import("@/server/indexer/run")
  await runIndexer(getDb(), fx.root)
  const store = await import("@/server/auth/store")
  store.savePassword("drive-test-pw")
  jar.set(SESSION.cookieName, store.createSession().token)
})
afterAll(() => { cleanup(base); fs.rmSync(dataDir, { recursive: true, force: true }) })

describe("listDrive", () => {
  it("lists folders first, then files, at the root", async () => {
    const { listDrive } = await import("@/server/services/drive")
    const res = await listDrive(undefined, parseTableParams({}))
    expect(res.rows.map((r) => `${r.kind}:${r.name}`)).toEqual(["folder:Reports", "folder:Videos", "file:photo.jpg"])
    expect(res.rows[0].itemCount).toBe(3) // report.docx + notes.txt + 2024/Quarterly Report.pdf
  })

  it("navigates into a folder and builds breadcrumbs; ignores traversal", async () => {
    const { listDrive } = await import("@/server/services/drive")
    const res = await listDrive("Reports/2024", parseTableParams({}))
    expect(res.rows.map((r) => r.name)).toEqual(["Quarterly Report.pdf"])
    expect(res.breadcrumbs).toEqual([{ label: "Reports", path: "Reports" }, { label: "2024", path: "Reports/2024" }])
    const evil = await listDrive("../../etc", parseTableParams({}))
    expect(evil.folder).toBe("etc")
    expect(evil.rows).toHaveLength(0)
  })

  it("searches by filename across the tree, optionally scoped to a folder", async () => {
    const { listDrive } = await import("@/server/services/drive")
    const all = await listDrive(undefined, parseTableParams({ q: "quarterly" }))
    expect(all.searching).toBe(true)
    expect(all.rows.map((r) => r.name)).toEqual(["Quarterly Report.pdf"])
    expect(all.rows[0].location).toBe("Reports/2024")
    expect((await listDrive("Videos", parseTableParams({ q: "quarterly" }))).total).toBe(0)
    expect((await listDrive(undefined, parseTableParams({ q: 'quart" OR' }))).total).toBeGreaterThanOrEqual(0) // never throws
  })

  it("classifies previewable files and sorts by size", async () => {
    const { listDrive } = await import("@/server/services/drive")
    const res = await listDrive("Videos", parseTableParams({}))
    expect(res.rows[0].fileKind).toBe("video")
    expect((await listDrive("Reports", parseTableParams({ sort: "size", dir: "desc" }))).rows[1].kind).toBe("file")
  })
})

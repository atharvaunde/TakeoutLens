import fs from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { detectTakeoutRoot } from "@/server/config"
import { openDb } from "@/server/db"
import { moduleForTopFolder, scanFiles } from "@/server/indexer/scan"
import { cleanup, createFixture, write } from "../fixture/generate"

const bases: string[] = []
afterEach(() => bases.splice(0).forEach(cleanup))
const make = (wrap = false) => {
  const fx = createFixture({ wrap })
  bases.push(fx.base)
  return fx
}
const memDb = () => openDb(":memory:")

describe("detectTakeoutRoot", () => {
  it("accepts the product folder or its wrapping parent", () => {
    const flat = make()
    expect(detectTakeoutRoot(flat.root)).toBe(flat.root)
    const wrapped = make(true)
    expect(detectTakeoutRoot(wrapped.base)).toBe(wrapped.root)
  })
})

describe("scanFiles", () => {
  it("indexes files by module and ignores root-level files", () => {
    const { root } = make()
    const db = memDb()
    const result = scanFiles(db, root)
    expect(result.added).toBeGreaterThan(8)
    const modules = db.prepare("SELECT DISTINCT module FROM files").pluck().all() as string[]
    expect(modules).toEqual(expect.arrayContaining(["mail", "chat", "calendar", "contacts", "drive", "keep", "tasks", "browse"]))
    expect(db.prepare("SELECT count(*) FROM files WHERE rel_path = 'archive_browser.html'").pluck().get()).toBe(0)
  })

  it("is incremental: unchanged skipped, changed updated, deleted removed", () => {
    const { root } = make()
    const db = memDb()
    const first = scanFiles(db, root)
    const again = scanFiles(db, root)
    expect(again).toMatchObject({ added: 0, updated: 0, removed: 0, unchanged: first.added })

    write(root, "Drive/Reports/report.docx", "changed content, different size")
    write(root, "Drive/new.txt", "new")
    fs.rmSync(path.join(root, "Tasks/Tasks.json"))
    expect(scanFiles(db, root)).toMatchObject({ added: 1, updated: 1, removed: 1 })
  })

  it("never modifies the Takeout tree", () => {
    const { root } = make()
    const listing = () => fs.readdirSync(root, { recursive: true }).sort().join("\n")
    const before = listing()
    scanFiles(memDb(), root)
    expect(listing()).toBe(before)
  })

  it("does not follow symlinks", () => {
    const { root, base } = make()
    fs.symlinkSync(base, path.join(root, "Drive/loop"))
    const db = memDb()
    expect(() => scanFiles(db, root)).not.toThrow()
    expect(db.prepare("SELECT count(*) FROM files WHERE rel_path LIKE 'Drive/loop%'").pluck().get()).toBe(0)
  })

  it("maps unknown product folders to the generic browser", () => {
    expect(moduleForTopFolder("Google Pay")).toBe("browse")
    expect(moduleForTopFolder("Google Chat")).toBe("chat")
  })
})

describe("runIndexer", () => {
  it("sets module states from the export contents", async () => {
    const { root } = make()
    const db = memDb()
    const { runIndexer } = await import("@/server/indexer/run")
    await runIndexer(db, root)
    const states = Object.fromEntries((db.prepare("SELECT id, state FROM modules").all() as { id: string; state: string }[]).map((r) => [r.id, r.state]))
    expect(states).toMatchObject({ drive: "ready", browse: "ready", mail: "pending", photos: "missing", youtube: "missing" })
    expect(db.prepare("SELECT file_count FROM modules WHERE id = 'drive'").pluck().get()).toBe(2)
  })
})

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { resolveWithinRoot } from "@/server/files/resolve"

const dirs: string[] = []
afterEach(() => dirs.splice(0).forEach((d) => fs.rmSync(d, { recursive: true, force: true })))

function setup() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "res-"))
  dirs.push(base)
  const root = path.join(base, "Takeout")
  fs.mkdirSync(path.join(root, "Drive"), { recursive: true })
  fs.writeFileSync(path.join(root, "Drive/a.txt"), "a")
  fs.writeFileSync(path.join(base, "secret.txt"), "secret")
  return { base, root }
}

describe("resolveWithinRoot", () => {
  it("resolves files inside the root", () => {
    const { root } = setup()
    expect(resolveWithinRoot(root, "Drive/a.txt")).toBe(fs.realpathSync(path.join(root, "Drive/a.txt")))
  })
  it("rejects .. traversal", () => {
    const { root } = setup()
    expect(resolveWithinRoot(root, "../secret.txt")).toBeNull()
    expect(resolveWithinRoot(root, "Drive/../../secret.txt")).toBeNull()
  })
  it("rejects a symlink pointing outside the root", () => {
    const { base, root } = setup()
    fs.symlinkSync(path.join(base, "secret.txt"), path.join(root, "Drive/link.txt"))
    expect(resolveWithinRoot(root, "Drive/link.txt")).toBeNull()
  })
  it("returns null for missing files", () => {
    const { root } = setup()
    expect(resolveWithinRoot(root, "Drive/missing.txt")).toBeNull()
  })
})

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { SESSION } from "@/lib/constant"
import { cleanup, createFixture, write } from "../fixture/generate"

// Route Handlers read the session cookie via next/headers; stand in for it here.
const jar = new Map<string, string>()
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined) }),
}))
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`)
  },
}))

let fixtureBase: string
let dataDir: string
const ids: Record<string, number> = {}

beforeAll(async () => {
  const fx = createFixture()
  fixtureBase = fx.base
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "routes-data-"))
  process.env.TAKEOUT_DIR = fx.root
  process.env.DATA_DIR = dataDir
  // a real (tiny) png so sharp can thumbnail it
  const sharp = (await import("sharp")).default
  write(fx.root, "Drive/pic.png", await sharp({ create: { width: 640, height: 480, channels: 3, background: "#369" } }).png().toBuffer())
  write(fx.root, "Drive/clip.mp4", Buffer.from("0123456789".repeat(20)))
  const { getDb } = await import("@/server/db")
  const { runIndexer } = await import("@/server/indexer/run")
  const db = getDb()
  await runIndexer(db, fx.root)
  for (const rel of ["Drive/pic.png", "Drive/clip.mp4", "Drive/Reports/report.docx"]) {
    ids[rel] = db.prepare("SELECT id FROM files WHERE rel_path = ?").pluck().get(rel) as number
  }
  const store = await import("@/server/auth/store")
  store.savePassword("test-password-123")
})

afterAll(() => {
  cleanup(fixtureBase)
  fs.rmSync(dataDir, { recursive: true, force: true })
})

const call = async (handler: "media" | "download" | "thumb", id: string | number, headers: Record<string, string> = {}) => {
  const mod = await import(`@/app/${handler}/[id]/route`)
  const ctx = { params: Promise.resolve({ id: String(id) }) } as never
  return mod.GET(new Request("http://localhost/x", { headers }), ctx) as Promise<Response>
}
const login = async () => {
  const store = await import("@/server/auth/store")
  jar.set(SESSION.cookieName, store.createSession().token)
}

describe("file routes", () => {
  it("answer 401 without a valid session", async () => {
    jar.clear()
    for (const route of ["media", "download", "thumb"] as const) {
      expect((await call(route, ids["Drive/clip.mp4"])).status).toBe(401)
    }
    jar.set(SESSION.cookieName, "forged-token")
    expect((await call("media", ids["Drive/clip.mp4"])).status).toBe(401)
  })

  it("stream video with Range (206) once authorized", async () => {
    await login()
    const res = await call("media", ids["Drive/clip.mp4"], { range: "bytes=0-9" })
    expect(res.status).toBe(206)
    expect(res.headers.get("content-range")).toBe("bytes 0-9/200")
    expect(await res.text()).toBe("0123456789")
  })

  it("serves non image/video files as attachments only", async () => {
    await login()
    const res = await call("media", ids["Drive/Reports/report.docx"])
    expect(res.headers.get("content-disposition")).toMatch(/^attachment/)
    expect(res.headers.get("x-content-type-options")).toBe("nosniff")
    const dl = await call("download", ids["Drive/clip.mp4"])
    expect(dl.headers.get("content-disposition")).toMatch(/^attachment/)
  })

  it("returns 404 for unknown, non-numeric or path-like ids", async () => {
    await login()
    for (const id of ["999999", "abc", "../../etc/passwd", "1;drop table", ""]) {
      expect((await call("media", id)).status).toBe(404)
    }
  })

  it("creates and caches a webp thumbnail", async () => {
    await login()
    const res = await call("thumb", ids["Drive/pic.png"])
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("image/webp")
    expect(fs.existsSync(path.join(dataDir, "thumbs", `${ids["Drive/pic.png"]}-320.webp`))).toBe(true)
    expect((await call("thumb", ids["Drive/Reports/report.docx"])).status).toBe(415)
  })
})

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { parseRange, streamFile } from "@/server/files/stream-file"

describe("parseRange", () => {
  it("handles absent, open, closed and suffix ranges", () => {
    expect(parseRange(null, 100)).toBeNull()
    expect(parseRange("bytes=0-9", 100)).toEqual({ start: 0, end: 9 })
    expect(parseRange("bytes=90-", 100)).toEqual({ start: 90, end: 99 })
    expect(parseRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 })
    expect(parseRange("bytes=50-500", 100)).toEqual({ start: 50, end: 99 })
  })
  it("rejects unsatisfiable ranges", () => {
    expect(parseRange("bytes=100-", 100)).toBe("invalid")
    expect(parseRange("bytes=20-10", 100)).toBe("invalid")
    expect(parseRange("bytes=-0", 100)).toBe("invalid")
  })
})

describe("streamFile", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sf-"))
  const video = path.join(dir, "clip.mp4")
  const doc = path.join(dir, "notes.docx")
  fs.writeFileSync(video, Buffer.from("0123456789".repeat(10)))
  fs.writeFileSync(doc, "hello")
  const req = (range?: string) => new Request("http://localhost/x", { headers: range ? { range } : {} })

  it("serves 206 with Content-Range for a range request", async () => {
    const res = await streamFile(req("bytes=0-9"), video)
    expect(res.status).toBe(206)
    expect(res.headers.get("content-range")).toBe("bytes 0-9/100")
    expect(res.headers.get("content-disposition")).toMatch(/^inline/)
    expect(await res.text()).toBe("0123456789")
  })
  it("serves 200 for a full request and 416 when out of range", async () => {
    expect((await streamFile(req(), video)).status).toBe(200)
    expect((await streamFile(req("bytes=500-"), video)).status).toBe(416)
  })
  it("forces attachment + nosniff for non image/video files", async () => {
    const res = await streamFile(req(), doc)
    expect(res.headers.get("content-disposition")).toMatch(/^attachment/)
    expect(res.headers.get("x-content-type-options")).toBe("nosniff")
    expect(res.headers.get("content-type")).toBe("application/octet-stream")
  })
  it("returns 404 for a missing file", async () => {
    expect((await streamFile(req(), path.join(dir, "nope.mp4"))).status).toBe(404)
  })
})

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import sharp from "sharp"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

import { SESSION } from "@/lib/constant"
import { cleanup, createFixture, write } from "../fixture/generate"

const jar = new Map<string, string>()
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (n: string) => (jar.has(n) ? { name: n, value: jar.get(n) } : undefined) }) }))
vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw new Error(`redirect:${to}`) } }))

let base: string
let dataDir: string
let photoId: number
let plainId: number

beforeAll(async () => {
  const fx = createFixture()
  base = fx.base
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "photo-info-"))
  process.env.TAKEOUT_DIR = fx.root
  process.env.DATA_DIR = dataDir
  const jpeg = await sharp({ create: { width: 640, height: 480, channels: 3, background: "#888" } })
    .jpeg()
    .withExif({ IFD0: { Make: "OnePlus", Model: "OnePlus AC2001", Software: "HDR+ 1.0" } })
    .toBuffer()
  write(fx.root, "Google Photos/Photos from 2022/CAT.jpg", jpeg)
  write(
    fx.root,
    "Google Photos/Photos from 2022/CAT.jpg.json",
    JSON.stringify({
      title: "CAT.jpg",
      description: "a cat",
      imageViews: "23",
      creationTime: { timestamp: "1632155983" },
      photoTakenTime: { timestamp: "1624259007" },
      geoData: { latitude: 12.5, longitude: 77.1 },
      url: "https://photos.google.com/photo/abc",
      googlePhotosOrigin: { composition: { type: "AUTO" } },
    })
  )
  const { getDb } = await import("@/server/db")
  const { runIndexer } = await import("@/server/indexer/run")
  const db = getDb()
  await runIndexer(db, fx.root)
  photoId = db.prepare("SELECT id FROM files WHERE rel_path = 'Google Photos/Photos from 2022/CAT.jpg'").pluck().get() as number
  plainId = db.prepare("SELECT id FROM files WHERE rel_path = 'Google Photos/Photos from 2021/IMG_2.jpg'").pluck().get() as number
  const store = await import("@/server/auth/store")
  store.savePassword("photo-info-pw")
  jar.set(SESSION.cookieName, store.createSession().token)
})
afterAll(() => { cleanup(base); fs.rmSync(dataDir, { recursive: true, force: true }) })

describe("getPhotoInfo", () => {
  it("combines the Google sidecar, image dimensions and embedded EXIF", async () => {
    const { getPhotoInfo } = await import("@/server/services/photos")
    const info = await getPhotoInfo(photoId)
    expect(info).toMatchObject({
      name: "CAT.jpg", width: 640, height: 480, format: "jpeg", description: "a cat", views: 23,
      takenAt: 1624259007000, uploadedAt: 1632155983000, latitude: 12.5, longitude: 77.1,
      googleUrl: "https://photos.google.com/photo/abc", origin: "composition", camera: "OnePlus AC2001", software: "HDR+ 1.0",
    })
  })

  it("degrades gracefully for a photo without sidecar or readable image", async () => {
    const { getPhotoInfo } = await import("@/server/services/photos")
    const info = await getPhotoInfo(plainId)
    expect(info).toMatchObject({ name: "IMG_2.jpg", width: null, camera: null, views: null, googleUrl: null })
  })

  it("only serves indexed photos and requires a session", async () => {
    const { getPhotoInfo } = await import("@/server/services/photos")
    expect(await getPhotoInfo(999999)).toBeNull()
    jar.clear()
    await expect(getPhotoInfo(photoId)).rejects.toThrow(/redirect:\/login/)
  })
})

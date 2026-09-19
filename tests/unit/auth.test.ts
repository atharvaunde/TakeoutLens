import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { isAllowedHost, isAllowedOrigin } from "@/proxy"
import { hashPassword, verifyPassword } from "@/server/auth/password"
import { recordFailure, resetFailures, retryAfterMs } from "@/server/auth/rate-limit"

describe("password hashing", () => {
  it("verifies the right password and rejects others; salts differ", () => {
    const a = hashPassword("correct horse")
    expect(verifyPassword("correct horse", a)).toBe(true)
    expect(verifyPassword("wrong", a)).toBe(false)
    expect(hashPassword("correct horse").hash).not.toBe(a.hash)
    expect(JSON.stringify(a)).not.toContain("correct horse")
  })
})

describe("rate limit", () => {
  beforeEach(() => resetFailures())
  it("allows a few attempts then backs off progressively", () => {
    const t = 1_000_000_000_000
    for (let i = 0; i < 3; i++) recordFailure(t)
    expect(retryAfterMs(t)).toBe(0 + 1000) // 4th attempt waits the base delay
    recordFailure(t)
    expect(retryAfterMs(t)).toBe(2000)
    expect(retryAfterMs(t + 5000)).toBe(0)
  })
})

describe("host/origin allowlist", () => {
  it("accepts localhost forms and rejects rebinding hosts", () => {
    expect(isAllowedHost("localhost:3000")).toBe(true)
    expect(isAllowedHost("127.0.0.1:3000")).toBe(true)
    expect(isAllowedHost("[::1]:3000")).toBe(true)
    expect(isAllowedHost("evil.example")).toBe(false)
    expect(isAllowedHost("localhost.evil.example")).toBe(false)
    expect(isAllowedHost(null)).toBe(false)
  })
  it("rejects foreign origins but accepts missing/local ones", () => {
    expect(isAllowedOrigin(null)).toBe(true)
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true)
    expect(isAllowedOrigin("https://evil.example")).toBe(false)
    expect(isAllowedOrigin("not a url")).toBe(false)
  })
  it("honours ALLOWED_HOSTS via the explicit allowlist argument", () => {
    expect(isAllowedHost("takeout.lan:3000", ["takeout.lan"])).toBe(true)
  })
})

describe("auth store", () => {
  const original = process.env.DATA_DIR
  let dir: string
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "auth-"))
    process.env.DATA_DIR = dir
  })
  afterEach(() => {
    process.env.DATA_DIR = original
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it("stores only a hash, refuses to overwrite, and manages sessions", async () => {
    const store = await import("@/server/auth/store")
    expect(store.isPasswordSet()).toBe(false)
    expect(store.savePassword("my secret pw")).toBe(true)
    expect(store.savePassword("another pw")).toBe(false)
    const raw = fs.readFileSync(path.join(dir, "auth.json"), "utf8")
    expect(raw).not.toContain("my secret pw")
    expect(store.checkPassword("my secret pw")).toBe(true)
    expect(store.checkPassword("nope")).toBe(false)

    const { token } = store.createSession()
    expect(store.isValidSession(token)).toBe(true)
    expect(store.isValidSession("forged")).toBe(false)
    store.deleteSession(token)
    expect(store.isValidSession(token)).toBe(false)
    // Deleting auth.json returns to first-run setup.
    fs.rmSync(path.join(dir, "auth.json"))
    expect(store.isPasswordSet()).toBe(false)
  })
})

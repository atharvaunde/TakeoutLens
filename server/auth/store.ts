import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"

import { AUTH, AUTH_FILE_NAME, SESSION } from "@/lib/constant"
import { getConfig } from "@/server/config"
import { getDb } from "@/server/db"
import { hashPassword, verifyPassword, type PasswordRecord } from "./password"

const authFile = () => path.join(getConfig().dataDir, AUTH_FILE_NAME)

export function isPasswordSet(): boolean {
  return fs.existsSync(authFile())
}

/** Stores a salted scrypt hash (never the password). Fails if a password already exists. */
export function savePassword(password: string): boolean {
  fs.mkdirSync(getConfig().dataDir, { recursive: true })
  try {
    fs.writeFileSync(authFile(), JSON.stringify(hashPassword(password)), { flag: "wx", mode: 0o600 })
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return false
    throw error
  }
}

export function checkPassword(password: string): boolean {
  try {
    return verifyPassword(password, JSON.parse(fs.readFileSync(authFile(), "utf8")) as PasswordRecord)
  } catch {
    return false
  }
}

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex")

export function createSession(): { token: string; expiresAt: number } {
  const token = crypto.randomBytes(AUTH.tokenBytes).toString("hex")
  const expiresAt = Date.now() + SESSION.maxAgeSeconds * 1000
  const db = getDb()
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now())
  db.prepare("INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)").run(sha256(token), expiresAt)
  return { token, expiresAt }
}

export function isValidSession(token: string | undefined): boolean {
  if (!token) return false
  const row = getDb().prepare("SELECT expires_at FROM sessions WHERE token_hash = ?").get(sha256(token)) as
    | { expires_at: number }
    | undefined
  return Boolean(row && row.expires_at > Date.now())
}

export function deleteSession(token: string | undefined) {
  if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token))
}

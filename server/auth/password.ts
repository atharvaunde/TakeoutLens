import crypto from "node:crypto"

import { AUTH } from "@/lib/constant"

const { keyLength, cost, blockSize, parallelization } = AUTH.scrypt

export interface PasswordRecord {
  salt: string
  hash: string
}

function derive(password: string, salt: Buffer): Buffer {
  return crypto.scryptSync(password, salt, keyLength, { N: cost, r: blockSize, p: parallelization })
}

export function hashPassword(password: string): PasswordRecord {
  const salt = crypto.randomBytes(AUTH.saltBytes)
  return { salt: salt.toString("hex"), hash: derive(password, salt).toString("hex") }
}

export function verifyPassword(password: string, record: PasswordRecord): boolean {
  const expected = Buffer.from(record.hash, "hex")
  const actual = derive(password, Buffer.from(record.salt, "hex"))
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

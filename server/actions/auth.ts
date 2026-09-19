"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AUTH, AUTH_TEXT, SESSION } from "@/lib/constant"
import type { AuthFormState } from "@/lib/types"
import { recordFailure, resetFailures, retryAfterMs } from "@/server/auth/rate-limit"
import { checkPassword, createSession, deleteSession, isPasswordSet, savePassword } from "@/server/auth/store"

async function startSession() {
  const { token, expiresAt } = createSession()
  ;(await cookies()).set(SESSION.cookieName, token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  })
}

export async function setupPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (isPasswordSet()) redirect("/login")
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")
  if (password.length < AUTH.minPasswordLength) return { error: AUTH_TEXT.tooShort }
  if (password !== confirm) return { error: AUTH_TEXT.mismatch }
  if (!savePassword(password)) redirect("/login")
  await startSession()
  redirect("/")
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (!isPasswordSet()) redirect("/setup")
  if (retryAfterMs() > 0) return { error: AUTH_TEXT.tooMany }
  if (!checkPassword(String(formData.get("password") ?? ""))) {
    recordFailure()
    return { error: AUTH_TEXT.wrongPassword }
  }
  resetFailures()
  await startSession()
  redirect("/")
}

export async function logoutAction() {
  const jar = await cookies()
  deleteSession(jar.get(SESSION.cookieName)?.value)
  jar.delete(SESSION.cookieName)
  redirect("/login")
}

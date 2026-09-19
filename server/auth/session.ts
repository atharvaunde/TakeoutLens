import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION } from "@/lib/constant"
import { isPasswordSet, isValidSession } from "./store"

export async function hasValidSession(): Promise<boolean> {
  return isValidSession((await cookies()).get(SESSION.cookieName)?.value)
}

/**
 * The real security boundary. Call at the top of every service, Server Function and
 * Route Handler: `proxy.ts` and layouts can be skipped by direct POSTs or partial renders.
 */
export async function requireSession(): Promise<void> {
  if (!isPasswordSet()) redirect("/setup")
  if (!(await hasValidSession())) redirect("/login")
}

/** For Route Handlers, which should answer 401 instead of redirecting. */
export async function isAuthorized(): Promise<boolean> {
  return isPasswordSet() && (await hasValidSession())
}

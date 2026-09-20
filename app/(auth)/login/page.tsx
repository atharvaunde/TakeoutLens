import { redirect } from "next/navigation"
import { connection } from "next/server"

import { LockScreen } from "@/components/auth/lock-screen"
import { AUTH_TEXT } from "@/lib/constant"
import { loginAction } from "@/server/actions/auth"
import { isPasswordSet } from "@/server/auth/store"
import { getLockInfo } from "@/server/services/lock"

export default async function LoginPage() {
  await connection() // depends on auth.json at request time: never prerender
  if (!isPasswordSet()) redirect("/setup")
  return <LockScreen info={getLockInfo()} kicker="Vault locked" title={AUTH_TEXT.loginTitle} submitLabel="Unlock" action={loginAction} />
}

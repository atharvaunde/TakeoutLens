import { redirect } from "next/navigation"
import { connection } from "next/server"

import { AuthForm } from "@/components/auth/auth-form"
import { AUTH_TEXT } from "@/lib/constant"
import { loginAction } from "@/server/actions/auth"
import { isPasswordSet } from "@/server/auth/store"

export default async function LoginPage() {
  await connection() // depends on auth.json at request time: never prerender
  if (!isPasswordSet()) redirect("/setup")
  return <AuthForm title={AUTH_TEXT.loginTitle} submitLabel="Unlock" action={loginAction} />
}

import { redirect } from "next/navigation"

import { AuthForm } from "@/components/auth/auth-form"
import { AUTH_TEXT } from "@/lib/constant"
import { loginAction } from "@/server/actions/auth"
import { isPasswordSet } from "@/server/auth/store"

export default function LoginPage() {
  if (!isPasswordSet()) redirect("/setup")
  return <AuthForm title={AUTH_TEXT.loginTitle} submitLabel="Unlock" action={loginAction} />
}

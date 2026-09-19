import { redirect } from "next/navigation"
import { connection } from "next/server"

import { AuthForm } from "@/components/auth/auth-form"
import { AUTH_TEXT } from "@/lib/constant"
import { setupPasswordAction } from "@/server/actions/auth"
import { isPasswordSet } from "@/server/auth/store"

export default async function SetupPage() {
  await connection() // depends on auth.json at request time: never prerender
  if (isPasswordSet()) redirect("/login")
  return (
    <AuthForm
      title={AUTH_TEXT.setupTitle}
      description={AUTH_TEXT.setupDescription}
      submitLabel="Set password"
      confirm
      action={setupPasswordAction}
    />
  )
}

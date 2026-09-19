import { redirect } from "next/navigation"

import { AuthForm } from "@/components/auth/auth-form"
import { AUTH_TEXT } from "@/lib/constant"
import { setupPasswordAction } from "@/server/actions/auth"
import { isPasswordSet } from "@/server/auth/store"

export default function SetupPage() {
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

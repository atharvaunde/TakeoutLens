import { redirect } from "next/navigation"
import { connection } from "next/server"

import { LockScreen } from "@/components/auth/lock-screen"
import { AUTH_TEXT } from "@/lib/constant"
import { setupPasswordAction } from "@/server/actions/auth"
import { isPasswordSet } from "@/server/auth/store"
import { getLockInfo } from "@/server/services/lock"

export default async function SetupPage() {
  await connection() // depends on auth.json at request time: never prerender
  if (isPasswordSet()) redirect("/login")
  return (
    <LockScreen
      info={getLockInfo()}
      kicker="First run"
      title={AUTH_TEXT.setupTitle}
      description={AUTH_TEXT.setupDescription}
      submitLabel="Set password"
      confirm
      action={setupPasswordAction}
    />
  )
}

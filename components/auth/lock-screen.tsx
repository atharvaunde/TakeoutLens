import { AuthForm } from "@/components/auth/auth-form"
import { APP_NAME } from "@/lib/constant"
import { formatRelative } from "@/lib/helper"
import type { AuthFormState, LockInfo } from "@/lib/types"

interface LockScreenProps {
  info: LockInfo
  kicker: string
  title: string
  description?: string
  submitLabel: string
  confirm?: boolean
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>
}

/** Split-screen lock: brand and pitch on the left, the password form on the right. */
export function LockScreen({ info, ...form }: LockScreenProps) {
  return (
    <div className="grid h-svh grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col border-r border-line bg-panel p-10">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- small local static logo */}
          <img src="/brand/icon.png" alt={APP_NAME} className="size-11 flex-none object-contain" />
          <div className="text-[24px] font-semibold tracking-[-.02em] whitespace-nowrap">
            Takeout<span className="text-acc">Lens</span>
          </div>
        </div>
        <div className="my-auto flex max-w-[440px] flex-col gap-[22px]">
          <div className="text-[34px] leading-[1.12] font-semibold tracking-[-.025em] text-pretty">Your Google archive, read on your own machine.</div>
          <div className="text-sm leading-[1.65] text-mute text-pretty">
            Mail, Chat, Calendar, Drive, Photos and the rest — indexed locally from the export folder. Nothing is uploaded, nothing phones home.
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-10">
        <AuthForm
          {...form}
          status={info.folderFound ? `Folder found · index current as of ${info.indexedAt ? formatRelative(info.indexedAt) : "never"}` : "Folder not indexed yet"}
          statusOk={info.folderFound}
        />
      </div>
    </div>
  )
}

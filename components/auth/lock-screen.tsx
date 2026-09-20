import { AuthForm } from "@/components/auth/auth-form"
import { APP_NAME } from "@/lib/constant"
import { formatBytes, formatNumber, formatRelative } from "@/lib/helper"
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

const Row = ({ label, value, first }: { label: string; value: string; first?: boolean }) => (
  <div className={`flex max-w-[320px] justify-between ${first ? "border-t border-line pt-2" : ""}`}>
    <span>{label}</span>
    <span className="text-ink2">{value}</span>
  </div>
)

/** Split-screen lock: brand and archive facts on the left, the password form on the right. */
export function LockScreen({ info, ...form }: LockScreenProps) {
  return (
    <div className="grid h-svh grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col justify-between border-r border-line bg-panel p-10">
        <div className="flex items-center gap-[9px]">
          <div className="size-[18px] rounded bg-acc" />
          <div className="font-mono text-[11px] tracking-[.16em] text-mute uppercase">{APP_NAME}</div>
        </div>
        <div className="flex max-w-[440px] flex-col gap-[22px]">
          <div className="text-[34px] leading-[1.12] font-semibold tracking-[-.025em] text-pretty">Your Google archive, read on your own machine.</div>
          <div className="text-sm leading-[1.65] text-mute text-pretty">
            Mail, Chat, Calendar, Drive, Photos and the rest — indexed locally from the export folder. Nothing is uploaded, nothing phones home.
          </div>
        </div>
        <div className="flex flex-col gap-2.5 font-mono text-[11.5px] text-faint">
          <Row first label="SOURCE" value={info.source} />
          <Row label="FILES" value={formatNumber(info.files)} />
          <Row label="SIZE" value={formatBytes(info.bytes)} />
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

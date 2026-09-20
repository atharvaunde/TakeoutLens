"use client"

import { useActionState } from "react"

import { AUTH } from "@/lib/constant"
import type { AuthFormState } from "@/lib/types"

interface AuthFormProps {
  kicker: string
  title: string
  description?: string
  submitLabel: string
  /** Ask to repeat the password (first-run setup). */
  confirm?: boolean
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>
  status: string
  statusOk: boolean
}

const inputClass =
  "h-[38px] w-full rounded-lg border border-line bg-surf px-3 text-sm text-ink outline-none focus:border-acc focus:shadow-[0_0_0_3px_var(--accbg)]"

/** Design lock-screen form (used for first-run setup and login). */
export function AuthForm({ kicker, title, description, submitLabel, confirm = false, action, status, statusOk }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null })
  return (
    <form action={formAction} className="flex w-full max-w-[340px] flex-col gap-[18px]">
      <div>
        <div className="mb-2 font-mono text-[10.5px] tracking-[.16em] text-faint uppercase">{kicker}</div>
        <div className="text-[22px] font-semibold tracking-[-.02em]">{title}</div>
        {description ? <p className="mt-2 text-[12.5px] leading-relaxed text-mute">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-[7px]">
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="text-[12.5px] font-medium text-ink2">
            Password
          </label>
          <span className="font-mono text-[10.5px] text-faint">⏎ {confirm ? "set" : "unlock"}</span>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••••"
          autoComplete={confirm ? "new-password" : "current-password"}
          minLength={confirm ? AUTH.minPasswordLength : undefined}
          aria-invalid={state.error ? true : undefined}
          required
          autoFocus
          className={inputClass}
        />
      </div>
      {confirm ? (
        <div className="flex flex-col gap-[7px]">
          <label htmlFor="confirm" className="text-[12.5px] font-medium text-ink2">
            Confirm password
          </label>
          <input id="confirm" name="confirm" type="password" placeholder="••••••••••" autoComplete="new-password" required className={inputClass} />
        </div>
      ) : null}
      {state.error ? <div className="rounded-lg border border-line bg-panel px-3 py-2 text-[12.5px] text-destructive">{state.error}</div> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-[38px] rounded-lg border border-acc bg-acc text-sm font-medium text-on-acc hover:brightness-110 disabled:opacity-70"
      >
        {submitLabel}
      </button>
      <div className="flex items-center gap-[7px] pt-0.5">
        <div className={`size-[5px] rounded-full ${statusOk ? "bg-ok" : "bg-faint"}`} />
        <div className="text-xs text-mute">{status}</div>
      </div>
    </form>
  )
}

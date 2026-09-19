"use client"

import { useTransition } from "react"
import { RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

/** Runs a Server Function (e.g. start indexing) with a pending state. */
export function ActionButton({ action, label, disabled }: { action: () => Promise<unknown>; label: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button variant="outline" disabled={disabled || pending} onClick={() => startTransition(() => void action())}>
      {pending || disabled ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
      {label}
    </Button>
  )
}

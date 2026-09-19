"use client"

import { useState } from "react"
import { ClipboardIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

const MASK = "••••••••"

/** A value hidden by default (e.g. saved passwords), with show/hide and copy. */
export function SecretCell({ value, label }: { value: string; label: string }) {
  const [shown, setShown] = useState(false)
  if (!value) return null
  return (
    <div className="flex items-center gap-1">
      <span className="min-w-24 font-mono text-xs">{shown ? value : MASK}</span>
      <Button variant="ghost" size="icon-sm" aria-label={shown ? `Hide ${label}` : `Show ${label}`} onClick={() => setShown((v) => !v)}>
        {shown ? <EyeOffIcon /> : <EyeIcon />}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value)
            toast.success(`${label} copied`)
          } catch {
            toast.error("Could not copy")
          }
        }}
      >
        <ClipboardIcon />
      </Button>
    </div>
  )
}

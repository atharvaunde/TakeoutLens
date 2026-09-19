"use client"

import { useTransition } from "react"
import { RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { StartIndexingResult } from "@/lib/types"
import { pluralize } from "@/lib/helper"

interface ActionButtonProps {
  action: () => Promise<StartIndexingResult>
  label: string
  disabled?: boolean
}

function describe(result: StartIndexingResult): { ok: boolean; title: string; body?: string } {
  if (result.status === "already-running") return { ok: true, title: "Indexing is already running" }
  if (result.status === "running") return { ok: true, title: "Indexing started", body: "Large modules can take a while; progress shows on the cards." }
  const run = result.run
  if (!run) return { ok: true, title: "Indexing finished" }
  const changes = run.added + run.updated + run.removed
  return {
    ok: run.errors === 0,
    title: run.errors ? `Indexing finished with ${pluralize(run.errors, "error")}` : "Indexing finished",
    body: `${pluralize(run.totalFiles, "file")} scanned in ${(run.durationMs / 1000).toFixed(1)}s. ${
      changes ? `${pluralize(run.added, "new file")}, ${pluralize(run.updated, "changed")}, ${pluralize(run.removed, "removed")}.` : "No changes since the last run."
    }`,
  }
}

/** Runs the indexing Server Function with a pending state and reports the outcome in a toast. */
export function ActionButton({ action, label, disabled }: ActionButtonProps) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          const { ok, title, body } = describe(await action())
          ;(ok ? toast.success : toast.warning)(title, { description: body })
        })
      }
    >
      {pending || disabled ? <Spinner data-icon="inline-start" /> : <RefreshCwIcon data-icon="inline-start" />}
      {label}
    </Button>
  )
}

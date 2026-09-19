import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MODULE_STATE_LABELS } from "@/lib/constant"
import { formatBytes, pluralize } from "@/lib/helper"
import type { ModuleStatus } from "@/lib/types"

export function ModuleStatusCard({ status }: { status: ModuleStatus }) {
  const { module, state, fileCount, totalBytes } = status
  const available = state !== "missing"
  const linkable = available && module.built
  const card = (
    <Card className={available ? "transition-colors hover:bg-muted/50" : "opacity-60"}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <module.icon />
          <Badge variant={state === "failed" ? "destructive" : state === "ready" ? "default" : "secondary"}>
            {MODULE_STATE_LABELS[state]}
          </Badge>
        </div>
        <CardTitle>{module.label}</CardTitle>
        <CardDescription>
          {available ? `${pluralize(fileCount, "file")} · ${formatBytes(totalBytes)}` : "Not found in this export"}
        </CardDescription>
      </CardHeader>
    </Card>
  )
  return linkable ? <Link href={module.href}>{card}</Link> : card
}

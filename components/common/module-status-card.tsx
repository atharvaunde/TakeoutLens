import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ModuleDefinition } from "@/lib/constant"

interface ModuleStatusCardProps {
  module: ModuleDefinition
  status: string
}

export function ModuleStatusCard({ module, status }: ModuleStatusCardProps) {
  return (
    <Link href={module.href}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <module.icon />
            <Badge variant="secondary">{status}</Badge>
          </div>
          <CardTitle>{module.label}</CardTitle>
          <CardDescription>{module.sourceFolders.join(", ") || "Everything else"}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}

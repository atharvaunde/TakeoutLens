import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MAIL_TEXT } from "@/lib/constant"
import { formatNumber } from "@/lib/helper"
import type { MailLabelItem } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MailLabelsProps {
  labels: MailLabelItem[]
  active: string | null
  hrefFor: (label: string | null) => string
}

export function MailLabels({ labels, active, hrefFor }: MailLabelsProps) {
  const item = (label: string | null, text: string, total?: number, unread?: number) => (
    <Link
      key={label ?? "all"}
      href={hrefFor(label)}
      className={cn("flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60", active === label && "bg-muted font-medium")}
    >
      <span className="truncate">{text}</span>
      {unread ? <Badge variant="secondary">{formatNumber(unread)}</Badge> : total !== undefined ? <span className="text-xs text-muted-foreground">{formatNumber(total)}</span> : null}
    </Link>
  )
  return (
    <ScrollArea className="min-h-0 flex-1">
      <nav className="flex flex-col gap-0.5">
        {item(null, MAIL_TEXT.allMail)}
        {labels.map((l) => item(l.label, l.label, l.total, l.unread))}
      </nav>
    </ScrollArea>
  )
}

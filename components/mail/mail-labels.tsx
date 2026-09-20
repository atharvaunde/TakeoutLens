import Link from "next/link"

import { MAIL_TEXT } from "@/lib/constant"
import { formatNumber } from "@/lib/helper"
import type { MailLabelItem } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MailLabelsProps {
  total: number
  labels: MailLabelItem[]
  active: string | null
  hrefFor: (label: string | null) => string
}

const GROUPS: { id: MailLabelItem["group"]; title: string }[] = [
  { id: "system", title: "System" },
  { id: "category", title: "Categories" },
  { id: "user", title: "Your labels" },
]

interface Row {
  key: string
  label: string | null
  name: string
  total: number
  decoded: boolean
  depth: number
}

/** Grouped label list: System (with All mail), Categories, Your labels (nested, decoded ones flagged "Q"). */
export function MailLabels({ total, labels, active, hrefFor }: MailLabelsProps) {
  const rowsFor = (group: MailLabelItem["group"]): Row[] => {
    const own = labels.filter((l) => l.group === group).map((l) => ({ key: l.label, label: l.label, name: l.name, total: l.total, decoded: l.decoded, depth: l.depth }))
    return group === "system" ? [{ key: "all", label: null, name: MAIL_TEXT.allMail, total, decoded: false, depth: 0 }, ...own] : own
  }
  return (
    <div className="h-full overflow-y-auto border-r border-line bg-background px-2 py-2.5">
      {GROUPS.map((group) => {
        const rows = rowsFor(group.id)
        if (rows.length === 0) return null
        return (
          <div key={group.id} className="mb-3.5">
            <div className="px-[7px] pb-1 font-mono text-[9.5px] tracking-[.16em] text-faint uppercase">{group.title}</div>
            {rows.map((row) => {
              const on = row.label === active
              return (
                <Link
                  key={row.key}
                  href={hrefFor(row.label)}
                  title={row.label ?? row.name}
                  className={cn("flex items-center gap-[7px] rounded-[7px] px-[7px] py-1 text-ink no-underline hover:bg-hov hover:no-underline", on && "bg-sel")}
                >
                  <span className="flex-none" style={{ width: row.depth * 12 }} />
                  <span className={cn("size-[5px] flex-none rounded-[1px]", on ? "bg-acc" : "bg-line")} />
                  <span className={cn("min-w-0 flex-1 truncate text-[12.5px]", on ? "font-semibold text-ink" : "font-[450] text-ink2")}>{row.name}</span>
                  {row.decoded ? (
                    <span title="Decoded from MIME-encoded label" className="rounded-[2px] border border-line px-[3px] font-mono text-[8.5px] text-faint">
                      Q
                    </span>
                  ) : null}
                  <span className="font-mono text-[9.5px] text-faint">{formatNumber(row.total)}</span>
                </Link>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

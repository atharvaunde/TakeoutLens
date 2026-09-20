import Link from "next/link"

import type { MailRow } from "@/columns/mail-messages.column"
import { MAIL_TEXT } from "@/lib/constant"
import { formatDate } from "@/lib/helper"
import { cn } from "@/lib/utils"

interface DiscussionListProps {
  rows: MailRow[]
  activeId: number | null
  hrefFor: (messageId: number) => string
}

/** Discussion rows: subject + date, then "sender · snippet"; the open one is filled with an accent mark. */
export function DiscussionList({ rows, activeId, hrefFor }: DiscussionListProps) {
  if (rows.length === 0) return <div className="px-4 py-10 text-center text-[12.5px] text-faint">No discussions</div>
  return (
    <>
      {rows.map((row) => {
        const on = row.messageId === activeId
        return (
          <Link
            key={row.messageId}
            href={hrefFor(row.messageId)}
            className={cn("grid grid-cols-[2px_1fr] border-b border-line2 text-ink no-underline hover:bg-hov hover:no-underline", on && "bg-sel")}
          >
            <div className={on ? "bg-acc" : "bg-transparent"} />
            <div className="min-w-0 px-3 py-2">
              <div className="flex items-baseline gap-[9px]">
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{row.subject || MAIL_TEXT.noSubject}</span>
                <span className="flex-none font-mono text-[9.5px] text-faint">{formatDate(row.date, { day: "2-digit" })}</span>
              </div>
              <div className="mt-0.5 truncate text-[11.5px] text-faint">
                {row.from} · {row.snippet}
              </div>
            </div>
          </Link>
        )
      })}
    </>
  )
}

import Link from "next/link"

import type { MailRow } from "@/columns/mail-messages.column"
import { MAIL_TEXT } from "@/lib/constant"
import { formatDate } from "@/lib/helper"
import { cn } from "@/lib/utils"

interface MailListProps {
  rows: MailRow[]
  activeId: number | null
  hrefFor: (messageId: number) => string
}

/** Message rows: sender + date, subject, snippet; the open message gets a filled row and an accent mark. */
export function MailList({ rows, activeId, hrefFor }: MailListProps) {
  if (rows.length === 0) return <div className="px-4 py-10 text-center text-[12.5px] text-faint">No messages</div>
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
            <div className="min-w-0 px-[11px] py-2">
              <div className="flex items-baseline gap-[9px]">
                <span className={cn("min-w-0 flex-1 truncate text-[12.5px]", row.unread ? "font-semibold" : "font-medium")}>{row.from}</span>
                <span className="flex-none font-mono text-[9.5px] text-faint">{formatDate(row.date, { year: "numeric" })}</span>
              </div>
              <div className="mt-0.5 truncate text-[12.5px] text-ink2">{row.subject || MAIL_TEXT.noSubject}</div>
              <div className="mt-px truncate text-[11.5px] text-faint">{row.snippet}</div>
            </div>
          </Link>
        )
      })}
    </>
  )
}

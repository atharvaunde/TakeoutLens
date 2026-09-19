"use client"

import { PaperclipIcon } from "lucide-react"
import { createColumnHelper } from "@tanstack/react-table"

import type { DataTableFeatures } from "@/components/data-table/features"
import { MAIL_TEXT } from "@/lib/constant"
import { formatDate } from "@/lib/helper"
import { cn } from "@/lib/utils"

export interface MailRow {
  id: string
  messageId: number
  threadId: string
  from: string
  subject: string
  snippet: string
  date: string
  hasAttachment: boolean
  unread: boolean
  /** Link that opens this message in the reading pane (filled by the page). */
  href: string
}

const helper = createColumnHelper<DataTableFeatures, MailRow>()

export const mailColumns = helper.columns([
  helper.accessor("from", {
    header: "From",
    cell: (info) => <span className={cn("block max-w-40 truncate", info.row.original.unread && "font-semibold")}>{info.getValue()}</span>,
  }),
  helper.accessor("subject", {
    header: "Subject",
    cell: (info) => (
      <div className="flex min-w-0 max-w-md flex-col">
        <span className={cn("truncate", info.row.original.unread && "font-semibold")}>
          {info.getValue() || MAIL_TEXT.noSubject}
          {info.row.original.hasAttachment ? <PaperclipIcon className="ml-1 inline size-3.5 text-muted-foreground" /> : null}
        </span>
        <span className="truncate text-xs text-muted-foreground">{info.row.original.snippet}</span>
      </div>
    ),
  }),
  helper.accessor("date", { header: "Date", cell: (info) => formatDate(info.getValue()) }),
])

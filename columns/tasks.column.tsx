"use client"

import { createColumnHelper } from "@tanstack/react-table"

import type { DataTableFeatures } from "@/components/data-table/features"
import { formatDate } from "@/lib/helper"
import { cn } from "@/lib/utils"

export interface TaskRow {
  id: string
  list: string
  title: string
  status: string
  due: string | null
  completed: string | null
  updated: string | null
  notes: string
}

const helper = createColumnHelper<DataTableFeatures, TaskRow>()

export const taskColumns = helper.columns([
  helper.accessor("title", {
    header: "Task",
    cell: (info) => {
      const done = info.row.original.status === "completed"
      return (
        <div className="flex min-w-0 flex-col">
          <span className={cn("text-[13px]", done ? "text-faint line-through" : "text-ink")}>
            {done ? "✓  " : "○  "}
            {info.getValue() || "(untitled)"}
          </span>
          {info.row.original.notes ? <span className="line-clamp-1 pl-[1.35rem] text-xs text-faint">{info.row.original.notes}</span> : null}
        </div>
      )
    },
  }),
  helper.accessor("list", { header: "List", enableSorting: false, cell: (info) => <span className="text-xs text-faint">{info.getValue()}</span> }),
  helper.accessor("due", { header: "Due", cell: (info) => <span className="font-mono text-[11.5px] text-mute">{formatDate(info.getValue(), { timeZone: "UTC" })}</span> }),
  helper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const done = info.getValue() === "completed"
      return <span className={cn("font-mono text-[11px]", done ? "text-faint" : "text-acc")}>{done ? "Completed" : "To do"}</span>
    },
  }),
])

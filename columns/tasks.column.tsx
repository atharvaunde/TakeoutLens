"use client"

import { CheckCircle2Icon, CircleIcon } from "lucide-react"
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
        <div className="flex items-start gap-2">
          {done ? <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : <CircleIcon className="mt-0.5 size-4 shrink-0" />}
          <div className="flex min-w-0 flex-col">
            <span className={cn("font-medium", done && "text-muted-foreground line-through")}>{info.getValue() || "(untitled)"}</span>
            {info.row.original.notes ? <span className="line-clamp-2 text-xs text-muted-foreground">{info.row.original.notes}</span> : null}
          </div>
        </div>
      )
    },
  }),
  helper.accessor("list", { header: "List", enableSorting: false }),
  helper.accessor("due", { header: "Due", cell: (info) => formatDate(info.getValue(), { timeZone: "UTC" }) }),
  helper.accessor("status", { header: "Status", cell: (info) => (info.getValue() === "completed" ? "Completed" : "To do") }),
  helper.accessor("completed", { header: "Completed", enableSorting: false, cell: (info) => formatDate(info.getValue()) }),
])

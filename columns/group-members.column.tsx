"use client"

import { createColumnHelper } from "@tanstack/react-table"

import type { DataTableFeatures } from "@/components/data-table/features"
import { formatDate } from "@/lib/helper"

export interface GroupMemberRow {
  id: string
  name: string
  email: string
  role: string
  delivery: string
  updatedAt: string | null
}

const helper = createColumnHelper<DataTableFeatures, GroupMemberRow>()
const mono = "font-mono text-[11.5px] text-mute"

export const groupMemberColumns = helper.columns([
  helper.accessor("name", { header: "Member", enableSorting: false, cell: (info) => <span className="text-[13px] text-ink">{info.getValue() || info.row.original.email}</span> }),
  helper.accessor("email", { header: "Email", enableSorting: false, cell: (info) => <span className={mono}>{info.getValue()}</span> }),
  helper.accessor("role", { header: "Role", enableSorting: false, cell: (info) => <span className="font-mono text-[11px] text-faint">{info.getValue()}</span> }),
  helper.accessor("delivery", { header: "Delivery", enableSorting: false, cell: (info) => <span className="text-xs text-faint">{info.getValue()}</span> }),
  helper.accessor("updatedAt", { header: "Updated", enableSorting: false, cell: (info) => <span className={mono}>{formatDate(info.getValue())}</span> }),
])

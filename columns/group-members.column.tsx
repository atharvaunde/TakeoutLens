"use client"

import { createColumnHelper } from "@tanstack/react-table"

import type { DataTableFeatures } from "@/components/data-table/features"
import { Badge } from "@/components/ui/badge"
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

export const groupMemberColumns = helper.columns([
  helper.accessor("email", { header: "Member", enableSorting: false, cell: (info) => <span className="font-medium">{info.row.original.name || info.getValue()}</span> }),
  helper.accessor("name", { header: "Email", enableSorting: false, cell: (info) => info.row.original.email }),
  helper.accessor("role", { header: "Role", enableSorting: false, cell: (info) => <Badge variant="secondary">{info.getValue()}</Badge> }),
  helper.accessor("delivery", { header: "Delivery", enableSorting: false }),
  helper.accessor("updatedAt", { header: "Updated", enableSorting: false, cell: (info) => formatDate(info.getValue()) }),
])

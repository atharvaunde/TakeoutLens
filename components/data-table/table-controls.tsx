"use client"

import { type TableFilterDefinition } from "@/lib/constant"
import { DataTableToolbar } from "./data-table-toolbar"
import { useTableUrlState } from "./use-table-url-state"

interface TableControlsProps {
  searchPlaceholder?: string
  filters?: readonly TableFilterDefinition[]
}

const NO_FILTERS: readonly TableFilterDefinition[] = []

/** Search + filters for a table, meant to sit in a page header (drives the same URL params as DataTable). */
export function TableControls({ searchPlaceholder, filters = NO_FILTERS }: TableControlsProps) {
  const { params, update } = useTableUrlState(filters.map((f) => f.id))
  return <DataTableToolbar search={params.search} searchPlaceholder={searchPlaceholder} filters={filters} filterValues={params.filters} onChange={update} />
}

"use client"

import { Fragment, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import { useTable, type ColumnDef, type RowData, type SortingState, type PaginationState } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PAGINATION, TABLE_PARAMS, TABLE_TEXT, type TableFilterDefinition } from "@/lib/constant"
import { cn } from "@/lib/utils"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { dataTableFeatures, type DataTableFeatures } from "./features"
import { useTableUrlState } from "./use-table-url-state"

const EMPTY_SORTING: SortingState = []
const NO_FILTERS: readonly TableFilterDefinition[] = []

export interface DataTableProps<TData extends RowData> {
  /** Column definitions from `columns/*.column.ts` (never defined inline). */
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  /** Total rows across all pages (server-side pagination). */
  rowCount: number
  /** Field on each row holding an href; makes the row clickable. */
  rowHrefKey?: keyof TData & string
  /** Stable row id (defaults to the index). Needed for selection. */
  getRowId?: (row: TData) => string
  /** Serializable alternative to `getRowId` for Server Component pages: the row field holding the id. */
  rowIdKey?: keyof TData & string
  selectedRowId?: string | null
  onRowClick?: (row: TData) => void
  onRowDoubleClick?: (row: TData) => void
  /** Wrap each rendered row, e.g. in a context menu. Must return the given element inside its wrapper. */
  wrapRow?: (row: TData, element: React.ReactElement) => React.ReactElement
  /** Extra controls shown at the right end of the toolbar. */
  toolbarEnd?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  /** Show the search box (URL param `q`; the page filters server-side). */
  searchable?: boolean
  searchPlaceholder?: string
  /** Dropdown filters; each `id` is a URL param the page reads via `parseTableParams`. */
  filters?: readonly TableFilterDefinition[]
  pageSizeOptions?: readonly number[]
  className?: string
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  rowCount,
  rowHrefKey,
  getRowId,
  rowIdKey,
  selectedRowId,
  onRowClick,
  onRowDoubleClick,
  wrapRow,
  toolbarEnd,
  emptyTitle = TABLE_TEXT.empty,
  emptyDescription,
  searchable = false,
  searchPlaceholder,
  filters = NO_FILTERS,
  pageSizeOptions = PAGINATION.pageSizeOptions,
  className,
}: DataTableProps<TData>) {
  const router = useRouter()
  const filterIds = useMemo(() => filters.map((filter) => filter.id), [filters])
  const { params, isPending, update } = useTableUrlState(filterIds)

  const pagination: PaginationState = { pageIndex: params.page - 1, pageSize: params.pageSize }
  const sorting: SortingState = useMemo(
    () => (params.sort ? [{ id: params.sort, desc: params.dir === "desc" }] : EMPTY_SORTING),
    [params.sort, params.dir]
  )

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    rowCount,
    ...(getRowId || rowIdKey
      ? { getRowId: (row: TData) => (getRowId ? getRowId(row) : String(row[rowIdKey as keyof TData])) }
      : {}),
    manualPagination: true,
    manualSorting: true,
    state: { pagination, sorting },
    onPaginationChange: (updater) => {
      const value = typeof updater === "function" ? updater(pagination) : updater
      update({
        [TABLE_PARAMS.page]: String(value.pageIndex + 1),
        [TABLE_PARAMS.pageSize]: String(value.pageSize),
      })
    },
    onSortingChange: (updater) => {
      const value = typeof updater === "function" ? updater(sorting) : updater
      const [first] = value
      update({
        [TABLE_PARAMS.sort]: first?.id ?? null,
        [TABLE_PARAMS.dir]: first ? (first.desc ? "desc" : "asc") : null,
      })
    },
  })

  const rows = table.getRowModel().rows
  const pageCount = table.getPageCount()

  return (
    <div className={cn("flex flex-col gap-4", isPending && "opacity-70", className)}>
      {searchable || filters.length > 0 || toolbarEnd ? (
        <DataTableToolbar
          search={params.search}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          filterValues={params.filters}
          onChange={update}
          end={toolbarEnd}
        />
      ) : null}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-2"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUpIcon data-icon="inline-end" />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon data-icon="inline-end" />
                          ) : (
                            <ArrowUpDownIcon data-icon="inline-end" />
                          )}
                        </Button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>{emptyTitle}</EmptyTitle>
                      {emptyDescription ? <EmptyDescription>{emptyDescription}</EmptyDescription> : null}
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const href = rowHrefKey ? (row.original[rowHrefKey] as string | undefined) : undefined
                const clickable = Boolean(href || onRowClick || onRowDoubleClick)
                const element = (
                  <TableRow
                    key={row.id}
                    data-state={selectedRowId && row.id === selectedRowId ? "selected" : undefined}
                    className={cn(clickable && "cursor-pointer select-none")}
                    onClick={href ? () => router.push(href) : onRowClick ? () => onRowClick(row.original) : undefined}
                    onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row.original) : undefined}
                  >
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                )
                return wrapRow ? <Fragment key={row.id}>{wrapRow(row.original, element)}</Fragment> : element
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={params.page}
        pageSize={params.pageSize}
        pageCount={pageCount}
        rowCount={rowCount}
        pageSizeOptions={pageSizeOptions}
        onPageChange={(page) => update({ [TABLE_PARAMS.page]: String(page) }, true)}
        onPageSizeChange={(size) => update({ [TABLE_PARAMS.pageSize]: String(size) })}
      />
    </div>
  )
}

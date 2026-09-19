"use client"

import { useCallback, useMemo, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react"
import { useTable, type ColumnDef, type RowData, type SortingState, type PaginationState } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PAGINATION, TABLE_PARAMS, TABLE_TEXT } from "@/lib/constant"
import { formatNumber, parseTableParams } from "@/lib/helper"
import { cn } from "@/lib/utils"
import { dataTableFeatures, type DataTableFeatures } from "./features"

const EMPTY_SORTING: SortingState = []

export interface DataTableProps<TData extends RowData> {
  /** Column definitions from `columns/*.column.ts` (never defined inline). */
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  /** Total rows across all pages (server-side pagination). */
  rowCount: number
  /** Field on each row holding an href; makes the row clickable. */
  rowHrefKey?: keyof TData & string
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  rowCount,
  rowHrefKey,
  emptyTitle = TABLE_TEXT.empty,
  emptyDescription,
  className,
}: DataTableProps<TData>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const params = useMemo(
    () => parseTableParams(Object.fromEntries(searchParams.entries())),
    [searchParams]
  )
  const pagination: PaginationState = { pageIndex: params.page - 1, pageSize: params.pageSize }
  const sorting: SortingState = useMemo(
    () => (params.sort ? [{ id: params.sort, desc: params.dir === "desc" }] : EMPTY_SORTING),
    [params.sort, params.dir]
  )

  const pushParams = useCallback(
    (update: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString())
      update(next)
      startTransition(() => router.push(`${pathname}?${next.toString()}`))
    },
    [pathname, router, searchParams]
  )

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    rowCount,
    manualPagination: true,
    manualSorting: true,
    state: { pagination, sorting },
    onPaginationChange: (updater) => {
      const value = typeof updater === "function" ? updater(pagination) : updater
      pushParams((next) => {
        next.set(TABLE_PARAMS.page, String(value.pageIndex + 1))
        next.set(TABLE_PARAMS.pageSize, String(value.pageSize))
      })
    },
    onSortingChange: (updater) => {
      const value = typeof updater === "function" ? updater(sorting) : updater
      pushParams((next) => {
        const [first] = value
        if (first) {
          next.set(TABLE_PARAMS.sort, first.id)
          next.set(TABLE_PARAMS.dir, first.desc ? "desc" : "asc")
        } else {
          next.delete(TABLE_PARAMS.sort)
          next.delete(TABLE_PARAMS.dir)
        }
        next.set(TABLE_PARAMS.page, "1")
      })
    },
  })

  const rows = table.getRowModel().rows
  const pageCount = table.getPageCount()

  return (
    <div className={cn("flex flex-col gap-4", isPending && "opacity-70", className)}>
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
                return (
                  <TableRow
                    key={row.id}
                    className={cn(href && "cursor-pointer")}
                    onClick={href ? () => router.push(href) : undefined}
                  >
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>{formatNumber(rowCount)} total</span>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            {TABLE_TEXT.rowsPerPage}
            <select
              className="h-8 rounded-md border bg-background px-2 text-foreground"
              value={params.pageSize}
              onChange={(event) => table.setPageSize(Number(event.target.value))}
            >
              {PAGINATION.pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <span>
            Page {formatNumber(params.page)} of {formatNumber(Math.max(pageCount, 1))}
          </span>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                >
                  {TABLE_TEXT.previous}
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  {TABLE_TEXT.next}
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}

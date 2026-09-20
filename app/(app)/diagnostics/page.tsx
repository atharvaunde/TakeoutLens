import { indexErrorColumns } from "@/columns/index-errors.column"
import { Crumb } from "@/components/layout/crumb"
import { TablePage } from "@/components/common/table-page"
import { DataTable } from "@/components/data-table/data-table"
import { TableControls } from "@/components/data-table/table-controls"
import { INDEX_ERROR_FILTERS } from "@/lib/constant"
import { parseTableParams } from "@/lib/helper"
import { listIndexErrors } from "@/server/services/index-errors"

export default async function DiagnosticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { rows, total } = await listIndexErrors(parseTableParams(await searchParams, INDEX_ERROR_FILTERS.map((f) => f.id)))
  return (
    <TablePage title="Diagnostics" sub="Files that could not be indexed, and why." controls={<TableControls searchPlaceholder="Search errors…" filters={INDEX_ERROR_FILTERS} />}>
      <Crumb value="diagnostics" />
      <DataTable columns={indexErrorColumns} data={rows} rowCount={total} rowIdKey="id" emptyTitle="No indexing errors" />
    </TablePage>
  )
}

import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/data-table/data-table"
import { indexErrorColumns } from "@/columns/index-errors.column"
import { INDEX_ERROR_FILTERS } from "@/lib/constant"
import { parseTableParams } from "@/lib/helper"
import { listIndexErrors } from "@/server/services/index-errors"

export default async function DiagnosticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = parseTableParams(await searchParams, INDEX_ERROR_FILTERS.map((filter) => filter.id))
  const { rows, total } = await listIndexErrors(params)

  return (
    <>
      <PageHeader title="Diagnostics" description="Files that could not be indexed, and why." />
      <DataTable
        columns={indexErrorColumns}
        data={rows}
        rowCount={total}
        searchable
        filters={INDEX_ERROR_FILTERS}
        emptyTitle="No indexing errors"
      />
    </>
  )
}

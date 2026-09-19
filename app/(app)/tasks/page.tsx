import { PageHeader } from "@/components/common/page-header"
import { DataTable } from "@/components/data-table/data-table"
import { taskColumns } from "@/columns/tasks.column"
import { TASK_FILTERS, TASK_LIST_FILTER_ID, type TableFilterDefinition } from "@/lib/constant"
import { parseTableParams } from "@/lib/helper"
import { getTaskListOptions, listTasks } from "@/server/services/tasks"

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const lists = await getTaskListOptions()
  const filters: TableFilterDefinition[] = [
    { id: TASK_LIST_FILTER_ID, label: "List", options: lists },
    { id: "status", label: "Status", options: TASK_FILTERS.status },
  ]
  const { rows, total } = await listTasks(parseTableParams(await searchParams, filters.map((f) => f.id)))
  return (
    <>
      <PageHeader title="Tasks" description="Your Google Tasks lists." />
      <DataTable columns={taskColumns} data={rows} rowCount={total} searchable searchPlaceholder="Search tasks…" filters={filters} emptyTitle="No tasks" />
    </>
  )
}

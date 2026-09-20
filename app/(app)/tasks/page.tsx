import { taskColumns } from "@/columns/tasks.column"
import { Crumb } from "@/components/layout/crumb"
import { TablePage } from "@/components/common/table-page"
import { DataTable } from "@/components/data-table/data-table"
import { TableControls } from "@/components/data-table/table-controls"
import { TASK_FILTERS, TASK_LIST_FILTER_ID, type TableFilterDefinition } from "@/lib/constant"
import { formatBytes, formatNumber, parseTableParams } from "@/lib/helper"
import { getModuleSummary } from "@/server/services/modules"
import { getTaskListOptions, getTaskCounts, listTasks } from "@/server/services/tasks"

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const lists = await getTaskListOptions()
  const filters: TableFilterDefinition[] = [
    { id: TASK_LIST_FILTER_ID, label: "List", options: lists },
    { id: "status", label: "Status", options: TASK_FILTERS.status },
  ]
  const [{ rows, total }, counts, summary] = await Promise.all([
    listTasks(parseTableParams(await searchParams, filters.map((f) => f.id))),
    getTaskCounts(),
    getModuleSummary("tasks"),
  ])
  return (
    <TablePage
      title="Tasks"
      sub={`${formatNumber(summary.fileCount)} file · ${formatBytes(summary.totalBytes)} · ${counts.open} open · ${counts.completed} completed`}
      controls={<TableControls searchPlaceholder="Search tasks…" filters={filters} />}
    >
      <Crumb value="Tasks" />
      <DataTable columns={taskColumns} data={rows} rowCount={total} rowIdKey="id" emptyTitle="No tasks" />
    </TablePage>
  )
}

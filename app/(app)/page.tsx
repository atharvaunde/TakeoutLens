import { ActionButton } from "@/components/common/action-button"
import { AutoRefresh } from "@/components/common/auto-refresh"
import { ModuleStatusCard } from "@/components/common/module-status-card"
import { PageHeader } from "@/components/common/page-header"
import { formatRelative, pluralize } from "@/lib/helper"
import { startIndexingAction } from "@/server/actions/indexer"
import { getOverview } from "@/server/services/modules"

export default async function HomePage() {
  const { modules, indexerRunning, lastRun } = await getOverview()
  const indexing = indexerRunning || modules.some((m) => m.state === "indexing")

  return (
    <>
      <AutoRefresh active={indexing} />
      <PageHeader
        title="Home"
        description={`Browse your Google Takeout export. Nothing leaves this machine.${lastRun ? ` Last indexed ${formatRelative(lastRun.finishedAt)} · ${pluralize(lastRun.totalFiles, "file")}.` : " Not indexed yet — click Index now."}`}
        actions={<ActionButton action={startIndexingAction} label={indexing ? "Indexing…" : "Index now"} disabled={indexing} />}
      />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
        {modules.map((status) => (
          <ModuleStatusCard key={status.module.id} status={status} />
        ))}
      </div>
    </>
  )
}

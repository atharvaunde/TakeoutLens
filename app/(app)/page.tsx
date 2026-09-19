import { ModuleStatusCard } from "@/components/common/module-status-card"
import { PageHeader } from "@/components/common/page-header"
import { MODULES } from "@/lib/constant"

export default function HomePage() {
  return (
    <>
      <PageHeader title="Home" description="Browse your Google Takeout export. Nothing leaves this machine." />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
        {MODULES.map((module) => (
          <ModuleStatusCard key={module.id} module={module} status="Not indexed" />
        ))}
      </div>
    </>
  )
}

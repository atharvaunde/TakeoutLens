import { connection } from "next/server"

import { AppShell } from "@/components/layout/app-shell"
import { getOverview } from "@/server/services/modules"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Everything under here reads the live index and session: never prerender it at build time.
  await connection()
  const { modules, indexerRunning, lastRun } = await getOverview()
  const sizes = Object.fromEntries(modules.map((m) => [m.module.id, m.totalBytes]))
  const present = modules.filter((m) => m.state !== "missing")
  const done = present.filter((m) => m.state === "ready").length
  const indexing = indexerRunning || present.some((m) => m.state === "indexing")

  return (
    <AppShell
      sizes={sizes}
      index={{
        indexing,
        percent: present.length ? Math.round((done / present.length) * 100) : 100,
        fileCount: modules.reduce((sum, m) => sum + m.fileCount, 0),
        lastFinishedAt: lastRun?.finishedAt ?? null,
      }}
    >
      {children}
    </AppShell>
  )
}

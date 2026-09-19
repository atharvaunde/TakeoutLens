"use server"

import { revalidatePath } from "next/cache"

import { INDEX_POLL_MS, INDEX_WAIT_MS } from "@/lib/constant"
import type { StartIndexingResult } from "@/lib/types"
import { requireSession } from "@/server/auth/session"
import { getConfig } from "@/server/config"
import { isIndexerRunning } from "@/server/indexer/lock"
import { startIndexer } from "@/server/indexer/spawn"
import { getLastRun } from "@/server/services/modules"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Starts the indexer; short runs are awaited so the UI can report what happened. */
export async function startIndexingAction(): Promise<StartIndexingResult> {
  await requireSession()
  if (startIndexer() === "already-running") return { status: "already-running" }
  const { dataDir } = getConfig()
  const deadline = Date.now() + INDEX_WAIT_MS
  await sleep(INDEX_POLL_MS * 2) // let the child take its lock
  while (isIndexerRunning(dataDir) && Date.now() < deadline) await sleep(INDEX_POLL_MS)
  revalidatePath("/")
  return isIndexerRunning(dataDir) ? { status: "running" } : { status: "finished", run: getLastRun() }
}

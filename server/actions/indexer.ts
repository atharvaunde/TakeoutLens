"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/server/auth/session"
import { startIndexer } from "@/server/indexer/spawn"

export async function startIndexingAction() {
  await requireSession()
  const result = startIndexer()
  revalidatePath("/")
  return result
}

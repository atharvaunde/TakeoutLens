"use server"

import type { GlobalSearchResult } from "@/lib/types"
import { searchEverything } from "@/server/services/search"

export async function searchEverythingAction(query: string): Promise<GlobalSearchResult[]> {
  return searchEverything(query)
}

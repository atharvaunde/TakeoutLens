import type { ModuleDefinition, ModuleState } from "@/lib/constant"

export interface AuthFormState {
  error: string | null
}

export interface ModuleStatus {
  module: ModuleDefinition
  state: ModuleState
  fileCount: number
  totalBytes: number
  detail: string | null
}

export interface IndexRunSummary {
  finishedAt: number
  durationMs: number
  totalFiles: number
  added: number
  updated: number
  removed: number
  errors: number
}

export type StartIndexingResult =
  | { status: "finished"; run: IndexRunSummary | null }
  | { status: "running" }
  | { status: "already-running" }

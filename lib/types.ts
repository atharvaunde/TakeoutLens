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

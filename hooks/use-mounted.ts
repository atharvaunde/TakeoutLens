import { useSyncExternalStore } from "react"

const subscribe = () => () => undefined

/** False during SSR and the first client render, true afterwards (no effect + setState needed). */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false)
}

import { AUTH } from "@/lib/constant"

const { freeAttempts, baseDelayMs, maxDelayMs, windowMs } = AUTH.rateLimit

interface Attempts {
  failures: number
  lastFailureAt: number
}

// Single local user: one shared counter is enough.
const state: Attempts = { failures: 0, lastFailureAt: 0 }

/** Milliseconds the caller must wait before another attempt (0 = allowed now). */
export function retryAfterMs(now = Date.now()): number {
  if (now - state.lastFailureAt > windowMs) state.failures = 0
  if (state.failures < freeAttempts) return 0
  const delay = Math.min(baseDelayMs * 2 ** (state.failures - freeAttempts), maxDelayMs)
  return Math.max(state.lastFailureAt + delay - now, 0)
}

export function recordFailure(now = Date.now()) {
  state.failures++
  state.lastFailureAt = now
}

export function resetFailures() {
  state.failures = 0
}

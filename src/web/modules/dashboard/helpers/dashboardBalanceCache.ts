import { syncStorage } from '@common/services/storage'

// Persists the last-known total balance per account so the shell can show it
// (pulsing) on the next open instead of a bare skeleton. Uses the synchronous
// localStorage wrapper so the shell can read the value on its first render (no flash).
// The gas-tank balance is intentionally NOT cached (always shown as a skeleton).

const KEY_PREFIX = 'dashboardBalanceCache'
const TTL_MS = 60 * 60 * 1000 // 1 hour
// Past this age the cached balance is shown with a spinner (like the overview's
// reloading state) to signal it may be outdated and is being refreshed.
const STALE_AFTER_MS = 5 * 60 * 1000

export interface DashboardBalanceCache {
  addr: string
  totalBalance: number
  // When the last stored balance had balance-affecting errors/warnings, the shell
  // shows a skeleton instead of the (possibly inaccurate) cached value.
  hasBalanceAffectingErrors: boolean
  cachedAt: number
}

const getKey = (addr: string) => `${KEY_PREFIX}:${addr.toLowerCase()}`

export const setCachedDashboardBalance = (cache: DashboardBalanceCache) => {
  try {
    syncStorage.set(getKey(cache.addr), JSON.stringify(cache))
  } catch (error) {
    console.error('Failed to cache dashboard balance', error)
  }
}

// Returns the cached balances only when they belong to `addr` and are within the TTL,
// so switching account from another screen can never surface a stale/other balance.
export const getCachedDashboardBalance = (
  addr?: string,
  now: number = Date.now()
): DashboardBalanceCache | null => {
  if (!addr) return null

  try {
    const raw = syncStorage.get(getKey(addr))
    if (!raw) return null

    const parsed = JSON.parse(raw) as DashboardBalanceCache
    const isForRequestedAddress = parsed?.addr?.toLowerCase() === addr.toLowerCase()
    const isFresh = typeof parsed?.cachedAt === 'number' && now - parsed.cachedAt < TTL_MS

    if (!isForRequestedAddress || !isFresh) return null

    return parsed
  } catch (error) {
    console.error('Failed to read cached dashboard balance', error)
    return null
  }
}

// Older than 5 minutes: the value is likely outdated, so the shell shows it with a
// refresh spinner. Kept here so the impure `Date.now()` read stays out of render.
export const isCachedDashboardBalanceStale = (
  cache: DashboardBalanceCache,
  now: number = Date.now()
): boolean => now - cache.cachedAt > STALE_AFTER_MS

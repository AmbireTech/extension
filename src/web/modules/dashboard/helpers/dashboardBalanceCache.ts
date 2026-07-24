import { syncStorage } from '@common/services/storage'

// Persists the last-known total balance per account so the shell can show it
// (pulsing) on the next open instead of a bare skeleton.

const STORAGE_KEY = 'dashboardBalanceCache'
const TTL_MS = 60 * 60 * 1000 // 1 hour
// Past this age the cached balance is shown with a spinner (like the overview's
// reloading state) to signal it may be outdated and is being refreshed.
const STALE_AFTER_MS = 5 * 60 * 1000

export interface DashboardBalanceCache {
  addr: string
  totalBalance: number
  /**
   * When the last stored balance had balance-affecting errors/warnings, the shell
   * shows a skeleton instead of the (possibly inaccurate) cached value.
   */
  hasBalanceAffectingErrors: boolean
  cachedAt: number
}

type DashboardBalanceCacheStore = { [addr: string]: DashboardBalanceCache }

const getStore = (): DashboardBalanceCacheStore => {
  try {
    const raw = syncStorage.get(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    console.error('Failed to read cached dashboard balances', error)
    return {}
  }
}

export const setCachedDashboardBalance = (cache: DashboardBalanceCache) => {
  try {
    const store = getStore()
    store[cache.addr.toLowerCase()] = cache
    syncStorage.set(STORAGE_KEY, JSON.stringify(store))
  } catch (error) {
    console.error('Failed to cache dashboard balance', error)
  }
}

/**
 * Returns the cached balances only when they belong to `addr` and are within the TTL,
 * so switching account from another screen can never surface a stale/other balance.
 */
export const getCachedDashboardBalance = (
  addr?: string,
  now: number = Date.now()
): DashboardBalanceCache | null => {
  if (!addr) return null

  const store = getStore()
  const cached = store[addr.toLowerCase()]
  if (!cached) return null

  const isForRequestedAddress = cached?.addr?.toLowerCase() === addr.toLowerCase()
  const isFresh = typeof cached?.cachedAt === 'number' && now - cached.cachedAt < TTL_MS

  if (!isForRequestedAddress || !isFresh) return null

  return cached
}

export const isCachedDashboardBalanceStale = (
  cache: DashboardBalanceCache,
  now: number = Date.now()
): boolean => now - cache.cachedAt > STALE_AFTER_MS

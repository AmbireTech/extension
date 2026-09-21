import { syncStorage } from '@common/services/storage'

// Persists the last-known total balance per account so the shell can show it
// (pulsing) on the next open instead of a bare skeleton.

const STORAGE_KEY = 'dashboardBalanceCache'
const TTL_MS = 60 * 60 * 1000 // 1 hour
// Past this age the cached balance is shown with a spinner (like the overview's
// reloading state) to signal it may be outdated and is being refreshed.
const STALE_AFTER_MS = 5 * 60 * 1000
/**
 * How often to rewrite an unchanged balance. An account with a genuinely static balance
 * (an empty one, or tokens with no price feed) would otherwise never be written again and
 * its `cachedAt` would freeze, so the shell would call it stale (and eventually drop it)
 * even though the portfolio keeps re-verifying it.
 */
export const CACHE_REFRESH_INTERVAL_MS = 60 * 1000

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

/**
 * Stores the balance of an account and stamps it with the current time. Skips the write
 * when the same values are already stored and were written less than
 * CACHE_REFRESH_INTERVAL_MS ago. The decision is made against the stored entry and not
 * against in-memory state, because the popup is torn down and rebuilt on every open.
 */
export const setCachedDashboardBalance = (
  { addr, totalBalance, hasBalanceAffectingErrors }: Omit<DashboardBalanceCache, 'cachedAt'>,
  now: number = Date.now()
) => {
  try {
    const store = getStore()
    const key = addr.toLowerCase()
    const cached = store[key]
    const isUnchanged =
      !!cached &&
      cached.totalBalance === totalBalance &&
      cached.hasBalanceAffectingErrors === hasBalanceAffectingErrors

    if (isUnchanged && now - cached.cachedAt < CACHE_REFRESH_INTERVAL_MS) return

    store[key] = { addr, totalBalance, hasBalanceAffectingErrors, cachedAt: now }
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

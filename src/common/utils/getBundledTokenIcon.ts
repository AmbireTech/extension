import tokenIconKeys from '@ambire/token-and-network-icons/index/tokenIconKeys.json'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { isWeb } from '@common/config/env'
import { getBundledIconUri } from '@common/utils/getBundledIconUri'

const BUNDLED_TOKEN_ICON_KEYS: ReadonlySet<string> = new Set(tokenIconKeys)

// The icons are loaded by path, not bundled into the JS (see `getBundledIconUri`), so OTA updates
// don't ship them, but they do ship the list of keys. So on mobile the list can name icons the app
// build doesn't have: none at all on builds made before the icons were added, or a token added in a
// newer version of the icons package. Only the icons that fail are turned off, for the session
let failedBundledTokenIconKeys: ReadonlySet<string> = new Set()
let hasReportedLoadFailure = false

/**
 * Returns the token icon shipped with the app (from `@ambire/token-and-network-icons`), or `null`
 * when the token isn't bundled or its icon failed to load. Bundled icons need no network request.
 */
export const getBundledTokenIcon = (
  chainId: bigint | undefined,
  address: string | undefined
): { uri: string } | null => {
  if (chainId === undefined || !address) return null

  const lowercaseAddress = address.toLowerCase()
  const key = `${chainId}:${lowercaseAddress}`
  if (!BUNDLED_TOKEN_ICON_KEYS.has(key) || failedBundledTokenIconKeys.has(key)) return null

  return { uri: getBundledIconUri(`tokenIcons/${chainId}/${lowercaseAddress}.webp`) }
}

/**
 * Call when a bundled token icon fails to load. The caller falls back to a remote icon for that
 * token, and later `getBundledTokenIcon` calls skip it.
 */
export const handleBundledTokenIconLoadFailure = (chainId: bigint, address: string) => {
  const key = `${chainId}:${address.toLowerCase()}`
  failedBundledTokenIconKeys = new Set(failedBundledTokenIconKeys).add(key)

  if (hasReportedLoadFailure) return

  hasReportedLoadFailure = true
  // Every web build ships the icons, so a failure there is either a broken build or a dropped
  // request (the Benzin website loads them over the network). Only the first one is reported
  if (isWeb) {
    captureException(new Error('A bundled token icon failed to load'), { extra: { key } })
    return
  }

  // Expected on app builds made before the icons were bundled or updated (see above), so it isn't
  // reported to Sentry
  console.warn('Some bundled token icons are missing from this app build, loading them remotely')
}

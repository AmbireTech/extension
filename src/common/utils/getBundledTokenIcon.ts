import { captureException } from '@common/config/analytics/CrashAnalytics'
import { isWeb } from '@common/config/env'
import { getBundledIconUri } from '@common/utils/getBundledIconUri'

import { BUNDLED_TOKEN_ICON_KEYS } from '../../token-and-network-icons/index/bundledTokenIconKeys'

// The icons are loaded by path, not bundled into the JS (see `getBundledIconUri`), so OTA updates
// don't ship them. An OTA can still run on an app build made before the icons were added, so on
// mobile the first failed load turns them off for the session.
let areBundledTokenIconsMissingFromApp = false
let hasReportedWebLoadFailure = false

/**
 * Returns the token icon shipped with the app (from the token-and-network-icons submodule),
 * or `null` when the token isn't bundled. Bundled icons need no network request.
 */
export const getBundledTokenIcon = (
  chainId: bigint | undefined,
  address: string | undefined
): { uri: string } | null => {
  if (areBundledTokenIconsMissingFromApp || chainId === undefined || !address) return null

  const lowercaseAddress = address.toLowerCase()
  if (!BUNDLED_TOKEN_ICON_KEYS.has(`${chainId}:${lowercaseAddress}`)) return null

  return { uri: getBundledIconUri(`tokenIcons/${chainId}/${lowercaseAddress}.png`) }
}

/**
 * Call when a bundled token icon fails to load. The caller falls back to a remote icon for that
 * token; on mobile the other bundled icons are turned off too (see above).
 */
export const handleBundledTokenIconLoadFailure = (failedUri: string) => {
  // Every web build ships the icons, so a failure there is either a broken build or a dropped
  // request (the Benzin website loads them over the network). Neither means the other icons are
  // missing, so they stay on, and only the first failure is reported
  if (isWeb) {
    if (hasReportedWebLoadFailure) return

    hasReportedWebLoadFailure = true
    captureException(new Error('A bundled token icon failed to load'), {
      extra: { uri: failedUri }
    })
    return
  }

  if (areBundledTokenIconsMissingFromApp) return

  areBundledTokenIconsMissingFromApp = true
  // Expected on app builds made before the icons were bundled, so it isn't reported to Sentry
  console.warn('Bundled token icons are missing from this app build, falling back to remote icons')
}

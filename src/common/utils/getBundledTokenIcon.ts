import type { ImageSourcePropType } from 'react-native'

import { isAndroid } from '@common/config/env'
import { BUNDLED_TOKEN_ICON_KEYS } from '../../token-and-network-icons/index/bundledTokenIconKeys'

// The icons are part of the native app (an Xcode folder reference on iOS, a Gradle assets dir on
// Android), not the JS bundle, so OTA updates don't ship them. An OTA can still run on an app
// build made before the icons were added, so the first failed load turns them off for the session.
let areBundledTokenIconsMissingFromApp = false

/**
 * Returns the token icon shipped with the app (from the token-and-network-icons submodule),
 * or `null` when the token isn't bundled. Bundled icons need no network request.
 */
export const getBundledTokenIcon = (
  chainId: bigint | undefined,
  address: string | undefined
): ImageSourcePropType | null => {
  if (areBundledTokenIconsMissingFromApp || chainId === undefined || !address) return null

  const lowercaseAddress = address.toLowerCase()
  if (!BUNDLED_TOKEN_ICON_KEYS.has(`${chainId}:${lowercaseAddress}`)) return null

  // iOS resolves a relative path against the app bundle, Android reads `asset:/` from the APK assets
  const pathInApp = `tokenIcons/${chainId}/${lowercaseAddress}.png`

  return { uri: isAndroid ? `asset:/${pathInApp}` : pathInApp }
}

/** Call when a bundled token icon fails to load, so the caller can fall back to a remote icon. */
export const handleBundledTokenIconLoadFailure = () => {
  if (areBundledTokenIconsMissingFromApp) return

  areBundledTokenIconsMissingFromApp = true
  // Expected on app builds made before the icons were bundled, so it isn't reported to Sentry
  console.warn('Bundled token icons are missing from this app build, falling back to remote icons')
}

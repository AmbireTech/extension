import type { ImageSourcePropType } from 'react-native'

import { captureException } from '@common/config/analytics/CrashAnalytics'
import { BUNDLED_TOKEN_ICON_SOURCES } from '../../token-and-network-icons/index/bundledTokenIconSources.web'

/**
 * Returns the token icon shipped with the app (from the token-and-network-icons submodule),
 * or `null` when the token isn't bundled. Bundled icons need no network request.
 */
export const getBundledTokenIcon = (
  chainId: bigint | undefined,
  address: string | undefined
): ImageSourcePropType | null => {
  if (chainId === undefined || !address) return null

  return BUNDLED_TOKEN_ICON_SOURCES[`${chainId}:${address.toLowerCase()}`] ?? null
}

/** Call when a bundled token icon fails to load, so the caller can fall back to a remote icon. */
export const handleBundledTokenIconLoadFailure = () => {
  // The icons are emitted with every web build, so failing to load one means the build is broken
  captureException(new Error('A bundled token icon failed to load'))
}

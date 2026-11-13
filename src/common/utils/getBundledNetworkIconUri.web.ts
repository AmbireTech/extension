import { BUNDLED_NETWORK_ICON_URIS } from '../../token-and-network-icons/index/bundledNetworkIconUris.web'

/**
 * Returns the URI of the network icon shipped with the app (from the token-and-network-icons
 * submodule), or `null` when the network isn't bundled.
 */
export const getBundledNetworkIconUri = (chainId: string | undefined): string | null => {
  if (!chainId) return null

  return BUNDLED_NETWORK_ICON_URIS[chainId] ?? null
}

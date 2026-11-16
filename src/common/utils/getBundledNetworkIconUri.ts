import networkIconChainIds from '@ambire/token-and-network-icons/index/networkIconChainIds.json'
import { getBundledIconUri } from '@common/utils/getBundledIconUri'

const BUNDLED_NETWORK_ICON_CHAIN_IDS: ReadonlySet<string> = new Set(networkIconChainIds)

/**
 * Returns the URI of the network icon shipped with the app (from
 * `@ambire/token-and-network-icons`), or `null` when the network isn't bundled.
 *
 * The icons are loaded by path, not bundled into the JS (see `getBundledIconUri`), so OTA updates
 * don't ship them. An OTA can still run on an app build made before they were added, so callers
 * need a non-remote fallback for when this one fails.
 */
export const getBundledNetworkIconUri = (chainId: string | undefined): string | null => {
  if (!chainId || !BUNDLED_NETWORK_ICON_CHAIN_IDS.has(chainId)) return null

  return getBundledIconUri(`networkIcons/${chainId}.webp`)
}

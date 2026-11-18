import { parseUri } from '@walletconnect/utils'

export const getWcTabIdFromTopic = (topic: string) =>
  1_000_000 + (parseInt(topic.slice(0, 8), 16) % 900_000)

const AMBIRE_WC_LINK_PREFIXES = ['ambire://', 'https://ambire.com/']

const getWcUriFromLink = (url: string): string | null => {
  if (url.startsWith('wc:')) return url
  if (!AMBIRE_WC_LINK_PREFIXES.some((prefix) => url.startsWith(prefix))) return null

  const [, encodedUri] = url.split('wc?uri=')
  if (!encodedUri) return null

  try {
    return decodeURIComponent(encodedUri)
  } catch (e) {
    console.error('[WalletConnect] Failed to decode the pairing URI of a link:', e)
    return null
  }
}

/**
 * The WalletConnect pairing URI a link carries: a raw `wc:` URI, or one wrapped in an Ambire
 * link (`ambire://wc?uri=…`, `https://ambire.com/wc?uri=…`). Null for any other link, including
 * the `wc:<topic>@2/wc?requestId=…` redirect a dapp opens for each request after an Android
 * "Open with" pairing - it has no pairing key, so pairing it fails.
 */
export const getWcPairingUriFromLink = (url: string): string | null => {
  const uri = getWcUriFromLink(url)
  if (!uri) return null

  return parseUri(uri).symKey ? uri : null
}

/**
 * Whether a link is the redirect a dapp opens to bring the wallet forward for a request on an
 * existing session (`wc:<topic>@2/wc?requestId=…`, `ambire://wc?requestId=…`): a WalletConnect
 * link without a pairing key. The request itself arrives through the relay.
 */
export const isWcRequestRedirectLink = (url: string): boolean => {
  const isWcLink = url.startsWith('wc:') || url === 'ambire://wc' || url.startsWith('ambire://wc?')
  if (!isWcLink) return false

  return !getWcPairingUriFromLink(url)
}

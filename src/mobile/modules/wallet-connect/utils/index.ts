export const getWcTabIdFromTopic = (topic: string) =>
  1_000_000 + (parseInt(topic.slice(0, 8), 16) % 900_000)

const AMBIRE_WC_LINK_PREFIXES = ['ambire://', 'https://ambire.com/']

/**
 * The WalletConnect pairing URI a link carries: a raw `wc:` URI, or one wrapped in an Ambire
 * link (`ambire://wc?uri=…`, `https://ambire.com/wc?uri=…`). Null for any other link.
 */
export const getWcPairingUriFromLink = (url: string): string | null => {
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

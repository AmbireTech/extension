/**
 * Messages between the background and the Tornado Cash offscreen document, which hosts the SDK
 * (it always runs in Web Workers, which a service worker cannot start).
 *
 * The document asks the background for RPC calls and note keys. Keys are derived in the background,
 * where `KeystoreController.derivePrivacyKey` checks every path, and are enough to spend notes, so
 * they go only over a dedicated port checked by `isFromTornadoCashDocument` - never
 * `runtime.sendMessage`, which every extension page receives.
 */
import type { TornadoCashPlugin } from '@ambire-common/interfaces/tornadoCash'

/** Name of the port the offscreen document opens to the background. */
export const TORNADO_CASH_PORT_NAME = 'tornado-cash'

/** The offscreen document's page, relative to the extension root. */
export const TORNADO_CASH_DOCUMENT_PATH = 'tornado-cash.html'

/** The plugin methods the background calls. */
export type TornadoCashPluginMethod = Exclude<keyof TornadoCashPlugin, 'dispose'>

const PLUGIN_METHODS: readonly TornadoCashPluginMethod[] = [
  'sync',
  'notes',
  'prepareShield',
  'prepareUnshield'
]

export const isTornadoCashPluginMethod = (value: unknown): value is TornadoCashPluginMethod =>
  PLUGIN_METHODS.includes(value as TornadoCashPluginMethod)

/** The provider methods the SDK may ask the background for. */
const PROVIDER_METHODS = [
  'getChainId',
  'getLogs',
  'getBlockNumber',
  'getBalance',
  'getCode',
  'getTransactionReceipt',
  'waitForTransaction',
  'request',
  'call',
  'estimateGas',
  'getGasPrice',
  'getTransactionCount'
] as const

export type TornadoCashProviderMethod = (typeof PROVIDER_METHODS)[number]

export const TORNADO_CASH_PROVIDER_METHODS: readonly TornadoCashProviderMethod[] = PROVIDER_METHODS

export const isTornadoCashProviderMethod = (value: unknown): value is TornadoCashProviderMethod =>
  PROVIDER_METHODS.includes(value as TornadoCashProviderMethod)

/** Background → offscreen document. */
export type ToTornadoCashDocument =
  | { type: 'call'; id: number; method: TornadoCashPluginMethod; args: unknown }
  | { type: 'host-result'; id: number; result: unknown }
  /** No details: the document only needs to know the call failed. */
  | { type: 'host-failed'; id: number }

/** Offscreen document → background. */
export type FromTornadoCashDocument =
  /** The plugin is created. A worker that fails to start makes the first call fail. */
  | { type: 'ready' }
  | { type: 'provider'; id: number; method: TornadoCashProviderMethod; args: unknown }
  | { type: 'derive-key'; id: number; path: string }
  | { type: 'result'; id: number; result: unknown }
  /**
   * The SDK's message, or none for a withdrawal: an error from proving can reveal the note's
   * secrets, so its details stay in the document's console.
   */
  | { type: 'failed'; id: number; message?: string }

const BIGINT_TAG = '$bigint'

/**
 * Encodes a value for extension messaging, which is JSON: bigints become `{ $bigint: '...' }`.
 * Throws on what JSON would silently change (functions, class instances other than plain objects).
 */
export const encodeTornadoCashValue = (value: unknown): unknown => {
  if (typeof value === 'bigint') return { [BIGINT_TAG]: value.toString() }
  if (value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value))
    return value
  if (Array.isArray(value)) return value.map(encodeTornadoCashValue)
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype)
    return Object.fromEntries(
      Object.entries(value as object).map(([key, item]) => [key, encodeTornadoCashValue(item)])
    )

  throw new Error('tornadoCash: a value cannot be sent between the background and the document')
}

/** The inverse of `encodeTornadoCashValue`. */
export const decodeTornadoCashValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(decodeTornadoCashValue)
  if (!value || typeof value !== 'object') return value

  const entries = Object.entries(value)
  const [firstEntry] = entries
  if (entries.length === 1 && firstEntry && firstEntry[0] === BIGINT_TAG) {
    if (typeof firstEntry[1] !== 'string')
      throw new Error('tornadoCash: a number arrived in an unexpected form')

    return BigInt(firstEntry[1])
  }

  return Object.fromEntries(entries.map(([key, item]) => [key, decodeTornadoCashValue(item)]))
}

/**
 * Whether a port was opened by this extension's Tornado Cash document.
 *
 * `onConnect` also fires for this extension's content scripts (inside websites), so the extension
 * id is not enough: the exact URL is checked and a sender with a tab (as content scripts always
 * have) is refused. Other extensions only reach `onConnectExternal`, which is not listened to.
 */
export const isFromTornadoCashDocument = (port: chrome.runtime.Port): boolean =>
  port.name === TORNADO_CASH_PORT_NAME &&
  port.sender?.id === chrome.runtime.id &&
  !port.sender.tab &&
  port.sender.url === chrome.runtime.getURL(TORNADO_CASH_DOCUMENT_PATH)

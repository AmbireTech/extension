import { parse } from '@ambire-common/libs/richJson/richJson'
import { detachState } from '@common/utils/reconcileState'

// Chrome 148+ can serialize `chrome.runtime` port messages with the structured
// clone algorithm instead of JSON when the manifest opts in via
// `"message_serialization": "structured_clone"`.
// See: https://developer.chrome.com/blog/structured-clone-messaging
export const STRUCTURED_CLONE_PROBE_KEY = '__ambireStructuredCloneProbe__'
const STRUCTURED_CLONE_MANIFEST_VALUE = 'structured_clone'

/** What a structured clone probe found out about a port. */
export type StructuredCloneSupport = 'supported' | 'unsupported' | 'portFailed'

export function isStructuredCloneEnabled(manifest: Record<string, unknown>): boolean {
  return manifest.message_serialization === STRUCTURED_CLONE_MANIFEST_VALUE
}

/**
 * Finds out whether the port serializes with structured clone, by posting an inert
 * probe holding a `BigInt`, which only structured clone can carry.
 *
 * A failed `BigInt` probe is followed by a plain one, because a port that is already
 * disconnected throws on both. That answer is `portFailed`, which says nothing about
 * the browser and must not be cached as `unsupported`.
 */
export function detectStructuredCloneSupport(post: (message: any) => void): StructuredCloneSupport {
  let bigIntProbeError: unknown
  try {
    post({ [STRUCTURED_CLONE_PROBE_KEY]: BigInt(1) })
    console.log('Structured clone support detected')
    return 'supported'
  } catch (error) {
    bigIntProbeError = error
  }

  try {
    post({ [STRUCTURED_CLONE_PROBE_KEY]: 1 })
  } catch (portError) {
    console.warn('Could not probe structured clone support, the port failed to send', portError)
    return 'portFailed'
  }

  console.log('Structured clone support not detected', bigIntProbeError)
  return 'unsupported'
}

/**
 * Detaches a message part with the value rules richJson has always applied, so the
 * structured clone path delivers what the JSON path would. Errors arrive as plain
 * objects that keep their `message`, `stack` and every custom prop.
 */
export function prepareMessagePart(value: any): any {
  return detachState(value, { normalizeNonFiniteNumbers: true, flattenErrors: true })
}

// Either already deserialized (structured clone path) or a richJson string (JSON path).
export function deserializeMessagePart(part: any): any {
  return typeof part === 'string' ? parse(part) : part
}

import { parse } from '@ambire-common/libs/richJson/richJson'
import { logInfoWithPrefix, logWarnWithPrefix } from '@common/utils/logger'

// Chrome 148+ can serialize `chrome.runtime` port messages with the structured
// clone algorithm instead of JSON when the manifest opts in via
// `"message_serialization": "structured_clone"`.
// See: https://developer.chrome.com/blog/structured-clone-messaging
export const STRUCTURED_CLONE_PROBE_KEY = '__ambireStructuredCloneProbe__'
const STRUCTURED_CLONE_MANIFEST_VALUE = 'structured_clone'
const LOG_PREFIX = 'portMessenger'

/** What a structured clone probe found out about a port. */
export type StructuredCloneSupport = 'supported' | 'unsupported' | 'portFailed'

/** Whether the manifest opts `chrome.runtime` messaging into structured clone. */
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
    logInfoWithPrefix(LOG_PREFIX, 'structured clone support detected')
    return 'supported'
  } catch (error) {
    bigIntProbeError = error
  }

  try {
    post({ [STRUCTURED_CLONE_PROBE_KEY]: 1 })
  } catch (portError) {
    logWarnWithPrefix(
      LOG_PREFIX,
      'could not probe structured clone support, the port failed to send',
      portError
    )
    return 'portFailed'
  }

  logInfoWithPrefix(LOG_PREFIX, 'structured clone support not detected', bigIntProbeError)
  return 'unsupported'
}

/** Gives back a message part as sent, parsing it only when it is a richJson string from the JSON path. */
export function deserializeMessagePart(part: any): any {
  return typeof part === 'string' ? parse(part) : part
}

import { parse } from '@ambire-common/libs/richJson/richJson'

// Chrome 148+ can serialize `chrome.runtime` port messages with the structured
// clone algorithm instead of JSON when the manifest opts in via
// `"message_serialization": "structured_clone"`.
// See: https://developer.chrome.com/blog/structured-clone-messaging
export const STRUCTURED_CLONE_PROBE_KEY = '__ambireStructuredCloneProbe__'

export function detectStructuredCloneSupport(post: (message: any) => void): boolean {
  try {
    post({ [STRUCTURED_CLONE_PROBE_KEY]: BigInt(1) })
    console.log('Structured clone support detected')
    return true
  } catch {
    console.log('Structured clone support not detected')
    return false
  }
}

// Either already deserialized (structured clone path) or a richJson string (JSON path).
export function deserializeMessagePart(part: any): any {
  return typeof part === 'string' ? parse(part) : part
}

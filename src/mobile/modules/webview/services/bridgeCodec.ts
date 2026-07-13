import * as richJson from '@ambire-common/libs/richJson/richJson'

// Wire codec for the RN <-> WebViewWorker bridge.
//
// Every message string is prefixed with a 1-char tag so the receiver knows how
// to parse it without inspecting the payload:
//   'R' -> richJson (carries BigInt/Error: controller state, persisted storage)
//   'J' -> plain JSON (dapp JSON-RPC traffic and network.fetch — never rich)
//
// richJson's per-node replacer/reviver is the expensive part; the dapp browser
// fires JSON-safe provider requests/responses constantly, so tagging them 'J'
// lets them skip richJson entirely.
const RICH_TAG = 'R'
const JSON_TAG = 'J'

export const encode = (obj: any, rich: boolean): string =>
  rich ? RICH_TAG + richJson.stringify(obj) : JSON_TAG + JSON.stringify(obj)

export const decode = (str: string): any => {
  const tag = str[0]
  if (tag === RICH_TAG) return richJson.parse(str.slice(1))
  if (tag === JSON_TAG) return JSON.parse(str.slice(1))
  // Untagged messages come from string-embedded error handlers (globalErrorHandler,
  // system.loaded) that postMessage raw JSON.stringify output. They are always plain
  // JSON envelopes, so parse the whole string as-is.
  return JSON.parse(str)
}

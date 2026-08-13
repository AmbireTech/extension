/* eslint-disable @typescript-eslint/no-require-imports */
// Metro replaces the `base64-js` package with this module (see metro.config.js).
// React Native base64s every request body on its way across the bridge
// (`binaryToBase64` under `convertRequestBody`) and base64-decodes every response
// it reads as a blob (`FileReader.readAsDataURL`), both through base64-js' pure-JS
// codec. Profiling a portfolio reload put that at ~660ms — ~347ms encoding request
// bodies and 317ms decoding responses — because ethers' fetch reads the body with
// `resp.arrayBuffer()` and a BalanceGetter response for a few hundred tokens runs
// to tens of KB.
//
// react-native-quick-base64 is a drop-in for the three functions base64-js
// exports, backed by a JSI codec, but it is not identical for every input. Each
// function below narrows to the inputs where the two provably agree and hands the
// rest to base64-js, so the native path can only be faster, never different.
//
// One input class is knowingly left unguarded: a URL-safe string (`-` and `_`
// instead of `+` and `/`) whose length is a whole number of groups. base64-js
// decodes it, and whether the native codec does is untested here. React Native's
// only decoder is `FileReader`, which is handed standard base64 out of a data URL
// it built itself, so this is unreachable through the callers being shimmed.
// Guarding it would cost a scan of the whole string, which is the work this
// module exists to avoid.

import { nativeBase64 } from '@mobile/services/nativeBase64/nativeBase64'

// The real implementation, reached through a specifier that no redirect applies
// to, which is what stops this shim from resolving to itself.
const base64Js = require('@base64-js-original') as {
  byteLength: (b64: string) => number
  toByteArray: (b64: string) => Uint8Array
  fromByteArray: (bytes: Uint8Array) => string
}

/** Base64 encodes three bytes per four characters, with no partial groups. */
const BASE64_GROUP_LENGTH = 4

/**
 * Byte length of the data a base64 string encodes. Throws for a string whose
 * length is not a whole number of groups.
 *
 * Left on base64-js: both implementations are the same handful of JS
 * arithmetic with nothing per character to speed up.
 */
export const byteLength = base64Js.byteLength

/**
 * Bytes of a base64 string, matching base64-js' `toByteArray`. Throws base64-js'
 * own error for a string whose length is not a whole number of groups.
 */
export function toByteArray(b64: string): Uint8Array {
  // base64-js rejects a partial group and the native codec accepts it, so those
  // stay on base64-js to keep the throw.
  if (!nativeBase64 || b64.length % BASE64_GROUP_LENGTH !== 0) return base64Js.toByteArray(b64)

  return nativeBase64.toByteArray(b64)
}

/**
 * Base64 of the given bytes, matching base64-js' `fromByteArray`.
 */
export function fromByteArray(bytes: Uint8Array): string {
  // The native path encodes the view's underlying `buffer`. base64-js also
  // accepts a plain array, which has none, and the native path would quietly
  // encode nothing rather than fail, so anything that is not a real view stays
  // on base64-js.
  if (!nativeBase64 || !ArrayBuffer.isView(bytes)) return base64Js.fromByteArray(bytes)

  return nativeBase64.fromByteArray(bytes)
}

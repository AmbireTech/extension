import {
  parse as richParse,
  stringify as richStringify
} from '@ambire-common/libs/richJson/richJson'
import { nativeCrypto } from '@mobile/services/nativeCrypto/nativeCrypto'

// POC safety net. While true, every native call is compared against viem and
// viem's result is used on any mismatch, so a decoder bug cannot corrupt
// balances — only cost a parallel viem call. Flip to false to measure the real
// speed-up once the device logs show no mismatches.
const VERIFY_AGAINST_VIEM = false

// The ABI object is stable between calls, so its JSON string is cached by
// reference instead of re-serialized on every call.
const abiJsonCache = new WeakMap<object, string>()

function abiToJson(abi: any): string {
  if (typeof abi !== 'object' || abi === null) return JSON.stringify(abi)

  const cached = abiJsonCache.get(abi)
  if (cached) return cached

  const json = JSON.stringify(abi)
  abiJsonCache.set(abi, json)

  return json
}

/**
 * True for the errors that mean "only viem can serve this call" rather than
 * "something went wrong". Overloaded functions need the call's arguments to
 * disambiguate and types outside the supported set have no native path, so both
 * are ordinary handovers and must not be reported.
 */
function isExpectedHandover(error: unknown): boolean {
  if (!nativeCrypto) return false

  const { tag } = (error ?? {}) as { tag?: string }

  return (
    tag === nativeCrypto.AbiError_Tags.AmbiguousOverload ||
    tag === nativeCrypto.AbiError_Tags.UnsupportedType
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Structural equality that understands bigint, arrays and plain objects. */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, index) => deepEqual(item, b[index]))
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    return aKeys.every((key) => deepEqual(a[key], b[key]))
  }

  return false
}

type ViemDecodeFunctionResult = (params: any) => any
type ViemEncodeFunctionData = (params: any) => any

/**
 * Builds a drop-in replacement for viem's `decodeFunctionResult` that decodes in
 * Rust and reconstructs the viem-shaped value via richJson. Hands the call to
 * the real viem decode passed in whenever the native path cannot serve it, and
 * returns that function untouched when the turbo-module is unavailable.
 */
export function makeNativeDecodeFunctionResult(
  realViemDecodeFunctionResult: ViemDecodeFunctionResult
): ViemDecodeFunctionResult {
  if (!nativeCrypto) return realViemDecodeFunctionResult
  // Captured so the closure below keeps the non-null narrowing, which an
  // imported binding does not carry on its own.
  const native = nativeCrypto

  return function decodeFunctionResult(params: any): any {
    const { abi, functionName, data } = params ?? {}

    // Decoding without an explicit function name means viem has to resolve the
    // item from the ABI itself, so leave those calls to it.
    if (!functionName || typeof data !== 'string') return realViemDecodeFunctionResult(params)

    let nativeResult: any
    try {
      const decoded = richParse(native.decodeFunctionResult(abiToJson(abi), functionName, data))

      // A function with no outputs decodes to JSON null, and viem returns
      // undefined for that. No ABI type decodes to null, so this cannot swallow
      // a real value.
      nativeResult = decoded === null ? undefined : decoded
    } catch (nativeError) {
      // Letting viem throw here is correct: if it also rejects the data, the
      // caller should see viem's error, and this is not a parity gap.
      const viemResult = realViemDecodeFunctionResult(params)

      // Native refused data that viem decoded, so the two disagree on what is
      // decodable and that is worth knowing about.
      if (!isExpectedHandover(nativeError)) console.error(nativeError)

      return viemResult
    }

    if (VERIFY_AGAINST_VIEM) {
      const viemResult = realViemDecodeFunctionResult(params)
      if (!deepEqual(nativeResult, viemResult)) {
        console.error(new Error(`native decode mismatch for ${functionName}; used the viem result`))

        return viemResult
      }
    }

    return nativeResult
  }
}

/**
 * Builds a drop-in replacement for viem's `encodeFunctionData` that encodes the
 * call in Rust and returns the `0x` calldata. Args cross the boundary as a
 * richJson string so bigints survive. Hands the call to the real viem encode
 * passed in whenever the native path cannot serve it, and returns that function
 * untouched when the turbo-module is unavailable.
 */
export function makeNativeEncodeFunctionData(
  realViemEncodeFunctionData: ViemEncodeFunctionData
): ViemEncodeFunctionData {
  if (!nativeCrypto) return realViemEncodeFunctionData
  // Captured so the closure below keeps the non-null narrowing, which an
  // imported binding does not carry on its own.
  const native = nativeCrypto

  return function encodeFunctionData(params: any): any {
    const { abi, functionName, args } = params ?? {}

    // Encoding without an explicit function name means viem has to resolve the
    // item from the ABI itself, so leave those calls to it.
    if (!functionName) return realViemEncodeFunctionData(params)

    let nativeResult: string
    try {
      nativeResult = native.encodeFunctionData(
        abiToJson(abi),
        functionName,
        richStringify(args ?? [])
      )
    } catch (nativeError) {
      const viemResult = realViemEncodeFunctionData(params)

      if (!isExpectedHandover(nativeError)) console.error(nativeError)

      return viemResult
    }

    if (VERIFY_AGAINST_VIEM) {
      const viemResult = realViemEncodeFunctionData(params)
      if (nativeResult !== viemResult) {
        console.error(new Error(`native encode mismatch for ${functionName}; used the viem result`))

        return viemResult
      }
    }

    return nativeResult
  }
}

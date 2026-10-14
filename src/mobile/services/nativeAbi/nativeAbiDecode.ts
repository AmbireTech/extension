import {
  parse as richParse,
  stringify as richStringify
} from '@ambire-common/libs/richJson/richJson'
import { nativeCrypto } from '@mobile/services/nativeCrypto/nativeCrypto'

/**
 * The refusals that mean "only viem can serve this call" rather than "something
 * went wrong". Overloaded functions need the call's arguments to disambiguate
 * and types outside the supported set have no native path, so both are ordinary
 * handovers and must not be reported.
 */
const EXPECTED_HANDOVER_TAGS = new Set<string | undefined>(
  nativeCrypto
    ? [nativeCrypto.AbiError_Tags.AmbiguousOverload, nativeCrypto.AbiError_Tags.UnsupportedType]
    : []
)

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

/** Both shimmed viem functions take a single params object and return a value. */
type ViemAbiFn = (params: any) => any

/**
 * Serves a call viem's way after the native codec refused it, and reports the
 * refusal unless it was an ordinary handover. Viem runs before the report so
 * that data both sides reject surfaces as viem's error rather than a logged
 * native one.
 */
function handBackToViem(nativeError: unknown, runViem: ViemAbiFn, params: any): any {
  const viemResult = runViem(params)

  if (!EXPECTED_HANDOVER_TAGS.has((nativeError as { tag?: string })?.tag))
    console.error(nativeError)

  return viemResult
}

/**
 * Builds a drop-in replacement for viem's `decodeFunctionResult` that decodes in
 * Rust and reconstructs the viem-shaped value via richJson. Hands the call to
 * the real viem decode passed in whenever the native path cannot serve it, and
 * returns that function untouched when the turbo-module is unavailable.
 */
export function makeNativeDecodeFunctionResult(realViemDecodeFunctionResult: ViemAbiFn): ViemAbiFn {
  if (!nativeCrypto) return realViemDecodeFunctionResult
  // Captured so the closure below keeps the non-null narrowing, which an
  // imported binding does not carry on its own.
  const native = nativeCrypto

  return function decodeFunctionResult(params: any): any {
    const { abi, functionName, data } = params ?? {}

    // Decoding without an explicit function name means viem has to resolve the
    // item from the ABI itself, so leave those calls to it.
    if (!functionName || typeof data !== 'string') return realViemDecodeFunctionResult(params)

    try {
      const decoded = richParse(native.decodeFunctionResult(abiToJson(abi), functionName, data))

      // A function with no outputs decodes to JSON null, and viem returns
      // undefined for that. No ABI type decodes to null, so this cannot swallow
      // a real value.
      return decoded === null ? undefined : decoded
    } catch (nativeError) {
      return handBackToViem(nativeError, realViemDecodeFunctionResult, params)
    }
  }
}

/**
 * Builds a drop-in replacement for viem's `encodeFunctionData` that encodes the
 * call in Rust and returns the `0x` calldata. Args cross the boundary as a
 * richJson string so bigints survive. Hands the call to the real viem encode
 * passed in whenever the native path cannot serve it, and returns that function
 * untouched when the turbo-module is unavailable.
 */
export function makeNativeEncodeFunctionData(realViemEncodeFunctionData: ViemAbiFn): ViemAbiFn {
  if (!nativeCrypto) return realViemEncodeFunctionData
  // Captured so the closure below keeps the non-null narrowing, which an
  // imported binding does not carry on its own.
  const native = nativeCrypto

  return function encodeFunctionData(params: any): any {
    const { abi, functionName, args } = params ?? {}

    // Encoding without an explicit function name means viem has to resolve the
    // item from the ABI itself, so leave those calls to it.
    if (!functionName) return realViemEncodeFunctionData(params)

    try {
      return native.encodeFunctionData(abiToJson(abi), functionName, richStringify(args ?? []))
    } catch (nativeError) {
      return handBackToViem(nativeError, realViemEncodeFunctionData, params)
    }
  }
}

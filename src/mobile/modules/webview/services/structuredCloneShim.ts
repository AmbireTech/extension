/**
 * BigInt-safe `structuredClone` polyfill for the WebView worker.
 *
 * WebKit bug present in iOS < 17.4: a BigInt in the
 * payload corrupts the structured-clone object-reference pool, so a repeated
 * object reference deserializes to the wrong slot. In the portfolio state
 * (tokens carry BigInt amounts and many shared/repeated price structures) this
 * mangles `priceIn`/`marketDataIn`/`meta` into BigInt garbage — e.g. `priceIn`
 * arrives as `496n` instead of `[{ baseCurrency, price }]` — and the dashboard
 * crashes on `priceIn.find`/`.some`. iOS 17.4+, the simulator, and Hermes are
 * unaffected.
 *
 * On affected engines we replace the global with a deterministic pure-JS deep
 * clone that preserves BigInt primitives and the structured types the wallet
 * clones. The override is gated by a probe that reproduces the actual bug (see
 * isNativeStructuredCloneSafe); correct engines keep their native one. Runs in
 * the worker only (the host uses Hermes), before any controller code executes.
 */
const deepClone = (value: any, seen: WeakMap<object, any>): any => {
  // Primitives (incl. bigint, string, number, boolean, null, undefined, symbol)
  // are returned as-is — bigint is the whole point of this shim.
  if (value === null || typeof value !== 'object') return value

  const existing = seen.get(value)
  if (existing) return existing

  if (value instanceof Date) return new Date(value.getTime())

  if (value instanceof RegExp) return new RegExp(value.source, value.flags)

  if (ArrayBuffer.isView(value)) {
    // Typed arrays / DataView
    const TypedArrayCtor = (value as any).constructor
    return new TypedArrayCtor(
      (value as any).buffer.slice(0),
      (value as any).byteOffset,
      (value as any).length
    )
  }

  if (value instanceof ArrayBuffer) return value.slice(0)

  if (Array.isArray(value)) {
    const clonedArray: any[] = []
    seen.set(value, clonedArray)
    value.forEach((item) => clonedArray.push(deepClone(item, seen)))
    return clonedArray
  }

  if (value instanceof Map) {
    const clonedMap = new Map()
    seen.set(value, clonedMap)
    value.forEach((v, k) => clonedMap.set(deepClone(k, seen), deepClone(v, seen)))
    return clonedMap
  }

  if (value instanceof Set) {
    const clonedSet = new Set()
    seen.set(value, clonedSet)
    value.forEach((v) => clonedSet.add(deepClone(v, seen)))
    return clonedSet
  }

  const clonedObject: Record<string, any> = {}
  seen.set(value, clonedObject)
  Object.keys(value).forEach((key) => {
    clonedObject[key] = deepClone(value[key], seen)
  })
  return clonedObject
}

const bigIntSafeStructuredClone = (value: any) => deepClone(value, new WeakMap())

/**
 * Returns true when the native structuredClone is free of WebKit bug #265975
 * (rdar://118868470), fixed in iOS/Safari 17.4.
 *
 * Root cause of the bug: CloneDeserializer::readBigInt() wrongly pushed entries
 * into the object-reference pool (`m_gcBuffer`). Every BigInt thus shifted the
 * indices that later `ObjectReferenceTag` back-references resolve against, so a
 * repeated object reference resolved to the WRONG slot — typically pulling a
 * BigInt out where an object/array belonged. This is exactly how the portfolio's
 * `priceIn`/`marketDataIn`/`meta` came back as `496n`/`431n`/`597n`.
 *
 * The trigger therefore requires BOTH: BigInt values AND an object that appears
 * more than once (creating a back-reference). Our first probe missed the bug
 * because it had no repeated reference. This probe reproduces it faithfully: a
 * few BigInts followed by a duplicated object reference, then asserts the
 * back-reference still resolves to the same object — the bug's direct signature.
 */
const isNativeStructuredCloneSafe = (): boolean => {
  const nativeClone = (globalThis as any).structuredClone
  if (typeof nativeClone !== 'function') return false

  try {
    const shared = { baseCurrency: 'usd', price: 1 }
    const probe = {
      a: 1n,
      b: 2n,
      c: 3n,
      first: shared,
      // Same object reference again -> serialized as an ObjectReferenceTag, the
      // back-reference whose index the BigInt bug corrupts.
      second: shared,
      amounts: [10n, 20n, 30n]
    }
    const cloned = nativeClone(probe)

    return (
      typeof cloned.second === 'object' &&
      cloned.second !== null &&
      cloned.second.baseCurrency === 'usd' &&
      // Identity preservation is the bug's direct tell: a correct clone keeps
      // first and second pointing at one object; the buggy one diverges.
      cloned.first === cloned.second &&
      typeof cloned.a === 'bigint' &&
      cloned.a === 1n
    )
  } catch {
    // A native structuredClone that throws on BigInt is also "unsafe" for us.
    return false
  }
}

// Override only on engines whose native structuredClone is broken (iOS < 17.4).
// iOS 17.4+, the simulator, and Hermes keep their faster native implementation.
//
// Runs on every fresh worker JS context: prod boots once from file://, dev
// fully remounts the WebView on each reload (no HMR — see WebViewWorker.tsx), so
// this re-evaluates and re-installs every time.
//
// This module is imported first in injectedLogic.ts — before console forwarding
// is wired up — so logging the outcome here would not reach Metro. Instead we
// stash the outcome on globalThis; `getStructuredCloneShimStatus()` is logged
// later from initControllers, once forwarding is active.
const nativeIsSafe = isNativeStructuredCloneSafe()
if (!nativeIsSafe) {
  ;(globalThis as any).structuredClone = bigIntSafeStructuredClone
}
;(globalThis as any).__structuredCloneNativeIsSafe = nativeIsSafe

export const getStructuredCloneShimStatus = () =>
  (globalThis as any).__structuredCloneNativeIsSafe
    ? '[structuredCloneShim] native structuredClone is safe (iOS 17.4+ / Hermes) — keeping native'
    : '[structuredCloneShim] native structuredClone is broken (iOS < 17.4) — installed JS shim'

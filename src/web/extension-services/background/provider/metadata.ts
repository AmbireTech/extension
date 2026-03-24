/**
 * SES-safe metadata helpers.
 *
 * Drop-in replacement for the subset of reflect-metadata used in the provider layer:
 *   - @Reflect.metadata(key, value)   →  @metadata(key, value)
 *   - Reflect.getMetadata(key, t, p)  →  getMetadata(key, t, p)
 *
 * Design constraints:
 *   - No global mutation (no patching of Reflect or any other global).
 *   - Module-scoped WeakMap storage: invisible across compartments.
 *   - Deterministic prototype-chain walk for reads (mirrors reflect-metadata semantics).
 *   - Compatible with SES lockdown().
 */

// ── storage ──────────────────────────────────────────────────────────
// WeakMap< target (prototype), Map< propertyKey, Map< metadataKey, value > > >
const store = new WeakMap<object, Map<string | symbol, Map<string, unknown>>>()

function ensureMetaMap(target: object, propertyKey: string | symbol): Map<string, unknown> {
  let propMap = store.get(target)
  if (!propMap) {
    propMap = new Map()
    store.set(target, propMap)
  }
  let metaMap = propMap.get(propertyKey)
  if (!metaMap) {
    metaMap = new Map()
    propMap.set(propertyKey, metaMap)
  }
  return metaMap
}

// ── decorator ────────────────────────────────────────────────────────

/**
 * Property / method decorator that attaches metadata to the target's prototype
 * under the given key.  Usage is identical to the old `@Reflect.metadata(…)`:
 *
 * ```ts
 * @metadata('SAFE', true)
 * myMethod = async () => { … }
 * ```
 */
export function metadata(
  metadataKey: string,
  metadataValue: unknown
): (target: object, propertyKey: string | symbol) => void {
  return (target: object, propertyKey: string | symbol) => {
    const metaMap = ensureMetaMap(target, propertyKey)
    metaMap.set(metadataKey, metadataValue)
  }
}

// ── reader ───────────────────────────────────────────────────────────

/**
 * Read metadata previously attached with `@metadata(…)`.
 * Walks the prototype chain of `target`, exactly like `Reflect.getMetadata`.
 *
 * Returns `undefined` when no metadata is found.
 */
export function getMetadata(metadataKey: string, target: object, propertyKey: string): unknown {
  let current: object | null = target

  while (current !== null) {
    const propMap = store.get(current)
    if (propMap) {
      const metaMap = propMap.get(propertyKey)
      if (metaMap && metaMap.has(metadataKey)) {
        return metaMap.get(metadataKey)
      }
    }
    current = Object.getPrototypeOf(current)
  }

  return undefined
}

/**
 * Produces a snapshot of a controller's state that is fully detached from the
 * controller's own objects, keeping the previous snapshot's top-level values
 * wherever they did not change.
 *
 * Needed where the controllers run in the same JS realm as the UI. There the state
 * the controller hands over still holds its live nested objects, so the previous
 * snapshot mutates in lockstep with the new one, the deep comparison in
 * SubscriptionManager reports them equal and the re-render is dropped. Platforms
 * whose state arrives over a port get a fresh object for free and do not need this.
 *
 * Works in two steps: `detachState` copies everything, then each top-level value is
 * compared against the previous snapshot's and the old one is kept when the two are
 * equal. Comparing two detached snapshots is what makes this safe, since comparing
 * against the controller's own objects would compare them to themselves. Reuse stops
 * at the top level, so a change anywhere inside `portfolio` gives the whole
 * `portfolio` value a new identity while `activity` and `keystore` keep theirs.
 * Returns `prev` itself when no top-level value changed, so every subscriber exits
 * on a reference check.
 *
 * Value handling matches `richJson`, which is what the port-based platforms get:
 * BigInt survives, `Error` is rebuilt, `toJSON` is honored, and functions,
 * symbols and `undefined` are dropped from objects and become `null` in arrays.
 *
 * `label` names the controller in the error a cycle raises. `detectCycles` is meant
 * to be passed `isDev`: a cycle would otherwise recurse forever, but the check costs
 * a WeakSet write per object node on an emit path that is already hot, so callers
 * pay for it in development only. `richJson.stringify` throws on the same input.
 */
export function reconcileState<T>(
  prev: unknown,
  next: T,
  { label, detectCycles }: { label?: string; detectCycles?: boolean } = {}
): T {
  const detached: unknown = detachState(next, { label, detectCycles })

  if (!isReusableObject(prev) || !isReusableObject(detached)) {
    return (isEqualSnapshot(prev, detached) ? prev : detached) as T
  }

  const nextKeys = Object.keys(detached)
  let hasChanged = Object.keys(prev).length !== nextKeys.length

  nextKeys.forEach((key) => {
    if (isEqualSnapshot(prev[key], detached[key])) {
      // Safe to write into, `detached` was just built here and nobody has seen it yet.
      detached[key] = prev[key]
      return
    }
    hasChanged = true
  })

  return (hasChanged ? detached : prev) as T
}

/**
 * Deep copy of a controller's state that shares no object with it, so a later
 * in-place mutation inside the controller cannot reach the copy. Never touches the
 * value it is given. See `reconcileState` for how values are handled and for what
 * `label` and `detectCycles` do.
 */
export function detachState<T>(
  value: T,
  { label, detectCycles }: { label?: string; detectCycles?: boolean } = {}
): T {
  return detachNode(value, detectCycles ? new WeakSet<object>() : null, label) as T
}

/**
 * Whether two snapshots produced by `detachState` hold the same content. Handles
 * only what such a snapshot can contain: primitives, plain objects, arrays and
 * errors. Not a general-purpose deep equality, so don't reach for it on live state.
 */
export function isEqualSnapshot(a: unknown, b: unknown): boolean {
  if (a === b) return true
  // The only pair that is equal without being identical is NaN, which every other
  // number pair falls through to as false.
  if (typeof a === 'number' && typeof b === 'number') return a !== a && b !== b
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false

  const isArray = Array.isArray(a)
  if (isArray !== Array.isArray(b)) return false
  if (isArray) {
    const arrayB = b as unknown[]
    return (
      (a as unknown[]).length === arrayB.length &&
      (a as unknown[]).every((item, index) => isEqualSnapshot(item, arrayB[index]))
    )
  }

  const isError = a instanceof Error
  if (isError !== b instanceof Error) return false
  // `message` and `stack` are own but non-enumerable, so a key walk alone reports
  // two errors carrying different messages as equal.
  if (isError) {
    const errorA = a as Error
    const errorB = b as Error
    if (errorA.message !== errorB.message || errorA.stack !== errorB.stack) return false
  }

  const keysA = Object.keys(a)
  return (
    keysA.length === Object.keys(b).length &&
    keysA.every((key) => hasOwn(b, key) && isEqualSnapshot((a as any)[key], (b as any)[key]))
  )
}

const hasOwn = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key)

const isReusableObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Error)

function detachNode(value: unknown, seen: WeakSet<object> | null, label?: string): unknown {
  if (value === null || typeof value !== 'object') return detachPrimitive(value)

  if (seen) {
    if (seen.has(value)) {
      throw new Error(
        `Circular reference in ${label || 'controller'} state, which cannot be snapshotted for the UI`
      )
    }
    seen.add(value)
  }

  try {
    if (value instanceof Error) return detachError(value, seen, label)
    if (Array.isArray(value)) return detachArray(value, seen, label)

    const source = typeof (value as any).toJSON === 'function' ? (value as any).toJSON() : value

    if (Array.isArray(source)) return detachArray(source, seen, label)
    if (source !== null && typeof source === 'object') return detachObject(source, seen, label)

    return detachPrimitive(source)
  } finally {
    // Dropped on the way back up so the same object appearing in two sibling
    // branches stays legal, exactly as it is for JSON.
    if (seen) seen.delete(value)
  }
}

function detachPrimitive(value: unknown): unknown {
  if (typeof value === 'function' || typeof value === 'symbol') return undefined

  return value
}

function detachArray(value: unknown[], seen: WeakSet<object> | null, label?: string): unknown[] {
  const out = new Array(value.length)

  for (let i = 0; i < value.length; i++) {
    const item = detachNode(value[i], seen, label)
    // JSON turns a hole, a function or an undefined inside an array into null.
    out[i] = item === undefined ? null : item
  }

  return out
}

function detachObject(source: object, seen: WeakSet<object> | null, label?: string): object {
  const out: Record<string, unknown> = {}

  for (const key in source) {
    if (!hasOwn(source, key)) continue

    const value = detachNode((source as any)[key], seen, label)
    if (value === undefined) continue

    out[key] = value
  }

  return out
}

function detachError(value: Error, seen: WeakSet<object> | null, label?: string): Error {
  const error: any = new Error(value.message)

  // An error carries whatever the thrower attached to it, so a prop can hold a live
  // nested object just like a state key can. Detached rather than copied by
  // reference, or the snapshot would stay attached to it and an in-place mutation
  // inside it would read as unchanged.
  Object.getOwnPropertyNames(value).forEach((propName) => {
    if (propName === 'message') return

    const propValue = detachNode((value as any)[propName], seen, label)
    if (propValue === undefined) return

    error[propName] = propValue
  })

  return error
}

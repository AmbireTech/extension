/**
 * Produces a snapshot of a controller's state that is fully detached from the
 * controller's own objects, reusing the previous snapshot's objects wherever the
 * content did not change.
 *
 * Needed where the controllers run in the same JS realm as the UI. There the state
 * the controller hands over still holds its live nested objects, so the previous
 * snapshot mutates in lockstep with the new one, the deep comparison in
 * SubscriptionManager reports them equal and the re-render is dropped. Platforms
 * whose state arrives over a port get a fresh object for free and do not need this.
 *
 * Sharing goes all the way down, so only the objects on the path from the root to
 * an actual change get a new identity. One chain finishing a portfolio update
 * leaves every other chain's tokens with the identity they already had, a selector
 * reading them returns the very same value it returned before, and its subscriber
 * exits on a reference check instead of re-rendering. Returns `prev` itself when
 * nothing changed at all.
 *
 * The copy and the comparison happen in the same walk, so the live state is read
 * once. `prev` is only ever read, and only ever the snapshot this function
 * returned before, which is what makes comparing it to the controller's live
 * objects safe: it shares none of them. A shallow copy of the state would not be
 * safe here, since its nested objects would be the controller's own and comparing
 * them would compare them to themselves.
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
  const reconciled = reconcileNode(prev, next, detectCycles ? new WeakSet<object>() : null, label)

  return (reconciled === UNCHANGED ? prev : reconciled) as T
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
  // With nothing to compare against, every node is rebuilt and `UNCHANGED` can
  // never come back, which is the whole difference from `reconcileState`.
  return reconcileNode(NO_PREV, value, detectCycles ? new WeakSet<object>() : null, label) as T
}

/**
 * Marks a node that holds the same content as the previous snapshot's, so the
 * caller reuses the previous node instead of the one just built. A returned value
 * cannot say this on its own, because `undefined` and `NaN` are both legal node
 * values and neither compares equal to itself the way a caller would need.
 */
const UNCHANGED = Symbol('unchanged')

/**
 * Stands in for "there is no previous node here", which is not the same as a
 * previous `undefined`. Never equal to any value a snapshot can hold, so every
 * node reached with it is rebuilt.
 */
const NO_PREV = Symbol('noPrev')

const hasOwn = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key)

/** Whether the previous node is one whose keys can be shared into a new object. */
const isSharableRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Error)

/**
 * Whether two snapshot primitives hold the same value. The only pair that is equal
 * without being identical is NaN.
 */
const isSamePrimitive = (a: unknown, b: unknown): boolean =>
  a === b || (typeof a === 'number' && typeof b === 'number' && a !== a && b !== b)

/**
 * The detached form of `value`, or `UNCHANGED` when that form holds the same
 * content as `prev`. Returns `undefined` for a value a snapshot drops, which is
 * what tells the caller to leave the key out or write a `null` in an array.
 */
function reconcileNode(
  prev: unknown,
  value: unknown,
  seen: WeakSet<object> | null,
  label?: string
): unknown {
  if (value === null || typeof value !== 'object') {
    const detached = detachPrimitive(value)

    return isSamePrimitive(prev, detached) ? UNCHANGED : detached
  }

  if (seen) {
    if (seen.has(value)) {
      throw new Error(
        `Circular reference in ${label || 'controller'} state, which cannot be snapshotted for the UI`
      )
    }
    seen.add(value)
  }

  try {
    if (value instanceof Error) return reconcileError(prev, value, seen, label)
    if (Array.isArray(value)) return reconcileArray(prev, value, seen, label)

    const source = typeof (value as any).toJSON === 'function' ? (value as any).toJSON() : value

    if (Array.isArray(source)) return reconcileArray(prev, source, seen, label)
    if (source !== null && typeof source === 'object') {
      return reconcileRecord(prev, source, seen, label)
    }

    const detached = detachPrimitive(source)

    return isSamePrimitive(prev, detached) ? UNCHANGED : detached
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

function reconcileArray(
  prev: unknown,
  value: unknown[],
  seen: WeakSet<object> | null,
  label?: string
): unknown {
  const prevArray = Array.isArray(prev) ? prev : null
  const out = new Array(value.length)
  let isUnchanged = prevArray !== null && prevArray.length === value.length

  for (let index = 0; index < value.length; index += 1) {
    const hasPrevItem = prevArray !== null && index < prevArray.length
    const prevItem = hasPrevItem ? prevArray[index] : undefined
    const item = reconcileNode(hasPrevItem ? prevItem : NO_PREV, value[index], seen, label)

    if (item === UNCHANGED) {
      out[index] = prevItem
      continue
    }

    // JSON turns a hole, a function or an undefined inside an array into null.
    const detached = item === undefined ? null : item
    out[index] = detached
    // Compared again because a dropped item becomes the `null` the previous
    // snapshot may already hold for it, which `reconcileNode` cannot see.
    if (detached !== prevItem) isUnchanged = false
  }

  return isUnchanged ? UNCHANGED : out
}

function reconcileRecord(
  prev: unknown,
  source: object,
  seen: WeakSet<object> | null,
  label?: string
): unknown {
  const prevRecord = isSharableRecord(prev) ? prev : null
  const out: Record<string, unknown> = {}
  let isUnchanged = prevRecord !== null
  let keptKeys = 0

  for (const key in source) {
    if (!hasOwn(source, key)) continue

    const hasPrevValue = prevRecord !== null && hasOwn(prevRecord, key)
    const child = reconcileNode(
      hasPrevValue ? prevRecord![key] : NO_PREV,
      (source as any)[key],
      seen,
      label
    )

    // `UNCHANGED` can only come back when there was a previous value to match,
    // since `NO_PREV` never compares equal to anything.
    if (child === UNCHANGED) {
      out[key] = prevRecord![key]
      keptKeys += 1
      continue
    }

    // Dropped from the snapshot. Not marked as a change here: a key `prev` carried
    // and this one does not is what the `keptKeys` count below catches, and a key
    // neither of them ends up with is no change at all.
    if (child === undefined) continue

    out[key] = child
    keptKeys += 1
    isUnchanged = false
  }

  // Equal key counts plus every kept key having come from `prev` is what makes the
  // two key sets the same, which is how a removed key is caught.
  if (isUnchanged && keptKeys !== Object.keys(prevRecord!).length) isUnchanged = false

  return isUnchanged ? UNCHANGED : out
}

/**
 * The descriptor `new Error()` gives `message` and `stack`. Reproduced here because
 * the error below is not built with `new Error()`, and a key walk over the snapshot
 * has to see the same properties as one over an error richJson rebuilt.
 */
const NON_ENUMERABLE = { writable: true, enumerable: false, configurable: true }

function reconcileError(
  prev: unknown,
  value: Error,
  seen: WeakSet<object> | null,
  label?: string
): unknown {
  const prevError = prev instanceof Error ? prev : null
  // Built without `new Error()`, whose stack capture is the expensive part of
  // rebuilding an error and is thrown away by the copy of `stack` below anyway.
  const error = Object.create(Error.prototype, {
    message: { value: value.message, ...NON_ENUMERABLE }
  }) as Error
  let isUnchanged = prevError !== null && prevError.message === value.message
  let keptKeys = 0

  // An error carries whatever the thrower attached to it, so a prop can hold a live
  // nested object just like a state key can. Detached rather than copied by
  // reference, or the snapshot would stay attached to it and an in-place mutation
  // inside it would read as unchanged.
  Object.getOwnPropertyNames(value).forEach((propName) => {
    if (propName === 'message') return

    const hasPrevValue = prevError !== null && hasOwn(prevError, propName)
    const child = reconcileNode(
      hasPrevValue ? (prevError as any)[propName] : NO_PREV,
      (value as any)[propName],
      seen,
      label
    )

    if (child === undefined) {
      if (hasPrevValue) isUnchanged = false
      return
    }

    const propValue = child === UNCHANGED ? (prevError as any)[propName] : child
    if (child !== UNCHANGED) isUnchanged = false

    // `stack` is own but non-enumerable on a real error, so it is defined rather
    // than assigned and stays off every key walk, `keptKeys` included.
    if (propName === 'stack') {
      Object.defineProperty(error, 'stack', { value: propValue, ...NON_ENUMERABLE })
      return
    }

    ;(error as any)[propName] = propValue
    keptKeys += 1
  })

  if (isUnchanged && keptKeys !== Object.keys(prevError!).length) isUnchanged = false

  return isUnchanged ? UNCHANGED : error
}

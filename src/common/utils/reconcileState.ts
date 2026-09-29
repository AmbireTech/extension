/**
 * Produces a snapshot of a controller's state that is fully detached from the
 * controller's own objects, reusing the previous snapshot's objects wherever the
 * content did not change.
 *
 * Mandatory where the controllers run in the same JS realm as the UI: there the state
 * the controller hands over still holds its live nested objects, so a snapshot that
 * copied them by reference would mutate in lockstep with the controller and every
 * comparison against it would report no change. A state that arrives over a port is
 * detached already, and reconciles for the sharing alone.
 *
 * Sharing goes all the way down, so only the objects on the path from the root to
 * an actual change get a new identity. One chain finishing a portfolio update
 * leaves every other chain's tokens with the identity they already had, a selector
 * reading them returns the very same value it returned before, and its subscriber
 * exits on a reference check instead of re-rendering. Returns `prev` itself when
 * nothing changed at all.
 *
 * In short: the controller state is first detached from the controller (cloned), then every
 * update updates only the changed parts of the state, and the rest of the state is reused from the previous snapshot.
 *
 * A node whose content did not change builds nothing: the object that would hold it is
 * opened on the first change found under it, out of the previous snapshot's own values,
 * and never opened at all for a subtree the update did not touch. So an emit that
 * touched one chain allocates along that chain, not across the state.
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
 * value it is given.
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
 * caller reuses the previous node instead of the one just built.
 */
const UNCHANGED = Symbol('unchanged')

/**
 * Stands in for "there is no previous node here"
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
 * How many keys a previous snapshot node carries, allocating nothing. Every node a
 * snapshot is made of was built here out of own enumerable keys alone, so there is
 * nothing on it a walk has to filter out.
 */
function countKeys(record: object): number {
  let count = 0

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const key in record) count += 1

  return count
}

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
    // A snapshot never holds a function or a symbol, so an identity match here is
    // always between two equal primitives. Every other pair goes the long way, NaN
    // against itself included.
    if (value === prev) return UNCHANGED

    const detached = detachPrimitive(value)

    return isSamePrimitive(prev, detached) ? UNCHANGED : detached
  }

  // Production never enters the `try` below: the bookkeeping a cycle check needs is
  // what pays for it, and there is none to undo when the check is off.
  if (!seen) return reconcileObject(prev, value, null, label)

  if (seen.has(value)) {
    throw new Error(
      `Circular reference in ${label || 'controller'} state, which cannot be snapshotted for the UI`
    )
  }
  seen.add(value)

  try {
    return reconcileObject(prev, value, seen, label)
  } finally {
    // Dropped on the way back up so the same object appearing in two sibling
    // branches stays legal, exactly as it is for JSON.
    seen.delete(value)
  }
}

function reconcileObject(
  prev: unknown,
  value: object,
  seen: WeakSet<object> | null,
  label?: string
): unknown {
  // Asked in the order that lets the common node - a plain record the state owns -
  // answer on the fewest checks, and each of the three only once. `toJSON` is the
  // expensive one: it is a property the great majority of nodes do not have, looked
  // up across as many shapes as the state holds.
  if (Array.isArray(value)) return reconcileArray(prev, value, seen, label)
  if (value instanceof Error) return reconcileError(prev, value, seen, label)

  const source = typeof (value as any).toJSON === 'function' ? (value as any).toJSON() : value

  if (source === value) return reconcileRecord(prev, value, seen, label)

  // What `toJSON` handed back stands in for the value itself, so it is asked the same
  // questions - a plain `JSON.stringify` would recurse into it the same way.
  if (Array.isArray(source)) return reconcileArray(prev, source, seen, label)
  if (source !== null && typeof source === 'object') {
    return reconcileRecord(prev, source, seen, label)
  }

  const detached = detachPrimitive(source)

  return isSamePrimitive(prev, detached) ? UNCHANGED : detached
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
  // A previous array of another length shares nothing, so its items are not worth
  // walking against and the new one is opened right away.
  const isSharable = prevArray !== null && prevArray.length === value.length
  let out: unknown[] | null = isSharable ? null : new Array(value.length)

  for (let index = 0; index < value.length; index += 1) {
    const hasPrevItem = prevArray !== null && index < prevArray.length
    const prevItem = hasPrevItem ? prevArray[index] : undefined
    const item = reconcileNode(hasPrevItem ? prevItem : NO_PREV, value[index], seen, label)

    // Kept as it is, and deliberately not put through the identity check below: the two
    // are known to hold the same content, which for a NaN is not the same as being
    // identical.
    if (item === UNCHANGED) {
      if (out !== null) out[index] = prevItem
      continue
    }

    // JSON turns a hole, a function or an undefined inside an array into null.
    const detached = item === undefined ? null : item

    if (out === null) {
      // Compared against the previous item because a dropped item becomes the `null`
      // the previous snapshot may already hold for it, which `reconcileNode` cannot see.
      if (detached === prevItem) continue

      // First item that differs: the ones before it are the previous array's own.
      out = new Array(value.length)
      for (let kept = 0; kept < index; kept += 1) out[kept] = prevArray![kept]
    }

    out[index] = detached
  }

  return out === null ? UNCHANGED : out
}

/**
 * Opens the object a record's first change needs, filled with what the previous
 * snapshot holds for the keys already walked. Every one of those was either kept as
 * `prev`'s own value or dropped from the snapshot, and only a kept key is one `prev`
 * carries - so `prev` having the key is what tells the two apart.
 */
function openRecord(
  prevRecord: Record<string, unknown>,
  keys: string[],
  stopIndex: number
): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (let index = 0; index < stopIndex; index += 1) {
    const key = keys[index]!
    const keptValue = prevRecord[key]

    if (keptValue !== undefined) out[key] = keptValue
  }

  return out
}

function reconcileRecord(
  prev: unknown,
  source: object,
  seen: WeakSet<object> | null,
  label?: string
): unknown {
  const prevRecord = isSharableRecord(prev) ? prev : null
  // Own enumerable keys, which is the set `JSON.stringify` would walk, without the
  // per-key ownership test a `for ... in` needs to arrive at the same set.
  const keys = Object.keys(source)
  // With nothing to share from, every key is a change and the object is built for
  // certain, so there is nothing to gain by deferring it.
  let out: Record<string, unknown> | null = prevRecord === null ? {} : null
  let keptKeys = 0

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index]!
    // A snapshot never holds an `undefined` under a key, because that is exactly what
    // it drops - so reading one back means `prev` does not carry the key at all, and
    // the read that answers it is the one the comparison needs anyway.
    const prevValue = prevRecord === null ? undefined : prevRecord[key]
    const child = reconcileNode(
      prevValue === undefined ? NO_PREV : prevValue,
      (source as any)[key],
      seen,
      label
    )

    // `UNCHANGED` can only come back when there was a previous value to match,
    // since `NO_PREV` never compares equal to anything.
    if (child === UNCHANGED) {
      if (out !== null) out[key] = prevValue
      keptKeys += 1
      continue
    }

    // Dropped from the snapshot. A change only if `prev` carried the key, and a key
    // neither of them ends up with is no change at all.
    if (child === undefined) {
      if (prevValue !== undefined && out === null) out = openRecord(prevRecord!, keys, index)
      continue
    }

    if (out === null) out = openRecord(prevRecord!, keys, index)
    out[key] = child
    keptKeys += 1
  }

  if (out !== null) return out

  // Every key walked matched `prev`, so equal key counts is what makes the two key
  // sets the same - which is how a key `prev` carried and this state dropped entirely
  // is caught, the one change a walk over `source` alone cannot see.
  if (keptKeys === countKeys(prevRecord!)) return UNCHANGED

  return openRecord(prevRecord!, keys, keys.length)
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

  if (isUnchanged && keptKeys !== countKeys(prevError!)) isUnchanged = false

  return isUnchanged ? UNCHANGED : error
}

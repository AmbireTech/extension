// Structural sharing for controller state snapshots.
//
// Controller state arrives fully re-serialized on every update, so every object
// and array in it is a brand-new reference even when its content is identical to
// the previous snapshot. That defeats the `newValue === lastValue` fast path in
// SubscriptionManager, forcing a deep `react-fast-compare` walk for every
// subscriber on every update.
//
// `reconcile` walks the incoming snapshot against the previous one and reuses the
// previous reference for any subtree whose content is unchanged. Selector
// subscribers whose slice didn't change then short-circuit on reference equality
// instead of deep-comparing, and a fully-redundant update is dropped entirely.
export function reconcile<T>(prev: T, next: T): T {
  if (Object.is(prev, next)) return prev

  if (typeof prev !== 'object' || typeof next !== 'object' || prev === null || next === null) {
    return next
  }

  const prevIsArray = Array.isArray(prev)
  const nextIsArray = Array.isArray(next)
  // A change of container type is always a real change
  if (prevIsArray !== nextIsArray) return next

  if (nextIsArray) {
    const prevArr = prev as unknown[]
    const nextArr = next as unknown[]

    let changed = prevArr.length !== nextArr.length
    const result = nextArr.map((item, index) => {
      const merged = reconcile(prevArr[index], item)
      if (!Object.is(merged, prevArr[index])) changed = true
      return merged
    })

    return (changed ? result : prev) as unknown as T
  }

  const prevObj = prev as Record<string, unknown>
  const nextObj = next as Record<string, unknown>
  const nextKeys = Object.keys(nextObj)

  // A differing key count means a key was added or removed
  let changed = nextKeys.length !== Object.keys(prevObj).length
  const result: Record<string, unknown> = {}
  nextKeys.forEach((key) => {
    const merged = reconcile(prevObj[key], nextObj[key])
    result[key] = merged
    if (!Object.is(merged, prevObj[key])) changed = true
  })

  return (changed ? result : prev) as unknown as T
}

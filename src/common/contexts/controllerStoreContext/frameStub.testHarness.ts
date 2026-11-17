/**
 * Stands in for the frame the native committer paces its hand-overs on, cancellable the
 * way the platform's is. The DOM committer asks for none, which is what `pendingFrames`
 * is there to assert.
 */
export const installFrameStub = () => {
  const callbacks: Map<number, () => void> = new Map()
  let nextHandle = 1

  ;(global as any).requestAnimationFrame = (callback: () => void) => {
    const handle = nextHandle
    nextHandle += 1
    callbacks.set(handle, callback)

    return handle
  }
  ;(global as any).cancelAnimationFrame = (handle: number) => {
    callbacks.delete(handle)
  }

  return {
    runFrame: () => {
      const due = [...callbacks.values()]
      callbacks.clear()
      due.forEach((callback) => callback())
    },
    pendingFrames: () => callbacks.size
  }
}

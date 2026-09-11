import { CtrlStateCommitter, DeliverCtrlState } from './types'

/** Fallback for where there is no `requestAnimationFrame`, e.g. tests. */
const FRAME_MS = 16

/**
 * React Native's renderer exposes no `flushSync` - nothing in `RendererProxy` or in the
 * Fabric/Paper renderers flushes pending work - and the platform hands JS the ~1ms
 * timers that `withStatus`'s forced emits sit behind in a single batch. So LOADING,
 * SUCCESS and INITIAL all land in one task, React renders the last of them, and a screen
 * waiting on SUCCESS never runs.
 *
 * The snapshots are therefore paced rather than flushed: a forced one is left in front of
 * the UI until the frame boundary, which is where React renders what it was given, and
 * whatever would replace it waits its turn. One snapshot per controller per frame, in the
 * order they were committed.
 */
export const createCtrlStateCommitter = (deliver: DeliverCtrlState): CtrlStateCommitter => {
  /** Snapshots not delivered yet, oldest first per controller. */
  const queuedStates: Map<string, { state: any; forceEmit?: boolean }[]> = new Map()
  /** Controllers whose delivered snapshot is forced and may not be rendered yet. */
  const ctrlsWithUnrenderedForcedState = new Set<string>()
  let isFrameScheduled = false

  function deliverNow(id: string, state: any, forceEmit?: boolean) {
    const isSubscribed = deliver(id, state)

    // Nothing renders it, so there is nothing to pace.
    if (!isSubscribed || !forceEmit) return

    ctrlsWithUnrenderedForcedState.add(id)
    scheduleFrame()
  }

  function drainQueuedStates() {
    queuedStates.forEach((queue, id) => {
      const next = queue.shift()

      if (!queue.length) queuedStates.delete(id)
      if (!next) return

      deliverNow(id, next.state, next.forceEmit)
    })

    if (queuedStates.size) scheduleFrame()
  }

  function scheduleFrame() {
    if (isFrameScheduled) return
    isFrameScheduled = true

    const onFrame = () => {
      isFrameScheduled = false
      // A frame has passed since those snapshots were delivered, so React has rendered
      // them and the next one may take their place.
      ctrlsWithUnrenderedForcedState.clear()
      drainQueuedStates()
    }

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(onFrame)
      return
    }

    setTimeout(onFrame, FRAME_MS)
  }

  return {
    commit: (id, state, forceEmit) => {
      if (!ctrlsWithUnrenderedForcedState.has(id)) {
        deliverNow(id, state, forceEmit)
        return
      }

      const queue = queuedStates.get(id) ?? []
      queue.push({ state, forceEmit })
      queuedStates.set(id, queue)
      scheduleFrame()
    },
    pendingStateOf: (id) => {
      const queue = queuedStates.get(id)

      return queue?.length ? queue[queue.length - 1]!.state : undefined
    },
    destroy: () => {
      queuedStates.clear()
      ctrlsWithUnrenderedForcedState.clear()
    }
  }
}

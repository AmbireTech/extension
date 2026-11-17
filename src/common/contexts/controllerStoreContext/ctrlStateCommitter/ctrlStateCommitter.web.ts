import { flushSync } from 'react-dom'

import { CtrlStateCommitter, DeliverCtrlState } from './types'

/**
 * Nothing is ever held back on the DOM renderers (extension, benzin, legends): a forced
 * update is rendered before the next one can take its place, so every one of them is
 * seen. React Native has no way to do that - see `ctrlStateCommitter.native.ts`.
 */
export const createCtrlStateCommitter = (deliver: DeliverCtrlState): CtrlStateCommitter => ({
  commit: (id, state, forceEmit) => {
    if (!forceEmit) {
      deliver(id, state)
      return
    }

    /**
     * For certain updates, we need to override React's default behavior of batching state updates and render the update immediately.
     * This is particularly handy when multiple status flags are being updated rapidly.
     * Without the forceEmit option, React will only render the very first and last status updates, batching the ones in between.
     *
     * Here's more info about `flushSync`:
     * Introduced in React 18, flushSync is a function that forces React to re-render synchronously within its callback,
     * before continuing with the rest of the JavaScript event loop.
     * This goes against React's default behavior of batching state updates for optimized performance.
     */
    flushSync(() => {
      deliver(id, state)
    })
  },
  pendingStateOf: () => undefined,
  destroy: () => {}
})

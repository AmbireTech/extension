import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

import {
  ControllersInstances,
  ControllersMappingType
} from '@web/extension-services/background/types'
import eventBus from '@web/extension-services/event/eventBus'

/**
 * A hook that listens for any controller state updates (transmitted by the EventBus)
 * and keeps the updated value in the state variable.
 */
export default function useControllerState<K extends keyof ControllersInstances>(
  controllerName: K,
  onUpdateCallback?: (newState: ControllersInstances[K]) => Promise<void> | void
): ControllersInstances[K] {
  const [state, setState] = useState({} as ControllersInstances[K])

  useEffect(() => {
    const onUpdate = (newState: ControllersInstances[K], forceEmit?: boolean) => {
      /**
       *
       * For certain updates, we need to override React's default behavior of batching state updates and render the update immediately.
       * This is particularly handy when multiple status flags are being updated rapidly.
       * Without the forceEmit option, React will only render the very first and last status updates, batching the ones in between.
       *
       * Here's more info about `flushSync`:
       * Introduced in React 18, flushSync is a function that forces React to re-render synchronously within its callback,
       * before continuing with the rest of the JavaScript event loop.
       * This goes against React's default behavior of batching state updates for optimized performance.
       */
      if (forceEmit) {
        flushSync(() => setState(newState))
      } else {
        setState(newState)
      }
      !!onUpdateCallback && onUpdateCallback(newState)
    }

    eventBus.addEventListener(controllerName, onUpdate)

    return () => eventBus.removeEventListener(controllerName, onUpdate)
  }, [controllerName, onUpdateCallback])

  return state
}

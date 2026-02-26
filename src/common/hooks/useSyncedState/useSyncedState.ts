import React, { useEffect, useState } from 'react'

const DEBOUNCE_MS = 300

const getForceUpdateIdentifier = (forceUpdateOnChangeList?: (string | number | boolean)[]) => {
  return forceUpdateOnChangeList ? forceUpdateOnChangeList.join('-') : ''
}

type Props<T> = {
  /**
   * The background state that needs to be synchronized with the local state.
   */
  backgroundState: T
  /**
   * A dispatch function to update the background state.
   */
  updateBackgroundState: (newState: T) => void
  /**
   * A list of primitive values that, when changed, will trigger an update of the local state.
   * Background state --> Local state
   * @Example - The selected token in transfer changes, which triggers an amount update
   * in the controller. This update must be reflected in the local copy of the state.
   */
  forceUpdateOnChangeList?: (string | number | boolean)[]
}

type ReturnType<T> = [T, (newState: T, skipControllerUpdate?: boolean) => void]

const useSyncedState = <T>({
  backgroundState,
  updateBackgroundState,
  forceUpdateOnChangeList
}: Props<T>): ReturnType<T> => {
  const lastForceUpdateIdentifier = React.useRef(getForceUpdateIdentifier(forceUpdateOnChangeList))
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null)
  const [state, setState] = useState<T>(backgroundState)

  const clearDebounceTimeout = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
  }

  /**
   * Updates the local state immediately and schedules an update of the background state
   * Local state --> Background state
   * This is debounced to avoid excessive updates to the background state.
   */
  const updateLocalStateWithDebounce = (newState: T, skipControllerUpdate?: boolean) => {
    setState(newState)

    if (skipControllerUpdate) return

    clearDebounceTimeout()

    debounceRef.current = setTimeout(() => {
      // Local state --> Background state
      updateBackgroundState(newState)

      // Clear the debounce timeout after the update
      clearDebounceTimeout()
    }, DEBOUNCE_MS)
  }

  // Update the local state with the background state when the
  // tab is focused
  // Background state --> Local state
  useEffect(() => {
    const handleTabVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setState(backgroundState)
      }
    }

    window.addEventListener('focus', handleTabVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleTabVisibilityChange)
    }
  }, [backgroundState])

  // Update the local state when one of the force update dependencies changes
  // Background state --> Local state
  // Example: The selected token in transfer changes, which triggers an amount update
  // in the controller. This update must be reflected in the local copy of the state.
  useEffect(() => {
    const identifier = getForceUpdateIdentifier(forceUpdateOnChangeList)
    if (identifier !== lastForceUpdateIdentifier.current) {
      lastForceUpdateIdentifier.current = identifier
      setState(backgroundState)
      clearDebounceTimeout()
    }
  }, [backgroundState, forceUpdateOnChangeList])

  return [state, updateLocalStateWithDebounce]
}

export default useSyncedState

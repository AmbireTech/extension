import { useCallback, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-native'

import useMemoryHistory from '@common/hooks/useMemoryHistory'

import { reduceStack, StackNavigationType, StackState } from './stackEntries'

const useStackEntries = () => {
  const location = useLocation()
  const navigationType = useNavigationType()
  const history = useMemoryHistory()

  const [state, setState] = useState<StackState>(() => ({
    entries: [{ key: location.key, location, index: history.index }],
    closing: []
  }))

  const top = state.entries[state.entries.length - 1]

  // Adjusting the stack while rendering (instead of in an effect) commits the
  // new card in the same frame as the location change, so the screen never
  // renders one frame behind the router.
  if (top?.key !== location.key) {
    setState(
      reduceStack(state, {
        location,
        index: history.index,
        navigationType: navigationType as StackNavigationType
      })
    )
  }

  const removeClosingEntry = useCallback((key: string) => {
    setState((prev) => ({ ...prev, closing: prev.closing.filter((e) => e.key !== key) }))
  }, [])

  return {
    entries: state.entries,
    closing: state.closing,
    settledKey: state.settledKey,
    removeClosingEntry
  }
}

export default useStackEntries

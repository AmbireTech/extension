import { useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-native'

import useRouterHistory from '@common/hooks/useRouterHistory'

import { reduceStack, StackNavigationType, StackState } from './stackEntries'

const useStackEntries = (): StackState => {
  const location = useLocation()
  const navigationType = useNavigationType()
  const history = useRouterHistory()

  const event = {
    location,
    index: history.index,
    navigationType: navigationType as StackNavigationType
  }

  // The route the app boots on runs through the same rules, so it is the first card -
  // and the platform puts the first card up without animating it.
  const [entries, setEntries] = useState<StackState>(() => reduceStack([], event))

  const top = entries[entries.length - 1]

  // Adjusted while rendering rather than in an effect, so the new screen is committed
  // in the same frame as the location change instead of one behind it.
  if (top?.key !== location.key) {
    const next = reduceStack(entries, event)

    // A navigation can leave every card as it was, and re-setting an unchanged stack
    // would never settle.
    if (next !== entries) setEntries(next)
  }

  return entries
}

export default useStackEntries

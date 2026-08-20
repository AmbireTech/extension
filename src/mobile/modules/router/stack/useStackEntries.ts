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

  // The stack the app boots with runs through the same rules, so the route it
  // starts on is the first card there ever was - and the platform puts up the
  // first card without animating it. A boot that starts on the redirect hub
  // therefore has no card until the redirect resolves.
  const [entries, setEntries] = useState<StackState>(() => reduceStack([], event))

  const top = entries[entries.length - 1]

  // Adjusting the stack while rendering (instead of in an effect) commits the new
  // screen in the same frame as the location change, so the stack never renders
  // one frame behind the router.
  if (top?.key !== location.key) {
    const next = reduceStack(entries, event)

    // A navigation can leave every card as it was (the redirect hub), and setting
    // state with a stack that did not change would never settle.
    if (next !== entries) setEntries(next)
  }

  return entries
}

export default useStackEntries

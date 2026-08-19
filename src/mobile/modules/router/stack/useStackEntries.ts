import { useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-native'

import useRouterHistory from '@common/hooks/useRouterHistory'

import { reduceStack, StackNavigationType, StackState } from './stackEntries'

const useStackEntries = (): StackState => {
  const location = useLocation()
  const navigationType = useNavigationType()
  const history = useRouterHistory()

  const [entries, setEntries] = useState<StackState>(() => [
    {
      cardKey: location.key,
      key: location.key,
      location,
      index: history.index,
      firstIndex: history.index
    }
  ])

  const top = entries[entries.length - 1]

  // Adjusting the stack while rendering (instead of in an effect) commits the new
  // screen in the same frame as the location change, so the stack never renders
  // one frame behind the router.
  if (top?.key !== location.key) {
    setEntries(
      reduceStack(entries, {
        location,
        index: history.index,
        navigationType: navigationType as StackNavigationType
      })
    )
  }

  return entries
}

export default useStackEntries

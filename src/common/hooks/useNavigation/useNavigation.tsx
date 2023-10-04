import { useCallback, useRef } from 'react'

import { navigationRef } from '@common/services/navigation'
import { useNavigation as useReactNavigation } from '@react-navigation/native'

import { TitleChangeEventStreamType, UseNavigationReturnType } from './types'

export const titleChangeEventStream: TitleChangeEventStreamType = null
const useNavigation = (): UseNavigationReturnType => {
  const nav = useReactNavigation()
  const interval: any = useRef(null)

  const navigate = useCallback<UseNavigationReturnType['navigate']>((to, options) => {
    const checkIsReady = () => {
      if (navigationRef?.current?.isReady()) {
        !!interval.current && clearInterval(interval.current) // Stop the interval once isReady is true
        navigationRef?.current?.navigate(to?.[0] === '/' ? to.substring(1) : to, options?.state)
      }
    }

    if (!navigationRef?.current?.isReady()) {
      interval.current = setInterval(checkIsReady, 500)
    } else {
      checkIsReady() // Call immediately if isReady is already true
    }

    if (navigationRef?.current?.isReady()) {
      return navigationRef?.current?.navigate(
        to?.[0] === '/' ? to.substring(1) : to,
        options?.state
      )
    }
  }, [])

  return {
    ...nav,
    navigate
  }
}

export default useNavigation

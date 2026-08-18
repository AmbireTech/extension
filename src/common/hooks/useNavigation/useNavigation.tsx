import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-native'
import { Subject } from 'rxjs'

import useMemoryHistory from '@common/hooks/useMemoryHistory'

import { TitleChangeEventStreamType, UseNavigationReturnType } from './types'

// Event stream that gets triggered when the title changes
export const titleChangeEventStream: TitleChangeEventStreamType = new Subject<string>()

const useNavigation = (): UseNavigationReturnType => {
  const nav = useNavigate()
  const currentRoute = useLocation()
  const history = useMemoryHistory()

  // Native doesn't have useSearchParams out of the box like DOM
  const searchParams = useMemo(
    () => new URLSearchParams(currentRoute.search),
    [currentRoute.search]
  )

  const navigate = useCallback<UseNavigationReturnType['navigate']>(
    (to, options) => {
      // react-router navigate signature supports number (for going back/forward)
      if (typeof to === 'number') {
        return nav(to)
      }

      let destination = to as string
      if (destination?.[0] !== '/') {
        destination = `/${destination}`
      }

      return nav(destination, {
        ...options,
        state: {
          ...(options?.state || {}),
          prevRoute: currentRoute
        }
      })
    },
    [nav, currentRoute]
  )

  const goBack = useCallback(() => nav(-1), [nav])

  const setOptions = useCallback<UseNavigationReturnType['setOptions']>(({ headerTitle }) => {
    if (headerTitle) {
      // For mobile we can't set document.title, but we can trigger the internal event stream
      titleChangeEventStream?.next(headerTitle)
    }

    // All other options are not supported directly here
  }, [])

  const setSearchParams = useCallback<UseNavigationReturnType['setSearchParams']>((params) => {
    // Stub for mobile. If search params are heavily used in routing logic,
    // we would need to manually reconstruct the search string and replace the URL here.
    console.warn('setSearchParams is currently a stub on mobile.')
  }, [])

  // The real depth of the memory history stack, so going back is offered only
  // when there actually is an entry to pop to. `index` is a getter on the
  // history instance, read on every render - and a navigation always re-renders
  // this hook through `useLocation` above.
  const canGoBack = history.index > 0

  return {
    navigate,
    setOptions,
    setSearchParams,
    goBack,
    searchParams,
    canGoBack
  }
}

export default useNavigation

import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-native'
import { Subject } from 'rxjs'

import { TitleChangeEventStreamType, UseNavigationReturnType } from './types'

// Event stream that gets triggered when the title changes
export const titleChangeEventStream: TitleChangeEventStreamType = new Subject<string>()

const useNavigation = (): UseNavigationReturnType => {
  const nav = useNavigate()
  const currentRoute = useLocation()

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

      let destination = to
      if (typeof destination === 'string' && destination?.[0] !== '/') {
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

  const prevRoute = useMemo(() => {
    if (!(currentRoute.state as any)?.prevRoute) return null

    return (currentRoute.state as any).prevRoute
  }, [currentRoute])

  return {
    navigate,
    setOptions,
    setSearchParams,
    goBack,
    searchParams,
    canGoBack: !!prevRoute
  }
}

export default useNavigation

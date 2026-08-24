import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-native'
import { Subject } from 'rxjs'

import { isDev } from '@common/config/env'
import { useIsScreenFocusedRef } from '@common/contexts/screenFocusContext'
import useRouterHistory from '@common/hooks/useRouterHistory'

import { TitleChangeEventStreamType, UseNavigationReturnType } from './types'

// Event stream that gets triggered when the title changes
export const titleChangeEventStream: TitleChangeEventStreamType = new Subject<string>()

const useNavigation = (): UseNavigationReturnType => {
  const nav = useNavigate()
  const currentRoute = useLocation()
  const history = useRouterHistory()
  const isFocusedRef = useIsScreenFocusedRef()

  /**
   * Navigating is the business of the screen the user is on. Screens stay mounted
   * underneath it, so an effect on one further back would otherwise send the user
   * somewhere else or move a flow on a step too far. Refused here rather than at each
   * call site, and read through a ref, so losing focus re-renders nothing.
   */
  const refuseFromBackgroundScreen = useCallback(
    (action: string) => {
      if (isFocusedRef.current) return false

      // A second opinion, since the flag is only as good as the last commit that set
      // it, and refusing the screen the user is on leaves them with dead buttons. The
      // history needs no render to be current. Not the whole answer on its own: two
      // cards can show the same path.
      if (currentRoute.pathname === history.location.pathname) return false

      if (isDev) {
        console.warn(`navigation: ignored ${action} from a screen that is not on top`)
      }

      return true
    },
    [currentRoute.pathname, history, isFocusedRef]
  )

  // Native doesn't have useSearchParams out of the box like DOM
  const searchParams = useMemo(
    () => new URLSearchParams(currentRoute.search),
    [currentRoute.search]
  )

  const navigate = useCallback<UseNavigationReturnType['navigate']>(
    (to, options) => {
      if (refuseFromBackgroundScreen(`navigate to ${to}`)) return undefined

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
    [nav, currentRoute, refuseFromBackgroundScreen]
  )

  const goBack = useCallback(() => {
    if (refuseFromBackgroundScreen('goBack')) return

    nav(-1)
  }, [nav, refuseFromBackgroundScreen])

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

  // The real depth of the history, so back is offered only when there is an entry to
  // pop to. Read on every render, which `useLocation` above guarantees per navigation.
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

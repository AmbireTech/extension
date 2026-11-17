import { useCallback, useMemo } from 'react'
import { Subject } from 'rxjs'

import { isDev } from '@common/config/env'
import { runWhenScreenIsOnTop, useScreenFocusStore } from '@common/contexts/screenFocusContext'
import { useScreenLocation } from '@common/contexts/screenLocationContext'
import { goBackInStack } from '@common/services/navigation/stackBackNavigation'
import useRouterHistory from '@common/hooks/useRouterHistory'

import { TitleChangeEventStreamType, UseNavigationReturnType } from './types'

// Event stream that gets triggered when the title changes
export const titleChangeEventStream: TitleChangeEventStreamType = new Subject<string>()

/**
 * Nothing here subscribes to the router's location, which is what makes navigating
 * cheap: every interactive row on every mounted screen calls this hook, and both
 * `useLocation` and `useNavigate` (which reads it) would re-render all of them on
 * every navigation. The history navigates without a subscription, and the screen's
 * own route comes from `useScreenLocation`.
 */
const useNavigation = (): UseNavigationReturnType => {
  const history = useRouterHistory()
  const screenLocation = useScreenLocation()
  const screenFocus = useScreenFocusStore()
  const currentRoute = screenLocation?.location || history.location

  /**
   * Navigating is the business of the screen the user is on. Screens stay mounted
   * underneath it, so an effect on one further back would otherwise send the user
   * somewhere else or move a flow on a step too far. Refused (or deferred, see
   * `runWhenScreenIsOnTop`) here rather than at each call site, and read through a ref,
   * so losing focus re-renders nothing.
   */
  const runFromScreen = useCallback(
    (action: string, run: () => void) => {
      // A second opinion, since the flag is only as good as the last commit that set
      // it, and refusing the screen the user is on leaves them with dead buttons. The
      // history needs no render to be current. Not the whole answer on its own: two
      // cards can show the same path.
      if (currentRoute.pathname === history.location.pathname) {
        run()
        return
      }

      runWhenScreenIsOnTop(screenFocus, `navigation: ${action}`, run)
    },
    [currentRoute.pathname, history, screenFocus]
  )

  // Native doesn't have useSearchParams out of the box like DOM
  const searchParams = useMemo(
    () => new URLSearchParams(currentRoute.search),
    [currentRoute.search]
  )

  const navigate = useCallback<UseNavigationReturnType['navigate']>(
    (to, options) => {
      runFromScreen(`navigate to ${to}`, () => {
        // The signature supports a number for going back/forward, like react-router's
        if (typeof to === 'number') {
          history.go(to)
          return
        }

        let destination = to as string
        if (destination?.[0] !== '/') {
          destination = `/${destination}`
        }

        const state = { ...(options?.state || {}), prevRoute: currentRoute }

        if (options?.replace) {
          history.replace(destination, state)
        } else {
          history.push(destination, state)
        }
      })
    },
    [history, currentRoute, runFromScreen]
  )

  // One screen back, the way a swipe goes - not one history entry, as a screen can own
  // several (see `stackBackNavigation`). Android's back button and the back arrows use it.
  const goBack = useCallback(() => {
    runFromScreen('goBack', () => {
      if (!goBackInStack()) history.go(-1)
    })
  }, [history, runFromScreen])

  const setOptions = useCallback<UseNavigationReturnType['setOptions']>(({ headerTitle }) => {
    if (headerTitle) {
      // For mobile we can't set document.title, but we can trigger the internal event stream
      titleChangeEventStream?.next(headerTitle)
    }

    // All other options are not supported directly here
  }, [])

  // A stub: nothing on mobile routes on the search params, and the screens that write
  // them do it for the extension's port session. Reconstructing the search string and
  // replacing the url would be the way, if a mobile flow ever needs to read them back.
  const setSearchParams = useCallback<UseNavigationReturnType['setSearchParams']>(() => {
    if (isDev) console.warn('navigation: setSearchParams is a stub on mobile')
  }, [])

  // Whether there is a screen underneath to pop to, so back is offered only where it
  // leads somewhere. A screen's own answer, which is why it does not change when
  // something is pushed on top of it.
  const canGoBack = screenLocation ? screenLocation.canGoBack : history.index > 0

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

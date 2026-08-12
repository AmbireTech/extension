import { useContext, useEffect, useRef } from 'react'

import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext/controllersMiddlewareContext'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useShouldRenderRequestInPanel from '@common/hooks/useShouldRenderRequestInPanel'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ROUTES } from '@common/modules/router/constants/common'
import { getRouteForUserRequest } from '@common/modules/router/helpers'
import { getUiType } from '@common/utils/uiType'
import { getDappTabTargetsFromUserRequest } from '@web/utils/dispatchDappTabFocus'

const { isSidePanel } = getUiType()

const getRoutePathname = (route: string) => (route.split('?')[0] ?? route).replace(/^\//, '')

/**
 * In side-panel mode the action requests (sign transaction/message, dapp connect, switch
 * account, etc.) are rendered inside the always-visible panel instead of a separate
 * request window. The background skips opening the window (see RequestsController), so the
 * panel itself has to react to `currentUserRequest`: navigate to the matching action
 * screen when a request appears and back to the dashboard once it is resolved.
 *
 * Auto-navigation to an action screen only happens when a request becomes active (new id
 * or re-activated after dismiss) and when the panel is the surface that owns it (see
 * `useShouldRenderRequestInPanel`). This lets the user dismiss to the dashboard — e.g. via
 * "Start a batch" — without being pulled back to the sign screen while the request stays
 * queued.
 */
const useSidePanelActionRequestRouting = () => {
  const { navigate } = useNavigation()
  const { path } = useRoute()
  const { authStatus } = useAuth()
  const { dispatch } = useContext(ControllersMiddlewareContext)
  const shouldRenderRequestInPanel = useShouldRenderRequestInPanel()
  const keystoreState = useController('KeystoreController').state
  const {
    state: { currentUserRequest }
  } = useController('RequestsController')
  const transferState = useController('TransferController').state
  // Gated on every controller, because `getRouteForUserRequest` reads the transfer state,
  // which isn't part of any route's critical subset (`canRenderRoute`).
  const { areAllControllerStatesLoaded } = useContext(ControllersStateLoadedContext)

  const prevRequestIdRef = useRef<string | number | null>(null)
  const lastOpenedRequestIdRef = useRef<string | number | null>(null)
  const lastRequestRouteRef = useRef<string | null>(null)
  const lastDappTabTargetsRef = useRef<ReturnType<typeof getDappTabTargetsFromUserRequest>>([])

  useEffect(() => {
    if (!isSidePanel || !areAllControllerStatesLoaded) return

    const isLocked = keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked
    if (isLocked || authStatus === AUTH_STATUS.NOT_AUTHENTICATED) return

    if (currentUserRequest) {
      lastDappTabTargetsRef.current = getDappTabTargetsFromUserRequest(currentUserRequest)

      const activeRequestId = currentUserRequest.id
      const targetRoute = getRouteForUserRequest({ currentUserRequest, transferState })
      if (!targetRoute) return

      const targetPath = getRoutePathname(targetRoute)
      const currentPath = getRoutePathname(path)
      const requestJustActivated = prevRequestIdRef.current === null
      const isDifferentRequest = activeRequestId !== lastOpenedRequestIdRef.current

      if (shouldRenderRequestInPanel && (requestJustActivated || isDifferentRequest)) {
        lastOpenedRequestIdRef.current = activeRequestId
        lastRequestRouteRef.current = targetPath
        if (currentPath !== targetPath) navigate(targetRoute)
      }

      // Track the request route whenever the panel actually shows it, including when it got there
      // some other way, so it can return to the dashboard once the request is gone.
      if (currentPath === targetPath) lastRequestRouteRef.current = targetPath

      prevRequestIdRef.current = activeRequestId
      return
    }

    if (prevRequestIdRef.current !== null) {
      // Only relevant when the panel was the surface showing the request
      if (lastRequestRouteRef.current) {
        if (getRoutePathname(path) === lastRequestRouteRef.current) navigate(ROUTES.dashboard)

        // Mirror mobile: after the in-panel request UI closes, nudge the dapp tab with a
        // synthetic focus so libraries like React Query refetch connection state.
        dispatch({
          type: 'DISPATCH_DAPP_TAB_FOCUS',
          params: { targets: lastDappTabTargetsRef.current, delayMs: 800 }
        })
      }

      lastDappTabTargetsRef.current = []
      lastOpenedRequestIdRef.current = null
      lastRequestRouteRef.current = null
    }

    prevRequestIdRef.current = null
  }, [
    areAllControllerStatesLoaded,
    authStatus,
    currentUserRequest,
    keystoreState.isReadyToStoreKeys,
    keystoreState.isUnlocked,
    navigate,
    path,
    shouldRenderRequestInPanel,
    transferState,
    dispatch
  ])
}

export default useSidePanelActionRequestRouting

import { useContext, useEffect } from 'react'

import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext/controllersMiddlewareContext'
import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import useController from '@common/hooks/useController'
import useShouldRenderRequestInPanel from '@common/hooks/useShouldRenderRequestInPanel'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { getUiType } from '@common/utils/uiType'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import { getIsUserRequestForPanelWindow } from '@web/utils/dispatchDappTabFocus'

const { isRequestWindow } = getUiType()

const useCurrentActionSideEffects = () => {
  const { authStatus } = useAuth()
  const keystoreState = useController('KeystoreController').state
  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const { areAllControllerStatesLoaded } = useContext(ControllersStateLoadedContext)
  const shouldRenderRequestInPanel = useShouldRenderRequestInPanel()
  const { windowId: panelWindowId } = useContext(ControllersMiddlewareContext)

  useEffect(() => {
    if (!areAllControllerStatesLoaded) return

    if (
      (keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked) ||
      authStatus === AUTH_STATUS.NOT_AUTHENTICATED
    )
      return

    // The view that renders requests resolves the unlock request once the wallet is unlocked - the
    // request window, or the side panel when it is open, as then no request window is opened.
    // Otherwise the request stays pending, with no screen to open it on. With panels open in
    // several windows, only the one of the app's window does it.
    const isRequestSurface =
      isRequestWindow ||
      (shouldRenderRequestInPanel &&
        getIsUserRequestForPanelWindow(currentUserRequest, panelWindowId))

    if (isRequestSurface && currentUserRequest) {
      if (currentUserRequest.kind === 'unlock') {
        requestsDispatch({
          type: 'method',
          params: {
            method: 'resolveUserRequest',
            args: [null, currentUserRequest.id]
          }
        })
      }
    }
  }, [
    currentUserRequest,
    areAllControllerStatesLoaded,
    authStatus,
    requestsDispatch,
    keystoreState.isReadyToStoreKeys,
    keystoreState.isUnlocked,
    shouldRenderRequestInPanel,
    panelWindowId
  ])

  useEffect(() => {
    if (!areAllControllerStatesLoaded) return

    const timeoutId = setTimeout(() => {
      if (isRequestWindow && !currentUserRequest) closeCurrentWindow()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [currentUserRequest, areAllControllerStatesLoaded])
}

export default useCurrentActionSideEffects

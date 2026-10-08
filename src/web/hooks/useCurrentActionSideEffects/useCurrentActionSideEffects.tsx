import { useContext, useEffect } from 'react'

import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import useController from '@common/hooks/useController'
import useShouldRenderRequestInPanel from '@common/hooks/useShouldRenderRequestInPanel'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { getUiType } from '@common/utils/uiType'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'

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

  useEffect(() => {
    if (!areAllControllerStatesLoaded) return

    if (
      (keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked) ||
      authStatus === AUTH_STATUS.NOT_AUTHENTICATED
    )
      return

    // The view that renders requests resolves the unlock request once the wallet is unlocked - the
    // request window, or the side panel when it is open, as then no request window is opened.
    // Otherwise the request stays pending, with no screen to open it on.
    const isRequestSurface = isRequestWindow || shouldRenderRequestInPanel

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
    shouldRenderRequestInPanel
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

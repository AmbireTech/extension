import { useContext, useEffect } from 'react'

import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ControllersStateLoadedContext } from '@web/contexts/controllersStateLoadedContext'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import { getUiType } from '@web/utils/uiType'

const { isRequestWindow } = getUiType()

const useCurrentActionSideEffects = () => {
  const { authStatus } = useAuth()
  const { dispatch } = useControllersMiddleware()
  const keystoreState = useController('KeystoreController').state
  const { currentUserRequest } = useRequestsControllerState()
  const { areControllerStatesLoaded } = useContext(ControllersStateLoadedContext)

  useEffect(() => {
    if (!areControllerStatesLoaded) return

    if (
      (keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked) ||
      authStatus === AUTH_STATUS.NOT_AUTHENTICATED
    )
      return

    if (isRequestWindow && currentUserRequest) {
      if (currentUserRequest.kind === 'unlock') {
        dispatch({
          type: 'REQUESTS_CONTROLLER_RESOLVE_USER_REQUEST',
          params: { data: null, id: currentUserRequest.id }
        })
      }
    }
  }, [
    currentUserRequest,
    areControllerStatesLoaded,
    authStatus,
    dispatch,
    keystoreState.isReadyToStoreKeys,
    keystoreState.isUnlocked
  ])

  useEffect(() => {
    if (!areControllerStatesLoaded) return

    const timeoutId = setTimeout(() => {
      if (isRequestWindow && !currentUserRequest) closeCurrentWindow()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [currentUserRequest, areControllerStatesLoaded])
}

export default useCurrentActionSideEffects

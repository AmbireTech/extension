import { useContext, useEffect } from 'react'

import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ControllersStateLoadedContext } from '@web/contexts/controllersStateLoadedContext'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import { getUiType } from '@web/utils/uiType'

const { isActionWindow } = getUiType()

const useCurrentActionSideEffects = () => {
  const { authStatus } = useAuth()
  const { dispatch } = useBackgroundService()
  const keystoreState = useKeystoreControllerState()
  const { currentUserRequest } = useRequestsControllerState()
  const { areControllerStatesLoaded } = useContext(ControllersStateLoadedContext)

  useEffect(() => {
    if (!areControllerStatesLoaded) return

    if (
      (keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked) ||
      authStatus === AUTH_STATUS.NOT_AUTHENTICATED
    )
      return

    if (isActionWindow && currentUserRequest) {
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
      if (isActionWindow && !currentUserRequest) closeCurrentWindow()
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [currentUserRequest, areControllerStatesLoaded])
}

export default useCurrentActionSideEffects

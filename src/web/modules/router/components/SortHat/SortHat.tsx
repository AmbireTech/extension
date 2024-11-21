import React, { useCallback, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import { INVITE_STATUS } from '@ambire-common/controllers/invite/invite'
import { getBenzinUrlParams } from '@benzin/screens/BenzinScreen/utils/url'
import Spinner from '@common/components/Spinner'
import useNavigation from '@common/hooks/useNavigation'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useInviteControllerState from '@web/hooks/useInviteControllerState'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import { getUiType } from '@web/utils/uiType'

const SortHat = () => {
  const { authStatus } = useAuth()
  const { inviteStatus } = useInviteControllerState()
  const { navigate } = useNavigation()
  const { isActionWindow } = getUiType()
  const keystoreState = useKeystoreControllerState()
  const actionsState = useActionsControllerState()
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    setTimeout(() => {
      if (isActionWindow && !actionsState.currentAction) closeCurrentWindow()
    }, 1500)
  }, [isActionWindow, actionsState.currentAction])

  const loadView = useCallback(async () => {
    if (keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked) {
      return navigate(ROUTES.keyStoreUnlock)
    }

    if (inviteStatus !== INVITE_STATUS.VERIFIED) {
      return navigate(ROUTES.inviteVerify)
    }

    if (authStatus === AUTH_STATUS.NOT_AUTHENTICATED) {
      return navigate(ROUTES.getStarted)
    }

    if (isActionWindow && actionsState.currentAction) {
      const actionType = actionsState.currentAction.type
      if (actionType === 'dappRequest') {
        const action = actionsState.currentAction
        if (action.userRequest.action.kind === 'unlock') {
          dispatch({
            type: 'MAIN_CONTROLLER_RESOLVE_USER_REQUEST',
            params: { data: null, id: actionsState.currentAction.id }
          })
        }
        if (action.userRequest.action.kind === 'dappConnect') {
          return navigate(ROUTES.dappConnectRequest)
        }
        if (action.userRequest.action.kind === 'walletAddEthereumChain') {
          return navigate(ROUTES.addChain)
        }
        if (action.userRequest.action.kind === 'walletWatchAsset') {
          return navigate(ROUTES.watchAsset)
        }
        if (action.userRequest.action.kind === 'ethGetEncryptionPublicKey') {
          return navigate(ROUTES.getEncryptionPublicKeyRequest)
        }
      }
      if (actionType === 'accountOp') return navigate(ROUTES.signAccountOp)

      if (actionType === 'signMessage') return navigate(ROUTES.signMessage)

      if (actionType === 'benzin') {
        const benzinAction = actionsState.currentAction
        const link =
          ROUTES.benzin +
          getBenzinUrlParams({
            chainId: benzinAction.userRequest.meta?.chainId,
            isInternal: true,
            txnId: benzinAction.userRequest.meta?.txnId, // can be undefined
            identifiedBy: benzinAction.userRequest.meta?.identifiedBy
          })
        return navigate(link)
      }
    } else {
      // TODO: Always redirects to Dashboard, which for initial extension load is okay, but
      // for other scenarios, ideally, it should be the last route before the keystore got locked.
      navigate(ROUTES.dashboard)
    }
  }, [
    isActionWindow,
    actionsState.currentAction,
    authStatus,
    keystoreState,
    inviteStatus,
    navigate,
    dispatch
  ])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    loadView()
  }, [loadView])

  return (
    <View style={[StyleSheet.absoluteFill, flexbox.center]}>
      <Spinner />
    </View>
  )
}

export default React.memo(SortHat)

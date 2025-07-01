import React, { useCallback, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import Spinner from '@common/components/Spinner'
import useNavigation from '@common/hooks/useNavigation'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import useTransferControllerState from '@web/hooks/useTransferControllerState'
import { getUiType } from '@web/utils/uiType'

const SortHat = () => {
  const { authStatus } = useAuth()
  const { navigate } = useNavigation()
  const swapAndBridgeState = useSwapAndBridgeControllerState()
  const { state: transferState } = useTransferControllerState()
  const { isActionWindow } = getUiType()
  const keystoreState = useKeystoreControllerState()
  const actionsState = useActionsControllerState()
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    setTimeout(() => {
      if (isActionWindow && !actionsState.currentAction) closeCurrentWindow()
    }, 1000)
  }, [isActionWindow, actionsState.currentAction])

  const loadView = useCallback(async () => {
    if (keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked) {
      return navigate(ROUTES.keyStoreUnlock)
    }

    if (authStatus === AUTH_STATUS.NOT_AUTHENTICATED) {
      return navigate(WEB_ROUTES.getStarted)
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

      if (actionType === 'swapAndBridge') return navigate(ROUTES.swapAndBridge)

      // TODO: This navigation occurs when signing with Trezor.
      // Currently, Gas Top-Ups are not supported by Trezor.
      // Once support is added, we need to introduce a new actionType specifically for Top-Up.
      if (actionType === 'transfer') return navigate(ROUTES.transfer)

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

      if (actionType === 'switchAccount') return navigate(WEB_ROUTES.switchAccount)
    } else if (!isActionWindow) {
      // TODO: Always redirects to Dashboard, which for initial extension load is okay, but
      // for other scenarios, ideally, it should be the last route before the keystore got locked.
      const hasSwapAndBridgePersistentSession = swapAndBridgeState.sessionIds.some(
        (id) => id === 'popup' || id === 'action-window'
      )

      if (hasSwapAndBridgePersistentSession) {
        navigate(ROUTES.swapAndBridge)
      } else if (transferState?.hasPersistedState) {
        if (transferState.isTopUp) {
          navigate(ROUTES.topUpGasTank, {
            state: { backTo: WEB_ROUTES.dashboard }
          })
        } else {
          navigate(ROUTES.transfer, {
            state: { backTo: WEB_ROUTES.dashboard }
          })
        }
      } else {
        navigate(ROUTES.dashboard)
      }
    }
  }, [
    keystoreState.isReadyToStoreKeys,
    keystoreState.isUnlocked,
    authStatus,
    isActionWindow,
    actionsState.currentAction,
    navigate,
    dispatch,
    swapAndBridgeState.sessionIds,
    transferState?.hasPersistedState,
    transferState?.isTopUp
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

import React, { useCallback, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import { AccountOpAction } from '@ambire-common/controllers/actions/actions'
import Spinner from '@common/components/Spinner'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'
import { getUiType } from '@web/utils/uiType'

const SortHat = () => {
  const { authStatus } = useAuth()
  const { navigate } = useNavigation()
  const { isActionWindow } = getUiType()
  const keystoreState = useKeystoreControllerState()
  const actionsState = useActionsControllerState()
  const mainState = useMainControllerState()
  const { params } = useRoute()
  const { dispatch } = useBackgroundService()
  const { networks } = useSettingsControllerState()

  const loadView = useCallback(async () => {
    if (isActionWindow && !actionsState.currentAction) {
      window.close()
      return
    }

    if (keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked) {
      return navigate(ROUTES.keyStoreUnlock)
    }

    if (authStatus === AUTH_STATUS.NOT_AUTHENTICATED) {
      return navigate(ROUTES.getStarted)
    }

    if (isActionWindow && actionsState.currentAction) {
      const actionType = actionsState.currentAction.type
      if (actionType === 'unlock') {
        dispatch({
          type: 'MAIN_CONTROLLER_RESOLVE_USER_REQUEST',
          params: { data: null, id: actionsState.currentAction.id }
        })
      }
      if (actionType === 'dappConnect') {
        return navigate(ROUTES.dappConnectRequest)
      }
      if (actionType === 'walletAddEthereumChain') {
        return navigate(ROUTES.addChain)
      }
      if (actionType === 'accountOp') {
        const accountOpAction = actionsState.currentAction as AccountOpAction

        const accountAddr = accountOpAction.accountOp.accountAddr
        const network = networks.filter((n) => n.id === accountOpAction.accountOp.networkId)[0]

        return navigate(ROUTES.signAccountOp, { state: { accountAddr, network } })
      }
      if (actionType === 'signMessage') {
        return navigate(ROUTES.signMessage, {
          state: {
            accountAddr:
              mainState.messagesToBeSigned[mainState.selectedAccount as string]?.accountAddr
          }
        })
      }

      if (actionType === 'walletWatchAsset') {
        return navigate(ROUTES.watchAsset)
      }
      if (actionType === 'ethGetEncryptionPublicKey') {
        return navigate(ROUTES.getEncryptionPublicKeyRequest)
      }
      if (actionType === 'benzin') {
        // if userOpHash and custom network, close the window
        // as jiffyscan may not support the network
        // TODO:
        // const isCustomNetwork = !predefinedNetworks.find(
        //   (net) => net.id === actionsState.currentNotificationRequest?.meta?.networkId
        // )
        // if (actionsState.currentNotificationRequest?.meta?.userOpHash && isCustomNetwork) {
        //   window.close()
        //   return
        // }
        // let link = `${ROUTES.benzin}?networkId=${actionsState.currentNotificationRequest?.meta?.networkId}&isInternal`
        // if (actionsState.currentNotificationRequest?.meta?.txnId) {
        //   link += `&txnId=${actionsState.currentNotificationRequest?.meta?.txnId}`
        // }
        // if (actionsState.currentNotificationRequest?.meta?.userOpHash) {
        //   link += `&userOpHash=${actionsState.currentNotificationRequest?.meta?.userOpHash}`
        // }
        // return navigate(link)
      }
    } else if (params?.openOnboardingCompleted) {
      navigate(ROUTES.onboardingCompleted, { state: { validSession: true } })
    } else {
      navigate(ROUTES.dashboard)
    }
  }, [
    params?.openOnboardingCompleted,
    isActionWindow,
    actionsState.currentAction,
    authStatus,
    keystoreState,
    mainState.selectedAccount,
    mainState.messagesToBeSigned,
    networks,
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

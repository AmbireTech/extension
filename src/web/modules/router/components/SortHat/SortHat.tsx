import { getAddress } from 'ethers'
import React, { useCallback, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import { networks } from '@ambire-common/consts/networks'
import Spinner from '@common/components/Spinner'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useNotificationControllerState from '@web/hooks/useNotificationControllerState'
import { getUiType } from '@web/utils/uiType'

const SortHat = () => {
  const { authStatus } = useAuth()
  const { navigate } = useNavigation()
  const { isNotification } = getUiType()
  const keystoreState = useKeystoreControllerState()
  const notificationState = useNotificationControllerState()
  const mainState = useMainControllerState()
  const { params } = useRoute()

  const loadView = useCallback(async () => {
    if (isNotification && !notificationState.currentNotificationRequest) {
      window.close()
      return
    }

    if (keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked) {
      return navigate(ROUTES.keyStoreUnlock)
    }

    if (authStatus === AUTH_STATUS.NOT_AUTHENTICATED) {
      return navigate(ROUTES.getStarted)
    }

    if (isNotification && notificationState.currentNotificationRequest) {
      if (notificationState.currentNotificationRequest?.screen === 'DappConnectRequest') {
        return navigate(ROUTES.dappConnectRequest)
      }
      if (notificationState.currentNotificationRequest?.screen === 'AddChain') {
        return navigate(ROUTES.addChain)
      }
      if (notificationState.currentNotificationRequest?.screen === 'SendTransaction') {
        if (
          mainState.userRequests.find(
            (req) => req.id === notificationState.currentNotificationRequest?.id
          )
        ) {
          const accountAddr = notificationState.currentNotificationRequest?.accountAddr
          const network = networks.find(
            (n) => n.id === notificationState.currentNotificationRequest?.networkId
          )

          if (accountAddr && network) {
            return navigate(ROUTES.signAccountOp, {
              state: {
                accountAddr: getAddress(accountAddr),
                network
              }
            })
          }
          // TODO: add here some error handling and dispatch dapp request removal
        }
      }
      if (
        ['SignText', 'SignTypedData'].includes(notificationState.currentNotificationRequest?.screen)
      ) {
        let accountAddr = mainState.selectedAccount

        if (
          notificationState.currentNotificationRequest?.screen === 'SignText' &&
          notificationState.currentNotificationRequest?.params?.data[1]
        ) {
          accountAddr = notificationState.currentNotificationRequest?.params?.data[1]
        }
        if (
          notificationState.currentNotificationRequest?.screen === 'SignTypedData' &&
          notificationState.currentNotificationRequest?.params?.data[0]
        ) {
          accountAddr = notificationState.currentNotificationRequest?.params?.data[0]
        }

        return navigate(ROUTES.signMessage, {
          state: {
            accountAddr: accountAddr ? getAddress(accountAddr) : accountAddr
          }
        })
      }

      if (notificationState.currentNotificationRequest?.screen === 'WalletWatchAsset') {
        return navigate(ROUTES.watchAsset)
      }
      if (notificationState.currentNotificationRequest?.screen === 'GetEncryptionPublicKey') {
        return navigate(ROUTES.getEncryptionPublicKeyRequest)
      }
      if (notificationState.currentNotificationRequest?.screen === 'Benzin') {
        let link = `${ROUTES.benzin}?networkId=${notificationState.currentNotificationRequest.params.networkId}&isInternal`

        if (notificationState.currentNotificationRequest?.params?.txnId) {
          link += `&txnId=${notificationState.currentNotificationRequest?.params?.txnId}`
        }

        if (notificationState.currentNotificationRequest?.params?.userOpHash) {
          link += `&userOpHash=${notificationState.currentNotificationRequest?.params?.userOpHash}`
        }

        return navigate(link)
      }
    } else if (params?.openOnboardingCompleted) {
      navigate(ROUTES.onboardingCompleted, { state: { validSession: true } })
    } else {
      navigate(ROUTES.dashboard)
    }
  }, [
    params?.openOnboardingCompleted,
    isNotification,
    notificationState.currentNotificationRequest,
    authStatus,
    navigate,
    keystoreState,
    mainState.selectedAccount,
    mainState.userRequests
  ])

  useEffect(() => {
    loadView()
  }, [loadView])

  return (
    <View style={[StyleSheet.absoluteFill, flexbox.center]}>
      <Spinner />
    </View>
  )
}

export default SortHat

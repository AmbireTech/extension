import { networks } from 'ambire-common/src/consts/networks'
import { toChecksumAddress } from 'ethereumjs-util'
import React, { useCallback, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import Spinner from '@common/components/Spinner'
import useNavigation from '@common/hooks/useNavigation'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'
import permission from '@web/extension-services/background/services/permission'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useNotificationControllerState from '@web/hooks/useNotificationControllerState'
import { ONBOARDING_VALUES } from '@web/modules/onboarding/contexts/onboardingContext/types'
import useOnboarding from '@web/modules/onboarding/hooks/useOnboarding'
import { getUiType } from '@web/utils/uiType'

const SortHat = () => {
  const { authStatus } = useAuth()
  const { navigate } = useNavigation()
  const { isNotification } = getUiType()
  const { onboardingStatus } = useOnboarding()
  const keystoreState = useKeystoreControllerState()
  const notificationState = useNotificationControllerState()
  const mainState = useMainControllerState()
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
      if (notificationState.currentNotificationRequest?.screen === 'PermissionRequest') {
        return navigate(ROUTES.permissionRequest)
      }
      if (notificationState.currentNotificationRequest?.screen === 'SendTransaction') {
        let accountAddr = mainState.selectedAccount
        if (notificationState.currentNotificationRequest?.params?.data?.[0]?.from) {
          accountAddr = notificationState.currentNotificationRequest.params.data[0].from
        }

        await permission.init()
        const chainId = Number(
          permission.getConnectedSite(
            notificationState.currentNotificationRequest.params.session.origin
          )?.chainId
        )
        const network = networks.find((n) => Number(n.chainId) === chainId)

        if (accountAddr && network) {
          return navigate(ROUTES.signAccountOp, {
            state: {
              accountAddr: toChecksumAddress(accountAddr as string),
              network
            }
          })
        }
        // TODO: add here some error handling and dispatch dapp request removal
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
            accountAddr: toChecksumAddress(accountAddr as string)
          }
        })
      }

      if (notificationState.currentNotificationRequest?.screen === 'WalletWatchAsset') {
        return navigate(ROUTES.watchAsset)
      }
      if (notificationState.currentNotificationRequest?.screen === 'GetEncryptionPublicKey') {
        return navigate(ROUTES.getEncryptionPublicKeyRequest)
      }
    } else {
      navigate(
        onboardingStatus === ONBOARDING_VALUES.ON_BOARDED ? ROUTES.dashboard : ROUTES.onboarding
      )
    }
  }, [
    isNotification,
    notificationState.currentNotificationRequest,
    authStatus,
    navigate,
    onboardingStatus,
    keystoreState,
    mainState.selectedAccount
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

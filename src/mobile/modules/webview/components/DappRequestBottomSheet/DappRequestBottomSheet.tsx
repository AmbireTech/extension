import React, { useMemo } from 'react'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { UserRequest } from '@ambire-common/interfaces/userRequest'
import BottomSheet from '@common/components/BottomSheet'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import BenzinScreen from '@mobile/modules/action-requests/screens/BenzinScreen'
import DappConnectScreen from '@mobile/modules/action-requests/screens/DappConnectScreen'
import SignAccountOpScreen from '@mobile/modules/sign-account-op/screens/SignAccountOpScreen'
import AddOrUpdateNetworkScreen from '@web/modules/action-requests/screens/AddOrUpdateNetworkScreen'
import DecryptRequestScreen from '@web/modules/action-requests/screens/DecryptRequestScreen'
import GetEncryptionPublicKeyRequestScreen from '@web/modules/action-requests/screens/GetEncryptionPublicKeyRequestScreen'
import SwitchAccountScreen from '@web/modules/action-requests/screens/SwitchAccountScreen'
import WatchTokenRequestScreen from '@web/modules/action-requests/screens/WatchTokenRequestScreen'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  onClosed?: () => void
}

/**
 * Renders the appropriate action request screen based on the currentUserRequest kind.
 * Each screen is wrapped in a container that adapts it for bottom sheet display.
 */
const DappRequestBottomSheet: React.FC<Props> = ({ sheetRef, closeBottomSheet, onClosed }) => {
  const {
    state: { currentUserRequest }
  } = useController('RequestsController')

  const requestContent = useMemo(() => {
    if (!currentUserRequest) return null

    const requestKind = currentUserRequest.kind

    switch (requestKind) {
      case 'dappConnect':
        return <DappConnectScreen />

      case 'calls':
        return <SignAccountOpScreen />

      case 'walletAddEthereumChain':
        return <AddOrUpdateNetworkScreen />

      case 'walletWatchAsset':
        return <WatchTokenRequestScreen />

      case 'ethGetEncryptionPublicKey':
        return <GetEncryptionPublicKeyRequestScreen />

      case 'ethDecrypt':
        return <DecryptRequestScreen />

      case 'switchAccount':
        return <SwitchAccountScreen />

      case 'message':
      case 'typedMessage':
      case 'siwe':
      case 'authorization-7702':
        // For now, these will fall through to default since SignMessageScreen
        // needs a mobile equivalent. We navigate to full screen for these.
        return null

      case 'benzin':
        return <BenzinScreen />

      case 'swapAndBridge':
      case 'transfer':
        // These are handled by their own modules and navigation
        return null

      default:
        return null
    }
  }, [currentUserRequest])

  // Only show the bottom sheet if we have a supported request type
  const hasSupportedRequest = useMemo(() => {
    if (!currentUserRequest) return false

    const supportedKinds: UserRequest['kind'][] = [
      'dappConnect',
      'calls',
      'walletAddEthereumChain',
      'walletWatchAsset',
      'ethGetEncryptionPublicKey',
      'ethDecrypt',
      'switchAccount',
      'benzin'
    ]

    return supportedKinds.includes(currentUserRequest.kind)
  }, [currentUserRequest])

  return (
    <BottomSheet
      id="dapp-request-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={onClosed}
      adjustToContentHeight={false}
      isScrollEnabled={false}
      containerInnerWrapperStyles={flexbox.flex1}
      customRenderer={requestContent}
      style={spacings.ph0}
    />
  )
}

export default React.memo(DappRequestBottomSheet)

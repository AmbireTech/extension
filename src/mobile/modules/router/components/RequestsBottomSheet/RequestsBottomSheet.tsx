import React, { useMemo } from 'react'
import { Modalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import AddOrUpdateNetworkScreen from '@mobile/modules/action-requests/screens/AddOrUpdateNetworkScreen'
import BenzinScreen from '@mobile/modules/action-requests/screens/BenzinScreen'
import DappConnectScreen from '@mobile/modules/action-requests/screens/DappConnectScreen'
import DecryptRequestScreen from '@mobile/modules/action-requests/screens/DecryptRequestScreen'
import GetEncryptionPublicKeyRequestScreen from '@mobile/modules/action-requests/screens/GetEncryptionPublicKeyRequestScreen'
import SwitchAccountScreen from '@mobile/modules/action-requests/screens/SwitchAccountScreen'
import WatchTokenRequestScreen from '@mobile/modules/action-requests/screens/WatchTokenRequestScreen'
import SignAccountOpScreen from '@mobile/modules/sign-account-op/screens/SignAccountOpScreen'
import SignMessageScreen from '@mobile/modules/sign-message/screens/SignMessageScreen'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  onClosed?: () => void
  onOpened?: () => void
}

/**
 * Renders the appropriate action request screen based on the currentUserRequest kind.
 * Each screen is wrapped in a container that adapts it for bottom sheet display.
 */
const RequestsBottomSheet: React.FC<Props> = ({ sheetRef, closeBottomSheet, onClosed, onOpened }) => {
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
        return <SignMessageScreen />

      case 'benzin':
        return <BenzinScreen />

      default:
        return null
    }
  }, [currentUserRequest])

  return (
    <BottomSheet
      id="requests-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={onClosed}
      onOpened={onOpened}
      adjustToContentHeight={false}
      shouldBeClosableOnDrag={false}
      isScrollEnabled={false}
      containerInnerWrapperStyles={flexbox.flex1}
      customRenderer={requestContent}
      style={spacings.ph0}
    />
  )
}

export default React.memo(RequestsBottomSheet)

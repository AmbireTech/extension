import React, { useMemo } from 'react'

import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import type { SheetRef } from '@common/components/BottomSheet/useSheetRef'
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
  sheetRef: React.RefObject<SheetRef | null>
  onClosed?: () => void
  onOpened?: () => void
}

/**
 * Renders the appropriate action request screen based on the currentUserRequest kind.
 * Each screen is wrapped in a container that adapts it for bottom sheet display.
 */
const RequestsBottomSheet: React.FC<Props> = ({ sheetRef, onClosed, onOpened }) => {
  const { state: currentUserRequest, closeRequestModal } = useController(
    'RequestsController',
    'currentUserRequest'
  )

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
  // Without a screen there are no buttons to reject or approve with, so the X or a swipe closes it
  const isEmpty = !requestContent

  return (
    <BottomSheet
      id="requests-bottom-sheet"
      sheetRef={sheetRef}
      onClosed={onClosed}
      onOpened={onOpened}
      adjustToContentHeight={false}
      shouldBeClosableOnDrag={isEmpty}
      // Otherwise no `closeBottomSheet`, so the user has to reject or approve the request
      // using the buttons
      closeBottomSheet={isEmpty ? closeRequestModal || undefined : undefined}
      isScrollEnabled={false}
      containerInnerWrapperStyles={flexbox.flex1}
      // An empty header row still draws the X
      customRenderer={requestContent || <ModalHeader />}
      style={spacings.ph0}
    />
  )
}

export default React.memo(RequestsBottomSheet)

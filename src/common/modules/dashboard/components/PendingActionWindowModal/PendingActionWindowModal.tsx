import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import PendingActionWindowIcon from '@common/assets/svg/PendingActionWindowIcon'
import BottomSheet from '@common/components/BottomSheet'
import DualChoiceModal from '@common/components/DualChoiceModal'
import spacings from '@common/styles/spacings'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import { getUiType } from '@web/utils/uiType'

const isPopup = getUiType().isPopup

const PendingActionWindowModal = () => {
  const { ref: sheetRef, close: closeBottomSheet } = useModalize()
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { requestWindow, currentUserRequest } = useRequestsControllerState()
  const onPrimaryButtonPress = useCallback(() => {
    dispatch({ type: 'REQUESTS_CONTROLLER_FOCUS_REQUEST_WINDOW' })
  }, [dispatch])

  const title = useMemo(() => {
    if (!currentUserRequest) return null

    if (currentUserRequest.kind === 'calls') return t('Finish your pending transaction(s)')
    if (
      currentUserRequest.kind === 'message' ||
      currentUserRequest.kind === 'typedMessage' ||
      currentUserRequest.kind === 'siwe' ||
      currentUserRequest.kind === 'authorization-7702'
    )
      return t('Finish your pending message signature')
    if (currentUserRequest.kind === 'switchAccount') return t('Finish switching accounts')

    if (currentUserRequest.kind === 'dappConnect') return t('Finish connecting to an app')
    if (currentUserRequest.kind === 'walletAddEthereumChain')
      return t('Finish adding a new network')
    if (currentUserRequest.kind === 'walletWatchAsset') return t('Finish adding a new token')

    return null
  }, [currentUserRequest, t])

  const description = useMemo(() => {
    if (!currentUserRequest) return null

    if (currentUserRequest.kind === 'calls')
      return t(
        'One or more transactions are waiting for you to sign them. Would you like to open the active window?'
      )
    if (
      currentUserRequest.kind === 'message' ||
      currentUserRequest.kind === 'typedMessage' ||
      currentUserRequest.kind === 'siwe' ||
      currentUserRequest.kind === 'authorization-7702'
    )
      return t(
        'There is a message waiting for you to sign it. Would you like to open the active window?'
      )
    if (currentUserRequest.kind === 'switchAccount')
      return t(
        'You started switching accounts and never finished. Would you like to open the active window?'
      )

    if (currentUserRequest.kind === 'dappConnect')
      return t(
        'An app is waiting for you to connect to it. Would you like to open the active window?'
      )
    if (currentUserRequest.kind === 'walletAddEthereumChain')
      return t(
        'You started adding a new network and never finished. Would you like to open the active window?'
      )
    if (currentUserRequest.kind === 'walletWatchAsset')
      return t(
        'You started adding a new token and never finished. Would you like to open the active window?'
      )

    return null
  }, [currentUserRequest, t])

  if (
    isPopup &&
    requestWindow.windowProps &&
    currentUserRequest &&
    !['benzin', 'unlock'].includes(currentUserRequest.kind) &&
    title &&
    description
  ) {
    return (
      <BottomSheet
        id="import-seed-phrase"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        backgroundColor="secondaryBackground"
        style={{ overflow: 'hidden', width: 496, ...spacings.ph0, ...spacings.pv0 }}
        type="modal"
        autoOpen
      >
        <DualChoiceModal
          title={title}
          description={description}
          Icon={PendingActionWindowIcon}
          primaryButtonText={t('Open Active Window')}
          onPrimaryButtonPress={onPrimaryButtonPress}
          onCloseIconPress={closeBottomSheet}
        />
      </BottomSheet>
    )
  }

  return null
}

export default React.memo(PendingActionWindowModal)

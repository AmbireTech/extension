import React, { Suspense, useCallback, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { getAccountOpNonce } from '@ambire-common/libs/accountOp/accountOp'
import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import {
  canReplacePendingAccountOp,
  getReplacementBuildRequest,
  getSafeCancellationAccountOp,
  getSpeedUpAccountOp
} from '@common/modules/sign-account-op/helpers/replacementAccountOps'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import PendingAccountOpCalls from './lazyPendingAccountOpCalls'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  style?: ViewStyle
}

const selectAccountOp = (state: AllControllersMappingType['SignAccountOpController']) =>
  state?.accountOp
const selectIsSafeAccount = (state: AllControllersMappingType['SignAccountOpController']) =>
  !!state?.account.safeCreation
const selectBroadcastedButNotConfirmed = (
  state: AllControllersMappingType['ActivityController']
) => state.broadcastedButNotConfirmed

/**
 * Lets the user know that the Safe transaction being signed is queued after one that was already
 * sent but isn't confirmed yet, and offers to speed up or cancel that pending transaction.
 */
const PendingSafeTransaction = ({ style }: Props) => {
  const { t } = useTranslation()
  const { isCompactLayout } = useCompactLayout()
  const [shouldRenderCalls, setShouldRenderCalls] = useState(false)
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { state: accountOp } = useController('SignAccountOpController', selectAccountOp)
  const { state: isSafeAccount } = useController('SignAccountOpController', selectIsSafeAccount)
  const { state: broadcastedButNotConfirmed } = useController(
    'ActivityController',
    selectBroadcastedButNotConfirmed
  )
  const { dispatch: requestsDispatch } = useController('RequestsController')

  // The earliest pending transaction is the one holding back every transaction after it
  const pendingAccountOp = useMemo(() => {
    if (!isSafeAccount || !accountOp) return null

    const currentNonce = getAccountOpNonce(accountOp)
    if (currentNonce === null) return null

    return (broadcastedButNotConfirmed?.[accountOp.accountAddr] || []).reduce<
      SubmittedAccountOp | null
    >((earliest, submittedAccountOp) => {
      if (
        submittedAccountOp.chainId !== accountOp.chainId ||
        submittedAccountOp.nonce === null ||
        submittedAccountOp.nonce >= currentNonce
      )
        return earliest

      return !earliest || earliest.nonce === null || submittedAccountOp.nonce < earliest.nonce
        ? submittedAccountOp
        : earliest
    }, null)
  }, [accountOp, broadcastedButNotConfirmed, isSafeAccount])

  const canReplace = !!pendingAccountOp && canReplacePendingAccountOp(pendingAccountOp)

  const handleSheetOpen = useCallback(() => setShouldRenderCalls(true), [])
  const handleSheetClosed = useCallback(() => setShouldRenderCalls(false), [])
  const handleClose = useCallback(() => closeBottomSheet(), [closeBottomSheet])
  const alertButtonProps = useMemo(
    () => ({ text: t('View pending transaction'), onPress: () => openBottomSheet() }),
    [openBottomSheet, t]
  )

  const handleSpeedUp = useCallback(() => {
    if (!pendingAccountOp || !canReplacePendingAccountOp(pendingAccountOp)) return

    closeBottomSheet()
    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [getReplacementBuildRequest(getSpeedUpAccountOp(pendingAccountOp))]
      }
    })
  }, [closeBottomSheet, pendingAccountOp, requestsDispatch])

  const handleCancel = useCallback(() => {
    if (!pendingAccountOp || !canReplacePendingAccountOp(pendingAccountOp)) return

    closeBottomSheet()
    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [getReplacementBuildRequest(getSafeCancellationAccountOp(pendingAccountOp))]
      }
    })
  }, [closeBottomSheet, pendingAccountOp, requestsDispatch])

  const sheetHeader = useMemo(
    () => (
      // Centered title on mobile, and a back arrow with the title next to it on web
      <View style={spacings.mbLg}>
        <ModalHeader title={t('Pending transaction')} handleClose={handleClose} style={spacings.mbMi} />
        <Text appearance="secondaryText" fontSize={14} style={isMobile ? text.center : undefined}>
          {t(
            'This transaction was sent earlier and is still waiting to be confirmed. The transaction you are signing now can only go through after it.'
          )}
        </Text>
      </View>
    ),
    [handleClose, t]
  )

  const sheetActions = useMemo(
    () => (
      <View style={spacings.mtLg}>
        {canReplace ? (
          <Text appearance="secondaryText" fontSize={12} style={spacings.mbSm}>
            {t(
              'Speeding it up pays a higher fee so it gets confirmed sooner. Cancelling replaces it with a transaction that does nothing, also for a higher fee. Both need to be signed by the owners again.'
            )}
          </Text>
        ) : (
          <Text appearance="secondaryText" fontSize={12} style={spacings.mbSm}>
            {t("This transaction was sent in a way that can't be sped up or cancelled from here.")}
          </Text>
        )}
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Button
            type="secondary"
            text={t('Back')}
            onPress={handleClose}
            hasBottomSpacing={false}
            style={flexbox.flex1}
          />
          {canReplace && (
            <>
              <Button
                type="danger"
                text={t('Cancel')}
                onPress={handleCancel}
                hasBottomSpacing={false}
                style={[flexbox.flex1, spacings.mlTy]}
              />
              <Button
                type="primary"
                text={t('Speed up')}
                onPress={handleSpeedUp}
                hasBottomSpacing={false}
                style={[flexbox.flex1, spacings.mlTy]}
              />
            </>
          )}
        </View>
      </View>
    ),
    [canReplace, handleCancel, handleClose, handleSpeedUp, t]
  )

  if (!pendingAccountOp) return null

  return (
    <>
      <Alert
        type="info"
        size="sm"
        title={t('Pending transaction detected')}
        text={t(
          'An earlier transaction from this account was sent but is not confirmed yet. This transaction is queued after it, so it can only go through once the earlier one is confirmed.'
        )}
        buttonProps={alertButtonProps}
        style={style}
      />
      <BottomSheet
        id="pending-safe-transaction"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        onOpen={handleSheetOpen}
        onClosed={handleSheetClosed}
        type={isCompactLayout ? 'bottom-sheet' : 'modal'}
        backgroundColor="secondaryBackground"
        HeaderComponent={sheetHeader}
      >
        {shouldRenderCalls ? (
          <Suspense fallback={null}>
            <PendingAccountOpCalls submittedAccountOp={pendingAccountOp} />
          </Suspense>
        ) : null}
        {sheetActions}
      </BottomSheet>
    </>
  )
}

export default React.memo(PendingSafeTransaction)

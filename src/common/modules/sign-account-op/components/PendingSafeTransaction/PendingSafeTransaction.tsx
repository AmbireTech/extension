import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { getAccountOpNonce } from '@ambire-common/libs/accountOp/accountOp'
import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
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
import useTheme from '@common/hooks/useTheme'
import {
  canBuildReplacementAccountOp,
  getReplacementBuildRequest,
  getResendAccountOp,
  getSafeCancellationAccountOp,
  getSpeedUpAccountOp,
  isSentThroughBundler
} from '@common/modules/sign-account-op/helpers/replacementAccountOps'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import PendingAccountOpCalls from './lazyPendingAccountOpCalls'
import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  style?: ViewStyle
}

type ReplacementAction = 'cancel' | 'speedUp'

/**
 * How long the sheet waits for the cancel / speed up request to open before letting the user
 * try again. Opening it normally takes a few seconds at most - if it fails, the reason is
 * shown by the controller.
 */
const REPLACEMENT_REQUEST_TIMEOUT_MS = 15_000

const selectAccountOp = (state: AllControllersMappingType['SignAccountOpController']) =>
  state?.accountOp
const selectIsSafeAccount = (state: AllControllersMappingType['SignAccountOpController']) =>
  !!state?.account.safeCreation
const selectCurrentUserRequestId = (state: AllControllersMappingType['RequestsController']) =>
  state.currentUserRequest?.id
const selectBroadcastedButNotConfirmed = (state: AllControllersMappingType['ActivityController']) =>
  state.broadcastedButNotConfirmed

/**
 * Lets the user know that the Safe transaction being signed is queued after one that was already
 * sent but isn't confirmed yet, and offers to speed up or cancel that pending transaction.
 */
const PendingSafeTransaction = ({ style }: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { isCompactLayout } = useCompactLayout()
  const [shouldRenderCalls, setShouldRenderCalls] = useState(false)
  // The action whose request is being opened and the request that was open when it started.
  // The sheet stays open until another request becomes the current one
  const [replacementInProgress, setReplacementInProgress] = useState<{
    action: ReplacementAction
    fromRequestId: string | number | undefined
  } | null>(null)
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { state: accountOp } = useController('SignAccountOpController', selectAccountOp)
  const { state: isSafeAccount } = useController('SignAccountOpController', selectIsSafeAccount)
  const { state: broadcastedButNotConfirmed } = useController(
    'ActivityController',
    selectBroadcastedButNotConfirmed
  )
  const { state: currentUserRequestId, dispatch: requestsDispatch } = useController(
    'RequestsController',
    selectCurrentUserRequestId
  )

  // The earliest pending transaction is the one holding back every transaction after it
  const pendingAccountOp = useMemo(() => {
    if (!isSafeAccount || !accountOp) return null

    const currentNonce = getAccountOpNonce(accountOp)
    if (currentNonce === null) return null

    return (
      broadcastedButNotConfirmed?.[accountOp.accountAddr] || []
    ).reduce<SubmittedAccountOp | null>((earliest, submittedAccountOp) => {
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

  const handleSheetOpen = useCallback(() => setShouldRenderCalls(true), [])
  const handleSheetClosed = useCallback(() => setShouldRenderCalls(false), [])
  const handleClose = useCallback(() => closeBottomSheet(), [closeBottomSheet])

  useEffect(() => {
    if (!replacementInProgress) return undefined

    if (currentUserRequestId !== replacementInProgress.fromRequestId) {
      closeBottomSheet()
      setReplacementInProgress(null)
      return undefined
    }

    const timeoutId = setTimeout(
      () => setReplacementInProgress(null),
      REPLACEMENT_REQUEST_TIMEOUT_MS
    )
    return () => clearTimeout(timeoutId)
  }, [closeBottomSheet, currentUserRequestId, replacementInProgress])

  const openReplacementRequest = useCallback(
    (action: ReplacementAction, replacementAccountOp: AccountOp) => {
      setReplacementInProgress({ action, fromRequestId: currentUserRequestId })
      requestsDispatch({
        type: 'method',
        params: { method: 'build', args: [getReplacementBuildRequest(replacementAccountOp)] }
      })
    },
    [currentUserRequestId, requestsDispatch]
  )

  const alertButtonProps = useMemo(
    () => ({ text: t('View pending transaction'), onPress: () => openBottomSheet() }),
    [openBottomSheet, t]
  )

  const handleSpeedUp = useCallback(() => {
    if (!pendingAccountOp) return

    // A transaction sent through a bundler can't be replaced, so it's simply sent again
    let speedUpAccountOp = null
    if (isSentThroughBundler(pendingAccountOp)) {
      speedUpAccountOp = getResendAccountOp(pendingAccountOp)
    } else if (canBuildReplacementAccountOp(pendingAccountOp)) {
      speedUpAccountOp = getSpeedUpAccountOp(pendingAccountOp)
    }
    if (!speedUpAccountOp) return

    openReplacementRequest('speedUp', speedUpAccountOp)
  }, [openReplacementRequest, pendingAccountOp])

  const handleCancel = useCallback(() => {
    if (!pendingAccountOp || !canBuildReplacementAccountOp(pendingAccountOp)) return

    openReplacementRequest('cancel', getSafeCancellationAccountOp(pendingAccountOp))
  }, [openReplacementRequest, pendingAccountOp])

  const sheetHeader = useMemo(
    () => (
      // Centered title on mobile, and a back arrow with the title next to it on web
      <View style={spacings.mbLg}>
        <ModalHeader
          title={t('Pending transaction')}
          handleClose={handleClose}
          style={spacings.mbMi}
        />
        <Text appearance="secondaryText" fontSize={14} style={isMobile ? text.center : undefined}>
          {t(
            'This transaction was sent earlier and is still waiting to be confirmed. The transaction you are signing now can only go through after it.'
          )}
        </Text>
        <Text appearance="secondaryText" fontSize={14} style={spacings.mtSm}>
          {t(
            'Speeding it up pays a higher fee so it gets confirmed sooner. Cancelling replaces it with a transaction that does nothing, also for a higher fee. Both need to be signed by the owners again.'
          )}
        </Text>
      </View>
    ),
    [handleClose, t]
  )

  const sheetContent = useMemo(() => {
    if (!pendingAccountOp) return null

    return (
      <>
        {/* The actions live in the transaction's card, so it's clear they act on it */}
        <View style={styles.transactionCard}>
          {shouldRenderCalls ? (
            <Suspense fallback={null}>
              <PendingAccountOpCalls
                submittedAccountOp={pendingAccountOp}
                itemStyle={styles.transactionCardCall}
              />
            </Suspense>
          ) : null}
          <View style={styles.transactionCardDivider} />
          <View style={styles.transactionCardActions}>
            <Button
              type="danger"
              size="small"
              text={replacementInProgress?.action === 'cancel' ? t('Canceling...') : t('Cancel')}
              onPress={handleCancel}
              disabled={!!replacementInProgress}
              hasBottomSpacing={false}
              style={flexbox.flex1}
            />
            <Button
              type="primary"
              size="small"
              text={
                replacementInProgress?.action === 'speedUp' ? t('Speeding up...') : t('Speed up')
              }
              onPress={handleSpeedUp}
              disabled={!!replacementInProgress}
              hasBottomSpacing={false}
              style={[flexbox.flex1, spacings.mlTy]}
            />
          </View>
        </View>
      </>
    )
  }, [
    handleCancel,
    handleSpeedUp,
    pendingAccountOp,
    replacementInProgress,
    shouldRenderCalls,
    styles,
    t
  ])

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
        {sheetContent}
      </BottomSheet>
    </>
  )
}

export default React.memo(PendingSafeTransaction)

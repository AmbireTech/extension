import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import {
  getReplacementAccountOp,
  getReplacementBlocker,
  Replacement
} from '@ambire-common/libs/accountOp/replacement'
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
import { REPLACEMENT_BLOCKER_MESSAGES } from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/constants'
import { getEarliestPendingAccountOp } from '@common/modules/sign-account-op/helpers/pendingAccountOp'
import {
  getReplacementBuildRequest,
  getResendAccountOp,
  getSafeCancellationAccountOp
} from '@common/modules/sign-account-op/helpers/replacementAccountOps'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import PendingAccountOpCalls from './lazyPendingAccountOpCalls'
import getStyles from './styles'

import type { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  style?: ViewStyle
}

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
const selectAccountStates = (state: AllControllersMappingType['AccountsController']) =>
  state.accountStates
const selectCurrentUserRequestId = (state: AllControllersMappingType['RequestsController']) =>
  state.currentUserRequest?.id
const selectBroadcastedButNotConfirmed = (state: AllControllersMappingType['ActivityController']) =>
  state.broadcastedButNotConfirmed

/**
 * Lets the user know that the transaction being signed is queued after one that was already
 * sent but isn't confirmed yet, and offers to speed up or cancel that pending transaction.
 * Shown for every account type: a Safe, an EOA, a 7702 EOA and an Ambire smart account.
 */
const PendingTransaction = ({ style }: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { isCompactLayout } = useCompactLayout()
  const [shouldRenderCalls, setShouldRenderCalls] = useState(false)
  // The action whose request is being opened and the request that was open when it started.
  // The sheet stays open until another request becomes the current one
  const [replacementInProgress, setReplacementInProgress] = useState<{
    action: Replacement
    fromRequestId: string | number | undefined
  } | null>(null)
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { state: accountOp } = useController('SignAccountOpController', selectAccountOp)
  const { state: isSafeAccount } = useController('SignAccountOpController', selectIsSafeAccount)
  const { state: accountStates } = useController('AccountsController', selectAccountStates)
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
    if (!accountOp) return null

    return getEarliestPendingAccountOp({
      accountOp,
      isSafeAccount,
      accountStateNonce:
        accountStates[accountOp.accountAddr]?.[accountOp.chainId.toString()]?.nonce,
      pendingAccountOps: broadcastedButNotConfirmed?.[accountOp.accountAddr] || []
    })
  }, [accountOp, accountStates, broadcastedButNotConfirmed, isSafeAccount])

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
    (action: Replacement, replacementAccountOp: AccountOp) => {
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

  // Replaced in the mempool the same way as from the activity, when the way it was sent allows
  // it. The pending transaction is always the account's own, as it's the one being signed
  const replacementBlocker = useMemo(
    () => (pendingAccountOp ? getReplacementBlocker(pendingAccountOp, true) : null),
    [pendingAccountOp]
  )
  const canReplaceInMempool = !!pendingAccountOp && replacementBlocker === null
  // A Safe transaction that can't be replaced in the mempool is still resent or cancelled with
  // a new Safe transaction at its nonce. Any other account has no such way around it
  const isReplacementDisabled = !isSafeAccount && !canReplaceInMempool

  const handleSpeedUp = useCallback(() => {
    if (!pendingAccountOp || isReplacementDisabled) return

    // Otherwise (e.g. sent through a bundler) it can't be replaced, so it's simply sent again
    const speedUpAccountOp = canReplaceInMempool
      ? getReplacementAccountOp(pendingAccountOp, 'speedUp')
      : getResendAccountOp(pendingAccountOp)
    if (!speedUpAccountOp) return

    openReplacementRequest('speedUp', speedUpAccountOp)
  }, [canReplaceInMempool, isReplacementDisabled, openReplacementRequest, pendingAccountOp])

  const handleCancel = useCallback(() => {
    if (!pendingAccountOp || isReplacementDisabled) return

    // Otherwise the owners sign a new Safe transaction that takes its place, sent any way
    const cancelAccountOp = canReplaceInMempool
      ? getReplacementAccountOp(pendingAccountOp, 'cancel')
      : getSafeCancellationAccountOp(pendingAccountOp)
    if (!cancelAccountOp) return

    openReplacementRequest('cancel', cancelAccountOp)
  }, [canReplaceInMempool, isReplacementDisabled, openReplacementRequest, pendingAccountOp])

  const replacementDescription = useMemo(() => {
    if (isSafeAccount)
      return t(
        'Speeding it up sends the same transaction again so it gets confirmed sooner, without new signatures from the owners. Cancelling replaces it with a transaction that does nothing, which the owners need to sign.'
      )
    if (replacementBlocker) return t(REPLACEMENT_BLOCKER_MESSAGES[replacementBlocker])

    return t(
      'Speeding it up sends it again with a higher fee so it gets confirmed sooner. Cancelling replaces it with a transaction that does nothing, so it never goes through.'
    )
  }, [isSafeAccount, replacementBlocker, t])

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
          {replacementDescription}
        </Text>
      </View>
    ),
    [handleClose, replacementDescription, t]
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
              disabled={!!replacementInProgress || isReplacementDisabled}
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
              disabled={!!replacementInProgress || isReplacementDisabled}
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
    isReplacementDisabled,
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
        id="pending-transaction"
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

export default React.memo(PendingTransaction)

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import { findPendingAccountOpById } from '@ambire-common/libs/accountOp/earlierPendingAccountOp'
import {
  getReplacementAccountOp,
  getReplacementBlocker,
  Replacement
} from '@ambire-common/libs/accountOp/replacement'
import isSameAddr from '@ambire-common/utils/isSameAddr'
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
  /**
   * The transaction being signed, when it isn't the one of the sign screen (e.g. a one-click
   * transfer or swap, which have their own). Null while it's not ready yet
   */
  signAccountOpState?: ISignAccountOpController | null
  /** Replaces the earlier transaction with this one, when it's not the one of the sign screen */
  onReplace?: () => void
  /** Goes back to waiting for the earlier transaction, when it's not the one of the sign screen */
  onStopReplacing?: () => void
}

/**
 * How long the sheet waits for the cancel / speed up request to open before letting the user
 * try again. Opening it normally takes a few seconds at most - if it fails, the reason is
 * shown by the controller.
 */
const REPLACEMENT_REQUEST_TIMEOUT_MS = 15_000

const selectEarlierPendingAccountOpId = (
  state: AllControllersMappingType['SignAccountOpController']
) => state?.earlierPendingAccountOp?.id
const selectCanReplacePendingAccountOp = (
  state: AllControllersMappingType['SignAccountOpController']
) => !!state?.earlierPendingAccountOp?.canReplace
const selectIsReplacingPendingAccountOp = (
  state: AllControllersMappingType['SignAccountOpController']
) => !!state?.earlierPendingAccountOp?.isReplacing
// The store holds an empty object for a controller that isn't there (e.g. no sign screen is
// open on a one-click transfer or swap), so every nested field is read optionally
const selectIsSafeAccount = (state: AllControllersMappingType['SignAccountOpController']) =>
  !!state?.account?.safeCreation
const selectCurrentUserRequestId = (state: AllControllersMappingType['RequestsController']) =>
  state.currentUserRequest?.id
const selectSelectedAccountAddr = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account?.addr
const selectBroadcastedButNotConfirmed = (state: AllControllersMappingType['ActivityController']) =>
  state.broadcastedButNotConfirmed

/**
 * Lets the user know that the transaction being signed waits for one that was already sent but
 * isn't confirmed yet, and offers to replace, speed up or cancel that pending transaction.
 * Shown for every account type: a Safe, an EOA, a 7702 EOA and an Ambire smart account.
 */
const EarlierPendingTransaction = ({
  style,
  signAccountOpState,
  onReplace,
  onStopReplacing
}: Props) => {
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
  const { state: signScreenEarlierPendingAccountOpId, dispatch: signAccountOpDispatch } =
    useController('SignAccountOpController', selectEarlierPendingAccountOpId)
  const { state: signScreenCanReplace } = useController(
    'SignAccountOpController',
    selectCanReplacePendingAccountOp
  )
  const { state: signScreenIsReplacing } = useController(
    'SignAccountOpController',
    selectIsReplacingPendingAccountOp
  )
  const { state: isSignScreenSafeAccount } = useController(
    'SignAccountOpController',
    selectIsSafeAccount
  )
  // Never falls back to the sign screen's transaction once one is passed, even while it's null
  const hasOwnSignAccountOp = signAccountOpState !== undefined
  const earlierPendingAccountOpId = hasOwnSignAccountOp
    ? signAccountOpState?.earlierPendingAccountOp?.id
    : signScreenEarlierPendingAccountOpId
  const canReplacePendingAccountOp = hasOwnSignAccountOp
    ? !!signAccountOpState?.earlierPendingAccountOp?.canReplace
    : signScreenCanReplace
  const isReplacingPendingAccountOp = hasOwnSignAccountOp
    ? !!signAccountOpState?.earlierPendingAccountOp?.isReplacing
    : signScreenIsReplacing
  const isSafeAccount = hasOwnSignAccountOp
    ? !!signAccountOpState?.account?.safeCreation
    : isSignScreenSafeAccount
  const { state: selectedAccountAddr } = useController(
    'SelectedAccountController',
    selectSelectedAccountAddr
  )
  const { state: broadcastedButNotConfirmed } = useController(
    'ActivityController',
    selectBroadcastedButNotConfirmed
  )
  const { state: currentUserRequestId, dispatch: requestsDispatch } = useController(
    'RequestsController',
    selectCurrentUserRequestId
  )

  const pendingAccountOp = useMemo(
    () => findPendingAccountOpById(broadcastedButNotConfirmed, earlierPendingAccountOpId),
    [broadcastedButNotConfirmed, earlierPendingAccountOpId]
  )

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

  // The pending transaction may be of another account, when the account that's signing only
  // pays its fee. Its speed up or cancel is a request for that account, so it can't be opened
  // from here
  const isOwnPendingAccountOp =
    !!pendingAccountOp &&
    !!selectedAccountAddr &&
    isSameAddr(pendingAccountOp.accountAddr, selectedAccountAddr)
  // Replaced in the mempool the same way as from the activity, when the way it was sent allows it
  const replacementBlocker = useMemo(
    () =>
      pendingAccountOp ? getReplacementBlocker(pendingAccountOp, isOwnPendingAccountOp) : null,
    [isOwnPendingAccountOp, pendingAccountOp]
  )
  const canReplaceInMempool = !!pendingAccountOp && replacementBlocker === null
  // A Safe transaction that can't be replaced in the mempool is still resent or cancelled with
  // a new Safe transaction at its nonce. Any other account has no such way around it, and no
  // account can do it for the transaction of another one
  const isReplacementDisabled = !isOwnPendingAccountOp || (!isSafeAccount && !canReplaceInMempool)

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

  const handleReplace = useCallback(() => {
    if (!canReplacePendingAccountOp) return

    if (hasOwnSignAccountOp) {
      onReplace?.()
    } else {
      signAccountOpDispatch({
        type: 'method',
        params: { method: 'replacePendingAccountOp', args: [] }
      })
    }
    closeBottomSheet()
  }, [
    canReplacePendingAccountOp,
    closeBottomSheet,
    hasOwnSignAccountOp,
    onReplace,
    signAccountOpDispatch
  ])

  const handleStopReplacing = useCallback(() => {
    if (hasOwnSignAccountOp) {
      onStopReplacing?.()
    } else {
      signAccountOpDispatch({
        type: 'method',
        params: { method: 'stopReplacingPendingAccountOp', args: [] }
      })
    }
    closeBottomSheet()
  }, [closeBottomSheet, hasOwnSignAccountOp, onStopReplacing, signAccountOpDispatch])

  const alertText = useMemo(() => {
    if (isReplacingPendingAccountOp)
      return t(
        'This transaction will replace the earlier one, so the earlier one will not go through. The fee is higher, as the network requires it to replace a transaction.'
      )

    const pendingSentence = isOwnPendingAccountOp
      ? t('A transaction you sent earlier is not confirmed yet.')
      : t('A transaction you sent earlier from another of your accounts is not confirmed yet.')
    const waitSentence = isSafeAccount
      ? t('This one will be signed now and can be executed after the earlier one is confirmed.')
      : t('You can send this one after it is confirmed.')
    if (isReplacementDisabled && !canReplacePendingAccountOp)
      return `${pendingSentence} ${waitSentence}`

    if (isReplacementDisabled)
      return `${pendingSentence} ${waitSentence} ${t('You can also replace the earlier one.')}`

    const actionsSentence = canReplacePendingAccountOp
      ? t('You can also replace, speed up or cancel the earlier one.')
      : t('You can also speed up or cancel the earlier one.')
    return `${pendingSentence} ${waitSentence} ${actionsSentence}`
  }, [
    canReplacePendingAccountOp,
    isOwnPendingAccountOp,
    isReplacementDisabled,
    isReplacingPendingAccountOp,
    isSafeAccount,
    t
  ])

  const replacementDescription = useMemo(() => {
    if (replacementBlocker === 'otherAccount') return t(REPLACEMENT_BLOCKER_MESSAGES.otherAccount)
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
          {isReplacingPendingAccountOp && (
            <Button
              type="secondary"
              size="small"
              text={t('Keep the earlier transaction')}
              onPress={handleStopReplacing}
              disabled={!!replacementInProgress}
              hasBottomSpacing={false}
              style={spacings.mtTy}
            />
          )}
          {canReplacePendingAccountOp && !isReplacingPendingAccountOp && (
            <Button
              type="secondary"
              size="small"
              text={t('Replace with this transaction')}
              onPress={handleReplace}
              disabled={!!replacementInProgress}
              hasBottomSpacing={false}
              style={spacings.mtTy}
            />
          )}
        </View>
      </>
    )
  }, [
    canReplacePendingAccountOp,
    handleReplace,
    handleStopReplacing,
    isReplacingPendingAccountOp,
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
        text={alertText}
        buttonProps={alertButtonProps}
        style={style}
      />
      <BottomSheet
        id="earlier-pending-transaction"
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

export default React.memo(EarlierPendingTransaction)

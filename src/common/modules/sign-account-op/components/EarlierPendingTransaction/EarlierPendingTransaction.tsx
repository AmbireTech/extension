import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { ISignAccountOpController, SigningStatus } from '@ambire-common/interfaces/signAccountOp'
import { findPendingAccountOpById } from '@ambire-common/libs/accountOp/earlierPendingAccountOp'
import {
  getReplacementAccountOp,
  getReplacementBlocker,
  Replacement
} from '@ambire-common/libs/accountOp/replacement'
import isSameAddr from '@ambire-common/utils/isSameAddr'
import OpenIcon from '@common/assets/svg/OpenIcon'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import HumanizerAddress from '@common/components/HumanizerAddress'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { REPLACEMENT_BLOCKER_MESSAGES } from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/constants'
import FooterActionLink from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/FooterActionLink'
import {
  getReplacementBuildRequest,
  getResendAccountOp,
  getSafeCancellationAccountOp
} from '@common/modules/sign-account-op/helpers/replacementAccountOps'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { openInTab } from '@common/utils/links'

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
  /**
   * Called once a speed up or cancel request is opened, when the transaction being signed isn't
   * the one of the sign screen, so it doesn't stay proceeded while the user does something else
   */
  onReplacementRequestOpen?: () => void
}

/**
 * How long the sheet waits for the cancel / speed up request to open before letting the user
 * try again. Opening it normally takes a few seconds at most - if it fails, the reason is
 * shown by the controller.
 */
const REPLACEMENT_REQUEST_TIMEOUT_MS = 15_000
/**
 * How long after a speed up or cancel is sent the user is asked to wait for it, with no actions.
 * After that the usual actions come back, e.g. to speed it up again if it's stuck
 */
const JUST_SENT_REPLACEMENT_MAX_AGE_MS = 60_000

const selectEarlierPendingAccountOpId = (
  state: AllControllersMappingType['SignAccountOpController']
) => state?.earlierPendingAccountOp?.id
const selectCanReplacePendingAccountOp = (
  state: AllControllersMappingType['SignAccountOpController']
) => !!state?.earlierPendingAccountOp?.canReplace
const selectIsReplacingPendingAccountOp = (
  state: AllControllersMappingType['SignAccountOpController']
) => !!state?.earlierPendingAccountOp?.isReplacing
const selectIsReplacedPendingAccountOpProcessed = (
  state: AllControllersMappingType['SignAccountOpController']
) => !!state?.isReplacedPendingAccountOpProcessed
// The store holds an empty object for a controller that isn't there (e.g. no sign screen is
// open on a one-click transfer or swap), so every nested field is read optionally
const selectIsSafeAccount = (state: AllControllersMappingType['SignAccountOpController']) =>
  !!state?.account?.safeCreation
// Tells a sign screen that is still being used from one that is gone or already sent
const selectIsSignAccountOpActive = (state: AllControllersMappingType['SignAccountOpController']) =>
  !!state?.accountOp && state.status?.type !== SigningStatus.Done
const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectCurrentUserRequestId = (state: AllControllersMappingType['RequestsController']) =>
  state.currentUserRequest?.id
const selectSelectedAccountAddr = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account?.addr
const selectBroadcastedButNotConfirmed = (state: AllControllersMappingType['ActivityController']) =>
  state.broadcastedButNotConfirmed
const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

/**
 * Lets the user know that the transaction being signed waits for one that was already sent but
 * isn't confirmed yet, and offers to replace, speed up or cancel that pending transaction.
 * Shown for every account type: a Safe, an EOA, a 7702 EOA and an Ambire smart account.
 */
const EarlierPendingTransaction = ({
  style,
  signAccountOpState,
  onReplace,
  onStopReplacing,
  onReplacementRequestOpen
}: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { isCompactLayout } = useCompactLayout()
  const { addToast } = useToast()
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
  const { state: signScreenIsReplacedProcessed } = useController(
    'SignAccountOpController',
    selectIsReplacedPendingAccountOpProcessed
  )
  const { state: isSignScreenSafeAccount } = useController(
    'SignAccountOpController',
    selectIsSafeAccount
  )
  const { state: isSignScreenActive } = useController(
    'SignAccountOpController',
    selectIsSignAccountOpActive
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
  const isReplacedPendingAccountOpProcessed = hasOwnSignAccountOp
    ? !!signAccountOpState?.isReplacedPendingAccountOpProcessed
    : signScreenIsReplacedProcessed
  const isSafeAccount = hasOwnSignAccountOp
    ? !!signAccountOpState?.account?.safeCreation
    : isSignScreenSafeAccount
  const isSignAccountOpActive = hasOwnSignAccountOp
    ? !!signAccountOpState && signAccountOpState.status?.type !== SigningStatus.Done
    : isSignScreenActive
  const { state: selectedAccountAddr } = useController(
    'SelectedAccountController',
    selectSelectedAccountAddr
  )
  const { state: broadcastedButNotConfirmed } = useController(
    'ActivityController',
    selectBroadcastedButNotConfirmed
  )
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: currentUserRequestId, dispatch: requestsDispatch } = useController(
    'RequestsController',
    selectCurrentUserRequestId
  )

  const pendingAccountOp = useMemo(
    () => findPendingAccountOpById(broadcastedButNotConfirmed, earlierPendingAccountOpId),
    [broadcastedButNotConfirmed, earlierPendingAccountOpId]
  )
  // Right after a speed up or a cancel is sent, this transaction waits for it instead, so the
  // user is asked to wait rather than shown the same actions again
  const isReplacementOp = !!pendingAccountOp?.meta?.speedUp || !!pendingAccountOp?.meta?.isResend
  const waitForReplacementUntil = isReplacementOp
    ? pendingAccountOp.timestamp + JUST_SENT_REPLACEMENT_MAX_AGE_MS
    : null
  // Only moved forward when the wait ends, so the banner switches back to the usual one
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (waitForReplacementUntil === null) return undefined

    const timeoutId = setTimeout(
      // A timer may fire a little early, which would keep the wait on for good
      () => setNow(Math.max(Date.now(), waitForReplacementUntil)),
      Math.max(waitForReplacementUntil - Date.now(), 0)
    )
    return () => clearTimeout(timeoutId)
  }, [waitForReplacementUntil])

  const isWaitingForReplacement = waitForReplacementUntil !== null && now < waitForReplacementUntil
  const isPendingCancel = !!pendingAccountOp?.meta?.speedUp?.isCancel

  // Only a processed pending transaction takes the place the replacement was going to use. Going
  // back to waiting (Don't replace) keeps it pending, the replacement may also stop for another
  // reason (e.g. a changed fee payer) while it's still pending, and a closed or sent screen has
  // no more transaction to tell about
  const wasReplacingPendingAccountOp = usePrevious<boolean>(isReplacingPendingAccountOp)
  useEffect(() => {
    if (
      !wasReplacingPendingAccountOp ||
      !isReplacedPendingAccountOpProcessed ||
      isReplacingPendingAccountOp ||
      earlierPendingAccountOpId ||
      !isSignAccountOpActive
    )
      return

    addToast(t('Your pending transaction was confirmed. This one is now a new transaction.'), {
      type: 'info'
    })
  }, [
    addToast,
    earlierPendingAccountOpId,
    isReplacedPendingAccountOpProcessed,
    isReplacingPendingAccountOp,
    isSignAccountOpActive,
    t,
    wasReplacingPendingAccountOp
  ])

  const handleSheetOpen = useCallback(() => setShouldRenderCalls(true), [])
  const handleSheetClosed = useCallback(() => {
    setShouldRenderCalls(false)
    setReplacementInProgress(null)
  }, [])
  const handleClose = useCallback(() => closeBottomSheet(), [closeBottomSheet])

  // Closing the sheet clears it, see `handleSheetClosed`
  const hasReplacementRequestOpened =
    !!replacementInProgress && currentUserRequestId !== replacementInProgress.fromRequestId

  useEffect(() => {
    if (!replacementInProgress) return undefined

    if (hasReplacementRequestOpened) {
      closeBottomSheet()
      return undefined
    }

    const timeoutId = setTimeout(
      () => setReplacementInProgress(null),
      REPLACEMENT_REQUEST_TIMEOUT_MS
    )
    return () => clearTimeout(timeoutId)
  }, [closeBottomSheet, hasReplacementRequestOpened, replacementInProgress])

  // The pending transaction may be of another account, when the account that's signing only
  // pays its fee. Its speed up or cancel is a request for that account, so the user is asked to
  // switch to it first
  const isOwnPendingAccountOp =
    !!pendingAccountOp &&
    !!selectedAccountAddr &&
    isSameAddr(pendingAccountOp.accountAddr, selectedAccountAddr)
  const isPendingAccountSafe = useMemo(
    () =>
      !!pendingAccountOp &&
      accounts.some(
        (account) =>
          !!account.safeCreation && isSameAddr(account.addr, pendingAccountOp.accountAddr)
      ),
    [accounts, pendingAccountOp]
  )
  // Replaced in the mempool the same way as from the activity, when the way it was sent allows it
  const replacementBlocker = useMemo(
    () => (pendingAccountOp ? getReplacementBlocker(pendingAccountOp, true) : null),
    [pendingAccountOp]
  )
  const canReplaceInMempool = !!pendingAccountOp && replacementBlocker === null
  // A Safe transaction that can't be replaced in the mempool is still resent or cancelled with
  // a new Safe transaction at its nonce. Any other account has no such way around it
  const isReplacementDisabled = !isPendingAccountSafe && !canReplaceInMempool

  const openReplacementRequest = useCallback(
    (action: Replacement, replacementAccountOp: AccountOp) => {
      setReplacementInProgress({ action, fromRequestId: currentUserRequestId })
      requestsDispatch({
        type: 'method',
        params: {
          method: 'build',
          args: [getReplacementBuildRequest(replacementAccountOp, !isOwnPendingAccountOp)]
        }
      })
      onReplacementRequestOpen?.()
    },
    [currentUserRequestId, isOwnPendingAccountOp, onReplacementRequestOpen, requestsDispatch]
  )

  // Null while the transaction has no hash yet, e.g. one sent through a bundler or the relayer
  const explorerTxnUrl = useMemo(() => {
    const explorerUrl = networks?.find(
      ({ chainId }) => chainId === pendingAccountOp?.chainId
    )?.explorerUrl
    if (!explorerUrl || !pendingAccountOp?.txnId) return null

    return `${explorerUrl.replace(/\/$/, '')}/tx/${pendingAccountOp.txnId}`
  }, [networks, pendingAccountOp])

  const handleOpenExplorer = useCallback(async () => {
    if (!explorerTxnUrl) return

    try {
      await openInTab({ url: explorerTxnUrl })
    } catch (e: any) {
      addToast(e?.message || t('Could not open the transaction details.'), { type: 'error' })
    }
  }, [addToast, explorerTxnUrl, t])

  const alertButtonProps = useMemo(
    () => ({ text: t('View pending'), onPress: () => openBottomSheet() }),
    [openBottomSheet, t]
  )

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

  const alertTitle = useMemo(() => {
    if (!isWaitingForReplacement) {
      if (isReplacingPendingAccountOp) return t('Replacing your pending transaction')

      return isOwnPendingAccountOp
        ? t('Pending transaction detected')
        : t('Pending transaction detected (of the fee payer)')
    }

    return isPendingCancel
      ? t('Canceling your earlier transaction')
      : t('Speeding up your earlier transaction')
  }, [
    isOwnPendingAccountOp,
    isPendingCancel,
    isReplacingPendingAccountOp,
    isWaitingForReplacement,
    t
  ])

  const alertText = useMemo(() => {
    if (isWaitingForReplacement)
      return t(
        'Please wait. You can send this transaction after that is done. This usually takes less than a minute.'
      )

    if (isReplacingPendingAccountOp) return t('Your pending transaction will not go through.')

    const pendingSentence = isOwnPendingAccountOp
      ? t('A transaction you sent earlier is not confirmed yet.')
      : t('A transaction you sent earlier from another of your accounts is not confirmed yet.')
    const waitSentence = isSafeAccount
      ? t('This one will be signed now and can be executed after the earlier one is confirmed.')
      : t('You can send this one after it is confirmed.')
    if (isReplacementDisabled) return `${pendingSentence} ${waitSentence}`

    return `${pendingSentence} ${waitSentence}`
  }, [
    isOwnPendingAccountOp,
    isReplacementDisabled,
    isReplacingPendingAccountOp,
    isSafeAccount,
    isWaitingForReplacement,
    t
  ])

  const replacementDescription = useMemo(() => {
    if (!isPendingAccountSafe && replacementBlocker)
      return t(REPLACEMENT_BLOCKER_MESSAGES[replacementBlocker])

    const actionsSentence = isPendingAccountSafe
      ? t(
          'Speeding it up sends the same transaction again so it gets confirmed sooner, without new signatures from the owners. Cancelling replaces it with a transaction that does nothing, which the owners need to sign.'
        )
      : t(
          'Speeding it up sends it again with a higher fee so it gets confirmed sooner. Cancelling replaces it with a transaction that does nothing, so it never goes through.'
        )
    if (isOwnPendingAccountOp) return actionsSentence

    return `${actionsSentence} ${t('You will be asked to switch to the account that sent it first.')}`
  }, [isOwnPendingAccountOp, isPendingAccountSafe, replacementBlocker, t])

  const sheetHeader = useMemo(
    () => (
      // Centered title on mobile, and a back arrow with the title next to it on web
      <View style={spacings.mbLg}>
        <ModalHeader
          title={t('Pending transaction')}
          handleClose={handleClose}
          style={spacings.mbSm}
        >
          {explorerTxnUrl ? (
            <FooterActionLink
              label={t('View in explorer')}
              onPress={handleOpenExplorer}
              textSize={12}
              iconSize={14}
              Icon={OpenIcon}
            />
          ) : null}
        </ModalHeader>
        <Text appearance="secondaryText" fontSize={14} style={isMobile ? text.center : undefined}>
          {t(
            'Sent earlier and not confirmed yet. The transaction you are signing now can only go through after it.'
          )}
        </Text>
      </View>
    ),
    [explorerTxnUrl, handleClose, handleOpenExplorer, t]
  )

  const sheetContent = useMemo(() => {
    if (!pendingAccountOp) return null

    return (
      <>
        {/* The actions live in the transaction's card, so it's clear they act on it */}
        <View style={styles.transactionCard}>
          {!isOwnPendingAccountOp && (
            <View style={styles.transactionCardSender}>
              <Text appearance="secondaryText" fontSize={12} style={spacings.mrMi}>
                {t('Sent from')}
              </Text>
              <HumanizerAddress
                address={pendingAccountOp.accountAddr}
                chainId={pendingAccountOp.chainId}
                fontSize={12}
                numberOfLines={1}
                hideActions
              />
            </View>
          )}
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
            <View style={styles.transactionCardActionsRow}>
              <View style={flexbox.flex1}>
                <Button
                  type="danger"
                  size="small"
                  text={
                    replacementInProgress?.action === 'cancel' ? t('Canceling...') : t('Cancel')
                  }
                  onPress={handleCancel}
                  disabled={!!replacementInProgress || isReplacementDisabled}
                  hasBottomSpacing={false}
                />
              </View>
              <View style={[flexbox.flex1, spacings.mlTy]}>
                <Button
                  type="primary"
                  size="small"
                  text={
                    replacementInProgress?.action === 'speedUp'
                      ? t('Speeding up...')
                      : t('Speed up')
                  }
                  onPress={handleSpeedUp}
                  disabled={!!replacementInProgress || isReplacementDisabled}
                  hasBottomSpacing={false}
                />
              </View>
            </View>
          </View>
        </View>
        <Text appearance="secondaryText" fontSize={12} style={spacings.mtSm}>
          {replacementDescription}
        </Text>
      </>
    )
  }, [
    handleCancel,
    handleSpeedUp,
    isOwnPendingAccountOp,
    replacementDescription,
    isReplacementDisabled,
    pendingAccountOp,
    replacementInProgress,
    shouldRenderCalls,
    styles,
    t
  ])

  const alertSecondaryButtonProps = useMemo(() => {
    if (isWaitingForReplacement) return undefined

    if (isReplacingPendingAccountOp)
      return {
        text: t("Don't replace"),
        onPress: handleStopReplacing,
        disabled: !!replacementInProgress
      }
    if (!canReplacePendingAccountOp) return undefined

    return {
      text: t('Replace pending'),
      onPress: handleReplace,
      disabled: !!replacementInProgress
    }
  }, [
    canReplacePendingAccountOp,
    handleReplace,
    handleStopReplacing,
    isReplacingPendingAccountOp,
    isWaitingForReplacement,
    replacementInProgress,
    t
  ])

  if (!pendingAccountOp) return null

  return (
    <>
      <Alert
        type="info"
        size="sm"
        title={alertTitle}
        text={alertText}
        buttonProps={isWaitingForReplacement ? undefined : alertButtonProps}
        secondaryButtonProps={alertSecondaryButtonProps}
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
